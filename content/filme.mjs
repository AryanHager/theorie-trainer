// Eigene animierte Verkehrsszenen („Filmfragen“) – vollständig selbst entworfen.
// Koordinaten in Metern, Draufsicht; −y = Norden („vorwärts“), Rechtsverkehr.
// Stadtstraße: Fahrbahn x ∈ [−3,5; 3,5], eigener Fahrstreifen x = 1,75 (Richtung Norden),
// Querstraße y ∈ [−3,5; 3,5]. Autobahn: Fahrstreifen x = 2,875 (links) / 6,625 (rechts).
const kmh = v => v / 3.6;
const rad = g => (g * Math.PI) / 180;

class Bahn {
  constructor(t, x, y, w = 0, v = 0) { this.t = t; this.x = x; this.y = y; this.w = w; this.v = kmh(v); this.p = [[t, x, y, w]]; }
  #push() { this.p.push([+this.t.toFixed(3), +this.x.toFixed(3), +this.y.toFixed(3), +this.w.toFixed(2)]); }
  /** Geschwindigkeit linear auf vEnd (km/h) ändern, geradeaus bzw. mit Drehrate (Grad/s) */
  fahr(dauer, vEnd, dreh = 0) {
    const v0 = this.v, v1 = vEnd === undefined ? v0 : kmh(vEnd), n = Math.max(1, Math.ceil(dauer / 0.1));
    for (let i = 1; i <= n; i++) {
      const dt = dauer / n, u = (i - 0.5) / n, v = v0 + (v1 - v0) * u;
      this.w += dreh * dt; this.x += Math.sin(rad(this.w)) * v * dt; this.y -= Math.cos(rad(this.w)) * v * dt; this.t += dt; this.#push();
    }
    this.v = v1; return this;
  }
  halt(dauer) { this.v = 0; this.t += dauer; this.#push(); return this; }
  /** Bogen um winkel Grad (positiv = rechts) mit Radius r bei aktueller Geschwindigkeit (oder vEnd) */
  bogen(r, winkel, vEnd) {
    const v = vEnd === undefined ? this.v : (this.v + kmh(vEnd)) / 2, laenge = Math.abs(rad(winkel)) * r, dauer = laenge / v;
    return this.fahr(dauer, vEnd, winkel / dauer);
  }
  /** seitlicher Versatz um dx (positiv = nach rechts) über dauer Sekunden */
  spur(dauer, dx, vEnd) {
    const v0 = this.v, v1 = vEnd === undefined ? v0 : kmh(vEnd), n = Math.ceil(dauer / 0.1), w0 = this.w;
    let alt = 0;
    for (let i = 1; i <= n; i++) {
      const dt = dauer / n, u = (i - 0.5) / n, v = v0 + (v1 - v0) * u;
      const o = dx * (1 - Math.cos(Math.PI * i / n)) / 2, d = o - alt; alt = o;
      const vor = v * dt;
      this.x += Math.sin(rad(w0)) * vor + Math.cos(rad(w0)) * d; this.y += -Math.cos(rad(w0)) * vor + Math.sin(rad(w0)) * d;
      this.w = w0 + (Math.atan2(dx * Math.PI / (2 * dauer) * Math.sin(Math.PI * i / n), Math.max(v, 0.5)) * 180) / Math.PI;
      this.t += dt; this.#push();
    }
    this.w = w0; this.p[this.p.length - 1][3] = w0; this.v = v1; return this;
  }
  /** Kreisbahn um (cx, cy) mit Radius r, Winkel phi0 → phi1 (Grad, SVG-Koordinaten; abnehmend = gegen den Uhrzeigersinn) */
  kreis(dauer, cx, cy, r, phi0, phi1) {
    const n = Math.ceil(dauer / 0.1);
    if (this.p.length === 1) this.p = [];
    for (let i = 0; i <= n; i++) {
      const ph = phi0 + (phi1 - phi0) * i / n;
      this.x = cx + r * Math.cos(rad(ph)); this.y = cy + r * Math.sin(rad(ph));
      this.w = phi1 < phi0 ? ph : ph + 180;
      if (i > 0) this.t += dauer / n;
      if (i > 0 || this.p.length === 0) this.#push();
    }
    this.v = rad(Math.abs(phi1 - phi0)) * r / dauer; return this;
  }
  /** Fahrt entlang der Kurvenstraße x = k·(y−y0)² für y < y0; versatz quer zur Mittellinie
   *  (positiv = rechts in Fahrtrichtung Norden). Fahrtrichtung aus aktuellem Winkel. */
  kurve(dauer, kk, y0, versatz, vEnd) {
    const v0 = this.v, v1 = vEnd === undefined ? v0 : kmh(vEnd), n = Math.ceil(dauer / 0.05);
    const mx = y => (y < y0 ? kk * (y - y0) ** 2 : 0), steig = y => (y < y0 ? 2 * kk * (y - y0) : 0);
    const sued = this.w > 90 && this.w < 270;
    let y = this.y;
    for (let i = 1; i <= n; i++) {
      const dt = dauer / n, v = v0 + (v1 - v0) * ((i - 0.5) / n);
      y += (sued ? 1 : -1) * v * dt / Math.sqrt(1 + steig(y) ** 2);
      const s = steig(y), wN = Math.atan2(-s, 1); // Richtung Norden (rad)
      this.x = mx(y) + versatz * Math.cos(wN); this.y = y + versatz * Math.sin(wN);
      this.w = sued ? (wN * 180) / Math.PI + 180 : (wN * 180) / Math.PI;
      this.t += dt; this.#push();
    }
    this.v = v1; return this;
  }
}
const B = (t, x, y, w, v) => new Bahn(t, x, y, w, v);
const steh = (x, y, w = 0) => [[0, x, y, w]];
let zaehl = 0;
const O = (art, bahn, extra = {}) => ({ id: extra.id ?? `${art}${++zaehl}`, art, bahn: bahn instanceof Bahn ? bahn.p : bahn, ...extra });
const ICH = (art, bahn, extra = {}) => O(art, bahn, { id: 'ich', ich: true, ...extra });
const parkreihe = (x, ys, w = 0, farben = ['#94a3b8', '#e2e8f0', '#b91c1c', '#065f46', '#78716c', '#1e293b']) => ys.map((y, i) => O('pkw', steh(x, y, w), { farbe: farben[i % farben.length], licht: false }));

export const FILME = [
  {
    id: 'f01-ball', titel: 'Ball zwischen parkenden Autos', dauer: 4.4, poster: 0.6, kamera: { b: 40 },
    welt: { typ: 'wohngebiet' },
    beschreibung: 'Sie fahren mit etwa 30 km/h durch eine schmale Wohnstraße. Rechts parken mehrere Autos dicht hintereinander, dahinter liegen Vorgärten. Plötzlich rollt zwischen zwei parkenden Autos ein roter Ball auf die Fahrbahn, direkt vor Ihnen.',
    objekte: [
      ...parkreihe(1.85, [-12, -19, -30.5, -37, -44]),
      O('ball', B(2.5, 4.5, -25.6, 270, 11).fahr(1.9, 8)),
      ICH('pkw', B(0, -0.5, 18, 0, 30).fahr(4.4)),
      O('pkw', B(0, -1.6, -52, 180, 25).fahr(4.4), { farbe: '#f59e0b', sichtbar: [0, 9] }),
    ],
  },
  {
    id: 'f02-tuer', titel: 'Tür eines parkenden Autos', dauer: 3.3, poster: 0.5, kamera: { b: 40 },
    welt: { typ: 'stadt', extras: ['parkstreifen'] },
    beschreibung: 'Sie fahren innerorts mit etwa 45 km/h. Rechts stehen Autos auf einem Parkstreifen. Im dritten parkenden Auto sitzt eine Person; kurz bevor Sie es erreichen, öffnet sich dessen Fahrertür zur Fahrbahn hin. Auf der Gegenfahrbahn kommt Ihnen ein Auto entgegen.',
    objekte: [
      ...parkreihe(4.6, [-14, -22]),
      O('pkw', steh(4.6, -30), { id: 'tuerauto', farbe: '#065f46', licht: false, tuer: [[2.1, 99]] }),
      ...parkreihe(4.6, [-38, -46, -54]),
      ICH('pkw', B(0, 1.75, 22, 0, 45).fahr(3.3)),
      O('pkw', B(0, -1.75, -55, 180, 45).fahr(3.3), { farbe: '#e2e8f0' }),
    ],
  },
  {
    id: 'f03-bus', titel: 'Linienbus an der Haltestelle', dauer: 3.4, poster: 0.5, kamera: { b: 46 },
    welt: { typ: 'stadt', extras: ['haltestelle'] },
    beschreibung: 'Vor Ihnen steht ein Linienbus in einer Haltebucht an einer Haltestelle. Sein Warnblinklicht ist eingeschaltet, Fahrgäste steigen aus und gehen auf dem Gehweg. Sie nähern sich mit etwa 40 km/h.',
    schilder: [{ nr: '224', x: 7.8, y: -44.5 }],
    objekte: [
      O('bus', steh(4.9, -41), { id: 'bus', warnblink: true }),
      O('fussg', B(0, 6.8, -38, 90, 3).fahr(3.4), { farbe: '#7c3aed' }),
      O('fussg', B(0.8, 6.8, -43, 120, 3.5).fahr(2.6), { farbe: '#0891b2' }),
      O('kind', B(1.5, 6.6, -36, 60, 3).fahr(1.9), { farbe: '#f43f5e' }),
      ICH('pkw', B(0, 1.75, 15, 0, 40).fahr(3.4)),
    ],
  },
  {
    id: 'f04-zebra', titel: 'Fußgängerin am Fußgängerüberweg', dauer: 3.5, poster: 0.4, kamera: { b: 44 },
    welt: { typ: 'zebra' },
    beschreibung: 'Sie fahren mit etwa 40 km/h auf einen Fußgängerüberweg (Zebrastreifen) zu. Rechts auf dem Gehweg geht eine Frau zügig auf den Überweg zu und wendet sich zur Fahrbahn.',
    schilder: [{ nr: '350-10', x: 5, y: 3 }],
    objekte: [
      O('fussg', B(0, 6.2, 6, 0, 4.7).fahr(2.6).bogen(0.8, -80).fahr(0.6), { farbe: '#be185d' }),
      ICH('pkw', B(0, 1.75, 54, 0, 40).fahr(3.5)),
    ],
  },
  {
    id: 'f05-rad-rechts', titel: 'Rechts abbiegen mit Radweg', dauer: 4, poster: 0.5, kamera: { x: 2, y: 8, b: 40 },
    welt: { typ: 'kreuzung', extras: ['radweg'] },
    beschreibung: 'Sie wollen an der Kreuzung nach rechts abbiegen, haben den rechten Blinker gesetzt und werden langsamer. Rechts neben der Fahrbahn verläuft ein Radweg. Ein Radfahrer fährt darauf von hinten heran und will geradeaus über die Kreuzung.',
    objekte: [
      ICH('pkw', B(0, 1.75, 30, 0, 30).fahr(3, 12).fahr(1), { blinker: [[0, 9, 'r']] }),
      O('rad', B(0, 4.5, 28, 0, 22).fahr(4), { farbe: '#16a34a' }),
    ],
  },
  {
    id: 'f06-links-gegen', titel: 'Linksabbiegen mit Gegenverkehr', dauer: 3.6, poster: 0.5, kamera: { x: 0, y: 4, b: 46 },
    welt: { typ: 'kreuzung' },
    beschreibung: 'Sie wollen an einer Kreuzung ohne Ampel nach links abbiegen und haben den linken Blinker gesetzt. Aus der Gegenrichtung nähert sich ein Auto, das geradeaus weiterfahren will.',
    objekte: [
      ICH('pkw', B(0, 1.2, 24, 0, 25).fahr(3, 8).fahr(0.6), { blinker: [[0, 9, 'l']] }),
      O('pkw', B(0, -1.75, -45, 180, 40).fahr(3.6), { farbe: '#dc2626' }),
    ],
  },
  {
    id: 'f07-rechts-vor-links', titel: 'Kreuzung ohne Verkehrszeichen', dauer: 2.8, poster: 0.4, kamera: { x: 2, y: 4, b: 46 },
    welt: { typ: 'kreuzung' },
    beschreibung: 'Sie nähern sich mit etwa 30 km/h einer Kreuzung, an der weder Ampeln noch Verkehrszeichen die Vorfahrt regeln. Von rechts kommt gleichzeitig ein Auto auf die Kreuzung zu.',
    objekte: [
      ICH('pkw', B(0, 1.75, 30, 0, 30).fahr(2.8)),
      O('pkw', B(0, 40, -1.75, 270, 30).fahr(2.8), { farbe: '#f59e0b' }),
    ],
  },
  {
    id: 'f08-kreisel', titel: 'Einfahrt in den Kreisverkehr', dauer: 3.4, poster: 0.4, kamera: { x: 0, y: 6, b: 50 },
    welt: { typ: 'kreisverkehr' },
    beschreibung: 'Sie fahren auf einen Kreisverkehr zu. An der Einfahrt stehen die Zeichen „Kreisverkehr“ und „Vorfahrt gewähren“. Im Kreis fährt bereits ein Auto, das sich Ihrer Einfahrt von links nähert.',
    schilder: [{ nr: '215', x: 5.4, y: 21 }, { nr: '205', x: 5.4, y: 23.2 }],
    objekte: [
      ICH('pkw', B(0, 1.75, 42, 0, 30).fahr(2.5, 15).fahr(0.9)),
      O('pkw', B(0, 0, 0).kreis(3.4, 0, 0, 11.5, 222, 106), { farbe: '#16a34a' }),
    ],
  },
  {
    id: 'f09-gelb', titel: 'Ampel wechselt auf Gelb', dauer: 2.4, poster: 0.3, kamera: { b: 56, vor: 0.38 },
    welt: { typ: 'kreuzung', linien: [{ x1: 0, y1: 4.3, x2: 3.5, y2: 4.3, art: 'halt' }] },
    beschreibung: 'Sie fahren mit etwa 40 km/h auf eine Kreuzung mit Ampel zu. Noch ein gutes Stück vor der Haltlinie springt die Ampel von Grün auf Gelb.',
    ampeln: [{ x: 4.7, y: 5.2, phasen: [[0, 'gruen'], [1.7, 'gelb']] }],
    objekte: [ICH('pkw', B(0, 1.75, 60, 0, 40).fahr(2.4))],
  },
  {
    id: 'f10-nacht-fussg', titel: 'Fußgänger bei Nacht auf der Landstraße', dauer: 2.6, poster: 0.3, kamera: { b: 52 },
    welt: { typ: 'landstrasse', nacht: true },
    beschreibung: 'Es ist Nacht. Sie fahren mit Abblendlicht und etwa 80 km/h auf einer unbeleuchteten Landstraße. Erst spät taucht im Scheinwerferlicht am rechten Fahrbahnrand eine dunkel gekleidete Person auf, die in Ihrer Richtung geht.',
    objekte: [
      O('fussg', B(0, 2.9, -42, 0, 4.5).fahr(2.6), { farbe: '#57534e' }),
      ICH('pkw', B(0, 1.6, 30, 0, 80).fahr(2.6)),
    ],
  },
  {
    id: 'f11-reh', titel: 'Reh auf der Fahrbahn', dauer: 2.3, poster: 0.3, kamera: { b: 64 },
    welt: { typ: 'landstrasse', nacht: true, extras: ['wald'] },
    beschreibung: 'Bei Dunkelheit fahren Sie mit etwa 60 km/h durch ein Waldstück. Vor Ihnen springt ein Reh von links nach rechts über die Fahrbahn und verschwindet im Wald.',
    schilder: [{ nr: '142-10', x: 5, y: 16 }],
    objekte: [
      O('reh', B(0.8, -9, -20, 90, 40).fahr(1.6), { sichtbar: [0.8, 9] }),
      ICH('pkw', B(0, 1.6, 40, 0, 60).fahr(2.3)),
    ],
  },
  {
    id: 'f12-nebel', titel: 'Dichter Nebel', dauer: 5.6, poster: 0.5, kamera: { b: 44 },
    welt: { typ: 'landstrasse', nebel: 22 },
    beschreibung: 'Sie fahren auf einer Landstraße in dichten Nebel; die Sicht reicht nur noch etwa 20 bis 30 Meter. Vor Ihnen taucht schemenhaft ein langsam fahrender Traktor auf.',
    objekte: [
      O('traktor', B(0, 1.6, -60, 0, 25).fahr(5.6), { farbe: '#15803d' }),
      ICH('pkw', B(0, 1.6, 30, 0, 70).fahr(5.6)),
    ],
  },
  {
    id: 'f13-wasser', titel: 'Wasser auf der Autobahn', dauer: 2.6, poster: 0.3, kamera: { b: 56 },
    welt: { typ: 'autobahn', regen: true, extras: ['pfuetze'] },
    beschreibung: 'Es regnet stark. Sie fahren auf der Autobahn mit etwa 110 km/h im rechten Fahrstreifen. Vor Ihnen steht auf Ihrem Fahrstreifen eine große Wasserfläche.',
    objekte: [
      ICH('pkw', B(0, 6.625, 40, 0, 110).fahr(2.6)),
      O('lkw', B(0, -6.6, -120, 180, 80).fahr(2.6), { farbe: '#0f766e' }),
    ],
  },
  {
    id: 'f14-stauende', titel: 'Stauende auf der Autobahn', dauer: 2, poster: 0.3, kamera: { b: 80, vor: 0.42 },
    welt: { typ: 'autobahn' },
    beschreibung: 'Sie fahren auf der Autobahn mit hoher Geschwindigkeit im linken Fahrstreifen. Vor Ihnen stehen auf beiden Fahrstreifen Fahrzeuge – ein Stauende. Die letzten Autos haben das Warnblinklicht eingeschaltet.',
    objekte: [
      O('pkw', steh(2.875, -70), { warnblink: true, brems: [[0, 9]], farbe: '#e2e8f0' }),
      O('pkw', steh(2.875, -77), { farbe: '#7c2d12', brems: [[0, 9]] }),
      O('lkw', steh(6.625, -76), { warnblink: true, brems: [[0, 9]] }),
      O('pkw', steh(2.875, -84), { farbe: '#1e3a8a', brems: [[0, 9]] }),
      ICH('pkw', B(0, 2.875, 40, 0, 120).fahr(2)),
    ],
  },
  {
    id: 'f15-gasse', titel: 'Stockender Verkehr auf der Autobahn', dauer: 4, poster: 0.5, kamera: { b: 56, vor: 0.05 },
    welt: { typ: 'autobahn' },
    beschreibung: 'Auf einer Autobahn mit zwei Fahrstreifen pro Richtung stockt der Verkehr; alle Fahrzeuge rollen nur noch im Schritttempo. Sie fahren im linken Fahrstreifen. Weiter hinten ist ein Fahrzeug mit Blaulicht zu sehen.',
    objekte: [
      ...[-14, -22, -30].map((y, i) => O('pkw', B(0, 2.875, y, 0, 5).fahr(4), { farbe: ['#e2e8f0', '#b91c1c', '#065f46'][i] })),
      ...[-6, -18, -32].map(y => O(y === -18 ? 'lkw' : 'pkw', B(0, 6.625, y, 0, 5).fahr(4))),
      O('rtw', B(0, 4.75, 14, 0, 25).fahr(4, 5), { blaulicht: [[0, 9]] }),
      ICH('pkw', B(0, 2.875, -6, 0, 5).fahr(4)),
    ],
  },
  {
    id: 'f16-blaulicht', titel: 'Einsatzfahrzeug von hinten', dauer: 3, poster: 0.4, kamera: { b: 46, vor: 0 },
    welt: { typ: 'stadt' },
    beschreibung: 'Sie fahren innerorts mit etwa 40 km/h. Hinter Ihnen nähert sich schnell ein Rettungswagen mit Blaulicht und Einsatzhorn. Auf der Gegenfahrbahn kommen Fahrzeuge entgegen.',
    objekte: [
      O('rtw', B(0, 1.75, 40, 0, 55).fahr(3), { blaulicht: [[0, 9]] }),
      O('pkw', B(0, -1.75, -40, 180, 45).fahr(3), { farbe: '#f59e0b' }),
      O('pkw', B(0, -1.75, -60, 180, 45).fahr(3), { farbe: '#64748b' }),
      ICH('pkw', B(0, 1.75, 18, 0, 40).fahr(3)),
    ],
  },
  {
    id: 'f17-auffahrt', titel: 'Auffahrt auf die Autobahn', dauer: 3.6, poster: 0.4, kamera: { b: 50 },
    welt: { typ: 'autobahn', extras: ['auffahrt'] },
    beschreibung: 'Sie fahren über den Beschleunigungsstreifen auf eine Autobahn auf. Auf dem rechten Fahrstreifen der Autobahn fährt ein Lkw etwa auf Ihrer Höhe, links daneben ist frei.',
    objekte: [
      O('lkw', B(0, 6.625, 40, 0, 82).fahr(3.6), { farbe: '#334155' }),
      O('pkw', B(0, 2.875, 60, 0, 130).fahr(3.6), { farbe: '#e2e8f0' }),
      ICH('pkw', B(0, 10.4, 46, 0, 70).fahr(3.6, 90)),
    ],
  },
  {
    id: 'f18-traktor', titel: 'Überholen eines Traktors', dauer: 3.2, poster: 0.4, kamera: { b: 64 },
    welt: { typ: 'landstrasse' },
    beschreibung: 'Auf einer Landstraße fahren Sie hinter einem langsamen Traktor her. Die Gegenfahrbahn scheint zunächst frei, doch dann taucht in einiger Entfernung ein entgegenkommendes Auto auf.',
    objekte: [
      O('traktor', B(0, 1.6, -4, 0, 25).fahr(3.2), { farbe: '#15803d' }),
      O('pkw', B(0, -1.6, -115, 180, 90).fahr(3.2), { farbe: '#dc2626', sichtbar: [0.9, 9] }),
      ICH('pkw', B(0, 1.6, 12, 0, 30).fahr(3.2, 34)),
    ],
  },
  {
    id: 'f19-schule', titel: 'Kinder vor einer Schule', dauer: 3, poster: 0.4, kamera: { b: 44 },
    welt: { typ: 'stadt', extras: ['schule'] },
    beschreibung: 'Sie fahren an einer Schule vorbei; Schulschluss. Auf dem rechten Gehweg laufen Kinder. Ein Kind rennt plötzlich in Richtung Bordstein.',
    schilder: [{ nr: '136-10', x: 5, y: 2 }],
    objekte: [
      O('kind', B(0, 7, -30, 0, 4).fahr(3), { farbe: '#f43f5e' }),
      O('kind', B(0, 8.2, -34, 180, 3.5).fahr(3), { farbe: '#22c55e' }),
      O('kind', B(1.2, 9.5, -26, 240, 12).fahr(1.8), { farbe: '#eab308', id: 'renner' }),
      ICH('pkw', B(0, 1.75, 16, 0, 40).fahr(3)),
    ],
  },
  {
    id: 'f20-bahn', titel: 'Bahnübergang mit Andreaskreuz', dauer: 3.2, poster: 0.4, kamera: { b: 64 },
    welt: { typ: 'bahnuebergang' },
    beschreibung: 'Sie nähern sich auf einer Landstraße einem Bahnübergang ohne Schranken, der nur durch Andreaskreuze gesichert ist. Von links nähert sich auf den Gleisen ein Zug.',
    schilder: [{ nr: '201-50', x: 4.6, y: 5 }],
    objekte: [
      O('tram', B(0, -80, 0, 90, 80).fahr(3.2), { farbe: '#b91c1c', licht: true }),
      ICH('pkw', B(0, 1.6, 64, 0, 60).fahr(3.2, 40)),
    ],
  },
  {
    id: 'f21-lkw-rad', titel: 'Mit dem Fahrrad neben einem abbiegenden Lkw', dauer: 3, poster: 0.4, kamera: { x: 3, y: 6, b: 44 },
    welt: { typ: 'kreuzung', extras: ['radweg'] },
    beschreibung: 'Sie fahren mit dem Fahrrad auf dem Radweg geradeaus auf eine Kreuzung zu. Links neben Ihnen auf der Fahrbahn fährt ein Lkw langsam heran und blinkt rechts.',
    objekte: [
      O('lkw', B(0, 1.75, 16, 0, 15).fahr(3, 10), { blinker: [[0, 9, 'r']], farbe: '#ea580c' }),
      ICH('rad', B(0, 4.5, 20, 0, 18).fahr(3)),
    ],
  },
  {
    id: 'f22-schutzstreifen', titel: 'Radfahrer auf dem Schutzstreifen', dauer: 3, poster: 0.4, kamera: { b: 44 },
    welt: { typ: 'stadt', extras: ['schutzstreifen'] },
    beschreibung: 'Vor Ihnen fährt ein Radfahrer auf einem Schutzstreifen am rechten Fahrbahnrand. Sie fahren schneller und würden ihn gern überholen. Auf der Gegenfahrbahn kommt ein Auto entgegen.',
    objekte: [
      O('rad', B(0, 2.75, -6, 0, 18).fahr(3)),
      O('pkw', B(0, -1.75, -55, 180, 45).fahr(3), { farbe: '#16a34a' }),
      ICH('pkw', B(0, 0.6, 14, 0, 40).fahr(3, 25)),
    ],
  },
  {
    id: 'f23-fussg-abbiegen', titel: 'Rechts abbiegen bei Grün mit Fußgängern', dauer: 3.4, poster: 0.4, kamera: { x: 3, y: 4, b: 44 },
    welt: { typ: 'kreuzung' },
    beschreibung: 'Ihre Ampel zeigt Grün und Sie wollen rechts abbiegen. Gleichzeitig überqueren mehrere Fußgänger parallel zu Ihrer Fahrtrichtung die Straße, in die Sie einbiegen wollen.',
    ampeln: [{ x: 4.7, y: 5.2, phasen: [[0, 'gruen']] }],
    objekte: [
      O('fussg', B(0, 5.6, 6, 0, 4.5).fahr(3.4), { farbe: '#7c3aed' }),
      O('fussg', B(0, 6.3, 3.5, 0, 4).fahr(3.4), { farbe: '#0ea5e9' }),
      O('kinderwagen', B(0.5, 5.6, 10, 0, 4).fahr(2.9), { farbe: '#db2777' }),
      ICH('pkw', B(0, 1.75, 24, 0, 25).fahr(3, 10).fahr(0.4), { blinker: [[0, 9, 'r']] }),
    ],
  },
  {
    id: 'f24-anfahren', titel: 'Anfahren vom Fahrbahnrand', dauer: 3, poster: 0.3, kamera: { x: 3, y: 0, b: 40 },
    welt: { typ: 'stadt', extras: ['parkstreifen'] },
    beschreibung: 'Sie stehen mit Ihrem Auto auf einem Parkstreifen am rechten Fahrbahnrand und wollen losfahren. Auf der Fahrbahn nähern sich von hinten ein Radfahrer und dahinter ein Auto.',
    objekte: [
      ...parkreihe(4.6, [-8, 8]),
      ICH('pkw', [[0, 4.6, 0, 0]], { blinker: [[0, 9, 'l']] }),
      O('rad', B(0, 2.6, 14, 0, 20).fahr(3)),
      O('pkw', B(0, 1.75, 36, 0, 40).fahr(3), { farbe: '#f59e0b' }),
    ],
  },
  {
    id: 'f25-spielstrasse', titel: 'Verkehrsberuhigter Bereich', dauer: 3.2, poster: 0.4, kamera: { b: 40 },
    welt: { typ: 'wohngebiet' },
    beschreibung: 'Sie fahren in einen verkehrsberuhigten Bereich ein. Auf der Fahrbahn spielen zwei Kinder mit einem Ball, eine Person geht mitten auf der Straße.',
    schilder: [{ nr: '325.1', x: 3.6, y: 14 }],
    objekte: [
      O('kind', B(0, -1.2, -9, 90, 3).fahr(3.2), { farbe: '#f43f5e' }),
      O('kind', B(0, 1.6, -12, 270, 2).fahr(3.2), { farbe: '#22c55e' }),
      O('ball', B(0, 0.2, -10.5, 90, 4).fahr(3.2)),
      O('fussg', B(0, 0, -20, 180, 3).fahr(3.2), { farbe: '#334155' }),
      ICH('pkw', B(0, 0.2, 18, 0, 20).fahr(3.2, 15)),
    ],
  },
  {
    id: 'f26-schnee', titel: 'Schneeglätte', dauer: 3.2, poster: 0.4, kamera: { b: 52 },
    welt: { typ: 'landstrasse', schnee: true },
    beschreibung: 'Es schneit, die Fahrbahn ist weiß. Vor Ihnen fährt ein Auto, dessen Bremslichter aufleuchten; es kommt leicht ins Schlingern.',
    objekte: [
      O('pkw', B(0, 1.6, -16, 0, 50).spur(1.4, 0.5).spur(1.8, -0.5, 30), { brems: [[1.2, 9]], farbe: '#b91c1c' }),
      ICH('pkw', B(0, 1.6, 10, 0, 55).fahr(3.2, 45)),
    ],
  },
  {
    id: 'f27-dicht', titel: 'Zu dicht aufgefahren', dauer: 2.2, poster: 0.3, kamera: { b: 40 },
    welt: { typ: 'stadt' },
    beschreibung: 'Sie fahren mit etwa 50 km/h nur wenige Meter hinter einem anderen Auto. Plötzlich leuchten dessen Bremslichter auf und es bremst stark.',
    objekte: [
      O('pkw', B(0, 1.75, -9, 0, 50).fahr(1.2).fahr(1, 25), { brems: [[1.2, 9]], farbe: '#e2e8f0' }),
      ICH('pkw', B(0, 1.75, 0, 0, 50).fahr(2.2)),
    ],
  },
  {
    id: 'f28-motorrad', titel: 'Motorrad im Gegenverkehr', dauer: 2.4, poster: 0.4, kamera: { x: 0, y: -3, b: 50 },
    welt: { typ: 'kreuzung' },
    beschreibung: 'Sie stehen in der Kreuzungsmitte und wollen links abbiegen. Ein entgegenkommendes Auto biegt gerade (von Ihnen aus gesehen) nach links ab und gibt den Blick frei; dahinter nähert sich zügig ein Motorrad, das geradeaus fahren will.',
    objekte: [
      ICH('pkw', [[0, 1.2, 1, 0]], { blinker: [[0, 9, 'l']] }),
      O('pkw', B(0, -1.75, -12, 180, 20).fahr(1.2).bogen(3.5, 90).fahr(1.5), { farbe: '#64748b', blinker: [[0, 9, 'r']] }),
      O('krad', B(0, -1.75, -52, 180, 55).fahr(2.4), { farbe: '#111827' }),
    ],
  },
  {
    id: 'f29-einmuendung', titel: 'Einmündung mit „Vorfahrt gewähren“', dauer: 3, poster: 0.4, kamera: { x: 2, y: 0, b: 50 },
    welt: { typ: 'einmuendung', linien: [{ x1: 3.8, y1: -3.5, x2: 3.8, y2: 0, art: 'warte' }] },
    beschreibung: 'Sie kommen aus einer Seitenstraße und wollen an einer Einmündung auf die Hauptstraße. Vor Ihnen steht „Vorfahrt gewähren“. Auf der Hauptstraße nähert sich von links ein Lieferwagen, von rechts ein Auto.',
    schilder: [{ nr: '205', x: 5.2, y: -5.6 }],
    objekte: [
      ICH('pkw', B(0, 30, -1.75, 270, 30).fahr(2.6, 8).fahr(0.4)),
      O('transporter', B(0, 1.75, 40, 0, 45).fahr(3), { farbe: '#f8fafc' }),
      O('pkw', B(0, -1.75, -46, 180, 45).fahr(3), { farbe: '#dc2626' }),
    ],
  },
  {
    id: 'f30-bus-abfahrt', titel: 'Bus verlässt die Haltestelle', dauer: 3, poster: 0.6, kamera: { b: 64, vor: 0.35 },
    welt: { typ: 'stadt', extras: ['haltestelle'] },
    beschreibung: 'Vor Ihnen steht ein Linienbus an einer gekennzeichneten Haltestelle. Er setzt den linken Blinker und beginnt, aus der Haltebucht auf die Fahrbahn zu fahren. Sie nähern sich mit etwa 40 km/h.',
    schilder: [{ nr: '224', x: 7.8, y: -44.5 }],
    objekte: [
      O('bus', B(0, 4.9, -41, 0, 0).halt(0.8).fahr(2.2, 15, -6), { blinker: [[0, 9, 'l']] }),
      ICH('pkw', B(0, 1.75, 14, 0, 40).fahr(3)),
    ],
  },
  {
    id: 'f31-rad-hindernis', titel: 'Radfahrer vor einem Hindernis', dauer: 2.8, poster: 0.4, kamera: { b: 44 },
    welt: { typ: 'stadt' },
    beschreibung: 'Vor Ihnen fährt ein Radfahrer am rechten Fahrbahnrand. Ein Stück weiter vorne steht ein Lieferwagen halb auf der Fahrbahn. Der Radfahrer muss gleich an ihm vorbei.',
    objekte: [
      O('transporter', steh(2.9, -26), { warnblink: true, farbe: '#f8fafc' }),
      O('rad', B(0, 2.9, -4, 0, 18).fahr(2.8), { farbe: '#0ea5e9' }),
      ICH('pkw', B(0, 1.2, 12, 0, 35).fahr(2.8, 28)),
    ],
  },
  {
    id: 'f32-engstelle', titel: 'Hindernis auf Ihrer Seite', dauer: 3.2, poster: 0.4, kamera: { b: 50 },
    welt: { typ: 'stadt' },
    beschreibung: 'Auf Ihrer Fahrbahnseite steht ein Lkw mit eingeschaltetem Warnblinklicht und wird entladen. Um vorbeizukommen, müssten Sie auf die Gegenfahrbahn ausweichen. Dort kommt ein Auto entgegen.',
    objekte: [
      O('lkw', steh(2.1, -28), { warnblink: true, farbe: '#7c3aed' }),
      O('pkw', B(0, -1.75, -60, 180, 40).fahr(3.2), { farbe: '#f59e0b' }),
      ICH('pkw', B(0, 1.75, 14, 0, 35).fahr(3.2, 20)),
    ],
  },
  {
    id: 'f33-reissverschluss', titel: 'Fahrstreifen endet an einer Baustelle', dauer: 3, poster: 0.4, kamera: { b: 56 },
    welt: { typ: 'autobahn' },
    beschreibung: 'Auf der Autobahn endet vor einer Baustelle der rechte Fahrstreifen; Leitbaken führen ihn schräg nach links. Sie fahren im rechten Fahrstreifen, links rollt dichter Verkehr.',
    objekte: [
      ...Array.from({ length: 9 }, (_, i) => O('bake', steh(8 - i * 0.45, -40 - i * 5, -5))),
      ...Array.from({ length: 8 }, (_, i) => O('bake', steh(4.6, -80 - i * 6))),
      ...[-6, -16, -27, -38].map((y, i) => O('pkw', B(0, 2.875, y, 0, 40).fahr(3), { farbe: ['#e2e8f0', '#b91c1c', '#0f766e', '#1e293b'][i] })),
      ICH('pkw', B(0, 6.625, 10, 0, 45).fahr(3, 35)),
    ],
  },
  {
    id: 'f34-mittelinsel', titel: 'Ältere Fußgängerin an der Mittelinsel', dauer: 3, poster: 0.4, kamera: { b: 44 },
    welt: { typ: 'stadt', extras: ['mittelinsel'] },
    beschreibung: 'Eine ältere Frau mit Gehstock überquert langsam die Fahrbahn zur Mittelinsel. Sie hat Ihren Fahrstreifen noch nicht ganz verlassen, als Sie sich mit etwa 40 km/h nähern.',
    objekte: [
      O('fussg', B(0, 4, 0, 270, 2.7).fahr(3), { farbe: '#a8a29e' }),
      ICH('pkw', B(0, 1.75, 44, 0, 40).fahr(3)),
    ],
  },
  {
    id: 'f35-hund', titel: 'Hund am Fahrbahnrand', dauer: 2.6, poster: 0.4, kamera: { b: 56 },
    welt: { typ: 'landstrasse' },
    beschreibung: 'Am rechten Rand einer Landstraße läuft ein Hund ohne Leine; weit und breit ist kein Mensch zu sehen. Er schnüffelt mal am Grünstreifen, mal am Asphalt.',
    objekte: [
      O('hund', B(0, 4.2, -30, 340, 8).fahr(1, 6, 25).fahr(1.6, 6, -30)),
      ICH('pkw', B(0, 1.6, 20, 0, 70).fahr(2.6)),
    ],
  },
  {
    id: 'f36-gruenpfeil', titel: 'Grünpfeil bei Rot', dauer: 3.4, poster: 0.4, kamera: { x: 4, y: 4, b: 40 },
    welt: { typ: 'kreuzung', linien: [{ x1: 0, y1: 4.3, x2: 3.5, y2: 4.3, art: 'halt' }] },
    beschreibung: 'Ihre Ampel zeigt Rot, rechts daneben ist ein grüner Pfeil auf schwarzem Grund angebracht. Sie wollen rechts abbiegen. In der Straße, in die Sie einbiegen wollen, gehen Fußgänger über die Fahrbahn.',
    ampeln: [{ x: 4.7, y: 5.2, phasen: [[0, 'rot']], gruenpfeil: true }],
    objekte: [
      O('fussg', B(0, 7, 5, 0, 4).fahr(3.4), { farbe: '#0ea5e9' }),
      O('fussg', B(0, 6.2, -5, 180, 4.5).fahr(3.4), { farbe: '#be185d' }),
      ICH('pkw', B(0, 1.75, 20, 0, 25).fahr(3, 6).fahr(0.4), { blinker: [[0, 9, 'r']] }),
    ],
  },
  {
    id: 'f37-einbahn-rad', titel: 'Radfahrer in der Einbahnstraße', dauer: 3, poster: 0.4, kamera: { b: 40 },
    welt: { typ: 'wohngebiet' },
    beschreibung: 'Sie fahren durch eine schmale Einbahnstraße. Links und rechts parken Autos. Ihnen kommt ein Radfahrer entgegen.',
    schilder: [{ nr: '220-20', x: 3.5, y: 12 }],
    objekte: [
      ...parkreihe(1.85, [-10, -17, -30, -37]), ...parkreihe(-1.85, [-14, -24, -34], 180),
      O('rad', B(0, -0.6, -36, 180, 16).fahr(3), { farbe: '#16a34a' }),
      ICH('pkw', B(0, 0, 14, 0, 30).fahr(3, 20)),
    ],
  },
  {
    id: 'f38-ausscheren', titel: 'Ausscheren zum Überholen', dauer: 2.5, poster: 0.4, kamera: { b: 50, vor: 0.05 },
    welt: { typ: 'autobahn' },
    beschreibung: 'Sie fahren auf der Autobahn rechts hinter einem Lkw und möchten ihn überholen. Im Rückspiegel sehen Sie auf dem linken Fahrstreifen ein deutlich schnelleres Auto herankommen.',
    objekte: [
      O('lkw', B(0, 6.625, -16, 0, 85).fahr(2.5)),
      O('pkw', B(0, 2.875, 60, 0, 160).fahr(2.5), { farbe: '#111827' }),
      ICH('pkw', B(0, 6.625, 0, 0, 90).fahr(2.5, 85), { blinker: [[1, 9, 'l']] }),
    ],
  },
  {
    id: 'f39-ampel-aus', titel: 'Ampel ausgefallen', dauer: 3, poster: 0.4, kamera: { x: 0, y: 4, b: 50 },
    welt: { typ: 'kreuzung' },
    beschreibung: 'Die Ampel an der Kreuzung ist ausgefallen und dunkel. Unter der Ampel steht für Ihre Richtung das Zeichen „Vorfahrt gewähren“. Auf der Querstraße nähern sich Fahrzeuge von links und rechts.',
    ampeln: [{ x: 4.7, y: 5.2, phasen: [[0, 'aus']] }],
    schilder: [{ nr: '205', x: 4.7, y: 8 }],
    objekte: [
      ICH('pkw', B(0, 1.75, 26, 0, 30).fahr(3, 10)),
      O('pkw', B(0, -40, 1.75, 90, 40).fahr(3), { farbe: '#dc2626' }),
      O('transporter', B(0, 44, -1.75, 270, 40).fahr(3), { farbe: '#f8fafc' }),
    ],
  },
  {
    id: 'f40-schulbus', titel: 'Schulbus auf der Gegenseite', dauer: 3, poster: 0.4, kamera: { b: 46 },
    welt: { typ: 'stadt' },
    beschreibung: 'Auf der gegenüberliegenden Straßenseite hält ein gekennzeichneter Schulbus an einer Haltestelle; sein Warnblinklicht ist eingeschaltet. Kinder steigen aus. Sie fahren auf derselben Fahrbahn in Gegenrichtung auf den Bus zu.',
    schilder: [{ nr: '224', x: -5, y: -24 }],
    objekte: [
      O('bus', steh(-2.2, -30, 180), { warnblink: true, farbe: '#fbbf24' }),
      O('kind', B(0, -4.6, -26, 270, 2.5).fahr(3), { farbe: '#f43f5e' }),
      O('kind', B(0.6, -4.2, -33, 0, 3).fahr(2.4), { farbe: '#22c55e' }),
      ICH('pkw', B(0, 1.75, 16, 0, 40).fahr(3)),
    ],
  },
  {
    id: 'f41-laub', titel: 'Nasses Laub vor einer Kurve', dauer: 3.4, poster: 0.4, kamera: { b: 56 },
    welt: { typ: 'kurve', regen: true, laub: true, kurve: { y0: -10, k: 0.012 } },
    beschreibung: 'Herbst, es nieselt. Die Landstraße führt in eine Rechtskurve, auf der Fahrbahn liegt viel nasses Laub. Sie nähern sich der Kurve mit etwa 70 km/h.',
    objekte: [ICH('pkw', B(0, 1.6, 50, 0, 70).kurve(3.4, 0.012, -10, 1.6))],
  },
  {
    id: 'f42-kurve-krad', titel: 'Gegenverkehr schneidet die Kurve', dauer: 2.2, poster: 0.4, kamera: { b: 56 },
    welt: { typ: 'kurve', kurve: { y0: -10, k: 0.012 } },
    beschreibung: 'Sie fahren mit dem Motorrad in eine Rechtskurve. Ein entgegenkommendes Auto schneidet die Kurve und fährt dabei teilweise auf Ihrer Fahrbahnhälfte.',
    objekte: [
      ICH('krad', B(0, 1.8, 40, 0, 60).kurve(2.2, 0.012, -10, 1.8)),
      O('pkw', B(0, 17.3, -48, 180, 60).kurve(2.2, 0.012, -10, 0.4), { farbe: '#dc2626' }),
    ],
  },
  // ---- Phase 2: Szenen für Lkw, Bus, Zugmaschine und Motorrad ----
  {
    id: 'f43-lkw-rechts-rad', titel: 'Mit dem Lkw rechts abbiegen', dauer: 4.2, poster: 0.5, kamera: { x: 2, y: 8, b: 46 },
    welt: { typ: 'kreuzung', extras: ['radweg'] },
    beschreibung: 'Sie fahren innerorts einen Lkw und wollen an der Kreuzung nach rechts abbiegen. Der rechte Blinker ist gesetzt, Sie werden langsamer. Auf dem Radweg rechts neben Ihnen fährt eine Radfahrerin von hinten heran und will geradeaus weiterfahren.',
    objekte: [
      ICH('lkw', B(0, 1.75, 34, 0, 25).fahr(3, 7).fahr(1.2), { blinker: [[0, 9, 'r']] }),
      O('rad', B(0, 4.5, 34, 0, 20).fahr(4.2), { farbe: '#db2777' }),
    ],
  },
  {
    id: 'f44-bus-haltestelle', titel: 'Mit dem Bus an die Haltestelle', dauer: 3.6, poster: 0.5, kamera: { b: 36, vor: 0.25 },
    welt: { typ: 'stadt', extras: ['haltestelle'] },
    beschreibung: 'Sie fahren einen Linienbus und steuern die Haltebucht einer Haltestelle an. Auf dem Gehweg warten mehrere Personen; ein Kind läuft vom hinteren Ende der Haltestelle eilig in Richtung Bordsteinkante.',
    schilder: [{ nr: '224', x: 7.8, y: -44.5 }],
    objekte: [
      ICH('bus', B(0, 1.75, -28, 0, 25).spur(2.8, 3.15, 6).fahr(0.8, 0), { blinker: [[0, 9, 'r']] }),
      O('fussg', steh(6.9, -44, 270), { farbe: '#7c3aed' }),
      O('fussg', steh(7.1, -40, 270), { farbe: '#0891b2' }),
      O('kind', B(0.4, 8.6, -36, 250, 6).fahr(2, 1), { farbe: '#f43f5e' }),
    ],
  },
  {
    id: 'f45-traktor-kolonne', titel: 'Langsame Zugmaschine mit Kolonne', dauer: 4, poster: 0.5, kamera: { b: 64, vor: -0.3 },
    welt: { typ: 'landstrasse' },
    beschreibung: 'Sie fahren mit einer Zugmaschine auf einer kurvigen Landstraße mit etwa 25 km/h. Im Rückspiegel sehen Sie, dass sich hinter Ihnen mehrere Autos angesammelt haben. Gegenverkehr verhindert das Überholen.',
    objekte: [
      ICH('traktor', B(0, 1.75, 10, 0, 25).fahr(4), { farbe: '#15803d' }),
      ...[16, 23, 30, 37].map((y, i) => O('pkw', B(0, 1.75, y, 0, 25).fahr(4), { farbe: ['#e2e8f0', '#b91c1c', '#0f766e', '#1e293b'][i] })),
      O('pkw', B(0, -1.75, -60, 180, 70).fahr(4), { farbe: '#f59e0b' }),
    ],
  },
  {
    id: 'f46-lkw-abstand', titel: 'Lkw dicht hinter Lkw', dauer: 3, poster: 0.5, kamera: { b: 60 },
    welt: { typ: 'autobahn' },
    beschreibung: 'Sie fahren mit einem schweren Lkw auf der Autobahn im rechten Fahrstreifen mit etwa 80 km/h. Vor Ihnen fährt ein anderer Lkw gleich schnell; der Abstand beträgt nur etwa 25 Meter. Links werden Sie von Autos überholt.',
    objekte: [
      O('lkw', B(0, 6.625, -17, 0, 80).fahr(3), { farbe: '#0f766e' }),
      ICH('lkw', B(0, 6.625, 8, 0, 80).fahr(3, 78)),
      O('pkw', B(0, 2.875, 40, 0, 120).fahr(3), { farbe: '#111827' }),
    ],
  },
  {
    id: 'f47-krad-einmuendung', titel: 'Wartepflichtiges Auto rollt vor', dauer: 2.8, poster: 0.4, kamera: { x: 2, y: 0, b: 50 },
    welt: { typ: 'einmuendung', linien: [{ x1: 3.8, y1: -3.5, x2: 3.8, y2: 0, art: 'warte' }] },
    beschreibung: 'Sie fahren mit dem Motorrad mit etwa 50 km/h auf einer Vorfahrtstraße. Rechts mündet eine Seitenstraße mit „Vorfahrt gewähren“ ein. Dort rollt ein Auto langsam an die Wartelinie heran; die Fahrerin schaut nach links.',
    schilder: [{ nr: '306', x: 5, y: 26 }],
    objekte: [
      ICH('krad', B(0, 1.75, 44, 0, 50).fahr(2.8, 40)),
      O('pkw', B(0, 12, -1.75, 270, 12).fahr(1.6, 6).fahr(1.2, 0), { farbe: '#64748b' }),
    ],
  },
  // ---- Phase 3: weitere Szenen für Bus, Lkw, Motorrad und Zugmaschine ----
  {
    id: 'f48-bus-rad-links', titel: 'Bus will abfahren – Radfahrer von hinten', dauer: 3.4, poster: 0.5, kamera: { x: 3, y: -34, b: 40 },
    welt: { typ: 'stadt', extras: ['haltestelle'] },
    beschreibung: 'Sie stehen mit einem Linienbus in einer Haltebucht und haben den linken Blinker gesetzt, um wieder auf die Fahrbahn zu fahren. Von hinten nähert sich auf der Fahrbahn ein Radfahrer, der dicht links an Ihrem Bus vorbeifahren will.',
    schilder: [{ nr: '224', x: 7.8, y: -44.5 }],
    objekte: [
      ICH('bus', steh(4.9, -41), { blinker: [[0, 9, 'l']] }),
      O('rad', B(0, 2.4, -16, 0, 18).fahr(3.4), { farbe: '#16a34a' }),
      O('fussg', steh(7.1, -44, 270), { farbe: '#7c3aed' }),
    ],
  },
  {
    id: 'f49-lkw-rueckwaerts', titel: 'Lkw rückwärts auf dem Betriebshof', dauer: 3.6, poster: 0.5, kamera: { x: 0, y: -2, b: 40 },
    welt: { typ: 'parkplatz' },
    beschreibung: 'Sie setzen mit einem Lkw auf einem Betriebshof langsam rückwärts, um an eine Laderampe zu fahren. Der Rückfahrwarner ist eingeschaltet. Hinter dem Lkw geht von links eine Person quer über den Hof, die auf ihr Mobiltelefon schaut.',
    objekte: [
      ICH('lkw', B(0, 0, -12, 0, -5).fahr(3.6, -4), { rueckfahr: [[0, 9]] }),
      O('fussg', B(0.3, -5.5, 4, 90, 5).fahr(3.3), { farbe: '#ea580c' }),
    ],
  },
  {
    id: 'f50-krad-kolonne', titel: 'Motorrad in der Kolonne hinter einem Traktor', dauer: 3, poster: 0.5, kamera: { b: 76, vor: 0.4 },
    welt: { typ: 'landstrasse' },
    beschreibung: 'Sie fahren mit dem Motorrad auf einer Landstraße hinter einem Pkw. Vor dem Pkw fährt ein Traktor, der den linken Blinker setzt und langsamer wird. Der Pkw vor Ihnen bremst deutlich.',
    objekte: [
      O('traktor', B(0, 1.6, -50, 0, 25).fahr(3, 10), { farbe: '#15803d', blinker: [[0.8, 9, 'l']] }),
      O('pkw', B(0, 1.6, -12, 0, 70).fahr(0.8).fahr(2.2, 20), { farbe: '#e2e8f0', brems: [[0.8, 9]] }),
      ICH('krad', B(0, 1.2, 8, 0, 70).fahr(3, 45)),
    ],
  },
  {
    id: 'f51-traktor-feldweg', titel: 'Mit der Zugmaschine links in einen Feldweg', dauer: 3.2, poster: 0.4, kamera: { b: 64, vor: 0.1 },
    welt: { typ: 'landstrasse', extras: ['feldweg'] },
    beschreibung: 'Sie fahren mit einer Zugmaschine auf einer Landstraße und wollen gleich links in einen Feldweg abbiegen. Der linke Blinker ist gesetzt. Von hinten kommt ein Pkw heran, der bereits zum Überholen auf die Gegenfahrbahn ausschert.',
    objekte: [
      ICH('traktor', B(0, 1.6, 10, 0, 25).fahr(3.2, 12), { farbe: '#15803d', blinker: [[0, 9, 'l']] }),
      O('pkw', B(0, 1.6, 40, 0, 80).spur(1.4, -3.2).fahr(1.8), { farbe: '#b91c1c', blinker: [[0, 1.4, 'l']] }),
    ],
  },
];
