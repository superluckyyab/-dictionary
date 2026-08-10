/* global React, ReactDOM, window, document, localStorage, fetch */
const { useState, useEffect, useRef, useMemo, useCallback } = React;

const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLOR = {
  A1: "var(--lvl-a1)", A2: "var(--lvl-a2)", B1: "var(--lvl-b1)",
  B2: "var(--lvl-b2)", C1: "var(--lvl-c1)", C2: "var(--lvl-c2)",
};

/* ---------------- API helpers ---------------- */
async function apiCall(method, path, body) {
  try {
    const opts = { method, headers: { "Content-Type": "application/json" } };
    if (body !== undefined) opts.body = JSON.stringify(body);
    const r = await fetch("/api" + path, opts);
    if (!r.ok) throw new Error("HTTP " + r.status);
    if (r.status === 204) return null;
    return r.json();
  } catch (e) {
    console.error("API error", method, path, e);
    return null;
  }
}

function apiPatch(id, data) {
  if (typeof id === "number") apiCall("PATCH", "/words/" + id, data);
}

/* Map backend WordOut → frontend word object */
function fromBackend(w) {
  const defs = w.definitions || [];
  let ai = null;
  if (w.ai_explanation) {
    try { ai = JSON.parse(w.ai_explanation); } catch (e) {}
  }
  return {
    id: w.id,
    word: w.word,
    pos: w.part_of_speech || "noun",
    level: w.level || "?",
    def: (defs[0] || {}).sense || "",
    fav: w.collected_count || 0,
    known: w.status === "known" ? "yes" : "no",
    audioUrl: w.audio_url || "",
    defUrl: w.def_url || ("https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(w.word)),
    ai,
  };
}

/* ---------------- icons ---------------- */
const Icon = {
  search: (p) => (<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>),
  x: (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M6 6l12 12M18 6L6 18"/></svg>),
  speaker: (p) => (<svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M11 5L6 9H3v6h3l5 4V5z" fill="currentColor" stroke="none"/><path d="M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"/></svg>),
  bookmark: (filled) => (p) => (<svg width="16" height="16" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.6" {...p}><path d="M6 3h12v18l-6-4-6 4V3z"/></svg>),
  chev: (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" {...p}><path d="M9 6l6 6-6 6"/></svg>),
  check: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" {...p}><path d="M5 12.5l4.5 4.5L19 7" strokeLinecap="round" strokeLinejoin="round"/></svg>),
  cards: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="7" y="3" width="14" height="17" rx="1.5"/><path d="M3 7v13a1.5 1.5 0 0 0 1.5 1.5H17"/></svg>),
  book: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5z"/><path d="M8 3v17"/></svg>),
  library: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><rect x="3" y="4" width="5" height="16" rx="1"/><rect x="10" y="4" width="5" height="16" rx="1"/><path d="M17.5 5l3.2 14.6"/></svg>),
  external: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" {...p}><path d="M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"/></svg>),
  spark: (p) => (<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" {...p}><path d="M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z" fill="currentColor" stroke="none"/></svg>),
  loader: (p) => (<svg className="spin" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" {...p}><path d="M12 3a9 9 0 1 0 9 9" strokeLinecap="round"/></svg>),
  plus: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" {...p}><path d="M12 5v14M5 12h14"/></svg>),
  upload: (p) => (<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M12 16V4M7 9l5-5 5 5M5 20h14"/></svg>),
  trash: (p) => (<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" {...p}><path d="M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"/></svg>),
};

/* ---------------- dedupe key ---------------- */
function wordKey(w) {
  return (w.word || "").trim().toLowerCase() + "|" + (w.pos || "").trim().toLowerCase();
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

/* ---------------- Phonics syllable splitter ---------------- */
const _sylCache = new Map();
const SYL_ONSET = new Set(["bl","br","ch","cl","cr","dr","fl","fr","gl","gr","pl","pr","sc","sh","sk","sl","sm","sn","sp","st","sw","th","tr","tw","wh","wr","ph","qu","gh"]);
function _isVowLetter(c) { return "aeiou".includes(c); }
function _syllabify(word) {
  const orig = String(word);
  const w = orig.toLowerCase();
  if (!/^[a-z]+$/.test(w) || w.length <= 3) return [orig];
  const isVow = (i) => "aeiou".includes(w[i]) || (w[i] === "y" && i > 0);

  const nuclei = [];
  let i = 0;
  while (i < w.length) {
    if (isVow(i)) {
      let j = i;
      while (j + 1 < w.length && isVow(j + 1)) j++;
      nuclei.push([i, j]);
      i = j + 1;
    } else i++;
  }
  if (nuclei.length <= 1) return [orig];

  const N = nuclei;
  let splits = [];
  for (let k = 0; k < N.length - 1; k++) {
    const leftEnd = N[k][1];
    const rightStart = N[k + 1][0];
    const gapStart = leftEnd + 1;
    const gapLen = rightStart - gapStart;
    let splitAt;
    if (gapLen <= 0) {
      splitAt = rightStart;
    } else if (gapLen === 1) {
      splitAt = gapStart;
    } else {
      const two = w.slice(gapStart, gapStart + 2);
      const lastTwo = w.slice(rightStart - 2, rightStart);
      if (gapLen === 2) {
        if (two === "ck" || two === "ng" || two === "dg") splitAt = rightStart;
        else if (SYL_ONSET.has(two)) splitAt = gapStart;
        else splitAt = gapStart + 1;
      } else {
        if (SYL_ONSET.has(lastTwo)) splitAt = rightStart - 2;
        else splitAt = rightStart - 1;
      }
    }
    splits.push(splitAt);
  }

  if (w.length >= 4 && w.endsWith("le") && !_isVowLetter(w[w.length - 3]) && w[w.length - 3] !== "l") {
    const cle = w.length - 3;
    splits = splits.filter((s) => s < cle);
    splits.push(cle);
  }
  if (w.endsWith("e") && !w.endsWith("le")) {
    const lastN = N[N.length - 1];
    if (lastN[0] === lastN[1] && lastN[0] === w.length - 1 && N.length >= 2 && splits.length) {
      const maxSplit = Math.max.apply(null, splits);
      splits = splits.filter((s) => s !== maxSplit);
    }
  }

  splits = Array.from(new Set(splits)).filter((s) => s > 0 && s < w.length).sort((a, b) => a - b);
  const bounds = [0, ...splits, w.length];
  const out = [];
  for (let k = 0; k < bounds.length - 1; k++) {
    const piece = orig.slice(bounds[k], bounds[k + 1]);
    if (piece) out.push(piece);
  }
  return out.length ? out : [orig];
}
function syllabify(word) {
  if (_sylCache.has(word)) return _sylCache.get(word);
  const r = _syllabify(word);
  _sylCache.set(word, r);
  return r;
}

function Syllabified({ word }) {
  const syl = syllabify(word);
  if (syl.length <= 1) return <>{word}</>;
  return (
    <span className="splitword">
      {syl.map((s, i) => (
        <React.Fragment key={i}>
          {i > 0 && <span className="sylsep">·</span>}
          <span className={"syl syl-" + (i % 2)}>{s}</span>
        </React.Fragment>
      ))}
    </span>
  );
}

/* ---------------- CEFR badge ---------------- */
function Cefr({ level }) {
  const known = LEVELS.includes(level);
  return <span className="cefr" style={{ background: known ? LEVEL_COLOR[level] : "var(--ink-faint)" }} title={known ? ("CEFR " + level) : "Level not set"}>{known ? level : "?"}</span>;
}

/* ---------------- one dictionary entry ---------------- */
const Entry = React.memo(function Entry({ w, isPlaying, onPlay, onCollect, onSetKnown, onOpenReader, active, manage, checked, onToggleSelect, defMode, expanded, onToggleExpand, onAi }) {
  const [aiLoading, setAiLoading] = React.useState(false);
  const showDef = !manage && (defMode === "all" || (defMode === "test" && w.known === "yes"));

  React.useEffect(() => {
    if (!expanded || (w.ai && w.ai.meaning) || aiLoading) return;
    let alive = true;
    setAiLoading(true);
    (async () => {
      try {
        const res = await window.claude.complete(buildExplainPrompt(w.word, w.pos, 0, null));
        if (alive) onAi(w.id, parseExplain(res));
      } catch (e) {
        if (alive) onAi(w.id, { meaning: "Could not reach the AI tutor — try again.", example: "", tip: "" });
      } finally { if (alive) setAiLoading(false); }
    })();
    return () => { alive = false; };
  }, [expanded, w.id]);

  return (
    <div className={"entry" + (active ? " active" : "") + (w.known ? " known-" + w.known : "") + (manage && checked ? " picked" : "") + (expanded ? " expanded" : "")}>
      <div className="entry-head" onClick={() => manage ? onToggleSelect(w.id) : onOpenReader(w)}>
        {manage && (
          <span className={"pickbox" + (checked ? " on" : "")} aria-label="select">
            {checked && <Icon.check width={13} height={13} />}
          </span>
        )}
        <div className="entry-headword-wrap">
          <div className="entry-headword">
            {!manage && <span className="chev"><Icon.chev /></span>}
            <Syllabified word={w.word} />
          </div>
          <div className="entry-pos">
            <em>{w.pos}</em>
            {w.fav > 0 && (<><span className="dot">·</span><span className="collected-note">collected ×{w.fav}</span></>)}
          </div>
        </div>
        <div className="entry-actions" onClick={(e) => e.stopPropagation()} style={manage ? { opacity: .35, pointerEvents: "none" } : null}>
          <button
            className={"know-switch" + (w.known === "yes" ? " on" : "")}
            role="switch" aria-checked={w.known === "yes"}
            title={w.known === "yes" ? "Known — tap to mark unknown" : "Unknown — tap to mark known"}
            onClick={() => onSetKnown(w.id, w.known === "yes" ? "no" : "yes")}
          >
            <span className="ks-knob">{w.known === "yes" ? <Icon.check width={12} height={12} /> : <Icon.x width={12} height={12} />}</span>
          </button>
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

      {showDef && (
        <div className="entry-reveal">
          <div className={"entry-def-line" + (expanded ? " open" : "")} onClick={() => onToggleExpand(w.id)}>
            {w.def
              ? <span className="entry-def-text">{w.def}</span>
              : <span className="entry-def-empty">No short definition — tap for a plain-English explanation.</span>}
            <span className="entry-def-cue">{expanded ? "Hide" : "Detail"}</span>
          </div>
          {expanded && (
            <div className="entry-detail">
              {aiLoading && !(w.ai && w.ai.meaning) ? (
                <div className="rs-loading"><Icon.loader /> Explaining it like a friend would…</div>
              ) : (w.ai && w.ai.meaning) ? (
                <>
                  <div className="rs-ai-line"><span className="rs-ai-key">Meaning</span><p className="rs-ai-val">{w.ai.meaning}</p></div>
                  {w.ai.example && <div className="rs-ai-line"><span className="rs-ai-key">Example 🌰</span><p className="rs-ai-val rs-ai-ex">"{w.ai.example}"</p></div>}
                  {w.ai.tip && <div className="rs-ai-line"><span className="rs-ai-key">Tip</span><p className="rs-ai-val rs-ai-tip">{w.ai.tip}</p></div>}
                </>
              ) : null}
            </div>
          )}
        </div>
      )}
    </div>
  );
});

/* ---------------- AI explain prompt ---------------- */
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

/* ---------------- Tokenized text ---------------- */
function Tokenized({ text, onWord, current }) {
  if (!text) return null;
  const parts = String(text).split(/([A-Za-z][A-Za-z''-]*)/);
  return parts.map((p, i) => {
    if (/^[A-Za-z][A-Za-z''-]*$/.test(p)) {
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

/* ---------------- Reader panel ---------------- */
function Reader({ word, audio, onCollect, onRecollect, onUncollect, onAi, onLookup, onClose }) {
  const [loading, setLoading] = useState(false);
  const [embed, setEmbed] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const embedLoaded = useRef(false);
  const attemptRef = useRef(0);

  const fetchExplain = useCallback(async (attempt, previous) => {
    setLoading(true);
    try {
      const res = await window.claude.complete(buildExplainPrompt(word.word, word.pos, attempt, previous));
      return parseExplain(res);
    } catch (e) {
      return { meaning: "Could not reach the AI tutor right now. Tap 'Explain it differently' to try again.", example: "", tip: "" };
    } finally {
      setLoading(false);
    }
  }, [word && word.id]);

  useEffect(() => {
    if (!word) return;
    setEmbed(false); setEmbedFailed(false); embedLoaded.current = false;
    attemptRef.current = 0;
    if (word.ai && word.ai.meaning) return;
    let alive = true;
    (async () => {
      const ai = await fetchExplain(0, null);
      if (alive) onAi(word.id, ai);
    })();
    return () => { alive = false; };
  }, [word && word.id]);

  if (!word) return null;
  const playing = audio.playing === word.id;

  const onWordClick = (w, el) => {
    if (!onLookup) return;
    if (w === word.word.toLowerCase()) { onLookup(null); return; }
    const rect = el.getBoundingClientRect();
    onLookup({ word: w, rect: { left: rect.left, top: rect.top, bottom: rect.bottom, right: rect.right } });
  };

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
          <div className="reader-hero">
            <div className="rh-row">
              <h2 className="rh-word"><Syllabified word={word.word} /></h2>
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

          <section className="reader-sec">
            <h3 className="rs-label">Definition</h3>
            {word.def
              ? <p className="rs-def"><Tokenized text={word.def} onWord={onWordClick} current={word.word} /></p>
              : <p className="rs-empty">No definition recorded — the AI gloss below stands in for now.</p>}
          </section>

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
                    <p className="rs-ai-val rs-ai-ex">"<Tokenized text={word.ai.example} onWord={onWordClick} current={word.word} />"</p>
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

/* ---------------- A–Z letter filter ---------------- */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function LetterFilter({ active, onPick }) {
  return (
    <div className="letterrow">
      <button className={"ltr-chip ltr-all" + (active === "" ? " on" : "")} onClick={() => onPick("")}>All</button>
      {ALPHABET.map((c) => (
        <button key={c} className={"ltr-chip" + (active === c ? " on" : "")} onClick={() => onPick(active === c ? "" : c)}>{c}</button>
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
    if (!word || word.toLowerCase() === "word") return;
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

/* ---------------- Quiz ---------------- */
function QuizPage({ words, audio, onSetKnown, onAi, onLookup }) {
  const [quizLevels, setQuizLevels] = useState([]);
  const [batchSize, setBatchSize] = useState(5);
  const [batchIds, setBatchIds] = useState(null);
  const [answers, setAnswers] = useState({});
  const [aiLoading, setAiLoading] = useState({});

  const pool = useMemo(() => words.filter((w) =>
    w.known !== "yes" && (quizLevels.length === 0 || quizLevels.includes(w.level))
  ), [words, quizLevels]);
  const poolRef = useRef(pool); poolRef.current = pool;
  const sizeRef = useRef(batchSize); sizeRef.current = batchSize;

  const drawBatch = useCallback(() => {
    const p = poolRef.current.slice();
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = p[i]; p[i] = p[j]; p[j] = t;
    }
    setBatchIds(p.slice(0, sizeRef.current).map((w) => w.id));
    setAnswers({});
  }, []);

  useEffect(() => { drawBatch(); }, [quizLevels, batchSize, drawBatch]);

  const cards = (batchIds || []).map((id) => words.find((w) => w.id === id)).filter(Boolean);
  const firstUnanswered = cards.findIndex((w) => !answers[w.id]);
  const visibleCards = firstUnanswered === -1 ? cards : cards.slice(0, firstUnanswered + 1);
  const allAnswered = cards.length > 0 && firstUnanswered === -1;
  const leftInBatch = cards.filter((w) => !answers[w.id]).length;

  const ensureAi = async (w) => {
    if (w.ai && w.ai.meaning) return;
    setAiLoading((s) => ({ ...s, [w.id]: true }));
    try {
      const res = await window.claude.complete(buildExplainPrompt(w.word, w.pos, 0, null));
      onAi(w.id, parseExplain(res));
    } catch (e) {
      onAi(w.id, { meaning: "Could not reach the AI tutor — open the word in the panel to retry.", example: "", tip: "" });
    } finally {
      setAiLoading((s) => ({ ...s, [w.id]: false }));
    }
  };

  const answer = (w, val) => {
    onSetKnown(w.id, val);
    setAnswers((a) => ({ ...a, [w.id]: val }));
    ensureAi(w);
  };

  const onWordClick = (tok, el) => {
    if (!onLookup) return;
    const rect = el.getBoundingClientRect();
    onLookup({ word: tok, rect: { left: rect.left, top: rect.top, bottom: rect.bottom, right: rect.right } });
  };

  const settings = (
    <div className="quiz-settings">
      <div className="qs-group">
        <span className="lbl">Level</span>
        {LEVELS.map((lv) => (
          <button key={lv} className={"lvl-chip" + (quizLevels.includes(lv) ? " on" : "")}
            style={quizLevels.includes(lv) ? { background: LEVEL_COLOR[lv] } : null}
            onClick={() => setQuizLevels((ls) => ls.includes(lv) ? ls.filter((x) => x !== lv) : [...ls, lv])}>{lv}</button>
        ))}
      </div>
      <div className="qs-group">
        <span className="lbl">Words</span>
        {[1, 2, 3, 4, 5].map((n) => (
          <button key={n} className={"size-chip" + (batchSize === n ? " on" : "")} onClick={() => setBatchSize(n)}>{n}</button>
        ))}
      </div>
    </div>
  );

  if (batchIds !== null && cards.length === 0) {
    return (
      <div className="quiz">
        {settings}
        <div className="empty">
          <div className="glyph">✓</div>
          <p>{quizLevels.length
            ? "No unknown words left at " + quizLevels.join(" · ") + ". Pick other levels, or import more words."
            : "No unknown words left — you've cleared the whole dictionary."}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="quiz">
      {settings}
      <p className="quiz-note">
        {pool.length} unknown word{pool.length === 1 ? "" : "s"}{quizLevels.length ? " at " + quizLevels.join(" · ") : ""} — mark them known to clear them.
      </p>

      {visibleCards.map((w, i) => {
        const a = answers[w.id];
        return (
          <div className={"quiz-card" + (a ? " answered" : "")} key={w.id}>
            <div className="qc-row">
              <button className={"qc-btn qc-yes" + (a === "yes" ? " on" : "")} onClick={() => answer(w, "yes")}>
                <Icon.check /> I know it
              </button>
              <div className="qc-word-wrap">
                <div className="qc-index">{i + 1} of {cards.length}</div>
                <div className="qc-word"><Syllabified word={w.word} /></div>
                <div className="qc-meta">
                  <em>{w.pos}</em>
                  <Cefr level={w.level} />
                  <button className={"iconbtn" + (audio.playing === w.id ? " playing" : "")} onClick={() => audio.play(w)} title="Pronounce"><Icon.speaker /></button>
                </div>
              </div>
              <button className={"qc-btn qc-no" + (a === "no" ? " on" : "")} onClick={() => answer(w, "no")}>
                <Icon.x /> Don't know
              </button>
            </div>

            {a && (
              <div className="qc-reveal">
                {w.def && <p className="qc-def"><Tokenized text={w.def} onWord={onWordClick} current={w.word} /></p>}
                {aiLoading[w.id] && !(w.ai && w.ai.meaning) ? (
                  <div className="rs-loading"><Icon.loader /> Fetching a friendly explanation…</div>
                ) : (w.ai && w.ai.meaning) ? (
                  <div className="qc-ai">
                    <p className="qc-meaning"><Tokenized text={w.ai.meaning} onWord={onWordClick} current={w.word} /></p>
                    {w.ai.example && <p className="qc-ex">"<Tokenized text={w.ai.example} onWord={onWordClick} current={w.word} />"</p>}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        );
      })}

      <div className="quiz-foot">
        <button className={"txtbtn quiz-next" + (allAnswered ? " primary" : "")} onClick={drawBatch}>
          Next batch <Icon.chev width={12} height={12} />
        </button>
        {!allAnswered && <span className="quiz-hint">{leftInBatch} left in this batch</span>}
      </div>
    </div>
  );
}

/* ---------------- App ---------------- */
function App() {
  const [words, setWords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("dictionary");
  const [q, setQ] = useState("");
  const [levels, setLevels] = useState([]);
  const [letter, setLetter] = useState("");
  const [reader, setReader] = useState(null);
  const [lookup, setLookup] = useState(null);
  const [toast, setToast] = useState(null);
  const [visibleCount, setVisibleCount] = useState(80);
  const sentinelRef = useRef(null);
  const [manage, setManage] = useState(false);
  const [selected, setSelected] = useState(() => new Set());
  const [confirmDel, setConfirmDel] = useState(false);
  const [defMode, setDefMode] = useState(() => { try { return localStorage.getItem("lexicon.defmode") || "hide"; } catch (e) { return "hide"; } });
  const [expandedId, setExpandedId] = useState(null);
  const audio = useAudio();
  const CoursesPage = window.CoursesPage;
  const wordsRef = useRef(words);
  wordsRef.current = words;

  /* Load all words from backend on mount */
  useEffect(() => {
    (async () => {
      setLoading(true);
      const data = await apiCall("GET", "/words?page_size=99999");
      if (data && data.items) {
        setWords(data.items.map((w) => ({ ...fromBackend(w), ai: null })));
      }
      setLoading(false);
    })();
  }, []);

  /* Merge course words into global dictionary via API */
  const pushToGlobal = useCallback(async (incoming) => {
    const cur = wordsRef.current;
    const seen = new Set(cur.map(wordKey));
    const fresh = incoming.filter((r) => !seen.has(wordKey(r)));
    if (fresh.length) {
      const items = fresh.map((r) => ({
        word: r.word,
        part_of_speech: r.pos,
        level: r.level,
        def: r.def || "",
        audio_url: r.audioUrl || "",
        def_url: r.defUrl || "",
      }));
      await apiCall("POST", "/import-json", { items });
      const data = await apiCall("GET", "/words?page_size=99999");
      if (data && data.items) {
        setWords((ws) => {
          const aiMap = new Map(ws.map((w) => [w.id, w.ai]));
          return data.items.map((w) => ({ ...fromBackend(w), ai: aiMap.get(w.id) || null }));
        });
      }
    }
    return { added: fresh.length, skipped: incoming.length - fresh.length };
  }, []);

  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);

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

  const collect = useCallback((id) => {
    const w = wordsRef.current.find((x) => x.id === id);
    if (!w) return;
    const newFav = (w.fav || 0) + 1;
    setWords((ws) => ws.map((x) => x.id === id ? { ...x, fav: newFav } : x));
    apiPatch(id, { collected_count: newFav, is_bookmarked: true });
  }, []);

  const recollect = useCallback((id, delta) => {
    const w = wordsRef.current.find((x) => x.id === id);
    if (!w) return;
    const newFav = Math.max(0, (w.fav || 0) + delta);
    setWords((ws) => ws.map((x) => x.id === id ? { ...x, fav: newFav } : x));
    apiPatch(id, { collected_count: newFav, is_bookmarked: newFav > 0 });
  }, []);

  const openReader = useCallback((w) => setReader(w), []);
  const playWord = useCallback((w) => audio.play(w), [audio.play]);

  const setKnown = useCallback((id, value) => {
    setWords((ws) => ws.map((w) => w.id === id ? { ...w, known: value } : w));
    apiPatch(id, { status: value === "yes" ? "known" : "unknown" });
  }, []);

  const toggleExpand = useCallback((id) => setExpandedId((cur) => (cur === id ? null : id)), []);
  useEffect(() => { try { localStorage.setItem("lexicon.defmode", defMode); } catch (e) {} if (defMode === "hide") setExpandedId(null); }, [defMode]);

  const toggleSelect = useCallback((id) => setSelected((s) => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id); else n.add(id);
    return n;
  }), []);
  const exitManage = () => { setManage(false); setSelected(new Set()); setConfirmDel(false); };

  const doDelete = () => {
    const n = selected.size;
    const ids = [...selected].filter((id) => typeof id === "number");
    setWords((ws) => ws.filter((w) => !selected.has(w.id)));
    setConfirmDel(false);
    setSelected(new Set());
    setManage(false);
    flash("Deleted " + n + " word" + (n === 1 ? "" : "s"));
    if (ids.length) {
      const params = ids.map((id) => "ids=" + id).join("&");
      fetch("/api/words?" + params, { method: "DELETE" }).catch(console.error);
    }
  };

  const uncollect = (id) => {
    const w = words.find((x) => x.id === id);
    setWords((ws) => ws.map((x) => x.id === id ? { ...x, fav: 0 } : x));
    apiPatch(id, { collected_count: 0, is_bookmarked: false });
    if (w) flash('”' + w.word + '” removed from collected');
  };

  const clearAllCollected = () => {
    const collected = words.filter((w) => (w.fav || 0) > 0);
    setWords((ws) => ws.map((w) => ((w.fav || 0) > 0 ? { ...w, fav: 0 } : w)));
    collected.forEach((w) => apiPatch(w.id, { collected_count: 0, is_bookmarked: false }));
    flash("Collected list cleared");
  };

  const setAi = (id, ai) => {
    const isSuccess = ai && ai.meaning && !ai.meaning.startsWith("Could not reach");
    const word = wordsRef.current.find((w) => w.id === id);
    const needsDef = isSuccess && word && !word.def;
    setWords((ws) => ws.map((w) => {
      if (w.id !== id) return w;
      const next = { ...w, ai };
      if (!LEVELS.includes(w.level) && ai && LEVELS.includes(ai.level)) next.level = ai.level;
      if (needsDef) next.def = ai.meaning;
      return next;
    }));
    if (typeof id === "number" && isSuccess) {
      const patch = { ai_explanation: JSON.stringify(ai) };
      if (needsDef) patch.definitions = [{ sense: ai.meaning, example: ai.example || null }];
      apiPatch(id, patch);
    }
  };

  const findEntry = (text) => {
    const t = (text || "").trim().toLowerCase();
    if (!t) return null;
    return words.find((w) => w.word.toLowerCase() === t) || null;
  };

  const ensureEntry = async (text) => {
    const t = (text || "").trim().toLowerCase();
    const existing = findEntry(t);
    if (existing) return existing;
    const payload = {
      word: t,
      part_of_speech: "word",
      def_url: "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(t),
    };
    const result = await apiCall("POST", "/words", payload);
    if (result) {
      const entry = { ...fromBackend(result), ai: null };
      setWords((ws) => [entry, ...ws]);
      return entry;
    }
    // fallback: local-only entry if API fails
    const entry = {
      id: "look-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
      word: t, level: "—", pos: "word", def: "", ai: null, fav: 0, known: "no",
      defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(t),
      audioUrl: "",
    };
    setWords((ws) => [entry, ...ws]);
    return entry;
  };

  const openLookup = async (text) => {
    const entry = await ensureEntry(text);
    setLookup(null);
    setReader(entry);
  };

  const collectLookup = async (text) => {
    const entry = await ensureEntry(text);
    setLookup(null);
    collect(entry.id);
    setReader(entry);
    flash('”' + entry.word + '” collected');
  };

  const addWord = async (data) => {
    setTab("dictionary");
    const payload = {
      word: data.word,
      part_of_speech: data.pos,
      level: data.level,
      definitions: data.def ? [{ sense: data.def, example: null }] : [],
      def_url: data.defUrl,
      audio_url: data.audioUrl,
    };
    const result = await apiCall("POST", "/words", payload);
    if (!result) { flash("Failed to add word — check connection"); return; }
    const k = wordKey(data);
    const existing = wordsRef.current.find((w) => wordKey(w) === k);
    const newWord = { ...fromBackend(result), ai: existing ? existing.ai : null };
    if (existing) {
      setWords((ws) => ws.map((w) => wordKey(w) === k ? newWord : w));
      flash('”' + data.word + '” already existed — updated it');
    } else {
      setWords((ws) => [newWord, ...ws]);
      flash('”' + data.word + '” added to the wordbook');
    }
  };

  const importRows = async (rows) => {
    setTab("dictionary");
    const items = rows.map((r) => ({
      word: r.word,
      part_of_speech: r.pos,
      level: r.level,
      def: r.def || "",
      audio_url: r.audioUrl || "",
      def_url: r.defUrl || "",
    }));
    const result = await apiCall("POST", "/import-json", { items });
    if (result) {
      flash("Imported " + result.inserted + " " + (result.inserted === 1 ? "word" : "words") +
        (result.updated ? " · updated " + result.updated : ""));
      const data = await apiCall("GET", "/words?page_size=99999");
      if (data && data.items) {
        setWords((ws) => {
          const aiMap = new Map(ws.map((w) => [w.id, w.ai]));
          return data.items.map((w) => ({ ...fromBackend(w), ai: aiMap.get(w.id) || null }));
        });
      }
    } else {
      flash("Import failed — check connection");
    }
  };

  const toggleLevel = (lv) => setLevels((ls) => ls.includes(lv) ? ls.filter((x) => x !== lv) : [...ls, lv]);

  const favCount = useMemo(() => words.filter((w) => (w.fav || 0) > 0).length, [words]);
  const knownCount = useMemo(() => words.filter((w) => w.known === "yes").length, [words]);
  const unknownCount = words.length - knownCount;

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = words.filter((w) => {
      if (levels.length && !levels.includes(w.level)) return false;
      if (letter && (w.word[0] || "").toUpperCase() !== letter) return false;
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
    } else if (tab === "unknown") {
      list = list.filter((w) => w.known !== "yes").sort((a, b) =>
        (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
    } else if (tab === "known") {
      list = list.filter((w) => w.known === "yes").sort((a, b) =>
        (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
    } else {
      list = list.slice().sort((a, b) =>
        (a.word < b.word ? -1 : a.word > b.word ? 1 : (a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0)));
    }
    return list;
  }, [words, q, levels, letter, tab]);

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
    check();
    return () => { window.removeEventListener("scroll", check); window.removeEventListener("resize", check); };
  }, [filtered.length, tab]);

  const showList = tab === "dictionary" || tab === "favorites" || tab === "unknown" || tab === "known";

  return (
    <div className={"app" + (reader ? " reader-open" : "")}>
      <main className="shell">
        <header className="masthead">
          <nav className="tabs icontabs">
            <button className={"tab" + (tab === "dictionary" ? " active" : "")} onClick={() => setTab("dictionary")}>
              <span className="tab-ico"><Icon.book /></span><span className="pill">{words.length}</span>
              <span className="tab-label">Dictionary</span>
            </button>
            <button className={"tab" + (tab === "courses" ? " active" : "")} onClick={() => setTab("courses")}>
              <span className="tab-ico"><Icon.library /></span>
              <span className="tab-label">Courses</span>
            </button>
            <button className={"tab" + (tab === "quiz" ? " active" : "")} onClick={() => setTab("quiz")}>
              <span className="tab-ico"><Icon.cards /></span>
              <span className="tab-label">Quiz</span>
            </button>
            <button className={"tab" + (tab === "unknown" ? " active" : "")} onClick={() => setTab("unknown")}>
              <span className="tab-ico"><Icon.x width={15} height={15} /></span><span className="pill">{unknownCount}</span>
              <span className="tab-label">Unknown</span>
            </button>
            <button className={"tab" + (tab === "known" ? " active" : "")} onClick={() => setTab("known")}>
              <span className="tab-ico"><Icon.check /></span><span className="pill">{knownCount}</span>
              <span className="tab-label">Known</span>
            </button>
            <button className={"tab" + (tab === "favorites" ? " active" : "")} onClick={() => setTab("favorites")}>
              <span className="tab-ico">{Icon.bookmark(true)({ width: 14, height: 14 })}</span><span className="pill">{favCount}</span>
              <span className="tab-label">Collected</span>
            </button>
            <span className="tab-sep" />
            <button className={"tab" + (tab === "add" ? " active" : "")} onClick={() => setTab("add")}>
              <span className="tab-ico"><Icon.plus /></span>
              <span className="tab-label">Add</span>
            </button>
            <button className={"tab" + (tab === "import" ? " active" : "")} onClick={() => setTab("import")}>
              <span className="tab-ico"><Icon.upload /></span>
              <span className="tab-label">Import</span>
            </button>
          </nav>

          <div className="searchbar">
            <span className="s-icon"><Icon.search /></span>
            <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a word, part of speech, or meaning…" />
            {q && <button className="s-clear" onClick={() => setQ("")}><Icon.x /></button>}
          </div>
        </header>

        {showList && <LevelFilter active={levels} onToggle={toggleLevel} />}
        {showList && <LetterFilter active={letter} onPick={setLetter} />}

        {tab === "courses" && CoursesPage && <CoursesPage audio={audio} globalWords={words} pushToGlobal={pushToGlobal} flash={flash} />}
        {tab === "add" && <AddWord onAdd={addWord} />}
        {tab === "import" && <ImportCsv onImport={importRows} />}
        {tab === "quiz" && <QuizPage words={words} audio={audio} onSetKnown={setKnown} onAi={setAi} onLookup={setLookup} />}

        {showList && (
          <>
            <div className="list-bar">
              <p className="count-note">
                {loading && words.length === 0 ? (
                  <span style={{ display: "inline-flex", alignItems: "center", gap: 7 }}><Icon.loader /> Loading wordbook…</span>
                ) : null}
                {tab === "favorites"
                  ? (filtered.length ? "Most often collected first — the ones you keep forgetting." : "")
                  : null}
                {tab === "unknown"
                  ? (filtered.length ? "Words you marked as not known — your study pile." : "")
                  : null}
                {tab === "known"
                  ? (filtered.length ? "Words you've marked as known." : "")
                  : null}
                {tab === "dictionary"
                  ? ((q || levels.length || letter)
                      ? filtered.length + " of " + words.length + " entries"
                      : knownCount + " known · " + unknownCount + " unknown")
                  : null}
              </p>
              {tab === "favorites" && favCount > 0 && !manage && (
                <button className="clear-all" onClick={clearAllCollected}>
                  <Icon.trash /> Clear all ({favCount})
                </button>
              )}
              {!manage && filtered.length > 0 && (
                <span className="defmode" title="Show definitions in the list">
                  <span className="dm-label">Definitions</span>
                  <span className="dm-seg">
                    <button className={defMode === "hide" ? "on" : ""} onClick={() => setDefMode("hide")}>Hidden</button>
                    <button className={defMode === "test" ? "on" : ""} onClick={() => setDefMode("test")} title="Reveal only for words you've marked known">Test</button>
                    <button className={defMode === "all" ? "on" : ""} onClick={() => setDefMode("all")}>Shown</button>
                  </span>
                </span>
              )}
              {!manage && filtered.length > 0 && (
                <button className="clear-all" onClick={() => { setManage(true); setSelected(new Set()); }} title="Select and delete words">
                  <Icon.check width={13} height={13} /> Manage
                </button>
              )}
            </div>

            {manage && (
              <div className="manage-bar">
                <label className="manage-all">
                  <span className={"pickbox" + (filtered.length > 0 && filtered.every((w) => selected.has(w.id)) ? " on" : "")}>
                    {filtered.length > 0 && filtered.every((w) => selected.has(w.id)) && <Icon.check width={13} height={13} />}
                  </span>
                  <button onClick={() => {
                    const all = filtered.length > 0 && filtered.every((w) => selected.has(w.id));
                    setSelected((s) => {
                      const n = new Set(s);
                      if (all) filtered.forEach((w) => n.delete(w.id));
                      else filtered.forEach((w) => n.add(w.id));
                      return n;
                    });
                  }}>{filtered.length > 0 && filtered.every((w) => selected.has(w.id)) ? "Deselect all" : ("Select all" + ((q || levels.length || letter) ? " " + filtered.length + " found" : ""))}</button>
                </label>
                <span className="manage-count">{selected.size} selected</span>
                <span className="manage-spacer" />
                <button className="manage-del" disabled={!selected.size} onClick={() => setConfirmDel(true)}>
                  <Icon.trash /> Delete {selected.size || ""}
                </button>
                <button className="txtbtn" onClick={exitManage}>Done</button>
              </div>
            )}

            {filtered.length === 0 && !loading ? (
              <div className="empty">
                <div className="glyph">{tab === "favorites" ? "✦" : tab === "known" ? "✓" : tab === "unknown" ? "✕" : "—"}</div>
                <p>{tab === "favorites"
                  ? "Nothing collected yet. Tap the ribbon on a word to file it here."
                  : tab === "unknown"
                  ? "No unknown words — you know everything here."
                  : tab === "known"
                  ? "No known words yet. Tap ✓ on a word you know, or run a Quiz."
                  : "No entries match your search."}</p>
              </div>
            ) : (
              <div className="entries">
                {visible.map((w) => (
                  <Entry
                    key={w.id} w={w}
                    isPlaying={audio.playing === w.id}
                    onPlay={playWord}
                    onCollect={collect} onSetKnown={setKnown} onOpenReader={openReader}
                    active={reader && reader.id === w.id}
                    manage={manage} checked={selected.has(w.id)} onToggleSelect={toggleSelect}
                    defMode={defMode} expanded={expandedId === w.id} onToggleExpand={toggleExpand} onAi={setAi}
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

      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(false)}>
          <div className="confirm-box" onClick={(e) => e.stopPropagation()}>
            <div className="confirm-icon"><Icon.trash width={22} height={22} /></div>
            <h3>Delete {selected.size} word{selected.size === 1 ? "" : "s"}?</h3>
            <p>This permanently removes the selected {selected.size === 1 ? "entry" : "entries"} from your dictionary. This can't be undone.</p>
            <div className="confirm-actions">
              <button className="txtbtn" onClick={() => setConfirmDel(false)}>Cancel</button>
              <button className="txtbtn danger" onClick={doDelete}><Icon.trash /> Delete {selected.size}</button>
            </div>
          </div>
        </div>
      )}
      {toast && <div className="toast">{toast}</div>}
    </div>
  );
}

Object.assign(window, {
  App, Icon, LEVELS, LEVEL_COLOR, wordKey, parseCsv, Cefr, Syllabified,
  buildExplainPrompt, parseExplain, Tokenized,
});
