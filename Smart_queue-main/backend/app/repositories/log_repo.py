from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.log import Log
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class LogRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(
        self,
        action: str,
        token_id: Optional[int] = None,
        performed_by: Optional[int] = None,
        details: Optional[str] = None,
    ) -> Log:
        try:
            log = Log(
                action=action,
                token_id=token_id,
                performed_by=performed_by,
                details=details,
            )
            self.db.add(log)
            self.db.flush()
            return log
        except SQLAlchemyError as e:
            logger.error(f"DB error create_log: {e}")
            raise

    def get_recent(self, limit: int = 100) -> List[Log]:
        try:
            return (
                self.db.query(Log)
                .order_by(Log.timestamp.desc())
                .limit(min(limit, 500))
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"DB error get_recent_logs: {e}")
            raise
