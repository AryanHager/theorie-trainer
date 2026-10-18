// Laden des Fragenkatalogs: zuerst nur der kleine Index (Metadaten aller Fragen),
// vollständige Fragen werden teilweise und erst bei Bedarf nachgeladen.
import { useEffect, useState } from 'react';
import type { Frage, FrageMeta, Katalog } from './types';

const BASIS = import.meta.env.BASE_URL + 'data/';
interface Index { meta: Katalog['meta']; kapitel: Katalog['kapitel']; klassen: string[]; typen: FrageMeta['typ'][]; filme: string[]; teile: string[]; f: (string | number)[][] }

let indexPromise: Promise<Katalog> | null = null;
export function ladeIndex(): Promise<Katalog> {
  return indexPromise ??= fetch(BASIS + 'index.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Index>; }).then(ix => ({
    meta: ix.meta, kapitel: ix.kapitel, teile: ix.teile,
    fragen: ix.f.map(([id, m, v, k, kl, p, t, fi, fl, teil]) => {
      const kap = ix.kapitel[k as number];
      const f: FrageMeta = { id: id as string, mutterfrageId: (m || id) as string, kapitel: kap.id, stoff: kap.stoff ?? (kap.id.startsWith('1') ? 'grundstoff' : 'zusatzstoff'),
        klassen: ix.klassen.filter((_, i) => (kl as number) & (1 << i)), punkte: p as number, typ: ix.typen[t as number], teil: teil as number };
      if (v) f.variante = v as number;
      if (fi) f.medien = { film: ix.filme[(fi as number) - 1] };
      if ((fl as number) & 1) f.zahlenfrage = true;
      if ((fl as number) & 2) f.beispiel = true;
      return f;
    }),
  })).catch(e => { indexPromise = null; throw e; });
}

const voll = new Map<string, Frage>();
const teilPromise = new Map<number, Promise<void>>();
function ladeTeil(kat: Katalog, i: number) {
  let p = teilPromise.get(i);
  if (!p) {
    p = fetch(BASIS + 'teile/' + kat.teile[i]).then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json() as Promise<Frage[]>; })
      .then(fr => { for (const f of fr) voll.set(f.id, f); }).catch(e => { teilPromise.delete(i); throw e; });
    teilPromise.set(i, p);
  }
  return p;
}
const metaVon = (kat: Katalog) => { const m = new Map(kat.fragen.map(f => [f.id, f])); return (id: string) => m.get(id); };

/** Lädt die vollständigen Fragen zu den IDs (in dieser Reihenfolge, unbekannte IDs entfallen) */
export async function ladeFragen(kat: Katalog, ids: string[]): Promise<Frage[]> {
  const meta = metaVon(kat);
  const noetig = new Set(ids.filter(id => !voll.has(id)).map(id => meta(id)?.teil).filter((t): t is number => t !== undefined));
  await Promise.all([...noetig].map(i => ladeTeil(kat, i)));
  return ids.map(id => voll.get(id)).filter((f): f is Frage => !!f);
}
export const ladeAlle = (kat: Katalog) => ladeFragen(kat, kat.fragen.map(f => f.id));

/** React-Hook: vollständige Fragen zu IDs; null, solange sie geladen werden */
export function useVolleFragen(kat: Katalog, ids: string[] | null): { fragen: Frage[] | null; fehler: string | null } {
  const sofort = () => ids && ids.every(id => voll.has(id)) ? ids.map(id => voll.get(id)!) : null;
  const [stand, setStand] = useState<{ ids: string[] | null; fragen: Frage[] | null }>(() => ({ ids, fragen: sofort() }));
  const [fehler, setFehler] = useState<string | null>(null);
  const aktuell = stand.ids === ids ? stand.fragen : sofort();
  useEffect(() => {
    if (!ids) return;
    let aktiv = true;
    ladeFragen(kat, ids).then(fr => { if (aktiv) setStand({ ids, fragen: fr }); }).catch(e => aktiv && setFehler('Fragen konnten nicht geladen werden (' + e.message + ').'));
    return () => { aktiv = false; };
  }, [kat, ids]);
  return { fragen: aktuell, fehler };
}
