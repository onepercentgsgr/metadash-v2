"""
Autonomous Audit Scheduler
Runs every 6 hours automatically for each active user.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime
import pytz
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
from models import User, AutonomousActionLog
from agents import run_full_audit
import os

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=pytz.UTC)


def run_autonomous_audit_for_user(user_id: int):
    """
    Run a full autonomous audit for a single user.

    Triggers:
    - Optimizer (pauses campaigns, rotates creatives)
    - Finance analysis (checks margins, alerts on risk)
    - GA4 analysis (correlates with ads performance)
    - CEO synthesis (decides what to do)

    Logs all "important" actions (pauses, alerts, recommendations).
    """
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.id == user_id).first()
        if not user or not user.is_active:
            logger.warning(f"Skipping audit for inactive user {user_id}")
            return

        tenant_config = user.tenant_config
        if not tenant_config or not tenant_config.anthropic_api_key:
            logger.warning(f"User {user_id} not fully configured, skipping autonomous audit")
            return

        logger.info(f"[Autonomous Audit] Starting for user {user_id} ({user.email})")

        # Build context from available data
        campaigns = []  # TODO: fetch from Meta API
        creatives = []  # TODO: fetch from Meta API
        financial = {}  # TODO: fetch from financial_records

        # Run the full audit
        audit_result = run_full_audit(
            campaigns_data=campaigns,
            creatives_data=creatives,
            financial_data=financial,
            landing_url=tenant_config.landing_page_url or "",
            negocio_info=tenant_config.negocio_info or "",
            api_key=tenant_config.anthropic_api_key,
        )

        # Parse results and create action logs
        # This is a simplified version — you'd parse the audit_result more thoroughly
        log_entry = AutonomousActionLog(
            user_id=user_id,
            action_type="autonomous_audit",
            status="executed",
            target="all_campaigns",
            description="Autonomous audit completed and analyzed",
            details={
                "audit_result": audit_result[:500],  # First 500 chars
                "timestamp": datetime.utcnow().isoformat(),
            },
            triggered_by="orchestrator",
            executed_at=datetime.utcnow(),
        )
        db.add(log_entry)
        db.commit()

        logger.info(f"[Autonomous Audit] Completed for user {user_id}")

    except Exception as e:
        logger.error(f"[Autonomous Audit] Error for user {user_id}: {type(e).__name__}: {str(e)}")
        try:
            error_log = AutonomousActionLog(
                user_id=user_id,
                action_type="autonomous_audit",
                status="failed",
                target="all_campaigns",
                description="Autonomous audit failed",
                details={"error": str(e)},
                triggered_by="orchestrator",
            )
            db.add(error_log)
            db.commit()
        except:
            pass

    finally:
        db.close()


def schedule_autonomous_audits():
    """
    Schedule autonomous audits for all active users.
    Called on app startup.
    """
    db = SessionLocal()
    try:
        active_users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"Scheduling autonomous audits for {len(active_users)} active users")

        for user in active_users:
            # Schedule each user's audit to run every 6 hours
            job_id = f"autonomous_audit_{user.id}"

            # Remove existing job if it exists
            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)

            # Schedule new job
            scheduler.add_job(
                run_autonomous_audit_for_user,
                IntervalTrigger(hours=6),
                args=[user.id],
                id=job_id,
                name=f"Autonomous Audit for User {user.id}",
                replace_existing=True,
            )

        if not scheduler.running:
            scheduler.start()
            logger.info("Scheduler started")

    except Exception as e:
        logger.error(f"Error scheduling audits: {type(e).__name__}: {str(e)}")

    finally:
        db.close()


def stop_scheduler():
    """Stop the scheduler (call on app shutdown)."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
