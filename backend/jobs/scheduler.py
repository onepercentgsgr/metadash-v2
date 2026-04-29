"""
Autonomous Audit Scheduler
Runs every 6 hours automatically for each active user.
Also sends trial expiration emails and generates daily TikTok videos.
"""

import logging
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger
from datetime import datetime, timedelta
import pytz
from sqlalchemy.orm import Session
from database import engine, get_db, SessionLocal
from models import User, AutonomousActionLog, Subscription
from agents import run_full_audit
from email_service import EmailService
import os

logger = logging.getLogger(__name__)

scheduler = BackgroundScheduler(timezone=pytz.UTC)


def run_autonomous_audit_for_user(user_id: int):
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

        campaigns = []
        creatives = []
        financial = {}

        audit_result = run_full_audit(
            campaigns_data=campaigns,
            creatives_data=creatives,
            financial_data=financial,
            landing_url=tenant_config.landing_page_url or "",
            negocio_info=tenant_config.negocio_info or "",
            api_key=tenant_config.anthropic_api_key,
        )

        log_entry = AutonomousActionLog(
            user_id=user_id,
            action_type="autonomous_audit",
            status="executed",
            target="all_campaigns",
            description="Autonomous audit completed and analyzed",
            details={
                "audit_result": audit_result[:500],
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


def generate_daily_tiktok_videos():
    """Daily at 9 AM — generates 1 TikTok video for every paid active user."""
    from models import GeneratedVideo
    from agents.tiktok_creator import TikTokCreatorAgent
    from agents.shared_memory import SharedMemoryStore
    from datetime import date

    db = SessionLocal()
    try:
        today = date.today().isoformat()
        paid_users = db.query(User).filter(
            User.is_active == True,
            User.has_paid == True,
        ).all()
        logger.info(f"[Daily TikTok] {len(paid_users)} paid users — {today}")

        angles = [
            "dolor + agitación", "transformación before/after",
            "detrás de escena / autenticidad", "mito vs. realidad del nicho",
            "tutorial rápido de valor gratuito", "testimonial/resultado real",
            "tendencia + nicho (trend hijacking)",
        ]
        angle = angles[date.today().weekday() % len(angles)]

        for user in paid_users:
            if db.query(GeneratedVideo).filter(
                GeneratedVideo.user_id == user.id,
                GeneratedVideo.date == today,
            ).first():
                continue

            tenant_config = user.tenant_config
            if not tenant_config or not tenant_config.anthropic_api_key:
                continue
            try:
                memory = SharedMemoryStore(db, user.id)
                ctx = {**memory.get_full_context(), "angulo": angle}
                result = TikTokCreatorAgent(api_key=tenant_config.anthropic_api_key).generate_daily_video(ctx)
                db.add(GeneratedVideo(
                    user_id=user.id,
                    content=result.get("content", ""),
                    angle=result.get("angulo", angle),
                    date=today,
                ))
                db.commit()
                logger.info(f"[Daily TikTok] Generated for user {user.id}")
            except Exception as e:
                logger.error(f"[Daily TikTok] Error for user {user.id}: {e}")
    except Exception as e:
        logger.error(f"[Daily TikTok] Fatal: {e}")
    finally:
        db.close()


def check_and_send_trial_expiration_emails():
    """
    Daily job: check for users with expiring trials and send emails.
    Sends emails 3 days before, 1 day before, and on expiration date.
    """
    db = SessionLocal()
    email_service = EmailService()
    try:
        now = datetime.utcnow()
        users = db.query(User).filter(User.is_active == True).all()

        for user in users:
            sub = db.query(Subscription).filter(
                Subscription.user_id == user.id,
                Subscription.status == "trial"
            ).order_by(Subscription.created_at.desc()).first()

            if not sub or not sub.trial_end:
                continue

            days_until_expire = (sub.trial_end.date() - now.date()).days

            if days_until_expire == 3:
                logger.info(f"[Trial Expiration] Sending 3-day notice to {user.email}")
                email_service.send_trial_expires_soon_email(user.email, user.name, 3)

            elif days_until_expire == 1:
                logger.info(f"[Trial Expiration] Sending 1-day notice to {user.email}")
                email_service.send_trial_expires_soon_email(user.email, user.name, 1)

            elif days_until_expire == 0 and not user.has_paid:
                logger.info(f"[Trial Expiration] Sending expiration notice to {user.email}")
                email_service.send_trial_expired_email(user.email, user.name)
                sub.status = "expired"
                db.commit()

    except Exception as e:
        logger.error(f"[Trial Expiration] Error: {type(e).__name__}: {str(e)}")
    finally:
        db.close()


def schedule_autonomous_audits():
    """
    Schedule autonomous audits + daily TikTok videos + trial expiration emails.
    Called on app startup.
    """
    db = SessionLocal()
    try:
        active_users = db.query(User).filter(User.is_active == True).all()
        logger.info(f"Scheduling jobs for {len(active_users)} active users")

        for user in active_users:
            job_id = f"autonomous_audit_{user.id}"
            if scheduler.get_job(job_id):
                scheduler.remove_job(job_id)
            scheduler.add_job(
                run_autonomous_audit_for_user,
                IntervalTrigger(hours=6),
                args=[user.id],
                id=job_id,
                name=f"Autonomous Audit for User {user.id}",
                replace_existing=True,
            )

        scheduler.add_job(
            generate_daily_tiktok_videos,
            "cron", hour=9, minute=0,
            id="daily_tiktok_videos",
            name="Daily TikTok Video Generation",
            replace_existing=True,
        )

        scheduler.add_job(
            check_and_send_trial_expiration_emails,
            "cron", hour=8, minute=0,
            id="trial_expiration_check",
            name="Trial Expiration Email Check",
            replace_existing=True,
        )

        if not scheduler.running:
            scheduler.start()
            logger.info("Scheduler started (audits + daily TikTok 9 AM UTC + trial emails 8 AM UTC)")

    except Exception as e:
        logger.error(f"Error scheduling audits: {type(e).__name__}: {str(e)}")

    finally:
        db.close()


def stop_scheduler():
    """Stop the scheduler (call on app shutdown)."""
    if scheduler.running:
        scheduler.shutdown()
        logger.info("Scheduler stopped")
