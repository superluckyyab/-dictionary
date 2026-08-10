#!/usr/bin/env bash
set -e

REMOTE_HOST="192.168.1.45"
REMOTE_USER="pan"
REMOTE_DIR="/home/pan/workspace/english-dictionary"
PORT=3003

echo "==> Building frontend..."
cd "$(dirname "$0")/frontend"
npm install --legacy-peer-deps
npm run build
cd ..

echo "==> Syncing files to remote..."
sshpass -p "1" rsync -avz --delete \
  --exclude 'frontend/node_modules' \
  --exclude 'backend/.venv' \
  --exclude 'backend/data/*.db' \
  --exclude '__pycache__' \
  --exclude '*.pyc' \
  ./ "${REMOTE_USER}@${REMOTE_HOST}:${REMOTE_DIR}/"

echo "==> Setting up remote environment and starting service..."
sshpass -p "1" ssh "${REMOTE_USER}@${REMOTE_HOST}" bash << ENDSSH
set -e
cd ${REMOTE_DIR}

# Install Python deps
cd backend
if [ ! -d ".venv" ]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -r requirements.txt -q

# Ensure data dir exists
mkdir -p data

# Kill existing process on port
pkill -f "uvicorn app.main:app" 2>/dev/null || true
sleep 1

# Start server in background
nohup .venv/bin/uvicorn app.main:app --host 0.0.0.0 --port ${PORT} > /tmp/dictionary.log 2>&1 &
echo "Server started on port ${PORT}"
echo "PID: \$!"
ENDSSH

echo ""
echo "==> Deployed! Visit: http://${REMOTE_HOST}:${PORT}"
