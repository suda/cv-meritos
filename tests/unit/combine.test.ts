import { describe, it, expect } from 'vitest';
import { combine, buildOrderedItems } from '../../src/lib/pdf/combine';
import { getPageCount, extractAllText } from '../helpers/readPdf';
import { makeFixturePdfBytes } from '../helpers/makeFixturePdf';
import type { MeritItem, Profile } from '../../src/lib/types';

// jsdom corrompe Blob binarios al leerlos con arrayBuffer(); usamos un blob
// respaldado por los bytes reales (en navegador real esto es un File nativo).
function blobFromBytes(bytes: Uint8Array): Blob {
  return {
    type: 'application/pdf',
    size: bytes.byteLength,
    arrayBuffer: async () =>
      bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength),
  } as unknown as Blob;
}

async function makeFixtureBlob(pages: number): Promise<Blob> {
  return blobFromBytes(await makeFixturePdfBytes(pages));
}

const profile: Profile = {
  nombreApellidos: 'García López, María',
  variantesAutor: [],
  dni: '00000000X',
  convocatoria: 'Temporales núm. 1 — Curso 2026-2027',
};

function articulo(id: string, titulo: string, anio: string, pageCount: number): MeritItem {
  return {
    id,
    typeCode: '3.2.a',
    values: {
      titulo,
      anio,
      autores: [
        { nombre: 'García López, M.', esSolicitante: true },
        { nombre: 'Otro Autor', esSolicitante: false },
      ],
    },
    fechaOrden: `${anio}-01-01`,
    fileId: `file-${id}`,
    fileName: `${id}.pdf`,
    pageCount,
    pageMode: 'auto',
    createdAt: `${anio}-01-01T00:00:00Z`,
    updatedAt: `${anio}-01-01T00:00:00Z`,
  };
}

describe('buildOrderedItems', () => {
  it('ordena por fecha ascendente dentro del mismo tipo', () => {
    const items = [articulo('a', 'Uno', '2022', 3), articulo('b', 'Cero', '2019', 1)];
    const ordered = buildOrderedItems(items, 'todas', 'asc');
    expect(ordered.map((o) => o.item.id)).toEqual(['b', 'a']);
    expect(ordered.map((o) => o.contribution)).toEqual([1, 3]);
  });

  it('aplica el modo primera_ultima a las contribuciones', () => {
    const items = [articulo('a', 'Uno', '2022', 3)];
    const ordered = buildOrderedItems(items, 'primera_ultima', 'asc');
    expect(ordered[0].contribution).toBe(2);
  });

  it('items sin PDF no aportan páginas', () => {
    const item = articulo('a', 'Uno', '2022', 3);
    item.fileId = undefined;
    const ordered = buildOrderedItems([item], 'todas', 'asc');
    expect(ordered[0].contribution).toBe(0);
  });
});

describe('combine (integración con PDFs reales)', () => {
  const files = new Map<string, Blob>();
  const getFile = async (id: string) => files.get(id);

  it('modo todas: total = índice + 3 + 1 y orden por fecha asc', async () => {
    files.set('file-a', await makeFixtureBlob(3));
    files.set('file-b', await makeFixtureBlob(1));
    const items = [
      articulo('a', 'Artículo Uno', '2022', 3),
      articulo('b', 'Artículo Cero', '2019', 1),
    ];

    const res = await combine(profile, items, { globalMode: 'todas', getFile });
    const bytes = res.bytes;
    const total = await getPageCount(bytes);

    expect(total).toBe(res.indexPages + 3 + 1);
    expect(res.totalPages).toBe(total);

    // El artículo de 2019 (Cero) va antes; su doc empieza justo tras el índice.
    expect(res.starts).toEqual([res.indexPages + 1, res.indexPages + 2]);

    const text = (await extractAllText(bytes)).replace(/\s+/g, ' ');
    expect(text).toContain('Artículo Cero');
    expect(text).toContain('Artículo Uno');
    expect(text.indexOf('Artículo Cero')).toBeLessThan(text.indexOf('Artículo Uno'));
    // El «Pág.» del índice apunta al inicio real de cada documentación.
    expect(text).toContain(`Pág. ${res.starts[0]}`);
    expect(text).toContain(`Pág. ${res.starts[1]}`);
    // La documentación adjunta está presente tras el índice.
    expect(text).toContain('FIXTURE PAGINA 1');
  });

  it('modo primera_ultima: el de 3 págs aporta 2, el de 1 aporta 1', async () => {
    files.set('file-a', await makeFixtureBlob(3));
    files.set('file-b', await makeFixtureBlob(1));
    const items = [
      articulo('a', 'Artículo Uno', '2022', 3),
      articulo('b', 'Artículo Cero', '2019', 1),
    ];

    const res = await combine(profile, items, { globalMode: 'primera_ultima', getFile });
    const total = await getPageCount(res.bytes);
    expect(total).toBe(res.indexPages + 2 + 1);
  });

  it('override por item: 3 págs en "todas" pese al global primera_ultima', async () => {
    files.set('file-a', await makeFixtureBlob(3));
    files.set('file-b', await makeFixtureBlob(1));
    const a = articulo('a', 'Artículo Uno', '2022', 3);
    a.pageMode = 'todas';
    const items = [a, articulo('b', 'Artículo Cero', '2019', 1)];

    const res = await combine(profile, items, { globalMode: 'primera_ultima', getFile });
    const total = await getPageCount(res.bytes);
    expect(total).toBe(res.indexPages + 3 + 1);
  });

  it('lanza error en español si falta el PDF de un item', async () => {
    const empty = new Map<string, Blob>();
    const items = [articulo('a', 'Artículo Uno', '2022', 3)];
    await expect(
      combine(profile, items, { globalMode: 'todas', getFile: async (id) => empty.get(id) }),
    ).rejects.toThrow(/No se encontró/);
  });

  it('lanza error en español si el PDF adjunto está dañado', async () => {
    const items = [articulo('a', 'Artículo Uno', '2022', 3)];
    const broken = blobFromBytes(new Uint8Array([1, 2, 3, 4, 5]));
    await expect(
      combine(profile, items, { globalMode: 'todas', getFile: async () => broken }),
    ).rejects.toThrow(/dañado o no es válido/);
  });

  it('itera el punto fijo cuando el índice ocupa varias páginas', async () => {
    // Muchos items sin PDF → el índice abarca más de una página, forzando
    // que el bucle de punto fijo actualice la estimación inicial.
    const many: MeritItem[] = Array.from({ length: 60 }, (_, i) =>
      articulo(`x${i}`, `Artículo número ${i} con un título largo de relleno`, '2020', 0),
    ).map((it) => ({ ...it, fileId: undefined }));
    const progress: string[] = [];
    const res = await combine(profile, many, {
      globalMode: 'todas',
      getFile: async () => undefined,
      onProgress: (m) => progress.push(m),
    });
    expect(res.indexPages).toBeGreaterThan(1);
    expect(res.totalPages).toBe(res.indexPages); // sin PDFs adjuntos
    expect(progress.length).toBeGreaterThan(0);
  });
});
