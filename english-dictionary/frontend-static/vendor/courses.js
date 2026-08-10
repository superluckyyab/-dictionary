function asyncGeneratorStep(n, t, e, r, o, a, c) { try { var i = n[a](c), u = i.value; } catch (n) { return void e(n); } i.done ? t(u) : Promise.resolve(u).then(r, o); }
function _asyncToGenerator(n) { return function () { var t = this, e = arguments; return new Promise(function (r, o) { var a = n.apply(t, e); function _next(n) { asyncGeneratorStep(a, r, o, _next, _throw, "next", n); } function _throw(n) { asyncGeneratorStep(a, r, o, _next, _throw, "throw", n); } _next(void 0); }); }; }
/* global React, window, localStorage */
/* Courses: Books → Classes → words, each class split into Test / Known / Unknown.
   Unknown words can be pushed (deduped) into the global dictionary's Unknown bucket. */
;
(function () {
  const {
    useState,
    useEffect,
    useRef,
    useMemo,
    useCallback
  } = React;
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
    try {
      const r = localStorage.getItem(BOOKS_KEY);
      if (r) return JSON.parse(r);
    } catch (e) {}
    return [];
  }
  function fmtDate(ts) {
    const d = new Date(ts);
    const date = d.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
    const time = d.toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit"
    });
    return date + " · " + time;
  }
  function rid(p) {
    return p + "-" + Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  }
  function oxfordUrl(w) {
    return "https://www.oxfordlearnersdictionaries.com/definition/english/" + encodeURIComponent(String(w).toLowerCase());
  }
  // Plain word list: split on commas / newlines / semicolons. e.g. "abandon, test" -> ["abandon","test"]
  function parseWordList(text) {
    return String(text || "").split(/[\n,;]+/).map(s => s.trim().toLowerCase()).filter(Boolean);
  }

  /* ---- small inline name input ---- */
  function InlineAdd({
    placeholder,
    cta,
    onAdd,
    onCancel
  }) {
    const [v, setV] = useState("");
    const ref = useRef(null);
    useEffect(() => {
      if (ref.current) ref.current.focus();
    }, []);
    const submit = e => {
      e.preventDefault();
      const t = v.trim();
      if (t) {
        onAdd(t);
        setV("");
      }
    };
    return /*#__PURE__*/React.createElement("form", {
      className: "inline-add",
      onSubmit: submit
    }, /*#__PURE__*/React.createElement("input", {
      ref: ref,
      value: v,
      onChange: e => setV(e.target.value),
      placeholder: placeholder,
      onKeyDown: e => {
        if (e.key === "Escape") onCancel && onCancel();
      }
    }), /*#__PURE__*/React.createElement("button", {
      className: "txtbtn primary",
      type: "submit"
    }, /*#__PURE__*/React.createElement(CIcon.plus, null), " ", cta), onCancel && /*#__PURE__*/React.createElement("button", {
      className: "txtbtn",
      type: "button",
      onClick: onCancel
    }, "Cancel"));
  }

  /* ---- sort control ---- */
  function SortBar({
    sortBy,
    onSort,
    label
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "sortbar"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lbl"
    }, label), /*#__PURE__*/React.createElement("span", {
      className: "seg"
    }, /*#__PURE__*/React.createElement("button", {
      className: sortBy === "name" ? "on" : "",
      onClick: () => onSort("name")
    }, "A\u2013Z"), /*#__PURE__*/React.createElement("button", {
      className: sortBy === "time" ? "on" : "",
      onClick: () => onSort("time")
    }, "Newest")));
  }
  function sortItems(list, sortBy) {
    const a = list.slice();
    if (sortBy === "name") {
      a.sort((x, y) => {
        const xa = (x.title || "").toLowerCase(),
          ya = (y.title || "").toLowerCase();
        return xa < ya ? -1 : xa > ya ? 1 : 0;
      });
    } else {
      a.sort((x, y) => (y.createdAt || 0) - (x.createdAt || 0));
    }
    return a;
  }

  /* ---- one course word row ---- */
  function CWRow({
    w,
    audio,
    onKnown
  }) {
    return /*#__PURE__*/React.createElement("div", {
      className: "cw-row" + (w.known === "yes" ? " is-known" : "")
    }, /*#__PURE__*/React.createElement("div", {
      className: "cw-main"
    }, /*#__PURE__*/React.createElement("span", {
      className: "cw-word"
    }, /*#__PURE__*/React.createElement(CSyllabified, {
      word: w.word
    })), /*#__PURE__*/React.createElement("span", {
      className: "cw-pos"
    }, /*#__PURE__*/React.createElement("em", null, w.pos))), /*#__PURE__*/React.createElement("div", {
      className: "cw-actions"
    }, /*#__PURE__*/React.createElement(CCefr, {
      level: w.level
    }), /*#__PURE__*/React.createElement("button", {
      className: "iconbtn" + (audio.playing === w.id ? " playing" : ""),
      title: "Pronounce",
      onClick: () => audio.play(w)
    }, /*#__PURE__*/React.createElement(CIcon.speaker, null)), /*#__PURE__*/React.createElement("button", {
      className: "know-switch" + (w.known === "yes" ? " on" : ""),
      role: "switch",
      "aria-checked": w.known === "yes",
      title: w.known === "yes" ? "Known — tap to mark unknown" : "Unknown — tap to mark known",
      onClick: () => onKnown(w.id, w.known === "yes" ? "no" : "yes")
    }, /*#__PURE__*/React.createElement("span", {
      className: "ks-knob"
    }, w.known === "yes" ? /*#__PURE__*/React.createElement(CIcon.check, {
      width: 12,
      height: 12
    }) : /*#__PURE__*/React.createElement(CIcon.x, {
      width: 12,
      height: 12
    })))));
  }

  /* ---- in-class test (5-at-a-time, know/don’t-know, reveal) ---- */
  function ClassTest({
    cls,
    audio,
    onKnown,
    onAi
  }) {
    const [size, setSize] = useState(5);
    const [batchIds, setBatchIds] = useState(null);
    const [answers, setAnswers] = useState({});
    const [loading, setLoading] = useState({});
    const pool = useMemo(() => cls.words.filter(w => w.known !== "yes"), [cls.words]);
    const poolRef = useRef(pool);
    poolRef.current = pool;
    const sizeRef = useRef(size);
    sizeRef.current = size;
    const draw = useCallback(() => {
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
      draw();
    }, [size, draw]);
    const cards = (batchIds || []).map(id => cls.words.find(w => w.id === id)).filter(Boolean);
    const firstUn = cards.findIndex(w => !answers[w.id]);
    const shown = firstUn === -1 ? cards : cards.slice(0, firstUn + 1);
    const allAns = cards.length > 0 && firstUn === -1;
    const ensureAi = /*#__PURE__*/function () {
      var _ref = _asyncToGenerator(function* (w) {
        if (w.ai && w.ai.meaning) return;
        setLoading(s => ({
          ...s,
          [w.id]: true
        }));
        try {
          const res = yield window.claude.complete(cBuildPrompt(w.word, w.pos, 0, null));
          onAi(w.id, cParseExplain(res));
        } catch (e) {
          onAi(w.id, {
            meaning: "Could not reach the AI tutor — try again.",
            example: "",
            tip: ""
          });
        } finally {
          setLoading(s => ({
            ...s,
            [w.id]: false
          }));
        }
      });
      return function ensureAi(_x) {
        return _ref.apply(this, arguments);
      };
    }();
    const answer = (w, val) => {
      onKnown(w.id, val);
      setAnswers(a => ({
        ...a,
        [w.id]: val
      }));
      ensureAi(w);
    };
    const settings = /*#__PURE__*/React.createElement("div", {
      className: "quiz-settings"
    }, /*#__PURE__*/React.createElement("div", {
      className: "qs-group"
    }, /*#__PURE__*/React.createElement("span", {
      className: "lbl"
    }, "Words"), [1, 2, 3, 4, 5].map(n => /*#__PURE__*/React.createElement("button", {
      key: n,
      className: "size-chip" + (size === n ? " on" : ""),
      onClick: () => setSize(n)
    }, n))));
    if (cards.length === 0) {
      return /*#__PURE__*/React.createElement("div", {
        className: "quiz"
      }, settings, /*#__PURE__*/React.createElement("div", {
        className: "course-empty"
      }, /*#__PURE__*/React.createElement("div", {
        className: "glyph"
      }, "\u2713"), /*#__PURE__*/React.createElement("p", null, "No unknown words left in this class \u2014 mark some unknown, or import more.")));
    }
    return /*#__PURE__*/React.createElement("div", {
      className: "quiz"
    }, settings, /*#__PURE__*/React.createElement("p", {
      className: "quiz-note"
    }, pool.length, " unknown word", pool.length === 1 ? "" : "s", " in this class \u2014 mark them known to clear them."), shown.map((w, i) => {
      const a = answers[w.id];
      return /*#__PURE__*/React.createElement("div", {
        className: "quiz-card" + (a ? " answered" : ""),
        key: w.id
      }, /*#__PURE__*/React.createElement("div", {
        className: "qc-row"
      }, /*#__PURE__*/React.createElement("button", {
        className: "qc-btn qc-yes" + (a === "yes" ? " on" : ""),
        onClick: () => answer(w, "yes")
      }, /*#__PURE__*/React.createElement(CIcon.check, null), " I know it"), /*#__PURE__*/React.createElement("div", {
        className: "qc-word-wrap"
      }, /*#__PURE__*/React.createElement("div", {
        className: "qc-index"
      }, i + 1, " of ", cards.length), /*#__PURE__*/React.createElement("div", {
        className: "qc-word"
      }, /*#__PURE__*/React.createElement(CSyllabified, {
        word: w.word
      })), /*#__PURE__*/React.createElement("div", {
        className: "qc-meta"
      }, /*#__PURE__*/React.createElement("em", null, w.pos), /*#__PURE__*/React.createElement(CCefr, {
        level: w.level
      }), /*#__PURE__*/React.createElement("button", {
        className: "iconbtn" + (audio.playing === w.id ? " playing" : ""),
        onClick: () => audio.play(w),
        title: "Pronounce"
      }, /*#__PURE__*/React.createElement(CIcon.speaker, null)))), /*#__PURE__*/React.createElement("button", {
        className: "qc-btn qc-no" + (a === "no" ? " on" : ""),
        onClick: () => answer(w, "no")
      }, /*#__PURE__*/React.createElement(CIcon.x, null), " Don\u2019t know")), a && /*#__PURE__*/React.createElement("div", {
        className: "qc-reveal"
      }, w.def && /*#__PURE__*/React.createElement("p", {
        className: "qc-def"
      }, w.def), loading[w.id] && !(w.ai && w.ai.meaning) ? /*#__PURE__*/React.createElement("div", {
        className: "rs-loading"
      }, /*#__PURE__*/React.createElement(CIcon.loader, null), " Fetching a friendly explanation\u2026") : w.ai && w.ai.meaning ? /*#__PURE__*/React.createElement("div", {
        className: "qc-ai"
      }, /*#__PURE__*/React.createElement("p", {
        className: "qc-meaning"
      }, w.ai.meaning), w.ai.example && /*#__PURE__*/React.createElement("p", {
        className: "qc-ex"
      }, "\u201C", w.ai.example, "\u201D")) : null));
    }), /*#__PURE__*/React.createElement("div", {
      className: "quiz-foot"
    }, /*#__PURE__*/React.createElement("button", {
      className: "txtbtn quiz-next" + (allAns ? " primary" : ""),
      onClick: draw
    }, "Next batch ", /*#__PURE__*/React.createElement(CIcon.chev, {
      width: 12,
      height: 12
    })), !allAns && /*#__PURE__*/React.createElement("span", {
      className: "quiz-hint"
    }, cards.filter(w => !answers[w.id]).length, " left in this batch")));
  }

  /* ---------------- main Courses page ---------------- */
  function CoursesPage({
    audio,
    globalWords,
    pushToGlobal,
    flash
  }) {
    const [books, setBooks] = useState(loadBooks);
    const [view, setView] = useState({
      level: "books"
    });
    const [sortBy, setSortBy] = useState("time");
    const [adding, setAdding] = useState(false);
    const [importing, setImporting] = useState(false);
    const [pool, setPool] = useState(null); // { bookId, classId, words:[...] } words not found in dictionary

    // fast lookup: headword -> first dictionary entry
    const dictByWord = useMemo(() => {
      const m = new Map();
      (globalWords || []).forEach(w => {
        const k = (w.word || "").toLowerCase();
        if (!m.has(k)) m.set(k, w);
      });
      return m;
    }, [globalWords]);
    useEffect(() => {
      try {
        localStorage.setItem(BOOKS_KEY, JSON.stringify(books));
      } catch (e) {}
    }, [books]);
    const book = view.bookId ? books.find(b => b.id === view.bookId) : null;
    const cls = book && view.classId ? book.classes.find(c => c.id === view.classId) : null;

    /* mutations */
    const addBook = title => {
      setBooks(bs => [...bs, {
        id: rid("bk"),
        title,
        createdAt: Date.now(),
        classes: []
      }]);
      setAdding(false);
    };
    const addClass = (bookId, title) => {
      setBooks(bs => bs.map(b => b.id !== bookId ? b : {
        ...b,
        classes: [...b.classes, {
          id: rid("cl"),
          title,
          createdAt: Date.now(),
          words: []
        }]
      }));
      setAdding(false);
    };
    const delBook = bookId => setBooks(bs => bs.filter(b => b.id !== bookId));
    const delClass = (bookId, classId) => setBooks(bs => bs.map(b => b.id !== bookId ? b : {
      ...b,
      classes: b.classes.filter(c => c.id !== classId)
    }));
    const updateClass = (bookId, classId, fn) => setBooks(bs => bs.map(b => b.id !== bookId ? b : {
      ...b,
      classes: b.classes.map(c => c.id !== classId ? c : fn(c))
    }));
    const importToClass = (bookId, classId, text) => {
      const tokens = Array.from(new Set(parseWordList(text)));
      if (!tokens.length) {
        flash("No words found");
        return;
      }
      const target = books.find(b => b.id === bookId).classes.find(c => c.id === classId);
      const seen = new Set(target.words.map(w => w.word.toLowerCase()));
      const fresh = [];
      const notFound = [];
      let dupe = 0;
      tokens.forEach(t => {
        const e = dictByWord.get(t);
        if (!e) {
          notFound.push(t);
          return;
        }
        if (seen.has(t)) {
          dupe++;
          return;
        }
        seen.add(t);
        fresh.push({
          id: rid("cw"),
          word: e.word,
          level: e.level,
          pos: e.pos,
          def: e.def || "",
          defUrl: e.defUrl || oxfordUrl(e.word),
          audioUrl: e.audioUrl || "",
          known: e.known || "no",
          ai: e.ai || null
        });
      });
      if (fresh.length) updateClass(bookId, classId, c => ({
        ...c,
        words: [...c.words, ...fresh]
      }));
      setImporting(false);
      setPool(notFound.length ? {
        bookId,
        classId,
        words: notFound
      } : null);
      flash("Added " + fresh.length + " from your dictionary" + (dupe ? " · " + dupe + " already in class" : "") + (notFound.length ? " · " + notFound.length + " not in dictionary" : ""));
    };
    const removeFromPool = w => setPool(p => {
      if (!p) return p;
      const words = p.words.filter(x => x !== w);
      return words.length ? {
        ...p,
        words
      } : null;
    });
    const importPool = () => {
      if (!pool) return;
      const incoming = pool.words.map(w => ({
        word: w,
        level: "—",
        pos: "word",
        def: "",
        defUrl: oxfordUrl(w),
        audioUrl: ""
      }));
      pushToGlobal(incoming); // add new words to the global dictionary (deduped)
      const target = books.find(b => b.id === pool.bookId).classes.find(c => c.id === pool.classId);
      const seen = new Set(target.words.map(w => w.word.toLowerCase()));
      const fresh = pool.words.filter(w => !seen.has(w)).map(w => ({
        id: rid("cw"),
        word: w,
        level: "—",
        pos: "word",
        def: "",
        defUrl: oxfordUrl(w),
        audioUrl: "",
        known: "no",
        ai: null
      }));
      if (fresh.length) updateClass(pool.bookId, pool.classId, c => ({
        ...c,
        words: [...c.words, ...fresh]
      }));
      flash("Imported " + pool.words.length + " new word" + (pool.words.length === 1 ? "" : "s") + " to your dictionary & class");
      setPool(null);
    };
    const setWordKnown = (bookId, classId, wordId, val) => updateClass(bookId, classId, c => ({
      ...c,
      words: c.words.map(w => w.id === wordId ? {
        ...w,
        known: val
      } : w)
    }));
    const setWordAi = (bookId, classId, wordId, ai) => updateClass(bookId, classId, c => ({
      ...c,
      words: c.words.map(w => w.id === wordId ? {
        ...w,
        ai
      } : w)
    }));
    const pushUnknown = /*#__PURE__*/function () {
      var _ref2 = _asyncToGenerator(function* (wordsArr, label) {
        const incoming = wordsArr.filter(w => w.known !== "yes").map(w => ({
          word: w.word,
          level: w.level,
          pos: w.pos,
          def: w.def || "",
          defUrl: w.defUrl,
          audioUrl: w.audioUrl
        }));
        if (!incoming.length) {
          flash("No unknown words to push" + (label ? " from " + label : ""));
          return;
        }
        const {
          added,
          skipped
        } = yield pushToGlobal(incoming);
        flash(added + " word" + (added === 1 ? "" : "s") + " added to Dictionary" + (skipped ? " · " + skipped + " already there" : ""));
      });
      return function pushUnknown(_x2, _x3) {
        return _ref2.apply(this, arguments);
      };
    }();

    /* ---------------- BOOKS LEVEL ---------------- */
    if (view.level === "books") {
      const list = sortItems(books, sortBy);
      return /*#__PURE__*/React.createElement("div", {
        className: "courses"
      }, /*#__PURE__*/React.createElement("div", {
        className: "course-top"
      }, /*#__PURE__*/React.createElement("h2", {
        className: "course-title"
      }, /*#__PURE__*/React.createElement(CIcon.library, null), " Books"), /*#__PURE__*/React.createElement("div", {
        className: "course-top-actions"
      }, books.length > 1 && /*#__PURE__*/React.createElement(SortBar, {
        sortBy: sortBy,
        onSort: setSortBy,
        label: "Sort"
      }), !adding && /*#__PURE__*/React.createElement("button", {
        className: "txtbtn primary",
        onClick: () => setAdding(true)
      }, /*#__PURE__*/React.createElement(CIcon.plus, null), " New book"))), adding && /*#__PURE__*/React.createElement(InlineAdd, {
        placeholder: "Book title \u2014 e.g. New Concept English 2",
        cta: "Create book",
        onAdd: addBook,
        onCancel: () => setAdding(false)
      }), books.length === 0 && !adding ? /*#__PURE__*/React.createElement("div", {
        className: "course-empty"
      }, /*#__PURE__*/React.createElement("div", {
        className: "glyph"
      }, "\u2761"), /*#__PURE__*/React.createElement("p", null, "No books yet. Create a book, add classes inside it, then import words class by class.")) : /*#__PURE__*/React.createElement("div", {
        className: "book-grid"
      }, list.map(b => {
        const total = b.classes.reduce((n, c) => n + c.words.length, 0);
        const unknown = b.classes.reduce((n, c) => n + c.words.filter(w => w.known !== "yes").length, 0);
        return /*#__PURE__*/React.createElement("div", {
          className: "book-card",
          key: b.id,
          onClick: () => {
            setView({
              level: "book",
              bookId: b.id
            });
            setAdding(false);
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "bc-spine"
        }), /*#__PURE__*/React.createElement("div", {
          className: "bc-body"
        }, /*#__PURE__*/React.createElement("div", {
          className: "bc-title"
        }, b.title), /*#__PURE__*/React.createElement("div", {
          className: "bc-meta"
        }, b.classes.length, " class", b.classes.length === 1 ? "" : "es", " \xB7 ", total, " word", total === 1 ? "" : "s"), /*#__PURE__*/React.createElement("div", {
          className: "bc-sub"
        }, unknown, " unknown \xB7 added ", fmtDate(b.createdAt))), /*#__PURE__*/React.createElement("button", {
          className: "bc-del",
          title: "Delete book",
          onClick: e => {
            e.stopPropagation();
            delBook(b.id);
          }
        }, /*#__PURE__*/React.createElement(CIcon.trash, null)));
      })));
    }

    /* ---------------- BOOK LEVEL (classes) ---------------- */
    if (view.level === "book" && book) {
      const list = sortItems(book.classes, sortBy);
      const bookUnknown = book.classes.reduce((a, c) => a.concat(c.words.filter(w => w.known !== "yes")), []);
      return /*#__PURE__*/React.createElement("div", {
        className: "courses"
      }, /*#__PURE__*/React.createElement("div", {
        className: "crumb"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setView({
          level: "books"
        })
      }, "Books"), /*#__PURE__*/React.createElement("span", {
        className: "crumb-sep"
      }, "/"), /*#__PURE__*/React.createElement("span", {
        className: "crumb-cur"
      }, book.title)), /*#__PURE__*/React.createElement("div", {
        className: "course-top"
      }, /*#__PURE__*/React.createElement("h2", {
        className: "course-title"
      }, /*#__PURE__*/React.createElement(CIcon.book, null), " ", book.title), /*#__PURE__*/React.createElement("div", {
        className: "course-top-actions"
      }, book.classes.length > 1 && /*#__PURE__*/React.createElement(SortBar, {
        sortBy: sortBy,
        onSort: setSortBy,
        label: "Sort"
      }), bookUnknown.length > 0 && /*#__PURE__*/React.createElement("button", {
        className: "txtbtn",
        onClick: () => pushUnknown(bookUnknown, book.title),
        title: "Push every unknown word in this book to the Dictionary"
      }, /*#__PURE__*/React.createElement(CIcon.upload, null), " Push ", bookUnknown.length, " \u2192 Dictionary"), !adding && /*#__PURE__*/React.createElement("button", {
        className: "txtbtn primary",
        onClick: () => setAdding(true)
      }, /*#__PURE__*/React.createElement(CIcon.plus, null), " New class"))), adding && /*#__PURE__*/React.createElement(InlineAdd, {
        placeholder: "Class title \u2014 e.g. Lesson 1, or a theme name",
        cta: "Create class",
        onAdd: t => addClass(book.id, t),
        onCancel: () => setAdding(false)
      }), book.classes.length === 0 && !adding ? /*#__PURE__*/React.createElement("div", {
        className: "course-empty"
      }, /*#__PURE__*/React.createElement("div", {
        className: "glyph"
      }, "\u2761"), /*#__PURE__*/React.createElement("p", null, "No classes yet. Create a class (a lesson or theme), then import its words.")) : /*#__PURE__*/React.createElement("div", {
        className: "class-list"
      }, list.map(c => {
        const unknown = c.words.filter(w => w.known !== "yes").length;
        const known = c.words.length - unknown;
        return /*#__PURE__*/React.createElement("div", {
          className: "class-card",
          key: c.id,
          onClick: () => {
            setView({
              level: "class",
              bookId: book.id,
              classId: c.id,
              sub: "unknown"
            });
            setImporting(false);
          }
        }, /*#__PURE__*/React.createElement("div", {
          className: "cc-main"
        }, /*#__PURE__*/React.createElement("div", {
          className: "cc-title"
        }, c.title), /*#__PURE__*/React.createElement("div", {
          className: "cc-meta"
        }, "added ", fmtDate(c.createdAt))), /*#__PURE__*/React.createElement("div", {
          className: "cc-stats"
        }, /*#__PURE__*/React.createElement("span", {
          className: "cc-stat cc-unknown"
        }, /*#__PURE__*/React.createElement(CIcon.x, {
          width: 12,
          height: 12
        }), " ", unknown), /*#__PURE__*/React.createElement("span", {
          className: "cc-stat cc-known"
        }, /*#__PURE__*/React.createElement(CIcon.check, {
          width: 12,
          height: 12
        }), " ", known)), /*#__PURE__*/React.createElement("button", {
          className: "bc-del",
          title: "Delete class",
          onClick: e => {
            e.stopPropagation();
            delClass(book.id, c.id);
          }
        }, /*#__PURE__*/React.createElement(CIcon.trash, null)));
      })));
    }

    /* ---------------- CLASS LEVEL ---------------- */
    if (view.level === "class" && book && cls) {
      const sub = view.sub || "unknown";
      const unknownWords = cls.words.filter(w => w.known !== "yes");
      const knownWords = cls.words.filter(w => w.known === "yes");
      const setSub = s => setView(v => ({
        ...v,
        sub: s
      }));
      const rows = sub === "known" ? knownWords : unknownWords;
      return /*#__PURE__*/React.createElement("div", {
        className: "courses"
      }, /*#__PURE__*/React.createElement("div", {
        className: "crumb"
      }, /*#__PURE__*/React.createElement("button", {
        onClick: () => setView({
          level: "books"
        })
      }, "Books"), /*#__PURE__*/React.createElement("span", {
        className: "crumb-sep"
      }, "/"), /*#__PURE__*/React.createElement("button", {
        onClick: () => setView({
          level: "book",
          bookId: book.id
        })
      }, book.title), /*#__PURE__*/React.createElement("span", {
        className: "crumb-sep"
      }, "/"), /*#__PURE__*/React.createElement("span", {
        className: "crumb-cur"
      }, cls.title)), /*#__PURE__*/React.createElement("div", {
        className: "course-top"
      }, /*#__PURE__*/React.createElement("h2", {
        className: "course-title"
      }, cls.title), /*#__PURE__*/React.createElement("div", {
        className: "course-top-actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "txtbtn",
        onClick: () => setImporting(v => !v)
      }, /*#__PURE__*/React.createElement(CIcon.upload, null), " Import words"), unknownWords.length > 0 && /*#__PURE__*/React.createElement("button", {
        className: "txtbtn primary",
        onClick: () => pushUnknown(cls.words, cls.title),
        title: "Add this class\u2019s unknown words to the global Dictionary (skips ones already there)"
      }, /*#__PURE__*/React.createElement(CIcon.library, null), " Push ", unknownWords.length, " \u2192 Dictionary"))), importing && /*#__PURE__*/React.createElement(ClassImport, {
        onImport: text => importToClass(book.id, cls.id, text),
        onCancel: () => setImporting(false)
      }), pool && pool.classId === cls.id && pool.words.length > 0 && /*#__PURE__*/React.createElement("div", {
        className: "pool-panel"
      }, /*#__PURE__*/React.createElement("div", {
        className: "pool-head"
      }, /*#__PURE__*/React.createElement("div", {
        className: "pool-title"
      }, /*#__PURE__*/React.createElement(CIcon.x, {
        width: 15,
        height: 15
      }), " ", pool.words.length, " word", pool.words.length === 1 ? "" : "s", " not in your dictionary"), /*#__PURE__*/React.createElement("div", {
        className: "pool-actions"
      }, /*#__PURE__*/React.createElement("button", {
        className: "txtbtn primary",
        onClick: importPool
      }, /*#__PURE__*/React.createElement(CIcon.library, null), " Import all to dictionary & class"), /*#__PURE__*/React.createElement("button", {
        className: "txtbtn",
        onClick: () => setPool(null)
      }, "Dismiss"))), /*#__PURE__*/React.createElement("p", {
        className: "pool-note"
      }, "These weren\u2019t found in your dictionary (possible typos, or genuinely new words). Remove any you don\u2019t want, then one-click import the rest."), /*#__PURE__*/React.createElement("div", {
        className: "pool-chips"
      }, pool.words.map(w => /*#__PURE__*/React.createElement("span", {
        className: "pool-chip",
        key: w
      }, w, /*#__PURE__*/React.createElement("button", {
        title: "Remove",
        onClick: () => removeFromPool(w)
      }, /*#__PURE__*/React.createElement(CIcon.x, {
        width: 11,
        height: 11
      })))))), /*#__PURE__*/React.createElement("div", {
        className: "subtabs"
      }, /*#__PURE__*/React.createElement("button", {
        className: sub === "test" ? "on" : "",
        onClick: () => setSub("test")
      }, /*#__PURE__*/React.createElement(CIcon.cards, {
        width: 14,
        height: 14
      }), " Test"), /*#__PURE__*/React.createElement("button", {
        className: sub === "unknown" ? "on" : "",
        onClick: () => setSub("unknown")
      }, /*#__PURE__*/React.createElement(CIcon.x, {
        width: 13,
        height: 13
      }), " Unknown ", /*#__PURE__*/React.createElement("span", {
        className: "st-count"
      }, unknownWords.length)), /*#__PURE__*/React.createElement("button", {
        className: sub === "known" ? "on" : "",
        onClick: () => setSub("known")
      }, /*#__PURE__*/React.createElement(CIcon.check, {
        width: 13,
        height: 13
      }), " Known ", /*#__PURE__*/React.createElement("span", {
        className: "st-count"
      }, knownWords.length))), sub === "test" ? /*#__PURE__*/React.createElement(ClassTest, {
        cls: cls,
        audio: audio,
        onKnown: (wid, val) => setWordKnown(book.id, cls.id, wid, val),
        onAi: (wid, ai) => setWordAi(book.id, cls.id, wid, ai)
      }) : rows.length === 0 ? /*#__PURE__*/React.createElement("div", {
        className: "course-empty"
      }, /*#__PURE__*/React.createElement("div", {
        className: "glyph"
      }, sub === "known" ? "✓" : "—"), /*#__PURE__*/React.createElement("p", null, cls.words.length === 0 ? "No words yet — tap “Import words” to add some." : sub === "known" ? "Nothing marked known yet." : "Every word here is known. Nice.")) : /*#__PURE__*/React.createElement("div", {
        className: "cw-list"
      }, rows.map(w => /*#__PURE__*/React.createElement(CWRow, {
        key: w.id,
        w: w,
        audio: audio,
        onKnown: (wid, val) => setWordKnown(book.id, cls.id, wid, val)
      }))));
    }
    return null;
  }

  /* ---- class word-list import box ---- */
  function ClassImport({
    onImport,
    onCancel
  }) {
    const [text, setText] = useState("");
    const fileRef = useRef(null);
    const onFile = e => {
      const f = e.target.files && e.target.files[0];
      if (!f) return;
      const r = new FileReader();
      r.onload = () => setText(String(r.result || ""));
      r.readAsText(f);
    };
    const count = useMemo(() => new Set(parseWordList(text)).size, [text]);
    return /*#__PURE__*/React.createElement("div", {
      className: "panel-card course-import"
    }, /*#__PURE__*/React.createElement("h2", null, "Import words into this class"), /*#__PURE__*/React.createElement("p", {
      className: "sub"
    }, "Just the words \u2014 one per line or comma-separated, e.g. ", /*#__PURE__*/React.createElement("code", null, "abandon, test"), ". Each is matched to your dictionary; any word that isn\u2019t there goes to a review pool below."), /*#__PURE__*/React.createElement("div", {
      className: "field"
    }, /*#__PURE__*/React.createElement("textarea", {
      className: "import-csv import-words",
      value: text,
      onChange: e => setText(e.target.value),
      spellCheck: "false",
      placeholder: "abandon, ability, able\nabolish\nabout"
    })), /*#__PURE__*/React.createElement("div", {
      className: "form-actions",
      style: {
        marginTop: 14
      }
    }, /*#__PURE__*/React.createElement("button", {
      className: "txtbtn primary",
      onClick: () => onImport(text),
      disabled: !count
    }, /*#__PURE__*/React.createElement(CIcon.upload, null), " Import ", count, " ", count === 1 ? "word" : "words"), /*#__PURE__*/React.createElement("button", {
      className: "filebtn",
      onClick: () => fileRef.current && fileRef.current.click()
    }, /*#__PURE__*/React.createElement(CIcon.upload, null), " Choose file"), /*#__PURE__*/React.createElement("button", {
      className: "txtbtn",
      onClick: onCancel
    }, "Cancel"), /*#__PURE__*/React.createElement("input", {
      ref: fileRef,
      type: "file",
      accept: ".csv,text/csv,text/plain",
      style: {
        display: "none"
      },
      onChange: onFile
    })));
  }
  window.CoursesPage = CoursesPage;
})();
