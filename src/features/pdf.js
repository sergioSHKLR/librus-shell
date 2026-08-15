/**
 * Optional PDF viewer (pdf.js CDN). Only imported when FEAT.pdf is true.
 */
const PDFJS_URL = 'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.min.mjs';

let pdfjs = null;
let pdfDoc = null;
let pageNum = 1;
let scale = 1.1;

async function lib() {
  if (pdfjs) return pdfjs;
  pdfjs = await import(/* @vite-ignore */ PDFJS_URL);
  pdfjs.GlobalWorkerOptions.workerSrc =
    'https://unpkg.com/pdfjs-dist@4.4.168/build/pdf.worker.min.mjs';
  return pdfjs;
}

export async function loadPdfFromFile(file) {
  const pdfjsLib = await lib();
  const buf = await file.arrayBuffer();
  pdfDoc = await pdfjsLib.getDocument({ data: buf }).promise;
  pageNum = 1;
  await draw();
  return pdfDoc.numPages;
}

export function unloadPdf() {
  pdfDoc = null;
  pageNum = 1;
  const canvas = document.getElementById('pdf-canvas');
  const ph = document.getElementById('pdf-placeholder');
  if (canvas) {
    canvas.hidden = true;
    const ctx = canvas.getContext('2d');
    if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
  }
  if (ph) ph.hidden = false;
  syncChrome();
}

export async function goToPdfPage(n) {
  if (!pdfDoc) return;
  pageNum = Math.max(1, Math.min(pdfDoc.numPages, n));
  await draw();
}

export async function zoomPdf(delta) {
  scale = Math.max(0.5, Math.min(2.5, scale + delta));
  await draw();
}

async function draw() {
  const canvas = document.getElementById('pdf-canvas');
  const ph = document.getElementById('pdf-placeholder');
  if (!canvas || !pdfDoc) return;
  const page = await pdfDoc.getPage(pageNum);
  const viewport = page.getViewport({ scale });
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  canvas.hidden = false;
  if (ph) ph.hidden = true;
  await page.render({ canvasContext: canvas.getContext('2d'), viewport }).promise;
  syncChrome();
}

function syncChrome() {
  const input = document.getElementById('pdf-page-input');
  const total = document.getElementById('pdf-page-total');
  if (input) input.value = String(pageNum);
  if (total) total.textContent = '/ ' + (pdfDoc ? pdfDoc.numPages : 1);
}

export function wirePdfUi(openMode) {
  const fileInput = document.getElementById('pdf-file-input');
  document.querySelectorAll('[data-pdf]').forEach((btn) => {
    btn.addEventListener('click', async () => {
      const a = btn.getAttribute('data-pdf');
      if (a === 'upload') {
        fileInput?.click();
        return;
      }
      if (a === 'unload') {
        unloadPdf();
        return;
      }
      if (a === 'prev') await goToPdfPage(pageNum - 1);
      if (a === 'next') await goToPdfPage(pageNum + 1);
      if (a === 'in') await zoomPdf(0.15);
      if (a === 'out') await zoomPdf(-0.15);
    });
  });
  fileInput?.addEventListener('change', async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    openMode('consult:pdf');
    try {
      await loadPdfFromFile(file);
    } finally {
      fileInput.value = '';
    }
  });
  const pageInput = document.getElementById('pdf-page-input');
  pageInput?.addEventListener('change', async () => {
    const n = parseInt(pageInput.value, 10);
    if (!pdfDoc) return;
    if (n >= 1 && n <= pdfDoc.numPages) await goToPdfPage(n);
    else pageInput.value = String(pageNum);
  });
}
