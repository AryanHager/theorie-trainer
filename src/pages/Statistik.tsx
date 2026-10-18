import { useState } from 'react';
import type { Katalog } from '../types';
import { passtZuKlassen } from '../logic';
import { fortschrittZuruecksetzen, status, STATUS_TEXT, useZustand, type Status } from '../store';
import { go } from '../router';
import { Topbar } from './Topbar';

export function Statistik({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const [frage, setFrage] = useState(false);
  const gewaehlt = z.einstellungen.klassen;
  const [klasseF, setKlasseF] = useState<string>('alle');
  const [kapitelF, setKapitelF] = useState<string>('alle');
  const klasseAktiv = klasseF !== 'alle' && gewaehlt.includes(klasseF as never) ? klasseF : 'alle';
  const klassenPool = kat.fragen.filter(f => passtZuKlassen(f, klasseAktiv === 'alle' ? gewaehlt : [klasseAktiv]));
  const kapitelMitFragen = kat.kapitel.filter(k => klassenPool.some(f => f.kapitel === k.id));
  const kapitelAktiv = kapitelF !== 'alle' && kapitelMitFragen.some(k => k.id === kapitelF) ? kapitelF : 'alle';
  const pool = kapitelAktiv === 'alle' ? klassenPool : klassenPool.filter(f => f.kapitel === kapitelAktiv);
  const pruefungen = klasseAktiv === 'alle' ? z.pruefungen : z.pruefungen.filter(p => p.klasse === klasseAktiv);
  const zaehl = (s: Status, fr = pool) => fr.filter(f => status(z.fortschritt[f.id]) === s).length;
  const gesamt = pool.length || 1;
  const versuche = pool.reduce((n, f) => n + (z.fortschritt[f.id]?.r ?? 0) + (z.fortschritt[f.id]?.f ?? 0), 0);
  const richtig = pool.reduce((n, f) => n + (z.fortschritt[f.id]?.r ?? 0), 0);
  const bestanden = pruefungen.filter(p => p.bestanden).length;
  return (
    <div className="seite">
      <Topbar titel="Statistik" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        <div className="karte" data-testid="statistik-filter">
          <h2>Filter</h2>
          {gewaehlt.length > 1 && <>
            <h3 className="dezent-titel" id="stat-klasse">Klasse</h3>
            <div className="segment umbruch" role="radiogroup" aria-labelledby="stat-klasse">
              {['alle', ...gewaehlt].map(k => <button key={k} role="radio" data-statklasse={k} aria-checked={k === klasseAktiv} className={k === klasseAktiv ? 'an' : ''} onClick={() => setKlasseF(k)}>{k === 'alle' ? 'Alle' : k}</button>)}
            </div>
          </>}
          <label className="schalter-zeile"><span>Thema</span>
            <select value={kapitelAktiv} data-testid="stat-kapitel" onChange={x => setKapitelF(x.target.value)}>
              <option value="alle">Alle Themen</option>
              {kapitelMitFragen.map(k => <option key={k.id} value={k.id}>{k.id} {k.titel}</option>)}
            </select></label>
        </div>
        <div className="karte">
          <h2 data-testid="stat-titel">Lernstand – {klasseAktiv === 'alle' ? 'Klasse ' + gewaehlt.join(' + ') : 'Klasse ' + klasseAktiv}{kapitelAktiv !== 'alle' ? ' · ' + kapitelAktiv : ''}</h2>
          <p className="dezent klein-text" data-testid="stat-anzahl">{pool.length} Fragen im Filter</p>
          <div className="balken mehrfach gross">
            {(['sicher', 'einmal', 'falsch'] as Status[]).map(s => <i key={s} className={s} style={{ width: (zaehl(s) / gesamt) * 100 + '%' }} />)}
          </div>
          <div className="legende">
            {(['sicher', 'einmal', 'falsch', 'neu'] as Status[]).map(s => <span key={s}><i className={'punkt ' + s} />{STATUS_TEXT[s]}: <b>{zaehl(s)}</b></span>)}
          </div>
          <div className="kennzahlen">
            <div><b>{versuche}</b><small>Antworten</small></div>
            <div><b>{versuche ? Math.round((richtig / versuche) * 100) : 0}%</b><small>Trefferquote</small></div>
            <div><b>{z.markiert.length}</b><small>markiert</small></div>
          </div>
        </div>
        <div className="karte">
          <h2>Nach Themen</h2>
          {kapitelMitFragen.filter(k => kapitelAktiv === 'alle' || k.id === kapitelAktiv).map(k => {
            const fr = pool.filter(f => f.kapitel === k.id); if (!fr.length) return null;
            return (
              <button key={k.id} className="themen-zeile" onClick={() => go('/lernen/' + k.id)}>
                <span>{k.id} {k.titel}</span><small>{zaehl('sicher', fr)}/{fr.length} sicher</small>
                <div className="balken mehrfach">{(['sicher', 'einmal', 'falsch'] as Status[]).map(s => <i key={s} className={s} style={{ width: (zaehl(s, fr) / fr.length) * 100 + '%' }} />)}</div>
              </button>
            );
          })}
        </div>
        <div className="karte">
          <h2>Prüfungen ({bestanden} von {pruefungen.length} bestanden{klasseAktiv !== 'alle' ? ', Klasse ' + klasseAktiv : ''})</h2>
          {!pruefungen.length && <p className="dezent">Noch keine Prüfungssimulation abgelegt.</p>}
          <div className="verlauf">
            {pruefungen.slice(0, 10).reverse().map(p => (
              <button key={p.id} className={'saeule ' + (p.bestanden ? 'ok' : 'nok')} style={{ height: Math.min(100, 10 + p.fehlerpunkte * 3) + '%' }} title={`${p.fehlerpunkte} FP`} onClick={() => go('/auswertung/' + p.id)}><span>{p.fehlerpunkte}</span></button>
            ))}
          </div>
          <ul className="liste-einfach">
            {pruefungen.slice(0, 10).map(p => (
              <li key={p.id}><button className="zeile flach" onClick={() => go('/auswertung/' + p.id)}>
                <span className={p.bestanden ? 'ok-text' : 'nok-text'}>{p.bestanden ? 'Bestanden' : 'Nicht bestanden'}</span>
                <small>{new Date(p.datum).toLocaleString('de-DE', { dateStyle: 'short', timeStyle: 'short' })}{p.klasse ? ` · Klasse ${p.klasse}` : ''}{p.art ? ` (${p.art === 'erweiterung' ? 'Erweiterung' : 'Ersterwerb'})` : ''} · {p.fehlerpunkte} FP</small><span className="pfeil">›</span>
              </button></li>
            ))}
          </ul>
        </div>
        {!frage ? <button className="btn gefahr" onClick={() => setFrage(true)}>Lernfortschritt zurücksetzen</button>
          : <div className="karte hinweis"><p>Wirklich alle Lernstände, Markierungen und Prüfungsergebnisse löschen?</p><div className="aktionen-reihe"><button className="btn ghost" onClick={() => setFrage(false)}>Abbrechen</button><button className="btn gefahr" onClick={() => { fortschrittZuruecksetzen(); setFrage(false); }}>Ja, zurücksetzen</button></div></div>}
      </main>
    </div>
  );
}
