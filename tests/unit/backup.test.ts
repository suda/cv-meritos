import { describe, it, expect } from 'vitest';
import { createBackupZip, readBackupZip, backupFileName } from '../../src/lib/backup';
import type { MeritItem, Profile } from '../../src/lib/types';

const profile: Profile = {
  nombreApellidos: 'García López, María',
  variantesAutor: ['M. García López'],
  convocatoria: 'Temporales núm. 1 — Curso 2026-2027',
};

const items: MeritItem[] = [
  {
    id: 'a',
    typeCode: '3.2.a',
    values: {
      titulo: 'Artículo Uno',
      autores: [{ nombre: 'García López, M.', esSolicitante: true }],
    },
    fechaOrden: '2022-01-01',
    fileId: 'f1',
    fileName: 'art1.pdf',
    pageCount: 3,
    createdAt: '2022-01-01T00:00:00Z',
    updatedAt: '2022-01-01T00:00:00Z',
  },
  {
    id: 'b',
    typeCode: '1.1.a',
    values: { notaMedia: '9.1', titulo: 'Grado', universidad: 'UV' },
    fechaOrden: '2019-01-01',
    createdAt: '2019-01-01T00:00:00Z',
    updatedAt: '2019-01-01T00:00:00Z',
  },
];

describe('backup round-trip', () => {
  it('exporta e importa reconstruyendo profile, items y ficheros', async () => {
    const fileBytes = new Uint8Array([1, 2, 3, 4]);
    const getFileBlob = async (id: string) =>
      id === 'f1' ? new Blob([fileBytes], { type: 'application/pdf' }) : undefined;

    const zip = await createBackupZip(profile, items, getFileBlob);
    const parsed = await readBackupZip(zip);

    expect(parsed.data.schemaVersion).toBe(1);
    expect(parsed.data.profile).toEqual(profile);
    expect(parsed.data.items).toEqual(items);
    expect(parsed.files.has('f1')).toBe(true);
    // El contenido del fichero se conserva (4 bytes).
    expect(parsed.files.get('f1')!.size).toBe(4);
  });

  it('lanza error si falta data.json', async () => {
    const JSZip = (await import('jszip')).default;
    const empty = await new JSZip().generateAsync({ type: 'blob' });
    await expect(readBackupZip(empty)).rejects.toThrow(/data\.json/);
  });

  it('rechaza un esquema de versión futura', async () => {
    const JSZip = (await import('jszip')).default;
    const zip = new JSZip();
    zip.file('data.json', JSON.stringify({ schemaVersion: 999, profile, items: [] }));
    const blob = await zip.generateAsync({ type: 'blob' });
    await expect(readBackupZip(blob)).rejects.toThrow(/más reciente/);
  });

  it('backupFileName usa el formato con fecha', () => {
    const name = backupFileName(new Date('2026-06-21T10:00:00Z'));
    expect(name).toBe('cv-meritos-backup-20260621.zip');
  });
});
