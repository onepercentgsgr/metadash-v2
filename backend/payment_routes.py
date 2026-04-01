"""
Payment routes for MetaDash SaaS
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any
from database import get_db
from models import User
import payments
import stripe_payments
from dotenv import load_dotenv
import os
import hmac
import hashlib

load_dotenv()

router = APIRouter(prefix="/payments", tags=["payments"])

# Environment variables
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
MERCADOPAGO_WEBHOOK_TOKEN = os.getenv("MERCADOPAGO_WEBHOOK_TOKEN", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def get_current_user(request: Request, db: Session = Depends(get_db)) -> User:
    """
    Get current user from JWT token in Authorization header.
    This is a simplified version - implement full JWT validation as needed.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado"
        )
    return None  # Implement full JWT validation


@router.post("/create-checkout")
async def create_mercadopago_checkout(
    plan: str,
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a MercadoPago checkout preference for a subscription plan.

    Parámetros:
    - plan: Plan a contratar (trial, starter, pro, enterprise)
    - user_id: ID del usuario
    """
    try:
        # Validate plan
        valid_plans = payments.get_available_plans()
        if plan not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan '{plan}' no válido"
            )

        # Create checkout
        checkout_url = payments.create_checkout(
            user_id=user_id,
            plan=plan,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if not checkout_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear el checkout de pago"
            )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "plan": plan,
            "message": f"Checkout creado para el plan {plan}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando checkout: {str(e)}"
        )


@router.post("/webhook")
async def mercadopago_webhook(
    request: Request,
    db: Session = Depends(get_db)
) -> Dict[str, str]:
    """
    MercadoPago webhook endpoint for payment notifications.
    """
    try:
        # Get raw body for signature verification
        body = await request.json()

        # Verify webhook token
        webhook_token = request.headers.get("X-Webhook-Token", "")
        if webhook_token != MERCADOPAGO_WEBHOOK_TOKEN and MERCADOPAGO_WEBHOOK_TOKEN:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token de webhook inválido"
            )

        # Process webhook
        success = payments.handle_webhook(body, db)

        if success:
            return {
                "status": "success",
                "message": "Webhook procesado correctamente"
            }
        else:
            return {
                "status": "processed",
                "message": "Webhook procesado sin cambios"
            }

    except Exception as e:
        print(f"Webhook error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }


@router.post("/stripe/create-checkout")
async def create_stripe_checkout(
    plan: str,
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for a subscription plan.

    Parámetros:
    - plan: Plan a contratar (trial, starter, pro, enterprise)
    - user_id: ID del usuario
    """
    try:
        # Validate plan
        valid_plans = stripe_payments.get_available_plans()
        if plan not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan '{plan}' no válido"
            )

        # Create checkout session
        checkout_url = stripe_payments.create_checkout_session(
            user_id=user_id,
            plan=plan,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if not checkout_url:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="No se pudo crear la sesión de pago"
            )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "plan": plan,
            "message": f"Sesión de pago creada para el plan {plan}"
        }

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error creando sesión de pago: {str(e)}"
        )


@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)) -> Dict[str, str]:
    """
    Stripe webhook endpoint for payment events.
    """
    try:
        # Get raw body
        body = await request.body()

        # Get Stripe signature
        sig_header = request.headers.get("stripe-signature", "")

        # Verify signature
        try:
            event = stripe_payments.stripe.Webhook.construct_event(
                body, sig_header, STRIPE_WEBHOOK_SECRET
            )
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Firma de webhook inválida"
            )

        # Process event
        success = stripe_payments.handle_webhook(event, db)

        if success:
            return {
                "status": "success",
                "message": "Evento de Stripe procesado correctamente"
            }
        else:
            return {
                "status": "processed",
                "message": "Evento de Stripe procesado"
            }

    except Exception as e:
        print(f"Stripe webhook error: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error procesando webhook: {str(e)}"
        )


@router.get("/plans")
async def get_plans() -> Dict[str, Any]:
    """
    Get all available subscription plans.
    """
    try:
        plans = payments.get_available_plans()
        return {
            "success": True,
            "plans": plans,
            "total_plans": len(plans)
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo planes: {str(e)}"
        )


@router.get("/status/{user_id}")
async def get_subscription_status(
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get subscription status for a user.

    Parámetros:
    - user_id: ID del usuario
    """
    try:
        status_info = payments.check_subscription_status(user_id, db)
        return {
            "success": True,
            "subscription": status_info
        }
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo estado de suscripción: {str(e)}"
        )


@router.post("/cancel/{user_id}")
async def cancel_subscription(
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cancel a user's subscription.

    Parámetros:
    - user_id: ID del usuario
    """
    try:
        success = payments.cancel_subscription(user_id, db)

        if success:
            return {
                "success": True,
                "message": "Suscripción cancelada correctamente"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Suscripción no encontrada"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error cancelando suscripción: {str(e)}"
        )


@router.get("/stripe/portal/{user_id}")
async def get_stripe_portal(
    user_id: int,
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get Stripe customer portal URL for subscription management.

    Parámetros:
    - user_id: ID del usuario
    """
    try:
        portal_url = stripe_payments.get_customer_portal_url(
            user_id=user_id,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if portal_url:
            return {
                "success": True,
                "portal_url": portal_url
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Portal de cliente no encontrado"
            )

    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Error obteniendo portal: {str(e)}"
        )
