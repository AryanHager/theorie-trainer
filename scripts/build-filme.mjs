// Erzeugt public/data/filme.json aus content/filme.mjs (eigene animierte Szenen) und prüft die Daten.
import { readFileSync, writeFileSync } from 'node:fs';
import { FILME } from '../content/filme.mjs';
const ROOT = new URL('..', import.meta.url).pathname;
const signs = Object.fromEntries(JSON.parse(readFileSync(ROOT + 'public/signs/signs.json', 'utf8')).schilder.map(s => [s.nr, s]));
const ARTEN = ['pkw', 'lkw', 'bus', 'transporter', 'krad', 'rad', 'fussg', 'kind', 'ball', 'reh', 'traktor', 'polizei', 'rtw', 'tram', 'roller', 'hund', 'kinderwagen', 'rollstuhl', 'bake', 'kegel'];
const fehler = [], ids = new Set();
for (const f of FILME) {
  const wo = `Film ${f.id}`;
  if (ids.has(f.id)) fehler.push(`${wo}: doppelte ID`); ids.add(f.id);
  if (!(f.dauer > 0 && f.dauer <= 20)) fehler.push(`${wo}: Dauer ${f.dauer}`);
  if (!(f.poster >= 0 && f.poster <= f.dauer)) fehler.push(`${wo}: Posterzeit`);
  if (!f.beschreibung || f.beschreibung.length < 60) fehler.push(`${wo}: Textbeschreibung fehlt/zu kurz`);
  if (f.objekte.filter(o => o.ich).length !== 1) fehler.push(`${wo}: genau ein eigenes Fahrzeug nötig`);
  const oid = new Set();
  for (const o of f.objekte) {
    if (!ARTEN.includes(o.art)) fehler.push(`${wo}: Objektart ${o.art}`);
    if (oid.has(o.id)) fehler.push(`${wo}: Objekt-ID ${o.id} doppelt`); oid.add(o.id);
    for (let i = 1; i < o.bahn.length; i++) if (o.bahn[i][0] < o.bahn[i - 1][0]) fehler.push(`${wo}: Bahn von ${o.id} nicht zeitlich sortiert`);
    for (const feld of ['brems', 'tuer', 'blaulicht', 'rueckfahr', 'blinker']) if (o[feld] && !(Array.isArray(o[feld]) && o[feld].every(z => Array.isArray(z) && z.length >= 2))) fehler.push(`${wo}: ${feld} von ${o.id} muss eine Liste von Zeiträumen sein`);
    if (o.sichtbar && !(Array.isArray(o.sichtbar) && o.sichtbar.length === 2)) fehler.push(`${wo}: sichtbar von ${o.id}`);
    if (o.bahn.some(k => k.some(n => !Number.isFinite(n)))) fehler.push(`${wo}: Bahn von ${o.id} enthält ungültige Werte`);
  }
  for (const s of f.schilder ?? []) { if (!signs[s.nr]) fehler.push(`${wo}: Zeichen ${s.nr} unbekannt`); else s.datei = signs[s.nr].datei; }
}
if (fehler.length) { console.error(fehler.join('\n')); process.exit(1); }
writeFileSync(ROOT + 'public/data/filme.json', JSON.stringify({ hinweis: 'Eigene, schematische Animationen (Draufsicht) dieses Projekts – keine amtlichen Prüfungsvideos.', filme: FILME }));
console.log(`${FILME.length} Filmszenen geschrieben`);
