#!/usr/bin/env python3
"""Unit tests for gmail_ai_transcripts_to_meetings helpers (no network)."""

from __future__ import annotations

import importlib.util
import sys
import unittest
from pathlib import Path

SCRIPT = Path(__file__).resolve().parent / "gmail_ai_transcripts_to_meetings.py"
spec = importlib.util.spec_from_file_location("gmail_ai_transcripts", SCRIPT)
mod = importlib.util.module_from_spec(spec)
assert spec.loader is not None
sys.modules["gmail_ai_transcripts"] = mod
spec.loader.exec_module(mod)


class ParseSubjectDateTests(unittest.TestCase):
    def test_notes_subject(self) -> None:
        subj = 'Notes: "Daily Standup" Feb 24, 2026'
        parsed = mod.parse_subject_date(subj)
        self.assertEqual(parsed, ("Daily Standup", "2026-02-24"))

    def test_doc_shared_subject(self) -> None:
        subj = (
            "Document shared with you: \"Sprint 9 Planning - "
            "2026/04/17 10:00 CDT - Notes by Gemini\""
        )
        parsed = mod.parse_subject_date(subj)
        self.assertEqual(parsed, ("Sprint 9 Planning", "2026-04-17"))

    def test_unrecognized_subject(self) -> None:
        self.assertIsNone(mod.parse_subject_date("Random email subject"))


class ResolvePathTests(unittest.TestCase):
    def test_daily_standup(self) -> None:
        path = mod.resolve_path("Daily Standup", "2026-03-01")
        self.assertEqual(
            path, mod.MEETINGS / "Engineering" / "Scrum" / "2026-03-01.md"
        )

    def test_interview(self) -> None:
        path = mod.resolve_path("Interview Jane Doe", "2026-03-01")
        self.assertEqual(
            path,
            mod.MEETINGS / "Interviews" / "Interview Jane Doe - 2026-03-01.md",
        )

    def test_unknown_goes_to_inbox(self) -> None:
        path = mod.resolve_path("Jane x Alex Sync", "2026-03-01")
        self.assertEqual(
            path,
            mod.MEETINGS / "_inbox" / "Jane x Alex Sync - 2026-03-01.md",
        )


class AddNotesUrlTests(unittest.TestCase):
    def test_appends_new_url(self) -> None:
        fm = "Notes:\n  - https://docs.google.com/document/d/abc/edit\n"
        url = "https://docs.google.com/document/d/xyz/edit"
        out = mod.add_notes_url(fm, url)
        self.assertIn("abc", out)
        self.assertIn("xyz", out)

    def test_idempotent_same_doc(self) -> None:
        fm = "Notes:\n  - https://docs.google.com/document/d/abc/edit\n"
        url = "https://docs.google.com/document/d/abc/edit?tab=t.0"
        self.assertEqual(mod.add_notes_url(fm, url), fm)


if __name__ == "__main__":
    unittest.main()
