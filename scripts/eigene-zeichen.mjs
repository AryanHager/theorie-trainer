// Eigene Zeichnungen (selbst erstellt, keine Vorlagen kopiert) für Elemente, die es nicht als
// gemeinfreie Commons-Datei im Bestand gibt: Fahrbahnmarkierungen (Zeichen 293–299), Grünpfeil,
// Lichtzeichen (§ 37 StVO) und Zeichen von Polizeibeamten (§ 36 StVO).
// Alle Dateien: public/signs/eigen/*.svg – Lizenz: eigene Darstellung dieses Projekts.
import { writeFileSync, mkdirSync } from 'node:fs';

const A = '#4b5563', W = '#f8fafc', Y = '#facc15';
const svg = (vb, inner, titel) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb}" role="img"><title>${titel}</title>${inner}</svg>`;
const strasse = (inner, titel) => svg('0 0 200 200', `<rect width="200" height="200" fill="#a3b18a"/><rect x="30" width="140" height="200" fill="${A}"/><rect x="30" width="3" height="200" fill="${W}"/><rect x="167" width="3" height="200" fill="${W}"/>${inner}<rect x="0" y="186" width="200" height="14" fill="#111827" opacity=".7"/><text x="100" y="196" font-family="sans-serif" font-size="9" fill="#fff" text-anchor="middle">Eigene Zeichnung (schematisch)</text>`, titel);
const pfeil = (art, x, y, s = 1) => {
  const P = {
    g: 'M0 -34 L10 -18 H4 V30 H-4 V-18 H-10 Z',
    l: 'M4 30 H-4 V-6 C-4 -14 -8 -18 -14 -18 V-12 L-28 -22 L-14 -32 V-26 C-2 -26 4 -18 4 -6 Z',
    r: 'M-4 30 H4 V-6 C4 -14 8 -18 14 -18 V-12 L28 -22 L14 -32 V-26 C2 -26 -4 -18 -4 -6 Z',
  };
  return art.split('').map(a => `<path transform="translate(${x} ${y}) scale(${s})" d="${P[a]}" fill="${W}"/>`).join('');
};
const ampelGehaeuse = (licht, extra = '', titel) => {
  const c = { r: '#ef4444', y: '#facc15', g: '#22c55e', o: '#3f3f46' };
  const [r, y, g] = licht;
  const kreis = (cy, f, inhalt = '') => `<circle cx="60" cy="${cy}" r="24" fill="${c[f] ?? f}"/>${inhalt}`;
  return svg('0 0 120 230', `<rect width="120" height="230" fill="#e5e7eb"/><rect x="55" y="180" width="10" height="50" fill="#374151"/><rect x="24" y="10" width="72" height="174" rx="14" fill="#111827"/>${kreis(46, r.f ?? r, r.i)}${kreis(97, y.f ?? y, y.i)}${kreis(148, g.f ?? g, g.i)}${extra}`, titel);
};
const pfeilImKreis = (cy, richtung, farbe = '#111827') => {
  const d = richtung === 'l' ? 'M14 -4 H-6 V-12 L-18 0 L-6 12 V4 H14 Z' : richtung === 'r' ? 'M-14 -4 H6 V-12 L18 0 L6 12 V4 H-14 Z' : 'M-4 14 V-6 H-12 L0 -18 L12 -6 H4 V14 Z';
  return `<path transform="translate(60 ${cy})" d="${d}" fill="${farbe}"/>`;
};
const fussgaenger = (cy, farbe, geht) => `<g transform="translate(60 ${cy})" fill="${farbe}"><circle cy="-15" r="5"/>${geht ? '<path d="M-3 -8 H4 L9 4 L5 5 L2 -1 L1 6 L7 18 H2 L-2 9 L-6 18 H-11 L-4 4 V-2 L-8 3 L-11 1 Z"/>' : '<path d="M-6 -8 H6 V8 H3 V19 H-3 V8 H-6 Z"/>'}</g>`;
const rad = (cy, farbe) => `<g transform="translate(60 ${cy})" fill="none" stroke="${farbe}" stroke-width="3"><circle cx="-10" cy="6" r="8"/><circle cx="10" cy="6" r="8"/><path d="M-10 6 L-2 -8 H8 L10 6 M-2 -8 L2 6"/></g>`;

function kreuzungPolizei(arme, sieVon, titel) {
  // Draufsicht: Polizist in der Kreuzungsmitte; arme = 'WE' (Arme in West-Ost-Richtung) oder 'NS'
  const armPfad = arme === 'WE' ? 'M-26 0 H26' : 'M0 -26 V26';
  const auto = (von, farbe, sie) => {
    const pos = { S: [114, 168, 0], N: [86, 32, 180], W: [32, 114, 90], E: [168, 86, 270] }[von];
    return `<g transform="translate(${pos[0]} ${pos[1]}) rotate(${pos[2]})"><rect x="-10" y="-17" width="20" height="34" rx="5" fill="${farbe}" stroke="#111" stroke-width="1.5"/><rect x="-7" y="-11" width="14" height="7" rx="2" fill="#dbeafe"/></g>${sie ? `<text x="${pos[0] + (von === 'S' ? 20 : von === 'W' ? 0 : 0)}" y="${pos[1] + (von === 'S' ? 4 : von === 'W' ? -22 : 0)}" font-family="sans-serif" font-size="11" font-weight="700" fill="#fff" stroke="#111" stroke-width="3" paint-order="stroke">Sie</text>` : ''}`;
  };
  const andere = sieVon === 'S' ? 'W' : 'S';
  return svg('0 0 200 200', `<rect width="200" height="200" fill="#a3b18a"/><rect x="70" width="60" height="200" fill="${A}"/><rect y="70" width="200" height="60" fill="${A}"/><g stroke="${W}" stroke-width="2" stroke-dasharray="8 8"><path d="M100 0 V66 M100 134 V200 M0 100 H66 M134 100 H200"/></g>
  ${auto(sieVon, '#2563eb', true)}${auto(andere, '#dc2626', false)}
  <g transform="translate(100 100)"><path d="${armPfad}" stroke="#1e3a8a" stroke-width="7" stroke-linecap="round"/><path d="${armPfad}" stroke="#f8fafc" stroke-width="2" stroke-dasharray="3 5"/><circle r="11" fill="#1e3a8a" stroke="#fff" stroke-width="2"/><circle r="6" fill="#f1f5f9"/></g>
  <rect x="0" y="186" width="200" height="14" fill="#111827" opacity=".7"/><text x="100" y="196" font-family="sans-serif" font-size="9" fill="#fff" text-anchor="middle">Draufsicht · eigene Zeichnung</text>`, titel);
}
function polizistFront(armHoch, titel) {
  const arme = armHoch ? '<path d="M78 92 L60 128 M122 92 L130 30" stroke="#1e3a8a" stroke-width="13" stroke-linecap="round"/><circle cx="131" cy="24" r="7" fill="#fcd9b6"/>' : '<path d="M78 92 L20 92 M122 92 L180 92" stroke="#1e3a8a" stroke-width="13" stroke-linecap="round"/><circle cx="14" cy="92" r="7" fill="#fcd9b6"/><circle cx="186" cy="92" r="7" fill="#fcd9b6"/>';
  return svg('0 0 200 230', `<rect width="200" height="230" fill="#e0f2fe"/><rect y="190" width="200" height="40" fill="${A}"/>
  <path d="M78 84 H122 L128 160 H72 Z" fill="#1e3a8a"/><rect x="74" y="118" width="52" height="8" fill="#e5e7eb"/><rect x="74" y="132" width="52" height="5" fill="${Y}"/>
  <path d="M76 160 H96 L94 205 H80 Z M104 160 H124 L120 205 H106 Z" fill="#111827"/>${arme}
  <circle cx="100" cy="62" r="18" fill="#fcd9b6"/><path d="M80 52 Q100 30 120 52 Z" fill="#1e3a8a"/><rect x="78" y="50" width="44" height="6" rx="2" fill="#111827"/>
  <text x="100" y="224" font-family="sans-serif" font-size="9" fill="#fff" text-anchor="middle">Eigene Zeichnung (schematisch)</text>`, titel);
}

export const EIGENE = [
  // ---- Markierungen ----
  { nr: '293', name: 'Fußgängerüberweg (Markierung)', kategorie: 'Markierungen', svg: strasse([0, 1, 2, 3, 4, 5, 6].map(i => `<rect x="${40 + i * 18}" y="70" width="12" height="60" fill="${W}"/>`).join(''), 'Zeichen 293 Fußgängerüberweg') },
  { nr: '294', name: 'Haltlinie', kategorie: 'Markierungen', svg: strasse(`<rect x="98" width="4" height="200" fill="${W}"/><rect x="102" y="120" width="65" height="10" fill="${W}"/><path d="M100 0 V200" stroke="${W}" stroke-width="0"/>`, 'Zeichen 294 Haltlinie') },
  { nr: '295', name: 'Fahrstreifenbegrenzung und Fahrbahnbegrenzung', variante: 'Fahrstreifenbegrenzung (durchgehende Linie)', kategorie: 'Markierungen', svg: strasse(`<rect x="97" width="6" height="200" fill="${W}"/>`, 'Zeichen 295 Fahrstreifenbegrenzung') },
  { nr: '295-rand', name: 'Fahrstreifenbegrenzung und Fahrbahnbegrenzung', variante: 'Fahrbahnbegrenzung (Randlinie)', kategorie: 'Markierungen', svg: strasse(`${[0, 1, 2, 3, 4].map(i => `<rect x="97" y="${i * 44}" width="5" height="22" fill="${W}"/>`).join('')}<rect x="150" width="5" height="200" fill="${W}"/><rect x="155" width="12" height="200" fill="#6b7280"/>`, 'Zeichen 295 Fahrbahnbegrenzung') },
  { nr: '296', name: 'Einseitige Fahrstreifenbegrenzung', kategorie: 'Markierungen', svg: strasse(`<rect x="92" width="5" height="200" fill="${W}"/>${[0, 1, 2, 3, 4].map(i => `<rect x="103" y="${i * 44}" width="5" height="22" fill="${W}"/>`).join('')}<text x="62" y="30" font-family="sans-serif" font-size="11" fill="${W}" text-anchor="middle">A</text><text x="138" y="30" font-family="sans-serif" font-size="11" fill="${W}" text-anchor="middle">B</text>`, 'Zeichen 296 einseitige Fahrstreifenbegrenzung') },
  { nr: '297-g', name: 'Pfeilmarkierung', variante: 'geradeaus', kategorie: 'Markierungen', svg: strasse(pfeil('g', 100, 100, 1.6), 'Zeichen 297 Pfeil geradeaus') },
  { nr: '297-l', name: 'Pfeilmarkierung', variante: 'links', kategorie: 'Markierungen', svg: strasse(pfeil('l', 104, 100, 1.6), 'Zeichen 297 Pfeil links') },
  { nr: '297-r', name: 'Pfeilmarkierung', variante: 'rechts', kategorie: 'Markierungen', svg: strasse(pfeil('r', 96, 100, 1.6), 'Zeichen 297 Pfeil rechts') },
  { nr: '297-gr', name: 'Pfeilmarkierung', variante: 'geradeaus und rechts', kategorie: 'Markierungen', svg: strasse(pfeil('gr', 92, 100, 1.6), 'Zeichen 297 Pfeil geradeaus und rechts') },
  { nr: '297-gl', name: 'Pfeilmarkierung', variante: 'geradeaus und links', kategorie: 'Markierungen', svg: strasse(pfeil('gl', 108, 100, 1.6), 'Zeichen 297 Pfeil geradeaus und links') },
  { nr: '297-3', name: 'Pfeilmarkierung', variante: 'drei Fahrstreifen (links / geradeaus / rechts)', kategorie: 'Markierungen', svg: svg('0 0 240 200', `<rect width="240" height="200" fill="${A}"/>${[80, 160].map(x => [0, 1, 2, 3, 4].map(i => `<rect x="${x - 2}" y="${i * 44}" width="4" height="22" fill="${W}"/>`).join('')).join('')}${pfeil('l', 42, 100, 1.3)}${pfeil('g', 120, 100, 1.3)}${pfeil('r', 198, 100, 1.3)}`, 'Zeichen 297 Pfeile auf drei Fahrstreifen') },
  { nr: '297.1', name: 'Vorankündigungspfeil', kategorie: 'Markierungen', svg: strasse(`${[0, 1, 2, 3, 4].map(i => `<rect x="98" y="${i * 44}" width="4" height="22" fill="${W}"/>`).join('')}<path transform="translate(134 110)" d="M4 40 H-4 V-6 C-4 -22 -20 -30 -34 -36 L-37 -28 L-52 -52 L-24 -54 L-28 -46 C-10 -40 4 -26 4 -6 Z" fill="${W}"/>`, 'Zeichen 297.1 Vorankündigungspfeil') },
  { nr: '298', name: 'Sperrfläche', kategorie: 'Markierungen', svg: strasse(`<path d="M100 10 L135 80 L135 190 H65 L65 80 Z" fill="none" stroke="${W}" stroke-width="4"/><clipPath id="sp"><path d="M100 10 L135 80 L135 190 H65 L65 80 Z"/></clipPath><g clip-path="url(#sp)" stroke="${W}" stroke-width="6">${[...Array(12)].map((_, i) => `<line x1="40" y1="${i * 22}" x2="160" y2="${i * 22 - 70}"/>`).join('')}</g>`, 'Zeichen 298 Sperrfläche') },
  { nr: '299', name: 'Grenzmarkierung für Halt- und Parkverbote', kategorie: 'Markierungen', svg: strasse(`<path d="M150 20 ${[...Array(8)].map((_, i) => `L${i % 2 ? 150 : 134} ${30 + i * 18}`).join(' ')} L150 176" fill="none" stroke="${W}" stroke-width="4" stroke-linejoin="miter"/>`, 'Zeichen 299 Grenzmarkierung') },
  // ---- Grünpfeil ----
  { nr: '720', name: 'Grünpfeil', variante: 'Schild', kategorie: 'Lichtzeichen', svg: svg('0 0 200 140', `<rect width="200" height="140" fill="#e5e7eb"/><rect x="30" y="25" width="140" height="90" rx="8" fill="#111827"/><path d="M55 62 H118 V40 L152 70 L118 100 V78 H55 Z" fill="#22c55e"/>`, 'Grünpfeil') },
  { nr: '720-ampel', name: 'Grünpfeil', variante: 'neben einer roten Ampel', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['r', 'o', 'o'], `<rect x="98" y="132" width="20" height="30" fill="#e5e7eb"/><rect x="100" y="134" width="20" height="26" rx="2" fill="#111827" transform="translate(-2 0)"/><path d="M101 147 h9 v-5 l7 5 l-7 5 v-5 h-9 z" fill="#22c55e"/>`, 'Rote Ampel mit Grünpfeil-Schild') },
  { nr: '720-rad', name: 'Grünpfeil', variante: 'nur für den Radverkehr', kategorie: 'Lichtzeichen', svg: svg('0 0 200 140', `<rect width="200" height="140" fill="#e5e7eb"/><rect x="30" y="20" width="140" height="100" rx="8" fill="#111827"/><path d="M45 48 H105 V30 L135 55 L105 80 V62 H45 Z" fill="#22c55e"/><g transform="translate(100 96) scale(.75)" fill="none" stroke="#22c55e" stroke-width="4"><circle cx="-14" cy="6" r="10"/><circle cx="14" cy="6" r="10"/><path d="M-14 6 L-3 -12 H11 L14 6 M-3 -12 L3 6"/></g>`, 'Grünpfeil nur für den Radverkehr') },
  // ---- Lichtzeichen ----
  { nr: 'LZ-gruen', name: 'Wechsellichtzeichen', variante: 'Grün', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['o', 'o', 'g'], '', 'Ampel Grün') },
  { nr: 'LZ-gelb', name: 'Wechsellichtzeichen', variante: 'Gelb', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['o', 'y', 'o'], '', 'Ampel Gelb') },
  { nr: 'LZ-rot', name: 'Wechsellichtzeichen', variante: 'Rot', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['r', 'o', 'o'], '', 'Ampel Rot') },
  { nr: 'LZ-rotgelb', name: 'Wechsellichtzeichen', variante: 'Rot und Gelb', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['r', 'y', 'o'], '', 'Ampel Rot und Gelb') },
  { nr: 'LZ-gelbblink', name: 'Wechsellichtzeichen', variante: 'Gelbes Blinklicht', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['o', 'y', 'o'], '<g stroke="#facc15" stroke-width="4" stroke-linecap="round"><path d="M100 90 l12 -6 M100 104 l12 6 M20 90 l-12 -6 M20 104 l-12 6"/></g>', 'Gelbes Blinklicht') },
  { nr: 'LZ-aus', name: 'Wechsellichtzeichen', variante: 'ausgeschaltet', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['o', 'o', 'o'], '', 'Ampel ausgeschaltet') },
  { nr: 'LZ-pfeil-links', name: 'Wechsellichtzeichen', variante: 'Grüner Pfeil nach links', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['o', 'o', { f: '#111827', i: pfeilImKreis(148, 'l', '#22c55e') }], '', 'Ampel grüner Pfeil links') },
  { nr: 'LZ-schwarzpfeil-rot', name: 'Wechsellichtzeichen', variante: 'Schwarzer Pfeil auf Rot (rechts)', kategorie: 'Lichtzeichen', svg: ampelGehaeuse([{ f: 'r', i: pfeilImKreis(46, 'r') }, 'o', 'o'], '', 'Ampel schwarzer Pfeil auf Rot') },
  { nr: 'LZ-einfeld-gruenpfeil', name: 'Wechsellichtzeichen', variante: 'einfeldiger Signalgeber mit Grünpfeil neben Rot', kategorie: 'Lichtzeichen', svg: ampelGehaeuse(['r', 'o', 'o'], `<rect x="96" y="22" width="22" height="48" rx="8" fill="#111827"/><circle cx="107" cy="46" r="9" fill="#111827"/><path transform="translate(107 46) scale(.5)" d="M-14 -4 H6 V-12 L18 0 L6 12 V4 H-14 Z" fill="#22c55e"/>`, 'Einfeldiger Signalgeber mit Grünpfeil') },
  { nr: 'LZ-fussg-rot', name: 'Lichtzeichen für Fußgänger', variante: 'Rot', kategorie: 'Lichtzeichen', svg: svg('0 0 120 180', `<rect width="120" height="180" fill="#e5e7eb"/><rect x="55" y="140" width="10" height="40" fill="#374151"/><rect x="28" y="12" width="64" height="130" rx="10" fill="#111827"/><circle cx="60" cy="46" r="24" fill="#3f0d0d"/>${fussgaenger(46, '#ef4444', false)}<circle cx="60" cy="106" r="24" fill="#0b2a16"/>${fussgaenger(106, '#14532d', true)}`, 'Fußgängerampel Rot') },
  { nr: 'LZ-fussg-gruen', name: 'Lichtzeichen für Fußgänger', variante: 'Grün', kategorie: 'Lichtzeichen', svg: svg('0 0 120 180', `<rect width="120" height="180" fill="#e5e7eb"/><rect x="55" y="140" width="10" height="40" fill="#374151"/><rect x="28" y="12" width="64" height="130" rx="10" fill="#111827"/><circle cx="60" cy="46" r="24" fill="#3f0d0d"/>${fussgaenger(46, '#7f1d1d', false)}<circle cx="60" cy="106" r="24" fill="#0b2a16"/>${fussgaenger(106, '#22c55e', true)}`, 'Fußgängerampel Grün') },
  { nr: 'LZ-rad-rot', name: 'Lichtzeichen für den Radverkehr', variante: 'Rot', kategorie: 'Lichtzeichen', svg: svg('0 0 120 230', `<rect width="120" height="230" fill="#e5e7eb"/><rect x="55" y="180" width="10" height="50" fill="#374151"/><rect x="24" y="10" width="72" height="174" rx="14" fill="#111827"/><circle cx="60" cy="46" r="24" fill="#3f0d0d"/>${rad(46, '#ef4444')}<circle cx="60" cy="97" r="24" fill="#3a2f05"/>${rad(97, '#5c4a08')}<circle cx="60" cy="148" r="24" fill="#0b2a16"/>${rad(148, '#14532d')}`, 'Radfahrerampel Rot') },
  { nr: 'DL-kreuz', name: 'Dauerlichtzeichen', variante: 'Rote gekreuzte Schrägbalken', kategorie: 'Lichtzeichen', svg: svg('0 0 140 140', `<rect width="140" height="140" fill="#e5e7eb"/><rect x="20" y="20" width="100" height="100" rx="10" fill="#111827"/><path d="M42 42 L98 98 M98 42 L42 98" stroke="#ef4444" stroke-width="12" stroke-linecap="round"/>`, 'Dauerlichtzeichen rotes Kreuz') },
  { nr: 'DL-gruen', name: 'Dauerlichtzeichen', variante: 'Grüner Pfeil nach unten', kategorie: 'Lichtzeichen', svg: svg('0 0 140 140', `<rect width="140" height="140" fill="#e5e7eb"/><rect x="20" y="20" width="100" height="100" rx="10" fill="#111827"/><path d="M62 36 H78 V74 H92 L70 104 L48 74 H62 Z" fill="#22c55e"/>`, 'Dauerlichtzeichen grüner Pfeil') },
  { nr: 'DL-gelb', name: 'Dauerlichtzeichen', variante: 'Gelb blinkender Schrägpfeil', kategorie: 'Lichtzeichen', svg: svg('0 0 140 140', `<rect width="140" height="140" fill="#e5e7eb"/><rect x="20" y="20" width="100" height="100" rx="10" fill="#111827"/><path transform="rotate(-45 70 70)" d="M62 36 H78 V74 H92 L70 104 L48 74 H62 Z" fill="#facc15"/>`, 'Dauerlichtzeichen gelber Schrägpfeil') },
  // ---- Polizeibeamte ----
  { nr: 'PZ-quer-halt', name: 'Zeichen von Polizeibeamten', variante: 'Arme quer zu Ihrer Fahrtrichtung (Halt)', kategorie: 'Polizeizeichen', svg: kreuzungPolizei('WE', 'S', 'Polizist mit Armen quer zur Fahrtrichtung, Sie kommen von unten') },
  { nr: 'PZ-quer-frei', name: 'Zeichen von Polizeibeamten', variante: 'Arme in Ihrer Fahrtrichtung (Querverkehr frei)', kategorie: 'Polizeizeichen', svg: kreuzungPolizei('WE', 'W', 'Polizist mit Armen in Fahrtrichtung, Sie kommen von links') },
  { nr: 'PZ-front-arme', name: 'Zeichen von Polizeibeamten', variante: 'seitlich ausgestreckte Arme (Ansicht von vorn)', kategorie: 'Polizeizeichen', svg: polizistFront(false, 'Polizist mit seitlich ausgestreckten Armen') },
  { nr: 'PZ-arm-hoch', name: 'Zeichen von Polizeibeamten', variante: 'Hochheben eines Arms', kategorie: 'Polizeizeichen', svg: polizistFront(true, 'Polizist hebt einen Arm') },
  { nr: 'PZ-kelle', name: 'Zeichen von Polizeibeamten', variante: 'Anhalten mit Winkerkelle', kategorie: 'Polizeizeichen', svg: svg('0 0 200 200', `<rect width="200" height="200" fill="#e0f2fe"/><rect x="92" y="96" width="16" height="90" rx="4" fill="#111827"/><circle cx="100" cy="72" r="46" fill="#dc2626" stroke="#fff" stroke-width="10"/><text x="100" y="78" font-family="sans-serif" font-size="17" font-weight="800" fill="#fff" text-anchor="middle">HALT</text><text x="100" y="94" font-family="sans-serif" font-size="9" fill="#fff" text-anchor="middle">POLIZEI</text><text x="100" y="196" font-family="sans-serif" font-size="9" fill="#111" text-anchor="middle">Eigene Zeichnung (schematisch)</text>`, 'Winkerkelle der Polizei') },
  { nr: 'PZ-stopp', name: 'Zeichen von Polizeibeamten', variante: 'Anhaltesignal am Einsatzfahrzeug', kategorie: 'Polizeizeichen', svg: svg('0 0 220 150', `<rect width="220" height="150" fill="#cbd5e1"/><path d="M30 120 V70 Q34 50 60 46 H160 Q186 50 190 70 V120 Z" fill="#f8fafc" stroke="#1e3a8a" stroke-width="3"/><rect x="30" y="90" width="160" height="12" fill="#1e3a8a"/><rect x="58" y="54" width="104" height="26" rx="4" fill="#111827"/><text x="110" y="72" font-family="monospace" font-size="15" font-weight="700" fill="#ef4444" text-anchor="middle">STOP POLIZEI</text><rect x="70" y="36" width="80" height="10" rx="4" fill="#2563eb"/><circle cx="60" cy="122" r="14" fill="#111827"/><circle cx="160" cy="122" r="14" fill="#111827"/>`, 'Anhaltesignal Stop Polizei') },
];

export function eigeneSchreiben(dir) {
  mkdirSync(dir, { recursive: true });
  for (const e of EIGENE) writeFileSync(`${dir}/${e.nr}.svg`, e.svg);
  return EIGENE.map(({ svg: _s, ...rest }) => ({ ...rest, datei: `signs/eigen/${rest.nr}.svg` }));
}
