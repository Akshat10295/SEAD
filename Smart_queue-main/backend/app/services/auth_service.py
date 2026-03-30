from sqlalchemy.orm import Session
from app.repositories.user_repo import UserRepository
from app.core.security import hash_password, verify_password, create_access_token
from app.core.exceptions import ConflictError, UnauthorizedError
from app.schemas.schemas import RegisterRequest, LoginRequest, TokenResponse
from app.models.user import UserRole
import logging

logger = logging.getLogger(__name__)

ADMIN_ROLES = {UserRole.admin, UserRole.counter, UserRole.display}


class AuthService:
    def __init__(self, db: Session):
        self.repo = UserRepository(db)
        self.db = db

    def register(self, request: RegisterRequest) -> TokenResponse:
        existing = self.repo.get_by_username(request.username)
        if existing:
            raise ConflictError("Username already taken")

        hashed = hash_password(request.password)
        user = self.repo.create(request.username, hashed, request.role)
        self.db.commit()
        self.db.refresh(user)

        token = create_access_token({"sub": str(user.id), "role": user.role.value, "username": user.username})
        logger.info(f"User registered: {user.username} as {user.role}")
        return TokenResponse(access_token=token, role=user.role.value, username=user.username)

    def login(self, request: LoginRequest) -> TokenResponse:
        user = self.repo.get_by_username(request.username)
        if not user or not verify_password(request.password, user.hashed_password):
            raise UnauthorizedError("Invalid credentials")

        token = create_access_token({"sub": str(user.id), "role": user.role.value, "username": user.username})
        logger.info(f"User logged in: {user.username}")
        return TokenResponse(access_token=token, role=user.role.value, username=user.username)
