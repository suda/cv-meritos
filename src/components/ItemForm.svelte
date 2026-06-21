<script lang="ts">
  import type { MeritItem, Profile } from '../lib/types';
  import { getItemType } from '../lib/schema';
  import { countPdfPages } from '../lib/pdf/pageCount';
  import { itemsStore } from '../lib/stores/items.svelte';
  import { suggestionsStore } from '../lib/stores/suggestions.svelte';
  import FieldRenderer from './FieldRenderer.svelte';
  import FileDropzone from './FileDropzone.svelte';
  import { getFile } from '../lib/db';

  let { item, profile, onClose }: { item: MeritItem; profile: Profile; onClose: () => void } =
    $props();

  // El item es estable durante la vida del formulario (un modal por item).
  // svelte-ignore state_referenced_locally
  const typeDef = getItemType(item.typeCode)!;
  const hasPrimaryDate = typeDef.fields.some((f) => f.isPrimaryDate);

  // Capturas iniciales intencionadas del item al abrir el formulario.
  // svelte-ignore state_referenced_locally
  const initial = $state.snapshot(item);
  let values = $state<Record<string, unknown>>(structuredClone(initial.values));
  let pageMode = $state(initial.pageMode ?? 'auto');
  let fechaOrdenManual = $state(initial.fechaOrdenManual ?? '');
  let touched = $state(false);
  let busy = $state('');
  let ocrText = $state('');

  // Vista en vivo del item persistido (fichero, páginas).
  const live = $derived(itemsStore.items.find((i) => i.id === item.id) ?? item);

  function isEmpty(key: string): boolean {
    const v = values[key];
    if (v == null) return true;
    if (typeof v === 'string') return v.trim() === '';
    if (Array.isArray(v)) return v.length === 0;
    if (typeof v === 'object' && 'inicio' in (v as object)) {
      return !(v as { inicio?: string }).inicio;
    }
    return false;
  }

  const missingRequired = $derived(
    typeDef.fields.filter((f) => f.required && isEmpty(f.key)).map((f) => f.key),
  );

  async function save() {
    touched = true;
    if (missingRequired.length > 0) return;
    await itemsStore.save({
      ...$state.snapshot(live),
      values: $state.snapshot(values),
      pageMode,
      fechaOrdenManual: hasPrimaryDate ? undefined : fechaOrdenManual || undefined,
    });
    onClose();
  }

  async function onFile(file: File) {
    busy = 'Analizando PDF…';
    try {
      const pages = await countPdfPages(file);
      await itemsStore.attachFile(item.id, file, file.name, pages);
    } catch {
      busy = '';
      alert('No se pudo leer el PDF. Asegúrate de que es un archivo válido.');
      return;
    }
    busy = '';
  }

  async function detach() {
    if (!confirm('¿Quitar el PDF adjunto de este mérito?')) return;
    await itemsStore.detachFile(item.id);
  }

  async function preview() {
    if (!live.fileId) return;
    const blob = await getFile(live.fileId);
    if (blob) window.open(URL.createObjectURL(blob), '_blank');
  }

  async function runOcr() {
    if (!live.fileId) return;
    busy = 'Ejecutando OCR…';
    try {
      const blob = await getFile(live.fileId);
      if (!blob) return;
      const { ocrFirstPage } = await import('../lib/ocr');
      const res = await ocrFirstPage(blob, (p) => (busy = `OCR ${Math.round(p * 100)}%`));
      ocrText = res.texto;
      // Autorrelleno best-effort, sólo si el campo está vacío y con confirmación.
      if (res.titulo && 'titulo' in values && isEmpty('titulo')) {
        if (confirm(`¿Usar como título?\n\n${res.titulo}`)) values.titulo = res.titulo;
      }
      if (res.anio && 'anio' in values && isEmpty('anio')) {
        if (confirm(`¿Usar como año? ${res.anio}`)) values.anio = res.anio;
      }
    } catch {
      alert('No se pudo ejecutar el OCR en este entorno.');
    } finally {
      busy = '';
    }
  }

  function copyOcr() {
    void navigator.clipboard?.writeText(ocrText);
  }
</script>

<div class="itemform">
  <header>
    <div>
      <p class="code">{typeDef.code} · {typeDef.sectionTitle}</p>
      <h2>{typeDef.label}</h2>
      {#if typeDef.group}<p class="muted">{typeDef.group}</p>{/if}
    </div>
  </header>

  <form
    onsubmit={(e) => {
      e.preventDefault();
      void save();
    }}
  >
    {#each typeDef.fields as field (field.key)}
      <FieldRenderer
        {field}
        bind:value={values[field.key]}
        {profile}
        suggestions={field.suggest ? suggestionsStore.for(field.key) : []}
        invalid={touched && field.required && isEmpty(field.key)}
      />
    {/each}

    {#if !hasPrimaryDate}
      <div class="field">
        <label for="fechaManual">Fecha para ordenar (opcional)</label>
        <input id="fechaManual" type="date" bind:value={fechaOrdenManual} />
        <p class="muted small">Este mérito no tiene un campo de fecha; indícala para ordenarlo.</p>
      </div>
    {/if}

    <fieldset class="pdfbox">
      <legend>Documentación acreditativa (PDF)</legend>
      {#if live.fileId}
        <div class="row filerow">
          <span>📎 <strong>{live.fileName}</strong> ({live.pageCount} pág.)</span>
          <button type="button" class="small" onclick={preview}>Previsualizar</button>
          <button type="button" class="small" onclick={runOcr}>Extraer texto (OCR)</button>
          <button type="button" class="small danger" onclick={detach}>Quitar PDF</button>
        </div>
        <div class="field pagemode">
          <label for="pageMode">Páginas a incluir en el combinado</label>
          <select id="pageMode" bind:value={pageMode}>
            <option value="auto">Usar opción global</option>
            <option value="todas">Todas las páginas</option>
            <option value="primera_ultima">Solo primera y última página</option>
          </select>
        </div>
      {:else}
        <FileDropzone {onFile} />
      {/if}

      {#if ocrText}
        <div class="ocrbox">
          <div class="row">
            <strong>Texto OCR (ayuda no fiable)</strong>
            <button type="button" class="small" onclick={copyOcr}>Copiar</button>
          </div>
          <pre>{ocrText}</pre>
        </div>
      {/if}
    </fieldset>

    {#if touched && missingRequired.length > 0}
      <p class="error">Completa los campos obligatorios antes de guardar.</p>
    {/if}
    {#if busy}<p class="muted">{busy}</p>{/if}

    <div class="row actions">
      <button type="submit" class="primary">Guardar</button>
      <button type="button" onclick={onClose}>Cancelar</button>
    </div>
  </form>
</div>

<style>
  .itemform {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }
  header h2 {
    margin: 0.2rem 0;
    font-size: 1.15rem;
  }
  .code {
    color: var(--accent);
    font-weight: 700;
    font-size: 0.85rem;
    margin: 0;
  }
  .pdfbox {
    border: 1px solid var(--border);
    border-radius: var(--radius);
    padding: 0.8rem 1rem;
    margin: 0.6rem 0;
  }
  .pdfbox legend {
    font-weight: 700;
    font-size: 0.85rem;
    padding: 0 0.4rem;
  }
  .filerow {
    margin-bottom: 0.5rem;
  }
  .pagemode {
    max-width: 22rem;
  }
  .ocrbox {
    margin-top: 0.6rem;
    background: var(--bg);
    border-radius: 8px;
    padding: 0.6rem;
  }
  .ocrbox pre {
    white-space: pre-wrap;
    max-height: 12rem;
    overflow: auto;
    font-size: 0.8rem;
  }
  .actions {
    margin-top: 0.6rem;
  }
  .small {
    font-size: 0.8rem;
  }
</style>
