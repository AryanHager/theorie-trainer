import json, time, urllib.request, urllib.parse, sys
UA = "TheorieTrainer/0.1 (private non-commercial learning app prototype; https://commons.wikimedia.org/wiki/User_talk:)"
API = "https://commons.wikimedia.org/w/api.php"
def api(**p):
    p.update(format="json", formatversion="2")
    req = urllib.request.Request(API + "?" + urllib.parse.urlencode(p), headers={"User-Agent": UA})
    for i in range(5):
        try:
            with urllib.request.urlopen(req, timeout=30) as r: return json.load(r)
        except Exception as e:
            print("retry", e, file=sys.stderr); time.sleep(3 * (i + 1))
def members(cat):
    out, cont = [], {}
    while True:
        d = api(action="query", list="categorymembers", cmtitle=cat, cmlimit=500, cmtype="file|subcat", **cont)
        out += d["query"]["categorymembers"]
        if "continue" not in d: return out
        cont = d["continue"]; time.sleep(0.3)
def tree(cat, depth=0, seen=set()):
    if cat in seen or depth > 3: return
    seen.add(cat); m = members(cat); time.sleep(0.3)
    files = [x for x in m if x["ns"] == 6]; subs = [x["title"] for x in m if x["ns"] == 14]
    print("  " * depth + f"{cat} files={len(files)} subs={len(subs)}")
    for s in subs:
        if 'historic' in s.lower(): print("  " * (depth+1) + "SKIP " + s); continue
        tree(s, depth + 1, seen)
if __name__ == "__main__": tree("Category:SVG road signs in Germany")
