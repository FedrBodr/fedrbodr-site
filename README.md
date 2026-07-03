# fedrbodr — личный сайт

Статический сайт-визитка (один `index.html`, RU/EN). Деплой на хостинг **reg.ru** по FTP автоматически на каждый коммит.

## Первый запуск

1. Впиши FTP-доступы (данные в панели reg.ru → «Хостинг» → «FTP-доступ»):
   ```bash
   cp deploy.config.example deploy.config
   # открой deploy.config и заполни FTP_HOST / FTP_USER / FTP_PASS / FTP_DIR
   ```
   `deploy.config` в `.gitignore` — пароль в git не попадёт.

2. Проверь деплой вручную:
   ```bash
   ./deploy.sh
   ```
   Если файл залился — открой сайт в браузере, проверь.

## Автодеплой на коммит

Хук `.git/hooks/post-commit` уже установлен: после каждого `git commit` вызывается `./deploy.sh` и сайт уходит на reg.ru.

- Отключить временно: `chmod -x .git/hooks/post-commit`
- Включить обратно: `chmod +x .git/hooks/post-commit`

> ⚠️ Каждый коммит = деплой в прод, без превью. Если нужно деплоить только из ветки `main` — скажи, поправлю хук.

## Безопасность

FTP передаёт пароль в открытом виде. Если reg.ru поддерживает FTPS — включи `FTP_SSL="1"` в `deploy.config`. Ещё надёжнее — SFTP (могу переписать `deploy.sh` под него).

## Файлы

- `index.html` — сайт
- `deploy.sh` — скрипт заливки по FTP (curl, без зависимостей)
- `deploy.config` — твои доступы (не в git)
- `deploy.config.example` — шаблон доступов
