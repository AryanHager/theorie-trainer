import { useMemo, useState } from 'react';
import type { Schild } from '../types';
import { schildPasst, useSchilder } from '../schilder';
import { go } from '../router';
import { Topbar } from './Topbar';
import { Lightbox } from '../components/Lightbox';
import { medienUrl } from '../logic';

const KAT_TEXT: Record<string, string> = {
  Gefahrzeichen: 'Warnen vor Gefahrstellen', Vorschriftzeichen: 'Gebote und Verbote', Richtzeichen: 'Hinweise und Wegweisung',
  Markierungen: 'Fahrbahnmarkierungen', Verkehrseinrichtungen: 'Baken, Absperrungen, Leitpfosten', Zusatzzeichen: 'Ergänzen oder beschränken Hauptzeichen',
};
export function SchildDetail({ s, varianten = [], onClose, onWahl }: { s: Schild; varianten?: Schild[]; onClose: () => void; onWahl?: (nr: string) => void }) {
  return (
    <Lightbox src={medienUrl(s.datei)!} alt={s.eigen ? `${s.name} (eigene Darstellung)` : `Zeichen ${s.nr}: ${s.name}`} onClose={onClose}>
      <b>{s.eigen ? s.grundname ?? s.name : `Zeichen ${s.nr}`}</b>
      <p data-testid="schild-name">{s.name}</p>
      {varianten.length > 1 && <div className="varianten" role="radiogroup" aria-label={`${varianten.length} Varianten`}>
        <small>{varianten.length} Varianten:</small>
        <div className="varianten-liste">
          {varianten.map(v => <button key={v.nr} role="radio" aria-checked={v.nr === s.nr} className={v.nr === s.nr ? 'an' : ''} title={v.variante ?? v.name} aria-label={`${v.nr}: ${v.variante ?? v.name}`} onClick={() => onWahl?.(v.nr)}>
            <img src={medienUrl(v.datei)!} alt="" loading="lazy" /><span>{v.variante ?? (v.nr === v.gruppe ? 'Grundform' : v.nr)}</span></button>)}
        </div>
      </div>}
      <small>{s.kategorie}{s.stvo ? ` · Zeichnung StVO ${s.stvo}` : ''}{s.eigen ? ' · Eigene schematische Zeichnung' : ''}</small>
      {s.eigen ? <small>Quelle: {s.quelle} · {s.lizenz}</small>
        : <small>Quelle: <a href={s.quelle} target="_blank" rel="noopener noreferrer">Wikimedia Commons</a> · {s.lizenz}</small>}
    </Lightbox>
  );
}
const KAT_ZUSATZ: Record<string, string> = { Lichtzeichen: 'Ampeln, Grünpfeil, Dauerlichtzeichen (eigene Zeichnungen)', Polizeizeichen: 'Zeichen und Weisungen von Polizeibeamten (eigene Zeichnungen)' };
const EIGEN_KURZ: Record<string, string> = { LZ: 'Ampel', DL: 'Dauerlicht', PZ: 'Polizei' };
export function Zeichen({ auswahl }: { auswahl?: string }) {
  const { m, fehler } = useSchilder();
  const [q, setQ] = useState('');
  const [kat, setKat] = useState<string>('alle');
  const [einzeln, setEinzeln] = useState(false);
  const gruppen = useMemo(() => {
    const g = new Map<string, Schild[]>();
    for (const s of m?.schilder ?? []) { const k = s.gruppe ?? s.nr; g.set(k, [...(g.get(k) ?? []), s]); }
    return g;
  }, [m]);
  const treffer = useMemo(() => {
    if (!m) return [];
    const passt = (s: Schild) => (kat === 'alle' || s.kategorie === kat) && schildPasst({ ...s, name: `${s.name} ${s.grundname ?? ''} ${s.variante ?? ''}` }, q);
    if (einzeln) return m.schilder.filter(passt).map(s => ({ s, n: 1 }));
    const r: { s: Schild; n: number }[] = [];
    for (const [k, liste] of gruppen) {
      if (!liste.some(passt)) continue;
      const vertreter = liste.find(s => s.nr === k) ?? liste.find(passt) ?? liste[0];
      r.push({ s: vertreter, n: liste.length });
    }
    return r;
  }, [m, q, kat, einzeln, gruppen]);
  const offen = auswahl ? m?.schilder.find(s => s.nr === auswahl) : undefined;
  const anzahl = (k: string) => m?.schilder.filter(s => s.kategorie === k).length ?? 0;
  const titel = (s: Schild, n: number) => n > 1 ? (s.grundname ?? s.name) : s.name;
  return (
    <div className="seite">
      <Topbar titel="Verkehrszeichen" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <input className="suchfeld" type="search" placeholder="Name oder Nummer, z. B. „Haltverbot“ oder „206“" value={q} onChange={e => setQ(e.target.value)} aria-label="Verkehrszeichen durchsuchen" />
        <div className="filter-chips" role="tablist" aria-label="Kategorie">
          <button role="tab" aria-selected={kat === 'alle'} className={kat === 'alle' ? 'an' : ''} onClick={() => setKat('alle')}>Alle <small>{m?.schilder.length ?? ''}</small></button>
          {m?.kategorien.filter(k => anzahl(k)).map(k => (
            <button key={k} role="tab" aria-selected={kat === k} className={kat === k ? 'an' : ''} onClick={() => setKat(k)}>{k} <small>{anzahl(k)}</small></button>
          ))}
        </div>
        {fehler && <p className="nok-text">Zeichen konnten nicht geladen werden.</p>}
        {!m && !fehler && <div className="leer"><div className="lade" /></div>}
        {m && kat !== 'alle' && <p className="dezent">{KAT_TEXT[kat] ?? KAT_ZUSATZ[kat]}</p>}
        {m && <div className="zeichen-kopf"><p className="dezent" data-testid="zeichen-anzahl">{treffer.length} {einzeln ? 'Zeichen' : 'Zeichen (Varianten zusammengefasst)'}</p>
          <label className="schalter-klein"><input type="checkbox" checked={einzeln} onChange={e => setEinzeln(e.target.checked)} data-testid="einzeln" /> Varianten einzeln zeigen</label></div>}
        <ul className="zeichen-grid">
          {treffer.map(({ s, n }) => (
            <li key={s.nr}>
              <button className="zeichen-kachel" onClick={() => go('/zeichen/' + encodeURIComponent(s.nr))} aria-label={`${s.eigen ? '' : 'Zeichen ' + s.nr + ': '}${titel(s, n)}${n > 1 ? `, ${n} Varianten` : ''}${s.eigen ? ', eigene Zeichnung' : ''}`}>
                <span className="zeichen-bild"><img src={medienUrl(s.datei)!} alt="" loading="lazy" decoding="async" /></span>
                <b>{s.eigen ? (s.gruppe && /^\d/.test(s.gruppe) ? s.gruppe : (EIGEN_KURZ[s.gruppe ?? ''] ?? 'Eigene')) : n > 1 ? s.gruppe : s.nr}</b><small>{titel(s, n)}</small>
                {n > 1 && <span className="varianten-badge">{n} Varianten</span>}
                {s.eigen && <span className="eigen-badge">eigene Zeichnung</span>}
              </button>
            </li>
          ))}
        </ul>
        <p className="dezent quelle-zeile">Amtliche Zeichen: Wikimedia Commons, gemeinfrei (§ 5 UrhG). Markierungen, Lichtzeichen und Polizeizeichen teilweise als eigene schematische Zeichnungen. <button className="link" onClick={() => go('/quellen')}>Quellen & Hinweise</button></p>
      </main>
      {offen && <SchildDetail s={offen} varianten={gruppen.get(offen.gruppe ?? offen.nr) ?? []} onWahl={nr => go('/zeichen/' + encodeURIComponent(nr), true)} onClose={() => go('/zeichen')} />}
    </div>
  );
}
