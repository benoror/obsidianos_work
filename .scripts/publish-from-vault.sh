#!/usr/bin/env bash
#
# Copy structural files from a private vault into this ObsidianOS checkout.
# Personal paths never copy. A file whose contents look private is skipped.
# Nothing is pushed. Run this from the public repo, not from the vault.
#
# Usage:
#   ./.scripts/publish-from-vault.sh --vault <path>                         # list candidates
#   ./.scripts/publish-from-vault.sh --vault <path> --yes --message "..." -- path...
#
# One run copies one improvement and makes one commit. Pass --scope when
# that improvement spans directories. Nothing is pushed.
#
set -euo pipefail

VAULT=""
PREVIEW_ONLY=false
YES=false
MESSAGE=""
SCOPE=""
PATHS=()

usage() {
  echo "Usage: ./.scripts/publish-from-vault.sh --vault <path> [--preview]"
  echo "       ./.scripts/publish-from-vault.sh --vault <path> --yes --message \"type(scope): why\" [--scope name] -- path..."
  echo ""
  echo "Options:"
  echo "  --vault     Private vault checkout to read (required). Reads HEAD, not uncommitted files."
  echo "  --preview   List candidates and stop. This is also the default when no paths are given."
  echo "  --message   Commit message for this one improvement. Required to copy."
  echo "  --scope     Name the improvement when paths live in more than one directory."
  echo "  --yes       Copy and commit without prompting."
  echo "  --          File paths to copy. Copy never runs unless you name paths."
  echo ""
  echo "Protected paths come from .gitattributes (merge=ours) in both repos, plus Meetings, Teams,"
  echo "Recaps, Templates, and other vault content. A candidate is also skipped when its text"
  echo "contains an email address, a Slack/Atlassian/Google Doc URL, or a token prefix."
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --vault)   VAULT="$2"; shift 2 ;;
    --preview) PREVIEW_ONLY=true; shift ;;
    --yes)     YES=true; shift ;;
    --message) MESSAGE="$2"; shift 2 ;;
    --scope)   SCOPE="$2"; shift 2 ;;
    --)        shift; PATHS+=("$@"); break ;;
    -h|--help) usage; exit 0 ;;
    *) echo "Unknown option: $1"; usage; exit 1 ;;
  esac
done

if [[ -z "$VAULT" ]]; then
  echo "Error: --vault is required."
  usage
  exit 1
fi

ROOT=$(git rev-parse --show-toplevel 2>/dev/null || true)
if [[ -z "$ROOT" ]]; then
  echo "Error: run this from the ObsidianOS git checkout."
  exit 1
fi
cd "$ROOT"

VAULT=$(cd "$VAULT" && pwd)
if ! git -C "$VAULT" rev-parse --is-inside-work-tree &>/dev/null; then
  echo "Error: $VAULT is not a git repository."
  exit 1
fi

is_structural() {
  case "$1" in
    .agents/*|.scripts/*|.github/*|.cursor/rules/*|\
    AGENTS.md|CLAUDE.md|README.md|OpenCode.md|\
    .gitattributes|.sync-exclude|package.json|package-lock.json)
      return 0 ;;
    *)
      return 1 ;;
  esac
}

# pattern<TAB>path  ->  0 when path is covered
matches_pattern() {
  local pat="$1" path="$2" prefix
  if [[ "$pat" == *"/**" ]]; then
    prefix="${pat%/**}"
    [[ "$path" == "$prefix" || "$path" == "$prefix"/* ]]
  else
    # shellcheck disable=SC2254
    [[ "$path" == $pat ]]
  fi
}

load_protected() {
  local file
  printf '%s\n' \
    'USER.md' 'Tracker.md' '.env' '.cursor/mcp.json' \
    'Meetings/**' 'Teams/**' 'Recaps/**' 'Templates/**' \
    '.obsidian/**' 'Misc/**' 'Archive/**' 'ToDo'\''s.md'
  for file in "$ROOT/.gitattributes" "$VAULT/.gitattributes"; do
    [[ -f "$file" ]] || continue
    while IFS= read -r line || [[ -n "$line" ]]; do
      [[ -z "$line" || "$line" == \#* ]] && continue
      [[ "$line" == *"merge=ours"* ]] || continue
      echo "${line%% *}"
    done < "$file"
  done
}

is_protected() {
  local path="$1" pat
  while IFS= read -r pat; do
    [[ -z "$pat" ]] && continue
    if matches_pattern "$pat" "$path"; then
      return 0
    fi
  done < <(load_protected)
  return 1
}

# Prints a short reason, or nothing when the blob looks publishable.
private_reason() {
  local path="$1" blob
  blob=$(git -C "$VAULT" show "HEAD:$path" 2>/dev/null || true)
  [[ -n "$blob" ]] || return 0
  # git@github.com:org/repo.git is an SSH remote, not an inbox.
  blob=$(printf '%s' "$blob" | sed -E 's/git@[A-Za-z0-9.-]+:/git-ssh:/g')
  if printf '%s' "$blob" | grep -E -q '[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}'; then
    echo "email address"; return 0
  fi
  if printf '%s' "$blob" | grep -E -q 'slack\.com/archives|atlassian\.net|docs\.google\.com|drive\.google\.com'; then
    echo "workspace URL"; return 0
  fi
  if printf '%s' "$blob" | grep -E -q 'AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]|xox[baprs]-|sk-[A-Za-z0-9]'; then
    echo "token prefix"; return 0
  fi
}

declare -a COPY SKIP_PRIVATE SKIP_UNTRACKED
PROTECTED=0
SAME=0

consider() {
  local path="$1" mode reason dest
  mode=$(git -C "$VAULT" ls-tree -r HEAD -- "$path" | awk '{print $1; exit}')
  if [[ -z "$mode" ]]; then
    SKIP_UNTRACKED+=("$path")
    return 0
  fi
  if [[ "$mode" == "120000" ]]; then
    return 0
  fi
  if is_protected "$path"; then
    PROTECTED=$((PROTECTED + 1))
    return 0
  fi
  if ! is_structural "$path"; then
    echo "  Refused (not a structural path): $path"
    return 0
  fi
  dest="$ROOT/$path"
  if [[ -f "$dest" ]] && git -C "$VAULT" show "HEAD:$path" | cmp -s - "$dest"; then
    SAME=$((SAME + 1))
    return 0
  fi
  reason=$(private_reason "$path")
  if [[ -n "$reason" ]]; then
    SKIP_PRIVATE+=("$path ($reason)")
    return 0
  fi
  COPY+=("$path")
}

if [[ ${#PATHS[@]} -gt 0 ]]; then
  for path in "${PATHS[@]}"; do
    consider "$path"
  done
else
  while IFS= read -r path; do
    [[ -n "$path" ]] || continue
    is_structural "$path" || continue
    consider "$path"
  done < <(git -C "$VAULT" ls-tree -r --name-only HEAD)
fi

echo "Vault HEAD: $(git -C "$VAULT" rev-parse --short HEAD)  $VAULT"
echo "Dest:       $(git rev-parse --short HEAD)  $ROOT"
echo ""
echo "Would copy: ${#COPY[@]}"
if [[ ${#COPY[@]} -gt 0 ]]; then
  printf '  %s\n' "${COPY[@]}"
fi
echo "Already same: $SAME"
echo "Protected (not listed): $PROTECTED"
echo "Skipped, looks private: ${#SKIP_PRIVATE[@]}"
if [[ ${#SKIP_PRIVATE[@]} -gt 0 ]]; then
  printf '  %s\n' "${SKIP_PRIVATE[@]}"
fi
if [[ ${#SKIP_UNTRACKED[@]} -gt 0 ]]; then
  echo "Not in vault HEAD: ${#SKIP_UNTRACKED[@]}"
  printf '  %s\n' "${SKIP_UNTRACKED[@]}"
fi
echo ""

if $PREVIEW_ONLY || [[ ${#PATHS[@]} -eq 0 ]]; then
  echo "(preview only — pass paths after -- to copy)"
  exit 0
fi

if [[ ${#COPY[@]} -eq 0 ]]; then
  echo "Nothing to copy."
  exit 0
fi

if [[ -z "$MESSAGE" ]]; then
  echo "Error: --message is required. One run commits one improvement."
  exit 1
fi

scope_of() {
  local path="$1"
  case "$path" in
    .scripts/check-gws-auth.sh|.scripts/ensure-gws-auth.sh) echo "gws-auth" ;;
    .agents/skills/_shared/*) echo "shared:$(basename "$path")" ;;
    .agents/skills/*/*) echo "skill:$(printf '%s' "$path" | awk -F/ '{print $3}')" ;;
    .agents/rules/*) echo "rule:$(basename "$path")" ;;
    .agents/tests/*) echo "tests" ;;
    .scripts/*) echo "script:$(basename "$path")" ;;
    *) echo "file:$path" ;;
  esac
}

if [[ -z "$SCOPE" ]]; then
  scopes=""
  for path in "${COPY[@]}"; do
    s=$(scope_of "$path")
    case " $scopes " in
      *" $s "*) ;;
      *) scopes="$scopes $s" ;;
    esac
  done
  # shellcheck disable=SC2086
  set -- $scopes
  if [[ $# -gt 1 ]]; then
    echo "Error: these paths are more than one improvement. Split them, or pass --scope if they belong together."
    printf '  %s\n' "$@"
    exit 1
  fi
fi

if ! git diff --quiet || ! git diff --staged --quiet; then
  echo "This checkout has uncommitted changes. Commit or stash them before copying."
  git status --short
  exit 1
fi

if ! $YES; then
  read -p "Commit ${#COPY[@]} file(s)? [y/N] " -n 1 -r
  echo ""
  if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Aborted."
    exit 0
  fi
fi

for path in "${COPY[@]}"; do
  mkdir -p "$(dirname "$ROOT/$path")"
  git -C "$VAULT" show "HEAD:$path" > "$ROOT/$path"
  git add -- "$path"
  echo "  Copied: $path"
done

echo ""
git commit -m "$MESSAGE"
echo ""
echo "Committed. Nothing was pushed."
git log -1 --oneline
