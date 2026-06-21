<script lang="ts">
  import { profileStore } from '../lib/stores/profile.svelte';
  import { itemsStore } from '../lib/stores/items.svelte';
  import { backupFileName, createBackupZip, readBackupZip, applyBackup } from '../lib/backup';
  import { getFile } from '../lib/db';

  let status = $state('');
  let importEl: HTMLInputElement;

  async function exportar() {
    status = 'Generando copia…';
    try {
      const blob = await createBackupZip(
        $state.snapshot(profileStore.profile),
        $state.snapshot(itemsStore.items),
        getFile,
      );
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = backupFileName();
      a.click();
      URL.revokeObjectURL(url);
      status = 'Copia exportada.';
    } catch {
      status = 'No se pudo exportar la copia.';
    }
  }

  async function importar(file: File) {
    status = 'Leyendo copia…';
    try {
      const parsed = await readBackupZip(file);
      const replace = confirm(
        `La copia contiene ${parsed.data.items.length} méritos.\n\n` +
          'Aceptar = REEMPLAZAR todos los datos actuales.\n' +
          'Cancelar = FUSIONAR con los datos actuales.',
      );
      await applyBackup(parsed, replace ? 'replace' : 'merge');
      await profileStore.load();
      await itemsStore.load();
      status = replace ? 'Datos reemplazados desde la copia.' : 'Datos fusionados desde la copia.';
    } catch (e) {
      status = e instanceof Error ? e.message : 'No se pudo importar la copia.';
    }
  }
</script>

<div class="backupbar">
  <button type="button" class="small" onclick={exportar}>Exportar copia</button>
  <button type="button" class="small" onclick={() => importEl.click()}>Importar copia</button>
  <input
    bind:this={importEl}
    type="file"
    accept=".zip,application/zip"
    class="visually-hidden"
    onchange={(e) => {
      const f = e.currentTarget.files?.[0];
      if (f) void importar(f);
      e.currentTarget.value = '';
    }}
  />
  {#if status}<span class="muted status">{status}</span>{/if}
</div>

<style>
  .backupbar {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    flex-wrap: wrap;
  }
  .small {
    font-size: 0.8rem;
  }
  .status {
    font-size: 0.82rem;
  }
</style>
