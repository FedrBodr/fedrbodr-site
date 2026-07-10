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
FILES=("index.html" "og-image.jpg" "apple-touch-icon.png" "img/avatar.jpg" "img/portrait.jpg")

SSL_OPT=""
if [ "${FTP_SSL:-0}" = "1" ]; then SSL_OPT="--ssl-reqd"; fi

echo "→ Деплой на ${FTP_HOST}:${FTP_DIR}"
for f in "${FILES[@]}"; do
  if [ ! -f "$DIR/$f" ]; then echo "  пропуск (нет файла): $f"; continue; fi
  echo "  ↑ $f"
  curl -sS $SSL_OPT --ftp-create-dirs -T "$DIR/$f" \
    "ftp://${FTP_HOST}/${FTP_DIR%/}/$f" --user "${FTP_USER}:${FTP_PASS}"
done
echo "✓ Готово."
