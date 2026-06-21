<script lang="ts">
  import { profileStore } from '../lib/stores/profile.svelte';
  import { itemsStore } from '../lib/stores/items.svelte';
  import { combine } from '../lib/pdf/combine';
  import { getFile } from '../lib/db';

  let { onClose }: { onClose: () => void } = $props();

  let progress = $state('');
  let generating = $state(false);
  let resultInfo = $state('');
  let error = $state('');

  const itemsConPdf = $derived(itemsStore.items.filter((i) => i.fileId).length);

  async function generate() {
    error = '';
    resultInfo = '';
    generating = true;
    try {
      const res = await combine(
        $state.snapshot(profileStore.profile),
        $state.snapshot(itemsStore.items),
        {
          globalMode: itemsStore.globalMode,
          dir: itemsStore.sortDir,
          getFile,
          onProgress: (m) => (progress = m),
        },
      );
      const url = URL.createObjectURL(res.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'CV-meritos-combinado.pdf';
      a.click();
      // Revocar más tarde: hacerlo de inmediato puede truncar la descarga.
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      resultInfo = `Documento generado: ${res.totalPages} páginas (índice: ${res.indexPages}).`;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Error al generar el PDF combinado.';
    } finally {
      generating = false;
      progress = '';
    }
  }
</script>

<div class="combine">
  <div class="field">
    <label for="globalMode">Páginas de cada PDF adjunto</label>
    <select id="globalMode" bind:value={itemsStore.globalMode}>
      <option value="todas">Todas las páginas</option>
      <option value="primera_ultima">Solo primera y última página</option>
    </select>
    <p class="muted small">
      Los PDF de 1 o 2 páginas se incluyen completos. Puedes ajustar el modo por mérito en cada
      ficha.
    </p>
  </div>

  <div class="field">
    <label for="sortDir">Orden por fecha dentro de cada apartado</label>
    <select id="sortDir" bind:value={itemsStore.sortDir}>
      <option value="asc">Ascendente</option>
      <option value="desc">Descendente</option>
    </select>
  </div>

  <p class="muted">
    Se generará el índice (Anexo III) seguido de la documentación de {itemsConPdf}
    {itemsConPdf === 1 ? 'mérito' : 'méritos'} con PDF adjunto.
  </p>

  {#if !profileStore.isReady}
    <p class="error">Introduce tu nombre y apellidos para poder generar el documento combinado.</p>
  {/if}

  {#if progress}<p class="muted">⏳ {progress}</p>{/if}
  {#if resultInfo}<p class="ok">✅ {resultInfo}</p>{/if}
  {#if error}<p class="error">{error}</p>{/if}

  <div class="row actions">
    <button
      type="button"
      class="primary"
      onclick={generate}
      disabled={!profileStore.isReady || generating}
    >
      {generating ? 'Generando…' : 'Generar PDF combinado'}
    </button>
    <button type="button" onclick={onClose}>Cerrar</button>
  </div>
</div>

<style>
  .combine {
    display: flex;
    flex-direction: column;
    gap: 0.4rem;
  }
  .small {
    font-size: 0.8rem;
  }
  .ok {
    color: #1e7e34;
    font-weight: 600;
  }
  .actions {
    margin-top: 0.6rem;
  }
</style>
