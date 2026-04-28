from sqlalchemy import Column, Integer, String, Float, Text, JSON, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base


class QualityResult(Base):
    __tablename__ = "quality_results"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)

    # Dimension scores (0-100)
    completeness_score = Column(Float, nullable=True)
    validity_score = Column(Float, nullable=True)
    consistency_score = Column(Float, nullable=True)
    overall_score = Column(Float, nullable=True)

    # Issues found
    issues = Column(JSON, nullable=True)   # list of {column, issue_type, severity, description}
    anomalies = Column(JSON, nullable=True)

    created_at = Column(DateTime(timezone=True), server_default=func.now())

    dataset = relationship("Dataset", back_populates="quality_results")
