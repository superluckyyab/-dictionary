/* global React, ReactDOM, window, document, localStorage */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLOR = {
  A1: "var(--lvl-a1)", A2: "var(--lvl-a2)", B1: "var(--lvl-b1)",
  B2: "var(--lvl-b2)", C1: "var(--lvl-c1)", C2: "var(--lvl-c2)",
};
const STORE_KEY = "lexicon.words.v1";

/* ---------------- icons ---------------- */
const Icon = {
  search: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>),
  x: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  speaker: (p) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>),
  bookmark: (filled) => (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" {...p}><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>),
  chev: (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M9 6l6 6-6 6"/></svg>),
  external: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>),
  spark: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" fill="currentColor" stroke="none"/></svg>),
  loader: (p) => (<svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round"/></svg>),
  plus: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  upload: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>),
  trash: (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>),
};

/* ---------------- storage + dedupe ---------------- */
// Two entries are "the same word" when headword + part of speech match.
// (e.g. about/adverb and about/preposition stay separate — that's correct —
//  but two abandon/verb rows get merged into one.)
function wordKey(w) {
  return (w.word || "").trim().toLowerCase() + "|" + (w.pos || "").trim().toLowerCase();
}
function dedupeWords(list) {
  const map = new Map();
  for (const w of list) {
    const k = wordKey(w);
    const ex = map.get(k);
    if (!ex) {
      map.set(k, { ...w });
    } else {
      // merge duplicates: keep total collect count, richest content
      ex.fav = (ex.fav || 0) + (w.fav || 0);
      if (!ex.def && w.def) ex.def = w.def;
      if (!ex.ai && w.ai) ex.ai = w.ai;
      if (!LEVELS.includes(ex.level) && LEVELS.includes(w.level)) ex.level = w.level;
      if (!ex.audioUrl && w.audioUrl) ex.audioUrl = w.audioUrl;
      if ((!ex.defUrl || /undefined/.test(ex.defUrl)) && w.defUrl) ex.defUrl = w.defUrl;
    }
  }
  return [...map.values()];
}

function loadWords() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (raw) return dedupeWords(JSON.parse(raw)); // clean up any existing duplicates
  } catch (e) {}
  // first run: seed with a few pre-collected words so Favorites is populated
  const presets = { abandon: 3, ubiquitous: 2, accommodate: 1 };
  return dedupeWords((window.SEED_WORDS || []).map((w) => ({
    ...w, fav: presets[w.word] || 0, ai: null,
  })));
}

/* ---------------- audio ---------------- */
function useAudio() {
  const [playing, setPlaying] = useState(null);
  const ref = useRef(null);
  const play = useCallback((word) => {
    if (ref.current) { try { ref.current.pause(); } catch (e) {} ref.current = null; }
    setPlaying(word.id);
    const done = () => setPlaying((p) => (p === word.id ? null : p));
    const speak = () => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word.word);
        u.lang = "en-US"; u.rate = 0.92;
        u.onend = done; u.onerror = done;
        window.speechSynthesis.speak(u);
      } catch (e) { done(); }
    };
    if (word.audioUrl) {
      const a = new Audio(word.audioUrl);
      ref.current = a;
      a.onended = done;
      a.onerror = () => { ref.current = null; speak(); };
      a.play().catch(() => { ref.current = null; speak(); });
    } else {
      speak();
    }
  }, []);
  return { playing, play };
}

/* ---------------- CEFR badge ---------------- */
function Cefr({ level }) {
  const known = LEVELS.includes(level);
  return <span className="cefr" style={{ background: known ? LEVEL_COLOR[level] : "var(--ink-faint)" }} title={known ? ("CEFR " + level) : "Level not set"}>{known ? level : "?"}</span>;
}

/* ---------------- one dictionary entry ---------------- */
const Entry = React.memo(function Entry({ w, isPlaying, onPlay, onCollect, onOpenReader, active }) {
  return (
    <div className={"entry" + (active ? " active" : "")}>
      <div className="entry-head" onClick={() => onOpenReader(w)}>
        <div className="entry-headword-wrap">
          <div className="entry-headword">
            <span className="chev"><Icon.chev /></span>
            {w.word}
          </div>
          <div className="entry-pos">
            <em>{w.pos}</em>
            {w.fav > 0 && (<><span className="dot">·</span><span className="collected-note">collected ×{w.fav}</span></>)}
          </div>
        </div>
        <div className="entry-actions" onClick={(e) => e.stopPropagation()}>
          <Cefr level={w.level} />
          <button className={"iconbtn" + (isPlaying ? " playing" : "")} title="Pronounce" onClick={() => onPlay(w)}>
            <Icon.speaker />
          </button>
          <button
            className={"iconbtn" + (w.fav > 0 ? " faved" : "")}
            title={w.fav > 0 ? "Collect again (re-file)" : "Add to wordbook"}
            onClick={() => onCollect(w.id)}
          >
            {Icon.bookmark(w.fav > 0)({})}
            {w.fav > 0 && <span className="fav-count">{w.fav}</span>}
          </button>
        </div>
      </div>
    </div>
  );
});

/* ---------------- AI explain prompt (friend-style, EN explains EN) ---------------- */
function buildExplainPrompt(word, pos, attempt, previous) {
  let p =
    "You are explaining the English word \"" + word + "\" (used as a " + pos + ") to an English learner, " +
    "like a close friend chatting over coffee — warm, casual, and encouraging. " +
    "VERY IMPORTANT: reply ONLY in English. Never use Chinese or any other language. Explain English with English. " +
    "Use the simplest, most common everyday words a beginner already knows. " +
    "Return STRICT JSON only, no extra text, exactly these keys: " +
    "{\"meaning\":\"one short sentence of plain, everyday English (no hard words)\"," +
    "\"example\":\"one natural sentence from daily life that uses the word\"," +
    "\"tip\":\"a short friendly note: when/where people use it, its feeling/tone, or a common word it pairs with\"," +
    "\"level\":\"your best guess of its CEFR level, one of A1 A2 B1 B2 C1 C2\"}.";
  if (attempt > 0) {
    p += " The learner did NOT understand the previous explanation — it was too complex or used words that were too hard. " +
      "Try a COMPLETELY different way this time: even simpler, shorter words, a fresh everyday example, and do not reuse the same phrasing. ";
    if (previous && previous.meaning) p += "Avoid repeating this earlier wording: \"" + previous.meaning + "\". ";
    if (attempt >= 2) p += "Imagine you are explaining to a young child now — be as plain as you possibly can. ";
  }
  return p;
}

function parseExplain(res) {
  let parsed = null;
  try { parsed = JSON.parse(res); }
  catch (e) { const m = res && res.match(/\{[\s\S]*\}/); if (m) { try { parsed = JSON.parse(m[0]); } catch (e2) {} } }
  if (parsed && parsed.meaning) return { meaning: parsed.meaning, example: parsed.example || "", tip: parsed.tip || "", level: parsed.level || "" };
  return { meaning: (res || "").trim().slice(0, 240), example: "", tip: "", level: "" };
}

/* ---------------- Tokenized text: every word is an independent token ---------------- */
function Tokenized({ text, onWord, current }) {
  if (!text) return null;
  const parts = String(text).split(/([A-Za-z][A-Za-z'’-]*)/);
  return parts.map((p, i) => {
    if (/^[A-Za-z][A-Za-z'’-]*$/.test(p)) {
      const isCur = current && p.toLowerCase() === current.toLowerCase();
      return (
        <span
          key={i}
          className={"wtok" + (isCur ? " cur" : "")}
          onClick={(e) => { e.stopPropagation(); onWord(p.toLowerCase(), e.currentTarget); }}
        >{p}</span>
      );
    }
    return <React.Fragment key={i}>{p}</React.Fragment>;
  });
}

/* ---------------- Reader panel (loads content directly) ---------------- */
function Reader({ word, audio, onCollect, onRecollect, onUncollect, onAi, onLookup, onClose }) {
  const [loading, setLoading] = useState(false);
  const [embed, setEmbed] = useState(false); // optional Oxford iframe
  const [embedFailed, setEmbedFailed] = useState(false);
  const embedLoaded = useRef(false);
  const attemptRef = useRef(0);

  const fetchExplain = useCallback(async (attempt, previous) => {
    setLoading(true);
    try {
      const res = await window.claude.complete(buildExplainPrompt(word.word, word.pos, attempt, previous));
      return parseExplain(res);
    } catch (e) {
      return { meaning: "Could not reach the AI tutor right now. Tap “Explain it differently” to try again.", example: "", tip: "" };
    } finally {
      setLoading(false);
    }
  }, [word && word.id]);

  // Auto-fetch the friendly explanation the moment a word opens (if not cached).
  useEffect(() => {
    if (!word) return;
    setEmbed(false); setEmbedFailed(false); embedLoaded.current = false;
    attemptRef.current = 0;
    if (word.ai && word.ai.meaning) return; // re-fetch if missing or old format
    let alive = true;
    (async () => {
      const ai = await fetchExplain(0, null);
      if (alive) onAi(word.id, ai);
    })();
    return () => { alive = false; };
  }, [word && word.id]);

  if (!word) return null;
  const playing = audio.playing === word.id;

  // Each word in the panel text is an independent token; clicking it offers lookup.
  const onWordClick = (w, el) => {
    if (!onLookup) return;
    if (w === word.word.toLowerCase()) { onLookup(null); return; }
    const rect = el.getBoundingClientRect();
    onLookup({ word: w, rect: { left: rect.left, top: rect.top, bottom: rect.bottom, right: rect.right } });
  };

  // Each press tries a fresh, simpler phrasing.
  const regen = async () => {
    attemptRef.current += 1;
    const ai = await fetchExplain(attemptRef.current, word.ai);
    onAi(word.id, ai);
  };

  return (
    <>
      <div className="reader-overlay" onClick={onClose} />
      <aside className="reader">
        <div className="reader-top">
          <div className="rt-word">{word.word}<span>{word.pos}</span></div>
          <a className="txtbtn" href={word.defUrl} target="_blank" rel="noopener noreferrer"><Icon.external /> New tab</a>
          <button className="iconbtn" onClick={onClose} title="Close"><Icon.x /></button>
        </div>

        <div className="reader-scroll">
          <div className="reader-tip"><Icon.search style={{ width: 13, height: 13, flexShrink: 0 }} /> Tap any word below to look it up or collect it.</div>
          {/* hero */}
          <div className="reader-hero">
            <div className="rh-row">
              <h2 className="rh-word">{word.word}</h2>
              <Cefr level={word.level} />
            </div>
            <div className="rh-pos"><em>{word.pos}</em></div>
            <div className="rh-actions">
              <button className={"reader-say" + (playing ? " playing" : "")} onClick={() => audio.play(word)}>
                <Icon.speaker /> {playing ? "Playing…" : "Pronounce"}
              </button>
              <button className={"reader-collect" + (word.fav > 0 ? " on" : "")} onClick={() => onCollect(word.id)}>
                {Icon.bookmark(word.fav > 0)({ width: 15, height: 15 })}
                {word.fav > 0 ? "Collect again ×" + word.fav : "Collect"}
              </button>
            </div>
            {word.fav > 0 && (
              <div className="rh-subactions">
                <button className="txtbtn recollect" onClick={() => onRecollect(word.id, -1)} title="File once less">− Forget once</button>
                <button className="txtbtn recollect" onClick={() => onUncollect(word.id)} title="Remove from collected"><Icon.trash /> Uncollect</button>
              </div>
            )}
          </div>

          {/* definition */}
          <section className="reader-sec">
            <h3 className="rs-label">Definition</h3>
            {word.def
              ? <p className="rs-def"><Tokenized text={word.def} onWord={onWordClick} current={word.word} /></p>
              : <p className="rs-empty">No definition recorded — the AI gloss below stands in for now.</p>}
          </section>

          {/* AI, auto-loaded — friend-style, English explains English */}
          <section className="reader-sec">
            <h3 className="rs-label"><Icon.spark style={{ color: "var(--gold)" }} /> In plainer words</h3>
            {loading && !word.ai ? (
              <div className="rs-loading"><Icon.loader /> Explaining it like a friend would…</div>
            ) : word.ai ? (
              <div className="rs-ai">
                <div className="rs-ai-line">
                  <span className="rs-ai-key">Meaning</span>
                  <p className="rs-ai-val"><Tokenized text={word.ai.meaning} onWord={onWordClick} current={word.word} /></p>
                </div>
                {word.ai.example && (
                  <div className="rs-ai-line">
                    <span className="rs-ai-key">Example 🌰</span>
                    <p className="rs-ai-val rs-ai-ex">“<Tokenized text={word.ai.example} onWord={onWordClick} current={word.word} />”</p>
                  </div>
                )}
                {word.ai.tip && (
                  <div className="rs-ai-line">
                    <span className="rs-ai-key">Tip</span>
                    <p className="rs-ai-val rs-ai-tip"><Tokenized text={word.ai.tip} onWord={onWordClick} current={word.word} /></p>
                  </div>
                )}
                <button className="txtbtn" onClick={regen} disabled={loading} style={{ marginTop: 6 }}>
                  {loading ? <Icon.loader /> : <Icon.spark />} {loading ? "Rethinking…" : "Still unclear? Explain it differently"}
                </button>
              </div>
            ) : (
              <button className="txtbtn primary" onClick={regen}><Icon.spark /> Explain like a friend</button>
            )}
          </section>

          {/* Oxford full entry */}
          <section className="reader-sec">
            <h3 className="rs-label">Full Oxford entry</h3>
            {!embed ? (
              <div className="rs-oxford">
                <p className="rs-empty" style={{ margin: "0 0 12px" }}>Oxford usually blocks in-app embedding. Open the live page for full examples and audio, or try loading it here.</p>
                <div className="rs-oxford-actions">
                  <a className="txtbtn primary" href={word.defUrl} target="_blank" rel="noopener noreferrer"><Icon.external /> Open on Oxford</a>
                  <button className="txtbtn" onClick={() => { setEmbed(true); setEmbedFailed(false); }}>Try loading here</button>
                </div>
              </div>
            ) : (
              <div className="reader-frame-wrap">
                <iframe
                  key={word.id}
                  src={word.defUrl}
                  title={"Oxford entry for " + word.word}
                  onLoad={() => { embedLoaded.current = true; }}
                  referrerPolicy="no-referrer"
                />
                <button className="frame-x" onClick={() => setEmbed(false)} title="Hide"><Icon.x /></button>
              </div>
            )}
          </section>
        </div>
      </aside>
    </>
  );
}

/* ---------------- Level filter row ---------------- */
function LevelFilter({ active, onToggle }) {
  return (
    <div className="levelrow">
      <span className="lbl">Level</span>
      {LEVELS.map((lv) => (
        <button key={lv} className={"lvl-chip" + (active.includes(lv) ? " on" : "")}
          style={active.includes(lv) ? { background: LEVEL_COLOR[lv] } : null}
          onClick={() => onToggle(lv)}>{lv}</button>
      ))}
    </div>
  );
}

/* ---------------- Add-word form ---------------- */
function AddWord({ onAdd }) {
  const [f, setF] = useState({ word: "", level: "A1", pos: "noun", def: "", defUrl: "", audioUrl: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const submit = (e) => {
    e.preventDefault();
    if (!f.word.trim()) return;
    onAdd({
      word: f.word.trim().toLowerCase(),
      level: f.level, pos: f.pos.trim() || "noun",
      def: f.def.trim(),
      defUrl: f.defUrl.trim() || ("https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(f.word.trim().toLowerCase())),
      audioUrl: f.audioUrl.trim(),
    });
    setF({ word: "", level: "A1", pos: "noun", def: "", defUrl: "", audioUrl: "" });
  };
  return (
    <form className="panel-card" onSubmit={submit}>
      <h2>Add a word by hand</h2>
      <p className="sub">Enter a single word. Leave the definition blank and let the AI tutor draft one for you.</p>
      <div className="field row2">
        <div><label>Headword</label><input value={f.word} onChange={set("word")} placeholder="serendipity" autoFocus /></div>
        <div><label>Part of speech</label>
          <select value={f.pos} onChange={set("pos")}>
            {["noun","verb","adjective","adverb","preposition","pronoun","conjunction","determiner","phrase"].map((p) => <option key={p}>{p}</option>)}
          </select>
        </div>
      </div>
      <div className="field">
        <label>CEFR level</label>
        <div className="lvl-picker">
          {LEVELS.map((lv) => (
            <button type="button" key={lv} className={f.level === lv ? "on" : ""}
              style={f.level === lv ? { background: LEVEL_COLOR[lv] } : null}
              onClick={() => setF((s) => ({ ...s, level: lv }))}>{lv}</button>
          ))}
        </div>
      </div>
      <div className="field"><label>Definition (English, optional)</label>
        <textarea value={f.def} onChange={set("def")} placeholder="An English-to-English definition…" /></div>
      <div className="field row2">
        <div><label>Oxford entry URL (optional)</label><input value={f.defUrl} onChange={set("defUrl")} placeholder="https://…" /></div>
        <div><label>Audio .ogg URL (optional)</label><input value={f.audioUrl} onChange={set("audioUrl")} placeholder="https://… (else read aloud)" /></div>
      </div>
      <div className="form-actions">
        <button className="txtbtn primary" type="submit"><Icon.plus /> Add to wordbook</button>
      </div>
    </form>
  );
}

/* ---------------- CSV import ---------------- */
function parseCsv(text) {
  const out = [];
  text.split(/\r?\n/).forEach((line) => {
    const t = line.trim();
    if (!t) return;
    const parts = t.split(",").map((s) => s.trim());
    if (parts.length < 3) return;
    const [word, level, pos, defUrl, audioUrl] = parts;
    const lv = (level || "").toUpperCase();
    if (!word || word.toLowerCase() === "word") return; // skip header
    out.push({
      word: word.toLowerCase(),
      level: LEVELS.includes(lv) ? lv : "A1",
      pos: pos || "noun",
      def: "",
      defUrl: defUrl || ("https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(word.toLowerCase())),
      audioUrl: audioUrl || "",
    });
  });
  return out;
}

function ImportCsv({ onImport }) {
  const [text, setText] = useState(
    "abandon,b2,verb,https://www.oxfordlearnersdictionaries.com/definition/english/abandon_1,https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg"
  );
  const fileRef = useRef(null);
  const onFile = (e) => {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result || ""));
    r.readAsText(file);
  };
  const doImport = () => {
    const rows = parseCsv(text);
    if (rows.length) onImport(rows);
  };
  const previewCount = useMemo(() => parseCsv(text).length, [text]);
  return (
    <div className="panel-card">
      <h2>Batch import (CSV)</h2>
      <p className="sub">One word per line: <code>word, level, pos, oxford-url, audio-url</code>. Headers and blank lines are ignored.</p>
      <div className="field">
        <label>Paste rows</label>
        <textarea className="import-csv" value={text} onChange={(e) => setText(e.target.value)} spellCheck="false" />
      </div>
      <p className="import-hint">
        Example: <code>ability,a2,noun,https://…/ability_1,https://…/ability__us_4.ogg</code><br/>
        Definitions are left blank on import — open any word and tap <em>Explain simply</em> to fill it in.
      </p>
      <div className="form-actions" style={{ marginTop: 16 }}>
        <button className="txtbtn primary" onClick={doImport} disabled={!previewCount}>
          <Icon.upload /> Import {previewCount} {previewCount === 1 ? "word" : "words"}
        </button>
        <button className="filebtn" onClick={() => fileRef.current && fileRef.current.click()}>
          <Icon.upload /> Choose .csv file
        </button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" style={{ display: "none" }} onChange={onFile} />
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [words, setWords] = useState(loadWords);
  const [tab, setTab] = useState("dictionary"); // dictionary | favorites | add | import
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState([]);
  const [reader, setReader] = useState(null);
  const [lookup, setLookup] = useState(null); // { word, rect } from text selection
  const [toast, setToast] = useState(null);
  const [visibleCount, setVisibleCount] = useState(80);
  const sentinelRef = useRef(null);
  const audio = useAudio();

  useEffect(() => {
    try { localStorage.setItem(STORE_KEY, JSON.stringify(words)); } catch (e) {}
  }, [words]);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

  // Dismiss the selection-lookup popover on outside click, scroll, or Esc.
  useEffect(() => {
    if (!lookup) return;
    const close = (e) => { if (e.target.closest && e.target.closest(".lookup-pop")) return; setLookup(null); };
    const onScroll = () => setLookup(null);
    const onKey = (e) => { if (e.key === "Escape") setLookup(null); };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [lookup]);

  const flash = (m) => setToast(m);

  const collect = useCallback((id) => setWords((ws) => ws.map((w) => w.id === id ? { ...w, fav: (w.fav || 0) + 1 } : w)), []);
  const recollect = useCallback((id, delta) => setWords((ws) => ws.map((w) => w.id === id ? { ...w, fav: Math.max(0, (w.fav || 0) + delta) } : w)), []);
  const openReader = useCallback((w) => setReader(w), []);
  const playWord = useCallback((w) => audio.play(w), [audio.play]);
  const uncollect = (id) => {
    const w = words.find((x) => x.id === id);
    setWords((ws) => ws.map((x) => x.id === id ? { ...x, fav: 0 } : x));
    if (w) flash("“" + w.word + "” removed from collected");
  };
  const clearAllCollected = () => {
    setWords((ws) => ws.map((w) => ((w.fav || 0) > 0 ? { ...w, fav: 0 } : w)));
    flash("Collected list cleared");
  };
  const setAi = (id, ai) => setWords((ws) => ws.map((w) => {
    if (w.id !== id) return w;
    const next = { ...w, ai };
    // If this word's level was never set, adopt the AI's CEFR estimate.
    if (!LEVELS.includes(w.level) && ai && LEVELS.includes(ai.level)) next.level = ai.level;
    return next;
  }));

  // Find a dictionary entry for a raw word (case-insensitive). Returns entry or null.
  const findEntry = (text) => {
    const t = (text || "").trim().toLowerCase();
    if (!t) return null;
    return words.find((w) => w.word.toLowerCase() === t) || null;
  };
  // Ensure a word exists; create a blank entry if missing. Returns the entry.
  const ensureEntry = (text) => {
    const t = (text || "").trim().toLowerCase();
    const existing = findEntry(t);
    if (existing) return existing;
    const id = "look-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
    const entry = {
      id, word: t, level: "—", pos: "word", def: "", ai: null, fav: 0,
      defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(t),
      audioUrl: "",
    };
    setWords((ws) => [entry, ...ws]);
    return entry;
  };
  // Selection-lookup actions
  const openLookup = (text) => {
    const entry = ensureEntry(text);
    setLookup(null);
    setReader(entry); // reader auto-fetches the friendly explanation
  };
  const collectLookup = (text) => {
    const entry = ensureEntry(text);
    setLookup(null);
    collect(entry.id);
    setReader(entry);
    flash("“" + entry.word + "” collected");
  };

  const addWord = (data) => {
    let merged = false;
    setWords((ws) => {
      const k = wordKey(data);
      if (ws.some((w) => wordKey(w) === k)) {
        merged = true;
        return ws.map((w) => {
          if (wordKey(w) !== k) return w;
          return {
            ...w,
            def: w.def || data.def || "",
            level: LEVELS.includes(w.level) ? w.level : data.level,
            defUrl: w.defUrl || data.defUrl,
            audioUrl: w.audioUrl || data.audioUrl,
          };
        });
      }
      const id = "user-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6);
      return [{ id, fav: 0, ai: null, ...data }, ...ws];
    });
    setTab("dictionary");
    flash(merged ? "“" + data.word + "” already existed — updated it" : "“" + data.word + "” added to the wordbook");
  };
  const importRows = (rows) => {
    const stamp = Date.now();
    let addedCount = 0, skipped = 0;
    setWords((ws) => {
      const seen = new Set(ws.map(wordKey));
      const fresh = [];
      rows.forEach((r, i) => {
        const k = wordKey(r);
        if (seen.has(k)) { skipped++; return; }
        seen.add(k);
        fresh.push({ id: "imp-" + stamp + "-" + i, fav: 0, ai: null, ...r });
        addedCount++;
      });
      return [...fresh, ...ws];
    });
    setTab("dictionary");
    flash("Imported " + addedCount + " " + (addedCount === 1 ? "word" : "words") +
      (skipped ? " · skipped " + skipped + " duplicate" + (skipped === 1 ? "" : "s") : ""));
  };

  const toggleLevel = (lv) => setLevels((ls) => ls.includes(lv) ? ls.filter((x) => x !== lv) : [...ls, lv]);

  const favCount = useMemo(() => words.filter((w) => (w.fav || 0) > 0).length, [words]);

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = words.filter((w) => {
      if (levels.length && !levels.includes(w.level)) return false;
      if (needle) {
        return w.word.toLowerCase().includes(needle) ||
          (w.def && w.def.toLowerCase().includes(needle)) ||
          w.pos.toLowerCase().includes(needle);
      }
      return true;
    });
    if (tab === "favorites") {
      list = list.filter((w) => (w.fav || 0) > 0).sort((a, b) =>
        (b.fav || 0) - (a.fav || 0) || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
    } else {
      list = list.slice().sort((a, b) =>
        (a.word < b.word ? -1 : a.word > b.word ? 1 : (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0)));
    }
    return list;
  }, [words, q, levels, tab]);

  // Windowing: only render a slice of the (possibly huge) filtered list.
  useEffect(() => { setVisibleCount(80); }, [q, levels, tab]);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const visRef = useRef(visibleCount); visRef.current = visibleCount;
  const totalRef = useRef(filtered.length); totalRef.current = filtered.length;
  useEffect(() => {
    const check = () => {
      if (visRef.current >= totalRef.current) return;
      const se = document.scrollingElement || document.documentElement;
      const nearBottom = se.scrollHeight - (se.scrollTop + window.innerHeight) < 1000;
      if (nearBottom) setVisibleCount((c) => Math.min(c + 80, totalRef.current));
    };
    window.addEventListener("scroll", check, { passive: true });
    window.addEventListener("resize", check);
    check(); // in case the first page doesn't fill the viewport
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [filtered.length, tab]);

  const showList = tab === "dictionary" || tab === "favorites";

  return (
    <div className={"app" + (reader ? " reader-open" : "")}>
      <main className="shell">
        <header className="masthead">
          <div className="crest">
            <h1>Lexicon</h1>
            <span className="crest-rule" />
            <span className="crest-meta">{words.length} entries</span>
          </div>
          <p className="tagline">A reader’s wordbook — collect what slips, hear it, and have it put plainly.</p>

          <div className="searchbar">
            <span className="s-icon"><Icon.search /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word, part of speech, or meaning…" />
            {q && <button className="s-clear" onClick={() => setQ("")}><Icon.x /></button>}
          </div>

          <nav className="tabs">
            <button className={"tab" + (tab === "dictionary" ? " active" : "")} onClick={() => setTab("dictionary")}>
              Dictionary <span className="pill">{words.length}</span>
            </button>
            <button className={"tab" + (tab === "favorites" ? " active" : "")} onClick={() => setTab("favorites")}>
              {Icon.bookmark(true)({ width: 13, height: 13 })} Collected <span className="pill">{favCount}</span>
            </button>
            <button className={"tab" + (tab === "add" ? " active" : "")} onClick={() => setTab("add")}>
              <Icon.plus /> Add
            </button>
            <button className={"tab" + (tab === "import" ? " active" : "")} onClick={() => setTab("import")}>
              <Icon.upload /> Import
            </button>
          </nav>
        </header>

        {showList && <LevelFilter active={levels} onToggle={toggleLevel} />}

        {tab === "add" && <AddWord onAdd={addWord} />}
        {tab === "import" && <ImportCsv onImport={importRows} />}

        {showList && (
          <>
            <div className="list-bar">
              <p className="count-note">
                {tab === "favorites"
                  ? (filtered.length ? "Most often collected first — the ones you keep forgetting." : "")
                  : null}
                {tab === "dictionary" && (q || levels.length)
                  ? filtered.length + " of " + words.length + " entries"
                  : null}
              </p>
              {tab === "favorites" && favCount > 0 && (
                <button className="clear-all" onClick={clearAllCollected}>
                  <Icon.trash /> Clear all ({favCount})
                </button>
              )}
            </div>

            {filtered.length === 0 ? (
              <div className="empty">
                <div className="glyph">{tab === "favorites" ? "✦" : "—"}</div>
                <p>{tab === "favorites"
                  ? "Nothing collected yet. Tap the ribbon on a word to file it here."
                  : "No entries match your search."}</p>
              </div>
            ) : (
              <div className="entries">
                {visible.map((w) => (
                  <Entry
                    key={w.id} w={w}
                    isPlaying={audio.playing === w.id}
                    onPlay={playWord}
                    onCollect={collect} onOpenReader={openReader}
                    active={reader && reader.id === w.id}
                  />
                ))}
                {visibleCount < filtered.length && (
                  <div ref={sentinelRef} className="load-more">
                    <span>Showing {visible.length} of {filtered.length}</span>
                    <button className="txtbtn" onClick={() => setVisibleCount((c) => Math.min(c + 200, filtered.length))}>Load more</button>
                  </div>
                )}
              </div>
            )}
          </>
        )}
      </main>

      {reader && (
        <Reader
          word={words.find((x) => x.id === reader.id) || reader}
          audio={audio}
          onCollect={collect}
          onRecollect={recollect}
          onUncollect={(id) => { uncollect(id); }}
          onAi={setAi}
          onLookup={setLookup}
          onClose={() => { setReader(null); setLookup(null); }}
        />
      )}

      {lookup && (() => {
        const existing = findEntry(lookup.word);
        const r = lookup.rect;
        const left = Math.max(12, Math.min(r.left, window.innerWidth - 248));
        const below = r.bottom + 184 < window.innerHeight;
        const top = below ? r.bottom + 8 : r.top - 8;
        return (
          <div className="lookup-pop" style={{ left, top, transform: below ? "none" : "translateY(-100%)" }} onMouseDown={(e) => e.preventDefault()}>
            <div className="lp-word">
              {lookup.word}
              <span className={"lp-status" + (existing ? " in" : "")}>
                {existing ? "in your dictionary" + (LEVELS.includes(existing.level) ? " · " + existing.level : "") : "not in the dictionary yet"}
              </span>
            </div>
            <div className="lp-actions">
              <button className="txtbtn primary" onClick={() => openLookup(lookup.word)}>
                <Icon.spark /> Explain
              </button>
              <button className="txtbtn" onClick={() => collectLookup(lookup.word)} title="Collect this word">
                {Icon.bookmark(false)({ width: 14, height: 14 })} Collect
              </button>
            </div>
          </div>
        );
      })()}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
