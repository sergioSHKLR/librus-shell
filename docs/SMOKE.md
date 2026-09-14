# Smoke checklist

Interactive page (log + checkboxes + reset): **`/smoke.html`** on any flavor
(`https://librus.app/smoke.html`, or `http://localhost:5174/smoke.html`).

Plain-text copy below if you prefer git/markdown. Reset the HTML page with **Reset**
(archives the pass in the log). Here: clear the header and turn `- [x]` back to `- [ ]`.

## Reset

1. Clear **Version / Date / Tester / Build / Flavor / Viewport**.
2. Replace every `- [x]` with `- [ ]` (and drop fail notes).
3. Set **Version** from Settings → Sobre (`v0.9.x BETA`).

**Version:** ______ &nbsp; **Date:** ______ &nbsp; **Tester:** ______  
**Build:** live / local &nbsp; **Flavor:** librus / doutrina / centro  
**Viewport:** ______ × ______ (CSS px)

---

## Boot

- [ ] Hard-refresh (or drop the PWA and reopen) so the service worker is not stale
- [ ] Settings → Sobre shows this **Version** + **BETA**
- [ ] Library bar: Help · Settings only (no Home, no BETA on the bar)
- [ ] Shelf: LDE unmarked; LDM · ESE · CEU · GEN may show gold **BETA**

## Reader — LDE

- [ ] Open LDE; `document.title` is `O Livro dos Espíritos · Flavor`
- [ ] Páginas pager steps; hash jumps (`#s…`, footnotes, Voltar para) still work
- [ ] **Links off** (tablet/desktop): Guillon / Lei 9.610 / FEB read as plain text
- [ ] **Links off:** TOC and `#s` / `#fn` jumps still work
- [ ] **Links on:** a dict stamp opens Consulte with a real pt.wiktionary page (not empty)
- [ ] A Luz or wiki stamp still opens the right provider

## Folds (resize the window)

- [ ] **>1650:** four columns; Ache is a pane, not a drawer
- [ ] **≤1650 first P1 fold:** open Ache — drawer sits **under** `#main-tabs` (Páginas / Tipo / folded tabs stay clickable)
- [ ] Floor bar unchanged (do not shrink from the bottom)
- [ ] **≤1400:** Anote gone; Consulte still a column
- [ ] **≤920 portrait:** Leia + Ache overlay; Consulte hidden; **Links** control hidden

## Phone / tablet / PWA

- [ ] Phone landscape: rotate-to-portrait gate (no dual-pane study)
- [ ] Phone/tablet: floor bar hides on scroll down, returns on scroll up
- [ ] Tall Android PWA: **Tela Cheia** hidden; never auto-fullscreen
- [ ] Slate / desktop: **Tela Cheia** shown, manual only
- [ ] Overlay still does not cover the tab strip (same as first fold)

## Chrome

- [ ] Help `?`: full-bleed 1×4 map, five steps, bar stays
- [ ] Theme light / dark / system
- [ ] Language PT / EN (Páginas · Tipo · Consulte labels)
- [ ] Home from reader returns to the shelf

## Flavors (once per version, not every width)

- [ ] librus.app (or `:5174`) green mark, LDE
- [ ] doutrina.org (or `:5175`) blue mark
- [ ] centro.doutrina.org (or `:5176`) red mark; JaaS chrome only here

## After

- [ ] No leftover overlay covering tabs after close
- [ ] No empty Consulte pane from a dict click
- [ ] Failures listed below

**Fails:**

---

# 🇧🇷 Português

**Versão:** ______ &nbsp; **Data:** ______ &nbsp; **Quem:** ______  
**Build:** ao vivo / local &nbsp; **Sabor:** librus / doutrina / centro  
**Viewport:** ______ × ______

Reset: limpe o cabeçalho e troque `- [x]` por `- [ ]`.

- [ ] Sobre mostra a versão + BETA
- [ ] LDE abre; Links off esconde Guillon / Lei / FEB; saltos `#s` / `#fn` funcionam
- [ ] Links on: dicionário abre verbete real no Wikcionário
- [ ] Primeira dobra P1 (≤1650): Ache **não** cobre as abas
- [ ] Retrato ≤920: só Leia + Ache; Consulte e Links sumidos
- [ ] Paisagem no telefone: peça para girar
- [ ] Ajuda, tema, idioma, Home
- [ ] Três sabores (marcas verde / azul / vermelho)
