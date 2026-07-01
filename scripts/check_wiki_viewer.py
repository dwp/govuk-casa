#!/usr/bin/env python3
"""Validate that root viewer.html is synchronized with the public wiki corpora."""

from __future__ import annotations

import sys
from pathlib import Path

import update_viewer

ROOT = Path(__file__).resolve().parents[1]
VIEWER = ROOT / "viewer.html"


def main() -> int:
    graph, errors = update_viewer.build_graph()
    expected = update_viewer.rendered_viewer(graph)

    if not VIEWER.exists():
        errors.append("viewer.html is missing")
    elif VIEWER.read_text(encoding="utf-8") != expected:
        errors.append("viewer.html is not synchronized; run python3 scripts/update_viewer.py")

    if errors:
        print("Wiki viewer validation failed:", file=sys.stderr)
        for error in errors:
            print(f"- {error}", file=sys.stderr)
        return 1

    print(f"Wiki viewer validation passed: {update_viewer.graph_stats(graph)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
