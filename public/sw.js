// Service Worker: App-Shell offline, Fragen-Index „network first“, Katalogteile (Hash im Namen) und Medien „cache first“.
// Auf Wunsch lädt er alle Medien vorab (Nachricht {typ:'vorladen'}), mit Fortschrittsmeldungen.
// Nur eigene Caches löschen: unter *.github.io teilen sich mehrere Projekte denselben Origin.
const CACHE = 'theorie-trainer-v12';
// Programmteile (JS-Chunks, Worker) – die Liste wird beim Build eingesetzt (Vite-Plugin swProgrammteile)
const ASSETS = [/*ASSETS*/];
const SHELL = ['./', './index.html', './data/index.json', './data/filme.json', './manifest.webmanifest', './icons/icon.svg'];
// Beim Installieren zusätzlich alle Katalogteile (data/teile/…) laden, damit Lernen und Prüfung offline funktionieren.
self.addEventListener('install', e => {
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(async c => {
    await c.addAll(SHELL);
    await c.addAll(ASSETS.map(a => './' + a));
    try { const ix = await (await c.match('./data/index.json')).json(); await c.addAll(ix.teile.map(n => './data/teile/' + n)); } catch { /* Teile werden sonst bei Bedarf geladen */ }
  }));
});
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(k => Promise.all(k.filter(x => x.startsWith('theorie-trainer-') && x !== CACHE).map(x => caches.delete(x)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  const req = e.request; if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  const netzZuerst = req.mode === 'navigate' || (req.url.includes('/data/') && !req.url.includes('/data/teile/')) || req.url.endsWith('signs.json');
  const ausNetz = () => fetch(req).then(r => { if (r.ok) { const c = r.clone(); caches.open(CACHE).then(x => x.put(req, c)); } return r; });
  e.respondWith(netzZuerst ? ausNetz().catch(() => caches.match(req).then(r => r || caches.match('./index.html'))) : caches.match(req).then(r => r || ausNetz()));
});
self.addEventListener('message', e => {
  const d = e.data || {};
  if (d.typ === 'status') {
    e.waitUntil((async () => { const c = await caches.open(CACHE); const k = await c.keys(); e.source?.postMessage({ typ: 'status', anzahl: k.length }); })());
  }
  if (d.typ !== 'vorladen' || !Array.isArray(d.dateien)) return;
  e.waitUntil((async () => {
    const c = await caches.open(CACHE);
    let fertig = 0, fehler = 0; const gesamt = d.dateien.length;
    const melde = () => e.source?.postMessage({ typ: 'fortschritt', fertig, fehler, gesamt });
    const warte = [...d.dateien];
    const arbeiter = async () => {
      while (warte.length) {
        const url = new URL(warte.shift(), self.registration.scope).href;
        try { if (!(await c.match(url))) { const r = await fetch(url); if (r.ok) await c.put(url, r); else fehler++; } } catch { fehler++; }
        fertig++; if (fertig % 20 === 0 || fertig === gesamt) melde();
      }
    };
    await Promise.all(Array.from({ length: 6 }, arbeiter));
    e.source?.postMessage({ typ: 'fertig', fertig, fehler, gesamt });
  })());
});
