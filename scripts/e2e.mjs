import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
const URL = process.env.URL || 'http://localhost:4173/';
const SS = 'screenshots/';
const kat = JSON.parse(readFileSync('public/data/fragen.json', 'utf8'));
const byId = Object.fromEntries(kat.fragen.map(f => [f.id, f]));
const richtig = f => f.typ === 'zahl' ? String(f.zahl.wert).replace('.', ',') : f.antworten.map((a, i) => a.richtig ? i : -1).filter(i => i >= 0);
const fehler = []; const ok = (c, m) => { if (!c) { fehler.push(m); console.log('FAIL', m); } else console.log('OK  ', m); };

const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 1280, height: 860 }, locale: 'de-DE', colorScheme: 'light' });
const p = await ctx.newPage();
p.on('pageerror', e => fehler.push('pageerror: ' + e.message));
const fremd = new Set(); const URSPRUNG = new globalThis.URL(URL).origin;
ctx.on('request', r => { const u = r.url(); if (!u.startsWith(URSPRUNG) && !/^(data|blob|about):/.test(u)) fremd.add(u); });
p.on('console', m => m.type() === 'error' && fehler.push('console: ' + m.text()));

await p.goto(URL); await p.waitForSelector('.kacheln');
ok(await p.locator('text=Theorie-Trainer').first().isVisible(), 'Startseite lädt');
await p.screenshot({ path: SS + '01-startseite.png' });

// Einstellungen: Klassen A+B
await p.click('[aria-label=Einstellungen]');
await p.waitForSelector('.klasse[data-klasse]');
ok(await p.locator('.klasse[data-klasse]').count() === 13, 'Alle 13 Klassen in den Einstellungen');
await p.click('.klasse[data-klasse="A"]');
ok(await p.locator('.klasse.an').count() === 2, 'Mehrere Klassen gleichzeitig wählbar');
await p.screenshot({ path: SS + '02-einstellungen.png' });

// Lernmodus
await p.goto(URL + '#/lernen'); await p.waitForSelector('.zeile');
ok(await p.locator('.gruppen-titel').count() === 2 && await p.locator('[data-kapitel="1.1"]').count() === 1 && await p.locator('[data-kapitel="2.6"]').count() === 1, 'Themen nach Grund-/Zusatzstoff gegliedert (1.1 … 2.x)');
await p.screenshot({ path: SS + '03-themen.png', fullPage: true });
await p.click('[data-kapitel="1.3"]');
await p.waitForSelector('.frage');
{ const t0 = await p.textContent('.frage-text'); const f0 = kat.fragen.find(f => f.text === t0); for (const i of richtig(f0)) await p.click(`.antwort >> nth=${i}`); }
await p.screenshot({ path: SS + '04-lernmodus-frage.png' });
await p.click('text=Antwort prüfen');
ok(await p.locator('.feedback.ok').isVisible(), 'Auswertung im Lernmodus (richtig erkannt)');
await p.click('[aria-label="Erklärung anzeigen"]');
await p.click('[aria-label="Als schwierig markieren"]');
ok(await p.locator('.erklaerung').isVisible(), 'Erklärung "i" sichtbar');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '05-erklaerung.png' });
await p.click('.bild-btn'); await p.waitForSelector('.lightbox');
await p.screenshot({ path: SS + '06-bild-gross.png' });
await p.keyboard.press('Escape');
await p.keyboard.press('ArrowRight');
ok((await p.textContent('.topbar small')).includes('Frage 2'), 'Weiter per Pfeiltaste');

// Zahlenfragen
await p.goto(URL + '#/zahlen'); await p.waitForSelector('.frage');
let n = 0;
while (!(await p.locator('.zahl-eingabe input').count()) && n++ < 10) await p.keyboard.press('ArrowRight');
const txt = await p.textContent('.frage-text');
const zf = kat.fragen.find(f => f.text === txt);
await p.fill('.zahl-eingabe input', String(zf.zahl.wert).replace('.', ','));
await p.click('text=Antwort prüfen');
ok(await p.locator('.feedback.ok').isVisible(), 'Zahlenfrage mit Eingabe ausgewertet');
await p.screenshot({ path: SS + '07-zahlenfrage.png' });

// Suche
await p.goto(URL + '#/suche'); await p.fill('.suchfeld', 'kreisverkehr');
ok(await p.locator('.liste-einfach .zeile').count() >= 1, 'Suche findet Treffer');
await p.screenshot({ path: SS + '08-suche.png' });

// Prüfung 1: bestanden-Test (alle richtig) über UI
await p.goto(URL + '#/pruefung'); await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
const st = async () => p.evaluate(() => JSON.parse(localStorage.getItem('theorie-trainer:v1')));
let s = await st();
ok(s.aktivePruefung.fragenIds.length === 30 && s.aktivePruefung.klasse === 'B' && s.aktivePruefung.art === 'ersterwerb', 'Klasse B Ersterwerb: 30 Fragen gezogen');
{ const fr = s.aktivePruefung.fragenIds.map(id => byId[id]);
  ok(fr.filter(f => f.stoff === 'grundstoff').length === 20 && fr.filter(f => f.stoff === 'zusatzstoff' && f.klassen.includes('B')).length === 10, '20 Grundstoff + 10 Zusatzstoff (Klasse B)');
  ok(fr.reduce((a, f) => a + f.punkte, 0) === 110, `Punktsumme 110 (ist ${fr.reduce((a, f) => a + f.punkte, 0)})`);
  ok(s.aktivePruefung.maxFehlerpunkte === 10 && s.aktivePruefung.fuenferRegel === true, 'Regeln: max. 10 FP, 5-Punkte-Regel'); }
const mutter = new Set(s.aktivePruefung.fragenIds.map(id => byId[id].mutterfrageId));
ok(mutter.size === s.aktivePruefung.fragenIds.length, 'Je Mutterfrage nur eine Variante');
// erste Auswahlfrage per UI beantworten + markieren
{ const i = s.aktivePruefung.fragenIds.findIndex(id => byId[id].typ === 'auswahl' && !byId[id].medien?.film); await p.click(`.nr >> nth=${i}`); await p.waitForSelector('.antwort'); }
await p.click('.antwort >> nth=0');
await p.click('text=Markieren');
await p.click('.nr >> nth=4');
await p.screenshot({ path: SS + '09-pruefungssimulation.png' });
await p.click('[aria-label="Navigation ausblenden"]');
ok(await p.locator('.pruef-nav').count() === 0, 'Navigation ausblendbar');
await p.click('[aria-label="Navigation einblenden"]');
// Szenario: alles richtig außer zwei 5-Punkte-Fragen -> durchgefallen
const setAntw = async (fn) => {
  await p.evaluate(([fnSrc, kat]) => {
    const s = JSON.parse(localStorage.getItem('theorie-trainer:v1'));
    const by = Object.fromEntries(kat.fragen.map(f => [f.id, f]));
    const f = new Function('return ' + fnSrc)();
    s.aktivePruefung.antworten = f(s.aktivePruefung.fragenIds.map(id => by[id]));
    localStorage.setItem('theorie-trainer:v1', JSON.stringify(s));
  }, [fn.toString(), kat]);
  await p.reload(); await p.waitForSelector('.pruef-nav');
};
const answerFn = (mode) => `(fr) => { const r = f => f.typ==='zahl' ? String(f.zahl.wert).replace('.',',') : f.antworten.map((a,i)=>a.richtig?i:-1).filter(i=>i>=0);
  const wrong = f => f.typ==='zahl' ? '99999' : [f.antworten.findIndex(a=>!a.richtig)];
  let fuenf = 0; const o = {}; for (const f of fr) { if ('${mode}'==='zwei5' && f.punkte===5 && fuenf<2) { fuenf++; o[f.id]=wrong(f); } else o[f.id]=r(f); } return o; }`;
for (let i = 0; i < 15 && (await st()).aktivePruefung.fragenIds.filter(id => byId[id].punkte === 5).length < 2; i++) {
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('theorie-trainer:v1')); s.aktivePruefung = null; localStorage.setItem('theorie-trainer:v1', JSON.stringify(s)); });
  await p.goto(URL + '#/pruefung'); await p.reload(); await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
}
await setAntw(answerFn('zwei5'));
await p.click('text=Abgeben'); await p.screenshot({ path: SS + '10-abgabe-dialog.png' });
await p.click('text=Jetzt abgeben'); await p.waitForSelector('.ergebnis');
ok(await p.locator('.ergebnis.nok').isVisible() && (await p.textContent('.ergebnis')).includes('5 Fehlerpunkten'), 'Zwei 5-Punkte-Fehler (10 FP) => nicht bestanden');
await p.screenshot({ path: SS + '11-auswertung-nicht-bestanden.png', fullPage: true });
// Szenario bestanden
await p.goto(URL + '#/pruefung'); await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
await setAntw(answerFn('alle'));
await p.click('text=Abgeben'); await p.click('text=Jetzt abgeben'); await p.waitForSelector('.ergebnis');
ok(await p.locator('.ergebnis.ok').isVisible(), 'Alles richtig => bestanden');
await p.click('.auswertung-kopf >> nth=0');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '12-auswertung-bestanden.png' });
// Effektiv lernen: zuvor falsche/markierte zuerst
s = await st();
await p.goto(URL + '#/effektiv'); await p.waitForSelector('.frage');
const ersterText = await p.textContent('.frage-text'); const erste = kat.fragen.find(f => f.text === ersterText);
const fst = s.fortschritt[erste.id];
ok(s.markiert.includes(erste.id) || fst?.zuletzt === 'f' || !fst, 'Effektiv lernen: erste Frage ist markiert/falsch/neu');
await p.screenshot({ path: SS + '13-effektiv-lernen.png' });
// Statistik
await p.goto(URL + '#/statistik'); await p.waitForSelector('.verlauf');
await p.screenshot({ path: SS + '14-statistik.png', fullPage: true });
{ const zahl = async () => parseInt(await p.textContent('[data-testid=stat-anzahl]'), 10);
  const alle = await zahl();
  await p.click('[data-statklasse=A]'); const nurA = await zahl();
  ok(nurA > 0 && nurA < alle && (await p.textContent('[data-testid=stat-titel]')).includes('Klasse A'), `Statistik-Filter Klasse: alle ${alle} → nur A ${nurA}`);
  await p.selectOption('[data-testid=stat-kapitel]', '2.1'); const kap = await zahl();
  ok(kap > 0 && kap < nurA && await p.locator('.themen-zeile').count() === 1, `Statistik-Filter Thema 2.1: ${kap} Fragen, eine Themenzeile`);
  await p.screenshot({ path: SS + '71-statistik-filter.png', fullPage: true });
  await p.click('[data-statklasse=alle]'); await p.selectOption('[data-testid=stat-kapitel]', 'alle');
  ok(await zahl() === alle, 'Statistik-Filter zurückgesetzt'); }
await p.goto(URL + '#/einstellungen'); await p.waitForSelector('[data-testid=ohne-theorie]');
await p.click('[data-testid=ohne-theorie] summary');
ok((await p.textContent('[data-testid=ohne-theorie]')).includes('C1E'), 'Einstellungen: Hinweis zu Klassen ohne Theorieprüfung (BE, C1E, D1E, DE)');
await p.locator('[data-testid=ohne-theorie]').screenshot({ path: SS + '72-ohne-theorie.png' });

// Prüfungsstart: Klassen-/Artwahl
await p.goto(URL + '#/pruefung'); await p.waitForSelector('[data-art]');
ok((await p.textContent('[data-testid=sachgebiete]') || '').includes(kat.kapitel.find(k => k.id === '1.1').titel), 'Prüfungsstart zeigt Grundstoff je Sachgebiet');
ok(await p.textContent('[data-testid=fragenzahl]') === '30' && (await p.textContent('[data-testid=maxfp]')).startsWith('10'), 'Startseite zeigt B-Ersterwerb 30 Fragen / 10 FP');
await p.click('[data-art=erweiterung]');
ok(await p.textContent('[data-testid=fragenzahl]') === '20' && (await p.textContent('[data-testid=maxfp]')).startsWith('6'), 'Erweiterung: 20 Fragen / 6 FP');
await p.screenshot({ path: SS + '29-pruefung-start-erweiterung.png' });
await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
s = await st();
{ const fr = s.aktivePruefung.fragenIds.map(id => byId[id]);
  ok(fr.length === 20 && fr.filter(f => f.stoff === 'grundstoff').length === 10 && fr.reduce((a, f) => a + f.punkte, 0) === 72 && s.aktivePruefung.maxFehlerpunkte === 6, `Erweiterung B: 10+10 Fragen, 72 Punkte, 6 FP (Summe ${fr.reduce((a, f) => a + f.punkte, 0)})`); }
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('theorie-trainer:v1')); s.aktivePruefung = null; localStorage.setItem('theorie-trainer:v1', JSON.stringify(s)); });
await p.goto(URL + '#/pruefung'); await p.reload(); await p.waitForSelector('[data-art]');
await p.click('.segment [data-klasse=A]'); await p.click('[data-art=ersterwerb]');
await p.screenshot({ path: SS + '30-pruefung-start-klasse-a.png' });
await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
s = await st();
{ const fr = s.aktivePruefung.fragenIds.map(id => byId[id]);
  ok(s.aktivePruefung.klasse === 'A' && fr.length === 30 && fr.every(f => f.klassen.includes('A')) && fr.filter(f => f.stoff === 'zusatzstoff').length === 10, 'Klasse A: 30 Fragen, alle für A, 10 Zusatzstoff'); }
await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('theorie-trainer:v1')); s.aktivePruefung = null; localStorage.setItem('theorie-trainer:v1', JSON.stringify(s)); });
// Phase 2: Klassen C, D, T und Mofa ohne Grundstoff-Auffüllung
await p.goto(URL); await p.waitForSelector('.kacheln'); await p.click('[aria-label=Einstellungen]'); await p.waitForSelector('.klasse[data-klasse]');
for (const k of ['C', 'D', 'T', 'Mofa']) await p.click(`.klasse[data-klasse="${k}"]`);
for (const [k, art, n, zus] of [['C', 'erweiterung', 37, 27], ['D', 'erweiterung', 40, 30], ['T', 'ersterwerb', 30, 10], ['Mofa', 'ersterwerb', 20, 5]]) {
  await p.goto(URL + '#/pruefung'); await p.reload(); await p.waitForSelector('[data-art]');
  await p.click(`.segment [data-klasse="${k}"]`); if (await p.locator(`[data-art=${art}]`).isEnabled()) await p.click(`[data-art=${art}]`);
  if (k === 'C') await p.screenshot({ path: SS + '58-pruefung-start-klasse-c.png' });
  await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
  s = await st();
  const fr = s.aktivePruefung.fragenIds.map(id => byId[id]);
  const z = fr.filter(f => f.stoff === 'zusatzstoff');
  ok(s.aktivePruefung.klasse === k && fr.length === n && z.length === zus && z.every(f => f.klassen.includes(k)), `Klasse ${k}: ${n} Fragen, ${zus} eigener Zusatzstoff ohne Auffüllung (ist ${fr.length}/${z.length})`);
  if (k === 'C') await p.screenshot({ path: SS + '59-pruefung-klasse-c.png' });
  await p.evaluate(() => { const s = JSON.parse(localStorage.getItem('theorie-trainer:v1')); s.aktivePruefung = null; localStorage.setItem('theorie-trainer:v1', JSON.stringify(s)); });
}
await p.goto(URL + '#/pruefung'); await p.reload(); await p.waitForSelector('[data-art]');
await p.click('.segment [data-klasse="A"]'); await p.click('[data-art=ersterwerb]');
await p.goto(URL); await p.waitForSelector('.kacheln'); await p.click('[aria-label=Einstellungen]'); await p.waitForSelector('.klasse[data-klasse]');
for (const k of ['C', 'D', 'T', 'Mofa']) await p.click(`.klasse[data-klasse="${k}"]`);
ok(await p.locator('.klasse.an').count() === 2, 'Klassenwahl nach Phase-2-Test wieder A+B');
// Situationsgrafik (selbst erzeugt) mit Zusatzzeichen
await p.goto(URL + '#/frage/BSP-1.3-015'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.frage img >> nth=0', 'src')).includes('media/gen/'), 'Vorfahrtfrage mit erzeugter Situationsgrafik');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '31-vorfahrt-grafik.png' });
await p.goto(URL + '#/frage/BSP-1.3-046'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.frage img >> nth=0', 'src')).includes('media/gen/'), 'Abknickende Vorfahrt: Schilder in der Grafik');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '32-abknickende-vorfahrt.png' });
await p.goto(URL + '#/frage/BSP-2.4-007'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.frage img >> nth=0', 'src')).includes('signs/'), 'Zusatzstoff-B-Zeichenfrage mit Bild');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '33-zusatzstoff-zeichen.png' });
await p.goto(URL + '#/frage/BSP-2.8-020'); await p.waitForSelector('.frage');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '34-zusatzstoff-eignung.png' });
await p.goto(URL + '#/frage/BSP-1.3-088'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.frage img >> nth=0', 'src')).includes('media/gen/'), 'Runde-3-Vorfahrtgrafik (drei Fahrzeuge)');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '35-vorfahrt-drei-fahrzeuge.png' });
await p.goto(URL + '#/frage/BSP-1.3-077'); await p.waitForSelector('.frage');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '36-kreisverkehr-einfahren.png' });
await p.goto(URL + '#/frage/BSP-1.1-062'); await p.waitForSelector('.frage');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '37-gefahrenlehre-grundstoff.png' });
await p.goto(URL + '#/frage/BSP-1.5-017'); await p.waitForSelector('.frage');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '38-umweltschutz-grundstoff.png' });
await p.goto(URL + '#/frage/BSP-1.4-150'); await p.waitForSelector('.frage');
ok((await p.locator('.frage img').count()) >= 2, 'Runde-4-Zeichenfrage mit Hauptzeichen + Zusatzzeichen');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '39-zusatzzeichen-kombination.png' });
await p.goto(URL + '#/frage/BSP-2.4-024'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.frage img >> nth=0', 'src')).includes('signs/'), 'Zusatzstoff 2.4 Überleitungstafel mit Bild');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '40-zusatzstoff-ueberleitungstafel.png' });
await p.goto(URL + '#/frage/BSP-2.5-021'); await p.waitForSelector('.frage');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '41-zusatzstoff-umwelt.png' });
await p.goto(URL + '#/frage/BSP-1.4-069'); await p.waitForSelector('.frage');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '42-bake-bahnuebergang.png' });


// Verkehrszeichen-Galerie
const signs = JSON.parse(readFileSync('public/signs/signs.json', 'utf8'));
await p.goto(URL + '#/zeichen'); await p.waitForSelector('.zeichen-kachel');
{ const gr = await p.locator('.zeichen-kachel').count();
  ok(gr < signs.schilder.length && gr >= 200, `Galerie gruppiert Varianten (${gr} Kacheln für ${signs.schilder.length} Zeichen)`); }
await p.check('[data-testid=einzeln]');
ok(await p.locator('.zeichen-kachel').count() === signs.schilder.length, `Galerie zeigt einzeln alle ${signs.schilder.length} Zeichen`);
await p.click('.filter-chips button:has-text("Gefahrzeichen")');
ok(await p.locator('.zeichen-kachel').count() === signs.schilder.filter(x => x.kategorie === 'Gefahrzeichen').length, 'Kategorie-Filter Gefahrzeichen');
await p.uncheck('[data-testid=einzeln]');
await p.click('.filter-chips button:has-text("Alle")');
await p.fill('.suchfeld', 'haltverbot');
ok(await p.locator('.zeichen-kachel').count() >= 2, 'Galerie-Suche nach Name');
await p.fill('.suchfeld', '');
await p.click('.filter-chips button:has-text("Vorschriftzeichen")');
await p.waitForTimeout(800);
await p.screenshot({ path: SS + '21-verkehrszeichen-galerie.png' });
await p.fill('.suchfeld', '206'); await p.click('.zeichen-kachel >> nth=0');
await p.waitForSelector('.lightbox-text');
ok((await p.textContent('.lightbox-text')).includes('Wikimedia Commons'), 'Zeichen-Detail mit Quelle');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '22-zeichen-detail.png' });
await p.keyboard.press('Escape');
// alle Zeichen-Bilder der Fragen erreichbar
const fragenBilder = [...new Set(kat.fragen.flatMap(f => [f.medien?.bild, ...(f.medien?.zusatzbilder ?? [])]).filter(Boolean))];
const st404 = await p.evaluate(async (l) => (await Promise.all(l.map(u => fetch('./' + u).then(r => r.ok ? null : u)))).filter(Boolean), fragenBilder);
ok(st404.length === 0, `Alle ${fragenBilder.length} Fragenbilder erreichbar ${st404.join(',')}`);
const kaputt = await p.evaluate(async (l) => { const bad = []; for (const u of l) { const t = await (await fetch('./' + u)).text(); if (!t.includes('<svg')) bad.push(u); } return bad; }, signs.schilder.map(x => x.datei));
ok(kaputt.length === 0, `Alle ${signs.schilder.length} Zeichen-Dateien sind gültige SVGs ${kaputt.slice(0, 5).join(',')}`);
// Zeichenfrage (Zusatzzeichen) im Lernmodus
await p.goto(URL + '#/lernen/1.4'); await p.waitForSelector('.frage');
for (let i = 0; i < 60 && !(await p.locator('.bild-stapel img.zusatz').count()); i++) await p.keyboard.press('ArrowRight');
ok(await p.locator('.bild-stapel img.zusatz').count() >= 1, 'Zeichenfrage mit Haupt- und Zusatzzeichen');
await p.click('.antwort >> nth=0'); await p.click('text=Antwort prüfen'); await p.click('[aria-label="Erklärung anzeigen"]');
await p.waitForTimeout(500); await p.screenshot({ path: SS + '23-zeichenfrage.png' });
// Suche findet Zeichen + Fragen
await p.goto(URL + '#/suche'); await p.fill('.suchfeld', 'überholverbot');
await p.waitForSelector('.such-abschnitt .zeichen-kachel');
ok(await p.locator('.such-abschnitt .zeichen-kachel').count() >= 1 && await p.locator('.liste-einfach .zeile').count() >= 1, 'Suche liefert Zeichen und Fragen');
await p.waitForTimeout(500); await p.screenshot({ path: SS + '24-suche-mit-zeichen.png' });
// Quellen
await p.goto(URL + '#/quellen'); await p.waitForSelector('text=gemeinfrei');
ok(await p.locator('a[href*="commons.wikimedia.org"]').count() >= 1, 'Quellen-Seite mit Commons-Link');
await p.waitForTimeout(300); await p.screenshot({ path: SS + '25-quellen.png' });
// Phase 4: Impressum und Datenschutz (Vorlagen), keine externen Anfragen
await p.click('button.link:has-text("Datenschutzerklärung")'); await p.waitForSelector('[data-testid=datenschutz]');
{ const txt = await p.textContent('[data-testid=datenschutz]');
  ok(txt.includes('Keine Cookies') && txt.includes('theorie-trainer:v1') && txt.includes('§ 25 Abs. 2 Nr. 2 TDDDG') && await p.locator('[data-testid=vorlage-hinweis]').isVisible() && await p.locator('.platzhalter').count() >= 4, 'Datenschutzerklärung als Vorlage mit Platzhaltern'); }
await p.screenshot({ path: SS + '80-datenschutz-vorlage.png', fullPage: true });
await p.goto(URL + '#/impressum'); await p.waitForSelector('[data-testid=impressum]');
ok((await p.textContent('[data-testid=impressum]')).includes('§ 5 DDG') && await p.locator('.platzhalter').count() >= 3, 'Impressum als Vorlage mit Platzhaltern');
await p.screenshot({ path: SS + '81-impressum-vorlage.png', fullPage: true });
ok(fremd.size === 0, `Keine Anfragen an fremde Server (${fremd.size}${fremd.size ? ': ' + [...fremd].slice(0, 3).join(', ') : ''})`);

// ===== Phase 1: neue Funktionen =====
const zust = async () => p.evaluate(() => JSON.parse(localStorage.getItem('theorie-trainer:v1')));
const setZ = async (fn) => { await p.evaluate((src) => { const s = JSON.parse(localStorage.getItem('theorie-trainer:v1')); new Function('s', src)(s); localStorage.setItem('theorie-trainer:v1', JSON.stringify(s)); }, fn); };
// Bildauswahl
await p.goto(URL + '#/ueben/bildauswahl'); await p.waitForSelector('.bild-antwort');
{ const id = await p.getAttribute('.frage', 'data-frage'); const f = byId[id];
  ok(f.typ === 'bildauswahl' && await p.locator('.bild-antwort').count() === f.antworten.length, 'Bildauswahl: Abbildungen als Antwortoptionen');
  ok(await p.locator('.bild-beschr').count() === 0 && /^Abbildung A( |$)/.test(await p.getAttribute('.bild-antwort >> nth=0', 'aria-label')), 'Bildauswahl: Beschriftung erst nach Auflösen, neutrales aria-label');
  for (const i of richtig(f)) await p.click(`.bild-antwort >> nth=${i}`);
  await p.screenshot({ path: SS + '43-bildauswahl.png' });
  await p.click('text=Antwort prüfen');
  ok(await p.locator('.feedback.ok').isVisible() && await p.locator('.bild-beschr').count() === f.antworten.length, 'Bildauswahl: richtig ausgewertet, Beschriftungen sichtbar');
  await p.waitForTimeout(300); await p.screenshot({ path: SS + '44-bildauswahl-aufgeloest.png', fullPage: true }); }
// Eigene Zeichnung in einer Frage
await p.goto(URL + '#/suche'); await p.fill('.suchfeld', 'Polizeibeamter hebt einen Arm');
await p.waitForSelector('.liste-einfach .zeile'); await p.click('.liste-einfach .zeile >> nth=0'); await p.waitForSelector('.frage');
ok((await p.getAttribute('.bild-stapel img >> nth=0', 'src')).includes('signs/eigen/'), 'Frage mit eigener Zeichnung (Polizeizeichen)');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '45-frage-eigene-zeichnung.png' });
// Filmfrage im Lernmodus: Sperre bis zum Ansehen
await p.goto(URL + '#/ueben/filme'); await p.waitForSelector('.film-start');
ok(await p.locator('.film-sperre').isVisible() && await p.locator('.antwort >> nth=0').isDisabled(), 'Filmfrage: Antworten gesperrt bis Szene gesehen');
await p.screenshot({ path: SS + '46-filmfrage-poster.png' });
await p.click('.film-start'); await p.waitForTimeout(1200);
await p.screenshot({ path: SS + '47-filmfrage-laeuft.png' });
await p.waitForSelector('.film-ende', { timeout: 20000 });
ok(await p.locator('.film-sperre').count() === 0 && !(await p.locator('.antwort >> nth=0').isDisabled()), 'Filmfrage: nach dem Ansehen beantwortbar');
ok(await p.locator('.film-zeit').count() === 1, 'Lernmodus: Szene spulbar');
await p.click('.antwort >> nth=0'); await p.click('text=Antwort prüfen'); await p.waitForTimeout(300);
await p.screenshot({ path: SS + '48-filmfrage-ende.png', fullPage: true });
// Abspiellimit in der Prüfung
await p.goto(URL + '#/einstellungen'); await p.selectOption('[data-testid=filmmax]', '2');
await setZ('s.aktivePruefung = null');
await p.goto(URL + '#/pruefung'); await p.reload(); await p.waitForSelector('[data-testid=filmregel]');
ok((await p.textContent('[data-testid=filmregel]')).includes('2'), 'Prüfungsstart nennt Filmregel (2×)');
await p.click('text=Prüfung starten'); await p.waitForSelector('.pruef-nav');
{ const ap = (await zust()).aktivePruefung; const fi = ap.fragenIds.map(id => byId[id]);
  const nFilm = fi.filter(f => f.medien?.film).length;
  ok(nFilm === 3 && fi.filter(f => f.medien?.film).every(f => f.stoff === 'grundstoff'), `Prüfung enthält 3 Filmfragen im Grundstoff (ist ${nFilm})`);
  ok(fi.reduce((a, f) => a + f.punkte, 0) === 110, 'Punktsumme mit Filmfragen weiterhin 110');
  const i = fi.findIndex(f => f.medien?.film);
  await p.click(`.nr >> nth=${i}`); await p.waitForSelector('.film-start');
  ok((await p.textContent('[data-testid=film-rest]')).includes('2'), 'Prüfung: noch 2× abspielbar');
  ok(await p.locator('.film-zeit').count() === 0, 'Prüfung: kein Spulen');
  await p.click('.film-start'); await p.waitForTimeout(500);
  ok(await p.locator('button[aria-label=Pause]').count() === 0, 'Prüfung: kein Pausieren');
  await p.waitForSelector('.film-ende', { timeout: 20000 });
  await p.click('button[aria-label="Von vorn abspielen"]'); await p.waitForSelector('.film-ende', { timeout: 20000 });
  ok((await p.textContent('[data-testid=film-rest]')).includes('0') && await p.locator('button[aria-label="Von vorn abspielen"]').isDisabled(), 'Prüfung: Abspiellimit erreicht, Nochmal gesperrt');
  ok(((await zust()).aktivePruefung.filmAbgespielt[fi[i].id]) === 2, 'Abspielzähler gespeichert');
  await p.screenshot({ path: SS + '49-pruefung-filmfrage-limit.png' }); }
await setZ('s.aktivePruefung = null; s.einstellungen.filmMax = 5');
// Notizen
await p.goto(URL + '#/lernen/1.2'); await p.waitForSelector('.frage');
{ const id = await p.getAttribute('.frage', 'data-frage');
  await p.click('[aria-label=Notiz]'); await p.fill('.notiz textarea', 'Merke: Test-Notiz aus e2e'); await p.waitForTimeout(700);
  ok((await zust()).notizen[id] === 'Merke: Test-Notiz aus e2e', 'Notiz wird gespeichert');
  await p.screenshot({ path: SS + '50-notiz.png' });
  await p.goto(URL + '#/ueben/notizen'); await p.waitForSelector('.frage');
  ok(await p.getAttribute('.frage', 'data-frage') === id, 'Übungsmodus „Meine Notizen“'); }
// Variationen-Schalter
await p.goto(URL + '#/einstellungen'); await p.uncheck('[data-testid=variationen]');
ok((await zust()).einstellungen.variationen === false, 'Variationen abschaltbar');
await p.goto(URL + '#/lernen'); await p.waitForSelector('.zeile'); await p.click('[data-kapitel="1.1"]'); await p.waitForSelector('.frage');
{ let varGesehen = false; for (let i = 0; i < 40; i++) { const id = await p.getAttribute('.frage', 'data-frage'); if (byId[id].variante > 0) varGesehen = true; await p.keyboard.press('ArrowRight'); }
  ok(!varGesehen, 'Ohne Variationen erscheinen keine Variationen'); }
await setZ('s.einstellungen.variationen = true');
// Lernplan, Tagesziel, Serie
await setZ(`const d = n => { const x = new Date(); x.setDate(x.getDate() - n); return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }; s.tage = s.tage || {}; for (const n of [0, 1, 2]) s.tage[d(n)] = Math.max(s.tage[d(n)] || 0, 40);`);
await p.goto(URL + '#/'); await p.reload(); await p.waitForSelector('.tagesziel');
ok((await p.textContent('.serie')).includes('3'), 'Lernserie 3 Tage');
await p.goto(URL + '#/lernplan'); await p.waitForSelector('[data-testid=termin]');
{ const x = new Date(); x.setDate(x.getDate() + 21); await p.fill('[data-testid=termin]', x.toISOString().slice(0, 10)); }
await p.waitForTimeout(300);
ok((await p.textContent('[data-testid=lp-plan]')).length > 20 && await p.locator('[data-testid=reife]').isVisible(), 'Lernplan mit Termin und Prüfungsreife');
await p.screenshot({ path: SS + '51-lernplan.png', fullPage: true });
// Tastenkürzel-Hilfe
await p.goto(URL + '#/'); await p.waitForSelector('.kacheln'); await p.keyboard.press('Shift+Slash');
ok(await p.locator('.tasten-hilfe').isVisible(), 'Tastenkürzel-Hilfe mit „?“');
await p.screenshot({ path: SS + '52-tastenkuerzel.png' });
await p.keyboard.press('Escape'); await p.waitForTimeout(200);
if (await p.locator('.tasten-hilfe').count()) await p.click('.tasten-hilfe >> text=Schließen');
// Tastatur im Lernmodus
await p.goto(URL + '#/lernen/1.3'); await p.waitForSelector('.frage');
await p.keyboard.press('1'); ok(await p.locator('.antwort[aria-pressed=true]').count() === 1, 'Taste 1 wählt Antwort A');
await p.keyboard.press('Enter'); await p.waitForTimeout(200); ok(await p.locator('.feedback').count() === 1, 'Enter prüft die Antwort');
// Varianten-Wähler im Zeichen-Detail
await p.goto(URL + '#/zeichen'); await p.waitForSelector('.zeichen-kachel'); await p.fill('.suchfeld', '274');
await p.click('.zeichen-kachel:has(.varianten-badge) >> nth=0'); await p.waitForSelector('[data-testid=schild-name]');
{ const n1 = await p.textContent('[data-testid=schild-name]'); await p.click('.varianten [role=radio] >> nth=3'); await p.waitForTimeout(300);
  ok(n1 !== await p.textContent('[data-testid=schild-name]'), 'Varianten-Wähler wechselt das Zeichen');
  await p.screenshot({ path: SS + '53-varianten-waehler.png' }); }
await p.keyboard.press('Escape');
await p.goto(URL + '#/zeichen'); await p.waitForSelector('.suchfeld'); await p.fill('.suchfeld', ''); await p.click('.filter-chips button:has-text("Lichtzeichen")'); await p.waitForTimeout(600);
ok(await p.locator('.eigen-badge').count() >= 3, 'Eigene Lichtzeichen-Zeichnungen in der Galerie (gruppiert)');
await p.check('[data-testid=einzeln]'); ok(await p.locator('.eigen-badge').count() === signs.schilder.filter(x => x.kategorie === 'Lichtzeichen').length, 'Lichtzeichen einzeln: alle eigenen Zeichnungen'); await p.uncheck('[data-testid=einzeln]');
await p.screenshot({ path: SS + '54-galerie-eigene-lichtzeichen.png' });
// Filme-Übersicht
await p.goto(URL + '#/filme'); await p.waitForSelector('.film-liste'); await p.click('text=Szene laden >> nth=13'); await p.waitForSelector('.film-start');
await p.screenshot({ path: SS + '55-filme-uebersicht.png' });
// Offline-Vorladen
await p.goto(URL + '#/einstellungen'); await p.click('[data-testid=offline-btn]');
await p.waitForFunction(() => /Fertig/.test(document.querySelector('[data-testid=offline-stand]')?.textContent || ''), null, { timeout: 90000 }).catch(() => {});
{ const tx = await p.textContent('[data-testid=offline-stand]').catch(() => '');
  ok(/Fertig: (\d+) von \1 Dateien gespeichert\.$/.test(tx || ''), 'Offline: alle Medien gespeichert (' + tx + ')'); }
await p.screenshot({ path: SS + '56-offline.png' });
// Hoher Kontrast
await p.check('[data-testid=kontrast]');
ok(await p.evaluate(() => document.documentElement.classList.contains('kontrast')), 'Hoher Kontrast aktivierbar');
await p.goto(URL + '#/lernen/1.4'); await p.waitForSelector('.frage'); await p.waitForTimeout(300);
await p.screenshot({ path: SS + '57-hoher-kontrast.png' });
await setZ('s.einstellungen.kontrast = false'); await p.reload();

// Dark Mode manuell
await p.goto(URL + '#/einstellungen'); await p.click('.segment button:has-text("Dunkel")');
ok(await p.evaluate(() => document.documentElement.dataset.theme) === 'dunkel', 'Dark Mode manuell');
await p.goto(URL + '#/'); await p.waitForSelector('.kacheln');
await p.screenshot({ path: SS + '15-dark-startseite.png' });
await p.goto(URL + '#/lernen/1.4'); await p.waitForSelector('.frage');
await p.click('.antwort >> nth=0'); await p.click('text=Antwort prüfen'); await p.click('[aria-label="Erklärung anzeigen"]');
await p.waitForTimeout(400); await p.screenshot({ path: SS + '16-dark-lernmodus.png' });
await ctx.close();

// Dark Mode automatisch (Systemeinstellung)
const ctxD = await b.newContext({ viewport: { width: 1280, height: 860 }, colorScheme: 'dark' });
const pd = await ctxD.newPage(); await pd.goto(URL); await pd.waitForSelector('.kacheln');
ok(await pd.evaluate(() => document.documentElement.dataset.theme) === 'dunkel', 'Dark Mode automatisch nach System');
await ctxD.close();

// Mobil 390x844
const m = await b.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, locale: 'de-DE' });
const mp = await m.newPage(); mp.on('pageerror', e => fehler.push('pageerror mobil: ' + e.message));
await mp.goto(URL); await mp.waitForSelector('.kacheln');
await mp.screenshot({ path: SS + '17-mobil-startseite.png' });
await mp.goto(URL + '#/lernen/1.3'); await mp.waitForSelector('.frage');
await mp.tap('.antwort >> nth=0');
await mp.screenshot({ path: SS + '18-mobil-lernmodus.png' });
const cdp = await m.newCDPSession(mp);
const swipe = async (x1, x2) => {
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: x1, y: 400 }] });
  for (let i = 1; i <= 5; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x1 + (x2 - x1) * i / 5, y: 402 }] });
  await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  await mp.waitForTimeout(300);
};
await swipe(320, 80);
ok((await mp.textContent('.topbar small')).includes('Frage 2'), 'Wischen nach links => nächste Frage');
await swipe(80, 320);
ok((await mp.textContent('.topbar small')).includes('Frage 1'), 'Wischen nach rechts => vorige Frage');
await mp.goto(URL + '#/pruefung'); await mp.waitForSelector('button:has-text("Prüfung starten")'); await mp.waitForTimeout(300); await mp.click('button:has-text("Prüfung starten")'); await mp.waitForSelector('.pruef-nav');
await mp.screenshot({ path: SS + '19-mobil-pruefung.png' });
await mp.goto(URL + '#/zeichen'); await mp.waitForSelector('.zeichen-kachel'); await mp.waitForTimeout(800);
await mp.screenshot({ path: SS + '26-mobil-galerie.png' });
await mp.click('.zeichen-kachel >> nth=3'); await mp.waitForSelector('.lightbox-text'); await mp.waitForTimeout(300);
await mp.screenshot({ path: SS + '27-mobil-zeichen-detail.png' });
await mp.goto(URL + '#/frage/BSP-4-079'); await mp.waitForSelector('.frage'); await mp.waitForTimeout(500);
await mp.screenshot({ path: SS + '28-mobil-zeichenfrage.png' });
await mp.setViewportSize({ width: 844, height: 390 });
await mp.goto(URL + '#/frage/BSP-1.3-008'); await mp.waitForSelector('.frage');
await mp.screenshot({ path: SS + '20-mobil-querformat.png' });
// PWA
const man = await mp.evaluate(async () => (await fetch('./manifest.webmanifest')).json());
ok(man.display === 'standalone' && man.icons.length >= 2, 'Manifest vorhanden');
await mp.goto(URL); await mp.waitForTimeout(1500);
ok(await mp.evaluate(async () => !!(await navigator.serviceWorker.getRegistration())), 'Service Worker registriert');
await m.close(); await b.close();
console.log(fehler.length ? '\nFEHLER:\n' + fehler.join('\n') : '\nAlle Prüfungen bestanden.');
process.exit(fehler.length ? 1 : 0);
