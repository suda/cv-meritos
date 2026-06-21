import { test, expect } from '@playwright/test';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(() => indexedDB.deleteDatabase('cv-meritos'));
  await page.reload();
});

test('sin nombre del solicitante, el botón de generar está deshabilitado', async ({ page }) => {
  await page.getByLabel('Nombre y apellidos').fill('');
  const boton = page.getByRole('button', { name: 'Generar PDF combinado' });
  await expect(boton).toBeDisabled();
  await expect(
    page.getByText('Introduce tu nombre y apellidos para poder generar el documento combinado.'),
  ).toBeVisible();

  // Al introducir el nombre se habilita.
  await page.getByLabel('Nombre y apellidos').fill('García López, María');
  await expect(boton).toBeEnabled();
});
