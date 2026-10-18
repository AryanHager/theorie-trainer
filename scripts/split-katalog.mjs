// Teilt public/data/fragen.json für die App auf:
//  * data/index.json – Kapitel, Prüfungsregeln und kompakte Metadaten aller Fragen (für Statistik, Ziehung, Filter)
//  * data/teile/<kapitel>-<n>.json – vollständige Fragen in Teilen zu höchstens TEIL Fragen je Kapitel (werden bei Bedarf geladen)
// fragen.json bleibt unverändert die Quelle für Validator, Prüfungs-Check und Tests.
import { readFileSync, writeFileSync, mkdirSync, rmSync } from 'node:fs';
import { createHash } from 'node:crypto';
const ROOT = new URL('../', import.meta.url).pathname;
const TEIL = 60;
const kat = JSON.parse(readFileSync(ROOT + 'public/data/fragen.json', 'utf8'));
const DIR = ROOT + 'public/data/teile/';
rmSync(DIR, { recursive: true, force: true }); mkdirSync(DIR, { recursive: true });
const klassen = [...new Set(kat.fragen.flatMap(f => f.klassen))];
const kapIdx = Object.fromEntries(kat.kapitel.map((k, i) => [k.id, i]));
const typen = ['auswahl', 'zahl', 'bildauswahl'];
const filme = [...new Set(kat.fragen.map(f => f.medien?.film).filter(Boolean))];
const proKap = {};
for (const f of kat.fragen) (proKap[f.kapitel] ??= []).push(f);
const teile = [], teilVon = {};
for (const k of kat.kapitel) {
  const fr = proKap[k.id] ?? [];
  for (let i = 0; i * TEIL < fr.length; i++) {
    const stueck = fr.slice(i * TEIL, (i + 1) * TEIL);
    const json = JSON.stringify(stueck);
    const hash = createHash('sha1').update(json).digest('hex').slice(0, 8);
    const name = `${k.id}-${i}.${hash}.json`;
    writeFileSync(DIR + name, json);
    for (const f of stueck) teilVon[f.id] = teile.length;
    teile.push(name);
  }
}
// kompakt: [id, mutter (0 = gleich id), variante, kapitel-Index, Klassen-Bitmaske, Punkte, Typ-Index, Film-Index+1, Flags (1 zahlenfrage, 2 beispiel), Teil]
const f = kat.fragen.map(q => [q.id, q.mutterfrageId === q.id ? 0 : q.mutterfrageId, q.variante ?? 0, kapIdx[q.kapitel],
  q.klassen.reduce((m, c) => m | (1 << klassen.indexOf(c)), 0), q.punkte, typen.indexOf(q.typ), q.medien?.film ? filme.indexOf(q.medien.film) + 1 : 0,
  (q.zahlenfrage ? 1 : 0) | (q.beispiel ? 2 : 0), teilVon[q.id]]);
const index = { meta: kat.meta, kapitel: kat.kapitel, klassen, typen, filme, teile, f };
writeFileSync(ROOT + 'public/data/index.json', JSON.stringify(index));
console.log(`index.json: ${(JSON.stringify(index).length / 1024).toFixed(0)} KB, ${teile.length} Teile, größter ${Math.max(...teile.map(n => readFileSync(DIR + n).length)) / 1024 | 0} KB`);
