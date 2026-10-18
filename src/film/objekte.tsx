// Fahrzeuge, Personen und Lichtsignale für Filmszenen – eigene, schematische Draufsicht.
import type { FilmAmpel, FilmObjekt, Keyframe } from '../types';

export const MASSE: Record<FilmObjekt['art'], [number, number]> = {
  pkw: [1.8, 4.5], lkw: [2.5, 10], bus: [2.55, 12], transporter: [2, 5.6], krad: [0.8, 2.2], rad: [0.6, 1.8], fussg: [0.55, 0.35], kind: [0.42, 0.28],
  ball: [0.5, 0.5], reh: [0.5, 1.4], traktor: [2.2, 4], polizei: [1.8, 4.7], rtw: [2.1, 6], tram: [2.65, 30], roller: [0.7, 1.8], hund: [0.3, 0.8],
  kinderwagen: [0.6, 0.9], rollstuhl: [0.7, 0.9], bake: [0.3, 1.1], kegel: [0.5, 0.5],
};
const KLEIN = new Set(['fussg', 'kind', 'rad', 'krad', 'roller', 'ball', 'hund', 'reh', 'kinderwagen', 'rollstuhl', 'bake', 'kegel']);
const MOTOR = new Set(['pkw', 'lkw', 'bus', 'transporter', 'krad', 'traktor', 'polizei', 'rtw', 'tram', 'roller']);
export const hatLicht = (o: FilmObjekt) => o.licht ?? MOTOR.has(o.art);

/** Position und Richtung zum Zeitpunkt t (lineare Interpolation, Winkel auf kürzestem Weg) */
export function lage(bahn: Keyframe[], t: number): { x: number; y: number; w: number; v: number } {
  if (t <= bahn[0][0]) return { x: bahn[0][1], y: bahn[0][2], w: bahn[0][3], v: 0 };
  for (let i = 1; i < bahn.length; i++) {
    const [t1, x1, y1, w1] = bahn[i], [t0, x0, y0, w0] = bahn[i - 1];
    if (t <= t1) {
      const u = t1 === t0 ? 1 : (t - t0) / (t1 - t0);
      let dw = ((w1 - w0 + 540) % 360) - 180;
      const v = t1 === t0 ? 0 : Math.hypot(x1 - x0, y1 - y0) / (t1 - t0);
      return { x: x0 + (x1 - x0) * u, y: y0 + (y1 - y0) * u, w: w0 + dw * u, v };
    }
  }
  const l = bahn[bahn.length - 1];
  return { x: l[1], y: l[2], w: l[3], v: 0 };
}
const in_ = (zr: [number, number][] | undefined, t: number) => !!zr?.some(([a, b]) => t >= a && t <= b);
export const sichtbar = (o: FilmObjekt, t: number) => !o.sichtbar || (t >= o.sichtbar[0] && t <= o.sichtbar[1]);

function Koerper({ o, t }: { o: FilmObjekt; t: number }) {
  const [b, l] = MASSE[o.art];
  const f = o.farbe ?? (o.ich ? '#2563eb' : '#94a3b8');
  const tuer = in_(o.tuer, t);
  switch (o.art) {
    case 'fussg': case 'kind': {
      const s = o.art === 'kind' ? 0.75 : 1;
      return <g><ellipse rx={0.3 * s} ry={0.17 * s} fill={f} stroke="#1f2937" strokeWidth={0.05} /><circle r={0.13 * s} cy={-0.02} fill="#f2c9a0" stroke="#7c5a3a" strokeWidth={0.03} /></g>;
    }
    case 'ball': return <g><circle r={0.3} fill="#ef4444" stroke="#fff" strokeWidth={0.08} /><path d="M-0.3,0 A0.3,0.3 0 0 0 0.3,0" fill="#fde047" /></g>;
    case 'reh': return <g><ellipse rx={0.24} ry={0.6} fill="#a16207" /><ellipse cy={-0.75} rx={0.12} ry={0.22} fill="#854d0e" /><circle cy={0.55} r={0.08} fill="#fef3c7" /></g>;
    case 'hund': return <g><ellipse rx={0.15} ry={0.35} fill="#78350f" /><circle cy={-0.42} r={0.1} fill="#78350f" /></g>;
    case 'bake': return <g><rect x={-0.15} y={-0.55} width={0.3} height={1.1} fill="#fff" stroke="#b91c1c" strokeWidth={0.06} /><path d="M-0.15,-0.2 h0.3 M-0.15,0.2 h0.3" stroke="#dc2626" strokeWidth={0.18} /></g>;
    case 'kegel': return <g><circle r={0.25} fill="#f97316" /><circle r={0.12} fill="#fff" /><circle r={0.05} fill="#f97316" /></g>;
    case 'kinderwagen': return <rect x={-0.3} y={-0.45} width={0.6} height={0.9} rx={0.2} fill={o.farbe ?? '#7c3aed'} stroke="#1f2937" strokeWidth={0.05} />;
    case 'rollstuhl': return <g><rect x={-0.35} y={-0.3} width={0.7} height={0.7} rx={0.1} fill="#334155" /><circle r={0.16} fill="#f2c9a0" /></g>;
    case 'rad': case 'krad': case 'roller': return <g>
      <rect x={-0.08} y={-l / 2} width={0.16} height={l} rx={0.08} fill="#111827" />
      {o.art !== 'rad' && <rect x={-b / 2 + 0.1} y={-0.5} width={b - 0.2} height={1.1} rx={0.2} fill={f} />}
      <ellipse cy={0.1} rx={0.3} ry={0.17} fill={o.art === 'rad' ? f : '#1f2937'} /><circle cy={0.05} r={o.art === 'rad' ? 0.13 : 0.16} fill={o.art === 'rad' ? '#f2c9a0' : '#f8fafc'} stroke="#111" strokeWidth={0.03} />
    </g>;
    default: {
      const lang = o.art === 'lkw' || o.art === 'bus' || o.art === 'tram';
      const farbe = o.art === 'polizei' ? '#e5e7eb' : o.art === 'rtw' ? '#fefce8' : o.art === 'bus' ? (o.farbe ?? '#fde047') : f;
      return <g>
        <rect x={-b / 2} y={-l / 2} width={b} height={l} rx={0.45} fill={farbe} stroke="#0f172a" strokeWidth={0.07} />
        {o.art === 'lkw' && <rect x={-b / 2} y={-l / 2} width={b} height={2.2} rx={0.35} fill={o.farbe ?? '#ef4444'} stroke="#0f172a" strokeWidth={0.07} />}
        {o.art === 'lkw' && <rect x={-b / 2 + 0.15} y={-l / 2 + 2.4} width={b - 0.3} height={l - 2.6} fill="#f1f5f9" stroke="#94a3b8" strokeWidth={0.06} />}
        {o.art === 'traktor' && <><rect x={-b / 2 - 0.15} y={0.3} width={0.45} height={1.5} fill="#111" /><rect x={b / 2 - 0.3} y={0.3} width={0.45} height={1.5} fill="#111" /></>}
        {!lang && <rect x={-b / 2 + 0.2} y={-l / 2 + l * 0.2} width={b - 0.4} height={l * 0.15} rx={0.15} fill="#1e293b" opacity={0.85} />}
        {lang && o.art !== 'lkw' && <rect x={-b / 2 + 0.2} y={-l / 2 + 0.2} width={b - 0.4} height={0.9} rx={0.15} fill="#1e293b" opacity={0.85} />}
        {!lang && <rect x={-b / 2 + 0.25} y={l / 2 - l * 0.17} width={b - 0.5} height={l * 0.09} rx={0.12} fill="#1e293b" opacity={0.75} />}
        {o.art === 'polizei' && <rect x={-b / 2} y={-0.3} width={b} height={0.5} fill="#1d4ed8" />}
        {o.art === 'rtw' && <rect x={-b / 2} y={0} width={b} height={0.5} fill="#dc2626" />}
        {tuer && <line x1={-b / 2} y1={-l * 0.12} x2={-b / 2 - 0.9} y2={-l * 0.12 + 0.6} stroke="#f8fafc" strokeWidth={0.22} strokeLinecap="round" />}
        {tuer && <line x1={-b / 2} y1={-l * 0.12} x2={-b / 2 - 0.9} y2={-l * 0.12 + 0.6} stroke="#0f172a" strokeWidth={0.06} />}
      </g>;
    }
  }
}

/** Fahrzeug/Person ohne Lichter (Lichter siehe Leuchten) */
export function Objekt({ o, t }: { o: FilmObjekt; t: number }) {
  if (!sichtbar(o, t)) return null;
  const p = lage(o.bahn, t);
  // kleine Verkehrsteilnehmer zur besseren Erkennbarkeit vergrößert darstellen
  const s = KLEIN.has(o.art) ? 1.6 : 1;
  return <g transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.w.toFixed(2)})${s !== 1 ? ` scale(${s})` : ''}`}>
    <Koerper o={o} t={t} />
    {o.ich && <g transform={`rotate(${-p.w.toFixed(2)})${s !== 1 ? ` scale(${(1 / s).toFixed(3)})` : ''}`}><rect x={-1} y={-0.5} width={2} height={1} rx={0.5} fill="#1d4ed8" stroke="#fff" strokeWidth={0.1} /><text y={0.3} fontSize={0.8} textAnchor="middle" fill="#fff" fontWeight={700}>Sie</text></g>}
  </g>;
}

/** Lichter, Blinker, Bremslichter – werden über der Nachtmaske gezeichnet */
export function Leuchten({ o, t, nacht }: { o: FilmObjekt; t: number; nacht?: boolean }) {
  if (!sichtbar(o, t) || !MOTOR.has(o.art)) return null;
  const p = lage(o.bahn, t);
  const [b, l] = MASSE[o.art];
  const an = Math.floor(t / 0.4) % 2 === 0;
  const bl = o.blinker?.find(([a, e]) => t >= a && t <= e)?.[2] ?? (o.warnblink ? 'w' : null);
  const brems = in_(o.brems, t), blau = in_(o.blaulicht, t), rueck = in_(o.rueckfahr, t);
  const zw = o.art === 'krad' || o.art === 'roller';
  const r = 0.17;
  const lx = zw ? 0 : b / 2 - 0.25;
  return <g transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.w.toFixed(2)})`}>
    {(nacht || hatLicht(o)) && <>
      <circle cx={-lx} cy={-l / 2 + 0.1} r={r} fill="#fef9c3" opacity={nacht ? 1 : 0.85} />{!zw && <circle cx={lx} cy={-l / 2 + 0.1} r={r} fill="#fef9c3" opacity={nacht ? 1 : 0.85} />}
    </>}
    <circle cx={-lx} cy={l / 2 - 0.1} r={brems ? 0.22 : 0.14} fill={brems ? '#ff1f1f' : nacht ? '#b91c1c' : '#7f1d1d'} />
    {!zw && <circle cx={lx} cy={l / 2 - 0.1} r={brems ? 0.22 : 0.14} fill={brems ? '#ff1f1f' : nacht ? '#b91c1c' : '#7f1d1d'} />}
    {brems && !zw && <rect x={-0.3} y={l / 2 - 0.25} width={0.6} height={0.12} fill="#ff1f1f" />}
    {brems && <circle r={Math.max(b, 1.4)} cy={l / 2 + 0.4} fill="#ff2a2a" opacity={0.12} />}
    {rueck && <><circle cx={-lx + 0.25} cy={l / 2 - 0.1} r={0.13} fill="#fff" />{!zw && <circle cx={lx - 0.25} cy={l / 2 - 0.1} r={0.13} fill="#fff" />}</>}
    {bl && an && <>
      {(bl === 'l' || bl === 'w') && <><circle cx={-b / 2} cy={-l / 2 + 0.3} r={0.24} fill="#fb923c" /><circle cx={-b / 2} cy={l / 2 - 0.3} r={0.24} fill="#fb923c" /><circle cx={-b / 2 - 0.2} cy={0} r={0.5} fill="#fb923c" opacity={0.3} /></>}
      {(bl === 'r' || bl === 'w') && <><circle cx={b / 2} cy={-l / 2 + 0.3} r={0.24} fill="#fb923c" /><circle cx={b / 2} cy={l / 2 - 0.3} r={0.24} fill="#fb923c" /><circle cx={b / 2 + 0.2} cy={0} r={0.5} fill="#fb923c" opacity={0.3} /></>}
    </>}
    {blau && <><circle cx={-0.35} cy={-0.6} r={0.25} fill={an ? '#3b82f6' : '#1e3a8a'} /><circle cx={0.35} cy={-0.6} r={0.25} fill={an ? '#1e3a8a' : '#3b82f6'} /><circle r={2.4} cy={-0.6} fill="#3b82f6" opacity={an ? 0.18 : 0.08} /></>}
  </g>;
}

/** Lichtkegel des Abblendlichts (für die Nachtmaske, schwarz = sichtbar) */
export function Kegel({ o, t }: { o: FilmObjekt; t: number }) {
  if (!sichtbar(o, t) || !hatLicht(o)) return null;
  const p = lage(o.bahn, t);
  const l = MASSE[o.art][1];
  return <g transform={`translate(${p.x.toFixed(3)} ${p.y.toFixed(3)}) rotate(${p.w.toFixed(2)})`}>
    <path d={`M -1 ${-l / 2} L -8 ${-l / 2 - 30} Q 1 ${-l / 2 - 46} 12 ${-l / 2 - 36} L 1 ${-l / 2} Z`} fill="url(#film-kegel)" />
    <circle r={Math.max(l * 0.65, 2.2)} fill="url(#film-glow)" />
  </g>;
}

const LZ = { rot: '#ef4444', gelb: '#facc15', gruen: '#22c55e' };
export function Ampel({ a, t }: { a: FilmAmpel; t: number }) {
  let ph = a.phasen[0][1];
  for (const [ts, p] of a.phasen) if (t >= ts) ph = p;
  const blink = ph === 'gelbblink' && Math.floor(t / 0.5) % 2 === 0;
  const aus = '#1f2937';
  return <g transform={`translate(${a.x} ${a.y})`}>
    <rect x={-0.45} y={-1.3} width={0.9} height={2.6} rx={0.2} fill="#111827" stroke="#facc15" strokeWidth={0.06} />
    <circle cy={-0.82} r={0.32} fill={ph === 'rot' || ph === 'rotgelb' ? LZ.rot : aus} />
    <circle cy={0} r={0.32} fill={ph === 'gelb' || ph === 'rotgelb' || blink ? LZ.gelb : aus} />
    <circle cy={0.82} r={0.32} fill={ph === 'gruen' ? LZ.gruen : aus} />
    {a.gruenpfeil && <g transform="translate(0.95 0.5)"><rect x={-0.4} y={-0.3} width={0.8} height={0.6} fill="#111" /><path d="M-0.25,0 h0.4 m-0.15,-0.16 l0.16,0.16 l-0.16,0.16" stroke="#22c55e" strokeWidth={0.1} fill="none" /></g>}
  </g>;
}
