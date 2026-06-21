import { mkdir, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { makeFixturePdfBytes } from '../helpers/makeFixturePdf';

const here = dirname(fileURLToPath(import.meta.url));
const fixturesDir = resolve(here, '../fixtures');

/** Genera los PDFs de prueba antes de la suite E2E. */
export default async function globalSetup() {
  await mkdir(fixturesDir, { recursive: true });
  for (const pages of [1, 3, 5]) {
    const bytes = await makeFixturePdfBytes(pages);
    await writeFile(resolve(fixturesDir, `fixture-${pages}p.pdf`), bytes);
  }
}
