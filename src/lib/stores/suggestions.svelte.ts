import { collectSuggestions } from '../suggestions';
import { itemsStore } from './items.svelte';

/**
 * Diccionario reactivo de sugerencias derivado de los items.
 * Se recalcula automáticamente cuando cambian los items.
 */
class SuggestionsStore {
  map = $derived(collectSuggestions(itemsStore.items));

  for(fieldKey: string): string[] {
    return this.map[fieldKey] ?? [];
  }
}

export const suggestionsStore = new SuggestionsStore();
