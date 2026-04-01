import os

SECRET_KEY = os.getenv("SECRET_KEY", "metadash-secret-change-in-production")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24  # 24 hours
ADMIN_EMAIL = os.getenv("ADMIN_EMAIL", "admin@metadash.com")
ADMIN_PASSWORD = os.getenv("ADMIN_PASSWORD", "admin2024")
