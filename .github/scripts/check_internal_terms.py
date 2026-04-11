#!/usr/bin/env python3
"""
Fail the build if public-facing HTML contains internal-only terms.

Flags strings that should never appear on the production LP: agent codenames,
planning labels, internal status markers, etc. Keep the list intentionally
narrow to avoid false positives.
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

# Exact word / phrase matches (case-insensitive, \b-bounded for Latin; raw
# substring for Japanese). Anything on this list means "remove it before
# shipping to the LP".
INTERNAL_TERMS = [
    "Claude",
    "Nova",
    "Mira",
    "Sage",
    "Ledger",
    "Atlas",
    "Cipher",
    "TODO",
    "FIXME",
    "WIP",
    "DO NOT SHIP",
    "Founder only",
    "社内限",
    "社外秘",
    "内部限定",
    "ドラフト",
    "未公開",
    "下書き",
]

# Files to scan. Only public HTML shipped via Cloudflare Pages.
SCAN_PATTERNS = ["*.html"]

# Paths (relative to repo root) that are allowed to contain internal terms
# e.g. internal READMEs, scripts directories.
EXCLUDE_DIRS = {".github", "node_modules", ".git"}


def iter_html_files(root: Path):
    for pattern in SCAN_PATTERNS:
        for path in root.rglob(pattern):
            if any(part in EXCLUDE_DIRS for part in path.relative_to(root).parts):
                continue
            yield path


def scan_file(path: Path) -> list[tuple[int, str, str]]:
    hits: list[tuple[int, str, str]] = []
    try:
        text = path.read_text(encoding="utf-8")
    except UnicodeDecodeError:
        return hits
    lines = text.splitlines()
    for term in INTERNAL_TERMS:
        # Use word boundaries for ASCII terms to avoid false positives
        # (e.g. "Atlas" inside "AtlasBrand"), but raw search for CJK.
        if term.isascii():
            pattern = re.compile(rf"\b{re.escape(term)}\b", re.IGNORECASE)
        else:
            pattern = re.compile(re.escape(term))
        for idx, line in enumerate(lines, start=1):
            if pattern.search(line):
                hits.append((idx, term, line.strip()[:200]))
    return hits


def main() -> int:
    root = Path(__file__).resolve().parents[2]
    total = 0
    for path in iter_html_files(root):
        hits = scan_file(path)
        if not hits:
            continue
        total += len(hits)
        rel = path.relative_to(root)
        for line_no, term, snippet in hits:
            print(f"::error file={rel},line={line_no}::internal term '{term}' found: {snippet}")
    if total:
        print(f"\nFound {total} internal-term violation(s). Remove them before merging.")
        return 1
    print("No internal terms detected in HTML files.")
    return 0


if __name__ == "__main__":
    sys.exit(main())
