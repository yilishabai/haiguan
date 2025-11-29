from pydantic import BaseModel
from typing import Optional

class CustomsHeaderIn(BaseModel):
    id: str
    declaration_no: str
    enterprise: Optional[str] = None
    consignor: Optional[str] = None
    consignee: Optional[str] = None
    port_code: Optional[str] = None
    trade_mode: Optional[str] = None
    currency: Optional[str] = None
    total_value: Optional[float] = 0.0
    gross_weight: Optional[float] = 0.0
    net_weight: Optional[float] = 0.0
    packages: Optional[int] = 0
    country_origin: Optional[str] = None
    country_dest: Optional[str] = None
    status: Optional[str] = None
    declare_date: Optional[str] = None
    order_id: Optional[str] = None

class CustomsItemIn(BaseModel):
    id: str
    header_id: str
    line_no: int
    hs_code: str
    name: str
    spec: str
    unit: str
    qty: float
    unit_price: float
    amount: float
    origin_country: Optional[str] = None
    tax_rate: Optional[float] = 0.0
    tariff: Optional[float] = 0.0
    excise: Optional[float] = 0.0
    vat: Optional[float] = 0.0
