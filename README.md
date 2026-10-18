# Theorie-Trainer (Arbeitstitel)

Web-App (PWA) zum Lernen der Führerschein-Theorie. Statisch, kein Backend, Daten lokal im Browser (localStorage).

## Starten
    npm install
    npm run dev        # Entwicklung (Port 5173)
    npm run build      # Produktions-Build nach dist/
    npm run preview -- --port 4173   # Build lokal ausliefern
    node scripts/e2e.mjs             # Playwright-Test + Screenshots (Preview muss laufen)

## Fragenkatalog austauschen
- `public/data/fragen.json` – vollständiger Katalog (Quelle für Validator, Prüfungs-Check und Tests; Schema: `public/data/fragen.schema.json`). Die App lädt ihn nicht direkt, sondern `public/data/index.json` (Metadaten aller Fragen, ~80 KB) und bei Bedarf die Teile `public/data/teile/*.json` (je ≤ 60 Fragen, Hash im Namen). Beides erzeugt `scripts/split-katalog.mjs` am Ende von `npm run katalog`.
- Aktuell: **Beispielfragen** (`npm run katalog` erzeugt und prüft sie), eigene Formulierungen auf Basis von StVO/FeV, keine amtlichen Fragen.
- Felder pro Frage: `id`, `mutterfrageId`, `variante`, `kapitel`, `stoff` (grundstoff/zusatzstoff), `klassen`, `punkte` (2–5),
  `typ` (auswahl/zahl), `antworten[]` bzw. `zahl{wert,einheit,toleranz}`, `erklaerung`, `medien{bild,bildAlt,video,poster}`, `beispiel`.
- Prüfungsparameter je Klasse in `meta.pruefung` (Dauer, Anzahl Grund-/Zusatzstoff, maxFehlerpunkte).
- Bilder/Videos: `public/media/` (Pfade relativ) oder absolute URLs.


## Fragen schreiben (content/*.txt)

`npm run katalog` = `node scripts/build-katalog.mjs` (erzeugt `public/data/fragen.json` und `public/media/gen/*.svg`) + `node scripts/validate.mjs` (Schema, eindeutige IDs, ≥ 1 richtige Antwort, Medienpfade, Beinahe-Duplikate, Verteilungsbericht). `node scripts/pruefung-check.mjs` testet die Prüfungsziehung für alle Klassen.

Kapitelstruktur nach den Sachgebieten der FeV Anlage 7: 1.1–1.5 Grundstoff, 2.1–2.8 Zusatzstoff. Prüfungsregeln je Klasse (Ersterwerb/Erweiterung) stehen in `meta.pruefung` (Quelle: FeV Anlage 7 Nr. 1.2.2; nicht amtlich belegte Werte sind in `unsicher` markiert).

Blöcke werden durch Leerzeilen getrennt:

```
@kapitel 1.3          // Vorgabe für folgende Blöcke (auch @klassen, @punkte)
@klassen ALLE         // Gruppen: ALLE, MOT (ohne Mofa), KRAD (A1,A2,A), ZWEIRAD (AM+KRAD) oder einzelne Klassen
? Fragetext
+ richtige Antwort
- falsche Antwort
= Erklärung
N 50 km/h             // statt +/-: Zahlenfrage
# zeichen 205 1000-10 // amtliches Zeichen (+ Zusatzzeichen) aus public/signs
# zusatz 306          // nur Zusatzbilder
# grafik kreuzung S=blau>links* N=rot>gerade ampel=S   // selbst erzeugte Situationsgrafik (scripts/svg-gen.mjs)
# grafik kreuzung S=blau>gerade* N=rot>rechts schild=S:205/NW,N:306   // Schilder direkt an der Zufahrt (Arm:Nr, optional /Arme der Vorfahrtstraße als Zusatztafel 1002); verfügbar: 102 205 206 215 301 306
! punkte=5 klassen=B zahl kapitel=1.2 mutter=BSP-7-046
```

IDs (`BSP-<kapitel>-NNN`) werden je Kapitel in Dateireihenfolge vergeben – neue Fragen daher am Dateiende anfügen. Die Antwortreihenfolge wird beim Build je Frage stabil gemischt.

## Veröffentlichen

Siehe [DEPLOY.md](DEPLOY.md). Impressum (`#/impressum`) und Datenschutzerklärung (`#/datenschutz`) sind
Vorlagen; Anbieterdaten in `src/anbieter.ts` eintragen, `npm run vorlage-check` muss danach fehlerfrei sein.
Performance-Messungen: `docs/performance-phase4.md`.

## Rechtliche Hinweise zu den Inhalten

- Alle Fragen, Antworttexte, Erläuterungen und Animationen sind **eigene Werke** dieses Projekts.
  Es handelt sich um selbst formulierte Beispielfragen, **nicht** um die amtlichen Prüfungsfragen.
- Verkehrszeichen: amtliche Werke und damit gemeinfrei (§ 5 UrhG); Dateien von Wikimedia Commons
  (Public Domain), Nachweise in der App unter „Quellen“ und in `public/data/signs.json`.
- **Kein amtliches Angebot.** Keine Verbindung zu TÜV, DEKRA oder anderen Prüforganisationen.
