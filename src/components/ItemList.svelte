<script lang="ts">
  import type { MeritItem } from '../lib/types';
  import { ITEM_TYPES, getItemType } from '../lib/schema';
  import { sortByFecha } from '../lib/dates';
  import { itemsStore } from '../lib/stores/items.svelte';

  let { onEdit }: { onEdit: (item: MeritItem) => void } = $props();

  // Estructura agrupada por sección → subapartado, sólo con items existentes.
  const grouped = $derived.by(() => {
    const items = itemsStore.items;
    const dir = itemsStore.sortDir;
    const sections: {
      section: string;
      title: string;
      groups: { group: string | undefined; items: MeritItem[] }[];
    }[] = [];

    for (const type of ITEM_TYPES) {
      const ofType = sortByFecha(
        items.filter((i) => i.typeCode === type.code),
        dir,
      );
      if (ofType.length === 0) continue;
      let sec = sections.find((s) => s.section === type.section);
      if (!sec) {
        sec = { section: type.section, title: type.sectionTitle, groups: [] };
        sections.push(sec);
      }
      let grp = sec.groups.find((g) => g.group === type.group);
      if (!grp) {
        grp = { group: type.group, items: [] };
        sec.groups.push(grp);
      }
      grp.items.push(...ofType);
    }
    return sections;
  });

  function summary(item: MeritItem): string {
    const v = item.values;
    const cand = v.titulo ?? v.detalle ?? v.tituloProyecto ?? v.descripcion ?? v.situacion;
    if (typeof cand === 'string' && cand.trim()) return cand;
    return '(Sin descripción)';
  }

  function effectiveMode(item: MeritItem): string {
    const m = item.pageMode ?? 'auto';
    const resolved = m === 'auto' ? itemsStore.globalMode : m;
    return resolved === 'todas' ? 'Todas' : 'Primera y última';
  }

  async function del(item: MeritItem) {
    if (confirm(`¿Eliminar este mérito?\n\n${summary(item)}`)) {
      await itemsStore.remove(item.id);
    }
  }

  async function dup(item: MeritItem) {
    await itemsStore.duplicate(item.id);
  }
</script>

{#if itemsStore.items.length === 0}
  <div class="empty card">
    <p>Aún no has añadido méritos.</p>
    <p class="muted">Pulsa «Añadir mérito» para empezar a registrar tu currículum.</p>
  </div>
{:else}
  <div class="list">
    {#each grouped as sec (sec.section)}
      <section>
        <h2>{sec.section}. {sec.title}</h2>
        {#each sec.groups as grp (grp.group ?? '_')}
          {#if grp.group}<h3>{grp.group}</h3>{/if}
          <ul>
            {#each grp.items as item (item.id)}
              {@const type = getItemType(item.typeCode)}
              <li class="card item">
                <div class="item-main">
                  <p class="code">{type?.code} · {type?.label}</p>
                  <p class="title">{summary(item)}</p>
                  <p class="meta muted">
                    <span>📅 {item.fechaOrden}</span>
                    {#if item.fileName}
                      <span>· 📎 {item.fileName} ({item.pageCount} pág.)</span>
                      <span>· {effectiveMode(item)}</span>
                    {:else}
                      <span>· Sin PDF adjunto</span>
                    {/if}
                  </p>
                </div>
                <div class="item-actions">
                  <button class="small" onclick={() => onEdit(item)}>Editar</button>
                  <button class="small" onclick={() => dup(item)}>Duplicar</button>
                  <button class="small danger" onclick={() => del(item)}>Eliminar</button>
                </div>
              </li>
            {/each}
          </ul>
        {/each}
      </section>
    {/each}
  </div>
{/if}

<style>
  .empty {
    text-align: center;
    padding: 2.5rem 1rem;
  }
  .empty p {
    margin: 0.25rem 0;
  }
  .list {
    display: flex;
    flex-direction: column;
    gap: 1.2rem;
  }
  section h2 {
    font-size: 1.15rem;
    border-bottom: 2px solid var(--border);
    padding-bottom: 0.3rem;
    color: var(--accent);
  }
  section h3 {
    font-size: 1rem;
    color: var(--muted);
    margin: 0.8rem 0 0.4rem;
  }
  ul {
    list-style: none;
    margin: 0;
    padding: 0;
    display: flex;
    flex-direction: column;
    gap: 0.6rem;
  }
  .item {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 1rem;
    padding: 0.8rem 1rem;
  }
  .item-main {
    min-width: 0;
  }
  .code {
    color: var(--accent);
    font-weight: 700;
    font-size: 0.78rem;
    margin: 0;
  }
  .title {
    margin: 0.15rem 0;
    font-weight: 600;
  }
  .meta {
    margin: 0;
    font-size: 0.82rem;
    display: flex;
    flex-wrap: wrap;
    gap: 0.3rem;
  }
  .item-actions {
    display: flex;
    gap: 0.35rem;
    flex-shrink: 0;
  }
  .small {
    font-size: 0.8rem;
  }
</style>
