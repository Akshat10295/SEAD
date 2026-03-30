from sqlalchemy import Column, Integer, Boolean, ForeignKey
from sqlalchemy.orm import relationship
from app.core.database import Base


class Counter(Base):
    __tablename__ = "counters"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    is_active = Column(Boolean, default=True, nullable=False)
    current_token_id = Column(Integer, ForeignKey("tokens.id"), nullable=True)

    current_token = relationship("Token", foreign_keys=[current_token_id], lazy="joined")
