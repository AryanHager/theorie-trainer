// Prüft vor einer Veröffentlichung, ob Impressum/Datenschutz ausgefüllt sind (src/anbieter.ts).
import { readFileSync } from 'node:fs';
const src = readFileSync(new URL('../src/anbieter.ts', import.meta.url), 'utf8');
const pflicht = JSON.parse(src.match(/PFLICHT[^=]*=\s*(\[[^\]]*\])/)[1].replace(/'/g, '"'));
const offen = pflicht.filter(k => { const m = src.match(new RegExp(`\\b${k}:\\s*'([^']*)'`)); return !m || !m[1].trim(); });
if (offen.length) { console.error('Impressum/Datenschutz noch nicht ausgefüllt – offene Felder in src/anbieter.ts: ' + offen.join(', ')); process.exit(1); }
console.log('Impressum/Datenschutz: alle Pflichtfelder ausgefüllt. Bitte Texte dennoch rechtlich prüfen lassen.');
