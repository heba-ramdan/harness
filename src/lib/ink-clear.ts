// Module-level holder for Ink's clear() — resets its internal render tracking.
// Set once at startup from index.tsx, called from MultilineInput after editor exits.

let clear: (() => void) | null = null;

export function setInkClear(fn: () => void) {
  clear = fn;
}

export function inkClear() {
  clear?.();
}
