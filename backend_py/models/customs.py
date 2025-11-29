from sqlalchemy import Column, String, Integer, Float, Date, ForeignKey
from sqlalchemy.orm import relationship
from backend_py.db import Base

class CustomsHeader(Base):
    __tablename__ = 'customs_headers'
    id = Column(String, primary_key=True)
    declaration_no = Column(String, index=True)
    enterprise = Column(String)
    consignor = Column(String)
    consignee = Column(String)
    port_code = Column(String)
    trade_mode = Column(String)
    currency = Column(String)
    total_value = Column(Float, default=0.0)
    gross_weight = Column(Float, default=0.0)
    net_weight = Column(Float, default=0.0)
    packages = Column(Integer, default=0)
    country_origin = Column(String)
    country_dest = Column(String)
    status = Column(String)
    declare_date = Column(Date)
    order_id = Column(String)
    updated_at = Column(String)

class CustomsItem(Base):
    __tablename__ = 'customs_items'
    id = Column(String, primary_key=True)
    header_id = Column(String, ForeignKey('customs_headers.id'), index=True)
    line_no = Column(Integer)
    hs_code = Column(String, index=True)
    name = Column(String)
    spec = Column(String)
    unit = Column(String)
    qty = Column(Float, default=0.0)
    unit_price = Column(Float, default=0.0)
    amount = Column(Float, default=0.0)
    origin_country = Column(String)
    tax_rate = Column(Float, default=0.0)
    tariff = Column(Float, default=0.0)
    excise = Column(Float, default=0.0)
    vat = Column(Float, default=0.0)
