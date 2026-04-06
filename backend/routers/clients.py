from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models import Client
from schemas import ClientCreate, ClientOut
import os, shutil

router = APIRouter(prefix="/api/clients", tags=["clients"])
UPLOAD_DIR = os.path.join(os.path.dirname(os.path.dirname(__file__)), "uploads")


@router.get("/", response_model=list[ClientOut])
def list_clients(q: str = "", db: Session = Depends(get_db)):
    query = db.query(Client)
    if q:
        query = query.filter(Client.fio.ilike(f"%{q}%") | Client.inn.ilike(f"%{q}%") | Client.company_name.ilike(f"%{q}%"))
    return query.all()


@router.get("/{client_id}", response_model=ClientOut)
def get_client(client_id: int, db: Session = Depends(get_db)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Клиент не найден")
    return c


@router.post("/", response_model=ClientOut)
def create_client(data: ClientCreate, db: Session = Depends(get_db)):
    c = Client(**data.model_dump())
    db.add(c)
    db.commit()
    db.refresh(c)
    return c


@router.put("/{client_id}", response_model=ClientOut)
def update_client(client_id: int, data: ClientCreate, db: Session = Depends(get_db)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Клиент не найден")
    for k, v in data.model_dump().items():
        setattr(c, k, v)
    db.commit()
    db.refresh(c)
    return c


@router.post("/{client_id}/upload-certificate")
def upload_certificate(client_id: int, file: UploadFile = File(...), db: Session = Depends(get_db)):
    c = db.query(Client).filter(Client.id == client_id).first()
    if not c:
        raise HTTPException(404, "Клиент не найден")
    os.makedirs(UPLOAD_DIR, exist_ok=True)
    path = os.path.join(UPLOAD_DIR, f"client_{client_id}_{file.filename}")
    with open(path, "wb") as f:
        shutil.copyfileobj(file.file, f)
    c.ip_certificate_path = path
    db.commit()
    return {"path": path}
