import { useEffect, useState } from 'react';
import type { SchilderManifest } from './types';
let cache: Promise<SchilderManifest> | null = null;
export function ladeSchilder() {
  cache ??= fetch(import.meta.env.BASE_URL + 'signs/signs.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  return cache;
}
export function useSchilder() {
  const [m, setM] = useState<SchilderManifest | null>(null);
  const [fehler, setFehler] = useState(false);
  useEffect(() => { ladeSchilder().then(setM).catch(() => { cache = null; setFehler(true); }); }, []);
  return { m, fehler };
}
export const normSuche = (s: string) => s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/ß/g, 'ss');
export function schildPasst(s: { nr: string; name: string; kategorie: string }, q: string) {
  const t = normSuche(q.trim()); if (!t) return true;
  const h = normSuche(`${s.nr} zeichen ${s.nr} vz ${s.nr} ${s.name} ${s.kategorie}`);
  return t.split(/\s+/).every(x => h.includes(x));
}
