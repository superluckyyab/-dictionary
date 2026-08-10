/* views.jsx — Import (CSV) modal + Add-word modal. */

function Modal({ title, subtitle, onClose, children, wide }) {
  return (
    <>
      <div className="modal-scrim" onClick={onClose} />
      <div className={"modal" + (wide ? " wide" : "")} role="dialog" aria-label={title}>
        <header className="modal-head">
          <div>
            <h2 className="modal-title">{title}</h2>
            {subtitle && <p className="modal-sub">{subtitle}</p>}
          </div>
          <button className="icon-btn" onClick={onClose} title="Close"><Icon name="close" size={18} /></button>
        </header>
        <div className="modal-body">{children}</div>
      </div>
    </>
  );
}

const SAMPLE_CSV = "abandon,b2,verb,https://www.oxfordlearnersdictionaries.com/definition/english/abandon_1,https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg\nability,a2,noun,https://www.oxfordlearnersdictionaries.com/definition/english/ability_1,https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abi/abili/ability__us_4.ogg";

function ImportModal({ onClose, onImport }) {
  const [text, setText] = React.useState("");
  const [result, setResult] = React.useState(null);
  const fileRef = React.useRef(null);

  const onFile = (e) => {
    const f = e.target.files && e.target.files[0];
    if (!f) return;
    const r = new FileReader();
    r.onload = () => setText(String(r.result || ""));
    r.readAsText(f);
  };

  const doImport = () => {
    const rows = parseCSV(text);
    if (!rows.length) { setResult({ ok: false, n: 0 }); return; }
    const added = onImport(rows);
    setResult({ ok: true, n: added, total: rows.length });
  };

  return (
    <Modal title="Import words" subtitle="Paste or upload a CSV" onClose={onClose} wide>
      <p className="field-hint">
        One word per line: <code>word, level, part-of-speech, definition&nbsp;URL, audio&nbsp;URL</code>.
        Level is A1–C2. The two URLs are optional.
      </p>
      <div className="import-controls">
        <button className="ghost-btn" onClick={() => fileRef.current && fileRef.current.click()}>
          <Icon name="upload" size={15} /> Choose CSV file
        </button>
        <button className="ghost-btn" onClick={() => setText(SAMPLE_CSV)}>Use sample</button>
        <input ref={fileRef} type="file" accept=".csv,text/csv,text/plain" hidden onChange={onFile} />
      </div>
      <textarea className="csv-input" value={text} spellCheck={false}
        onChange={(e) => { setText(e.target.value); setResult(null); }}
        placeholder={"abandon,b2,verb,https://…/abandon_1,https://…/abandon__us_2.ogg"} />
      {result && (
        <div className={"import-result " + (result.ok ? "good" : "bad")}>
          {result.ok
            ? `Imported ${result.n} new ${result.n === 1 ? "entry" : "entries"}${result.total > result.n ? ` (${result.total - result.n} already in your list)` : ""}.`
            : "No valid rows found — check the format above."}
        </div>
      )}
      <div className="modal-foot">
        <button className="ghost-btn" onClick={onClose}>Done</button>
        <button className="solid-btn" onClick={doImport} disabled={!text.trim()}>
          <Icon name="upload" size={15} /> Import
        </button>
      </div>
    </Modal>
  );
}

function AddModal({ onClose, onAdd }) {
  const [f, setF] = React.useState({ word: "", level: "b1", pos: "noun", def: "", url: "", audio: "" });
  const set = (k) => (e) => setF((s) => ({ ...s, [k]: e.target.value }));
  const valid = f.word.trim().length > 0;

  const submit = () => {
    if (!valid) return;
    onAdd({
      word: f.word.trim(),
      level: f.level,
      pos: f.pos.trim() || "—",
      def: f.def.trim(),
      url: f.url.trim() || (OXFORD + f.word.trim().toLowerCase()),
      audio: f.audio.trim(),
    });
    onClose();
  };

  return (
    <Modal title="Add a word" subtitle="Enter one English entry by hand" onClose={onClose}>
      <label className="field"><span>Word</span>
        <input value={f.word} onChange={set("word")} placeholder="e.g. eloquent" autoFocus />
      </label>
      <div className="field-row">
        <label className="field"><span>CEFR level</span>
          <select value={f.level} onChange={set("level")}>
            {CEFR_ORDER.map((l) => <option key={l} value={l}>{l.toUpperCase()}</option>)}
          </select>
        </label>
        <label className="field"><span>Part of speech</span>
          <select value={f.pos} onChange={set("pos")}>
            {["noun", "verb", "adjective", "adverb", "preposition", "pronoun", "conjunction", "determiner", "phrase"]
              .map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <label className="field"><span>Definition <em>(English)</em></span>
        <textarea value={f.def} onChange={set("def")} rows={3} placeholder="A short English definition…" />
      </label>
      <label className="field"><span>Dictionary URL <em>(optional)</em></span>
        <input value={f.url} onChange={set("url")} placeholder="https://www.oxfordlearnersdictionaries.com/…" />
      </label>
      <label className="field"><span>Audio URL <em>(optional — else spoken aloud)</em></span>
        <input value={f.audio} onChange={set("audio")} placeholder="https://…/word__us_1.ogg" />
      </label>
      <div className="modal-foot">
        <button className="ghost-btn" onClick={onClose}>Cancel</button>
        <button className="solid-btn" onClick={submit} disabled={!valid}>
          <Icon name="plus" size={15} /> Add word
        </button>
      </div>
    </Modal>
  );
}

Object.assign(window, { Modal, ImportModal, AddModal });
