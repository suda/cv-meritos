import { describe, it, expect } from 'vitest';
import { ITEM_TYPES, groupedItemTypes, canonicalIndex, getItemType } from '../../src/lib/schema';

const DATE_TYPES = new Set(['year', 'date', 'daterange']);

describe('schema: catálogo de tipos de mérito', () => {
  it('los códigos son únicos', () => {
    const codes = ITEM_TYPES.map((t) => t.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it('cada tipo tiene sección, archivo, etiqueta y al menos un campo', () => {
    for (const t of ITEM_TYPES) {
      expect(t.section).toMatch(/^[1-7]$/);
      expect(t.archive).toBeTruthy();
      expect(t.sectionTitle).toBeTruthy();
      expect(t.label.trim().length).toBeGreaterThan(0);
      expect(t.fields.length).toBeGreaterThan(0);
    }
  });

  it('cada FieldDef es válido (clave y etiqueta no vacías)', () => {
    for (const t of ITEM_TYPES) {
      for (const f of t.fields) {
        expect(f.key.trim().length).toBeGreaterThan(0);
        expect(f.label.trim().length).toBeGreaterThan(0);
      }
    }
  });

  it('cada tipo con campo de fecha tiene exactamente un isPrimaryDate', () => {
    for (const t of ITEM_TYPES) {
      const hasDateField = t.fields.some((f) => DATE_TYPES.has(f.type));
      const primaries = t.fields.filter((f) => f.isPrimaryDate);
      if (hasDateField) {
        expect(primaries.length, `tipo ${t.code}`).toBe(1);
        expect(DATE_TYPES.has(primaries[0].type)).toBe(true);
      } else {
        expect(primaries.length, `tipo ${t.code}`).toBe(0);
      }
    }
  });

  it('los campos select tienen opciones', () => {
    for (const t of ITEM_TYPES) {
      for (const f of t.fields) {
        if (f.type === 'select') {
          expect(f.options, `tipo ${t.code}, campo ${f.key}`).toBeDefined();
          expect(f.options!.length).toBeGreaterThan(0);
        }
      }
    }
  });

  it('cubre las 7 secciones del Anexo III', () => {
    const sections = new Set(ITEM_TYPES.map((t) => t.section));
    expect([...sections].sort()).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('incluye tipos clave del catálogo', () => {
    for (const code of ['1.1.a', '3.2.a', '3.2.b', '4.a', '6.a', '7.a']) {
      expect(getItemType(code), code).toBeDefined();
    }
  });

  it('groupedItemTypes respeta el orden canónico de secciones', () => {
    const grouped = groupedItemTypes();
    const sections = grouped.map((g) => g.section);
    expect(sections).toEqual(['1', '2', '3', '4', '5', '6', '7']);
  });

  it('canonicalIndex es creciente con el orden del catálogo', () => {
    expect(canonicalIndex('1.1.a')).toBe(0);
    expect(canonicalIndex('3.2.a')).toBeLessThan(canonicalIndex('3.2.b'));
    expect(canonicalIndex('no-existe')).toBe(-1);
  });
});
