from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Index
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from app.core.database import Base


class Token(Base):
    __tablename__ = "tokens"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    status = Column(String(20), nullable=False, default="waiting", index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), index=True)
    completed_at = Column(DateTime(timezone=True), nullable=True)
    counter_id = Column(Integer, ForeignKey("counters.id"), nullable=True, index=True)
    created_by = Column(Integer, ForeignKey("users.id"), nullable=True)

    counter = relationship("Counter", foreign_keys=[counter_id], lazy="select")
    creator = relationship("User", foreign_keys=[created_by], lazy="select")

    __table_args__ = (
        Index("idx_status_created", "status", "created_at"),
    )
