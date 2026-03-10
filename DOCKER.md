# 🐳 Развёртывание HanziForge через Docker

## Требования

- **Docker Desktop** — скачать и установить:
  - Windows: https://docs.docker.com/desktop/install/windows-install/
  - macOS: https://docs.docker.com/desktop/install/mac-install/
  - Linux: https://docs.docker.com/desktop/install/linux/
- **Git** — https://git-scm.com/downloads

> ⚠️ На Windows после установки Docker Desktop нужно **перезагрузить компьютер** и убедиться, что Docker Desktop запущен (иконка в трее).

---

## 🚀 Быстрый старт (для нового компьютера)

### 1. Клонируйте репозиторий

```bash
git clone https://github.com/<ваш-username>/HanziForge.git
cd HanziForge
```

### 2. Запустите приложение

```bash
docker compose up --build -d
```

### Запуск без сборки, только из готовых образов

Когда workflow `Publish Docker images` опубликует контейнеры в GitHub Container Registry, можно запускать приложение так:

```bash
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

Ручной запуск отдельных образов:

```bash
docker pull ghcr.io/dexter878/hanziforge-backend:latest
docker pull ghcr.io/dexter878/hanziforge-frontend:latest
```

Пример запуска на любой машине без локальной сборки:

```bash
docker network create hanziforge

docker run -d \
  --name backend \
  --network hanziforge \
  -p 5003:5003 \
  -e DATABASE_URL=sqlite:////data/hanzi.db \
  -e SECRET_KEY=hanzi-forge-secret-key-2024 \
  -v hanziforge_backend_data:/data \
  -v hanziforge_teacher_audio:/app/static/audio/teacher \
  ghcr.io/dexter878/hanziforge-backend:latest

docker run -d \
  --name frontend \
  --network hanziforge \
  -p 5004:5004 \
  -e NGINX_PORT=5004 \
  -e BACKEND_UPSTREAM=backend:5003 \
  ghcr.io/dexter878/hanziforge-frontend:latest
```

Если пакет в GitHub ещё приватный, для скачивания нужен логин:

```bash
docker login ghcr.io
```

Первый запуск займёт 2–5 минут (скачивание образов Python и Node.js, установка зависимостей, заполнение базы данных).

### 3. Откройте в браузере

| Сервис | URL |
|--------|-----|
| 🌐 Приложение | http://localhost:5004 |
| 📖 API документация | http://localhost:5003/docs |

**Готово!** 🎉

---

## 📋 Полезные команды

```bash
# Остановить
docker compose down

# Перезапустить
docker compose restart

# Посмотреть логи
docker compose logs -f

# Логи только бэкенда
docker compose logs -f backend

# Логи только фронтенда
docker compose logs -f frontend

# Пересобрать и запустить (после обновления кода)
docker compose up --build -d

# Удалить всё (включая данные БД!)
docker compose down -v
```

---

## 🔄 Обновление

Когда появятся обновления в GitHub:

```bash
git pull
docker compose up --build -d
```

---

## ❓ Частые проблемы

### «Docker не найден» / «docker compose not found»

Убедитесь, что Docker Desktop запущен. На Linux может потребоваться:
```bash
sudo apt install docker-compose-plugin
```

### Порт 5003 или 5004 уже занят

Остановите процесс, который занимает порт, или измените порты в `docker-compose.yml`:
```yaml
ports:
  - "8080:5003"    # вместо 5003
  - "8081:5004"    # вместо 5004
```

### База данных пустая

База данных автоматически заполняется при первом запуске. Если это не произошло:
```bash
docker compose exec backend python scripts/populate_db.py
```

### Нужно полностью пересоздать

```bash
docker compose down -v
docker compose up --build -d
```

---

## 🏗️ Архитектура Docker

```
┌─────────────────────────────────────────┐
│           docker compose                │
│                                         │
│  ┌──────────────┐  ┌────────────────┐   │
│  │   backend     │  │   frontend     │   │
│  │  Python 3.11  │  │  nginx:alpine  │   │
│  │  FastAPI      │◄─│  static files  │   │
│  │  :5003        │  │  :5004→5004    │   │
│  └──────┬───────┘  └────────────────┘   │
│         │                               │
│  ┌──────┴───────┐                       │
│  │  SQLite DB   │                       │
│  │  (volume)    │                       │
│  └──────────────┘                       │
└─────────────────────────────────────────┘
```
