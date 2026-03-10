# Как запушить HanziForge в GitHub и опубликовать Docker-образы

Этот файл описывает полный процесс:

1. закоммитить изменения в локальном репозитории;
2. запушить их в GitHub;
3. дождаться сборки Docker-образов в GitHub Actions;
4. скачать готовые образы из GitHub Container Registry;
5. запустить приложение через Docker без локальной сборки.

Репозиторий:

```text
https://github.com/dexter878/HanziForge
```

## 1. Что уже настроено

В проект уже добавлены:

- workflow GitHub Actions для сборки и публикации образов в `ghcr.io`;
- файл `docker-compose.ghcr.yml` для запуска из готовых образов;
- инструкции в `README.md` и `DOCKER.md`.

После `git push` в ветку `main` GitHub должен автоматически:

- собрать backend-образ;
- собрать frontend-образ;
- запушить их в GitHub Container Registry.

Имена образов:

```text
ghcr.io/dexter878/hanziforge-backend:latest
ghcr.io/dexter878/hanziforge-frontend:latest
```

## 2. Открыть терминал в папке проекта

Откройте PowerShell и перейдите в папку проекта:

```powershell
cd R:\project\HanziForge
```

## 3. Проверить, что git видит изменения

Команда:

```powershell
git status
```

Вы должны увидеть примерно такие файлы:

```text
.github/workflows/docker-publish.yml
docker-compose.ghcr.yml
README.md
DOCKER.md
```

## 4. Добавить файлы в commit

Выполните:

```powershell
git add .github/workflows/docker-publish.yml docker-compose.ghcr.yml README.md DOCKER.md PUSH_TO_GITHUB.md
```

Если хотите добавить вообще все изменения в текущей папке:

```powershell
git add .
```

Используйте `git add .` только если понимаете, что в commit не попадут лишние файлы.

## 5. Создать commit

Выполните:

```powershell
git commit -m "Add GitHub Docker publish instructions and GHCR workflow"
```

Если Git скажет, что нечего коммитить, значит:

- либо изменения уже закоммичены;
- либо файлы не были добавлены через `git add`.

## 6. Запушить в GitHub

Основная команда:

```powershell
git push origin main
```

Если ветка `main` ещё не привязана к удалённому репозиторию, используйте:

```powershell
git push -u origin main
```

## 7. Если репозиторий ещё не подключен к GitHub

Проверьте текущий remote:

```powershell
git remote -v
```

Если `origin` не настроен, добавьте его:

```powershell
git remote add origin https://github.com/dexter878/HanziForge.git
```

Потом выполните:

```powershell
git push -u origin main
```

## 8. Если GitHub просит логин/пароль

Обычно GitHub больше не принимает обычный пароль для `git push` по HTTPS. Нужен один из вариантов:

- GitHub Desktop;
- вход через Git Credential Manager;
- Personal Access Token вместо пароля.

Если push по HTTPS не проходит, проще всего:

1. открыть GitHub в браузере;
2. создать Personal Access Token;
3. при `git push` ввести:
   - логин: ваш GitHub username;
   - пароль: этот token.

## 9. Проверить, что workflow стартовал

После `git push` откройте:

```text
https://github.com/dexter878/HanziForge/actions
```

Там должен появиться workflow:

```text
Publish Docker images
```

Что он делает:

- собирает backend из `backend/Dockerfile`;
- собирает frontend из `frontend/Dockerfile`;
- публикует образы в `ghcr.io`.

## 10. Проверить, что образы появились

Откройте:

```text
https://github.com/dexter878?tab=packages
```

Там должны появиться пакеты контейнеров:

```text
hanziforge-backend
hanziforge-frontend
```

## 11. Сделать образы публичными

Если вы хотите, чтобы любой пользователь мог скачать образ без авторизации, нужно сделать package public.

Обычно это делается так:

1. открыть страницу нужного package в GitHub;
2. зайти в `Package settings`;
3. найти блок `Danger Zone` или настройки visibility;
4. переключить пакет в `Public`.

Если package останется `Private`, скачать его можно будет только после логина в `ghcr.io`.

## 12. Как скачать готовые образы

Если package публичный:

```powershell
docker pull ghcr.io/dexter878/hanziforge-backend:latest
docker pull ghcr.io/dexter878/hanziforge-frontend:latest
```

Если package приватный, сначала войдите:

```powershell
docker login ghcr.io
```

Потом:

```powershell
docker pull ghcr.io/dexter878/hanziforge-backend:latest
docker pull ghcr.io/dexter878/hanziforge-frontend:latest
```

## 13. Как запустить приложение из готовых образов

Из корня проекта:

```powershell
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

Остановить:

```powershell
docker compose -f docker-compose.ghcr.yml down
```

Посмотреть логи:

```powershell
docker compose -f docker-compose.ghcr.yml logs -f
```

## 14. Полная короткая последовательность команд

Если всё уже настроено, используйте просто это:

```powershell
cd R:\project\HanziForge
git add .github/workflows/docker-publish.yml docker-compose.ghcr.yml README.md DOCKER.md PUSH_TO_GITHUB.md
git commit -m "Add GHCR publish workflow and deployment guide"
git push origin main
```

После успешного push:

```powershell
docker login ghcr.io
docker compose -f docker-compose.ghcr.yml pull
docker compose -f docker-compose.ghcr.yml up -d
```

## 15. Частые ошибки

### Ошибка: `fatal: not a git repository`

Вы находитесь не в папке проекта. Перейдите в:

```powershell
cd R:\project\HanziForge
```

### Ошибка: `remote origin already exists`

Это не проблема. Значит remote уже настроен. Просто проверьте:

```powershell
git remote -v
```

И потом выполните:

```powershell
git push origin main
```

### Ошибка: `failed to push some refs`

Обычно это значит:

- удалённая ветка изменилась;
- нужно сначала подтянуть изменения;
- или у вас нет прав на push.

Попробуйте:

```powershell
git pull --rebase origin main
git push origin main
```

### Ошибка: Docker-образы не появились после push

Проверьте:

- выполнился ли workflow в `Actions`;
- не упал ли job сборки;
- есть ли у workflow права `packages: write`;
- пушили ли вы именно в ветку `main`.

## 16. Итог

Минимальный путь такой:

1. выполнить `git add`;
2. выполнить `git commit`;
3. выполнить `git push origin main`;
4. дождаться workflow `Publish Docker images`;
5. выполнить `docker compose -f docker-compose.ghcr.yml pull`;
6. выполнить `docker compose -f docker-compose.ghcr.yml up -d`.
