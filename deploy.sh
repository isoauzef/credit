#!/bin/bash
set -euo pipefail

APP_DIR=${APP_DIR:-/var/www/credit}
PM2_NAME=${PM2_NAME:-credit-app}

if [ ! -f "$APP_DIR/.env" ]; then
  echo "Missing $APP_DIR/.env" >&2
  exit 1
fi

cd "$APP_DIR"
git pull --ff-only origin main
npm ci
npx prisma generate
npx prisma migrate deploy
npm run build

if pm2 describe "$PM2_NAME" >/dev/null 2>&1; then
  pm2 restart "$PM2_NAME" --update-env
else
  pm2 start server/index.js --name "$PM2_NAME" --update-env
fi

pm2 save
curl -fsS http://127.0.0.1:${API_PORT:-3002}/api/health
echo "Credit deployment complete."
