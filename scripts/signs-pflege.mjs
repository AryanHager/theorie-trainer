// Pflege des Zeichen-Manifests (public/signs/signs.json), idempotent:
//  1. Namen bereinigen: amtliche Kurzbezeichnungen nach StVO Anlagen 1–4 (gesetze-im-internet.de),
//     einheitliche Schreibweise (Haltverbot, km/h, zulässige Gesamtmasse), Trennzeichen vereinheitlichen.
//  2. Varianten gruppieren: gruppe (Grundnummer), grundname, variante (z. B. „Aufstellung links“).
//  3. Eigene Zeichnungen (scripts/eigene-zeichen.mjs) einfügen bzw. aktualisieren.
import { readFileSync, writeFileSync } from 'node:fs';
import { eigeneSchreiben } from './eigene-zeichen.mjs';
const ROOT = new URL('..', import.meta.url).pathname;
const P = ROOT + 'public/signs/signs.json';
const m = JSON.parse(readFileSync(P, 'utf8'));

// Amtliche Bezeichnungen (StVO Anlage 1–4), nur wo die Commons-Bezeichnung abweicht oder fehlt
const AMTLICH = {
  '102': 'Kreuzung oder Einmündung', '103': 'Kurve', '105': 'Doppelkurve', '108': 'Gefälle', '110': 'Steigung', '117': 'Seitenwind',
  '121': 'Einseitig verengte Fahrbahn', '133': 'Fußgänger', '136': 'Kinder', '138': 'Radverkehr', '142': 'Wildwechsel',
  '156': 'Bahnübergang mit dreistreifiger Bake', '157': 'Dreistreifige Bake', '159': 'Zweistreifige Bake', '162': 'Einstreifige Bake',
  '201': 'Andreaskreuz', '205': 'Vorfahrt gewähren.', '206': 'Halt. Vorfahrt gewähren.', '208': 'Vorrang des Gegenverkehrs',
  '209': 'Vorgeschriebene Fahrtrichtung', '211': 'Vorgeschriebene Fahrtrichtung', '214': 'Vorgeschriebene Fahrtrichtung',
  '220': 'Einbahnstraße', '222': 'Vorgeschriebene Vorbeifahrt', '229': 'Taxenstand', '237': 'Radweg', '238': 'Reitweg', '239': 'Gehweg',
  '240': 'Gemeinsamer Geh- und Radweg', '241': 'Getrennter Rad- und Gehweg', '251': 'Verbot für Kraftwagen', '253': 'Verbot für Kraftfahrzeuge über 3,5 t',
  '254': 'Verbot für Radverkehr', '255': 'Verbot für Krafträder', '257': 'Verbot für bestimmte Verkehrsarten', '259': 'Verbot für Fußgänger', '260': 'Verbot für Kraftfahrzeuge',
  '262': 'Verbot für Fahrzeuge über der angegebenen tatsächlichen Masse', '263': 'Verbot für Fahrzeuge über der angegebenen tatsächlichen Achslast',
  '264': 'Verbot für Fahrzeuge über der angegebenen tatsächlichen Breite', '265': 'Verbot für Fahrzeuge über der angegebenen tatsächlichen Höhe',
  '266': 'Verbot für Fahrzeuge oder Züge über der angegebenen tatsächlichen Länge', '268': 'Schneeketten vorgeschrieben',
  '273': 'Verbot des Unterschreitens des angegebenen Mindestabstands', '274': 'Zulässige Höchstgeschwindigkeit', '275': 'Vorgeschriebene Mindestgeschwindigkeit',
  '276': 'Überholverbot für Kraftfahrzeuge aller Art', '277': 'Überholverbot für Kraftfahrzeuge über 3,5 t', '277.1': 'Verbot des Überholens von einspurigen Fahrzeugen',
  '278': 'Ende der zulässigen Höchstgeschwindigkeit', '279': 'Ende der vorgeschriebenen Mindestgeschwindigkeit', '280': 'Ende des Überholverbots für Kraftfahrzeuge aller Art',
  '281': 'Ende des Überholverbots für Kraftfahrzeuge über 3,5 t', '281.1': 'Ende des Verbots des Überholens von einspurigen Fahrzeugen',
  '282': 'Ende sämtlicher streckenbezogener Geschwindigkeitsbeschränkungen und Überholverbote', '283': 'Absolutes Haltverbot', '286': 'Eingeschränktes Haltverbot',
  '290.1': 'Beginn eines eingeschränkten Haltverbots für eine Zone', '290.2': 'Ende eines eingeschränkten Haltverbots für eine Zone',
  '314': 'Parken', '315': 'Parken auf Gehwegen', '333': 'Ausfahrt von der Autobahn', '350': 'Fußgängerüberweg', '393': 'Informationstafel an Grenzübergangsstellen',
  '394': 'Laternenring', '460': 'Bedarfsumleitung', '466': 'Weiterführende Bedarfsumleitung', '501': 'Überleitungstafel', '531': 'Einengungstafel', '590': 'Blockumfahrung',
  '600': 'Absperrschranke', '605': 'Leitbake', '610': 'Leitkegel', '616': 'Fahrbare Absperrtafel mit Blinkpfeil', '620': 'Leitpfosten', '625': 'Richtungstafel in Kurven',
  '626': 'Leitplatte', '627': 'Leitmal', '630': 'Parkwarntafel', '223.1': 'Seitenstreifen befahren', '223.2': 'Seitenstreifen nicht mehr befahren', '223.3': 'Seitenstreifen räumen',
};
const sauber = s => s
  .replace(/\s*,?\s*StVO BAnz AT [\d.]+ \w+$/, '')
  .replace(/km-h/g, 'km/h').replace(/Halteverbot/g, 'Haltverbot').replace(/Haltverbotes/g, 'Haltverbots').replace(/Überholverbotes/g, 'Überholverbots')
  .replace(/zulässigen Gesamtgewicht/g, 'zulässigen Gesamtmasse').replace(/Gesamtgewicht/g, 'Gesamtmasse')
  .replace(/Rechtsaufstellung/g, 'Aufstellung rechts').replace(/Linksaufstellung/g, 'Aufstellung links')
  .replace(/Darstellung ohne Gegenverkehr/g, 'ohne Gegenverkehr').replace(/Darstellung mit Gegenverkehr/g, 'mit Gegenverkehr')
  .replace(/getrennter Fuß- und Radweg/gi, 'Getrennter Rad- und Gehweg').replace(/Sonderweg Radfahrer/g, 'Radweg').replace(/Sonderweg Fußgänger/g, 'Gehweg').replace(/Sonderweg Reiter/g, 'Reitweg').replace(/BlmSchG/g, 'BImSchG').replace(/über angegebene tatsächliche/g, 'über der angegebenen tatsächlichen').replace(/^b - /, '').replace(/^Pfeilschild - /, '')
  .replace(/\s+[-−–]\s*|;\s*/g, ', ').replace(/\(\s*/g, '(').replace(/\s*\)/g, ')').replace(/\s{2,}/g, ' ').replace(/"/g, '„')
  .replace(/^(.)/, c => c.toUpperCase()).trim();

const commons = m.schilder.filter(s => !s.eigen);
const klammer = s => s.replace(/^Einseitig \((links|rechts)\) verengte Fahrbahn/i, 'Einseitig verengte Fahrbahn, $1').replace(/\s*\(([^()]*)\)\s*(,|$)/g, ', $1$2').replace(/,\s*,/g, ',').replace(/,\s*$/, '');
const proGruppe = {};
for (const s of commons) { s.nameCommons ??= s.name; s.gruppe = s.nr.split('-')[0]; (proGruppe[s.gruppe] ??= []).push(s); }
const ohneSatzzeichen = x => x.toLowerCase().replace(/[.!]$/, '');
for (const [g, liste] of Object.entries(proGruppe)) {
  const roh = s => klammer(sauber(s.nameCommons));
  const istZusatz = liste[0].kategorie === 'Zusatzzeichen';
  let basis = AMTLICH[g] ?? (liste.find(s => s.nr === g) ? roh(liste.find(s => s.nr === g)) : null);
  if (!basis) { let p = roh(liste[0]); for (const s of liste) { const n = roh(s); while (p && !n.startsWith(p)) p = p.slice(0, -1); } p = p.replace(/[,\s(–-]+$/, ''); basis = p.length >= 8 ? p : null; }
  for (const s of liste) {
    const n = roh(s), suf = s.nr.includes('-') ? s.nr.split('-')[1] : null;
    let variante = null, name;
    if (suf && ['274', '275', '278', '279'].includes(g)) variante = `${suf} km/h`;
    else if (suf && ['108', '110'].includes(g)) variante = `${suf} %`;
    else if (basis && ohneSatzzeichen(n).startsWith(ohneSatzzeichen(basis)) && n.length > basis.length) variante = n.slice(basis.replace(/[.!]$/, '').length).replace(/^[.,!\s–-]+/, '') || null;
    else if (suf || (basis && ohneSatzzeichen(n) !== ohneSatzzeichen(basis))) variante = n;
    if (istZusatz) { variante = n; name = n; }
    else if (!basis || g === '101' || variante === n) name = variante ?? n;
    else name = variante ? `${basis} – ${variante}` : basis;
    if (!s.nr.includes('-') && AMTLICH[g] && variante === n) variante = null;
    if (!s.nr.includes('-') && !variante) name = basis ?? n;
    if (basis) basis = basis.replace(/\s*„$/, '');
    s.grundname = istZusatz ? `Zusatzzeichen ${g}` : (g === '101' ? 'Gefahrzeichen mit Sinnbild' : basis ?? n);
    s.variante = variante; s.name = name;
  }
}
const FIX = { '630-10': 'Parkwarntafel – Ausführung links', '630-20': 'Parkwarntafel – Ausführung rechts', '241-30': 'Getrennter Rad- und Gehweg', '270.2': 'Ende einer Verkehrsverbotszone zur Verminderung schädlicher Luftverunreinigungen (Umweltzone)', '270.1': 'Beginn einer Verkehrsverbotszone zur Verminderung schädlicher Luftverunreinigungen (Umweltzone)', '422-24': 'Wegweiser für bestimmte Verkehrsarten „Fahrzeuge mit wassergefährdender Ladung“, hier rechts', '350.1-20': 'Radschnellweg – Aufstellung links' };
for (const s of commons) if (FIX[s.nr]) { s.name = FIX[s.nr]; s.variante = s.name.split(/, | – /).slice(1).join(', ') || s.variante; }
const eigene = eigeneSchreiben(ROOT + 'public/signs/eigen').map(e => ({
  nr: e.nr, name: e.variante ? `${e.name} – ${e.variante}` : e.name, grundname: e.name, variante: e.variante ?? null, gruppe: e.nr.replace(/-.*$/, ''), kategorie: e.kategorie, datei: e.datei,
  quelle: 'Eigene Zeichnung (dieses Projekt)', commonsDatei: null, lizenz: 'Eigene Darstellung, frei verwendbar im Projekt', stvo: null, eigen: true,
}));
m.schilder = [...commons, ...eigene];
for (const k of ['Lichtzeichen', 'Polizeizeichen']) if (!m.kategorien.includes(k)) m.kategorien.push(k);
m.hinweis = 'Amtliche Zeichen: Wikimedia Commons, gemeinfrei (§ 5 UrhG). Mit „eigen“ markierte Einträge sind eigene, schematische Zeichnungen dieses Projekts (Markierungen, Lichtzeichen, Polizeizeichen). Bezeichnungen nach StVO Anlagen 1–4.';
writeFileSync(P, JSON.stringify(m, null, 1));
const gruppen = new Set(m.schilder.map(s => s.gruppe));
console.log(`Zeichen: ${m.schilder.length} (davon eigene ${eigene.length}), Gruppen: ${gruppen.size}`);
