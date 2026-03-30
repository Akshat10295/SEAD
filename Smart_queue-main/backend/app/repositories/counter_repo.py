from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from app.models.counter import Counter
from typing import Optional, List
import logging

logger = logging.getLogger(__name__)


class CounterRepository:
    def __init__(self, db: Session):
        self.db = db

    def get_by_id(self, counter_id: int) -> Optional[Counter]:
        try:
            return self.db.query(Counter).filter(Counter.id == counter_id).first()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_counter_by_id: {e}")
            raise

    def get_all(self) -> List[Counter]:
        try:
            return self.db.query(Counter).all()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_all_counters: {e}")
            raise

    def get_active(self) -> List[Counter]:
        try:
            return self.db.query(Counter).filter(Counter.is_active == True).all()
        except SQLAlchemyError as e:
            logger.error(f"DB error get_active_counters: {e}")
            raise

    def create(self) -> Counter:
        try:
            counter = Counter(is_active=True)
            self.db.add(counter)
            self.db.flush()
            return counter
        except SQLAlchemyError as e:
            logger.error(f"DB error create_counter: {e}")
            raise

    def count_active(self) -> int:
        return self.db.query(Counter).filter(Counter.is_active == True).count()
