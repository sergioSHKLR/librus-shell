# Interface freeze — v0.9.10

**Date:** 2026-09-10  
**Version:** `0.9.10` BETA  
**Repo:** `librus-shell` (build step 3 of 4)

Chrome, Help, flavors, and Consulte empty-state are **frozen** (v0.9.9). **v0.9.10** is handheld/toolbar polish on that freeze. Do not add panes, bar items, Help beats, or flavor marks without an explicit unfreeze. Book HTML/CSS and editorial Markdown are **not** frozen.

---

# 🇺🇸 English

## Frozen

1. **Desk** — four panes, left to right: **1. Ache · 2. Leia · 3. Consulte · 4. Anote** (EN pane titles still Find · Read · Consult · Annotate).  
2. **Library CTA** — PT `Ache · Leia · Consulte · Anote` · EN `Find · Read · Lookup · Note`. Same line on LIBRUS, DOUTRINA, CENTRO.  
3. **Marks** — three Lucide strokes, accent only as color: LIBRUS columns-4 `#008b00` · DOUTRINA droplet `#1e90ff` · CENTRO house-heart `#da2f2f`. Do not collapse to one glyph.  
4. **Floor bar** — Library: Help · Settings only (no Home, no wordmark, no BETA). Reader: Home › emoji + book title; Help · Settings. `document.title` is `Book · Flavor` in the reader, flavor name on the shelf.  
5. **BETA** — Settings → Sobre, next to `v0.9.10`.  
6. **Help (bar ?)** — full-bleed 1×4 map, five steps, bar stays visible. Steps 2–3: in-pane cards. Steps 4–5: card in Consulte/Anote with a **left** arrow into **2. Leia**. Portrait (≤920px): equal columns, tighter titles, arrows still to Leia. First-visit Device tab stays hidden.  
7. **How-to** — first visit, How-to only; do not add beats (already ~10).  
8. **Consulte empty state** — provider banners. Wikipedia/Wikcionário wordmarks `#4D4D4D` + `invert(1)` in dark. Luz and Bible are SVG lockups (`public/providers/luz.svg`, `bible.svg`). Kardecpedia / OSM unchanged. Web tab label is **Consulte** / **Consult** (not Context). PDF tab follows Consulte (tablet+; off on phone).  
9. **Viewport** — phone landscape blocked (rotate to portrait). Portrait phone: Leia + Ache overlay; Consulte off. Names: Consult not Context.  
   Installed / handheld: edge-to-edge (`display: fullscreen`, `viewport-fit=cover`, `black-translucent`). Floor bar and workspace use `safe-area-inset-*`. Hide-on-scroll floor bar: phone **and** tablet (≤1400).  
   Android phones often install as **standalone** (status bar stays); we still call `requestFullscreen({ navigationUI: "hide" })` — do not treat standalone as already immersive. Tablets may get true `display: fullscreen`.  
10. **Páginas toolbar** — hard/folio pages: `‹ n / X ›`. Unpaged: live `n%` of `#book` scroll. Links on/off (inset bottom accent; hidden on phone). Fullscreen toggle **right-aligned** on this row (not Tipo); inset for the collapsed Hypothesis rail at ≤1400. Tab accents stay on **top**.  
11. **Tipo defaults** — tablet/phone: wide column + justify. Desktop/laptop: medium + start. User cycles win for the session.

## Not frozen

1. Book bodies under `public/books/` and `#book` presentation CSS.  
2. Editorial masters in [`doutrina-content`](https://github.com/sergioSHKLR/doutrina-content).  
3. Link injection in [`librus-linker`](https://github.com/sergioSHKLR/librus-linker).  
4. LDE pull stamp in `public/books/lde/SOURCE.txt` (2026-08-02).

## Do not

1. Unify flavor logos.  
2. Rename Consulte to Context.  
3. Put BETA or the app title back on the Library bar.  
4. Add Help map beats without removing one.  
5. Arrow on Help slide 2 (Ache is an in-pane inventory, not a Leia handoff).

---

# 🇧🇷 Português

## Congelado

1. **Mesa** — quatro colunas: **1. Ache · 2. Leia · 3. Consulte · 4. Anote**.  
2. **CTA da biblioteca** — `Ache · Leia · Consulte · Anote` / `Find · Read · Lookup · Note` nos três sabores.  
3. **Marcas** — três ícones Lucide, só a cor de acento muda.  
4. **Barra** — Biblioteca: só Ajuda · Ajustes. Leitor: Home › livro. BETA em Ajustes, ao lado de `v0.9.10`.  
5. **Ajuda** — mapa 1×4, cinco passos; setas dos passos 4–5 apontam para Leia. Retrato: colunas iguais.  
6. **Consulte** — banners; Wikipedia cinza+invert no escuro; Luz e Bible em SVG. Aba web **Consulte**, não Contexto. PDF no tablet.  
7. **Tela cheia** — PWA/tablet/celular cobrem as barras do sistema; botão à direita em Páginas (não em Tipo).  
8. **Páginas** — `‹ n / X ›` ou `n%` se não houver fólios; Links; esconder barra ao rolar no tablet.  
9. **Tipo** — tablet/celular: coluna larga + justificado.

## Não congelado

Livros (`public/books/`, CSS de `#book`), Markdown editorial (etapa 1), ligações (etapa 2).

## Não fazer

Unificar logos · voltar a Context · BETA na barra da biblioteca · novos beats na Ajuda sem tirar um · seta no passo 2 da Ajuda.
