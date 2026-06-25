#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

# Docker Desktop CLI (se não estiver no PATH)
if ! command -v docker >/dev/null 2>&1; then
  export PATH="/Applications/Docker.app/Contents/Resources/bin:$PATH"
fi

unset DOCKER_HOST
docker context use desktop-linux >/dev/null 2>&1 || true

if ! docker info >/dev/null 2>&1; then
  echo "Docker Desktop não está rodando. Abra o Docker Desktop e tente novamente."
  open -a Docker 2>/dev/null || true
  exit 1
fi

if [ ! -f .env ]; then
  cp .env.example .env
  echo "→ Criado .env a partir de .env.example"
fi

echo "→ Build da imagem..."
docker compose build

echo "→ Subindo container..."
docker compose up -d

echo ""
echo "✓ Remédios rodando em http://localhost:3050"
echo "  Logs:  docker compose logs -f medicine-app"
echo "  Parar: docker compose down"
