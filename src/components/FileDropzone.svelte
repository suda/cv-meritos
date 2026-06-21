<script lang="ts">
  let { onFile, label = 'Adjuntar PDF' }: { onFile: (file: File) => void; label?: string } =
    $props();

  let error = $state('');
  let dragOver = $state(false);
  let inputEl: HTMLInputElement;

  function validate(file: File): boolean {
    if (file.type !== 'application/pdf' && !file.name.toLowerCase().endsWith('.pdf')) {
      error = 'Solo se admiten archivos PDF.';
      return false;
    }
    error = '';
    return true;
  }

  function handleFiles(files: FileList | null | undefined) {
    const file = files?.[0];
    if (!file) return;
    if (validate(file)) onFile(file);
  }

  function onDrop(e: DragEvent) {
    e.preventDefault();
    dragOver = false;
    handleFiles(e.dataTransfer?.files);
  }
</script>

<div class="dropzone-wrap">
  <button
    type="button"
    class="dropzone"
    class:drag={dragOver}
    onclick={() => inputEl.click()}
    ondragover={(e) => {
      e.preventDefault();
      dragOver = true;
    }}
    ondragleave={() => (dragOver = false)}
    ondrop={onDrop}
  >
    <span class="icon" aria-hidden="true">📄</span>
    <span>{label}</span>
    <span class="muted small-text">Arrastra un PDF o haz clic para elegirlo</span>
  </button>
  <input
    bind:this={inputEl}
    type="file"
    accept="application/pdf"
    class="visually-hidden"
    onchange={(e) => handleFiles(e.currentTarget.files)}
  />
  {#if error}<p class="error">{error}</p>{/if}
</div>

<style>
  .dropzone {
    width: 100%;
    border: 2px dashed var(--border);
    border-radius: var(--radius);
    background: var(--bg);
    padding: 1.1rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.25rem;
    color: var(--muted);
  }
  .dropzone.drag {
    border-color: var(--primary);
    background: rgba(26, 95, 180, 0.06);
  }
  .icon {
    font-size: 1.6rem;
  }
  .small-text {
    font-size: 0.8rem;
  }
</style>
