import { describe, it, expect } from 'vitest';
import { computeOffsets, computeStarts } from '../../src/lib/pdf/computeOffsets';

describe('computeStarts', () => {
  it('asigna inicios 1-based saltando items sin contribución', () => {
    // índice = 2 págs; A aporta 3, B aporta 0 (sin PDF), C aporta 1
    const starts = computeStarts([3, 0, 1], 2);
    expect(starts).toEqual([3, null, 6]);
  });
});

describe('computeOffsets (punto fijo)', () => {
  it('índice fijo de 2 págs: A(3,todas) + B(1) ⇒ start[A]=3, start[B]=6, total=6', () => {
    const r = computeOffsets([3, 1], () => 2);
    expect(r.indexPages).toBe(2);
    expect(r.starts).toEqual([3, 6]);
    expect(r.totalPages).toBe(6);
  });

  it('caso primera_ultima: A aporta 2 ⇒ start[B]=5, total=5', () => {
    const r = computeOffsets([2, 1], () => 2);
    expect(r.starts).toEqual([3, 5]);
    expect(r.totalPages).toBe(5);
  });

  it('converge cuando el nº de páginas del índice depende de los inicios', () => {
    // Simulamos un buildIndex cuyo nº de páginas crece si algún "Pág. N" tiene
    // 2 cifras (start >= 10). Esto fuerza varias iteraciones.
    const contributions = [9, 5];
    const countIndexPages = (starts: (number | null)[]): number => {
      const anyTwoDigit = starts.some((s) => s !== null && s >= 10);
      return anyTwoDigit ? 2 : 1;
    };
    const r = computeOffsets(contributions, countIndexPages);
    // Con índice=1: start=[2,11] → hay 2 cifras → índice pasa a 2.
    // Con índice=2: start=[3,12] → sigue 2 cifras → estable en 2.
    expect(r.indexPages).toBe(2);
    expect(r.starts).toEqual([3, 12]);
    expect(r.totalPages).toBe(2 + 9 + 5);
    expect(r.iterations).toBeGreaterThanOrEqual(2);
  });

  it('items sin PDF no aportan páginas y quedan sin inicio', () => {
    const r = computeOffsets([0, 4, 0], () => 1);
    expect(r.starts).toEqual([null, 2, null]);
    expect(r.totalPages).toBe(5);
  });

  it('respeta el límite de iteraciones sin colgarse', () => {
    // Función patológica que nunca converge.
    let toggle = 1;
    const r = computeOffsets(
      [1],
      () => {
        toggle = toggle === 1 ? 2 : 1;
        return toggle;
      },
      6,
    );
    expect(r.iterations).toBeLessThanOrEqual(6);
  });
});
