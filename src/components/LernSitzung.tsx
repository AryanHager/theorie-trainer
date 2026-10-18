import { useEffect, useRef, useState } from 'react';
import type { Eingabe, Frage, Katalog } from '../types';
import { useVolleFragen } from '../katalog';
import { istBeantwortet, istRichtig } from '../logic';
import { ergebnisSpeichern, markierenUmschalten, useZustand } from '../store';
import { ton, vorlesen, vorlesenStopp, sprachausgabeVerfuegbar } from '../media';
import { FrageAnsicht, vorleseText } from './FrageAnsicht';
import { Icon } from './Icon';
import { go } from '../router';
import { filmUmschalten, useTasten } from '../tasten';

export function LernSitzung({ kat, ids, titel, zurueck }: { kat: Katalog; ids: string[]; titel: string; zurueck: string }) {
  const { fragen, fehler } = useVolleFragen(kat, ids);
  if (fehler) return <div className="leer"><p>{fehler}</p></div>;
  if (!fragen) return <div className="leer"><div className="lade" aria-label="Lädt" /></div>;
  return <LernSitzungInhalt kat={kat} fragen={fragen} titel={titel} zurueck={zurueck} />;
}

function LernSitzungInhalt({ kat, fragen, titel, zurueck }: { kat: Katalog; fragen: Frage[]; titel: string; zurueck: string }) {
  const z = useZustand();
  const [idx, setIdx] = useState(0);
  const [eingaben, setEingaben] = useState<Record<string, Eingabe>>({});
  const [aufgedeckt, setAufgedeckt] = useState<Record<string, boolean>>({});
  const [erkl, setErkl] = useState(false);
  const [notizOffen, setNotizOffen] = useState(false);
  const [gesehen, setGesehen] = useState<Record<string, boolean>>({});
  const [anim, setAnim] = useState<'' | 'links' | 'rechts'>('');
  const touch = useRef<{ x: number; y: number } | null>(null);
  const f = fragen[idx];

  const wechseln = (d: number) => {
    const n = idx + d; if (n < 0 || n >= fragen.length) return;
    setAnim(d > 0 ? 'links' : 'rechts'); setIdx(n); setErkl(false); setNotizOffen(false); vorlesenStopp();
  };
  useEffect(() => { if (f && z.einstellungen.autoVorlesen) vorlesen(vorleseText(f)); /* eslint-disable-next-line */ }, [idx]);
  const auswaehlen = (i: number) => {
    if (!f || f.typ === 'zahl' || aufgedeckt[f.id] || i >= (f.antworten?.length ?? 0)) return;
    if (f.medien?.film && z.einstellungen.filmErstAnsehen && !gesehen[f.id]) return;
    setEingaben(s => { const a = Array.isArray(s[f.id]) ? s[f.id] as number[] : []; return { ...s, [f.id]: a.includes(i) ? a.filter(x => x !== i) : [...a, i].sort() }; });
  };
  useTasten({
    ArrowRight: () => wechseln(1), ArrowLeft: () => wechseln(-1),
    '1': () => auswaehlen(0), '2': () => auswaehlen(1), '3': () => auswaehlen(2), '4': () => auswaehlen(3),
    a: () => auswaehlen(0), b: () => auswaehlen(1), c: () => auswaehlen(2), d: () => auswaehlen(3),
    Enter: () => { if (f && (aufgedeckt[f.id] || istBeantwortet(f, eingaben[f.id]))) { if (idx === fragen.length - 1 && aufgedeckt[f.id]) go(zurueck); else auswerten(); } },
    e: () => setErkl(x => !x), m: () => f && markierenUmschalten(f.id), n: () => setNotizOffen(true),
    r: () => f && sprachausgabeVerfuegbar && vorlesen(vorleseText(f)), f: filmUmschalten, Space: filmUmschalten,
  }, fragen.length > 0);
  useEffect(() => () => vorlesenStopp(), []);

  if (!fragen.length) return (
    <div className="seite"><header className="topbar"><button className="icon-btn" onClick={() => go(zurueck)} aria-label="Zurück"><Icon n="back" /></button><h1>{titel}</h1></header>
      <div className="leer"><p>Keine Fragen gefunden. Prüfe die gewählten Führerscheinklassen in den Einstellungen.</p></div></div>
  );

  const auf = !!aufgedeckt[f.id];
  const markiert = z.markiert.includes(f.id);
  const auswerten = () => {
    if (auf) { wechseln(1); return; }
    const ok = istRichtig(f, eingaben[f.id]);
    setAufgedeckt(a => ({ ...a, [f.id]: true })); ergebnisSpeichern(f.id, ok); ton(ok ? 'richtig' : 'falsch');
  };
  const korrekt = auf && istRichtig(f, eingaben[f.id]);
  const letzte = idx === fragen.length - 1;
  const kTitel = kat.kapitel.find(k => k.id === f.kapitel)?.titel;

  return (
    <div className="seite lernen">
      <header className="topbar">
        <button className="icon-btn" onClick={() => go(zurueck)} aria-label="Zurück"><Icon n="back" /></button>
        <div className="topbar-titel"><h1>{titel}</h1><small>Frage {idx + 1} von {fragen.length}</small></div>
        {sprachausgabeVerfuegbar && z.einstellungen.vorlesen && <button className="icon-btn" aria-label="Vorlesen" title="Vorlesen" onClick={() => vorlesen(vorleseText(f))}><Icon n="speaker" /></button>}
        <button className={'icon-btn' + (notizOffen || z.notizen[f.id] ? ' aktiv' : '')} aria-label="Notiz" title="Notiz (N)" onClick={() => setNotizOffen(!notizOffen)}><Icon n="note" /></button>
        <button className={'icon-btn rund' + (erkl ? ' aktiv' : '')} aria-label="Erklärung anzeigen" aria-pressed={erkl} title="Erklärung (E)" onClick={() => setErkl(!erkl)}><b>i</b></button>
        <button className={'icon-btn rund warn' + (markiert ? ' aktiv' : '')} aria-label={markiert ? 'Markierung entfernen' : 'Als schwierig markieren'} aria-pressed={markiert} title="Als schwierig markieren (M)" onClick={() => markierenUmschalten(f.id)}><b>!</b></button>
      </header>
      <div className="fortschritt-leiste"><div style={{ width: `${((idx + 1) / fragen.length) * 100}%` }} /></div>
      <main tabIndex={-1} className={'karte-wrap ' + anim} key={f.id} onAnimationEnd={() => setAnim('')}
        onTouchStart={e => { touch.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }; }}
        onTouchEnd={e => {
          if (!touch.current) return; const dx = e.changedTouches[0].clientX - touch.current.x, dy = e.changedTouches[0].clientY - touch.current.y; touch.current = null;
          if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) wechseln(dx < 0 ? 1 : -1);
        }}>
        <FrageAnsicht frage={f} eingabe={eingaben[f.id]} onChange={e => setEingaben(s => ({ ...s, [f.id]: e }))} aufgedeckt={auf} erklaerung={erkl} kapitelTitel={kTitel}
          filmGesehen={!!gesehen[f.id]} onFilmEnde={() => setGesehen(g => ({ ...g, [f.id]: true }))} notiz notizOffen={notizOffen} onNotizOffen={setNotizOffen} />
        {auf && <div className={'feedback ' + (korrekt ? 'ok' : 'nok')} role="status" aria-live="polite">{korrekt ? 'Richtig beantwortet!' : `Leider falsch – das wären ${f.punkte} Fehlerpunkte.`}{!korrekt && !erkl && <button className="link" onClick={() => setErkl(true)}>Erklärung ansehen</button>}</div>}
        <p className="wisch-hinweis">Tipp: Nach links oder rechts wischen, um die Frage zu wechseln. Tastatur: <kbd>?</kbd> zeigt alle Kürzel.</p>
      </main>
      <footer className="aktionsleiste">
        <button className="btn ghost" onClick={() => wechseln(-1)} disabled={idx === 0} aria-label="Vorherige Frage"><Icon n="back" /></button>
        {letzte && auf
          ? <button className="btn primaer" onClick={() => go(zurueck)}>Fertig</button>
          : <button className="btn primaer" onClick={auswerten} disabled={!auf && !istBeantwortet(f, eingaben[f.id])}>{auf ? 'Nächste Frage' : 'Antwort prüfen'}</button>}
        <button className="btn ghost" onClick={() => wechseln(1)} disabled={letzte} aria-label="Nächste Frage"><Icon n="next" /></button>
      </footer>
    </div>
  );
}
