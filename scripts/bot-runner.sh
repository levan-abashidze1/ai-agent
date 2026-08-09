#!/usr/bin/env bash
set -e
cd "$(dirname "$0")/../apps/bot"
exec node --import tsx/esm src/index.ts
