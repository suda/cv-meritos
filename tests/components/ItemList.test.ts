import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { render, screen, within } from '@testing-library/svelte';
import ItemList from '../../src/components/ItemList.svelte';
import * as db from '../../src/lib/db';
import { itemsStore } from '../../src/lib/stores/items.svelte';

beforeEach(async () => {
  await db.clearAll();
  itemsStore.items = [];
  itemsStore.sortDir = 'asc';
});

async function add(typeCode: string, values: Record<string, unknown>) {
  const item = itemsStore.newItem(typeCode);
  item.values = values;
  await itemsStore.save(item);
}

describe('ItemList', () => {
  it('muestra el estado vacío cuando no hay méritos', () => {
    render(ItemList, { props: { onEdit: () => {} } });
    expect(screen.getByText('Aún no has añadido méritos.')).toBeInTheDocument();
  });

  it('agrupa por sección y ordena por fecha (asc)', async () => {
    await add('3.2.a', { titulo: 'Artículo Uno', anio: 2022 });
    await add('3.2.a', { titulo: 'Artículo Cero', anio: 2019 });
    render(ItemList, { props: { onEdit: () => {} } });

    const titles = screen.getAllByText(/Artículo (Cero|Uno)/).map((el) => el.textContent);
    expect(titles[0]).toContain('Artículo Cero');
    expect(titles[1]).toContain('Artículo Uno');

    // La cabecera de sección 3 aparece.
    expect(
      screen.getByText(/3\. Investigación, transferencia e intercambio de conocimiento/),
    ).toBeInTheDocument();
  });

  it('el orden descendente invierte la lista', async () => {
    await add('3.2.a', { titulo: 'Artículo Uno', anio: 2022 });
    await add('3.2.a', { titulo: 'Artículo Cero', anio: 2019 });
    itemsStore.sortDir = 'desc';
    render(ItemList, { props: { onEdit: () => {} } });
    const titles = screen.getAllByText(/Artículo (Cero|Uno)/).map((el) => el.textContent);
    expect(titles[0]).toContain('Artículo Uno');
    expect(titles[1]).toContain('Artículo Cero');
  });

  it('cada item ofrece acciones de editar, duplicar y eliminar', async () => {
    await add('1.1.b', { detalle: 'Premio', anio: 2020 });
    render(ItemList, { props: { onEdit: () => {} } });
    const item = screen.getByText('Premio').closest('li')!;
    expect(within(item).getByText('Editar')).toBeInTheDocument();
    expect(within(item).getByText('Duplicar')).toBeInTheDocument();
    expect(within(item).getByText('Eliminar')).toBeInTheDocument();
  });
});
