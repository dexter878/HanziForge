"""FastAPI main application for Hanzi Forge."""
from fastapi import FastAPI, Depends, HTTPException, Query, status, UploadFile, File
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from sqlalchemy import or_, func
from pydantic import BaseModel
from typing import Optional, List
from datetime import datetime, timedelta
from jose import JWTError, jwt
from passlib.context import CryptContext
import json
import os

from .database import (
    get_db, init_db, 
    Character, Sentence, User, UserProgress, 
    HSKTest, Flashcard, Phrase
)

# JWT настройки
SECRET_KEY = os.getenv("SECRET_KEY", "hanzi-forge-secret-key-2024")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 60 * 24 * 7  # 7 дней

# Use PBKDF2 to avoid runtime dependency issues with bcrypt backends.
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")
security = HTTPBearer(auto_error=False)

app = FastAPI(
    title="Hanzi Forge API",
    description="API для русско-китайского приложения изучения языка",
    version="1.0.0"
)

# CORS для локального frontend (все порты)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Р Р°Р·СЂРµС€Р°РµРј РІСЃРµ origins РґР»СЏ СЂР°Р·СЂР°Р±РѕС‚РєРё
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Статические файлы
static_path = os.path.join(os.path.dirname(__file__), "..", "static")
if os.path.exists(static_path):
    app.mount("/static", StaticFiles(directory=static_path), name="static")


# ================== Pydantic Models ==================

class UserCreate(BaseModel):
    username: str
    password: str

class UserLogin(BaseModel):
    username: str
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str
    username: str

class CharacterResponse(BaseModel):
    id: int
    char: str
    pinyin: str
    pinyin_tone_numbers: str
    meaning_ru: str
    frequency: int
    hsk_level: int
    components_json: str
    etymology_ru: str
    audio_mp3: str
    stroke_count: int
    radical: str
    examples_json: str

class SentenceResponse(BaseModel):
    id: int
    text_zh: str
    pinyin: str
    translation_ru: str
    audio_mp3: str
    hsk_level: int
    category: str

class HSKTestResponse(BaseModel):
    id: int
    level: int
    test_type: str
    question_zh: str
    options_json: str
    answer: str
    audio_mp3: str
    explanation_ru: str

class FlashcardResponse(BaseModel):
    id: int
    front_zh: str
    front_pinyin: str
    back_ru: str
    audio_mp3: str
    hsk_level: int
    next_review: Optional[datetime]
    interval: int
    ease_factor: float
    repetitions: int

class FlashcardUpdate(BaseModel):
    quality: int  # 0-5: 0=полный провал, 5=идеально

class PhraseResponse(BaseModel):
    id: int
    category: str
    subcategory: str
    zh: str
    pinyin: str
    ru: str
    audio_mp3: str
    is_common: bool

class ProgressUpdate(BaseModel):
    item_type: str
    item_key: str
    correct: bool

class ProgressResponse(BaseModel):
    total_characters: int
    learned_characters: int
    total_sentences: int
    practiced_sentences: int
    practiced_tests: int
    practiced_pinyin: int
    hsk_progress: dict
    streak_days: int
    today_completed: int
    daily_goal: int


# ================== Auth Functions ==================

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return pwd_context.verify(plain_password, hashed_password)
    except Exception:
        return False

def get_password_hash(password: str) -> str:
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    expire = datetime.utcnow() + (expires_delta or timedelta(minutes=15))
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not credentials:
        return None
    try:
        payload = jwt.decode(credentials.credentials, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
    except JWTError:
        return None
    user = db.query(User).filter(User.username == username).first()
    return user


def calculate_streak_days(db: Session, user_id: int) -> int:
    day_rows = db.query(func.date(UserProgress.updated_at)).filter(
        UserProgress.user_id == user_id
    ).distinct().all()

    if not day_rows:
        return 0

    day_set = set()
    for row in day_rows:
        value = row[0]
        if value is None:
            continue
        if isinstance(value, str):
            day_set.add(datetime.fromisoformat(value).date())
        else:
            day_set.add(value)

    streak = 0
    cursor = datetime.utcnow().date()
    while cursor in day_set:
        streak += 1
        cursor -= timedelta(days=1)
    return streak


# ================== Startup ==================

@app.on_event("startup")
async def startup_event():
    """РРЅРёС†РёР°Р»РёР·Р°С†РёСЏ Р‘Р” РїСЂРё Р·Р°РїСѓСЃРєРµ."""
    init_db()


# ================== Auth Endpoints ==================

@app.post("/api/auth/register", response_model=Token)
def register(user_data: UserCreate, db: Session = Depends(get_db)):
    """Р РµРіРёСЃС‚СЂР°С†РёСЏ РЅРѕРІРѕРіРѕ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ."""
    existing = db.query(User).filter(User.username == user_data.username).first()
    if existing:
        raise HTTPException(status_code=400, detail="Пользователь уже существует")
    
    user = User(
        username=user_data.username,
        password_hash=get_password_hash(user_data.password)
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    
    token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@app.post("/api/auth/login", response_model=Token)
def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Р’С…РѕРґ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ."""
    user = db.query(User).filter(User.username == user_data.username).first()
    if not user or not verify_password(user_data.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверные учётные данные")
    
    token = create_access_token(
        data={"sub": user.username},
        expires_delta=timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    )
    return {"access_token": token, "token_type": "bearer", "username": user.username}


@app.get("/api/auth/me")
def get_me(current_user: User = Depends(get_current_user)):
    """Получить текущего пользователя."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Не авторизован")
    return {"username": current_user.username, "daily_goal": current_user.daily_goal}


# ================== Characters Endpoints ==================

@app.get("/api/characters", response_model=List[CharacterResponse])
def get_characters(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    hsk_level: Optional[int] = Query(None, ge=1, le=6),
    db: Session = Depends(get_db)
):
    """Получить список иероглифов."""
    query = db.query(Character)
    if hsk_level:
        query = query.filter(Character.hsk_level == hsk_level)
    return query.order_by(Character.frequency.desc()).offset(skip).limit(limit).all()


@app.get("/api/characters/search", response_model=List[CharacterResponse])
def search_characters(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Поиск иероглифов по ханзи, пиньинь или значению."""
    query = db.query(Character).filter(
        or_(
            Character.char.contains(q),
            Character.pinyin.contains(q),
            Character.pinyin_tone_numbers.contains(q),
            Character.meaning_ru.contains(q)
        )
    )
    return query.limit(limit).all()


@app.get("/api/characters/{char}", response_model=CharacterResponse)
def get_character(char: str, db: Session = Depends(get_db)):
    """Получить детали иероглифа."""
    character = db.query(Character).filter(Character.char == char).first()
    if not character:
        raise HTTPException(status_code=404, detail="Иероглиф не найден")
    return character


# ================== Sentences Endpoints ==================

@app.get("/api/sentences", response_model=List[SentenceResponse])
def get_sentences(
    skip: int = Query(0, ge=0),
    limit: int = Query(50, ge=1, le=200),
    hsk_level: Optional[int] = Query(None, ge=1, le=6),
    category: Optional[str] = None,
    db: Session = Depends(get_db)
):
    """Получить список предложений."""
    query = db.query(Sentence)
    if hsk_level:
        query = query.filter(Sentence.hsk_level == hsk_level)
    if category:
        query = query.filter(Sentence.category == category)
    return query.offset(skip).limit(limit).all()


@app.get("/api/sentences/search", response_model=List[SentenceResponse])
def search_sentences(
    q: str = Query(..., min_length=1),
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Поиск предложений."""
    query = db.query(Sentence).filter(
        or_(
            Sentence.text_zh.contains(q),
            Sentence.pinyin.contains(q),
            Sentence.translation_ru.contains(q)
        )
    )
    return query.limit(limit).all()


@app.get("/api/sentences/random", response_model=List[SentenceResponse])
def get_random_sentences(
    count: int = Query(10, ge=1, le=50),
    hsk_level: Optional[int] = Query(None, ge=1, le=6),
    db: Session = Depends(get_db)
):
    """Получить случайные предложения для упражнений."""
    query = db.query(Sentence)
    if hsk_level:
        query = query.filter(Sentence.hsk_level == hsk_level)
    return query.order_by(func.random()).limit(count).all()


# ================== HSK Tests Endpoints ==================

@app.get("/api/tests", response_model=List[HSKTestResponse])
def get_tests(
    level: Optional[int] = Query(None, ge=1, le=6),
    test_type: Optional[str] = None,
    limit: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_db)
):
    """Получить HSK тесты."""
    query = db.query(HSKTest)
    if level:
        query = query.filter(HSKTest.level == level)
    if test_type:
        query = query.filter(HSKTest.test_type == test_type)
    return query.order_by(func.random()).limit(limit).all()


@app.get("/api/tests/{test_id}", response_model=HSKTestResponse)
def get_test(test_id: int, db: Session = Depends(get_db)):
    """Получить конкретный тест."""
    test = db.query(HSKTest).filter(HSKTest.id == test_id).first()
    if not test:
        raise HTTPException(status_code=404, detail="Тест не найден")
    return test


# ================== Flashcards Endpoints ==================

@app.get("/api/flashcards", response_model=List[FlashcardResponse])
def get_flashcards(
    hsk_level: Optional[int] = Query(None, ge=1, le=6),
    due_only: bool = Query(False),
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить флешкарты."""
    base_query = db.query(Flashcard)
    
    # Показываем и общие карточки, и карточки пользователя
    if hsk_level:
        base_query = base_query.filter(Flashcard.hsk_level == hsk_level)

    now = datetime.utcnow()

    if current_user:
        personal_cards = base_query.filter(Flashcard.user_id == current_user.id).all()
        personal_keys = {(card.front_zh, card.back_ru, card.hsk_level) for card in personal_cards}

        shared_cards = base_query.filter(Flashcard.user_id == None).all()
        shared_cards = [
            card for card in shared_cards
            if (card.front_zh, card.back_ru, card.hsk_level) not in personal_keys
        ]
        cards = personal_cards + shared_cards
    else:
        cards = base_query.filter(Flashcard.user_id == None).all()

    if due_only:
        cards = [card for card in cards if card.next_review and card.next_review <= now]

    cards.sort(key=lambda card: card.next_review or datetime.min)
    return cards[:limit]


@app.put("/api/flashcards/{flashcard_id}", response_model=FlashcardResponse)
def update_flashcard(
    flashcard_id: int,
    update: FlashcardUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update flashcard review state (SM-2)."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Authentication required")

    flashcard = db.query(Flashcard).filter(Flashcard.id == flashcard_id).first()
    if not flashcard:
        raise HTTPException(status_code=404, detail="Flashcard not found")

    if flashcard.user_id and flashcard.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied for this flashcard")

    # Shared cards are templates; create a personal copy on first review.
    if flashcard.user_id is None:
        user_card = db.query(Flashcard).filter(
            Flashcard.user_id == current_user.id,
            Flashcard.front_zh == flashcard.front_zh,
            Flashcard.back_ru == flashcard.back_ru,
            Flashcard.hsk_level == flashcard.hsk_level
        ).first()

        if not user_card:
            user_card = Flashcard(
                user_id=current_user.id,
                front_zh=flashcard.front_zh,
                front_pinyin=flashcard.front_pinyin,
                back_ru=flashcard.back_ru,
                audio_mp3=flashcard.audio_mp3,
                hsk_level=flashcard.hsk_level,
                next_review=datetime.utcnow(),
                interval=1,
                ease_factor=2.5,
                repetitions=0,
            )
            db.add(user_card)
            db.flush()

        flashcard = user_card

    quality = max(0, min(5, update.quality))

    if quality < 3:
        flashcard.repetitions = 0
        flashcard.interval = 1
    else:
        if flashcard.repetitions == 0:
            flashcard.interval = 1
        elif flashcard.repetitions == 1:
            flashcard.interval = 6
        else:
            flashcard.interval = int(flashcard.interval * flashcard.ease_factor)

        flashcard.repetitions += 1

    flashcard.ease_factor = max(
        1.3,
        flashcard.ease_factor + 0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02),
    )
    flashcard.next_review = datetime.utcnow() + timedelta(days=flashcard.interval)

    db.commit()
    db.refresh(flashcard)
    return flashcard

# ================== Phrases Endpoints ==================

@app.get("/api/phrases", response_model=List[PhraseResponse])
def get_phrases(
    category: Optional[str] = None,
    limit: int = Query(100, ge=1, le=500),
    db: Session = Depends(get_db)
):
    """Получить фразы разговорника."""
    query = db.query(Phrase)
    if category:
        query = query.filter(Phrase.category == category)
    return query.order_by(Phrase.category, Phrase.subcategory).limit(limit).all()


@app.get("/api/phrases/categories")
def get_phrase_categories(db: Session = Depends(get_db)):
    """Получить список категорий фраз."""
    categories = db.query(Phrase.category).distinct().all()
    return [c[0] for c in categories]


# ================== Progress Endpoints ==================

@app.get("/api/progress", response_model=ProgressResponse)
def get_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Получить прогресс пользователя."""
    if not current_user:
        # Р’РѕР·РІСЂР°С‰Р°РµРј РїСѓСЃС‚РѕР№ РїСЂРѕРіСЂРµСЃСЃ РґР»СЏ РЅРµР°РІС‚РѕСЂРёР·РѕРІР°РЅРЅС‹С…
        total_chars = db.query(Character).count()
        total_sentences = db.query(Sentence).count()
        return ProgressResponse(
            total_characters=total_chars,
            learned_characters=0,
            total_sentences=total_sentences,
            practiced_sentences=0,
            practiced_tests=0,
            practiced_pinyin=0,
            hsk_progress={str(i): 0 for i in range(1, 7)},
            streak_days=0,
            today_completed=0,
            daily_goal=20
        )
    
    total_chars = db.query(Character).count()
    learned_chars = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.item_type == "character",
        UserProgress.correct > 0
    ).count()
    
    total_sentences = db.query(Sentence).count()
    practiced_sentences = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.item_type == "sentence"
    ).count()

    practiced_tests = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.item_type == "test"
    ).count()

    practiced_pinyin = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.item_type == "pinyin"
    ).count()
    
    # HSK прогресс
    hsk_progress = {}
    for level in range(1, 7):
        total_level = db.query(Character).filter(Character.hsk_level == level).count()
        learned_level = db.query(UserProgress).join(Character, UserProgress.item_key == Character.char).filter(
            UserProgress.user_id == current_user.id,
            UserProgress.item_type == "character",
            Character.hsk_level == level,
            UserProgress.correct > 0
        ).count()
        hsk_progress[str(level)] = int(learned_level / total_level * 100) if total_level > 0 else 0
    
    # Сегодняшний прогресс
    today = datetime.utcnow().date()
    today_completed = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        func.date(UserProgress.updated_at) == today
    ).count()
    
    return ProgressResponse(
        total_characters=total_chars,
        learned_characters=learned_chars,
        total_sentences=total_sentences,
        practiced_sentences=practiced_sentences,
        practiced_tests=practiced_tests,
        practiced_pinyin=practiced_pinyin,
        hsk_progress=hsk_progress,
        streak_days=calculate_streak_days(db, current_user.id),
        today_completed=today_completed,
        daily_goal=current_user.daily_goal
    )


@app.post("/api/progress")
def update_progress(
    update: ProgressUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Обновить прогресс изучения."""
    if not current_user:
        raise HTTPException(status_code=401, detail="Требуется авторизация")
    
    progress = db.query(UserProgress).filter(
        UserProgress.user_id == current_user.id,
        UserProgress.item_type == update.item_type,
        UserProgress.item_key == update.item_key
    ).first()
    
    if not progress:
        progress = UserProgress(
            user_id=current_user.id,
            item_type=update.item_type,
            item_key=update.item_key,
            correct=0,
            attempts=0,
            streak=0,
        )
        db.add(progress)
    
    progress.attempts += 1
    if update.correct:
        progress.correct += 1
        progress.streak += 1
    else:
        progress.streak = 0
    
    progress.updated_at = datetime.utcnow()
    db.commit()
    
    return {"status": "success"}


# ================== Stats Endpoints ==================

@app.get("/api/stats")
def get_stats(db: Session = Depends(get_db)):
    """РџРѕР»СѓС‡РёС‚СЊ РѕР±С‰СѓСЋ СЃС‚Р°С‚РёСЃС‚РёРєСѓ Р‘Р”."""
    return {
        "characters": db.query(Character).count(),
        "sentences": db.query(Sentence).count(),
        "tests": db.query(HSKTest).count(),
        "flashcards": db.query(Flashcard).count(),
        "phrases": db.query(Phrase).count(),
        "users": db.query(User).count()
    }


# ================== Health Check ==================

@app.get("/api/health")
def health_check():
    """Проверка здоровья API."""
    return {"status": "ok", "version": "1.0.0", "name": "Hanzi Forge API"}


# ================== Teacher Audio Endpoints ==================

TEACHER_AUDIO_DIR = os.path.join(os.path.dirname(__file__), "..", "static", "audio", "teacher")
ALLOWED_AUDIO_EXTENSIONS = {".mp3", ".wav", ".ogg", ".webm"}
MAX_AUDIO_SIZE = 10 * 1024 * 1024  # 10MB


@app.post("/api/teacher-audio/upload")
async def upload_teacher_audio(
    token: str = Query(..., description="Pinyin token, e.g. ma1"),
    file: UploadFile = File(...),
):
    """Загрузить кастомное аудио преподавателя для конкретного слога."""
    # Validate token format
    if not token or len(token) > 20:
        raise HTTPException(status_code=400, detail="Неверный token")

    # Validate file extension
    ext = os.path.splitext(file.filename or "")[1].lower()
    if ext not in ALLOWED_AUDIO_EXTENSIONS:
        raise HTTPException(status_code=400, detail=f"Допустимые форматы: {', '.join(ALLOWED_AUDIO_EXTENSIONS)}")

    # Read and validate size
    content = await file.read()
    if len(content) > MAX_AUDIO_SIZE:
        raise HTTPException(status_code=400, detail="Файл слишком большой (макс. 10MB)")

    # Save file
    os.makedirs(TEACHER_AUDIO_DIR, exist_ok=True)
    # Always save as original extension for simplicity
    save_name = f"{token}{ext}"
    save_path = os.path.join(TEACHER_AUDIO_DIR, save_name)
    with open(save_path, "wb") as f:
        f.write(content)

    return {"status": "ok", "token": token, "filename": save_name, "size": len(content)}


@app.get("/api/teacher-audio/list")
def list_teacher_audio():
    """Получить список всех кастомных аудио преподавателя."""
    if not os.path.exists(TEACHER_AUDIO_DIR):
        return {"items": []}

    items = []
    for filename in sorted(os.listdir(TEACHER_AUDIO_DIR)):
        ext = os.path.splitext(filename)[1].lower()
        if ext in ALLOWED_AUDIO_EXTENSIONS:
            token = os.path.splitext(filename)[0]
            filepath = os.path.join(TEACHER_AUDIO_DIR, filename)
            items.append({
                "token": token,
                "filename": filename,
                "size": os.path.getsize(filepath),
                "url": f"/static/audio/teacher/{filename}",
            })

    return {"items": items}


@app.delete("/api/teacher-audio/{token}")
def delete_teacher_audio(token: str):
    """Удалить кастомное аудио преподавателя."""
    if not os.path.exists(TEACHER_AUDIO_DIR):
        raise HTTPException(status_code=404, detail="Аудио не найдено")

    deleted = False
    for ext in ALLOWED_AUDIO_EXTENSIONS:
        filepath = os.path.join(TEACHER_AUDIO_DIR, f"{token}{ext}")
        if os.path.exists(filepath):
            os.remove(filepath)
            deleted = True

    if not deleted:
        raise HTTPException(status_code=404, detail="Аудио не найдено")

    return {"status": "ok", "token": token}
