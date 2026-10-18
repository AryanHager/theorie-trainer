# Phase 4 – Performance & Veröffentlichungsreife

## Lighthouse (mobil, Simulated Throttling, lokal)

| Seite | vorher (Phase 3, vite preview) | nachher (serve.mjs, Brotli) |
|---|---|---|
| Start | 85 · LCP 3,2 s · TBT 340 ms | **100** · LCP 1,5 s · TBT 0 ms · CLS 0,01 |
| Filmfrage (BSP-2.1-140) | 88 · LCP 3,2 s · CLS 0,126 | **99** · LCP 2,0 s · CLS 0 |
| Bildauswahl (BSP-2.4-076) | 92 · LCP 3,3 s | **99** · LCP 2,0 s |
| Statistik | 92 · LCP 3,3 s | **99** · LCP 1,8 s |

Zwischenmessung mit unkomprimiertem `vite preview`: 96 / 99 / 99 / 99.
Je drei Läufe, Werte stabil. Barrierefreiheit und Best Practices 100, SEO 100.
Berichte: `docs/lh-p3-*.json` (vorher), `docs/lighthouse-p4-*.json` (nachher).

## Maßnahmen

- Fragenkatalog geteilt: `data/index.json` (Metadaten, 81 KB / ca. 8 KB Brotli) wird sofort geladen und vorab
  per `<link rel="preload">` angefordert; vollständige Fragen kommen bei Bedarf aus 38 Teilen
  `data/teile/<kapitel>-<n>.<hash>.json` (max. 60 Fragen, unveränderlich cachebar).
- Prüfungsreife-Simulation im Web Worker → Start ohne blockierenden Hauptthread (TBT 340 → 0 ms).
- Seltener genutzte Seiten (Lernsitzung, Kapitel, Prüfung, Rechtliches …) per `lazy()` nachgeladen.
- CSS in `index.html` eingebettet (kein render-blockierender Request).
- Verkehrszeichen mit svgo optimiert (Pixelvergleich: 840 Dateien, max. 0,75 % Kantenglättungs-Abweichung).
- Bildfragen: `fetchpriority="high"` für das LCP-Bild.
- Platzhalter der Filmszene reserviert exakt die Höhe des Players (CLS 0,126 → 0).
- Vorkomprimierung `.br`/`.gz` beim Build; 7,3 MB → 1,9 MB (Brotli).
- Service Worker v10: Index + Teile werden für Offline-Nutzung vorab gespeichert.

## Datenschutz/Technik

- Keine externen Anfragen (E2E-Test protokolliert jede Anfrage; 0 fremde Hosts).
  Externe URLs im Build sind nur `xmlns`-Angaben (w3.org), Quellen-Links zu Wikimedia Commons
  (nur bei Klick), React-Fehlerhinweise (react.dev, nur Text) und `$schema`-Angaben.
- Keine Cookies, kein Tracking, Systemschriften (`system-ui`).
- Vorlesen bevorzugt lokale Stimmen (`localService`).
