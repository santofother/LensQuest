#!/usr/bin/env bash
set -Eeuo pipefail

project_dir="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
cd "$project_dir"

pull_latest=true
if [[ "${1:-}" == "--no-pull" ]]; then
  pull_latest=false
elif [[ $# -gt 0 ]]; then
  echo "Usage: ./build.sh [--no-pull]" >&2
  exit 2
fi

if ! command -v docker >/dev/null 2>&1; then
  echo "Docker is not installed or is not available in PATH." >&2
  exit 1
fi

if ! docker compose version >/dev/null 2>&1; then
  echo "Docker Compose is not available. Install the Docker Compose plugin." >&2
  exit 1
fi

if ! docker info >/dev/null 2>&1; then
  echo "The Docker daemon is not running or your user cannot access it." >&2
  exit 1
fi

if [[ ! -f .env ]]; then
  if [[ -f .env.example ]]; then
    cp .env.example .env
  fi
  echo "A local .env file is required. Add your Cloudflare Tunnel token to $project_dir/.env, then run this script again." >&2
  exit 1
fi

tunnel_token="$(sed -n 's/^CLOUDFLARE_TUNNEL_TOKEN=//p' .env | tail -n 1)"
if [[ -z "$tunnel_token" || "$tunnel_token" == *"replace-with"* ]]; then
  echo "CLOUDFLARE_TUNNEL_TOKEN is missing or still contains the placeholder value in .env." >&2
  exit 1
fi
unset tunnel_token

if [[ "$pull_latest" == true && -d .git ]]; then
  if [[ -n "$(git status --porcelain --untracked-files=no)" ]]; then
    echo "Tracked files have local changes. Commit or restore them, or run ./build.sh --no-pull." >&2
    exit 1
  fi
  echo "Updating LensQuest…"
  git pull --ff-only
fi

echo "Building and starting LensQuest…"
docker compose --env-file .env up -d --build

echo
echo "LensQuest container status:"
docker compose --env-file .env ps
