#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
export HOME="${ROOT_DIR}/.home"
export npm_config_cache="${ROOT_DIR}/.npm-cache"

mkdir -p "${HOME}" "${npm_config_cache}"

npm install
npm run setup
