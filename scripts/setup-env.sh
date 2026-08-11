#!/usr/bin/env bash
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

if [[ -f .env.local ]]; then
  echo ".env.local already exists — leaving unchanged."
else
  cp .env.example .env.local
  echo "Created .env.local from .env.example — add your Supabase publishable key."
fi
