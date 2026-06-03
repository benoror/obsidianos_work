#!/usr/bin/env python3
"""
List Gmail threads (label:🤖-ai-transcripts in:inbox), add Google Doc URLs
to meeting Notes: frontmatter (create note if missing), then mark messages read.

This is a batch helper for the /mail-transcripts skill. It runs the Google
Workspace CLI (`gws`) and writes/updates meeting notes under Meetings/.

Adjust to your own vault:
  - LOCAL_TZ      — your timezone offset.
  - GMAIL_Q       — the Gmail search query (label / inbox state).
  - resolve_path() — the title→folder routing rules for your meeting structure.

Frontmatter exception: this script edits YAML inline rather than via the
`obsidian` CLI because it runs as a non-interactive batch job (see
.agents/skills/_shared/frontmatter-mutations.md § Permitted exceptions).
"""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone, timedelta
from pathlib import Path

VAULT = Path(__file__).resolve().parents[1]
MEETINGS = VAULT / "Meetings"
# Set to your local timezone offset (used for created: timestamps).
LOCAL_TZ = timezone(timedelta(hours=-6))
GMAIL_Q = "label:🤖-ai-transcripts in:inbox"

SUBJ_NOTES = re.compile(
    r"Notes:\s*[“\"](.+?)[”\"]\s*([A-Za-z]{3,9}\s+\d{1,2},\s*\d{4})",
    re.DOTALL,
)

# "Document shared with you: 'Title - YYYY/MM/DD HH:MM TZ - Notes by Gemini'"
# Sent when a Gemini Doc is shared (no separate Notes: notification).
SUBJ_DOC_SHARED = re.compile(
    r"Document shared with you:\s*[“\"]"
    r"(.+?)\s+-\s+(\d{4})/(\d{2})/(\d{2})\s+\d{1,2}:\d{2}\s+\S+"
    r"\s+-\s+Notes by Gemini[”\"]?",
    re.DOTALL,
)


def gws_json(args: list[str]) -> dict:
    r = subprocess.run(
        ["gws", *args, "--format", "json"],
        cwd=VAULT,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(r.stderr or r.stdout or "gws failed")
    s = r.stdout.strip()
    if not s.startswith("{"):
        for i, line in enumerate(s.splitlines()):
            if line.strip().startswith("{"):
                s = "\n".join(s.splitlines()[i:])
                break
    return json.loads(s)


def all_bodies(part: dict, acc: list[tuple[str, str]]) -> None:
    data = part.get("body", {}).get("data")
    if data:
        import base64

        raw = base64.urlsafe_b64decode(data + "===").decode("utf-8", errors="replace")
        acc.append((part.get("mimeType", ""), raw))
    for p in part.get("parts") or []:
        all_bodies(p, acc)


def extract_doc_urls(payload: dict) -> list[str]:
    acc: list[tuple[str, str]] = []
    all_bodies(payload, acc)
    urls: list[str] = []
    for _mime, raw in acc:
        urls += re.findall(
            r"https://docs\.google\.com/document/d/[a-zA-Z0-9_-]+(?:/[^\s\"\\)\]<>]*)?",
            raw,
        )
    seen: set[str] = set()
    out: list[str] = []
    for u in urls:
        m = re.search(r"/document/d/([a-zA-Z0-9_-]+)", u)
        if not m:
            continue
        did = m.group(1)
        if did in seen:
            continue
        seen.add(did)
        out.append(f"https://docs.google.com/document/d/{did}/edit")
    return out


def parse_email_date(date_hdr: str) -> str | None:
    from email.utils import parsedate_to_datetime

    try:
        dt = parsedate_to_datetime(date_hdr)
        if dt.tzinfo:
            dt = dt.astimezone(LOCAL_TZ)
        return dt.strftime("%Y-%m-%d")
    except Exception:
        return None


def parse_subject_date(s: str) -> tuple[str, str] | None:
    s = s.strip()
    m = SUBJ_NOTES.match(s)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
        dstr = m.group(2).strip()
        for fmt in ("%b %d, %Y", "%B %d, %Y"):
            try:
                return title, datetime.strptime(dstr, fmt).strftime("%Y-%m-%d")
            except ValueError:
                continue
        return None
    m = SUBJ_DOC_SHARED.search(s)
    if m:
        title = re.sub(r"\s+", " ", m.group(1)).strip()
        ymd = f"{m.group(2)}-{m.group(3)}-{m.group(4)}"
        return title, ymd
    return None


def doc_id(url: str) -> str:
    m = re.search(r"/document/d/([a-zA-Z0-9_-]+)", url)
    return m.group(1) if m else ""


# Recurring meeting whose Gemini summary subject has no `Notes:` pattern.
# Set to a title your team uses, or leave as-is and rely on the date header.
DAILY_STANDUP_TITLE = "Daily Standup"


def resolve_path(title: str, ymd: str) -> Path:
    """Route a Gemini-emailed title to a meeting file path.

    Only deterministic patterns are routed here — anything name-dependent
    (1:1s, cross-team syncs) goes to Meetings/_inbox/ for /organize-meetings
    to handle with qmd + memory-backed conventions.

    These rules are examples — edit them to match your own folder layout.
    """
    t = title.strip()
    tl = t.lower()
    if tl.startswith("daily standup") or t == DAILY_STANDUP_TITLE:
        return MEETINGS / "Engineering" / "Scrum" / f"{ymd}.md"
    if "sprint" in tl and "planning" in tl:
        # "Sprint 9 Planning" -> Sprint 9 Planning 2026-04-17.md
        return MEETINGS / "Engineering" / "Scrum" / f"{t} {ymd}.md"
    if "sprint grooming" in tl:
        return MEETINGS / "Engineering" / "Scrum" / f"Sprint Grooming - {ymd}.md"
    if "sprint" in tl and "retro" in tl:
        return MEETINGS / "Engineering" / "Scrum" / f"{t} {ymd}.md"
    if "roadmap review" in tl:
        return MEETINGS / "Engineering" / f"Roadmap Review - {ymd}.md"
    # Tech Leads / Team Leads weekly
    # Gemini titles seen: "Tech Leads Weekly", "Weekly Team Leads Meeting"
    if "weekly" in tl and ("team lead" in tl or "tech lead" in tl):
        return MEETINGS / "Engineering" / "TechLeads" / f"Tech Leads Weekly - {ymd}.md"
    # Engineering all-hands
    if "all hands" in tl and ("engineering" in tl or "eng " in tl):
        return MEETINGS / "Engineering" / f"Engineering All Hands - {ymd}.md"
    safe = re.sub(r'[<>:"/\\|?*{}]', "", t)[:80].strip()
    # Interview titles ("Interview …", "Technical Interview - …", "(Shadow) … Interview …")
    if (
        tl.startswith("interview ")
        or tl.startswith("technical interview")
        or tl.startswith("(shadow)")
        or " interview " in tl
    ):
        return MEETINGS / "Interviews" / f"{safe} - {ymd}.md"
    # Everything else (1:1s, cross-team syncs, novel patterns) lands in
    # _inbox/ for /organize-meetings to triage using qmd + memory.
    return MEETINGS / "_inbox" / f"{safe} - {ymd}.md"


def split_frontmatter(text: str) -> tuple[str, str] | None:
    if not text.startswith("---"):
        return None
    end = text.find("\n---", 3)
    if end == -1:
        return None
    return text[3:end] + "\n", text[end + 4 :]


def add_notes_url(fm: str, url: str) -> str:
    did = doc_id(url)
    if did and did in fm:
        return fm
    lines = fm.rstrip("\n").split("\n")
    # Notes: block exists?
    try:
        idx = next(i for i, ln in enumerate(lines) if ln.startswith("Notes:"))
    except StopIteration:
        return f"Notes:\n  - {url}\n" + ("\n".join(lines) + "\n" if lines else "")

    j = idx + 1
    while j < len(lines) and lines[j].startswith("  - "):
        if did and did in lines[j]:
            return fm
        j += 1
    lines.insert(j, f"  - {url}")
    return "\n".join(lines) + "\n"


def create_note(path: Path, title: str, url: str, ymd: str) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    created = datetime.now(LOCAL_TZ).replace(microsecond=0).isoformat()
    display = title.strip()
    if "team lead weekly" in display.lower():
        display = "Tech Leads Weekly"
    if ymd not in display:
        display = f"{display} - {ymd}"
    body = f"""---
Notes:
  - {url}
created: {created}
---

# {display}
"""
    path.write_text(body, encoding="utf-8")


def mark_read(msg_id: str) -> None:
    r = subprocess.run(
        [
            "gws",
            "gmail",
            "users",
            "messages",
            "modify",
            "--params",
            json.dumps({"userId": "me", "id": msg_id}),
            "--json",
            json.dumps({"removeLabelIds": ["UNREAD"]}),
        ],
        cwd=VAULT,
        capture_output=True,
        text=True,
    )
    if r.returncode != 0:
        raise RuntimeError(f"mark_read {msg_id}: {r.stderr or r.stdout}")


def main() -> int:
    lst = gws_json(
        [
            "gmail",
            "users",
            "messages",
            "list",
            "--params",
            json.dumps({"userId": "me", "q": GMAIL_Q, "maxResults": 100}),
        ]
    )
    messages = lst.get("messages") or []
    print(f"Found {len(messages)} message(s) matching query.")

    results: list[tuple[str, str, str]] = []  # msg_id, action, detail

    for m in messages:
        mid = m["id"]
        d = gws_json(
            [
                "gmail",
                "users",
                "messages",
                "get",
                "--params",
                json.dumps({"userId": "me", "id": mid, "format": "full"}),
            ]
        )
        headers = {h["name"].lower(): h["value"] for h in d.get("payload", {}).get("headers", [])}
        subj = headers.get("subject", "")
        date_hdr = headers.get("date", "")
        urls = extract_doc_urls(d.get("payload", {}))

        parsed = parse_subject_date(subj)
        if not parsed and subj.strip().lower().startswith(
            f"meeting summary for {DAILY_STANDUP_TITLE.lower()}"
        ):
            parsed = (DAILY_STANDUP_TITLE, parse_email_date(date_hdr) or "")
        if not parsed or not parsed[1]:
            results.append((mid, "skip", f"unparsed subject: {subj!r}"))
            continue
        title, ymd = parsed

        if not urls:
            results.append((mid, "skip_no_doc", subj[:60]))
            mark_read(mid)
            continue

        url = urls[0]
        path = resolve_path(title, ymd)

        if path.exists():
            text = path.read_text(encoding="utf-8")
            sp = split_frontmatter(text)
            if not sp:
                results.append((mid, "err", f"no frontmatter {path}"))
                continue
            fm, body = sp
            new_fm = add_notes_url(fm, url)
            if new_fm == fm:
                results.append((mid, "noop", str(path.relative_to(VAULT))))
            else:
                path.write_text(f"---\n{new_fm}---{body}", encoding="utf-8")
                results.append((mid, "update", str(path.relative_to(VAULT))))
        else:
            create_note(path, title, url, ymd)
            results.append((mid, "create", str(path.relative_to(VAULT))))

        mark_read(mid)

    print("\nSummary:")
    for mid, act, det in results:
        print(f"  {act:12} {det}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
