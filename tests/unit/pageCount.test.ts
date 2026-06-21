import { describe, it, expect } from 'vitest';
import { countPdfPages } from '../../src/lib/pdf/pageCount';
import { makeFixturePdfBytes } from '../helpers/makeFixturePdf';

describe('countPdfPages', () => {
  it('cuenta páginas desde un Uint8Array', async () => {
    const bytes = await makeFixturePdfBytes(4);
    expect(await countPdfPages(bytes)).toBe(4);
  });

  it('cuenta páginas desde un ArrayBuffer', async () => {
    const bytes = await makeFixturePdfBytes(2);
    const ab = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength,
    ) as ArrayBuffer;
    expect(await countPdfPages(ab)).toBe(2);
  });

  it('cuenta páginas desde un Blob (rama instanceof Blob)', async () => {
    const bytes = await makeFixturePdfBytes(3);
    // Blob respaldado por bytes reales (jsdom corrompe arrayBuffer de Blob normales).
    const blob = {
      arrayBuffer: async () =>
        bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
    };
    Object.setPrototypeOf(blob, Blob.prototype);
    expect(await countPdfPages(blob as unknown as Blob)).toBe(3);
  });
});
