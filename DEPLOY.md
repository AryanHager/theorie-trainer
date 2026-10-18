# Veröffentlichen (Deploy) – Kurzanleitung

Die App ist eine rein statische PWA (Hash-Routing, keine Server-Logik, keine Datenbank).
Ausgeliefert wird der Ordner `dist/`. **Noch nichts ist veröffentlicht.**

## 1. Vorher erledigen (Pflicht)

1. **Anbieterdaten eintragen** in `src/anbieter.ts` (Name, ladungsfähige Anschrift, E-Mail, Hoster,
   Speicherdauer der Server-Logs, Stand). Danach muss `npm run vorlage-check` ohne Fehler durchlaufen –
   solange Felder fehlen, zeigen Impressum und Datenschutzerklärung den Hinweis „Vorlage“.
2. **Rechtliche Prüfung** von Impressum (§ 5 DDG, ggf. § 18 Abs. 2 MStV) und Datenschutzerklärung
   durch eine fachkundige Stelle. Die Texte sind Vorlagen, keine Rechtsberatung.
3. **Auftragsverarbeitungsvertrag** (Art. 28 DSGVO) mit dem Hoster abschließen; Log-Dauer des Hosters
   in `src/anbieter.ts` übernehmen.
4. **Fachliche Durchsicht** der Beispielfragen durch eine Fahrlehrerin / einen Fahrlehrer
   (siehe `docs/`).
5. Domain wählen; HTTPS ist Pflicht (Service Worker läuft nur über HTTPS).

## 2. Bauen und lokal prüfen

```bash
npm ci
npm run katalog        # nur nötig, wenn Fragen/Zeichen geändert wurden
npm run build          # tsc + Vite + Vorkomprimierung (.br/.gz)
node scripts/pruefung-check.mjs
npm run preview        # http://localhost:4173 mit Produktions-Headern (scripts/serve.mjs)
node scripts/e2e.mjs   # End-to-End-Tests gegen die Vorschau
```

Bei jeder inhaltlichen Änderung `CACHE` in `public/sw.js` hochzählen, damit Nutzer die neue Version erhalten.

## 3. Hosting-Varianten

| Variante | Dateien | Vorgehen |
|---|---|---|
| Docker + nginx (eigener Server, Railway, Fly …) | `Dockerfile`, `deploy/nginx.conf`, `.dockerignore` | `docker build -t theorie-trainer .` → `docker run -p 8080:8080 theorie-trainer` |
| Railway | `railway.json` (nutzt das Dockerfile) | Projekt aus dem Repo anlegen; Port **8080** als Ziel-Port einstellen |
| Netlify | `netlify.toml`, `public/_headers` | Repo verbinden oder `dist/` hochladen; Build `npm run build`, Ordner `dist` |
| Cloudflare Pages | `public/_headers` | Build-Befehl `npm run build`, Ausgabeordner `dist`, Node 22 |

Alle Varianten setzen dieselben Header wie `scripts/serve.mjs`: strikte Content-Security-Policy
(nur eigene Herkunft), `nosniff`, `Referrer-Policy: no-referrer`, `X-Frame-Options: DENY`,
Permissions-Policy; Caching: `/assets/*` und `/data/teile/*` 1 Jahr `immutable` (Dateinamen mit Hash),
HTML/JSON/`sw.js`/Manifest `no-cache`.

Hinweis nginx: Das Standard-Image liefert die vorkomprimierten `.gz`-Dateien aus (`gzip_static`);
`.br` wird nur mit Brotli-Modul genutzt. Netlify und Cloudflare komprimieren selbst.
`access_log` ist in `deploy/nginx.conf` abgeschaltet – wird es aktiviert, Speicherdauer in der
Datenschutzerklärung angeben.

## 3a. GitHub Pages

- Workflow `.github/workflows/pages.yml`: bei jedem Push auf `main` werden `npm ci`, `npm run katalog`,
  `npm run build` und `pruefung-check` ausgeführt und `dist/` per `actions/deploy-pages` veröffentlicht.
  Einmalig: Repository → Settings → Pages → Source „GitHub Actions“
  (`gh api -X POST repos/<owner>/<repo>/pages -f build_type=workflow`).
- Die App nutzt relative Pfade (`base: './'`) und Hash-Routing; sie läuft daher unverändert unter
  `https://<owner>.github.io/<repo>/`. Service Worker, Manifest (`start_url`/`scope` = `./`) und Offline-Liste
  sind relativ.
- Pages kann keine HTTP-Header setzen. Deshalb steht die CSP zusätzlich als `<meta http-equiv>` in
  `index.html` (ohne `frame-ancestors`, das per Meta nicht wirkt – Einbetten in fremde Seiten ist auf Pages
  also nicht unterbunden); Referrer-Policy als `<meta name="referrer">`. `nosniff`, `X-Frame-Options`,
  `Permissions-Policy` und die eigenen Cache-Regeln entfallen auf Pages (Pages cacht 10 Minuten).
- **Indexierung:** Solange `npm run vorlage-check` offene Felder meldet, enthält der Build automatisch
  `<meta name="robots" content="noindex, nofollow">` und eine `robots.txt` mit `Disallow: /`.
  Sobald `src/anbieter.ts` ausgefüllt ist, fallen beide beim nächsten Build automatisch weg
  (Steuerung im Vite-Plugin `statischesHosting` in `vite.config.ts`). Hinweis: Unter `*.github.io/<repo>/`
  liegt die `robots.txt` nicht im Wurzelverzeichnis der Domain und wird von Suchmaschinen ignoriert –
  wirksam ist dort das `noindex`-Meta-Tag.
- Hosting-Anbieter für die Datenschutzerklärung: GitHub Inc. bzw. GitHub B.V. (Server-Logs durch GitHub;
  Speicherdauer laut GitHub-Datenschutzerklärung) – bitte prüfen und in `src/anbieter.ts` eintragen.
- Der Service Worker löscht nur Caches mit Präfix `theorie-trainer-`, weil sich alle Projekte unter
  `<owner>.github.io` denselben Origin (und denselben localStorage) teilen.

## 4. Datenschutz-Eigenschaften (geprüft per E2E-Test)

- Keine Anfragen an fremde Server (E2E-Check „Keine Anfragen an fremde Server“), keine CDNs,
  keine externen Schriften, keine Cookies, kein Tracking.
- Lernstand nur lokal (localStorage, sessionStorage, Cache Storage).
- Einzige externe Verweise: Quellen-Links zu Wikimedia Commons (nur bei Klick).
