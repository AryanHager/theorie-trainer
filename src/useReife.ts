// Prüfungsreife asynchron berechnen: im Web Worker, sonst nach dem ersten Zeichnen im Haupt-Thread
import { useEffect, useState } from 'react';
import type { Katalog } from './types';
import type { Zustand } from './store';
import type { Reife } from './reife';

let worker: Worker | null | undefined;
let zaehler = 0;
const warten = new Map<number, (r: Reife | null) => void>();
function holeWorker() {
  if (worker !== undefined) return worker;
  try {
    worker = new Worker(new URL('./reife.worker.ts', import.meta.url), { type: 'module' });
    worker.onmessage = (e: MessageEvent) => { warten.get(e.data.nr)?.(e.data.reife); warten.delete(e.data.nr); };
    worker.onerror = () => { worker = null; for (const [, f] of warten) f(null); warten.clear(); };
  } catch { worker = null; }
  return worker;
}
function berechnen(kat: Katalog, z: Zustand, laeufe: number): Promise<Reife | null> {
  const w = holeWorker();
  const nur = { einstellungen: z.einstellungen, fortschritt: z.fortschritt, pruefungen: z.pruefungen.map(p => ({ ...p, antworten: {} })), kalib: z.kalib };
  if (w) return new Promise(ok => { const nr = ++zaehler; warten.set(nr, ok); w.postMessage({ nr, kat: { meta: kat.meta, kapitel: kat.kapitel, fragen: kat.fragen, teile: [] }, z: nur, laeufe }); });
  return new Promise(ok => setTimeout(() => import('./reife').then(m => ok(m.pruefungsreife(kat, z, laeufe))), 50));
}

/** liefert null, solange gerechnet wird */
export function useReife(kat: Katalog, z: Zustand, laeufe: number, abh: unknown[]): Reife | null {
  const [r, setR] = useState<Reife | null>(null);
  useEffect(() => {
    let aktiv = true;
    berechnen(kat, z, laeufe).then(x => { if (aktiv) setR(x); });
    return () => { aktiv = false; };
  }, abh); // eslint-disable-line react-hooks/exhaustive-deps
  return r;
}
