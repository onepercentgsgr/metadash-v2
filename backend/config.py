import os
from dotenv import load_dotenv

load_dotenv()


def _get_required_env(key: str, description: str = "") -> str:
    """
    Get a required environment variable.
    Raises ValueError if not set, preventing app startup.
    """
    value = os.getenv(key)
    if not value:
        msg = f"Missing required environment variable: {key}"
        if description:
            msg += f" ({description})"
        raise ValueError(msg)
    return value


# Critical security: These MUST be set via environment variables
SECRET_KEY = _get_required_env("SECRET_KEY", "JWT secret key for token signing")
ADMIN_PASSWORD = _get_required_env("ADMIN_PASSWORD", "Initial admin password")
DATABASE_URL = _get_required_env("DATABASE_URL", "Database connection string")

# Payment secrets (if payments enabled)
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY", "")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET", "")
MERCADOPAGO_ACCESS_TOKEN = os.getenv("MERCADOPAGO_ACCESS_TOKEN", "")
MERCADOPAGO_WEBHOOK_TOKEN = os.getenv("MERCADOPAGO_WEBHOOK_TOKEN", "")

# Non-sensitive configuration
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@metadash.com")
