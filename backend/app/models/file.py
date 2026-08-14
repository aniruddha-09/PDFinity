import uuid
from sqlalchemy import Column, String, BigInteger, DateTime, ForeignKey, Boolean
from sqlalchemy.orm import relationship

from app.database.base import Base, utcnow


class File(Base):
    __tablename__ = "files"

    id = Column(String, primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String, ForeignKey("users.id", ondelete="SET NULL"), nullable=True)
    original_filename = Column(String, nullable=False)
    storage_path = Column(String, nullable=False)
    file_size = Column(BigInteger, nullable=False)
    mime_type = Column(String, nullable=False)
    is_output = Column(Boolean, default=False)  # True for processed output files
    created_at = Column(DateTime(timezone=True), default=utcnow)
    expires_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    user = relationship("User", back_populates="files")

    def __repr__(self) -> str:
        return f"<File id={self.id} name={self.original_filename}>"
