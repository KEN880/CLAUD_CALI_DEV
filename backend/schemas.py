from pydantic import BaseModel
from typing import Optional
from datetime import datetime


# --- Client ---
class ClientCreate(BaseModel):
    country_type: str  # "KR" or "RF"
    fio: str
    inn: str
    okpo: Optional[str] = None
    legal_address: Optional[str] = None
    workshop_address: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None


class ClientOut(ClientCreate):
    id: int
    ip_certificate_path: Optional[str] = None

    class Config:
        from_attributes = True


# --- Composition ---
class CompositionCreate(BaseModel):
    material_name: str
    percentage: float


class CompositionOut(CompositionCreate):
    id: int

    class Config:
        from_attributes = True


# --- Product ---
class ProductCreate(BaseModel):
    article: str
    name: str
    product_type: str
    material_type: str  # трикотаж / текстиль
    target_group: str  # adult_male, adult_female, child
    age_group: Optional[str] = None
    layer: int
    compositions: list[CompositionCreate] = []


class ProductOut(BaseModel):
    id: int
    article: str
    name: str
    product_type: str
    material_type: str
    target_group: str
    age_group: Optional[str] = None
    layer: int
    compositions: list[CompositionOut] = []
    doc_type: Optional[str] = None  # auto-determined
    tr_ts: Optional[str] = None
    requires_sgr: bool = False
    tnved_code: Optional[str] = None

    class Config:
        from_attributes = True


# --- Calculator ---
class CalcRequest(BaseModel):
    country_type: str  # "KR" or "RF"
    doc_type: str  # "CC" or "DC"
    protocol_count: int = 1
    duration_years: int = 1


class CalcResponse(BaseModel):
    base_price: float
    extra_protocols_price: float
    total_price: float
    doc_type: str
    duration_years: int
    available: bool
    message: Optional[str] = None


# --- Certificate ---
class CertificateCreate(BaseModel):
    client_id: int
    doc_type: str
    tr_ts: str
    duration_years: int = 1
    protocol_count: int = 1
    product_ids: list[int] = []


class CertificateOut(BaseModel):
    id: int
    client_id: int
    doc_type: str
    tr_ts: str
    duration_years: int
    protocol_count: int
    total_price: float
    status: str
    created_at: datetime
    products: list[ProductOut] = []

    class Config:
        from_attributes = True


# --- TN VED ---
class TnvedRequest(BaseModel):
    material_type: str
    product_type: str
    gender: str  # male, female
    main_material: str  # основной материал >50%


class TnvedResponse(BaseModel):
    code: str
    description: str
