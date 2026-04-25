"""
Email service for verification, password reset, and notifications.
"""

import os
import logging
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from datetime import datetime, timedelta
import jwt
from typing import Optional

logger = logging.getLogger(__name__)


class EmailService:
    """Service for sending emails via SMTP."""

    def __init__(self):
        self.smtp_host = os.getenv("SMTP_HOST", "smtp.gmail.com")
        self.smtp_port = int(os.getenv("SMTP_PORT", "587"))
        self.smtp_user = os.getenv("SMTP_USER")
        self.smtp_password = os.getenv("SMTP_PASSWORD")
        self.from_email = os.getenv("SMTP_FROM", "noreply@metadash.com")
        self.enabled = bool(self.smtp_user and self.smtp_password)

    def send_email(self, to: str, subject: str, html_content: str) -> bool:
        """Send HTML email."""
        if not self.enabled:
            logger.warning(f"Email service disabled. Would send to {to}: {subject}")
            return False

        try:
            msg = MIMEMultipart("alternative")
            msg["Subject"] = subject
            msg["From"] = self.from_email
            msg["To"] = to

            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(self.smtp_host, self.smtp_port) as server:
                server.starttls()
                server.login(self.smtp_user, self.smtp_password)
                server.sendmail(self.from_email, [to], msg.as_string())

            logger.info(f"Email sent to {to}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {to}: {e}")
            return False

    def send_verification_email(self, email: str, verification_token: str) -> bool:
        """Send email verification link."""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        verification_url = f"{frontend_url}/verify-email?token={verification_token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Welcome to MetaDash!</h2>
                <p>Please verify your email address to complete your registration.</p>
                <p>
                    <a href="{verification_url}"
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Verify Email
                    </a>
                </p>
                <p>Or copy and paste this link:</p>
                <p>{verification_url}</p>
                <p>This link will expire in 24 hours.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    If you didn't create this account, please ignore this email.
                </p>
            </body>
        </html>
        """

        return self.send_email(email, "Verify your MetaDash account", html_content)

    def send_password_reset_email(self, email: str, reset_token: str) -> bool:
        """Send password reset link."""
        frontend_url = os.getenv("FRONTEND_URL", "http://localhost:3000")
        reset_url = f"{frontend_url}/reset-password?token={reset_token}"

        html_content = f"""
        <html>
            <body style="font-family: Arial, sans-serif;">
                <h2>Password Reset Request</h2>
                <p>Click the link below to reset your password:</p>
                <p>
                    <a href="{reset_url}"
                       style="background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">
                        Reset Password
                    </a>
                </p>
                <p>This link will expire in 1 hour.</p>
                <hr>
                <p style="color: #666; font-size: 12px;">
                    If you didn't request a password reset, please ignore this email.
                </p>
            </body>
        </html>
        """

        return self.send_email(email, "MetaDash Password Reset", html_content)


def create_verification_token(email: str, expires_in_hours: int = 24) -> str:
    """Create email verification token."""
    from config import SECRET_KEY, ALGORITHM
    payload = {
        "email": email,
        "type": "email_verification",
        "exp": datetime.utcnow() + timedelta(hours=expires_in_hours)
    }
    return jwt.encode(payload, SECRET_KEY, algorithm=ALGORITHM)


def verify_email_token(token: str) -> Optional[str]:
    """Verify email token and return email."""
    from config import SECRET_KEY, ALGORITHM
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        if payload.get("type") != "email_verification":
            return None
        return payload.get("email")
    except jwt.ExpiredSignatureError:
        logger.warning("Email verification token expired")
        return None
    except jwt.InvalidTokenError as e:
        logger.error(f"Invalid email verification token: {e}")
        return None
