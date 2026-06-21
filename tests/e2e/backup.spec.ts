import { resolve } from 'node:path';
import { tmpdir } from 'node:os';
import { test, expect } from '@playwright/test';
import { setNombre, addArticulo, generateCombined } from './helpers';
import { getPageCount } from '../helpers/readPdf';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('cv-meritos'));
  await page.reload();
});

test('exportar → borrar → importar restaura datos y ficheros', async ({ page }) => {
  await setNombre(page, 'García López, María');
  await addArticulo(page, {
    titulo: 'Artículo Copia',
    anio: '2022',
    fixture: 'fixture-3p.pdf',
  });

  const totalBefore = await getPageCount(await generateCombined(page, 'todas'));

  // Exportar copia.
  const exportDownload = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Exportar copia' }).click();
  const zipPath = resolve(tmpdir(), `cv-backup-${Date.now()}.zip`);
  await (await exportDownload).saveAs(zipPath);

  // Borrar todo.
  await page.evaluate(() => indexedDB.deleteDatabase('cv-meritos'));
  await page.reload();
  await expect(page.getByText('Aún no has añadido méritos.')).toBeVisible();

  // Importar (aceptar el diálogo = reemplazar).
  page.once('dialog', (d) => d.accept());
  await page.locator('input[type="file"][accept*="zip"]').setInputFiles(zipPath);

  await expect(page.getByText('Artículo Copia')).toBeVisible();
  await expect(page.getByLabel('Nombre y apellidos')).toHaveValue('García López, María');

  // El PDF adjunto también se restauró: el combinado vuelve a tener el mismo nº de páginas.
  const totalAfter = await getPageCount(await generateCombined(page, 'todas'));
  expect(totalAfter).toBe(totalBefore);
});
