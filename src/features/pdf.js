/**
 * PDF viewer (pdf.js CDN). Imported only when FEAT.pdf is true.
 */
const PDFJS_URL = "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.min.mjs";
const PDFJS_WORKER =
  "https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs";

let pdfjs = null;
let pdfDoc = null;
let pageNum = 1;
let scale = 1.1;
/** @type {{ cancel?: () => void, promise?: Promise<unknown> } | null} */
let renderTask = null;
/** @type {(key: string) => string} */
let t = (k) => k;

async function lib() {
  if (pdfjs) return pdfjs;
  pdfjs = await import(/* @vite-ignore */ PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc = PDFJS_WORKER;
  return pdfjs;
}

function canvasEl() {
  return document.getElementById("pdf-canvas");
}

function placeholderEl() {
  return document.getElementById("pdf-placeholder");
}

function statusEl() {
  return document.getElementById("pdf-status");
}

function setStatus(key) {
  const el = statusEl();
  if (el) el.textContent = key ? t(key) : t("pdf.uploadTitle");
}

function showPlaceholder() {
  const canvas = canvasEl();
  const ph = placeholderEl();
  if (canvas) canvas.hidden = true;
  if (ph) ph.hidden = false;
}

function showCanvas() {
  const canvas = canvasEl();
  const ph = placeholderEl();
  if (ph) ph.hidden = true;
  if (canvas) canvas.hidden = false;
}

export async function loadPdfFromFile(file) {
  const pdfjsLib = await lib();
  setStatus("pdf.loading");
  showPlaceholder();
  const buf = await file.arrayBuffer();
  const loading = pdfjsLib.getDocument({ data: buf });
  pdfDoc = await loading.promise;
  pageNum = 1;
  scale = 1.1;
  await draw();
  return pdfDoc.numPages;
}

export function unloadPdf() {
  if (renderTask) {
    try {
      renderTask.cancel();
    } catch (_) {
      /* ignore */
    }
    renderTask = null;
  }
  pdfDoc = null;
  pageNum = 1;
  scale = 1.1;
  const canvas = canvasEl();
  if (canvas) {
    canvas.hidden = true;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  setStatus("pdf.uploadTitle");
  showPlaceholder();
  syncChrome();
}

export async function goToPdfPage(n) {
  if (!pdfDoc) return;
  pageNum = Math.max(1, Math.min(pdfDoc.numPages, n));
  await draw();
}

export async function zoomPdf(delta) {
  if (!pdfDoc) return;
  const next = Math.round((scale + delta) * 100) / 100;
  if (next < 0.5 || next > 3) return;
  scale = next;
  await draw();
}

async function draw() {
  const canvas = canvasEl();
  if (!canvas || !pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  if (renderTask) {
    try {
      renderTask.cancel();
    } catch (_) {
      /* ignore */
    }
    renderTask = null;
  }
  const dpr = Math.min(2, window.devicePixelRatio || 1);
  const viewport = page.getViewport({ scale });
  canvas.width = Math.floor(viewport.width * dpr);
  canvas.height = Math.floor(viewport.height * dpr);
  canvas.style.width = Math.floor(viewport.width) + "px";
  canvas.style.height = Math.floor(viewport.height) + "px";
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  showCanvas();
  renderTask = page.render({ canvasContext: ctx, viewport });
  try {
    await renderTask.promise;
  } catch (err) {
    if (err && err.name === "RenderingCancelledException") return;
    throw err;
  } finally {
    renderTask = null;
  }
  syncChrome();
}

function syncChrome() {
  const input = document.getElementById("pdf-page-input");
  const total = document.getElementById("pdf-page-total");
  const n = pdfDoc ? pdfDoc.numPages : 0;
  if (input) {
    input.value = String(pdfDoc ? pageNum : 1);
    input.max = String(Math.max(1, n));
    input.disabled = !pdfDoc;
  }
  if (total) total.textContent = "/ " + n;
  const has = !!pdfDoc;
  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    const a = btn.getAttribute("data-pdf");
    if (a === "upload") return;
    btn.disabled = !has;
    if (a === "in") btn.disabled = !has || scale >= 3;
    if (a === "out") btn.disabled = !has || scale <= 0.5;
    if (a === "prev") btn.disabled = !has || pageNum <= 1;
    if (a === "next") btn.disabled = !has || pageNum >= n;
  });
}

function isPdfFile(file) {
  if (!file) return false;
  return (
    file.type === "application/pdf" || /\.pdf$/i.test(file.name || "")
  );
}

/**
 * @param {(mode: string) => void} openMode
 * @param {(key: string) => string} [translate]
 */
export function wirePdfUi(openMode, translate) {
  if (typeof translate === "function") t = translate;
  const fileInput = document.getElementById("pdf-file-input");
  const panel = document.getElementById("pdf-panel");
  unloadPdf();

  document.querySelectorAll("[data-pdf]").forEach((btn) => {
    btn.addEventListener("click", async () => {
      const a = btn.getAttribute("data-pdf");
      if (a === "upload") {
        fileInput?.click();
        return;
      }
      if (a === "unload") {
        unloadPdf();
        return;
      }
      if (!pdfDoc) return;
      try {
        if (a === "prev") await goToPdfPage(pageNum - 1);
        if (a === "next") await goToPdfPage(pageNum + 1);
        if (a === "in") await zoomPdf(0.25);
        if (a === "out") await zoomPdf(-0.25);
      } catch (err) {
        console.warn("[PDF]", err);
        setStatus("pdf.error");
        showPlaceholder();
      }
    });
  });

  async function openFile(file) {
    if (!isPdfFile(file)) {
      setStatus("pdf.error");
      return;
    }
    openMode("consult:pdf");
    try {
      await loadPdfFromFile(file);
    } catch (err) {
      console.warn("[PDF] load", err);
      unloadPdf();
      setStatus("pdf.error");
    }
  }

  fileInput?.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (file) await openFile(file);
    fileInput.value = "";
  });

  if (panel) {
    panel.addEventListener("dragover", (e) => {
      e.preventDefault();
      panel.classList.add("is-drop");
    });
    panel.addEventListener("dragleave", () => {
      panel.classList.remove("is-drop");
    });
    panel.addEventListener("drop", async (e) => {
      e.preventDefault();
      panel.classList.remove("is-drop");
      const file = [...(e.dataTransfer?.files || [])].find(isPdfFile);
      if (file) await openFile(file);
    });
  }

  const pageInput = document.getElementById("pdf-page-input");
  pageInput?.addEventListener("change", async () => {
    const n = parseInt(pageInput.value, 10);
    if (!pdfDoc) {
      pageInput.value = "1";
      return;
    }
    if (n >= 1 && n <= pdfDoc.numPages) await goToPdfPage(n);
    else pageInput.value = String(pageNum);
  });
}
