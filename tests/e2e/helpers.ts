import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { expect, type Page } from '@playwright/test';

const here = dirname(fileURLToPath(import.meta.url));
export const fixturePath = (name: string) => resolve(here, '../fixtures', name);

export async function setNombre(page: Page, nombre: string) {
  await page.getByLabel('Nombre y apellidos').fill(nombre);
}

/** Añade un mérito de tipo `code` rellenando título, año, autores y PDF. */
export async function addArticulo(
  page: Page,
  opts: {
    code?: string;
    titulo: string;
    anio: string;
    autores?: string[];
    fixture?: string;
  },
) {
  const code = opts.code ?? '3.2.a';
  await page.getByRole('button', { name: 'Añadir mérito' }).click();
  // Selector de tipo (modal).
  await page.getByPlaceholder(/Filtra por texto o código/).fill(code);
  await page.getByRole('button', { name: new RegExp(`^${code.replace('.', '\\.')}`) }).click();

  const dialog = page.getByRole('dialog', { name: 'Editar mérito' });
  // «Título» es obligatorio (su etiqueta lleva un «*» oculto), por eso no usamos
  // exact; en cambio «Año» sí, para no chocar con «Páginas y año».
  await dialog.getByLabel('Título').fill(opts.titulo);
  await dialog.getByLabel('Año', { exact: true }).fill(opts.anio);

  for (const autor of opts.autores ?? []) {
    await dialog.getByLabel('Nuevo autor').fill(autor);
    await dialog.getByRole('button', { name: 'Añadir autor' }).click();
  }

  if (opts.fixture) {
    await dialog.locator('input[type="file"]').setInputFiles(fixturePath(opts.fixture));
    // Espera a que se calcule el número de páginas.
    await expect(dialog.getByText(/pág\./)).toBeVisible();
  }

  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog).toBeHidden();
}

/** Genera el combinado y devuelve los bytes descargados. */
export async function generateCombined(
  page: Page,
  mode: 'todas' | 'primera_ultima',
): Promise<Uint8Array> {
  await page.getByRole('button', { name: 'Generar PDF combinado' }).click();
  const dialog = page.getByRole('dialog', { name: 'Generar PDF combinado' });
  await dialog
    .getByLabel('Páginas de cada PDF adjunto')
    .selectOption(mode === 'todas' ? 'todas' : 'primera_ultima');

  const downloadPromise = page.waitForEvent('download');
  await dialog.getByRole('button', { name: 'Generar PDF combinado' }).click();
  const download = await downloadPromise;
  const stream = await download.createReadStream();
  const chunks: Buffer[] = [];
  for await (const chunk of stream) chunks.push(chunk as Buffer);
  // Cerrar el diálogo con Escape (evita ambigüedad entre el botón «Cerrar» y la «✕»).
  await page.keyboard.press('Escape');
  await dialog.waitFor({ state: 'hidden' });
  return new Uint8Array(Buffer.concat(chunks));
}
