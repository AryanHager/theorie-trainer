// Prüft die Prüfungsziehung (src/logic.ts) für alle Klassen/Arten: Anzahl, Stoffaufteilung,
// eine Variante je Mutterfrage, Punktsumme. Aufruf: node scripts/pruefung-check.mjs (übersetzt logic.ts per esbuild)
import { readFileSync } from 'node:fs';
import { execFileSync } from 'node:child_process';
execFileSync('npx', ['--yes', 'esbuild', 'src/logic.ts', '--format=esm', '--log-level=error', '--outfile=/tmp/theorie-logic.mjs'], { cwd: new URL('../', import.meta.url).pathname });
const { pruefungZiehen, pruefungsRegel, pruefungsArten, pruefungBewerten, grundPunkteJeKapitel } = await import('/tmp/theorie-logic.mjs');
const kat = JSON.parse(readFileSync(new URL('../public/data/fragen.json', import.meta.url), 'utf8'));
const by = Object.fromEntries(kat.fragen.map(f => [f.id, f]));
let fehler = 0, kapFehler = 0;
for (const k of kat.meta.klassen) for (const art of pruefungsArten(kat, k)) {
  const r = pruefungsRegel(kat, k, art); let treffer = 0, aufg = 0, kapTol = 0; const N = 200;
  for (let i = 0; i < N; i++) {
    const z = pruefungZiehen(kat, k, art); const fr = z.ids.map(id => by[id]);
    if (fr.length !== r.fragen && !z.fehlendGrund) { fehler++; console.log('✗', k, art, 'Anzahl', fr.length); break; }
    if (new Set(fr.map(f => f.mutterfrageId)).size !== fr.length) { fehler++; console.log('✗', k, art, 'Mutterfrage doppelt'); break; }
    if (!fr.every(f => f.klassen.includes(k))) { fehler++; console.log('✗', k, art, 'fremde Klasse'); break; }
    if (r.grundKapitel) {
      const m = grundPunkteJeKapitel(fr);
      for (const [kap, [n, p]] of Object.entries(r.grundKapitel)) {
        const e = m[kap] ?? { n: 0, p: 0 };
        if (e.n !== n) { kapFehler++; if (kapFehler < 4) console.log('✗', k, art, 'Sachgebiet', kap, 'Fragen', e.n, 'statt', n); }
        else if (Math.abs(e.p - p) > r.kapitelToleranz) kapTol++;
      }
    }
    if (z.punkte === r.punkte) treffer++; if (z.fehlendZusatz) aufg++;
  }
  if (kapTol) fehler++;
  console.log(`${kapTol ? '✗ ' : ''}${k.padEnd(5)} ${art.padEnd(11)} ${r.fragen} Fragen/${r.punkte} P: Punktsumme getroffen ${treffer}/${N}${r.grundKapitel ? `, Sachgebiets-Punkte außerhalb ±${r.kapitelToleranz}: ${kapTol}` : ''}${aufg ? `, Zusatzstoff zu klein → aufgefüllt (${pruefungZiehen(kat, k, art).fehlendZusatz} Plätze)` : ''}`);
}
// Bewertung: Regeln
const f5 = [{ id: 'a', punkte: 5, typ: 'zahl', zahl: { wert: 1 } }, { id: 'b', punkte: 5, typ: 'zahl', zahl: { wert: 1 } }];
const b1 = pruefungBewerten(f5, {}, 10, true), b2 = pruefungBewerten(f5, {}, 10, false);
if (b1.bestanden || !b2.bestanden) { fehler++; console.log('✗ 5-Punkte-Regel'); } else console.log('5-Punkte-Regel: ok (mit Regel durchgefallen, ohne bestanden bei 10 FP)');
if (kapFehler) { fehler++; console.log('✗ Sachgebietsquoten verletzt:', kapFehler); }
process.exit(fehler ? 1 : 0);
