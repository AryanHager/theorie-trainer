// Statische Szenerie einer Filmszene (Draufsicht, Maßstab 1 Einheit = 1 m, „vorwärts“ = −y).
// Komplett eigene, schematische Darstellung.
import type { FilmWelt } from '../types';

const ASPHALT = '#4b5563', GEHWEG = '#d6d3d1', GRAS = '#86b46a', LINIE = '#f8fafc', HAUS = ['#e7c9a9', '#cbd5e1', '#f1d4c4', '#d9c7a3', '#bfcfd9', '#e5d3b3'];
const E = 320; // halbe Ausdehnung der gezeichneten Welt

function Haeuser({ x0, x1, auslassen }: { x0: number; x1: number; auslassen?: (y: number) => boolean }) {
  const r = [];
  for (let y = -E, i = 0; y < E; y += 16, i++) {
    if (auslassen?.(y) || auslassen?.(y + 13)) continue;
    r.push(<rect key={y} x={Math.min(x0, x1)} y={y} width={Math.abs(x1 - x0)} height={13} rx={0.6} fill={HAUS[(i * 7 + Math.round(x0)) % HAUS.length]} stroke="#9ca3af" strokeWidth={0.15} />);
  }
  return <g>{r}</g>;
}
function Baeume({ x, schritt = 15, versatz = 0, dicht }: { x: number; schritt?: number; versatz?: number; dicht?: boolean }) {
  const r = [];
  for (let y = -E + versatz; y < E; y += schritt) {
    r.push(<circle key={y} cx={x + ((y * 13) % 3)} cy={y} r={dicht ? 3.2 : 2.4} fill="#3f7d3a" stroke="#2f5f2c" strokeWidth={0.3} />);
    if (dicht) r.push(<circle key={y + 'b'} cx={x + Math.sign(x) * 5} cy={y + 7} r={3} fill="#356e31" />);
  }
  return <g>{r}</g>;
}
const strich = (lang: number, luecke: number) => `${lang} ${luecke}`;
function VStrasse({ x0, x1, mitte = 'leit', rand = true, innerorts = true, von = -E, bis = E }: { x0: number; x1: number; mitte?: 'leit' | 'durch' | 'keine'; rand?: boolean; innerorts?: boolean; von?: number; bis?: number }) {
  const m = (x0 + x1) / 2;
  return <g>
    <rect x={x0} y={von} width={x1 - x0} height={bis - von} fill={ASPHALT} />
    {rand && <><line x1={x0 + 0.25} y1={von} x2={x0 + 0.25} y2={bis} stroke={LINIE} strokeWidth={0.12} /><line x1={x1 - 0.25} y1={von} x2={x1 - 0.25} y2={bis} stroke={LINIE} strokeWidth={0.12} /></>}
    {mitte !== 'keine' && <line x1={m} y1={von} x2={m} y2={bis} stroke={LINIE} strokeWidth={0.12} strokeDasharray={mitte === 'leit' ? (innerorts ? strich(3, 6) : strich(6, 12)) : undefined} />}
  </g>;
}
function HStrasse({ y0, y1, x0 = -E, x1 = E, mitte = 'leit' }: { y0: number; y1: number; x0?: number; x1?: number; mitte?: 'leit' | 'keine' }) {
  const m = (y0 + y1) / 2;
  return <g>
    <rect x={x0} y={y0} width={x1 - x0} height={y1 - y0} fill={ASPHALT} />
    {mitte !== 'keine' && <line x1={x0} y1={m} x2={x1} y2={m} stroke={LINIE} strokeWidth={0.12} strokeDasharray={strich(3, 6)} />}
  </g>;
}
function Zebra({ y, x0, x1 }: { y: number; x0: number; x1: number }) {
  const r = [];
  for (let x = x0 + 0.3; x < x1 - 0.3; x += 1) r.push(<rect key={x} x={x} y={y - 2} width={0.5} height={4} fill={LINIE} />);
  return <g>{r}</g>;
}
/** Kreuzungsbereich: Asphaltfläche ohne Mittellinien */
const Platte = ({ x, y, b, h }: { x: number; y: number; b: number; h: number }) => <rect x={x} y={y} width={b} height={h} fill={ASPHALT} />;

export function Welt({ w }: { w: FilmWelt }) {
  const ex = new Set(w.extras ?? []);
  const teile: React.ReactNode[] = [];
  const stadtartig = ['stadt', 'kreuzung', 'einmuendung', 'zebra', 'wohngebiet'].includes(w.typ);
  teile.push(<rect key="bg" x={-E} y={-E} width={2 * E} height={2 * E} fill={stadtartig ? GEHWEG : w.typ === 'parkplatz' ? '#9ca3af' : GRAS} />);
  if (stadtartig) {
    const b = w.typ === 'wohngebiet' ? 2.75 : 3.5; // halbe Fahrbahnbreite
    const park = ex.has('parkstreifen') ? 2.2 : 0, rad = ex.has('radweg') ? 2 : 0;
    const quer = w.typ === 'kreuzung' ? 'beide' : w.typ === 'einmuendung' ? 'rechts' : null;
    const frei = (y: number) => !!quer && Math.abs(y) < 14;
    teile.push(<Haeuser key="hl" x0={-b - park - 9} x1={-b - park - 4 - 18} auslassen={frei} />, <Haeuser key="hr" x0={b + park + rad + 4.5} x1={b + park + rad + 22} auslassen={frei} />);
    if (w.typ === 'wohngebiet') teile.push(<Baeume key="bl" x={-b - 3} schritt={22} />, <Baeume key="br" x={b + 3.2} schritt={26} versatz={9} />);
    if (park) teile.push(<rect key="pl" x={b} y={-E} width={park} height={2 * E} fill="#6b7280" />, <rect key="pl2" x={-b - park} y={-E} width={park} height={2 * E} fill="#6b7280" />);
    if (rad) teile.push(<rect key="rw" x={b + park} y={-E} width={rad} height={2 * E} fill="#b45348" opacity={0.85} />);
    teile.push(<VStrasse key="v" x0={-b} x1={b} mitte={w.typ === 'wohngebiet' ? 'keine' : 'leit'} rand={false} />);
    if (ex.has('schutzstreifen')) teile.push(<line key="ss" x1={b - 1.5} y1={-E} x2={b - 1.5} y2={E} stroke={LINIE} strokeWidth={0.12} strokeDasharray="1 1" />);
    if (quer) {
      teile.push(<HStrasse key="h" y0={-b} y1={b} x0={quer === 'rechts' ? 0 : -E} />);
      teile.push(<Platte key="pk" x={-b} y={-b} b={2 * b} h={2 * b} />);
      // Bordsteinecken (Gehwegbereich)
    }
    if (w.typ === 'zebra') teile.push(<Zebra key="z" y={0} x0={-b} x1={b} />);
    if (ex.has('haltestelle')) teile.push(<g key="hs"><rect x={b} y={-52} width={2.8} height={22} fill={ASPHALT} /><path d={`M${b + 0.2},-52 l1.2,1.5 l1.2,-1.5`} stroke="#facc15" strokeWidth={0.15} fill="none" /><rect x={b + 3.2} y={-46} width={1.2} height={8} fill="#e5e7eb" stroke="#64748b" strokeWidth={0.1} /></g>);
    if (ex.has('mittelinsel')) teile.push(<rect key="mi" x={-0.7} y={-3} width={1.4} height={6} rx={0.6} fill={GEHWEG} stroke="#9ca3af" strokeWidth={0.12} />);
    if (ex.has('schule')) teile.push(<g key="sch"><rect x={b + park + rad + 4.5} y={-60} width={20} height={28} fill="#fde68a" stroke="#a16207" strokeWidth={0.2} /><text x={b + park + rad + 14.5} y={-44} fontSize={3} textAnchor="middle" fill="#713f12">Schule</text></g>);
  } else if (w.typ === 'landstrasse' || w.typ === 'bahnuebergang' || w.typ === 'baustelle') {
    teile.push(<Baeume key="bl" x={-8} dicht={ex.has('wald')} />, <Baeume key="br" x={8.5} versatz={7} dicht={ex.has('wald')} />);
    if (ex.has('feldweg')) teile.push(<rect key="fw" x={-E} y={-26} width={E - 3.25} height={4} fill="#a8875a" />);
    teile.push(<VStrasse key="v" x0={-3.25} x1={3.25} innerorts={false} />);
    for (let y = -E; y < E; y += 50) teile.push(<rect key={'lp' + y} x={4.2} y={y} width={0.25} height={0.25} fill="#f8fafc" stroke="#111" strokeWidth={0.05} />, <rect key={'lpl' + y} x={-4.45} y={y} width={0.25} height={0.25} fill="#f8fafc" stroke="#111" strokeWidth={0.05} />);
    if (w.typ === 'bahnuebergang') {
      teile.push(<g key="bahn"><rect x={-E} y={-2.2} width={2 * E} height={4.4} fill="#a8a29e" />{Array.from({ length: 160 }, (_, i) => <rect key={i} x={-E + i * 4} y={-1.6} width={0.4} height={3.2} fill="#78350f" />)}<line x1={-E} y1={-0.72} x2={E} y2={-0.72} stroke="#334155" strokeWidth={0.18} /><line x1={-E} y1={0.72} x2={E} y2={0.72} stroke="#334155" strokeWidth={0.18} /><rect x={-3.25} y={-2.2} width={6.5} height={4.4} fill={ASPHALT} opacity={0.75} /></g>);
    }
  } else if (w.typ === 'kurve') {
    const { y0, k } = w.kurve ?? { y0: -20, k: 0.012 };
    const pts: string[] = [];
    for (let y = E; y > -E; y -= 2) { const x = y < y0 ? k * (y - y0) ** 2 : 0; pts.push(`${x.toFixed(2)},${y}`); if (x > E) break; }
    const d = 'M' + pts.join(' L');
    teile.push(<path key="r" d={d} stroke={ASPHALT} strokeWidth={6.5} fill="none" />, <path key="m" d={d} stroke={LINIE} strokeWidth={0.12} fill="none" strokeDasharray="6 12" />);
    teile.push(<Baeume key="b" x={-9} schritt={18} />);
  } else if (w.typ === 'autobahn') {
    teile.push(<VStrasse key="r" x0={1} x1={8.5} mitte="leit" innerorts={false} />, <VStrasse key="l" x0={-8.5} x1={-1} mitte="leit" innerorts={false} />);
    teile.push(<rect key="sr" x={8.5} y={-E} width={2.5} height={2 * E} fill={ASPHALT} opacity={0.92} />, <rect key="sl" x={-11} y={-E} width={2.5} height={2 * E} fill={ASPHALT} opacity={0.92} />);
    teile.push(<line key="lr" x1={8.6} y1={-E} x2={8.6} y2={E} stroke={LINIE} strokeWidth={0.25} />, <line key="ll" x1={-8.6} y1={-E} x2={-8.6} y2={E} stroke={LINIE} strokeWidth={0.25} />);
    teile.push(<rect key="mitte" x={-1} y={-E} width={2} height={2 * E} fill="#6b8f4e" />, <line key="sp" x1={0} y1={-E} x2={0} y2={E} stroke="#cbd5e1" strokeWidth={0.3} />);
    if (ex.has('auffahrt')) teile.push(<g key="auf"><rect x={8.5} y={-70} width={3.75} height={130} fill={ASPHALT} /><path d="M 12.25 60 Q 13 90 24 140 L 20.5 140 Q 10 95 8.5 60 Z" fill={ASPHALT} /><line x1={8.6} y1={-70} x2={8.6} y2={60} stroke={LINIE} strokeWidth={0.3} strokeDasharray="3 3" /></g>);
    if (ex.has('tunnel')) teile.push(<rect key="tu" x={-12} y={-E} width={24} height={E - 60} fill="#0f172a" opacity={0.5} />);
  } else if (w.typ === 'kreisverkehr') {
    teile.push(<rect key="bgs" x={-E} y={-E} width={2 * E} height={2 * E} fill={GEHWEG} />, <Haeuser key="h1" x0={-25} x1={-45} auslassen={y => Math.abs(y) < 22} />, <Haeuser key="h2" x0={25} x1={45} auslassen={y => Math.abs(y) < 22} />);
    teile.push(<VStrasse key="v" x0={-3.5} x1={3.5} mitte="leit" rand={false} />, <HStrasse key="h" y0={-3.5} y1={3.5} />);
    teile.push(<circle key="ring" cx={0} cy={0} r={15} fill={ASPHALT} />, <circle key="ins" cx={0} cy={0} r={8} fill={GRAS} stroke="#e5e7eb" strokeWidth={0.6} />);
    for (const [x, y, wb, hb] of [[-3.5, 14.2, 7, 2.4], [-3.5, -16.6, 7, 2.4], [14.2, -3.5, 2.4, 7], [-16.6, -3.5, 2.4, 7]]) teile.push(<rect key={'ka' + x + y} x={x} y={y} width={wb} height={hb} fill={ASPHALT} />);
    for (const [x, y] of [[1.75, 16.6], [-1.75, -16.6], [16.6, -1.75], [-16.6, 1.75]]) teile.push(<rect key={'mi' + x + y} x={x - 0.5} y={y - 0.5} width={1} height={1} rx={0.4} fill={GEHWEG} opacity={0} />);
    teile.push(<line key="w1" x1={0.1} y1={15.6} x2={3.4} y2={15.6} stroke={LINIE} strokeWidth={0.25} strokeDasharray="0.5 0.25" />);
  } else if (w.typ === 'parkplatz') {
    for (let x = -30; x < 30; x += 2.6) for (const y of [-14, 6]) teile.push(<rect key={x + ':' + y} x={x} y={y} width={2.5} height={5} fill="none" stroke={LINIE} strokeWidth={0.12} />);
  }
  if (ex.has('laternen')) for (let y = -E; y < E; y += 30) teile.push(<circle key={'la' + y} cx={stadtartig ? 4.6 : 5} cy={y} r={0.25} fill="#e5e7eb" />);
  if (ex.has('pfuetze')) teile.push(w.typ === 'autobahn' ? <ellipse key="pf" cx={6.4} cy={-60} rx={2.6} ry={9} fill="#93c5fd" opacity={0.7} /> : <ellipse key="pf" cx={2} cy={-45} rx={1.6} ry={4} fill="#93c5fd" opacity={0.65} />);
  if (w.laub) {
    const { y0, k } = w.kurve ?? { y0: 9999, k: 0 };
    for (let i = 0; i < 260; i++) {
      const y = 80 - i * 0.9, x = (y < y0 ? k * (y - y0) ** 2 : 0) + (((i * 37) % 60) / 10 - 3);
      teile.push(<ellipse key={'lb' + i} cx={x} cy={y} rx={0.22} ry={0.13} transform={`rotate(${(i * 47) % 180} ${x} ${y})`} fill={['#b45309', '#d97706', '#92400e', '#ca8a04'][i % 4]} />);
    }
  }
  for (const [i, l] of (w.linien ?? []).entries()) teile.push(<line key={'li' + i} x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} stroke={LINIE} strokeWidth={l.art === 'halt' ? 0.5 : l.art === 'warte' ? 0.3 : 0.12} strokeDasharray={l.art === 'warte' ? '0.5 0.25' : l.art === 'leit' ? '3 6' : undefined} />);
  return <g className="film-welt">{teile}</g>;
}
/** Positionen der Straßenlaternen (für Lichtkegel bei Nacht) */
export function laternen(w: FilmWelt): [number, number][] {
  if (!(w.extras ?? []).includes('laternen')) return [];
  const stadt = ['stadt', 'kreuzung', 'einmuendung', 'zebra', 'wohngebiet'].includes(w.typ);
  const r: [number, number][] = [];
  for (let y = -E; y < E; y += 30) r.push([stadt ? 4.6 : 5, y]);
  return r;
}
