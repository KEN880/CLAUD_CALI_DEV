from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base

certificate_products = Table(
    "certificate_products",
    Base.metadata,
    Column("certificate_id", Integer, ForeignKey("certificates.id"), primary_key=True),
    Column("product_id", Integer, ForeignKey("products.id"), primary_key=True),
)


class Client(Base):
    __tablename__ = "clients"

    id = Column(Integer, primary_key=True, autoincrement=True)
    country_type = Column(String, nullable=False)  # "KR" or "RF"
    fio = Column(String, nullable=False)
    inn = Column(String, nullable=False)
    okpo = Column(String, nullable=True)
    legal_address = Column(String, nullable=True)
    workshop_address = Column(String, nullable=True)
    phone = Column(String, nullable=True)
    email = Column(String, nullable=True)
    ip_certificate_path = Column(String, nullable=True)

    certificates = relationship("Certificate", back_populates="client")


class Product(Base):
    __tablename__ = "products"

    id = Column(Integer, primary_key=True, autoincrement=True)
    article = Column(String, nullable=False)
    name = Column(String, nullable=False)
    product_type = Column(String, nullable=False)  # платье, юбка, брюки...
    material_type = Column(String, nullable=False)  # трикотаж / текстиль
    target_group = Column(String, nullable=False)  # adult_male, adult_female, child
    age_group = Column(String, nullable=True)  # "до 3 лет", "3+", null
    layer = Column(Integer, nullable=False)  # 1, 2, 3

    compositions = relationship("Composition", back_populates="product", cascade="all, delete-orphan")
    certificates = relationship("Certificate", secondary=certificate_products, back_populates="products")


class Composition(Base):
    __tablename__ = "compositions"

    id = Column(Integer, primary_key=True, autoincrement=True)
    product_id = Column(Integer, ForeignKey("products.id"), nullable=False)
    material_name = Column(String, nullable=False)  # хлопок, полиэстер...
    percentage = Column(Float, nullable=False)

    product = relationship("Product", back_populates="compositions")


class Certificate(Base):
    __tablename__ = "certificates"

    id = Column(Integer, primary_key=True, autoincrement=True)
    client_id = Column(Integer, ForeignKey("clients.id"), nullable=False)
    doc_type = Column(String, nullable=False)  # "CC" or "DC"
    tr_ts = Column(String, nullable=False)  # "007/2011" or "017/2011"
    duration_years = Column(Integer, nullable=False, default=1)
    protocol_count = Column(Integer, nullable=False, default=1)
    total_price = Column(Float, nullable=False)
    status = Column(String, nullable=False, default="draft")
    created_at = Column(DateTime, default=datetime.utcnow)

    client = relationship("Client", back_populates="certificates")
    products = relationship("Product", secondary=certificate_products, back_populates="certificates")
