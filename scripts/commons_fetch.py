"""Lädt aktuelle deutsche Verkehrszeichen (SVG) von Wikimedia Commons.
Nur Dateien mit Public-Domain-Lizenz (PD-VzKat o. ä. PD/CC0). Höflich: User-Agent, Pausen."""
import json, time, re, os, sys, html, urllib.request, urllib.parse
from commons_tree import api, members, UA

CATS = {
    "Category:SVG warning road signs of Germany": "Gefahrzeichen",
    "Category:SVG priority road signs of Germany": "Vorschriftzeichen",
    "Category:SVG prohibitory road signs of Germany": "Vorschriftzeichen",
    "Category:SVG mandatory road signs of Germany": "Vorschriftzeichen",
    "Category:SVG additional road signs of Germany": "Zusatzzeichen",
    "Category:SVG road signs in Germany": None,  # Rest: nach Nummer einsortieren
}
OUT = "public/signs"; os.makedirs(OUT, exist_ok=True)
files = {}
for cat, kat in CATS.items():
    for m in members(cat):
        if m["ns"] == 6 and m["title"] not in files: files[m["title"]] = kat
    time.sleep(0.3)
print("Dateien gesamt:", len(files), file=sys.stderr)

def strip(s): return html.unescape(re.sub(r"<[^>]+>", "", s or "")).strip()
info = {}
titles = list(files)
for i in range(0, len(titles), 50):
    d = api(action="query", prop="imageinfo|categories", titles="|".join(titles[i:i+50]), iiprop="url|extmetadata|size|mime", cllimit="max")
    for p in d["query"]["pages"]:
        info[p["title"]] = p
    time.sleep(0.5)
json.dump(info, open("/tmp/commons_info.json", "w"))
print("Metadaten geladen", len(info), file=sys.stderr)
