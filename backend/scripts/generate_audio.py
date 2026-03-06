"""Generate local MP3 audio assets for Hanzi Forge."""
from __future__ import annotations

import argparse
import asyncio
import os
import re
import sys
import time
from pathlib import Path
from typing import Iterable

try:
    from gtts import gTTS
except ImportError as exc:  # pragma: no cover
    raise SystemExit("gTTS is not installed. Run: pip install gTTS") from exc

try:
    import edge_tts
except ImportError:  # pragma: no cover
    edge_tts = None

BACKEND_DIR = Path(__file__).resolve().parents[1]
AUDIO_ROOT = BACKEND_DIR / "static" / "audio"

sys.path.insert(0, str(BACKEND_DIR))
from app.database import Character, HSKTest, Phrase, Sentence, SessionLocal  # noqa: E402

TONE_MARKS = {
    "a": ["a", "ā", "á", "ǎ", "à"],
    "e": ["e", "ē", "é", "ě", "è"],
    "i": ["i", "ī", "í", "ǐ", "ì"],
    "o": ["o", "ō", "ó", "ǒ", "ò"],
    "u": ["u", "ū", "ú", "ǔ", "ù"],
    "ü": ["ü", "ǖ", "ǘ", "ǚ", "ǜ"],
}

# For pinyin tones we need a stable Mandarin voice; edge-tts gives the most consistent result.
DEFAULT_ENGINE = "edge"
DEFAULT_EDGE_VOICE = "zh-CN-XiaoxiaoNeural"

# We speak numbered pinyin using Chinese voice. Local MP3 filenames stay in numbered form.
COMMON_SYLLABLES = [
    "a", "ai", "an", "ang", "ao", "ba", "bai", "ban", "bang", "bao", "bei", "ben", "beng", "bi", "bian",
    "biao", "bie", "bin", "bing", "bo", "bu", "ca", "cai", "can", "cang", "cao", "ce", "cen", "ceng", "cha",
    "chai", "chan", "chang", "chao", "che", "chen", "cheng", "chi", "chong", "chou", "chu", "chua", "chuai", "chuan",
    "chuang", "chui", "chun", "chuo", "ci", "cong", "cou", "cu", "cuan", "cui", "cun", "cuo", "da", "dai", "dan",
    "dang", "dao", "de", "dei", "den", "deng", "di", "dian", "diao", "die", "ding", "diu", "dong", "dou", "du",
    "duan", "dui", "dun", "duo", "e", "ei", "en", "eng", "er", "fa", "fan", "fang", "fei", "fen", "feng",
    "fo", "fou", "fu", "ga", "gai", "gan", "gang", "gao", "ge", "gei", "gen", "geng", "gong", "gou", "gu",
    "gua", "guai", "guan", "guang", "gui", "gun", "guo", "ha", "hai", "han", "hang", "hao", "he", "hei", "hen",
    "heng", "hong", "hou", "hu", "hua", "huai", "huan", "huang", "hui", "hun", "huo", "ji", "jia", "jian", "jiang",
    "jiao", "jie", "jin", "jing", "jiong", "jiu", "ju", "juan", "jue", "jun", "ka", "kai", "kan", "kang", "kao",
    "ke", "ken", "keng", "kong", "kou", "ku", "kua", "kuai", "kuan", "kuang", "kui", "kun", "kuo", "la", "lai",
    "lan", "lang", "lao", "le", "lei", "leng", "li", "lia", "lian", "liang", "liao", "lie", "lin", "ling", "liu",
    "lo", "long", "lou", "lu", "luan", "lun", "luo", "lv", "lve", "ma", "mai", "man", "mang", "mao", "me",
    "mei", "men", "meng", "mi", "mian", "miao", "mie", "min", "ming", "miu", "mo", "mou", "mu", "na", "nai",
    "nan", "nang", "nao", "ne", "nei", "nen", "neng", "ni", "nian", "niang", "niao", "nie", "nin", "ning", "niu",
    "nong", "nou", "nu", "nuan", "nun", "nuo", "nv", "nve", "o", "ou", "pa", "pai", "pan", "pang", "pao", "pei",
    "pen", "peng", "pi", "pian", "piao", "pie", "pin", "ping", "po", "pou", "pu", "qi", "qia", "qian", "qiang",
    "qiao", "qie", "qin", "qing", "qiong", "qiu", "qu", "quan", "que", "qun", "ran", "rang", "rao", "re", "ren",
    "reng", "ri", "rong", "rou", "ru", "ruan", "rui", "run", "ruo", "sa", "sai", "san", "sang", "sao", "se",
    "sen", "seng", "sha", "shai", "shan", "shang", "shao", "she", "shei", "shen", "sheng", "shi", "shou", "shu",
    "shua", "shuai", "shuan", "shuang", "shui", "shun", "shuo", "si", "song", "sou", "su", "suan", "sui", "sun",
    "suo", "ta", "tai", "tan", "tang", "tao", "te", "teng", "ti", "tian", "tiao", "tie", "ting", "tong", "tou",
    "tu", "tuan", "tui", "tun", "tuo", "wa", "wai", "wan", "wang", "wei", "wen", "weng", "wo", "wu", "xi", "xia",
    "xian", "xiang", "xiao", "xie", "xin", "xing", "xiong", "xiu", "xu", "xuan", "xue", "xun", "ya", "yan", "yang",
    "yao", "ye", "yi", "yin", "ying", "yo", "yong", "you", "yu", "yuan", "yue", "yun", "za", "zai", "zan", "zang",
    "zao", "ze", "zei", "zen", "zeng", "zha", "zhai", "zhan", "zhang", "zhao", "zhe", "zhen", "zheng", "zhi", "zhong",
    "zhou", "zhu", "zhua", "zhuai", "zhuan", "zhuang", "zhui", "zhun", "zhuo", "zi", "zong", "zou", "zu", "zuan",
    "zui", "zun", "zuo",
]

TRAINER_BASES = ["ma", "ba", "ni", "hao", "shi", "li", "xue", "zhong", "ren", "you"]

# Mapping from numbered pinyin to representative Chinese character.
# gTTS ignores tone marks on pinyin, so we must send the actual character
# which inherently carries the correct tone.
TONE_CHARS = {
    # Trainer bases — all 4 tones + neutral
    'ma1': '妈', 'ma2': '麻', 'ma3': '马', 'ma4': '骂', 'ma5': '吗',
    'ba1': '八', 'ba2': '拔', 'ba3': '把', 'ba4': '爸', 'ba5': '吧',
    'ni1': '妮', 'ni2': '泥', 'ni3': '你', 'ni4': '逆', 'ni5': '呢',
    'hao1': '蒿', 'hao2': '毫', 'hao3': '好', 'hao4': '号', 'hao5': '好',
    'shi1': '诗', 'shi2': '十', 'shi3': '使', 'shi4': '是', 'shi5': '是',
    'li1': '离', 'li2': '离', 'li3': '里', 'li4': '力', 'li5': '里',
    'xue1': '雪', 'xue2': '学', 'xue3': '雪', 'xue4': '血', 'xue5': '学',
    'zhong1': '中', 'zhong2': '中', 'zhong3': '肿', 'zhong4': '重', 'zhong5': '中',
    'ren1': '人', 'ren2': '人', 'ren3': '忍', 'ren4': '认', 'ren5': '人',
    'you1': '优', 'you2': '由', 'you3': '有', 'you4': '又', 'you5': '有',
    # Extended trainer syllables
    'da1': '搭', 'da2': '答', 'da3': '打', 'da4': '大',
    'ta1': '他', 'ta2': '塔', 'ta3': '塔', 'ta4': '踏',
    'ge1': '歌', 'ge2': '格', 'ge3': '个', 'ge4': '个',
    'ke1': '科', 'ke2': '壳', 'ke3': '可', 'ke4': '刻',
    'he1': '喝', 'he2': '和', 'he3': '喝', 'he4': '贺',
    'ji1': '机', 'ji2': '及', 'ji3': '几', 'ji4': '记',
    'qi1': '七', 'qi2': '其', 'qi3': '起', 'qi4': '气',
    'xi1': '西', 'xi2': '习', 'xi3': '洗', 'xi4': '细',
    'wo1': '窝', 'wo2': '我', 'wo3': '我', 'wo4': '卧',
    'de1': '得', 'de2': '得', 'de3': '得', 'de4': '得', 'de5': '的',
    # Ретрофлексные и альвеолярные
    'zhi1': '知', 'zhi2': '直', 'zhi3': '纸', 'zhi4': '至',
    'chi1': '吃', 'chi2': '迟', 'chi3': '尺', 'chi4': '赤',
    'ri1': '日', 'ri2': '日', 'ri3': '日', 'ri4': '日',
    'zi1': '资', 'zi2': '字', 'zi3': '子', 'zi4': '字',
    'ci1': '刺', 'ci2': '词', 'ci3': '此', 'ci4': '次',
    'si1': '丝', 'si2': '死', 'si3': '死', 'si4': '四',
    # Финали
    'fan1': '翻', 'fan2': '烦', 'fan3': '反', 'fan4': '饭',
    'ban1': '班', 'ban2': '般', 'ban3': '板', 'ban4': '半',
    'men1': '闷', 'men2': '门', 'men3': '闷', 'men4': '闷', 'men5': '们',
    'shang1': '商', 'shang2': '尚', 'shang3': '赏', 'shang4': '上',
    'zai1': '灾', 'zai2': '载', 'zai3': '宰', 'zai4': '在',
    'xie1': '些', 'xie2': '鞋', 'xie3': '写', 'xie4': '谢',
    # Носовые и дифтонги
    'nv3': '女',
    'bu2': '不', 'bu4': '不',
    'yi1': '一', 'yi2': '移', 'yi3': '以', 'yi4': '意',
    'er2': '儿',
    # Дополнительные из quiz/lessons
    'pa1': '怕', 'pa2': '爬', 'pa3': '怕', 'pa4': '怕',
    'na1': '那', 'na2': '拿', 'na3': '哪', 'na4': '那',
    'la1': '拉', 'la2': '啦', 'la3': '喇', 'la4': '辣',
    'tang1': '汤', 'tang2': '糖', 'tang3': '躺', 'tang4': '烫',
    'wen1': '温', 'wen2': '文', 'wen3': '吻', 'wen4': '问',
    'yan1': '烟', 'yan2': '盐', 'yan3': '眼', 'yan4': '验',
    'mai2': '埋', 'mai3': '买', 'mai4': '卖',
    'xin1': '心', 'xin2': '新', 'xin3': '心', 'xin4': '信',
    'xing1': '星', 'xing2': '行', 'xing3': '醒', 'xing4': '性',
    'jin1': '金', 'jin2': '今', 'jin3': '仅', 'jin4': '进',
    'jing1': '京', 'jing2': '静', 'jing3': '景', 'jing4': '敬',
    'bang1': '帮', 'bang2': '棒', 'bang3': '绑', 'bang4': '棒',
    'meng1': '蒙', 'meng2': '蒙', 'meng3': '猛', 'meng4': '梦',
    'fen1': '分', 'fen2': '坟', 'fen3': '粉', 'fen4': '份',
    'feng1': '风', 'feng2': '逢', 'feng3': '讽', 'feng4': '凤',
    'fang1': '方', 'fang2': '房', 'fang3': '仿', 'fang4': '放',
    'se1': '色', 'se4': '色',
    'ze1': '则', 'ze2': '则', 'ze4': '则',
    'zhe1': '遮', 'zhe2': '折', 'zhe3': '者', 'zhe4': '这',
    'che1': '车', 'che2': '车', 'che3': '扯', 'che4': '彻',
    'ce4': '侧',
    'she1': '奢', 'she2': '蛇', 'she3': '舍', 'she4': '社',
}


def get_speakable_for_tts(token: str) -> str:
    """Get the best text to send to TTS for a pinyin token.

    Uses a Chinese character if available (provides correct tone),
    otherwise falls back to tone-marked pinyin.
    """
    if token in TONE_CHARS:
        return TONE_CHARS[token]
    return numbered_to_speakable(token)


def ensure_dir(path: Path) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)


def static_audio_src_to_path(audio_src: str) -> Path | None:
    if not audio_src:
        return None

    src = audio_src.strip()
    prefix = "/static/audio/"
    if not src.startswith(prefix):
        return None

    relative = src[len(prefix):]
    return AUDIO_ROOT / relative.replace("/", os.sep)


def split_pinyin_tokens(numbered: str) -> list[str]:
    return [token.strip().lower() for token in numbered.split() if token.strip()]


def strip_tone(token: str) -> str:
    return re.sub(r"\d", "", token)


def numbered_to_speakable(token: str) -> str:
    """Convert numbered pinyin (ma1/ma2/ma3/ma4/ma5) to tone-mark pinyin."""
    normalized = token.lower().strip().replace("u:", "ü").replace("v", "ü")
    match = re.match(r"^([a-zü]+)([1-5])$", normalized)
    if not match:
        return re.sub(r"[^a-zü]", "", normalized)

    base = match.group(1)
    tone = int(match.group(2))
    if tone == 5:
        return base

    target_index = -1
    if "a" in base:
        target_index = base.index("a")
    elif "e" in base:
        target_index = base.index("e")
    elif "ou" in base:
        target_index = base.index("o")
    else:
        for idx in range(len(base) - 1, -1, -1):
            if base[idx] in ("a", "e", "i", "o", "u", "ü"):
                target_index = idx
                break

    if target_index < 0:
        return base

    vowel = base[target_index]
    marks = TONE_MARKS.get(vowel)
    if not marks:
        return base

    return f"{base[:target_index]}{marks[tone]}{base[target_index + 1:]}"


def synthesize_gtts(
    text: str,
    target_file: Path,
    retries: int,
    delay_seconds: float,
    overwrite: bool,
) -> bool:
    ensure_dir(target_file)

    if target_file.exists() and not overwrite:
        return False

    for attempt in range(retries + 1):
        try:
            tts = gTTS(text=text, lang="zh-CN", tld="com", slow=False)
            tts.save(str(target_file))
            return True
        except Exception:
            if attempt >= retries:
                raise
            time.sleep(delay_seconds)

    return False


def synthesize_edge(
    text: str,
    target_file: Path,
    retries: int,
    delay_seconds: float,
    overwrite: bool,
    voice: str,
) -> bool:
    if edge_tts is None:
        raise RuntimeError("edge-tts is not installed. Run: pip install edge-tts")

    ensure_dir(target_file)

    if target_file.exists() and not overwrite:
        return False

    for attempt in range(retries + 1):
        try:
            async def save() -> None:
                communicator = edge_tts.Communicate(text=text, voice=voice)
                await communicator.save(str(target_file))

            asyncio.run(save())
            return True
        except Exception:
            if attempt >= retries:
                raise
            time.sleep(delay_seconds)

    return False


def synthesize(
    text: str,
    target_file: Path,
    retries: int = 2,
    delay_seconds: float = 0.8,
    overwrite: bool = False,
    engine: str = DEFAULT_ENGINE,
    edge_voice: str = DEFAULT_EDGE_VOICE,
) -> bool:
    selected = (engine or DEFAULT_ENGINE).lower()
    if selected not in {"auto", "edge", "gtts"}:
        raise ValueError(f"Unsupported engine: {selected}")

    if selected == "gtts":
        return synthesize_gtts(text, target_file, retries, delay_seconds, overwrite)

    if selected == "edge":
        return synthesize_edge(text, target_file, retries, delay_seconds, overwrite, edge_voice)

    # auto: prefer edge-tts neural Mandarin, fallback to gTTS.
    try:
        return synthesize_edge(text, target_file, retries, delay_seconds, overwrite, edge_voice)
    except Exception as edge_exc:
        try:
            return synthesize_gtts(text, target_file, retries, delay_seconds, overwrite)
        except Exception:
            raise RuntimeError(f"Both engines failed. edge-tts error: {edge_exc}") from edge_exc


def generate_core_syllables(character_tokens: Iterable[str], min_syllables: int) -> list[str]:
    """Build the tone-library base list for pinyin drills.

    We prioritize trainer syllables used in the frontend and then add common
    syllables up to min_syllables.
    """
    syllables: list[str] = []
    seen = set()

    for base in TRAINER_BASES:
        if base not in seen:
            seen.add(base)
            syllables.append(base)

    for item in COMMON_SYLLABLES:
        if len(syllables) >= min_syllables:
            break
        if item not in seen:
            seen.add(item)
            syllables.append(item)

    return syllables


def generate_pinyin_audio(
    db: SessionLocal,
    min_syllables: int,
    overwrite: bool = False,
    engine: str = DEFAULT_ENGINE,
    edge_voice: str = DEFAULT_EDGE_VOICE,
) -> tuple[int, int]:
    generated = 0
    skipped = 0

    chars = db.query(Character).all()
    char_tokens: list[str] = []
    for row in chars:
        for token in split_pinyin_tokens(row.pinyin_tone_numbers):
            if re.search(r"\d$", token):
                char_tokens.append(token)
    char_token_set = set(char_tokens)

    # 1) Ensure exact files for all pinyin tokens used by characters.
    for token in sorted(char_token_set):
        target = AUDIO_ROOT / "pinyin" / f"{token}.mp3"
        speak = get_speakable_for_tts(token)
        try:
            if synthesize(speak, target, overwrite=overwrite, engine=engine, edge_voice=edge_voice):
                generated += 1
            else:
                skipped += 1
        except Exception as exc:
            print(f"[WARN] pinyin token failed: {token} -> {exc}")

    # 2) Generate tone drill library (trainer syllables + optional common extras).
    base_syllables = generate_core_syllables(char_tokens, min_syllables=min_syllables)
    for base in base_syllables:
        for tone in (1, 2, 3, 4, 5):
            token = f"{base}{tone}"
            if token in char_token_set:
                skipped += 1
                continue
            target = AUDIO_ROOT / "pinyin" / f"{token}.mp3"
            speak = get_speakable_for_tts(token)
            try:
                if synthesize(speak, target, overwrite=overwrite, engine=engine, edge_voice=edge_voice):
                    generated += 1
                else:
                    skipped += 1
            except Exception as exc:
                print(f"[WARN] pinyin library failed: {token} -> {exc}")

    print(f"[OK] Pinyin audio: generated={generated}, existing={skipped}, base_syllables={len(base_syllables)}")
    return generated, skipped


def generate_row_audio(
    rows,
    text_attr: str,
    audio_attr: str,
    label: str,
    engine: str = DEFAULT_ENGINE,
    edge_voice: str = DEFAULT_EDGE_VOICE,
) -> tuple[int, int, int]:
    generated = 0
    skipped = 0
    failed = 0

    for row in rows:
        text = getattr(row, text_attr, "")
        audio_src = getattr(row, audio_attr, "")
        target = static_audio_src_to_path(audio_src)

        if not text or not target:
            skipped += 1
            continue

        try:
            if synthesize(text, target, engine=engine, edge_voice=edge_voice):
                generated += 1
            else:
                skipped += 1
        except Exception as exc:
            failed += 1
            print(f"[WARN] {label} audio failed ({audio_src}): {exc}")

    print(f"[OK] {label} audio: generated={generated}, existing={skipped}, failed={failed}")
    return generated, skipped, failed


def generate_all_audio(
    min_syllables: int,
    overwrite_pinyin: bool = False,
    engine: str = DEFAULT_ENGINE,
    edge_voice: str = DEFAULT_EDGE_VOICE,
) -> int:
    db = SessionLocal()
    failures = 0

    try:
        AUDIO_ROOT.mkdir(parents=True, exist_ok=True)

        _, _ = generate_pinyin_audio(
            db,
            min_syllables=min_syllables,
            overwrite=overwrite_pinyin,
            engine=engine,
            edge_voice=edge_voice,
        )

        sent_generated, sent_existing, sent_failed = generate_row_audio(
            db.query(Sentence).all(),
            text_attr="text_zh",
            audio_attr="audio_mp3",
            label="Sentence",
            engine=engine,
            edge_voice=edge_voice,
        )
        phrase_generated, phrase_existing, phrase_failed = generate_row_audio(
            db.query(Phrase).all(),
            text_attr="zh",
            audio_attr="audio_mp3",
            label="Phrase",
            engine=engine,
            edge_voice=edge_voice,
        )
        test_generated, test_existing, test_failed = generate_row_audio(
            db.query(HSKTest).filter(HSKTest.test_type == "listening").all(),
            text_attr="question_zh",
            audio_attr="audio_mp3",
            label="HSK listening",
            engine=engine,
            edge_voice=edge_voice,
        )

        failures += sent_failed + phrase_failed + test_failed

        print("=" * 60)
        print("Audio generation summary")
        print(
            f"sentences={sent_generated} generated, {sent_existing} existing | "
            f"phrases={phrase_generated} generated, {phrase_existing} existing | "
            f"tests={test_generated} generated, {test_existing} existing"
        )
        print("=" * 60)

    finally:
        db.close()

    return failures


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Generate local audio MP3 assets")
    parser.add_argument(
        "--min-syllables",
        type=int,
        default=len(TRAINER_BASES),
        help="minimum number of base pinyin syllables to generate with all 5 tones",
    )
    parser.add_argument(
        "--overwrite-pinyin",
        action="store_true",
        help="regenerate pinyin mp3 files even if they already exist",
    )
    parser.add_argument(
        "--engine",
        choices=["auto", "edge", "gtts"],
        default=DEFAULT_ENGINE,
        help="tts engine: auto (edge fallback gtts), edge, or gtts",
    )
    parser.add_argument(
        "--voice",
        default=DEFAULT_EDGE_VOICE,
        help="edge-tts voice name (used by --engine edge/auto)",
    )
    return parser.parse_args()


def main() -> int:
    args = parse_args()
    print(f"[INFO] Audio engine={args.engine}, edge_voice={args.voice}")
    failures = generate_all_audio(
        min_syllables=max(args.min_syllables, len(TRAINER_BASES)),
        overwrite_pinyin=args.overwrite_pinyin,
        engine=args.engine,
        edge_voice=args.voice,
    )
    return 0 if failures == 0 else 1


if __name__ == "__main__":
    raise SystemExit(main())
