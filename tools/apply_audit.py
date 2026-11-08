#!/usr/bin/env python3
"""把 research/audit/fix_<區域>.json 的校對結果套進 content/points.json。
每筆：{"n":編號, "level":"WRONG|MINOR", "fixed":"新的說明", "type":(選填) 新類型}
會保留原本的 miss 標記；說明含【限時】或易錯過字樣時自動加上 miss。"""
import json, pathlib, re
ROOT = pathlib.Path(__file__).resolve().parent.parent
P = ROOT / "content" / "points.json"
d = json.loads(P.read_text(encoding="utf-8"))
stats = {}
for f in sorted((ROOT / "research" / "audit").glob("fix_*.json")):
    region = f.stem[4:]
    if region not in d:
        print("略過：未知區域", region); continue
    pts = {p["n"]: p for p in d[region]["points"]}
    w = m = 0
    for x in json.loads(f.read_text(encoding="utf-8")):
        p = pts.get(x["n"])
        if not p or not x.get("fixed"): print(f"略過 {region} #{x.get('n')}"); continue
        p["hint"] = x["fixed"].strip()
        if x.get("type"): p["type"] = x["type"]
        if re.search(r"【限時】|易錯過|截止", p["hint"]): p["miss"] = True
        p["audited"] = x["level"]
        if x["level"] == "WRONG": w += 1
        else: m += 1
    stats[region] = (w, m)
P.write_text(json.dumps(d, ensure_ascii=False, indent=1), encoding="utf-8")
for r, (w, m) in stats.items(): print(f"{r}: 修正 WRONG {w}、MINOR {m}")
