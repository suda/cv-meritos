import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import * as db from '../../src/lib/db';
import type { MeritItem } from '../../src/lib/types';

function makeItem(id: string, over: Partial<MeritItem> = {}): MeritItem {
  return {
    id,
    typeCode: '1.1.b',
    values: { detalle: 'x', anio: 2020 },
    fechaOrden: '2020-01-01',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-01T00:00:00Z',
    ...over,
  };
}

beforeEach(async () => {
  // db.ts cachea la conexión a nivel de módulo; limpiamos los stores.
  await db.clearAll();
});

describe('db: perfil', () => {
  it('devuelve un perfil vacío con convocatoria por defecto', async () => {
    const p = await db.getProfile();
    expect(p.nombreApellidos).toBe('');
    expect(p.convocatoria).toContain('Temporales');
  });

  it('guarda y recupera el perfil (singleton)', async () => {
    await db.saveProfile({ nombreApellidos: 'Pérez, Ana', variantesAutor: ['A. Pérez'] });
    const p = await db.getProfile();
    expect(p.nombreApellidos).toBe('Pérez, Ana');
    expect(p.variantesAutor).toEqual(['A. Pérez']);
  });
});

describe('db: items y ficheros', () => {
  it('inserta, lista, obtiene y elimina items', async () => {
    await db.putItem(makeItem('a'));
    await db.putItem(makeItem('b'));
    expect((await db.listItems()).map((i) => i.id).sort()).toEqual(['a', 'b']);
    expect((await db.getItem('a'))?.id).toBe('a');
    await db.deleteItem('a');
    expect(await db.getItem('a')).toBeUndefined();
  });

  it('al eliminar un item se borra su fichero asociado', async () => {
    await db.putFile('f1', new Blob([new Uint8Array([1, 2, 3])]));
    await db.putItem(makeItem('a', { fileId: 'f1', fileName: 'x.pdf', pageCount: 1 }));
    expect(await db.getFile('f1')).toBeDefined();
    await db.deleteItem('a');
    expect(await db.getFile('f1')).toBeUndefined();
  });

  it('guarda, recupera y borra ficheros', async () => {
    await db.putFile('f2', new Blob([new Uint8Array([9])]));
    expect(await db.getFile('f2')).toBeDefined();
    await db.deleteFile('f2');
    expect(await db.getFile('f2')).toBeUndefined();
  });

  it('clearAll vacía todos los stores', async () => {
    await db.saveProfile({ nombreApellidos: 'X', variantesAutor: [] });
    await db.putItem(makeItem('a'));
    await db.putFile('f', new Blob([new Uint8Array([1])]));
    await db.clearAll();
    expect(await db.listItems()).toEqual([]);
    expect(await db.getFile('f')).toBeUndefined();
    expect((await db.getProfile()).nombreApellidos).toBe('');
  });
});
