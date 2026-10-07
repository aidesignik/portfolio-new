#!/usr/bin/env bash
# Pulls the latest work pushed from the remote Claude session and starts
# the local dev server. Run this from the repo root:
#   ./scripts/dev.sh
set -e

BRANCH="claude/app-requirements-discussion-vw8vj4"

git checkout -- package-lock.json
git pull origin "$BRANCH"
npm run dev
