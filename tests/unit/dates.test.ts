import { describe, it, expect } from 'vitest';
import { toFechaOrden, compareByFecha, sortByFecha } from '../../src/lib/dates';
import type { ItemTypeDef, MeritItem } from '../../src/lib/types';

function makeItem(values: Record<string, unknown>, over: Partial<MeritItem> = {}): MeritItem {
  return {
    id: over.id ?? 'x',
    typeCode: 't',
    values,
    fechaOrden: '',
    createdAt: '2020-05-05T10:00:00.000Z',
    updatedAt: '2020-05-05T10:00:00.000Z',
    ...over,
  };
}

const typeYear: ItemTypeDef = {
  code: 't',
  section: '1',
  sectionTitle: 's',
  archive: 'a',
  label: 'l',
  fields: [{ key: 'anio', label: 'Año', type: 'year', isPrimaryDate: true }],
};
const typeDate: ItemTypeDef = {
  ...typeYear,
  fields: [{ key: 'fecha', label: 'Fecha', type: 'date', isPrimaryDate: true }],
};
const typeRange: ItemTypeDef = {
  ...typeYear,
  fields: [{ key: 'fechas', label: 'Fechas', type: 'daterange', isPrimaryDate: true }],
};
const typeNoDate: ItemTypeDef = {
  ...typeYear,
  fields: [{ key: 'detalle', label: 'Detalle', type: 'text' }],
};

describe('toFechaOrden', () => {
  it('year → YYYY-01-01', () => {
    expect(toFechaOrden(makeItem({ anio: 2021 }), typeYear)).toBe('2021-01-01');
    expect(toFechaOrden(makeItem({ anio: '1999' }), typeYear)).toBe('1999-01-01');
  });

  it('date → tal cual', () => {
    expect(toFechaOrden(makeItem({ fecha: '2022-03-15' }), typeDate)).toBe('2022-03-15');
  });

  it('daterange usa inicio, o fin si no hay inicio', () => {
    expect(
      toFechaOrden(makeItem({ fechas: { inicio: '2018-09-01', fin: '2020-06-30' } }), typeRange),
    ).toBe('2018-09-01');
    expect(toFechaOrden(makeItem({ fechas: { inicio: '', fin: '2020-06-30' } }), typeRange)).toBe(
      '2020-06-30',
    );
  });

  it('sin valor usa fecha manual y, si no, createdAt', () => {
    expect(toFechaOrden(makeItem({}, { fechaOrdenManual: '2015-01-01' }), typeNoDate)).toBe(
      '2015-01-01',
    );
    expect(toFechaOrden(makeItem({}), typeNoDate)).toBe('2020-05-05');
  });

  it('year inválido cae a la fecha manual/createdAt', () => {
    expect(toFechaOrden(makeItem({ anio: 'abc' }), typeYear)).toBe('2020-05-05');
  });

  it('date acepta año suelto y YYYY-MM', () => {
    expect(toFechaOrden(makeItem({ fecha: '2020' }), typeDate)).toBe('2020-01-01');
    expect(toFechaOrden(makeItem({ fecha: '2020-07' }), typeDate)).toBe('2020-07-01');
    expect(toFechaOrden(makeItem({ fecha: 'no-fecha' }), typeDate)).toBe('2020-05-05');
  });

  it('daterange con objeto inválido o sin valores cae a createdAt', () => {
    expect(toFechaOrden(makeItem({ fechas: null }), typeRange)).toBe('2020-05-05');
    expect(toFechaOrden(makeItem({ fechas: { inicio: '', fin: '' } }), typeRange)).toBe(
      '2020-05-05',
    );
  });

  it('fecha manual inválida se ignora y usa createdAt', () => {
    expect(toFechaOrden(makeItem({}, { fechaOrdenManual: 'xxx' }), typeNoDate)).toBe('2020-05-05');
  });

  it('createdAt no-ISO usa los primeros 10 caracteres o un fallback', () => {
    expect(toFechaOrden(makeItem({}, { createdAt: '' }), typeNoDate)).toBe('0000-01-01');
  });

  it('year fuera de rango se descarta', () => {
    expect(toFechaOrden(makeItem({ anio: 0 }), typeYear)).toBe('2020-05-05');
    expect(toFechaOrden(makeItem({ anio: 12345 }), typeYear)).toBe('2020-05-05');
  });
});

describe('compareByFecha / sortByFecha', () => {
  const a = makeItem({ anio: 2019 }, { id: 'a', fechaOrden: '2019-01-01' });
  const b = makeItem({ anio: 2022 }, { id: 'b', fechaOrden: '2022-01-01' });
  const c = makeItem({ anio: 2022 }, { id: 'c', fechaOrden: '2022-01-01' });

  it('orden ascendente', () => {
    expect(sortByFecha([b, a], 'asc').map((i) => i.id)).toEqual(['a', 'b']);
  });
  it('orden descendente', () => {
    expect(sortByFecha([a, b], 'desc').map((i) => i.id)).toEqual(['b', 'a']);
  });
  it('es estable ante empates (desempata por createdAt/id)', () => {
    expect(sortByFecha([c, b], 'asc').map((i) => i.id)).toEqual(['b', 'c']);
    expect(compareByFecha(b, c, 'asc')).toBeLessThan(0);
  });

  it('desempata por createdAt cuando difiere', () => {
    const x = makeItem(
      {},
      { id: 'x', fechaOrden: '2020-01-01', createdAt: '2020-01-02T00:00:00Z' },
    );
    const y = makeItem(
      {},
      { id: 'y', fechaOrden: '2020-01-01', createdAt: '2020-01-01T00:00:00Z' },
    );
    expect(compareByFecha(x, y, 'asc')).toBeGreaterThan(0);
    expect(compareByFecha(y, x, 'asc')).toBeLessThan(0);
  });

  it('tolera fechaOrden vacía sin romper el orden', () => {
    const x = makeItem({}, { id: 'x', fechaOrden: '' });
    const y = makeItem({}, { id: 'y', fechaOrden: '' });
    expect(compareByFecha(x, y, 'asc')).toBeLessThan(0); // desempata por id
  });
});

describe('toFechaOrden: ramas adicionales', () => {
  const typeDate2: ItemTypeDef = {
    code: 't',
    section: '1',
    sectionTitle: 's',
    archive: 'a',
    label: 'l',
    fields: [{ key: 'fecha', label: 'Fecha', type: 'date', isPrimaryDate: true }],
  };
  const typeRange2: ItemTypeDef = {
    ...typeDate2,
    fields: [{ key: 'fechas', label: 'Fechas', type: 'daterange', isPrimaryDate: true }],
  };

  it('date con valor numérico (no string) se descarta', () => {
    expect(toFechaOrden(makeItem({ fecha: 2020 }), typeDate2)).toBe('2020-05-05');
  });

  it('daterange con sólo inicio vacío y sin fin cae a createdAt', () => {
    expect(toFechaOrden(makeItem({ fechas: { inicio: '' } }), typeRange2)).toBe('2020-05-05');
  });
});
