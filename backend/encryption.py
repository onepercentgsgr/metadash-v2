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
try:
    encryptor = CredentialEncryptor()
except ValueError as e:
    logger.warning(f"Encryption not available: {e}. Using plaintext fallback.")
    encryptor = None


def encrypt_credential(value: str) -> str:
    """Encrypt credential value."""
    if not encryptor or not value:
        return value
    return encryptor.encrypt(value)


def decrypt_credential(value: str) -> str:
    """Decrypt credential value."""
    if not encryptor or not value:
        return value
    return encryptor.decrypt(value)
