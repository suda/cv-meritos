/**
 * Cálculo de las páginas de inicio de la documentación de cada item dentro
 * del PDF combinado, mediante iteración de punto fijo.
 *
 * El índice (CV) ocupa P páginas, pero P depende de su propio contenido, que
 * incluye los números de página «Pág. N». Se itera hasta converger.
 */

export interface OffsetResult {
  /** Nº de páginas del índice (CV). */
  indexPages: number;
  /**
   * Página de inicio 1-based de la documentación de cada item.
   * `null` para items sin contribución (sin PDF o 0 páginas).
   */
  starts: (number | null)[];
  /** Páginas que aporta cada item al combinado. */
  contributions: number[];
  /** Total de páginas del combinado: indexPages + Σ contributions. */
  totalPages: number;
  /** Nº de iteraciones realizadas. */
  iterations: number;
}

/**
 * @param contributions  páginas que aporta cada item (0 si no tiene PDF)
 * @param countIndexPages  función que, dados los `starts` provisionales,
 *                         devuelve cuántas páginas ocupa el índice generado.
 * @param maxIterations  límite del bucle (por defecto 6; converge en 1-2).
 */
/**
 * Calcula las páginas de inicio (1-based) de cada item dadas las páginas que
 * ocupa el índice. Items sin contribución → null.
 */
export function computeStarts(contributions: number[], indexPages: number): (number | null)[] {
  const result: (number | null)[] = [];
  let acc = 0; // páginas de docs ya consumidas antes del item actual
  for (let i = 0; i < contributions.length; i++) {
    if (contributions[i] > 0) {
      // primera página de la documentación del item i (1-based)
      result.push(indexPages + acc + 1);
      acc += contributions[i];
    } else {
      result.push(null);
    }
  }
  return result;
}

export function computeOffsets(
  contributions: number[],
  countIndexPages: (starts: (number | null)[], indexPages: number) => number,
  maxIterations = 6,
): OffsetResult {
  let guess = 1;
  let starts: (number | null)[] = [];
  let iterations = 0;

  for (let it = 0; it < maxIterations; it++) {
    iterations = it + 1;
    starts = computeStarts(contributions, guess);
    const p = countIndexPages(starts, guess);
    if (p === guess) {
      break;
    }
    guess = p;
    starts = computeStarts(contributions, guess);
  }

  const indexPages = guess;
  const totalContrib = contributions.reduce((a, b) => a + b, 0);
  return {
    indexPages,
    starts,
    contributions,
    totalPages: indexPages + totalContrib,
    iterations,
  };
}
