"""
Stripe integration module for MetaDash subscription payments
"""
import os
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import stripe
from sqlalchemy.orm import Session
from models import User, Subscription
from dotenv import load_dotenv

load_dotenv()

# Initialize Stripe
stripe.api_key = os.getenv("STRIPE_SECRET_KEY", "")

# Plan definitions in USD
STRIPE_PLANS = {
    "trial": {
        "name": "Plan de Prueba",
        "price": 0,
        "duration_days": 14,
        "description": "Acceso completo por 14 días",
        "stripe_price_id": None
    },
    "starter": {
        "name": "Plan Iniciador",
        "price": 2900,  # in cents
        "duration_days": 30,
        "description": "5 agentes de IA, análisis básico, soporte por email",
        "stripe_price_id": os.getenv("STRIPE_STARTER_PRICE_ID", "price_starter")
    },
    "pro": {
        "name": "Plan Profesional",
        "price": 7900,  # in cents
        "duration_days": 30,
        "description": "Agentes ilimitados, análisis avanzado, webhooks, soporte prioritario",
        "stripe_price_id": os.getenv("STRIPE_PRO_PRICE_ID", "price_pro")
    },
    "enterprise": {
        "name": "Plan Empresarial",
        "price": 19900,  # in cents
        "duration_days": 30,
        "description": "Todo incluido, API dedicada, SLA garantizado, gestor de cuenta",
        "stripe_price_id": os.getenv("STRIPE_ENTERPRISE_PRICE_ID", "price_enterprise")
    }
}


def create_checkout_session(
    user_id: int,
    plan: str,
    db: Session,
    frontend_url: str = "http://localhost:3000"
) -> Optional[str]:
    """
    Create a Stripe checkout session for a subscription plan.

    Args:
        user_id: ID del usuario
        plan: Plan a contratar (trial, starter, pro, enterprise)
        db: Sesión de base de datos
        frontend_url: URL del frontend para redirecciones

    Returns:
        URL de sesión de checkout de Stripe o None si hay error
    """
    try:
        if plan not in STRIPE_PLANS:
            raise ValueError(f"Plan '{plan}' no válido")

        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            raise ValueError(f"Usuario con ID {user_id} no encontrado")

        plan_info = STRIPE_PLANS[plan]

        # If trial plan, create subscription without payment
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

            return f"{frontend_url}/payment/success?plan=trial"

        # Get or create Stripe customer
        customer = stripe.Customer.list(email=user.email, limit=1)

        if customer.data:
            customer_id = customer.data[0].id
        else:
            customer = stripe.Customer.create(
                email=user.email,
                name=user.name,
                metadata={"user_id": user_id}
            )
            customer_id = customer.id

        # Create checkout session for paid plans
        session = stripe.checkout.Session.create(
            customer=customer_id,
            payment_method_types=["card"],
            line_items=[
                {
                    "price": plan_info["stripe_price_id"],
                    "quantity": 1
                }
            ],
            mode="subscription",
            success_url=f"{frontend_url}/payment/success?session_id=" + "{CHECKOUT_SESSION_ID}&plan={plan}",
            cancel_url=f"{frontend_url}/payment/cancel",
            metadata={
                "user_id": user_id,
                "plan": plan
            }
        )

        return session.url

    except Exception as e:
        print(f"Error creating Stripe checkout session: {str(e)}")
        return None


def handle_webhook(
    event: Dict[str, Any],
    db: Session
) -> bool:
    """
    Handle Stripe webhook events.

    Args:
        event: Evento del webhook de Stripe
        db: Sesión de base de datos

    Returns:
        True si el webhook se procesó correctamente
    """
    try:
        event_type = event.get("type")

        if event_type == "customer.subscription.created" or event_type == "customer.subscription.updated":
            subscription_data = event.get("data", {}).get("object", {})
            customer_id = subscription_data.get("customer")
            status = subscription_data.get("status")

            # Get customer metadata
            customer = stripe.Customer.retrieve(customer_id)
            user_id = customer.metadata.get("user_id")

            if user_id:
                # Find plan from subscription items
                plan = "pro"  # default
                items = subscription_data.get("items", {}).get("data", [])
                if items:
                    price_id = items[0].get("price", {}).get("id")
                    # Match price_id to plan
                    for plan_key, plan_info in STRIPE_PLANS.items():
                        if plan_info["stripe_price_id"] == price_id:
                            plan = plan_key
                            break

                # Update or create subscription
                subscription = db.query(Subscription).filter(
                    Subscription.user_id == user_id
                ).first()

                if not subscription:
                    subscription = Subscription(user_id=user_id)

                subscription.plan = plan
                subscription.status = "active" if status == "active" else "expired"
                subscription.created_at = datetime.utcnow()
                subscription.updated_at = datetime.utcnow()

                # Set expiration date
                plan_info = STRIPE_PLANS.get(plan, {})
                duration_days = plan_info.get("duration_days", 30)
                subscription.trial_end = datetime.utcnow() + timedelta(days=duration_days)

                db.add(subscription)
                db.commit()

                return True

        elif event_type == "customer.subscription.deleted":
            subscription_data = event.get("data", {}).get("object", {})
            customer_id = subscription_data.get("customer")

            customer = stripe.Customer.retrieve(customer_id)
            user_id = customer.metadata.get("user_id")

            if user_id:
                subscription = db.query(Subscription).filter(
                    Subscription.user_id == user_id
                ).first()

                if subscription:
                    subscription.status = "cancelled"
                    subscription.updated_at = datetime.utcnow()
                    db.commit()
                    return True

        return False

    except Exception as e:
        print(f"Error handling Stripe webhook: {str(e)}")
        return False


def get_customer_portal_url(
    user_id: int,
    db: Session,
    frontend_url: str = "http://localhost:3000"
) -> Optional[str]:
    """
    Get Stripe customer portal URL for subscription management.

    Args:
        user_id: ID del usuario
        db: Sesión de base de datos
        frontend_url: URL del frontend para redirecciones

    Returns:
        URL del portal de cliente de Stripe o None si hay error
    """
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            return None

        # Find Stripe customer
        customer = stripe.Customer.list(email=user.email, limit=1)

        if not customer.data:
            return None

        customer_id = customer.data[0].id

        # Create portal session
        session = stripe.billing_portal.Session.create(
            customer=customer_id,
            return_url=f"{frontend_url}/dashboard"
        )

        return session.url

    except Exception as e:
        print(f"Error getting customer portal: {str(e)}")
        return None


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
    return {k: {**v, "stripe_price_id": None} for k, v in STRIPE_PLANS.items()}
