import { useSyncExternalStore } from "react";

export type Preferences = { notifications: boolean; theme: "dark" | "light" };

const KEY = "scamshield.preferences";
const DEFAULTS: Preferences = { notifications: true, theme: "dark" };
let state: Preferences | null = null;
const listeners = new Set<() => void>();

function read(): Preferences {
  if (state) return state;
  try {
    const parsed = JSON.parse(localStorage.getItem(KEY) ?? "null") as Partial<Preferences> | null;
    state = { ...DEFAULTS, ...parsed };
  } catch {
    state = { ...DEFAULTS };
  }
  return state;
}

function update(patch: Partial<Preferences>) {
  const next = { ...read(), ...patch };
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(next));
  } catch {
    // Keep the current session usable when storage is disabled or full.
  }
  listeners.forEach((listener) => listener());
}

export const preferencesStore = {
  setNotifications(notifications: boolean) {
    update({ notifications });
  },
  setTheme(theme: Preferences["theme"]) {
    update({ theme });
  },
};

export function usePreferences() {
  return useSyncExternalStore(
    (listener) => {
      listeners.add(listener);
      const onStorage = (event: StorageEvent) => {
        if (event.key === KEY) {
          state = null;
          listeners.forEach((subscriber) => subscriber());
        }
      };
      window.addEventListener("storage", onStorage);
      return () => {
        listeners.delete(listener);
        window.removeEventListener("storage", onStorage);
      };
    },
    read,
    () => DEFAULTS,
  );
}
