# 影之刃零 全流程攻略本（PWA）

網址：https://keyw007.github.io/pbz-guide/

依劇情順序的攻略本：每章依路線列出鈴鐺、寶箱、收集品、支線接取與交付、Boss 打法與不可逆警告；後期解鎖的回訪點放在可以拿的時間點。可安裝、可離線、勾選進度存在裝置上。

```
content/
  chapters.md   ← 路線（章節、段落、提示、警告、勾選步驟、要插入的點位範圍）
  points.json   ← 612 個點位（PowerPyx 各區編號；中文路線說明）
  bosses.json   ← Boss（位置、HP、打法、掉落、來源）
  quests.json   ← 支線與迷局（接取點、截止、步驟）
app/            ← 介面：index.html、app.css、app.js
pwa/            ← App 外殼：安裝、更新提示、進度備份、離線快取
build.py        ← 打包＋內容檢查 → docs/
research/       ← 查核報告與原始抽取資料
legacy/v11.html ← 舊版（ChatGPT 製作的 V11）
tools/          ← 一次性工具（extract_points.py 會覆蓋 points.json，勿再執行）
```

## 更新攻略
1. 改 `content/` 裡的檔案（`chapters.md` 開頭有語法說明）
2. `python3 build.py` → 會檢查每個點位剛好出現一次、Boss／支線位置都存在，有錯會列出
3. `git add -A && git commit -m "更新攻略" && git push` → GitHub Pages 約 1 分鐘後上線
4. 已安裝的 App 下次開啟會跳出「攻略本有新版本」

勾選存在 `localStorage` 的 `pbz_book_checks`。點位的鍵沿用 V11（`valley:N`、`v2:區域:N`），所以舊進度不會遺失。

## 本機預覽
`python3 -m http.server 8765 -d docs` → http://localhost:8765
