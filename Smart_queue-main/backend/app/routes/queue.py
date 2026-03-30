from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.queue_service import QueueService
from app.middleware.auth import get_current_user, require_roles
from app.models.user import User, UserRole
from app.schemas.schemas import CreateTokenResponse, QueueStateOut
from app.websocket.manager import manager
import asyncio

router = APIRouter(tags=["queue"])


@router.post("/token", response_model=CreateTokenResponse, status_code=201)
async def create_token(
    db: Session = Depends(get_db),
    current_user: User = Depends(require_roles(UserRole.customer, UserRole.admin)),
):
    service = QueueService(db)
    result = service.create_token(user_id=current_user.id)
    queue_state = service.get_queue_state()
    await manager.broadcast({"type": "QUEUE_UPDATE", "payload": queue_state.model_dump()})
    return result


@router.get("/queue", response_model=QueueStateOut)
def get_queue(db: Session = Depends(get_db), _: User = Depends(get_current_user)):
    return QueueService(db).get_queue_state()
