<script lang="ts">
  import { profileStore } from './lib/stores/profile.svelte';
  import { itemsStore } from './lib/stores/items.svelte';
  import type { MeritItem } from './lib/types';
  import ProfileForm from './components/ProfileForm.svelte';
  import ItemList from './components/ItemList.svelte';
  import ItemForm from './components/ItemForm.svelte';
  import TypeSelector from './components/TypeSelector.svelte';
  import CombineDialog from './components/CombineDialog.svelte';
  import BackupBar from './components/BackupBar.svelte';
  import Modal from './components/Modal.svelte';

  let editing = $state<MeritItem | null>(null);
  let showSelector = $state(false);
  let showCombine = $state(false);
  let showProfile = $state(true);

  $effect(() => {
    void profileStore.load();
    void itemsStore.load();
  });

  async function chooseType(code: string) {
    const item = itemsStore.newItem(code);
    await itemsStore.save(item);
    showSelector = false;
    editing = item;
  }

  function toggleSort() {
    itemsStore.sortDir = itemsStore.sortDir === 'asc' ? 'desc' : 'asc';
  }
</script>

<a href="#contenido" class="skip-link">Saltar al contenido</a>

<header class="appbar">
  <div class="appbar-inner">
    <div class="brand">
      <span class="logo" aria-hidden="true">🎓</span>
      <div>
        <h1>Méritos y CV — Ayudante Doctor</h1>
        <p class="tagline">Anexo III · Universitat de València · 100% local en tu navegador</p>
      </div>
    </div>
    <BackupBar />
  </div>
</header>

<main id="contenido" class="container">
  <section class="profile-section">
    <div class="section-head">
      <h2 class="visually-hidden">Perfil</h2>
      <button class="ghost small toggle" onclick={() => (showProfile = !showProfile)}>
        {showProfile ? '▾ Ocultar datos del solicitante' : '▸ Mostrar datos del solicitante'}
      </button>
    </div>
    {#if showProfile}
      <ProfileForm />
    {/if}
  </section>

  <section class="toolbar card">
    <button class="primary" onclick={() => (showSelector = true)}>Añadir mérito</button>
    <button onclick={toggleSort}>
      Orden: {itemsStore.sortDir === 'asc' ? 'Ascendente' : 'Descendente'}
    </button>
    <span class="spacer"></span>
    <button
      class="primary"
      onclick={() => (showCombine = true)}
      disabled={!profileStore.isReady}
      title={profileStore.isReady
        ? 'Generar el PDF combinado'
        : 'Introduce tu nombre y apellidos primero'}
    >
      Generar PDF combinado
    </button>
  </section>

  {#if !profileStore.isReady}
    <p class="hint-banner">
      Introduce tu nombre y apellidos para poder generar el documento combinado.
    </p>
  {/if}

  <section class="items-section">
    <ItemList onEdit={(item) => (editing = item)} />
  </section>

  <footer class="appfooter">
    <p class="muted">
      Herramienta de apoyo para preparar la documentación. No valida plazos ni requisitos de la
      convocatoria. Todos los datos se guardan únicamente en este navegador.
    </p>
  </footer>
</main>

{#if showSelector}
  <Modal title="Añadir mérito" onClose={() => (showSelector = false)}>
    <TypeSelector onSelect={chooseType} onClose={() => (showSelector = false)} />
  </Modal>
{/if}

{#if editing}
  <Modal title="Editar mérito" wide onClose={() => (editing = null)}>
    <ItemForm item={editing} profile={profileStore.profile} onClose={() => (editing = null)} />
  </Modal>
{/if}

{#if showCombine}
  <Modal title="Generar PDF combinado" onClose={() => (showCombine = false)}>
    <CombineDialog onClose={() => (showCombine = false)} />
  </Modal>
{/if}

<style>
  .skip-link {
    position: absolute;
    left: -999px;
    top: 0;
    background: var(--primary);
    color: #fff;
    padding: 0.5rem 1rem;
    z-index: 200;
  }
  .skip-link:focus {
    left: 0.5rem;
    top: 0.5rem;
  }
  .appbar {
    background: linear-gradient(120deg, #14488a, #1a5fb4);
    color: #fff;
    box-shadow: var(--shadow);
  }
  .appbar-inner {
    max-width: 960px;
    margin: 0 auto;
    padding: 0.9rem 1.2rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 1rem;
    flex-wrap: wrap;
  }
  .brand {
    display: flex;
    align-items: center;
    gap: 0.7rem;
  }
  .logo {
    font-size: 1.8rem;
  }
  .appbar h1 {
    margin: 0;
    font-size: 1.2rem;
    color: #fff;
  }
  .tagline {
    margin: 0;
    font-size: 0.8rem;
    opacity: 0.85;
  }
  .appbar :global(.backupbar button) {
    background: rgba(255, 255, 255, 0.15);
    border-color: rgba(255, 255, 255, 0.3);
    color: #fff;
  }
  .appbar :global(.backupbar .status) {
    color: #eaf2fb;
  }
  .container {
    max-width: 960px;
    margin: 0 auto;
    padding: 1.2rem;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
  .section-head {
    display: flex;
    justify-content: flex-end;
  }
  .toggle {
    color: var(--primary);
    font-weight: 600;
  }
  .toolbar {
    display: flex;
    align-items: center;
    gap: 0.6rem;
    flex-wrap: wrap;
    padding: 0.8rem 1rem;
  }
  .spacer {
    flex: 1;
  }
  .hint-banner {
    background: #fff6e0;
    border: 1px solid #f0d99a;
    color: #7a5a12;
    padding: 0.6rem 0.9rem;
    border-radius: var(--radius);
    margin: 0;
  }
  .appfooter {
    margin-top: 1.5rem;
    border-top: 1px solid var(--border);
    padding-top: 0.8rem;
    font-size: 0.82rem;
  }
</style>
