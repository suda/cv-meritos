import { describe, it, expect } from 'vitest';
import {
  buildIndexDocDefinition,
  authorRuns,
  formatFieldValue,
  type IndexEntry,
} from '../../src/lib/pdf/buildIndex';
import { getItemType } from '../../src/lib/schema';
import type { Author, FieldDef, Profile } from '../../src/lib/types';

const profile: Profile = {
  nombreApellidos: 'García López, María',
  variantesAutor: [],
  dni: '12345678Z',
  convocatoria: 'Temporales núm. 1 — Curso 2026-2027',
};

function entry(start: number | null, values: Record<string, unknown>): IndexEntry {
  const typeDef = getItemType('3.2.a')!;
  return {
    typeDef,
    start,
    item: {
      id: 'i1',
      typeCode: '3.2.a',
      values,
      fechaOrden: '2021-01-01',
      createdAt: '2021-01-01T00:00:00Z',
      updatedAt: '2021-01-01T00:00:00Z',
    },
  };
}

// Recorre recursivamente el árbol pdfmake buscando nodos que cumplan un test.
function findNodes(node: any, pred: (n: any) => boolean, acc: any[] = []): any[] {
  if (Array.isArray(node)) {
    for (const n of node) findNodes(n, pred, acc);
  } else if (node && typeof node === 'object') {
    if (pred(node)) acc.push(node);
    for (const key of Object.keys(node)) findNodes(node[key], pred, acc);
  }
  return acc;
}

describe('formatFieldValue', () => {
  const fields: Record<string, FieldDef> = {
    year: { key: 'anio', label: 'Año', type: 'year' },
    range: { key: 'fechas', label: 'Fechas', type: 'daterange' },
    select: { key: 'clave', label: 'Clave', type: 'select', options: ['R - revista indexada'] },
    text: { key: 'titulo', label: 'Título', type: 'text' },
  };

  it('year → año', () => {
    expect(formatFieldValue(fields.year, 2021)).toBe('2021');
    expect(formatFieldValue(fields.year, '')).toBe('');
  });
  it('daterange → «inicio – fin»', () => {
    expect(formatFieldValue(fields.range, { inicio: '2018-09-01', fin: '2020-06-30' })).toBe(
      '2018-09-01 – 2020-06-30',
    );
    expect(formatFieldValue(fields.range, { inicio: '2018-09-01' })).toBe('2018-09-01');
  });
  it('select → valor', () => {
    expect(formatFieldValue(fields.select, 'R - revista indexada')).toBe('R - revista indexada');
  });
  it('null/undefined → cadena vacía', () => {
    expect(formatFieldValue(fields.text, null)).toBe('');
    expect(formatFieldValue(fields.text, undefined)).toBe('');
  });

  it('authorList → autores separados por «; »', () => {
    const f: FieldDef = { key: 'autores', label: 'Autores', type: 'authorList' };
    expect(
      formatFieldValue(f, [
        { nombre: 'A', esSolicitante: false },
        { nombre: 'B', esSolicitante: true },
      ]),
    ).toBe('A; B');
    expect(formatFieldValue(f, 'no-array')).toBe('');
  });

  it('daterange con objeto inválido → cadena vacía', () => {
    expect(formatFieldValue(fields.range, 'no-objeto')).toBe('');
  });
});

describe('authorRuns (subrayado del solicitante)', () => {
  it('subraya sólo a los autores marcados como solicitante', () => {
    const authors: Author[] = [
      { nombre: 'García López, M.', esSolicitante: true },
      { nombre: 'Otro Autor', esSolicitante: false },
    ];
    const runs = authorRuns(authors);
    const subrayados = runs.filter((r) => r.decoration === 'underline');
    expect(subrayados).toHaveLength(1);
    expect(subrayados[0].text).toBe('García López, M.');
    // El no solicitante no lleva subrayado.
    const otro = runs.find((r) => r.text === 'Otro Autor');
    expect(otro?.decoration).toBeUndefined();
  });
});

describe('buildIndexDocDefinition', () => {
  it('incluye la cabecera con los datos del solicitante', () => {
    const doc = buildIndexDocDefinition(profile, []);
    const json = JSON.stringify(doc);
    expect(json).toContain('García López, María');
    expect(json).toContain('12345678Z');
    expect(json).toContain('Anexo III');
  });

  it('renderiza el «Pág. N» de cada item', () => {
    const doc = buildIndexDocDefinition(profile, [entry(5, { titulo: 'Mi artículo', anio: 2021 })]);
    const labels = findNodes(
      doc.content,
      (n) => typeof n.text === 'string' && n.text.startsWith('Pág.'),
    );
    expect(labels.some((n) => n.text === 'Pág. 5')).toBe(true);
  });

  it('items sin PDF muestran «—» como página', () => {
    const doc = buildIndexDocDefinition(profile, [entry(null, { titulo: 'Sin PDF', anio: 2021 })]);
    const dash = findNodes(doc.content, (n) => n.text === '—');
    expect(dash.length).toBeGreaterThan(0);
  });

  it('un item sin datos muestra «(Sin datos)»', () => {
    const doc = buildIndexDocDefinition(profile, [entry(1, {})]);
    const sinDatos = findNodes(doc.content, (n) => n.text === '(Sin datos)');
    expect(sinDatos.length).toBeGreaterThan(0);
  });

  it('acepta la opción omitirLetrasVacias sin romper', () => {
    const doc = buildIndexDocDefinition(profile, [entry(2, { titulo: 'X', anio: 2020 })], {
      omitirLetrasVacias: true,
    });
    expect(doc.content.length).toBeGreaterThan(0);
  });

  it('el árbol contiene el autor solicitante subrayado (hook de test)', () => {
    const doc = buildIndexDocDefinition(profile, [
      entry(2, {
        titulo: 'Artículo',
        anio: 2021,
        autores: [
          { nombre: 'García López, M.', esSolicitante: true },
          { nombre: 'Otro', esSolicitante: false },
        ],
      }),
    ]);
    const underlined = findNodes(
      doc.content,
      (n) => n.decoration === 'underline' && n.text === 'García López, M.',
    );
    expect(underlined).toHaveLength(1);
  });
});
