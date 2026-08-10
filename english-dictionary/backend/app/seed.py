import json
import sys
import os

sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

OXFORD = "https://www.oxfordlearnersdictionaries.com/definition/english/"
AUDIO_BASE = "https://www.oxfordlearnersdictionaries.com/media/english/us_pron_ogg/"


def build_audio(word, n=1):
    w = word.lower().replace("-", "").replace(" ", "")
    seg = lambda l: (w[:l] + "_____")[:l]
    return AUDIO_BASE + w[0] + "/" + seg(3) + "/" + seg(5) + "/" + w + "__us_" + str(n) + ".ogg"


def def_url(word, suffix=""):
    return OXFORD + word.lower().replace(" ", "-") + suffix


SEED_WORDS = [
    {"word": "abandon", "level": "B2", "pos": "verb", "def": "To leave somebody, especially somebody you are responsible for, with no intention of returning.", "defUrl": OXFORD + "abandon_1", "audioUrl": AUDIO_BASE + "a/aba/aband/abandon__us_2.ogg"},
    {"word": "ability", "level": "A2", "pos": "noun", "def": "The fact that somebody or something is able to do something.", "defUrl": OXFORD + "ability_1", "audioUrl": AUDIO_BASE + "a/abi/abili/ability__us_4.ogg"},
    {"word": "able", "level": "A2", "pos": "adjective", "def": "Having the skill, strength, time, knowledge, etc. needed to do something.", "defUrl": OXFORD + "able_1", "audioUrl": AUDIO_BASE + "a/abl/able_/able__us_2.ogg"},
    {"word": "abolish", "level": "C1", "pos": "verb", "def": "To officially end a law, a system or an institution.", "defUrl": def_url("abolish"), "audioUrl": build_audio("abolish")},
    {"word": "abortion", "level": "C1", "pos": "noun", "def": "The deliberate ending of a pregnancy at an early stage.", "defUrl": def_url("abortion"), "audioUrl": build_audio("abortion")},
    {"word": "about", "level": "A1", "pos": "adverb", "def": "A little more or less than a particular number, amount, etc.; approximately.", "defUrl": OXFORD + "about_2", "audioUrl": AUDIO_BASE + "a/abo/about/about__us_1.ogg"},
    {"word": "about", "level": "A1", "pos": "preposition", "def": "On the subject of somebody or something; in connection with somebody or something.", "defUrl": OXFORD + "about_1", "audioUrl": AUDIO_BASE + "a/abo/about/about__us_1.ogg"},
    {"word": "above", "level": "A1", "pos": "adverb", "def": "At or to a higher place or position than something else.", "defUrl": OXFORD + "above_2", "audioUrl": AUDIO_BASE + "a/abo/above/above__us_2.ogg"},
    {"word": "accept", "level": "A2", "pos": "verb", "def": "To agree to take something that is offered or given.", "defUrl": def_url("accept"), "audioUrl": build_audio("accept")},
    {"word": "access", "level": "B1", "pos": "noun", "def": "The opportunity or right to use something or to see somebody or something.", "defUrl": def_url("access", "_1"), "audioUrl": build_audio("access")},
    {"word": "accident", "level": "A2", "pos": "noun", "def": "An unpleasant event that happens unexpectedly and causes injury or damage.", "defUrl": def_url("accident"), "audioUrl": build_audio("accident")},
    {"word": "accommodate", "level": "C1", "pos": "verb", "def": "To provide somebody with a place to live or stay, or with the space they need.", "defUrl": def_url("accommodate"), "audioUrl": build_audio("accommodate")},
    {"word": "achieve", "level": "B1", "pos": "verb", "def": "To succeed in reaching a particular goal by effort, skill or courage.", "defUrl": def_url("achieve"), "audioUrl": build_audio("achieve")},
    {"word": "acid", "level": "B2", "pos": "noun", "def": "A chemical, usually a liquid, that contains hydrogen and can dissolve some metals.", "defUrl": def_url("acid", "_1"), "audioUrl": build_audio("acid")},
    {"word": "across", "level": "A1", "pos": "preposition", "def": "From one side to the other side of something.", "defUrl": def_url("across"), "audioUrl": build_audio("across")},
    {"word": "active", "level": "A2", "pos": "adjective", "def": "Always busy doing things, especially physical activities.", "defUrl": def_url("active", "_1"), "audioUrl": build_audio("active")},
    {"word": "actual", "level": "B1", "pos": "adjective", "def": "Used to emphasize that something is real or exact rather than imagined or guessed.", "defUrl": def_url("actual"), "audioUrl": build_audio("actual")},
    {"word": "adapt", "level": "B2", "pos": "verb", "def": "To change your behaviour in order to deal more successfully with a new situation.", "defUrl": def_url("adapt"), "audioUrl": build_audio("adapt")},
    {"word": "address", "level": "A1", "pos": "noun", "def": "The details of where somebody lives or works and where letters can be sent.", "defUrl": def_url("address", "_1"), "audioUrl": build_audio("address")},
    {"word": "admire", "level": "B1", "pos": "verb", "def": "To respect somebody for what they are or for what they have done.", "defUrl": def_url("admire"), "audioUrl": build_audio("admire")},
    {"word": "adult", "level": "A2", "pos": "noun", "def": "A fully grown person who is legally responsible for their actions.", "defUrl": def_url("adult", "_1"), "audioUrl": build_audio("adult")},
    {"word": "advantage", "level": "A2", "pos": "noun", "def": "Something that helps you to be better or more successful than other people.", "defUrl": def_url("advantage", "_1"), "audioUrl": build_audio("advantage")},
    {"word": "adventure", "level": "A2", "pos": "noun", "def": "An unusual, exciting or dangerous experience or journey.", "defUrl": def_url("adventure"), "audioUrl": build_audio("adventure")},
    {"word": "advice", "level": "A1", "pos": "noun", "def": "An opinion or suggestion about what somebody should do in a situation.", "defUrl": def_url("advice"), "audioUrl": build_audio("advice")},
    {"word": "afford", "level": "A2", "pos": "verb", "def": "To have enough money or time to be able to buy or to do something.", "defUrl": def_url("afford"), "audioUrl": build_audio("afford")},
    {"word": "afraid", "level": "A1", "pos": "adjective", "def": "Feeling fear; frightened because you think you might be hurt or harmed.", "defUrl": def_url("afraid"), "audioUrl": build_audio("afraid")},
    {"word": "against", "level": "A2", "pos": "preposition", "def": "Opposed to or in disagreement with somebody or something.", "defUrl": def_url("against"), "audioUrl": build_audio("against")},
    {"word": "agency", "level": "B2", "pos": "noun", "def": "A business that provides a particular service for people or organizations.", "defUrl": def_url("agency"), "audioUrl": build_audio("agency")},
    {"word": "agenda", "level": "B2", "pos": "noun", "def": "A list of items to be discussed at a meeting.", "defUrl": def_url("agenda"), "audioUrl": build_audio("agenda")},
    {"word": "aggressive", "level": "B2", "pos": "adjective", "def": "Behaving in an angry, threatening way, as if wanting to attack somebody.", "defUrl": def_url("aggressive"), "audioUrl": build_audio("aggressive")},
    {"word": "agree", "level": "A1", "pos": "verb", "def": "To have the same opinion as somebody; to say yes to a suggestion or request.", "defUrl": def_url("agree"), "audioUrl": build_audio("agree")},
    {"word": "ahead", "level": "B1", "pos": "adverb", "def": "Further forward in space or time; in front of somebody or something.", "defUrl": def_url("ahead"), "audioUrl": build_audio("ahead")},
    {"word": "aim", "level": "B1", "pos": "noun", "def": "The purpose of doing something; what somebody is trying to achieve.", "defUrl": def_url("aim", "_1"), "audioUrl": build_audio("aim")},
    {"word": "alarm", "level": "A2", "pos": "noun", "def": "A warning of danger, or a device that gives such a warning.", "defUrl": def_url("alarm", "_1"), "audioUrl": build_audio("alarm")},
    {"word": "alcohol", "level": "A2", "pos": "noun", "def": "Drinks such as beer or wine that can make people drunk.", "defUrl": def_url("alcohol"), "audioUrl": build_audio("alcohol")},
    {"word": "alive", "level": "A2", "pos": "adjective", "def": "Living; not dead.", "defUrl": def_url("alive"), "audioUrl": build_audio("alive")},
    {"word": "ambiguous", "level": "C1", "pos": "adjective", "def": "Having more than one possible meaning, so it is not clear which is intended.", "defUrl": def_url("ambiguous"), "audioUrl": build_audio("ambiguous")},
    {"word": "anticipate", "level": "C1", "pos": "verb", "def": "To expect something to happen and be ready for it in advance.", "defUrl": def_url("anticipate"), "audioUrl": build_audio("anticipate")},
    {"word": "benevolent", "level": "C2", "pos": "adjective", "def": "Kind, helpful and generous towards other people.", "defUrl": def_url("benevolent"), "audioUrl": build_audio("benevolent")},
    {"word": "candid", "level": "C1", "pos": "adjective", "def": "Saying what you think openly and honestly; not hiding your thoughts.", "defUrl": def_url("candid"), "audioUrl": build_audio("candid")},
    {"word": "capacity", "level": "B2", "pos": "noun", "def": "The maximum amount that something can contain or produce.", "defUrl": def_url("capacity"), "audioUrl": build_audio("capacity")},
    {"word": "challenge", "level": "B1", "pos": "noun", "def": "A new or difficult task that tests somebody's ability and skill.", "defUrl": def_url("challenge"), "audioUrl": build_audio("challenge")},
    {"word": "character", "level": "B1", "pos": "noun", "def": "All the qualities and features that make a person, organization or place different from others.", "defUrl": def_url("character"), "audioUrl": build_audio("character")},
    {"word": "claim", "level": "B1", "pos": "verb", "def": "To say that something is true although it has not been proved and other people may not believe it.", "defUrl": def_url("claim", "_1"), "audioUrl": build_audio("claim")},
    {"word": "colleague", "level": "B1", "pos": "noun", "def": "A person that you work with, especially in a profession or a business.", "defUrl": def_url("colleague"), "audioUrl": build_audio("colleague")},
    {"word": "complex", "level": "B2", "pos": "adjective", "def": "Made of many different things or parts that are connected; difficult to understand.", "defUrl": def_url("complex", "_1"), "audioUrl": build_audio("complex")},
    {"word": "confident", "level": "B1", "pos": "adjective", "def": "Feeling sure about your own ability to do things and be successful.", "defUrl": def_url("confident"), "audioUrl": build_audio("confident")},
    {"word": "consider", "level": "B1", "pos": "verb", "def": "To think about something carefully, especially before making a decision.", "defUrl": def_url("consider"), "audioUrl": build_audio("consider")},
    {"word": "controversial", "level": "C1", "pos": "adjective", "def": "Causing a lot of angry public discussion and disagreement.", "defUrl": def_url("controversial"), "audioUrl": build_audio("controversial")},
    {"word": "convince", "level": "B1", "pos": "verb", "def": "To make somebody believe that something is true.", "defUrl": def_url("convince"), "audioUrl": build_audio("convince")},
    {"word": "create", "level": "A2", "pos": "verb", "def": "To make something happen or exist.", "defUrl": def_url("create"), "audioUrl": build_audio("create")},
    {"word": "culture", "level": "B1", "pos": "noun", "def": "The customs and beliefs, art, way of life and social organization of a particular country or group.", "defUrl": def_url("culture"), "audioUrl": build_audio("culture")},
    {"word": "decision", "level": "A2", "pos": "noun", "def": "A choice or judgement that you make after thinking and talking about what is the best thing to do.", "defUrl": def_url("decision"), "audioUrl": build_audio("decision")},
    {"word": "describe", "level": "A2", "pos": "verb", "def": "To say what somebody or something is like.", "defUrl": def_url("describe"), "audioUrl": build_audio("describe")},
    {"word": "develop", "level": "A2", "pos": "verb", "def": "To gradually grow or become more advanced; to make something do this.", "defUrl": def_url("develop"), "audioUrl": build_audio("develop")},
    {"word": "diligent", "level": "C1", "pos": "adjective", "def": "Showing care and effort in your work or duties.", "defUrl": def_url("diligent"), "audioUrl": build_audio("diligent")},
    {"word": "discover", "level": "A2", "pos": "verb", "def": "To be the first person to become aware of, or find, a place, substance, etc.", "defUrl": def_url("discover"), "audioUrl": build_audio("discover")},
    {"word": "diversity", "level": "C1", "pos": "noun", "def": "A range of many people or things that are very different from each other.", "defUrl": def_url("diversity"), "audioUrl": build_audio("diversity")},
    {"word": "eloquent", "level": "C2", "pos": "adjective", "def": "Able to use language and express your opinions well, especially in speaking.", "defUrl": def_url("eloquent"), "audioUrl": build_audio("eloquent")},
    {"word": "emerge", "level": "B2", "pos": "verb", "def": "To come out of a dark, confined or hidden place.", "defUrl": def_url("emerge"), "audioUrl": build_audio("emerge")},
    {"word": "encourage", "level": "B1", "pos": "verb", "def": "To give somebody support, courage or hope.", "defUrl": def_url("encourage"), "audioUrl": build_audio("encourage")},
    {"word": "environment", "level": "A2", "pos": "noun", "def": "The natural world in which people, animals and plants live.", "defUrl": def_url("environment"), "audioUrl": build_audio("environment")},
    {"word": "essential", "level": "B1", "pos": "adjective", "def": "Completely necessary; that you cannot do without.", "defUrl": def_url("essential", "_1"), "audioUrl": build_audio("essential")},
    {"word": "establish", "level": "B2", "pos": "verb", "def": "To start or create an organization, a system, etc. that is meant to last for a long time.", "defUrl": def_url("establish"), "audioUrl": build_audio("establish")},
    {"word": "evidence", "level": "B1", "pos": "noun", "def": "The facts, signs or objects that make you believe that something is true.", "defUrl": def_url("evidence"), "audioUrl": build_audio("evidence")},
    {"word": "examine", "level": "B1", "pos": "verb", "def": "To look at somebody or something carefully, in order to find out something.", "defUrl": def_url("examine"), "audioUrl": build_audio("examine")},
    {"word": "experience", "level": "A2", "pos": "noun", "def": "The knowledge and skill that you have gained through doing something for a period of time.", "defUrl": def_url("experience", "_1"), "audioUrl": build_audio("experience")},
    {"word": "focus", "level": "B1", "pos": "verb", "def": "To give attention, effort, etc. to one particular subject, situation or person rather than another.", "defUrl": def_url("focus", "_1"), "audioUrl": build_audio("focus")},
    {"word": "generate", "level": "B2", "pos": "verb", "def": "To produce or create something.", "defUrl": def_url("generate"), "audioUrl": build_audio("generate")},
    {"word": "global", "level": "B1", "pos": "adjective", "def": "Covering or affecting the whole world.", "defUrl": def_url("global"), "audioUrl": build_audio("global")},
    {"word": "government", "level": "A2", "pos": "noun", "def": "The group of people who are responsible for controlling a country or a state.", "defUrl": def_url("government"), "audioUrl": build_audio("government")},
    {"word": "identify", "level": "B1", "pos": "verb", "def": "To recognize somebody or something and be able to say who or what they are.", "defUrl": def_url("identify"), "audioUrl": build_audio("identify")},
    {"word": "improve", "level": "A2", "pos": "verb", "def": "To become better than before; to make something or somebody better.", "defUrl": def_url("improve"), "audioUrl": build_audio("improve")},
    {"word": "individual", "level": "B1", "pos": "noun", "def": "A person considered separately rather than as part of a group.", "defUrl": def_url("individual", "_1"), "audioUrl": build_audio("individual")},
    {"word": "influence", "level": "B1", "pos": "verb", "def": "To have an effect on the way that somebody behaves or thinks, especially by giving them an example to follow.", "defUrl": def_url("influence", "_1"), "audioUrl": build_audio("influence")},
    {"word": "integrity", "level": "C1", "pos": "noun", "def": "The quality of being honest and having strong moral principles.", "defUrl": def_url("integrity"), "audioUrl": build_audio("integrity")},
    {"word": "investigate", "level": "B2", "pos": "verb", "def": "To carefully examine the facts of a situation, an event, a crime, etc. to find out the truth.", "defUrl": def_url("investigate"), "audioUrl": build_audio("investigate")},
    {"word": "involve", "level": "B1", "pos": "verb", "def": "If a situation, an event or an activity involves something, that thing is an important or necessary part or result of it.", "defUrl": def_url("involve"), "audioUrl": build_audio("involve")},
    {"word": "knowledge", "level": "A2", "pos": "noun", "def": "The information, understanding and skills that you gain through education or experience.", "defUrl": def_url("knowledge"), "audioUrl": build_audio("knowledge")},
    {"word": "maintain", "level": "B2", "pos": "verb", "def": "To make something continue at the same level, standard, etc.", "defUrl": def_url("maintain"), "audioUrl": build_audio("maintain")},
    {"word": "meticulous", "level": "C2", "pos": "adjective", "def": "Paying careful attention to every small detail.", "defUrl": def_url("meticulous"), "audioUrl": build_audio("meticulous")},
    {"word": "opportunity", "level": "A2", "pos": "noun", "def": "A time when a particular situation makes it possible to do or achieve something.", "defUrl": def_url("opportunity"), "audioUrl": build_audio("opportunity")},
    {"word": "organize", "level": "A2", "pos": "verb", "def": "To arrange for something to happen or to prepare for it.", "defUrl": def_url("organize"), "audioUrl": build_audio("organize")},
    {"word": "perspective", "level": "C1", "pos": "noun", "def": "A particular attitude towards something; a way of thinking about something.", "defUrl": def_url("perspective"), "audioUrl": build_audio("perspective")},
    {"word": "phenomenon", "level": "C1", "pos": "noun", "def": "A fact or an event in nature or society, especially one that is not fully understood.", "defUrl": def_url("phenomenon"), "audioUrl": build_audio("phenomenon")},
    {"word": "potential", "level": "B2", "pos": "noun", "def": "The qualities that exist and can be developed; the possibility of something happening or being developed.", "defUrl": def_url("potential", "_1"), "audioUrl": build_audio("potential")},
    {"word": "principle", "level": "B1", "pos": "noun", "def": "A moral rule or a strong belief that influences your actions.", "defUrl": def_url("principle"), "audioUrl": build_audio("principle")},
    {"word": "professional", "level": "B1", "pos": "adjective", "def": "Relating to a job that needs special training or skill, especially one that needs a high level of education.", "defUrl": def_url("professional", "_1"), "audioUrl": build_audio("professional")},
    {"word": "resilient", "level": "C1", "pos": "adjective", "def": "Able to recover quickly after something difficult or unpleasant.", "defUrl": def_url("resilient"), "audioUrl": build_audio("resilient")},
    {"word": "significant", "level": "B2", "pos": "adjective", "def": "Large or important enough to have an effect or to be noticed.", "defUrl": def_url("significant"), "audioUrl": build_audio("significant")},
    {"word": "strategy", "level": "B2", "pos": "noun", "def": "A plan that is intended to achieve a particular purpose.", "defUrl": def_url("strategy"), "audioUrl": build_audio("strategy")},
    {"word": "sustainable", "level": "C1", "pos": "adjective", "def": "Involving the use of natural products and energy in a way that does not harm the environment.", "defUrl": def_url("sustainable"), "audioUrl": build_audio("sustainable")},
    {"word": "transform", "level": "C1", "pos": "verb", "def": "To change completely the appearance or character of something or somebody.", "defUrl": def_url("transform"), "audioUrl": build_audio("transform")},
    {"word": "ubiquitous", "level": "C2", "pos": "adjective", "def": "Seeming to be present, appearing, or found everywhere.", "defUrl": def_url("ubiquitous"), "audioUrl": build_audio("ubiquitous")},
    {"word": "unique", "level": "B2", "pos": "adjective", "def": "Being the only one of its kind; unlike anything else.", "defUrl": def_url("unique"), "audioUrl": build_audio("unique")},
    {"word": "vulnerable", "level": "C1", "pos": "adjective", "def": "Weak and easily hurt physically or emotionally.", "defUrl": def_url("vulnerable"), "audioUrl": build_audio("vulnerable")},
]


def seed():
    import sys, os
    sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))
    from app.db import init_db, SessionLocal
    from app.models import Word
    import json as _json

    init_db()
    db = SessionLocal()
    try:
        count = db.query(Word).count()
        if count > 0:
            print(f"Database already has {count} words. Skipping seed.")
            return

        for item in SEED_WORDS:
            def_text = item.get("def", "")
            defs_json = _json.dumps([{"sense": def_text, "example": None}]) if def_text else None
            w = Word(
                word=item["word"].lower(),
                part_of_speech=item.get("pos"),
                level=item.get("level"),
                definitions=defs_json,
                audio_url=item.get("audioUrl"),
                def_url=item.get("defUrl"),
            )
            db.add(w)
        db.commit()
        print(f"Seeded {len(SEED_WORDS)} words.")
    finally:
        db.close()


if __name__ == "__main__":
    seed()
