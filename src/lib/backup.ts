import JSZip from 'jszip';
import { SCHEMA_VERSION } from './schema';
import { clearAll, getFile, listItems, getProfile, putFile, putItem, saveProfile } from './db';
import type { BackupData, MeritItem, Profile } from './types';

export interface ParsedBackup {
  data: BackupData;
  files: Map<string, Blob>;
}

function pad(n: number): string {
  return String(n).padStart(2, '0');
}

export function backupFileName(date = new Date()): string {
  return `cv-meritos-backup-${date.getFullYear()}${pad(date.getMonth() + 1)}${pad(date.getDate())}.zip`;
}

/**
 * Crea un ZIP con data.json (profile + items) y files/<fileId>.pdf.
 * `getFileBlob` recupera el Blob de cada fichero adjunto.
 */
export async function createBackupZip(
  profile: Profile,
  items: MeritItem[],
  getFileBlob: (fileId: string) => Promise<Blob | undefined>,
): Promise<Blob> {
  const zip = new JSZip();
  const data: BackupData = { schemaVersion: SCHEMA_VERSION, profile, items };
  zip.file('data.json', JSON.stringify(data, null, 2));

  const filesDir = zip.folder('files')!;
  const seen = new Set<string>();
  for (const item of items) {
    if (item.fileId && !seen.has(item.fileId)) {
      seen.add(item.fileId);
      const blob = await getFileBlob(item.fileId);
      if (blob) filesDir.file(`${item.fileId}.pdf`, blob);
    }
  }
  return zip.generateAsync({ type: 'blob' });
}

/** Lee y valida un ZIP de copia. Lanza error si el esquema no es reconocible. */
export async function readBackupZip(
  source: Blob | ArrayBuffer | Uint8Array,
): Promise<ParsedBackup> {
  const zip = await JSZip.loadAsync(source);
  const dataFile = zip.file('data.json');
  if (!dataFile) {
    throw new Error('La copia no contiene data.json. ¿Es un archivo válido?');
  }
  const raw = await dataFile.async('string');
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error('data.json no es un JSON válido.');
  }
  const data = parsed as BackupData;
  if (
    typeof data !== 'object' ||
    data === null ||
    typeof data.schemaVersion !== 'number' ||
    !Array.isArray(data.items) ||
    typeof data.profile !== 'object'
  ) {
    throw new Error('La copia no tiene el formato esperado.');
  }
  if (data.schemaVersion > SCHEMA_VERSION) {
    throw new Error(
      `La copia es de una versión más reciente (v${data.schemaVersion}). Actualiza la aplicación.`,
    );
  }

  const files = new Map<string, Blob>();
  const folder = zip.folder('files');
  if (folder) {
    const entries: { fileId: string; file: JSZip.JSZipObject }[] = [];
    folder.forEach((relPath, file) => {
      if (file.dir) return;
      const fileId = relPath.replace(/\.pdf$/i, '');
      entries.push({ fileId, file });
    });
    for (const { fileId, file } of entries) {
      const bytes = await file.async('uint8array');
      files.set(fileId, new Blob([bytes as BlobPart], { type: 'application/pdf' }));
    }
  }
  return { data, files };
}

/**
 * Aplica una copia importada a IndexedDB.
 * mode 'replace' borra todo antes; 'merge' conserva lo existente.
 */
export async function applyBackup(parsed: ParsedBackup, mode: 'replace' | 'merge'): Promise<void> {
  if (mode === 'replace') {
    await clearAll();
    await saveProfile(parsed.data.profile);
  } else {
    // En fusión, conservar el perfil actual si ya tiene nombre.
    const current = await getProfile();
    if (!current.nombreApellidos && parsed.data.profile.nombreApellidos) {
      await saveProfile(parsed.data.profile);
    }
  }

  const existing =
    mode === 'merge' ? new Set((await listItems()).map((i) => i.id)) : new Set<string>();
  for (const item of parsed.data.items) {
    if (mode === 'merge' && existing.has(item.id)) continue;
    await putItem(item);
  }
  for (const [fileId, blob] of parsed.files) {
    if (mode === 'merge' && (await getFile(fileId))) continue;
    await putFile(fileId, blob);
  }
}
