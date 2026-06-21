import { PDFDocument, StandardFonts } from 'pdf-lib';

/**
 * Crea un PDF de `pages` páginas. Cada página lleva el texto
 * `FIXTURE PAGINA n` para poder verificarlo tras el merge.
 */
export async function makeFixturePdfBytes(pages: number): Promise<Uint8Array> {
  const doc = await PDFDocument.create();
  const font = await doc.embedFont(StandardFonts.Helvetica);
  for (let i = 1; i <= pages; i++) {
    const page = doc.addPage([400, 300]);
    page.drawText(`FIXTURE PAGINA ${i}`, { x: 40, y: 240, size: 18, font });
  }
  return doc.save();
}

export async function makeFixturePdfBlob(pages: number): Promise<Blob> {
  const bytes = await makeFixturePdfBytes(pages);
  return new Blob([bytes as BlobPart], { type: 'application/pdf' });
}
