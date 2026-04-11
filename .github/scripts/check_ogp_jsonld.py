#!/usr/bin/env python3
"""
OGP and JSON-LD validation for public HTML.

For every *.html file in the repo (excluding .github/):

1. OGP: require at least og:title, og:description, og:image.
   - Default: warning only (pre-existing gaps must not block unrelated PRs).
   - Pass --strict-ogp to promote to hard fail.
2. JSON-LD: every <script type="application/ld+json"> block must parse as
   valid JSON. Hard fail — this is a syntax check.

Uses stdlib only (html.parser + json) so CI doesn't need extra deps.
"""
from __future__ import annotations

import argparse
import json
import sys
from html.parser import HTMLParser
from pathlib import Path

REQUIRED_OGP = ("og:title", "og:description", "og:image")
EXCLUDE_DIRS = {".github", ".git", "node_modules"}


class HtmlExtractor(HTMLParser):
    def __init__(self) -> None:
        super().__init__(convert_charrefs=True)
        self.meta_properties: set[str] = set()
        self.jsonld_blocks: list[str] = []
        self._in_jsonld = False
        self._buffer: list[str] = []

    def handle_starttag(self, tag: str, attrs: list[tuple[str, str | None]]) -> None:
        attr = {k.lower(): (v or "") for k, v in attrs}
        if tag == "meta" and "property" in attr:
            self.meta_properties.add(attr["property"].strip().lower())
        if tag == "script" and attr.get("type", "").lower() == "application/ld+json":
            self._in_jsonld = True
            self._buffer = []

    def handle_endtag(self, tag: str) -> None:
        if tag == "script" and self._in_jsonld:
            self.jsonld_blocks.append("".join(self._buffer))
            self._in_jsonld = False
            self._buffer = []

    def handle_data(self, data: str) -> None:
        if self._in_jsonld:
            self._buffer.append(data)


def check_file(root: Path, path: Path) -> tuple[list[str], list[str]]:
    """Return (hard_errors, warnings)."""
    errors: list[str] = []
    warnings: list[str] = []
    rel = path.relative_to(root)
    parser = HtmlExtractor()
    try:
        parser.feed(path.read_text(encoding="utf-8"))
    except Exception as exc:  # noqa: BLE001
        return [f"{rel}: HTML parse error: {exc}"], warnings

    missing = [prop for prop in REQUIRED_OGP if prop not in parser.meta_properties]
    if missing:
        warnings.append(f"{rel}: missing OGP tags: {', '.join(missing)}")

    for idx, block in enumerate(parser.jsonld_blocks, start=1):
        stripped = block.strip()
        if not stripped:
            warnings.append(f"{rel}: JSON-LD block #{idx} is empty")
            continue
        try:
            json.loads(stripped)
        except json.JSONDecodeError as exc:
            errors.append(
                f"{rel}: JSON-LD block #{idx} invalid JSON: "
                f"line {exc.lineno} col {exc.colno}: {exc.msg}"
            )

    return errors, warnings


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict-ogp",
        action="store_true",
        help="Fail on missing OGP tags (default: warn only).",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    all_errors: list[str] = []
    all_warnings: list[str] = []
    file_count = 0
    for path in sorted(root.rglob("*.html")):
        if any(part in EXCLUDE_DIRS for part in path.relative_to(root).parts):
            continue
        file_count += 1
        errors, warnings = check_file(root, path)
        for err in errors:
            all_errors.append(err)
            print(f"::error::{err}")
        for warn in warnings:
            all_warnings.append(warn)
            print(f"::warning::{warn}")

    print()
    print(f"Scanned {file_count} HTML file(s). Errors: {len(all_errors)}, Warnings: {len(all_warnings)}")
    if all_errors:
        return 1
    if args.strict_ogp and all_warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
