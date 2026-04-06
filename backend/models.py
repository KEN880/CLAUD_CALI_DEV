from sqlalchemy import Column, Integer, String, Float, DateTime, Date, ForeignKey, Table, Text
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

order_products = Table(
    "order_products",
    Base.metadata,
    Column("order_id", Integer, ForeignKey("orders.id"), primary_key=True),
    Column("product_id", Integer, ForeignKey("products.id"), primary_key=True),
)


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_type = Column(String, nullable=False)  # "KR" or "RF"
    company_type = Column(String, nullable=False, default="ИП")  # "ИП" or "ОсОО"
    company_name = Column(String, nullable=False)  # Название ИП/ОсОО
    fio = Column(String, nullable=False)  # ФИО руководителя
    inn = Column(String, nullable=False)
    okpo = Column(String, nullable=True)
    legal_address = Column(String, nullable=True)
    workshop_address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    ip_certificate_path = Column(String, nullable=True)

    orders = relationship("Order", back_populates="client")


class Manufacturer(Base):
    __tablename__ = "manufacturers"

    id = Column(Integer, primary_key=True, autoincrement=True)
    company_type = Column(String, nullable=False, default="ИП")
    company_name = Column(String, nullable=False)
    inn = Column(String, nullable=True)
    legal_address = Column(String, nullable=True)
    production_address = Column(String, nullable=True)

    orders = relationship("Order", back_populates="manufacturer")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article = Column(String, nullable=False)
    name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)
    weaving_type = Column(String, nullable=False)  # трикотаж / швейка
    target_group = Column(String, nullable=False)
    age_group = Column(String, nullable=True)
    layer = Column(Integer, nullable=False)
    trademark = Column(String, nullable=True)  # торговая марка

    compositions = relationship("Composition", back_populates="product", cascade="all, delete-orphan")
    orders = relationship("Order", secondary=order_products, back_populates="products")


class Composition(Base):
    __tablename__ = "compositions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_name = Column(String, nullable=False)
    percentage = Column(Float, nullable=False)

    product = relationship("Product", back_populates="compositions")


class Order(Base):
    __tablename__ = "orders"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    manufacturer_id = Column(Integer, ForeignKey("manufacturers.id"), nullable=True)

    # Document info
    doc_type = Column(String, nullable=False)  # "CC" / "DC"
    tr_ts = Column(String, nullable=False)     # "007/2011" / "017/2011"
    duration_years = Column(Integer, nullable=False, default=1)
    protocol_count = Column(Integer, nullable=False, default=1)

    # Statuses
    status = Column(String, nullable=False, default="1 очередь")
    layout_status = Column(String, nullable=False, default="Нет")
    sample_status = Column(String, nullable=False, default="Нет")
    cert_body = Column(String, nullable=True)
    original_status = Column(String, nullable=False, default="Нет")
    pi_status = Column(String, nullable=False, default="Нет")

    # Dates
    expected_date = Column(Date, nullable=True)
    actual_date = Column(Date, nullable=True)

    # Payment
    prepayment = Column(Float, nullable=True, default=0)
    payment_date = Column(Date, nullable=True)
    payment_method = Column(String, nullable=True)
    total_price = Column(Float, nullable=False)
    client_debt = Column(Float, nullable=True, default=0)

    # Other
    partner = Column(String, nullable=True)
    notes = Column(Text, nullable=True)

    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="orders")
    manufacturer = relationship("Manufacturer", back_populates="orders")
    products = relationship("Product", secondary=order_products, back_populates="orders")
