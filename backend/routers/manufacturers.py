from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Manufacturer
from schemas import ManufacturerCreate, ManufacturerOut

router = APIRouter(prefix="/api/manufacturers", tags=["manufacturers"])


@router.get("/", response_model=list[ManufacturerOut])
def list_manufacturers(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Manufacturer)
    if q:
        query = query.filter(Manufacturer.company_name.ilike(f"%{q}%"))
    return query.all()


@router.post("/", response_model=ManufacturerOut)
def create_manufacturer(data: ManufacturerCreate, db: Session = Depends(get_db)):
    m = Manufacturer(**data.model_dump())
    db.add(m)
    db.commit()
    db.refresh(m)
    return m


@router.put("/{mid}", response_model=ManufacturerOut)
def update_manufacturer(mid: int, data: ManufacturerCreate, db: Session = Depends(get_db)):
    m = db.query(Manufacturer).filter(Manufacturer.id == mid).first()
    if not m:
        raise HTTPException(404, "Изготовитель не найден")
    for k, v in data.model_dump().items():
        setattr(m, k, v)
    db.commit()
    db.refresh(m)
    return m
