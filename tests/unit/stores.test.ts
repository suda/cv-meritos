import { describe, it, expect, beforeEach, vi } from 'vitest';
import 'fake-indexeddb/auto';
import * as db from '../../src/lib/db';
import { itemsStore } from '../../src/lib/stores/items.svelte';
import { profileStore } from '../../src/lib/stores/profile.svelte';
import { createBackupZip, readBackupZip, applyBackup } from '../../src/lib/backup';

beforeEach(async () => {
  await db.clearAll();
  itemsStore.items = [];
  itemsStore.loaded = false;
  itemsStore.globalMode = 'todas';
  itemsStore.sortDir = 'asc';
});

describe('itemsStore', () => {
  it('crea, guarda y deriva fechaOrden desde el schema', async () => {
    const item = itemsStore.newItem('1.1.b');
    item.values = { detalle: 'Premio', anio: 2018 };
    await itemsStore.save(item);
    expect(itemsStore.items).toHaveLength(1);
    expect(itemsStore.items[0].fechaOrden).toBe('2018-01-01');
  });

  it('load recupera los items persistidos', async () => {
    const item = itemsStore.newItem('1.1.b');
    item.values = { anio: 2019 };
    await itemsStore.save(item);
    itemsStore.items = [];
    await itemsStore.load();
    expect(itemsStore.items).toHaveLength(1);
    expect(itemsStore.loaded).toBe(true);
  });

  it('duplica un item vaciando el fichero y con nuevo id', async () => {
    const item = itemsStore.newItem('3.2.a');
    item.values = { titulo: 'Original', anio: 2020 };
    item.fileId = 'f1';
    item.fileName = 'a.pdf';
    item.pageCount = 3;
    await itemsStore.save(item);
    const copy = await itemsStore.duplicate(item.id);
    expect(copy).toBeDefined();
    expect(copy!.id).not.toBe(item.id);
    expect(copy!.fileId).toBeUndefined();
    expect(copy!.values.titulo).toBe('Original');
    expect(itemsStore.items).toHaveLength(2);
  });

  it('attachFile y detachFile actualizan páginas y fichero', async () => {
    const item = itemsStore.newItem('3.2.a');
    await itemsStore.save(item);
    await itemsStore.attachFile(item.id, new Blob([new Uint8Array([1])]), 'doc.pdf', 4);
    const withFile = itemsStore.items.find((i) => i.id === item.id)!;
    expect(withFile.fileName).toBe('doc.pdf');
    expect(withFile.pageCount).toBe(4);
    expect(await db.getFile(withFile.fileId!)).toBeDefined();

    await itemsStore.detachFile(item.id);
    const without = itemsStore.items.find((i) => i.id === item.id)!;
    expect(without.fileId).toBeUndefined();
  });

  it('remove elimina el item', async () => {
    const item = itemsStore.newItem('1.1.b');
    await itemsStore.save(item);
    await itemsStore.remove(item.id);
    expect(itemsStore.items).toHaveLength(0);
  });

  it('byType filtra por código de tipo', async () => {
    const a = itemsStore.newItem('1.1.b');
    const b = itemsStore.newItem('3.2.a');
    await itemsStore.save(a);
    await itemsStore.save(b);
    expect(itemsStore.byType('1.1.b')).toHaveLength(1);
  });
});

describe('profileStore', () => {
  it('isReady refleja el nombre y persiste con saveNow', async () => {
    await profileStore.load();
    profileStore.profile.nombreApellidos = '';
    expect(profileStore.isReady).toBe(false);
    profileStore.profile.nombreApellidos = 'Ruiz, Eva';
    expect(profileStore.isReady).toBe(true);
    await profileStore.saveNow();
    expect((await db.getProfile()).nombreApellidos).toBe('Ruiz, Eva');
  });

  it('scheduleSave persiste tras el debounce', async () => {
    vi.useFakeTimers();
    profileStore.profile.nombreApellidos = 'Lara, Tomás';
    profileStore.scheduleSave();
    await vi.advanceTimersByTimeAsync(350);
    vi.useRealTimers();
    expect((await db.getProfile()).nombreApellidos).toBe('Lara, Tomás');
  });
});

describe('applyBackup (con IndexedDB)', () => {
  it('reemplaza todos los datos al importar', async () => {
    const item = itemsStore.newItem('1.1.b');
    item.values = { anio: 2020 };
    await itemsStore.save(item);

    const zip = await createBackupZip(
      { nombreApellidos: 'Nuevo, Autor', variantesAutor: [] },
      [
        {
          id: 'imported',
          typeCode: '1.1.b',
          values: { anio: 2001 },
          fechaOrden: '2001-01-01',
          createdAt: '2001-01-01T00:00:00Z',
          updatedAt: '2001-01-01T00:00:00Z',
        },
      ],
      async () => undefined,
    );
    const parsed = await readBackupZip(zip);
    await applyBackup(parsed, 'replace');

    const items = await db.listItems();
    expect(items.map((i) => i.id)).toEqual(['imported']);
    expect((await db.getProfile()).nombreApellidos).toBe('Nuevo, Autor');
  });

  it('fusiona conservando los items existentes', async () => {
    const item = itemsStore.newItem('1.1.b');
    await itemsStore.save(item);
    const existingId = item.id;

    const zip = await createBackupZip(
      { nombreApellidos: '', variantesAutor: [] },
      [
        {
          id: 'merged',
          typeCode: '1.1.b',
          values: {},
          fechaOrden: '2001-01-01',
          createdAt: '2001-01-01T00:00:00Z',
          updatedAt: '2001-01-01T00:00:00Z',
        },
      ],
      async () => undefined,
    );
    const parsed = await readBackupZip(zip);
    await applyBackup(parsed, 'merge');

    const ids = (await db.listItems()).map((i) => i.id).sort();
    expect(ids).toContain(existingId);
    expect(ids).toContain('merged');
  });
});
