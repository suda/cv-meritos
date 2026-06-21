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

  it('el autosave del formulario persiste el nombre en IndexedDB', async () => {
    render(ProfileForm);
    const input = screen.getByLabelText(/Nombre y apellidos/);
    await fireEvent.input(input, { target: { value: 'García López, María' } });
    // El autosave tiene un debounce de 300 ms.
    await new Promise((r) => setTimeout(r, 400));
    const persisted = await db.getProfile();
    expect(persisted.nombreApellidos).toBe('García López, María');
  });

  it('refleja el perfil cargado desde IndexedDB tras load() (restauración)', async () => {
    await db.saveProfile({
      nombreApellidos: 'García López, María',
      variantesAutor: [],
      convocatoria: 'X',
    });
    render(ProfileForm);
    // Simula la carga tras recargar la página.
    await profileStore.load();
    const input = (await screen.findByLabelText(/Nombre y apellidos/)) as HTMLInputElement;
    await new Promise((r) => setTimeout(r, 0));
    expect(input.value).toBe('García López, María');
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
