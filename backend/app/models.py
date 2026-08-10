from datetime import datetime
from sqlalchemy import Column, Integer, String, Text, DateTime
from app.db import Base


class Word(Base):
    __tablename__ = "words"

    id = Column(Integer, primary_key=True, autoincrement=True)
    word = Column(Text, nullable=False, index=True)
    part_of_speech = Column(Text, nullable=True)
    level = Column(Text, nullable=True, index=True)
    phonetic = Column(Text, nullable=True)
    status = Column(Text, nullable=False, default="unknown", index=True)
    is_bookmarked = Column(Integer, nullable=False, default=0, index=True)
    collected_count = Column(Integer, nullable=False, default=0)
    definitions = Column(Text, nullable=True)   # JSON string: [{sense, example}]
    audio_url = Column(Text, nullable=True)
    def_url = Column(Text, nullable=True)
    ai_explanation = Column(Text, nullable=True)   # JSON: {meaning, example, tip}
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
