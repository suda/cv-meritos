import { getItemType } from './schema';
import type { MeritItem } from './types';

/** Normaliza para deduplicar: trim + colapso de espacios internos. */
function normKey(s: string): string {
  return s.trim().replace(/\s+/g, ' ').toLowerCase();
}

function cleanForm(s: string): string {
  return s.trim().replace(/\s+/g, ' ');
}

/**
 * Recolecta los valores usados en campos `suggest` a lo largo de todos los
 * items. Devuelve, por clave de campo, la lista de valores deduplicados,
 * conservando la forma más frecuente y ordenando por frecuencia desc y luego
 * alfabéticamente. Función pura y testeable.
 */
export function collectSuggestions(items: MeritItem[]): Record<string, string[]> {
  // fieldKey -> normKey -> { count, forms: Map<form,count> }
  const acc = new Map<string, Map<string, { count: number; forms: Map<string, number> }>>();

  for (const item of items) {
    const type = getItemType(item.typeCode);
    if (!type) continue;
    for (const field of type.fields) {
      if (!field.suggest) continue;
      const raw = item.values[field.key];
      if (typeof raw !== 'string') continue;
      const form = cleanForm(raw);
      if (!form) continue;
      const key = normKey(raw);
      if (!acc.has(field.key)) acc.set(field.key, new Map());
      const byNorm = acc.get(field.key)!;
      if (!byNorm.has(key)) byNorm.set(key, { count: 0, forms: new Map() });
      const entry = byNorm.get(key)!;
      entry.count += 1;
      entry.forms.set(form, (entry.forms.get(form) ?? 0) + 1);
    }
  }

  const out: Record<string, string[]> = {};
  for (const [fieldKey, byNorm] of acc) {
    const list = [...byNorm.values()].map((entry) => {
      // Forma más frecuente (desempate alfabético).
      let best = '';
      let bestCount = -1;
      for (const [form, c] of entry.forms) {
        if (c > bestCount || (c === bestCount && form < best)) {
          best = form;
          bestCount = c;
        }
      }
      return { value: best, count: entry.count };
    });
    list.sort((a, b) => b.count - a.count || a.value.localeCompare(b.value, 'es'));
    out[fieldKey] = list.map((l) => l.value);
  }
  return out;
}
