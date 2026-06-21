import { describe, it, expect } from 'vitest';
import { isApplicant, normalizeName } from '../../src/lib/authors';
import type { Profile } from '../../src/lib/types';

function profile(nombre: string, variantes: string[] = []): Profile {
  return { nombreApellidos: nombre, variantesAutor: variantes };
}

describe('normalizeName', () => {
  it('quita acentos, baja a minúsculas y colapsa espacios', () => {
    expect(normalizeName('  García   López, María ')).toBe('garcia lopez maria');
    expect(normalizeName('MÜLLER-Pérez')).toBe('muller perez');
  });
});

describe('isApplicant', () => {
  const p = profile('García López, María', ['M. García López', 'García-López, M.']);

  it('coincide ignorando acentos y mayúsculas', () => {
    expect(isApplicant('GARCIA LOPEZ, MARIA', p)).toBe(true);
    expect(isApplicant('María García López', p)).toBe(true);
  });

  it('coincide con patrón «Apellido, N.» ↔ «N. Apellido»', () => {
    expect(isApplicant('García López, M.', p)).toBe(true);
    expect(isApplicant('M. García López', p)).toBe(true);
  });

  it('coincide con iniciales', () => {
    expect(isApplicant('M. García López', profile('María García López'))).toBe(true);
    expect(isApplicant('García López, M.', profile('María García López'))).toBe(true);
  });

  it('no produce falsos positivos con apellidos parecidos', () => {
    expect(isApplicant('García Pérez, Juan', p)).toBe(false);
    expect(isApplicant('López Sanz, Ana', p)).toBe(false);
    expect(isApplicant('Otro Autor', p)).toBe(false);
  });

  it('no produce falso positivo si sólo comparte el nombre de pila', () => {
    expect(isApplicant('María Fernández Ruiz', p)).toBe(false);
  });

  it('cadena vacía o sin perfil → false', () => {
    expect(isApplicant('', p)).toBe(false);
    expect(isApplicant('García López, María', profile(''))).toBe(false);
  });

  it('usa las variantes declaradas', () => {
    const p2 = profile('María García', ['Mgl', 'García-López, M.']);
    expect(isApplicant('García-López, M.', p2)).toBe(true);
  });
});
