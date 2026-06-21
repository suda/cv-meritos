import { describe, it, expect } from 'vitest';
import { collectSuggestions } from '../../src/lib/suggestions';
import type { MeritItem } from '../../src/lib/types';

function item(typeCode: string, values: Record<string, unknown>, id: string): MeritItem {
  return {
    id,
    typeCode,
    values,
    fechaOrden: '2020-01-01',
    createdAt: '2020-01-01T00:00:00Z',
    updatedAt: '2020-01-01T00:00:00Z',
  };
}

describe('collectSuggestions', () => {
  it('recolecta valores de campos suggest por clave de campo', () => {
    const items = [
      item('1.1.a', { universidad: 'Universitat de València', titulo: 'Grado en Física' }, '1'),
      item('1.2.a', { universidad: 'Universidad de Sevilla' }, '2'),
    ];
    const s = collectSuggestions(items);
    expect(s.universidad).toContain('Universitat de València');
    expect(s.universidad).toContain('Universidad de Sevilla');
    expect(s.titulo).toContain('Grado en Física');
  });

  it('deduplica con trim y colapso de espacios', () => {
    const items = [
      item('1.1.a', { universidad: '  Universitat   de València ' }, '1'),
      item('1.2.a', { universidad: 'Universitat de València' }, '2'),
    ];
    const s = collectSuggestions(items);
    expect(s.universidad).toEqual(['Universitat de València']);
  });

  it('ordena por frecuencia desc y luego alfabético', () => {
    const items = [
      item('1.2.a', { universidad: 'Sevilla' }, '1'),
      item('1.2.a', { universidad: 'València' }, '2'),
      item('1.2.a', { universidad: 'València' }, '3'),
      item('1.2.a', { universidad: 'Alicante' }, '4'),
    ];
    const s = collectSuggestions(items);
    expect(s.universidad).toEqual(['València', 'Alicante', 'Sevilla']);
  });

  it('conserva la forma más frecuente entre variantes de mayúsculas', () => {
    const items = [
      item('1.2.a', { universidad: 'uv' }, '1'),
      item('1.2.a', { universidad: 'UV' }, '2'),
      item('1.2.a', { universidad: 'UV' }, '3'),
    ];
    const s = collectSuggestions(items);
    expect(s.universidad).toEqual(['UV']);
  });

  it('ignora valores vacíos y campos no suggest', () => {
    const items = [item('1.1.a', { universidad: '   ', notaMedia: '9.5' }, '1')];
    const s = collectSuggestions(items);
    expect(s.universidad).toBeUndefined();
    expect(s.notaMedia).toBeUndefined(); // notaMedia no es suggest
  });
});
