import * as db from '../db';
import type { Profile } from '../types';

class ProfileStore {
  profile = $state<Profile>(db.emptyProfile());
  loaded = $state(false);
  private timer: ReturnType<typeof setTimeout> | null = null;

  async load() {
    this.profile = await db.getProfile();
    this.loaded = true;
  }

  /** Persiste con debounce de 300 ms (autosave). */
  scheduleSave() {
    if (this.timer) clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      void db.saveProfile($state.snapshot(this.profile));
    }, 300);
  }

  async saveNow() {
    if (this.timer) clearTimeout(this.timer);
    await db.saveProfile($state.snapshot(this.profile));
  }

  get isReady(): boolean {
    return this.profile.nombreApellidos.trim().length > 0;
  }
}

export const profileStore = new ProfileStore();
