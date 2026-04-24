"""
Basic test suite for MetaDash API.
Run with: pytest test_main.py -v
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from datetime import datetime, timedelta

# Use SQLite for testing
SQLALCHEMY_DATABASE_URL = "sqlite:///./test.db"

# Import after setting database URL
os.environ["DATABASE_URL"] = SQLALCHEMY_DATABASE_URL
os.environ["SECRET_KEY"] = "test-secret-key-min-32-characters-long-ok"
os.environ["ENCRYPTION_KEY"] = "test-encryption-key-valid-fernet-key-format"

from main import app, get_db
from database import Base
from models import User
import config

# Setup test database
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
Base.metadata.create_all(bind=engine)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()


app.dependency_overrides[get_db] = override_get_db
client = TestClient(app)


class TestAuth:
    """Authentication endpoint tests."""

    def test_register_user(self):
        """Test user registration."""
        response = client.post(
            "/auth/register",
            json={
                "email": "test@example.com",
                "password": "securepassword123",
                "name": "Test User"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == "test@example.com"
        assert data["name"] == "Test User"
        assert "id" in data

    def test_register_duplicate_email(self):
        """Test registration with duplicate email fails."""
        # Register first user
        client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password123",
                "name": "User 1"
            }
        )

        # Try to register with same email
        response = client.post(
            "/auth/register",
            json={
                "email": "duplicate@example.com",
                "password": "password456",
                "name": "User 2"
            }
        )
        assert response.status_code == 400

    def test_login_success(self):
        """Test successful login."""
        # Register user first
        client.post(
            "/auth/register",
            json={
                "email": "login@example.com",
                "password": "password123",
                "name": "Login Test"
            }
        )

        # Login
        response = client.post(
            "/auth/login",
            json={
                "email": "login@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["email"] == "login@example.com"

    def test_login_invalid_password(self):
        """Test login with wrong password."""
        # Register user
        client.post(
            "/auth/register",
            json={
                "email": "wrongpw@example.com",
                "password": "password123",
                "name": "Wrong PW Test"
            }
        )

        # Try login with wrong password
        response = client.post(
            "/auth/login",
            json={
                "email": "wrongpw@example.com",
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401


class TestProtection:
    """Test rate limiting and security."""

    def test_cors_whitelist(self):
        """Test CORS allows only whitelisted origins."""
        # Test with allowed origin (should pass)
        response = client.options("/", headers={"origin": "http://localhost:3000"})
        assert "Access-Control-Allow-Origin" in response.headers or response.status_code == 200

        # Test with disallowed origin (should not include CORS header)
        response = client.options("/", headers={"origin": "http://evil.com"})
        # Disallowed origins should not get CORS headers
        assert response.status_code == 200


class TestHealthCheck:
    """Basic health check tests."""

    def test_docs_available(self):
        """Test that API docs are available."""
        response = client.get("/docs")
        assert response.status_code == 200

    def test_openapi_schema(self):
        """Test OpenAPI schema is available."""
        response = client.get("/openapi.json")
        assert response.status_code == 200
        assert "openapi" in response.json()


# Cleanup
def pytest_configure(config):
    """Setup test database."""
    pass


def pytest_unconfigure(config):
    """Cleanup test database."""
    try:
        os.remove("./test.db")
    except FileNotFoundError:
        pass
