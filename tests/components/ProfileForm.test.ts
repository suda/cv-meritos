import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, fireEvent } from '@testing-library/svelte';
import ProfileForm from '../../src/components/ProfileForm.svelte';
import * as db from '../../src/lib/db';
import { profileStore } from '../../src/lib/stores/profile.svelte';

beforeEach(async () => {
  await db.clearAll();
  profileStore.profile = db.emptyProfile();
});

describe('ProfileForm', () => {
  it('muestra el aviso cuando falta el nombre y apellidos', () => {
    render(ProfileForm);
    expect(
      screen.getByText(/Introduce tu nombre y apellidos para poder generar/),
    ).toBeInTheDocument();
    expect(profileStore.isReady).toBe(false);
  });

  it('al introducir el nombre, isReady pasa a true y desaparece el aviso', async () => {
    render(ProfileForm);
    const input = screen.getByLabelText(/Nombre y apellidos/);
    await fireEvent.input(input, { target: { value: 'García López, María' } });
    expect(profileStore.isReady).toBe(true);
  });

  it('precarga la convocatoria por defecto', () => {
    render(ProfileForm);
    const conv = screen.getByLabelText('Convocatoria') as HTMLInputElement;
    expect(conv.value).toContain('Temporales');
  });

  it('permite añadir variantes del nombre de autor', async () => {
    render(ProfileForm);
    await fireEvent.input(screen.getByLabelText('Nueva variante del nombre'), {
      target: { value: 'M. García' },
    });
    await fireEvent.click(screen.getByText('Añadir'));
    expect(profileStore.profile.variantesAutor).toContain('M. García');
  });
});
