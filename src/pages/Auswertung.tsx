import { useState } from 'react';
import type { Katalog } from '../types';
import { useVolleFragen } from '../katalog';
import { istRichtig, richtigeAntwortText } from '../logic';
import { useZustand } from '../store';
import { go } from '../router';
import { Topbar } from './Topbar';

export function Auswertung({ kat, id }: { kat: Katalog; id: string }) {
  const z = useZustand();
  const e = z.pruefungen.find(p => p.id === id);
  const [offen, setOffen] = useState<string | null>(null);
  const [nurFalsch, setNurFalsch] = useState(false);
  const { fragen: geladen, fehler } = useVolleFragen(kat, e ? e.fragenIds : null);
  if (!e) return <div className="seite"><Topbar titel="Auswertung" zurueck="/" /><div className="leer">Ergebnis nicht gefunden.</div></div>;
  if (fehler) return <div className="seite"><Topbar titel="Auswertung" zurueck="/" /><div className="leer">{fehler}</div></div>;
  if (!geladen) return <div className="seite"><Topbar titel="Auswertung" zurueck="/" /><div className="leer"><div className="lade" aria-label="Lädt" /></div></div>;
  const fragen = geladen;
  const falsch = fragen.filter(f => !istRichtig(f, e.antworten[f.id]));
  const liste = nurFalsch ? falsch : fragen;
  const eingabeText = (f: typeof fragen[0]) => {
    const a = e.antworten[f.id];
    if (a === undefined || (Array.isArray(a) && !a.length) || a === '') return '– keine Antwort –';
    return f.typ === 'zahl' ? `${a} ${f.zahl?.einheit ?? ''}` : (a as number[]).map(i => f.antworten![i].text).join(' · ');
  };
  return (
    <div className="seite">
      <Topbar titel="Auswertung" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <div className={'ergebnis ' + (e.bestanden ? 'ok' : 'nok')}>
          <div className="ergebnis-icon">{e.bestanden ? '✓' : '✗'}</div>
          <h2>{e.bestanden ? 'Bestanden!' : 'Nicht bestanden'}</h2>
          {e.klasse && <p className="dezent">Klasse {e.klasse}{e.art ? ` · ${e.art === 'erweiterung' ? 'Erweiterung' : 'Ersterwerb'}` : ''}{e.maxFehlerpunkte !== undefined ? ` · erlaubt: ${e.maxFehlerpunkte} FP` : ''}</p>}
          <p>{e.grund}</p>
          <div className="kennzahlen">
            <div><b>{e.fehlerpunkte}</b><small>Fehlerpunkte</small></div>
            <div><b>{fragen.length - falsch.length}/{fragen.length}</b><small>richtig</small></div>
            <div><b>{Math.floor(e.dauerSek / 60)}:{String(e.dauerSek % 60).padStart(2, '0')}</b><small>Minuten{e.zeitAbgelaufen ? ' (Zeit abgelaufen)' : ''}</small></div>
          </div>
        </div>
        <div className="aktionen-reihe">
          <button className="btn primaer" onClick={() => go('/pruefung')}>Neue Prüfung</button>
          {falsch.length > 0 && <button className="btn ghost" onClick={() => go('/effektiv')}>Fehler üben</button>}
        </div>
        <label className="schalter-zeile klein"><input type="checkbox" checked={nurFalsch} onChange={x => setNurFalsch(x.target.checked)} /> Nur falsche Antworten zeigen ({falsch.length})</label>
        <ul className="auswertung-liste">
          {liste.map(f => {
            const ok = istRichtig(f, e.antworten[f.id]);
            return (
              <li key={f.id} className={ok ? 'ok' : 'nok'}>
                <button className="auswertung-kopf" onClick={() => setOffen(offen === f.id ? null : f.id)} aria-expanded={offen === f.id}>
                  <span className="marke">{ok ? '✓' : '✗'}</span>
                  <span className="txt">{f.text}</span>
                  <span className="chip punkte">{ok ? 0 : f.punkte} FP</span>
                </button>
                {offen === f.id && (
                  <div className="auswertung-detail">
                    <p><small>Deine Antwort:</small><br />{eingabeText(f)}</p>
                    <p><small>Richtig:</small><br /><b>{richtigeAntwortText(f)}</b></p>
                    <p className="erklaerung-text">{f.erklaerung}</p>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      </main>
    </div>
  );
}
