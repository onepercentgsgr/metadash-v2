"""
Shared Memory Store - All agents read/write to the same notebook.
This is the core of the multi-agent collaboration system.
"""

import json
import logging
from datetime import datetime
from typing import Optional, Any
from sqlalchemy.orm import Session
from sqlalchemy import Column, Integer, String, Text, DateTime, JSON
from database import Base

logger = logging.getLogger(__name__)


class AgentMemory(Base):
    """Persistent memory store shared across all agents."""
    __tablename__ = "agent_memory"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, index=True)
    memory_type = Column(String)  # "campaign", "product", "insight", "decision"
    key = Column(String, index=True)
    value = Column(Text)
    agent_source = Column(String)  # which agent wrote this
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)


class SharedMemoryStore:
    """
    The shared notebook all agents write to and read from.
    When one agent learns something, ALL agents benefit.
    """

    def __init__(self, db: Session, user_id: int):
        self.db = db
        self.user_id = user_id

    def write(self, key: str, value: Any, agent: str, memory_type: str = "insight") -> None:
        """Write to shared memory. Any agent can write."""
        existing = self.db.query(AgentMemory).filter(
            AgentMemory.user_id == self.user_id,
            AgentMemory.key == key
        ).first()

        serialized = json.dumps(value, ensure_ascii=False) if not isinstance(value, str) else value

        if existing:
            existing.value = serialized
            existing.agent_source = agent
            existing.updated_at = datetime.utcnow()
        else:
            entry = AgentMemory(
                user_id=self.user_id,
                memory_type=memory_type,
                key=key,
                value=serialized,
                agent_source=agent
            )
            self.db.add(entry)

        self.db.commit()
        logger.info(f"[{agent}] wrote to memory: {key}")

    def read(self, key: str) -> Optional[Any]:
        """Read from shared memory. Any agent can read."""
        entry = self.db.query(AgentMemory).filter(
            AgentMemory.user_id == self.user_id,
            AgentMemory.key == key
        ).first()

        if not entry:
            return None

        try:
            return json.loads(entry.value)
        except (json.JSONDecodeError, TypeError):
            return entry.value

    def read_all(self, memory_type: Optional[str] = None) -> dict:
        """Read the full shared notebook."""
        query = self.db.query(AgentMemory).filter(
            AgentMemory.user_id == self.user_id
        )
        if memory_type:
            query = query.filter(AgentMemory.memory_type == memory_type)

        entries = query.all()
        return {
            e.key: {
                "value": json.loads(e.value) if self._is_json(e.value) else e.value,
                "agent": e.agent_source,
                "type": e.memory_type,
                "updated": e.updated_at.isoformat()
            }
            for e in entries
        }

    def get_full_context(self) -> dict:
        """
        Returns the complete context that all agents share.
        This is the 'cuaderno' all agents read before acting.
        """
        memory = self.read_all()

        return {
            "pais": self._get("pais", memory, "LATAM"),
            "moneda": self._get("moneda", memory, "USD"),
            "product": {
                "nombre": self._get("product.nombre", memory, ""),
                "nicho": self._get("product.nicho", memory, ""),
                "precio": self._get("product.precio", memory, ""),
                "publico": self._get("product.publico", memory, ""),
                "diferencial": self._get("product.diferencial", memory, ""),
            },
            "campaign_data": {
                "roas": self._get("metrics.roas", memory, 0),
                "cpl": self._get("metrics.cpl", memory, 0),
                "ctr": self._get("metrics.ctr", memory, 0),
                "cvr": self._get("metrics.cvr", memory, 0),
                "spend": self._get("metrics.spend", memory, 0),
                "revenue": self._get("metrics.revenue", memory, 0),
                "frecuencia": self._get("metrics.frecuencia", memory, 0),
            },
            "winning_creatives": self._get("winning_creatives", memory, []),
            "failed_angles": self._get("failed_angles", memory, []),
            "best_audience": self._get("best_audience", memory, ""),
            "last_insights": self._get("last_insights", memory, []),
            "tiktok_performance": self._get("tiktok_performance", memory, {}),
            "onboarding_stage": self._get("onboarding_stage", memory, "new"),
            "full_memory": memory
        }

    def update_campaign_metrics(self, metrics: dict, agent: str = "user") -> None:
        """Update campaign metrics so all agents see current data."""
        for key, value in metrics.items():
            self.write(f"metrics.{key}", value, agent, "campaign")

    def add_insight(self, insight: str, agent: str) -> None:
        """Add an insight to the shared notebook."""
        insights = self.read("last_insights") or []
        insights.insert(0, {
            "text": insight,
            "agent": agent,
            "date": datetime.utcnow().isoformat()
        })
        self.write("last_insights", insights[:20], agent, "insight")

    def mark_winning_creative(self, creative: str, roas: float, agent: str) -> None:
        """Mark a creative as winner so all agents know what works."""
        winners = self.read("winning_creatives") or []
        winners.insert(0, {
            "creative": creative,
            "roas": roas,
            "date": datetime.utcnow().isoformat(),
            "agent": agent
        })
        self.write("winning_creatives", winners[:10], agent, "creative")

    def _get(self, key: str, memory: dict, default: Any) -> Any:
        entry = memory.get(key)
        if entry:
            return entry.get("value", default)
        return default

    def _is_json(self, s: str) -> bool:
        try:
            json.loads(s)
            return True
        except (ValueError, TypeError):
            return False
