from typing import Optional, List
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.db import get_db
from app import crud
from app.schemas import WordCreate, WordUpdate, WordOut, WordListResponse

router = APIRouter(prefix="/api/words", tags=["words"])


@router.get("", response_model=WordListResponse)
def list_words(
    q: Optional[str] = Query(None),
    level: Optional[str] = Query(None),
    letter: Optional[str] = Query(None),
    status: Optional[str] = Query(None),
    bookmarked: Optional[bool] = Query(None),
    sort: str = Query("alpha"),
    page: int = Query(1, ge=1),
    page_size: int = Query(5000, ge=1, le=100000),
    db: Session = Depends(get_db),
):
    items, total = crud.get_words(
        db, q=q, level=level, letter=letter, status=status,
        bookmarked=bookmarked, sort=sort, page=page, page_size=page_size,
    )
    return WordListResponse(
        items=[WordOut.from_orm_word(w) for w in items],
        total=total, page=page, page_size=page_size,
    )


@router.get("/{word_id}", response_model=WordOut)
def get_word(word_id: int, db: Session = Depends(get_db)):
    w = crud.get_word(db, word_id)
    if not w:
        raise HTTPException(status_code=404, detail="Word not found")
    return WordOut.from_orm_word(w)


@router.post("", response_model=WordOut, status_code=201)
def create_word(data: WordCreate, db: Session = Depends(get_db)):
    w = crud.create_word(db, data)
    return WordOut.from_orm_word(w)


@router.patch("/{word_id}", response_model=WordOut)
def update_word(word_id: int, data: WordUpdate, db: Session = Depends(get_db)):
    w = crud.update_word(db, word_id, data)
    if not w:
        raise HTTPException(status_code=404, detail="Word not found")
    return WordOut.from_orm_word(w)


@router.delete("/{word_id}", status_code=204)
def delete_word(word_id: int, db: Session = Depends(get_db)):
    ok = crud.delete_word(db, word_id)
    if not ok:
        raise HTTPException(status_code=404, detail="Word not found")


@router.delete("", status_code=200)
def delete_many(ids: List[int], db: Session = Depends(get_db)):
    count = crud.delete_many(db, ids)
    return {"deleted": count}
