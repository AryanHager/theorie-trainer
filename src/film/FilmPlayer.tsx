import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { Film, FilmKatalog } from '../types';
import { medienUrl } from '../logic';
import { Welt, laternen } from './welt';
import { Ampel, Kegel, Leuchten, Objekt, lage } from './objekte';

let ladung: Promise<FilmKatalog> | null = null;
export function filmeLaden() {
  ladung ??= fetch(import.meta.env.BASE_URL + 'data/filme.json').then(r => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
  return ladung;
}
export function useFilm(id?: string) {
  const [film, setFilm] = useState<Film | null>(null);
  const [fehler, setFehler] = useState(false);
  useEffect(() => { if (!id) return; let ok = true; filmeLaden().then(k => { if (ok) setFilm(k.filme.find(f => f.id === id) ?? null); }).catch(() => ok && setFehler(true)); return () => { ok = false; }; }, [id]);
  return { film, fehler };
}

const BREITE = 34, HOEHE = 22;

/** Ein Einzelbild der Szene zum Zeitpunkt t */
export function FilmBild({ film, t }: { film: Film; t: number }) {
  const ich = film.objekte.find(o => o.ich);
  const kam = film.kamera ?? {};
  const b = kam.b ?? 44, h = b * (HOEHE / BREITE);
  let cx = 0, cy = 0;
  if (kam.x !== undefined && kam.y !== undefined) { cx = kam.x; cy = kam.y; }
  else if (ich) { const p = lage(ich.bahn, t); cx = p.x * 0.6; cy = p.y - h * (kam.vor ?? 0.3); }
  const welt = useMemo(() => <Welt w={film.welt} />, [film]);
  const w = film.welt;
  const lampen = useMemo(() => laternen(film.welt), [film]);
  const sichtbare = film.objekte;
  const maskId = 'm-' + film.id, nebelId = 'n-' + film.id;
  const ichP = ich ? lage(ich.bahn, t) : { x: cx, y: cy };
  return (
    <svg viewBox={`${(cx - b / 2).toFixed(2)} ${(cy - h / 2).toFixed(2)} ${b.toFixed(2)} ${h.toFixed(2)}`} className="film-svg" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
      <defs>
        <linearGradient id="film-kegel" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stopColor="#000" /><stop offset="0.65" stopColor="#000" stopOpacity="0.8" /><stop offset="1" stopColor="#000" stopOpacity="0" /></linearGradient>
        <radialGradient id="film-glow"><stop offset="0" stopColor="#000" stopOpacity="0.9" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        <radialGradient id="film-lampe"><stop offset="0" stopColor="#000" stopOpacity="0.85" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>
        {w.nebel && <radialGradient id={nebelId + 'g'}><stop offset="0" stopColor="#000" /><stop offset="0.35" stopColor="#000" stopOpacity="0.6" /><stop offset="1" stopColor="#000" stopOpacity="0" /></radialGradient>}
        {w.nacht && <mask id={maskId} maskUnits="userSpaceOnUse" x={cx - b} y={cy - h} width={2 * b} height={2 * h}>
          <rect x={cx - b} y={cy - h} width={2 * b} height={2 * h} fill="#fff" />
          {lampen.filter(([, y]) => Math.abs(y - cy) < h).map(([x, y]) => <circle key={y} cx={x} cy={y} r={10} fill="url(#film-lampe)" />)}
          {sichtbare.map(o => <Kegel key={o.id} o={o} t={t} />)}
        </mask>}
        {w.nebel && <mask id={nebelId} maskUnits="userSpaceOnUse" x={cx - b} y={cy - h} width={2 * b} height={2 * h}>
          <rect x={cx - b} y={cy - h} width={2 * b} height={2 * h} fill="#fff" />
          <circle cx={ichP.x} cy={ichP.y} r={w.nebel} fill={`url(#${nebelId}g)`} />
        </mask>}
      </defs>
      {welt}
      {(film.schilder ?? []).map((s, i) => <g key={i} transform={`translate(${s.x} ${s.y})`}><line x1={0} y1={0.6} x2={0} y2={1.6} stroke="#475569" strokeWidth={0.12} /><image href={medienUrl(s.datei)!} x={-0.9} y={-1.2} width={1.8} height={1.8} /></g>)}
      {sichtbare.map(o => <Objekt key={o.id} o={o} t={t} />)}
      {w.schnee && <rect x={cx - b} y={cy - h} width={2 * b} height={2 * h} fill="#f8fafc" opacity={0.28} />}
      {w.nacht && <rect x={cx - b} y={cy - h} width={2 * b} height={2 * h} fill="#030712" opacity={0.86} mask={`url(#${maskId})`} />}
      {sichtbare.map(o => <Leuchten key={o.id} o={o} t={t} nacht={w.nacht} />)}
      {(film.ampeln ?? []).map((a, i) => <Ampel key={i} a={a} t={t} />)}
      {w.nebel && <rect x={cx - b} y={cy - h} width={2 * b} height={2 * h} fill="#e2e8f0" opacity={0.93} mask={`url(#${nebelId})`} />}
      {w.regen && <g opacity={0.5}>{Array.from({ length: 70 }, (_, i) => { const x = cx - b / 2 + ((i * 7.31) % b), y = cy - h / 2 + ((i * 3.7 + t * 23) % h); return <line key={i} x1={x} y1={y} x2={x - 0.25} y2={y + 1.1} stroke="#bfdbfe" strokeWidth={0.07} />; })}</g>}
      {w.schnee && <g>{Array.from({ length: 60 }, (_, i) => <circle key={i} cx={cx - b / 2 + ((i * 7.31 + Math.sin(t + i) * 0.8) % b)} cy={cy - h / 2 + ((i * 3.7 + t * 2.5) % h)} r={0.12} fill="#fff" />)}</g>}
    </svg>
  );
}

interface Props {
  film: Film;
  modus?: 'lernen' | 'pruefung';
  /** Prüfung: höchstens so oft abspielbar */
  maxAbspielungen?: number;
  abgespielt?: number;
  onStart?: () => void;
  onEnde?: () => void;
}
export function FilmPlayer({ film, modus = 'lernen', maxAbspielungen, abgespielt = 0, onStart, onEnde }: Props) {
  const [t, setT] = useState(film.poster);
  const [laeuft, setLaeuft] = useState(false);
  const [gestartet, setGestartet] = useState(false);
  const [tempo, setTempo] = useState(1);
  const raf = useRef(0), letzte = useRef(0), tRef = useRef(film.poster);
  const pruef = modus === 'pruefung';
  const rest = maxAbspielungen ? Math.max(0, maxAbspielungen - abgespielt) : Infinity;
  const ich = film.objekte.find(o => o.ich);
  const kmh = ich ? Math.round(lage(ich.bahn, t).v * 3.6) : null;

  const stopp = () => { cancelAnimationFrame(raf.current); setLaeuft(false); };
  const schritt = useCallback((jetzt: number) => {
    const dt = Math.min(0.1, (jetzt - letzte.current) / 1000); letzte.current = jetzt;
    const n = tRef.current + dt * tempo;
    if (n >= film.dauer) { tRef.current = film.dauer; setT(film.dauer); setLaeuft(false); onEnde?.(); return; }
    tRef.current = n; setT(n); raf.current = requestAnimationFrame(schritt);
  }, [film.dauer, tempo, onEnde]);
  const abspielen = (vonVorn: boolean) => {
    if (vonVorn || tRef.current >= film.dauer || !gestartet) {
      if (rest <= 0) return;
      tRef.current = 0; setT(0); onStart?.();
    }
    setGestartet(true); setLaeuft(true); letzte.current = performance.now();
    cancelAnimationFrame(raf.current); raf.current = requestAnimationFrame(schritt);
  };
  useEffect(() => () => cancelAnimationFrame(raf.current), []);
  useEffect(() => { stopp(); tRef.current = film.poster; setT(film.poster); setGestartet(false); }, [film.id, film.poster]);
  useEffect(() => {
    const h = () => { if (laeuft) { if (!pruef) stopp(); } else abspielen(pruef || tRef.current >= film.dauer); };
    addEventListener('theorie:film', h); return () => removeEventListener('theorie:film', h);
  });
  const ende = gestartet && !laeuft && t >= film.dauer;
  const beschrId = 'fb-' + film.id;
  const hinweis = film.hinweise?.find(([a, b]) => t >= a && t <= b)?.[2];

  return (
    <figure className={'film' + (laeuft ? ' laeuft' : '')} data-film={film.id}>
      <div className="film-buehne">
        <div className="film-bild" role="img" aria-label={`Animierte Szene: ${film.titel}`} aria-describedby={beschrId}><FilmBild film={film} t={t} /></div>
        {kmh !== null && gestartet && <span className="film-tacho" aria-hidden="true">{kmh} km/h</span>}
        {hinweis && <span className="film-hinweis">{hinweis}</span>}
        {!gestartet && <button className="film-start" onClick={() => abspielen(true)} disabled={rest <= 0} aria-label="Szene abspielen">
          <span className="film-play" aria-hidden="true">▶</span><span>Szene abspielen{pruef && Number.isFinite(rest) ? ` (${rest}× möglich)` : ''}</span></button>}
        {ende && <span className="film-ende" aria-live="polite">Szenenende</span>}
      </div>
      <div className="film-steuerung">
        {!pruef && gestartet && <button className="btn ghost klein" onClick={() => laeuft ? stopp() : abspielen(false)} aria-label={laeuft ? 'Pause' : 'Fortsetzen'}>{laeuft ? '❚❚ Pause' : '▶ Weiter'}</button>}
        {gestartet && <button className="btn ghost klein" onClick={() => abspielen(true)} disabled={rest <= 0 || (pruef && laeuft)} aria-label="Von vorn abspielen">↺ Nochmal</button>}
        {!pruef && <input type="range" className="film-zeit" min={0} max={film.dauer} step={0.05} value={t} aria-label="Zeitpunkt der Szene" aria-valuetext={`${t.toFixed(1)} von ${film.dauer} Sekunden`}
          onChange={e => { stopp(); setGestartet(true); tRef.current = +e.target.value; setT(+e.target.value); }} />}
        {pruef && <div className="film-fortschritt" role="progressbar" aria-label="Fortschritt der Szene" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round((t / film.dauer) * 100)}><div style={{ width: `${(t / film.dauer) * 100}%` }} /></div>}
        {!pruef && <button className="btn ghost klein" onClick={() => setTempo(tempo === 1 ? 0.5 : 1)} aria-pressed={tempo !== 1} title="Zeitlupe">{tempo === 1 ? '1×' : '½×'}</button>}
        {pruef && Number.isFinite(rest) && <span className="dezent klein-text" data-testid="film-rest">noch {rest}× abspielbar</span>}
      </div>
      <details className="film-text"><summary>Textbeschreibung der Szene</summary><p id={beschrId}>{film.beschreibung}</p></details>
      <figcaption className="sr">Eigene animierte Darstellung (Draufsicht). Ihr Fahrzeug ist blau und mit „Sie“ gekennzeichnet.</figcaption>
    </figure>
  );
}
