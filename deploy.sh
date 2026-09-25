#!/usr/bin/env bash
# Деплой сайта fedrbodr на хостинг reg.ru по FTP через curl.
# Запуск: ./deploy.sh   (или автоматически из .git/hooks/post-commit)
set -euo pipefail

DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
CFG="$DIR/deploy.config"

if [ ! -f "$CFG" ]; then
  echo "✗ Нет файла deploy.config."
  echo "  Скопируй шаблон и заполни:  cp deploy.config.example deploy.config"
  exit 1
fi

# shellcheck disable=SC1090
source "$CFG"
: "${FTP_HOST:?нужен FTP_HOST в deploy.config}"
: "${FTP_USER:?нужен FTP_USER в deploy.config}"
: "${FTP_PASS:?нужен FTP_PASS в deploy.config}"
: "${FTP_DIR:?нужен FTP_DIR в deploy.config}"

# Список файлов сайта, которые заливаем
FILES=("index.html" "robots.txt" "sitemap.xml" "og-image.jpg" "apple-touch-icon.png" "img/avatar.jpg" "img/portrait.jpg" "00f8b33c4e8d51284748cf0461484cab.txt" "google99345328012e1bba.html" "yandex_4bd6292e127bb743.html" "privacy.html" ".htaccess" ".well-known/security.txt")

SSL_OPT=""
# TLS 1.2: на TLS 1.3 FTPS-сервер REG.RU подвисает на файлах от ~100 КБ (226 не приходит).
if [ "${FTP_SSL:-0}" = "1" ]; then SSL_OPT="--ssl-reqd --tlsv1.2 --tls-max 1.2"; fi

echo "→ Деплой на ${FTP_HOST}:${FTP_DIR}"
for f in "${FILES[@]}"; do
  if [ ! -f "$DIR/$f" ]; then echo "  пропуск (нет файла): $f"; continue; fi
  echo "  ↑ $f"
  # Заливаем во временный файл и переименовываем только после успешной передачи:
  # обрыв соединения не должен оставить на проде пустой или недокачанный файл.
  name="$(basename "$f")"
  curl -sS $SSL_OPT --ftp-create-dirs --retry 3 --retry-all-errors --max-time 120 \
    -T "$DIR/$f" "ftp://${FTP_HOST}/${FTP_DIR%/}/$f.uploading" \
    -Q "-RNFR $name.uploading" -Q "-RNTO $name" \
    --user "${FTP_USER}:${FTP_PASS}"
done
echo "✓ Готово."
