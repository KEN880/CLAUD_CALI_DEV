from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from database import get_db
from models import Certificate, Product, Client
from schemas import CertificateCreate, CertificateOut
from services.pricing import calculate_price
from services.doc_generator import generate_docx, generate_pdf
from services.tnved_resolver import resolve_tnved
from services.pricing import determine_doc_type
from io import BytesIO

router = APIRouter(prefix="/api/certificates", tags=["certificates"])


def _product_to_dict(p: Product) -> dict:
    main_material = ""
    for c in p.compositions:
        if c.percentage > 50:
            main_material = c.material_name
            break
    if not main_material and p.compositions:
        main_material = max(p.compositions, key=lambda c: c.percentage).material_name

    gender = "male" if p.target_group == "adult_male" else "female"
    tnved = resolve_tnved(p.material_type, p.product_type, gender, main_material)

    return {
        "article": p.article,
        "name": p.name,
        "product_type": p.product_type,
        "compositions": [{"material_name": c.material_name, "percentage": c.percentage} for c in p.compositions],
        "tnved_code": tnved["code"],
    }


@router.get("/", response_model=list[CertificateOut])
def list_certificates(db: Session = Depends(get_db)):
    return db.query(Certificate).all()


@router.post("/", response_model=CertificateOut)
def create_certificate(data: CertificateCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(404, "Клиент не найден")

    # Validate RF restrictions
    if client.country_type == "RF" and data.doc_type == "DC":
        raise HTTPException(400, "Декларация о соответствии недоступна для заявителей из РФ")

    pricing = calculate_price(client.country_type, data.doc_type, data.protocol_count, data.duration_years)
    if not pricing["available"]:
        raise HTTPException(400, pricing["message"])

    cert = Certificate(
        client_id=data.client_id,
        doc_type=data.doc_type,
        tr_ts=data.tr_ts,
        duration_years=pricing["duration_years"],
        protocol_count=data.protocol_count,
        total_price=pricing["total_price"],
        status="draft",
    )
    db.add(cert)
    db.flush()

    if data.product_ids:
        products = db.query(Product).filter(Product.id.in_(data.product_ids)).all()
        cert.products = products

    db.commit()
    db.refresh(cert)
    return cert


@router.get("/{cert_id}/download/{fmt}")
def download_certificate(cert_id: int, fmt: str, db: Session = Depends(get_db)):
    cert = db.query(Certificate).filter(Certificate.id == cert_id).first()
    if not cert:
        raise HTTPException(404, "Сертификат не найден")

    client = db.query(Client).filter(Client.id == cert.client_id).first()
    client_dict = {
        "fio": client.fio,
        "inn": client.inn,
        "okpo": client.okpo,
        "legal_address": client.legal_address,
        "workshop_address": client.workshop_address,
        "phone": client.phone,
        "email": client.email,
    }

    cert_dict = {
        "doc_type": cert.doc_type,
        "tr_ts": cert.tr_ts,
        "duration_years": cert.duration_years,
        "protocol_count": cert.protocol_count,
        "total_price": cert.total_price,
    }

    products_dicts = [_product_to_dict(p) for p in cert.products]

    if fmt == "docx":
        content = generate_docx(cert_dict, client_dict, products_dicts)
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ext = "docx"
    elif fmt == "pdf":
        content = generate_pdf(cert_dict, client_dict, products_dicts)
        media_type = "application/pdf"
        ext = "pdf"
    else:
        raise HTTPException(400, "Формат должен быть docx или pdf")

    doc_name = "certificate" if cert.doc_type == "CC" else "declaration"
    filename = f"{doc_name}_{cert.id}.{ext}"

    return StreamingResponse(
        BytesIO(content),
        media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={filename}"},
    )
