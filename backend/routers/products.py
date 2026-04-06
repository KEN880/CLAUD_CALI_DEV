from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Product, Composition
from schemas import ProductCreate, ProductOut
from services.pricing import determine_doc_type
from services.tnved_resolver import resolve_tnved, determine_layer
from services.csv_parser import parse_products_file

router = APIRouter(prefix="/api/products", tags=["products"])


def _enrich_product(product: Product) -> dict:
    info = determine_doc_type(product.target_group, product.layer, product.age_group)
    main_material = ""
    for comp in product.compositions:
        if comp.percentage > 50:
            main_material = comp.material_name
            break
    if not main_material and product.compositions:
        main_material = max(product.compositions, key=lambda c: c.percentage).material_name
    gender = "male" if product.target_group == "adult_male" else "female"
    tnved = resolve_tnved(product.weaving_type, product.product_type, gender, main_material)
    return {
        "id": product.id, "article": product.article, "name": product.name,
        "product_type": product.product_type, "weaving_type": product.weaving_type,
        "target_group": product.target_group, "age_group": product.age_group,
        "layer": product.layer, "trademark": product.trademark,
        "compositions": [{"id": c.id, "material_name": c.material_name, "percentage": c.percentage} for c in product.compositions],
        "doc_type": info["doc_type"], "tr_ts": info["tr_ts"],
        "requires_sgr": info["requires_sgr"], "tnved_code": tnved["code"],
    }


@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    return [_enrich_product(p) for p in db.query(Product).all()]


@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    comps = data.compositions
    product_data = data.model_dump(exclude={"compositions"})
    # Auto-determine layer if not explicitly set or 0
    if product_data.get("layer", 0) == 0:
        product_data["layer"] = determine_layer(product_data["product_type"])
    product = Product(**product_data)
    db.add(product)
    db.flush()
    for comp in comps:
        db.add(Composition(product_id=product.id, **comp.model_dump()))
    db.commit()
    db.refresh(product)
    return _enrich_product(product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    p = db.query(Product).filter(Product.id == product_id).first()
    if not p:
        raise HTTPException(404, "Продукт не найден")
    db.delete(p)
    db.commit()
    return {"ok": True}


@router.post("/batch-upload", response_model=list[ProductOut])
async def batch_upload(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    items = parse_products_file(content, file.filename)
    created = []
    for item in items:
        compositions = item.pop("compositions", [])
        product = Product(**item)
        db.add(product)
        db.flush()
        for comp in compositions:
            db.add(Composition(product_id=product.id, **comp))
        db.commit()
        db.refresh(product)
        created.append(_enrich_product(product))
    return created
