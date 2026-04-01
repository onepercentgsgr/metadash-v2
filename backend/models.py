from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from datetime import datetime
from database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String, default="client")  # admin or client
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    tenant_config = relationship("TenantConfig", back_populates="user", uselist=False)
    subscriptions = relationship("Subscription", back_populates="user")
    agent_logs = relationship("AgentLog", back_populates="user")
    financial_records = relationship("FinancialRecord", back_populates="user")
    shopify_orders = relationship("ShopifyOrder", back_populates="user")


class TenantConfig(Base):
    __tablename__ = "tenant_configs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, index=True)
    meta_access_token = Column(String, nullable=True)
    meta_ad_account_id = Column(String, nullable=True)
    meta_app_id = Column(String, nullable=True)
    meta_app_secret = Column(String, nullable=True)
    anthropic_api_key = Column(String, nullable=True)
    hf_api_key = Column(String, nullable=True)
    negocio_info = Column(Text, nullable=True)
    landing_page_url = Column(String, nullable=True)
    shopify_store_url = Column(String, nullable=True)
    shopify_webhook_secret = Column(String, nullable=True)
    mercadopago_access_token = Column(String, nullable=True)

    user = relationship("User", back_populates="tenant_config")


class Subscription(Base):
    __tablename__ = "subscriptions"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    plan = Column(String, default="trial")  # trial, starter, pro, enterprise
    status = Column(String, default="active")  # active, expired, cancelled
    trial_start = Column(DateTime, nullable=True)
    trial_end = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    user = relationship("User", back_populates="subscriptions")


class AgentLog(Base):
    __tablename__ = "agent_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    agent_type = Column(String)
    input_summary = Column(String, nullable=True)
    output = Column(Text)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="agent_logs")


class FinancialRecord(Base):
    __tablename__ = "financial_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    periodo = Column(String)
    ingresos = Column(Integer, nullable=True)
    costos = Column(Integer, nullable=True)
    ad_spend = Column(Integer, nullable=True)
    devoluciones = Column(Integer, nullable=True)
    ordenes = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="financial_records")


class ShopifyOrder(Base):
    __tablename__ = "shopify_orders"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    order_id = Column(String, unique=True, index=True)
    order_number = Column(String)
    email = Column(String)
    total_price = Column(String)
    subtotal_price = Column(String)
    total_tax = Column(String)
    currency = Column(String)
    financial_status = Column(String)
    fulfillment_status = Column(String)
    customer_first_name = Column(String, nullable=True)
    customer_last_name = Column(String, nullable=True)
    line_items_json = Column(JSON, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User", back_populates="shopify_orders")
