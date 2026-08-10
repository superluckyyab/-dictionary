/* components.jsx — atomic UI: icons, level tag, audio + collect buttons. */

const Icon = ({ name, size = 20, stroke = 1.6 }) => {
  const common = { width: size, height: size, viewBox: "0 0 24 24", fill: "none",
    stroke: "currentColor", strokeWidth: stroke, strokeLinecap: "round", strokeLinejoin: "round" };
  const paths = {
    speaker: <><path d="M11 5 6 9H2v6h4l5 4z" /><path d="M15.5 8.5a5 5 0 0 1 0 7" /><path d="M18.5 5.5a9 9 0 0 1 0 13" /></>,
    bookmark: <path d="M6 3h12v18l-6-4-6 4z" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="m21 21-4.3-4.3" /></>,
    plus: <><path d="M12 5v14" /><path d="M5 12h14" /></>,
    upload: <><path d="M12 16V4" /><path d="m7 9 5-5 5 5" /><path d="M5 20h14" /></>,
    chevron: <path d="m6 9 6 6 6-6" />,
    external: <><path d="M14 4h6v6" /><path d="M20 4 10 14" /><path d="M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" /></>,
    sparkle: <path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8z" />,
    book: <><path d="M4 5a2 2 0 0 1 2-2h12v18H6a2 2 0 0 0-2 2z" /><path d="M4 19a2 2 0 0 1 2-2h12" /></>,
    close: <><path d="M6 6l12 12" /><path d="M18 6 6 18" /></>,
    trash: <><path d="M4 7h16" /><path d="M9 7V4h6v3" /><path d="M6 7l1 13h10l1-13" /></>,
    play: <path d="M7 4v16l13-8z" />,
  };
  return <svg {...common}>{paths[name]}</svg>;
};

const LevelTag = ({ level, big }) => {
  const m = CEFR_META[level] || { color: "#888", label: (level || "?").toUpperCase() };
  return (
    <span className="level-tag" style={{
      color: m.color,
      borderColor: m.color,
      fontSize: big ? 13 : 11,
      padding: big ? "3px 9px" : "2px 7px",
    }}>{m.label}</span>
  );
};

// Plays the .ogg if present; otherwise pronounces via Web Speech API so the
// button is never dead. Shows a tiny pulsing state while sounding.
function AudioButton({ word, audio, size = 38 }) {
  const [busy, setBusy] = React.useState(false);
  const ref = React.useRef(null);

  const speak = () => {
    try {
      window.speechSynthesis.cancel();
      const u = new SpeechSynthesisUtterance(word);
      u.lang = "en-US"; u.rate = 0.92;
      u.onend = () => setBusy(false);
      window.speechSynthesis.speak(u);
    } catch (e) { setBusy(false); }
  };

  const onClick = (e) => {
    e.stopPropagation();
    setBusy(true);
    if (audio) {
      try {
        if (!ref.current) ref.current = new Audio(audio);
        ref.current.currentTime = 0;
        const p = ref.current.play();
        ref.current.onended = () => setBusy(false);
        if (p && p.catch) p.catch(() => speak()); // .ogg blocked (Safari) -> speak
      } catch (e) { speak(); }
    } else {
      speak();
    }
  };

  return (
    <button className={"icon-btn audio" + (busy ? " busy" : "")} onClick={onClick}
      title="Pronounce" aria-label="Pronounce" style={{ width: size, height: size }}>
      <Icon name="speaker" size={size * 0.5} />
    </button>
  );
}

// Collect = bookmark again and again. Count is the "unfamiliarity" score.
function CollectButton({ count, onCollect, onUncollect }) {
  const active = count > 0;
  return (
    <div className="collect-wrap">
      <button className={"icon-btn collect" + (active ? " active" : "")}
        onClick={(e) => { e.stopPropagation(); onCollect(); }}
        title={active ? "Collect again (still unfamiliar)" : "Add to review"}>
        <Icon name="bookmark" size={19} />
        {active && <span className="collect-count">{count}</span>}
      </button>
      {active && (
        <button className="uncollect" onClick={(e) => { e.stopPropagation(); onUncollect(); }}
          title="Remove one">−</button>
      )}
    </div>
  );
}

Object.assign(window, { Icon, LevelTag, AudioButton, CollectButton });
