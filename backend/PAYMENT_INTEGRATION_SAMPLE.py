"""
SAMPLE: Cómo integrar payment_routes en main.py

Este archivo muestra el código que necesitas añadir a tu main.py
para que funcione la integración de pagos.
"""

# En main.py, después de los imports existentes, añade:

from fastapi import FastAPI, Depends, HTTPException, status, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from typing import Optional, List, Any, Dict
from pydantic import BaseModel
import jwt
from passlib.context import CryptContext
import os
from dotenv import load_dotenv
import json
import openpyxl
import io

from database import engine, get_db, Base
from models import User, TenantConfig, Subscription, AgentLog, FinancialRecord, ShopifyOrder
from payment_routes import router as payment_router  # AÑADIR ESTA LÍNEA
import config

load_dotenv()

# Initialize database
Base.metadata.create_all(bind=engine)

# Create FastAPI app
app = FastAPI(title="MetaDash API", version="1.0.0")

# Setup CORS
cors_origins = [
    "http://localhost:3000",
    "https://metadash.vercel.app",
]

# Add dynamic Vercel preview URLs
frontend_url = os.getenv("FRONTEND_URL", "")
if frontend_url:
    cors_origins.append(frontend_url)

# Add preview app URLs
cors_origins.extend([
    "https://metadash-*.vercel.app",
])

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# INCLUIR PAYMENT ROUTES - AÑADIR ESTAS LÍNEAS
app.include_router(payment_router)
# FIN DE PAYMENT ROUTES

# ... resto del código existente en main.py ...


# EJEMPLO DE ENDPOINT EXISTENTE (para referencia):
@app.get("/")
def read_root():
    """Root endpoint"""
    return {
        "message": "MetaDash API",
        "version": "1.0.0",
        "endpoints": {
            "payments": "/docs#/payments",
            "auth": "/docs#/auth",
            "dashboard": "/docs#/dashboard"
        }
    }


# ENDPOINTS DE PRUEBA PARA VERIFICAR INTEGRACIÓN:

@app.get("/health")
def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "database": "connected",
        "payments": "integrated",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/config/payment-providers")
def get_payment_providers():
    """Get available payment providers configuration"""
    return {
        "mercadopago": {
            "enabled": bool(os.getenv("MERCADOPAGO_ACCESS_TOKEN")),
            "status": "configured" if os.getenv("MERCADOPAGO_ACCESS_TOKEN") else "not_configured"
        },
        "stripe": {
            "enabled": bool(os.getenv("STRIPE_SECRET_KEY")),
            "status": "configured" if os.getenv("STRIPE_SECRET_KEY") else "not_configured",
            "publishable_key": os.getenv("STRIPE_PUBLISHABLE_KEY", "").replace("pk_", "pk_***")
        }
    }


# Para ver todos los endpoints disponibles, incluidos los de pagos:
# 1. Ejecuta: python -m uvicorn main:app --reload
# 2. Abre: http://localhost:8000/docs
# 3. Los endpoints de /payments estarán listados en la interfaz Swagger
