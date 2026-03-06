# Hanzi Forge 漢字鍛造

**Русско-китайское оффлайн приложение для изучения китайского языка**

![HSK1-6](https://img.shields.io/badge/HSK-1--6-red)
![Оффлайн](https://img.shields.io/badge/Режим-Оффлайн-green)
![PWA](https://img.shields.io/badge/PWA-готово-blue)

## 🚀 Быстрый старт

### Требования
- Python 3.9+
- Node.js 18+
- npm

### Установка (один раз)

```powershell
# 1. Backend зависимости
cd R:\project\HanziForge\backend
pip install -r requirements.txt

# 2. Заполнение базы данных
python scripts/populate_db.py

# 3. Frontend зависимости
cd R:\project\HanziForge\frontend
npm install
```

### Запуск приложения

**Откройте ДВА терминала:**

**Терминал 1 — Backend API (FastAPI):**
```powershell
cd R:\project\HanziForge\backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 5000
```

**Терминал 2 — Frontend (Vite + React):**
```powershell
cd R:\project\HanziForge\frontend
npm run dev
```

### Открыть приложение

После запуска обоих серверов откройте в браузере:

**http://localhost:5001**

> ⚠️ Если порт 5001 занят, Vite автоматически выберет другой (5002, 5003...). 
> Смотрите вывод в терминале!

---

## 🎯 Возможности

| # | Функция | Путь | Описание |
|---|---------|------|----------|
| 1 | 📖 Словарь | `/словарь` | Поиск иероглифов, пиньинь, stroke order |
| 2 | ✍️ Письмо | `/письмо` | Практика написания иероглифов |
| 3 | 🧠 Упражнения | `/изучение` | Cloze, перестановки, выбор ответа |
| 4 | 🎥 Видео | `/видео` | HSK видео с интерактивными субтитрами |
| 5 | 📝 Тесты HSK | `/тесты` | Слушание, чтение для всех уровней |
| 6 | 🗂️ Флешкарты | `/флешкарты` | Spaced Repetition (SM-2 алгоритм) |
| 7 | 🗣️ Разговорник | `/разговорник` | Фразы для путешествий по категориям |
| 8 | 📷 OCR | `/ocr` | Распознавание иероглифов с фото |
| 9 | 📊 Прогресс | `/прогресс` | Статистика и достижения |

## 🔊 Аудио

Каждый иероглиф можно прослушать:
- **Кнопка 🔊** — воспроизведение аудио
- Web Speech API для озвучки предложений

## 📁 Структура проекта

```
HanziForge/
├── backend/
│   ├── app/
│   │   ├── main.py          # FastAPI приложение
│   │   └── database.py      # SQLite модели
│   ├── scripts/
│   │   ├── populate_db.py   # Заполнение БД
│   │   └── generate_audio.py # Генерация MP3
│   ├── hanzi.db             # SQLite база данных
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/      # React компоненты
│   │   ├── pages/           # Страницы (9 вкладок)
│   │   ├── contexts/        # Auth контекст
│   │   └── services/        # API сервис
│   ├── index.html
│   └── package.json
└── README.md
```

## 🗄️ База данных

SQLite с данными:
- 150 иероглифов (HSK1-2)
- 90 предложений
- 21 HSK тест
- 80 фраз
- 150 флешкарт

## 🔧 API Endpoints

```
GET  /api/stats              # Статистика БД
GET  /api/characters         # Список иероглифов
GET  /api/characters/:char   # Детали иероглифа
GET  /api/sentences          # Предложения
GET  /api/tests              # HSK тесты
GET  /api/flashcards         # Флешкарты
GET  /api/phrases            # Разговорные фразы
POST /api/auth/register      # Регистрация
POST /api/auth/login         # Авторизация
```

API документация: http://localhost:5000/docs

## 🌙 Интерфейс

- Тёмная тема по умолчанию
- Полностью на русском языке
- Адаптивный дизайн для мобильных

---

**Hanzi Forge** — лучшее русско-китайское оффлайн приложение! 漢字鍛造 🔥
