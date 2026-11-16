// Armazenamento local por visitante (localStorage). Substituível por cache de API.
import type { DemoState } from "@/lib/domain/models";
import { makeSeed } from "@/lib/domain/seed";

const KEY = "alimentabot-demo-v1";
let state: DemoState | null = null;
const listeners = new Set<() => void>();

function load(): DemoState {
  if (typeof window === "undefined") return makeSeed(new Date());
  try {
    const raw = window.localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as DemoState;
      if (parsed?.versao === 1 && Array.isArray(parsed.lotes)) return parsed;
    }
  } catch {
    /* ignora dados corrompidos */
  }
  const seed = makeSeed(new Date());
  window.localStorage.setItem(KEY, JSON.stringify(seed));
  return seed;
}

export function getState(): DemoState {
  if (!state) state = load();
  return state;
}

export function setState(next: DemoState) {
  state = next;
  if (typeof window !== "undefined") window.localStorage.setItem(KEY, JSON.stringify(next));
  listeners.forEach((l) => l());
}

export function resetState() {
  setState(makeSeed(new Date()));
}

export function subscribe(fn: () => void) {
  listeners.add(fn);
  const onStorage = (e: StorageEvent) => {
    if (e.key === KEY) {
      state = null;
      fn();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(fn);
    window.removeEventListener("storage", onStorage);
  };
}
