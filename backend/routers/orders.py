from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session, joinedload
from database import get_db
from models import Order, Product, Client, Manufacturer
from schemas import OrderCreate, OrderUpdate, OrderOut
from services.pricing import calculate_price
from services.doc_generator import generate_docx, generate_pdf
from services.tnved_resolver import resolve_tnved
from io import BytesIO

router = APIRouter(prefix="/api/orders", tags=["orders"])


def _enrich_order(order: Order) -> dict:
    """Convert order to dict with nested relations."""
    d = {
        "id": order.id,
        "client_id": order.client_id,
        "manufacturer_id": order.manufacturer_id,
        "doc_type": order.doc_type,
        "tr_ts": order.tr_ts,
        "duration_years": order.duration_years,
        "protocol_count": order.protocol_count,
        "status": order.status,
        "layout_status": order.layout_status,
        "sample_status": order.sample_status,
        "cert_body": order.cert_body,
        "original_status": order.original_status,
        "pi_status": order.pi_status,
        "expected_date": order.expected_date,
        "actual_date": order.actual_date,
        "prepayment": order.prepayment or 0,
        "payment_date": order.payment_date,
        "payment_method": order.payment_method,
        "total_price": order.total_price,
        "client_debt": order.client_debt or 0,
        "partner": order.partner,
        "notes": order.notes,
        "created_at": order.created_at,
        "client": order.client,
        "manufacturer": order.manufacturer,
        "products": [],
    }
    for p in order.products:
        main_mat = ""
        for c in p.compositions:
            if c.percentage > 50:
                main_mat = c.material_name
                break
        if not main_mat and p.compositions:
            main_mat = max(p.compositions, key=lambda c: c.percentage).material_name
        gender = "male" if p.target_group == "adult_male" else "female"
        tnved = resolve_tnved(p.weaving_type, p.product_type, gender, main_mat)
        from services.pricing import determine_doc_type
        info = determine_doc_type(p.target_group, p.layer, p.age_group)
        d["products"].append({
            "id": p.id, "article": p.article, "name": p.name,
            "product_type": p.product_type, "weaving_type": p.weaving_type,
            "target_group": p.target_group, "age_group": p.age_group,
            "layer": p.layer, "trademark": p.trademark,
            "compositions": [{"id": c.id, "material_name": c.material_name, "percentage": c.percentage} for c in p.compositions],
            "doc_type": info["doc_type"], "tr_ts": info["tr_ts"],
            "requires_sgr": info["requires_sgr"], "tnved_code": tnved["code"],
        })
    return d


@router.get("/", response_model=list[OrderOut])
def list_orders(status: str = "", db: Session = Depends(get_db)):
    q = db.query(Order).options(
        joinedload(Order.client),
        joinedload(Order.manufacturer),
        joinedload(Order.products),
    )
    if status:
        q = q.filter(Order.status == status)
    orders = q.order_by(Order.created_at.desc()).all()
    return [_enrich_order(o) for o in orders]


@router.post("/", response_model=OrderOut)
def create_order(data: OrderCreate, db: Session = Depends(get_db)):
    client = db.query(Client).filter(Client.id == data.client_id).first()
    if not client:
        raise HTTPException(404, "Клиент не найден")

    if client.country_type == "RF" and data.doc_type == "DC":
        raise HTTPException(400, "ДС недоступна для заявителей из РФ")

    pricing = calculate_price(client.country_type, data.doc_type, data.protocol_count, data.duration_years)
    if not pricing["available"]:
        raise HTTPException(400, pricing["message"])

    order = Order(
        client_id=data.client_id,
        manufacturer_id=data.manufacturer_id,
        doc_type=data.doc_type,
        tr_ts=data.tr_ts,
        duration_years=pricing["duration_years"],
        protocol_count=data.protocol_count,
        total_price=pricing["total_price"],
        status=data.status,
        layout_status=data.layout_status,
        sample_status=data.sample_status,
        cert_body=data.cert_body,
        original_status=data.original_status,
        pi_status=data.pi_status,
        expected_date=data.expected_date,
        prepayment=data.prepayment or 0,
        payment_date=data.payment_date,
        payment_method=data.payment_method,
        client_debt=(pricing["total_price"] - (data.prepayment or 0)),
        partner=data.partner,
        notes=data.notes,
    )
    db.add(order)
    db.flush()

    if data.product_ids:
        products = db.query(Product).filter(Product.id.in_(data.product_ids)).all()
        order.products = products

    db.commit()
    db.refresh(order)
    return _enrich_order(order)


@router.patch("/{order_id}", response_model=OrderOut)
def update_order(order_id: int, data: OrderUpdate, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.client), joinedload(Order.manufacturer), joinedload(Order.products)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Заказ не найден")

    update_data = data.model_dump(exclude_unset=True)
    for k, v in update_data.items():
        setattr(order, k, v)

    # Recalculate debt if prepayment changed
    if "prepayment" in update_data:
        order.client_debt = order.total_price - (order.prepayment or 0)

    db.commit()
    db.refresh(order)
    return _enrich_order(order)


@router.get("/{order_id}/download/{fmt}")
def download_order(order_id: int, fmt: str, db: Session = Depends(get_db)):
    order = db.query(Order).options(
        joinedload(Order.client), joinedload(Order.manufacturer), joinedload(Order.products)
    ).filter(Order.id == order_id).first()
    if not order:
        raise HTTPException(404, "Заказ не найден")

    enriched = _enrich_order(order)
    client_dict = {
        "company_type": order.client.company_type, "company_name": order.client.company_name,
        "fio": order.client.fio, "inn": order.client.inn, "okpo": order.client.okpo,
        "legal_address": order.client.legal_address, "phone": order.client.phone, "email": order.client.email,
    }
    mfr_dict = None
    if order.manufacturer:
        mfr_dict = {
            "company_type": order.manufacturer.company_type, "company_name": order.manufacturer.company_name,
            "inn": order.manufacturer.inn, "legal_address": order.manufacturer.legal_address,
            "production_address": order.manufacturer.production_address,
        }

    cert_dict = {
        "doc_type": order.doc_type, "tr_ts": order.tr_ts,
        "duration_years": order.duration_years, "protocol_count": order.protocol_count,
        "total_price": order.total_price,
    }

    if fmt == "docx":
        content = generate_docx(cert_dict, client_dict, mfr_dict, enriched["products"])
        media_type = "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        ext = "docx"
    elif fmt == "pdf":
        content = generate_pdf(cert_dict, client_dict, mfr_dict, enriched["products"])
        media_type = "application/pdf"
        ext = "pdf"
    else:
        raise HTTPException(400, "Формат: docx или pdf")

    doc_name = "certificate" if order.doc_type == "CC" else "declaration"
    return StreamingResponse(
        BytesIO(content), media_type=media_type,
        headers={"Content-Disposition": f"attachment; filename={doc_name}_{order.id}.{ext}"},
    )
