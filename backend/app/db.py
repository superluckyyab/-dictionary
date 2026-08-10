import os
from sqlalchemy import create_engine, event, text
from sqlalchemy.orm import sessionmaker, DeclarativeBase

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "data")
os.makedirs(DATA_DIR, exist_ok=True)
DB_PATH = os.path.join(DATA_DIR, "dictionary.db")
DATABASE_URL = f"sqlite:///{DB_PATH}"

engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})


@event.listens_for(engine, "connect")
def set_sqlite_pragma(dbapi_conn, _):
    cursor = dbapi_conn.cursor()
    cursor.execute("PRAGMA journal_mode=WAL")
    cursor.execute("PRAGMA synchronous=NORMAL")
    cursor.execute("PRAGMA foreign_keys=ON")
    cursor.close()


SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)


class Base(DeclarativeBase):
    pass


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


# Each entry is a complete SQL statement (triggers must not be split)
FTS_STATEMENTS = [
    """CREATE VIRTUAL TABLE IF NOT EXISTS words_fts USING fts5(
    word,
    part_of_speech,
    defs_text,
    content='words',
    content_rowid='id',
    tokenize='unicode61'
)""",
    """CREATE TRIGGER IF NOT EXISTS words_ai AFTER INSERT ON words BEGIN
    INSERT INTO words_fts(rowid, word, part_of_speech, defs_text)
    VALUES (new.id, new.word, COALESCE(new.part_of_speech,''), COALESCE(new.definitions,''));
END""",
    """CREATE TRIGGER IF NOT EXISTS words_ad AFTER DELETE ON words BEGIN
    INSERT INTO words_fts(words_fts, rowid, word, part_of_speech, defs_text)
    VALUES ('delete', old.id, old.word, COALESCE(old.part_of_speech,''), COALESCE(old.definitions,''));
END""",
    """CREATE TRIGGER IF NOT EXISTS words_au AFTER UPDATE ON words BEGIN
    INSERT INTO words_fts(words_fts, rowid, word, part_of_speech, defs_text)
    VALUES ('delete', old.id, old.word, COALESCE(old.part_of_speech,''), COALESCE(old.definitions,''));
    INSERT INTO words_fts(rowid, word, part_of_speech, defs_text)
    VALUES (new.id, new.word, COALESCE(new.part_of_speech,''), COALESCE(new.definitions,''));
END""",
]


def init_db():
    from app.models import Base as ModelBase  # noqa: F401
    ModelBase.metadata.create_all(bind=engine)
    with engine.connect() as conn:
        for stmt in FTS_STATEMENTS:
            conn.execute(text(stmt))
        try:
            conn.execute(text("ALTER TABLE words ADD COLUMN ai_explanation TEXT"))
        except Exception:
            pass  # column already exists
        conn.commit()
