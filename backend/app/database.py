"""Database models and connection for Hanzi Forge."""
from pathlib import Path
from sqlalchemy import create_engine, Column, Integer, String, Text, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker, relationship
from datetime import datetime
import os

BACKEND_DIR = Path(__file__).resolve().parent.parent
DEFAULT_DB_PATH = BACKEND_DIR / "hanzi.db"
DEFAULT_DATABASE_URL = f"sqlite:///{DEFAULT_DB_PATH.as_posix()}"

DATABASE_URL = os.getenv("DATABASE_URL", DEFAULT_DATABASE_URL)
connect_args = {"check_same_thread": False} if DATABASE_URL.startswith("sqlite") else {}

engine = create_engine(DATABASE_URL, connect_args=connect_args)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


class Character(Base):
    """Китайские иероглифы с пиньинь и переводом."""
    __tablename__ = "characters"
    
    id = Column(Integer, primary_key=True, index=True)
    char = Column(String(10), unique=True, index=True, nullable=False)
    pinyin = Column(String(50), nullable=False)  # с тоновыми знаками: nǐ
    pinyin_tone_numbers = Column(String(50), nullable=False)  # ni3
    meaning_ru = Column(Text, nullable=False)
    frequency = Column(Integer, default=0)
    hsk_level = Column(Integer, default=0)
    components_json = Column(Text, default="{}")  # JSON с компонентами
    etymology_ru = Column(Text, default="")
    audio_mp3 = Column(String(255), default="")
    stroke_count = Column(Integer, default=0)
    radical = Column(String(10), default="")
    examples_json = Column(Text, default="[]")  # JSON с примерами использования


class Sentence(Base):
    """Предложения с переводом на русский."""
    __tablename__ = "sentences"
    
    id = Column(Integer, primary_key=True, index=True)
    text_zh = Column(Text, nullable=False)
    pinyin = Column(Text, nullable=False)
    translation_ru = Column(Text, nullable=False)
    audio_mp3 = Column(String(255), default="")
    hsk_level = Column(Integer, default=1)
    category = Column(String(50), default="general")


class User(Base):
    """Пользователи приложения."""
    __tablename__ = "users"
    
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, index=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    daily_goal = Column(Integer, default=20)
    
    progress = relationship("UserProgress", back_populates="user")
    flashcards = relationship("Flashcard", back_populates="user")


class UserProgress(Base):
    """Прогресс изучения пользователя."""
    __tablename__ = "user_progress"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    item_type = Column(String(20), nullable=False)  # character, sentence, test
    item_key = Column(String(50), nullable=False)
    correct = Column(Integer, default=0)
    attempts = Column(Integer, default=0)
    streak = Column(Integer, default=0)
    last_reviewed = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    user = relationship("User", back_populates="progress")


class HSKTest(Base):
    """Тесты HSK."""
    __tablename__ = "hsk_tests"
    
    id = Column(Integer, primary_key=True, index=True)
    level = Column(Integer, nullable=False)  # 1-6
    test_type = Column(String(20), nullable=False)  # listening, reading, writing
    question_zh = Column(Text, nullable=False)
    options_json = Column(Text, nullable=False)  # JSON массив вариантов
    answer = Column(String(255), nullable=False)
    audio_mp3 = Column(String(255), default="")
    explanation_ru = Column(Text, default="")


class Flashcard(Base):
    """Флешкарты для Spaced Repetition."""
    __tablename__ = "flashcards"
    
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=True)  # NULL = общие карточки
    front_zh = Column(String(100), nullable=False)
    front_pinyin = Column(String(100), default="")
    back_ru = Column(Text, nullable=False)
    audio_mp3 = Column(String(255), default="")
    hsk_level = Column(Integer, default=1)
    next_review = Column(DateTime, default=datetime.utcnow)
    interval = Column(Integer, default=1)  # дни до следующего повторения
    ease_factor = Column(Float, default=2.5)
    repetitions = Column(Integer, default=0)
    
    user = relationship("User", back_populates="flashcards")


class Phrase(Base):
    """Фразы разговорника."""
    __tablename__ = "phrases"
    
    id = Column(Integer, primary_key=True, index=True)
    category = Column(String(50), nullable=False, index=True)
    subcategory = Column(String(50), default="")
    zh = Column(Text, nullable=False)
    pinyin = Column(Text, nullable=False)
    ru = Column(Text, nullable=False)
    audio_mp3 = Column(String(255), default="")
    is_common = Column(Boolean, default=False)


def get_db():
    """Dependency для получения сессии БД."""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """Инициализация таблиц БД."""
    Base.metadata.create_all(bind=engine)
