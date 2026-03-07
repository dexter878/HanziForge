# Hanzi Forge 漢字鍛造

**Русско-китайское веб-приложение для изучения китайского языка**

![HSK1-6](https://img.shields.io/badge/HSK-1--6-red)
![Docker](https://img.shields.io/badge/Docker-ready-blue)
![Python](https://img.shields.io/badge/Python-3.9+-green)
![React](https://img.shields.io/badge/React-18-61dafb)

---

## 🚀 Быстрый старт (Docker — рекомендуется)

Самый простой способ запустить на любом компьютере:

### Требования
- [Docker Desktop](https://docs.docker.com/desktop/install/windows-install/) (Windows / macOS / Linux)
- [Git](https://git-scm.com/downloads)

### Запуск

```bash
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge
docker compose up --build -d
```

Первый запуск займёт 2–5 минут (скачивание образов, установка зависимостей, заполнение БД).

### Открыть

| Сервис | URL |
|--------|-----|
| 🌐 Приложение | http://localhost:5004 |
| 📖 API документация | http://localhost:5003/docs |

### Остановить / Перезапустить

```bash
docker compose down          # остановить
docker compose up --build -d # пересобрать и запустить
docker compose logs -f       # логи
```

> 📝 Подробная Docker-инструкция: [DOCKER.md](DOCKER.md)

---

## 💻 Запуск без Docker (для разработки)

### Требования
- Python 3.9+
- Node.js 18+
- npm

### Установка

```bash
# 1. Backend
cd backend
pip install -r requirements.txt
python scripts/populate_db.py

# 2. Frontend
cd ../frontend
npm install
```

### Запуск (два терминала)

**Терминал 1 — Backend:**
```bash
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003
```

**Терминал 2 — Frontend:**
```bash
cd frontend
npm run dev
```

Или одной командой (PowerShell):
```powershell
.\run.ps1
```

Откройте **http://localhost:5004**

---

## 🎯 Возможности

| # | Функция | Описание |
|---|---------|----------|
| 1 | 📖 Словарь | Поиск иероглифов, пиньинь, порядок черт (stroke order) |
| 2 | ✍️ Письмо | Практика написания иероглифов с анимацией |
| 3 | 🧠 Упражнения | Cloze-тесты, перестановки, выбор ответа |
| 4 | 🎥 Видео | HSK видео с интерактивными субтитрами |
| 5 | 📝 Тесты HSK | Аудирование, чтение для всех уровней |
| 6 | 🗂️ Флешкарты | Интервальное повторение (SM-2 алгоритм) |
| 7 | 🗣️ Разговорник | Фразы для путешествий по категориям |
| 8 | 🔤 Пиньинь | Уроки и тренажёр произношения тонов |
| 9 | 📊 Прогресс | Статистика и достижения |

## 🔊 Аудио

- **Кнопка 🔊** — воспроизведение произношения иероглифов
- Озвучка предложений через Web Speech API
- Аудио для тонов пиньинь

## 🏗️ Архитектура

```
HanziForge/
├── backend/                 # Python FastAPI
│   ├── app/
│   │   ├── main.py          # FastAPI приложение
│   │   └── database.py      # SQLite модели
│   ├── scripts/
│   │   └── populate_db.py   # Заполнение БД
│   ├── static/audio/        # MP3 аудиофайлы
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/                # React + Vite
│   ├── src/
│   │   ├── pages/           # Страницы приложения
│   │   ├── components/      # React компоненты
│   │   └── services/        # API сервис
│   ├── Dockerfile
│   └── package.json
├── docker-compose.yml       # Docker оркестрация
├── DOCKER.md                # Инструкция Docker
└── run.ps1                  # Скрипт запуска (Windows)
```

## 🗄️ База данных

SQLite с данными:
- 150 иероглифов (HSK1-2)
- 90 предложений
- 21 HSK тест
- 80 фраз
- 150 флешкарт

## 🔧 API

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

Swagger UI: http://localhost:5003/docs

## 🌙 Интерфейс

- Тёмная тема по умолчанию
- Полностью на русском языке

---

**Hanzi Forge** — русско-китайское приложение для изучения языка 漢字鍛造 🔥
