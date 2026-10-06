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

Деплой идёт по FTPS (`FTP_SSL="1"`). `FTP_HOST` должен быть именем сервера (`server52.hosting.reg.ru`), а не IP: сертификат выписан на имя. Обычный FTP на shared-хостинге REG.RU закрыть нельзя — просто не используй его.

## Файлы

- `index.html` — сайт
- `deploy.sh` — скрипт заливки по FTP (curl, без зависимостей)
- `go/.htaccess` — короткие ссылки `fedrbodr.com/go/<код>` на адреса с UTM-метками
- `deploy.config` — твои доступы (не в git)
- `deploy.config.example` — шаблон доступов
