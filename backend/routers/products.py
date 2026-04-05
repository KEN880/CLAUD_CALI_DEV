from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Product, Composition
from schemas import ProductCreate, ProductOut
from services.pricing import determine_doc_type
from services.tnved_resolver import resolve_tnved
from services.csv_parser import parse_products_file

router = APIRouter(prefix="/api/products", tags=["products"])


def _enrich_product(product: Product) -> dict:
    """Add computed fields to product."""
    info = determine_doc_type(product.target_group, product.layer, product.age_group)

    # Find main material (>50%)
    main_material = ""
    for comp in product.compositions:
        if comp.percentage > 50:
            main_material = comp.material_name
            break
    if not main_material and product.compositions:
        main_material = max(product.compositions, key=lambda c: c.percentage).material_name

    gender = "male" if product.target_group == "adult_male" else "female"
    tnved = resolve_tnved(product.material_type, product.product_type, gender, main_material)

    return {
        "id": product.id,
        "article": product.article,
        "name": product.name,
        "product_type": product.product_type,
        "material_type": product.material_type,
        "target_group": product.target_group,
        "age_group": product.age_group,
        "layer": product.layer,
        "compositions": [{"id": c.id, "material_name": c.material_name, "percentage": c.percentage} for c in product.compositions],
        "doc_type": info["doc_type"],
        "tr_ts": info["tr_ts"],
        "requires_sgr": info["requires_sgr"],
        "tnved_code": tnved["code"],
    }


@router.get("/", response_model=list[ProductOut])
def list_products(db: Session = Depends(get_db)):
    products = db.query(Product).all()
    return [_enrich_product(p) for p in products]


@router.get("/{product_id}", response_model=ProductOut)
def get_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Продукт не найден")
    return _enrich_product(product)


@router.post("/", response_model=ProductOut)
def create_product(data: ProductCreate, db: Session = Depends(get_db)):
    compositions_data = data.compositions
    product = Product(**data.model_dump(exclude={"compositions"}))
    db.add(product)
    db.flush()

    for comp in compositions_data:
        db.add(Composition(product_id=product.id, **comp.model_dump()))

    db.commit()
    db.refresh(product)
    return _enrich_product(product)


@router.delete("/{product_id}")
def delete_product(product_id: int, db: Session = Depends(get_db)):
    product = db.query(Product).filter(Product.id == product_id).first()
    if not product:
        raise HTTPException(404, "Продукт не найден")
    db.delete(product)
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
