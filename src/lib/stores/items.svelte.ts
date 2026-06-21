import { getItemType } from '../schema';
import { toFechaOrden } from '../dates';
import * as db from '../db';
import type { GlobalPageMode, MeritItem } from '../types';

function uuid(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return 'id-' + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

class ItemsStore {
  items = $state<MeritItem[]>([]);
  globalMode = $state<GlobalPageMode>('todas');
  sortDir = $state<'asc' | 'desc'>('asc');
  loaded = $state(false);

  async load() {
    this.items = await db.listItems();
    this.loaded = true;
  }

  /** Recalcula fechaOrden a partir del schema antes de persistir. */
  private withDerived(item: MeritItem): MeritItem {
    const type = getItemType(item.typeCode);
    const fechaOrden = type ? toFechaOrden(item, type) : item.fechaOrden;
    return { ...item, fechaOrden, updatedAt: new Date().toISOString() };
  }

  newItem(typeCode: string): MeritItem {
    const now = new Date().toISOString();
    return {
      id: uuid(),
      typeCode,
      values: {},
      fechaOrden: now.slice(0, 10),
      pageMode: 'auto',
      createdAt: now,
      updatedAt: now,
    };
  }

  async save(item: MeritItem) {
    const derived = this.withDerived(item);
    await db.putItem(derived);
    const idx = this.items.findIndex((i) => i.id === derived.id);
    if (idx >= 0) this.items[idx] = derived;
    else this.items.push(derived);
  }

  async remove(id: string) {
    await db.deleteItem(id);
    this.items = this.items.filter((i) => i.id !== id);
  }

  async duplicate(id: string): Promise<MeritItem | undefined> {
    const src = this.items.find((i) => i.id === id);
    if (!src) return undefined;
    const now = new Date().toISOString();
    const copy: MeritItem = {
      ...structuredClone($state.snapshot(src)),
      id: uuid(),
      fileId: undefined,
      fileName: undefined,
      pageCount: undefined,
      createdAt: now,
      updatedAt: now,
    };
    await this.save(copy);
    return copy;
  }

  async attachFile(id: string, blob: Blob, fileName: string, pageCount: number) {
    const item = this.items.find((i) => i.id === id);
    if (!item) return;
    const fileId = uuid();
    if (item.fileId) await db.deleteFile(item.fileId);
    await db.putFile(fileId, blob);
    await this.save({ ...$state.snapshot(item), fileId, fileName, pageCount });
  }

  async detachFile(id: string) {
    const item = this.items.find((i) => i.id === id);
    if (!item || !item.fileId) return;
    await db.deleteFile(item.fileId);
    await this.save({
      ...$state.snapshot(item),
      fileId: undefined,
      fileName: undefined,
      pageCount: undefined,
    });
  }

  byType(typeCode: string): MeritItem[] {
    return this.items.filter((i) => i.typeCode === typeCode);
  }
}

export const itemsStore = new ItemsStore();
