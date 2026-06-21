import { openDB, type DBSchema, type IDBPDatabase } from 'idb';
import type { MeritItem, Profile } from './types';

interface CvMeritosDB extends DBSchema {
  profile: {
    key: string;
    value: Profile & { id: string };
  };
  items: {
    key: string;
    value: MeritItem;
    indexes: { byType: string; byFecha: string };
  };
  files: {
    key: string;
    value: { fileId: string; blob: Blob };
  };
}

const DB_NAME = 'cv-meritos';
const DB_VERSION = 1;
const PROFILE_KEY = 'singleton';

let dbPromise: Promise<IDBPDatabase<CvMeritosDB>> | null = null;

function getDb(): Promise<IDBPDatabase<CvMeritosDB>> {
  if (!dbPromise) {
    dbPromise = openDB<CvMeritosDB>(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('profile')) {
          db.createObjectStore('profile', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('items')) {
          const store = db.createObjectStore('items', { keyPath: 'id' });
          store.createIndex('byType', 'typeCode');
          store.createIndex('byFecha', 'fechaOrden');
        }
        if (!db.objectStoreNames.contains('files')) {
          db.createObjectStore('files', { keyPath: 'fileId' });
        }
      },
    });
  }
  return dbPromise;
}

export const emptyProfile = (): Profile => ({
  nombreApellidos: '',
  variantesAutor: [],
  convocatoria: 'Temporales núm. 1 — Curso 2026-2027',
});

export async function getProfile(): Promise<Profile> {
  const db = await getDb();
  const rec = await db.get('profile', PROFILE_KEY);
  if (!rec) return emptyProfile();
  const { id: _id, ...profile } = rec;
  void _id;
  return profile;
}

export async function saveProfile(profile: Profile): Promise<void> {
  const db = await getDb();
  await db.put('profile', { ...profile, id: PROFILE_KEY });
}

export async function listItems(): Promise<MeritItem[]> {
  const db = await getDb();
  return db.getAll('items');
}

export async function getItem(id: string): Promise<MeritItem | undefined> {
  const db = await getDb();
  return db.get('items', id);
}

export async function putItem(item: MeritItem): Promise<void> {
  const db = await getDb();
  await db.put('items', item);
}

export async function deleteItem(id: string): Promise<void> {
  const db = await getDb();
  const item = await db.get('items', id);
  await db.delete('items', id);
  if (item?.fileId) {
    await db.delete('files', item.fileId);
  }
}

export async function putFile(fileId: string, blob: Blob): Promise<void> {
  const db = await getDb();
  await db.put('files', { fileId, blob });
}

export async function getFile(fileId: string): Promise<Blob | undefined> {
  const db = await getDb();
  const rec = await db.get('files', fileId);
  return rec?.blob;
}

export async function deleteFile(fileId: string): Promise<void> {
  const db = await getDb();
  await db.delete('files', fileId);
}

/** Borra todos los datos (usado por importación con reemplazo). */
export async function clearAll(): Promise<void> {
  const db = await getDb();
  await Promise.all([db.clear('profile'), db.clear('items'), db.clear('files')]);
}
