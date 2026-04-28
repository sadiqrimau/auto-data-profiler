from sqlalchemy import Column, Integer, String, DateTime, Float, Text, JSON
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class Dataset(Base):
    __tablename__ = "datasets"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(255), nullable=False)
    file_type = Column(String(50), nullable=False)        # csv, json, db, parquet
    source_path = Column(Text, nullable=True)
    row_count = Column(Integer, nullable=True)
    column_count = Column(Integer, nullable=True)
    file_size_bytes = Column(Integer, nullable=True)
    overall_quality_score = Column(Float, nullable=True)
    status = Column(String(50), default="pending")        # pending, profiling, completed, failed
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    columns = relationship("ColumnProfile", back_populates="dataset", cascade="all, delete-orphan")
    quality_results = relationship("QualityResult", back_populates="dataset", cascade="all, delete-orphan")
