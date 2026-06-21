# Gestión de méritos y CV — Profesorado Ayudante Doctor (UV)

Aplicación web **100 % local** (solo frontend) para preparar la documentación del
**Anexo III «Currículum Académico»** de la convocatoria de _Profesorado Ayudante Doctor_
de la Universitat de València.

Permite registrar los méritos exigidos por el Anexo III, adjuntar un PDF acreditativo a
cada uno y **generar un único PDF combinado** que contiene el índice/CV (Anexo III
relleno, con la página real de cada mérito) seguido de toda la documentación adjunta.

> No hay backend. Nada sale del navegador: los datos se guardan en **IndexedDB** y solo
> se exportan si tú lo pides (copia ZIP).

## Características

- **Catálogo completo del Anexo III** (secciones 1–7, con sus subapartados y letras).
- **Formulario dinámico** generado desde el esquema, con tipos de campo específicos
  (año, fecha, rango de fechas, selección, lista de autores…).
- **Adjuntar un PDF** por mérito y contar sus páginas.
- **PDF combinado**: índice + adjuntos en orden canónico, con numeración «Pág. N»
  resuelta por **punto fijo** para que apunte a la página real.
- **Modo de páginas** global y por-mérito: _todas_ o _solo primera y última_
  (los PDF de 1–2 páginas se incluyen completos).
- **Orden por fecha** (ascendente/descendente) dentro de cada subapartado.
- **Subrayado automático del solicitante** en las listas de autores (con corrección manual).
- **Autocompletado** reutilizando valores ya introducidos.
- **OCR opcional** (best-effort, no fiable) del PDF adjunto.
- **Copia de seguridad** ZIP (exportar/importar, incluye los PDF).
- **Persistencia local** en IndexedDB; sobrevive a recargas.

## Stack

Vite · Svelte 5 (runes) · TypeScript · `idb` · `pdf-lib` · `pdfjs-dist` · `pdfmake` ·
`tesseract.js` · `jszip` · Vitest + Testing Library · Playwright.

## Desarrollo

```bash
pnpm install
pnpm dev            # servidor de desarrollo
pnpm build          # build de producción (dist/)
pnpm preview        # sirve el build
```

### Calidad y pruebas

```bash
pnpm check          # typecheck (svelte-check)
pnpm lint           # eslint + prettier --check
pnpm test:unit      # tests unitarios y de componentes (Vitest) con cobertura
pnpm test:e2e       # tests end-to-end (Playwright)
pnpm test           # todo lo anterior
```

Umbrales de cobertura: **≥ 90 %** en `src/lib/pdf`, `src/lib/authors.ts` y
`src/lib/dates.ts`, y **≥ 80 %** global. La CI falla por debajo.

**Fixtures de PDF (E2E):** se generan automáticamente con `pdf-lib` en el _global setup_
de Playwright (`tests/e2e/global-setup.ts`), por lo que **no se commitean**.

## Despliegue (GitHub Pages)

El workflow `.github/workflows/deploy.yml` construye y publica en cada push a `main`.

1. En el repositorio: **Settings → Pages → Source: GitHub Actions**.
2. El base path se ajusta automáticamente a `/<nombre-repo>/` mediante la variable
   `BASE_PATH`. En local el base es `/`.

Todas las rutas a assets usan `import.meta.env.BASE_URL`, e incluimos `public/.nojekyll`.

### OCR (tesseract.js)

El OCR se carga **bajo demanda** y es una ayuda orientativa, no fiable. Por defecto
intenta cargar los assets locales desde `public/tesseract/` (worker, core wasm y datos de
idioma `spa`+`eng`); si no están presentes, recurre al CDN por defecto de tesseract.js.

Para un OCR **totalmente offline**, coloca en `public/tesseract/` el `worker.min.js`, el
core wasm y los `*.traineddata` de `spa` y `eng`. Estos binarios no se incluyen en el
repositorio por su tamaño.

## Alcance y supuestos

- **Simplificación deliberada:** la convocatoria pide la documentación indexada por
  _archivos 1–7_; aquí se produce **un único PDF combinado** (índice + adjuntos) como
  herramienta de trabajo. Generar un ZIP con 7 PDF separados (uno por archivo) sería una
  extensión natural del mismo motor (`src/lib/pdf/combine.ts`, recorriendo por sección).
- La numeración «Pág. N» del índice se refiere a la página dentro del **PDF combinado**.
- El OCR es orientativo; no se garantiza exactitud.
- La app **no** valida el cumplimiento normativo (plazos, requisitos, baremo).
- Solo español (sin i18n multi-idioma).

## Estructura

```
src/
  lib/
    schema.ts        # catálogo del Anexo III (núcleo)
    types.ts
    db.ts            # IndexedDB (idb)
    dates.ts         # normalización y orden por fecha
    authors.ts       # detección/subrayado del solicitante
    suggestions.ts   # autocompletado
    ocr.ts           # OCR opcional (dynamic import)
    backup.ts        # export/import ZIP
    stores/          # estado reactivo (runes)
    pdf/
      selectPages.ts # selección de páginas (todas / primera+última)
      computeOffsets.ts # numeración por punto fijo
      buildIndex.ts  # índice/CV con pdfmake (+ subrayado)
      combine.ts     # orquestación del PDF combinado
      pageCount.ts
  components/        # UI (Svelte)
tests/
  unit/ components/ e2e/ helpers/ fixtures/
```
