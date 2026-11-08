#!/usr/bin/env python3
"""一次性：把 V11 抽出的資料轉成 content/points.json（之後直接手改 points.json）。"""
import json, re, pathlib
ROOT = pathlib.Path(__file__).resolve().parent.parent
EX = ROOT / "research" / "extract"
m = json.loads((EX / "v11_dump.json").read_text())
v = json.loads((EX / "valley_rows.json").read_text())

REGIONS = ["悲泣溪谷", "血色森林", "陸家村", "龐鎮", "正道大營", "梅谷湖", "枷籠山", "戲夢山莊", "斷魂山"]

# 名稱修正（依中文攻略用語；見 research/2026-11-08_查核報告.md）
FIX = [
    (r"守門人周[壁弼]|周[壁弼]", "守門人拙壁"), (r"斧主彭猛", "斧老大彭猛"), (r"扭曲傀儡雨叢|雨叢|虞聰", "混沌魔偶玉琮"),
    (r"石手鐵狂|鐵手(?!套)", "拳癡鐵狂"), (r"傀儡師暮", "操偶師蕩穢"), (r"烈火隊長", "鬼差隊長火流星"),
    (r"吳玄", "墮落將軍武軒"), (r"古婉月", "女妖骨婉約"), (r"常弘", "雷槍長鴻"),
    (r"舞獅尊主焰|焰獅宗師", "舞獅尊主烈焰"), (r"奪魂影衛", "鬼差高手勾魂"), (r"碎擊者", "力者"),
    (r"七星劍陣首徒", "七星劍陣大師兄"), (r"銅鎚萬鈞", "巨錘客萬鈞"), (r"[吳武]冷霜", "烏冷霜"),
    (r"秋風", "囚鋒"), (r"冷圖", "冷荼"), (r"鐵屠夫", "鐵殺"), (r"畢元", "畢遠"), (r"畢海", "碧海"),
    (r"清剿宗門", "清理門戶"), (r"斬草除根", "一個不留"), (r"妙手委託", "妙手空空"),
    (r"不[滅朽]英魂", "不滅俠膽"), (r"《名伶》|名伶支線", "《頭牌花旦》"), (r"方盒", "方塊"),
    (r"兄弟重聚", "再會兄長"), (r"骨肉相爭", "相煎何急"), (r"母親之心", "慈母心"),
    (r"英雄崇拜者薛|崇拜大俠小雪", "崇拜大俠的小雪"), (r"暗門之女", "魔教之女"), (r"別忘記我", "勿相忘"),
    (r"大刀支線|《巨刀》", "《橫刀》支線"), (r"贖罪帳簿", "贖罪名單"), (r"白雪(?!兒)", "白雪兒"),
    (r"拳之心", "拳心"), (r"白山祕聞", "白山秘聞"), (r"傀儡木心", "人偶木心"), (r"大荒", "大黃"),
    (r"「崔」|崔的任務|崔支線", "「小翠」"), (r"(?<![一-鿿])崔(?=[\s，、的支（])", "小翠"),
    (r"腐朽隱情", "腐敗祕聞"), (r"常虹", "雷槍長鴻"), (r"影衛隊長焰", "鬼差隊長火流星"), (r"炎如", "炎茹"),
    (r"朱淵", "火刀祝原"), (r"顏千歲", "煙千歲"), (r"悲傷的金姓敵人", "悲痛欲絕的阿瑾"), (r"寒髓", "寒歲"),
    (r"玉面（", "玉面郎君（"), (r"(墮落將軍)+", "墮落將軍"), (r"(雷槍)+", "雷槍"), (r"(鬼差隊長)+", "鬼差隊長"),
    (r"(守門人)+", "守門人"), (r"(混沌魔偶)+", "混沌魔偶"), (r"(拳癡)+", "拳癡"), (r"哀嚎魅影", ""),
    (r"《劍與道》", "《道劍佛心》"), (r"《名角》|名角前置", "《頭牌花旦》"), (r"《兄弟再會》", "《再會兄長》"),
    (r"《骨肉相殘》", "《相煎何急》"), (r"小小姐", "大小姐（少主）"), (r"「大刀」", "「橫刀」"), (r"使者幻境", "夢差幻境"),
    (r"天玄派畢遠", "天玄派畢遠掌門殘軀"), (r"苦葉寺碧海", "苦葉寺碧海大師殘軀"),
]
def fix(s):
    for a, b in FIX: s = re.sub(a, b, s)
    return s

def norm_type(t, hint, en):
    s = t + " " + (en or "")
    for k, out in [("Boss", "Boss"), ("鈴鐺", "鈴鐺"), ("Bell", "鈴鐺"), ("記憶", "記憶之花"), ("黑石", "黑石碎片"),
                   ("琥珀", "殺氣琥珀"), ("殺氣", "殺氣琥珀"), ("影之武裝", "影之武裝"), ("Phantom Edge", "影之武裝"),
                   ("鑄魂", "鑄魂材料"), ("材料", "鑄魂材料"), ("支線", "支線"), ("線索", "支線"), ("任務", "支線"),
                   ("飾品", "飾品"), ("秘藥", "秘藥"), ("藥", "秘藥"), ("寶藏", "寶藏"), ("挑戰", "挑戰"), ("武器", "武器")]:
        if k in s: return out
    if t == "碎片": return "黑石碎片" if "黑石" in hint else "殺氣琥珀"
    return "道具"

out = {}
rows = [("悲泣溪谷", "valley", v["rows"])] + [(REGIONS[i + 1], None, r["rows"]) for i, r in enumerate(m["regions"][2:])]
for reg, keyp, rs in rows:
    lst = []
    for r in rs:
        en = (r.get("en") or "").replace(" – MISSABLE", "").strip()
        hint = fix(r["hint"])
        zh = r.get("zh", "")
        if zh in ("⚠ 易錯過／異常", "鈴鐺", "記憶之花", "黑石碎片", "殺氣琥珀碎片") : zh = ""
        p = {"n": r["n"], "type": norm_type(r["type"], hint, en), "zh": fix(zh), "en": en, "hint": hint}
        if r.get("miss") or "【限時】" in hint or "易錯過" in hint or "截止" in hint: p["miss"] = True
        if re.search(r"寶箱|開箱|箱中|箱內|箱子|箱取|箱拿|箱領", hint): p["chest"] = True
        if re.search(r"擊敗|打倒|Boss", hint) and p["type"] in ("Boss", "武器", "影之武裝", "鑄魂材料", "飾品"): p["fight"] = True
        lst.append(p)
    out[reg] = {"key": keyp or f"v2:{reg}", "points": lst}

dst = ROOT / "content" / "points.json"
dst.parent.mkdir(exist_ok=True)
dst.write_text(json.dumps(out, ensure_ascii=False, indent=1))
print({k: len(v["points"]) for k, v in out.items()}, sum(len(v["points"]) for v in out.values()))
print("chests", sum(1 for v in out.values() for p in v["points"] if p.get("chest")))
