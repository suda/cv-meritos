/**
 * OCR opcional, "best-effort". Carga tesseract.js y pdf.js bajo demanda
 * (dynamic import) para no penalizar el arranque.
 *
 * El OCR es orientativo y no fiable: nunca debe sobrescribir datos sin
 * confirmación del usuario.
 */

export interface OcrSuggestions {
  texto: string;
  titulo?: string;
  anio?: string;
}

/** Extrae heurísticamente título y año del texto OCR. Función pura. */
export function extractSuggestions(texto: string): OcrSuggestions {
  const lines = texto
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  // título: primera línea larga (>25) que no esté toda en mayúsculas.
  let titulo: string | undefined;
  for (const line of lines) {
    if (line.length > 25 && line !== line.toUpperCase()) {
      titulo = line;
      break;
    }
  }

  const yearMatch = texto.match(/\b(19|20)\d{2}\b/);
  const anio = yearMatch ? yearMatch[0] : undefined;

  return { texto, titulo, anio };
}

/**
 * Renderiza la página indicada de un PDF a un canvas y devuelve un dataURL.
 * Usa pdf.js bajo demanda.
 */
async function renderPdfPageToImage(blob: Blob, pageNumber: number): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  pdfjs.GlobalWorkerOptions.workerSrc = workerUrl;

  const data = new Uint8Array(await blob.arrayBuffer());
  const doc = await pdfjs.getDocument({ data }).promise;
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale: 2 });
  const canvas = document.createElement('canvas');
  canvas.width = viewport.width;
  canvas.height = viewport.height;
  const ctx = canvas.getContext('2d')!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  return canvas.toDataURL('image/png');
}

/**
 * Ejecuta OCR (spa+eng) sobre la primera página del PDF adjunto.
 * @param onProgress callback de progreso 0..1
 */
export async function ocrFirstPage(
  blob: Blob,
  onProgress?: (p: number) => void,
): Promise<OcrSuggestions> {
  const image = await renderPdfPageToImage(blob, 1);
  const { createWorker } = await import('tesseract.js');
  const base = import.meta.env.BASE_URL ?? '/';
  const worker = await createWorker('spa+eng', undefined, {
    workerPath: `${base}tesseract/worker.min.js`,
    corePath: `${base}tesseract/`,
    langPath: `${base}tesseract/`,
    logger: (m: { status: string; progress: number }) => {
      if (m.status === 'recognizing text') onProgress?.(m.progress);
    },
  }).catch(() => createWorker('spa+eng')); // fallback al CDN por defecto

  try {
    const { data } = await worker.recognize(image);
    return extractSuggestions(data.text);
  } finally {
    await worker.terminate();
  }
}
