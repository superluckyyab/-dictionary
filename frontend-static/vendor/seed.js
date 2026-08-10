/* global window */
// Build a best-guess Oxford US audio .ogg URL following their path pattern.
// e.g. abandon -> a/aba/aband/abandon__us_1.ogg  (able -> a/abl/able_/able__us_2)
function buildAudio(word, n = 1) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  const seg = len => (w.slice(0, len) + "_____").slice(0, len);
  return "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/" + w[0] + "/" + seg(3) + "/" + seg(5) + "/" + w + "__us_" + n + ".ogg";
}
function defUrl(word, suffix) {
  return "https://www.oxfordlearnersdictionaries.com/definition/english/" + word.toLowerCase().replace(/[^a-z]/g, "") + (suffix || "");
}

// id, word, level, pos, def (English-English), defUrl, audioUrl
// The first 8 use the exact URLs supplied; the rest are reconstructed.
window.SEED_WORDS = [{
  word: "abandon",
  level: "B2",
  pos: "verb",
  def: "To leave somebody, especially somebody you are responsible for, with no intention of returning.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/abandon_1",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/aba/aband/abandon__us_2.ogg"
}, {
  word: "ability",
  level: "A2",
  pos: "noun",
  def: "The fact that somebody or something is able to do something.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/ability_1",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abi/abili/ability__us_4.ogg"
}, {
  word: "able",
  level: "A2",
  pos: "adjective",
  def: "Having the skill, strength, time, knowledge, etc. needed to do something.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/able_1",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abl/able_/able__us_2.ogg"
}, {
  word: "abolish",
  level: "C1",
  pos: "verb",
  def: "To officially end a law, a system or an institution.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/abolish",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/aboli/abolish__us_1.ogg"
}, {
  word: "abortion",
  level: "C1",
  pos: "noun",
  def: "The deliberate ending of a pregnancy at an early stage.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/abortion",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/abort/abortion__us_1.ogg"
}, {
  word: "about",
  level: "A1",
  pos: "adverb",
  def: "A little more or less than a particular number, amount, etc.; approximately.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/about_2",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg"
}, {
  word: "about",
  level: "A1",
  pos: "preposition",
  def: "On the subject of somebody or something; in connection with somebody or something.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/about_1",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/about/about__us_1.ogg"
}, {
  word: "above",
  level: "A1",
  pos: "adverb",
  def: "At or to a higher place or position than something else.",
  defUrl: "https://www.oxfordlearnersdictionaries.com/definition/english/above_2",
  audioUrl: "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/a/abo/above/above__us_2.ogg"
}, {
  word: "accept",
  level: "A2",
  pos: "verb",
  def: "To agree to take something that is offered or given.",
  defUrl: defUrl("accept"),
  audioUrl: buildAudio("accept")
}, {
  word: "access",
  level: "B1",
  pos: "noun",
  def: "The opportunity or right to use something or to see somebody or something.",
  defUrl: defUrl("access_1"),
  audioUrl: buildAudio("access")
}, {
  word: "accident",
  level: "A2",
  pos: "noun",
  def: "An unpleasant event that happens unexpectedly and causes injury or damage.",
  defUrl: defUrl("accident"),
  audioUrl: buildAudio("accident")
}, {
  word: "accommodate",
  level: "C1",
  pos: "verb",
  def: "To provide somebody with a place to live or stay, or with the space they need.",
  defUrl: defUrl("accommodate"),
  audioUrl: buildAudio("accommodate")
}, {
  word: "achieve",
  level: "B1",
  pos: "verb",
  def: "To succeed in reaching a particular goal by effort, skill or courage.",
  defUrl: defUrl("achieve"),
  audioUrl: buildAudio("achieve")
}, {
  word: "acid",
  level: "B2",
  pos: "noun",
  def: "A chemical, usually a liquid, that contains hydrogen and can dissolve some metals.",
  defUrl: defUrl("acid_1"),
  audioUrl: buildAudio("acid")
}, {
  word: "across",
  level: "A1",
  pos: "preposition",
  def: "From one side to the other side of something.",
  defUrl: defUrl("across"),
  audioUrl: buildAudio("across")
}, {
  word: "active",
  level: "A2",
  pos: "adjective",
  def: "Always busy doing things, especially physical activities.",
  defUrl: defUrl("active_1"),
  audioUrl: buildAudio("active")
}, {
  word: "actual",
  level: "B1",
  pos: "adjective",
  def: "Used to emphasize that something is real or exact rather than imagined or guessed.",
  defUrl: defUrl("actual"),
  audioUrl: buildAudio("actual")
}, {
  word: "adapt",
  level: "B2",
  pos: "verb",
  def: "To change your behaviour in order to deal more successfully with a new situation.",
  defUrl: defUrl("adapt"),
  audioUrl: buildAudio("adapt")
}, {
  word: "address",
  level: "A1",
  pos: "noun",
  def: "The details of where somebody lives or works and where letters can be sent.",
  defUrl: defUrl("address_1"),
  audioUrl: buildAudio("address")
}, {
  word: "admire",
  level: "B1",
  pos: "verb",
  def: "To respect somebody for what they are or for what they have done.",
  defUrl: defUrl("admire"),
  audioUrl: buildAudio("admire")
}, {
  word: "adult",
  level: "A2",
  pos: "noun",
  def: "A fully grown person who is legally responsible for their actions.",
  defUrl: defUrl("adult_1"),
  audioUrl: buildAudio("adult")
}, {
  word: "advantage",
  level: "A2",
  pos: "noun",
  def: "Something that helps you to be better or more successful than other people.",
  defUrl: defUrl("advantage_1"),
  audioUrl: buildAudio("advantage")
}, {
  word: "adventure",
  level: "A2",
  pos: "noun",
  def: "An unusual, exciting or dangerous experience or journey.",
  defUrl: defUrl("adventure"),
  audioUrl: buildAudio("adventure")
}, {
  word: "advice",
  level: "A1",
  pos: "noun",
  def: "An opinion or suggestion about what somebody should do in a situation.",
  defUrl: defUrl("advice"),
  audioUrl: buildAudio("advice")
}, {
  word: "afford",
  level: "A2",
  pos: "verb",
  def: "To have enough money or time to be able to buy or to do something.",
  defUrl: defUrl("afford"),
  audioUrl: buildAudio("afford")
}, {
  word: "afraid",
  level: "A1",
  pos: "adjective",
  def: "Feeling fear; frightened because you think you might be hurt or harmed.",
  defUrl: defUrl("afraid"),
  audioUrl: buildAudio("afraid")
}, {
  word: "against",
  level: "A2",
  pos: "preposition",
  def: "Opposed to or in disagreement with somebody or something.",
  defUrl: defUrl("against"),
  audioUrl: buildAudio("against")
}, {
  word: "agency",
  level: "B2",
  pos: "noun",
  def: "A business that provides a particular service for people or organizations.",
  defUrl: defUrl("agency"),
  audioUrl: buildAudio("agency")
}, {
  word: "agenda",
  level: "B2",
  pos: "noun",
  def: "A list of items to be discussed at a meeting.",
  defUrl: defUrl("agenda"),
  audioUrl: buildAudio("agenda")
}, {
  word: "aggressive",
  level: "B2",
  pos: "adjective",
  def: "Behaving in an angry, threatening way, as if wanting to attack somebody.",
  defUrl: defUrl("aggressive"),
  audioUrl: buildAudio("aggressive")
}, {
  word: "agree",
  level: "A1",
  pos: "verb",
  def: "To have the same opinion as somebody; to say yes to a suggestion or request.",
  defUrl: defUrl("agree"),
  audioUrl: buildAudio("agree")
}, {
  word: "ahead",
  level: "B1",
  pos: "adverb",
  def: "Further forward in space or time; in front of somebody or something.",
  defUrl: defUrl("ahead"),
  audioUrl: buildAudio("ahead")
}, {
  word: "aim",
  level: "B1",
  pos: "noun",
  def: "The purpose of doing something; what somebody is trying to achieve.",
  defUrl: defUrl("aim_1"),
  audioUrl: buildAudio("aim")
}, {
  word: "alarm",
  level: "A2",
  pos: "noun",
  def: "A warning of danger, or a device that gives such a warning.",
  defUrl: defUrl("alarm_1"),
  audioUrl: buildAudio("alarm")
}, {
  word: "alcohol",
  level: "A2",
  pos: "noun",
  def: "Drinks such as beer or wine that can make people drunk.",
  defUrl: defUrl("alcohol"),
  audioUrl: buildAudio("alcohol")
}, {
  word: "alive",
  level: "A2",
  pos: "adjective",
  def: "Living; not dead.",
  defUrl: defUrl("alive"),
  audioUrl: buildAudio("alive")
}, {
  word: "ambiguous",
  level: "C1",
  pos: "adjective",
  def: "Having more than one possible meaning, so it is not clear which is intended.",
  defUrl: defUrl("ambiguous"),
  audioUrl: buildAudio("ambiguous")
}, {
  word: "anticipate",
  level: "C1",
  pos: "verb",
  def: "To expect something to happen and be ready for it in advance.",
  defUrl: defUrl("anticipate"),
  audioUrl: buildAudio("anticipate")
}, {
  word: "benevolent",
  level: "C2",
  pos: "adjective",
  def: "Kind, helpful and generous towards other people.",
  defUrl: defUrl("benevolent"),
  audioUrl: buildAudio("benevolent")
}, {
  word: "candid",
  level: "C1",
  pos: "adjective",
  def: "Saying what you think openly and honestly; not hiding your thoughts.",
  defUrl: defUrl("candid"),
  audioUrl: buildAudio("candid")
}, {
  word: "diligent",
  level: "C1",
  pos: "adjective",
  def: "Showing care and effort in your work or duties.",
  defUrl: defUrl("diligent"),
  audioUrl: buildAudio("diligent")
}, {
  word: "eloquent",
  level: "C2",
  pos: "adjective",
  def: "Able to use language and express your opinions well, especially in speaking.",
  defUrl: defUrl("eloquent"),
  audioUrl: buildAudio("eloquent")
}, {
  word: "meticulous",
  level: "C2",
  pos: "adjective",
  def: "Paying careful attention to every small detail.",
  defUrl: defUrl("meticulous"),
  audioUrl: buildAudio("meticulous")
}, {
  word: "resilient",
  level: "C1",
  pos: "adjective",
  def: "Able to recover quickly after something difficult or unpleasant.",
  defUrl: defUrl("resilient"),
  audioUrl: buildAudio("resilient")
}, {
  word: "ubiquitous",
  level: "C2",
  pos: "adjective",
  def: "Seeming to be present, appearing, or found everywhere.",
  defUrl: defUrl("ubiquitous"),
  audioUrl: buildAudio("ubiquitous")
}].map((w, i) => ({
  id: "seed-" + i,
  ...w
}));
