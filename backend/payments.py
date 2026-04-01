"""
MercadoPago integration module for MetaDash subscription payments
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import mercadopago
from sqlalchemy.orm import Session
from models import User, Subscription, TenantConfig
from dotenv import load_dotenv

load_dotenv()

# Plan definitions in USD
PLANS = {
    "trial": {
        "name": "Plan de Prueba",
        "price": 0.00,
        "duration_days": 14,
        "description": "Acceso completo por 14 días"
    },
    "starter": {
        "name": "Plan Iniciador",
        "price": 29.00,
        "duration_days": 30,
        "description": "5 agentes de IA, análisis básico, soporte por email"
    },
    "pro": {
        "name": "Plan Profesional",
        "price": 79.00,
        "duration_days": 30,
        "description": "Agentes ilimitados, análisis avanzado, webhooks, soporte prioritario"
    },
    "enterprise": {
        "name": "Plan Empresarial",
        "price": 199.00,
        "duration_days": 30,
        "description": "Todo incluido, API dedicada, SLA garantizado, gestor de cuenta"
    }
}

# Initialize MercadoPago SDK
SDK = mercadopago.SDK(os.getenv("MERCADOPAGO_ACCESS_TOKEN", ""))


def create_checkout(
    user_id: int,
    plan: str,
    db: Session,
    frontend_url: str = "http://localhost:3000"
) -> Optional[str]:
    """
    Create a MercadoPago checkout preference for a subscription plan.

    Args:
        user_id: ID del usuario
        plan: Plan a contratar (trial, starter, pro, enterprise)
        db: Sesión de base de datos
        frontend_url: URL del frontend para redirecciones

    Returns:
        URL de checkout de MercadoPago o None si hay error
    """
    try:
        if plan not in PLANS:
            raise ValueError(f"Plan '{plan}' no válido")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")

        plan_info = PLANS[plan]

        # Si es plan trial, no crear preferencia de pago
        if plan == "trial":
            subscription = db.query(Subscription).filter(
                Subscription.user_id == user_id,
                Subscription.plan == "trial"
            ).first()

            if not subscription:
                subscription = Subscription(
                    user_id=user_id,
                    plan="trial",
                    status="active",
                    trial_start=datetime.utcnow(),
                    trial_end=datetime.utcnow() + timedelta(days=14)
                )
                db.add(subscription)
                db.commit()

            # Return success URL for trial
            return f"{frontend_url}/payment/success?plan=trial"

        # Create preference for paid plans
        preference_data = {
            "items": [
                {
                    "id": plan,
                    "title": plan_info["name"],
                    "description": plan_info["description"],
                    "picture_url": f"{frontend_url}/plan-{plan}.png",
                    "category_id": "subscription",
                    "quantity": 1,
                    "currency_id": "USD",
                    "unit_price": plan_info["price"]
                }
            ],
            "payer": {
                "email": user.email,
                "name": user.name
            },
            "back_urls": {
                "success": f"{frontend_url}/payment/success?plan={plan}",
                "failure": f"{frontend_url}/payment/cancel",
                "pending": f"{frontend_url}/payment/pending"
            },
            "auto_return": "approved",
            "external_reference": f"user_{user_id}_plan_{plan}_{datetime.utcnow().timestamp()}",
            "metadata": {
                "user_id": user_id,
                "plan": plan,
                "plan_duration_days": plan_info["duration_days"]
            }
        }

        result = SDK.preference().create(preference_data)

        if result.get("status") == 201:
            return result.get("response", {}).get("init_point")
        else:
            print(f"Error creating MercadoPago preference: {result}")
            return None

    except Exception as e:
        print(f"Error in create_checkout: {str(e)}")
        return None


def handle_webhook(
    data: Dict[str, Any],
    db: Session
) -> bool:
    """
    Handle MercadoPago webhook notifications.

    Args:
        data: Datos del webhook de MercadoPago
        db: Sesión de base de datos

    Returns:
        True si el webhook se procesó correctamente
    """
    try:
        # Verify webhook signature
        notification_type = data.get("type")

        if notification_type == "payment":
            payment_id = data.get("data", {}).get("id")

            # Get payment details from MercadoPago
            payment = SDK.payment().get(payment_id)
            payment_data = payment.get("response", {})

            if payment_data.get("status") == "approved":
                # Extract user_id and plan from external_reference
                external_ref = payment_data.get("external_reference", "")
                parts = external_ref.split("_")

                if len(parts) >= 4:
                    user_id = int(parts[1])
                    plan = parts[3]

                    # Update subscription
                    subscription = db.query(Subscription).filter(
                        Subscription.user_id == user_id
                    ).first()

                    if not subscription:
                        subscription = Subscription(user_id=user_id)

                    subscription.plan = plan
                    subscription.status = "active"
                    subscription.created_at = datetime.utcnow()
                    subscription.updated_at = datetime.utcnow()

                    # Set expiration date based on plan
                    plan_info = PLANS.get(plan, {})
                    duration_days = plan_info.get("duration_days", 30)
                    subscription.trial_end = datetime.utcnow() + timedelta(days=duration_days)

                    db.add(subscription)
                    db.commit()

                    return True

        return False

    except Exception as e:
        print(f"Error handling webhook: {str(e)}")
        return False


def check_subscription_status(
    user_id: int,
    db: Session
) -> Dict[str, Any]:
    """
    Check the current subscription status for a user.

    Args:
        user_id: ID del usuario
        db: Sesión de base de datos

    Returns:
        Diccionario con estado de suscripción
    """
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        ).order_by(Subscription.created_at.desc()).first()

        if not subscription:
            return {
                "has_subscription": False,
                "plan": "none",
                "status": "no_subscription",
                "expires_at": None
            }

        # Check if subscription has expired
        if subscription.trial_end and subscription.trial_end < datetime.utcnow():
            subscription.status = "expired"
            db.commit()
            return {
                "has_subscription": False,
                "plan": subscription.plan,
                "status": "expired",
                "expires_at": subscription.trial_end.isoformat()
            }

        return {
            "has_subscription": True,
            "plan": subscription.plan,
            "status": subscription.status,
            "expires_at": subscription.trial_end.isoformat() if subscription.trial_end else None,
            "created_at": subscription.created_at.isoformat()
        }

    except Exception as e:
        print(f"Error checking subscription: {str(e)}")
        return {
            "has_subscription": False,
            "plan": "none",
            "status": "error",
            "expires_at": None
        }


def cancel_subscription(user_id: int, db: Session) -> bool:
    """
    Cancel a user's subscription.

    Args:
        user_id: ID del usuario
        db: Sesión de base de datos

    Returns:
        True si la cancelación fue exitosa
    """
    try:
        subscription = db.query(Subscription).filter(
            Subscription.user_id == user_id,
            Subscription.status == "active"
        ).first()

        if subscription:
            subscription.status = "cancelled"
            subscription.updated_at = datetime.utcnow()
            db.commit()
            return True

        return False

    except Exception as e:
        print(f"Error cancelling subscription: {str(e)}")
        return False


def get_available_plans() -> Dict[str, Dict[str, Any]]:
    """
    Get all available subscription plans.

    Returns:
        Diccionario con todos los planes disponibles
    """
    return PLANS
