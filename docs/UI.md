# UI language

Family control language for LIBRUS, DOUTRINA, CENTRO, LDE-Q, and SHKLR.

The shell freeze (panes, Help, fullscreen) stays in [`INTERFACE.md`](INTERFACE.md). Flavor marks for the three readers stay in [`docs/brand/`](brand/README.md). This page is the shared language. It does not unfreeze the shell.

Scanned 2026-09-25. The rules below are the language. **Still off** is what the apps still do instead.

---

# English

## Names

App titles are capitals, without the domain: **LIBRUS**, **DOUTRINA**, **CENTRO**, **LDE-Q**, **SHKLR**. The domain stays in an address, an email, and the legal list. The tab title is the app name, not the book title.

## Type and icons

- Interface: Quicksand.
- The book: a serif. Quicksand does not set the question, a chapter title, or the text of a favorited card.
- Icons: Lucide, stroke **2** in the 24 grid, `currentColor`. No second weight. No second icon set.
- A favicon is that same path, on a 512 canvas (`scale(21.33333)`). Stroke 2. The SHKLR mark is the Lucide circle, radius **10**.

## Page

White (`#fff`). The dark theme is `#1a1a1a`. One brand hue per app. The hue does not change the control shape.

| App | Hue |
|---|---|
| LIBRUS | `#6aa84f` |
| DOUTRINA | `#3c78d8` |
| CENTRO | `#cc0000` |
| LDE-Q | `#d4af37` |
| SHKLR | `#8b5cf6` |

## Header

Same on the library and on SHKLR. Mark at `3.5 × 15px`, in the brand hue. Name at `1.35 × 15px`, tracking `0.1em`, weight 700, in the text color. The line under it is muted, `0.9 × 15px`.

## Chrome

- Bottom bar: black (`#111`, `#000` in dark), 50px, plain icons, no chip.
- **Ajustes is the last icon on the right** of that bar.
- LDE-Q keeps three labeled tabs (Início, Questão, Caderno). It is not the four-pane desk. The gear still belongs at the end of that bar.
- Modal: centered, white surface, 12px radius, a title, a plain close mark, a line under the header.

## Controls

A choice is not a chip. A verb is not a radio. A tool is not a chip.

| Control | Shape | Use |
|---|---|---|
| Choice | Fieldset. Legend on the line. Radio and a text label. | Language, theme, one of many |
| Fact | The same fieldset. The value is text or a plain link. | Version, repository, legal notice |
| Verb | Chip: a word and an icon | Highlight, Login, Export |
| Tool | Plain icon, no outline | Gear, star, eye, arrows, close |
| Path | Text and a chevron | Breadcrumbs |
| Field | Bordered box, white, Quicksand | Search, a note, a typed label |

A setting that only picks one option is a choice. **Update** and **Sign out** stay chips, because they do something. A filter on a list (Tudo, Favoritas) may be a chip. A setting may not.

## Do not

- Outline a tool or a breadcrumb.
- Put a chip on a choice.
- Set a button, a chip, or a settings label in the book serif.
- Give the favicon a different stroke or a different radius from the icon.

## Still off

1. **Gear.** LDE-Q puts Ajustes in the top bar, and a second gear on the Início header. The other four put it last on the black bar.
2. **LDE-Q modal** is a bottom sheet on warm paper (`#1c1916` ink, `#ddd4c6` lines, dark `#1a1815`). The others are a centered white dialog. Dark theme there is not `#1a1a1a`.
3. **Tab icons.** `doutrina.org/favicon.svg` and `centro.doutrina.org/favicon.svg` are still the green LIBRUS columns. The brand files (droplet, house) are right. The tab uses the root file. SHKLR still stores the LDE hue as `#c17f3e`.
4. **SHKLR body** is 17px serif, and its headings are the brand purple. Reader chrome is 15px Quicksand. Reader section titles are muted, not the accent.
5. **SHKLR settings** sits on `--lift` (`#ececec`), not the white surface. The next-thought control is a circled tool.

---

# Português

## Nomes

O título do app vai em maiúsculas, sem o domínio: **LIBRUS**, **DOUTRINA**, **CENTRO**, **LDE-Q**, **SHKLR**. O domínio fica no endereço, no email e na lista do aviso legal. A aba mostra o nome do app, não o título do livro.

## Tipo e ícones

- Interface: Quicksand.
- O livro: serifada. Quicksand não entra na questão, no título de capítulo, nem no texto de um cartão favorito.
- Ícones: Lucide, traço **2** na grade de 24, `currentColor`. Sem um segundo peso. Sem um segundo conjunto.
- O favicon é o mesmo traço, numa tela de 512 (`scale(21.33333)`). Traço 2. A marca SHKLR é o círculo do Lucide, raio **10**.

## Página

Branca (`#fff`). O tema escuro é `#1a1a1a`. Um tom de marca por app. O tom não muda a forma do controle.

| App | Tom |
|---|---|
| LIBRUS | `#6aa84f` |
| DOUTRINA | `#3c78d8` |
| CENTRO | `#cc0000` |
| LDE-Q | `#d4af37` |
| SHKLR | `#8b5cf6` |

## Cabeçalho

O mesmo na biblioteca e no SHKLR. Marca a `3,5 × 15px`, no tom da marca. Nome a `1,35 × 15px`, espaçamento `0,1em`, peso 700, na cor do texto. A linha de baixo é discreta, `0,9 × 15px`.

## Chrome

- Barra de baixo: preta (`#111`, `#000` no escuro), 50px, ícones simples, sem chip.
- **Ajustes é o último ícone à direita** dessa barra.
- O LDE-Q mantém três abas com rótulo (Início, Questão, Caderno). Não é a mesa de quatro colunas. A engrenagem continua no fim dessa barra.
- Modal: centrado, superfície branca, raio 12px, título, fechar simples, linha sob o cabeçalho.

## Controles

Escolha não é chip. Ação não é rádio. Ferramenta não é chip.

| Controle | Forma | Uso |
|---|---|---|
| Escolha | Fieldset. Legenda na linha. Rádio e um rótulo. | Idioma, tema, um entre vários |
| Fato | O mesmo fieldset. O valor é texto ou um link simples. | Versão, repositório, aviso |
| Ação | Chip: palavra e ícone | Grifar, Login, Exportar |
| Ferramenta | Ícone simples, sem contorno | Engrenagem, estrela, olho, setas, fechar |
| Caminho | Texto e um chevron | Migalhas |
| Campo | Caixa com borda, branca, Quicksand | Busca, nota, rótulo digitado |

Ajuste que só escolhe uma opção é escolha. **Atualizar** e **Sair** continuam chip, porque fazem alguma coisa. Um filtro de lista (Tudo, Favoritas) pode ser chip. Um ajuste não.

## Não fazer

- Contornar uma ferramenta ou uma migalha.
- Pôr chip numa escolha.
- Pôr botão, chip ou rótulo de ajuste na serifada do livro.
- Dar ao favicon um traço ou um raio diferente do ícone.

## Ainda fora

1. **Engrenagem.** O LDE-Q põe Ajustes na barra de cima, e uma segunda no cabeçalho do Início. Os outros quatro põem no fim da barra preta.
2. **Modal do LDE-Q** é uma folha embaixo, em papel quente (`#1c1916`, linhas `#ddd4c6`, escuro `#1a1815`). Os outros são um diálogo branco centrado. O escuro ali não é `#1a1a1a`.
3. **Ícone da aba.** `doutrina.org/favicon.svg` e `centro.doutrina.org/favicon.svg` ainda são as colunas verdes do LIBRUS. Os arquivos de marca (gota, casa) estão certos. A aba usa o arquivo da raiz. O SHKLR ainda guarda o tom do LDE como `#c17f3e`.
4. **Corpo do SHKLR** é serifada de 17px, e os títulos são o roxo da marca. O chrome dos leitores é Quicksand de 15px. Os títulos de seção do leitor são discretos, não o acento.
5. **Ajustes do SHKLR** assenta em `--lift` (`#ececec`), não na superfície branca. O botão do próximo pensamento é uma ferramenta com contorno.
