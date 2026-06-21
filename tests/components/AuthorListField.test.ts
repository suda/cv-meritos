import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/svelte';
import AuthorListField from '../../src/components/AuthorListField.svelte';
import type { Author, Profile } from '../../src/lib/types';

const profile: Profile = {
  nombreApellidos: 'García López, María',
  variantesAutor: ['M. García López'],
};

describe('AuthorListField', () => {
  it('autodetecta al solicitante al añadir un autor coincidente', async () => {
    const updates: Author[][] = [];
    render(AuthorListField, {
      props: { value: [], profile, onUpdate: (a: Author[]) => updates.push(a) },
    });
    const input = screen.getByLabelText('Nuevo autor');
    await fireEvent.input(input, { target: { value: 'García López, M.' } });
    await fireEvent.click(screen.getByText('Añadir autor'));

    expect(updates.at(-1)).toEqual([{ nombre: 'García López, M.', esSolicitante: true }]);
  });

  it('no marca como solicitante a un autor distinto', async () => {
    const updates: Author[][] = [];
    render(AuthorListField, {
      props: { value: [], profile, onUpdate: (a: Author[]) => updates.push(a) },
    });
    await fireEvent.input(screen.getByLabelText('Nuevo autor'), {
      target: { value: 'Pérez Ruiz, Juan' },
    });
    await fireEvent.click(screen.getByText('Añadir autor'));
    expect(updates.at(-1)).toEqual([{ nombre: 'Pérez Ruiz, Juan', esSolicitante: false }]);
  });

  it('marcar «Soy yo» emite la actualización con esSolicitante', async () => {
    const onUpdate = vi.fn();
    render(AuthorListField, {
      props: { value: [{ nombre: 'Otro', esSolicitante: false }], profile, onUpdate },
    });
    await fireEvent.click(screen.getByLabelText('Marcar autor 1 como solicitante'));
    expect(onUpdate).toHaveBeenCalledWith([{ nombre: 'Otro', esSolicitante: true }]);
  });
});
