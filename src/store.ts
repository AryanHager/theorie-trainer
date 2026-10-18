import { useSyncExternalStore } from 'react';
import type { Eingabe, PruefungsArt } from './types';

export interface Einstellungen {
  /** optionaler Vorname für die Begrüßung – nur lokal gespeichert */
  name: string;
  klassen: string[]; pruefKlasse?: string; pruefArt?: PruefungsArt; theme: 'auto' | 'hell' | 'dunkel'; vorlesen: boolean; autoVorlesen: boolean; ton: boolean;
  /** Variationen (Varianten einer Mutterfrage) beim Lernen einbeziehen */
  variationen: boolean;
  /** Prüfung: wie oft eine Filmszene höchstens abgespielt werden darf (Annahme, einstellbar) */
  filmMax: number;
  /** Antworten einer Filmfrage erst nach dem ersten vollständigen Ansehen freigeben */
  filmErstAnsehen: boolean;
  /** Tagesziel in beantworteten Fragen */
  tagesziel: number;
  /** geplanter Prüfungstermin (ISO-Datum) für den Lernplan */
  pruefungstermin?: string;
  /** hoher Kontrast */
  kontrast: boolean;
  /** größere Schrift */
  grosseSchrift: boolean;
}
export interface Fortschritt { r: number; f: number; zuletzt: 'r' | 'f' | null; serie: number; ts: number }
export interface PruefungsErgebnis {
  id: string; datum: number; klassen: string[]; fragenIds: string[]; antworten: Record<string, Eingabe>;
  fehlerpunkte: number; bestanden: boolean; grund: string; dauerSek: number; zeitAbgelaufen: boolean;
  klasse?: string; art?: PruefungsArt; maxFehlerpunkte?: number;
}
export interface AktivePruefung {
  fragenIds: string[]; antworten: Record<string, Eingabe>; markiert: string[]; start: number; dauerMin: number; klassen: string[];
  klasse?: string; art?: PruefungsArt; maxFehlerpunkte?: number; fuenferRegel?: boolean;
  /** Filmfragen: Anzahl Abspielungen und vollständig gesehene Szenen */
  filmAbgespielt?: Record<string, number>; filmGesehen?: string[]; filmMax?: number;
}
export interface Zustand {
  einstellungen: Einstellungen;
  fortschritt: Record<string, Fortschritt>;
  markiert: string[];
  pruefungen: PruefungsErgebnis[];
  aktivePruefung: AktivePruefung | null;
  /** persönliche Notizen je Frage */
  notizen: Record<string, string>;
  /** beantwortete Fragen je Kalendertag (YYYY-MM-DD, lokale Zeit) */
  tage: Record<string, number>;
  /** Kalibrierung der Prüfungsreife: wie oft war die nächste Antwort je Vorstatus richtig */
  kalib: Partial<Record<Status, { n: number; r: number }>>;
}

const KEY = 'theorie-trainer:v1';
const start: Zustand = {
  einstellungen: { name: '', klassen: ['B'], theme: 'auto', vorlesen: true, autoVorlesen: false, ton: true, variationen: true, filmMax: 5, filmErstAnsehen: true, tagesziel: 30, kontrast: false, grosseSchrift: false },
  fortschritt: {}, markiert: [], pruefungen: [], aktivePruefung: null, notizen: {}, tage: {}, kalib: {},
};
function laden(): Zustand {
  try {
    const s = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (s) return { ...start, ...s, einstellungen: { ...start.einstellungen, ...s.einstellungen } };
  } catch { /* ignorieren */ }
  return start;
}
let zustand = laden();
const hoerer = new Set<() => void>();

export function getZustand() { return zustand; }
export function setZustand(fn: (z: Zustand) => Zustand) {
  zustand = fn(zustand);
  try { localStorage.setItem(KEY, JSON.stringify(zustand)); } catch { /* voll */ }
  hoerer.forEach(h => h());
}
export function useZustand() {
  return useSyncExternalStore(cb => { hoerer.add(cb); return () => hoerer.delete(cb); }, () => zustand);
}

export function ergebnisSpeichern(id: string, richtig: boolean) {
  setZustand(z => {
    const alt = z.fortschritt[id] ?? { r: 0, f: 0, zuletzt: null, serie: 0, ts: 0 };
    const neu: Fortschritt = richtig
      ? { ...alt, r: alt.r + 1, zuletzt: 'r', serie: alt.serie + 1, ts: Date.now() }
      : { ...alt, f: alt.f + 1, zuletzt: 'f', serie: 0, ts: Date.now() };
    const tag = heute();
    const vor = status(z.fortschritt[id]), k = z.kalib[vor] ?? { n: 0, r: 0 };
    const kalib = { ...z.kalib, [vor]: { n: k.n + 1, r: k.r + (richtig ? 1 : 0) } };
    return { ...z, kalib, fortschritt: { ...z.fortschritt, [id]: neu }, tage: { ...z.tage, [tag]: (z.tage[tag] ?? 0) + 1 } };
  });
}
export function heute(d = new Date()) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
/** Lernserie: aufeinanderfolgende Tage (bis heute bzw. gestern) mit erreichtem Tagesziel */
export function serieTage(tage: Record<string, number>, ziel: number) {
  const d = new Date();
  if ((tage[heute(d)] ?? 0) < ziel) d.setDate(d.getDate() - 1);
  let n = 0;
  while ((tage[heute(d)] ?? 0) >= ziel) { n++; d.setDate(d.getDate() - 1); }
  return n;
}
export function notizSetzen(id: string, text: string) {
  setZustand(z => {
    const n = { ...z.notizen };
    if (text.trim()) n[id] = text; else delete n[id];
    return { ...z, notizen: n };
  });
}
export function markierenUmschalten(id: string) {
  setZustand(z => ({ ...z, markiert: z.markiert.includes(id) ? z.markiert.filter(x => x !== id) : [...z.markiert, id] }));
}
export function einstellungSetzen<K extends keyof Einstellungen>(k: K, v: Einstellungen[K]) {
  setZustand(z => ({ ...z, einstellungen: { ...z.einstellungen, [k]: v } }));
}
export function fortschrittZuruecksetzen() {
  setZustand(z => ({ ...z, fortschritt: {}, markiert: [], pruefungen: [], tage: {}, kalib: {} }));
}

import { status, type Status } from './status';
export { status, type Status };
export const STATUS_TEXT: Record<Status, string> = { neu: 'Neu', falsch: 'Falsch', einmal: '1× richtig', sicher: 'Sicher' };
