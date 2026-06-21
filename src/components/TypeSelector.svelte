<script lang="ts">
  import { groupedItemTypes } from '../lib/schema';

  let { onSelect, onClose }: { onSelect: (code: string) => void; onClose: () => void } = $props();

  const sections = groupedItemTypes();
  let filter = $state('');

  const filtered = $derived.by(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return sections;
    return sections
      .map((s) => ({
        ...s,
        groups: s.groups
          .map((g) => ({
            ...g,
            types: g.types.filter((t) => t.label.toLowerCase().includes(q) || t.code.includes(q)),
          }))
          .filter((g) => g.types.length > 0),
      }))
      .filter((s) => s.groups.length > 0);
  });
</script>

<div class="selector">
  <div class="field">
    <label for="typefilter">Buscar tipo de mérito</label>
    <input
      id="typefilter"
      type="search"
      placeholder="Filtra por texto o código (p.ej. «artículo» o «3.2»)"
      bind:value={filter}
    />
  </div>

  <div class="scroll">
    {#each filtered as sec (sec.section)}
      <section>
        <h3>{sec.section}. {sec.sectionTitle}</h3>
        {#each sec.groups as grp (grp.group ?? '_')}
          {#if grp.group}<p class="group">{grp.group}</p>{/if}
          <ul>
            {#each grp.types as type (type.code)}
              <li>
                <button type="button" class="type-btn" onclick={() => onSelect(type.code)}>
                  <span class="code">{type.code}</span>
                  <span class="label">{type.label}</span>
                </button>
              </li>
            {/each}
          </ul>
        {/each}
      </section>
    {/each}
    {#if filtered.length === 0}
      <p class="muted">No hay tipos que coincidan con «{filter}».</p>
    {/if}
  </div>

  <div class="row">
    <button type="button" onclick={onClose}>Cancelar</button>
  </div>
</div>

<style>
  .selector {
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .scroll {
    max-height: 60vh;
    overflow: auto;
    padding-right: 0.4rem;
  }
  section h3 {
    font-size: 1rem;
    color: var(--accent);
    margin: 0.8rem 0 0.3rem;
  }
  .group {
    font-weight: 600;
    color: var(--muted);
    margin: 0.5rem 0 0.2rem;
    font-size: 0.85rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.3rem;
  }
  .type-btn {
    width: 100%;
    text-align: left;
    display: flex;
    gap: 0.6rem;
    align-items: baseline;
  }
  .type-btn .code {
    color: var(--accent);
    font-weight: 700;
    flex-shrink: 0;
    min-width: 3rem;
  }
</style>
