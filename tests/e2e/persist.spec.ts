import { test, expect } from '@playwright/test';
import { setNombre, addArticulo } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('cv-meritos'));
  await page.reload();
});

test('el perfil y los méritos sobreviven a una recarga (IndexedDB)', async ({ page }) => {
  await setNombre(page, 'García López, María');
  await addArticulo(page, { titulo: 'Artículo Persistente', anio: '2021' });

  await expect(page.getByText('Artículo Persistente')).toBeVisible();

  // El perfil se guarda con un debounce de 300 ms; esperamos a que se vuelque
  // a IndexedDB antes de recargar (un usuario real también haría una pausa).
  await page.waitForTimeout(600);
  await page.reload();

  await expect(page.getByLabel('Nombre y apellidos')).toHaveValue('García López, María');
  await expect(page.getByText('Artículo Persistente')).toBeVisible();
});
