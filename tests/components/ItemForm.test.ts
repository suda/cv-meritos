import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { tick } from 'svelte';
import { render, screen, fireEvent, waitFor } from '@testing-library/svelte';
import ItemForm from '../../src/components/ItemForm.svelte';
import * as db from '../../src/lib/db';
import { itemsStore } from '../../src/lib/stores/items.svelte';
import type { Profile } from '../../src/lib/types';

const profile: Profile = { nombreApellidos: 'García López, María', variantesAutor: [] };

beforeEach(async () => {
  await db.clearAll();
  itemsStore.items = [];
});

async function setupItem(typeCode: string) {
  const item = itemsStore.newItem(typeCode);
  await itemsStore.save(item);
  return item;
}

describe('ItemForm', () => {
  it('renderiza los campos del tipo seleccionado', async () => {
    const item = await setupItem('3.2.a');
    render(ItemForm, { props: { item, profile, onClose: () => {} } });
    expect(screen.getByLabelText(/Título/)).toBeInTheDocument();
    expect(screen.getByLabelText('Clave')).toBeInTheDocument();
    expect(screen.getByLabelText('Año')).toBeInTheDocument();
  });

  it('bloquea el guardado si falta un campo obligatorio', async () => {
    const item = await setupItem('3.2.a');
    let closed = false;
    const { container } = render(ItemForm, {
      props: { item, profile, onClose: () => (closed = true) },
    });

    await fireEvent.submit(container.querySelector('form')!);
    await tick();
    expect(closed).toBe(false);
    expect(screen.getByText(/Completa los campos obligatorios/)).toBeInTheDocument();
  });

  it('guarda y cierra cuando se completan los obligatorios', async () => {
    const item = await setupItem('3.2.a');
    let closed = false;
    const { container } = render(ItemForm, {
      props: { item, profile, onClose: () => (closed = true) },
    });

    await fireEvent.input(screen.getByLabelText(/^Título/), { target: { value: 'Mi artículo' } });
    await tick();
    await fireEvent.submit(container.querySelector('form')!);

    await waitFor(() => expect(closed).toBe(true));
    const saved = (await db.listItems()).find((i) => i.id === item.id);
    expect(saved?.values.titulo).toBe('Mi artículo');
  });

  it('muestra el campo de fecha manual cuando el tipo no tiene fecha', async () => {
    const item = await setupItem('5.1.a'); // lenguas extranjeras: sin campo de fecha
    render(ItemForm, { props: { item, profile, onClose: () => {} } });
    expect(screen.getByLabelText(/Fecha para ordenar/)).toBeInTheDocument();
  });
});
