from sqlalchemy.orm import Session
from datetime import datetime, timezone
from app.repositories.token_repo import TokenRepository
from app.repositories.counter_repo import CounterRepository
from app.repositories.log_repo import LogRepository
from app.schemas.schemas import CreateTokenResponse, QueueStateOut, QueueTokenOut
from app.core.exceptions import (
    ConflictError, NotFoundError, QueueEmptyError,
    CounterBusyError, BadRequestError
)
import logging

logger = logging.getLogger(__name__)

AVG_SERVICE_MINUTES = 5


class QueueService:
    def __init__(self, db: Session):
        self.db = db
        self.token_repo = TokenRepository(db)
        self.counter_repo = CounterRepository(db)
        self.log_repo = LogRepository(db)

    def create_token(self, user_id: int) -> CreateTokenResponse:
        if self.token_repo.has_active_token(user_id):
            raise ConflictError("You already have an active token in the queue")

        try:
            token = self.token_repo.create(created_by=user_id)
            self.log_repo.create(
                action="TOKEN_CREATED",
                token_id=token.id,
                performed_by=user_id,
                details=f"Token #{token.id} created",
            )
            self.db.commit()
            self.db.refresh(token)

            position = self.token_repo.get_position(token.id)
            estimated_wait = max(1, (position - 1) * AVG_SERVICE_MINUTES)

            return CreateTokenResponse(
                token=QueueTokenOut.model_validate(token),
                position=position,
                estimated_wait_minutes=estimated_wait,
            )
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating token: {e}")
            raise

    def get_queue_state(self) -> QueueStateOut:
        waiting = self.token_repo.get_waiting()
        serving = self.token_repo.get_serving()
        return QueueStateOut(
            waiting=[QueueTokenOut.model_validate(t) for t in waiting],
            serving=[QueueTokenOut.model_validate(t) for t in serving],
            total_waiting=len(waiting),
            total_serving=len(serving),
        )

    def next_customer(self, counter_id: int, user_id: int) -> QueueTokenOut:
        counter = self.counter_repo.get_by_id(counter_id)
        if not counter:
            raise NotFoundError(f"Counter {counter_id} not found")
        if not counter.is_active:
            raise BadRequestError("Counter is not active")
        if counter.current_token_id is not None:
            raise CounterBusyError()

        try:
            token = self.token_repo.get_next_waiting_with_lock()
            if not token:
                raise QueueEmptyError()

            token.status = "serving"
            token.counter_id = counter_id
            counter.current_token_id = token.id

            self.log_repo.create(
                action="TOKEN_SERVING",
                token_id=token.id,
                performed_by=user_id,
                details=f"Counter {counter_id} serving token #{token.id}",
            )
            self.db.commit()
            self.db.refresh(token)
            return QueueTokenOut.model_validate(token)
        except (QueueEmptyError, CounterBusyError):
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error calling next customer: {e}")
            raise

    def complete_service(self, counter_id: int, user_id: int) -> QueueTokenOut:
        counter = self.counter_repo.get_by_id(counter_id)
        if not counter:
            raise NotFoundError(f"Counter {counter_id} not found")
        if counter.current_token_id is None:
            raise BadRequestError("No token currently being served at this counter")

        try:
            token = self.token_repo.get_by_id(counter.current_token_id)
            if not token:
                counter.current_token_id = None
                self.db.commit()
                raise NotFoundError("Serving token not found")
            if token.status != "serving":
                raise BadRequestError(f"Token is in '{token.status}' state, not 'serving'")

            token.status = "completed"
            token.completed_at = datetime.now(timezone.utc)
            counter.current_token_id = None

            self.log_repo.create(
                action="TOKEN_COMPLETED",
                token_id=token.id,
                performed_by=user_id,
                details=f"Counter {counter_id} completed token #{token.id}",
            )
            self.db.commit()
            self.db.refresh(token)
            return QueueTokenOut.model_validate(token)
        except (NotFoundError, BadRequestError):
            self.db.rollback()
            raise
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error completing service: {e}")
            raise
