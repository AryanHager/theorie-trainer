// Prüft alle Szenen: Ist jedes bewegte bzw. relevante Objekt während der Szene im Bildausschnitt sichtbar?
// Gleiche Kamera-Logik wie src/film/FilmPlayer.tsx. Aufruf: node scripts/film-sicht.mjs  (Exit 1 bei Befund)
import { readFileSync } from 'node:fs';
const filme = JSON.parse(readFileSync(new URL('../public/data/filme.json', import.meta.url), 'utf8')).filme;
const lage = (bahn, t) => {
  if (t <= bahn[0][0]) return { x: bahn[0][1], y: bahn[0][2] };
  for (let i = 1; i < bahn.length; i++) { const [t1, x1, y1] = bahn[i], [t0, x0, y0] = bahn[i - 1]; if (t <= t1) { const u = t1 === t0 ? 1 : (t - t0) / (t1 - t0); return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u }; } }
  const l = bahn[bahn.length - 1]; return { x: l[1], y: l[2] };
};
const BREITE = 34, HOEHE = 22; let befund = 0;
// halbe Länge je Objektart (m): ein Objekt gilt als im Bild, wenn ein Teil von mind. ~1 m zu sehen ist
const HALB = { bus: 6, lkw: 6, tram: 14, traktor: 2, pkw: 2.2, transporter: 2.5, polizei: 2.2, rtw: 2.8, krad: 1, rad: 0.8 };
for (const f of filme) {
  const ich = f.objekte.find(o => o.ich), k = f.kamera ?? {}, b = k.b ?? 44, h = b * HOEHE / BREITE;
  const cam = t => (k.x !== undefined && k.y !== undefined) ? { x: k.x, y: k.y } : (() => { const p = lage(ich.bahn, t); return { x: p.x * 0.6, y: p.y - h * (k.vor ?? 0.3) }; })();
  const zeilen = [];
  for (const o of f.objekte) {
    if (o.ich) continue;
    const bewegt = o.bahn.length > 1;
    let n = 0, sicht = 0, ersteSicht = null;
    for (let t = 0; t <= f.dauer + 1e-9; t += 0.1) {
      if (o.sichtbar && (t < o.sichtbar[0] || t > o.sichtbar[1])) continue;
      n++; const c = cam(t), p = lage(o.bahn, t);
      const L = Math.max(0, (HALB[o.art] ?? 0.4) - 1);
      if (Math.abs(p.x - c.x) <= b / 2 - 0.8 + L && Math.abs(p.y - c.y) <= h / 2 - 0.8 + L) { sicht++; ersteSicht ??= +t.toFixed(1); }
    }
    const rel = bewegt || ['kind', 'fussg', 'rad', 'reh', 'ball', 'hund', 'rollstuhl', 'kinderwagen', 'roller'].includes(o.art);
    if (rel && sicht === 0) { zeilen.push(`  ✗ ${o.id} (${o.art}) nie im Bild`); befund++; }
    else if (rel && sicht / Math.max(1, n) < 0.25) zeilen.push(`  ⚠ ${o.id} (${o.art}) nur ${Math.round(100 * sicht / n)} % der Zeit im Bild (ab ${ersteSicht} s)`);
  }
  if (zeilen.length) console.log(f.id + '\n' + zeilen.join('\n'));
}
console.log(`${filme.length} Szenen geprüft, ${befund} Objekte nie sichtbar`);
process.exit(befund && process.argv.includes("--streng") ? 1 : 0);
