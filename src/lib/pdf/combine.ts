import { PDFDocument } from 'pdf-lib';
import { ITEM_TYPES, getItemType } from '../schema';
import { sortByFecha } from '../dates';
import type { GlobalPageMode, MeritItem, Profile } from '../types';
import { selectPageIndices, effectiveMode } from './selectPages';
import { computeStarts } from './computeOffsets';
import { buildIndex, type IndexEntry } from './buildIndex';
import { countPdfPages } from './pageCount';

export interface OrderedItem {
  item: MeritItem;
  /** Páginas que aporta al combinado (0 si no tiene PDF). */
  contribution: number;
  /** Índices 0-based de página a copiar del PDF adjunto. */
  pageIndices: number[];
}

/**
 * Construye la lista de items en orden canónico (sección→subapartado→letra),
 * y dentro de cada tipo ordenados por fechaOrden.
 */
export function buildOrderedItems(
  items: MeritItem[],
  globalMode: GlobalPageMode,
  dir: 'asc' | 'desc' = 'asc',
): OrderedItem[] {
  const byType = new Map<string, MeritItem[]>();
  for (const it of items) {
    if (!byType.has(it.typeCode)) byType.set(it.typeCode, []);
    byType.get(it.typeCode)!.push(it);
  }

  const ordered: OrderedItem[] = [];
  for (const type of ITEM_TYPES) {
    const group = byType.get(type.code);
    if (!group) continue;
    for (const item of sortByFecha(group, dir)) {
      const hasPdf = !!item.fileId && (item.pageCount ?? 0) > 0;
      if (hasPdf) {
        const mode = effectiveMode(item.pageMode, globalMode);
        const pageIndices = selectPageIndices(item.pageCount!, mode);
        ordered.push({ item, contribution: pageIndices.length, pageIndices });
      } else {
        ordered.push({ item, contribution: 0, pageIndices: [] });
      }
    }
  }
  return ordered;
}

function toEntries(ordered: OrderedItem[], starts: (number | null)[]): IndexEntry[] {
  return ordered.map((o, i) => {
    const typeDef = getItemType(o.item.typeCode)!;
    return { item: o.item, typeDef, start: starts[i] };
  });
}

export interface CombineOptions {
  globalMode: GlobalPageMode;
  dir?: 'asc' | 'desc';
  /** Recupera el Blob PDF de un item por fileId. */
  getFile: (fileId: string) => Promise<Blob | undefined>;
  onProgress?: (msg: string) => void;
}

export interface CombineResult {
  blob: Blob;
  bytes: Uint8Array;
  indexPages: number;
  totalPages: number;
  starts: (number | null)[];
}

/**
 * Genera el PDF combinado: índice (Anexo III) + documentación adjunta en orden
 * canónico, aplicando el modo de páginas y resolviendo la numeración «Pág. N»
 * por punto fijo.
 */
export async function combine(
  profile: Profile,
  items: MeritItem[],
  options: CombineOptions,
): Promise<CombineResult> {
  const { globalMode, dir = 'asc', getFile, onProgress } = options;
  const ordered = buildOrderedItems(items, globalMode, dir);
  const contributions = ordered.map((o) => o.contribution);

  // Punto fijo asíncrono para el nº de páginas del índice.
  onProgress?.('Calculando índice…');
  let guess = 1;
  let starts = computeStarts(contributions, guess);
  let indexBytes = await buildIndex(profile, toEntries(ordered, starts));
  for (let it = 0; it < 6; it++) {
    const p = await countPdfPages(indexBytes);
    if (p === guess) break;
    guess = p;
    starts = computeStarts(contributions, guess);
    indexBytes = await buildIndex(profile, toEntries(ordered, starts));
  }
  const indexPages = await countPdfPages(indexBytes);

  // Merge con pdf-lib.
  onProgress?.('Combinando documentos…');
  const out = await PDFDocument.create();
  const indexDoc = await PDFDocument.load(indexBytes);
  const indexCopied = await out.copyPages(indexDoc, indexDoc.getPageIndices());
  indexCopied.forEach((p) => out.addPage(p));

  for (const o of ordered) {
    if (o.contribution === 0 || !o.item.fileId) continue;
    const blob = await getFile(o.item.fileId);
    if (!blob) {
      throw new Error(
        `No se encontró el PDF adjunto del mérito «${o.item.fileName ?? o.item.id}».`,
      );
    }
    let attached: PDFDocument;
    try {
      attached = await PDFDocument.load(await blob.arrayBuffer(), { ignoreEncryption: true });
    } catch {
      throw new Error(
        `El PDF adjunto «${o.item.fileName ?? o.item.id}» está dañado o no es válido.`,
      );
    }
    const valid = o.pageIndices.filter((i) => i >= 0 && i < attached.getPageCount());
    const copied = await out.copyPages(attached, valid);
    copied.forEach((p) => out.addPage(p));
  }

  onProgress?.('Finalizando…');
  const bytes = await out.save();
  const blob = new Blob([bytes as BlobPart], { type: 'application/pdf' });
  return { blob, bytes, indexPages, totalPages: out.getPageCount(), starts };
}
