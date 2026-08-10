/* global React, window, localStorage */
/* Courses: Books → Classes → words, each class split into Test / Known / Unknown.
   Unknown words can be pushed (deduped) into the global dictionary's Unknown bucket. */
;(function() {
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const C_LEVELS = window.LEVELS;
const C_LEVEL_COLOR = window.LEVEL_COLOR;
const CIcon = window.Icon;
const CCefr = window.Cefr;
const CSyllabified = window.Syllabified;
const cParseCsv = window.parseCsv;
const cWordKey = window.wordKey;
const cBuildPrompt = window.buildExplainPrompt;
const cParseExplain = window.parseExplain;
const BOOKS_KEY = "lexicon.books.v1";

function loadBooks() {
  try { const r = localStorage.getItem(BOOKS_KEY); if (r) return JSON.parse(r); } catch (e) {}
  return [];
}
function fmtDate(ts) {
  const d = new Date(ts);
  const date = d.toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  return date + " · " + time;
}
function rid(p) { return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }
function oxfordUrl(w) { return "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(String(w).toLowerCase()); }
// Plain word list: split on commas / newlines / semicolons. e.g. "abandon, test" -> ["abandon","test"]
function parseWordList(text) {
  return String(text || "").split(/[\n,;]+/).map((s) => s.trim().toLowerCase()).filter(Boolean);
}

/* ---- small inline name input ---- */
function InlineAdd({ placeholder, cta, onAdd, onCancel }) {
  const [v, setV] = useState("");
  const ref = useRef(null);
  useEffect(() => { if (ref.current) ref.current.focus(); }, []);
  const submit = (e) => { e.preventDefault(); const t = v.trim(); if (t) { onAdd(t); setV(""); } };
  return (
    <form className="inline-add" onSubmit={submit}>
      <input ref={ref} value={v} onChange={(e) => setV(e.target.value)} placeholder={placeholder}
        onKeyDown={(e) => { if (e.key === "Escape") onCancel && onCancel(); }} />
      <button className="txtbtn primary" type="submit"><CIcon.plus /> {cta}</button>
      {onCancel && <button className="txtbtn" type="button" onClick={onCancel}>Cancel</button>}
    </form>
  );
}

/* ---- sort control ---- */
function SortBar({ sortBy, onSort, label }) {
  return (
    <div className="sortbar">
      <span className="lbl">{label}</span>
      <span className="seg">
        <button className={sortBy === "name" ? "on" : ""} onClick={() => onSort("name")}>A–Z</button>
        <button className={sortBy === "time" ? "on" : ""} onClick={() => onSort("time")}>Newest</button>
      </span>
    </div>
  );
}

function sortItems(list, sortBy) {
  const a = list.slice();
  if (sortBy === "name") {
    a.sort((x, y) => {
      const xa = (x.title || "").toLowerCase(), ya = (y.title || "").toLowerCase();
      return xa < ya ? -1 : xa > ya ? 1 : 0;
    });
  } else {
    a.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
  }
  return a;
}

/* ---- one course word row ---- */
function CWRow({ w, audio, onKnown }) {
  return (
    <div className={"cw-row" + (w.known === "yes" ? " is-known" : "")}>
      <div className="cw-main">
        <span className="cw-word"><CSyllabified word={w.word} /></span>
        <span className="cw-pos"><em>{w.pos}</em></span>
      </div>
      <div className="cw-actions">
        <CCefr level={w.level} />
        <button className={"iconbtn" + (audio.playing === w.id ? " playing" : "")} title="Pronounce" onClick={() => audio.play(w)}><CIcon.speaker /></button>
        <button className={"know-switch" + (w.known === "yes" ? " on" : "")} role="switch" aria-checked={w.known === "yes"}
          title={w.known === "yes" ? "Known — tap to mark unknown" : "Unknown — tap to mark known"}
          onClick={() => onKnown(w.id, w.known === "yes" ? "no" : "yes")}>
          <span className="ks-knob">{w.known === "yes" ? <CIcon.check width={12} height={12} /> : <CIcon.x width={12} height={12} />}</span>
        </button>
      </div>
    </div>
  );
}

/* ---- in-class test (5-at-a-time, know/don’t-know, reveal) ---- */
function ClassTest({ cls, audio, onKnown, onAi }) {
  const [size, setSize] = useState(5);
  const [batchIds, setBatchIds] = useState(null);
  const [answers, setAnswers] = useState({});
  const [loading, setLoading] = useState({});

  const pool = useMemo(() => cls.words.filter((w) => w.known !== "yes"), [cls.words]);
  const poolRef = useRef(pool); poolRef.current = pool;
  const sizeRef = useRef(size); sizeRef.current = size;

  const draw = useCallback(() => {
    const p = poolRef.current.slice();
    for (let i = p.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); const t = p[i]; p[i] = p[j]; p[j] = t; }
    setBatchIds(p.slice(0, sizeRef.current).map((w) => w.id));
    setAnswers({});
  }, []);
  useEffect(() => { draw(); }, [size, draw]);

  const cards = (batchIds || []).map((id) => cls.words.find((w) => w.id === id)).filter(Boolean);
  const firstUn = cards.findIndex((w) => !answers[w.id]);
  const shown = firstUn === -1 ? cards : cards.slice(0, firstUn + 1);
  const allAns = cards.length > 0 && firstUn === -1;

  const ensureAi = async (w) => {
    if (w.ai && w.ai.meaning) return;
    setLoading((s) => ({ ...s, [w.id]: true }));
    try {
      const res = await window.claude.complete(cBuildPrompt(w.word, w.pos, 0, null));
      onAi(w.id, cParseExplain(res));
    } catch (e) { onAi(w.id, { meaning: "Could not reach the AI tutor — try again.", example: "", tip: "" }); }
    finally { setLoading((s) => ({ ...s, [w.id]: false })); }
  };
  const answer = (w, val) => { onKnown(w.id, val); setAnswers((a) => ({ ...a, [w.id]: val })); ensureAi(w); };

  const settings = (
    <div className="quiz-settings">
      <div className="qs-group">
        <span className="lbl">Words</span>
        {[1, 2, 3, 4, 5].map((n) => <button key={n} className={"size-chip" + (size === n ? " on" : "")} onClick={() => setSize(n)}>{n}</button>)}
      </div>
    </div>
  );

  if (cards.length === 0) {
    return (<div className="quiz">{settings}<div className="course-empty"><div className="glyph">✓</div><p>No unknown words left in this class — mark some unknown, or import more.</p></div></div>);
  }

  return (
    <div className="quiz">
      {settings}
      <p className="quiz-note">{pool.length} unknown word{pool.length === 1 ? "" : "s"} in this class — mark them known to clear them.</p>
      {shown.map((w, i) => {
        const a = answers[w.id];
        return (
          <div className={"quiz-card" + (a ? " answered" : "")} key={w.id}>
            <div className="qc-row">
              <button className={"qc-btn qc-yes" + (a === "yes" ? " on" : "")} onClick={() => answer(w, "yes")}><CIcon.check /> I know it</button>
              <div className="qc-word-wrap">
                <div className="qc-index">{i + 1} of {cards.length}</div>
                <div className="qc-word"><CSyllabified word={w.word} /></div>
                <div className="qc-meta"><em>{w.pos}</em><CCefr level={w.level} /><button className={"iconbtn" + (audio.playing === w.id ? " playing" : "")} onClick={() => audio.play(w)} title="Pronounce"><CIcon.speaker /></button></div>
              </div>
              <button className={"qc-btn qc-no" + (a === "no" ? " on" : "")} onClick={() => answer(w, "no")}><CIcon.x /> Don’t know</button>
            </div>
            {a && (
              <div className="qc-reveal">
                {w.def && <p className="qc-def">{w.def}</p>}
                {loading[w.id] && !(w.ai && w.ai.meaning) ? (
                  <div className="rs-loading"><CIcon.loader /> Fetching a friendly explanation…</div>
                ) : (w.ai && w.ai.meaning) ? (
                  <div className="qc-ai"><p className="qc-meaning">{w.ai.meaning}</p>{w.ai.example && <p className="qc-ex">“{w.ai.example}”</p>}</div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}
      <div className="quiz-foot">
        <button className={"txtbtn quiz-next" + (allAns ? " primary" : "")} onClick={draw}>Next batch <CIcon.chev width={12} height={12} /></button>
        {!allAns && <span className="quiz-hint">{cards.filter((w) => !answers[w.id]).length} left in this batch</span>}
      </div>
    </div>
  );
}

/* ---------------- main Courses page ---------------- */
function CoursesPage({ audio, globalWords, pushToGlobal, flash }) {
  const [books, setBooks] = useState(loadBooks);
  const [view, setView] = useState({ level: "books" });
  const [sortBy, setSortBy] = useState("time");
  const [adding, setAdding] = useState(false);
  const [importing, setImporting] = useState(false);
  const [pool, setPool] = useState(null); // { bookId, classId, words:[...] } words not found in dictionary

  // fast lookup: headword -> first dictionary entry
  const dictByWord = useMemo(() => {
    const m = new Map();
    (globalWords || []).forEach((w) => { const k = (w.word || "").toLowerCase(); if (!m.has(k)) m.set(k, w); });
    return m;
  }, [globalWords]);

  useEffect(() => { try { localStorage.setItem(BOOKS_KEY, JSON.stringify(books)); } catch (e) {} }, [books]);

  const book = view.bookId ? books.find((b) => b.id === view.bookId) : null;
  const cls = book && view.classId ? book.classes.find((c) => c.id === view.classId) : null;

  /* mutations */
  const addBook = (title) => { setBooks((bs) => [...bs, { id: rid("bk"), title, createdAt: Date.now(), classes: [] }]); setAdding(false); };
  const addClass = (bookId, title) => { setBooks((bs) => bs.map((b) => b.id !== bookId ? b : { ...b, classes: [...b.classes, { id: rid("cl"), title, createdAt: Date.now(), words: [] }] })); setAdding(false); };
  const delBook = (bookId) => setBooks((bs) => bs.filter((b) => b.id !== bookId));
  const delClass = (bookId, classId) => setBooks((bs) => bs.map((b) => b.id !== bookId ? b : { ...b, classes: b.classes.filter((c) => c.id !== classId) }));
  const updateClass = (bookId, classId, fn) => setBooks((bs) => bs.map((b) => b.id !== bookId ? b : { ...b, classes: b.classes.map((c) => c.id !== classId ? c : fn(c)) }));

  const importToClass = (bookId, classId, text) => {
    const tokens = Array.from(new Set(parseWordList(text)));
    if (!tokens.length) { flash("No words found"); return; }
    const target = books.find((b) => b.id === bookId).classes.find((c) => c.id === classId);
    const seen = new Set(target.words.map((w) => w.word.toLowerCase()));
    const fresh = [];
    const notFound = [];
    let dupe = 0;
    tokens.forEach((t) => {
      const e = dictByWord.get(t);
      if (!e) { notFound.push(t); return; }
      if (seen.has(t)) { dupe++; return; }
      seen.add(t);
      fresh.push({ id: rid("cw"), word: e.word, level: e.level, pos: e.pos, def: e.def || "", defUrl: e.defUrl || oxfordUrl(e.word), audioUrl: e.audioUrl || "", known: e.known || "no", ai: e.ai || null });
    });
    if (fresh.length) updateClass(bookId, classId, (c) => ({ ...c, words: [...c.words, ...fresh] }));
    setImporting(false);
    setPool(notFound.length ? { bookId, classId, words: notFound } : null);
    flash("Added " + fresh.length + " from your dictionary" +
      (dupe ? " · " + dupe + " already in class" : "") +
      (notFound.length ? " · " + notFound.length + " not in dictionary" : ""));
  };
  const removeFromPool = (w) => setPool((p) => {
    if (!p) return p;
    const words = p.words.filter((x) => x !== w);
    return words.length ? { ...p, words } : null;
  });
  const importPool = () => {
    if (!pool) return;
    const incoming = pool.words.map((w) => ({ word: w, level: "—", pos: "word", def: "", defUrl: oxfordUrl(w), audioUrl: "" }));
    pushToGlobal(incoming); // add new words to the global dictionary (deduped)
    const target = books.find((b) => b.id === pool.bookId).classes.find((c) => c.id === pool.classId);
    const seen = new Set(target.words.map((w) => w.word.toLowerCase()));
    const fresh = pool.words.filter((w) => !seen.has(w)).map((w) => ({ id: rid("cw"), word: w, level: "—", pos: "word", def: "", defUrl: oxfordUrl(w), audioUrl: "", known: "no", ai: null }));
    if (fresh.length) updateClass(pool.bookId, pool.classId, (c) => ({ ...c, words: [...c.words, ...fresh] }));
    flash("Imported " + pool.words.length + " new word" + (pool.words.length === 1 ? "" : "s") + " to your dictionary & class");
    setPool(null);
  };
  const setWordKnown = (bookId, classId, wordId, val) => updateClass(bookId, classId, (c) => ({ ...c, words: c.words.map((w) => w.id === wordId ? { ...w, known: val } : w) }));
  const setWordAi = (bookId, classId, wordId, ai) => updateClass(bookId, classId, (c) => ({ ...c, words: c.words.map((w) => w.id === wordId ? { ...w, ai } : w) }));

  const pushUnknown = async (wordsArr, label) => {
    const incoming = wordsArr.filter((w) => w.known !== "yes").map((w) => ({ word: w.word, level: w.level, pos: w.pos, def: w.def || "", defUrl: w.defUrl, audioUrl: w.audioUrl }));
    if (!incoming.length) { flash("No unknown words to push" + (label ? " from " + label : "")); return; }
    const { added, skipped } = await pushToGlobal(incoming);
    flash(added + " word" + (added === 1 ? "" : "s") + " added to Dictionary" + (skipped ? " · " + skipped + " already there" : ""));
  };

  /* ---------------- BOOKS LEVEL ---------------- */
  if (view.level === "books") {
    const list = sortItems(books, sortBy);
    return (
      <div className="courses">
        <div className="course-top">
          <h2 className="course-title"><CIcon.library /> Books</h2>
          <div className="course-top-actions">
            {books.length > 1 && <SortBar sortBy={sortBy} onSort={setSortBy} label="Sort" />}
            {!adding && <button className="txtbtn primary" onClick={() => setAdding(true)}><CIcon.plus /> New book</button>}
          </div>
        </div>
        {adding && <InlineAdd placeholder="Book title — e.g. New Concept English 2" cta="Create book" onAdd={addBook} onCancel={() => setAdding(false)} />}
        {books.length === 0 && !adding ? (
          <div className="course-empty"><div className="glyph">❡</div><p>No books yet. Create a book, add classes inside it, then import words class by class.</p></div>
        ) : (
          <div className="book-grid">
            {list.map((b) => {
              const total = b.classes.reduce((n, c) => n + c.words.length, 0);
              const unknown = b.classes.reduce((n, c) => n + c.words.filter((w) => w.known !== "yes").length, 0);
              return (
                <div className="book-card" key={b.id} onClick={() => { setView({ level: "book", bookId: b.id }); setAdding(false); }}>
                  <div className="bc-spine" />
                  <div className="bc-body">
                    <div className="bc-title">{b.title}</div>
                    <div className="bc-meta">{b.classes.length} class{b.classes.length === 1 ? "" : "es"} · {total} word{total === 1 ? "" : "s"}</div>
                    <div className="bc-sub">{unknown} unknown · added {fmtDate(b.createdAt)}</div>
                  </div>
                  <button className="bc-del" title="Delete book" onClick={(e) => { e.stopPropagation(); delBook(b.id); }}><CIcon.trash /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- BOOK LEVEL (classes) ---------------- */
  if (view.level === "book" && book) {
    const list = sortItems(book.classes, sortBy);
    const bookUnknown = book.classes.reduce((a, c) => a.concat(c.words.filter((w) => w.known !== "yes")), []);
    return (
      <div className="courses">
        <div className="crumb">
          <button onClick={() => setView({ level: "books" })}>Books</button>
          <span className="crumb-sep">/</span><span className="crumb-cur">{book.title}</span>
        </div>
        <div className="course-top">
          <h2 className="course-title"><CIcon.book /> {book.title}</h2>
          <div className="course-top-actions">
            {book.classes.length > 1 && <SortBar sortBy={sortBy} onSort={setSortBy} label="Sort" />}
            {bookUnknown.length > 0 && <button className="txtbtn" onClick={() => pushUnknown(bookUnknown, book.title)} title="Push every unknown word in this book to the Dictionary"><CIcon.upload /> Push {bookUnknown.length} → Dictionary</button>}
            {!adding && <button className="txtbtn primary" onClick={() => setAdding(true)}><CIcon.plus /> New class</button>}
          </div>
        </div>
        {adding && <InlineAdd placeholder="Class title — e.g. Lesson 1, or a theme name" cta="Create class" onAdd={(t) => addClass(book.id, t)} onCancel={() => setAdding(false)} />}
        {book.classes.length === 0 && !adding ? (
          <div className="course-empty"><div className="glyph">❡</div><p>No classes yet. Create a class (a lesson or theme), then import its words.</p></div>
        ) : (
          <div className="class-list">
            {list.map((c) => {
              const unknown = c.words.filter((w) => w.known !== "yes").length;
              const known = c.words.length - unknown;
              return (
                <div className="class-card" key={c.id} onClick={() => { setView({ level: "class", bookId: book.id, classId: c.id, sub: "unknown" }); setImporting(false); }}>
                  <div className="cc-main">
                    <div className="cc-title">{c.title}</div>
                    <div className="cc-meta">added {fmtDate(c.createdAt)}</div>
                  </div>
                  <div className="cc-stats">
                    <span className="cc-stat cc-unknown"><CIcon.x width={12} height={12} /> {unknown}</span>
                    <span className="cc-stat cc-known"><CIcon.check width={12} height={12} /> {known}</span>
                  </div>
                  <button className="bc-del" title="Delete class" onClick={(e) => { e.stopPropagation(); delClass(book.id, c.id); }}><CIcon.trash /></button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  /* ---------------- CLASS LEVEL ---------------- */
  if (view.level === "class" && book && cls) {
    const sub = view.sub || "unknown";
    const unknownWords = cls.words.filter((w) => w.known !== "yes");
    const knownWords = cls.words.filter((w) => w.known === "yes");
    const setSub = (s) => setView((v) => ({ ...v, sub: s }));
    const rows = sub === "known" ? knownWords : unknownWords;
    return (
      <div className="courses">
        <div className="crumb">
          <button onClick={() => setView({ level: "books" })}>Books</button>
          <span className="crumb-sep">/</span>
          <button onClick={() => setView({ level: "book", bookId: book.id })}>{book.title}</button>
          <span className="crumb-sep">/</span><span className="crumb-cur">{cls.title}</span>
        </div>
        <div className="course-top">
          <h2 className="course-title">{cls.title}</h2>
          <div className="course-top-actions">
            <button className="txtbtn" onClick={() => setImporting((v) => !v)}><CIcon.upload /> Import words</button>
            {unknownWords.length > 0 && <button className="txtbtn primary" onClick={() => pushUnknown(cls.words, cls.title)} title="Add this class’s unknown words to the global Dictionary (skips ones already there)"><CIcon.library /> Push {unknownWords.length} → Dictionary</button>}
          </div>
        </div>

        {importing && (
          <ClassImport onImport={(text) => importToClass(book.id, cls.id, text)} onCancel={() => setImporting(false)} />
        )}

        {pool && pool.classId === cls.id && pool.words.length > 0 && (
          <div className="pool-panel">
            <div className="pool-head">
              <div className="pool-title"><CIcon.x width={15} height={15} /> {pool.words.length} word{pool.words.length === 1 ? "" : "s"} not in your dictionary</div>
              <div className="pool-actions">
                <button className="txtbtn primary" onClick={importPool}><CIcon.library /> Import all to dictionary &amp; class</button>
                <button className="txtbtn" onClick={() => setPool(null)}>Dismiss</button>
              </div>
            </div>
            <p className="pool-note">These weren’t found in your dictionary (possible typos, or genuinely new words). Remove any you don’t want, then one-click import the rest.</p>
            <div className="pool-chips">
              {pool.words.map((w) => (
                <span className="pool-chip" key={w}>{w}<button title="Remove" onClick={() => removeFromPool(w)}><CIcon.x width={11} height={11} /></button></span>
              ))}
            </div>
          </div>
        )}

        <div className="subtabs">
          <button className={sub === "test" ? "on" : ""} onClick={() => setSub("test")}><CIcon.cards width={14} height={14} /> Test</button>
          <button className={sub === "unknown" ? "on" : ""} onClick={() => setSub("unknown")}><CIcon.x width={13} height={13} /> Unknown <span className="st-count">{unknownWords.length}</span></button>
          <button className={sub === "known" ? "on" : ""} onClick={() => setSub("known")}><CIcon.check width={13} height={13} /> Known <span className="st-count">{knownWords.length}</span></button>
        </div>

        {sub === "test" ? (
          <ClassTest cls={cls} audio={audio} onKnown={(wid, val) => setWordKnown(book.id, cls.id, wid, val)} onAi={(wid, ai) => setWordAi(book.id, cls.id, wid, ai)} />
        ) : rows.length === 0 ? (
          <div className="course-empty"><div className="glyph">{sub === "known" ? "✓" : "—"}</div><p>{cls.words.length === 0 ? "No words yet — tap “Import words” to add some." : sub === "known" ? "Nothing marked known yet." : "Every word here is known. Nice."}</p></div>
        ) : (
          <div className="cw-list">
            {rows.map((w) => <CWRow key={w.id} w={w} audio={audio} onKnown={(wid, val) => setWordKnown(book.id, cls.id, wid, val)} />)}
          </div>
        )}
      </div>
    );
  }

  return null;
}

/* ---- class word-list import box ---- */
function ClassImport({ onImport, onCancel }) {
  const [text, setText] = useState("");
  const fileRef = useRef(null);
  const onFile = (e) => { const f = e.target.files && e.target.files[0]; if (!f) return; const r = new FileReader(); r.onload = () => setText(String(r.result || "")); r.readAsText(f); };
  const count = useMemo(() => new Set(parseWordList(text)).size, [text]);
  return (
    <div className="panel-card course-import">
      <h2>Import words into this class</h2>
      <p className="sub">Just the words — one per line or comma-separated, e.g. <code>abandon, test</code>. Each is matched to your dictionary; any word that isn’t there goes to a review pool below.</p>
      <div className="field"><textarea className="import-csv import-words" value={text} onChange={(e) => setText(e.target.value)} spellCheck="false" placeholder={"abandon, ability, able\nabolish\nabout"} /></div>
      <div className="form-actions" style={{ marginTop: 14 }}>
        <button className="txtbtn primary" onClick={() => onImport(text)} disabled={!count}><CIcon.upload /> Import {count} {count === 1 ? "word" : "words"}</button>
        <button className="filebtn" onClick={() => fileRef.current && fileRef.current.click()}><CIcon.upload /> Choose file</button>
        <button className="txtbtn" onClick={onCancel}>Cancel</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: "none" }} onChange={onFile} />
      </div>
    </div>
  );
}

window.CoursesPage = CoursesPage;
})();
