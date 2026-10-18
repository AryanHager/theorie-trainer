// Prüfungsreife: geschätzte Wahrscheinlichkeit, eine Prüfung jetzt zu bestehen.
// Modell (ANNAHME, dokumentiert in docs/annahmen.md):
//  1. Jede Frage erhält eine Trefferwahrscheinlichkeit nach ihrem Lernstatus. Startwerte (Prior)
//     werden mit den eigenen Antworten kalibriert: p(Status) = (r + k·prior) / (n + k), k = 12,
//     wobei n/r zählen, wie oft eine Frage mit diesem Vorstatus danach richtig beantwortet wurde.
//  2. Monte-Carlo: viele Prüfungen werden nach den echten Ziehungsregeln (pruefungZiehen) gezogen und
//     mit diesen Wahrscheinlichkeiten „beantwortet“; bewertet wird mit Fehlerpunkten und 5-Punkte-Regel.
//  3. Liegen eigene Prüfungssimulationen vor, wird das Ergebnis mit deren Bestehensquote der letzten
//     (höchstens 5) Simulationen gemischt – Gewicht wächst mit der Anzahl (je 10 %, max. 40 %).
import type { Katalog } from './types';
import { bewertenNach, pruefungsArten, pruefungsRegel, pruefungZiehen } from './logic';
import { status, type Status } from './status';
import type { Zustand } from './store';

export const PRIOR: Record<Status, number> = { neu: 0.45, falsch: 0.4, einmal: 0.8, sicher: 0.95 };
const K = 12;

export function trefferWahrscheinlichkeiten(z: Zustand): Record<Status, number> {
  const r = {} as Record<Status, number>;
  for (const s of Object.keys(PRIOR) as Status[]) { const c = z.kalib?.[s] ?? { n: 0, r: 0 }; r[s] = (c.r + K * PRIOR[s]) / (c.n + K); }
  return r;
}

export interface Reife { wahrscheinlichkeit: number; simuliert: number; ausPruefungen: number | null; klasse: string; p: Record<Status, number>; erwarteteFP: number }
export function pruefungsreife(kat: Katalog, z: Zustand, laeufe = 160): Reife | null {
  const klasse = z.einstellungen.pruefKlasse && z.einstellungen.klassen.includes(z.einstellungen.pruefKlasse) ? z.einstellungen.pruefKlasse : z.einstellungen.klassen.find(k => pruefungsArten(kat, k).length);
  if (!klasse) return null;
  const art = pruefungsArten(kat, klasse).includes(z.einstellungen.pruefArt ?? 'ersterwerb') ? (z.einstellungen.pruefArt ?? 'ersterwerb') : pruefungsArten(kat, klasse)[0];
  const regel = pruefungsRegel(kat, klasse, art);
  const p = trefferWahrscheinlichkeiten(z);
  const byId = new Map(kat.fragen.map(f => [f.id, f]));
  // deterministischer Zufall, damit die Anzeige nicht bei jedem Rendern springt
  let seed = 12345;
  const zufall = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
  const mr = Math.random; Math.random = zufall;
  let bestanden = 0, fpSumme = 0;
  try {
    for (let i = 0; i < laeufe; i++) {
      const ids = pruefungZiehen(kat, klasse, art).ids;
      const fragen = ids.map(id => byId.get(id)!);
      const ok = new Set(fragen.filter(f => zufall() < p[status(z.fortschritt[f.id])]).map(f => f.id));
      const b = bewertenNach(fragen, f => ok.has(f.id), regel.maxFehlerpunkte, regel.fuenferRegel);
      if (b.bestanden) bestanden++; fpSumme += b.fehlerpunkte;
    }
  } finally { Math.random = mr; }
  const sim = bestanden / laeufe;
  const letzte = z.pruefungen.filter(x => !x.klasse || x.klasse === klasse).slice(0, 5);
  const quote = letzte.length ? letzte.filter(x => x.bestanden).length / letzte.length : null;
  const gew = quote === null ? 0 : Math.min(0.4, letzte.length * 0.1);
  return { wahrscheinlichkeit: sim * (1 - gew) + (quote ?? 0) * gew, simuliert: sim, ausPruefungen: quote, klasse, p, erwarteteFP: fpSumme / laeufe };
}
