from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from app.core.database import Base


class Log(Base):
    __tablename__ = "logs"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True, index=True)
    action = Column(String(100), nullable=False)
    performed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    details = Column(String(500), nullable=True)

    __table_args__ = (
        Index("idx_log_timestamp", "timestamp"),
    )
