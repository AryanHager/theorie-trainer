// Parametrischer SVG-Generator für Verkehrssituationen (selbst gezeichnet).
// Spezifikation (eine Zeile): "<typ> ARM=farbe>ziel[*] ..." z. B. "kreuzung S=blau>links* E=rot>gerade"
//   typ: kreuzung | einmuendung-N | einmuendung-E | einmuendung-S | einmuendung-W (fehlender Arm) | kreisverkehr | autobahn2 | autobahn3
//   ARM: N, E, S, W   ziel: gerade | links | rechts | halt   * = "Sie"
//   Fahrzeugart optional als Präfix: rad: / krad: / lkw: / bus:   (z. B. S=rad:gruen>gerade)
//   Zusatz-Optionen: zebra=S (Fußgängerüberweg im Arm), ampel=S (Ampel am Arm), haltlinie=S, fussg=S (Person am Arm)
//   schild=S:205,N:205,W:306/SW  Verkehrszeichen rechts an der Zufahrt (selbst gezeichnete Kurzform);
//     unterstützt 205, 206, 301, 306, 102, 215; "/SW" ergänzt ein Zusatzschild „Verlauf der Vorfahrtstraße“
//     (dicke Linien = Vorfahrtstraße, Arme in Kartenrichtung, daher sinnvoll für die Zufahrt S).
import { createHash } from 'node:crypto';
import { writeFileSync, mkdirSync } from 'node:fs';

const FARBEN = { blau: '#2563eb', rot: '#dc2626', gelb: '#facc15', gruen: '#16a34a', grau: '#94a3b8', lila: '#7c3aed', orange: '#ea580c', schwarz: '#1f2937', weiss: '#f8fafc' };
const ROT = { S: 0, W: 90, N: 180, E: 270 }; // Drehung der Süd-Konfiguration um die Mitte
const C = 150;
function drehe([x, y], grad) {
  const r = (grad * Math.PI) / 180, dx = x - C, dy = y - C;
  return [C + dx * Math.cos(r) - dy * Math.sin(r), C + dx * Math.sin(r) + dy * Math.cos(r)];
}
function fahrzeug(art, farbe) {
  const f = FARBEN[farbe] ?? farbe;
  if (art === 'rad') return `<g><rect x="-3" y="-14" width="6" height="28" rx="3" fill="#1f2937"/><circle cx="0" cy="-4" r="6" fill="${f}" stroke="#1f2937" stroke-width="1.5"/></g>`;
  if (art === 'krad') return `<g><rect x="-6" y="-17" width="12" height="34" rx="5" fill="${f}" stroke="#1f2937" stroke-width="2"/><circle cx="0" cy="-2" r="5" fill="#1f2937"/></g>`;
  if (art === 'lkw') return `<g><rect x="-15" y="-34" width="30" height="64" rx="4" fill="${f}" stroke="#1f2937" stroke-width="2"/><rect x="-13" y="-32" width="26" height="14" rx="2" fill="#dbeafe"/></g>`;
  if (art === 'bus') return `<g><rect x="-15" y="-36" width="30" height="70" rx="6" fill="${f}" stroke="#1f2937" stroke-width="2"/><rect x="-12" y="-33" width="24" height="9" rx="2" fill="#dbeafe"/></g>`;
  return `<g><rect x="-13" y="-22" width="26" height="44" rx="7" fill="${f}" stroke="#1f2937" stroke-width="2"/><rect x="-9" y="-14" width="18" height="9" rx="2" fill="#dbeafe"/></g>`;
}
// Pfade für Fahrzeug aus Süden (fährt nach Norden, rechte Fahrspur x=170)
const PFAD = {
  gerade: 'M170 196 V40',
  links: 'M170 196 C170 140 150 130 60 130',
  rechts: 'M170 196 C170 180 180 170 250 170',
  halt: '',
};
function strassen(typ) {
  const g = '#6b7280';
  const arme = typ.startsWith('einmuendung') ? ['N', 'E', 'S', 'W'].filter(a => a !== typ.split('-')[1]) : ['N', 'E', 'S', 'W'];
  const rect = { N: `<rect x="110" y="0" width="80" height="150" fill="${g}"/>`, S: `<rect x="110" y="150" width="80" height="150" fill="${g}"/>`, W: `<rect x="0" y="110" width="150" height="80" fill="${g}"/>`, E: `<rect x="150" y="110" width="150" height="80" fill="${g}"/>` };
  const linie = { N: '<line x1="150" y1="0" x2="150" y2="105"/>', S: '<line x1="150" y1="195" x2="150" y2="300"/>', W: '<line x1="0" y1="150" x2="105" y2="150"/>', E: '<line x1="195" y1="150" x2="300" y2="150"/>' };
  return `<rect x="110" y="110" width="80" height="80" fill="${g}"/>${arme.map(a => rect[a]).join('')}<g stroke="#fff" stroke-width="3" stroke-dasharray="14 12">${arme.map(a => linie[a]).join('')}</g>`;
}
function extras(opt) {
  let s = '';
  for (const a of (opt.zebra ?? '').split(',').filter(Boolean)) s += `<g transform="rotate(${ROT[a]} 150 150)" fill="#fff">${[116, 132, 148, 164, 180].map(x => `<rect x="${x - 4}" y="206" width="9" height="20"/>`).join('')}</g>`;
  for (const a of (opt.haltlinie ?? '').split(',').filter(Boolean)) s += `<g transform="rotate(${ROT[a]} 150 150)"><rect x="152" y="198" width="36" height="5" fill="#fff"/></g>`;
  for (const a of (opt.ampel ?? '').split(',').filter(Boolean)) {
    const [x, y] = drehe([200, 210], ROT[a]);
    s += `<g transform="translate(${x} ${y})"><rect x="-7" y="-19" width="14" height="38" rx="4" fill="#111827"/><circle cy="-10" r="4.5" fill="${opt.ampelfarbe === 'rot' ? '#ef4444' : '#3f3f46'}"/><circle cy="0" r="4.5" fill="${opt.ampelfarbe === 'gelb' ? '#facc15' : '#3f3f46'}"/><circle cy="10" r="4.5" fill="${opt.ampelfarbe === 'gruen' || !opt.ampelfarbe ? '#22c55e' : '#3f3f46'}"/></g>`;
  }
  for (const a of (opt.fussg ?? '').split(',').filter(Boolean)) {
    const [x, y] = drehe([102, 216], ROT[a]);
    s += `<g transform="translate(${x} ${y})"><circle r="6" fill="#f59e0b"/><rect x="-5" y="6" width="10" height="13" rx="3" fill="#7c3aed"/></g>`;
  }
  return s;
}
// Kurzformen von Verkehrszeichen (eigene vereinfachte Zeichnung, Mittelpunkt 0/0, Breite ≈ 24)
const SCHILD = {
  '205': '<path d="M-12 -10 H12 L0 11 Z" fill="#fff" stroke="#c1121f" stroke-width="4" stroke-linejoin="round"/>',
  '206': '<path d="M-5 -12 H5 L12 -5 V5 L5 12 H-5 L-12 5 V-5 Z" fill="#c1121f" stroke="#fff" stroke-width="1.5"/><text y="3.2" font-family="sans-serif" font-size="7.5" font-weight="700" fill="#fff" text-anchor="middle">STOP</text>',
  '301': '<path d="M0 -12 L12 10 H-12 Z" fill="#fff" stroke="#c1121f" stroke-width="3.5" stroke-linejoin="round"/><rect x="-1.8" y="-5" width="3.6" height="12" fill="#111"/><rect x="-6" y="0.5" width="12" height="1.6" fill="#111"/>',
  '306': '<path d="M0 -13 L13 0 L0 13 L-13 0 Z" fill="#fff" stroke="#111" stroke-width="1"/><path d="M0 -8 L8 0 L0 8 L-8 0 Z" fill="#f2b705"/>',
  '102': '<path d="M0 -12 L12 10 H-12 Z" fill="#fff" stroke="#c1121f" stroke-width="3.5" stroke-linejoin="round"/><rect x="-1.4" y="-5" width="2.8" height="12" fill="#111"/><rect x="-5.5" y="0" width="11" height="2.8" fill="#111"/>',
  '215': '<circle r="12" fill="#1d4ed8" stroke="#fff" stroke-width="1.5"/><path d="M-6 -3 A7 7 0 1 1 -3 6" fill="none" stroke="#fff" stroke-width="2.5"/><path d="M-9 -6 L-6 -1 L-2 -5 Z" fill="#fff"/>',
};
const ARM_VEKTOR = { N: [0, -1], S: [0, 1], W: [-1, 0], E: [1, 0] };
function verlaufsTafel(arme) {
  const l = a => { const [x, y] = ARM_VEKTOR[a]; return `M0 0 L${x * 9} ${y * 9}`; };
  return `<g transform="translate(0 25)"><rect x="-12" y="-11" width="24" height="22" fill="#fff" stroke="#111" stroke-width="1"/><path d="${['N', 'E', 'S', 'W'].map(l).join(' ')}" stroke="#111" stroke-width="1.6"/><path d="${[...arme].map(l).join(' ')}" stroke="#111" stroke-width="4.5" stroke-linecap="square"/></g>`;
}
function schilder(opt, pos = [218, 226]) {
  let s = ''; const proArm = {};
  for (const t of (opt.schild ?? '').split(',').filter(Boolean)) {
    const m = t.match(/^([NESW]):(\d+)(?:\/([NESW]+))?$/);
    if (!m || !SCHILD[m[2]]) throw new Error('Unbekannte Schildangabe ' + t);
    const n = proArm[m[1]] = (proArm[m[1]] ?? -1) + 1; // mehrere Zeichen an einer Zufahrt: übereinander
    const [x, y0] = drehe(pos, ROT[m[1]]); const y = y0 - n * 27;
    s += `<g transform="translate(${x.toFixed(1)} ${y.toFixed(1)})"><line x1="0" y1="${m[3] ? 36 : 14}" x2="0" y2="${m[3] ? 40 : 22}" stroke="#4b5563" stroke-width="2"/>${SCHILD[m[2]]}${m[3] ? verlaufsTafel(m[3]) : ''}</g>`;
  }
  return s;
}
function kreuzung(typ, autos, opt) {
  let pfeile = '', fz = '', label = '';
  const markers = new Set();
  for (const a of autos) {
    const grad = ROT[a.arm], farbe = FARBEN[a.farbe] ?? a.farbe;
    const id = 'm' + a.farbe.replace('#', '');
    markers.add(`<marker id="${id}" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M0 0L10 5L0 10z" fill="${farbe}"/></marker>`);
    const yAuto = a.art === 'lkw' || a.art === 'bus' ? 240 : 225;
    if (PFAD[a.ziel]) pfeile += `<path d="${PFAD[a.ziel]}" transform="rotate(${grad} 150 150)" stroke="${farbe}" stroke-width="4" fill="none" stroke-dasharray="7 5" marker-end="url(#${id})"/>`;
    fz += `<g transform="rotate(${grad} 150 150) translate(170 ${yAuto})">${fahrzeug(a.art, a.farbe)}</g>`;
    if (a.sie) { const [x, y] = drehe([170, 270], grad); label += `<text x="${x}" y="${y}" font-family="sans-serif" font-size="14" font-weight="700" fill="#fff" stroke="#1f2937" stroke-width="3" paint-order="stroke" text-anchor="middle">Sie</text>`; }
  }
  return `<rect width="300" height="300" fill="#86c46d"/>${strassen(typ)}${extras(opt)}${pfeile}${fz}${schilder(opt)}${label}<defs>${[...markers].join('')}</defs>`;
}
function kreisverkehr(autos, opt = {}) {
  let s = `<rect width="300" height="300" fill="#86c46d"/><rect x="120" width="60" height="300" fill="#6b7280"/><rect y="120" width="300" height="60" fill="#6b7280"/><circle cx="150" cy="150" r="88" fill="#6b7280"/><circle cx="150" cy="150" r="42" fill="#4d7c0f" stroke="#cbd5e1" stroke-width="6"/>`;
  for (const a of autos) {
    const grad = ROT[a.arm];
    s += `<g transform="rotate(${grad} 150 150) translate(165 ${a.ziel === 'kreis' ? 205 : 262})">${fahrzeug(a.art, a.farbe)}</g>`;
    if (a.sie) { const [x, y] = drehe([128, 272], grad); s += `<text x="${x}" y="${y}" font-family="sans-serif" font-size="14" font-weight="700" fill="#fff" stroke="#1f2937" stroke-width="3" paint-order="stroke" text-anchor="middle">Sie</text>`; }
  }
  return s + schilder(opt, [222, 250]);
}
function autobahn(n, autos) {
  // n Fahrstreifen nach Norden; ARM = Fahrstreifen-Nummer von links (L1..), ziel ignoriert
  const breite = n * 60, x0 = 150 - breite / 2;
  let s = `<rect width="300" height="300" fill="#86c46d"/><rect x="${x0 - 6}" width="${breite + 12}" height="300" fill="#6b7280"/><g stroke="#fff" stroke-width="3"><line x1="${x0}" y1="0" x2="${x0}" y2="300"/><line x1="${x0 + breite}" y1="0" x2="${x0 + breite}" y2="300"/></g><g stroke="#fff" stroke-width="3" stroke-dasharray="16 14">`;
  for (let i = 1; i < n; i++) s += `<line x1="${x0 + i * 60}" y1="0" x2="${x0 + i * 60}" y2="300"/>`;
  s += '</g>';
  for (const a of autos) {
    const spur = parseInt(a.arm.slice(1), 10) - 1, y = a.y ?? 200;
    s += `<g transform="translate(${x0 + 30 + spur * 60} ${y})">${fahrzeug(a.art, a.farbe)}</g>`;
    if (a.sie) s += `<text x="${x0 + 30 + spur * 60}" y="${y + 42}" font-family="sans-serif" font-size="14" font-weight="700" fill="#fff" stroke="#1f2937" stroke-width="3" paint-order="stroke" text-anchor="middle">Sie</text>`;
  }
  return s;
}
export function parseSpec(spec) {
  const [typ, ...rest] = spec.trim().split(/\s+/);
  const autos = [], opt = {};
  for (const t of rest) {
    const m = t.match(/^([NESW]|L\d)(?:@(\d+))?=(?:(rad|krad|lkw|bus):)?([a-z#0-9]+)>?([a-z]*)(\*?)$/);
    if (m) { autos.push({ arm: m[1], y: m[2] ? +m[2] : undefined, art: m[3] ?? 'auto', farbe: m[4], ziel: m[5] || 'halt', sie: !!m[6] }); continue; }
    const o = t.match(/^(\w+)=(.+)$/);
    if (o) { opt[o[1]] = o[2]; continue; }
    throw new Error('Unbekanntes Token in Grafik-Spezifikation: ' + t + ' in "' + spec + '"');
  }
  return { typ, autos, opt };
}
export function render(spec) {
  const { typ, autos, opt } = parseSpec(spec);
  let body;
  if (typ === 'kreuzung' || typ.startsWith('einmuendung-')) body = kreuzung(typ, autos, opt);
  else if (typ === 'kreisverkehr') body = kreisverkehr(autos, opt);
  else if (typ === 'autobahn2' || typ === 'autobahn3') body = autobahn(+typ.slice(-1), autos);
  else throw new Error('Unbekannter Grafiktyp: ' + typ);
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 300 300">${body}</svg>`;
}
export function erzeuge(spec, dir) {
  const name = 'gen-' + createHash('sha1').update(spec).digest('hex').slice(0, 10) + '.svg';
  mkdirSync(dir, { recursive: true });
  writeFileSync(dir + '/' + name, render(spec));
  return 'media/gen/' + name;
}
