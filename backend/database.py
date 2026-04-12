from sqlalchemy import create_engine
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker
import os
import logging

logger = logging.getLogger(__name__)

DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./metadash.db")
if DATABASE_URL.startswith("postgres://"):
    DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

# Connection pool config for production PostgreSQL
is_sqlite = DATABASE_URL.startswith("sqlite")
engine_kwargs = {"pool_pre_ping": True}

if not is_sqlite:
    engine_kwargs.update({
        "pool_size": 10,           # Connections permanentes
        "max_overflow": 20,        # Connections extras bajo carga
        "pool_timeout": 30,        # Timeout para obtener connection
        "pool_recycle": 1800,      # Reciclar connections cada 30min (Railway cierra idle)
    })

engine = create_engine(DATABASE_URL, **engine_kwargs)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    except Exception:
        db.rollback()
        raise
    finally:
        db.close()
