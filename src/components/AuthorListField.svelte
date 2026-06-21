<script lang="ts">
  import type { Author, Profile } from '../lib/types';
  import { isApplicant } from '../lib/authors';

  let {
    value = [],
    profile,
    id,
    onUpdate,
  }: {
    value: Author[];
    profile: Profile;
    id?: string;
    onUpdate: (authors: Author[]) => void;
  } = $props();

  let nuevoNombre = $state('');

  function add() {
    const nombre = nuevoNombre.trim();
    if (!nombre) return;
    const esSolicitante = isApplicant(nombre, profile);
    onUpdate([...value, { nombre, esSolicitante }]);
    nuevoNombre = '';
  }

  function remove(i: number) {
    onUpdate(value.filter((_, idx) => idx !== i));
  }

  function move(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= value.length) return;
    const copy = [...value];
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onUpdate(copy);
  }

  function setName(i: number, nombre: string) {
    onUpdate(value.map((a, idx) => (idx === i ? { ...a, nombre } : a)));
  }

  function setMine(i: number, esSolicitante: boolean) {
    onUpdate(value.map((a, idx) => (idx === i ? { ...a, esSolicitante } : a)));
  }

  function onKey(e: KeyboardEvent) {
    if (e.key === 'Enter') {
      e.preventDefault();
      add();
    }
  }
</script>

<div class="authorlist" {id}>
  <ul>
    {#each value as autor, i (i)}
      <li class="author-row">
        <span class="order">{i + 1}.</span>
        <input
          class="author-name"
          type="text"
          value={autor.nombre}
          oninput={(e) => setName(i, e.currentTarget.value)}
          aria-label={`Nombre del autor ${i + 1}`}
        />
        <label class="soyyo">
          <input
            type="checkbox"
            checked={autor.esSolicitante}
            onchange={(e) => setMine(i, e.currentTarget.checked)}
            aria-label={`Marcar autor ${i + 1} como solicitante`}
          />
          Soy yo
        </label>
        <button
          type="button"
          class="small ghost"
          onclick={() => move(i, -1)}
          disabled={i === 0}
          aria-label="Subir autor">↑</button
        >
        <button
          type="button"
          class="small ghost"
          onclick={() => move(i, 1)}
          disabled={i === value.length - 1}
          aria-label="Bajar autor">↓</button
        >
        <button
          type="button"
          class="small danger"
          onclick={() => remove(i)}
          aria-label="Quitar autor">✕</button
        >
      </li>
    {/each}
  </ul>

  <div class="row add-row">
    <input
      type="text"
      placeholder="Añadir autor (p.ej. «García López, M.»)"
      bind:value={nuevoNombre}
      onkeydown={onKey}
      aria-label="Nuevo autor"
    />
    <button type="button" class="small" onclick={add}>Añadir autor</button>
  </div>
  <p class="muted hint">
    Los autores marcados como «Soy yo» se subrayarán en el índice. La detección es automática pero
    puedes corregirla.
  </p>
</div>

<style>
  ul {
    list-style: none;
    margin: 0 0 0.5rem;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.35rem;
  }
  .author-row {
    display: flex;
    align-items: center;
    gap: 0.4rem;
  }
  .order {
    color: var(--muted);
    min-width: 1.4rem;
  }
  .author-name {
    flex: 1;
  }
  .soyyo {
    display: inline-flex;
    align-items: center;
    gap: 0.3rem;
    margin: 0;
    font-weight: 600;
    color: var(--text);
    white-space: nowrap;
  }
  .soyyo input {
    width: auto;
  }
  .add-row {
    flex-wrap: nowrap;
  }
  .hint {
    font-size: 0.8rem;
    margin: 0.3rem 0 0;
  }
</style>
