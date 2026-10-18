// Validierung des Fragenkatalogs: Schema/Felder, eindeutige IDs, Antworten, Medienpfade,
// Beinahe-Duplikate und Verteilungsbericht Klasse/Kapitel vs. amtlicher Zielgröße.
// Aufruf: node scripts/validate.mjs [--streng]  (Exit-Code 1 bei Fehlern)
import { readFileSync, existsSync } from 'node:fs';
const ROOT = new URL('../', import.meta.url).pathname;
const kat = JSON.parse(readFileSync(ROOT + 'public/data/fragen.json', 'utf8'));
const fehler = [], warnungen = [];
const F = (id, m) => fehler.push(`${id}: ${m}`), W = (id, m) => warnungen.push(`${id}: ${m}`);

const KLASSEN = new Set(kat.meta?.klassen ?? []);
const KAPITEL = new Map((kat.kapitel ?? []).map(k => [k.id, k]));
if (!KLASSEN.size) F('meta', 'meta.klassen fehlt');
if (!KAPITEL.size) F('kapitel', 'Kapitelliste fehlt');

// Prüfungsregeln
const P = kat.meta?.pruefung?.klassen ?? {};
for (const [k, arten] of Object.entries(P)) {
  if (!KLASSEN.has(k)) F('pruefung', `unbekannte Klasse ${k}`);
  for (const [art, r] of Object.entries(arten)) {
    if (!['ersterwerb', 'erweiterung'].includes(art)) F('pruefung', `${k}: unbekannte Art ${art}`);
    for (const f of ['fragen', 'punkte', 'maxFehlerpunkte', 'grundstoff', 'zusatzstoff', 'dauerMin']) if (typeof r[f] !== 'number') F('pruefung', `${k}/${art}: ${f} fehlt`);
    if (r.grundstoff + r.zusatzstoff !== r.fragen) F('pruefung', `${k}/${art}: Grund+Zusatz ≠ Fragen`);
    if (r.punkte < r.fragen * 2 || r.punkte > r.fragen * 5) F('pruefung', `${k}/${art}: Punktsumme unplausibel`);
  }
}
for (const k of ['B', 'A', 'A1', 'A2', 'AM', 'Mofa']) if (!P[k]) F('pruefung', `Regeln für ${k} fehlen`);

const ids = new Set();
const signs = JSON.parse(readFileSync(ROOT + 'public/signs/signs.json', 'utf8'));
const signNr = new Set((signs.schilder ?? signs).map(s => s.nr));
const filmIds = new Set(existsSync(ROOT + 'public/data/filme.json') ? JSON.parse(readFileSync(ROOT + 'public/data/filme.json', 'utf8')).filme.map(f => f.id) : []);
for (const f of kat.fragen) {
  const id = f.id ?? '(ohne id)';
  if (!f.id || !/^BSP-[\w.-]+$/.test(f.id)) F(id, 'ungültige id');
  if (ids.has(f.id)) F(id, 'doppelte id'); ids.add(f.id);
  if (!f.mutterfrageId) F(id, 'mutterfrageId fehlt');
  if (f.beispiel !== true) F(id, 'Kennzeichnung beispiel=true fehlt');
  if (!KAPITEL.has(f.kapitel)) F(id, `Kapitel ${f.kapitel} unbekannt`);
  else if (KAPITEL.get(f.kapitel).stoff !== f.stoff) F(id, `stoff ${f.stoff} passt nicht zu Kapitel ${f.kapitel}`);
  if (f.stoff === 'grundstoff' && !f.kapitel?.startsWith('1.')) F(id, 'Grundstoff muss in 1.x liegen');
  if (!Array.isArray(f.klassen) || !f.klassen.length) F(id, 'klassen fehlen');
  for (const k of f.klassen ?? []) if (!KLASSEN.has(k)) F(id, `unbekannte Klasse ${k}`);
  if (![2, 3, 4, 5].includes(f.punkte)) F(id, `Punkte ${f.punkte} nicht 2–5`);
  if (!f.text || f.text.length < 10) F(id, 'Fragetext fehlt/zu kurz');
  if (!f.erklaerung || f.erklaerung.length < 15) F(id, 'Erklärung fehlt/zu kurz');
  if (f.typ === 'auswahl' || f.typ === 'bildauswahl') {
    const a = f.antworten ?? [];
    if (f.typ === 'bildauswahl') {
      if (!a.every(x => x.bild)) F(id, 'Bildauswahl: jede Antwort braucht ein Bild');
      const bilder = a.map(x => x.bild);
      if (new Set(bilder).size !== bilder.length) F(id, 'Bildauswahl: doppelte Bilder');
      for (const x of a) { if (x.bild && !existsSync(ROOT + 'public/' + x.bild)) F(id, `Antwortbild fehlt: ${x.bild}`); if (!x.text || x.text.length < 4) F(id, 'Bildauswahl: Beschriftung/Alternativtext fehlt'); }
      if (a.length < 3) W(id, 'Bildauswahl mit nur 2 Bildern');
    } else if (a.some(x => x.bild)) F(id, 'Antwortbilder nur bei typ bildauswahl');
    if (a.length < 2 || a.length > 4) F(id, `${a.length} Antworten (erwartet 2–4)`);
    if (!a.some(x => x.richtig)) F(id, 'keine richtige Antwort');
    if (a.every(x => x.richtig)) W(id, 'alle Antworten richtig');
    const t = a.map(x => x.text.trim().toLowerCase());
    if (new Set(t).size !== t.length) F(id, 'doppelte Antworttexte');
  } else if (f.typ === 'zahl') {
    if (typeof f.zahl?.wert !== 'number' || Number.isNaN(f.zahl.wert)) F(id, 'Zahlenfrage ohne gültigen Wert');
  } else F(id, `unbekannter typ ${f.typ}`);
  const m = f.medien ?? {};
  for (const p of [m.bild, m.video, m.poster, ...(m.zusatzbilder ?? [])].filter(Boolean)) if (!existsSync(ROOT + 'public/' + p)) F(id, `Mediendatei fehlt: ${p}`);
  if (m.bild && !m.bildAlt) W(id, 'Bild ohne Alternativtext');
  if (m.film && !filmIds.has(m.film)) F(id, `Filmszene ${m.film} fehlt in filme.json`);
  if (m.film && !/Szene/.test(f.text)) W(id, 'Filmfrage ohne Verweis auf die Szene im Text');
  for (const z of f.zeichen ?? []) if (!signNr.has(z)) F(id, `Zeichen ${z} nicht im Manifest`);
  if (/dieses (Zeichen|Zusatzzeichen|Gefahrzeichen|Verbotszeichen)|diese (Markierung|Bake|Leitbake|Verkehrseinrichtung|Richtungstafeln)/i.test(f.text) && !m.bild && !m.zusatzbilder?.length) F(id, 'Text verweist auf Bild, aber keins vorhanden');
}

// Beinahe-Duplikate: Jaccard über Inhaltswörter von Frage + richtigen Antworten
const STOP = new Set('der die das ein eine einer eines einem einen und oder sie ich mit bei was wie wer wo wann ist sind dürfen müssen muss darf zu im in auf an am vor nach von für den dem des nicht ihr ihre ihren ihrem es sich als auch nur so dass wenn noch hier diese dieses dieser welche welcher welches gilt richtig verhalten'.split(' '));
const tok = s => new Set(s.toLowerCase().replace(/[^a-zäöüß0-9 ]/g, ' ').split(/\s+/).filter(w => w.length > 2 && !STOP.has(w)));
const sig = f => tok(f.text + ' ' + (f.medien?.bild ? 'BILD' + f.medien.bild.replace(/\W/g, '') : '') + ' ' + (f.medien?.film ? 'FILM' + f.medien.film.replace(/\W/g, '') : '') + ' ' + (f.typ === 'bildauswahl' ? (f.antworten ?? []).filter(a => a.richtig).map(a => 'ABILD' + a.bild.replace(/\W/g, '')).join(' ') : '') + ' ' + (f.grafik ? f.grafik.split(/\s+/).map(t => 'G' + t.replace(/\W/g, '')).join(' ') : '') + ' ' + (f.typ === 'zahl' ? String(f.zahl?.wert) : (f.antworten ?? []).filter(a => a.richtig).map(a => a.text).join(' ')));
const S = kat.fragen.map(f => [f, sig(f)]);
const dup = [];
for (let i = 0; i < S.length; i++) for (let j = i + 1; j < S.length; j++) {
  const [a, sa] = S[i], [b, sb] = S[j];
  if (a.mutterfrageId === b.mutterfrageId) continue;
  if (a.medien?.bild && a.medien.bild === b.medien?.bild && a.medien.bild.startsWith('signs/')) { /* gleiches Zeichen ist erlaubt, wenn Text verschieden */ }
  let n = 0; for (const w of sa) if (sb.has(w)) n++;
  const jac = n / (sa.size + sb.size - n || 1);
  const grenze = a.typ === 'zahl' && b.typ === 'zahl' ? 0.75 : 0.6;
  if (jac >= grenze) dup.push(`${a.id} ~ ${b.id} (${jac.toFixed(2)})`);
  else if (jac >= 0.45) W(`${a.id}~${b.id}`, `ähnlich (${jac.toFixed(2)}): „${a.text.slice(0, 50)}“ / „${b.text.slice(0, 50)}“`);
}
for (const d of dup) F('Duplikat', d);

// Verteilungsbericht
const ZIEL_B = 1040; // TÜV-Verband, gültig seit 01.04.2025 (Klasse B gesamt)
const proKlasse = {}, proKapitel = {}, proKlasseStoff = {};
for (const f of kat.fragen) {
  proKapitel[f.kapitel] = (proKapitel[f.kapitel] ?? 0) + 1;
  for (const k of f.klassen) { proKlasse[k] = (proKlasse[k] ?? 0) + 1; (proKlasseStoff[k] ??= { grundstoff: 0, zusatzstoff: 0 })[f.stoff]++; }
}
const fmt = (o) => Object.entries(o).map(([k, v]) => `${k.padEnd(5)} ${String(v).padStart(4)}`).join('\n');
console.log(`Fragen gesamt: ${kat.fragen.length}  (Mutterfragen: ${kat.fragen.filter(f => !f.variante).length}, Variationen: ${kat.fragen.filter(f => f.variante).length}, Bildauswahl: ${kat.fragen.filter(f => f.typ === 'bildauswahl').length}, Filmfragen: ${kat.fragen.filter(f => f.medien?.film).length} zu ${new Set(kat.fragen.map(f => f.medien?.film).filter(Boolean)).size} Szenen, Zahlenfragen: ${kat.fragen.filter(f => f.typ === 'zahl').length}, mit Grafik: ${kat.fragen.filter(f => f.grafik).length}, mit Zeichen: ${kat.fragen.filter(f => f.zeichen?.length).length})`);
console.log('\nPro Kapitel:'); for (const k of KAPITEL.values()) console.log(`  ${k.id.padEnd(4)} ${String(proKapitel[k.id] ?? 0).padStart(4)}  ${k.stoff.padEnd(11)} ${k.titel}`);
console.log('\nPro Klasse (Grund + Zusatz) und Mindestbedarf je Prüfung:');
for (const k of KLASSEN) {
  const s = proKlasseStoff[k] ?? { grundstoff: 0, zusatzstoff: 0 };
  const r = P[k]?.ersterwerb ?? P[k]?.erweiterung;
  const ok = r ? (s.grundstoff >= r.grundstoff && s.zusatzstoff >= r.zusatzstoff ? 'ok' : 'ZU WENIG für eine reine Prüfung') : '–';
  console.log(`  ${k.padEnd(5)} ${String(proKlasse[k] ?? 0).padStart(4)}  (G ${s.grundstoff}, Z ${s.zusatzstoff})  Prüfung braucht G ${r?.grundstoff ?? '?'} / Z ${r?.zusatzstoff ?? '?'}: ${ok}`);
}
console.log(`\nKlasse B: ${proKlasse.B ?? 0} von ${ZIEL_B} (amtlicher Katalogumfang lt. TÜV-Verband) = ${(100 * (proKlasse.B ?? 0) / ZIEL_B).toFixed(1)} %`);
console.log(`\nWarnungen: ${warnungen.length}`); for (const w of warnungen) console.log('  ⚠ ' + w);
console.log(`Fehler: ${fehler.length}`); for (const e of fehler) console.log('  ✗ ' + e);
process.exit(fehler.length || (process.argv.includes('--streng') && warnungen.length) ? 1 : 0);
