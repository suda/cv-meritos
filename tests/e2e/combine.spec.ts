import { test, expect } from '@playwright/test';
import { setNombre, addArticulo, generateCombined } from './helpers';
import { getPageCount, extractAllText } from '../helpers/readPdf';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('cv-meritos'));
  await page.reload();
});

test('genera el combinado con índice + adjuntos y numeración correcta', async ({ page }) => {
  await setNombre(page, 'García López, María');

  await addArticulo(page, {
    titulo: 'Artículo Uno',
    anio: '2022',
    autores: ['García López, M.', 'Otro Autor'],
    fixture: 'fixture-3p.pdf',
  });
  await addArticulo(page, {
    titulo: 'Artículo Cero',
    anio: '2019',
    fixture: 'fixture-1p.pdf',
  });

  // Modo global = todas.
  const bytesTodas = await generateCombined(page, 'todas');
  const text = (await extractAllText(bytesTodas)).replace(/\s+/g, ' ');
  const total = await getPageCount(bytesTodas);

  // Índice + 3 + 1.
  const indexPages = total - 4;
  expect(indexPages).toBeGreaterThanOrEqual(1);

  // Orden por fecha ascendente: «Artículo Cero» (2019) antes que «Artículo Uno» (2022).
  expect(text.indexOf('Artículo Cero')).toBeLessThan(text.indexOf('Artículo Uno'));

  // El «Pág.» de cada artículo apunta a su inicio real.
  expect(text).toContain(`Pág. ${indexPages + 1}`); // Artículo Cero (1 pág)
  expect(text).toContain(`Pág. ${indexPages + 2}`); // Artículo Uno (3 págs)

  // Modo global = primera y última: 3 págs aporta 2, 1 pág aporta 1.
  const bytesPU = await generateCombined(page, 'primera_ultima');
  const totalPU = await getPageCount(bytesPU);
  expect(totalPU).toBe(indexPages + 2 + 1);

  // Override por item: poner «Artículo Uno» (3 págs) en «todas» pese al global.
  await page
    .locator('li.item', { hasText: 'Artículo Uno' })
    .getByRole('button', { name: 'Editar' })
    .click();
  const dialog = page.getByRole('dialog', { name: 'Editar mérito' });
  await dialog.getByLabel('Páginas a incluir en el combinado').selectOption('todas');
  await dialog.getByRole('button', { name: 'Guardar' }).click();
  await expect(dialog).toBeHidden();

  const bytesOverride = await generateCombined(page, 'primera_ultima');
  expect(await getPageCount(bytesOverride)).toBe(indexPages + 3 + 1);
});
