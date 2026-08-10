import csv
import io
import json
from typing import List, Any
from fastapi import APIRouter, Depends, UploadFile, File, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.db import get_db
from app import crud
from app.schemas import ImportResult

router = APIRouter(prefix="/api", tags=["io"])


class ImportJsonBody(BaseModel):
    items: List[Any]


@router.post("/import-json", response_model=ImportResult)
def import_json_body(data: ImportJsonBody, db: Session = Depends(get_db)):
    result = crud.bulk_import(db, data.items)
    return ImportResult(**result)


@router.post("/import", response_model=ImportResult)
async def import_words(file: UploadFile = File(...), db: Session = Depends(get_db)):
    content = await file.read()
    filename = file.filename or ""

    items = []

    if filename.endswith(".json"):
        try:
            data = json.loads(content)
            if isinstance(data, list):
                items = data
            else:
                raise HTTPException(status_code=400, detail="JSON must be an array")
        except json.JSONDecodeError as e:
            raise HTTPException(status_code=400, detail=f"Invalid JSON: {e}")

    elif filename.endswith(".csv"):
        try:
            text_content = content.decode("utf-8-sig")
            reader = csv.DictReader(io.StringIO(text_content))
            rows = list(reader)
            grouped: dict = {}
            for row in rows:
                word = row.get("word", "").strip()
                pos = row.get("part_of_speech", "").strip()
                key = (word, pos)
                if key not in grouped:
                    grouped[key] = {
                        "word": word,
                        "part_of_speech": pos or None,
                        "level": row.get("level") or None,
                        "phonetic": row.get("phonetic") or None,
                        "definitions": [],
                    }
                sense = row.get("definition", "").strip()
                example = row.get("example", "").strip()
                if sense:
                    grouped[key]["definitions"].append({
                        "sense": sense,
                        "example": example or None,
                    })
            items = list(grouped.values())
        except Exception as e:
            raise HTTPException(status_code=400, detail=f"CSV parse error: {e}")
    else:
        raise HTTPException(status_code=400, detail="Only .csv or .json files supported")

    result = crud.bulk_import(db, items)
    return ImportResult(**result)


@router.get("/export")
def export_words(db: Session = Depends(get_db)):
    from app.models import Word
    import json as _json
    words = db.query(Word).order_by(Word.word.asc()).all()
    out = []
    for w in words:
        defs = []
        if w.definitions:
            try:
                defs = _json.loads(w.definitions)
            except Exception:
                pass
        out.append({
            "word": w.word,
            "part_of_speech": w.part_of_speech,
            "level": w.level,
            "phonetic": w.phonetic,
            "status": w.status,
            "is_bookmarked": bool(w.is_bookmarked),
            "collected_count": w.collected_count,
            "definitions": defs,
        })
    return JSONResponse(content=out, headers={
        "Content-Disposition": "attachment; filename=dictionary_export.json"
    })
