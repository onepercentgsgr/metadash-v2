from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.ext.hybrid import hybrid_property
from datetime import datetime
from database import Base
from encryption import encrypt_credential, decrypt_credential


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True)
    hashed_password = Column(String)
    name = Column(String)
    role = Column(String, default="client")  # admin or client
    is_active = Column(Boolean, default=True)
    has_paid = Column(Boolean, default=False)
    paid_at = Column(DateTime, nullable=True)
    onboarded_at = Column(DateTime, nullable=True)
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
    _meta_access_token = Column("meta_access_token", String, nullable=True)
    meta_ad_account_id = Column(String, nullable=True)
    _meta_app_id = Column("meta_app_id", String, nullable=True)
    _meta_app_secret = Column("meta_app_secret", String, nullable=True)
    _anthropic_api_key = Column("anthropic_api_key", String, nullable=True)
    _hf_api_key = Column("hf_api_key", String, nullable=True)
    negocio_info = Column(Text, nullable=True)
    landing_page_url = Column(String, nullable=True)
    shopify_store_url = Column(String, nullable=True)
    _shopify_webhook_secret = Column("shopify_webhook_secret", String, nullable=True)
    _mercadopago_access_token = Column("mercadopago_access_token", String, nullable=True)

    user = relationship("User", back_populates="tenant_config")

    @hybrid_property
    def meta_access_token(self):
        return decrypt_credential(self._meta_access_token) if self._meta_access_token else None

    @meta_access_token.setter
    def meta_access_token(self, value):
        self._meta_access_token = encrypt_credential(value) if value else None

    @hybrid_property
    def meta_app_id(self):
        return decrypt_credential(self._meta_app_id) if self._meta_app_id else None

    @meta_app_id.setter
    def meta_app_id(self, value):
        self._meta_app_id = encrypt_credential(value) if value else None

    @hybrid_property
    def meta_app_secret(self):
        return decrypt_credential(self._meta_app_secret) if self._meta_app_secret else None

    @meta_app_secret.setter
    def meta_app_secret(self, value):
        self._meta_app_secret = encrypt_credential(value) if value else None

    @hybrid_property
    def anthropic_api_key(self):
        return decrypt_credential(self._anthropic_api_key) if self._anthropic_api_key else None

    @anthropic_api_key.setter
    def anthropic_api_key(self, value):
        self._anthropic_api_key = encrypt_credential(value) if value else None

    @hybrid_property
    def hf_api_key(self):
        return decrypt_credential(self._hf_api_key) if self._hf_api_key else None

    @hf_api_key.setter
    def hf_api_key(self, value):
        self._hf_api_key = encrypt_credential(value) if value else None

    @hybrid_property
    def shopify_webhook_secret(self):
        return decrypt_credential(self._shopify_webhook_secret) if self._shopify_webhook_secret else None

    @shopify_webhook_secret.setter
    def shopify_webhook_secret(self, value):
        self._shopify_webhook_secret = encrypt_credential(value) if value else None

    @hybrid_property
    def mercadopago_access_token(self):
        return decrypt_credential(self._mercadopago_access_token) if self._mercadopago_access_token else None

    @mercadopago_access_token.setter
    def mercadopago_access_token(self, value):
        self._mercadopago_access_token = encrypt_credential(value) if value else None


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


class GeneratedVideo(Base):
    __tablename__ = "generated_videos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    content = Column(Text)
    angle = Column(String, nullable=True)
    date = Column(String, index=True)  # YYYY-MM-DD
    created_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("User")


class PipelineRun(Base):
    __tablename__ = "pipeline_runs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    run_id = Column(String, unique=True, index=True)
    status = Column(String, default="running")  # "running", "complete", "error"
    product_name = Column(String, nullable=True)
    deliverables = Column(JSON, nullable=True)
    state_snapshot = Column(JSON, nullable=True)
    error_message = Column(Text, nullable=True)
    duration_seconds = Column(Integer, nullable=True)
    started_at = Column(DateTime, default=datetime.utcnow, index=True)
    completed_at = Column(DateTime, nullable=True)

    user = relationship("User")


class AutonomousActionLog(Base):
    __tablename__ = "autonomous_action_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), index=True)
    action_type = Column(String)  # "pause_campaign", "scale_budget", "rotate_creative", "alert", etc.
    status = Column(String, default="pending")  # "pending", "approved", "executed", "failed", "cancelled"
    target = Column(String)  # "campaign_123" or "adset_456"
    description = Column(Text)  # Human-readable: "Paused Campaign X due to CPA > $50"
    details = Column(JSON, nullable=True)  # Full data: {campaign_id, old_budget, new_budget, reason, metrics}
    result = Column(Text, nullable=True)  # Response from Meta API or error message
    triggered_by = Column(String)  # Which agent triggered it: "optimizer", "creative_director", etc.
    requires_approval = Column(Boolean, default=False)
    approved_by = Column(String, nullable=True)  # user_id of admin who approved
    approved_at = Column(DateTime, nullable=True)
    executed_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, index=True)

    user = relationship("User")
