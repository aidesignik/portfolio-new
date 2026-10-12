#!/usr/bin/env bash
# Pulls the latest work pushed from the remote Claude session and starts
# the local dev server. Run this from the repo root:
#   ./scripts/dev.sh
set -e

BRANCH="claude/app-requirements-discussion-vw8vj4"

git checkout -- package-lock.json
git pull origin "$BRANCH"
# Route files sometimes move between folders (e.g. a page moving to a
# different route group) — Next's incremental build cache doesn't always
# pick that up cleanly, so clear it on every pull rather than risk a
# stale page showing up.
rm -rf .next
npm run dev
