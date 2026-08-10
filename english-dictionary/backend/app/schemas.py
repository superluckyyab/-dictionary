from typing import Optional, List, Any
from pydantic import BaseModel
from datetime import datetime
import json


class Definition(BaseModel):
    sense: str
    example: Optional[str] = None


class WordBase(BaseModel):
    word: str
    part_of_speech: Optional[str] = None
    level: Optional[str] = None
    phonetic: Optional[str] = None
    definitions: Optional[List[Definition]] = None
    audio_url: Optional[str] = None
    def_url: Optional[str] = None


class WordCreate(WordBase):
    pass


class WordUpdate(BaseModel):
    word: Optional[str] = None
    part_of_speech: Optional[str] = None
    level: Optional[str] = None
    phonetic: Optional[str] = None
    status: Optional[str] = None
    is_bookmarked: Optional[bool] = None
    collected_count: Optional[int] = None
    definitions: Optional[List[Definition]] = None
    audio_url: Optional[str] = None
    def_url: Optional[str] = None
    ai_explanation: Optional[str] = None


class WordOut(BaseModel):
    id: int
    word: str
    part_of_speech: Optional[str] = None
    level: Optional[str] = None
    phonetic: Optional[str] = None
    status: str
    is_bookmarked: bool
    collected_count: int
    definitions: List[Definition] = []
    audio_url: Optional[str] = None
    def_url: Optional[str] = None
    ai_explanation: Optional[str] = None
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_word(cls, w: Any) -> "WordOut":
        defs: List[Definition] = []
        if w.definitions:
            try:
                raw = json.loads(w.definitions)
                defs = [Definition(**d) for d in raw]
            except Exception:
                pass
        return cls(
            id=w.id,
            word=w.word,
            part_of_speech=w.part_of_speech,
            level=w.level,
            phonetic=w.phonetic,
            status=w.status,
            is_bookmarked=bool(w.is_bookmarked),
            collected_count=w.collected_count,
            definitions=defs,
            audio_url=w.audio_url,
            def_url=w.def_url,
            ai_explanation=w.ai_explanation,
            created_at=w.created_at,
            updated_at=w.updated_at,
        )


class WordListResponse(BaseModel):
    items: List[WordOut]
    total: int
    page: int
    page_size: int


class StatsResponse(BaseModel):
    total: int
    known: int
    unknown: int
    bookmarked: int
    by_level: dict


class ImportResult(BaseModel):
    inserted: int
    updated: int
    total: int
