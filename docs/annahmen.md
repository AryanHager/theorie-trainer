# Annahmen und Designentscheidungen (Phase 1)

* **Filmfragen – Abspiellimit:** In der Prüfungssimulation darf eine Szene standardmäßig **5-mal** abgespielt werden (Einstellung „Filmfragen“, wählbar 1–10×; im Lernmodus unbegrenzt). ANNAHME – kein amtlicher Wert hinterlegt.
* **Filmfragen je Prüfung:** **3** Filmfragen im Grundstoff (`FILMFRAGEN_JE_PRUEFUNG`). ANNAHME. Sie werden beim Punkteausgleich nicht ausgetauscht.
* **Prüfungsmodus Film:** kein Pausieren, kein Spulen; Antworten erst nach vollständigem Ansehen (abschaltbar: „Erst ansehen, dann antworten“).
* **Bildauswahl – Barrierefreiheit:** Bildunterschriften werden erst nach dem Auflösen gezeigt, damit der Text die Lösung nicht verrät. Vor dem Auflösen heißen die Optionen für Screenreader neutral „Abbildung A … D“; die Lupe zeigt die Abbildung groß. Nach dem Auflösen werden die Namen vorgelesen. Bewusster Kompromiss zwischen Prüfungsrealismus und Zugänglichkeit.
* **Prüfungsreife:** Modell in `src/reife.ts` – Status-Startwerte (neu 0,45 · falsch 0,40 · einmal richtig 0,80 · sicher 0,95), kalibriert mit den eigenen Antworten (k = 12), Monte-Carlo über 120–160 simulierte Prüfungen mit der echten Ziehungslogik, gemischt mit dem Ergebnis der letzten ≤ 5 Simulationen (10 % je Prüfung, max. 40 %). Schätzwert, keine Garantie.
* **Lernplan:** Eine offene Frage braucht im Mittel ~2,5 Antworten, bis sie „sicher“ ist; die letzten 2 Tage vor dem Termin sind für Prüfungssimulationen reserviert. ANNAHME.
* **Variationen:** eigene Abwandlungen unserer eigenen Mutterfragen (gleiches Lernziel); sie erben Kapitel, Klassen und Punkte, ID-Schema `<Mutter-ID>-V<n>`. Mit dem Schalter „Variationen“ (Einstellungen / Kapitelansicht) lassen sie sich ausblenden.
* **Eigene Zeichnungen:** Markierungen 293–299, Grünpfeil 720 (inkl. Radverkehr und an der Ampel), Wechsel-/Dauerlichtzeichen und Polizeizeichen sind schematische eigene SVGs, als „Eigene Zeichnung (dieses Projekt)“ gekennzeichnet – keine amtlichen Abbildungen.
* **Inhalte:** alle Fragen, Erklärungen, Szenen und Grafiken sind eigene Formulierungen bzw. eigene Darstellungen auf Basis der Gesetzestexte; Verkehrszeichen-Grafiken stammen aus gemeinfreien Wikimedia-Commons-Dateien.

## Ergänzungen Phase 3

* **Filmbühne – Barrierefreiheit:** Die Rolle `img` mit Titel und Verweis auf die Textbeschreibung sitzt jetzt auf einem eigenen Bild-Container (`.film-bild`). Der Start-Knopf „Szene abspielen“ liegt daneben und bleibt so für Screenreader bedienbar; vorher lag er in einem Element mit `role="img"`.
* **Bildauswahl:** Die neutrale Benennung „Abbildung A … C“ vor dem Auflösen bleibt bewusst erhalten (siehe oben). Alle 91 Bildauswahlfragen haben für jede Option einen Beschreibungstext, der nach dem Auflösen vorgelesen wird.
* **Lernstatistik:** Sie lässt sich nach einer der gewählten Klassen und nach einem Thema filtern. Die Filter gelten nur für die Ansicht und werden nicht gespeichert. Prüfungsergebnisse werden nur nach Klasse gefiltert.
* **Mofa-Prüfung:** 15 Fragen Grundstoff und 5 Fragen Zusatzstoff nach Prüfungsrichtlinie Teil A Nr. 4.7. Die Bearbeitungszeit und die 5-Punkte-Regel sind weiter als „unsicher“ markiert.
* **Sachgebietsquoten:** Der Grundstoff wird je Sachgebiet (1.1 bis 1.5) nach Quoten gezogen. Die Quoten sind aus der Struktur der Prüfungsrichtlinie abgeleitet. Die genaue amtliche Verteilung der Punkte je Sachgebiet ist **nicht** amtlich verifiziert (ANNAHME, Toleranz ±4 bzw. ±2 Punkte).
* **Kombinierte Prüfungen** (zum Beispiel B und C gleichzeitig, Prüfungsrichtlinie Nr. 4.8) sind nicht umgesetzt. Die Simulation prüft immer genau eine Klasse.
