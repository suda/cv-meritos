<script lang="ts">
  import type { Snippet } from 'svelte';

  let {
    title,
    onClose,
    children,
    wide = false,
  }: { title: string; onClose: () => void; children: Snippet; wide?: boolean } = $props();

  function onKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') onClose();
  }
</script>

<svelte:window onkeydown={onKeydown} />

<div
  class="backdrop"
  role="button"
  tabindex="-1"
  aria-label="Cerrar"
  onclick={onClose}
  onkeydown={() => {}}
>
  <div
    class="dialog"
    class:wide
    role="dialog"
    aria-modal="true"
    aria-label={title}
    onclick={(e) => e.stopPropagation()}
    onkeydown={() => {}}
    tabindex="-1"
  >
    <header class="dialog-head">
      <h2>{title}</h2>
      <button type="button" class="ghost" onclick={onClose} aria-label="Cerrar">✕</button>
    </header>
    <div class="dialog-body">
      {@render children()}
    </div>
  </div>
</div>

<style>
  .backdrop {
    position: fixed;
    inset: 0;
    background: rgba(20, 30, 45, 0.45);
    display: flex;
    align-items: flex-start;
    justify-content: center;
    padding: 4vh 1rem;
    z-index: 100;
    overflow: auto;
  }
  .dialog {
    background: var(--surface);
    border-radius: var(--radius);
    box-shadow: 0 12px 40px rgba(15, 25, 40, 0.3);
    width: 100%;
    max-width: 640px;
    cursor: default;
  }
  .dialog.wide {
    max-width: 820px;
  }
  .dialog-head {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 0.8rem 1.2rem;
    border-bottom: 1px solid var(--border);
  }
  .dialog-head h2 {
    margin: 0;
    font-size: 1.1rem;
  }
  .dialog-body {
    padding: 1.1rem 1.2rem;
  }
</style>
