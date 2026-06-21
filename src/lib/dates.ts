import type { DateRange, ItemTypeDef, MeritItem } from './types';

/** Normaliza un valor de año a ISO YYYY-01-01. Devuelve '' si no es válido. */
function yearToIso(value: unknown): string {
  if (value === null || value === undefined || value === '') return '';
  const n = typeof value === 'number' ? value : parseInt(String(value).trim(), 10);
  if (!Number.isFinite(n) || n < 1 || n > 9999) return '';
  return `${String(n).padStart(4, '0')}-01-01`;
}

/** Normaliza una fecha a ISO YYYY-MM-DD. Acepta ya-ISO o un año suelto. */
function dateToIso(value: unknown): string {
  if (typeof value !== 'string') return '';
  const s = value.trim();
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}$/.test(s)) return `${s}-01-01`;
  if (/^\d{4}-\d{2}$/.test(s)) return `${s}-01`;
  return '';
}

function isDateRange(value: unknown): value is DateRange {
  return (
    typeof value === 'object' && value !== null && 'inicio' in (value as Record<string, unknown>)
  );
}

/**
 * Deriva una fecha ISO para ordenar a partir del campo `isPrimaryDate`.
 * Prioridad: campo primario → fecha manual → createdAt.
 */
export function toFechaOrden(item: MeritItem, typeDef: ItemTypeDef): string {
  const primary = typeDef.fields.find((f) => f.isPrimaryDate);
  if (primary) {
    const raw = item.values[primary.key];
    let iso = '';
    if (primary.type === 'year') iso = yearToIso(raw);
    else if (primary.type === 'date') iso = dateToIso(raw);
    else if (primary.type === 'daterange') {
      if (isDateRange(raw)) {
        iso = dateToIso(raw.inicio) || dateToIso(raw.fin ?? '');
      }
    }
    if (iso) return iso;
  }
  if (item.fechaOrdenManual) {
    const manual = dateToIso(item.fechaOrdenManual);
    if (manual) return manual;
  }
  return dateToIso(item.createdAt) || item.createdAt.slice(0, 10) || '0000-01-01';
}

/** Comparador estable por fechaOrden. dir: 'asc' | 'desc'. */
export function compareByFecha(a: MeritItem, b: MeritItem, dir: 'asc' | 'desc' = 'asc'): number {
  const fa = a.fechaOrden || '';
  const fb = b.fechaOrden || '';
  let cmp = fa < fb ? -1 : fa > fb ? 1 : 0;
  if (cmp === 0) {
    // Desempate estable por createdAt y luego por id.
    cmp =
      (a.createdAt || '') < (b.createdAt || '')
        ? -1
        : (a.createdAt || '') > (b.createdAt || '')
          ? 1
          : 0;
    if (cmp === 0) cmp = a.id < b.id ? -1 : a.id > b.id ? 1 : 0;
  }
  return dir === 'desc' ? -cmp : cmp;
}

/** Ordena (copia) una lista de items por fecha. */
export function sortByFecha(items: MeritItem[], dir: 'asc' | 'desc' = 'asc'): MeritItem[] {
  return [...items].sort((a, b) => compareByFecha(a, b, dir));
}
