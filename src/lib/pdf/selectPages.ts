/**
 * Dada la cantidad de páginas y el modo efectivo, devuelve la lista de
 * índices de página (0-based) a incluir en el PDF combinado.
 *
 * Regla: con modo 'primera_ultima', si el PDF tiene 1 o 2 páginas se
 * incluyen todas; con 3 o más, solo la primera y la última.
 */
export function selectPageIndices(pageCount: number, mode: 'todas' | 'primera_ultima'): number[] {
  if (pageCount <= 0) return [];
  if (mode === 'todas') return Array.from({ length: pageCount }, (_, i) => i);
  if (pageCount <= 2) return Array.from({ length: pageCount }, (_, i) => i); // 1 o 2 págs: todas
  return [0, pageCount - 1]; // primera y última
}

/** Resuelve el modo efectivo de un item combinando su override con el global. */
export function effectiveMode(
  itemMode: 'todas' | 'primera_ultima' | 'auto' | undefined,
  globalMode: 'todas' | 'primera_ultima',
): 'todas' | 'primera_ultima' {
  if (!itemMode || itemMode === 'auto') return globalMode;
  return itemMode;
}
