# Interface freeze — v0.9.13

**Date:** 2026-09-10  
**Version:** `0.9.13` BETA  
**Repo:** `librus-shell` (build step 3 of 4)

Chrome, Help, flavors, and Consulte empty-state are **frozen** (v0.9.9). **v0.9.10** is handheld/toolbar polish. **v0.9.11–0.9.12** were Fullscreen API experiments. **v0.9.13** locks the policy: no Fullscreen API on tall Android phones; manual only on slates/desktop. 2026-09-11: Páginas left-align + labels, Hypo dark ink, LDE `vine.webp`. **2026-09-12:** LDE `#book` presentation and shelf **BETA** on unfinished Kardec covers. See [`KNOWN-LIMITATIONS.md`](KNOWN-LIMITATIONS.md). Do not add panes, bar items, Help beats, or flavor marks without an explicit unfreeze. Book HTML/CSS and editorial Markdown are **not** frozen.

---

# 🇺🇸 English

## Frozen

1. **Desk** — four panes, left to right: **1. Ache · 2. Leia · 3. Consulte · 4. Anote** (EN pane titles still Find · Read · Consult · Annotate).  
2. **Library CTA** — PT `Ache · Leia · Consulte · Anote` · EN `Find · Read · Lookup · Note`. Same line on LIBRUS, DOUTRINA, CENTRO.  
3. **Marks** — three Lucide strokes, accent only as color: LIBRUS columns-4 `#008b00` · DOUTRINA droplet `#3c78d8` (Google Drawings Dark blue 1) · CENTRO house-heart `#da2f2f`. Do not collapse to one glyph. Pane titles follow the same Drawings columns: Ache `#990000` · Leia `#1155cc` · Consulte `#38761d` · Anote `#7f6000` (Dark yellow 3; stationery used Dark yellow 2 `#bf9000`, which fails AA on white).  
4. **Floor bar** — Library: Help · Settings only (no Home, no wordmark, no BETA). Reader: Home + emoji + book title (no `›`); Help · Settings. `document.title` is `Book · Flavor` in the reader, flavor name on the shelf.  
5. **BETA** — Settings → Sobre, next to `v0.9.13`. Library **bar** stays without BETA. Shelf **covers** may show a small gold `BETA` (LDM · ESE · CEU · GEN); LDE is unmarked.  
6. **Help (bar ?)** — full-bleed 1×4 map, five steps, bar stays visible. Steps 2–3: in-pane cards. Steps 4–5: card in Consulte/Anote with a **left** arrow into **2. Leia**. Portrait (≤920px): equal columns, tighter titles, arrows still to Leia. First-visit Device tab stays hidden.  
7. **How-to** — first visit, How-to only; do not add beats (already ~10).  
8. **Consulte empty state** — provider banners. Wikipedia/Wikcionário wordmarks `#4D4D4D` + `invert(1)` in dark. Luz and Bible are SVG lockups (`public/providers/luz.svg`, `bible.svg`). Kardecpedia / OSM unchanged. Web tab label is **Consulte** / **Consult** (not Context). PDF tab follows Consulte (tablet+; off on phone). Videoconf: stage + status only (no idle footnote).  
9. **Viewport / fullscreen** — phone landscape blocked (rotate to portrait). Portrait phone: Leia + Ache overlay; Consulte off.  
   Installed / handheld: standalone PWA (`display: standalone`, `viewport-fit=cover`, `black-translucent`). Floor bar and workspace use `safe-area-inset-*`. Hide-on-scroll floor bar: phone **and** tablet (≤1400).  
   **Fullscreen API:** off on tall Android phones (aspect ≥ 1.85) — known Chrome/OEM bug (Moto G Stylus 2025: black flash + exit toast). Tab M9–class slates and desktop keep a **manual** `#book-fs` only. Never auto-enter. Never `{ navigationUI: "hide" }` on Android. Manifest `orientation` is `any`. `theme-color` follows the Leia tab band.  
10. **Páginas toolbar** — left-aligned, no hairline: **Links** · pager (`‹ n / X páginas ›`, or `‹ n% leitura ›` / `‹ n% reading ›` if unpaged) · **Tela Cheia** / Full screen (icon + label). Same order on every flavor. Links on/off (inset bottom accent; hidden on phone). Fullscreen on this row when the API is allowed (not Typo); hidden on tall Android phones. No `.tool-sep` on any toolbar. Tab accents stay on **top**.  
11. **Typo defaults** — tablet/phone: wide column + justify. Desktop/laptop: medium + start. User cycles win for the session. Tab label is **Tipo** (PT) / **Typo** (EN).  
12. **Hypothesis branding** — `appBackgroundColor` follows `--surface` (`#fff` / `#0a0a0a`). `accentColor` stays `#111` (Hypo TopBar is hardcoded `bg-white`; light ink on that bar is unreadable). CTA is dark fill + white label. Config is boot-time; theme swap updates config only (sidebar catches up on reload).

## Not frozen

1. Book bodies under `public/books/` and `#book` presentation CSS.  
2. Editorial masters in [`doutrina-content`](https://github.com/sergioSHKLR/doutrina-content).  
3. Link injection in [`librus-linker`](https://github.com/sergioSHKLR/librus-linker).  
4. LDE pull stamp in `public/books/lde/SOURCE.txt` (2026-08-02; presentation restamp 2026-09-12). Preface figure is `images/vine.webp` (alpha cutout; `vine.png` unused).  

### Book presentation (2026-09-12)

1. **Column** — Tipo still cycles Estreita / Média / Larga. `#book` padding is at least **10px** each side (`--book-gutter: max(10px, clamp(1.25rem, 3.5%, 2rem))`).  
2. **Questions** — numeric `#️⃣ n` (and `790.a`) sit **in the line** with the question text + a period (`#️⃣ 12.`). Titled H5s (ESE chapters, index letters) stay headings. No print-style gutter column.  
3. **Voices** — `.spirit-block` blue rail + wash (italic); `.kardec-block` slate; `.bible-block` purple. Marks (✨ 🎓 ✝️) stay in the quote, not in the margin. Spirit **author** last line is not bold.  
4. **Cites** — `.bible-cite` is roman, muted. Tokens: book → Wikipedia; **cap. N** → Wikipedia chapter; **vers. N** → Bible.com ARC verse; **ARC** → [Bible.com ARC version](https://www.bible.com/pt/versions/212-arc-almeida-revista-e-corrigida). Consulte **uses the stamped `href`** (does not re-search the label).  
5. **In-book jumps** — `#fn…` / `#s…` / Termos relacionados scroll inside `#book` and keep focus on the target (Hypothesis wrap must not snap back to the clicked link). Consulte **Voltar** walks iframe history; empty stack returns to the Consulte hint (not Wikipedia home).  
6. **Secondary chrome** — Termos relacionados and **Voltar para** parent hops are `0.92em` muted; links underline on hover only (`#book a` generally).  
7. **Shelf** — `catalog*.json` `"beta": true` on LDM · ESE · CEU · GEN. Drop the flag when a book graduates.

## Do not

1. Unify flavor logos.  
2. Rename Consulte to Context.  
3. Put BETA or the app title back on the Library bar.  
4. Add Help map beats without removing one.  
5. Arrow on Help slide 2 (Ache is an in-pane inventory, not a Leia handoff).
6. Re-enable auto Fullscreen API or `display: fullscreen` in the shared manifest.

---

# 🇧🇷 Português

## Congelado

1. **Mesa** — quatro colunas: **1. Ache · 2. Leia · 3. Consulte · 4. Anote**.  
2. **CTA da biblioteca** — `Ache · Leia · Consulte · Anote` / `Find · Read · Lookup · Note` nos três sabores.  
3. **Marcas** — três ícones Lucide, só a cor de acento muda.  
4. **Barra** — Biblioteca: só Ajuda · Ajustes. Leitor: Home + emoji + livro (sem `›`). BETA em Ajustes, ao lado de `v0.9.13`. Capas LDM · ESE · CEU · GEN podem ter **BETA** dourado; LDE sem selo. A barra da biblioteca continua sem BETA.  
5. **Ajuda** — mapa 1×4, cinco passos; setas dos passos 4–5 apontam para Leia. Retrato: colunas iguais.  
6. **Consulte** — banners; Wikipedia cinza+invert no escuro; Luz e Bible em SVG. Aba web **Consulte**, não Contexto. PDF no tablet. Videoconf sem rodapé de dica.  
7. **Tela cheia** — PWA standalone. Sem Fullscreen API em celular Android alto (limitação conhecida). Tablet (Tab M9) e desktop: botão manual em Páginas, à esquerda com Links e o pager. Nunca auto-enter.  
8. **Páginas** — esquerda, sem traço, mesma ordem em todos os sabores: Links · `‹ n / X páginas ›` (ou `‹ n% leitura ›`) · Tela Cheia (ícone + rótulo); esconder barra ao rolar no tablet.  
9. **Tipo** — tablet/celular: coluna larga + justificado. Aba **Tipo** (EN **Typo**).  
10. **Hypothesis** — fundo do painel segue `--surface`; `accentColor` fica `#111` (a TopBar do Hypo é branca). Troca de tema só atualiza o config; o iframe pega no reload.

## Não congelado

Livros (`public/books/`, CSS de `#book`), Markdown editorial (etapa 1), ligações (etapa 2).

**Apresentação LDE (2026-09-12):** vozes com trilho+lavagem; perguntas `#️⃣ n.` na linha; cites cap./vers./ARC; Consulte usa o `href` carimbado; Termos relacionados e Voltar para em `0.92em`; BETA nas capas inacabadas.

## Não fazer

Unificar logos · voltar a Context · BETA na barra da biblioteca · novos beats na Ajuda sem tirar um · seta no passo 2 da Ajuda · religar Fullscreen API automática no celular.
