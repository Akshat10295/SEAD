from sqlalchemy.orm import Session
from app.repositories.token_repo import TokenRepository
from app.repositories.counter_repo import CounterRepository
from app.repositories.log_repo import LogRepository
from app.repositories.user_repo import UserRepository
from app.core.security import verify_password
from app.core.exceptions import UnauthorizedError, BadRequestError
from app.schemas.schemas import AdminStatsOut, LogOut
from typing import List
import logging

logger = logging.getLogger(__name__)


class AdminService:
    def __init__(self, db: Session):
        self.db = db
        self.token_repo = TokenRepository(db)
        self.counter_repo = CounterRepository(db)
        self.log_repo = LogRepository(db)
        self.user_repo = UserRepository(db)

    def get_stats(self) -> AdminStatsOut:
        return AdminStatsOut(
            total_waiting=self.token_repo.count_by_status("waiting"),
            total_serving=self.token_repo.count_by_status("serving"),
            total_completed=self.token_repo.count_by_status("completed"),
            active_counters=self.counter_repo.count_active(),
            total_counters=len(self.counter_repo.get_all()),
        )

    def reset_queue(self, admin_id: int, confirm_password: str) -> dict:
        admin = self.user_repo.get_by_id(admin_id)
        if not admin or not verify_password(confirm_password, admin.hashed_password):
            raise UnauthorizedError("Invalid password confirmation")

        try:
            from sqlalchemy import text
            from datetime import datetime, timezone

            self.db.execute(
                text(
                    "UPDATE tokens SET status='completed', completed_at=:now "
                    "WHERE status IN ('waiting','serving')"
                ),
                {"now": datetime.now(timezone.utc)},
            )
            self.db.execute(text("UPDATE counters SET current_token_id=NULL"))
            self.log_repo.create(
                action="SYSTEM_RESET",
                performed_by=admin_id,
                details="Admin performed full queue reset",
            )
            self.db.commit()
            logger.warning(f"Queue reset by admin {admin_id}")
            return {"message": "Queue reset successfully"}
        except Exception as e:
            self.db.rollback()
            logger.error(f"Reset failed: {e}")
            raise

    def get_logs(self, limit: int = 100) -> List[LogOut]:
        logs = self.log_repo.get_recent(limit)
        return [LogOut.model_validate(l) for l in logs]

    def ensure_default_counters(self, count: int = 3):
        """Create default counters if none exist."""
        existing = self.counter_repo.get_all()
        if not existing:
            for _ in range(count):
                self.counter_repo.create()
            self.db.commit()
            logger.info(f"Created {count} default counters")
