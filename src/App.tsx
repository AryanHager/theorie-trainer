import { lazy, Suspense, useEffect, useState } from 'react';
import type { Katalog } from './types';
import { mischen, passtZuKlassen } from './logic';
import { getZustand, status, useZustand } from './store';
import { useRoute } from './router';
import { ladeIndex } from './katalog';
import { Start } from './pages/Start';
import { TastenHilfe } from './components/TastenHilfe';
// alle Seiten außer der Startseite erst bei Bedarf laden (kleineres Start-Bundle)
const LernSitzung = lazy(() => import('./components/LernSitzung').then(m => ({ default: m.LernSitzung })));
const KapitelListe = lazy(() => import('./pages/Kapitel').then(m => ({ default: m.KapitelListe })));
const PruefungStart = lazy(() => import('./pages/Pruefung').then(m => ({ default: m.PruefungStart })));
const PruefungLaeuft = lazy(() => import('./pages/Pruefung').then(m => ({ default: m.PruefungLaeuft })));
const Auswertung = lazy(() => import('./pages/Auswertung').then(m => ({ default: m.Auswertung })));
const Statistik = lazy(() => import('./pages/Statistik').then(m => ({ default: m.Statistik })));
const Suche = lazy(() => import('./pages/Suche').then(m => ({ default: m.Suche })));
const Einstellungen = lazy(() => import('./pages/Einstellungen').then(m => ({ default: m.Einstellungen })));
const Zeichen = lazy(() => import('./pages/Zeichen').then(m => ({ default: m.Zeichen })));
const Quellen = lazy(() => import('./pages/Quellen').then(m => ({ default: m.Quellen })));
const Filme = lazy(() => import('./pages/Filme').then(m => ({ default: m.Filme })));
const Impressum = lazy(() => import('./pages/Rechtliches').then(m => ({ default: m.Impressum })));
const Datenschutz = lazy(() => import('./pages/Rechtliches').then(m => ({ default: m.Datenschutz })));
const Lernplan = lazy(() => import('./pages/Lernplan').then(m => ({ default: m.Lernplan })));

function useTheme() {
  const { einstellungen: { theme, kontrast, grosseSchrift } } = useZustand();
  useEffect(() => {
    document.documentElement.classList.toggle('kontrast', !!kontrast);
    document.documentElement.classList.toggle('gross', !!grosseSchrift);
  }, [kontrast, grosseSchrift]);
  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)');
    const set = () => {
      const dunkel = theme === 'dunkel' || (theme === 'auto' && mq.matches);
      document.documentElement.dataset.theme = dunkel ? 'dunkel' : 'hell';
      document.querySelector('meta[name=theme-color]')?.setAttribute('content', dunkel ? '#0b1416' : '#0f766e');
    };
    set(); mq.addEventListener('change', set); return () => mq.removeEventListener('change', set);
  }, [theme]);
}

/** Schwächentraining: falsch beantwortete und markierte Fragen zuerst, dann neue, dann unsichere */
function effektivIds(kat: Katalog) {
  const z = getZustand();
  const pool = kat.fragen.filter(f => passtZuKlassen(f, z.einstellungen.klassen) && (z.einstellungen.variationen || !f.variante));
  const gewicht = (id: string) => {
    const fo = z.fortschritt[id], s = status(fo);
    let w = Math.random();
    if (z.markiert.includes(id)) w += 6;
    if (s === 'falsch') w += 8 + Math.min(fo!.f, 5);
    else if (s === 'neu') w += 4;
    else if (s === 'einmal') w += 2;
    return w;
  };
  return pool.map(f => ({ id: f.id, w: gewicht(f.id) })).sort((a, b) => b.w - a.w).slice(0, 20).map(x => x.id);
}

function Sitzung({ kat, art }: { kat: Katalog; art: string }) {
  const { klassen: kl, variationen } = getZustand().einstellungen;
  const [ids] = useState(() => {
    const pool = kat.fragen.filter(f => passtZuKlassen(f, kl) && (variationen || !f.variante));
    if (art === 'filme') return mischen(pool.filter(f => f.medien?.film).map(f => f.id));
    if (art === 'bildauswahl') return mischen(pool.filter(f => f.typ === 'bildauswahl').map(f => f.id));
    if (art === 'notizen') { const n = getZustand().notizen; return kat.fragen.filter(f => n[f.id]).map(f => f.id); }
    if (art === 'markiert') { const m = getZustand().markiert; return kat.fragen.filter(f => m.includes(f.id)).map(f => f.id); }
    if (art === 'effektiv') return effektivIds(kat);
    if (art === 'zahlen') return mischen(pool.filter(f => f.zahlenfrage || f.typ === 'zahl').map(f => f.id));
    if (art.startsWith('frage:')) return [art.slice(6)];
    if (art === 'alle') return pool.map(f => f.id);
    return pool.filter(f => f.kapitel === art).map(f => f.id);
  });
  const titel = art === 'effektiv' ? 'Effektiv lernen' : art === 'zahlen' ? 'Zahlenfragen' : art === 'filme' ? 'Filmfragen' : art === 'bildauswahl' ? 'Bildauswahl-Fragen' : art === 'notizen' ? 'Fragen mit Notiz' : art === 'markiert' ? 'Markierte Fragen' : art.startsWith('frage:') ? 'Frage' : art === 'alle' ? 'Alle Fragen' : (k => k ? `${k.id} ${k.titel}` : 'Lernen')(kat.kapitel.find(k => k.id === art));
  const zurueck = art.startsWith('frage:') ? '/suche' : ['effektiv', 'zahlen', 'filme', 'bildauswahl', 'notizen', 'markiert'].includes(art) ? '/' : '/lernen';
  return <LernSitzung kat={kat} ids={ids} titel={titel} zurueck={zurueck} />;
}

export default function App() {
  useTheme();
  const route = useRoute();
  const [kat, setKat] = useState<Katalog | null>(null);
  const [fehler, setFehler] = useState<string | null>(null);
  useEffect(() => {
    ladeIndex().then(setKat).catch(e => setFehler('Fragenkatalog konnte nicht geladen werden (' + e.message + ').'));
  }, []);
  if (fehler) return <div className="leer"><p>{fehler}</p></div>;
  if (!kat) return <div className="leer"><div className="lade" aria-label="Lädt" /></div>;

  const [, a, b] = route.split('/');
  let seite;
  switch (a) {
    case 'lernen': seite = b ? <Sitzung key={route} kat={kat} art={b} /> : <KapitelListe kat={kat} />; break;
    case 'effektiv': seite = <Sitzung key={route} kat={kat} art="effektiv" />; break;
    case 'zahlen': seite = <Sitzung key={route} kat={kat} art="zahlen" />; break;
    case 'ueben': seite = <Sitzung key={route} kat={kat} art={b} />; break;
    case 'filme': seite = <Filme kat={kat} />; break;
    case 'lernplan': seite = <Lernplan kat={kat} />; break;
    case 'frage': seite = <Sitzung key={route} kat={kat} art={'frage:' + b} />; break;
    case 'pruefung': seite = b === 'laeuft' ? <PruefungLaeuft kat={kat} /> : <PruefungStart kat={kat} />; break;
    case 'auswertung': seite = <Auswertung kat={kat} id={b} />; break;
    case 'statistik': seite = <Statistik kat={kat} />; break;
    case 'suche': seite = <Suche kat={kat} />; break;
    case 'zeichen': seite = <Zeichen auswahl={b} />; break;
    case 'quellen': seite = <Quellen kat={kat} />; break;
    case 'impressum': seite = <Impressum />; break;
    case 'datenschutz': seite = <Datenschutz />; break;
    case 'einstellungen': seite = <Einstellungen kat={kat} />; break;
    default: seite = <Start kat={kat} />;
  }
  return <div className="app"><Suspense fallback={<div className="leer"><div className="lade" aria-label="Lädt" /></div>}>{seite}</Suspense><TastenHilfe /></div>;
}
