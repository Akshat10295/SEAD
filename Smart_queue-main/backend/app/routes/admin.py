from fastapi import APIRouter, Depends, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.services.admin_service import AdminService
from app.middleware.auth import require_roles
from app.models.user import User, UserRole
from app.schemas.schemas import AdminStatsOut, ResetRequest, LogOut
from app.websocket.manager import manager
from typing import List
import csv
import io

router = APIRouter(prefix="/admin", tags=["admin"])

_admin_only = require_roles(UserRole.admin)


@router.get("/stats", response_model=AdminStatsOut)
def get_stats(db: Session = Depends(get_db), _: User = Depends(_admin_only)):
    return AdminService(db).get_stats()


@router.post("/reset")
async def reset_queue(
    request: ResetRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(_admin_only),
):
    result = AdminService(db).reset_queue(admin_id=current_user.id, confirm_password=request.confirm_password)
    await manager.broadcast({"type": "QUEUE_RESET", "payload": {"message": "Queue has been reset"}})
    return result


@router.get("/logs", response_model=List[LogOut])
def get_logs(
    limit: int = Query(default=100, ge=1, le=500),
    db: Session = Depends(get_db),
    _: User = Depends(_admin_only),
):
    return AdminService(db).get_logs(limit=limit)


@router.get("/logs/export")
def export_logs(
    db: Session = Depends(get_db),
    _: User = Depends(_admin_only),
):
    logs = AdminService(db).get_logs(limit=500)
    output = io.StringIO()
    writer = csv.writer(output)
    writer.writerow(["ID", "Token ID", "Action", "Performed By", "Timestamp", "Details"])
    for log in logs:
        writer.writerow([log.id, log.token_id, log.action, log.performed_by, log.timestamp, log.details])
    output.seek(0)
    return StreamingResponse(
        iter([output.getvalue()]),
        media_type="text/csv",
        headers={"Content-Disposition": "attachment; filename=queue_logs.csv"},
    )
