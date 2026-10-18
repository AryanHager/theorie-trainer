// Liste aller Mediendateien für den Offline-Download (public/data/medien.json)
import { readdirSync, statSync, writeFileSync } from 'node:fs';
const ROOT = new URL('..', import.meta.url).pathname, PUB = ROOT + 'public/';
const liste = [];
const lauf = d => { for (const n of readdirSync(PUB + d)) { const p = d + '/' + n; const s = statSync(PUB + p); if (s.isDirectory()) lauf(p); else if (/\.(svg|png|jpg|webp|json)$/.test(n)) liste.push([p, s.size]); } };
for (const d of ['signs', 'media', 'data', 'icons']) lauf(d);
const dateien = liste.filter(([p]) => p !== 'data/medien.json' && p !== 'data/fragen.json');
writeFileSync(PUB + 'data/medien.json', JSON.stringify({ dateien: dateien.map(([p]) => p), bytes: dateien.reduce((s, [, b]) => s + b, 0) }));
console.log(`Offline-Liste: ${dateien.length} Dateien, ${(dateien.reduce((s, [, b]) => s + b, 0) / 1e6).toFixed(1)} MB`);
