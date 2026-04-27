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
import logging
import jwt
import config

load_dotenv()

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/payments", tags=["payments"])

# Environment variables
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
MERCADOPAGO_WEBHOOK_TOKEN = os.getenv("MERCADOPAGO_WEBHOOK_TOKEN", "")
FRONTEND_URL = os.getenv("FRONTEND_URL", "http://localhost:3000")


def _verify_token(token: str) -> dict:
    """Verify JWT token and return payload."""
    try:
        payload = jwt.decode(token, config.SECRET_KEY, algorithms=[config.ALGORITHM])
        sub = payload.get("sub")
        if sub is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )
        # sub is stored as string in JWT, convert to int
        try:
            user_id = int(sub)
        except (ValueError, TypeError):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: bad user ID"
            )
        return {"user_id": user_id}
    except jwt.ExpiredSignatureError:
        logger.warning("Expired JWT token attempted")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Token expired")
    except jwt.InvalidTokenError as e:
        logger.warning(f"Invalid JWT token attempted: {type(e).__name__}")
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")


def get_current_user(
    request: Request,
    db: Session = Depends(get_db)
) -> User:
    """
    Get current user from JWT token in Authorization header.
    Performs full JWT validation and database lookup.
    """
    auth_header = request.headers.get("Authorization")
    if not auth_header:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing authorization header"
        )

    try:
        # Extract token from "Bearer <token>" format
        token = auth_header.replace("Bearer ", "")
        if not token or token == auth_header:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid authorization header format"
            )

        # Verify token
        payload = _verify_token(token)
        user_id = payload.get("user_id")

        # Get user from database
        user = db.query(User).filter(User.id == user_id).first()
        if not user:
            logger.warning(f"User ID {user_id} from token not found in database")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        return user
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Unexpected error in get_current_user: {type(e).__name__}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Authentication failed"
        )


@router.post("/create-checkout")
async def create_mercadopago_checkout(
    plan: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a MercadoPago checkout preference for a subscription plan.

    Parámetros:
    - plan: Plan a contratar (trial, starter, pro, enterprise)
    """
    try:
        # Validate plan
        valid_plans = payments.get_available_plans()
        if plan not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan '{plan}' is not valid"
            )

        # Create checkout
        checkout_url = payments.create_checkout(
            user_id=user.id,
            plan=plan,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if not checkout_url:
            logger.error(f"Failed to create checkout for user {user.id}, plan {plan}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create payment checkout"
            )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "plan": plan,
            "message": f"Checkout created for plan {plan}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating checkout for user {user.id}: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating checkout"
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
            logger.warning("Invalid MercadoPago webhook token attempted")
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid webhook token"
            )

        # Process webhook
        success = payments.handle_webhook(body, db)

        if success:
            return {
                "status": "success",
                "message": "Webhook processed successfully"
            }
        else:
            return {
                "status": "processed",
                "message": "Webhook processed"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"MercadoPago webhook error: {type(e).__name__}: {str(e)}")
        return {
            "status": "error",
            "message": "Webhook processing failed"
        }


@router.post("/stripe/create-checkout")
async def create_stripe_checkout(
    plan: str,
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Create a Stripe checkout session for a subscription plan.

    Parámetros:
    - plan: Plan a contratar (trial, starter, pro, enterprise)
    """
    try:
        # Validate plan
        valid_plans = stripe_payments.get_available_plans()
        if plan not in valid_plans:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Plan '{plan}' is not valid"
            )

        # Create checkout session
        checkout_url = stripe_payments.create_checkout_session(
            user_id=user.id,
            plan=plan,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if not checkout_url:
            logger.error(f"Failed to create Stripe checkout for user {user.id}, plan {plan}")
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Could not create payment session"
            )

        return {
            "success": True,
            "checkout_url": checkout_url,
            "plan": plan,
            "message": f"Payment session created for plan {plan}"
        }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating Stripe checkout for user {user.id}: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while creating payment session"
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
            logger.warning("Invalid Stripe webhook signature attempted")
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid webhook signature"
            )

        # Process event
        success = stripe_payments.handle_webhook(event, db)

        if success:
            return {
                "status": "success",
                "message": "Stripe event processed successfully"
            }
        else:
            return {
                "status": "processed",
                "message": "Stripe event processed"
            }

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Stripe webhook error: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An error occurred while processing webhook"
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
        logger.error(f"Error getting subscription plans: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve subscription plans"
        )


@router.get("/status")
async def get_subscription_status(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get subscription status for the current user.
    """
    try:
        status_info = payments.check_subscription_status(user.id, db)
        return {
            "success": True,
            "subscription": status_info
        }
    except Exception as e:
        logger.error(f"Error getting subscription status for user {user.id}: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve subscription status"
        )


@router.post("/cancel")
async def cancel_subscription(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Cancel the current user's subscription.
    """
    try:
        success = payments.cancel_subscription(user.id, db)

        if success:
            return {
                "success": True,
                "message": "Subscription cancelled successfully"
            }
        else:
            logger.warning(f"Subscription not found for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Subscription not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error cancelling subscription for user {user.id}: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not cancel subscription"
        )


@router.get("/stripe/portal")
async def get_stripe_portal(
    user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """
    Get Stripe customer portal URL for subscription management.
    """
    try:
        portal_url = stripe_payments.get_customer_portal_url(
            user_id=user.id,
            db=db,
            frontend_url=FRONTEND_URL
        )

        if portal_url:
            return {
                "success": True,
                "portal_url": portal_url
            }
        else:
            logger.warning(f"Stripe portal not found for user {user.id}")
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Stripe portal not found"
            )

    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting Stripe portal for user {user.id}: {type(e).__name__}: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Could not retrieve portal"
        )
