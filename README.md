# 影之刃零 全流程攻略本 — PWA

```
src/guide.html   ← 攻略本內容（唯一要改的地方）
pwa/             ← App 外殼：pwa.css、pwa.js（安裝／更新提示／進度備份）、sw.js（離線快取）
build.py         ← 打包腳本
docs/            ← 輸出，整個資料夾就是網站（可直接放 GitHub Pages）
```

## 更新攻略
1. 用新版 HTML 覆蓋 `src/guide.html`（或直接改）
2. `python3 build.py` → 自動產生新版本號（日期＋內容雜湊）
3. 上傳 `docs/`
4. 已安裝的手機／電腦 App 下次開啟（或從背景切回）會跳出「攻略本有新版本 · 立即更新」

勾選進度存在裝置本機（`pbz_book_checks`），更新不會清掉。換裝置可用側欄「匯出／匯入進度」。

## 本機預覽
`python3 -m http.server 8765 -d docs` → http://localhost:8765

## 安裝
PWA 需 HTTPS 網址才能安裝（localhost 除外）。
- Android / 電腦 Chrome、Edge：側欄「⬇ 安裝 App」或網址列的安裝圖示
- iPhone / iPad：Safari → 分享 →「加入主畫面」
