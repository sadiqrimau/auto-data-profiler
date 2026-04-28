from sqlalchemy import Column, Integer, String, Float, Text, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class ColumnProfile(Base):
    __tablename__ = "column_profiles"

    id = Column(Integer, primary_key=True, index=True)
    dataset_id = Column(Integer, ForeignKey("datasets.id"), nullable=False)
    column_name = Column(String(255), nullable=False)
    position = Column(Integer, nullable=True)

    # Type info
    inferred_type = Column(String(50), nullable=True)     # integer, float, string, date, boolean
    semantic_type = Column(String(100), nullable=True)    # email, phone, ssn, url, etc.
    type_confidence = Column(Float, nullable=True)

    # Basic stats
    row_count = Column(Integer, nullable=True)
    null_count = Column(Integer, nullable=True)
    null_rate = Column(Float, nullable=True)
    distinct_count = Column(Integer, nullable=True)
    is_unique = Column(Boolean, nullable=True)

    # Numeric stats
    mean = Column(Float, nullable=True)
    median = Column(Float, nullable=True)
    std_dev = Column(Float, nullable=True)
    min_value = Column(Text, nullable=True)
    max_value = Column(Text, nullable=True)
    q1 = Column(Float, nullable=True)
    q3 = Column(Float, nullable=True)
    skewness = Column(Float, nullable=True)
    kurtosis = Column(Float, nullable=True)

    # String stats
    min_length = Column(Integer, nullable=True)
    max_length = Column(Integer, nullable=True)
    avg_length = Column(Float, nullable=True)

    # Patterns and top values
    top_values = Column(JSON, nullable=True)              # [{"value": "x", "count": 5}, ...]
    patterns = Column(JSON, nullable=True)                # [{"pattern": "^\\d+$", "coverage": 0.9}]

    # Generated description
    description = Column(Text, nullable=True)

    dataset = relationship("Dataset", back_populates="columns")
