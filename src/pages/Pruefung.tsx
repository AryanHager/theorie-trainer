import { useEffect, useMemo, useState } from 'react';
import type { Frage, Katalog, PruefungsArt } from '../types';
import { useVolleFragen } from '../katalog';
import { ART_TEXT, KLASSEN_INFO, istBeantwortet, pruefungBewerten, pruefungsArten, pruefungsRegel, pruefungZiehen } from '../logic';
import { einstellungSetzen, ergebnisSpeichern, setZustand, useZustand, type AktivePruefung } from '../store';
import { go } from '../router';
import { Topbar } from './Topbar';
import { FrageAnsicht, vorleseText } from '../components/FrageAnsicht';
import { Icon } from '../components/Icon';
import { sprachausgabeVerfuegbar, ton, vorlesen, vorlesenStopp } from '../media';
import { filmUmschalten, useTasten } from '../tasten';

const FELD_TEXT: Record<string, string> = { grundstoff: 'Anzahl Grundstoff', zusatzstoff: 'Anzahl Zusatzstoff', dauerMin: 'Bearbeitungszeit', fuenferRegel: '5-Punkte-Regel' };

export function PruefungStart({ kat }: { kat: Katalog }) {
  const z = useZustand();
  const e = z.einstellungen;
  const reihenfolge = KLASSEN_INFO.map(k => k.id);
  const waehlbar = [...e.klassen].sort((a, b) => reihenfolge.indexOf(a) - reihenfolge.indexOf(b)).filter(k => pruefungsArten(kat, k).length);
  const klasse = e.pruefKlasse && waehlbar.includes(e.pruefKlasse) ? e.pruefKlasse : waehlbar[0] ?? 'B';
  const arten = pruefungsArten(kat, klasse);
  const art: PruefungsArt = e.pruefArt && arten.includes(e.pruefArt) ? e.pruefArt : arten[0] ?? 'ersterwerb';
  const r = pruefungsRegel(kat, klasse, art);
  const probe = useMemo(() => pruefungZiehen(kat, klasse, art), [kat, klasse, art]);
  const unsicher = (r.unsicher ?? []).map(f => FELD_TEXT[f] ?? f);
  const starten = () => {
    const zg = pruefungZiehen(kat, klasse, art);
    const ap: AktivePruefung = { fragenIds: zg.ids, antworten: {}, markiert: [], start: Date.now(), dauerMin: r.dauerMin, klassen: [klasse], klasse, art, maxFehlerpunkte: r.maxFehlerpunkte, fuenferRegel: r.fuenferRegel, filmAbgespielt: {}, filmGesehen: [], filmMax: e.filmMax };
    setZustand(s => ({ ...s, aktivePruefung: ap })); go('/pruefung/laeuft');
  };
  return (
    <div className="seite">
      <Topbar titel="Prüfungssimulation" zurueck="/" />
      <main tabIndex={-1} className="inhalt">
        {z.aktivePruefung && <div className="karte hinweis"><p>Es läuft noch eine Prüfung.</p><button className="btn primaer" onClick={() => go('/pruefung/laeuft')}>Fortsetzen</button></div>}
        <div className="karte">
          {waehlbar.length > 1 && <>
            <h3 className="dezent-titel">Klasse</h3>
            <div className="segment umbruch" role="radiogroup" aria-label="Prüfungsklasse">
              {waehlbar.map(k => <button key={k} role="radio" data-klasse={k} aria-checked={k === klasse} className={k === klasse ? 'an' : ''} onClick={() => einstellungSetzen('pruefKlasse', k)}>{k}</button>)}
            </div>
          </>}
          <h3 className="dezent-titel">Art der Prüfung</h3>
          <div className="segment" role="radiogroup" aria-label="Prüfungsart">
            {(['ersterwerb', 'erweiterung'] as const).map(a => (
              <button key={a} role="radio" data-art={a} aria-checked={a === art} disabled={!arten.includes(a)} className={a === art ? 'an' : ''} onClick={() => einstellungSetzen('pruefArt', a)} title={!arten.includes(a) ? `Für Klasse ${klasse} nicht vorgesehen` : undefined}>{ART_TEXT[a]}</button>
            ))}
          </div>
          <p className="dezent klein-text">{art === 'ersterwerb' ? 'Erste Fahrerlaubnis: voller Grundstoff + Zusatzstoff der Klasse.' : 'Sie besitzen bereits eine Fahrerlaubnis: reduzierter Grundstoff + Zusatzstoff der neuen Klasse.'}</p>
          <h2 className="pruef-titel">Klasse {klasse} · {ART_TEXT[art]}</h2>
          <ul className="regeln" data-testid="regeln">
            <li><b data-testid="fragenzahl">{r.fragen}</b> Fragen: {r.grundstoff} Grundstoff + {r.zusatzstoff} Zusatzstoff, zusammen <b>{r.punkte} Punkte</b>
              {r.grundKapitel && <small className="dezent" data-testid="sachgebiete"><br />Grundstoff je Sachgebiet: {Object.entries(r.grundKapitel).map(([k, [n]]) => `${kat.kapitel.find(x => x.id === k)?.titel ?? k} ${n}`).join(' · ')}</small>}</li>
            <li><b>{r.dauerMin} Minuten</b> Bearbeitungszeit</li>
            <li>Bestanden mit höchstens <b data-testid="maxfp">{r.maxFehlerpunkte} Fehlerpunkten</b></li>
            {r.fuenferRegel ? <li>Nicht bestanden bei <b>zwei falschen 5-Punkte-Fragen</b></li> : <li>Keine 5-Punkte-Sonderregel</li>}
            <li>Fragen können markiert und bis zur Abgabe geändert werden</li>
            {probe.filme > 0 && <li data-testid="filmregel"><b>{probe.filme} Filmfragen</b>: jede Szene höchstens <b>{e.filmMax}×</b> abspielbar{e.filmErstAnsehen ? ', Antworten erst nach dem ersten vollständigen Ansehen' : ''} <small className="dezent">(Annahme, in den Einstellungen änderbar)</small></li>}
          </ul>
          {unsicher.length > 0 && <p className="hinweis-unsicher">⚠ Nicht amtlich belegt (unsicher): {unsicher.join(', ')}.</p>}
          {(probe.fehlendZusatz > 0 || probe.fehlendGrund > 0) && <p className="hinweis-unsicher">Der Beispiel-Fragenpool hat für Klasse {klasse} noch zu wenig {probe.fehlendZusatz > 0 ? 'Zusatzstoff' : 'Grundstoff'} – {probe.fehlendZusatz > 0 ? `${probe.fehlendZusatz} Plätze werden mit Grundstoff aufgefüllt` : `es fehlen ${probe.fehlendGrund} Fragen`}.</p>}
          {probe.punkte !== r.punkte && probe.fehlendZusatz === 0 && <p className="dezent klein-text">Punktsumme dieser Ziehung: {probe.punkte} (Ziel {r.punkte}).</p>}
          <button className="btn primaer gross" onClick={starten}>Prüfung starten</button>
          <p className="dezent klein-text">Regeln nach FeV Anlage 7. Alle Fragen sind selbst formulierte Beispielfragen, keine amtlichen Prüfungsfragen.</p>
        </div>
      </main>
    </div>
  );
}

function fmt(s: number) { const m = Math.floor(s / 60), x = s % 60; return `${String(m).padStart(2, '0')}:${String(x).padStart(2, '0')}`; }

export function PruefungLaeuft({ kat }: { kat: Katalog }) {
  const ids = useZustand().aktivePruefung?.fragenIds ?? null;
  const { fragen, fehler } = useVolleFragen(kat, ids);
  if (fehler) return <div className="seite"><Topbar titel="Prüfung" zurueck="/pruefung" /><div className="leer"><p>{fehler}</p></div></div>;
  if (ids && !fragen) return <div className="seite"><Topbar titel="Prüfung" zurueck="/pruefung" /><div className="leer"><div className="lade" aria-label="Lädt" /></div></div>;
  return <PruefungLaeuftInhalt kat={kat} fragen={fragen ?? []} />;
}

function PruefungLaeuftInhalt({ kat, fragen }: { kat: Katalog; fragen: Frage[] }) {
  const z = useZustand();
  const ap = z.aktivePruefung;
  const [idx, setIdx] = useState(0);
  const [nav, setNav] = useState(true);
  const [dialog, setDialog] = useState(false);
  const [jetzt, setJetzt] = useState(Date.now());
  useEffect(() => { const t = setInterval(() => setJetzt(Date.now()), 1000); return () => clearInterval(t); }, []);
  useEffect(() => () => vorlesenStopp(), []);
  const rest = ap ? Math.max(0, Math.round((ap.start + ap.dauerMin * 60000 - jetzt) / 1000)) : 0;

  const abgeben = (zeitAbgelaufen = false) => {
    if (!ap) return;
    const b = pruefungBewerten(fragen, ap.antworten, ap.maxFehlerpunkte ?? 10, ap.fuenferRegel ?? true);
    fragen.forEach(f => ergebnisSpeichern(f.id, !b.falsch.includes(f.id)));
    const id = String(Date.now());
    setZustand(s => ({ ...s, aktivePruefung: null, pruefungen: [{ id, datum: Date.now(), klassen: ap.klassen, fragenIds: ap.fragenIds, antworten: ap.antworten, fehlerpunkte: b.fehlerpunkte, bestanden: b.bestanden, grund: b.grund, dauerSek: Math.round((Date.now() - ap.start) / 1000), zeitAbgelaufen, klasse: ap.klasse, art: ap.art, maxFehlerpunkte: ap.maxFehlerpunkte }, ...s.pruefungen].slice(0, 50) }));
    ton(b.bestanden ? 'richtig' : 'falsch');
    go('/auswertung/' + id);
  };
  useEffect(() => { if (ap && rest === 0) abgeben(true); /* eslint-disable-next-line */ }, [rest]);
  const f = fragen[idx];
  const markiert = !!(ap && f && ap.markiert.includes(f.id));

  const upd = (fn: (a: AktivePruefung) => AktivePruefung) => setZustand(s => ({ ...s, aktivePruefung: s.aktivePruefung && fn(s.aktivePruefung) }));
  const auswaehlen = (i: number) => {
    if (!ap || !f) return;
    if (f.typ === 'zahl' || i >= (f.antworten?.length ?? 0)) return;
    if (f.medien?.film && z.einstellungen.filmErstAnsehen && !ap.filmGesehen?.includes(f.id)) return;
    const a = Array.isArray(ap.antworten[f.id]) ? ap.antworten[f.id] as number[] : [];
    upd(x => ({ ...x, antworten: { ...x.antworten, [f.id]: a.includes(i) ? a.filter(y => y !== i) : [...a, i].sort() } }));
  };
  const markUmschalten = () => f && upd(a => ({ ...a, markiert: markiert ? a.markiert.filter(x => x !== f.id) : [...a.markiert, f.id] }));
  useTasten({
    ArrowRight: () => setIdx(i => Math.min(fragen.length - 1, i + 1)), ArrowLeft: () => setIdx(i => Math.max(0, i - 1)),
    Enter: () => setIdx(i => Math.min(fragen.length - 1, i + 1)),
    '1': () => auswaehlen(0), '2': () => auswaehlen(1), '3': () => auswaehlen(2), '4': () => auswaehlen(3),
    a: () => auswaehlen(0), b: () => auswaehlen(1), c: () => auswaehlen(2), d: () => auswaehlen(3),
    m: () => markUmschalten(), f: filmUmschalten, g: () => setNav(n => !n),
  }, !!ap && !!f && !dialog);
  if (!ap || !f) return <div className="seite"><Topbar titel="Prüfung" zurueck="/pruefung" /><div className="leer"><p>Keine laufende Prüfung.</p><button className="btn primaer" onClick={() => go('/pruefung')}>Zur Prüfung</button></div></div>;
  const beantwortet = fragen.filter(x => istBeantwortet(x, ap.antworten[x.id])).length;


  return (
    <div className={'seite pruefung' + (nav ? ' nav-an' : '')}>
      <header className="topbar">
        <button className="icon-btn" onClick={() => go('/pruefung')} aria-label="Pausieren und zurück"><Icon n="back" /></button>
        <div className="topbar-titel"><h1>Prüfung{ap.klasse ? ` · ${ap.klasse}` : ''}</h1><small>Frage {idx + 1} / {fragen.length} · {beantwortet} beantwortet</small></div>
        <span className={'timer' + (rest < 300 ? ' knapp' : '')} aria-label="Restzeit"><Icon n="clock" s={18} /> {fmt(rest)}</span>
        {sprachausgabeVerfuegbar && z.einstellungen.vorlesen && <button className="icon-btn" aria-label="Vorlesen" onClick={() => vorlesen(vorleseText(f))}><Icon n="speaker" /></button>}
        <button className={'icon-btn' + (nav ? ' aktiv' : '')} onClick={() => setNav(!nav)} aria-label={nav ? 'Navigation ausblenden' : 'Navigation einblenden'} title="Navigation ein/aus"><Icon n="grid" /></button>
      </header>
      {nav && (
        <nav className="pruef-nav" aria-label="Fragenübersicht">
          {fragen.map((x, i) => (
            <button key={x.id} onClick={() => setIdx(i)} className={['nr', i === idx && 'akt', istBeantwortet(x, ap.antworten[x.id]) && 'beantw', ap.markiert.includes(x.id) && 'mark'].filter(Boolean).join(' ')} aria-label={`Frage ${i + 1}${istBeantwortet(x, ap.antworten[x.id]) ? ', beantwortet' : ''}${ap.markiert.includes(x.id) ? ', markiert' : ''}${x.medien?.film ? ', Filmfrage' : ''}`} aria-current={i === idx ? 'true' : undefined}>{i + 1}</button>
          ))}
        </nav>
      )}
      <main tabIndex={-1} className="karte-wrap" key={f.id}>
        <FrageAnsicht frage={f} eingabe={ap.antworten[f.id]} onChange={e => upd(a => ({ ...a, antworten: { ...a.antworten, [f.id]: e } }))} kapitelTitel={kat.kapitel.find(k => k.id === f.kapitel)?.titel}
          modus="pruefung" filmMax={ap.filmMax ?? z.einstellungen.filmMax} filmAbgespielt={ap.filmAbgespielt?.[f.id] ?? 0} filmGesehen={!!ap.filmGesehen?.includes(f.id)}
          onFilmStart={() => upd(a => ({ ...a, filmAbgespielt: { ...a.filmAbgespielt, [f.id]: (a.filmAbgespielt?.[f.id] ?? 0) + 1 } }))}
          onFilmEnde={() => upd(a => a.filmGesehen?.includes(f.id) ? a : ({ ...a, filmGesehen: [...(a.filmGesehen ?? []), f.id] }))} />
      </main>
      <footer className="aktionsleiste">
        <button className="btn ghost" onClick={() => setIdx(Math.max(0, idx - 1))} disabled={idx === 0} aria-label="Vorherige Frage"><Icon n="back" /></button>
        <button className={'btn ghost' + (markiert ? ' markiert' : '')} aria-pressed={markiert} onClick={markUmschalten}><Icon n="flag" s={18} /> {markiert ? 'Markiert' : 'Markieren'}</button>
        <button className="btn primaer" onClick={() => setDialog(true)}>Abgeben</button>
        <button className="btn ghost" onClick={() => setIdx(Math.min(fragen.length - 1, idx + 1))} disabled={idx === fragen.length - 1} aria-label="Nächste Frage"><Icon n="next" /></button>
      </footer>
      {dialog && (
        <div className="modal-bg" onClick={() => setDialog(false)}>
          <div className="modal" role="dialog" aria-modal="true" aria-labelledby="abgabe-titel" onClick={e => e.stopPropagation()}>
            <h2 id="abgabe-titel">Prüfung abgeben?</h2>
            <p>{beantwortet} von {fragen.length} Fragen beantwortet{ap.markiert.length ? `, ${ap.markiert.length} markiert` : ''}.</p>
            {beantwortet < fragen.length && <p className="nok-text">Unbeantwortete Fragen zählen als falsch.</p>}
            <div className="modal-aktionen"><button className="btn ghost" onClick={() => setDialog(false)}>Weiter bearbeiten</button><button className="btn primaer" autoFocus onClick={() => abgeben()}>Jetzt abgeben</button></div>
          </div>
        </div>
      )}
    </div>
  );
}
