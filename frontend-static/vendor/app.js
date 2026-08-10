function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* global React, ReactDOM, window, document, localStorage, fetch */
const {
  useState,
  useEffect,
  useRef,
  useMemo,
  useCallback
} = React;
const LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];
const LEVEL_COLOR = {
  A1: "var(--lvl-a1)",
  A2: "var(--lvl-a2)",
  B1: "var(--lvl-b1)",
  B2: "var(--lvl-b2)",
  C1: "var(--lvl-c1)",
  C2: "var(--lvl-c2)"
};

/* ---------------- API helpers ---------------- */
function apiCall(_x, _x2, _x3) {
  return _apiCall.apply(this, arguments);
}
function _apiCall() {
  _apiCall = _asyncToGenerator(function* (method, path, body) {
    try {
      const opts = {
        method,
        headers: {
          "Content-Type": "application/json"
        }
      };
      if (body !== undefined) opts.body = JSON.stringify(body);
      const r = yield fetch("/api" + path, opts);
      if (!r.ok) throw new Error("HTTP " + r.status);
      if (r.status === 204) return null;
      return r.json();
    } catch (e) {
      console.error("API error", method, path, e);
      return null;
    }
  });
  return _apiCall.apply(this, arguments);
}
function apiPatch(id, data) {
  if (typeof id === "number") apiCall("PATCH", "/words/" + id, data);
}

/* Map backend WordOut → frontend word object */
function fromBackend(w) {
  const defs = w.definitions || [];
  let ai = null;
  if (w.ai_explanation) {
    try {
      ai = JSON.parse(w.ai_explanation);
    } catch (e) {}
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
    defUrl: w.def_url || "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(w.word),
    ai
  };
}

/* ---------------- icons ---------------- */
const Icon = {
  search: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "18",
    height: "18",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("circle", {
    cx: "11",
    cy: "11",
    r: "7"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M20 20l-3.5-3.5"
  })),
  x: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M6 6l12 12M18 6L6 18"
  })),
  speaker: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "17",
    height: "17",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M11 5L6 9H3v6h3l5 4V5z",
    fill: "currentColor",
    stroke: "none"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M15.5 8.5a5 5 0 0 1 0 7M18.5 5.5a9 9 0 0 1 0 13"
  })),
  bookmark: filled => p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "16",
    height: "16",
    viewBox: "0 0 24 24",
    fill: filled ? "currentColor" : "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M6 3h12v18l-6-4-6 4V3z"
  })),
  chev: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M9 6l6 6-6 6"
  })),
  check: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2.4"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M5 12.5l4.5 4.5L19 7",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  })),
  cards: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "7",
    y: "3",
    width: "14",
    height: "17",
    rx: "1.5"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M3 7v13a1.5 1.5 0 0 0 1.5 1.5H17"
  })),
  book: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 4.5A1.5 1.5 0 0 1 5.5 3H19a1 1 0 0 1 1 1v15a1 1 0 0 1-1 1H5.5A1.5 1.5 0 0 1 4 18.5z"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M8 3v17"
  })),
  library: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("rect", {
    x: "3",
    y: "4",
    width: "5",
    height: "16",
    rx: "1"
  }), /*#__PURE__*/React.createElement("rect", {
    x: "10",
    y: "4",
    width: "5",
    height: "16",
    rx: "1"
  }), /*#__PURE__*/React.createElement("path", {
    d: "M17.5 5l3.2 14.6"
  })),
  external: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.7"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M14 4h6v6M20 4l-9 9M18 13v6a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h6"
  })),
  spark: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.5"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3l1.8 5.4L19 10l-5.2 1.6L12 17l-1.8-5.4L5 10l5.2-1.6L12 3z",
    fill: "currentColor",
    stroke: "none"
  })),
  loader: p => /*#__PURE__*/React.createElement("svg", _extends({
    className: "spin",
    width: "14",
    height: "14",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 3a9 9 0 1 0 9 9",
    strokeLinecap: "round"
  })),
  plus: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.8"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 5v14M5 12h14"
  })),
  upload: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "15",
    height: "15",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M12 16V4M7 9l5-5 5 5M5 20h14"
  })),
  trash: p => /*#__PURE__*/React.createElement("svg", _extends({
    width: "13",
    height: "13",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "1.6"
  }, p), /*#__PURE__*/React.createElement("path", {
    d: "M4 7h16M9 7V5h6v2M6 7l1 13h10l1-13"
  }))
};

/* ---------------- dedupe key ---------------- */
function wordKey(w) {
  return (w.word || "").trim().toLowerCase() + "|" + (w.pos || "").trim().toLowerCase();
}

/* ---------------- audio ---------------- */
function useAudio() {
  const [playing, setPlaying] = useState(null);
  const ref = useRef(null);
  const play = useCallback(word => {
    if (ref.current) {
      try {
        ref.current.pause();
      } catch (e) {}
      ref.current = null;
    }
    setPlaying(word.id);
    const done = () => setPlaying(p => p === word.id ? null : p);
    const speak = () => {
      try {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(word.word);
        u.lang = "en-US";
        u.rate = 0.92;
        u.onend = done;
        u.onerror = done;
        window.speechSynthesis.speak(u);
      } catch (e) {
        done();
      }
    };
    if (word.audioUrl) {
      const a = new Audio(word.audioUrl);
      ref.current = a;
      a.onended = done;
      a.onerror = () => {
        ref.current = null;
        speak();
      };
      a.play().catch(() => {
        ref.current = null;
        speak();
      });
    } else {
      speak();
    }
  }, []);
  return {
    playing,
    play
  };
}

/* ---------------- Phonics syllable splitter ---------------- */
const _sylCache = new Map();
const SYL_ONSET = new Set(["bl", "br", "ch", "cl", "cr", "dr", "fl", "fr", "gl", "gr", "pl", "pr", "sc", "sh", "sk", "sl", "sm", "sn", "sp", "st", "sw", "th", "tr", "tw", "wh", "wr", "ph", "qu", "gh"]);
function _isVowLetter(c) {
  return "aeiou".includes(c);
}
function _syllabify(word) {
  const orig = String(word);
  const w = orig.toLowerCase();
  if (!/^[a-z]+$/.test(w) || w.length <= 3) return [orig];
  const isVow = i => "aeiou".includes(w[i]) || w[i] === "y" && i > 0;
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
        if (two === "ck" || two === "ng" || two === "dg") splitAt = rightStart;else if (SYL_ONSET.has(two)) splitAt = gapStart;else splitAt = gapStart + 1;
      } else {
        if (SYL_ONSET.has(lastTwo)) splitAt = rightStart - 2;else splitAt = rightStart - 1;
      }
    }
    splits.push(splitAt);
  }
  if (w.length >= 4 && w.endsWith("le") && !_isVowLetter(w[w.length - 3]) && w[w.length - 3] !== "l") {
    const cle = w.length - 3;
    splits = splits.filter(s => s < cle);
    splits.push(cle);
  }
  if (w.endsWith("e") && !w.endsWith("le")) {
    const lastN = N[N.length - 1];
    if (lastN[0] === lastN[1] && lastN[0] === w.length - 1 && N.length >= 2 && splits.length) {
      const maxSplit = Math.max.apply(null, splits);
      splits = splits.filter(s => s !== maxSplit);
    }
  }
  splits = Array.from(new Set(splits)).filter(s => s > 0 && s < w.length).sort((a, b) => a - b);
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
function Syllabified({
  word
}) {
  const syl = syllabify(word);
  if (syl.length <= 1) return /*#__PURE__*/React.createElement(React.Fragment, null, word);
  return /*#__PURE__*/React.createElement("span", {
    className: "splitword"
  }, syl.map((s, i) => /*#__PURE__*/React.createElement(React.Fragment, {
    key: i
  }, i > 0 && /*#__PURE__*/React.createElement("span", {
    className: "sylsep"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "syl syl-" + i % 2
  }, s))));
}

/* ---------------- CEFR badge ---------------- */
function Cefr({
  level
}) {
  const known = LEVELS.includes(level);
  return /*#__PURE__*/React.createElement("span", {
    className: "cefr",
    style: {
      background: known ? LEVEL_COLOR[level] : "var(--ink-faint)"
    },
    title: known ? "CEFR " + level : "Level not set"
  }, known ? level : "?");
}

/* ---------------- one dictionary entry ---------------- */
const Entry = React.memo(function Entry({
  w,
  isPlaying,
  onPlay,
  onCollect,
  onSetKnown,
  onOpenReader,
  active,
  manage,
  checked,
  onToggleSelect,
  defMode,
  expanded,
  onToggleExpand,
  onAi
}) {
  const [aiLoading, setAiLoading] = React.useState(false);
  const showDef = !manage && (defMode === "all" || defMode === "test" && w.known === "yes");
  React.useEffect(() => {
    if (!expanded || w.ai && w.ai.meaning || aiLoading) return;
    let alive = true;
    setAiLoading(true);
    _asyncToGenerator(function* () {
      try {
        const res = yield window.claude.complete(buildExplainPrompt(w.word, w.pos, 0, null));
        if (alive) onAi(w.id, parseExplain(res));
      } catch (e) {
        if (alive) onAi(w.id, {
          meaning: "Could not reach the AI tutor — try again.",
          example: "",
          tip: ""
        });
      } finally {
        if (alive) setAiLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [expanded, w.id]);
  return /*#__PURE__*/React.createElement("div", {
    className: "entry" + (active ? " active" : "") + (w.known ? " known-" + w.known : "") + (manage && checked ? " picked" : "") + (expanded ? " expanded" : "")
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry-head",
    onClick: () => manage ? onToggleSelect(w.id) : onOpenReader(w)
  }, manage && /*#__PURE__*/React.createElement("span", {
    className: "pickbox" + (checked ? " on" : ""),
    "aria-label": "select"
  }, checked && /*#__PURE__*/React.createElement(Icon.check, {
    width: 13,
    height: 13
  })), /*#__PURE__*/React.createElement("div", {
    className: "entry-headword-wrap"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry-headword"
  }, !manage && /*#__PURE__*/React.createElement("span", {
    className: "chev"
  }, /*#__PURE__*/React.createElement(Icon.chev, null)), /*#__PURE__*/React.createElement(Syllabified, {
    word: w.word
  })), /*#__PURE__*/React.createElement("div", {
    className: "entry-pos"
  }, /*#__PURE__*/React.createElement("em", null, w.pos), w.fav > 0 && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("span", {
    className: "dot"
  }, "\xB7"), /*#__PURE__*/React.createElement("span", {
    className: "collected-note"
  }, "collected \xD7", w.fav)))), /*#__PURE__*/React.createElement("div", {
    className: "entry-actions",
    onClick: e => e.stopPropagation(),
    style: manage ? {
      opacity: .35,
      pointerEvents: "none"
    } : null
  }, /*#__PURE__*/React.createElement("button", {
    className: "know-switch" + (w.known === "yes" ? " on" : ""),
    role: "switch",
    "aria-checked": w.known === "yes",
    title: w.known === "yes" ? "Known — tap to mark unknown" : "Unknown — tap to mark known",
    onClick: () => onSetKnown(w.id, w.known === "yes" ? "no" : "yes")
  }, /*#__PURE__*/React.createElement("span", {
    className: "ks-knob"
  }, w.known === "yes" ? /*#__PURE__*/React.createElement(Icon.check, {
    width: 12,
    height: 12
  }) : /*#__PURE__*/React.createElement(Icon.x, {
    width: 12,
    height: 12
  }))), /*#__PURE__*/React.createElement(Cefr, {
    level: w.level
  }), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn" + (isPlaying ? " playing" : ""),
    title: "Pronounce",
    onClick: () => onPlay(w)
  }, /*#__PURE__*/React.createElement(Icon.speaker, null)), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn" + (w.fav > 0 ? " faved" : ""),
    title: w.fav > 0 ? "Collect again (re-file)" : "Add to wordbook",
    onClick: () => onCollect(w.id)
  }, Icon.bookmark(w.fav > 0)({}), w.fav > 0 && /*#__PURE__*/React.createElement("span", {
    className: "fav-count"
  }, w.fav)))), showDef && /*#__PURE__*/React.createElement("div", {
    className: "entry-reveal"
  }, /*#__PURE__*/React.createElement("div", {
    className: "entry-def-line" + (expanded ? " open" : ""),
    onClick: () => onToggleExpand(w.id)
  }, w.def ? /*#__PURE__*/React.createElement("span", {
    className: "entry-def-text"
  }, w.def) : /*#__PURE__*/React.createElement("span", {
    className: "entry-def-empty"
  }, "No short definition \u2014 tap for a plain-English explanation."), /*#__PURE__*/React.createElement("span", {
    className: "entry-def-cue"
  }, expanded ? "Hide" : "Detail")), expanded && /*#__PURE__*/React.createElement("div", {
    className: "entry-detail"
  }, aiLoading && !(w.ai && w.ai.meaning) ? /*#__PURE__*/React.createElement("div", {
    className: "rs-loading"
  }, /*#__PURE__*/React.createElement(Icon.loader, null), " Explaining it like a friend would\u2026") : w.ai && w.ai.meaning ? /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Meaning"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val"
  }, w.ai.meaning)), w.ai.example && /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Example \uD83C\uDF30"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val rs-ai-ex"
  }, "\"", w.ai.example, "\"")), w.ai.tip && /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Tip"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val rs-ai-tip"
  }, w.ai.tip))) : null)));
});

/* ---------------- AI explain prompt ---------------- */
function buildExplainPrompt(word, pos, attempt, previous) {
  let p = "You are explaining the English word \"" + word + "\" (used as a " + pos + ") to an English learner, " + "like a close friend chatting over coffee — warm, casual, and encouraging. " + "VERY IMPORTANT: reply ONLY in English. Never use Chinese or any other language. Explain English with English. " + "Use the simplest, most common everyday words a beginner already knows. " + "Return STRICT JSON only, no extra text, exactly these keys: " + "{\"meaning\":\"one short sentence of plain, everyday English (no hard words)\"," + "\"example\":\"one natural sentence from daily life that uses the word\"," + "\"tip\":\"a short friendly note: when/where people use it, its feeling/tone, or a common word it pairs with\"," + "\"level\":\"your best guess of its CEFR level, one of A1 A2 B1 B2 C1 C2\"}.";
  if (attempt > 0) {
    p += " The learner did NOT understand the previous explanation — it was too complex or used words that were too hard. " + "Try a COMPLETELY different way this time: even simpler, shorter words, a fresh everyday example, and do not reuse the same phrasing. ";
    if (previous && previous.meaning) p += "Avoid repeating this earlier wording: \"" + previous.meaning + "\". ";
    if (attempt >= 2) p += "Imagine you are explaining to a young child now — be as plain as you possibly can. ";
  }
  return p;
}
function parseExplain(res) {
  let parsed = null;
  try {
    parsed = JSON.parse(res);
  } catch (e) {
    const m = res && res.match(/\{[\s\S]*\}/);
    if (m) {
      try {
        parsed = JSON.parse(m[0]);
      } catch (e2) {}
    }
  }
  if (parsed && parsed.meaning) return {
    meaning: parsed.meaning,
    example: parsed.example || "",
    tip: parsed.tip || "",
    level: parsed.level || ""
  };
  return {
    meaning: (res || "").trim().slice(0, 240),
    example: "",
    tip: "",
    level: ""
  };
}

/* ---------------- Tokenized text ---------------- */
function Tokenized({
  text,
  onWord,
  current
}) {
  if (!text) return null;
  const parts = String(text).split(/([A-Za-z][A-Za-z''-]*)/);
  return parts.map((p, i) => {
    if (/^[A-Za-z][A-Za-z''-]*$/.test(p)) {
      const isCur = current && p.toLowerCase() === current.toLowerCase();
      return /*#__PURE__*/React.createElement("span", {
        key: i,
        className: "wtok" + (isCur ? " cur" : ""),
        onClick: e => {
          e.stopPropagation();
          onWord(p.toLowerCase(), e.currentTarget);
        }
      }, p);
    }
    return /*#__PURE__*/React.createElement(React.Fragment, {
      key: i
    }, p);
  });
}

/* ---------------- Reader panel ---------------- */
function Reader({
  word,
  audio,
  onCollect,
  onRecollect,
  onUncollect,
  onAi,
  onLookup,
  onClose
}) {
  const [loading, setLoading] = useState(false);
  const [embed, setEmbed] = useState(false);
  const [embedFailed, setEmbedFailed] = useState(false);
  const embedLoaded = useRef(false);
  const attemptRef = useRef(0);
  const fetchExplain = useCallback(/*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator(function* (attempt, previous) {
      setLoading(true);
      try {
        const res = yield window.claude.complete(buildExplainPrompt(word.word, word.pos, attempt, previous));
        return parseExplain(res);
      } catch (e) {
        return {
          meaning: "Could not reach the AI tutor right now. Tap 'Explain it differently' to try again.",
          example: "",
          tip: ""
        };
      } finally {
        setLoading(false);
      }
    });
    return function (_x4, _x5) {
      return _ref2.apply(this, arguments);
    };
  }(), [word && word.id]);
  useEffect(() => {
    if (!word) return;
    setEmbed(false);
    setEmbedFailed(false);
    embedLoaded.current = false;
    attemptRef.current = 0;
    if (word.ai && word.ai.meaning) return;
    let alive = true;
    _asyncToGenerator(function* () {
      const ai = yield fetchExplain(0, null);
      if (alive) onAi(word.id, ai);
    })();
    return () => {
      alive = false;
    };
  }, [word && word.id]);
  if (!word) return null;
  const playing = audio.playing === word.id;
  const onWordClick = (w, el) => {
    if (!onLookup) return;
    if (w === word.word.toLowerCase()) {
      onLookup(null);
      return;
    }
    const rect = el.getBoundingClientRect();
    onLookup({
      word: w,
      rect: {
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
        right: rect.right
      }
    });
  };
  const regen = /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator(function* () {
      attemptRef.current += 1;
      const ai = yield fetchExplain(attemptRef.current, word.ai);
      onAi(word.id, ai);
    });
    return function regen() {
      return _ref4.apply(this, arguments);
    };
  }();
  return /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "reader-overlay",
    onClick: onClose
  }), /*#__PURE__*/React.createElement("aside", {
    className: "reader"
  }, /*#__PURE__*/React.createElement("div", {
    className: "reader-top"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rt-word"
  }, word.word, /*#__PURE__*/React.createElement("span", null, word.pos)), /*#__PURE__*/React.createElement("a", {
    className: "txtbtn",
    href: word.defUrl,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(Icon.external, null), " New tab"), /*#__PURE__*/React.createElement("button", {
    className: "iconbtn",
    onClick: onClose,
    title: "Close"
  }, /*#__PURE__*/React.createElement(Icon.x, null))), /*#__PURE__*/React.createElement("div", {
    className: "reader-scroll"
  }, /*#__PURE__*/React.createElement("div", {
    className: "reader-tip"
  }, /*#__PURE__*/React.createElement(Icon.search, {
    style: {
      width: 13,
      height: 13,
      flexShrink: 0
    }
  }), " Tap any word below to look it up or collect it."), /*#__PURE__*/React.createElement("div", {
    className: "reader-hero"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rh-row"
  }, /*#__PURE__*/React.createElement("h2", {
    className: "rh-word"
  }, /*#__PURE__*/React.createElement(Syllabified, {
    word: word.word
  })), /*#__PURE__*/React.createElement(Cefr, {
    level: word.level
  })), /*#__PURE__*/React.createElement("div", {
    className: "rh-pos"
  }, /*#__PURE__*/React.createElement("em", null, word.pos)), /*#__PURE__*/React.createElement("div", {
    className: "rh-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "reader-say" + (playing ? " playing" : ""),
    onClick: () => audio.play(word)
  }, /*#__PURE__*/React.createElement(Icon.speaker, null), " ", playing ? "Playing…" : "Pronounce"), /*#__PURE__*/React.createElement("button", {
    className: "reader-collect" + (word.fav > 0 ? " on" : ""),
    onClick: () => onCollect(word.id)
  }, Icon.bookmark(word.fav > 0)({
    width: 15,
    height: 15
  }), word.fav > 0 ? "Collect again ×" + word.fav : "Collect")), word.fav > 0 && /*#__PURE__*/React.createElement("div", {
    className: "rh-subactions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "txtbtn recollect",
    onClick: () => onRecollect(word.id, -1),
    title: "File once less"
  }, "\u2212 Forget once"), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn recollect",
    onClick: () => onUncollect(word.id),
    title: "Remove from collected"
  }, /*#__PURE__*/React.createElement(Icon.trash, null), " Uncollect"))), /*#__PURE__*/React.createElement("section", {
    className: "reader-sec"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "rs-label"
  }, "Definition"), word.def ? /*#__PURE__*/React.createElement("p", {
    className: "rs-def"
  }, /*#__PURE__*/React.createElement(Tokenized, {
    text: word.def,
    onWord: onWordClick,
    current: word.word
  })) : /*#__PURE__*/React.createElement("p", {
    className: "rs-empty"
  }, "No definition recorded \u2014 the AI gloss below stands in for now.")), /*#__PURE__*/React.createElement("section", {
    className: "reader-sec"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "rs-label"
  }, /*#__PURE__*/React.createElement(Icon.spark, {
    style: {
      color: "var(--gold)"
    }
  }), " In plainer words"), loading && !word.ai ? /*#__PURE__*/React.createElement("div", {
    className: "rs-loading"
  }, /*#__PURE__*/React.createElement(Icon.loader, null), " Explaining it like a friend would\u2026") : word.ai ? /*#__PURE__*/React.createElement("div", {
    className: "rs-ai"
  }, /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Meaning"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val"
  }, /*#__PURE__*/React.createElement(Tokenized, {
    text: word.ai.meaning,
    onWord: onWordClick,
    current: word.word
  }))), word.ai.example && /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Example \uD83C\uDF30"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val rs-ai-ex"
  }, "\"", /*#__PURE__*/React.createElement(Tokenized, {
    text: word.ai.example,
    onWord: onWordClick,
    current: word.word
  }), "\"")), word.ai.tip && /*#__PURE__*/React.createElement("div", {
    className: "rs-ai-line"
  }, /*#__PURE__*/React.createElement("span", {
    className: "rs-ai-key"
  }, "Tip"), /*#__PURE__*/React.createElement("p", {
    className: "rs-ai-val rs-ai-tip"
  }, /*#__PURE__*/React.createElement(Tokenized, {
    text: word.ai.tip,
    onWord: onWordClick,
    current: word.word
  }))), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn",
    onClick: regen,
    disabled: loading,
    style: {
      marginTop: 6
    }
  }, loading ? /*#__PURE__*/React.createElement(Icon.loader, null) : /*#__PURE__*/React.createElement(Icon.spark, null), " ", loading ? "Rethinking…" : "Still unclear? Explain it differently")) : /*#__PURE__*/React.createElement("button", {
    className: "txtbtn primary",
    onClick: regen
  }, /*#__PURE__*/React.createElement(Icon.spark, null), " Explain like a friend")), /*#__PURE__*/React.createElement("section", {
    className: "reader-sec"
  }, /*#__PURE__*/React.createElement("h3", {
    className: "rs-label"
  }, "Full Oxford entry"), !embed ? /*#__PURE__*/React.createElement("div", {
    className: "rs-oxford"
  }, /*#__PURE__*/React.createElement("p", {
    className: "rs-empty",
    style: {
      margin: "0 0 12px"
    }
  }, "Oxford usually blocks in-app embedding. Open the live page for full examples and audio, or try loading it here."), /*#__PURE__*/React.createElement("div", {
    className: "rs-oxford-actions"
  }, /*#__PURE__*/React.createElement("a", {
    className: "txtbtn primary",
    href: word.defUrl,
    target: "_blank",
    rel: "noopener noreferrer"
  }, /*#__PURE__*/React.createElement(Icon.external, null), " Open on Oxford"), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn",
    onClick: () => {
      setEmbed(true);
      setEmbedFailed(false);
    }
  }, "Try loading here"))) : /*#__PURE__*/React.createElement("div", {
    className: "reader-frame-wrap"
  }, /*#__PURE__*/React.createElement("iframe", {
    key: word.id,
    src: word.defUrl,
    title: "Oxford entry for " + word.word,
    onLoad: () => {
      embedLoaded.current = true;
    },
    referrerPolicy: "no-referrer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "frame-x",
    onClick: () => setEmbed(false),
    title: "Hide"
  }, /*#__PURE__*/React.createElement(Icon.x, null)))))));
}

/* ---------------- Level filter row ---------------- */
function LevelFilter({
  active,
  onToggle
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "levelrow"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "Level"), LEVELS.map(lv => /*#__PURE__*/React.createElement("button", {
    key: lv,
    className: "lvl-chip" + (active.includes(lv) ? " on" : ""),
    style: active.includes(lv) ? {
      background: LEVEL_COLOR[lv]
    } : null,
    onClick: () => onToggle(lv)
  }, lv)));
}

/* ---------------- A–Z letter filter ---------------- */
const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
function LetterFilter({
  active,
  onPick
}) {
  return /*#__PURE__*/React.createElement("div", {
    className: "letterrow"
  }, /*#__PURE__*/React.createElement("button", {
    className: "ltr-chip ltr-all" + (active === "" ? " on" : ""),
    onClick: () => onPick("")
  }, "All"), ALPHABET.map(c => /*#__PURE__*/React.createElement("button", {
    key: c,
    className: "ltr-chip" + (active === c ? " on" : ""),
    onClick: () => onPick(active === c ? "" : c)
  }, c)));
}

/* ---------------- Add-word form ---------------- */
function AddWord({
  onAdd
}) {
  const [f, setF] = useState({
    word: "",
    level: "A1",
    pos: "noun",
    def: "",
    defUrl: "",
    audioUrl: ""
  });
  const set = k => e => setF(s => ({
    ...s,
    [k]: e.target.value
  }));
  const submit = e => {
    e.preventDefault();
    if (!f.word.trim()) return;
    onAdd({
      word: f.word.trim().toLowerCase(),
      level: f.level,
      pos: f.pos.trim() || "noun",
      def: f.def.trim(),
      defUrl: f.defUrl.trim() || "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(f.word.trim().toLowerCase()),
      audioUrl: f.audioUrl.trim()
    });
    setF({
      word: "",
      level: "A1",
      pos: "noun",
      def: "",
      defUrl: "",
      audioUrl: ""
    });
  };
  return /*#__PURE__*/React.createElement("form", {
    className: "panel-card",
    onSubmit: submit
  }, /*#__PURE__*/React.createElement("h2", null, "Add a word by hand"), /*#__PURE__*/React.createElement("p", {
    className: "sub"
  }, "Enter a single word. Leave the definition blank and let the AI tutor draft one for you."), /*#__PURE__*/React.createElement("div", {
    className: "field row2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Headword"), /*#__PURE__*/React.createElement("input", {
    value: f.word,
    onChange: set("word"),
    placeholder: "serendipity",
    autoFocus: true
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Part of speech"), /*#__PURE__*/React.createElement("select", {
    value: f.pos,
    onChange: set("pos")
  }, ["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "determiner", "phrase"].map(p => /*#__PURE__*/React.createElement("option", {
    key: p
  }, p))))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "CEFR level"), /*#__PURE__*/React.createElement("div", {
    className: "lvl-picker"
  }, LEVELS.map(lv => /*#__PURE__*/React.createElement("button", {
    type: "button",
    key: lv,
    className: f.level === lv ? "on" : "",
    style: f.level === lv ? {
      background: LEVEL_COLOR[lv]
    } : null,
    onClick: () => setF(s => ({
      ...s,
      level: lv
    }))
  }, lv)))), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Definition (English, optional)"), /*#__PURE__*/React.createElement("textarea", {
    value: f.def,
    onChange: set("def"),
    placeholder: "An English-to-English definition\u2026"
  })), /*#__PURE__*/React.createElement("div", {
    className: "field row2"
  }, /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Oxford entry URL (optional)"), /*#__PURE__*/React.createElement("input", {
    value: f.defUrl,
    onChange: set("defUrl"),
    placeholder: "https://\u2026"
  })), /*#__PURE__*/React.createElement("div", null, /*#__PURE__*/React.createElement("label", null, "Audio .ogg URL (optional)"), /*#__PURE__*/React.createElement("input", {
    value: f.audioUrl,
    onChange: set("audioUrl"),
    placeholder: "https://\u2026 (else read aloud)"
  }))), /*#__PURE__*/React.createElement("div", {
    className: "form-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "txtbtn primary",
    type: "submit"
  }, /*#__PURE__*/React.createElement(Icon.plus, null), " Add to wordbook")));
}

/* ---------------- CSV import ---------------- */
function parseCsv(text) {
  const out = [];
  text.split(/\r?\n/).forEach(line => {
    const t = line.trim();
    if (!t) return;
    const parts = t.split(",").map(s => s.trim());
    if (parts.length < 3) return;
    const [word, level, pos, defUrl, audioUrl] = parts;
    const lv = (level || "").toUpperCase();
    if (!word || word.toLowerCase() === "word") return;
    out.push({
      word: word.toLowerCase(),
      level: LEVELS.includes(lv) ? lv : "A1",
      pos: pos || "noun",
      def: "",
      defUrl: defUrl || "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(word.toLowerCase()),
      audioUrl: audioUrl || ""
    });
  });
  return out;
}
function ImportCsv({
  onImport
}) {
  const [text, setText] = useState("abandon,b2,verb,https://www.oxfordlearnersdictionaries.com/definition/english/abandon_1,https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg");
  const fileRef = useRef(null);
  const onFile = e => {
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
  return /*#__PURE__*/React.createElement("div", {
    className: "panel-card"
  }, /*#__PURE__*/React.createElement("h2", null, "Batch import (CSV)"), /*#__PURE__*/React.createElement("p", {
    className: "sub"
  }, "One word per line: ", /*#__PURE__*/React.createElement("code", null, "word, level, pos, oxford-url, audio-url"), ". Headers and blank lines are ignored."), /*#__PURE__*/React.createElement("div", {
    className: "field"
  }, /*#__PURE__*/React.createElement("label", null, "Paste rows"), /*#__PURE__*/React.createElement("textarea", {
    className: "import-csv",
    value: text,
    onChange: e => setText(e.target.value),
    spellCheck: "false"
  })), /*#__PURE__*/React.createElement("p", {
    className: "import-hint"
  }, "Example: ", /*#__PURE__*/React.createElement("code", null, "ability,a2,noun,https://\u2026/ability_1,https://\u2026/ability__us_4.ogg"), /*#__PURE__*/React.createElement("br", null), "Definitions are left blank on import \u2014 open any word and tap ", /*#__PURE__*/React.createElement("em", null, "Explain simply"), " to fill it in."), /*#__PURE__*/React.createElement("div", {
    className: "form-actions",
    style: {
      marginTop: 16
    }
  }, /*#__PURE__*/React.createElement("button", {
    className: "txtbtn primary",
    onClick: doImport,
    disabled: !previewCount
  }, /*#__PURE__*/React.createElement(Icon.upload, null), " Import ", previewCount, " ", previewCount === 1 ? "word" : "words"), /*#__PURE__*/React.createElement("button", {
    className: "filebtn",
    onClick: () => fileRef.current && fileRef.current.click()
  }, /*#__PURE__*/React.createElement(Icon.upload, null), " Choose .csv file"), /*#__PURE__*/React.createElement("input", {
    ref: fileRef,
    type: "file",
    accept: ".csv,text/csv,text/plain",
    style: {
      display: "none"
    },
    onChange: onFile
  })));
}

/* ---------------- Quiz ---------------- */
function QuizPage({
  words,
  audio,
  onSetKnown,
  onAi,
  onLookup
}) {
  const [quizLevels, setQuizLevels] = useState([]);
  const [batchSize, setBatchSize] = useState(5);
  const [batchIds, setBatchIds] = useState(null);
  const [answers, setAnswers] = useState({});
  const [aiLoading, setAiLoading] = useState({});
  const pool = useMemo(() => words.filter(w => w.known !== "yes" && (quizLevels.length === 0 || quizLevels.includes(w.level))), [words, quizLevels]);
  const poolRef = useRef(pool);
  poolRef.current = pool;
  const sizeRef = useRef(batchSize);
  sizeRef.current = batchSize;
  const drawBatch = useCallback(() => {
    const p = poolRef.current.slice();
    for (let i = p.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const t = p[i];
      p[i] = p[j];
      p[j] = t;
    }
    setBatchIds(p.slice(0, sizeRef.current).map(w => w.id));
    setAnswers({});
  }, []);
  useEffect(() => {
    drawBatch();
  }, [quizLevels, batchSize, drawBatch]);
  const cards = (batchIds || []).map(id => words.find(w => w.id === id)).filter(Boolean);
  const firstUnanswered = cards.findIndex(w => !answers[w.id]);
  const visibleCards = firstUnanswered === -1 ? cards : cards.slice(0, firstUnanswered + 1);
  const allAnswered = cards.length > 0 && firstUnanswered === -1;
  const leftInBatch = cards.filter(w => !answers[w.id]).length;
  const ensureAi = /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator(function* (w) {
      if (w.ai && w.ai.meaning) return;
      setAiLoading(s => ({
        ...s,
        [w.id]: true
      }));
      try {
        const res = yield window.claude.complete(buildExplainPrompt(w.word, w.pos, 0, null));
        onAi(w.id, parseExplain(res));
      } catch (e) {
        onAi(w.id, {
          meaning: "Could not reach the AI tutor — open the word in the panel to retry.",
          example: "",
          tip: ""
        });
      } finally {
        setAiLoading(s => ({
          ...s,
          [w.id]: false
        }));
      }
    });
    return function ensureAi(_x6) {
      return _ref5.apply(this, arguments);
    };
  }();
  const answer = (w, val) => {
    onSetKnown(w.id, val);
    setAnswers(a => ({
      ...a,
      [w.id]: val
    }));
    ensureAi(w);
  };
  const onWordClick = (tok, el) => {
    if (!onLookup) return;
    const rect = el.getBoundingClientRect();
    onLookup({
      word: tok,
      rect: {
        left: rect.left,
        top: rect.top,
        bottom: rect.bottom,
        right: rect.right
      }
    });
  };
  const settings = /*#__PURE__*/React.createElement("div", {
    className: "quiz-settings"
  }, /*#__PURE__*/React.createElement("div", {
    className: "qs-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "Level"), LEVELS.map(lv => /*#__PURE__*/React.createElement("button", {
    key: lv,
    className: "lvl-chip" + (quizLevels.includes(lv) ? " on" : ""),
    style: quizLevels.includes(lv) ? {
      background: LEVEL_COLOR[lv]
    } : null,
    onClick: () => setQuizLevels(ls => ls.includes(lv) ? ls.filter(x => x !== lv) : [...ls, lv])
  }, lv))), /*#__PURE__*/React.createElement("div", {
    className: "qs-group"
  }, /*#__PURE__*/React.createElement("span", {
    className: "lbl"
  }, "Words"), [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("button", {
    key: n,
    className: "size-chip" + (batchSize === n ? " on" : ""),
    onClick: () => setBatchSize(n)
  }, n))));
  if (batchIds !== null && cards.length === 0) {
    return /*#__PURE__*/React.createElement("div", {
      className: "quiz"
    }, settings, /*#__PURE__*/React.createElement("div", {
      className: "empty"
    }, /*#__PURE__*/React.createElement("div", {
      className: "glyph"
    }, "\u2713"), /*#__PURE__*/React.createElement("p", null, quizLevels.length ? "No unknown words left at " + quizLevels.join(" · ") + ". Pick other levels, or import more words." : "No unknown words left — you've cleared the whole dictionary.")));
  }
  return /*#__PURE__*/React.createElement("div", {
    className: "quiz"
  }, settings, /*#__PURE__*/React.createElement("p", {
    className: "quiz-note"
  }, pool.length, " unknown word", pool.length === 1 ? "" : "s", quizLevels.length ? " at " + quizLevels.join(" · ") : "", " \u2014 mark them known to clear them."), visibleCards.map((w, i) => {
    const a = answers[w.id];
    return /*#__PURE__*/React.createElement("div", {
      className: "quiz-card" + (a ? " answered" : ""),
      key: w.id
    }, /*#__PURE__*/React.createElement("div", {
      className: "qc-row"
    }, /*#__PURE__*/React.createElement("button", {
      className: "qc-btn qc-yes" + (a === "yes" ? " on" : ""),
      onClick: () => answer(w, "yes")
    }, /*#__PURE__*/React.createElement(Icon.check, null), " I know it"), /*#__PURE__*/React.createElement("div", {
      className: "qc-word-wrap"
    }, /*#__PURE__*/React.createElement("div", {
      className: "qc-index"
    }, i + 1, " of ", cards.length), /*#__PURE__*/React.createElement("div", {
      className: "qc-word"
    }, /*#__PURE__*/React.createElement(Syllabified, {
      word: w.word
    })), /*#__PURE__*/React.createElement("div", {
      className: "qc-meta"
    }, /*#__PURE__*/React.createElement("em", null, w.pos), /*#__PURE__*/React.createElement(Cefr, {
      level: w.level
    }), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn" + (audio.playing === w.id ? " playing" : ""),
      onClick: () => audio.play(w),
      title: "Pronounce"
    }, /*#__PURE__*/React.createElement(Icon.speaker, null)))), /*#__PURE__*/React.createElement("button", {
      className: "qc-btn qc-no" + (a === "no" ? " on" : ""),
      onClick: () => answer(w, "no")
    }, /*#__PURE__*/React.createElement(Icon.x, null), " Don't know")), a && /*#__PURE__*/React.createElement("div", {
      className: "qc-reveal"
    }, w.def && /*#__PURE__*/React.createElement("p", {
      className: "qc-def"
    }, /*#__PURE__*/React.createElement(Tokenized, {
      text: w.def,
      onWord: onWordClick,
      current: w.word
    })), aiLoading[w.id] && !(w.ai && w.ai.meaning) ? /*#__PURE__*/React.createElement("div", {
      className: "rs-loading"
    }, /*#__PURE__*/React.createElement(Icon.loader, null), " Fetching a friendly explanation\u2026") : w.ai && w.ai.meaning ? /*#__PURE__*/React.createElement("div", {
      className: "qc-ai"
    }, /*#__PURE__*/React.createElement("p", {
      className: "qc-meaning"
    }, /*#__PURE__*/React.createElement(Tokenized, {
      text: w.ai.meaning,
      onWord: onWordClick,
      current: w.word
    })), w.ai.example && /*#__PURE__*/React.createElement("p", {
      className: "qc-ex"
    }, "\"", /*#__PURE__*/React.createElement(Tokenized, {
      text: w.ai.example,
      onWord: onWordClick,
      current: w.word
    }), "\"")) : null));
  }), /*#__PURE__*/React.createElement("div", {
    className: "quiz-foot"
  }, /*#__PURE__*/React.createElement("button", {
    className: "txtbtn quiz-next" + (allAnswered ? " primary" : ""),
    onClick: drawBatch
  }, "Next batch ", /*#__PURE__*/React.createElement(Icon.chev, {
    width: 12,
    height: 12
  })), !allAnswered && /*#__PURE__*/React.createElement("span", {
    className: "quiz-hint"
  }, leftInBatch, " left in this batch")));
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
  const [defMode, setDefMode] = useState(() => {
    try {
      return localStorage.getItem("lexicon.defmode") || "hide";
    } catch (e) {
      return "hide";
    }
  });
  const [expandedId, setExpandedId] = useState(null);
  const audio = useAudio();
  const CoursesPage = window.CoursesPage;
  const wordsRef = useRef(words);
  wordsRef.current = words;

  /* Load all words from backend on mount */
  useEffect(() => {
    _asyncToGenerator(function* () {
      setLoading(true);
      const data = yield apiCall("GET", "/words?page_size=99999");
      if (data && data.items) {
        setWords(data.items.map(w => ({
          ...fromBackend(w),
          ai: null
        })));
      }
      setLoading(false);
    })();
  }, []);

  /* Merge course words into global dictionary via API */
  const pushToGlobal = useCallback(/*#__PURE__*/function () {
    var _ref7 = _asyncToGenerator(function* (incoming) {
      const cur = wordsRef.current;
      const seen = new Set(cur.map(wordKey));
      const fresh = incoming.filter(r => !seen.has(wordKey(r)));
      if (fresh.length) {
        const items = fresh.map(r => ({
          word: r.word,
          part_of_speech: r.pos,
          level: r.level,
          def: r.def || "",
          audio_url: r.audioUrl || "",
          def_url: r.defUrl || ""
        }));
        yield apiCall("POST", "/import-json", {
          items
        });
        const data = yield apiCall("GET", "/words?page_size=99999");
        if (data && data.items) {
          setWords(ws => {
            const aiMap = new Map(ws.map(w => [w.id, w.ai]));
            return data.items.map(w => ({
              ...fromBackend(w),
              ai: aiMap.get(w.id) || null
            }));
          });
        }
      }
      return {
        added: fresh.length,
        skipped: incoming.length - fresh.length
      };
    });
    return function (_x7) {
      return _ref7.apply(this, arguments);
    };
  }(), []);
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 2200);
    return () => clearTimeout(t);
  }, [toast]);
  useEffect(() => {
    if (!lookup) return;
    const close = e => {
      if (e.target.closest && e.target.closest(".lookup-pop")) return;
      setLookup(null);
    };
    const onScroll = () => setLookup(null);
    const onKey = e => {
      if (e.key === "Escape") setLookup(null);
    };
    document.addEventListener("mousedown", close);
    window.addEventListener("scroll", onScroll, true);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", close);
      window.removeEventListener("scroll", onScroll, true);
      document.removeEventListener("keydown", onKey);
    };
  }, [lookup]);
  const flash = m => setToast(m);
  const collect = useCallback(id => {
    const w = wordsRef.current.find(x => x.id === id);
    if (!w) return;
    const newFav = (w.fav || 0) + 1;
    setWords(ws => ws.map(x => x.id === id ? {
      ...x,
      fav: newFav
    } : x));
    apiPatch(id, {
      collected_count: newFav,
      is_bookmarked: true
    });
  }, []);
  const recollect = useCallback((id, delta) => {
    const w = wordsRef.current.find(x => x.id === id);
    if (!w) return;
    const newFav = Math.max(0, (w.fav || 0) + delta);
    setWords(ws => ws.map(x => x.id === id ? {
      ...x,
      fav: newFav
    } : x));
    apiPatch(id, {
      collected_count: newFav,
      is_bookmarked: newFav > 0
    });
  }, []);
  const openReader = useCallback(w => setReader(w), []);
  const playWord = useCallback(w => audio.play(w), [audio.play]);
  const setKnown = useCallback((id, value) => {
    setWords(ws => ws.map(w => w.id === id ? {
      ...w,
      known: value
    } : w));
    apiPatch(id, {
      status: value === "yes" ? "known" : "unknown"
    });
  }, []);
  const toggleExpand = useCallback(id => setExpandedId(cur => cur === id ? null : id), []);
  useEffect(() => {
    try {
      localStorage.setItem("lexicon.defmode", defMode);
    } catch (e) {}
    if (defMode === "hide") setExpandedId(null);
  }, [defMode]);
  const toggleSelect = useCallback(id => setSelected(s => {
    const n = new Set(s);
    if (n.has(id)) n.delete(id);else n.add(id);
    return n;
  }), []);
  const exitManage = () => {
    setManage(false);
    setSelected(new Set());
    setConfirmDel(false);
  };
  const doDelete = () => {
    const n = selected.size;
    const ids = [...selected].filter(id => typeof id === "number");
    setWords(ws => ws.filter(w => !selected.has(w.id)));
    setConfirmDel(false);
    setSelected(new Set());
    setManage(false);
    flash("Deleted " + n + " word" + (n === 1 ? "" : "s"));
    if (ids.length) {
      const params = ids.map(id => "ids=" + id).join("&");
      fetch("/api/words?" + params, {
        method: "DELETE"
      }).catch(console.error);
    }
  };
  const uncollect = id => {
    const w = words.find(x => x.id === id);
    setWords(ws => ws.map(x => x.id === id ? {
      ...x,
      fav: 0
    } : x));
    apiPatch(id, {
      collected_count: 0,
      is_bookmarked: false
    });
    if (w) flash('”' + w.word + '” removed from collected');
  };
  const clearAllCollected = () => {
    const collected = words.filter(w => (w.fav || 0) > 0);
    setWords(ws => ws.map(w => (w.fav || 0) > 0 ? {
      ...w,
      fav: 0
    } : w));
    collected.forEach(w => apiPatch(w.id, {
      collected_count: 0,
      is_bookmarked: false
    }));
    flash("Collected list cleared");
  };
  const setAi = (id, ai) => {
    const isSuccess = ai && ai.meaning && !ai.meaning.startsWith("Could not reach");
    const word = wordsRef.current.find(w => w.id === id);
    const needsDef = isSuccess && word && !word.def;
    setWords(ws => ws.map(w => {
      if (w.id !== id) return w;
      const next = {
        ...w,
        ai
      };
      if (!LEVELS.includes(w.level) && ai && LEVELS.includes(ai.level)) next.level = ai.level;
      if (needsDef) next.def = ai.meaning;
      return next;
    }));
    if (typeof id === "number" && isSuccess) {
      const patch = {
        ai_explanation: JSON.stringify(ai)
      };
      if (needsDef) patch.definitions = [{
        sense: ai.meaning,
        example: ai.example || null
      }];
      apiPatch(id, patch);
    }
  };
  const findEntry = text => {
    const t = (text || "").trim().toLowerCase();
    if (!t) return null;
    return words.find(w => w.word.toLowerCase() === t) || null;
  };
  const ensureEntry = /*#__PURE__*/function () {
    var _ref8 = _asyncToGenerator(function* (text) {
      const t = (text || "").trim().toLowerCase();
      const existing = findEntry(t);
      if (existing) return existing;
      const payload = {
        word: t,
        part_of_speech: "word",
        def_url: "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(t)
      };
      const result = yield apiCall("POST", "/words", payload);
      if (result) {
        const entry = {
          ...fromBackend(result),
          ai: null
        };
        setWords(ws => [entry, ...ws]);
        return entry;
      }
      // fallback: local-only entry if API fails
      const entry = {
        id: "look-" + Date.now() + "-" + Math.random().toString(36).slice(2, 6),
        word: t,
        level: "—",
        pos: "word",
        def: "",
        ai: null,
        fav: 0,
        known: "no",
        defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(t),
        audioUrl: ""
      };
      setWords(ws => [entry, ...ws]);
      return entry;
    });
    return function ensureEntry(_x8) {
      return _ref8.apply(this, arguments);
    };
  }();
  const openLookup = /*#__PURE__*/function () {
    var _ref9 = _asyncToGenerator(function* (text) {
      const entry = yield ensureEntry(text);
      setLookup(null);
      setReader(entry);
    });
    return function openLookup(_x9) {
      return _ref9.apply(this, arguments);
    };
  }();
  const collectLookup = /*#__PURE__*/function () {
    var _ref0 = _asyncToGenerator(function* (text) {
      const entry = yield ensureEntry(text);
      setLookup(null);
      collect(entry.id);
      setReader(entry);
      flash('”' + entry.word + '” collected');
    });
    return function collectLookup(_x0) {
      return _ref0.apply(this, arguments);
    };
  }();
  const addWord = /*#__PURE__*/function () {
    var _ref1 = _asyncToGenerator(function* (data) {
      setTab("dictionary");
      const payload = {
        word: data.word,
        part_of_speech: data.pos,
        level: data.level,
        definitions: data.def ? [{
          sense: data.def,
          example: null
        }] : [],
        def_url: data.defUrl,
        audio_url: data.audioUrl
      };
      const result = yield apiCall("POST", "/words", payload);
      if (!result) {
        flash("Failed to add word — check connection");
        return;
      }
      const k = wordKey(data);
      const existing = wordsRef.current.find(w => wordKey(w) === k);
      const newWord = {
        ...fromBackend(result),
        ai: existing ? existing.ai : null
      };
      if (existing) {
        setWords(ws => ws.map(w => wordKey(w) === k ? newWord : w));
        flash('”' + data.word + '” already existed — updated it');
      } else {
        setWords(ws => [newWord, ...ws]);
        flash('”' + data.word + '” added to the wordbook');
      }
    });
    return function addWord(_x1) {
      return _ref1.apply(this, arguments);
    };
  }();
  const importRows = /*#__PURE__*/function () {
    var _ref10 = _asyncToGenerator(function* (rows) {
      setTab("dictionary");
      const items = rows.map(r => ({
        word: r.word,
        part_of_speech: r.pos,
        level: r.level,
        def: r.def || "",
        audio_url: r.audioUrl || "",
        def_url: r.defUrl || ""
      }));
      const result = yield apiCall("POST", "/import-json", {
        items
      });
      if (result) {
        flash("Imported " + result.inserted + " " + (result.inserted === 1 ? "word" : "words") + (result.updated ? " · updated " + result.updated : ""));
        const data = yield apiCall("GET", "/words?page_size=99999");
        if (data && data.items) {
          setWords(ws => {
            const aiMap = new Map(ws.map(w => [w.id, w.ai]));
            return data.items.map(w => ({
              ...fromBackend(w),
              ai: aiMap.get(w.id) || null
            }));
          });
        }
      } else {
        flash("Import failed — check connection");
      }
    });
    return function importRows(_x10) {
      return _ref10.apply(this, arguments);
    };
  }();
  const toggleLevel = lv => setLevels(ls => ls.includes(lv) ? ls.filter(x => x !== lv) : [...ls, lv]);
  const favCount = useMemo(() => words.filter(w => (w.fav || 0) > 0).length, [words]);
  const knownCount = useMemo(() => words.filter(w => w.known === "yes").length, [words]);
  const unknownCount = words.length - knownCount;
  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    let list = words.filter(w => {
      if (levels.length && !levels.includes(w.level)) return false;
      if (letter && (w.word[0] || "").toUpperCase() !== letter) return false;
      if (needle) {
        return w.word.toLowerCase().includes(needle) || w.def && w.def.toLowerCase().includes(needle) || w.pos.toLowerCase().includes(needle);
      }
      return true;
    });
    if (tab === "favorites") {
      list = list.filter(w => (w.fav || 0) > 0).sort((a, b) => (b.fav || 0) - (a.fav || 0) || (a.word < b.word ? -1 : a.word > b.word ? 1 : 0));
    } else if (tab === "unknown") {
      list = list.filter(w => w.known !== "yes").sort((a, b) => a.word < b.word ? -1 : a.word > b.word ? 1 : 0);
    } else if (tab === "known") {
      list = list.filter(w => w.known === "yes").sort((a, b) => a.word < b.word ? -1 : a.word > b.word ? 1 : 0);
    } else {
      list = list.slice().sort((a, b) => a.word < b.word ? -1 : a.word > b.word ? 1 : a.pos < b.pos ? -1 : a.pos > b.pos ? 1 : 0);
    }
    return list;
  }, [words, q, levels, letter, tab]);
  useEffect(() => {
    setVisibleCount(80);
  }, [q, levels, tab]);
  const visible = useMemo(() => filtered.slice(0, visibleCount), [filtered, visibleCount]);
  const visRef = useRef(visibleCount);
  visRef.current = visibleCount;
  const totalRef = useRef(filtered.length);
  totalRef.current = filtered.length;
  useEffect(() => {
    const check = () => {
      if (visRef.current >= totalRef.current) return;
      const se = document.scrollingElement || document.documentElement;
      const nearBottom = se.scrollHeight - (se.scrollTop + window.innerHeight) < 1000;
      if (nearBottom) setVisibleCount(c => Math.min(c + 80, totalRef.current));
    };
    window.addEventListener("scroll", check, {
      passive: true
    });
    window.addEventListener("resize", check);
    check();
    return () => {
      window.removeEventListener("scroll", check);
      window.removeEventListener("resize", check);
    };
  }, [filtered.length, tab]);
  const showList = tab === "dictionary" || tab === "favorites" || tab === "unknown" || tab === "known";
  return /*#__PURE__*/React.createElement("div", {
    className: "app" + (reader ? " reader-open" : "")
  }, /*#__PURE__*/React.createElement("main", {
    className: "shell"
  }, /*#__PURE__*/React.createElement("header", {
    className: "masthead"
  }, /*#__PURE__*/React.createElement("nav", {
    className: "tabs icontabs"
  }, /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "dictionary" ? " active" : ""),
    onClick: () => setTab("dictionary")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.book, null)), /*#__PURE__*/React.createElement("span", {
    className: "pill"
  }, words.length), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Dictionary")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "courses" ? " active" : ""),
    onClick: () => setTab("courses")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.library, null)), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Courses")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "quiz" ? " active" : ""),
    onClick: () => setTab("quiz")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.cards, null)), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Quiz")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "unknown" ? " active" : ""),
    onClick: () => setTab("unknown")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.x, {
    width: 15,
    height: 15
  })), /*#__PURE__*/React.createElement("span", {
    className: "pill"
  }, unknownCount), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Unknown")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "known" ? " active" : ""),
    onClick: () => setTab("known")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.check, null)), /*#__PURE__*/React.createElement("span", {
    className: "pill"
  }, knownCount), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Known")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "favorites" ? " active" : ""),
    onClick: () => setTab("favorites")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, Icon.bookmark(true)({
    width: 14,
    height: 14
  })), /*#__PURE__*/React.createElement("span", {
    className: "pill"
  }, favCount), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Collected")), /*#__PURE__*/React.createElement("span", {
    className: "tab-sep"
  }), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "add" ? " active" : ""),
    onClick: () => setTab("add")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.plus, null)), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Add")), /*#__PURE__*/React.createElement("button", {
    className: "tab" + (tab === "import" ? " active" : ""),
    onClick: () => setTab("import")
  }, /*#__PURE__*/React.createElement("span", {
    className: "tab-ico"
  }, /*#__PURE__*/React.createElement(Icon.upload, null)), /*#__PURE__*/React.createElement("span", {
    className: "tab-label"
  }, "Import"))), /*#__PURE__*/React.createElement("div", {
    className: "searchbar"
  }, /*#__PURE__*/React.createElement("span", {
    className: "s-icon"
  }, /*#__PURE__*/React.createElement(Icon.search, null)), /*#__PURE__*/React.createElement("input", {
    value: q,
    onChange: e => setQ(e.target.value),
    placeholder: "Search a word, part of speech, or meaning\u2026"
  }), q && /*#__PURE__*/React.createElement("button", {
    className: "s-clear",
    onClick: () => setQ("")
  }, /*#__PURE__*/React.createElement(Icon.x, null)))), showList && /*#__PURE__*/React.createElement(LevelFilter, {
    active: levels,
    onToggle: toggleLevel
  }), showList && /*#__PURE__*/React.createElement(LetterFilter, {
    active: letter,
    onPick: setLetter
  }), tab === "courses" && CoursesPage && /*#__PURE__*/React.createElement(CoursesPage, {
    audio: audio,
    globalWords: words,
    pushToGlobal: pushToGlobal,
    flash: flash
  }), tab === "add" && /*#__PURE__*/React.createElement(AddWord, {
    onAdd: addWord
  }), tab === "import" && /*#__PURE__*/React.createElement(ImportCsv, {
    onImport: importRows
  }), tab === "quiz" && /*#__PURE__*/React.createElement(QuizPage, {
    words: words,
    audio: audio,
    onSetKnown: setKnown,
    onAi: setAi,
    onLookup: setLookup
  }), showList && /*#__PURE__*/React.createElement(React.Fragment, null, /*#__PURE__*/React.createElement("div", {
    className: "list-bar"
  }, /*#__PURE__*/React.createElement("p", {
    className: "count-note"
  }, loading && words.length === 0 ? /*#__PURE__*/React.createElement("span", {
    style: {
      display: "inline-flex",
      alignItems: "center",
      gap: 7
    }
  }, /*#__PURE__*/React.createElement(Icon.loader, null), " Loading wordbook\u2026") : null, tab === "favorites" ? filtered.length ? "Most often collected first — the ones you keep forgetting." : "" : null, tab === "unknown" ? filtered.length ? "Words you marked as not known — your study pile." : "" : null, tab === "known" ? filtered.length ? "Words you've marked as known." : "" : null, tab === "dictionary" ? q || levels.length || letter ? filtered.length + " of " + words.length + " entries" : knownCount + " known · " + unknownCount + " unknown" : null), tab === "favorites" && favCount > 0 && !manage && /*#__PURE__*/React.createElement("button", {
    className: "clear-all",
    onClick: clearAllCollected
  }, /*#__PURE__*/React.createElement(Icon.trash, null), " Clear all (", favCount, ")"), !manage && filtered.length > 0 && /*#__PURE__*/React.createElement("span", {
    className: "defmode",
    title: "Show definitions in the list"
  }, /*#__PURE__*/React.createElement("span", {
    className: "dm-label"
  }, "Definitions"), /*#__PURE__*/React.createElement("span", {
    className: "dm-seg"
  }, /*#__PURE__*/React.createElement("button", {
    className: defMode === "hide" ? "on" : "",
    onClick: () => setDefMode("hide")
  }, "Hidden"), /*#__PURE__*/React.createElement("button", {
    className: defMode === "test" ? "on" : "",
    onClick: () => setDefMode("test"),
    title: "Reveal only for words you've marked known"
  }, "Test"), /*#__PURE__*/React.createElement("button", {
    className: defMode === "all" ? "on" : "",
    onClick: () => setDefMode("all")
  }, "Shown"))), !manage && filtered.length > 0 && /*#__PURE__*/React.createElement("button", {
    className: "clear-all",
    onClick: () => {
      setManage(true);
      setSelected(new Set());
    },
    title: "Select and delete words"
  }, /*#__PURE__*/React.createElement(Icon.check, {
    width: 13,
    height: 13
  }), " Manage")), manage && /*#__PURE__*/React.createElement("div", {
    className: "manage-bar"
  }, /*#__PURE__*/React.createElement("label", {
    className: "manage-all"
  }, /*#__PURE__*/React.createElement("span", {
    className: "pickbox" + (filtered.length > 0 && filtered.every(w => selected.has(w.id)) ? " on" : "")
  }, filtered.length > 0 && filtered.every(w => selected.has(w.id)) && /*#__PURE__*/React.createElement(Icon.check, {
    width: 13,
    height: 13
  })), /*#__PURE__*/React.createElement("button", {
    onClick: () => {
      const all = filtered.length > 0 && filtered.every(w => selected.has(w.id));
      setSelected(s => {
        const n = new Set(s);
        if (all) filtered.forEach(w => n.delete(w.id));else filtered.forEach(w => n.add(w.id));
        return n;
      });
    }
  }, filtered.length > 0 && filtered.every(w => selected.has(w.id)) ? "Deselect all" : "Select all" + (q || levels.length || letter ? " " + filtered.length + " found" : ""))), /*#__PURE__*/React.createElement("span", {
    className: "manage-count"
  }, selected.size, " selected"), /*#__PURE__*/React.createElement("span", {
    className: "manage-spacer"
  }), /*#__PURE__*/React.createElement("button", {
    className: "manage-del",
    disabled: !selected.size,
    onClick: () => setConfirmDel(true)
  }, /*#__PURE__*/React.createElement(Icon.trash, null), " Delete ", selected.size || ""), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn",
    onClick: exitManage
  }, "Done")), filtered.length === 0 && !loading ? /*#__PURE__*/React.createElement("div", {
    className: "empty"
  }, /*#__PURE__*/React.createElement("div", {
    className: "glyph"
  }, tab === "favorites" ? "✦" : tab === "known" ? "✓" : tab === "unknown" ? "✕" : "—"), /*#__PURE__*/React.createElement("p", null, tab === "favorites" ? "Nothing collected yet. Tap the ribbon on a word to file it here." : tab === "unknown" ? "No unknown words — you know everything here." : tab === "known" ? "No known words yet. Tap ✓ on a word you know, or run a Quiz." : "No entries match your search.")) : /*#__PURE__*/React.createElement("div", {
    className: "entries"
  }, visible.map(w => /*#__PURE__*/React.createElement(Entry, {
    key: w.id,
    w: w,
    isPlaying: audio.playing === w.id,
    onPlay: playWord,
    onCollect: collect,
    onSetKnown: setKnown,
    onOpenReader: openReader,
    active: reader && reader.id === w.id,
    manage: manage,
    checked: selected.has(w.id),
    onToggleSelect: toggleSelect,
    defMode: defMode,
    expanded: expandedId === w.id,
    onToggleExpand: toggleExpand,
    onAi: setAi
  })), visibleCount < filtered.length && /*#__PURE__*/React.createElement("div", {
    ref: sentinelRef,
    className: "load-more"
  }, /*#__PURE__*/React.createElement("span", null, "Showing ", visible.length, " of ", filtered.length), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn",
    onClick: () => setVisibleCount(c => Math.min(c + 200, filtered.length))
  }, "Load more"))))), reader && /*#__PURE__*/React.createElement(Reader, {
    word: words.find(x => x.id === reader.id) || reader,
    audio: audio,
    onCollect: collect,
    onRecollect: recollect,
    onUncollect: id => {
      uncollect(id);
    },
    onAi: setAi,
    onLookup: setLookup,
    onClose: () => {
      setReader(null);
      setLookup(null);
    }
  }), lookup && (() => {
    const existing = findEntry(lookup.word);
    const r = lookup.rect;
    const left = Math.max(12, Math.min(r.left, window.innerWidth - 248));
    const below = r.bottom + 184 < window.innerHeight;
    const top = below ? r.bottom + 8 : r.top - 8;
    return /*#__PURE__*/React.createElement("div", {
      className: "lookup-pop",
      style: {
        left,
        top,
        transform: below ? "none" : "translateY(-100%)"
      },
      onMouseDown: e => e.preventDefault()
    }, /*#__PURE__*/React.createElement("div", {
      className: "lp-word"
    }, lookup.word, /*#__PURE__*/React.createElement("span", {
      className: "lp-status" + (existing ? " in" : "")
    }, existing ? "in your dictionary" + (LEVELS.includes(existing.level) ? " · " + existing.level : "") : "not in the dictionary yet")), /*#__PURE__*/React.createElement("div", {
      className: "lp-actions"
    }, /*#__PURE__*/React.createElement("button", {
      className: "txtbtn primary",
      onClick: () => openLookup(lookup.word)
    }, /*#__PURE__*/React.createElement(Icon.spark, null), " Explain"), /*#__PURE__*/React.createElement("button", {
      className: "txtbtn",
      onClick: () => collectLookup(lookup.word),
      title: "Collect this word"
    }, Icon.bookmark(false)({
      width: 14,
      height: 14
    }), " Collect")));
  })(), confirmDel && /*#__PURE__*/React.createElement("div", {
    className: "modal-overlay",
    onClick: () => setConfirmDel(false)
  }, /*#__PURE__*/React.createElement("div", {
    className: "confirm-box",
    onClick: e => e.stopPropagation()
  }, /*#__PURE__*/React.createElement("div", {
    className: "confirm-icon"
  }, /*#__PURE__*/React.createElement(Icon.trash, {
    width: 22,
    height: 22
  })), /*#__PURE__*/React.createElement("h3", null, "Delete ", selected.size, " word", selected.size === 1 ? "" : "s", "?"), /*#__PURE__*/React.createElement("p", null, "This permanently removes the selected ", selected.size === 1 ? "entry" : "entries", " from your dictionary. This can't be undone."), /*#__PURE__*/React.createElement("div", {
    className: "confirm-actions"
  }, /*#__PURE__*/React.createElement("button", {
    className: "txtbtn",
    onClick: () => setConfirmDel(false)
  }, "Cancel"), /*#__PURE__*/React.createElement("button", {
    className: "txtbtn danger",
    onClick: doDelete
  }, /*#__PURE__*/React.createElement(Icon.trash, null), " Delete ", selected.size)))), toast && /*#__PURE__*/React.createElement("div", {
    className: "toast"
  }, toast));
}
Object.assign(window, {
  App,
  Icon,
  LEVELS,
  LEVEL_COLOR,
  wordKey,
  parseCsv,
  Cefr,
  Syllabified,
  buildExplainPrompt,
  parseExplain,
  Tokenized
});
