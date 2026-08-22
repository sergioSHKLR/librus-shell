# librus-shell

**Build step 3 of 4** · Multi-flavor reader SPA (maintainers & volunteers)

---

## 📑 Table of contents

1. 🇺🇸 [English](#-english--build-step-3-of-4)
   1. 🎯 [Audience](#-audience)
   2. 🗺️ [Pipeline position](#-pipeline-position)
   3. 🌐 [Live flavors](#-live-flavors)
   4. 🧱 [What this repo owns](#-what-this-repo-owns)
   5. 🚀 [Local development](#-local-development)
   6. 🚢 [Deploy to hosts](#-deploy-to-hosts)
   7. 🎛️ [Flavors & feature flags](#️-flavors--feature-flags)
   8. 🤝 [How to help](#-how-to-help)
2. 🇧🇷 [Português](#-português--etapa-3-de-4)
   1. 🎯 [Público](#-público)
   2. 🗺️ [Posição no pipeline](#-posição-no-pipeline)
   3. 🌐 [Sabores ao vivo](#-sabores-ao-vivo)
   4. 🧱 [O que este repo possui](#-o-que-este-repo-possui)
   5. 🚀 [Desenvolvimento local](#-desenvolvimento-local)
   6. 🚢 [Publicar nos hosts](#-publicar-nos-hosts)
   7. 🎛️ [Sabores e flags](#️-sabores-e-flags)
   8. 🤝 [Como ajudar](#-como-ajudar)

---

# 🇺🇸 English — Build step 3 of 4

Vanilla Vite SPA: library + four-pane reader (Ache · Leia · Consulte · Anote). One codebase ships **librus.app**, **doutrina.org**, and **centro.doutrina.org**.

## 🎯 Audience

1. Frontend / UX maintainers of the shell  
2. Volunteers testing flavors, PWA, and study UX  
3. Collaborators reviewing architecture before wider outreach  

**Not** an end-user manual — point readers at the live sites.

## 🗺️ Pipeline position

1. [`doutrina-content`](https://github.com/sergioSHKLR/doutrina-content) — Markdown source  
2. [`librus-linker`](https://github.com/sergioSHKLR/librus-linker) — provider links  
3. **This repo** — SPA + selective books → `dist` / PWA  
4. Host repos — GitHub Pages publish  

```text
doutrina-content  →  librus-linker  →  librus-shell  →  host Pages
     (1/4)              (2/4)             (3/4)            (4/4)
```

## 🌐 Live flavors

1. [librus.app](https://librus.app) — LIBRUS shelf  
2. [doutrina.org](https://doutrina.org) — Kardec codification  
3. [centro.doutrina.org](https://centro.doutrina.org) — center + codification  

Status: **BETA** — active-study UX; narrow screens use reduced mode (Consulte removed on purpose).

## 🧱 What this repo owns

1. `index.html` · `src/` · `public/flavors.json` · PWA assets  
2. Catalog + book HTML under `public/books/`  
3. GitHub Action that builds and pushes `dist/` to host repos  
4. **Does not** own editorial Markdown masters (step 1) or link-injection tooling (step 2)  

## 🚀 Local development

1. Requires **Node ≥ 20**.  
2. Install and run a flavor:  

```bash
npm install
npm run dev:librus      # http://localhost:5174
npm run dev:doutrina   # http://localhost:5175
npm run dev:centro     # http://localhost:5176
```

3. Or `npm run dev` and force with `?flavor=doutrina`.  
4. Build: `npm run build` · `npm run build:full` · `npm run preview:librus` (etc.).  

## 🚢 Deploy to hosts

1. Workflow: [`.github/workflows/deploy-hosts.yml`](.github/workflows/deploy-hosts.yml)  
2. Triggers: push to `main` · `workflow_dispatch`  
3. Secret on **this** repo: `DEPLOY_TOKEN` (Contents R/W on `librus`, `doutrina`, `centro`)  
4. Publish writes `index.html` → `404.html`, `.nojekyll`, `CNAME`  
5. **centro** publish preserves `flavor.json`, `manual/`, `instance/` (not `assets/`)  

## 🎛️ Flavors & feature flags

1. Edit **`public/flavors.json`** for hosts, brand, providers, JaaS.  
2. Flavor resolution order:  

   1. `?flavor=`  
   2. `localStorage.librus-flavor`  
   3. `VITE_FLAVOR`  
   4. hostname map  
   5. `default`  

3. Flags (defaults): hypo · typo · providers **on**; pdf · jaas · profiles **off**.  

## 🤝 How to help

1. Run a flavor locally; file issues with viewport + flavor id.  
2. Propose UX fixes that keep **active study** (not passive media).  
3. Keep PRs focused; do not hand-edit host `dist/` — change the shell and deploy.  

## 🏅 Credits

1. See [CREDITS.md](./CREDITS.md) — Sergio SHKLR (lead, git metrics) · Grok / xAI (assisted implementation & docs).  

---

# 🇧🇷 Português — Etapa 3 de 4

SPA Vite em vanilla: biblioteca + leitor em quatro painéis (Ache · Leia · Consulte · Anote). Um código publica **librus.app**, **doutrina.org** e **centro.doutrina.org**.

## 🎯 Público

1. Mantenedores frontend / UX do shell  
2. Voluntários que testam sabores, PWA e UX de estudo  
3. Colaboradores que avaliam a arquitetura antes de divulgação ampla  

**Não** é manual do leitor final — aponte para os sites ao vivo.

## 🗺️ Posição no pipeline

1. [`doutrina-content`](https://github.com/sergioSHKLR/doutrina-content) — fonte Markdown  
2. [`librus-linker`](https://github.com/sergioSHKLR/librus-linker) — ligações  
3. **Este repositório** — SPA + livros → `dist` / PWA  
4. Repos host — publicação Pages  

## 🌐 Sabores ao vivo

1. [librus.app](https://librus.app)  
2. [doutrina.org](https://doutrina.org)  
3. [centro.doutrina.org](https://centro.doutrina.org)  

Estado: **BETA** — UX de estudo ativo; telas estreitas usam modo reduzido (Consulte removido de propósito).

## 🧱 O que este repo possui

1. `index.html` · `src/` · `public/flavors.json` · PWA  
2. Catálogo + HTML dos livros em `public/books/`  
3. Action que compila e envia `dist/` aos hosts  
4. **Não** possui os masters editoriais (etapa 1) nem o linker (etapa 2)  

## 🚀 Desenvolvimento local

1. **Node ≥ 20**.  
2. Instale e rode um sabor:  

```bash
npm install
npm run dev:librus      # http://localhost:5174
npm run dev:doutrina   # http://localhost:5175
npm run dev:centro     # http://localhost:5176
```

3. Ou `npm run dev` com `?flavor=…`.  
4. Build: `npm run build` · `npm run build:full` · `npm run preview:…`.  

## 🚢 Publicar nos hosts

1. Workflow: [`.github/workflows/deploy-hosts.yml`](.github/workflows/deploy-hosts.yml)  
2. Gatilhos: push em `main` · `workflow_dispatch`  
3. Segredo neste repo: `DEPLOY_TOKEN`  
4. Publicação gera `404.html`, `.nojekyll`, `CNAME`  
5. Em **centro**, preserva `flavor.json`, `manual/`, `instance/`  

## 🎛️ Sabores e flags

1. Edite **`public/flavors.json`**.  
2. Ordem de resolução: `?flavor=` → `localStorage` → `VITE_FLAVOR` → hostname → `default`.  
3. Flags padrão: hypo · typo · providers **ligados**; pdf · jaas · profiles **desligados**.  

## 🤝 Como ajudar

1. Rode um sabor localmente; abra issues com viewport + id do sabor.  
2. Proponha UX que preserve **estudo ativo** (não mídia passiva).  
3. PRs focados; não edite `dist/` nos hosts à mão — altere o shell e faça deploy.  

## 🏅 Créditos

1. Ver [CREDITS.md](./CREDITS.md) — Sergio SHKLR (líder, métricas git) · Grok / xAI (implementação e docs assistidos).  
