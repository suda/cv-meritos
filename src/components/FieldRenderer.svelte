<script lang="ts">
  import type { Author, DateRange, FieldDef, Profile } from '../lib/types';
  import AuthorListField from './AuthorListField.svelte';

  let {
    field,
    value = $bindable(),
    suggestions = [],
    profile,
    invalid = false,
  }: {
    field: FieldDef;
    value: unknown;
    suggestions?: string[];
    profile: Profile;
    invalid?: boolean;
  } = $props();

  const datalistId = $derived(`dl-${field.key}`);
  const fieldId = $derived(`field-${field.key}`);

  // Helpers tipados para bindings de tipos compuestos.
  function asString(): string {
    return typeof value === 'string' ? value : value == null ? '' : String(value);
  }
  function asRange(): DateRange {
    if (value && typeof value === 'object' && 'inicio' in (value as object)) {
      return value as DateRange;
    }
    return { inicio: '', fin: '' };
  }
</script>

<div class="field">
  {#if field.type !== 'authorList'}
    <label for={fieldId}>
      {field.label}
      {#if field.required}<span class="required-mark" aria-hidden="true">*</span>{/if}
    </label>
  {:else}
    <span class="field-label" id={`${fieldId}-label`}>
      {field.label}
      {#if field.required}<span class="required-mark" aria-hidden="true">*</span>{/if}
    </span>
  {/if}

  {#if field.type === 'text'}
    <input
      id={fieldId}
      type="text"
      value={asString()}
      oninput={(e) => (value = e.currentTarget.value)}
      list={field.suggest ? datalistId : undefined}
      aria-invalid={invalid}
      required={field.required}
    />
    {#if field.suggest}
      <datalist id={datalistId}>
        {#each suggestions as s (s)}<option value={s}></option>{/each}
      </datalist>
    {/if}
  {:else if field.type === 'textarea'}
    <textarea
      id={fieldId}
      value={asString()}
      oninput={(e) => (value = e.currentTarget.value)}
      aria-invalid={invalid}
      required={field.required}
    ></textarea>
  {:else if field.type === 'number'}
    <input
      id={fieldId}
      type="number"
      value={asString()}
      oninput={(e) => (value = e.currentTarget.value)}
      aria-invalid={invalid}
    />
  {:else if field.type === 'year'}
    <input
      id={fieldId}
      type="number"
      inputmode="numeric"
      min="1900"
      max="2100"
      placeholder="AAAA"
      value={asString()}
      oninput={(e) => (value = e.currentTarget.value)}
      aria-invalid={invalid}
    />
  {:else if field.type === 'date'}
    <input
      id={fieldId}
      type="date"
      value={asString()}
      oninput={(e) => (value = e.currentTarget.value)}
      aria-invalid={invalid}
    />
  {:else if field.type === 'daterange'}
    {@const r = asRange()}
    <div class="row daterange">
      <div>
        <span class="sub">Inicio</span>
        <input
          id={fieldId}
          type="date"
          value={r.inicio ?? ''}
          oninput={(e) => (value = { ...asRange(), inicio: e.currentTarget.value })}
          aria-label={`${field.label} — inicio`}
        />
      </div>
      <div>
        <span class="sub">Fin</span>
        <input
          type="date"
          value={r.fin ?? ''}
          oninput={(e) => (value = { ...asRange(), fin: e.currentTarget.value })}
          aria-label={`${field.label} — fin`}
        />
      </div>
    </div>
  {:else if field.type === 'select'}
    <select
      id={fieldId}
      value={asString()}
      onchange={(e) => (value = e.currentTarget.value)}
      aria-invalid={invalid}
      required={field.required}
    >
      <option value="">— Selecciona —</option>
      {#each field.options ?? [] as opt (opt)}
        <option value={opt}>{opt}</option>
      {/each}
    </select>
  {:else if field.type === 'authorList'}
    <AuthorListField
      value={Array.isArray(value) ? (value as Author[]) : []}
      {profile}
      id={fieldId}
      onUpdate={(authors) => (value = authors)}
    />
  {/if}

  {#if invalid}
    <p class="error">Este campo es obligatorio.</p>
  {/if}
</div>

<style>
  .field-label {
    font-weight: 600;
    font-size: 0.85rem;
    color: var(--muted);
    display: block;
    margin-bottom: 0.25rem;
  }
  .daterange {
    align-items: flex-end;
  }
  .daterange > div {
    flex: 1;
  }
  .sub {
    font-size: 0.75rem;
    color: var(--muted);
    display: block;
    margin-bottom: 0.1rem;
  }
</style>
