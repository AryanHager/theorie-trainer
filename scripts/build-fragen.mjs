// Batch 0/1: selbst formulierte Beispielfragen (Altbestand). Ausgabe erfolgt über scripts/build-katalog.mjs.
// Alle Texte sind eigene Formulierungen auf Basis der StVO – KEINE amtlichen Prüfungsfragen.
import { readFileSync, writeFileSync } from 'node:fs';

const kapitel = [
  { id: 'gefahrenlehre', titel: 'Gefahrenlehre', beschreibung: 'Gefahren erkennen und richtig reagieren' },
  { id: 'verhalten', titel: 'Verhalten im Verkehr', beschreibung: 'Rücksicht, Überholen, besondere Situationen' },
  { id: 'vorfahrt', titel: 'Vorfahrt & Vorrang', beschreibung: 'Kreuzungen, Abbiegen, Kreisverkehr' },
  { id: 'zeichen', titel: 'Verkehrszeichen', beschreibung: 'Bedeutung wichtiger Zeichen' },
  { id: 'umwelt', titel: 'Umweltschutz', beschreibung: 'Spritsparend und umweltbewusst fahren' },
  { id: 'technik', titel: 'Technik', beschreibung: 'Fahrzeugtechnik und Ausrüstung' },
  { id: 'zahlen', titel: 'Zahlenfragen', beschreibung: 'Grenzwerte, Abstände, Faustformeln' },
];

const AB = ['A', 'B'];
// [kapitel, stoff, klassen, punkte, text, antworten ("+" = richtig), erklaerung, bild?, bildAlt?]
const raw = [
  // ---------- Gefahrenlehre ----------
  ['gefahrenlehre','grundstoff',AB,4,'Zwischen parkenden Autos rollt plötzlich ein Ball auf die Fahrbahn. Womit sollten Sie rechnen und wie verhalten Sie sich?',
    ['+Ein Kind könnte dem Ball hinterherlaufen','+Ich nehme den Fuß vom Gas und bin bremsbereit','Ich hupe kurz und fahre mit unveränderter Geschwindigkeit weiter'],
    'Wo ein Ball ist, sind oft Kinder. Kinder achten beim Spielen kaum auf den Verkehr. Deshalb sofort Geschwindigkeit verringern und jederzeit anhalten können.','media/ball-strasse.svg','Straße mit parkenden Autos, ein Ball rollt auf die Fahrbahn'],
  ['gefahrenlehre','grundstoff',AB,4,'Sie fahren bei dichtem Nebel, die Sicht beträgt deutlich weniger als 50 Meter. Was ist richtig?',
    ['+Ich darf die Nebelschlussleuchte einschalten','+Ich fahre höchstens 50 km/h, auch wenn mehr erlaubt wäre','Ich schalte das Fernlicht ein, damit ich weiter sehe'],
    'Bei Sichtweiten unter 50 m durch Nebel, Schnee oder Regen gilt höchstens 50 km/h, und die Nebelschlussleuchte darf eingeschaltet werden. Fernlicht wird vom Nebel zurückgeworfen und verschlechtert die Sicht.'],
  ['gefahrenlehre','grundstoff',AB,4,'Ihr Auto beginnt auf einer stark nassen Fahrbahn aufzuschwimmen (Aquaplaning). Wie reagieren Sie richtig?',
    ['+Gas wegnehmen und auskuppeln','+Das Lenkrad möglichst gerade halten','Kräftig bremsen und stark gegenlenken'],
    'Beim Aufschwimmen haben die Reifen keinen Kontakt zur Straße. Lenk- und Bremsbewegungen wirken dann kaum – und sobald die Reifen wieder greifen, kann das Auto ausbrechen. Ruhig bleiben, Gas weg, Lenkrad gerade.'],
  ['gefahrenlehre','grundstoff',AB,5,'Ein Linienbus steht mit eingeschaltetem Warnblinklicht an einer Haltestelle. Wie verhalten Sie sich?',
    ['+Ich fahre nur mit Schrittgeschwindigkeit vorbei','+Wenn nötig, halte ich an, damit Fahrgäste nicht gefährdet werden','Das gilt nur in meiner Fahrtrichtung, im Gegenverkehr darf ich normal vorbeifahren'],
    'An Bussen, die mit Warnblinklicht an einer Haltestelle stehen, darf man nur mit Schrittgeschwindigkeit und mit ausreichendem Abstand vorbeifahren – das gilt auch für den Gegenverkehr. Fahrgäste dürfen nicht gefährdet werden.','media/bus-haltestelle.svg','Bus mit Warnblinklicht an einer Haltestelle'],
  ['gefahrenlehre','grundstoff',AB,3,'Auf einer langen Autobahnfahrt merken Sie, dass Sie müde werden. Was ist sinnvoll?',
    ['+Bei nächster Gelegenheit eine Pause einlegen','Das Fenster öffnen und die Fahrt ohne Pause fortsetzen – das reicht dauerhaft','Laute Musik ersetzt eine Pause'],
    'Gegen Müdigkeit hilft auf Dauer nur Schlaf bzw. eine echte Pause. Frische Luft oder Musik wirken nur kurz. Schon wenige Sekunden Sekundenschlaf können tödlich sein.'],
  ['gefahrenlehre','grundstoff',AB,4,'Nachts auf einer Landstraße steht plötzlich ein Reh im Scheinwerferlicht auf der Fahrbahn. Was tun Sie?',
    ['+Abblenden, hupen und kontrolliert bremsen','+Lenkrad festhalten und in der Spur bleiben','Riskant ausweichen, notfalls in den Gegenverkehr'],
    'Fernlicht blendet Wildtiere, sie bleiben dann oft stehen. Besser: abblenden, hupen, bremsen. Ein riskantes Ausweichmanöver ist meist gefährlicher als ein Zusammenstoß mit dem Tier.','signs/vz-142-10.svg','Zeichen 142: Wildwechsel'],
  ['gefahrenlehre','grundstoff',AB,3,'Bei Temperaturen knapp über 0 °C nähern Sie sich einer Brücke. Womit müssen Sie rechnen?',
    ['+Auf der Brücke kann es bereits glatt sein','Brücken sind wegen der Luftzirkulation immer trocken','Glätte kommt nur in Wohngebieten vor'],
    'Brücken kühlen von oben und unten aus und frieren deshalb früher als die übrige Fahrbahn. Vorher Geschwindigkeit verringern und nicht auf der Brücke bremsen.'],
  ['gefahrenlehre','zusatzstoff',['A'],4,'Sie fahren mit dem Motorrad in eine Kurve. Wohin richten Sie Ihren Blick?',
    ['+Möglichst weit in Richtung Kurvenausgang','Direkt auf das Vorderrad','Auf die Mittellinie unmittelbar vor dem Motorrad'],
    'Das Motorrad fährt dorthin, wohin der Blick geht. Ein Blick weit voraus in die Kurve hilft, die richtige Linie zu halten und Gefahren früh zu erkennen.'],
  ['gefahrenlehre','zusatzstoff',['B'],3,'Sie wollen mit dem Auto an einer Kolonne von Radfahrenden vorbeifahren. Was ist zu beachten?',
    ['+Innerorts mindestens 1,5 m Seitenabstand halten','+Außerorts mindestens 2 m Seitenabstand halten','Ein Abstand von 50 cm reicht immer'],
    'Beim Überholen von Radfahrenden, zu Fuß Gehenden und E-Scootern gilt innerorts mindestens 1,5 m und außerorts mindestens 2 m Seitenabstand.'],

  // ---------- Verhalten im Verkehr ----------
  ['verhalten','grundstoff',AB,4,'Auf einer Autobahn mit drei Fahrstreifen pro Richtung stockt der Verkehr. Wo bilden Sie die Rettungsgasse?',
    ['+Zwischen dem linken und dem mittleren Fahrstreifen','Zwischen dem mittleren und dem rechten Fahrstreifen','Auf dem Seitenstreifen'],
    'Die Rettungsgasse entsteht immer zwischen dem äußerst linken und dem rechts daneben liegenden Fahrstreifen. Wer ganz links fährt, weicht nach links aus, alle anderen nach rechts.','media/rettungsgasse.svg','Autobahn mit drei Fahrstreifen und Rettungsgasse'],
  ['verhalten','grundstoff',AB,4,'Hinter Ihnen nähert sich ein Fahrzeug mit Blaulicht und Martinshorn. Was müssen Sie tun?',
    ['+Sofort freie Bahn schaffen','+Wenn nötig an den Rand fahren und anhalten','Weiterfahren wie bisher, das Fahrzeug überholt schon irgendwie'],
    'Blaulicht zusammen mit Einsatzhorn bedeutet: Alle müssen sofort freie Bahn schaffen – notfalls durch Anhalten am Fahrbahnrand.'],
  ['verhalten','grundstoff',AB,5,'In welchen Situationen ist Überholen verboten?',
    ['+Bei unklarer Verkehrslage','+Wenn ich den Gegenverkehr nicht ausreichend überblicken kann','An einer durchgezogenen Mittellinie, solange ich schnell genug bin'],
    'Überholen ist unter anderem bei unklarer Verkehrslage verboten und wenn der Gegenverkehr behindert werden könnte. Eine durchgezogene Linie darf nicht überfahren werden – egal wie schnell man ist.'],
  ['verhalten','grundstoff',AB,4,'Eine Fußgängerin steht erkennbar wartend an einem Zebrastreifen. Wie verhalten Sie sich?',
    ['+Ich halte an und lasse sie die Straße überqueren','+Ich überhole vor dem Zebrastreifen keine anderen Fahrzeuge','Ich fahre zügig vorbei, solange sie noch auf dem Gehweg steht'],
    'Wer einen Fußgängerüberweg sichtbar benutzen will, muss ihn überqueren können. Fahrzeuge müssen deshalb mit mäßiger Geschwindigkeit heranfahren und wenn nötig warten. Am Überweg darf nicht überholt werden.','media/zebrastreifen.svg','Zebrastreifen mit wartender Person'],
  ['verhalten','grundstoff',AB,4,'Wann dürfen Sie als Fahrer ein Smartphone in die Hand nehmen und bedienen?',
    ['+Wenn das Fahrzeug steht und der Motor vollständig ausgeschaltet ist','Beim Warten an einer roten Ampel mit laufendem Motor','Bei Schrittgeschwindigkeit im Stau'],
    'Während der Fahrt ist das Aufnehmen und Halten des Handys verboten. Erlaubt ist es nur bei stehendem Fahrzeug mit vollständig ausgeschaltetem Motor (eine automatische Start-Stopp-Abschaltung zählt nicht).'],
  ['verhalten','grundstoff',AB,3,'Ein Fahrstreifen endet wegen einer Baustelle, der Verkehr fließt nur noch langsam. Wie fädeln Sie richtig ein?',
    ['+Erst unmittelbar vor der Engstelle wechseln','+Abwechselnd mit den Fahrzeugen auf dem anderen Fahrstreifen','So früh wie möglich wechseln, auch wenn der Streifen noch lange frei ist'],
    'Beim Reißverschlussverfahren nutzen alle beide Fahrstreifen bis zur Engstelle und fädeln dann im Wechsel ein. Das verkürzt den Stau.'],
  ['verhalten','grundstoff',AB,5,'Sie sind noch in der Probezeit. Was gilt beim Thema Alkohol am Steuer?',
    ['+Ich darf überhaupt keinen Alkohol vor oder während der Fahrt trinken','Bis 0,5 Promille ist das Fahren erlaubt','Ein kleines Bier ist immer erlaubt'],
    'Für Fahranfänger in der Probezeit und für alle unter 21 Jahren gilt ein absolutes Alkoholverbot am Steuer (0,0 Promille).'],
  ['verhalten','zusatzstoff',['B'],4,'Sie nehmen ein 6-jähriges Kind im Auto mit. Was ist richtig?',
    ['+Das Kind braucht einen geeigneten Kindersitz','+Auf dem Beifahrersitz mit rückwärts gerichtetem Sitz muss der Airbag deaktiviert sein','Ein Erwachsenengurt reicht ab dem Schulalter immer aus'],
    'Kinder unter 12 Jahren, die kleiner als 150 cm sind, brauchen eine passende Rückhalteeinrichtung. Ein rückwärts gerichteter Kindersitz darf nicht vor einem aktiven Front-Airbag montiert werden.'],

  // ---------- Vorfahrt ----------
  ['vorfahrt','grundstoff',AB,5,'Sie (blaues Auto) kommen an eine Kreuzung ohne Verkehrszeichen oder Ampel. Was ist richtig?',
    ['+Ich muss das rote Auto von rechts vorlassen','+Das gelbe Auto von links muss mich vorlassen','Ich habe Vorfahrt vor beiden Fahrzeugen'],
    'Ohne Zeichen, Ampel oder Polizei gilt „rechts vor links“. Das rote Auto kommt von rechts und hat Vorfahrt. Gegenüber dem gelben Auto (links) haben Sie Vorfahrt.','media/kreuzung-rechts-vor-links.svg','Kreuzung: blaues Auto von unten, rotes von rechts, gelbes von links'],
  ['vorfahrt','grundstoff',AB,5,'Sie (blau) wollen links abbiegen. Ein Auto im Gegenverkehr (grün) fährt geradeaus. Wie verhalten Sie sich?',
    ['+Ich lasse das entgegenkommende Auto zuerst durchfahren','Ich biege zuerst ab, weil ich schon in der Kreuzung stehe','Wer zuerst blinkt, darf zuerst fahren'],
    'Wer links abbiegt, muss entgegenkommende Fahrzeuge durchfahren lassen – auch wenn diese ebenfalls abbiegen wollen, aber nach rechts.','media/linksabbiegen.svg','Kreuzung: blaues Auto will links abbiegen, grünes Auto kommt entgegen'],
  ['vorfahrt','grundstoff',AB,4,'An einer roten Ampel hängt ein Schild mit grünem Pfeil nach rechts. Was ist richtig?',
    ['+Ich muss zuerst an der Haltlinie anhalten','+Danach darf ich rechts abbiegen, wenn ich niemanden gefährde oder behindere','Ich darf ohne anzuhalten zügig rechts abbiegen'],
    'Das Grünpfeil-Schild erlaubt das Rechtsabbiegen bei Rot nur nach vorherigem Anhalten. Fußgänger und Radfahrer sowie der Querverkehr dürfen nicht behindert werden.','media/gruenpfeil.svg','Ampel auf Rot mit grünem Pfeilschild'],
  ['vorfahrt','grundstoff',AB,4,'Eine Ampel zeigt Grün, aber eine Polizistin gibt Ihnen das Zeichen zum Anhalten. Was gilt?',
    ['+Ich halte an – Zeichen der Polizei haben Vorrang','Ich fahre, denn die Ampel ist grün','Ich entscheide selbst, was sicherer ist'],
    'Zeichen und Weisungen von Polizeibeamten gehen allen anderen Regeln, Verkehrszeichen und Ampeln vor.'],
  ['vorfahrt','grundstoff',AB,4,'Sie wollen aus einer Grundstücksausfahrt auf die Straße fahren. Was ist richtig?',
    ['+Ich muss alle anderen Verkehrsteilnehmenden durchlassen','+Eine Gefährdung anderer muss ausgeschlossen sein','Fahrzeuge von links müssen mich vorlassen'],
    'Wer aus einem Grundstück auf die Straße einfährt, muss sich so verhalten, dass eine Gefährdung anderer ausgeschlossen ist – notfalls mit Hilfe einer einweisenden Person.'],
  ['vorfahrt','grundstoff',AB,3,'Sie fahren in einen Kreisverkehr ein, der mit Kreisverkehrszeichen und „Vorfahrt gewähren“ beschildert ist. Was ist richtig?',
    ['+Beim Einfahren blinke ich nicht','+Beim Ausfahren muss ich blinken','Fahrzeuge, die einfahren wollen, haben Vorfahrt vor denen im Kreis'],
    'In einem so beschilderten Kreisverkehr haben die Fahrzeuge im Kreis Vorfahrt. Beim Hineinfahren ist Blinken unzulässig, beim Hinausfahren dagegen vorgeschrieben.','media/kreisverkehr.svg','Kreisverkehr von oben'],

  // ---------- Verkehrszeichen ----------
  ['zeichen','grundstoff',AB,4,'Was verlangt dieses Zeichen von Ihnen?',
    ['+An der Haltlinie anhalten, auch wenn die Kreuzung frei ist','+Vorfahrt gewähren','Langsam heranrollen genügt, wenn niemand kommt'],
    'Das Stoppschild verlangt immer ein vollständiges Anhalten – auch bei freier Straße – und danach Vorfahrt gewähren.','signs/vz-206.svg','Zeichen 206: Halt! Vorfahrt gewähren!'],
  ['zeichen','grundstoff',AB,4,'Was bedeutet dieses Zeichen?',
    ['+Ich muss Vorfahrt gewähren','Ich muss in jedem Fall anhalten','Ich habe an der nächsten Kreuzung Vorfahrt'],
    'Das auf der Spitze stehende Dreieck bedeutet „Vorfahrt gewähren“. Anhalten muss man nur, wenn es nötig ist.','signs/vz-205.svg','Zeichen 205: Vorfahrt gewähren!'],
  ['zeichen','grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Ich darf nicht schneller als 30 km/h fahren','Ich muss mindestens 30 km/h fahren','Es gilt eine Empfehlung von 30 km/h'],
    'Ein runder weißer Kreis mit rotem Rand und Zahl ist eine zulässige Höchstgeschwindigkeit. Eine Mindestgeschwindigkeit wäre ein blaues rundes Schild.','signs/vz-274-30.svg','Zeichen 274: Zulässige Höchstgeschwindigkeit 30'],
  ['zeichen','grundstoff',AB,3,'Was gilt bei diesem Zeichen?',
    ['+Die Straße darf mit Fahrzeugen nicht befahren werden','+Ein Fahrrad darf geschoben werden','Nur Lkw dürfen hier nicht fahren'],
    'Der leere weiße Kreis mit rotem Rand verbietet Fahrzeuge aller Art. Wer ein Fahrrad schiebt, gilt als Fußgänger und ist nicht betroffen.','signs/vz-250.svg','Zeichen 250: Verbot für Fahrzeuge aller Art'],
  ['zeichen','grundstoff',AB,4,'Was bedeutet dieses Zeichen?',
    ['+Ich befinde mich auf einer Vorfahrtstraße','+Außerorts ist das Parken auf der Fahrbahn verboten','Ich muss an der nächsten Kreuzung anhalten'],
    'Die gelbe Raute kennzeichnet eine Vorfahrtstraße. Außerhalb geschlossener Ortschaften ist auf ihrer Fahrbahn das Parken verboten.','signs/vz-306.svg','Zeichen 306: Vorfahrtstraße'],
  ['zeichen','grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Einfahren verboten','Einbahnstraße – Einfahrt erlaubt','Halteverbot'],
    'Der rote Kreis mit waagerechtem weißem Balken verbietet die Einfahrt. Man sieht es z. B. am Ende einer Einbahnstraße.','signs/vz-267.svg','Zeichen 267: Verbot der Einfahrt'],
  ['zeichen','grundstoff',AB,4,'Sie fahren in einen verkehrsberuhigten Bereich. Was gilt dort?',
    ['+Ich fahre mit Schrittgeschwindigkeit','+Fußgänger dürfen die ganze Straßenbreite nutzen','Parken ist überall erlaubt'],
    'Im verkehrsberuhigten Bereich gilt Schrittgeschwindigkeit, Kinderspiele sind überall erlaubt und Fußgänger dürfen die ganze Straße nutzen. Geparkt werden darf nur auf gekennzeichneten Flächen.','signs/vz-325_1.svg','Zeichen 325.1: Beginn eines verkehrsberuhigten Bereichs'],

  // ---------- Umweltschutz ----------
  ['umwelt','grundstoff',AB,3,'Wie fahren Sie besonders kraftstoffsparend?',
    ['+Früh in einen höheren Gang schalten','+Unnötiges Gepäck aus dem Fahrzeug entfernen','Den Motor vor der Fahrt im Stand warmlaufen lassen'],
    'Niedrige Drehzahlen und weniger Gewicht senken den Verbrauch. Unnötiges Laufenlassen des Motors im Stand ist verboten und schadet der Umwelt.'],
  ['umwelt','grundstoff',['B'],3,'Ihre Dachbox wird für die nächsten Wochen nicht gebraucht. Was ist sinnvoll?',
    ['+Die Dachbox abbauen','Montiert lassen, das spielt für den Verbrauch keine Rolle','Nur bei Fahrten über 200 km abbauen'],
    'Dachaufbauten erhöhen den Luftwiderstand deutlich und damit den Verbrauch – besonders bei höheren Geschwindigkeiten.'],
  ['umwelt','grundstoff',AB,3,'Welche Folge hat ein zu niedriger Reifendruck?',
    ['+Der Kraftstoffverbrauch steigt','+Die Reifen nutzen sich schneller ab','Das Fahrzeug bremst besser'],
    'Zu wenig Luftdruck erhöht den Rollwiderstand und den Verschleiß und verschlechtert das Fahrverhalten. Den Druck regelmäßig prüfen.'],
  ['umwelt','grundstoff',AB,3,'Sie warten vor einem geschlossenen Bahnübergang. Was ist umweltbewusst?',
    ['+Den Motor abstellen','Den Motor laufen lassen, damit es schneller weitergeht','Mit Standgas die Batterie laden'],
    'Bei absehbar längeren Wartezeiten den Motor abstellen. Das spart Kraftstoff und vermeidet Lärm und Abgase.'],
  ['umwelt','grundstoff',AB,3,'Vor Ihnen springt eine Ampel auf Gelb, sie ist noch weit entfernt. Wie fahren Sie vorausschauend und sparsam?',
    ['+Gas wegnehmen und mit eingelegtem Gang ausrollen lassen','Noch einmal kräftig beschleunigen','Auskuppeln und im Leerlauf mit hoher Drehzahl rollen'],
    'Beim Rollen mit eingelegtem Gang schalten viele Motoren die Kraftstoffzufuhr ab (Schubabschaltung). Wer vorausschauend fährt, bremst seltener und spart Energie.'],

  // ---------- Technik ----------
  ['technik','zusatzstoff',AB,3,'Was müssen Sie bei winterlichen Straßenverhältnissen beachten?',
    ['+Es sind Winter- oder Ganzjahresreifen vorgeschrieben','+Die Reifen müssen das Bergpiktogramm mit Schneeflocke tragen','Sommerreifen sind bei Glatteis erlaubt, wenn man langsam fährt'],
    'Bei Glatteis, Schnee, Schneematsch oder Reifglätte dürfen nur Reifen mit Alpine-Symbol (Berg mit Schneeflocke) gefahren werden.'],
  ['technik','zusatzstoff',AB,3,'Was leistet ein Antiblockiersystem (ABS) bei einer Vollbremsung?',
    ['+Das Fahrzeug bleibt während der Bremsung lenkbar','Der Bremsweg ist immer kürzer als ohne ABS','Man kann deutlich später bremsen'],
    'ABS verhindert das Blockieren der Räder, damit man beim Bremsen noch ausweichen kann. Auf losem Untergrund kann der Bremsweg mit ABS sogar länger sein.'],
  ['technik','zusatzstoff',['B'],2,'Welche Ausrüstung müssen Sie in einem Pkw mitführen?',
    ['+Ein Warndreieck','+Einen Verbandkasten','Einen Feuerlöscher'],
    'In Pkw vorgeschrieben sind Warndreieck, Verbandkasten und Warnweste. Ein Feuerlöscher ist sinnvoll, aber im Pkw nicht Pflicht.'],
  ['technik','zusatzstoff',AB,3,'Mit welchem Licht fahren Sie tagsüber durch einen beleuchteten Tunnel?',
    ['+Mit Abblendlicht','Ohne Licht, der Tunnel ist ja beleuchtet','Mit Nebelscheinwerfern'],
    'Im Tunnel muss immer mit Abblendlicht gefahren werden – auch wenn er beleuchtet ist.'],
  ['technik','zusatzstoff',['A'],2,'Welche Schutzausrüstung ist beim Motorradfahren sinnvoll bzw. vorgeschrieben?',
    ['+Ein geeigneter Schutzhelm ist vorgeschrieben','+Schutzkleidung mit Protektoren ist sehr empfehlenswert','Bei kurzen Strecken ist ein Helm nicht nötig'],
    'Auf Krafträdern besteht Helmpflicht. Motorradkleidung mit Protektoren, Handschuhe und feste Stiefel schützen zusätzlich bei Stürzen.'],
  ['technik','zusatzstoff',['A'],3,'Wie prüfen Sie vor der Fahrt die Antriebskette Ihres Motorrads?',
    ['+Auf ausreichende Spannung (Durchhang)','+Auf Verschleiß und ausreichende Schmierung','Gar nicht, Ketten sind wartungsfrei'],
    'Eine zu lockere oder trockene Kette kann abspringen oder reißen. Durchhang, Schmierung und Zustand regelmäßig kontrollieren.'],

  // ---------- Zahlenfragen (Auswahl) ----------
  ['zahlen','grundstoff',AB,5,'Ab welcher Blutalkoholkonzentration begehen Sie (außerhalb der Probezeit, über 21) eine Ordnungswidrigkeit, auch ohne Ausfallerscheinungen?',
    ['+0,5 Promille','1,1 Promille','0,8 Promille'],
    'Ab 0,5 Promille liegt eine Ordnungswidrigkeit vor. Ab 1,1 Promille gilt man als absolut fahruntüchtig – das ist eine Straftat. Schon ab 0,3 Promille kann es bei Ausfallerscheinungen strafbar sein.'],
];

// Zahlenfragen mit Eingabefeld
const zahlRaw = [
  ['zahlen','grundstoff',AB,4,'Wie hoch ist die zulässige Höchstgeschwindigkeit innerhalb geschlossener Ortschaften für alle Kraftfahrzeuge, wenn keine Schilder etwas anderes anzeigen?',50,'km/h',
    'Innerorts gilt allgemein 50 km/h, sofern nichts anderes angeordnet ist.'],
  ['zahlen','zusatzstoff',['B'],4,'Wie schnell darf ein Pkw außerhalb geschlossener Ortschaften (ohne Autobahn/Kraftfahrstraße) höchstens fahren, wenn keine Schilder etwas anderes anzeigen?',100,'km/h',
    'Für Pkw gilt außerorts allgemein 100 km/h. Auf Autobahnen gibt es keine allgemeine Höchstgeschwindigkeit, aber eine Richtgeschwindigkeit von 130 km/h.'],
  ['zahlen','zusatzstoff',AB,3,'Wie groß muss die Profiltiefe der Reifen mindestens sein (gesetzliche Mindestprofiltiefe)?',1.6,'mm',
    'Gesetzlich vorgeschrieben sind mindestens 1,6 mm. Empfohlen werden für Sommerreifen etwa 3 mm, für Winterreifen etwa 4 mm.'],
  ['zahlen','grundstoff',AB,3,'Nach der Faustformel „(Geschwindigkeit ÷ 10) × 3“: Wie lang ist der Reaktionsweg bei 50 km/h?',15,'m',
    '50 ÷ 10 = 5, 5 × 3 = 15 m. In dieser Strecke fährt das Auto, bevor man überhaupt zu bremsen beginnt.'],
  ['zahlen','grundstoff',AB,3,'Nach der Faustformel „(Geschwindigkeit ÷ 10)²“: Wie lang ist der normale Bremsweg bei 50 km/h?',25,'m',
    '50 ÷ 10 = 5, 5 × 5 = 25 m. Bei einer Gefahrbremsung halbiert sich der Wert ungefähr (ca. 12,5 m).'],
  ['zahlen','grundstoff',AB,3,'Bis zu wie vielen Metern vor und hinter Kreuzungen und Einmündungen (gemessen ab den Fahrbahnkanten) ist das Parken verboten?',5,'m',
    'Vor und hinter Kreuzungen und Einmündungen darf man bis zu je 5 m nicht parken, damit die Sicht frei bleibt.'],
  ['zahlen','grundstoff',AB,3,'Faustregel „halber Tacho“: Wie viele Meter Sicherheitsabstand halten Sie außerorts bei 100 km/h mindestens?',50,'m',
    'Halber Tacho bedeutet: Abstand in Metern = halbe Geschwindigkeit in km/h. Bei 100 km/h also mindestens 50 m.'],
];

const fragen = [];
let n = 0;
const nr = () => String(++n).padStart(3, '0');
const kapitelNr = Object.fromEntries(kapitel.map((k, i) => [k.id, i + 1]));
for (const [k, stoff, klassen, punkte, text, antworten, erklaerung, bild, bildAlt] of raw) {
  const id = nr();
  fragen.push({
    id: `BSP-${kapitelNr[k]}-${id}`,
    mutterfrageId: `BSP-${kapitelNr[k]}-${id}`,
    variante: 0,
    kapitel: k, stoff, klassen, punkte, typ: 'auswahl', text,
    antworten: antworten.map(a => ({ text: a.replace(/^\+/, ''), richtig: a.startsWith('+') })),
    erklaerung,
    medien: { bild: bild ?? null, bildAlt: bildAlt ?? null, video: null, poster: null },
    beispiel: true,
  });
}
for (const [k, stoff, klassen, punkte, text, wert, einheit, erklaerung] of zahlRaw) {
  const id = nr();
  fragen.push({
    id: `BSP-${kapitelNr[k]}-${id}`, mutterfrageId: `BSP-${kapitelNr[k]}-${id}`, variante: 0,
    kapitel: k, stoff, klassen, punkte, typ: 'zahl', text,
    zahl: { wert, einheit, toleranz: 0 },
    erklaerung, medien: { bild: null, bildAlt: null, video: null, poster: null }, beispiel: true,
  });
}
// ---------- Neue Verkehrszeichen-Fragen (echte Zeichen von Wikimedia Commons, Texte selbst formuliert) ----------
// [stoff, klassen, punkte, text, antworten, erklaerung, hauptzeichenNr, zusatzzeichenNr[]]
const zeichenRaw = [
  ['grundstoff',AB,4,'Worauf weist Sie dieses Gefahrzeichen hin?',
    ['+An der nächsten Kreuzung oder Einmündung gilt „rechts vor links“','Ich bin auf einer Vorfahrtstraße','Ich muss an der nächsten Kreuzung immer anhalten'],
    'Das Dreieck mit dem stehenden Kreuz kündigt eine Kreuzung oder Einmündung an, an der Fahrzeuge von rechts Vorfahrt haben.','102'],
  ['grundstoff',AB,3,'Wie verhalten Sie sich, wenn Sie dieses Zeichen sehen?',
    ['+Ich verringere die Geschwindigkeit schon vor der Linkskurve','Ich bremse erst mitten in der Kurve kräftig','Ich schneide die Kurve, um schneller durchzukommen'],
    'Das Zeichen warnt vor einer Kurve nach links. Die passende Geschwindigkeit wählt man vor der Kurve – Bremsen in der Kurve kann das Fahrzeug instabil machen.','103-10'],
  ['grundstoff',AB,3,'Was kündigt Ihnen dieses Zeichen an?',
    ['+Die Fahrbahn kann bei Nässe oder Verschmutzung besonders rutschig sein','+Ich bremse und lenke behutsam','Es gilt nur bei Schnee im Winter'],
    'Das Zeichen „Schleuder- oder Rutschgefahr“ warnt vor einer Fahrbahn, die bei Nässe oder Schmutz besonders glatt sein kann – unabhängig von der Jahreszeit.','114'],
  ['grundstoff',AB,4,'Womit müssen Sie bei diesem Zeichen rechnen?',
    ['+Mit Personen und Baufahrzeugen auf oder neben der Fahrbahn','+Mit verschmutzter oder verengter Fahrbahn','Mit freier Fahrt ohne Einschränkungen'],
    'Das Zeichen „Arbeitsstelle“ kündigt eine Baustelle an. Dort können Menschen arbeiten, Fahrzeuge ein- und ausfahren und Fahrstreifen schmaler sein.','123'],
  ['grundstoff',AB,4,'Sie sehen dieses Zeichen auf der Autobahn. Was ist richtig?',
    ['+Ich rechne mit stehendem oder sehr langsamem Verkehr','+Ich darf zur Warnung des nachfolgenden Verkehrs das Warnblinklicht einschalten, wenn ich mich einem Stauende nähere','Ich wechsle schnell auf den linken Fahrstreifen und beschleunige'],
    'Das Zeichen „Stau“ warnt vor einem möglichen Stauende. Wer sich einem Stauende nähert, darf mit Warnblinklicht den nachfolgenden Verkehr warnen.','124'],
  ['grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Nach diesem Zeichen kommt mir auf derselben Fahrbahn Verkehr entgegen','+Ich halte mich besonders weit rechts','Ab hier ist die Fahrbahn eine Einbahnstraße'],
    'Das Zeichen „Gegenverkehr“ steht z. B. dort, wo eine bisher nur in eine Richtung befahrene Fahrbahn wieder in beiden Richtungen befahren wird.','125'],
  ['grundstoff',AB,4,'Wie verhalten Sie sich bei diesem Zeichen?',
    ['+Ich rechne damit, dass Kinder unvermittelt auf die Fahrbahn laufen','+Ich fahre langsamer und bin bremsbereit','Ich hupe, damit die Kinder Platz machen'],
    'Das Zeichen „Kinder“ steht z. B. an Schulen, Spielplätzen und Kindergärten. Kinder können Gefahren oft nicht einschätzen – deshalb vorsichtig und bremsbereit fahren.','136-10'],
  ['grundstoff',AB,5,'Was müssen Sie an diesem Zeichen beachten?',
    ['+Schienenfahrzeuge haben Vorrang','+Innerorts darf ich bis 5 m und außerorts bis 50 m davor nicht parken','Wenn kein Zug zu sehen ist, darf ich auf den Gleisen anhalten'],
    'Das Andreaskreuz verlangt, Schienenfahrzeugen Vorrang zu gewähren. Davor gilt ein Parkverbot (innerorts bis 5 m, außerorts bis 50 m). Auf den Gleisen darf man nie anhalten.','201-50'],
  ['grundstoff',AB,4,'Was verlangt dieses Zeichen an einer Engstelle?',
    ['+Ich muss dem Gegenverkehr Vorrang gewähren','+Wenn nötig, warte ich vor der Engstelle','Ich habe Vorrang vor dem Gegenverkehr'],
    'Der rote Pfeil zeigt den Verkehr, der Vorrang hat – hier ist es der Gegenverkehr. Man wartet vor der Engstelle, bis sie frei ist.','208'],
  ['grundstoff',AB,4,'Was bedeutet dieses Zeichen an einer Engstelle?',
    ['+Ich habe Vorrang vor dem Gegenverkehr','+Ich darf den Vorrang nicht erzwingen, wenn der Gegenverkehr ihn nicht beachtet','Ich muss dem Gegenverkehr Vorrang gewähren'],
    'Das blaue Schild mit dem großen weißen Pfeil zeigt: Ich habe Vorrang. Trotzdem gilt die Pflicht zur Vorsicht – Vorrang darf nicht erzwungen werden.','308'],
  ['grundstoff',AB,3,'Was gebietet dieses Zeichen?',
    ['+Ich muss an der Kreuzung rechts abbiegen','Ich darf nur geradeaus fahren','Ich darf rechts parken'],
    'Blaue runde Zeichen sind Gebote. Dieser Pfeil schreibt die Fahrtrichtung rechts vor.','209'],
  ['grundstoff',AB,3,'Sie fahren in eine Straße mit diesem Zeichen ein. Was ist richtig?',
    ['+Ich darf die Straße nur in Pfeilrichtung befahren','+Ich darf auch am linken Fahrbahnrand halten und parken','Ich darf wenden, wenn kein Gegenverkehr kommt'],
    'Das Zeichen kennzeichnet eine Einbahnstraße. Fahrzeuge dürfen nur in Pfeilrichtung fahren; Halten und Parken ist hier auch links erlaubt, sofern nichts anderes angeordnet ist.','220-20'],
  ['grundstoff',AB,3,'Was gebietet Ihnen dieses Zeichen, z. B. an einer Verkehrsinsel?',
    ['+Ich fahre rechts an der Insel bzw. dem Hindernis vorbei','Ich darf wahlweise links oder rechts vorbeifahren','Ich muss vor dem Zeichen anhalten'],
    'Der schräg nach unten zeigende Pfeil schreibt vor, auf welcher Seite man vorbeifahren muss – hier rechts.','222'],
  ['grundstoff',AB,3,'Was gilt auf einem Weg mit diesem Zeichen?',
    ['+Radfahrende müssen diesen Weg benutzen','+Andere Fahrzeuge dürfen ihn nicht benutzen','Mofas dürfen hier immer fahren'],
    'Das Zeichen „Radweg“ verpflichtet den Radverkehr zur Benutzung. Andere Fahrzeuge dürfen den Weg nicht befahren, außer ein Zusatzzeichen erlaubt es.','237'],
  ['grundstoff',AB,3,'Was gilt auf einem Weg mit diesem Zeichen?',
    ['+Radfahrende und Fußgänger teilen sich den Weg','+Radfahrende müssen auf zu Fuß Gehende Rücksicht nehmen und wenn nötig die Geschwindigkeit anpassen','Fußgänger müssen den Radfahrenden ausweichen'],
    'Auf einem gemeinsamen Geh- und Radweg dürfen Radfahrende Fußgänger weder gefährden noch behindern – notfalls fährt man langsamer.','240'],
  ['grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Hier beginnt eine Fußgängerzone, Fahrzeuge dürfen nicht hinein','+Ein Zusatzzeichen kann bestimmten Fahrzeugen das Befahren erlauben','Pkw dürfen mit Schrittgeschwindigkeit hineinfahren'],
    'In einer Fußgängerzone ist anderer als Fußgängerverkehr verboten. Ausnahmen (z. B. Lieferverkehr zu bestimmten Zeiten) werden durch Zusatzzeichen geregelt.','242.1'],
  ['grundstoff',AB,3,'Für wen gilt dieses Verbotszeichen?',
    ['+Für Radfahrende','Für alle Kraftfahrzeuge','Für zu Fuß Gehende'],
    'Das rot umrandete Zeichen mit Fahrradsymbol verbietet das Radfahren auf dieser Straße.','254'],
  ['zusatzstoff',AB,4,'Was müssen Sie bei diesem Zeichen beachten?',
    ['+Ich darf nur mit Schneeketten weiterfahren','+Mit Schneeketten darf ich höchstens 50 km/h fahren','Winterreifen ersetzen die Schneeketten'],
    'Das blaue Zeichen schreibt Schneeketten vor. Mit montierten Schneeketten gilt eine Höchstgeschwindigkeit von 50 km/h.','268'],
  ['grundstoff',AB,3,'Was verbietet dieses Zeichen?',
    ['+Das Wenden','Das Linksabbiegen','Das Überholen'],
    'Der Pfeil mit Kehre im roten Kreis verbietet das Wenden – das Verbot gilt im Bereich des Zeichens.','272'],
  ['grundstoff',AB,4,'Sie fahren an diesem Zeichen vorbei. Was gilt?',
    ['+In der gesamten Zone darf ich höchstens 30 km/h fahren','+An Kreuzungen muss ich in der Regel mit „rechts vor links“ rechnen','Die Beschränkung gilt nur bis zur nächsten Kreuzung'],
    'Die Tempo-30-Zone gilt bis zu ihrem Ende-Zeichen, nicht nur bis zur nächsten Kreuzung. In solchen Zonen gilt meist „rechts vor links“.','274.1'],
  ['grundstoff',AB,3,'Was bedeutet dieses blaue Zeichen?',
    ['+Ich muss mindestens 30 km/h fahren, wenn Straße, Verkehr, Sicht und Wetter das zulassen','+Fahrzeuge, die nicht so schnell fahren können, dürfen hier nicht fahren','Ich darf höchstens 30 km/h fahren'],
    'Ein blaues rundes Zeichen mit Zahl ist eine vorgeschriebene Mindestgeschwindigkeit – nicht zu verwechseln mit der weiß-roten Höchstgeschwindigkeit.','275-30'],
  ['grundstoff',AB,4,'Was gilt bei diesem Zeichen?',
    ['+Ich darf keine mehrspurigen Kraftfahrzeuge (z. B. Pkw, Lkw) überholen','+Radfahrende darf ich weiterhin überholen','Überholen ist hier auch gegenüber Radfahrenden verboten'],
    'Das Überholverbot verbietet das Überholen mehrspuriger Kraftfahrzeuge und von Krafträdern mit Beiwagen. Einspurige Fahrzeuge wie Fahrräder dürfen mit ausreichendem Abstand überholt werden.','276'],
  ['grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Alle vorher angeordneten Streckenverbote (z. B. Überholverbote, Höchstgeschwindigkeiten) enden hier','Ab hier gibt es keine Verkehrsregeln mehr','Es gilt eine Höchstgeschwindigkeit von 100 km/h für alle'],
    'Das weiße Zeichen mit den schwarzen Schrägstrichen hebt Streckenverbote auf. Danach gelten wieder die allgemeinen Regeln, z. B. die allgemeinen Höchstgeschwindigkeiten.','282'],
  ['grundstoff',AB,4,'Was gilt bei diesem Zeichen?',
    ['+Ich darf auf der Fahrbahn nicht halten','+Auch kurzes Ein- oder Aussteigenlassen ist hier auf der Fahrbahn nicht erlaubt','Halten bis 3 Minuten ist erlaubt'],
    'Das absolute Haltverbot verbietet jedes Halten auf der Fahrbahn – auch kurzes Anhalten zum Ein- oder Aussteigen.','283'],
  ['grundstoff',AB,4,'Was ist bei diesem Zeichen erlaubt?',
    ['+Kurz halten, um Personen ein- oder aussteigen zu lassen','+Bis zu 3 Minuten halten, um zu be- oder entladen','Parken für bis zu einer Stunde'],
    'Beim eingeschränkten Haltverbot darf man auf der Fahrbahn nur zum Ein- oder Aussteigen oder zum Be- und Entladen halten – Letzteres höchstens 3 Minuten bzw. so lange, wie das Laden zügig dauert.','286'],
  ['grundstoff',AB,3,'Sie passieren dieses Zeichen. Was gilt ab hier, wenn keine anderen Zeichen etwas anderes anordnen?',
    ['+Ich bin innerhalb einer geschlossenen Ortschaft','+Es gilt eine Höchstgeschwindigkeit von 50 km/h','Es gilt eine Höchstgeschwindigkeit von 70 km/h'],
    'Die gelbe Ortstafel markiert den Beginn einer geschlossenen Ortschaft. Ab hier gelten die innerörtlichen Regeln, z. B. 50 km/h.','310'],
  ['grundstoff',AB,4,'Welche Regeln gelten nach diesem Zeichen?',
    ['+Nur Kraftfahrzeuge, die schneller als 60 km/h fahren können, dürfen die Straße benutzen','+Wenden und Rückwärtsfahren sind verboten','Halten auf dem Seitenstreifen ist jederzeit erlaubt'],
    'Auf der Autobahn sind nur Kraftfahrzeuge mit einer bauartbedingten Höchstgeschwindigkeit von mehr als 60 km/h zugelassen. Wenden, Rückwärtsfahren und Halten (außer im Notfall) sind verboten.','330.1'],
  ['grundstoff',AB,3,'Was zeigt Ihnen dieses Zeichen an?',
    ['+Die Straße hat für Fahrzeuge keine Durchfahrt','Ab hier beginnt eine Vorfahrtstraße','Ich muss hier wenden'],
    'Das Zeichen „Sackgasse“ informiert, dass die Straße für Fahrzeuge nicht weiterführt. Varianten zeigen, wenn Fußgänger oder Radfahrende trotzdem durchkommen.','357'],
  ['grundstoff',AB,4,'Dieses Zusatzzeichen hängt unter dem Zeichen „Verbot für Fahrzeuge aller Art“. Was bedeutet die Kombination?',
    ['+Nur wer dort wohnt oder ein Ziel in der Straße hat (Anlieger), darf hineinfahren','Alle dürfen hineinfahren, aber nur mit Schrittgeschwindigkeit','Die Straße ist für alle gesperrt, auch für Anlieger'],
    'Ein Zusatzzeichen ergänzt oder schränkt das Hauptzeichen ein. „Anlieger frei“ erlaubt das Befahren für alle, die dort ein berechtigtes Anliegen haben, z. B. Anwohner, Besucher oder Lieferverkehr.','250',['1020-30']],
  ['grundstoff',AB,4,'Das Zusatzzeichen hängt unter dem eingeschränkten Haltverbot. Was gilt?',
    ['+Das eingeschränkte Haltverbot gilt nur zwischen 16 und 18 Uhr','Zwischen 16 und 18 Uhr darf ich dort parken','Das Haltverbot gilt den ganzen Tag'],
    'Zeitangaben auf Zusatzzeichen beschränken das Hauptzeichen auf diesen Zeitraum. Außerhalb dieser Zeit gilt das Verbot nicht.','286',['1040-30']],
  ['zusatzstoff',AB,3,'Worauf weist dieses Zeichen hin?',
    ['+Auf mögliche Glätte durch Schnee oder Eis','+Ich wähle einen größeren Abstand und fahre vorsichtiger','Auf Wildwechsel im Winter'],
    'Das Zeichen mit der Schneeflocke warnt vor Schnee- oder Eisglätte. Bremswege können sich auf Glätte vervielfachen.','101-51'],
  ['grundstoff',AB,3,'Was bedeutet dieses Zeichen?',
    ['+Der Fahrstreifen ist Linienbussen vorbehalten','+Andere Fahrzeuge dürfen ihn nur benutzen, wenn ein Zusatzzeichen es erlaubt','Pkw dürfen den Busstreifen zum Überholen nutzen'],
    'Der Bussonderfahrstreifen ist für Linienbusse da. Ausnahmen, z. B. für Taxis oder Fahrräder, werden mit Zusatzzeichen angezeigt.','245'],
];
// Zusatzbilder für vorhandene Situationsgrafiken (echte Zeichen ergänzend)
const zusatzFuerBild = {
  'media/kreisverkehr.svg': ['215', '205'],
  'media/bus-haltestelle.svg': ['224'],
  'media/zebrastreifen.svg': ['350-10'],
};

const signs = JSON.parse(readFileSync(new URL('../public/signs/signs.json', import.meta.url), 'utf8')).schilder;
const sNr = Object.fromEntries(signs.map(x => [x.nr, x]));
const datei = nr => { if (!sNr[nr]) throw new Error('Zeichen fehlt: ' + nr); return sNr[nr].datei; };
const nrAusDatei = Object.fromEntries(signs.map(x => [x.datei, x.nr]));
for (const [stoff, klassen, punkte, text, antworten, erklaerung, haupt, zusatz = []] of zeichenRaw) {
  const id = nr();
  const h = sNr[haupt] ?? (() => { throw new Error('Zeichen fehlt: ' + haupt); })();
  fragen.push({
    id: `BSP-4-${id}`, mutterfrageId: `BSP-4-${id}`, variante: 0,
    kapitel: 'zeichen', stoff, klassen, punkte, typ: 'auswahl', text,
    antworten: antworten.map(a => ({ text: a.replace(/^\+/, ''), richtig: a.startsWith('+') })),
    erklaerung,
    medien: { bild: h.datei, bildAlt: `Zeichen ${h.nr}: ${h.name}`, zusatzbilder: zusatz.map(datei), video: null, poster: null },
    beispiel: true,
  });
}
for (const f of fragen) {
  const z = zusatzFuerBild[f.medien.bild];
  if (z) f.medien.zusatzbilder = z.map(datei);
  const nrs = [f.medien.bild, ...(f.medien.zusatzbilder ?? [])].map(d => nrAusDatei[d]).filter(Boolean);
  if (nrs.length) f.zeichen = nrs;
}
// Beispiel für eine Variante derselben Mutterfrage (zeigt die Datenstruktur)
const basis = fragen.find(f => f.typ === 'zahl' && f.zahl.wert === 15);
fragen.push({ ...basis, id: basis.mutterfrageId + '-V1', variante: 1,
  text: 'Nach der Faustformel „(Geschwindigkeit ÷ 10) × 3“: Wie lang ist der Reaktionsweg bei 80 km/h?',
  zahl: { wert: 24, einheit: 'm', toleranz: 0 },
  erklaerung: '80 ÷ 10 = 8, 8 × 3 = 24 m. Je schneller, desto länger der Weg, der schon vor dem Bremsen zurückgelegt wird.' });

// Altbestand (Batch 0/1) – wird von build-katalog.mjs übernommen und in die neue Kapitelstruktur umgehängt.
export { fragen as altFragen };
