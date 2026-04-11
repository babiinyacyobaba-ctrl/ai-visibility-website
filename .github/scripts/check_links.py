#!/usr/bin/env python3
"""
Link health check for the LP.

- Internal relative links (href=..., src=...) must resolve to files in the repo.
- External https:// links are HEAD-requested with a 10s timeout. 2xx/3xx pass.
  4xx/5xx are reported but do not fail the build unless --strict is set, to
  avoid third-party flakiness blocking unrelated PRs.

The goal is to catch typos and file renames, not to police the whole web.
"""
from __future__ import annotations

import argparse
import re
import sys
import urllib.request
import urllib.error
from pathlib import Path
from urllib.parse import urljoin, urlparse

ATTR_PATTERN = re.compile(r'(?:href|src)\s*=\s*["\']([^"\']+)["\']', re.IGNORECASE)
SKIP_PREFIXES = ("mailto:", "tel:", "javascript:", "#", "data:")


def extract_links(html: str) -> list[str]:
    return [m.group(1) for m in ATTR_PATTERN.finditer(html)]


def check_internal(root: Path, html_path: Path, link: str) -> str | None:
    # Strip query / fragment.
    clean = link.split("#", 1)[0].split("?", 1)[0]
    if not clean:
        return None
    if clean.startswith("/"):
        target = root / clean.lstrip("/")
    else:
        target = (html_path.parent / clean).resolve()
    try:
        target.relative_to(root)
    except ValueError:
        return f"escapes repo root: {link}"
    if target.is_dir():
        if (target / "index.html").exists():
            return None
        return f"directory has no index.html: {link}"
    if not target.exists():
        return f"missing file: {link} -> {target.relative_to(root)}"
    return None


def check_external(url: str, timeout: float = 10.0) -> str | None:
    req = urllib.request.Request(url, method="HEAD", headers={"User-Agent": "avi-link-check/1.0"})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as resp:
            if 200 <= resp.status < 400:
                return None
            return f"{url} -> HTTP {resp.status}"
    except urllib.error.HTTPError as exc:
        if exc.code in (403, 405):  # Some CDNs block HEAD; treat as pass.
            return None
        return f"{url} -> HTTP {exc.code}"
    except Exception as exc:  # noqa: BLE001 — we want to catch any transport error
        return f"{url} -> {type(exc).__name__}: {exc}"


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument(
        "--strict-external",
        action="store_true",
        help="Fail build on external link failures (default: warn only).",
    )
    args = parser.parse_args()

    root = Path(__file__).resolve().parents[2]
    internal_errors: list[str] = []
    external_warnings: list[str] = []

    for html_path in sorted(root.rglob("*.html")):
        if ".github" in html_path.parts or ".git" in html_path.parts:
            continue
        text = html_path.read_text(encoding="utf-8", errors="replace")
        rel = html_path.relative_to(root)
        for link in extract_links(text):
            if any(link.startswith(p) for p in SKIP_PREFIXES):
                continue
            parsed = urlparse(link)
            if parsed.scheme in ("http", "https"):
                err = check_external(link)
                if err:
                    msg = f"{rel}: {err}"
                    external_warnings.append(msg)
                    print(f"::warning file={rel}::external link: {err}")
            else:
                err = check_internal(root, html_path, link)
                if err:
                    msg = f"{rel}: {err}"
                    internal_errors.append(msg)
                    print(f"::error file={rel}::internal link: {err}")

    print()
    print(f"Internal link errors: {len(internal_errors)}")
    print(f"External link warnings: {len(external_warnings)}")

    if internal_errors:
        return 1
    if args.strict_external and external_warnings:
        return 1
    return 0


if __name__ == "__main__":
    sys.exit(main())
