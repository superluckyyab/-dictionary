/* cards.jsx — WordCard (collapsible) + ReaderPanel (Oxford embed w/ fallback). */

function WordCard({ w, id, count, expanded, onToggle, onCollect, onUncollect, onOpenReader, aiText, onAI }) {
  const [aiBusy, setAiBusy] = React.useState(false);
  const [localAI, setLocalAI] = React.useState(aiText || "");
  React.useEffect(() => { setLocalAI(aiText || ""); }, [aiText]);

  const runAI = async () => {
    setAiBusy(true);
    try {
      const txt = await onAI(id, w);
      setLocalAI(txt);
    } catch (e) {
      setLocalAI("Could not reach the explainer just now — try again in a moment.");
    } finally {
      setAiBusy(false);
    }
  };

  return (
    <article className={"word-card" + (expanded ? " open" : "")}>
      <header className="wc-head" onClick={onToggle}>
        <div className="wc-headline">
          <h3 className="wc-word">{w.word}</h3>
          <span className="wc-pos">{w.pos}</span>
          <LevelTag level={w.level} />
        </div>
        <div className="wc-actions" onClick={(e) => e.stopPropagation()}>
          <AudioButton word={w.word} audio={w.audio} />
          <CollectButton count={count} onCollect={onCollect} onUncollect={onUncollect} />
          <button className={"icon-btn chev" + (expanded ? " up" : "")} onClick={onToggle}
            aria-label={expanded ? "Collapse" : "Expand"}>
            <Icon name="chevron" size={18} />
          </button>
        </div>
      </header>

      <div className="wc-body" style={{ maxHeight: expanded ? 600 : 0 }}>
        <div className="wc-body-inner">
          <p className="wc-def">{w.def || "No local definition yet — open the dictionary entry to read it in full."}</p>

          {localAI && (
            <div className="ai-block">
              <div className="ai-label"><Icon name="sparkle" size={14} /> In plain English</div>
              <p>{localAI}</p>
            </div>
          )}

          <div className="wc-tools">
            <button className="ghost-btn" onClick={runAI} disabled={aiBusy}>
              <Icon name="sparkle" size={15} />
              {aiBusy ? "Thinking…" : (localAI ? "Explain again" : "Explain simply")}
            </button>
            <button className="ghost-btn" onClick={() => onOpenReader(w)}>
              <Icon name="book" size={15} /> Open dictionary
            </button>
            <a className="ghost-btn" href={w.url} target="_blank" rel="noopener noreferrer">
              <Icon name="external" size={15} /> New tab
            </a>
          </div>
        </div>
      </div>
    </article>
  );
}

// Slide-over reader. Oxford usually refuses to be framed, so we race a load
// signal against a timeout and reveal a graceful fallback if nothing arrives.
function ReaderPanel({ entry, onClose }) {
  const [state, setState] = React.useState("loading"); // loading | ok | blocked
  const tRef = React.useRef(null);

  React.useEffect(() => {
    if (!entry) return;
    setState("loading");
    tRef.current = setTimeout(() => setState((s) => (s === "ok" ? "ok" : "blocked")), 3500);
    return () => clearTimeout(tRef.current);
  }, [entry]);

  if (!entry) return null;

  return (
    <>
      <div className="reader-scrim" onClick={onClose} />
      <aside className="reader-panel" role="dialog" aria-label="Dictionary entry">
        <header className="reader-head">
          <div>
            <div className="reader-word">{entry.word}</div>
            <div className="reader-sub">{entry.pos} · oxfordlearnersdictionaries.com</div>
          </div>
          <div className="reader-head-actions">
            <AudioButton word={entry.word} audio={entry.audio} size={40} />
            <a className="icon-btn" href={entry.url} target="_blank" rel="noopener noreferrer" title="Open in new tab">
              <Icon name="external" size={18} />
            </a>
            <button className="icon-btn" onClick={onClose} title="Close"><Icon name="close" size={18} /></button>
          </div>
        </header>

        <div className="reader-stage">
          <iframe
            title="Oxford entry"
            src={entry.url}
            className="reader-frame"
            onLoad={() => { try { /* same-origin read would throw; presence is enough */ setState("ok"); } catch (e) {} }}
          />
          {state !== "ok" && (
            <div className={"reader-fallback" + (state === "blocked" ? " show" : "")}>
              <div className="rf-inner">
                <Icon name="book" size={30} />
                <p className="rf-title">
                  {state === "loading" ? "Loading the entry…" : "This dictionary won't open inside the app"}
                </p>
                {state === "blocked" && (
                  <p className="rf-note">Oxford blocks embedding. Open the full entry — with audio and examples — in a new tab.</p>
                )}
                {state === "blocked" && (
                  <a className="solid-btn" href={entry.url} target="_blank" rel="noopener noreferrer">
                    <Icon name="external" size={16} /> Open full entry
                  </a>
                )}
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

Object.assign(window, { WordCard, ReaderPanel });
