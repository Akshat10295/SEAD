from fastapi import APIRouter, Depends, Path
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.queue_service import QueueService
from app.repositories.counter_repo import CounterRepository
from app.middleware.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.schemas import QueueTokenOut, CounterOut
from app.websocket.manager import manager
from typing import List

router = APIRouter(prefix="/counter", tags=["counter"])


@router.get("/", response_model=List[CounterOut])
def get_counters(db: Session = Depends(get_db), _: User = Depends(require_roles(UserRole.counter, UserRole.admin, UserRole.display))):
    return CounterRepository(db).get_all()


@router.post("/{counter_id}/next", response_model=QueueTokenOut)
async def next_customer(
    counter_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.counter, UserRole.admin)),
):
    service = QueueService(db)
    token = service.next_customer(counter_id=counter_id, user_id=current_user.id)
    queue_state = service.get_queue_state()
    await manager.broadcast({"type": "QUEUE_UPDATE", "payload": queue_state.model_dump()})
    return token


@router.post("/{counter_id}/complete", response_model=QueueTokenOut)
async def complete_service(
    counter_id: int = Path(..., ge=1),
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.counter, UserRole.admin)),
):
    service = QueueService(db)
    token = service.complete_service(counter_id=counter_id, user_id=current_user.id)
    queue_state = service.get_queue_state()
    await manager.broadcast({"type": "QUEUE_UPDATE", "payload": queue_state.model_dump()})
    return token
