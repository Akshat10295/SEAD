from pydantic import BaseModel, field_validator, ConfigDict
from typing import Optional, List
from datetime import datetime
from app.models.user import UserRole


# ── Auth Schemas ──────────────────────────────────────────────────────────────

class RegisterRequest(BaseModel):
    username: str
    password: str
    role: UserRole = UserRole.customer

    @field_validator("username")
    @classmethod
    def username_valid(cls, v: str) -> str:
        v = v.strip()
        if len(v) < 3 or len(v) > 50:
            raise ValueError("Username must be 3–50 characters")
        if not v.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username must be alphanumeric (hyphens/underscores allowed)")
        return v

    @field_validator("password")
    @classmethod
    def password_valid(cls, v: str) -> str:
        if len(v) < 6:
            raise ValueError("Password must be at least 6 characters")
        return v


class LoginRequest(BaseModel):
    username: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: str
    username: str


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    username: str
    role: UserRole
    created_at: datetime


# ── Queue Token Schemas ───────────────────────────────────────────────────────

class QueueTokenOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    status: str
    created_at: datetime
    completed_at: Optional[datetime]
    counter_id: Optional[int]


class CreateTokenResponse(BaseModel):
    token: QueueTokenOut
    position: int
    estimated_wait_minutes: int


class QueueStateOut(BaseModel):
    waiting: List[QueueTokenOut]
    serving: List[QueueTokenOut]
    total_waiting: int
    total_serving: int


# ── Counter Schemas ───────────────────────────────────────────────────────────

class CounterOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    is_active: bool
    current_token_id: Optional[int]
    current_token: Optional[QueueTokenOut] = None


# ── Admin Schemas ─────────────────────────────────────────────────────────────

class AdminStatsOut(BaseModel):
    total_waiting: int
    total_serving: int
    total_completed: int
    active_counters: int
    total_counters: int


class ResetRequest(BaseModel):
    confirm_password: str


class LogOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    token_id: Optional[int]
    action: str
    performed_by: Optional[int]
    timestamp: datetime
    details: Optional[str]


# ── WebSocket Schemas ─────────────────────────────────────────────────────────

class WSMessage(BaseModel):
    type: str
    payload: dict
