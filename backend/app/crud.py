import json
from typing import Optional, List, Tuple
from sqlalchemy.orm import Session
from sqlalchemy import text, func
from app.models import Word
from app.schemas import WordCreate, WordUpdate, Definition


def _defs_to_json(defs: Optional[List[Definition]]) -> Optional[str]:
    if defs is None:
        return None
    return json.dumps([d.model_dump() for d in defs], ensure_ascii=False)


def get_words(
    db: Session,
    q: Optional[str] = None,
    level: Optional[str] = None,
    letter: Optional[str] = None,
    status: Optional[str] = None,
    bookmarked: Optional[bool] = None,
    sort: str = "alpha",
    page: int = 1,
    page_size: int = 500,
) -> Tuple[List[Word], int]:
    if q and q.strip():
        term = q.strip().rstrip("*") + "*"
        fts_sql = text("SELECT rowid FROM words_fts WHERE words_fts MATCH :term ORDER BY rank")
        rows = db.execute(fts_sql, {"term": term}).fetchall()
        ids = [r[0] for r in rows]
        if not ids:
            return [], 0
        query = db.query(Word).filter(Word.id.in_(ids))
    else:
        query = db.query(Word)

    if level:
        levels = [l.strip() for l in level.split(",") if l.strip()]
        if levels:
            query = query.filter(Word.level.in_(levels))

    if letter and letter.upper() != "ALL":
        query = query.filter(Word.word.ilike(f"{letter}%"))

    if status in ("known", "unknown"):
        query = query.filter(Word.status == status)

    if bookmarked:
        query = query.filter(Word.is_bookmarked == 1)

    total = query.count()

    if sort == "recent":
        query = query.order_by(Word.created_at.desc())
    else:
        query = query.order_by(Word.word.asc(), Word.part_of_speech.asc())

    offset = (page - 1) * page_size
    items = query.offset(offset).limit(page_size).all()
    return items, total


def get_word(db: Session, word_id: int) -> Optional[Word]:
    return db.query(Word).filter(Word.id == word_id).first()


def create_word(db: Session, data: WordCreate) -> Word:
    existing = db.query(Word).filter(
        func.lower(Word.word) == data.word.strip().lower(),
        Word.part_of_speech == data.part_of_speech,
    ).first()
    if existing:
        existing.collected_count = (existing.collected_count or 0) + 1
        existing.is_bookmarked = 1
        if data.audio_url and not existing.audio_url:
            existing.audio_url = data.audio_url
        if data.def_url and not existing.def_url:
            existing.def_url = data.def_url
        db.commit()
        db.refresh(existing)
        return existing

    defs_json = _defs_to_json(data.definitions)
    w = Word(
        word=data.word.strip().lower(),
        part_of_speech=data.part_of_speech,
        level=data.level,
        phonetic=data.phonetic,
        definitions=defs_json,
        audio_url=data.audio_url,
        def_url=data.def_url,
    )
    db.add(w)
    db.commit()
    db.refresh(w)
    return w


def update_word(db: Session, word_id: int, data: WordUpdate) -> Optional[Word]:
    w = db.query(Word).filter(Word.id == word_id).first()
    if not w:
        return None

    update_data = data.model_dump(exclude_unset=True)
    if "definitions" in update_data and update_data["definitions"] is not None:
        update_data["definitions"] = _defs_to_json(data.definitions)
    if "is_bookmarked" in update_data:
        update_data["is_bookmarked"] = 1 if update_data["is_bookmarked"] else 0

    for field, value in update_data.items():
        setattr(w, field, value)

    db.commit()
    db.refresh(w)
    return w


def delete_word(db: Session, word_id: int) -> bool:
    w = db.query(Word).filter(Word.id == word_id).first()
    if not w:
        return False
    db.delete(w)
    db.commit()
    return True


def delete_many(db: Session, ids: List[int]) -> int:
    count = db.query(Word).filter(Word.id.in_(ids)).delete(synchronize_session=False)
    db.commit()
    return count


def get_stats(db: Session) -> dict:
    total = db.query(func.count(Word.id)).scalar() or 0
    known = db.query(func.count(Word.id)).filter(Word.status == "known").scalar() or 0
    unknown = db.query(func.count(Word.id)).filter(Word.status == "unknown").scalar() or 0
    bookmarked = db.query(func.count(Word.id)).filter(Word.is_bookmarked == 1).scalar() or 0
    level_rows = db.query(Word.level, func.count(Word.id)).group_by(Word.level).all()
    by_level = {row[0] or "unknown": row[1] for row in level_rows}
    return {"total": total, "known": known, "unknown": unknown, "bookmarked": bookmarked, "by_level": by_level}


def bulk_import(db: Session, items: List[dict]) -> dict:
    inserted = 0
    updated = 0
    for item in items:
        word = (item.get("word") or "").strip().lower()
        pos = (item.get("part_of_speech") or item.get("pos") or "").strip() or None
        if not word:
            continue

        existing = db.query(Word).filter(
            func.lower(Word.word) == word,
            Word.part_of_speech == pos,
        ).first()

        if existing:
            existing.collected_count = (existing.collected_count or 0) + 1
            existing.is_bookmarked = 1
            updated += 1
        else:
            def_text = item.get("def") or ""
            defs_raw = item.get("definitions")
            defs_json = None
            if defs_raw:
                if isinstance(defs_raw, str):
                    try:
                        defs_raw = json.loads(defs_raw)
                    except Exception:
                        defs_raw = [{"sense": defs_raw, "example": None}]
                if isinstance(defs_raw, list):
                    defs_json = json.dumps(defs_raw, ensure_ascii=False)
            elif def_text:
                defs_json = json.dumps([{"sense": def_text, "example": None}], ensure_ascii=False)

            w = Word(
                word=word,
                part_of_speech=pos,
                level=item.get("level") or None,
                phonetic=item.get("phonetic") or None,
                definitions=defs_json,
                audio_url=item.get("audioUrl") or item.get("audio_url") or None,
                def_url=item.get("defUrl") or item.get("def_url") or None,
            )
            db.add(w)
            inserted += 1

    db.commit()
    return {"inserted": inserted, "updated": updated, "total": inserted + updated}
