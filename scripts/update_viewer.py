#!/usr/bin/env python3
"""Generate root viewer.html from the CASA OKF wiki Markdown bundle."""

from __future__ import annotations

import argparse
from dataclasses import dataclass
import json
import os
import re
import sys
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
VIEWER = ROOT / "viewer.html"
LINK_RE = re.compile(r"(?<!!)\[([^\]]+)\]\(([^)]+)\)")
HEADING_RE = re.compile(r"^#\s+(.+)$", re.MULTILINE)
NOTE_TYPE_LABELS = {
    "architecture": "Architecture",
    "data-readme": "Data Index",
    "demo-guide": "Guide",
    "entity": "Entity",
    "evaluation-benchmark": "Evaluation",
    "index": "Index",
    "interface": "Interface",
    "lint-report": "Lint Report",
    "log": "Log",
    "map": "Map",
    "topic": "Topic",
}
REPO_URL = "https://github.com/dwp/govuk-casa"


@dataclass(frozen=True)
class Corpus:
    id: str
    label: str
    title: str
    subtitle: str
    root: Path
    source_root: str
    required_files: tuple[str, ...]
    preferred_sections: tuple[str, ...]
    markdown_url: str


CORPORA = [
    Corpus(
        id="casa",
        label="CASA OKF",
        title="GOV.UK CASA OKF Wiki",
        subtitle="Open Knowledge Format viewer for @dwp/govuk-casa concepts, examples, playbooks, and references",
        root=ROOT / "wiki",
        source_root="wiki",
        required_files=(
            "index.md",
            "log.md",
            "concepts/casa-framework.md",
            "concepts/configure.md",
            "concepts/plan.md",
            "concepts/journey-context.md",
            "concepts/validation.md",
            "examples/index.md",
            "playbooks/index.md",
            "references/okf-spec.md",
        ),
        preferred_sections=("root", "concepts", "examples", "playbooks", "references"),
        markdown_url="wiki/index.md",
    ),
]


def rel_to_corpus(corpus: Corpus, path: Path) -> str:
    return path.relative_to(corpus.root).as_posix()


def iter_markdown(corpus: Corpus) -> list[Path]:
    return sorted(corpus.root.rglob("*.md"), key=lambda path: rel_to_corpus(corpus, path))


def parse_frontmatter(corpus: Corpus, path: Path) -> tuple[dict[str, str], str]:
    text = path.read_text(encoding="utf-8")
    rel = f"{corpus.source_root}/{rel_to_corpus(corpus, path)}"
    if not text.startswith("---\n"):
        if path.name in {"index.md", "log.md"}:
            return {}, text.strip("\n")
        raise ValueError(f"{rel} is missing YAML frontmatter")
    end = text.find("\n---", 4)
    if end == -1:
        raise ValueError(f"{rel} has unterminated YAML frontmatter")
    raw = text[4:end]
    body = text[end + 4 :].lstrip("\n").strip("\n")
    meta: dict[str, str] = {}
    current_key: str | None = None
    for line in raw.splitlines():
        stripped = line.strip()
        if not stripped or stripped.startswith("#"):
            continue
        if ":" in line and not line.startswith(" "):
            key, value = line.split(":", 1)
            key = key.strip()
            value = value.strip()
            if value.startswith(("'", '"')) and value.endswith(("'", '"')):
                value = value[1:-1]
            meta[key] = value
            current_key = key
        elif current_key and stripped.startswith("-"):
            value = stripped[1:].strip().strip("'\"")
            prior = meta.get(current_key, "")
            meta[current_key] = ";".join(x for x in [prior, value] if x)
    return meta, body


def plain(text: str) -> str:
    text = re.sub(r"`([^`]+)`", r"\1", text)
    text = re.sub(r"\*\*([^*]+)\*\*", r"\1", text)
    text = re.sub(r"!\[([^\]]*)\]\([^)]+\)", r"\1", text)
    text = re.sub(r"\[([^\]]+)\]\([^)]+\)", r"\1", text)
    return text.strip(" #`*_")


def title_for(path_id: str, meta: dict[str, str], body: str) -> str:
    if meta.get("title"):
        return plain(meta["title"])
    match = HEADING_RE.search(body)
    if match:
        return plain(match.group(1))
    return Path(path_id).stem.replace("-", " ").replace("_", " ").title()


def description_for(meta: dict[str, str], body: str) -> str:
    if meta.get("description"):
        return plain(meta["description"])
    for paragraph in re.split(r"\n\s*\n", body):
        stripped = paragraph.strip()
        if not stripped or stripped.startswith("#") or stripped.startswith("- ") or stripped.startswith("|"):
            continue
        return plain(stripped.splitlines()[0])[:260]
    return ""


def type_for(path_id: str, meta: dict[str, str]) -> str:
    if meta.get("type"):
        return meta["type"]
    if Path(path_id).name == "index.md":
        return "Index"
    if Path(path_id).name == "log.md":
        return "Log"
    if meta.get("note_type") in NOTE_TYPE_LABELS:
        return NOTE_TYPE_LABELS[meta["note_type"]]
    if meta.get("source_id"):
        return "Source"
    return path_id.split("/", 1)[0].replace("-", " ").title() if "/" in path_id else "Document"


def section_for(path_id: str) -> str:
    return path_id.split("/", 1)[0] if "/" in path_id else "root"


def route_slug(value: str) -> str:
    slug = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return slug or "index"


def route_aliases(path_id: str, meta: dict[str, str]) -> list[str]:
    aliases = {route_slug(Path(path_id).with_suffix("").as_posix())}
    if "/" not in path_id:
        aliases.add(route_slug(Path(path_id).stem))
    if section_for(path_id) == "exchanges" and meta.get("exchange_id"):
        aliases.add(route_slug(meta["exchange_id"]))
    if path_id == "index.md":
        aliases.add("index")
    return sorted(aliases)


def edge_type(label: str, source_id: str, target_id: str) -> str:
    text = plain(label).lower()
    source_section = section_for(source_id)
    target_section = section_for(target_id)
    if "previous" in text:
        return "previous exchange"
    if "next" in text:
        return "next exchange"
    if "start-to-finish" in text or "conversation reader" in text:
        return "conversation reader"
    if text == "note" or target_section == "exchanges":
        return "exchange note"
    if text in {"read", "reader"} or target_section == "readers":
        return "reader"
    if "related" in text or (source_section == "sources" and target_section == "sources"):
        return "related source"
    if text == "open" or target_section == "sources":
        return "source evidence"
    return "wiki link"


def resolve_link(corpus: Corpus, source_id: str, href: str) -> tuple[str | None, bool]:
    href = href.strip()
    if not href or href.startswith("#"):
        return None, False
    if "[" in href or "]" in href:
        return None, False
    if re.match(r"^[a-zA-Z][a-zA-Z0-9+.-]*:", href):
        return None, False
    href = unquote(href.split("#", 1)[0].split("?", 1)[0])
    if not href:
        return None, False

    source_path = corpus.root / source_id
    if href.startswith("/"):
        target_path = (corpus.root / href.lstrip("/")).resolve()
    else:
        target_path = (source_path.parent / href).resolve()
    if href.endswith("/") or target_path.is_dir():
        target_path = target_path / "index.md"
    try:
        target_id = target_path.relative_to(corpus.root.resolve()).as_posix()
    except ValueError:
        return None, False
    return os.path.normpath(target_id).replace("\\", "/"), True


def find_edges(corpus: Corpus, path_id: str, body: str, known_ids: set[str]) -> tuple[set[tuple[str, str, str, str]], list[str]]:
    edges: set[tuple[str, str, str, str]] = set()
    errors: list[str] = []
    for match in LINK_RE.finditer(body):
        target, inside_corpus = resolve_link(corpus, path_id, match.group(2))
        if not target or not target.endswith(".md"):
            continue
        if target in known_ids:
            label = plain(match.group(1))
            edges.add((path_id, target, edge_type(label, path_id, target), label))
        elif inside_corpus:
            errors.append(f"{corpus.source_root}/{path_id} links to missing Markdown file {corpus.source_root}/{target}")
    return edges, errors


def build_corpus(corpus: Corpus) -> tuple[dict[str, object], list[str]]:
    nodes: dict[str, dict[str, str]] = {}
    parsed: dict[str, tuple[dict[str, str], str]] = {}
    errors: list[str] = []

    for path in iter_markdown(corpus):
        path_id = rel_to_corpus(corpus, path)
        try:
            meta, body = parse_frontmatter(corpus, path)
        except ValueError as exc:
            errors.append(str(exc))
            continue
        parsed[path_id] = (meta, body)
        nodes[path_id] = {
            "id": path_id,
            "type": type_for(path_id, meta),
            "title": title_for(path_id, meta, body),
            "description": description_for(meta, body),
            "timestamp": meta.get("timestamp") or meta.get("updated") or meta.get("generated_at") or "",
            "aliases": meta.get("aliases", ""),
            "tags": meta.get("tags", ""),
            "route_aliases": route_aliases(path_id, meta),
            "exchange_id": meta.get("exchange_id", ""),
            "source_id": meta.get("source_id", ""),
            "section": section_for(path_id),
            "source": f"{corpus.source_root}/{path_id}",
            "body": body,
        }

    for path_id in sorted(set(corpus.required_files).difference(nodes)):
        errors.append(f"{corpus.source_root}/{path_id} is missing from the viewer graph")

    route_owner: dict[str, str] = {}
    for path_id, node in nodes.items():
        for alias in node["route_aliases"]:  # type: ignore[index]
            if alias in route_owner and route_owner[alias] != path_id:
                errors.append(
                    f"{corpus.source_root}/{path_id} and {corpus.source_root}/{route_owner[alias]} share route #{alias}"
                )
            route_owner[alias] = path_id

    known_ids = set(nodes)
    edge_set: set[tuple[str, str, str, str]] = set()
    for path_id, (_meta, body) in parsed.items():
        edges, link_errors = find_edges(corpus, path_id, body, known_ids)
        edge_set.update(edges)
        errors.extend(link_errors)

    sections = sorted({node["section"] for node in nodes.values()})
    ordered_sections = [section for section in corpus.preferred_sections if section in sections]
    ordered_sections.extend(section for section in sections if section not in ordered_sections)
    graph = {
        "id": corpus.id,
        "label": corpus.label,
        "title": corpus.title,
        "subtitle": corpus.subtitle,
        "root": "index.md",
        "source_root": corpus.source_root,
        "markdown_url": corpus.markdown_url,
        "sections": ordered_sections,
        "nodes": nodes,
        "edges": [list(edge) for edge in sorted(edge_set)],
    }
    return graph, errors


def build_graph() -> tuple[dict[str, object], list[str]]:
    corpora: dict[str, object] = {}
    errors: list[str] = []
    for corpus in CORPORA:
        graph, corpus_errors = build_corpus(corpus)
        corpora[corpus.id] = graph
        errors.extend(corpus_errors)

    bundle = {
        "meta": {
            "title": "GOV.UK CASA OKF Wiki",
            "default_corpus": "casa",
            "generated_by": "scripts/update_viewer.py",
            "repository_url": REPO_URL,
            "repository_branch": "main",
            "corpus_order": [corpus.id for corpus in CORPORA],
        },
        "corpora": corpora,
    }
    return bundle, errors


def rendered_viewer(graph: dict[str, object]) -> str:
    graph_json = json.dumps(graph, ensure_ascii=False, separators=(",", ":"))
    return VIEWER_TEMPLATE.replace("__GRAPH_JSON__", graph_json)


def graph_stats(bundle: dict[str, object]) -> str:
    corpora = bundle["corpora"]
    assert isinstance(corpora, dict)
    parts: list[str] = []
    for corpus_id in bundle["meta"]["corpus_order"]:  # type: ignore[index]
        corpus = corpora[corpus_id]
        assert isinstance(corpus, dict)
        parts.append(f"{corpus['label']}: {len(corpus['nodes'])} pages, {len(corpus['edges'])} links")
    return "; ".join(parts)


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--check", action="store_true", help="fail if viewer.html is not synchronized")
    args = parser.parse_args(argv)

    graph, errors = build_graph()
    if errors:
        for error in errors:
            print(error, file=sys.stderr)
        return 1

    rendered = rendered_viewer(graph)
    if args.check:
        if not VIEWER.exists() or VIEWER.read_text(encoding="utf-8") != rendered:
            print("viewer.html is not synchronized; run python3 scripts/update_viewer.py", file=sys.stderr)
            return 1
        print(f"viewer.html is synchronized with {graph_stats(graph)}")
        return 0

    if VIEWER.exists() and VIEWER.read_text(encoding="utf-8") == rendered:
        print(f"viewer.html already synchronized with {graph_stats(graph)}")
    else:
        VIEWER.write_text(rendered, encoding="utf-8")
        print(f"updated viewer.html with {graph_stats(graph)}")
    return 0


VIEWER_TEMPLATE = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>GOV.UK CASA OKF Wiki</title>
<style>
:root{color-scheme:dark;--bg:#0f1215;--panel:#171c22;--panel2:#222932;--panel3:#2c3540;--line:#3b4653;--text:#f2f5f8;--muted:#a8b2bf;--accent:#4cc9a7;--accent2:#7aa7ff;--warn:#f2bd63}
*{box-sizing:border-box}html,body{height:100%;margin:0}body{height:100dvh;background:var(--bg);color:var(--text);font:14px/1.5 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif;overflow:hidden}.shell{height:100dvh;display:flex;flex-direction:column;min-height:0}
header{flex:0 0 auto;min-height:70px;border-bottom:1px solid var(--line);display:flex;align-items:center;gap:8px;padding:10px 14px;background:#11161b;min-width:0}.titleblock{min-width:240px}h1{font-size:18px;line-height:1.12;margin:0}.sub{color:var(--muted);font-size:12px;max-width:760px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.spacer{flex:1}.btn{height:34px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--text);padding:0 11px;cursor:pointer;text-decoration:none;display:inline-flex;align-items:center;justify-content:center;gap:6px;font-weight:650}.btn:hover{border-color:var(--accent)}.btn.on{background:var(--accent);border-color:var(--accent);color:#06130f}.nav{display:flex;gap:7px;align-items:center;flex-wrap:wrap;min-width:0}.iconbtn{width:34px;height:34px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--text);cursor:pointer;font-size:18px;font-weight:750;display:inline-flex;align-items:center;justify-content:center}.iconbtn:hover{border-color:var(--accent)}.iconbtn:disabled{opacity:.38;cursor:not-allowed;border-color:var(--line)}
.app{flex:1;min-height:0;display:grid;grid-template-columns:minmax(270px,340px) minmax(360px,1fr) minmax(360px,520px);min-width:0}.app.nav-collapsed{grid-template-columns:42px minmax(360px,1fr) minmax(360px,520px)}
aside{min-width:0;min-height:0;background:var(--panel);border-right:1px solid var(--line);display:flex;flex-direction:column;overflow:hidden}.left{position:relative}.right{border-right:0;border-left:1px solid var(--line)}.navFull{flex:1;min-height:0;display:flex;flex-direction:column}.navRail{display:none;position:relative;width:42px;height:100%;border:0;border-right:1px solid var(--line);background:var(--panel2);color:var(--text);cursor:pointer;overflow:hidden}.navRail:hover{background:var(--panel3)}.navRail span{position:absolute;left:50%;top:50%;transform:translate(-50%,-50%) rotate(90deg);transform-origin:center;white-space:nowrap;max-width:calc(100dvh - 180px);overflow:hidden;text-overflow:ellipsis;font-size:13px;font-weight:750;letter-spacing:.02em}.nav-collapsed .left{width:42px}.nav-collapsed .navFull{display:none}.nav-collapsed .navRail{display:block}
.searchWrap{flex:0 0 auto;padding:12px 12px 8px;display:grid;grid-template-columns:minmax(0,1fr) 34px;gap:7px}#q{width:100%;padding:10px 11px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--text);outline:none}#q:focus{border-color:var(--accent)}
#list{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;padding:0 8px 18px}.group{font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:13px 8px 5px}.item{display:grid;grid-template-columns:12px 1fr;gap:8px;padding:8px;border-radius:7px;cursor:pointer}.item:hover{background:var(--panel2)}.item.active{background:#273442}.dot{width:10px;height:10px;border-radius:50%;margin-top:5px}.name{font-size:13px;line-height:1.32}.meta{font-size:11px;color:var(--muted);margin-top:2px;word-break:break-word}
.stage{position:relative;min-width:0;min-height:0;background:radial-gradient(circle at 50% 45%,#1d2832 0,#101418 48%);overflow:hidden}#graph{width:100%;height:100%;display:block;cursor:grab;touch-action:none;user-select:none;-webkit-user-select:none}#graph.dragging{cursor:grabbing}.stage.mode-panel #graph{display:none}.stage.mode-graph #stageView{display:none}#stageView{position:absolute;inset:0;overflow:auto;padding:62px 18px 48px;background:linear-gradient(180deg,#111820,#0f1419);scrollbar-gutter:stable}.edge{stroke:#7d8796;stroke-width:1.35;opacity:.5;cursor:pointer;pointer-events:stroke;fill:none}.edgeHit{stroke:transparent;stroke-width:12;fill:none;cursor:pointer;pointer-events:stroke}.edge.active{stroke:var(--accent);stroke-width:3;opacity:.96}.edgeArrow{fill:#7d8796}.edgeArrowActive{fill:var(--accent)}.edgeLabel{font-size:10px;fill:#dbeafe;paint-order:stroke;stroke:#0f1215;stroke-width:4px;stroke-linejoin:round;pointer-events:none}.edgeLabel.active{fill:#fff}.node{cursor:pointer}.node circle{stroke:#0f1215;stroke-width:2.5}.node text{font-size:11px;fill:#edf4fb;paint-order:stroke;stroke:#0f1215;stroke-width:4px;stroke-linejoin:round;pointer-events:none}.node.active circle{stroke:#fff;stroke-width:3.5}.toolbar{position:absolute;z-index:2;top:12px;left:12px;display:flex;gap:6px;flex-wrap:wrap}.graphTools{display:flex;gap:6px}.graphInfo{position:absolute;z-index:2;left:12px;bottom:12px;max-width:min(680px,calc(100% - 210px));border:1px solid var(--line);border-radius:8px;background:rgba(15,18,21,.9);padding:9px 11px;color:var(--muted);font-size:12px}.graphInfo strong{display:block;color:var(--text);font-size:13px}.graphInfo button{margin-top:6px}.edgeList{display:grid;gap:3px;margin-top:6px;max-height:118px;overflow:auto}.edgeList button{height:auto;margin:0;padding:3px 0;border:0;background:transparent;color:#dbeafe;text-align:left;justify-content:flex-start;font-size:12px}.edgeList button:hover{text-decoration:underline}.count{position:absolute;z-index:2;right:12px;bottom:12px;color:var(--muted);background:rgba(15,18,21,.84);border:1px solid var(--line);border-radius:7px;padding:6px 9px;font-size:12px}
#detail{flex:1;min-height:0;overflow:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;touch-action:pan-y;padding:18px 22px 34px}.badge{display:inline-block;border:1px solid var(--line);border-radius:999px;background:var(--panel2);padding:2px 8px;font-size:11px;color:#d8e8ff}.path{font-size:12px;color:var(--muted);word-break:break-all;margin:8px 0 12px}.path a{color:var(--accent2)}.desc{color:var(--muted);font-style:italic;margin:8px 0 14px}
#detail h2.title{font-size:24px;line-height:1.18;margin:8px 0 6px}.md h1{font-size:21px}.md h2{font-size:17px;color:var(--accent);margin-top:22px}.md h3{font-size:15px;color:var(--accent2);margin-top:18px}.md p{margin:9px 0}.md ul,.md ol{padding-left:22px}.md li{margin:4px 0}.md code,.storyText code{background:var(--panel2);border:1px solid var(--line);border-radius:4px;padding:1px 4px}.md code a,.storyText code a{color:#dbeafe}.md pre,.storyText pre{white-space:pre-wrap;background:var(--panel2);border:1px solid var(--line);border-radius:7px;padding:10px;overflow:auto}.md a,.storyText a{color:var(--accent2);text-decoration:none}.md a:hover,.storyText a:hover{text-decoration:underline}.md img{display:block;max-width:100%;height:auto;border:1px solid var(--line);border-radius:8px;margin:12px 0;background:#0b0e11}.tableWrap{width:100%;overflow:auto;margin:12px 0;border:1px solid var(--line);border-radius:8px;background:rgba(34,41,50,.62)}.md table,.storyText table{width:100%;border-collapse:collapse;min-width:560px}.md th,.md td,.storyText th,.storyText td{border-bottom:1px solid var(--line);padding:8px 10px;text-align:left;vertical-align:top}.md th,.storyText th{position:sticky;top:0;background:#27313c;color:#f8fafc;font-weight:750}.md tr:last-child td,.storyText tr:last-child td{border-bottom:0}.md .mermaid-lite{display:block;width:100%;height:auto;min-height:220px;border:1px solid var(--line);border-radius:8px;background:#111820;margin:12px 0}.md .mermaid-node rect{fill:#26313d;stroke:#7aa7ff;stroke-width:1.4}.md .mermaid-node text{fill:#f2f5f8;font-size:12px}.md .mermaid-edge{stroke:#91a0b4;stroke-width:1.5;fill:none}.md .mermaid-arrow{fill:#91a0b4}.chips{display:flex;gap:6px;flex-wrap:wrap;margin:10px 0}.chip{border:1px solid var(--line);background:var(--panel2);border-radius:999px;color:#dbeafe;padding:4px 9px;font-size:12px;cursor:pointer}.chip:hover{border-color:var(--accent)}.notice{border:1px solid var(--line);border-radius:8px;background:rgba(76,201,167,.08);padding:10px 12px;margin:12px 0;color:#dceee9}
.viewHead{margin:0 0 14px;max-width:920px}.viewHead h2{font-size:18px;line-height:1.2;margin:0}.viewHead p{color:var(--muted);margin:4px 0 0}.narrativeGrid{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:14px;align-items:start}.storyCard,.eventCard,.linkCard{border:1px solid var(--line);border-radius:8px;background:rgba(34,41,50,.76);box-shadow:0 16px 44px rgba(0,0,0,.18)}.storyCard{padding:14px}.storyCard.prompt{border-color:#7aa7ff}.storyCard.final{border-color:#4cc9a7}.storyCard h3,.laneTitle{font-size:14px;line-height:1.25;margin:0 0 8px;color:var(--text)}.storyText{font-size:13px;line-height:1.5}.storyText h1{font-size:16px;margin:8px 0}.storyText h2{font-size:14px;color:var(--accent);margin:12px 0 6px}.storyText h3{font-size:13px;color:var(--accent2);margin:10px 0 5px}.storyText p{margin:7px 0}.responseStack{margin-top:16px}.commentaryList{display:grid;gap:10px}.eventCard{display:grid;grid-template-columns:118px minmax(0,1fr);gap:12px;padding:12px}.eventMeta{color:var(--muted);font-size:11px}.eventMeta strong{display:block;color:var(--accent2);font-size:12px}.timeline{position:relative;display:grid;gap:10px;max-width:980px}.timeline:before{content:"";position:absolute;left:18px;top:10px;bottom:10px;width:2px;background:var(--line)}.timelineItem{position:relative;display:grid;grid-template-columns:44px minmax(0,1fr);gap:10px}.timelineDot{z-index:1;width:14px;height:14px;border-radius:50%;background:var(--accent2);border:3px solid #111820;margin:9px 0 0 12px}.timelineItem.final .timelineDot{background:var(--accent)}.timelineItem.user .timelineDot{background:var(--warn)}.linksGrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px}.linkCard{padding:12px}.linkCard button{display:block;width:100%;text-align:left;margin:8px 0;padding:8px;border:1px solid var(--line);border-radius:7px;background:var(--panel2);color:var(--text);cursor:pointer}.linkCard button:hover{border-color:var(--accent)}.linkCard small{display:block;color:var(--muted);margin-top:2px}
@media (max-width:980px){.narrativeGrid,.linksGrid{grid-template-columns:1fr}.eventCard{grid-template-columns:1fr}}
@media (max-width:1120px){header{align-items:flex-start;flex-wrap:wrap}.sub{white-space:normal}.app{grid-template-columns:300px 1fr}.app.nav-collapsed{grid-template-columns:42px 1fr}.right{grid-column:1 / -1;border-left:0;border-top:1px solid var(--line);height:48vh;height:48dvh;max-height:48vh;max-height:48dvh;overflow:hidden}.right #detail{height:100%;max-height:100%;overflow:auto}.stage{min-height:54vh}}
@media (max-width:760px){body{overflow:auto}.shell{height:auto;min-height:100dvh}.app,.app.nav-collapsed{display:block}.stage{height:58vh}.searchWrap,#list{max-height:none}aside{height:auto;max-height:48vh;border-right:0;border-bottom:1px solid var(--line)}.nav-collapsed .left{width:auto;height:44px;max-height:44px}.nav-collapsed .navRail{width:100%;height:44px;border-right:0}.nav-collapsed .navRail span{transform:translate(-50%,-50%);max-width:calc(100vw - 28px)}.right{height:70vh;height:70dvh;min-height:360px;max-height:none}.right #detail{height:100%;max-height:100%;overflow:auto}.nav{width:100%}.btn{height:36px}}
</style>
</head>
<body>
<div class="shell">
<header>
<button class="iconbtn" id="backBtn" title="Back" aria-label="Back">‹</button>
<button class="iconbtn" id="forwardBtn" title="Forward" aria-label="Forward">›</button>
<button class="btn" id="home">Home</button>
<div class="titleblock"><h1 id="title">GOV.UK CASA OKF Wiki</h1><div class="sub" id="subtitle"></div></div>
<nav class="nav" id="corpusNav"></nav>
<div class="spacer"></div>
<a class="btn" id="repository" href="https://github.com/dwp/govuk-casa">Repository</a>
<a class="btn" id="markdown" href="wiki/index.md">Markdown</a>
</header>
<main class="app" id="app">
<aside class="left" id="navPane"><button class="navRail" id="navRail" title="Show navigation" aria-label="Show navigation"><span id="railLabel">Index</span></button><div class="navFull"><div class="searchWrap"><input id="q" placeholder="Search pages, tags, source IDs"><button class="iconbtn" id="collapseNav" title="Collapse navigation" aria-label="Collapse navigation">‹</button></div><div id="list"></div></div></aside>
<section class="stage mode-graph" id="stage">
<svg id="graph" role="img" aria-label="Wiki graph"></svg>
<div id="stageView"></div>
<div class="toolbar"><button class="btn viewBtn" data-view="narrative">Narrative</button><button class="btn viewBtn" data-view="timeline">Timeline</button><button class="btn viewBtn" data-view="graph">Graph</button><button class="btn viewBtn" data-view="links">Links</button><span class="graphTools" id="graphTools"><button class="btn on" id="graphMode">Focus Graph</button><button class="btn on" id="showLinks">Edges</button><button class="btn" id="zoomOut" title="Zoom out" aria-label="Zoom out">-</button><button class="btn" id="zoomReset" title="Reset zoom" aria-label="Reset zoom">100%</button><button class="btn" id="zoomIn" title="Zoom in" aria-label="Zoom in">+</button></span></div>
<div class="graphInfo" id="graphInfo"></div>
<div class="count" id="count"></div>
</section>
<aside class="right"><article id="detail"></article></aside>
</main>
</div>
<script>
const B=__GRAPH_JSON__;
const SECTION_COLORS={root:"#8a93ad",concepts:"#4cc9a7",examples:"#7aa7ff",playbooks:"#f2bd63",references:"#a855f7"};
let corpusId=new URLSearchParams(location.search).get("corpus")||B.meta.default_corpus;
if(!B.corpora[corpusId])corpusId=B.meta.default_corpus;
let G,paths,bySection,out,inc,routeMap,selected,showLinks=true,graphMode="focus",currentView="graph",navCollapsed=false,graphFocus=null,labelPhase=0,labelLayerCount=1,graphZoom=1,graphPanX=0,graphPanY=0,graphDrag=null,graphSuppressClick=false;
const app=document.getElementById("app"),stage=document.getElementById("stage"),stageView=document.getElementById("stageView"),graphTools=document.getElementById("graphTools"),graphInfo=document.getElementById("graphInfo"),title=document.getElementById("title"),subtitle=document.getElementById("subtitle"),corpusNav=document.getElementById("corpusNav"),q=document.getElementById("q"),list=document.getElementById("list"),detail=document.getElementById("detail"),graph=document.getElementById("graph"),count=document.getElementById("count"),markdown=document.getElementById("markdown"),collapseNav=document.getElementById("collapseNav"),navRail=document.getElementById("navRail"),railLabel=document.getElementById("railLabel"),backBtn=document.getElementById("backBtn"),forwardBtn=document.getElementById("forwardBtn"),zoomOut=document.getElementById("zoomOut"),zoomReset=document.getElementById("zoomReset"),zoomIn=document.getElementById("zoomIn");
function esc(s){return String(s||"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));}
function attr(s){return esc(s).replace(/'/g,"&#39;");}
function color(section){return SECTION_COLORS[section]||"#94a3b8";}
function sortedTitle(ids){return [...ids].sort((a,b)=>G.nodes[a].title.localeCompare(G.nodes[b].title));}
function setNavCollapsed(flag){navCollapsed=flag;app.classList.toggle("nav-collapsed",flag);navRail.setAttribute("aria-expanded",String(!flag));if(G)requestAnimationFrame(renderStage);}
function updateRailLabel(){railLabel.textContent=G&&G.nodes[selected]?G.nodes[selected].title:"Index";}
function routeFor(id){const n=G.nodes[id];if(!n)return"index";if(n.exchange_id)return n.exchange_id.toLowerCase();if(id===G.root)return"index";return(n.route_aliases&&n.route_aliases[0])||id.replace(/\\.md$/,"").replace(/[^a-z0-9]+/gi,"-").toLowerCase();}
function routeHref(id){return `?corpus=${encodeURIComponent(corpusId)}#${encodeURIComponent(routeFor(id))}`;}
function idFromHash(){const hash=decodeURIComponent(location.hash.slice(1)).trim().toLowerCase();return hash?routeMap[hash]||null:null;}
function updateLocation(push){const url=new URL(location.href);url.searchParams.set("corpus",corpusId);url.hash=routeFor(selected);const state={corpusId,selected};if(push)history.pushState(state,"",url);else history.replaceState(state,"",url);}
function refreshNavButtons(){backBtn.disabled=false;forwardBtn.disabled=false;}
function setCorpus(id,pickRoot=true,push=true){corpusId=id;G=B.corpora[id];paths=Object.keys(G.nodes);routeMap={};bySection={};paths.forEach(pid=>{const n=G.nodes[pid];const s=n.section||"root";(bySection[s]||(bySection[s]=[])).push(pid);(n.route_aliases||[]).forEach(alias=>routeMap[String(alias).toLowerCase()]=pid);routeMap[pid.toLowerCase()]=pid;routeMap[pid.replace(/\\.md$/,"").toLowerCase()]=pid;});out={};inc={};paths.forEach(pid=>{out[pid]=new Set();inc[pid]=new Set();});G.edges.forEach(edge=>{const a=edge[0],b=edge[1];if(out[a]&&inc[b]){out[a].add(b);inc[b].add(a);}});selected=pickRoot?(G.root||paths[0]):(idFromHash()||((G.nodes[selected]&&selected)||(G.root||paths[0])));graphFocus=null;labelPhase=0;labelLayerCount=1;currentView=defaultView();title.textContent=G.title;subtitle.textContent=G.subtitle;markdown.href=G.markdown_url;renderCorpusNav();renderList();renderDetail();renderStage();updateLocation(push);refreshNavButtons();}
function applyLocationFromUrl(){const requested=new URLSearchParams(location.search).get("corpus")||B.meta.default_corpus;const nextCorpus=B.corpora[requested]?requested:B.meta.default_corpus;if(nextCorpus!==corpusId){setCorpus(nextCorpus,false,false);return;}const id=idFromHash()||(G.root||paths[0]);navigate(id,false);}
function renderCorpusNav(){corpusNav.innerHTML="";for(const id of B.meta.corpus_order){const c=B.corpora[id];const b=document.createElement("button");b.className="btn"+(id===corpusId?" on":"");b.textContent=c.label;b.onclick=()=>setCorpus(id,true,true);corpusNav.appendChild(b);}}
function nodeMatches(id,term){const n=G.nodes[id];return !term||[id,n.title,n.type,n.description,n.aliases,n.tags,n.source].join(" ").toLowerCase().includes(term);}
function isExchangeNode(id=selected){const n=G&&G.nodes[id];return !!n&&(n.type==="Exchange"||n.section==="exchanges");}
function defaultView(){return isExchangeNode()?"narrative":"graph";}
function navigate(id,push=true){if(!G.nodes[id])return;selected=id;graphFocus=null;labelPhase=0;labelLayerCount=1;if(isExchangeNode()&&currentView==="graph")currentView="narrative";renderList();renderDetail();renderStage();updateLocation(push);refreshNavButtons();}
function pick(id){navigate(id,true);}
function bindPageLinks(root){root.querySelectorAll("[data-page]").forEach(a=>a.addEventListener("click",e=>{if(e.metaKey||e.ctrlKey||e.shiftKey||e.altKey||e.button)return;e.preventDefault();pick(a.dataset.page);}));}
function renderList(){const term=q.value.trim().toLowerCase();list.innerHTML="";let shown=0;for(const section of G.sections){const ids=(bySection[section]||[]).filter(id=>nodeMatches(id,term)).sort((a,b)=>G.nodes[a].title.localeCompare(G.nodes[b].title));if(!ids.length)continue;const g=document.createElement("div");g.className="group";g.textContent=section;list.appendChild(g);for(const id of ids){shown++;const n=G.nodes[id];const row=document.createElement("div");row.className="item"+(id===selected?" active":"");row.onclick=()=>pick(id);row.innerHTML=`<span class="dot" style="background:${color(n.section)}"></span><div><div class="name">${esc(n.title)}</div><div class="meta">${esc(n.type)} - ${esc(id)}</div></div>`;list.appendChild(row);}}count.textContent=`${G.label}: ${shown} shown - ${paths.length} pages - ${G.edges.length} links`;}
function normalizeParts(basePath,href){const stack=basePath.split("/");stack.pop();for(const part of href.split("#")[0].split("?")[0].split("/")){if(!part||part===".")continue;if(part==="..")stack.pop();else stack.push(decodeURIComponent(part));}return stack.join("/");}
function targetFromHref(href){if(!href)return null;if(href.startsWith("#")){const alias=decodeURIComponent(href.slice(1)).trim().toLowerCase();return alias?routeMap[alias]||null:null;}if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href))return null;const target=normalizeParts(selected,href);if(G.nodes[target])return target;const indexTarget=target.replace(/\\/?$/,"/index.md");return G.nodes[indexTarget]?indexTarget:null;}
function sourceHref(href){if(!href||href.startsWith("#"))return href||"#";if(/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(href))return href;return normalizeParts(G.nodes[selected].source,href);}
function linkFor(href,label){const target=targetFromHref(href);if(target)return `<a href="${attr(routeHref(target))}" data-page="${attr(target)}">${label}</a>`;const url=sourceHref(href);const external=/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(url);return `<a href="${attr(url)}"${external?' target="_blank" rel="noopener"':""}>${label}</a>`;}
function imageFor(label,href){return `<img src="${attr(sourceHref(href))}" alt="${attr(label)}">`;}
function repoLinkForCode(text){const value=String(text||"").trim();if(/^[0-9a-f]{7,40}$/i.test(value))return `${B.meta.repository_url}/commit/${encodeURIComponent(value)}`;if(/^[A-Za-z0-9_.-]+(?:\\/[A-Za-z0-9_. -]+)+\\.(?:md|py|json|ya?ml|ts|tsx|js|svelte|css|html|txt|csv|docx|pptx|png|svg)$/i.test(value)&&!value.includes("[")&&!value.includes("]"))return `${B.meta.repository_url}/blob/${B.meta.repository_branch}/${value.split("/").map(encodeURIComponent).join("/")}`;return"";}
function codeSpan(text){const url=repoLinkForCode(text);const code=esc(text);return url?`<code><a href="${attr(url)}" target="_blank" rel="noopener">${code}</a></code>`:`<code>${code}</code>`;}
function codeBlock(text){return esc(text).replace(/\\b([0-9a-f]{7,40})\\b/gi,hash=>`<a href="${attr(`${B.meta.repository_url}/commit/${hash}`)}" target="_blank" rel="noopener">${hash}</a>`);}
function inline(s){return esc(s).replace(/!\\[([^\\]]*)\\]\\(([^)]+)\\)/g,(_,label,href)=>imageFor(label,href)).replace(/`([^`]+)`/g,(_,code)=>codeSpan(code)).replace(/\\*\\*([^*]+)\\*\\*/g,"<strong>$1</strong>").replace(/\\[([^\\]]+)\\]\\(([^)]+)\\)/g,(_,label,href)=>linkFor(href,esc(label)));}
function mermaidNodeToken(token,nodes){const clean=token.trim().replace(/;$/,"");const m=/^([A-Za-z][A-Za-z0-9_-]*)(?:\\[\\"?([^\\]]+?)\\"?\\]|\\((?:\\"?)([^)]+?)(?:\\"?)\\))?$/.exec(clean);if(!m)return null;const id=m[1];const label=(m[2]||m[3]||id).replace(/^"|"$/g,"").replace(/\\\\n/g,"\\n");nodes[id]=nodes[id]||{id,label};return id;}
function wrapMermaidLabel(label){const parts=String(label||"").split("\\n");const lines=[];for(const part of parts){let current="";for(const word of part.split(/\\s+/)){if(!word)continue;if((current+" "+word).trim().length>24){if(current)lines.push(current);current=word;}else current=(current+" "+word).trim();}if(current)lines.push(current);}return lines.length?lines:[String(label||"")];}
function mermaidLite(diagram){const lines=String(diagram||"").split("\\n").map(line=>line.trim()).filter(line=>line&&!line.startsWith("%%"));const head=lines.shift()||"";const mode=/^(?:flowchart|graph)\\s+(LR|RL|TD|TB)$/i.exec(head);if(!mode)return `<pre><code>${esc(diagram)}</code></pre>`;const nodes={},edges=[];for(const line of lines){const parts=line.replace(/;$/,"").split(/\\s*(?:-->|==>|-.->)\\s*/);if(parts.length<2)continue;const ids=parts.map(part=>mermaidNodeToken(part,nodes));for(let i=0;i<ids.length-1;i++){if(ids[i]&&ids[i+1])edges.push([ids[i],ids[i+1]]);}}const ids=Object.keys(nodes);if(!ids.length)return `<pre><code>${esc(diagram)}</code></pre>`;const incoming=Object.fromEntries(ids.map(id=>[id,0]));edges.forEach(([,b])=>incoming[b]=(incoming[b]||0)+1);const rank=Object.fromEntries(ids.map(id=>[id,0]));const queue=ids.filter(id=>!incoming[id]);const visit=queue.length?queue:[...ids];let guard=0;for(let i=0;i<visit.length&&guard<ids.length*ids.length*4;i++,guard++){const id=visit[i];for(const [a,b] of edges){const nextRank=Math.min(ids.length-1,rank[a]+1);if(a===id&&rank[b]<nextRank){rank[b]=nextRank;visit.push(b);}}}const ranks=[...new Set(ids.map(id=>rank[id]||0))].sort((a,b)=>a-b);const groups=Object.fromEntries(ranks.map(r=>[r,ids.filter(id=>(rank[id]||0)===r)]));const horizontal=mode[1].toUpperCase()==="LR"||mode[1].toUpperCase()==="RL";const nodeW=190,nodeH=76,gapX=62,gapY=34,pad=28;const maxGroup=Math.max(...ranks.map(r=>groups[r].length));const w=horizontal?pad*2+ranks.length*nodeW+Math.max(0,ranks.length-1)*gapX:pad*2+maxGroup*nodeW+Math.max(0,maxGroup-1)*gapX;const h=horizontal?pad*2+maxGroup*nodeH+Math.max(0,maxGroup-1)*gapY:pad*2+ranks.length*nodeH+Math.max(0,ranks.length-1)*gapY;const pos={};ranks.forEach((r,ri)=>{groups[r].forEach((id,i)=>{pos[id]=horizontal?{x:pad+ri*(nodeW+gapX),y:pad+i*(nodeH+gapY)}:{x:pad+i*(nodeW+gapX),y:pad+ri*(nodeH+gapY)};});});let hash=0;for(const ch of diagram)hash=(hash*31+ch.charCodeAt(0))|0;const marker=`mermaid-arrow-${Math.abs(hash)}`;let svg=`<svg class="mermaid-lite" viewBox="0 0 ${w} ${h}" role="img" aria-label="Mermaid flowchart"><defs><marker id="${marker}" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path class="mermaid-arrow" d="M0,0 L10,4 L0,8 Z"></path></marker></defs>`;for(const [a,b] of edges){const pa=pos[a],pb=pos[b];if(!pa||!pb)continue;const sx=horizontal?pa.x+nodeW:pa.x+nodeW/2,sy=horizontal?pa.y+nodeH/2:pa.y+nodeH,tx=horizontal?pb.x:pb.x+nodeW/2,ty=horizontal?pb.y+nodeH/2:pb.y;const c1x=horizontal?sx+gapX*.45:sx,c1y=horizontal?sy:sy+gapY*.45,c2x=horizontal?tx-gapX*.45:tx,c2y=horizontal?ty:ty-gapY*.45;svg+=`<path class="mermaid-edge" d="M${sx} ${sy} C${c1x} ${c1y}, ${c2x} ${c2y}, ${tx} ${ty}" marker-end="url(#${marker})"></path>`;}for(const id of ids){const p=pos[id];const labelLines=wrapMermaidLabel(nodes[id].label);const startY=p.y+nodeH/2-(labelLines.length-1)*7;svg+=`<g class="mermaid-node"><rect x="${p.x}" y="${p.y}" width="${nodeW}" height="${nodeH}" rx="7"></rect><text text-anchor="middle">`;labelLines.slice(0,4).forEach((line,i)=>{svg+=`<tspan x="${p.x+nodeW/2}" y="${startY+i*15}">${esc(line)}</tspan>`;});svg+="</text></g>";}return svg+"</svg>";}
function isTableLine(line){return /^\\s*\\|.*\\|\\s*$/.test(line||"");}
function isDelimiterLine(line){return /^\\s*\\|?\\s*:?-{3,}:?\\s*(\\|\\s*:?-{3,}:?\\s*)+\\|?\\s*$/.test(line||"");}
function splitTableRow(line){return String(line||"").trim().replace(/^\\|/,"").replace(/\\|$/,"").split("|").map(cell=>cell.trim());}
function renderTable(rows){const head=splitTableRow(rows[0]);const body=rows.slice(1).map(splitTableRow);return `<div class="tableWrap"><table><thead><tr>${head.map(cell=>`<th>${inline(cell)}</th>`).join("")}</tr></thead><tbody>${body.map(row=>`<tr>${head.map((_,i)=>`<td>${inline(row[i]||"")}</td>`).join("")}</tr>`).join("")}</tbody></table></div>`;}
function md(text){const lines=String(text||"").split("\\n");let html="",inList=false,inCode=false,codeLang="",buf=[];function closeList(){if(inList){html+="</ul>";inList=false;}}function flushCode(){if(inCode){const code=buf.join("\\n");html+=codeLang==="mermaid"?mermaidLite(code):`<pre><code>${codeBlock(code)}</code></pre>`;buf=[];inCode=false;codeLang="";}}for(let i=0;i<lines.length;i++){const line=lines[i];if(line.startsWith("```")){if(inCode)flushCode();else{closeList();inCode=true;codeLang=line.slice(3).trim().toLowerCase();buf=[];}continue;}if(inCode){buf.push(line);continue;}if(isTableLine(line)&&isDelimiterLine(lines[i+1]||"")){closeList();const rows=[line];i+=2;while(i<lines.length&&isTableLine(lines[i])){rows.push(lines[i]);i++;}i--;html+=renderTable(rows);continue;}if(!line.trim()){closeList();continue;}let m;if((m=/^###\\s+(.+)/.exec(line))){closeList();html+=`<h3>${inline(m[1])}</h3>`;}else if((m=/^##\\s+(.+)/.exec(line))){closeList();html+=`<h2>${inline(m[1])}</h2>`;}else if((m=/^#\\s+(.+)/.exec(line))){closeList();html+=`<h1>${inline(m[1])}</h1>`;}else if((m=/^-\\s+(.+)/.exec(line))){if(!inList){html+="<ul>";inList=true;}html+=`<li>${inline(m[1])}</li>`;}else{closeList();html+=`<p>${inline(line)}</p>`;}}flushCode();closeList();return html;}
function renderDetail(){const n=G.nodes[selected];updateRailLabel();const outgoing=sortedTitle(out[selected]);const incoming=sortedTitle(inc[selected]);detail.innerHTML=`<span class="badge">${esc(n.type)}</span><h2 class="title">${esc(n.title)}</h2><div class="path"><a href="${attr(n.source)}">${esc(n.source)}</a></div><p class="desc">${esc(n.description)}</p><div class="chips">${outgoing.slice(0,18).map(id=>`<button class="chip" data-page="${attr(id)}">out: ${esc(G.nodes[id].title)}</button>`).join("")}${incoming.slice(0,18).map(id=>`<button class="chip" data-page="${attr(id)}">in: ${esc(G.nodes[id].title)}</button>`).join("")}</div><div class="md">${md(n.body)}</div>`;bindPageLinks(detail);}
function sectionText(body,heading){const marker=`## ${heading}`;const start=body.indexOf(marker);if(start<0)return"";const rest=body.slice(start+marker.length).replace(/^\\s*/,"");const next=rest.search(/\\n##\\s+/);return(next>=0?rest.slice(0,next):rest).trim();}
function firstFence(text){const match=/````[a-zA-Z0-9_-]*\\n([\\s\\S]*?)\\n````/.exec(text)||/```[a-zA-Z0-9_-]*\\n([\\s\\S]*?)\\n```/.exec(text);return(match?match[1]:text).trim();}
function exchangeParts(node){const prompt=firstFence(sectionText(node.body,"User Prompt"));const responseSection=sectionText(node.body,"Codex Response");const responses=[];const re=/### Response\\s+(\\d+)\\s+\\(([^)]+)\\)\\n([\\s\\S]*?)(?=\\n### Response\\s+\\d+\\s+\\(|$)/g;let m;while((m=re.exec(responseSection))){const block=m[3];const timestamp=/- Timestamp:\\s+`([^`]+)`/.exec(block);responses.push({number:Number(m[1]),kind:m[2],timestamp:timestamp?timestamp[1]:"",text:firstFence(block.replace(/- Timestamp:\\s+`[^`]+`/,"")).trim()});}const final=responses.findLast?responses.findLast(r=>r.kind==="final_answer"):responses.filter(r=>r.kind==="final_answer").slice(-1)[0];return{prompt,responses,final:final||responses[responses.length-1]||null,commentary:responses.filter(r=>r.kind!=="final_answer")};}
function textBlock(text){return `<div class="storyText">${md(text||"_No text captured._")}</div>`;}
function renderNarrativeView(){const n=G.nodes[selected];if(!isExchangeNode())return `<div class="viewHead"><h2>${esc(n.title)}</h2><p>This view renders the selected OKF concept as Markdown.</p></div><div class="storyCard">${textBlock(n.body)}</div>`;const parts=exchangeParts(n);const finalTitle=parts.final&&parts.final.kind==="final_answer"?"Final Answer":"Latest Codex Response";return `<div class="viewHead"><h2>${esc(n.title)}</h2><p>User prompt and final answer are foregrounded; commentary responses stay below in timestamp order.</p></div><div class="narrativeGrid"><section class="storyCard prompt"><h3>User Prompt</h3>${textBlock(parts.prompt)}</section><section class="storyCard final"><h3>${esc(finalTitle)}</h3>${parts.final?`<div class="eventMeta">${esc(parts.final.timestamp)}</div>${textBlock(parts.final.text)}`:"<p class='desc'>No Codex response captured.</p>"}</section></div><section class="responseStack"><h3 class="laneTitle">Commentary Timeline</h3><div class="commentaryList">${parts.commentary.map(r=>`<article class="eventCard"><div class="eventMeta"><strong>Response ${r.number}</strong>${esc(r.kind)}<br>${esc(r.timestamp)}</div>${textBlock(r.text)}</article>`).join("")||"<p class='desc'>No commentary responses captured.</p>"}</div></section>`;}
function renderTimelineView(){const n=G.nodes[selected];if(isExchangeNode()){const parts=exchangeParts(n);const events=[{kind:"user",label:"User Prompt",time:n.timestamp,text:parts.prompt},...parts.responses.map(r=>({kind:r.kind==="final_answer"?"final":"assistant",label:`Response ${r.number} (${r.kind})`,time:r.timestamp,text:r.text}))];return `<div class="viewHead"><h2>${esc(n.title)}</h2><p>Prompt-response sequence in recorded order.</p></div><div class="timeline">${events.map(e=>`<article class="timelineItem ${attr(e.kind)}"><span class="timelineDot"></span><div class="eventCard"><div class="eventMeta"><strong>${esc(e.label)}</strong>${esc(e.time)}</div>${textBlock(e.text)}</div></article>`).join("")}</div>`;}const timed=paths.map(id=>G.nodes[id]).filter(node=>node.timestamp).sort((a,b)=>String(a.timestamp).localeCompare(String(b.timestamp))).slice(0,80);return `<div class="viewHead"><h2>${esc(G.label)} Timeline</h2><p>Timestamped pages in this corpus.</p></div><div class="timeline">${timed.map(node=>`<article class="timelineItem"><span class="timelineDot"></span><div class="eventCard"><div class="eventMeta"><strong>${esc(node.timestamp)}</strong>${esc(node.type)}</div><button class="chip" data-page="${attr(node.id)}">${esc(node.title)}</button><p class="desc">${esc(node.description)}</p></div></article>`).join("")}</div>`;}
function renderLinksView(){const outgoing=sortedTitle(out[selected]);const incoming=sortedTitle(inc[selected]);function buttons(ids,label){return `<section class="linkCard"><h3>${label}</h3>${ids.map(id=>{const n=G.nodes[id];return `<button data-page="${attr(id)}">${esc(n.title)}<small>${esc(n.type)} - ${esc(id)}</small></button>`;}).join("")||"<p class='desc'>None</p>"}</section>`;}return `<div class="viewHead"><h2>${esc(G.nodes[selected].title)}</h2><p>Incoming and outgoing wiki links for the selected page.</p></div><div class="linksGrid">${buttons(outgoing,"Outgoing Links")}${buttons(incoming,"Incoming Links")}</div>`;}
function renderStage(){stage.classList.toggle("mode-graph",currentView==="graph");stage.classList.toggle("mode-panel",currentView!=="graph");graphTools.style.display=currentView==="graph"?"flex":"none";document.querySelectorAll(".viewBtn").forEach(btn=>btn.classList.toggle("on",btn.dataset.view===currentView));if(currentView==="graph"){stageView.innerHTML="";renderGraph();return;}graphInfo.hidden=true;graphInfo.innerHTML="";stageView.innerHTML=currentView==="narrative"?renderNarrativeView():currentView==="timeline"?renderTimelineView():renderLinksView();bindPageLinks(stageView);}
function visibleGraphIds(){if(graphMode==="overview")return paths;const ids=new Set([selected]);G.edges.forEach(edge=>{if(edge[0]===selected)ids.add(edge[1]);if(edge[1]===selected)ids.add(edge[0]);});return [...ids].slice(0,72);}
function placeArc(pos,group,cx,cy,r,start,end){const count=Math.max(1,group.length);group.forEach((id,i)=>{const a=count===1?(start+end)/2:start+(end-start)*(i/(count-1));pos[id]={x:cx+Math.cos(a)*r,y:cy+Math.sin(a)*r};});}
function graphPositions(ids,w,h){const cx=w/2,cy=h/2,pos={};if(graphMode==="focus"){pos[selected]={x:cx,y:cy};const others=ids.filter(id=>id!==selected).sort((a,b)=>G.nodes[a].title.localeCompare(G.nodes[b].title));const both=others.filter(id=>out[selected].has(id)&&inc[selected].has(id));const outgoing=others.filter(id=>out[selected].has(id)&&!inc[selected].has(id));const incoming=others.filter(id=>inc[selected].has(id)&&!out[selected].has(id));const r=Math.min(w,h)*.31;placeArc(pos,incoming,cx,cy,r,Math.PI*.68,Math.PI*1.32);placeArc(pos,outgoing,cx,cy,r,-Math.PI*.32,Math.PI*.32);placeArc(pos,both,cx,cy,r,-Math.PI*.82,-Math.PI*.18);return pos;}const sections=G.sections;sections.forEach((section,si)=>{const group=ids.filter(id=>G.nodes[id].section===section).sort();const colCount=Math.max(1,Math.ceil(Math.sqrt(group.length)));const bandW=w/Math.max(1,sections.length);const startX=bandW*si+bandW*.18;group.forEach((id,i)=>{const col=i%colCount,row=Math.floor(i/colCount);pos[id]={x:startX+col*(bandW*.68/Math.max(1,colCount-1||1)),y:70+row*30};});});return pos;}
function nodeRadius(id){const related=out[selected].has(id)||inc[selected].has(id);return id===selected?13:(related?8:5);}
function relationTitle(edge){return `${edge[2]||"wiki link"}: ${G.nodes[edge[0]].title} -> ${G.nodes[edge[1]].title}`;}
function bindEdgeButtons(root){root.querySelectorAll("[data-edge]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();e.stopPropagation();const edge=G.edges[Number(el.dataset.edge)];graphFocus={source:edge[0],target:edge[1],type:edge[2],label:edge[3]};renderGraph();}));}
function relationRows(limit=12){return G.edges.map((edge,i)=>({edge,i})).filter(item=>item.edge[0]===selected||item.edge[1]===selected).sort((a,b)=>relationTitle(a.edge).localeCompare(relationTitle(b.edge))).slice(0,limit);}
function renderGraphInfo(){if(currentView!=="graph"){graphInfo.hidden=true;graphInfo.innerHTML="";return;}graphInfo.hidden=false;if(graphFocus&&graphFocus.source){const a=graphFocus.source,b=graphFocus.target,from=G.nodes[a],to=G.nodes[b];graphInfo.innerHTML=`<strong>Relationship: ${esc(graphFocus.type||"wiki link")}</strong><div>${esc(from.title)} -&gt; ${esc(to.title)}</div>${graphFocus.label?`<div>Link text: ${esc(graphFocus.label)}</div>`:""}<div><button class="btn" data-page="${attr(a)}">Open source</button> <button class="btn" data-page="${attr(b)}">Open target</button></div>`;bindPageLinks(graphInfo);return;}const n=G.nodes[selected];const rows=relationRows();graphInfo.innerHTML=`<strong>${esc(n.title)}</strong><div>${esc(n.type)} - ${out[selected].size} outgoing, ${inc[selected].size} incoming. Focus graph shows only directly linked nodes.</div><div class="edgeList">${rows.map(item=>{const e=item.edge;const dir=e[0]===selected?"out":"in";const other=G.nodes[e[0]===selected?e[1]:e[0]];return `<button data-edge="${item.i}">${esc(dir)}: ${esc(e[2]||"wiki link")} - ${esc(other.title)}</button>`;}).join("")||"<span>No relationships for this page.</span>"}</div>`;bindEdgeButtons(graphInfo);}
function labelBox(id,p,r){const text=G.nodes[id].title.slice(0,54);return{x:p.x+r+7,y:p.y-9,w:Math.min(340,text.length*6.2+14),h:18};}
function boxOverlap(a,b){return a.x<b.x+b.w&&a.x+a.w>b.x&&a.y<b.y+b.h&&a.y+a.h>b.y;}
function labelLayers(ids,pos){const always=ids.includes(selected)&&pos[selected]?[{id:selected,box:labelBox(selected,pos[selected],nodeRadius(selected))}]:[];const alwaysBoxes=always.map(item=>item.box);const raw=ids.filter(id=>id!==selected).map(id=>({id,box:pos[id]?labelBox(id,pos[id],nodeRadius(id)):null})).filter(item=>item.box);const candidates=raw.filter(item=>!alwaysBoxes.some(box=>boxOverlap(item.box,box)));const conflicts=new Set();candidates.forEach((item,i)=>{for(let j=i+1;j<candidates.length;j++){if(boxOverlap(item.box,candidates[j].box)){conflicts.add(item.id);conflicts.add(candidates[j].id);}}});const free=candidates.filter(item=>!conflicts.has(item.id));const layered=candidates.filter(item=>conflicts.has(item.id)).sort((a,b)=>G.nodes[a.id].title.localeCompare(G.nodes[b.id].title));const layers=[];layered.forEach(item=>{let placed=false;for(let i=0;i<layers.length;i++){if(!layers[i].some(other=>boxOverlap(item.box,other.box))){layers[i].push(item);placed=true;break;}}if(!placed)layers.push([item]);});labelLayerCount=Math.max(1,layers.length);const active=layers.length?(layers[labelPhase%labelLayerCount]||[]):[];return new Set([...always.map(item=>item.id),...free.map(item=>item.id),...active.map(item=>item.id)]);}
function labelSet(ids,pos){return labelLayers(ids,pos);}
function edgePairKey(edge){return edge[0]<edge[1]?`${edge[0]}|${edge[1]}`:`${edge[1]}|${edge[0]}`;}
function edgeLabelText(edge){return edge[2]||"wiki link";}
function edgeLabelPlan(items){const groups={};items.forEach(item=>{const key=edgePairKey(item.edge);(groups[key]||(groups[key]=[])).push(item);});const plan=new Map();Object.values(groups).forEach(group=>{const labels=[...new Set(group.map(item=>edgeLabelText(item.edge)))];if(group.length>1&&labels.length===1){const first=group.slice().sort((a,b)=>a.i-b.i)[0];group.forEach(item=>plan.set(item.i,{show:item.i===first.i,t:.5}));}else group.forEach(item=>plan.set(item.i,{show:true,t:(group.length>1 ? .34 : .5)}));});return plan;}
function edgePath(edge,pos,labelT=.5){const a=edge[0],b=edge[1],pa=pos[a],pb=pos[b],ra=nodeRadius(a),rb=nodeRadius(b);const dx=pb.x-pa.x,dy=pb.y-pa.y,len=Math.max(1,Math.hypot(dx,dy)),ux=dx/len,uy=dy/len;const sx=pa.x+ux*(ra+3),sy=pa.y+uy*(ra+3),tx=pb.x-ux*(rb+9),ty=pb.y-uy*(rb+9);const reverse=G.edges.some(other=>other[0]===b&&other[1]===a);const bend=reverse?22*(a<b?1:-1):0;const mx=(sx+tx)/2,my=(sy+ty)/2,cx=mx-uy*bend,cy=my+ux*bend;const t=Math.max(.2,Math.min(.8,labelT)),u=1-t,lx=u*u*sx+2*u*t*cx+t*t*tx,ly=u*u*sy+2*u*t*cy+t*t*ty-7;return{d:`M${sx} ${sy} Q${cx} ${cy} ${tx} ${ty}`,lx,ly};}
function graphViewBox(w,h){const z=Math.max(.7,Math.min(3,graphZoom)),vw=w/z,vh=h/z,baseX=(w-vw)/2,baseY=(h-vh)/2,padX=w*.35,padY=h*.35;graphPanX=Math.max(-baseX-padX,Math.min(baseX+padX,graphPanX));graphPanY=Math.max(-baseY-padY,Math.min(baseY+padY,graphPanY));return`${baseX+graphPanX} ${baseY+graphPanY} ${vw} ${vh}`;}
function applyGraphViewBox(){const w=graph.clientWidth||900,h=graph.clientHeight||650;graph.setAttribute("viewBox",graphViewBox(w,h));}
function setGraphZoom(value){graphZoom=Math.max(.7,Math.min(3,value));zoomReset.textContent=`${Math.round(graphZoom*100)}%`;renderGraph();}
function resetGraphView(){graphZoom=1;graphPanX=0;graphPanY=0;zoomReset.textContent="100%";renderGraph();}
function beginGraphPan(e){if(e.button!==undefined&&e.button!==0)return;graphSuppressClick=false;graphDrag={x:e.clientX,y:e.clientY,panX:graphPanX,panY:graphPanY,moved:false,captured:false};graph.classList.add("dragging");}
function moveGraphPan(e){if(!graphDrag)return;const dx=e.clientX-graphDrag.x,dy=e.clientY-graphDrag.y,z=Math.max(.7,Math.min(3,graphZoom));if(Math.hypot(dx,dy)>3){graphDrag.moved=true;graphSuppressClick=true;if(!graphDrag.captured&&graph.setPointerCapture){graph.setPointerCapture(e.pointerId);graphDrag.captured=true;}}if(!graphDrag.moved)return;e.preventDefault();graphPanX=graphDrag.panX-dx/z;graphPanY=graphDrag.panY-dy/z;applyGraphViewBox();}
function endGraphPan(e){if(!graphDrag)return;const moved=graphDrag.moved,captured=graphDrag.captured;graphDrag=null;graph.classList.remove("dragging");try{if(captured&&graph.releasePointerCapture)graph.releasePointerCapture(e.pointerId);}catch{}if(!moved)graphSuppressClick=false;else setTimeout(()=>{graphSuppressClick=false;},80);}
function suppressGraphClick(e){if(!graphSuppressClick)return;e.preventDefault();e.stopPropagation();graphSuppressClick=false;}
function renderGraph(){const w=graph.clientWidth||900,h=graph.clientHeight||650;applyGraphViewBox();const ids=visibleGraphIds();const visible=new Set(ids);const pos=graphPositions(ids,w,h);const labels=labelSet(ids,pos);const visibleEdges=[];let edgeSvg=`<defs><marker id="arrowhead" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path class="edgeArrow" d="M0,0 L10,4 L0,8 Z"></path></marker><marker id="arrowheadActive" markerWidth="10" markerHeight="8" refX="9" refY="4" orient="auto"><path class="edgeArrowActive" d="M0,0 L10,4 L0,8 Z"></path></marker></defs>`,hitSvg="",labelSvg="",nodeSvg="";if(showLinks){G.edges.forEach((edge,i)=>{const a=edge[0],b=edge[1],incident=a===selected||b===selected;if(visible.has(a)&&visible.has(b)&&pos[a]&&pos[b]&&(graphMode==="overview"||incident))visibleEdges.push({edge,i});});const labelPlan=edgeLabelPlan(visibleEdges);visibleEdges.forEach(item=>{const edge=item.edge,type=edge[2]||"wiki link",label=edge[3]||type;const active=graphFocus&&graphFocus.source===edge[0]&&graphFocus.target===edge[1]&&graphFocus.type===type;const planned=labelPlan.get(item.i)||{show:true,t:.5};const path=edgePath(edge,pos,(active&&!planned.show)?.5:planned.t);edgeSvg+=`<path class="edge ${active?"active":""}" data-edge="${item.i}" d="${path.d}" marker-end="url(#${active?"arrowheadActive":"arrowhead"})"><title>${esc(type)}: ${esc(G.nodes[edge[0]].title)} -> ${esc(G.nodes[edge[1]].title)}${label?` (${esc(label)})`:""}</title></path>`;hitSvg+=`<path class="edgeHit" data-edge="${item.i}" d="${path.d}"></path>`;if((planned.show||active)&&((graphMode==="focus"&&visibleEdges.length<=16)||active))labelSvg+=`<text class="edgeLabel ${active?"active":""}" x="${path.lx}" y="${path.ly}" text-anchor="middle">${esc(type).slice(0,28)}</text>`;});}for(const id of ids){const n=G.nodes[id],p=pos[id]||{x:w/2,y:h/2};const active=id===selected;const r=nodeRadius(id);nodeSvg+=`<g class="node ${active?"active":""}" data-page="${attr(id)}"><circle cx="${p.x}" cy="${p.y}" r="${r}" fill="${color(n.section)}"/><title>${esc(n.title)}</title>${labels.has(id)?`<text x="${p.x+r+7}" y="${p.y+4}">${esc(n.title).slice(0,54)}</text>`:""}</g>`;}graph.innerHTML=edgeSvg+hitSvg+labelSvg+nodeSvg;bindEdgeButtons(graph);graph.querySelectorAll("[data-page]").forEach(el=>el.addEventListener("click",e=>{e.preventDefault();pick(el.dataset.page);}));renderGraphInfo();}
collapseNav.onclick=()=>setNavCollapsed(true);navRail.onclick=()=>setNavCollapsed(false);backBtn.onclick=()=>history.back();forwardBtn.onclick=()=>history.forward();document.querySelectorAll(".viewBtn").forEach(btn=>btn.addEventListener("click",()=>{currentView=btn.dataset.view;renderStage();}));document.getElementById("home").onclick=()=>navigate(G.root||"index.md",true);document.getElementById("graphMode").onclick=e=>{graphMode=graphMode==="focus"?"overview":"focus";labelPhase=0;labelLayerCount=1;e.currentTarget.textContent=graphMode==="focus"?"Focus Graph":"Overview Graph";renderStage();};document.getElementById("showLinks").onclick=e=>{showLinks=!showLinks;e.currentTarget.classList.toggle("on",showLinks);renderStage();};zoomOut.onclick=()=>setGraphZoom(graphZoom/1.2);zoomIn.onclick=()=>setGraphZoom(graphZoom*1.2);zoomReset.onclick=resetGraphView;graph.addEventListener("pointerdown",beginGraphPan);graph.addEventListener("pointermove",moveGraphPan);graph.addEventListener("pointerup",endGraphPan);graph.addEventListener("pointercancel",endGraphPan);graph.addEventListener("click",suppressGraphClick,true);graph.addEventListener("dragstart",e=>e.preventDefault());graph.addEventListener("wheel",e=>{if(currentView==="graph"){e.preventDefault();setGraphZoom(graphZoom*(e.deltaY<0?1.12:.89));}},{passive:false});q.addEventListener("input",renderList);window.addEventListener("resize",renderStage);window.addEventListener("popstate",applyLocationFromUrl);window.addEventListener("hashchange",applyLocationFromUrl);
setInterval(()=>{if(currentView==="graph"&&labelLayerCount>1){labelPhase=(labelPhase+1)%labelLayerCount;renderGraph();}},2000);
setCorpus(corpusId,false,false);
</script>
</body>
</html>
"""


if __name__ == "__main__":
    raise SystemExit(main())
