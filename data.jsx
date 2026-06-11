/* data.jsx — seed corpus, CSV parsing, storage helpers. Exports to window. */

// CEFR ordering + warm "difficulty heat" palette (green -> amber -> deep red)
const CEFR_ORDER = ["a1", "a2", "b1", "b2", "c1", "c2"];
const CEFR_META = {
  a1: { color: "#4f9a6a", label: "A1" },
  a2: { color: "#6f9c45", label: "A2" },
  b1: { color: "#c39a3b", label: "B1" },
  b2: { color: "#c47a35", label: "B2" },
  c1: { color: "#b1542f", label: "C1" },
  c2: { color: "#8f2f2a", label: "C2" },
};

const OXFORD = "https://www.oxfordlearnersdictionaries.com/definition/english/";

// id helper: a word can repeat across parts of speech, so key on word+pos+def
function wordId(w) {
  return (w.word + "|" + w.pos + "|" + (w.def || "")).toLowerCase();
}

// The 8 the user supplied carry real audio; the rest fall back to speech synthesis.
const SEED = [
  { word: "abandon", level: "b2", pos: "verb",
    def: "To leave somebody, especially somebody you are responsible for, with no intention of returning.",
    url: OXFORD + "abandon_1",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg" },
  { word: "ability", level: "a2", pos: "noun",
    def: "The fact that somebody is able to do something; the level of skill that somebody has in doing something.",
    url: OXFORD + "ability_1",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abi/abili/ability__us_4.ogg" },
  { word: "able", level: "a2", pos: "adjective",
    def: "Having the skill, intelligence, opportunity, etc. needed to do something.",
    url: OXFORD + "able_1",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abl/able_/able__us_2.ogg" },
  { word: "abolish", level: "c1", pos: "verb",
    def: "To officially end a law, a system or an institution.",
    url: OXFORD + "abolish",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/aboli/abolish__us_1.ogg" },
  { word: "abortion", level: "c1", pos: "noun",
    def: "The deliberate ending of a pregnancy at an early stage.",
    url: OXFORD + "abortion",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/abort/abortion__us_1.ogg" },
  { word: "about", level: "a1", pos: "adverb",
    def: "A little more or less than; approximately.",
    url: OXFORD + "about_2",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg" },
  { word: "about", level: "a1", pos: "preposition",
    def: "On the subject of somebody/something; in connection with somebody/something.",
    url: OXFORD + "about_1",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg" },
  { word: "above", level: "a1", pos: "adverb",
    def: "At or to a higher place or position than something else.",
    url: OXFORD + "above_2",
    audio: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/above/above__us_2.ogg" },

  // —— extra corpus (speech-synthesis pronunciation; links follow Oxford's pattern) ——
  { word: "absurd", level: "b2", pos: "adjective", def: "Completely ridiculous; not logical and sensible." },
  { word: "abundant", level: "c1", pos: "adjective", def: "Existing in large quantities; more than enough." },
  { word: "accent", level: "b1", pos: "noun", def: "A way of pronouncing the words of a language that shows which country or area a person comes from." },
  { word: "accomplish", level: "b2", pos: "verb", def: "To succeed in doing or completing something." },
  { word: "accurate", level: "b1", pos: "adjective", def: "Correct and true in every detail." },
  { word: "acknowledge", level: "b2", pos: "verb", def: "To accept that something is true." },
  { word: "adapt", level: "b1", pos: "verb", def: "To change your behaviour in order to deal more successfully with a new situation." },
  { word: "adequate", level: "b2", pos: "adjective", def: "Enough in quantity, or good enough in quality, for a particular purpose." },
  { word: "advocate", level: "c1", pos: "verb", def: "To support something publicly; to recommend it." },
  { word: "ambiguous", level: "c1", pos: "adjective", def: "That can be understood in more than one way; not clear." },
  { word: "ample", level: "c1", pos: "adjective", def: "Enough or more than enough." },
  { word: "analyse", level: "b2", pos: "verb", def: "To examine the nature or structure of something by separating it into parts." },
  { word: "anticipate", level: "b2", pos: "verb", def: "To expect something to happen and be ready for it." },
  { word: "apparent", level: "b2", pos: "adjective", def: "Easy to see or understand; obvious." },
  { word: "arbitrary", level: "c1", pos: "adjective", def: "Based on chance or personal opinion rather than reason." },
  { word: "assess", level: "b2", pos: "verb", def: "To make a judgement about the nature or quality of somebody/something." },
  { word: "attribute", level: "c1", pos: "verb", def: "To say or believe that something is caused by a particular thing." },
  { word: "benefit", level: "a2", pos: "noun", def: "An advantage that something gives you; a helpful and useful effect." },
  { word: "brief", level: "b1", pos: "adjective", def: "Lasting only a short time; using few words." },
  { word: "candid", level: "c1", pos: "adjective", def: "Honest and direct in what you say." },
  { word: "cease", level: "c1", pos: "verb", def: "To stop happening or existing." },
  { word: "coherent", level: "c1", pos: "adjective", def: "Logical and well organized; easy to understand and clear." },
  { word: "commit", level: "b1", pos: "verb", def: "To promise sincerely that you will definitely do something." },
  { word: "compel", level: "c1", pos: "verb", def: "To force somebody to do something." },
  { word: "consequence", level: "b1", pos: "noun", def: "A result of something that has happened." },
  { word: "deliberate", level: "b2", pos: "adjective", def: "Done on purpose rather than by accident." },
  { word: "diminish", level: "c1", pos: "verb", def: "To become or to make something become smaller, weaker, etc." },
  { word: "elaborate", level: "c1", pos: "adjective", def: "Very complicated and detailed; carefully prepared and organized." },
  { word: "essential", level: "a2", pos: "adjective", def: "Completely necessary; extremely important in a particular situation." },
  { word: "fluctuate", level: "c1", pos: "verb", def: "To change frequently in size, amount or quality." },
  { word: "fragile", level: "b2", pos: "adjective", def: "Easily broken or damaged." },
  { word: "genuine", level: "b2", pos: "adjective", def: "Real; exactly what it appears to be." },
  { word: "hinder", level: "c1", pos: "verb", def: "To make it difficult for somebody to do something or for something to happen." },
  { word: "inevitable", level: "b2", pos: "adjective", def: "That you cannot avoid or prevent." },
  { word: "intricate", level: "c1", pos: "adjective", def: "Having a lot of different parts and small details that fit together." },
  { word: "notion", level: "b2", pos: "noun", def: "An idea, a belief or an understanding of something." },
  { word: "obscure", level: "c1", pos: "adjective", def: "Not well known; not easy to understand." },
  { word: "persist", level: "b2", pos: "verb", def: "To continue to do something despite difficulties or opposition." },
  { word: "profound", level: "c1", pos: "adjective", def: "Very great; felt or experienced very strongly." },
  { word: "reluctant", level: "b2", pos: "adjective", def: "Hesitating before doing something because you do not want to do it." },
  { word: "scarce", level: "b2", pos: "adjective", def: "Not enough; not easy to find or get." },
  { word: "subtle", level: "c1", pos: "adjective", def: "Not very noticeable or obvious; clever and indirect." },
  { word: "tedious", level: "b2", pos: "adjective", def: "Lasting or seeming to last a long time and boring." },
  { word: "vivid", level: "b1", pos: "adjective", def: "Producing very clear pictures in your mind; bright and strong." },
];

// give every seed a stable url if missing
SEED.forEach((w) => { if (!w.url) w.url = OXFORD + w.word; if (!w.audio) w.audio = ""; });

/* ---------- CSV parsing ---------- */
// Expected columns: word, level, pos, definitionURL, audioURL
function parseCSV(text) {
  const rows = [];
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length);
  for (const line of lines) {
    // simple split (the Oxford export has no quoted commas)
    const parts = line.split(",").map((s) => s.trim());
    if (parts.length < 3) continue;
    const [word, level, pos, url, audio] = parts;
    if (!word || /^word$/i.test(word)) continue; // skip header
    const lvl = (level || "").toLowerCase();
    rows.push({
      word: word,
      level: CEFR_ORDER.includes(lvl) ? lvl : "b1",
      pos: pos || "—",
      url: url || (OXFORD + word),
      audio: audio || "",
      def: "",
    });
  }
  return rows;
}

/* ---------- storage ---------- */
const LS = {
  words: "dict.words.v1",
  collect: "dict.collect.v1", // { id: count }
  aiCache: "dict.ai.v1",      // { id: "eli5 text" }
};
function load(key, fallback) {
  try { const v = JSON.parse(localStorage.getItem(key)); return v == null ? fallback : v; }
  catch (e) { return fallback; }
}
function save(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); } catch (e) {}
}

Object.assign(window, {
  CEFR_ORDER, CEFR_META, OXFORD, SEED, parseCSV, wordId, LS, load, save,
});
