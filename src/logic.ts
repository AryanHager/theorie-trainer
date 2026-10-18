import type { Eingabe, Frage, FrageMeta, Katalog, PruefungsArt, PruefungsRegel } from './types';

export function istRichtig(f: Frage, e: Eingabe | undefined): boolean {
  if (e === undefined) return false;
  if (f.typ === 'zahl') {
    if (typeof e !== 'string' || !f.zahl) return false;
    const n = parseFloat(e.replace(',', '.').trim());
    if (Number.isNaN(n)) return false;
    return Math.abs(n - f.zahl.wert) <= (f.zahl.toleranz ?? 0) + 1e-9;
  }
  if (!Array.isArray(e) || !f.antworten) return false;
  return f.antworten.every((a, i) => a.richtig === e.includes(i));
}

export function istBeantwortet(f: FrageMeta, e: Eingabe | undefined): boolean {
  if (e === undefined) return false;
  return f.typ === 'zahl' ? typeof e === 'string' && e.trim() !== '' : Array.isArray(e) && e.length > 0;
}

export function passtZuKlassen(f: FrageMeta, klassen: string[]) {
  return f.klassen.some(k => klassen.includes(k));
}

export function mischen<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; }
  return a;
}

export function medienUrl(p?: string | null) {
  if (!p) return null;
  if (/^(https?:|data:|\/)/.test(p)) return p;
  return import.meta.env.BASE_URL + p;
}

export function zahlFormat(n: number) { return n.toLocaleString('de-DE'); }

export function richtigeAntwortText(f: Frage) {
  if (f.typ === 'zahl') return `${zahlFormat(f.zahl!.wert)} ${f.zahl!.einheit ?? ''}`.trim();
  return f.antworten!.filter(a => a.richtig).map(a => a.text).join(' · ');
}

export const KLASSEN_INFO: { id: string; d: string }[] = [
  { id: 'B', d: 'Pkw bis 3,5 t' }, { id: 'A', d: 'Motorrad (unbeschränkt)' }, { id: 'A2', d: 'Motorrad bis 35 kW' },
  { id: 'A1', d: 'Leichtkraftrad bis 125 cm³' }, { id: 'AM', d: 'Kleinkraftrad bis 45 km/h' }, { id: 'Mofa', d: 'Mofa bis 25 km/h (Prüfbescheinigung)' },
  { id: 'L', d: 'Land-/forstw. Zugmaschine bis 40 km/h' }, { id: 'T', d: 'Land-/forstw. Zugmaschine bis 60 km/h' },
  { id: 'C1', d: 'Lkw bis 7,5 t' }, { id: 'C', d: 'Lkw über 3,5 t' }, { id: 'CE', d: 'Lkw mit Anhänger' },
  { id: 'D1', d: 'Kleinbus bis 16 Fahrgäste' }, { id: 'D', d: 'Bus' },
];
export const ART_TEXT: Record<PruefungsArt, string> = { ersterwerb: 'Ersterwerb', erweiterung: 'Erweiterung' };

/** Verfügbare Prüfungsarten einer Klasse laut Katalog-Metadaten */
export function pruefungsArten(kat: Katalog, klasse: string): PruefungsArt[] {
  const r = kat.meta.pruefung?.klassen?.[klasse] ?? {};
  return (['ersterwerb', 'erweiterung'] as const).filter(a => r[a]);
}

const STANDARD: PruefungsRegel = { fragen: 30, punkte: 110, maxFehlerpunkte: 10, fuenferRegel: true, grundstoff: 20, zusatzstoff: 10, dauerMin: 45 };
/** Prüfungsregel für eine Klasse und Art (FeV Anlage 7); Fallback: Klasse-B-Ersterwerb */
export function pruefungsRegel(kat: Katalog, klasse: string, art: PruefungsArt): PruefungsRegel {
  const r = kat.meta.pruefung?.klassen?.[klasse];
  return r?.[art] ?? r?.ersterwerb ?? r?.erweiterung ?? STANDARD;
}

export interface Ziehung { ids: string[]; punkte: number; fehlendGrund: number; fehlendZusatz: number; aufgefuellt: number; filme: number }
/** ANNAHME: Anteil Filmfragen je Prüfung (keine amtliche Zahl geprüft) – so viele werden, falls vorhanden, im Grundstoff gesetzt. */
export const FILMFRAGEN_JE_PRUEFUNG = 3;
/**
 * Zieht Prüfungsfragen für eine Klasse: je Mutterfrage höchstens eine Variante,
 * Grundstoff (passend zur Klasse) + Zusatzstoff (nur Fragen dieser Klasse). Anschließend
 * werden Fragen gleicher Stoffart getauscht, bis die Punktsumme möglichst genau der amtlichen
 * Summe entspricht. Reicht der Zusatzstoff nicht, wird mit Grundstoff aufgefüllt (und gemeldet).
 */
export function pruefungZiehen(kat: Katalog, klasse: string, art: PruefungsArt): Ziehung {
  const r = pruefungsRegel(kat, klasse, art);
  const jeMutter = new Map<string, FrageMeta[]>();
  for (const f of kat.fragen) if (f.klassen.includes(klasse)) jeMutter.set(f.mutterfrageId, [...(jeMutter.get(f.mutterfrageId) ?? []), f]);
  const eine = mischen([...jeMutter.values()].map(v => v[Math.floor(Math.random() * v.length)]));
  const grundAlle = eine.filter(f => f.stoff === 'grundstoff');
  // Filmfragen nur über die feste Quote (Grundstoff); weitere Filmfragen – auch im Zusatzstoff – bleiben dem Lernmodus vorbehalten
  const zusatzPool = eine.filter(f => f.stoff === 'zusatzstoff' && !f.medien?.film);
  const z = zusatzPool.slice(0, r.zusatzstoff);
  const fehlendZusatz = r.zusatzstoff - z.length;
  const quote = r.grundKapitel;
  // Grundstoff: je Sachgebiet die vorgeschriebene Fragenzahl (Prüfungsrichtlinie), Filmfragen zählen im eigenen Sachgebiet mit
  const g: FrageMeta[] = []; const reserveGrund: Record<string, FrageMeta[]> = {};
  let fehlendGrund = 0;
  if (quote) {
    const filme: FrageMeta[] = [];
    const tol0 = r.kapitelToleranz ?? Infinity;
    for (const f of grundAlle) {
      if (!f.medien?.film || filme.length >= FILMFRAGEN_JE_PRUEFUNG || !quote[f.kapitel]) continue;
      const [n, p] = quote[f.kapitel], fk = filme.filter(x => x.kapitel === f.kapitel);
      // nur, wenn das Sachgebiet mit den übrigen Plätzen (mind. 3 Punkte je FrageMeta) in der Punkt-Toleranz bleiben kann
      if (fk.length < n && fk.reduce((s, x) => s + x.punkte, f.punkte) + (n - fk.length - 1) * 3 <= p + tol0) filme.push(f);
    }
    for (const [kap, [n]] of Object.entries(quote)) {
      const fk = filme.filter(f => f.kapitel === kap);
      const pool = grundAlle.filter(f => f.kapitel === kap && !f.medien?.film);
      const soll = n - fk.length;
      g.push(...fk, ...pool.slice(0, soll));
      reserveGrund[kap] = pool.slice(soll);
      fehlendGrund += Math.max(0, soll - pool.length);
    }
    // zu kleiner Zusatzstoff: mit weiterem Grundstoff auffüllen (wird gemeldet)
    for (let i = 0; i < fehlendZusatz; i++) {
      const kap = Object.keys(reserveGrund).find(k => reserveGrund[k].length); if (!kap) break;
      g.push(reserveGrund[kap].shift()!);
    }
  } else {
    const filmGrund = grundAlle.filter(f => f.medien?.film).slice(0, FILMFRAGEN_JE_PRUEFUNG);
    const grundPool = [...filmGrund, ...grundAlle.filter(f => !f.medien?.film)];
    const gSoll = r.grundstoff + fehlendZusatz;
    g.push(...grundPool.slice(0, gSoll));
    reserveGrund.alle = grundPool.slice(gSoll);
    fehlendGrund = Math.max(0, r.grundstoff - g.length);
  }
  // Punktsumme annähern: Tausch innerhalb derselben Stoffart (Grundstoff: innerhalb desselben Sachgebiets);
  // Punkte je Sachgebiet bleiben innerhalb der Toleranz der Prüfungsrichtlinie
  const auswahl = [...g, ...z];
  const reserveZusatz = zusatzPool.slice(r.zusatzstoff);
  const tol = r.kapitelToleranz ?? Infinity;
  const kapPunkte = (a: FrageMeta[]) => { const m: Record<string, number> = {}; for (const f of a) if (f.stoff === 'grundstoff') m[f.kapitel] = (m[f.kapitel] ?? 0) + f.punkte; return m; };
  const kosten = (a: FrageMeta[]) => {
    const summe = a.reduce((s, f) => s + f.punkte, 0); let k = Math.abs(r.punkte - summe) * 10;
    if (quote) { const m = kapPunkte(a); for (const [kap, [, p]] of Object.entries(quote)) k += Math.max(0, Math.abs((m[kap] ?? 0) - p) - tol) * 25; }
    return k;
  };
  // Grundstoff zuerst je Sachgebiet in die Toleranz bringen (Zufallsauswahl mit Wiederholung), danach Gesamtsumme über Tausch
  if (quote) for (const [kap, [n, p]] of Object.entries(quote)) {
    const idx = auswahl.map((f, i) => f.stoff === 'grundstoff' && f.kapitel === kap ? i : -1).filter(i => i >= 0);
    const res = reserveGrund[kap] ?? [];
    for (let v = 0; v < 300; v++) {
      const s = idx.reduce((x, i) => x + auswahl[i].punkte, 0);
      if (Math.abs(s - p) <= tol || !res.length || !idx.length) break;
      const i = idx[Math.floor(Math.random() * idx.length)], alt = auswahl[i];
      if (alt.medien?.film) continue;
      const k = res.findIndex(nf => Math.abs(s - alt.punkte + nf.punkte - p) < Math.abs(s - p));
      if (k < 0) continue;
      auswahl[i] = res[k]; res.splice(k, 1, alt);
    }
    void n;
  }
  let aktuell = kosten(auswahl);
  for (let runde = 0; runde < 3000 && aktuell > 0; runde++) {
    const i = Math.floor(Math.random() * auswahl.length);
    const alt = auswahl[i];
    if (alt.medien?.film) continue; // gesetzte Filmfragen bleiben
    const res = alt.stoff === 'zusatzstoff' ? reserveZusatz : quote ? reserveGrund[alt.kapitel] : reserveGrund.alle;
    if (!res?.length) continue;
    const k = Math.floor(Math.random() * res.length), neu = res[k];
    if (neu.punkte === alt.punkte) continue;
    auswahl[i] = neu;
    const c = kosten(auswahl);
    if (c <= aktuell) { res.splice(k, 1, alt); aktuell = c; } else auswahl[i] = alt;
  }
  const summe = auswahl.reduce((s, f) => s + f.punkte, 0);
  // Reihenfolge: gemischt, wie in der echten Prüfung
  return { ids: mischen(auswahl).map(f => f.id), punkte: summe, fehlendGrund, fehlendZusatz, aufgefuellt: Math.max(0, fehlendZusatz), filme: auswahl.filter(f => f.medien?.film).length };
}

/** Punkte je Grundstoff-Sachgebiet einer Ziehung (für Prüfung der Richtlinien-Toleranz) */
export function grundPunkteJeKapitel(fragen: FrageMeta[]) {
  const m: Record<string, { n: number; p: number }> = {};
  for (const f of fragen) if (f.stoff === 'grundstoff') { const e = (m[f.kapitel] ??= { n: 0, p: 0 }); e.n++; e.p += f.punkte; }
  return m;
}

export interface Bewertung { fehlerpunkte: number; falsch: string[]; fuenferFalsch: number; bestanden: boolean; grund: string }
export function pruefungBewerten(fragen: Frage[], antworten: Record<string, Eingabe>, maxFP = 10, fuenferRegel = true): Bewertung {
  return bewertenNach(fragen, f => istRichtig(f, antworten[f.id]), maxFP, fuenferRegel);
}
/** Bewertung, wenn bereits feststeht, welche Fragen richtig beantwortet sind */
export function bewertenNach<T extends FrageMeta>(fragen: T[], richtig: (f: T) => boolean, maxFP = 10, fuenferRegel = true): Bewertung {
  let fp = 0, fuenfer = 0; const falsch: string[] = [];
  for (const f of fragen) {
    if (!richtig(f)) { fp += f.punkte; falsch.push(f.id); if (f.punkte === 5) fuenfer++; }
  }
  let bestanden = true, grund = `Bestanden mit ${fp} Fehlerpunkt${fp === 1 ? '' : 'en'}.`;
  if (fp > maxFP) { bestanden = false; grund = `Nicht bestanden: ${fp} Fehlerpunkte (erlaubt sind höchstens ${maxFP}).`; }
  else if (fuenferRegel && fuenfer >= 2) { bestanden = false; grund = 'Nicht bestanden: Zwei Fragen mit 5 Fehlerpunkten wurden falsch beantwortet.'; }
  return { fehlerpunkte: fp, falsch, fuenferFalsch: fuenfer, bestanden, grund };
}
