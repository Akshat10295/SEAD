from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.user import User, UserRole
from typing import Optional
import logging

logger = logging.getLogger(__name__)


class UserRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_username(self, username: str) -> Optional[User]:
        try:
            return self.db.query(User).filter(User.username == username).first()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_by_username: {e}")
            raise

    def get_by_id(self, user_id: int) -> Optional[User]:
        try:
            return self.db.query(User).filter(User.id == user_id).first()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_by_id: {e}")
            raise

    def create(self, username: str, hashed_password: str, role: UserRole) -> User:
        try:
            user = User(username=username, hashed_password=hashed_password, role=role)
            self.db.add(user)
            self.db.flush()
            return user
        except SQLAlchemyError as e:
            logger.error(f"DB error create user: {e}")
            raise
