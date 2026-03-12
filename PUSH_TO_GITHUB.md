# 🚀 HanziForge — полная инструкция: от кода до развёртывания

Здесь описано **всё**: как запустить локально, как собрать Docker-образы, как запушить в GitHub, как развернуть на любом компьютере.

Репозиторий: `https://github.com/dexter878/HanziForge`

---

## 📋 Содержание

1. [Требования](#1-требования)
2. [Запуск локально без Docker (для разработки)](#2-запуск-локально-без-docker-для-разработки)
3. [Запуск через Docker (локальная сборка)](#3-запуск-через-docker-локальная-сборка)
4. [Запуск из готовых образов GHCR (без сборки)](#4-запуск-из-готовых-образов-ghcr-без-сборки)
5. [Git: коммит и push в GitHub](#5-git-коммит-и-push-в-github)
6. [GitHub Actions: автоматическая сборка и публикация образов](#6-github-actions-автоматическая-сборка-и-публикация-образов)
7. [Развёртывание на новом (чистом) компьютере](#7-развёртывание-на-новом-чистом-компьютере)
8. [Ручной запуск контейнеров (без docker compose)](#8-ручной-запуск-контейнеров-без-docker-compose)
9. [Полезные команды Docker](#9-полезные-команды-docker)
10. [Генерация аудио (опционально, нужен интернет)](#10-генерация-аудио-опционально-нужен-интернет)
11. [Структура проекта](#11-структура-проекта)
12. [Архитектура Docker](#12-архитектура-docker)
13. [Порты и URL-адреса](#13-порты-и-url-адреса)
14. [Частые ошибки и решения](#14-частые-ошибки-и-решения)

---

## 1. Требования

### Для локальной разработки (без Docker)

| Компонент | Версия | Ссылка |
|-----------|--------|--------|
| Python | 3.9+ | https://www.python.org/downloads/ |
| Node.js | 18+ | https://nodejs.org/ |
| npm | идёт с Node.js | — |
| Git | любая | https://git-scm.com/downloads |

### Для Docker-развёртывания

| Компонент | Ссылка |
|-----------|--------|
| Docker Desktop | https://docs.docker.com/desktop/install/windows-install/ |
| Git | https://git-scm.com/downloads |

> ⚠️ На Windows после установки Docker Desktop нужно **перезагрузить компьютер** и убедиться, что Docker Desktop запущен (иконка в трее).

---

## 2. Запуск локально без Docker (для разработки)

### 2.1. Клонировать проект

```powershell
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge
```

### 2.2. Установить зависимости бэкенда

```powershell
cd backend
pip install -r requirements.txt
```

### 2.3. Заполнить базу данных

```powershell
python scripts/populate_db.py
```

БД создаётся в файле `backend/hanzi.db`. Если файл уже есть и непустой — скрипт можно пропустить.

### 2.4. Установить зависимости фронтенда

```powershell
cd ..\frontend
npm install
```

### 2.5. Запуск

**Вариант А — два терминала:**

Терминал 1 (бэкенд):
```powershell
cd backend
python -m uvicorn app.main:app --host 0.0.0.0 --port 5003
```

Терминал 2 (фронтенд):
```powershell
cd frontend
npm run dev
```

**Вариант Б — одной командой (PowerShell):**

```powershell
.\run.ps1
```

Скрипт `run.ps1` сам проверит порты, заполнит БД если надо, запустит бэкенд и фронтенд.

### 2.6. Открыть в браузере

```
http://localhost:5004
```

---

## 3. Запуск через Docker (локальная сборка)

Этот способ собирает Docker-образы из исходного кода прямо на вашем компьютере.

### 3.1. Клонировать проект (если ещё нет)

```powershell
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge
```

### 3.2. Собрать и запустить

```powershell
docker compose up --build -d
```

Эта команда:
- собирает backend-образ из `backend/Dockerfile` (Python 3.11 + FastAPI + uvicorn);
- собирает frontend-образ из `frontend/Dockerfile` (Node.js → Vite build → nginx:alpine);
- создаёт Docker-тома для БД и аудио;
- запускает оба контейнера в фоне;
- бэкенд автоматически заполняет БД при первом запуске через `docker-entrypoint.sh`.

Первый запуск займёт 2–5 минут (скачивание базовых образов Python и Node.js).

### 3.3. Открыть в браузере

```
http://localhost:5004
```

### 3.4. Остановить

```powershell
docker compose down
```

---

## 4. Запуск из готовых образов GHCR (без сборки)

Если образы уже опубликованы в GitHub Container Registry, можно запустить на **любом компьютере** без исходного кода и без сборки.

### 4.1. Авторизоваться в GHCR (если образы приватные)

```powershell
docker login ghcr.io
```

Логин: ваш GitHub username. Пароль: Personal Access Token (с правом `read:packages`).

Если образы публичные — этот шаг можно пропустить.

### 4.2. Скачать образы

```powershell
docker pull ghcr.io/dexter878/hanziforge-backend:latest
docker pull ghcr.io/dexter878/hanziforge-frontend:latest
```

### 4.3. Запустить через docker-compose.ghcr.yml

Вам нужен **только файл** `docker-compose.ghcr.yml` (можно скачать из репозитория). Далее:

```powershell
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

### 4.4. Открыть в браузере

```
http://localhost:5004
```

### 4.5. Остановить

```powershell
docker compose -f docker-compose.ghcr.yml down
```

---

## 5. Git: коммит и push в GitHub

### 5.1. Перейти в папку проекта

```powershell
cd R:\project\HanziForge
```

### 5.2. Проверить статус

```powershell
git status
```

### 5.3. Добавить файлы

Все изменения:
```powershell
git add .
```

Или конкретные файлы:
```powershell
git add backend/app/main.py frontend/src/pages/Dictionary.jsx
```

### 5.4. Создать коммит

```powershell
git commit -m "Описание изменений"
```

### 5.5. Запушить

```powershell
git push origin main
```

Если ветка ещё не привязана:
```powershell
git push -u origin main
```

### 5.6. Если remote не настроен

```powershell
git remote -v
```

Если `origin` не существует:
```powershell
git remote add origin https://github.com/dexter878/HanziForge.git
git push -u origin main
```

### 5.7. Если GitHub просит пароль

GitHub не принимает обычный пароль для HTTPS push. Используйте **Personal Access Token**:

1. Откройте: https://github.com/settings/tokens
2. Создайте токен с правами `repo` и `packages`.
3. При `git push` введите:
   - Логин: ваш GitHub username
   - Пароль: созданный токен

---

## 6. GitHub Actions: автоматическая сборка и публикация образов

### Что происходит автоматически

После каждого `git push` в ветку `main` запускается GitHub Actions workflow (файл `.github/workflows/docker-publish.yml`), который:

1. Собирает `hanziforge-backend` из `backend/Dockerfile`.
2. Собирает `hanziforge-frontend` из `frontend/Dockerfile`.
3. Публикует оба образа в GitHub Container Registry (`ghcr.io`).

### Как проверить статус

Откройте:
```
https://github.com/dexter878/HanziForge/actions
```

Найдите workflow **«Publish Docker images»** — он должен быть зелёным ✅.

### Как проверить, что образы опубликованы

Откройте:
```
https://github.com/dexter878?tab=packages
```

Должны появиться пакеты:
```
hanziforge-backend
hanziforge-frontend
```

### Как сделать образы публичными

1. Откройте страницу пакета в GitHub.
2. Зайдите в **Package settings**.
3. В блоке **Danger Zone** переключите visibility → **Public**.

---

## 7. Развёртывание на новом (чистом) компьютере

### Вариант A — с локальной сборкой из исходников

Нужны: Docker Desktop, Git.

```powershell
# 1. Установить Docker Desktop и перезагрузить
# 2. Клонировать проект
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge

# 3. Собрать и запустить
docker compose up --build -d

# 4. Готово! Открыть http://localhost:5004
```

### Вариант Б — из готовых образов (без сборки, без исходников)

Нужны: только Docker Desktop.

```powershell
# 1. Создать файл docker-compose.ghcr.yml (содержимое ниже)
# 2. Скачать образы и запустить
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d

# 3. Готово! Открыть http://localhost:5004
```

<details>
<summary>📄 Содержимое docker-compose.ghcr.yml</summary>

```yaml
services:
  backend:
    image: ghcr.io/dexter878/hanziforge-backend:latest
    ports:
      - "5003:5003"
    environment:
      DATABASE_URL: sqlite:////data/hanzi.db
      SECRET_KEY: hanzi-forge-secret-key-2024
    volumes:
      - backend_data:/data
      - teacher_audio:/app/static/audio/teacher
    healthcheck:
      test: ["CMD", "python", "-c", "import urllib.request; urllib.request.urlopen('http://127.0.0.1:5003/api/health', timeout=5).read()"]
      interval: 10s
      timeout: 5s
      retries: 5
      start_period: 20s
    restart: unless-stopped

  frontend:
    image: ghcr.io/dexter878/hanziforge-frontend:latest
    environment:
      NGINX_PORT: 5004
      BACKEND_UPSTREAM: backend:5003
    ports:
      - "5004:5004"
    depends_on:
      backend:
        condition: service_healthy
    restart: unless-stopped

volumes:
  backend_data:
  teacher_audio:
```

</details>

### Вариант В — без Docker (ручная установка)

Нужны: Python 3.9+, Node.js 18+, Git.

```powershell
# 1. Клонировать
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge

# 2. Backend
cd backend
pip install -r requirements.txt
python scripts/populate_db.py

# 3. Frontend
cd ..\frontend
npm install

# 4. Запуск
cd ..
.\run.ps1

# 5. Готово! Открыть http://localhost:5004
```

---

## 8. Ручной запуск контейнеров (без docker compose)

Если нет файла `docker-compose.ghcr.yml` и нужно запустить вручную:

```powershell
# 1. Создать сеть
docker network create hanziforge

# 2. Запустить бэкенд
docker run -d `
  --name hanziforge-backend `
  --network hanziforge `
  -p 5003:5003 `
  -e DATABASE_URL=sqlite:////data/hanzi.db `
  -e SECRET_KEY=hanzi-forge-secret-key-2024 `
  -v hanziforge_backend_data:/data `
  -v hanziforge_teacher_audio:/app/static/audio/teacher `
  ghcr.io/dexter878/hanziforge-backend:latest

# 3. Подождать 15 секунд, чтобы бэкенд заполнил БД
Start-Sleep -Seconds 15

# 4. Запустить фронтенд
docker run -d `
  --name hanziforge-frontend `
  --network hanziforge `
  -p 5004:5004 `
  -e NGINX_PORT=5004 `
  -e BACKEND_UPSTREAM=hanziforge-backend:5003 `
  ghcr.io/dexter878/hanziforge-frontend:latest
```

Остановить:
```powershell
docker stop hanziforge-backend hanziforge-frontend
docker rm hanziforge-backend hanziforge-frontend
docker network rm hanziforge
```

---

## 9. Полезные команды Docker

```powershell
# Посмотреть запущенные контейнеры
docker ps

# Логи всех сервисов
docker compose logs -f

# Логи только бэкенда
docker compose logs -f backend

# Логи только фронтенда
docker compose logs -f frontend

# Перезапустить
docker compose restart

# Пересобрать и запустить
docker compose up --build -d

# Остановить
docker compose down

# Удалить всё, включая базу данных (ОСТОРОЖНО!)
docker compose down -v

# Зайти внутрь контейнера бэкенда
docker compose exec backend sh

# Заполнить БД вручную из контейнера
docker compose exec backend python scripts/populate_db.py

# Проверить здоровье бэкенда
docker compose exec backend python -c "import urllib.request; print(urllib.request.urlopen('http://127.0.0.1:5003/api/health').read().decode())"
```

---

## 10. Генерация аудио (опционально, нужен интернет)

Аудиофайлы (MP3) уже включены в проект в `backend/static/audio/`. Они работают оффлайн.

Если нужно **перегенерировать** аудио или добавить новые озвучки, используйте **отдельный скрипт**:

```powershell
cd backend
python scripts/generate_audio.py --help
```

> ⚠️ Этот скрипт использует **gTTS** (Google Text-to-Speech) и **edge-tts** (Microsoft Edge TTS) — они требуют **подключения к интернету**. Скрипт **НЕ** вызывается при обычной работе приложения. Это инструмент для разработчика.

---

## 11. Структура проекта

```
HanziForge/
├── .github/workflows/
│   └── docker-publish.yml       # GitHub Actions: авто-сборка образов
├── backend/
│   ├── app/
│   │   ├── main.py              # FastAPI приложение
│   │   └── database.py          # SQLite модели (SQLAlchemy)
│   ├── scripts/
│   │   ├── populate_db.py       # Заполнение БД (150 иероглифов, 90 предложений и т.д.)
│   │   ├── generate_audio.py    # Генерация MP3 (требует интернет, НЕ для runtime)
│   │   └── fix_encoding.py      # Утилита для исправления кодировки
│   ├── static/audio/            # Предгенерированные MP3 файлы (424 шт.)
│   ├── hanzi.db                 # SQLite база данных
│   ├── docker-entrypoint.sh     # Авто-заполнение БД при первом запуске в Docker
│   ├── Dockerfile               # python:3.11-slim + uvicorn
│   └── requirements.txt         # Python-зависимости
├── frontend/
│   ├── src/
│   │   ├── pages/               # React-страницы (Dictionary, Writing, Pinyin и т.д.)
│   │   ├── components/          # React-компоненты (AudioButton и т.д.)
│   │   └── services/            # API-клиент, offlineAssets
│   ├── public/
│   │   ├── fonts/               # Локальные шрифты (5 файлов, ~38 МБ)
│   │   ├── tesseract/           # Локальный WASM OCR (Tesseract.js)
│   │   └── hanzi-writer-data/   # Локальные данные stroke order
│   ├── nginx.conf               # Конфигурация nginx (проксирование API)
│   ├── Dockerfile               # Node.js build → nginx:alpine
│   └── package.json             # React 18 + Vite + TailwindCSS
├── docker-compose.yml           # Локальная сборка из исходников
├── docker-compose.ghcr.yml      # Запуск из готовых образов GHCR
├── run.ps1                      # PowerShell-скрипт запуска (без Docker)
├── README.md                    # Краткая документация
├── DOCKER.md                    # Docker-инструкция
└── PUSH_TO_GITHUB.md            # ← ВЫ ЗДЕСЬ
```

---

## 12. Архитектура Docker

```
┌─────────────────────────────────────────────────┐
│              docker compose                     │
│                                                 │
│  ┌─────────────────┐   ┌─────────────────────┐  │
│  │    backend       │   │     frontend        │  │
│  │  python:3.11     │   │   nginx:alpine      │  │
│  │  FastAPI+uvicorn │◄──│   static SPA        │  │
│  │  порт 5003       │   │   порт 5004         │  │
│  └────────┬─────────┘   └─────────────────────┘  │
│           │                                      │
│  ┌────────┴─────────┐  ┌──────────────────────┐  │
│  │ SQLite (volume)  │  │ Teacher Audio (vol.)  │  │
│  │ /data/hanzi.db   │  │ /app/static/audio/    │  │
│  └──────────────────┘  └──────────────────────┘  │
└─────────────────────────────────────────────────┘
```

**Потоки данных:**
- Браузер → `localhost:5004` (nginx) → SPA (React)
- SPA → `localhost:5004/api/*` → nginx прокси → `backend:5003` (FastAPI)
- SPA → `localhost:5004/static/*` → nginx прокси → `backend:5003` (аудиофайлы)

---

## 13. Порты и URL-адреса

| Сервис | Порт | URL |
|--------|------|-----|
| Frontend (приложение) | 5004 | http://localhost:5004 |
| Backend (API) | 5003 | http://localhost:5003 |
| Swagger документация | 5003 | http://localhost:5003/docs |

Если порты заняты, измените маппинг в `docker-compose.yml`:

```yaml
ports:
  - "8080:5003"    # бэкенд будет на localhost:8080
  - "8081:5004"    # фронтенд будет на localhost:8081
```

---

## 14. Частые ошибки и решения

### `fatal: not a git repository`

Вы не в папке проекта:
```powershell
cd R:\project\HanziForge
```

### `remote origin already exists`

Это ок. Просто проверьте и пушьте:
```powershell
git remote -v
git push origin main
```

### `failed to push some refs`

Удалённая ветка изменилась. Подтяните изменения:
```powershell
git pull --rebase origin main
git push origin main
```

### Docker-образы не появились после push

Проверьте:
1. Workflow запустился: https://github.com/dexter878/HanziForge/actions
2. Job не упал с ошибкой.
3. У workflow есть права `packages: write` (уже настроено в `docker-publish.yml`).
4. Пушили именно в ветку `main`.

### Порт 5003 или 5004 уже занят

Найдите процесс и остановите:
```powershell
netstat -ano | findstr :5003
# Запомните PID и остановите:
taskkill /PID <PID> /F
```

Или смените порт в `docker-compose.yml`.

### База данных пустая

```powershell
# Через docker compose:
docker compose exec backend python scripts/populate_db.py

# Без Docker:
cd backend
python scripts/populate_db.py
```

### Полный сброс Docker (пересоздать всё с нуля)

```powershell
docker compose down -v
docker compose up --build -d
```

---

## 🏁 Шпаргалка: минимальные команды

### Push в GitHub + авто-сборка образов

```powershell
cd R:\project\HanziForge
git add .
git commit -m "Описание изменений"
git push origin main
```

### Запуск на новом компьютере (из готовых образов)

```powershell
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
# Открыть http://localhost:5004
```

### Запуск на новом компьютере (из исходников)

```powershell
git clone https://github.com/dexter878/HanziForge.git
cd HanziForge
docker compose up --build -d
# Открыть http://localhost:5004
```
