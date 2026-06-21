import type { Profile } from './types';

/**
 * Normaliza un nombre: minúsculas, sin acentos/diacríticos, sin puntuación,
 * espacios colapsados.
 */
export function normalizeName(name: string): string {
  return name
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diacríticos
    .toLowerCase()
    .replace(/[.,;:()'"`´]/g, ' ')
    .replace(/[-_]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** Conjunto de "tokens" significativos (palabras de ≥1 carácter) de un nombre. */
function tokens(name: string): string[] {
  return normalizeName(name).split(' ').filter(Boolean);
}

/**
 * Comprueba si dos nombres normalizados representan a la misma persona,
 * tolerando el patrón «Apellido, N.» ↔ «N. Apellido» y abreviaturas con inicial.
 *
 * Estrategia: el nombre más corto debe quedar "cubierto" por el más largo,
 * token a token, permitiendo que una inicial (1 letra) case con cualquier
 * token que empiece por ella. Para evitar falsos positivos, exigimos que
 * coincidan TODOS los tokens del nombre candidato cuando éste no usa iniciales,
 * y al menos un apellido completo (token de ≥3 letras) en común.
 */
function namesMatch(a: string, b: string): boolean {
  const ta = tokens(a);
  const tb = tokens(b);
  if (ta.length === 0 || tb.length === 0) return false;

  // Apellidos "fuertes" (≥3 letras) presentes en ambos.
  const strongA = new Set(ta.filter((t) => t.length >= 3));
  const strongB = new Set(tb.filter((t) => t.length >= 3));
  const sharedStrong = [...strongA].filter((t) => strongB.has(t));
  if (sharedStrong.length === 0) return false;

  // Cada token del conjunto más pequeño debe poder emparejarse en el otro.
  const [small, large] = ta.length <= tb.length ? [ta, tb] : [tb, ta];
  const used = new Array(large.length).fill(false);
  for (const tok of small) {
    let matched = false;
    for (let i = 0; i < large.length; i++) {
      if (used[i]) continue;
      const other = large[i];
      const isInitial = tok.length === 1 || other.length === 1;
      if (tok === other || (isInitial && other[0] === tok[0])) {
        used[i] = true;
        matched = true;
        break;
      }
    }
    if (!matched) return false;
  }
  return true;
}

/**
 * ¿El nombre de autor corresponde al solicitante?
 * Compara contra `nombreApellidos` y todas las `variantesAutor`.
 * Función pura y testeable.
 */
export function isApplicant(authorName: string, profile: Profile): boolean {
  if (!authorName || !authorName.trim()) return false;
  const candidates = [profile.nombreApellidos, ...(profile.variantesAutor ?? [])].filter(
    (c) => c && c.trim(),
  );
  if (candidates.length === 0) return false;
  return candidates.some((c) => namesMatch(authorName, c));
}
