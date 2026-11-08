#!/usr/bin/env python3
"""影之刃零攻略本 V12：把 content/ 的資料＋app/ 的介面打包成 PWA，輸出到 docs/（GitHub Pages）。

更新流程：
  1. 改 content/ 下的資料：chapters.md（路線）、points.json（612 點位）、bosses.json、quests.json
  2. python3 build.py   ← 會檢查每個點位剛好出現一次、Boss／支線引用都存在
  3. git add -A && git commit -m "更新攻略" && git push
"""
import hashlib, json, math, re, struct, zlib, datetime, pathlib, sys

ROOT = pathlib.Path(__file__).resolve().parent
APP, CONTENT, PWA, OUT = ROOT / "app", ROOT / "content", ROOT / "pwa", ROOT / "docs"

NAME = "影之刃零 全流程攻略本"
SHORT = "影之刃零攻略"
THEME, BG = "#141a21", "#101318"


# ---------- 圖示（純 Python 繪製，不需 PIL） ----------
def png(path, w, h, px):
    raw = b"".join(b"\x00" + bytes(px[y * w * 4:(y + 1) * w * 4]) for y in range(h))
    def chunk(t, d): return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t + d) & 0xffffffff)
    path.write_bytes(b"\x89PNG\r\n\x1a\n" + chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
                     + chunk(b"IDAT", zlib.compress(raw, 9)) + chunk(b"IEND", b""))

def inside(poly, x, y):
    s = 0
    for (x1, y1), (x2, y2) in zip(poly, poly[1:] + poly[:1]):
        c = (x2 - x1) * (y - y1) - (y2 - y1) * (x - x1)
        if c != 0:
            if s == 0: s = 1 if c > 0 else -1
            elif (c > 0) != (s > 0): return False
    return True

def render_icon(size, maskable):
    S = size * 2  # 2x 超取樣後縮小，邊緣平滑
    k = 0.78 if maskable else 1.0  # maskable 圖示主體縮進安全區
    def T(p): return [((0.5 + (x - 0.5) * k) * S, (0.5 + (y - 0.5) * k) * S) for x, y in p]
    blade = T([(0.2515, 0.763), (0.2885, 0.797), (0.79, 0.245), (0.84, 0.16), (0.765, 0.215)])  # 刀身
    edge = T([(0.270, 0.780), (0.2885, 0.797), (0.79, 0.245), (0.84, 0.16)])                    # 刃光
    guard = T([(0.216, 0.705), (0.35, 0.825), (0.324, 0.855), (0.19, 0.735)])                   # 護手
    grip = T([(0.257, 0.769), (0.283, 0.791), (0.169, 0.917), (0.143, 0.895)])                  # 刀柄
    sun = ((0.5 + 0.12 * k) * S, (0.5 - 0.12 * k) * S, 0.25 * k * S)
    rad = 0.0 if maskable else 0.22 * S
    buf = bytearray(S * S * 4)
    for y in range(S):
        for x in range(S):
            a = 255
            if rad:  # 圓角外框
                cx = min(max(x, rad), S - rad); cy = min(max(y, rad), S - rad)
                if (x - cx) ** 2 + (y - cy) ** 2 > rad * rad: a = 0
            d = math.hypot(x - S * 0.7, y - S * 0.3) / S
            g = max(0.0, 1 - d * 1.6)
            r, gg, b = 16 + 60 * g, 19 + 34 * g, 24 + 25 * g
            ds = math.hypot(x - sun[0], y - sun[1])
            if ds < sun[2]: r, gg, b = 150, 42, 38
            elif ds < sun[2] * 1.05: r, gg, b = 110, 35, 32
            if inside(grip, x, y): r, gg, b = 74, 52, 38
            if inside(guard, x, y): r, gg, b = 181, 140, 88
            if inside(blade, x, y): r, gg, b = 215, 172, 114
            if inside(edge, x, y): r, gg, b = 245, 225, 190
            i = (y * S + x) * 4
            buf[i:i + 4] = bytes((int(r), int(gg), int(b), a))
    out = bytearray(size * size * 4)
    for y in range(size):
        for x in range(size):
            acc = [0, 0, 0, 0]
            for dy in (0, 1):
                for dx in (0, 1):
                    i = ((2 * y + dy) * S + 2 * x + dx) * 4
                    for c in range(4): acc[c] += buf[i + c]
            out[(y * size + x) * 4:(y * size + x) * 4 + 4] = bytes(v // 4 for v in acc)
    return out

def scale(src, s, d):
    out = bytearray(d * d * 4)
    for y in range(d):
        for x in range(d):
            si = (int(y * s / d) * s + int(x * s / d)) * 4
            out[(y * d + x) * 4:(y * d + x) * 4 + 4] = src[si:si + 4]
    return out

SVG = """<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><defs><radialGradient id="g" cx=".7" cy=".3" r=".7"><stop offset="0" stop-color="#4b3631"/><stop offset="1" stop-color="#101318"/></radialGradient></defs><rect width="100" height="100" rx="22" fill="url(#g)"/><circle cx="62" cy="38" r="25" fill="#962a26"/><path d="M25.7 76.9l2.6 2.2-11.4 12.6-2.6-2.2z" fill="#4a3426"/><path d="M25.15 76.3l3.7 3.4L79 24.5l5-8.5-7.5 5.5z" fill="#d7ac72"/><path d="M27 78l1.85 1.7L79 24.5l5-8.5z" fill="#f5e1be"/><path d="M21.6 70.5L35 82.5l-2.6 3L19 73.5z" fill="#b58c58"/></svg>"""

def make_icons(d):
    d.mkdir(parents=True, exist_ok=True)
    (d / "icon.svg").write_text(SVG)
    if (d / "icon-512.png").exists() and (d / "icon-maskable-512.png").exists() and "--icons" not in sys.argv:
        return  # 圖示已存在就跳過（加 --icons 強制重畫）
    print("繪製圖示中（約 30 秒）…")
    big = render_icon(512, False)
    png(d / "icon-512.png", 512, 512, big)
    png(d / "icon-192.png", 192, 192, scale(big, 512, 192))
    mk = render_icon(512, True)
    png(d / "icon-maskable-512.png", 512, 512, mk)
    png(d / "apple-touch-icon.png", 180, 180, scale(mk, 512, 180))  # iOS 不吃透明，用滿版


# ---------- 內容解析與檢查 ----------
def parse_chapters(text, points):
    text = re.sub(r"<!--.*?-->", "", text, flags=re.S)
    chapters, ch, seg, errs, seen = [], None, None, [], {}
    for ln, raw in enumerate(text.splitlines(), 1):
        line = raw.strip()
        if not line: continue
        if line.startswith("# "):
            cid, title, en = [x.strip() for x in line[2:].split("|")]
            short = "序章" if title.startswith("序章") else (title.split("：", 1)[1] if "：" in title else title)
            num = cid[2:]
            ch = {"id": cid, "title": title, "en": en, "short": short, "intro": [], "segs": [],
                  "navTitle": num + " " + ("序章" if title.startswith("序章") else (title.split("：", 1)[1] if "：" in title else title))}
            chapters.append(ch); seg = None; continue
        if ch is None: errs.append(f"第 {ln} 行：章節標題之前有內容"); continue
        tgt = seg["blocks"] if seg else ch["intro"]
        if line.startswith("## "):
            seg = {"title": line[3:].strip(), "blocks": []}; ch["segs"].append(seg); continue
        if line.startswith("@ "):
            m = re.match(r"@ (\S+) (\d+)-(\d+)$", line)
            if not m or m.group(1) not in points: errs.append(f"第 {ln} 行：點位語法錯誤 {line}"); continue
            r, a, b = m.group(1), int(m.group(2)), int(m.group(3))
            ns = {p["n"] for p in points[r]["points"]}
            for n in range(a, b + 1):
                if n not in ns: errs.append(f"第 {ln} 行：{r} 沒有 #{n}")
                if (r, n) in seen: errs.append(f"第 {ln} 行：{r} #{n} 重複（第 {seen[(r, n)]} 行已出現）")
                seen[(r, n)] = ln
            tgt.append({"t": "pts", "r": r, "a": a, "b": b}); continue
        if line.startswith("! "): tgt.append({"t": "warn", "s": line[2:]}); continue
        if line.startswith("> "): tgt.append({"t": "tip", "s": line[2:]}); continue
        if line.startswith("- [ ] "):
            s_ = line[6:]; tgt.append({"t": "step", "s": s_, "k": f"v12:s:{ch['id']}:{hashlib.sha1(s_.encode()).hexdigest()[:6]}"}); continue
        tgt.append({"t": "p", "s": line})
    for r, v in points.items():
        for p in v["points"]:
            if (r, p["n"]) not in seen: errs.append(f"遺漏：{r} #{p['n']} 沒有放進任何章節")
    return chapters, errs

def load_guide():
    points = json.loads((CONTENT / "points.json").read_text(encoding="utf-8"))
    bosses = json.loads((CONTENT / "bosses.json").read_text(encoding="utf-8"))
    quests = json.loads((CONTENT / "quests.json").read_text(encoding="utf-8"))
    trophies = json.loads((CONTENT / "trophies.json").read_text(encoding="utf-8"))
    chapters, errs = parse_chapters((CONTENT / "chapters.md").read_text(encoding="utf-8"), points)
    ref = lambda s: (lambda r, n: r in points and any(p["n"] == int(n) for p in points[r]["points"]))(*s.split(":"))
    shorts = {c["short"] for c in chapters}
    for b in bosses:
        if b.get("at") and not ref(b["at"]): errs.append(f"Boss {b['id']}：找不到位置 {b['at']}")
        if not b.get("at") and b.get("ch") not in shorts: errs.append(f"Boss {b['id']}：ch「{b.get('ch')}」不是章節名")
    for q in quests:
        if q.get("start") and not ref(q["start"]): errs.append(f"支線 {q['id']}：找不到接取點 {q['start']}")
    ids = [b["id"] for b in bosses] + [q["id"] for q in quests]
    for d in {x for x in ids if ids.count(x) > 1}: errs.append(f"id 重複：{d}")
    if errs:
        print("內容檢查失敗：\n  " + "\n  ".join(errs)); sys.exit(1)
    for t in trophies:
        if t.get("boss") and t["boss"] not in {b["id"] for b in bosses}: errs.append(f"獎盃 {t['en']}：找不到 Boss {t['boss']}")
    if errs:
        print("內容檢查失敗：\n  " + "\n  ".join(errs)); sys.exit(1)
    return {"chapters": chapters, "points": points, "bosses": bosses, "quests": quests, "trophies": trophies}


# ---------- 組裝 ----------
def main():
    guide = load_guide()
    css, js, sw = [(PWA / f).read_text(encoding="utf-8") for f in ("pwa.css", "pwa.js", "sw.js")]
    tpl, acss, ajs = [(APP / f).read_text(encoding="utf-8") for f in ("index.html", "app.css", "app.js")]
    gjson = json.dumps(guide, ensure_ascii=False, separators=(",", ":"))
    digest = hashlib.sha256((tpl + acss + ajs + gjson + css + js + sw + SVG).encode()).hexdigest()[:7]
    version = f"{datetime.date.today():%Y.%m.%d}-{digest}"
    guide["meta"] = {"version": version, "date": f"{datetime.date.today():%Y-%m-%d}"}
    gjson = json.dumps(guide, ensure_ascii=False, separators=(",", ":")).replace("</", "<\\/")
    html = tpl.replace("/*APP_CSS*/", acss).replace("/*GUIDE_JSON*/", gjson).replace("/*APP_JS*/", ajs)

    head = f"""<meta name="theme-color" content="{THEME}"/>
<meta name="description" content="影之刃零 PS5 全流程攻略：依劇情一次拿完，九區路線、收集、Boss 打法、白金獎盃，可離線閱讀"/>
<link rel="manifest" href="manifest.webmanifest"/>
<link rel="icon" href="icons/icon.svg" type="image/svg+xml"/>
<link rel="apple-touch-icon" href="icons/apple-touch-icon.png"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="{SHORT}"/>
<style id="pwa-css">{css}</style>"""
    html = html.replace('content="width=device-width, initial-scale=1"', 'content="width=device-width, initial-scale=1, viewport-fit=cover"', 1)
    html, n = re.subn(r"</head>", head + "</head>", html, count=1)
    if not n: sys.exit("找不到 </head>，無法注入")
    idx = html.rfind("</body>")
    if idx < 0: sys.exit("找不到 </body>，無法注入")
    html = html[:idx] + f'<script id="pwa-js">{js.replace("__APP_VERSION__", version)}</script>' + html[idx:]

    OUT.mkdir(exist_ok=True)
    make_icons(OUT / "icons")
    (OUT / "index.html").write_text(html, encoding="utf-8")
    (OUT / "sw.js").write_text(sw.replace("__APP_VERSION__", version), encoding="utf-8")
    (OUT / ".nojekyll").write_text("")
    manifest = {
        "name": NAME, "short_name": SHORT, "id": "./", "start_url": "./", "scope": "./",
        "display": "standalone", "orientation": "any", "lang": "zh-Hant",
        "background_color": BG, "theme_color": THEME,
        "description": "九區路線、收集、Boss 詳解、地圖對照，可離線閱讀與勾選進度",
        "categories": ["games", "entertainment"],
        "icons": [
            {"src": "icons/icon-192.png", "sizes": "192x192", "type": "image/png"},
            {"src": "icons/icon-512.png", "sizes": "512x512", "type": "image/png"},
            {"src": "icons/icon-maskable-512.png", "sizes": "512x512", "type": "image/png", "purpose": "maskable"},
            {"src": "icons/icon.svg", "sizes": "any", "type": "image/svg+xml"},
        ],
    }
    (OUT / "manifest.webmanifest").write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding="utf-8")
    print(f"完成 → docs/   版本 {version}")


if __name__ == "__main__":
    main()
