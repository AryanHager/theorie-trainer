"""Wählt aktuelle, amtliche Zeichen (PD-VzKat) aus /tmp/commons_info.json und lädt sie nach public/signs/."""
import json, re, os, time, collections, urllib.request, html
from commons_tree import UA
info = json.load(open('/tmp/commons_info.json')); tpl = json.load(open('/tmp/commons_tpl.json'))
OUT = '../public/signs'; os.makedirs(OUT, exist_ok=True)
skip = collections.Counter(); skipped = []
def kategorie(nr):
    h = float(re.match(r'\d+', nr).group())
    if 100 <= h < 200: return 'Gefahrzeichen'
    if 293 <= h < 300: return 'Markierungen'
    if 200 <= h < 300: return 'Vorschriftzeichen'
    if 300 <= h < 600: return 'Richtzeichen'
    if 600 <= h < 700: return 'Verkehrseinrichtungen'
    if 1000 <= h < 1100: return 'Zusatzzeichen'
    return None
cand = {}
for t, p in info.items():
    cats = ' '.join(c['title'] for c in p.get('categories', [])).lower()
    tl = t.lower(); tp = set(tpl.get(t, []))
    def no(reason): skip[reason] += 1; skipped.append((t, reason))
    catl = [c['title'] for c in p.get('categories', [])]
    in_set = any(c.endswith('2017 set') and not any(x in c for x in ('historic', 'military', 'Symbols', 'assemblies')) for c in catl)
    ym0 = re.search(r'StVO (\d{4})', t); neu = bool(ym0 and int(ym0.group(1)) >= 2020)
    # PD-Vz historisch = gemeinfreie Zeichnung nach älterer StVO-Fassung. Nur übernehmen, wenn das Zeichen im aktuellen 2017er Satz geführt wird (Zeichen weiterhin gültig).
    if 'historisch' in tl: no('historisch'); continue
    if 'Template:PD-Vz historisch' in tp and not in_set: no('historisch (PD-Vz historisch, nicht mehr im aktuellen Satz)'); continue
    if not (in_set or neu):
        no('historisch (nicht im aktuellen VzKat-2017-Satz)' if 'historic' in cats else 'nicht im aktuellen VzKat-Satz'); continue
    if any(w in tl or w in cats for w in ['unofficial', 'inoffiziell', 'wappen', 'coat of arms', 'coats of arms']): no('inoffiziell/Wappen'); continue
    vorlage = 'PD-VzKat' if 'Template:PD-VzKat' in tp else ('PD-Vz historisch' if 'Template:PD-Vz historisch' in tp else None)
    if not vorlage: no('keine PD-VzKat-Vorlage'); continue
    m = re.match(r'File:(?:Zeichen|Zusatzzeichen|VZ|Vz)\s*(\d{3,4}(?:\.\d+)?(?:-\d+)?)\s*(.*)\.svg$', t)
    if not m: no('keine VzKat-Nummer im Dateinamen'); continue
    nr, rest = m.group(1), m.group(2)
    k = kategorie(nr)
    if not k: no('Nummer außerhalb StVO-Bereich'); continue
    ym = re.search(r'StVO (\d{4})', t); jahr = int(ym.group(1)) if ym else 0
    name = re.sub(r'^[\s\-–;,]+', '', rest)
    name = re.sub(r'[;,]?\s*StVO \d{4}.*$', '', name).strip(' -–;,')
    name = re.sub(r'\s*\(?\d{3,4}\s*x\s*\d{3,4}\)?', '', name).strip(' -–;,')
    name = re.sub(r'^(?:bis\s+)?\d+\s+-\s+', '', name).strip() or f'Zeichen {nr}'
    ii = p['imageinfo'][0]; em = ii.get('extmetadata', {})
    e = dict(inset=in_set, nr=nr, name=name, kategorie=k, jahr=jahr, titel=t, url=ii['url'], quelle=ii['descriptionurl'],
             lizenz=em.get('LicenseShortName', {}).get('value', 'Public domain'), vorlage=vorlage, groesse=ii.get('size'))
    alt = cand.get(nr)
    if alt is None or (in_set, jahr, -len(t)) > (alt['inset'], alt['jahr'], -len(alt['titel'])):
        if alt: skip['Dublette (ältere/andere Fassung)'] += 1; skipped.append((alt['titel'], 'Dublette'))
        cand[nr] = e
    else: skip['Dublette (ältere/andere Fassung)'] += 1; skipped.append((t, 'Dublette'))

def sortkey(nr):
    return [float(x) for x in re.split(r'-', nr)]
schilder = []
try: alt_m = {x['nr']: x['commonsDatei'] for x in json.load(open(os.path.join(OUT, 'signs.json')))['schilder']}
except Exception: alt_m = {}
for nr in sorted(cand, key=sortkey):
    e = cand[nr]; fn = 'vz-' + nr.replace('.', '_') + '.svg'
    path = os.path.join(OUT, fn)
    if alt_m.get(nr) not in (None, e['titel'][5:]) and os.path.exists(path): os.remove(path)
    if not os.path.exists(path):
        req = urllib.request.Request(e['url'], headers={'User-Agent': UA})
        for i in range(4):
            try:
                data = urllib.request.urlopen(req, timeout=60).read(); break
            except Exception as ex:
                print('retry', fn, ex); time.sleep(5 * (i + 1))
        else: skip['Download fehlgeschlagen'] += 1; continue
        open(path, 'wb').write(data); time.sleep(0.25)
    schilder.append(dict(nr=nr, name=e['name'], kategorie=e['kategorie'], datei='signs/' + fn,
                         quelle=e['quelle'], commonsDatei=e['titel'][5:], lizenz=f"{e['lizenz']} ({e['vorlage']}, § 5 Abs. 1 UrhG)", stvo=e['jahr'] or None))
manifest = dict(
    titel='Verkehrszeichen (StVO) – Wikimedia Commons',
    hinweis='Amtliche Verkehrszeichen nach dem Verkehrszeichenkatalog (VzKat) bzw. der StVO sind als amtliche Werke gemeinfrei (§ 5 Abs. 1 UrhG). Dateien: Wikimedia Commons, Lizenzvorlagen PD-VzKat bzw. PD-Vz historisch (nur Zeichen, die im aktuellen VzKat-Satz 2017 weiterhin geführt werden).',
    quelle='https://commons.wikimedia.org/wiki/Category:SVG_road_signs_in_Germany',
    abgerufen=time.strftime('%Y-%m-%d'),
    kategorien=['Gefahrzeichen', 'Vorschriftzeichen', 'Richtzeichen', 'Markierungen', 'Verkehrseinrichtungen', 'Zusatzzeichen'],
    schilder=schilder)
json.dump(manifest, open(os.path.join(OUT, 'signs.json'), 'w'), ensure_ascii=False, indent=1)
json.dump(skipped, open('/tmp/commons_skipped.json', 'w'), ensure_ascii=False, indent=1)
print('Heruntergeladen:', len(schilder)); print(collections.Counter(s['kategorie'] for s in schilder)); print('Übersprungen:', dict(skip))
