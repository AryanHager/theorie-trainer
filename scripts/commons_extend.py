"""Ergänzt die Kandidatenliste um alle Dateien aus den '..., 2017 set'-Kategorien (aktueller VzKat-Stand)."""
import json, time, collections
from commons_tree import api, members
info = json.load(open('/tmp/commons_info.json')); tpl = json.load(open('/tmp/commons_tpl.json'))
sets = sorted({c['title'] for p in info.values() for c in p.get('categories', []) if c['title'].endswith('2017 set') and 'Germany' in c['title']})
print(sets)
neu = set()
for c in sets:
    for m in members(c):
        if m['ns'] == 6 and m['title'] not in info and m['title'].lower().endswith('.svg'): neu.add(m['title'])
    time.sleep(0.3)
neu = list(neu); print('neu:', len(neu))
WANT = 'Template:PD-VzKat|Template:PD-GermanGov|Template:PD-Vz historisch|Template:CC-zero|Template:PD-self|Template:PD-shape'
for i in range(0, len(neu), 50):
    d = api(action='query', prop='imageinfo|categories', titles='|'.join(neu[i:i+50]), iiprop='url|extmetadata|size|mime', cllimit='max')
    for p in d['query']['pages']: info[p['title']] = p
    cont = {}
    while True:
        d = api(action='query', prop='templates', titles='|'.join(neu[i:i+50]), tllimit='max', tltemplates=WANT, **cont)
        for p in d['query']['pages']: tpl.setdefault(p['title'], []); tpl[p['title']] += [t['title'] for t in p.get('templates', [])]
        if 'continue' not in d: break
        cont = d['continue']; time.sleep(0.3)
    time.sleep(0.5)
json.dump(info, open('/tmp/commons_info.json', 'w')); json.dump(tpl, open('/tmp/commons_tpl.json', 'w'))
print('gesamt', len(info))
