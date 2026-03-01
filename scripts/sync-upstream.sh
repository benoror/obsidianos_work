#!/usr/bin/env bash
#
# Sync structural updates from the upstream ObsidianOS repo into your
# private vault. Personal/content files are never overwritten thanks
# to .gitattributes merge=ours rules.
#
# Usage:
#   ./scripts/sync-upstream.sh                  # sync from default remote
#   ./scripts/sync-upstream.sh --preview        # show what's new without merging
#   ./scripts/sync-upstream.sh --remote <name>  # use a different remote name
#
set -euo pipefail

REMOTE="upstream"
BRANCH="main"
PREVIEW_ONLY=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --preview) PREVIEW_ONLY=true; shift ;;
    --remote)  REMOTE="$2"; shift 2 ;;
    --branch)  BRANCH="$2"; shift 2 ;;
    -h|--help)
      echo "Usage: ./scripts/sync-upstream.sh [--preview] [--remote <name>] [--branch <branch>]"
      echo ""
      echo "Options:"
      echo "  --preview   Show new commits and changed files without merging"
      echo "  --remote    Remote name (default: upstream)"
      echo "  --branch    Branch to sync from (default: main)"
      exit 0 ;;
    *) echo "Unknown option: $1"; exit 1 ;;
  esac
done

# --- Ensure we're in a git repo ---
if ! git rev-parse --is-inside-work-tree &>/dev/null; then
  echo "Error: not inside a git repository."
  exit 1
fi

# --- Ensure remote exists ---
if ! git remote get-url "$REMOTE" &>/dev/null; then
  echo "Remote '$REMOTE' not found."
  echo ""
  echo "Add it with:"
  echo "  git remote add $REMOTE <url-to-upstream-repo>"
  echo ""
  echo "Example:"
  echo "  git remote add $REMOTE https://github.com/benoror/obsos_work.git"
  exit 1
fi

# --- Ensure merge driver is configured ---
if ! git config merge.ours.driver &>/dev/null; then
  echo "Setting up 'ours' merge driver (first-time setup)..."
  git config merge.ours.driver true
  git config merge.ours.name "Keep local version (ours)"
  echo "Done."
  echo ""
fi

# --- Check for .gitattributes ---
if [[ ! -f .gitattributes ]]; then
  echo "Warning: .gitattributes not found. Personal files may not be protected during merge."
  echo "See AGENTS.md for setup instructions."
  echo ""
fi

# --- Check for uncommitted changes ---
if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "Warning: you have uncommitted changes. Commit or stash them first."
  echo ""
  git status --short
  exit 1
fi

# --- Fetch ---
echo "Fetching from $REMOTE..."
git fetch "$REMOTE"
echo ""

UPSTREAM="$REMOTE/$BRANCH"

if ! git rev-parse "$UPSTREAM" &>/dev/null; then
  echo "Error: branch '$UPSTREAM' not found. Check remote and branch name."
  exit 1
fi

# --- Show what's new ---
NEW_COMMITS=$(git log HEAD.."$UPSTREAM" --oneline 2>/dev/null)
if [[ -z "$NEW_COMMITS" ]]; then
  echo "Already up to date. No new commits in $UPSTREAM."
  exit 0
fi

echo "New commits from $UPSTREAM:"
echo "$NEW_COMMITS"
echo ""

echo "Files changed:"
git diff HEAD..."$UPSTREAM" --stat
echo ""

if $PREVIEW_ONLY; then
  echo "(preview mode — no changes applied)"
  exit 0
fi

# --- Confirm ---
read -p "Merge these changes? [y/N] " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
  echo "Aborted."
  exit 0
fi

# --- Merge (no auto-commit so we can clean up excluded files) ---
echo ""
echo "Merging $UPSTREAM..."

MERGE_OK=true
if ! git merge "$UPSTREAM" --no-ff --no-commit; then
  MERGE_OK=false
  echo ""

  CONFLICTS=$(git diff --name-only --diff-filter=U)
  if [[ -n "$CONFLICTS" ]]; then
    echo "Merge has conflicts. Resolve them, then run this script again or commit manually."
    echo ""
    echo "Files with conflicts:"
    echo "$CONFLICTS"
    echo ""
    echo "Remember: files listed in .gitattributes should auto-keep your local version."
    echo "If a protected file has conflicts, something may be wrong with the merge driver setup."
    exit 1
  fi
fi

# --- Remove excluded files (.sync-exclude) ---
EXCLUDE_FILE=".sync-exclude"
EXCLUDED_COUNT=0

if [[ -f "$EXCLUDE_FILE" ]]; then
  while IFS= read -r pattern || [[ -n "$pattern" ]]; do
    # Skip comments and blank lines
    [[ -z "$pattern" || "$pattern" == \#* ]] && continue

    # Find staged files matching the glob pattern and remove them
    while IFS= read -r file; do
      [[ -z "$file" ]] && continue
      git rm -f --quiet "$file" 2>/dev/null && {
        echo "  Excluded: $file"
        ((EXCLUDED_COUNT++))
      }
    done < <(git diff --staged --name-only --diff-filter=A | grep -E "^$(echo "$pattern" | sed 's/\*/.*/')\$" 2>/dev/null || true)
  done < "$EXCLUDE_FILE"

  if [[ $EXCLUDED_COUNT -gt 0 ]]; then
    echo ""
    echo "Removed $EXCLUDED_COUNT excluded file(s) from .sync-exclude."
  fi
fi

# --- Commit ---
echo ""

if git diff --staged --quiet; then
  echo "No changes to commit after exclusions."
  git merge --abort 2>/dev/null || true
else
  echo "Staged changes:"
  git diff --staged --stat
  echo ""
  git commit -m "sync: pull structural updates from $REMOTE"
  echo ""
  echo "Merge complete."
  git log -1 --oneline
fi
