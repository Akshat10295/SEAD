from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import text
from app.models.token import Token
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class TokenRepository:
    def __init__(self, db: Session):
        self.db = db

    def create(self, created_by: Optional[int] = None) -> Token:
        try:
            token = Token(status="waiting", created_by=created_by)
            self.db.add(token)
            self.db.flush()
            return token
        except SQLAlchemyError as e:
            logger.error(f"DB error create token: {e}")
            raise

    def get_by_id(self, token_id: int) -> Optional[Token]:
        try:
            return self.db.query(Token).filter(Token.id == token_id).first()
        except SQLAlchemyError as e:
            logger.error(f"DB error get token by id: {e}")
            raise

    def get_waiting(self) -> List[Token]:
        try:
            return (
                self.db.query(Token)
                .filter(Token.status == "waiting")
                .order_by(Token.created_at.asc())
                .all()
            )
        except SQLAlchemyError as e:
            logger.error(f"DB error get_waiting: {e}")
            raise

    def get_serving(self) -> List[Token]:
        try:
            return self.db.query(Token).filter(Token.status == "serving").all()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_serving: {e}")
            raise

    def get_next_waiting_with_lock(self) -> Optional[Token]:
        """SELECT FOR UPDATE to prevent race conditions"""
        try:
            return (
                self.db.query(Token)
                .filter(Token.status == "waiting")
                .order_by(Token.created_at.asc())
                .with_for_update(skip_locked=True)
                .first()
            )
        except SQLAlchemyError as e:
            logger.error(f"DB error get_next_waiting_with_lock: {e}")
            raise

    def count_waiting(self) -> int:
        return self.db.query(Token).filter(Token.status == "waiting").count()

    def count_by_status(self, status: str) -> int:
        return self.db.query(Token).filter(Token.status == status).count()

    def get_position(self, token_id: int) -> int:
        try:
            result = self.db.execute(
                text(
                    "SELECT COUNT(*) FROM tokens "
                    "WHERE status = 'waiting' AND created_at <= "
                    "(SELECT created_at FROM tokens WHERE id = :tid)"
                ),
                {"tid": token_id},
            )
            return result.scalar() or 1
        except SQLAlchemyError as e:
            logger.error(f"DB error get_position: {e}")
            return 1

    def has_active_token(self, user_id: int) -> bool:
        return (
            self.db.query(Token)
            .filter(Token.created_by == user_id, Token.status.in_(["waiting", "serving"]))
            .count()
            > 0
        )
