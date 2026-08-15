#!/usr/bin/env python3
"""
Build Portuguese Sherlock novel book.json files from Mundo Sherlock chapter pages.
Source attribution: Mundo Sherlock (mundosherlock.wordpress.com), translation
noted as Hamílcar de Garcia / Círculo do Livro.
Private study POC only — do not redistribute as a commercial edition.
"""
from __future__ import annotations

import json
import re
import time
from html import unescape
from pathlib import Path
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT / "public" / "books"
UA = "Mozilla/5.0 (compatible; LIBRUS-POC/0.9; +https://librus.app)"

# (slug, title, titleEn, year, metaPt, metaEn, color, emoji, chapters)
# chapter URLs are full paths under mundosherlock
NOVELS = [
    {
        "id": "estudo-vermelho",
        "pairId": "study-scarlet",
        "title": "Um Estudo em Vermelho",
        "titleEn": "A Study in Scarlet",
        "author": "Arthur Conan Doyle",
        "year": 1887,
        "meta": "Romance · 1887",
        "metaEn": "Novel · 1887",
        "emoji": "🔎",
        "color": "#9b2c2c",
        "chapters": [
            (
                "ch-p1-01",
                "1.1. O Sr. Sherlock Holmes",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-1/",
            ),
            (
                "ch-p1-02",
                "1.2. A ciência da dedução",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-2/",
            ),
            (
                "ch-p1-03",
                "1.3. O mistério de Lauriston Gardens",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-3/",
            ),
            (
                "ch-p1-04",
                "1.4. O que John Rance tinha a contar",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-4/",
            ),
            (
                "ch-p1-05",
                "1.5. Nosso anúncio traz um visitante",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-5/",
            ),
            (
                "ch-p1-06",
                "1.6. Tobias Gregson mostra o que pode fazer",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-6/",
            ),
            (
                "ch-p1-07",
                "1.7. Uma luz nas trevas",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-primeira-parte-capitulo-7/",
            ),
            (
                "ch-p2-01",
                "2.1. No deserto do Colorado",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-1/",
            ),
            (
                "ch-p2-02",
                "2.2. A flor do Utah",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-2/",
            ),
            (
                "ch-p2-03",
                "2.3. John Ferrier fala com o profeta",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-3/",
            ),
            (
                "ch-p2-04",
                "2.4. Fuga desesperada",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-4/",
            ),
            (
                "ch-p2-05",
                "2.5. Os anjos vingadores",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-5/",
            ),
            (
                "ch-p2-06",
                "2.6. Continuação das memórias do dr. Watson",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-6/",
            ),
            (
                "ch-p2-07",
                "2.7. Conclusão",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-um-estudo-em-vermelho-1887/um-estudo-em-vermelho-%e2%80%93-segunda-parte-capitulo-7/",
            ),
        ],
    },
    {
        "id": "sinal-quatro",
        "pairId": "sign-four",
        "title": "O Signo dos Quatro",
        "titleEn": "The Sign of the Four",
        "author": "Arthur Conan Doyle",
        "year": 1890,
        "meta": "Romance · 1890",
        "metaEn": "Novel · 1890",
        "emoji": "🧭",
        "color": "#2b6cb0",
        "chapters": [
            (
                f"ch-{i:02d}",
                f"1.{i}. Capítulo {i}",
                f"https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-signo-dos-quatro-1890/o-signo-dos-quatro-capitulo-{i}/",
            )
            for i in range(1, 13)
        ],
    },
    {
        "id": "cao-baskervilles",
        "pairId": "hound",
        "title": "O Cão dos Baskervilles",
        "titleEn": "The Hound of the Baskervilles",
        "author": "Arthur Conan Doyle",
        "year": 1902,
        "meta": "Romance · 1902",
        "metaEn": "Novel · 1902",
        "emoji": "🐺",
        "color": "#744210",
        "chapters": [
            (
                f"ch-{i:02d}",
                f"1.{i}. Capítulo {i}",
                (
                    f"https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-cao-dos-baskervilles-1902/o-cao-dos-baskervilles-%e2%80%93-capitulo-{i}/"
                    if i <= 8
                    else f"https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-cao-dos-baskervilles-1902/o-cao-dos-baskervilles-capitulo-{i}/"
                ),
            )
            for i in range(1, 16)
        ],
    },
    {
        "id": "vale-medo",
        "pairId": "valley-fear",
        "title": "O Vale do Terror",
        "titleEn": "The Valley of Fear",
        "author": "Arthur Conan Doyle",
        "year": 1915,
        "meta": "Romance · 1915",
        "metaEn": "Novel · 1915",
        "emoji": "⛰️",
        "color": "#553c9a",
        "chapters": [
            *[
                (
                    f"ch-p1-{i:02d}",
                    f"1.{i}. Capítulo {i}",
                    f"https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-vale-do-terror-1915/o-vale-do-terror-%e2%80%93-primeira-parte-capitulo-{i}/",
                )
                for i in range(1, 8)
            ],
            *[
                (
                    f"ch-p2-{i:02d}",
                    f"2.{i}. Capítulo {i}",
                    f"https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-vale-do-terror-1915/o-vale-do-terror-%e2%80%93-segunda-parte-capitulo-{i}/",
                )
                for i in range(1, 8)
            ],
            (
                "ch-ep",
                "2.8. Epílogo",
                "https://mundosherlock.wordpress.com/canon_e/arthur-conan-doyle-o-vale-do-terror-1915/o-vale-do-terror-%e2%80%93-epilogo/",
            ),
        ],
    },
]


def fetch(url: str) -> str:
    req = Request(url, headers={"User-Agent": UA})
    with urlopen(req, timeout=40) as r:
        return r.read().decode("utf-8", "replace")


def extract_entry(html: str) -> str:
    m = re.search(
        r'<div[^>]+class="[^"]*entry-content[^"]*"[^>]*>(.*?)</div>\s*<(?:footer|nav|div class=")',
        html,
        re.S | re.I,
    )
    if not m:
        m = re.search(
            r'class="entry-content"[^>]*>(.*?)(?:<!-- \.entry-content|class="sharedaddy"|class="entry-meta")',
            html,
            re.S | re.I,
        )
    if not m:
        raise RuntimeError("entry-content not found")
    body = m.group(1)
    body = re.sub(r"<script[\s\S]*?</script>", "", body, flags=re.I)
    body = re.sub(r"<style[\s\S]*?</style>", "", body, flags=re.I)
    body = re.sub(r"<noscript[\s\S]*?</noscript>", "", body, flags=re.I)
    # drop share / nav chrome
    body = re.sub(
        r'<div class="sharedaddy[\s\S]*?</div>\s*</div>',
        "",
        body,
        flags=re.I,
    )
    body = re.sub(r"<figure[\s\S]*?</figure>", "", body, flags=re.I)
    body = re.sub(r"<img[^>]*>", "", body, flags=re.I)
    # keep p/h/em/strong/blockquote only-ish — strip class attrs noise
    body = re.sub(r'\sclass="[^"]*"', "", body)
    body = re.sub(r"\sstyle=\"[^\"]*\"", "", body)
    body = re.sub(r"\sid=\"[^\"]*\"", "", body)
    return body.strip()


def chapter_heading(cid: str, label: str, body: str) -> str:
    # Prefer first strong chapter title in body if present
    title = label
    m = re.search(r"<strong>(Capítulo[^<]+)</strong>", body, re.I)
    if m:
        title = unescape(re.sub(r"<[^>]+>", "", m.group(1))).strip()
    # remove front matter boilerplate before first real paragraph after chapter mark
    cleaned = body
    # drop "Sobre o texto" blocks
    cleaned = re.sub(
        r"Sobre o texto em português:[\s\S]*?(?=<p|<h\d|Capítulo|\*\*\*Capítulo)",
        "",
        cleaned,
        flags=re.I,
    )
    return f'<section id="{cid}"><h2 id="{cid}-h">{title}</h2>\n{cleaned}\n</section>'


def build_novel(novel: dict) -> dict:
    parts = []
    toc = []
    print(f"== {novel['id']} ==")
    for cid, label, url in novel["chapters"]:
        for attempt in range(3):
            try:
                raw = fetch(url)
                body = extract_entry(raw)
                break
            except Exception as e:
                print(f"  retry {cid}: {e}")
                time.sleep(1.5 * (attempt + 1))
        else:
            raise RuntimeError(f"failed {url}")
        # refine label from heading
        m = re.search(r"\*\*\*Capítulo[^*]*\*\*\*|Capítulo\s+[^\n<]+", body)
        if m:
            lab = unescape(re.sub(r"<[^>]+>|\*+", "", m.group(0))).strip()
            if lab:
                label = lab
        parts.append(chapter_heading(cid, label, body))
        toc.append(
            {
                "id": cid,
                "label": label,
                "labelPt": label,
                "labelEn": label,
            }
        )
        print(f"  ok {cid} ({len(body)} chars)")
        time.sleep(0.6)
    html = (
        f'<h1 id="{novel["id"]}">{novel["title"]}</h1>'
        f'<p class="meta-line">{novel["author"]}, {novel["year"]}</p>\n'
        + "\n".join(parts)
    )
    return {
        "id": novel["id"],
        "title": novel["title"],
        "titlePt": novel["title"],
        "titleEn": novel["titleEn"],
        "author": novel["author"],
        "year": novel["year"],
        "meta": novel["meta"],
        "metaPt": novel["meta"],
        "metaEn": novel["metaEn"],
        "lang": "pt",
        "pairId": novel["pairId"],
        "paged": False,
        "toc": toc,
        "pages": [{"id": novel["id"] + "-body", "html": html}],
        "source": "Mundo Sherlock (mundosherlock.wordpress.com); tradução Círculo do Livro / Hamílcar de Garcia",
    }


def main():
    catalog_extra = []
    for novel in NOVELS:
        book = build_novel(novel)
        out_dir = BOOKS / novel["id"]
        out_dir.mkdir(parents=True, exist_ok=True)
        (out_dir / "book.json").write_text(
            json.dumps(book, ensure_ascii=False, separators=(",", ":")),
            encoding="utf-8",
        )
        (out_dir / "SOURCE.txt").write_text(
            book["source"] + "\nBuilt for LIBRUS POC bilingual shelf.\n",
            encoding="utf-8",
        )
        catalog_extra.append(
            {
                "id": novel["id"],
                "title": novel["titleEn"],
                "titlePt": novel["title"],
                "author": novel["author"],
                "year": novel["year"],
                "meta": novel["metaEn"],
                "metaPt": novel["meta"],
                "lang": "pt",
                "pairId": novel["pairId"],
                "path": f"/books/{novel['id']}/book.json",
                "profiles": ["librus"],
                "emoji": novel["emoji"],
                "color": novel["color"],
            }
        )
        print("wrote", out_dir / "book.json")
    # merge into catalog.json
    cat_path = BOOKS / "catalog.json"
    cat = json.loads(cat_path.read_text(encoding="utf-8"))
    # tag EN holmes with pairId
    pair_map = {n["pairId"]: n["id"] for n in NOVELS}
    for e in cat:
        if e.get("id") in pair_map:
            e["pairId"] = e["id"]
            e["lang"] = e.get("lang") or "en"
    # remove prior PT holmes if re-run
    pt_ids = {n["id"] for n in NOVELS}
    cat = [e for e in cat if e.get("id") not in pt_ids]
    cat.extend(catalog_extra)
    cat_path.write_text(
        json.dumps(cat, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    # catalog-librus: all librus profile books
    librus = [e for e in cat if "librus" in (e.get("profiles") or [])]
    (BOOKS / "catalog-librus.json").write_text(
        json.dumps(librus, ensure_ascii=False, indent=2) + "\n", encoding="utf-8"
    )
    print("catalog updated, librus entries:", len(librus))


if __name__ == "__main__":
    main()
