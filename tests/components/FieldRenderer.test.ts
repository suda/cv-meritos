import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/svelte';
import FieldRenderer from '../../src/components/FieldRenderer.svelte';
import type { FieldDef, Profile } from '../../src/lib/types';

const profile: Profile = { nombreApellidos: 'García López, María', variantesAutor: [] };

describe('FieldRenderer', () => {
  it('text → input de texto con su etiqueta', () => {
    const field: FieldDef = { key: 'titulo', label: 'Título', type: 'text' };
    render(FieldRenderer, { props: { field, value: 'Hola', profile } });
    const input = screen.getByLabelText('Título') as HTMLInputElement;
    expect(input.tagName).toBe('INPUT');
    expect(input.value).toBe('Hola');
  });

  it('textarea → control multilínea', () => {
    const field: FieldDef = { key: 'detalle', label: 'Detalle', type: 'textarea' };
    render(FieldRenderer, { props: { field, value: '', profile } });
    expect(screen.getByLabelText('Detalle').tagName).toBe('TEXTAREA');
  });

  it('select → opciones del schema', () => {
    const field: FieldDef = {
      key: 'ambito',
      label: 'Ámbito',
      type: 'select',
      options: ['Nacional', 'Internacional'],
    };
    render(FieldRenderer, { props: { field, value: '', profile } });
    const select = screen.getByLabelText('Ámbito') as HTMLSelectElement;
    expect(select.tagName).toBe('SELECT');
    expect([...select.options].map((o) => o.value)).toContain('Internacional');
  });

  it('daterange → dos campos de fecha (inicio y fin)', () => {
    const field: FieldDef = { key: 'fechas', label: 'Fechas', type: 'daterange' };
    render(FieldRenderer, { props: { field, value: { inicio: '2020-01-01' }, profile } });
    expect(screen.getByLabelText('Fechas — inicio')).toBeInTheDocument();
    expect(screen.getByLabelText('Fechas — fin')).toBeInTheDocument();
  });

  it('year → input numérico', () => {
    const field: FieldDef = { key: 'anio', label: 'Año', type: 'year' };
    render(FieldRenderer, { props: { field, value: 2021, profile } });
    const input = screen.getByLabelText('Año') as HTMLInputElement;
    expect(input.getAttribute('type')).toBe('number');
  });

  it('authorList → permite añadir autor con casilla «Soy yo»', () => {
    const field: FieldDef = { key: 'autores', label: 'Autores', type: 'authorList' };
    render(FieldRenderer, {
      props: { field, value: [{ nombre: 'García López, M.', esSolicitante: true }], profile },
    });
    const checkbox = screen.getByLabelText('Marcar autor 1 como solicitante') as HTMLInputElement;
    expect(checkbox.checked).toBe(true);
  });

  it('campo requerido inválido muestra mensaje de error', () => {
    const field: FieldDef = { key: 'titulo', label: 'Título', type: 'text', required: true };
    render(FieldRenderer, { props: { field, value: '', profile, invalid: true } });
    expect(screen.getByText('Este campo es obligatorio.')).toBeInTheDocument();
  });
});
