from pydantic import BaseModel
from typing import Optional
from datetime import datetime, date


# --- Client ---
class ClientCreate(BaseModel):
    country_type: str
    company_type: str = "ИП"
    company_name: str
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


# --- Manufacturer ---
class ManufacturerCreate(BaseModel):
    company_type: str = "ИП"
    company_name: str
    inn: Optional[str] = None
    legal_address: Optional[str] = None
    production_address: Optional[str] = None


class ManufacturerOut(ManufacturerCreate):
    id: int
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
    weaving_type: str  # трикотаж / швейка
    target_group: str
    age_group: Optional[str] = None
    layer: int
    trademark: Optional[str] = None
    compositions: list[CompositionCreate] = []


class ProductOut(BaseModel):
    id: int
    article: str
    name: str
    product_type: str
    weaving_type: str
    target_group: str
    age_group: Optional[str] = None
    layer: int
    trademark: Optional[str] = None
    compositions: list[CompositionOut] = []
    doc_type: Optional[str] = None
    tr_ts: Optional[str] = None
    requires_sgr: bool = False
    tnved_code: Optional[str] = None
    class Config:
        from_attributes = True


# --- Calculator ---
class CalcRequest(BaseModel):
    country_type: str
    doc_type: str
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


# --- Order ---
class OrderCreate(BaseModel):
    client_id: int
    manufacturer_id: Optional[int] = None
    doc_type: str
    tr_ts: str
    duration_years: int = 1
    protocol_count: int = 1
    status: str = "1 очередь"
    layout_status: str = "Нет"
    sample_status: str = "Нет"
    cert_body: Optional[str] = None
    original_status: str = "Нет"
    pi_status: str = "Нет"
    expected_date: Optional[date] = None
    prepayment: Optional[float] = 0
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    partner: Optional[str] = None
    notes: Optional[str] = None
    product_ids: list[int] = []


class OrderUpdate(BaseModel):
    status: Optional[str] = None
    layout_status: Optional[str] = None
    sample_status: Optional[str] = None
    cert_body: Optional[str] = None
    original_status: Optional[str] = None
    pi_status: Optional[str] = None
    expected_date: Optional[date] = None
    actual_date: Optional[date] = None
    prepayment: Optional[float] = None
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    client_debt: Optional[float] = None
    partner: Optional[str] = None
    notes: Optional[str] = None


class OrderOut(BaseModel):
    id: int
    client_id: int
    manufacturer_id: Optional[int] = None
    doc_type: str
    tr_ts: str
    duration_years: int
    protocol_count: int
    status: str
    layout_status: str
    sample_status: str
    cert_body: Optional[str] = None
    original_status: str
    pi_status: str
    expected_date: Optional[date] = None
    actual_date: Optional[date] = None
    prepayment: Optional[float] = 0
    payment_date: Optional[date] = None
    payment_method: Optional[str] = None
    total_price: float
    client_debt: Optional[float] = 0
    partner: Optional[str] = None
    notes: Optional[str] = None
    created_at: datetime
    client: Optional[ClientOut] = None
    manufacturer: Optional[ManufacturerOut] = None
    products: list[ProductOut] = []
    class Config:
        from_attributes = True


# --- TN VED ---
class TnvedRequest(BaseModel):
    material_type: str
    product_type: str
    gender: str
    main_material: str


class TnvedResponse(BaseModel):
    code: str
    description: str
