// Prüft, ob alle Seiten nach dem ersten Besuch offline (nach Reload) funktionieren. Aufruf: U=http://localhost:4173/ node scripts/offline-check.mjs
import { chromium } from 'playwright';
const U = process.env.U || 'http://localhost:4173/';
const b = await chromium.launch({ executablePath: '/usr/bin/google-chrome' });
const ctx = await b.newContext({ viewport: { width: 412, height: 915 } }); const p = await ctx.newPage();
await p.goto(U); await p.waitForSelector('.gruss'); await p.evaluate(() => navigator.serviceWorker.ready); await p.reload(); await p.waitForSelector('.gruss');
await p.waitForFunction(async () => { const k = await caches.keys(); if (!k.length) return false; return (await (await caches.open(k[0])).keys()).length >= 60; }, null, { timeout: 30000 });
await ctx.setOffline(true); let ok = 0, n = 0;
for (const [h, sel] of [['', '.gruss'], ['#/frage/BSP-2.1-140', '.film-steuerung'], ['#/frage/BSP-2.4-076', '.frage-inhalt'], ['#/statistik', 'main'], ['#/lernplan', 'main'], ['#/suche', 'main'], ['#/einstellungen', '[data-testid=name-eingabe]'], ['#/datenschutz', '[data-testid=datenschutz]']]) {
  n++; await p.goto(U + h); await p.reload();
  try { await p.waitForSelector(sel, { timeout: 8000 }); ok++; } catch { console.log('offline FEHLT', h); }
}
await p.goto(U + '#/pruefung'); await p.reload(); n++;
try { await p.click('text=Prüfung starten', { timeout: 8000 }); await p.waitForSelector('.pruef-nav', { timeout: 8000 }); ok++; } catch { console.log('offline Prüfung FEHLT'); }
console.log(`offline: ${ok}/${n} Seiten ok`); await b.close(); process.exit(ok === n ? 0 : 1);
