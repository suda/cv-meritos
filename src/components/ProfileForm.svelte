<script lang="ts">
  import { profileStore } from '../lib/stores/profile.svelte';

  let nuevaVariante = $state('');

  function onInput() {
    profileStore.scheduleSave();
  }

  function addVariante() {
    const v = nuevaVariante.trim();
    if (!v) return;
    profileStore.profile.variantesAutor = [...profileStore.profile.variantesAutor, v];
    nuevaVariante = '';
    profileStore.scheduleSave();
  }

  function removeVariante(i: number) {
    profileStore.profile.variantesAutor = profileStore.profile.variantesAutor.filter(
      (_, idx) => idx !== i,
    );
    profileStore.scheduleSave();
  }

  const p = $derived(profileStore.profile);
</script>

<div class="card profile">
  <h2>Datos del solicitante</h2>
  <div class="grid">
    <div class="field span2">
      <label for="nombre">
        Nombre y apellidos <span class="required-mark" aria-hidden="true">*</span>
      </label>
      <input
        id="nombre"
        type="text"
        bind:value={p.nombreApellidos}
        oninput={onInput}
        aria-required="true"
        placeholder="Apellidos, Nombre"
      />
      {#if !profileStore.isReady}
        <p class="error">
          Introduce tu nombre y apellidos para poder generar el documento combinado.
        </p>
      {/if}
    </div>

    <div class="field">
      <label for="dni">DNI</label>
      <input id="dni" type="text" bind:value={p.dni} oninput={onInput} />
    </div>
    <div class="field">
      <label for="correo">Correo</label>
      <input id="correo" type="email" bind:value={p.correo} oninput={onInput} />
    </div>
    <div class="field">
      <label for="telefono">Teléfono</label>
      <input id="telefono" type="tel" bind:value={p.telefono} oninput={onInput} />
    </div>
    <div class="field">
      <label for="plaza">Número de plaza</label>
      <input id="plaza" type="text" bind:value={p.numeroPlaza} oninput={onInput} />
    </div>
    <div class="field span2">
      <label for="convocatoria">Convocatoria</label>
      <input id="convocatoria" type="text" bind:value={p.convocatoria} oninput={onInput} />
    </div>
    <div class="field">
      <label for="area">Área de conocimiento</label>
      <input id="area" type="text" bind:value={p.areaConocimiento} oninput={onInput} />
    </div>
    <div class="field">
      <label for="departamento">Departamento</label>
      <input id="departamento" type="text" bind:value={p.departamento} oninput={onInput} />
    </div>
    <div class="field span2">
      <label for="centro">Centro</label>
      <input id="centro" type="text" bind:value={p.centro} oninput={onInput} />
    </div>
  </div>

  <div class="variantes">
    <span class="vlabel">Variantes de tu nombre como autor/a</span>
    <p class="muted small">
      Añade las formas en que tu nombre aparece en publicaciones para detectar y subrayar tu autoría
      (p.ej. «García López, M.», «M. García»).
    </p>
    <ul>
      {#each p.variantesAutor as v, i (i)}
        <li>
          <span>{v}</span>
          <button type="button" class="small danger" onclick={() => removeVariante(i)}>✕</button>
        </li>
      {/each}
    </ul>
    <div class="row">
      <input
        type="text"
        placeholder="Nueva variante"
        bind:value={nuevaVariante}
        onkeydown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            addVariante();
          }
        }}
        aria-label="Nueva variante del nombre"
      />
      <button type="button" class="small" onclick={addVariante}>Añadir</button>
    </div>
  </div>
</div>

<style>
  .profile h2 {
    margin-top: 0;
    font-size: 1.15rem;
  }
  .grid {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.4rem 1rem;
  }
  .span2 {
    grid-column: 1 / -1;
  }
  .variantes {
    margin-top: 0.8rem;
    border-top: 1px solid var(--border);
    padding-top: 0.8rem;
  }
  .vlabel {
    font-weight: 700;
    font-size: 0.9rem;
  }
  .small {
    font-size: 0.8rem;
  }
  .variantes ul {
    list-style: none;
    margin: 0.4rem 0;
    padding: 0;
    display: flex;
    flex-wrap: wrap;
    gap: 0.4rem;
  }
  .variantes li {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    background: var(--bg);
    border: 1px solid var(--border);
    border-radius: 999px;
    padding: 0.15rem 0.3rem 0.15rem 0.7rem;
  }
  @media (max-width: 640px) {
    .grid {
      grid-template-columns: 1fr;
    }
    .span2 {
      grid-column: auto;
    }
  }
</style>
