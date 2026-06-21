import { PDFDocument } from 'pdf-lib';

/** Cuenta páginas de un PDF (pdf-lib). */
export async function getPageCount(bytes: Uint8Array | ArrayBuffer): Promise<number> {
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}

/** Extrae el texto de cada página usando pdfjs-dist (Node, sin worker). */
export async function extractText(bytes: Uint8Array): Promise<string[]> {
  // Usamos el build legacy para Node y desactivamos el worker.
  const pdfjs: any = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const loadingTask = pdfjs.getDocument({
    data: bytes,
    useWorkerFetch: false,
    isEvalSupported: false,
    useSystemFonts: true,
    disableWorker: true,
  });
  const doc = await loadingTask.promise;
  const out: string[] = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    const text = content.items.map((it: any) => ('str' in it ? it.str : '')).join(' ');
    out.push(text);
  }
  return out;
}

/** Texto de todas las páginas concatenado. */
export async function extractAllText(bytes: Uint8Array): Promise<string> {
  return (await extractText(bytes)).join('\n');
}
