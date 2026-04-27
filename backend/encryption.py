"""
Credential encryption module for sensitive API keys and tokens.
Uses Fernet symmetric encryption from cryptography library.
"""

from cryptography.fernet import Fernet
import os
import logging

logger = logging.getLogger(__name__)


class CredentialEncryptor:
    """Encrypts and decrypts sensitive credentials."""

    def __init__(self):
        """Initialize encryptor with key from environment."""
        master_key = os.getenv("ENCRYPTION_KEY")
        if not master_key:
            raise ValueError(
                "ENCRYPTION_KEY not set. Generate one with: "
                "python -c \"from cryptography.fernet import Fernet; print(Fernet.generate_key().decode())\""
            )

        self.cipher = Fernet(master_key.encode())

    def encrypt(self, value: str) -> str:
        """Encrypt a plaintext string."""
        if not value:
            return ""
        try:
            encrypted = self.cipher.encrypt(value.encode())
            return encrypted.decode()
        except Exception as e:
            logger.error(f"Encryption error: {e}")
            raise

    def decrypt(self, encrypted_value: str) -> str:
        """Decrypt an encrypted string."""
        if not encrypted_value:
            return ""
        try:
            decrypted = self.cipher.decrypt(encrypted_value.encode())
            return decrypted.decode()
        except Exception as e:
            logger.error(f"Decryption error: {e}")
            raise


# Global encryptor instance
_is_dev = os.getenv("ENVIRONMENT", "development") != "production"

try:
    encryptor = CredentialEncryptor()
except ValueError as e:
    if not _is_dev:
        raise  # In production, ENCRYPTION_KEY is mandatory
    logger.warning(f"⚠️ ENCRYPTION DISABLED (dev mode): {e}. Credentials stored as plaintext.")
    encryptor = None


def encrypt_credential(value: str) -> str:
    """Encrypt credential value. Fails in production if encryption unavailable."""
    if not value:
        return value
    if not encryptor:
        if not _is_dev:
            raise RuntimeError("ENCRYPTION_KEY not set — cannot store credentials in production")
        return value
    return encryptor.encrypt(value)


def decrypt_credential(value: str) -> str:
    """Decrypt credential value. Falls back to plaintext only in dev."""
    if not value:
        return value
    if not encryptor:
        return value
    try:
        return encryptor.decrypt(value)
    except Exception:
        # Value may have been stored as plaintext before encryption was enabled
        logger.warning("Decryption failed — returning raw value (possibly pre-encryption data)")
        return value
