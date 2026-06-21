import { describe, it, expect } from 'vitest';
import { selectPageIndices, effectiveMode } from '../../src/lib/pdf/selectPages';

describe('selectPageIndices', () => {
  it('pageCount 0 → []', () => {
    expect(selectPageIndices(0, 'todas')).toEqual([]);
    expect(selectPageIndices(0, 'primera_ultima')).toEqual([]);
  });

  it('modo todas devuelve todos los índices', () => {
    expect(selectPageIndices(1, 'todas')).toEqual([0]);
    expect(selectPageIndices(3, 'todas')).toEqual([0, 1, 2]);
    expect(selectPageIndices(5, 'todas')).toEqual([0, 1, 2, 3, 4]);
  });

  it('1 o 2 páginas en primera_ultima → todas', () => {
    expect(selectPageIndices(1, 'primera_ultima')).toEqual([0]);
    expect(selectPageIndices(2, 'primera_ultima')).toEqual([0, 1]);
  });

  it('3+ páginas en primera_ultima → primera y última', () => {
    expect(selectPageIndices(3, 'primera_ultima')).toEqual([0, 2]);
    expect(selectPageIndices(5, 'primera_ultima')).toEqual([0, 4]);
  });

  it('negativos → []', () => {
    expect(selectPageIndices(-3, 'todas')).toEqual([]);
  });
});

describe('effectiveMode', () => {
  it('auto o indefinido usa el modo global', () => {
    expect(effectiveMode('auto', 'todas')).toBe('todas');
    expect(effectiveMode(undefined, 'primera_ultima')).toBe('primera_ultima');
  });
  it('override del item gana al global', () => {
    expect(effectiveMode('todas', 'primera_ultima')).toBe('todas');
    expect(effectiveMode('primera_ultima', 'todas')).toBe('primera_ultima');
  });
});
