/**
 * librus-shell — lean multi-flavor reader
 * Views · i18n · light/dark · 4 panes → 1 · typo · providers · Hypothesis
 * PDF + JaaS (centro) on by default; mocks remain for lean builds
 */
import "./styles.css";
import { registerSW } from "virtual:pwa-register";
import { FEAT, applyFeatureDom } from "./features.js";
import { hydrateIcons } from "./icons.js";
import {
  bindOnboard,
  initOnboard,
  openOnboard,
  closeOnboard,
  dismissOnboard,
  isOnboardOpen,
  shouldOfferOnboard,
  stopViewportAnim,
  syncViewportRatio,
  applyViewportStep,
  isLibraryView,
} from "./onboard/index.js";
import {
  bindHelp,
  initHelp,
  syncHelpI18n,
  syncHelpViewport,
  syncHelpPortraitGate,
  startHelpPaneIntro,
  finishHelpPaneIntro,
  syncHelpPaneFeatures,
  resetHelpMap,
} from "./help.js";
import {
  loadFlavor,
  getFlavor,
  getFlavorId,
  filterCatalog,
  findPairedEdition,
  applyFlavorBrand,
  flavorFavicon,
} from "./flavor.js";

const THEME_KEY = "librus-theme";
const GUIDE_KEY = "librus-color-guide";
/** @type {'full'|'soft'|'min'} */
let colorGuide = "full";
const LANG_KEY = "librus-lang";
const HELP_DISMISS_KEY = "librus-help-dismiss";
/**
 * Viewport ladder (width). Phone landscape is blocked (rotate to portrait).
 * Matches Help: desktop → laptop (fold find) → tablet (no notes, slim
 * providers) → phone portrait (Leia + Ache overlay; no Consulte, no links).
 */
const VP = {
  FOLD_FIND: 1650,
  FOLD_NOTES: 1400,
  FOLD_CONSULT: 920,
};
/** @deprecated alias — consult fold / phone tier */
const STUDY_REDUCED_MAX_W = VP.FOLD_CONSULT;
/** Providers kept on tablet/phone (flavor allowlist still applies). */
const NARROW_PROVIDERS = ["encyc", "dict"];
const APP_VERSION = "0.9.9";

/**
 * @param {number} [w]
 * @returns {'desktop'|'laptop'|'tablet'|'phone'}
 */
function vpTier(w = window.innerWidth || 0) {
  if (w > VP.FOLD_FIND) return "desktop";
  if (w > VP.FOLD_NOTES) return "laptop";
  if (w > VP.FOLD_CONSULT) return "tablet";
  return "phone";
}

function isLandscape(
  w = window.innerWidth || 0,
  h = window.innerHeight || 0,
) {
  return w > 0 && h > 0 && w > h;
}

/** Phone (≤920) in landscape — gate asks for portrait. */
function isPhoneLandscape(
  w = window.innerWidth || 0,
  h = window.innerHeight || 0,
) {
  return vpTier(w) === "phone" && isLandscape(w, h);
}

/** Phone: no Consulte overlay (reader + Ache only). */
function shouldFoldConsult(
  w = window.innerWidth || 0,
  h = window.innerHeight || 0,
) {
  void w;
  void h;
  return false;
}

function phoneReaderOnly(w = window.innerWidth || 0) {
  return vpTier(w) === "phone";
}

/** PDF on desktop/laptop only; no Consulte on phone; video not on phone. */
function toolAllowedBySize(mode, tier = vpTier()) {
  if (String(mode).startsWith("consult:") && tier === "phone") return false;
  if (mode === "consult:pdf") return tier === "desktop" || tier === "laptop";
  if (mode === "consult:video") return tier !== "phone";
  return true;
}

function providerAllowedBySize(key, tier = vpTier()) {
  /* Tablet still has a Consulte column — same portals as desk, sliding strip.
   * Phone has no Consulte; keep the lean list if that pane is ever shown. */
  if (tier === "phone") return NARROW_PROVIDERS.includes(key);
  return true;
}

const I18N = {
  pt: {
    "pane.find": "1. Ache",
    "pane.read": "2. Leia",
    "pane.consult": "3. Consulte",
    "pane.annotate": "4. Anote",
    "library.title": "LIBRUS",
    "library.cta": "Ache · Leia · Consulte · Anote",
    "library.heading": "Biblioteca",
    "tab.toc": "Sumário",
    "tab.search": "Busca",
    "tab.book": "Páginas",
    "tab.typo": "Tipo",
    "tab.context": "Contexto",
    "tab.pdf": "PDF",
    "tab.video": "Conf",
    "tab.notes": "Notas",
    "btn.prev": "Anterior",
    "btn.next": "Próxima",
    "page.unit": "páginas",
    "btn.back": "Voltar",
    "btn.reload": "Recarregar",
    "btn.zoomIn": "Mais",
    "btn.zoomOut": "Menos",
    "btn.joinVideo": "Vídeo",
    "btn.joinVoice": "Voz",
    "btn.leave": "Sair",
    "ph.filter": "Filtrar…",
    "ph.search": "Buscar… (Enter)",
    "typo.size": "Texto",
    "typo.line": "Linhas",
    "typo.measure": "Coluna",
    "typo.narrow": "Estreita",
    "typo.medium": "Média",
    "typo.wide": "Larga",
    "typo.alignStart": "Alinhar",
    "typo.alignJustify": "Justificar",
    "typo.sans": "Sans",
    "typo.serif": "Serif",
    "tip.typo.size": "Tamanho do texto",
    "tip.typo.line": "Altura da linha",
    "tip.typo.measure": "Largura da coluna",
    "tip.typo.align": "Alinhamento",
    "tip.typo.font": "Fonte",
    "tip.page.prev": "Página anterior",
    "tip.page.next": "Próxima página",
    "tip.ctx.back": "Voltar na consulta",
    "tip.ctx.reload": "Recarregar página de consulta",
    "tip.close": "Fechar",
    "tip.home": "Biblioteca",

    "tab.links": "Links",
    "tip.links": "Mostrar / ocultar links no texto",
    "prov.luz": "Luz Espírita",
    "prov.encyc": "Enciclopédia",
    "prov.dict": "Dicionário",
    "prov.map": "Mapas",
    "prov.bible": "Bíblia",
    "prov.kardec": "Kardecpedia",
    "ctx.searching": 'Buscando "{term}" em {provider}',
    "ctx.opening": "Abrindo {provider}…",
    "ctx.loading": "Carregando…",
    "ctx.hintTitle": "Como consultar",
    "ctx.hintBody":
      "Selecione um termo no painel Leia e clique num provedor acima (Luz Espírita, Enciclopédia, Dicionário, etc). Também pode usar um link existente — a consulta abre neste painel.",
    "ctx.providersLead":
      "Selecione um termo no texto e escolha um buscador.",
    "notes.hypo": "Anotações",
    "notes.hint":
      "Notas abrem na barra lateral do Hypothesis (ícone no canto).",
    "notes.off": "Hypothesis desligado neste build.",
    "set.title": "Ajustes",
    "set.hint": "Idioma, tema e cores do chrome do leitor.",
    "set.guide": "Guia de cor",
    "set.guideHint":
      "Cores do chrome do leitor (abas e barras). Independente do tema claro/escuro.",
    "set.guideFull": "Completo",
    "set.guideSoft": "Suave",
    "set.guideMin": "Mínimo",
    "set.theme": "Tema",
    "set.system": "Sistema",
    "set.light": "Claro",
    "set.dark": "Escuro",
    "set.lang": "Idioma",
    "bar.lang": "Idioma",
    "bar.help": "Ajuda",
    "bar.settings": "Ajustes",
    "help.title": "Ajuda",
    "help.tab.find": "1. Ache",
    "help.tab.read": "2. Leia",
    "help.tab.consult": "3. Consulte",
    "help.tab.annotate": "4. Anote",
    "help.feat.toc": "Sumário",
    "help.feat.search": "Busca de texto",
    "help.feat.typo": "Ajustes tipográficos",
    "help.feat.pages": "Controle de paginação",
    "help.feat.links": "Links no texto",
    "help.feat.luz": "Consulta no Luz Espírita",
    "help.feat.encyc": "Consulta de Enciclopédia",
    "help.feat.dict": "Consulta de Dicionário",
    "help.feat.map": "Consulta de Mapas",
    "help.feat.bible": "Consulta na Bíblia",
    "help.feat.kardec": "Consulta no Kardecpedia",
    "help.feat.pdf": "Comparação de PDF",
    "help.feat.jaas": "Videoconferência",
    "help.feat.notes": "Grifos e notas (públicas, privadas ou de grupo)",
    "help.note.foldFind": "Aba 1 abre na esquerda",
    "help.note.foldNotes": "Aba 4 abre na direita",
    "help.note.foldNotesRight": "Aba 4 abre na direita",
    "help.note.consultGone": "Aba 3 removida",
    "help.dev.desktop": "Desktop",
    "help.dev.laptop": "Notebook",
    "help.dev.tablet": "Tablet",
    "help.dev.phone": "Celular",
    "boot.loading": "Carregando…",
    "help.dismiss": "Não mostrar novamente",
    "help.map.ache.a": "Sumário",
    "help.map.ache.b": "Busca",
    "help.map.read.a": "Escolha página",
    "help.map.read.b": "Ajustes de tipo",
    "help.map.consult.a": "Selecione ali",
    "help.map.consult.b": "Escolha buscador",
    "help.map.consult.c": "Abre aqui",
    "help.map.annotate.a": "Selecione ali",
    "help.map.annotate.b": "Grifo e notas aqui",
    "help.map.pager": "Passos",
    "help.map.prev": "Anterior",
    "help.map.next": "Próximo",
    "help.map.step": "Passo",
    "help.rotate": "Gire o aparelho para a horizontal para ver a ajuda.",
    "help.note.pdf": "Comparação de PDF",
    "help.note.conf": "Videoconferência",
    "help.pane.region": "Ajuda",
    "help.pane.skip": "Pular introdução",
    "help.pane.ache.toc": "Sumário",
    "help.pane.ache.search": "Busca",
    "help.pane.read.pages": "Controle de páginas",
    "help.pane.read.typo": "Ajustes tipográficos",
    "help.pane.consult.select": "Selecione para buscar",
    "help.pane.consult.pdf": "Leitor de PDF",
    "help.pane.consult.jaas": "Videoconferência",
    "help.pane.annotate.hl": "Grifos",
    "help.pane.annotate.notes": "Anotações",
    "ctx.needTerm": "Selecione um termo no texto para consultar.",
    "orient.title": "Gire o aparelho",
    "orient.body":
      "No celular, o estudo é só em retrato: Leia e Ache. Sem Consulte e sem ligações no texto. Gire para retrato (ou use uma tela maior).",
    "onboard.title": "Onde você estuda",
    "onboard.titleHow": "Como utilizar",
    "onboard.whereBody":
      "Quatro painéis. O contorno mostra o que cabe: desktop → notebook → tablet (bloqueado) → celular (bloqueado).",
    "onboard.howBody":
      "Cursor: Ache → link ipsum → Consulte (foco) → selecione o 2º ipsum → Anote.",
    "onboard.find": "Sumário e busca no livro.",
    "onboard.read": "Texto, páginas e tipografia.",
    "onboard.consult": "Fontes ao lado da leitura.",
    "onboard.annotate": "Grifos, notas e destaques.",
    "onboard.deviceTag": "Dispositivo",
    "onboard.desktop": "Desktop",
    "onboard.laptop": "Notebook",
    "onboard.tablet": "Tablet",
    "onboard.tabletBlocked": "Tablet (Bloqueado)",
    "onboard.mobile": "Celular",
    "onboard.mobileBlocked": "Celular (Bloqueado)",
    "onboard.persist": "Não mostrar de novo",
    "onboard.mode.device": "Dispositivo",
    "onboard.mode.how": "Como usar",
    "onboard.play": "Reproduzir",
    "onboard.pause": "Pausar",
    "onboard.reload": "Reiniciar",
    "onboard.mute": "Silenciar",
    "onboard.unmute": "Ativar som",
    "onboard.enter": "Entrar",
    "onboard.cap.desktop":
      "Ache, Leia, Consulte e Anote, uso amplo de todas as ferramentas.",
    "onboard.cap.laptop": "Ache é escamoteado. Uso ainda produtivo.",
    "onboard.cap.tabletBlocked":
      "Bloqueado (modo pé). Em versões futuras, um modo reduzido será oferecido.",
    "onboard.cap.mobileBlocked":
      "Bloqueado (modos pé e deitado). Em versões futuras, um modo reduzido será oferecido.",
    "onboard.cap.deviceDone":
      "Clique em [Como usar], ou [Entrar] para estudar.",
    "onboard.cap.howControls":
      "Use os botões abaixo para controlar a exibição",
    "onboard.cap.howStart":
      "Ao escolher um volume, você é levado ao Estudo",
    "onboard.cap.howCol1":
      "Na coluna 1, escolha ou ache a seção desejada.",
    "onboard.cap.howToc":
      "Clique no item — a seção abre na coluna 2.",
    "onboard.cap.howSelectSearch":
      "Na coluna 2, selecione um termo para consultar.",
    "onboard.cap.howProvider":
      "Na coluna 3, escolha um provedor de consulta.",
    "onboard.cap.howResults": "Os resultados aparecem na mesma coluna.",
    "onboard.cap.howLink":
      "Na coluna 2, pode-se também clicar em links existentes.",
    "onboard.cap.howSelectAnnotate":
      "Na mesma coluna, selecione um termo ou trecho para grifar/anotar.",
    "onboard.cap.howNote":
      "Os grifos/notas ficam salvos na coluna 4 (requer conta).",
    "onboard.cap.howDone": "Bom proveito nos seus estudos!",
    "set.jitsi": "Videoconferência (JaaS)",
    "set.jitsiAppId": "App ID (8x8 JaaS)",
    "set.jitsiRoom": "Sala",
    "set.jitsiName": "Nome de exibição",
    "set.about": "Sobre",
    "set.version": "Versão",
    "set.repo": "Repositório",
    "set.repoOpen": "Abrir repositório no GitHub",
    "pdf.upload": "Carregar",
    "pdf.unload": "Remover",
    "pdf.uploadTitle": "Envie um PDF pela barra acima.",
    "pdf.loading": "A carregar PDF…",
    "pdf.error": "Não foi possível abrir este PDF.",
    "pdf.mockTitle": "Documento de exemplo",
    "pdf.mockPage": "Página {n} de {total}",
    "pdf.mockHint": "Mock PDF — use a barra para navegar e ampliar.",
    "pdf.mockLoaded": "PDF mock carregado",
    "pdf.mockCleared": "PDF mock removido",
    "toc.empty": "Nenhum item no sumário.",
    "search.empty": "Digite e pressione Enter para buscar…",
    "search.none": "Nenhum resultado.",
    "search.hits": "{n} resultados",
    "search.hitsCapped": "Mostrando os primeiros {n} resultados",
    "search.nowhere": "Sem seção",
    "meet.hint": "Configure o App ID JaaS em Ajustes.",
    "meet.ready": "Pronto · {room}. Clique em Vídeo ou Voz para entrar.",
    "meet.idleHint":
      "Vídeo e voz via 8x8 JaaS. Defina o App ID em Ajustes, depois entre pela aba Vídeo.",
    "meet.needAppId": "Informe o App ID JaaS em Ajustes.",
    "meet.needHttps":
      "O 8x8 precisa de HTTPS ou localhost (WebRTC). Abra http://localhost — o IP da rede em http:// não funciona.",
    "meet.connecting": "A conectar…",
    "meet.loadError": "Não foi possível carregar o JaaS.",
    "meet.inVideo": "Em vídeo · {room}",
    "meet.inVoice": "Em voz · {room}",
    "meet.mockIdle": "Sala de vídeo (mock)",
    "meet.mockHint": "Vídeo / voz simulados — JaaS real sob flag de build.",
    "meet.mockVideo": "Em vídeo (mock) · librus-estudo",
    "meet.mockVoice": "Em voz (mock) · librus-estudo",
    "meet.mockLeft": "Sala de vídeo (mock)",
  },
  en: {
    "pane.find": "1. Find",
    "pane.read": "2. Read",
    "pane.consult": "3. Consult",
    "pane.annotate": "4. Annotate",
    "library.title": "LIBRUS",
    "library.cta": "Find · Read · Consult · Annotate",
    "library.heading": "Library",
    "tab.toc": "TOC",
    "tab.search": "Search",
    "tab.book": "Pages",
    "tab.typo": "Type",
    "tab.context": "Context",
    "tab.pdf": "PDF",
    "tab.video": "Conf",
    "tab.notes": "Notes",
    "btn.prev": "Previous",
    "btn.next": "Next",
    "page.unit": "pages",
    "btn.back": "Back",
    "btn.reload": "Reload",
    "btn.zoomIn": "In",
    "btn.zoomOut": "Out",
    "btn.joinVideo": "Video",
    "btn.joinVoice": "Voice",
    "btn.leave": "Leave",
    "ph.filter": "Filter…",
    "ph.search": "Search… (Enter)",
    "typo.size": "Size",
    "typo.line": "Lines",
    "typo.measure": "Column",
    "typo.narrow": "Narrow",
    "typo.medium": "Medium",
    "typo.wide": "Wide",
    "typo.alignStart": "Start",
    "typo.alignJustify": "Justify",
    "typo.sans": "Sans",
    "typo.serif": "Serif",
    "tip.typo.size": "Text size",
    "tip.typo.line": "Line height",
    "tip.typo.measure": "Column width",
    "tip.typo.align": "Alignment",
    "tip.typo.font": "Font family",
    "tip.page.prev": "Previous page",
    "tip.page.next": "Next page",
    "tip.ctx.back": "Go back in context",
    "tip.ctx.reload": "Reload context page",
    "tip.close": "Close",
    "tip.home": "Library",

    "tab.links": "Links",
    "tip.links": "Show / hide in-book links",
    "prov.luz": "Luz",
    "prov.encyc": "Encyclopedia",
    "prov.dict": "Dictionary",
    "prov.map": "Maps",
    "prov.bible": "Bible",
    "prov.kardec": "Kardecpedia",
    "ctx.searching": 'Searching for "{term}" on {provider}',
    "ctx.opening": "Opening {provider}…",
    "ctx.loading": "Loading…",
    "ctx.hintTitle": "How to consult",
    "ctx.hintBody":
      "Select a term in the Read pane and click a provider above (Luz Espírita, Encyclopedia, Dictionary, etc). You can also use an existing link — the result opens in this pane.",
    "ctx.providersLead": "Select a term in the text, then a lookup.",
    "notes.hypo": "Hypothesis",
    "notes.hint": "Notes open in the Hypothesis sidebar (corner control).",
    "notes.off": "Hypothesis disabled in this build.",
    "set.title": "Settings",
    "set.hint": "Language, theme, and reader chrome colors.",
    "set.guide": "Color guide",
    "set.guideHint":
      "Reader chrome colors (tabs and toolbars). Independent of light/dark theme.",
    "set.guideFull": "Full",
    "set.guideSoft": "Soft",
    "set.guideMin": "Minimal",
    "set.theme": "Theme",
    "set.system": "System",
    "set.light": "Light",
    "set.dark": "Dark",
    "set.lang": "Language",
    "bar.lang": "Language",
    "bar.help": "Help",
    "bar.settings": "Settings",
    "help.title": "Help",
    "help.tab.find": "1. Find",
    "help.tab.read": "2. Read",
    "help.tab.consult": "3. Consult",
    "help.tab.annotate": "4. Annotate",
    "help.feat.toc": "Table of contents",
    "help.feat.search": "Text search",
    "help.feat.typo": "Typography controls",
    "help.feat.pages": "Pagination controls",
    "help.feat.links": "In-book links",
    "help.feat.luz": "Look up on Luz Espírita",
    "help.feat.encyc": "Encyclopedia lookup",
    "help.feat.dict": "Dictionary lookup",
    "help.feat.map": "Maps lookup",
    "help.feat.bible": "Bible lookup",
    "help.feat.kardec": "Look up on Kardecpedia",
    "help.feat.pdf": "PDF comparison",
    "help.feat.jaas": "Video conference",
    "help.feat.notes": "Highlights and notes (public, private, or group)",
    "help.note.foldFind": "Tab 1 opens on the left",
    "help.note.foldNotes": "Tab 4 opens on the right",
    "help.note.foldNotesRight": "Tab 4 opens on the right",
    "help.note.consultGone": "Tab 3 removed",
    "help.dev.desktop": "Desktop",
    "help.dev.laptop": "Laptop",
    "help.dev.tablet": "Tablet",
    "help.dev.phone": "Mobile",
    "boot.loading": "Loading…",
    "help.dismiss": "Don't show again",
    "help.map.ache.a": "Contents",
    "help.map.ache.b": "Search",
    "help.map.read.a": "Choose a page",
    "help.map.read.b": "Type settings",
    "help.map.consult.a": "Select there",
    "help.map.consult.b": "Choose a lookup",
    "help.map.consult.c": "Opens here",
    "help.map.annotate.a": "Select there",
    "help.map.annotate.b": "Highlight and notes here",
    "help.map.pager": "Steps",
    "help.map.prev": "Previous",
    "help.map.next": "Next",
    "help.map.step": "Step",
    "help.rotate": "Rotate the device to landscape to see Help.",
    "help.note.pdf": "PDF comparison",
    "help.note.conf": "Video conference",
    "help.pane.region": "Help",
    "help.pane.skip": "Skip intro",
    "help.pane.ache.toc": "Table of contents",
    "help.pane.ache.search": "Search",
    "help.pane.read.pages": "Page controls",
    "help.pane.read.typo": "Typography controls",
    "help.pane.consult.select": "Select to search",
    "help.pane.consult.pdf": "PDF reader",
    "help.pane.consult.jaas": "Video conference",
    "help.pane.annotate.hl": "Highlights",
    "help.pane.annotate.notes": "Notes",
    "ctx.needTerm": "Select a term in the text to look up.",
    "orient.title": "Rotate the device",
    "orient.body":
      "On a phone, study is portrait only: Read and Find. No Consulte and no in-book links. Rotate to portrait (or use a larger screen).",
    "onboard.title": "Where you study",
    "onboard.titleHow": "How to use",
    "onboard.whereBody":
      "Four panes. The outline shows what fits: desktop → laptop → tablet (blocked) → mobile (blocked).",
    "onboard.howBody":
      "Cursor: Find → ipsum link → Consult (focus) → select the 2nd ipsum → Annotate.",
    "onboard.find": "Contents and in-book search.",
    "onboard.read": "Text, pages, and typography.",
    "onboard.consult": "Sources beside the reading.",
    "onboard.annotate": "Highlights and sticky notes.",
    "onboard.deviceTag": "Device",
    "onboard.desktop": "Desktop",
    "onboard.laptop": "Laptop",
    "onboard.tablet": "Tablet",
    "onboard.tabletBlocked": "Tablet (Blocked)",
    "onboard.mobile": "Mobile",
    "onboard.mobileBlocked": "Mobile (Blocked)",
    "onboard.persist": "Don’t show again",
    "onboard.mode.device": "Device",
    "onboard.mode.how": "How to",
    "onboard.play": "Play",
    "onboard.pause": "Pause",
    "onboard.reload": "Reload",
    "onboard.mute": "Mute",
    "onboard.unmute": "Unmute",
    "onboard.enter": "Enter",
    "onboard.cap.desktop":
      "Find, Read, Consult and Annotate, ample use of all tools.",
    "onboard.cap.laptop": "Find is hidden. Usage not compromised.",
    "onboard.cap.tabletBlocked":
      "Blocked (portrait). Future versions will offer a limited mode.",
    "onboard.cap.mobileBlocked":
      "Blocked (portrait and landscape). Future versions will offer a limited mode.",
    "onboard.cap.deviceDone": "click on [How to], or [Enter] to study.",
    "onboard.cap.howControls": "Use the buttons below to control playback",
    "onboard.cap.howStart": "Choosing a volume takes you into Study",
    "onboard.cap.howCol1":
      "In column 1, choose or find the section you want.",
    "onboard.cap.howToc":
      "Click the item — the section opens in column 2.",
    "onboard.cap.howSelectSearch":
      "In column 2, select a term to look up.",
    "onboard.cap.howProvider":
      "In column 3, choose a consult provider.",
    "onboard.cap.howResults": "Results appear in the same column.",
    "onboard.cap.howLink":
      "In column 2, you can also click existing links.",
    "onboard.cap.howSelectAnnotate":
      "In the same column, select a term or passage to highlight/annotate.",
    "onboard.cap.howNote":
      "Highlights/notes are saved in column 4 (account required).",
    "onboard.cap.howDone": "Enjoy your studies!",
    "set.jitsi": "Video conference (JaaS)",
    "set.jitsiAppId": "App ID (8x8 JaaS)",
    "set.jitsiRoom": "Room",
    "set.jitsiName": "Display name",
    "set.about": "About",
    "set.version": "Version",
    "set.repo": "Repository",
    "set.repoOpen": "Open repository on GitHub",
    "pdf.upload": "Upload",
    "pdf.unload": "Remove",
    "pdf.uploadTitle": "Upload a PDF from the toolbar above.",
    "pdf.loading": "Loading PDF…",
    "pdf.error": "Could not open this PDF.",
    "pdf.mockTitle": "Sample document",
    "pdf.mockPage": "Page {n} of {total}",
    "pdf.mockHint": "Mock PDF — use the toolbar to page and zoom.",
    "pdf.mockLoaded": "Mock PDF loaded",
    "pdf.mockCleared": "Mock PDF cleared",
    "toc.empty": "No TOC items.",
    "search.empty": "Type and press Enter to search…",
    "search.none": "No results.",
    "search.hits": "{n} results",
    "search.hitsCapped": "Showing first {n} results",
    "search.nowhere": "No section",
    "meet.hint": "Set JaaS App ID in Settings.",
    "meet.ready": "Ready · {room}. Click Video or Voice to join.",
    "meet.idleHint":
      "Video and voice via 8x8 JaaS. Set the App ID in Settings, then join from the Video tab.",
    "meet.needAppId": "Enter JaaS App ID in Settings.",
    "meet.needHttps":
      "8x8 needs HTTPS or localhost (WebRTC). Open http://localhost — a LAN http:// IP will not work.",
    "meet.connecting": "Connecting…",
    "meet.loadError": "Could not load JaaS.",
    "meet.inVideo": "In video · {room}",
    "meet.inVoice": "In voice · {room}",
    "meet.mockIdle": "Video room (mock)",
    "meet.mockHint": "Simulated video / voice — real JaaS behind build flag.",
    "meet.mockVideo": "In video (mock) · librus-estudo",
    "meet.mockVoice": "In voice (mock) · librus-estudo",
    "meet.mockLeft": "Video room (mock)",
  },
};

const PROVIDERS = {
  luz: {
    home: "https://www.luzespirita.org.br/",
    search:
      "https://www.luzespirita.org.br/index.php?lisPage=enciclopedia&item={query}",
  },
  encyc: {
    home: "https://{lang}.wikipedia.org/",
    search: "https://{lang}.wikipedia.org/wiki/{query}",
  },
  dict: {
    home: "https://{lang}.wiktionary.org/",
    search: "https://{lang}.wiktionary.org/wiki/{query}",
  },
  map: {
    /* full site blocks iframes (X-Frame-Options); embed URL used via mapEmbedUrl() */
    home: "https://www.openstreetmap.org/export/embed.html?bbox=-20%2C-40%2C60%2C70&layer=mapnik",
    search: "https://www.openstreetmap.org/search?query={query}",
    external: "https://www.openstreetmap.org/search?query={query}",
  },
  bible: {
    home: "https://www.bible.com/pt/bible/212",
    search: "https://www.bible.com/search/bible?q={query}",
  },
  kardec: {
    home: "https://www.kardecpedia.com/",
    search: "https://www.kardecpedia.com/pt/busca?q={query}",
  },
};

const MEASURES = ["narrow", "medium", "wide"];
const FONT_SIZES = [0.85, 0.95, 1, 1.1, 1.25, 1.4, 1.5];
const LINE_HEIGHTS = [1.35, 1.5, 1.65, 1.85, 2.1];
const ALIGNS = ["start", "justify"];
/* Reading faces only — order: default first (serif ≈ printed book) */
const FONTS = ["serif", "sans"];
const BOOK_CACHE = {};
/** Full shelf from disk (all flavors) */
let CATALOG_ALL = [];
/** Filtered shelf for active flavor */
let CATALOG = [];
let currentLang = "pt";
/** User preference: system | light | dark */
let themePref = "system";
/** Resolved paint: light | dark */
let currentTheme = "light";
let currentBook = null;
let currentSlug = "";
let pageIndex = 0;
/**
 * PDF folio list for single-blob books with in-body page anchors
 * (pages.json → #page-N / .pdf-page-start). Empty = not folio-paged.
 * @type {number[]}
 */
let folioPages = [];
let fontSize = 1;
let lineHeight = 1.65;
let measure = "medium";
let textAlign = "start";
let fontFamily = "serif";
/**
 * In-book inject links (Páginas). One on/off — not per-provider.
 * Phone forces off. Toggling does not open Consulte.
 */
const BOOK_LINKS_KEY = "librus-book-links";
let bookLinksOn = true;
let searchQuery = "";
let hypoTimer = null;
let lastCtxUrl = "";
/** Simple iframe history for Context back button */
const ctxHistory = [];
/** Mock PDF state (used when FEAT.pdf is off) */
let mockPdfPage = 1;
const MOCK_PDF_TOTAL = 12;
let mockPdfZoom = 1;
let mockPdfLoaded = true;
/** Mock video: '' | 'video' | 'voice' */
let mockMeetMode = "";

const bookEl = () => document.getElementById("book");
const tocEl = () => document.getElementById("toc");
const hitsEl = () => document.getElementById("hits");
const ctxEl = () => document.getElementById("ctx");

/* ── I18n / chrome bar / theme / lang ───────────── */

function t(key) {
  const pack = I18N[currentLang] || I18N.pt;
  return pack[key] || I18N.en[key] || key;
}

function applyI18n() {
  document.querySelectorAll("[data-i18n]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i18n"));
  });
  document.querySelectorAll("[data-i18n-ph]").forEach((el) => {
    el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
  });
  document.querySelectorAll("[data-i18n-aria]").forEach((el) => {
    const label = t(el.getAttribute("data-i18n-aria"));
    el.setAttribute("aria-label", label);
    el.setAttribute("title", label);
  });
  document.documentElement.lang = currentLang === "en" ? "en" : "pt-BR";
  document.body.dataset.lang = currentLang;
  if (typeof syncHelpI18n === "function") syncHelpI18n();
  if (typeof syncHelpPaneFeatures === "function") syncHelpPaneFeatures();
  if (typeof syncTypoButtons === "function") syncTypoButtons();
  if (typeof syncLinkControls === "function") syncLinkControls();
  if (typeof syncChromeBar === "function") syncChromeBar();
  if (typeof syncTooltips === "function") syncTooltips();
  if (!FEAT.pdf && typeof renderMockPdf === "function") {
    renderMockPdf();
  }
  if (!FEAT.jaas && !mockMeetMode) {
    const el = document.getElementById("meet-status");
    if (el) el.textContent = t("meet.mockIdle");
  } else if (FEAT.jaas && !mockMeetMode) {
    const el = document.getElementById("meet-status");
    const host = document.getElementById("meet-jaas-host");
    if (el && host?.hidden) {
      let appId = "";
      let room = "librus-estudo";
      try {
        const s = JSON.parse(localStorage.getItem("librus-jaas") || "{}");
        appId = (s.appId || "").trim();
        if (s.room) room = s.room;
      } catch (_) {
        /* ignore */
      }
      const typed = document.getElementById("jitsi-app-id")?.value.trim();
      el.textContent = typed || appId
        ? t("meet.ready").replace("{room}", room)
        : t("meet.hint");
    }
  }
}

/**
 * Native title + aria-label for every interactive control.
 * Prefer visible i18n label; fall back to tip.* keys / attribute maps.
 */
function tipForButton(btn) {
  if (!(btn instanceof Element)) return "";

  const mode = btn.getAttribute("data-mode");
  if (mode) {
    const map = {
      "find:toc": "tab.toc",
      "find:search": "tab.search",
      "read:book": "tab.book",
      "read:typo": "tab.typo",
      "consult:web": "tab.context",
      "consult:pdf": "tab.pdf",
      "consult:video": "tab.video",
      "annotate:notes": "tab.notes",
    };
    if (map[mode]) return t(map[mode]);
  }

  const typo = btn.getAttribute("data-typo");
  if (typo) return t("tip.typo." + typo);

  const page = btn.getAttribute("data-page");
  if (page === "prev") return t("tip.page.prev");
  if (page === "next") return t("tip.page.next");

  const ctx = btn.getAttribute("data-ctx");
  if (ctx === "back") return t("tip.ctx.back");
  if (ctx === "reload") return t("tip.ctx.reload");

  const prov = btn.getAttribute("data-provider");
  if (prov) return t("prov." + prov);

  const pdf = btn.getAttribute("data-pdf");
  if (pdf === "upload") return t("pdf.upload");
  if (pdf === "unload") return t("pdf.unload");
  if (pdf === "prev") return t("tip.page.prev");
  if (pdf === "next") return t("tip.page.next");
  if (pdf === "in") return t("btn.zoomIn");
  if (pdf === "out") return t("btn.zoomOut");

  const jitsi = btn.getAttribute("data-jitsi");
  if (jitsi === "join-video") return t("btn.joinVideo");
  if (jitsi === "join-voice") return t("btn.joinVoice");
  if (jitsi === "leave") return t("btn.leave");

  if (
    btn.getAttribute("data-go") === "library" ||
    btn.getAttribute("data-go") === "home"
  )
    return t("tip.home");
  if (btn.getAttribute("data-cycle") === "lang") return t("bar.lang");
  if (btn.getAttribute("data-cycle") === "theme") return t("set.theme");
  if (btn.getAttribute("data-open") === "help") return t("bar.help");
  if (btn.getAttribute("data-open") === "settings") return t("bar.settings");
  if (btn.hasAttribute("data-close")) return t("tip.close");
  /* Visible text / i18n span */
  const i18n = btn.querySelector("[data-i18n]");
  if (i18n) {
    const key = i18n.getAttribute("data-i18n");
    if (key) return t(key);
  }
  const labelEl = btn.querySelector(
    "[data-typo-label], span:not([aria-hidden])",
  );
  const text = (labelEl?.textContent || btn.textContent || "")
    .replace(/\s+/g, " ")
    .trim();
  return text;
}

function setTip(el, text) {
  if (!el || !text) return;
  el.setAttribute("title", text);
  /* Don't clobber richer aria if already set to something longer */
  const existing = el.getAttribute("aria-label");
  if (
    !existing ||
    existing === el.getAttribute("title") ||
    existing.length < 2
  ) {
    el.setAttribute("aria-label", text);
  }
}

function syncTooltips(root = document) {
  root.querySelectorAll("button").forEach((btn) => {
    const tip = tipForButton(btn);
    if (tip) setTip(btn, tip);
  });
  /* Inputs that act as controls */
  const pageN = root.querySelector("#page-n");
  if (pageN) {
    const tip = currentLang === "en" ? "Page number" : "Número da página";
    pageN.setAttribute("title", tip);
    pageN.setAttribute("aria-label", tip);
  }
  const pdfPage = root.querySelector("#pdf-page-input");
  if (pdfPage) {
    const tip = currentLang === "en" ? "PDF page number" : "Página do PDF";
    pdfPage.setAttribute("title", tip);
    pdfPage.setAttribute("aria-label", tip);
  }
  const tocQ = root.querySelector("#toc-q");
  if (tocQ) {
    const tip = t("ph.filter");
    tocQ.setAttribute("title", tip);
  }
  const searchQ = root.querySelector("#search-q");
  if (searchQ) {
    const tip = t("ph.search");
    searchQ.setAttribute("title", tip);
  }
}

/** Update bottom-bar labels + settings lang/theme radios. */
function syncChromeBar() {
  syncLangInputs();
  syncThemeInputs();

  const helpBtn = document.querySelector('#bar [data-open="help"]');
  if (helpBtn) {
    helpBtn.title = t("bar.help");
    helpBtn.setAttribute("aria-label", t("bar.help"));
  }
  const setBtn = document.querySelector('#bar [data-open="settings"]');
  if (setBtn) {
    setBtn.title = t("bar.settings");
    setBtn.setAttribute("aria-label", t("bar.settings"));
  }
}

function cycleLang() {
  setLang(currentLang === "en" ? "pt" : "en");
}

function syncThemeInputs() {
  document.querySelectorAll('input[name="ui-theme"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === themePref;
    }
  });
}

/** Default OS/PWA title-bar greys (not pure white/black, not brand). */
const CHROME_GREY_LIGHT = "#e8eaed";
const CHROME_GREY_DARK = "#202124";

/**
 * Top browser / installed-PWA chrome only — neutral chrome grey.
 * Brand colors stay in-app (mark, accents); never paint the OS status/title bar.
 * @param {'light'|'dark'} resolved
 * @param {'system'|'light'|'dark'} [pref]
 */
function syncBrowserChrome(resolved, pref = themePref) {
  const light = CHROME_GREY_LIGHT;
  const dark = CHROME_GREY_DARK;
  const paint = resolved === "dark" ? dark : light;
  const meta = document.getElementById("meta-theme-color");
  if (meta) meta.content = paint;
  /* media-tagged metas: when user locks light/dark, both match lock */
  const metaL = document.getElementById("meta-theme-color-light");
  const metaD = document.getElementById("meta-theme-color-dark");
  if (pref === "light") {
    if (metaL) metaL.content = light;
    if (metaD) metaD.content = light;
  } else if (pref === "dark") {
    if (metaL) metaL.content = dark;
    if (metaD) metaD.content = dark;
  } else {
    if (metaL) metaL.content = light;
    if (metaD) metaD.content = dark;
  }
}

/**
 * Color guide: full soft chrome · soft diluted · min flat + tab top accent only.
 * Independent of theme (light/system/dark).
 * @param {'full'|'soft'|'min'} mode
 * @param {{ persist?: boolean }} [opts]
 */
function setColorGuide(mode, { persist = true } = {}) {
  if (mode !== "full" && mode !== "soft" && mode !== "min") mode = "full";
  colorGuide = mode;
  document.documentElement.dataset.guide = mode;
  if (persist) {
    try {
      localStorage.setItem(GUIDE_KEY, mode);
    } catch (_) {
      /* ignore */
    }
  }
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === mode;
    }
  });
}

function syncColorGuideInputs() {
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === colorGuide;
    }
  });
}

function syncLangInputs() {
  document.querySelectorAll('input[name="ui-lang"]').forEach((el) => {
    if (el instanceof HTMLInputElement) {
      el.checked = el.value === currentLang;
    }
  });
}

function setLang(lang, { persist = true } = {}) {
  currentLang = lang === "en" ? "en" : "pt";
  if (persist) {
    try {
      localStorage.setItem(LANG_KEY, currentLang);
    } catch (_) {
      /* ignore */
    }
  }
  syncLangInputs();
  applyI18n();
  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
    hydrateIcons(document.getElementById("library"));
    applyViewportHandicaps();
  } catch (_) {
    /* ignore */
  }
  /* Rebuild shelf for this language (EN/PT Holmes editions, etc.) */
  CATALOG = filterCatalog(CATALOG_ALL, undefined, currentLang);
  renderLibrary();

  /* If a book is open, swap to the paired edition when available */
  if (currentBook || currentSlug) {
    const cur =
      CATALOG_ALL.find((e) => e && e.id === currentSlug) ||
      currentBook ||
      null;
    const pair = findPairedEdition(CATALOG_ALL, cur, currentLang);
    if (pair && pair.id && pair.id !== currentSlug) {
      const keepPage = pageIndex;
      openBook(pair.id)
        .then(() => {
          if (keepPage > 0) goToPage(keepPage);
        })
        .catch((err) => console.warn("[POC] lang book swap", err));
      syncBarTitle();
      return;
    }
    renderToc();
    renderPage();
  }
  syncBarTitle();
}

function systemIsDark() {
  try {
    return !!(
      window.matchMedia && matchMedia("(prefers-color-scheme: dark)").matches
    );
  } catch (_) {
    return false;
  }
}

function resolveTheme(pref) {
  if (pref === "dark" || pref === "light") return pref;
  return systemIsDark() ? "dark" : "light";
}

/**
 * @param {'system'|'light'|'dark'} pref
 */
function setTheme(pref, { persist = true, reloadHypo = true } = {}) {
  if (pref !== "light" && pref !== "dark" && pref !== "system") pref = "system";
  themePref = pref;
  const resolved = resolveTheme(pref);
  const changed = resolved !== currentTheme;
  currentTheme = resolved;
  document.documentElement.dataset.themePref = themePref;
  document.documentElement.dataset.theme = currentTheme;
  document.documentElement.style.colorScheme = currentTheme;
  if (persist) {
    try {
      localStorage.setItem(THEME_KEY, themePref);
    } catch (_) {
      /* ignore */
    }
  }
  syncBrowserChrome(currentTheme, themePref);
  const fav = document.getElementById("favicon");
  if (fav) fav.href = flavorFavicon(currentTheme);
  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
    applyViewportHandicaps();
  } catch (_) {
    /* ignore */
  }
  syncChromeBar();
  /* Soft Hypo theme hook only — full destroy blanks the reader */
  if (
    reloadHypo &&
    changed &&
    import.meta.env.VITE_FEAT_HYPO === "1" &&
    document.body.dataset.view === "reader"
  ) {
    import("./features/hypo.js")
      .then((m) => m.reloadHypothesisForTheme())
      .catch(() => {});
  }
  /* Ensure book chrome still painted after theme paint */
  if (document.body.dataset.view === "reader" && currentBook) {
    try {
      renderPage();
    } catch (_) {
      /* ignore */
    }
  }
  syncBarTitle();
}

function watchSystemTheme() {
  if (!window.matchMedia) return;
  const mq = matchMedia("(prefers-color-scheme: dark)");
  const onChange = () => {
    if (themePref === "system") setTheme("system", { persist: false });
  };
  if (typeof mq.addEventListener === "function")
    mq.addEventListener("change", onChange);
  else if (typeof mq.addListener === "function") mq.addListener(onChange);
}

/* ── Routing / views ────────────────────────────── */

function bookCatalogEntry(book) {
  const id = (book && book.id) || currentSlug;
  if (!id) return null;
  return (
    CATALOG_ALL.find((e) => e && e.id === id) ||
    CATALOG.find((e) => e && e.id === id) ||
    null
  );
}

function bookDisplayTitle(book) {
  if (!book) return "";
  if (currentLang === "pt" && book.titlePt) return book.titlePt;
  return book.title || "";
}

function bookDisplayEmoji(book) {
  const entry = bookCatalogEntry(book);
  return (entry && entry.emoji) || book?.emoji || "";
}

/** Library: no Home, no bar title. Reader: Home › emoji + book. Owns document.title. */
function syncBarTitle() {
  const onReader = document.body?.dataset?.view === "reader";
  const homeBtn = document.querySelector('#bar [data-go="library"]');
  const titleEl = document.getElementById("app-title");
  const brand = getFlavor()?.brand || {};
  const flavorName = brand.title || brand.name || "LIBRUS";
  const bookTitle = bookDisplayTitle(currentBook);
  const emoji = bookDisplayEmoji(currentBook);

  if (homeBtn) homeBtn.hidden = !onReader;

  if (titleEl) {
    titleEl.replaceChildren();
    if (onReader && bookTitle) {
      titleEl.hidden = false;
      titleEl.removeAttribute("aria-hidden");
      titleEl.dataset.kind = "book";
      titleEl.setAttribute("aria-current", "page");
      if (emoji) {
        const mark = document.createElement("span");
        mark.className = "bar-book-emoji";
        mark.setAttribute("aria-hidden", "true");
        mark.textContent = emoji;
        titleEl.append(mark, document.createTextNode(bookTitle));
      } else {
        titleEl.textContent = bookTitle;
      }
    } else {
      titleEl.hidden = true;
      titleEl.setAttribute("aria-hidden", "true");
      titleEl.removeAttribute("data-kind");
      titleEl.removeAttribute("aria-current");
    }
  }

  document.title = onReader && bookTitle ? bookTitle + " · " + flavorName : flavorName;
}

function setView(name) {
  /* Only library + reader remain as full screens */
  if (name !== "library" && name !== "reader") name = "library";
  document.body.dataset.view = name;
  document.querySelectorAll("[data-screen]").forEach((el) => {
    const on = el.id === name;
    el.hidden = !on;
  });
  const bar = document.getElementById("bar");
  if (bar) {
    bar.hidden = false;
    bar.style.display = "flex";
  }
  try {
    hydrateIcons(document.getElementById("bar"));
  } catch (_) {
    /* ignore */
  }
  if (name === "reader") {
    /* Soft-close onboard — don’t mark done; it can return on Library */
    if (isOnboardOpen()) closeOnboard();
    scheduleHypothesis();
    try {
      hydrateIcons(document.getElementById("reader"));
    } catch (_) {
      /* ignore */
    }
  } else {
    document.documentElement.classList.remove("hypo-docked");
    if (hypoTimer) {
      clearTimeout(hypoTimer);
      hypoTimer = null;
    }
  }
  /* Boot applyRoute → setView("library") must not kill an open How-to anim */
  if (!isOnboardOpen()) stopViewportAnim();
  /* Back on Library with first-visit still pending (onboard archived → usually no-op) */
  if (name === "library" && shouldOfferOnboard() && !isOnboardOpen()) {
    requestAnimationFrame(() => openOnboard());
  }
  if (name === "library") {
    requestAnimationFrame(() => maybeOfferHelp());
  }
  syncBarTitle();
  syncChromeBar();
}

function parsePath(pathname) {
  let p = pathname || "/";
  if (p.length > 1 && p.endsWith("/")) p = p.slice(0, -1);
  /* Splash/onboard routes redirect to library */
  if (
    p === "" ||
    p === "/" ||
    p === "/index.html" ||
    p === "/library" ||
    p === "/onboard" ||
    p === "/splash"
  ) {
    return { view: "library" };
  }
  const m = p.match(/\/books\/([^/]+)(?:\/(\d+))?$/);
  if (m) {
    return {
      view: "reader",
      slug: decodeURIComponent(m[1]),
      page: m[2] ? Math.max(0, parseInt(m[2], 10) - 1) : 0,
    };
  }
  return { view: "library" };
}

function pathFor(view, opts = {}) {
  if (view === "reader") {
    const slug = opts.slug || currentSlug || "study-scarlet";
    const page = opts.page != null ? opts.page : pageIndex;
    return page > 0
      ? "/books/" + encodeURIComponent(slug) + "/" + (page + 1)
      : "/books/" + encodeURIComponent(slug);
  }
  return "/library";
}

function navigate(path, { replace = false, skip = false } = {}) {
  const url = path.startsWith("/") ? path : "/" + path;
  if (replace) history.replaceState({ path: url }, "", url);
  else if (location.pathname !== url) history.pushState({ path: url }, "", url);
  if (!skip) applyRoute();
}

async function applyRoute() {
  const route = parsePath(location.pathname);
  setView(route.view);
  if (route.view === "reader" && route.slug) {
    try {
      await enterReader(route.slug, route.page || 0);
    } catch (err) {
      console.warn("[POC] book load", err);
      navigate("/library", { replace: true });
    }
  }
  if (route.view === "library") {
    try {
      if (!CATALOG.length) await loadCatalog();
      else renderLibrary();
    } catch (_) {
      /* ignore */
    }
  }
  handleTabFolding();
}

/** Load book, paint TOC + page, set reader chrome — single path for open + route */
async function enterReader(slug, page = 0) {
  await loadBook(slug);
  if (isFolioPaged()) {
    /* URL page is 0-based; +1 = PDF folio number from pages.json */
    pageIndex = folioIndexForNumber(page + 1);
  } else {
    pageIndex = Math.max(
      0,
      Math.min((currentBook.pages?.length || 1) - 1, page),
    );
  }
  setView("reader");
  setMode("find", "toc");
  setMode("read", "book");
  setMode("consult", "web");
  setMode("annotate", "notes");
  /*
   * setMode("annotate") leaves focusMode on annotate:notes. On folded
   * widths (≤1650) the main strip paints exclusively from focusMode and
   * Annotate isn't on that strip (p4 often hidden) — so Páginas flashed then
   * went dark. Park focus back on the default read tool.
   */
  focusMode = "read:book";
  lastReadMode = "read:book";
  applyTypography();
  renderPage();
  renderToc();
  lastFoldKey = ""; /* force fold rebuild on enter reader */
  handleTabFolding(true);
  applyI18n();
  try {
    hydrateIcons(document.getElementById("reader"));
  } catch (_) {
    /* ignore */
  }
  syncMainStripActive();
  requestAnimationFrame(() => {
    requestAnimationFrame(() => startHelpPaneIntro());
  });
}

function bootHypothesis() {
  return import("./features/hypo.js")
    .then((m) => {
      m.installHypothesisConfig();
      m.startHypothesisDockWatch();
      return m.ensureHypothesis().then(() => m.syncHypothesisDock());
    })
    .catch((e) => console.warn("[POC] Hypothesis", e));
}

let hypoBootPromise = null;

/** Start Hypo on the library (CSS hides it) so the reader does not wait. */
function preloadHypothesis() {
  if (import.meta.env.VITE_FEAT_HYPO !== "1") return Promise.resolve();
  if (!hypoBootPromise) hypoBootPromise = bootHypothesis();
  return hypoBootPromise;
}

function bootSplashUp() {
  const el = document.getElementById("boot-splash");
  return !!(el && !el.hidden && !el.classList.contains("is-gone"));
}

function dismissBootSplash() {
  const el = document.getElementById("boot-splash");
  if (!el || el.hidden) {
    maybeOfferHelp();
    return;
  }
  let done = false;
  const finish = () => {
    if (done) return;
    done = true;
    el.hidden = true;
    el.setAttribute("aria-busy", "false");
    maybeOfferHelp();
  };
  el.classList.add("is-gone");
  el.addEventListener("transitionend", finish, { once: true });
  setTimeout(finish, 450);
}

function scheduleHypothesis() {
  if (import.meta.env.VITE_FEAT_HYPO !== "1") return;
  if (hypoTimer) {
    clearTimeout(hypoTimer);
    hypoTimer = null;
  }
  /* Already fetching / injected — dock as soon as the reader is up. */
  if (document.querySelector("script[data-librus-hypothesis]")) {
    bootHypothesis();
    return;
  }
  hypoTimer = setTimeout(() => {
    hypoTimer = null;
    if (document.body.dataset.view !== "reader") return;
    bootHypothesis();
  }, 400);
}

/* ── Modes / panes ───────────────────────────────── */

/**
 * Strip highlight while folded: only this mode is lit on #main-tabs.
 * lastReadMode restored when find/consult overlays close (so Tipo/Páginas stay blue).
 */
let focusMode = "read:book";
let lastReadMode = "read:book";
/** Last fold flags — skip DOM rebuild when only width jittered */
let lastFoldKey = "";

/**
 * Close p1/p3 overlays without flashing the white tab strip mid-slide.
 * Keep .overlay-single / .is-closing until transform finishes.
 */
function closeFoldOverlays({ restoreRead = true } = {}) {
  const panels = ["p1", "p3"]
    .map((id) => document.getElementById(id))
    .filter((el) => el && el.classList.contains("overlay"));

  const wasOpen = panels.length > 0;

  panels.forEach((el) => {
    /* Keep single-tool chrome while sliding out */
    el.classList.add("is-closing", "overlay-single");
    el.classList.remove("overlay");
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      el.removeEventListener("transitionend", onEnd);
      el.classList.remove("is-closing", "overlay-single");
    };
    const onEnd = (ev) => {
      if (ev.target === el && ev.propertyName === "transform") finish();
    };
    el.addEventListener("transitionend", onEnd);
    setTimeout(finish, 320);
  });

  if (wasOpen && restoreRead) {
    focusMode = lastReadMode || "read:book";
    const [g, p] = focusMode.split(":");
    if (g === "read" && p) {
      document.querySelectorAll('[data-mode^="read:"]').forEach((btn) => {
        btn.classList.toggle("on", btn.getAttribute("data-mode") === focusMode);
      });
      document.querySelectorAll('[data-tool^="read:"]').forEach((tb) => {
        const match = tb.getAttribute("data-tool") === focusMode;
        tb.classList.toggle("on", match);
        tb.hidden = !match;
      });
    }
  }
  syncMainStripActive();
}

/** Paint .on on #main-tabs from focusMode (folded) or per-group tools (wide). */
function syncMainStripActive() {
  const strip = document.getElementById("main-tabs");
  if (!strip) return;
  const w = window.innerWidth;
  const foldFind = w <= VP.FOLD_FIND;
  const foldConsult = shouldFoldConsult();

  if (foldFind || foldConsult) {
    /*
     * Exclusive strip highlight. If focusMode isn't on this strip
     * (e.g. annotate:notes — Anote often off-strip at ≤1400), paint
     * lastReadMode so Tipo/Páginas don't go blank after boot.
     */
    let paint = focusMode;
    const onStrip = !!strip.querySelector(
      'button[data-mode="' + CSS.escape(String(paint || "")) + '"]',
    );
    if (!onStrip) {
      paint = lastReadMode || "read:book";
    }
    strip.querySelectorAll("button[data-mode]").forEach((btn) => {
      btn.classList.toggle("on", btn.getAttribute("data-mode") === paint);
    });
  } else {
    const activeModes = new Set();
    document.querySelectorAll("#reader [data-tool].on").forEach((tb) => {
      const m = tb.getAttribute("data-tool");
      if (m) activeModes.add(m);
    });
    /* Prefer last read tool when annotate is the only leftover .on */
    if (
      ![...activeModes].some((m) => String(m).startsWith("read:")) &&
      lastReadMode
    ) {
      activeModes.add(lastReadMode);
    }
    strip.querySelectorAll("button[data-mode]").forEach((btn) => {
      const mode = btn.getAttribute("data-mode") || "";
      btn.classList.toggle("on", mode ? activeModes.has(mode) : false);
    });
  }
}

/**
 * Option 2 fold overlays:
 * - Individual tools stay on #main-tabs.
 * - Opening find/consult slides p1/p3; drawer shows only that tool.
 */
function applyOverlaySingleTool() {
  const w = window.innerWidth;
  const foldFind = w <= VP.FOLD_FIND;
  const foldConsult = shouldFoldConsult();
  const p1 = document.getElementById("p1");
  const p3 = document.getElementById("p3");

  if (p1) {
    p1.classList.toggle(
      "overlay-single",
      p1.classList.contains("overlay") && foldFind,
    );
  }
  if (p3) {
    p3.classList.toggle(
      "overlay-single",
      p3.classList.contains("overlay") && foldConsult,
    );
  }

  syncMainStripActive();
}

function setMode(group, panel) {
  const mode = group + ":" + panel;
  if (group === "consult" && !toolAllowedBySize(mode)) {
    /* Size handicap — fall back to web when PDF/video unavailable */
    panel = "web";
  }
  const resolved = group + ":" + panel;
  focusMode = resolved;
  if (group === "read") lastReadMode = resolved;

  document.querySelectorAll('[data-mode^="' + group + ':"]').forEach((btn) => {
    if (btn.hasAttribute("data-size-off")) {
      btn.classList.remove("on");
      return;
    }
    btn.classList.toggle("on", btn.getAttribute("data-mode") === resolved);
  });
  document.querySelectorAll('[data-tool^="' + group + ':"]').forEach((tb) => {
    if (tb.hasAttribute("data-size-off")) {
      tb.classList.remove("on");
      tb.hidden = true;
      return;
    }
    const match = tb.getAttribute("data-tool") === resolved;
    tb.classList.toggle("on", match);
    tb.hidden = !match;
  });
  document.querySelectorAll('[data-panel^="' + group + ':"]').forEach((p) => {
    if (p.hasAttribute("data-size-off")) {
      p.classList.remove("on");
      p.hidden = true;
      return;
    }
    const match = p.getAttribute("data-panel") === resolved;
    p.classList.toggle("on", match);
    p.hidden = !match;
  });

  const w = window.innerWidth;
  if (group === "find" && w <= VP.FOLD_FIND) {
    /* Slide-close p3 if open (no tab-bar flash) */
    const p3 = document.getElementById("p3");
    if (p3?.classList.contains("overlay")) {
      p3.classList.add("is-closing", "overlay-single");
      p3.classList.remove("overlay");
      setTimeout(
        () => p3.classList.remove("is-closing", "overlay-single"),
        320,
      );
    }
    const p1 = document.getElementById("p1");
    if (p1) {
      p1.classList.add("overlay", "overlay-single");
      p1.classList.remove("is-closing");
    }
    try {
      hydrateIcons(p1);
    } catch (_) {
      /* ignore */
    }
  } else if (group === "consult" && shouldFoldConsult()) {
    const p1 = document.getElementById("p1");
    if (p1?.classList.contains("overlay")) {
      p1.classList.add("is-closing", "overlay-single");
      p1.classList.remove("overlay");
      setTimeout(
        () => p1.classList.remove("is-closing", "overlay-single"),
        320,
      );
    }
    const p3 = document.getElementById("p3");
    if (p3) {
      p3.classList.add("overlay", "overlay-single");
      p3.classList.remove("is-closing");
    }
    try {
      hydrateIcons(
        document.querySelector('#p3 [data-tool="consult:web"]') || p3,
      );
    } catch (_) {
      /* ignore */
    }
  } else if (group === "read") {
    closeFoldOverlays({ restoreRead: false });
    focusMode = resolved;
    lastReadMode = resolved;
  }

  applyOverlaySingleTool();
  requestAnimationFrame(syncSlidingToolOverflow);
}

function openMode(mode) {
  if (String(mode).startsWith("consult:") && phoneReaderOnly()) return;
  if (mode === "consult:video") {
    const f = typeof getFlavor === "function" ? getFlavor() : null;
    if (!FEAT.jaas || f?.features?.jaas !== true) {
      mode = "consult:web";
    }
  }
  if (mode && !toolAllowedBySize(mode)) {
    if (String(mode).startsWith("consult:") && vpTier() === "phone") return;
    mode = String(mode).startsWith("consult:") ? "consult:web" : mode;
  }
  const [group, panel] = String(mode || "").split(":");
  if (group && panel) setMode(group, panel);
}

/**
 * Fold find/consult tabs into the main (read) strip — Option 2.
 * Rebuilds clones only when foldFind / foldConsult actually change (stops flicker).
 */
function handleTabFolding(force = false) {
  const strip = document.getElementById("main-tabs");
  if (!strip) return;
  const w = window.innerWidth;
  const h = window.innerHeight;
  const tier = vpTier(w);
  const foldFind = w <= VP.FOLD_FIND;
  const foldConsult = shouldFoldConsult(w, h);
  const land = isLandscape(w, h);
  /* Labels: icon-only when strip is crowded (fold find) or consult is dense */
  const compact = foldFind || w <= 1800;
  const foldKey =
    (foldFind ? "1" : "0") +
    (foldConsult ? "1" : "0") +
    (land ? "L" : "P") +
    tier;

  document.body.dataset.compact = compact ? "1" : "0";
  document.body.dataset.foldFind = foldFind ? "1" : "0";
  document.body.dataset.foldConsult = foldConsult ? "1" : "0";
  document.documentElement.dataset.vpOrient = land ? "landscape" : "portrait";
  /* Consult providers: labeled sliding strip while Consulte is a column
   * (desktop / laptop / tablet). Icon-only only when Consulte is folded. */
  document.body.dataset.compactConsult = foldConsult ? "1" : "0";

  if (!force && foldKey === lastFoldKey) {
    applyOverlaySingleTool();
    requestAnimationFrame(syncSlidingToolOverflow);
    return;
  }
  lastFoldKey = foldKey;

  strip.querySelectorAll("[data-fold]").forEach((el) => el.remove());

  const paneTitle = strip.querySelector('[data-i18n="pane.read"]');
  const firstReadBtn = strip.querySelector(
    ':scope > button[data-mode^="read:"]',
  );

  function cloneTab(orig, fold) {
    if (!orig || orig.hidden || orig.closest("[data-feat][hidden]"))
      return null;
    if (orig.classList.contains("is-off")) return null;
    const mode = orig.getAttribute("data-mode") || "";
    if (mode && !toolAllowedBySize(mode, tier)) return null;
    const clone = orig.cloneNode(true);
    clone.classList.remove("on");
    clone.setAttribute("data-fold", fold);
    const label =
      clone.querySelector("[data-i18n]")?.textContent?.trim() ||
      clone.getAttribute("title") ||
      clone.getAttribute("data-mode") ||
      "";
    if (label) {
      clone.setAttribute("title", label);
      clone.setAttribute("aria-label", label);
    } else {
      const tip = tipForButton(clone);
      if (tip) {
        clone.setAttribute("title", tip);
        clone.setAttribute("aria-label", tip);
      }
    }
    clone.addEventListener("click", (e) => {
      e.stopPropagation();
      openMode(clone.getAttribute("data-mode"));
    });
    return clone;
  }

  if (foldFind) {
    const findBtns = document.querySelectorAll(
      "#p1 [data-tabs] > button[data-mode]",
    );
    const anchor = firstReadBtn;
    findBtns.forEach((orig) => {
      const clone = cloneTab(orig, "1");
      if (!clone) return;
      if (anchor) strip.insertBefore(clone, anchor);
      else if (paneTitle) strip.insertBefore(clone, paneTitle);
      else strip.appendChild(clone);
    });
  } else {
    const p1 = document.getElementById("p1");
    if (p1) p1.classList.remove("overlay", "overlay-single");
  }

  if (foldConsult) {
    const consultBtns = document.querySelectorAll(
      "#p3 [data-tabs] > button[data-mode]",
    );
    consultBtns.forEach((orig) => {
      const clone = cloneTab(orig, "3");
      if (!clone) return;
      if (paneTitle) strip.insertBefore(clone, paneTitle);
      else strip.appendChild(clone);
    });
  } else {
    const p3 = document.getElementById("p3");
    if (p3) p3.classList.remove("overlay", "overlay-single");
  }

  applyOverlaySingleTool();
  hydrateIcons(strip);
  syncTooltips(strip);
  requestAnimationFrame(syncSlidingToolOverflow);
}

function syncToolOverflow(el) {
  if (!(el instanceof HTMLElement)) return;
  const max = el.scrollWidth - el.clientWidth;
  const sl = el.scrollLeft;
  const overflow = max > 2;
  el.classList.toggle("is-overflow-start", overflow && sl > 1);
  el.classList.toggle("is-overflow-end", overflow && max - sl > 1);
}

function syncSlidingToolOverflow() {
  document
    .querySelectorAll("#p2 [data-tool].on, #p3 [data-tool].on")
    .forEach((el) => syncToolOverflow(el));
}

function bindSlidingToolOverflow() {
  document.querySelectorAll("#p2 [data-tool], #p3 [data-tool]").forEach((el) => {
    if (el.dataset.overflowBound) return;
    el.dataset.overflowBound = "1";
    el.addEventListener("scroll", () => syncToolOverflow(el), { passive: true });
  });
  requestAnimationFrame(syncSlidingToolOverflow);
}

let foldResizeTimer = null;
function onFoldResize() {
  if (foldResizeTimer) clearTimeout(foldResizeTimer);
  foldResizeTimer = setTimeout(() => {
    foldResizeTimer = null;
    handleTabFolding(false);
  }, 80);
}

/* ── Typography (cyclic controls) ────────────────── */

function cycle(list, current) {
  const i = list.indexOf(current);
  return list[(i < 0 ? 0 : i + 1) % list.length];
}

function nearest(list, value) {
  let best = list[0];
  let bestD = Math.abs(list[0] - value);
  for (let i = 1; i < list.length; i++) {
    const d = Math.abs(list[i] - value);
    if (d < bestD) {
      best = list[i];
      bestD = d;
    }
  }
  return best;
}

function applyTypography() {
  const el = bookEl();
  const face = fontFamily === "serif" ? "serif" : "sans";
  if (el) {
    el.style.setProperty("--book-size", fontSize + "rem");
    el.style.setProperty("--book-lh", String(lineHeight));
    /* Explicit attribute so CSS [data-font="sans"|"serif"] always matches */
    el.setAttribute("data-font", face);
    el.dataset.measure = measure;
    el.dataset.align = textAlign;
    el.style.setProperty(
      "--book-align",
      textAlign === "justify" ? "justify" : "start",
    );
  }
  /* Mirror reading face for P1 hit-card body text */
  document.documentElement.dataset.bookFont = face;
  document.documentElement.style.setProperty(
    "--reading-font",
    face === "serif" ? "var(--book-serif)" : "var(--book-sans)",
  );
  syncTypoButtons();
}

/**
 * Update cyclic typo button labels + icons to show what the *next* click does
 * (preview of the resulting value), not the current applied state.
 */
function syncTypoButtons() {
  const root = document.querySelector('[data-tool="read:typo"]');
  if (!root) return;

  const setLabel = (key, text, i18nKey) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    if (!btn) return;
    const span = btn.querySelector("[data-typo-label]");
    if (span) {
      span.textContent = text;
      if (i18nKey) span.setAttribute("data-i18n", i18nKey);
      else span.removeAttribute("data-i18n");
    }
  };

  const setIcon = (key, iconName) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    const host = btn?.querySelector("[data-icon]");
    if (!host) return;
    host.setAttribute("data-icon", iconName);
    host.innerHTML = "";
    hydrateIcons(btn);
  };

  const nextSize = cycle(FONT_SIZES, nearest(FONT_SIZES, fontSize));
  const nextLine = cycle(LINE_HEIGHTS, nearest(LINE_HEIGHTS, lineHeight));
  const nextMeasure = cycle(MEASURES, measure);
  const nextAlign = cycle(ALIGNS, textAlign);
  const nextFont = cycle(FONTS, fontFamily);

  const nextPct = Math.round(nextSize * 100) + "%";
  setLabel("size", nextPct);
  setLabel("line", String(nextLine));
  setLabel("measure", t("typo." + nextMeasure), "typo." + nextMeasure);
  setLabel(
    "align",
    nextAlign === "justify" ? t("typo.alignJustify") : t("typo.alignStart"),
    nextAlign === "justify" ? "typo.alignJustify" : "typo.alignStart",
  );
  setLabel(
    "font",
    nextFont === "serif" ? t("typo.serif") : t("typo.sans"),
    nextFont === "serif" ? "typo.serif" : "typo.sans",
  );

  const tipVal = {
    size: t("tip.typo.size") + " → " + nextPct,
    line: t("tip.typo.line") + " → " + String(nextLine),
    measure: t("tip.typo.measure") + " → " + t("typo." + nextMeasure),
    align:
      t("tip.typo.align") +
      " → " +
      (nextAlign === "justify" ? t("typo.alignJustify") : t("typo.alignStart")),
    font:
      t("tip.typo.font") +
      " → " +
      (nextFont === "serif" ? t("typo.serif") : t("typo.sans")),
  };
  Object.keys(tipVal).forEach((key) => {
    const btn = root.querySelector('[data-typo="' + key + '"]');
    if (btn) {
      btn.title = tipVal[key];
      btn.setAttribute("aria-label", tipVal[key]);
    }
  });
  /* Icons reflect the destination of the click */
  setIcon("align", nextAlign === "justify" ? "align-justify" : "align-left");
  setIcon("font", nextFont === "sans" ? "case-upper" : "type");
  setIcon("size", nextSize >= fontSize ? "a-arrow-up" : "a-arrow-down");
}

/* ── In-book links on/off (Páginas toolbar) ─── */

function bookLinksWanted() {
  if (vpTier() === "phone") return false;
  return bookLinksOn;
}

/**
 * Show/hide every inject link in the book.
 * Phone: forced off (no fat-finger consult). Does not open Consulte.
 */
function applyLinkFilters() {
  const book = bookEl();
  if (!book) return;
  delete book.dataset.linkDensity;
  const show = bookLinksWanted();
  book.querySelectorAll("a[data-link-provider], a[data-doutrina-link]").forEach(
    (a) => {
      if (!(a instanceof HTMLElement)) return;
      a.classList.toggle("link-hidden", !show);
      if (!show) a.setAttribute("aria-hidden", "true");
      else a.removeAttribute("aria-hidden");
    },
  );
  syncLinkControls();
}

function syncLinkControls() {
  const phone = vpTier() === "phone";
  const on = bookLinksWanted();
  document.querySelectorAll("[data-link-controls]").forEach((el) => {
    if (el instanceof HTMLElement) el.hidden = phone;
  });
  const btn = document.getElementById("book-links");
  if (!btn) return;
  btn.classList.toggle("is-on", on);
  btn.setAttribute("aria-pressed", on ? "true" : "false");
  const tip = t("tip.links");
  btn.title = tip;
  btn.setAttribute("aria-label", tip);
}

function toggleBookLinks() {
  if (vpTier() === "phone") return;
  bookLinksOn = !bookLinksOn;
  try {
    localStorage.setItem(BOOK_LINKS_KEY, bookLinksOn ? "1" : "0");
  } catch (_) {
    /* ignore */
  }
  applyLinkFilters();
}

/* ── Catalog / books / in-book search ────────────── */

let catalogLoadPromise = null;

async function loadCatalog() {
  if (catalogLoadPromise) return catalogLoadPromise;
  catalogLoadPromise = (async () => {
    const flavor = getFlavor();
    const path = (flavor && flavor.catalog) || "/books/catalog.json";
    try {
      const res = await fetch(path, { cache: "no-cache" });
      if (!res.ok) throw new Error(String(res.status));
      const data = await res.json();
      CATALOG_ALL = Array.isArray(data) ? data : [];
    } catch (err) {
      console.warn("[POC] catalog", err);
      CATALOG_ALL = [];
    }
    CATALOG = filterCatalog(CATALOG_ALL, undefined, currentLang);
    renderLibrary();
    return CATALOG;
  })().finally(() => {
    catalogLoadPromise = null;
  });
  return catalogLoadPromise;
}

function renderLibrary() {
  const grid = document.getElementById("grid");
  if (!grid) return;
  grid.innerHTML = "";
  if (!CATALOG.length) {
    const empty = document.createElement("li");
    empty.style.gridColumn = "1 / -1";
    empty.style.opacity = "0.7";
    empty.textContent =
      currentLang === "en"
        ? "No books in catalog."
        : "Nenhum livro no catálogo.";
    grid.appendChild(empty);
    return;
  }
  CATALOG.forEach((entry) => {
    const li = document.createElement("li");
    const btn = document.createElement("button");
    btn.type = "button";
    if (entry.color) {
      btn.style.setProperty("--card-accent", entry.color);
    }
    if (entry.emoji) {
      const b = document.createElement("b");
      b.setAttribute("aria-hidden", "true");
      b.textContent = entry.emoji;
      btn.appendChild(b);
    }
    const strong = document.createElement("strong");
    strong.textContent =
      currentLang === "pt" && entry.titlePt
        ? entry.titlePt
        : entry.title || entry.id;
    const small = document.createElement("small");
    const meta =
      currentLang === "pt" && entry.metaPt ? entry.metaPt : entry.meta || "";
    small.textContent = [entry.author, meta].filter(Boolean).join(" · ");
    btn.appendChild(strong);
    btn.appendChild(small);
    btn.addEventListener("click", () => openBook(entry.id));
    li.appendChild(btn);
    grid.appendChild(li);
  });
}

async function loadFolioPages(id) {
  folioPages = [];
  if (!id) return;
  try {
    const res = await fetch("/books/" + id + "/pages.json", {
      cache: "no-cache",
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data?.pages) ? data.pages : [];
    folioPages = list
      .map((n) => Number(n))
      .filter((n) => Number.isFinite(n) && n > 0);
  } catch (_) {
    folioPages = [];
  }
}

function isFolioPaged() {
  return folioPages.length > 1;
}

function isHardPages() {
  const pages = currentBook?.pages || [];
  return pages.length > 1 || currentBook?.paged === true || isFolioPaged();
}

function scrollToFolio(folioNum, { smooth = false } = {}) {
  const root = bookEl();
  if (!root || !folioNum) return;
  const sel =
    "#page-" +
    CSS.escape(String(folioNum)) +
    ', .pdf-page-start[data-page="' +
    CSS.escape(String(folioNum)) +
    '"]';
  const target = root.querySelector(sel);
  /* auto: large jumps (e.g. 3→100) finish reliably; smooth optional for ±1 */
  target?.scrollIntoView({
    block: "start",
    behavior: smooth ? "smooth" : "auto",
  });
}

function folioIndexForNumber(folioNum) {
  const n = Number(folioNum);
  let idx = folioPages.indexOf(n);
  if (idx >= 0) return idx;
  /* Nearest folio at or before n */
  for (let i = folioPages.length - 1; i >= 0; i--) {
    if (folioPages[i] <= n) return i;
  }
  return 0;
}

async function loadBook(slug) {
  let id = slug || currentSlug;
  if (!id) throw new Error("no book id");
  /* Prefer edition matching UI language when a pair exists */
  const fromAll = CATALOG_ALL.find((b) => b && b.id === id);
  if (fromAll) {
    const prefer = findPairedEdition(CATALOG_ALL, fromAll, currentLang);
    if (prefer && prefer.id) id = prefer.id;
  }
  if (BOOK_CACHE[id]) {
    currentBook = BOOK_CACHE[id];
    currentSlug = id;
    await loadFolioPages(id);
    scheduleSearchIndexWarm();
    return currentBook;
  }
  const entry =
    CATALOG_ALL.find((b) => b && b.id === id) ||
    CATALOG.find((b) => b && b.id === id);
  const path = (entry && entry.path) || "/books/" + id + "/book.json";
  const res = await fetch(path, { cache: "no-cache" });
  if (!res.ok) throw new Error("book " + id + " " + res.status);
  const book = await res.json();
  BOOK_CACHE[id] = book;
  currentBook = book;
  currentSlug = id;
  await loadFolioPages(id);
  scheduleSearchIndexWarm();
  return book;
}

/**
 * Warm the string search index in idle time (no timeout — never force).
 * Indexing is a linear HTML scan (no innerHTML), so LDE-sized pages are
 * tens of ms and safe to warm after paint. First Enter still builds if idle
 * has not finished.
 */
function scheduleSearchIndexWarm() {
  const book = currentBook;
  if (!book?.pages?.length) return;
  let i = 0;
  const step = (deadline) => {
    if (currentBook !== book) return;
    while (i < book.pages.length) {
      if (
        deadline &&
        typeof deadline.timeRemaining === "function" &&
        deadline.timeRemaining() < 4 &&
        !deadline.didTimeout
      ) {
        break;
      }
      try {
        getPageSearchIndex(i);
      } catch (_) {
        /* ignore */
      }
      i += 1;
      if (
        deadline &&
        typeof deadline.timeRemaining === "function" &&
        deadline.timeRemaining() < 4
      ) {
        break;
      }
    }
    if (i < book.pages.length) {
      if (typeof requestIdleCallback === "function") {
        requestIdleCallback(step);
      } else {
        setTimeout(() => step(null), 50);
      }
    }
  };
  if (typeof requestIdleCallback === "function") {
    requestIdleCallback(step);
  } else {
    setTimeout(() => step(null), 50);
  }
}

async function openBook(slug) {
  try {
    await enterReader(slug, 0);
  } catch (err) {
    console.warn("[POC] openBook", err);
    return;
  }
  /* Update URL without re-running applyRoute (already painted) */
  navigate(pathFor("reader", { slug: currentSlug, page: 0 }), {
    skip: true,
  });
}

function tocLabel(item) {
  if (!item) return "";
  if (currentLang === "pt" && item.labelPt) return item.labelPt;
  if (currentLang === "en" && item.labelEn) return item.labelEn;
  return item.label || item.id || "";
}

/** Part-style label: "1. Causas…" / "0. Pré-textual" (not "1.1. …"). */
function tocIsPartLabel(label) {
  return /^\d+\.\s/.test(String(label || "").trim());
}

/**
 * Nest depth for indent (2 spaces / 2ch per level).
 * Parts flush left; chapters under a part indent one step.
 * Dotted chapter labels ("1.1.") stay flush when the TOC has no parts.
 */
function tocLevel(toc, index) {
  const label = tocLabel(toc[index]);
  const trimmed = String(label || "").trim();
  if (tocIsPartLabel(trimmed)) return 0;
  if (/^\d+\.\d+/.test(trimmed)) {
    const hasParts = toc.some((it) => tocIsPartLabel(tocLabel(it)));
    return hasParts ? 1 : 0;
  }
  for (let i = index - 1; i >= 0; i--) {
    if (tocIsPartLabel(tocLabel(toc[i]))) return 1;
  }
  return 0;
}

function renderToc() {
  const nav = tocEl();
  if (!nav) return;
  nav.innerHTML = "";
  const q = (document.getElementById("toc-q")?.value || "")
    .trim()
    .toLowerCase();
  const toc = currentBook?.toc || [];
  let n = 0;
  toc.forEach((item, index) => {
    const label = tocLabel(item);
    if (!label) return;
    if (q && label.toLowerCase().indexOf(q) === -1) return;
    n += 1;
    const level = tocLevel(toc, index);
    const btn = document.createElement("button");
    btn.type = "button";
    btn.textContent = label;
    btn.dataset.tocLevel = String(level);
    if (level > 0) {
      /* ~2 spaces per nesting level */
      btn.style.paddingLeft = `calc(0.5rem + ${level * 2}ch)`;
    }
    btn.addEventListener("click", () => {
      nav.querySelectorAll("button").forEach((b) => b.classList.remove("on"));
      btn.classList.add("on");
      const pages = currentBook.pages || [];
      if (pages.length > 1) {
        const idx = pages.findIndex((p) => p.id === item.id);
        if (idx >= 0) {
          goToPage(idx);
          return;
        }
      }
      const target = bookEl()?.querySelector("#" + CSS.escape(item.id));
      target?.scrollIntoView({ block: "start", behavior: "smooth" });
    });
    nav.appendChild(btn);
  });
  if (!n) {
    const p = document.createElement("p");
    p.textContent = t("toc.empty");
    nav.appendChild(p);
  }
}

function renderPage() {
  const el = bookEl();
  if (!el) {
    console.warn("[POC] #book missing");
    return;
  }
  if (!currentBook) {
    el.innerHTML =
      "<p class='chrome-hint'>" +
      (currentLang === "en" ? "No book loaded." : "Nenhum livro carregado.") +
      "</p>";
    return;
  }
  const pages = currentBook.pages || [];
  const folioMode = isFolioPaged();
  const page = folioMode
    ? pages[0] || pages[pageIndex]
    : pages[pageIndex] || pages[0];
  const html = page?.html || page?.body || "";

  if (folioMode) {
    /* Keep one blob mounted; only re-inject when switching books */
    if (el.dataset.folioBook !== currentSlug) {
      el.innerHTML =
        html ||
        "<p class='chrome-hint'>" +
          (currentLang === "en" ? "Empty page." : "Página vazia.") +
          "</p>";
      el.dataset.folioBook = currentSlug || "";
      paintedSearchQuery = "";
    }
  } else {
    delete el.dataset.folioBook;
    el.innerHTML =
      html ||
      "<p class='chrome-hint'>" +
        (currentLang === "en" ? "Empty page." : "Página vazia.") +
        "</p>";
    /* New DOM — any prior search marks are gone */
    paintedSearchQuery = "";
  }

  const input = document.getElementById("page-n");
  const total = document.getElementById("page-total");
  const hardPages = isHardPages();
  if (folioMode) {
    const folio = folioPages[pageIndex] || folioPages[0] || 1;
    const folioMax = folioPages[folioPages.length - 1] || folio;
    if (input) {
      input.value = String(folio);
      input.min = String(folioPages[0] || 1);
      input.max = String(folioMax);
    }
    if (total) total.textContent = "/ " + folioMax;
  } else {
    if (input) {
      input.value = String(pageIndex + 1);
      input.min = "1";
      input.max = String(Math.max(1, pages.length));
    }
    if (total) total.textContent = "/ " + Math.max(1, pages.length);
  }
  /* Hard pages OR folio-anchored blob — show ‹ n / X › cluster */
  document.querySelectorAll("[data-page-nav]").forEach((nav) => {
    nav.hidden = !hardPages;
    nav.classList.toggle("is-disabled", !hardPages);
  });
  document.querySelectorAll("[data-page]").forEach((b) => {
    b.disabled = !hardPages;
    b.setAttribute("aria-disabled", hardPages ? "false" : "true");
  });
  if (input) input.disabled = !hardPages;
  document.body.dataset.hardPages = hardPages ? "1" : "0";
  document.body.dataset.folioPages = folioMode ? "1" : "0";
  applyTypography();
  applyLinkFilters();
  if (folioMode) {
    const folio = folioPages[pageIndex] || folioPages[0];
    requestAnimationFrame(() => {
      requestAnimationFrame(() => scrollToFolio(folio));
    });
  }
}

/**
 * @param {number} index
 * @param {{ scrollTop?: boolean }} [opts]
 */
function goToPage(index, opts = {}) {
  const scrollTop = opts.scrollTop !== false;
  if (isFolioPaged()) {
    if (index < 0 || index >= folioPages.length) return;
    const same = index === pageIndex;
    pageIndex = index;
    const folio = folioPages[pageIndex];
    if (!same) renderPage();
    navigate(pathFor("reader", { slug: currentSlug, page: folio - 1 }), {
      replace: true,
      skip: true,
    });
    return;
  }
  const pages = currentBook?.pages || [];
  if (index < 0 || index >= pages.length) return;
  const same = index === pageIndex;
  pageIndex = index;
  if (!same) {
    renderPage();
    navigate(pathFor("reader", { slug: currentSlug, page: pageIndex }), {
      replace: true,
      skip: true,
    });
  }
  if (scrollTop && !same) bookEl()?.scrollTo(0, 0);
}

function stripHtml(html) {
  const d = document.createElement("div");
  d.innerHTML = html || "";
  return (d.textContent || "").replace(/\s+/g, " ").trim();
}

/**
 * Clean heading label for hit cards — drop emoji/icons, collapse space.
 * @param {string} raw
 */
function cleanHeadingLabel(raw) {
  return String(raw || "")
    .replace(/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/gu, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Decode the few entities books actually ship (`&amp;` / `&quot;` / numeric).
 * @param {string} s
 */
function decodeSearchEntities(s) {
  if (!s || s.indexOf("&") === -1) return s;
  return s
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#(\d+);/g, (_, n) => String.fromCharCode(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) =>
      String.fromCharCode(parseInt(n, 16)),
    );
}

/**
 * Index page plain text + heading starts with a linear HTML string scan.
 * No innerHTML / detached DOM — that was multi-second on LDE-sized pages.
 * @param {string} html
 * @returns {{
 *   text: string,
 *   lower: string,
 *   headings: { start: number, label: string, id: string }[]
 * }}
 */
function indexPageHeadings(html) {
  const src = String(html || "")
    .replace(/<script\b[\s\S]*?<\/script>/gi, " ")
    .replace(/<style\b[\s\S]*?<\/style>/gi, " ");
  const headings =
    /** @type {{ start: number, label: string, id: string }[]} */ ([]);
  const parts = [];
  let len = 0;
  let lastSpace = false;

  function append(raw) {
    if (!raw) return;
    const t = decodeSearchEntities(raw).replace(/\s+/g, " ");
    if (!t) return;
    let chunk = t;
    if (len === 0 && chunk[0] === " ") chunk = chunk.slice(1);
    else if (lastSpace && chunk[0] === " ") chunk = chunk.slice(1);
    if (!chunk) return;
    parts.push(chunk);
    len += chunk.length;
    lastSpace = chunk.endsWith(" ");
  }

  const re = /<h([1-6])(\s[^>]*)?>([\s\S]*?)<\/h\1>|<[^>]+>/gi;
  let last = 0;
  let m;
  while ((m = re.exec(src))) {
    if (m.index > last) append(src.slice(last, m.index));
    if (m[1]) {
      const attrs = m[2] || "";
      const idM = /\sid\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+))/i.exec(attrs);
      const id = (idM && (idM[1] || idM[2] || idM[3])) || "";
      const inner = m[3].replace(/<[^>]+>/g, " ");
      const label = cleanHeadingLabel(decodeSearchEntities(inner));
      if (label) headings.push({ start: len, label, id });
      append(inner);
    }
    last = re.lastIndex;
  }
  if (last < src.length) append(src.slice(last));
  let text = parts.join("");
  if (text.endsWith(" ")) text = text.slice(0, -1);
  return { text, lower: text.toLowerCase(), headings };
}

/** @type {WeakMap<object, Map<number, { text: string, lower: string, headings: { start: number, label: string, id: string }[] }>>} */
const pageSearchIndexCache = new WeakMap();

/** @param {number} pageIdx */
function getPageSearchIndex(pageIdx) {
  const book = currentBook;
  if (!book) return { text: "", lower: "", headings: [] };
  let map = pageSearchIndexCache.get(book);
  if (!map) {
    map = new Map();
    pageSearchIndexCache.set(book, map);
  }
  if (map.has(pageIdx)) return map.get(pageIdx);
  const indexed = indexPageHeadings(book.pages?.[pageIdx]?.html || "");
  map.set(pageIdx, indexed);
  return indexed;
}

/**
 * @param {{ start: number, label: string, id: string }[]} headings
 * @param {number} at plain-text offset of the hit
 * @returns {{ start: number, label: string, id: string } | null}
 */
function headingAt(headings, at) {
  let found = null;
  for (let i = 0; i < headings.length; i++) {
    if (headings[i].start <= at) found = headings[i];
    else break;
  }
  return found;
}

/** Query currently painted as <mark>s in #book (lowercase), or "". */
let paintedSearchQuery = "";

/** Unwrap in-book <mark> highlights (search clear / new query). */
function clearSearchHighlights() {
  const el = bookEl();
  paintedSearchQuery = "";
  if (!el) return;
  el.querySelectorAll("mark").forEach((m) => {
    const p = m.parentNode;
    p?.replaceChild(document.createTextNode(m.textContent || ""), m);
    p?.normalize();
  });
}

const SEARCH_HIT_CAP = 80;

function runSearch(q) {
  const box = hitsEl();
  if (!box) return;
  searchQuery = q == null ? searchQuery : q;
  const query = (searchQuery || "").trim();
  box.innerHTML = "";
  if (!query) {
    clearSearchHighlights();
    box.innerHTML = "<p>" + t("search.empty") + "</p>";
    return;
  }
  const pages = currentBook?.pages || [];
  const hits = [];
  let capped = false;
  const lower = query.toLowerCase();
  outer: for (let i = 0; i < pages.length; i++) {
    const indexed = getPageSearchIndex(i);
    const hay = indexed.lower || "";
    const text = indexed.text || "";
    let from = 0;
    let idx;
    let pageHit = 0;
    let sectionId = null;
    let sectionHit = 0;
    while ((idx = hay.indexOf(lower, from)) !== -1) {
      const start = Math.max(0, idx - 40);
      const snip = text.slice(start, idx + query.length + 40);
      const where = headingAt(indexed.headings, idx);
      const hid = where?.id || "";
      if (hid !== sectionId) {
        sectionId = hid;
        sectionHit = 0;
      }
      hits.push({
        page: i,
        snip,
        at: idx,
        pageHitIndex: pageHit++,
        heading: where?.label || "",
        headingId: hid,
        sectionHitIndex: sectionHit++,
      });
      from = idx + query.length;
      if (hits.length >= SEARCH_HIT_CAP) {
        capped = true;
        break outer;
      }
    }
  }
  if (!hits.length) {
    clearSearchHighlights();
    box.innerHTML = "<p>" + t("search.none") + "</p>";
    return;
  }
  const head = document.createElement("p");
  head.textContent = (
    capped ? t("search.hitsCapped") : t("search.hits")
  ).replace("{n}", String(hits.length));
  box.appendChild(head);
  /** @type {HTMLButtonElement[]} */
  const cards = [];
  hits.forEach((hit, n) => {
    const btn = document.createElement("button");
    btn.type = "button";
    const num = String(n + 1);
    const loc =
      hit.heading ||
      (pages.length > 1 ? "p." + (hit.page + 1) : t("search.nowhere"));
    const snip = "…" + hit.snip + "…";
    btn.innerHTML =
      '<span class="hit-num">' +
      num +
      "</span>" +
      '<span class="hit-loc"></span>' +
      '<span class="hit-snip"></span>';
    const locEl = btn.querySelector(".hit-loc");
    const snipEl = btn.querySelector(".hit-snip");
    if (locEl) locEl.textContent = loc;
    if (snipEl) snipEl.textContent = snip;
    btn.title = num + ". " + loc;
    btn.addEventListener("click", () => {
      /* is-current only — avoid global button.on (white text on black) */
      box.querySelectorAll("button").forEach((b) => {
        b.classList.remove("is-current", "on");
      });
      btn.classList.add("is-current");
      jumpToSearchHit(query, hit);
    });
    box.appendChild(btn);
    cards.push(btn);
  });

  /* Paint all marks on the first hit’s page as soon as the list appears */
  const first = hits[0];
  if (first) {
    cards[0]?.classList.add("is-current");
    jumpToSearchHit(query, first);
  }
}

/**
 * Navigate to a hit without re-rendering a huge page on every click.
 * @param {string} query
 * @param {{ page: number, headingId?: string, sectionHitIndex?: number, pageHitIndex?: number }} hit
 */
function jumpToSearchHit(query, hit) {
  const pageChanged = hit.page !== pageIndex;
  if (pageChanged) {
    goToPage(hit.page, { scrollTop: true });
    /* Let layout settle after swapping HTML before marking/scrolling */
    requestAnimationFrame(() => {
      requestAnimationFrame(() => highlightInPage(query, hit));
    });
    return;
  }
  highlightInPage(query, hit);
}

/**
 * Text nodes in a heading’s section (heading + following siblings until the
 * next h1–h6). Falls back to the whole page when the id is missing.
 * @param {Element} root
 * @param {string} [headingId]
 * @returns {Text[]}
 */
function textNodesForSearch(root, headingId) {
  /** @type {Text[]} */
  const nodes = [];
  const take = (el) => {
    if (!el) return;
    const walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    let n;
    while ((n = walk.nextNode())) {
      if (n.nodeValue) nodes.push(/** @type {Text} */ (n));
    }
  };
  const start =
    headingId && root.querySelector
      ? root.querySelector("#" + CSS.escape(headingId))
      : null;
  if (!start || !root.contains(start)) {
    take(root);
    return nodes;
  }
  take(start);
  let sib = start.nextElementSibling;
  while (sib) {
    if (/^H[1-6]$/.test(sib.tagName)) break;
    take(sib);
    sib = sib.nextElementSibling;
  }
  return nodes;
}

/**
 * Mark only the focused occurrence (not every hit). Walk the heading section
 * rather than the whole multi‑MB book.
 * @param {string} query
 * @param {{ headingId?: string, sectionHitIndex?: number, pageHitIndex?: number }} hit
 */
function highlightInPage(query, hit) {
  const el = bookEl();
  if (!el || !query) return;
  clearSearchHighlights();
  const qLower = query.toLowerCase();
  const want = Math.max(
    0,
    hit && hit.sectionHitIndex != null
      ? hit.sectionHitIndex
      : hit && hit.pageHitIndex != null
        ? hit.pageHitIndex
        : 0,
  );
  const nodes = textNodesForSearch(el, hit?.headingId);
  let seen = 0;
  let target = /** @type {HTMLElement | null} */ (null);
  outer: for (const textNode of nodes) {
    const parent = textNode.parentNode;
    if (!parent || parent.closest("mark")) continue;
    const value = textNode.nodeValue || "";
    const valueLower = value.toLowerCase();
    let from = 0;
    let idx;
    while ((idx = valueLower.indexOf(qLower, from)) !== -1) {
      if (seen === want) {
        const before = value.slice(0, idx);
        const match = value.slice(idx, idx + query.length);
        const after = value.slice(idx + query.length);
        const frag = document.createDocumentFragment();
        if (before) frag.appendChild(document.createTextNode(before));
        const mark = document.createElement("mark");
        mark.className = "focus";
        mark.textContent = match;
        frag.appendChild(mark);
        if (after) frag.appendChild(document.createTextNode(after));
        parent.replaceChild(frag, textNode);
        target = mark;
        break outer;
      }
      seen += 1;
      from = idx + query.length;
    }
  }

  paintedSearchQuery = qLower;
  if (!target && hit?.headingId && hit.pageHitIndex != null) {
    /* Section walk missed (whitespace vs live DOM) — whole-page fallback */
    const all = textNodesForSearch(el, "");
    seen = 0;
    const wantPage = Math.max(0, hit.pageHitIndex);
    outerPage: for (const textNode of all) {
      const parent = textNode.parentNode;
      if (!parent || parent.closest("mark")) continue;
      const value = textNode.nodeValue || "";
      const valueLower = value.toLowerCase();
      let from = 0;
      let idx;
      while ((idx = valueLower.indexOf(qLower, from)) !== -1) {
        if (seen === wantPage) {
          const before = value.slice(0, idx);
          const match = value.slice(idx, idx + query.length);
          const after = value.slice(idx + query.length);
          const frag = document.createDocumentFragment();
          if (before) frag.appendChild(document.createTextNode(before));
          const mark = document.createElement("mark");
          mark.className = "focus";
          mark.textContent = match;
          frag.appendChild(mark);
          if (after) frag.appendChild(document.createTextNode(after));
          parent.replaceChild(frag, textNode);
          target = mark;
          break outerPage;
        }
        seen += 1;
        from = idx + query.length;
      }
    }
  }
  if (target) {
    /* Instant jump — smooth scroll across a folio book feels stuck. */
    target.scrollIntoView({ block: "center", behavior: "auto" });
  }
}

/* ── Context / providers ─────────────────────────── */

function wikiLang() {
  return currentLang === "en" ? "en" : "pt";
}

function applyWikiTheme(url) {
  if (!/(?:wikipedia|wiktionary)\.org/i.test(url)) return url;
  try {
    const u = new URL(url);
    if (currentTheme === "dark") {
      u.searchParams.set("vectornightmode", "1");
      u.searchParams.set("minervanightmode", "1");
    } else {
      u.searchParams.delete("vectornightmode");
      u.searchParams.delete("minervanightmode");
    }
    return u.toString();
  } catch (_) {
    return url;
  }
}

/** Link-injection short codes → PROVIDERS keys */
const LINK_PROVIDER_KEY = {
  m: "map",
  map: "map",
  w: "encyc",
  encyc: "encyc",
  d: "dict",
  dict: "dict",
  l: "luz",
  luz: "luz",
  bible: "bible",
  kardec: "kardec",
};

function providerUrl(key, term) {
  const meta = PROVIDERS[key];
  if (!meta) return "";
  const tpl = term ? meta.search || meta.home : meta.home;
  let url = tpl
    .replace(/\{lang\}/g, wikiLang())
    .replace(/\{query\}/gi, encodeURIComponent(term || ""));
  return applyWikiTheme(url);
}

/**
 * OSM main site refuses iframes; use export/embed when possible.
 * @param {string} [query]
 * @returns {Promise<string>}
 */
async function mapEmbedUrl(query) {
  const q = String(query || "").trim();
  if (!q) return PROVIDERS.map.home;
  try {
    const res = await fetch(
      "https://nominatim.openstreetmap.org/search?format=json&limit=1&q=" +
        encodeURIComponent(q),
      {
        headers: {
          Accept: "application/json",
          /* Nominatim usage policy: identify the app */
          "Accept-Language": currentLang === "en" ? "en" : "pt",
        },
      },
    );
    if (res.ok) {
      const data = await res.json();
      const hit = data && data[0];
      if (hit && hit.boundingbox) {
        const [south, north, west, east] = hit.boundingbox;
        const lat = hit.lat;
        const lon = hit.lon;
        return (
          "https://www.openstreetmap.org/export/embed.html?bbox=" +
          encodeURIComponent(west + "," + south + "," + east + "," + north) +
          "&layer=mapnik&marker=" +
          encodeURIComponent(lat + "," + lon)
        );
      }
    }
  } catch (_) {
    /* fall through */
  }
  /* Last resort: external search page (also used if embed fails) */
  return (
    PROVIDERS.map.external?.replace(
      /\{query\}/gi,
      encodeURIComponent(q),
    ) || PROVIDERS.map.search.replace(/\{query\}/gi, encodeURIComponent(q))
  );
}

function isMapUrl(url) {
  return /openstreetmap\.org/i.test(String(url || ""));
}

function isEmbeddableMapUrl(url) {
  return /openstreetmap\.org\/export\/embed/i.test(String(url || ""));
}

/**
 * Resolve provider URL (async for maps).
 * @param {string} key
 * @param {string} term
 * @returns {Promise<string>}
 */
async function resolveProviderUrl(key, term) {
  if (key === "map") return mapEmbedUrl(term);
  return providerUrl(key, term);
}

function providerLabel(key) {
  const k = String(key || "").toLowerCase();
  if (!k) return "";
  const i18n = t("prov." + k);
  if (i18n && i18n !== "prov." + k) return i18n;
  return k;
}

function providerFromUrl(url) {
  if (!url) return "";
  try {
    const h = new URL(url, location.href).hostname || "";
    if (/luzespirita/i.test(h)) return "luz";
    if (/wiktionary/i.test(h)) return "dict";
    if (/wikipedia/i.test(h)) return "encyc";
    if (/bible\.com/i.test(h)) return "bible";
    if (/kardecpedia/i.test(h)) return "kardec";
    if (/openstreetmap/i.test(h)) return "map";
  } catch (_) {
    /* ignore */
  }
  return "";
}

function formatCtxLoadingMessage(term, providerKey, url) {
  const key =
    String(providerKey || "").toLowerCase() || providerFromUrl(url || "");
  const provider = providerLabel(key);
  const tTerm = String(term || "").trim();
  if (tTerm) {
    return t("ctx.searching")
      .replace(/\{term\}/g, tTerm)
      .replace(/\{provider\}/g, provider || "…");
  }
  if (key || provider) {
    return t("ctx.opening").replace(/\{provider\}/g, provider || "…");
  }
  return t("ctx.loading");
}

/**
 * Spinner overlay over the consult iframe (+ what/who is loading).
 * @param {boolean} on
 * @param {{ term?: string, provider?: string, url?: string }} [opts]
 */
function setCtxLoading(on, opts = {}) {
  const host = document.getElementById("ctx-host");
  const spin = document.getElementById("ctx-loading");
  const msg = document.getElementById("ctx-loading-msg");
  if (host) host.classList.toggle("is-loading", !!on);
  if (spin) {
    spin.hidden = !on;
    spin.setAttribute("aria-hidden", on ? "false" : "true");
  }
  if (msg) {
    msg.textContent = on
      ? formatCtxLoadingMessage(opts.term, opts.provider, opts.url)
      : "";
  }
}

function setCtxHintVisible(on) {
  const hint = document.getElementById("ctx-hint");
  if (hint) {
    hint.hidden = !on;
    hint.setAttribute("aria-hidden", on ? "false" : "true");
  }
  if (!on) finishHelpPaneIntro();
}

function loadCtx(url, { push = true, term = "", provider = "" } = {}) {
  if (isStudyReduced()) return;
  const frame = ctxEl();
  if (!frame || !url) return;
  setCtxHintVisible(false);

  /* OSM search UI cannot run in iframe — open externally + show embed if we have one */
  if (isMapUrl(url) && !isEmbeddableMapUrl(url)) {
    try {
      window.open(url, "_blank", "noopener,noreferrer");
    } catch (_) {
      /* ignore */
    }
    /* Prefer showing a working map pane rather than a blank frame */
    url = PROVIDERS.map.home;
  }

  if (push && lastCtxUrl && lastCtxUrl !== url) {
    ctxHistory.push(lastCtxUrl);
    if (ctxHistory.length > 40) ctxHistory.shift();
  }
  lastCtxUrl = url;
  const prov = provider || providerFromUrl(url);
  setCtxLoading(true, { term, provider: prov, url });
  const done = () => {
    setCtxLoading(false);
    frame.removeEventListener("load", done);
    frame.removeEventListener("error", done);
  };
  frame.addEventListener("load", done);
  frame.addEventListener("error", done);
  /* Safety: don't spin forever on blocked/cross-origin quirks */
  setTimeout(done, 12000);
  if (phoneReaderOnly()) return;
  frame.src = url;
  setMode("consult", "web");
  /* Ensure back/reload icons paint when consult chrome first appears */
  try {
    hydrateIcons(document.querySelector('#p3 [data-tool="consult:web"]'));
  } catch (_) {
    /* ignore */
  }
  syncCtxBackBtn();
}

function flashConsultNeedTerm() {
  setMode("consult", "web");
  const host = document.getElementById("ctx-host");
  if (!host) return;
  host.classList.remove("is-need-term");
  void host.offsetWidth;
  host.setAttribute("data-need-term", t("ctx.needTerm"));
  host.classList.add("is-need-term");
  window.setTimeout(() => host.classList.remove("is-need-term"), 1400);
}

function syncProviderArmed() {
  const on = !!selectionTerm();
  document.querySelectorAll("[data-provider]").forEach((btn) => {
    btn.classList.toggle("is-disarmed", !on);
    btn.setAttribute("aria-disabled", on ? "false" : "true");
    if (!on) {
      btn.setAttribute("title", t("ctx.needTerm"));
    } else {
      const key = btn.getAttribute("data-provider");
      const label = providerLabel(key);
      if (label) btn.setAttribute("title", label);
    }
  });
}

/** Open a provider from toolbar (selection = query for search). */
async function openProvider(key) {
  if (phoneReaderOnly() || isStudyReduced()) return;
  const term = selectionTerm();
  if (!term) {
    flashConsultNeedTerm();
    return;
  }
  const url = await resolveProviderUrl(key, term);
  if (url) loadCtx(url, { term, provider: key });
}

/**
 * Book body links: keep in consult pane when possible.
 * @param {string} href
 * @param {HTMLAnchorElement | null} anchor
 */
async function openBookLink(href, anchor) {
  if (!href) return;
  if (phoneReaderOnly()) return;
  /* Reduced mode: no simultaneous consult — ignore consultation triggers */
  if (isStudyReduced()) {
    const code = (anchor?.getAttribute("data-link-provider") || "").toLowerCase();
    if (
      code ||
      anchor?.hasAttribute("data-doutrina-link") ||
      isMapUrl(href)
    ) {
      return;
    }
    /* Allow pure internal section jumps only */
    if (href.startsWith("#")) return;
    return;
  }
  const code = (anchor?.getAttribute("data-link-provider") || "").toLowerCase();
  const key = LINK_PROVIDER_KEY[code] || "";
  const term = String(anchor?.textContent || "")
    .replace(/\s+/g, " ")
    .trim();

  if (key === "map" || isMapUrl(href)) {
    let q = term;
    try {
      const u = new URL(href, location.href);
      q = u.searchParams.get("query") || u.searchParams.get("q") || term;
    } catch (_) {
      /* ignore */
    }
    const embed = await mapEmbedUrl(q);
    if (embed && isEmbeddableMapUrl(embed)) {
      loadCtx(embed, { term: q, provider: "map" });
      return;
    }
    loadCtx(href, { term, provider: key || "map" });
    return;
  }

  if (key) {
    const url = await resolveProviderUrl(key, term);
    if (url) {
      loadCtx(url, { term, provider: key });
      return;
    }
  }

  /* Other absolute links → consult iframe (wiki etc.) */
  if (/^https?:\/\//i.test(href)) {
    loadCtx(href, { term, provider: key || providerFromUrl(href) });
  }
}

function ctxGoBack() {
  const prev = ctxHistory.pop();
  if (prev) {
    loadCtx(prev, { push: false });
    return;
  }
  /* No history: reload provider home for current lang wiki */
  const home = providerUrl("encyc", "");
  if (home) loadCtx(home, { push: false });
}

function syncCtxBackBtn() {
  const btn = document.querySelector('[data-ctx="back"]');
  if (!btn) return;
  const can = ctxHistory.length > 0;
  btn.disabled = !can;
  btn.setAttribute("aria-disabled", can ? "false" : "true");
  btn.style.opacity = can ? "1" : "0.45";
}

function selectionTerm() {
  const sel = window.getSelection();
  return sel
    ? String(sel.toString() || "")
        .replace(/\s+/g, " ")
        .trim()
    : "";
}

/* ── Mock PDF / Video (pane 3) ───────────────────── */

function renderMockPdf() {
  const pageEl = document.getElementById("pdf-mock-page");
  const sheet = document.getElementById("pdf-sheet");
  const input = document.getElementById("pdf-page-input");
  const total = document.getElementById("pdf-page-total");
  const mock = document.getElementById("pdf-mock");
  if (!mockPdfLoaded) {
    if (mock) mock.dataset.empty = "1";
    if (pageEl) pageEl.textContent = t("pdf.mockCleared");
    if (input) input.value = "1";
    if (total) total.textContent = "/ 0";
    return;
  }
  if (mock) mock.dataset.empty = "0";
  if (pageEl) {
    pageEl.textContent = t("pdf.mockPage")
      .replace("{n}", String(mockPdfPage))
      .replace("{total}", String(MOCK_PDF_TOTAL));
  }
  if (sheet) sheet.style.transform = "scale(" + mockPdfZoom + ")";
  if (input) {
    input.value = String(mockPdfPage);
    input.max = String(MOCK_PDF_TOTAL);
  }
  if (total) total.textContent = "/ " + MOCK_PDF_TOTAL;

  const lines = document.getElementById("pdf-lines");
  if (lines && !lines.childElementCount) {
    for (let i = 0; i < 14; i++) {
      const bar = document.createElement("span");
      bar.style.width = 55 + ((i * 17) % 40) + "%";
      lines.appendChild(bar);
    }
  }
}

function wireMockPdf() {
  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-pdf");
      if (a === "upload") {
        mockPdfLoaded = true;
        mockPdfPage = 1;
        mockPdfZoom = 1;
      }
      if (a === "unload") {
        mockPdfLoaded = false;
      }
      if (a === "prev" && mockPdfLoaded)
        mockPdfPage = Math.max(1, mockPdfPage - 1);
      if (a === "next" && mockPdfLoaded)
        mockPdfPage = Math.min(MOCK_PDF_TOTAL, mockPdfPage + 1);
      if (a === "in" && mockPdfLoaded)
        mockPdfZoom = Math.min(1.6, Math.round((mockPdfZoom + 0.1) * 10) / 10);
      if (a === "out" && mockPdfLoaded)
        mockPdfZoom = Math.max(0.7, Math.round((mockPdfZoom - 0.1) * 10) / 10);
      renderMockPdf();
    });
  });
  document
    .getElementById("pdf-page-input")
    ?.addEventListener("change", function () {
      if (!mockPdfLoaded) {
        this.value = "1";
        return;
      }
      const n = parseInt(this.value, 10);
      if (n >= 1 && n <= MOCK_PDF_TOTAL) mockPdfPage = n;
      renderMockPdf();
    });
  renderMockPdf();
}

function wireMockVideo() {
  const status = () => document.getElementById("meet-status");
  const stage = document.getElementById("video-stage");
  document.querySelectorAll("[data-jitsi]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const a = btn.getAttribute("data-jitsi");
      if (a === "join-video") mockMeetMode = "video";
      if (a === "join-voice") mockMeetMode = "voice";
      if (a === "leave") mockMeetMode = "";
      const el = status();
      if (el) {
        if (mockMeetMode === "video") el.textContent = t("meet.mockVideo");
        else if (mockMeetMode === "voice") el.textContent = t("meet.mockVoice");
        else el.textContent = t("meet.mockIdle");
      }
      if (stage) stage.dataset.live = mockMeetMode ? "1" : "0";
    });
  });
}

/* ── Wire UI ─────────────────────────────────────── */

function wire() {
  try {
    applyFeatureDom();
    hydrateIcons();
    syncTooltips();
    bindSlidingToolOverflow();
  } catch (err) {
    console.warn("[POC] chrome init", err);
  }

  const appVer = document.getElementById("app-version");
  if (appVer) appVer.textContent = "v" + APP_VERSION;

  /* Color guide radios (settings) */
  document.querySelectorAll('input[name="color-guide"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (el instanceof HTMLInputElement && el.checked) {
        setColorGuide(/** @type {'full'|'soft'|'min'} */ (el.value));
      }
    });
  });
  syncColorGuideInputs();

  /* Language radios (settings) */
  document.querySelectorAll('input[name="ui-lang"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (el instanceof HTMLInputElement && el.checked) {
        setLang(el.value === "en" ? "en" : "pt");
      }
    });
  });
  syncLangInputs();

  /* Theme radios (settings) */
  document.querySelectorAll('input[name="ui-theme"]').forEach((el) => {
    el.addEventListener("change", () => {
      if (el instanceof HTMLInputElement && el.checked) {
        const v = el.value;
        setTheme(
          v === "light" || v === "dark" || v === "system" ? v : "system",
        );
      }
    });
  });
  syncThemeInputs();

  /* Single delegated click owner for chrome navigation */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;

    const cycleBtn = t.closest("[data-cycle]");
    if (cycleBtn) {
      e.preventDefault();
      const kind = cycleBtn.getAttribute("data-cycle");
      if (kind === "lang") cycleLang();
      return;
    }

    const goBtn = t.closest("[data-go]");
    if (goBtn) {
      e.preventDefault();
      closeAllDrawers();
      let dest = goBtn.getAttribute("data-go");
      if (dest === "home" || dest === "splash" || dest === "onboard") {
        dest = "library";
      }
      navigate(pathFor(dest === "reader" ? "reader" : "library"));
      return;
    }

    const openBtn = t.closest("[data-open]");
    if (openBtn) {
      e.preventDefault();
      openDrawer(openBtn.getAttribute("data-open"));
      return;
    }

    const closeBtn = t.closest("[data-close]");
    if (closeBtn) {
      e.preventDefault();
      const closeId = closeBtn.getAttribute("data-close");
      if (closeId === "onboard") {
        dismissOnboard({ persistIfChecked: true });
        return;
      }
      closeAllDrawers();
      return;
    }

    if (t.id === "scrim" || t.closest("#scrim")) {
      e.preventDefault();
      /* Study gate is blocking — only the CTA dismisses it */
      const orient = document.getElementById("orient");
      if (orient && orient.classList.contains("is-open")) return;
      /* Onboard: scrim = skip (persist only if checkbox already on) */
      if (isOnboardOpen()) {
        dismissOnboard({ persistIfChecked: true });
        return;
      }
      closeAllDrawers();
      return;
    }

    /* Click outside folded overlays → close + restore read tab color */
    const p1 = document.getElementById("p1");
    const p3 = document.getElementById("p3");
    const hitOverlay =
      (p1?.classList.contains("overlay") && !p1.contains(t)) ||
      (p3?.classList.contains("overlay") && !p3.contains(t));
    if (
      hitOverlay &&
      !t.closest("[data-fold]") &&
      !t.closest("#main-tabs") &&
      !t.closest("#bar")
    ) {
      closeFoldOverlays({ restoreRead: true });
    }
  });

  document.querySelectorAll("[data-mode]").forEach((btn) => {
    btn.addEventListener("click", () =>
      openMode(btn.getAttribute("data-mode")),
    );
  });

  document.querySelectorAll("[data-page]").forEach((btn) => {
    btn.addEventListener("click", () => {
      if (btn.getAttribute("data-page") === "prev") goToPage(pageIndex - 1);
      if (btn.getAttribute("data-page") === "next") goToPage(pageIndex + 1);
    });
  });

  document.getElementById("page-n")?.addEventListener("change", function () {
    const n = parseInt(this.value, 10);
    if (!(n >= 1)) return;
    if (isFolioPaged()) goToPage(folioIndexForNumber(n));
    else goToPage(n - 1);
  });

  function syncInputClear(inputId) {
    const input = document.getElementById(inputId);
    const btn = document.querySelector(
      '.input-clear[data-clear="' + inputId + '"]',
    );
    if (!input || !btn) return;
    btn.hidden = !String(input.value || "").length;
  }

  document.getElementById("toc-q")?.addEventListener("input", () => {
    syncInputClear("toc-q");
    renderToc();
  });
  const searchQ = document.getElementById("search-q");
  if (searchQ) {
    /* Search runs on Enter only (not on every keystroke) */
    searchQ.addEventListener("input", () => syncInputClear("search-q"));
    searchQ.addEventListener("keydown", (e) => {
      if (e.key === "Enter") {
        e.preventDefault();
        runSearch(searchQ.value);
      }
    });
  }
  document.querySelectorAll(".input-clear[data-clear]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      const id = btn.getAttribute("data-clear");
      const input = id ? document.getElementById(id) : null;
      if (!input) return;
      input.value = "";
      syncInputClear(id);
      if (id === "search-q") runSearch("");
      else if (id === "toc-q") renderToc();
      input.dispatchEvent(new Event("input", { bubbles: true }));
      input.focus();
    });
  });
  syncInputClear("toc-q");
  syncInputClear("search-q");

  if (FEAT.typo) {
    document.querySelectorAll("[data-typo]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const a = btn.getAttribute("data-typo");
        if (a === "size")
          fontSize = cycle(FONT_SIZES, nearest(FONT_SIZES, fontSize));
        if (a === "line")
          lineHeight = cycle(LINE_HEIGHTS, nearest(LINE_HEIGHTS, lineHeight));
        if (a === "measure") measure = cycle(MEASURES, measure);
        if (a === "align") textAlign = cycle(ALIGNS, textAlign);
        if (a === "font") fontFamily = cycle(FONTS, fontFamily);
        applyTypography();
      });
    });
    syncTypoButtons();
  }

  /* Páginas: in-book links on/off (default on; phone forced off) */
  document.getElementById("book-links")?.addEventListener("click", () => {
    toggleBookLinks();
  });
  try {
    localStorage.removeItem("librus-link-density");
    const stored = localStorage.getItem(BOOK_LINKS_KEY);
    if (stored === "0") bookLinksOn = false;
    else if (stored === "1") bookLinksOn = true;
  } catch (_) {
    /* ignore */
  }
  applyLinkFilters();

  if (FEAT.providers) {
    document.querySelectorAll("[data-provider]").forEach((btn) => {
      btn.addEventListener("click", () => {
        const key = btn.getAttribute("data-provider");
        if (key) openProvider(key);
      });
    });

    document.addEventListener("selectionchange", syncProviderArmed);
    syncProviderArmed();
    document.querySelectorAll('[data-ctx="back"]').forEach((btn) => {
      btn.addEventListener("click", () => ctxGoBack());
    });
    document.querySelectorAll('[data-ctx="reload"]').forEach((btn) => {
      btn.addEventListener("click", () => {
        if (lastCtxUrl) loadCtx(lastCtxUrl, { push: false });
      });
    });
    /* In-book links (incl. map / data-link-provider) → consult pane */
    document.addEventListener(
      "click",
      (e) => {
        const t = e.target;
        if (!(t instanceof Element)) return;
        const book = bookEl();
        if (!book) return;
        const a = t.closest("a[href]");
        if (!a || !book.contains(a)) return;
        const href = a.getAttribute("href") || "";
        if (!href || href.startsWith("#")) return;
        /* Internal page anchors in the book */
        if (href.startsWith("#") || (href.startsWith("/") && !href.startsWith("//"))) {
          return;
        }
        if (
          /^https?:\/\//i.test(href) ||
          a.hasAttribute("data-link-provider") ||
          a.hasAttribute("data-doutrina-link")
        ) {
          e.preventDefault();
          openBookLink(href, a instanceof HTMLAnchorElement ? a : null);
        }
      },
      true,
    );
    syncCtxBackBtn();
    try {
      hydrateIcons(document.querySelector('#p3 [data-tool="consult:web"]'));
    } catch (_) {
      /* ignore */
    }
  }

  window.addEventListener("resize", () => {
    syncViewportRatio();
    onFoldResize();
  });

  window.addEventListener("popstate", () => applyRoute());

  window.addEventListener("keydown", (e) => {
    if (e.key !== "Escape") return;
    closeFoldOverlays({ restoreRead: true });
    closeAllDrawers();
  });

  /* PDF / Video: real modules when flagged, otherwise interactive mocks */
  if (FEAT.pdf) {
    import("./features/pdf.js")
      .then((m) => m.wirePdfUi(openMode, t))
      .catch((e) => console.warn(e));
  } else {
    wireMockPdf();
  }
  const flavorJaas = getFlavor()?.features?.jaas === true;
  if (FEAT.jaas && flavorJaas) {
    import("./features/jaas.js")
      .then((m) => m.wireJaasUi(t, () => currentLang))
      .catch((e) => console.warn(e));
  } else if (flavorJaas) {
    wireMockVideo();
  }
}

const MODAL_IDS = ["help", "settings"];

function openDrawer(id) {
  /* Study gate / first-visit onboard own the scrim while open */
  const orient = document.getElementById("orient");
  if (orient && orient.classList.contains("is-open")) return;
  if (isOnboardOpen()) return;

  MODAL_IDS.forEach((other) => {
    if (other === id) return;
    const o = document.getElementById(other);
    if (o) {
      o.classList.remove("is-open", "is-closing");
      o.hidden = true;
    }
  });
  const el = document.getElementById(id);
  const scrim = document.getElementById("scrim");
  if (!el) return;
  el.hidden = false;
  el.classList.remove("is-closing");
  if (scrim) {
    scrim.hidden = false;
    scrim.classList.remove("is-closing");
  }
  hydrateIcons(el);
  if (id === "help") {
    try {
      finishHelpPaneIntro();
      resetHelpMap();
    } catch (_) {
      /* ignore */
    }
    /* Overlay is the dim; keep the bottom bar uncovered. */
    if (scrim) {
      scrim.classList.remove("is-open", "is-closing");
      scrim.hidden = true;
    }
  }
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-open");
      if (id !== "help" && scrim) scrim.classList.add("is-open");
    });
  });
}

function helpDismissed() {
  try {
    return localStorage.getItem(HELP_DISMISS_KEY) === "1";
  } catch (_) {
    return false;
  }
}

function persistHelpDismiss() {
  try {
    localStorage.setItem(HELP_DISMISS_KEY, "1");
  } catch (_) {
    /* ignore */
  }
}

function noteHelpClosing(el) {
  if (el?.id !== "help") return;
  const box = document.getElementById("help-dismiss");
  if (box?.checked) persistHelpDismiss();
}

function maybeOfferHelp() {
  /* First-run help is the Consulte 2×2, started from enterReader. */
}

function closeDrawerAnimated(el, onDone) {
  if (!el || el.hidden) {
    onDone?.();
    return;
  }
  noteHelpClosing(el);
  if (!el.classList.contains("is-open")) {
    el.classList.remove("is-closing");
    el.hidden = true;
    onDone?.();
    return;
  }
  let done = false;
  const end = () => {
    if (done) return;
    done = true;
    el.removeEventListener("transitionend", onEnd);
    el.classList.remove("is-open", "is-closing");
    el.hidden = true;
    onDone?.();
  };
  const onEnd = (ev) => {
    if (
      ev.target === el &&
      (ev.propertyName === "opacity" || ev.propertyName === "transform")
    )
      end();
  };
  el.classList.remove("is-open");
  el.classList.add("is-closing");
  el.addEventListener("transitionend", onEnd);
  setTimeout(end, 280);
}

function closeAllDrawers() {
  MODAL_IDS.forEach((id) => {
    const el = document.getElementById(id);
    if (el) closeDrawerAnimated(el);
  });
  const scrim = document.getElementById("scrim");
  if (scrim && !scrim.hidden) {
    let scrimDone = false;
    const scrimEnd = () => {
      if (scrimDone) return;
      scrimDone = true;
      scrim.removeEventListener("transitionend", onScrimEnd);
      scrim.classList.remove("is-closing");
      scrim.hidden = true;
    };
    const onScrimEnd = (ev) => {
      if (ev.target === scrim && ev.propertyName === "opacity") scrimEnd();
    };
    scrim.classList.remove("is-open");
    scrim.classList.add("is-closing");
    scrim.addEventListener("transitionend", onScrimEnd);
    setTimeout(scrimEnd, 280);
  }
}

/* ── Viewport tiers (fold + feature handicaps; no hard block) ─── */

/** @deprecated phone-tier alias — kept for onboard stubs */
function isStudyConstrained() {
  return vpTier() === "phone";
}

/** @deprecated always false — hard reduced gate removed */
function isStudyReduced() {
  return false;
}

/**
 * Hide/show consult tools and provider buttons by width tier.
 * Flavor allowlists still apply; size is a second axis.
 */
function applyViewportHandicaps() {
  const tier = vpTier();
  const flavor = typeof getFlavor === "function" ? getFlavor() : null;
  const allowed = flavor?.features?.providers;
  const jaasOn = FEAT.jaas === true && flavor?.features?.jaas === true;

  document.documentElement.dataset.vpTier = tier;
  document.body.dataset.vpTier = tier;
  /* Legacy dataset: "full" always — consult folds instead of vanishing */
  document.documentElement.dataset.study = "full";
  document.body.dataset.study = "full";

  const setSizeOff = (el, off) => {
    if (!(el instanceof HTMLElement)) return;
    if (off) {
      el.setAttribute("data-size-off", "1");
      el.hidden = true;
      el.classList.remove("on");
    } else {
      el.removeAttribute("data-size-off");
      if (el.matches("[data-mode], [data-tool]")) el.hidden = false;
    }
  };

  const pdfOk = toolAllowedBySize("consult:pdf", tier);
  document
    .querySelectorAll(
      '[data-mode="consult:pdf"], [data-tool="consult:pdf"], [data-panel="consult:pdf"]',
    )
    .forEach((el) => setSizeOff(el, !pdfOk));

  const videoOk = jaasOn && toolAllowedBySize("consult:video", tier);
  document
    .querySelectorAll(
      '[data-mode="consult:video"], [data-tool="consult:video"], [data-panel="consult:video"]',
    )
    .forEach((el) => setSizeOff(el, !videoOk));
  const helpJaas = document.getElementById("help-feat-jaas");
  if (helpJaas) helpJaas.hidden = !jaasOn;

  document.querySelectorAll("[data-provider]").forEach((btn) => {
    const key = btn.getAttribute("data-provider");
    if (!key) return;
    const flavorOk = !Array.isArray(allowed) || allowed.indexOf(key) !== -1;
    const sizeOk = providerAllowedBySize(key, tier);
    btn.hidden = !(flavorOk && sizeOk);
  });

  /* Phone: drop Consulte; other tiers fall back to web if a tool is size-off */
  if (tier === "phone") {
    const p3el = document.getElementById("p3");
    if (p3el) p3el.classList.remove("overlay", "overlay-single", "is-closing");
    if (String(focusMode || "").startsWith("consult:")) {
      const parts = String(lastReadMode || "read:book").split(":");
      try {
        setMode(parts[0] || "read", parts[1] || "book");
      } catch (_) {
        /* ignore */
      }
    }
  } else if (String(focusMode || "").startsWith("consult:")) {
    if (!toolAllowedBySize(focusMode, tier)) {
      try {
        setMode("consult", "web");
      } catch (_) {
        /* ignore */
      }
    }
  }

  const p3 = document.getElementById("p3");
  if (p3) p3.removeAttribute("aria-hidden");

  /* Phone forces inject links off; leaving phone restores the user toggle */
  try {
    applyLinkFilters();
  } catch (_) {
    /* ignore before boot */
  }

  try {
    handleTabFolding(true);
    syncMainStripActive();
    syncHelpPaneFeatures();
  } catch (_) {
    /* ignore */
  }

  /* Leaving phone → always show bottom bar again */
  if (tier !== "phone") setBarScrollHidden(false);

  /* Landscape phone: drop Consulte overlay so dual-column CSS can show it */
  if (!shouldFoldConsult()) {
    const p3 = document.getElementById("p3");
    if (p3) p3.classList.remove("overlay", "overlay-single", "is-closing");
  }
}

function openOrientGate(el) {
  if (!el) return;
  MODAL_IDS.forEach((id) => {
    const o = document.getElementById(id);
    if (o) {
      o.classList.remove("is-open", "is-closing");
      o.hidden = true;
    }
  });
  const scrim = document.getElementById("scrim");
  el.hidden = false;
  el.classList.remove("is-closing");
  if (scrim) {
    scrim.hidden = false;
    scrim.classList.remove("is-closing");
  }
  el.setAttribute("aria-hidden", "false");
  document.documentElement.classList.add("is-portrait-blocked");
  document.body.classList.add("is-portrait-blocked");
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      el.classList.add("is-open");
      if (scrim) scrim.classList.add("is-open");
    });
  });
}

function closeOrientGate(el) {
  const target = el || document.getElementById("orient");
  if (!target) return;
  const scrim = document.getElementById("scrim");
  target.classList.remove("is-open", "is-closing");
  target.hidden = true;
  target.setAttribute("aria-hidden", "true");
  document.documentElement.classList.remove("is-portrait-blocked");
  document.body.classList.remove("is-portrait-blocked");
  /* Only clear scrim when no other modal owns it */
  const otherOpen = MODAL_IDS.some((id) => {
    const o = document.getElementById(id);
    return o && o.classList.contains("is-open") && !o.hidden;
  });
  if (scrim && !otherOpen) {
    scrim.classList.remove("is-open", "is-closing");
    scrim.hidden = true;
  }
}

/** Fold + handicaps. Do not block phone landscape. Portrait Help is gated separately. */
function updateOrientLock() {
  applyViewportHandicaps();
  const el = document.getElementById("orient");
  if (el && (el.classList.contains("is-open") || !el.hidden)) closeOrientGate(el);
  try {
    syncHelpPortraitGate();
  } catch (_) {
    /* ignore */
  }
}

let orientResizeTimer = null;
function onOrientResize() {
  if (orientResizeTimer) clearTimeout(orientResizeTimer);
  orientResizeTimer = setTimeout(() => {
    orientResizeTimer = null;
    updateOrientLock();
  }, 120);
}

function initOrientLock() {
  updateOrientLock();

  window.addEventListener("resize", onOrientResize);
  window.addEventListener("orientationchange", () => {
    setTimeout(updateOrientLock, 50);
    setTimeout(updateOrientLock, 250);
  });
  try {
    const mq = window.matchMedia("(max-width: " + VP.FOLD_CONSULT + "px)");
    if (mq.addEventListener) mq.addEventListener("change", updateOrientLock);
    else if (mq.addListener) mq.addListener(updateOrientLock);
  } catch (_) {
    /* ignore */
  }
  requestAnimationFrame(updateOrientLock);
  setTimeout(updateOrientLock, 100);
}

/* ── Phone: hide bottom bar while scrolling down ─── */

let barScrollHidden = false;
let barScrollLastY = 0;

function setBarScrollHidden(hidden) {
  const on = !!hidden && vpTier() === "phone";
  if (on === barScrollHidden) {
    document.documentElement.classList.toggle("bar-scroll-hidden", on);
    return;
  }
  barScrollHidden = on;
  document.documentElement.classList.toggle("bar-scroll-hidden", on);
}

/**
 * Reading scroll lives on #book / [data-body] (and library main) — not on
 * #reader[data-screen], which is overflow:hidden.
 */
function isBarScrollSource(el) {
  if (!(el instanceof Element)) return false;
  if (el.id === "book") return true;
  if (el.matches?.("#library > main")) return true;
  if (el.hasAttribute("data-body") && el.closest("#reader")) return true;
  return false;
}

function initBarScrollHide() {
  document.addEventListener(
    "scroll",
    (ev) => {
      if (vpTier() !== "phone") {
        setBarScrollHidden(false);
        return;
      }
      const t = ev.target;
      if (!isBarScrollSource(t)) return;
      if (!(t instanceof Element)) return;
      const y = t.scrollTop || 0;
      const dy = y - barScrollLastY;
      barScrollLastY = y;
      if (y < 32) {
        setBarScrollHidden(false);
        return;
      }
      if (dy > 6) setBarScrollHidden(true);
      else if (dy < -6) setBarScrollHidden(false);
    },
    { capture: true, passive: true },
  );
  /* Reveal when opening chrome modals / tapping the bar */
  document.addEventListener("click", (e) => {
    const t = e.target;
    if (!(t instanceof Element)) return;
    if (t.closest("[data-open], #bar, [data-close]")) setBarScrollHidden(false);
  });
}

/* ── Boot ────────────────────────────────────────── */
/**
 * Single owner of app lifecycle. index.html is markup + theme FOUC only.
 * Order: flavor → theme → lang → wire chrome → catalog → route → service worker.
 */
async function boot() {
  try {
    await loadFlavor();
    console.info("[POC] flavor", getFlavorId());
  } catch (err) {
    console.warn("[POC] flavor", err);
  }

  try {
    /* Viewport tiers: fold + handicaps (no hard size gate) */
    initOrientLock();
    initBarScrollHide();
  } catch (err) {
    console.warn("[POC] orient", err);
  }

  try {
    bindOnboard({
      t,
      getLang: () => currentLang,
      applyI18n,
      isStudyConstrained,
      closeOrientGate,
      openOrientGate,
      updateOrientLock,
      modalIds: () => MODAL_IDS,
    });
    initOnboard();
  } catch (err) {
    console.warn("[POC] onboard", err);
  }

  try {
    bindHelp({ t });
    initHelp();
  } catch (err) {
    console.warn("[POC] help", err);
  }

  try {
    let pref = "system";
    try {
      pref = localStorage.getItem(THEME_KEY) || pref;
    } catch (_) {
      /* ignore */
    }
    if (pref !== "light" && pref !== "dark" && pref !== "system")
      pref = "system";
    setTheme(/** @type {'system'|'light'|'dark'} */ (pref), {
      persist: false,
      reloadHypo: false,
    });
    watchSystemTheme();
  } catch (err) {
    console.warn("[POC] theme", err);
  }

  try {
    preloadHypothesis();
  } catch (err) {
    console.warn("[POC] Hypothesis preload", err);
  }

  try {
    let g = "full";
    try {
      g = localStorage.getItem(GUIDE_KEY) || g;
    } catch (_) {
      /* ignore */
    }
    setColorGuide(/** @type {'full'|'soft'|'min'} */ (g), { persist: false });
  } catch (err) {
    console.warn("[POC] color guide", err);
  }

  try {
    const stored = (() => {
      try {
        return localStorage.getItem(LANG_KEY);
      } catch (_) {
        return null;
      }
    })();
    if (stored === "pt" || stored === "en") {
      setLang(stored, { persist: false });
    } else {
      applyI18n();
      try {
        applyFlavorBrand(getFlavor(), currentLang, currentTheme);
      } catch (_) {
        /* ignore */
      }
    }
  } catch (err) {
    console.warn("[POC] lang", err);
  }

  try {
    wire();
  } catch (err) {
    console.warn("[POC] wire", err);
  }

  try {
    applyFlavorBrand(getFlavor(), currentLang, currentTheme);
    hydrateIcons(document.getElementById("library"));
    applyViewportHandicaps();
  } catch (_) {
    /* ignore */
  }

  try {
    syncViewportRatio();
  } catch (_) {
    /* ignore */
  }

  try {
    await loadCatalog();
  } catch (err) {
    console.warn("[POC] catalog", err);
  }

  /* Library is home. Normalize bare / and old splash/onboard URLs. */
  const route = parsePath(location.pathname);
  if (route.view === "library" && location.pathname !== "/library") {
    try {
      history.replaceState({ path: "/library" }, "", "/library");
    } catch (_) {
      /* ignore */
    }
  }
  try {
    await applyRoute();
  } catch (err) {
    console.warn("[POC] route", err);
    setView("library");
  }
  syncChromeBar();
  try {
    const hypo = preloadHypothesis();
    await Promise.race([
      Promise.resolve(hypo),
      new Promise((resolve) => setTimeout(resolve, 3000)),
    ]);
  } catch (err) {
    console.warn("[POC] Hypothesis preload", err);
  }
  dismissBootSplash();

  try {
    registerSW({ immediate: true });
  } catch (_) {
    /* dev without SW */
  }
}

boot().catch((err) => console.error("[POC] boot failed", err));
