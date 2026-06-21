import { PDFDocument } from 'pdf-lib';

/** Cuenta las páginas de un PDF dado como Blob/ArrayBuffer/Uint8Array. */
export async function countPdfPages(source: Blob | ArrayBuffer | Uint8Array): Promise<number> {
  let bytes: ArrayBuffer | Uint8Array;
  if (source instanceof Blob) {
    bytes = await source.arrayBuffer();
  } else {
    bytes = source;
  }
  const doc = await PDFDocument.load(bytes, { ignoreEncryption: true });
  return doc.getPageCount();
}
