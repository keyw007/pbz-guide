/* 影之刃零攻略本 Service Worker — 版本由 build.py 寫入，內容一變就會觸發更新 */
const VERSION='2026.11.08-a325a2c';
const CACHE='pbz-guide-'+VERSION;
const ASSETS=['./','./index.html','./manifest.webmanifest','./icons/icon-192.png','./icons/icon-512.png','./icons/icon-maskable-512.png','./icons/apple-touch-icon.png','./icons/icon.svg'];

self.addEventListener('install',e=>{
  e.waitUntil(caches.open(CACHE).then(c=>c.addAll(ASSETS.map(u=>new Request(u,{cache:'reload'})))));
});
self.addEventListener('activate',e=>{
  e.waitUntil(caches.keys().then(ks=>Promise.all(ks.filter(k=>k.startsWith('pbz-guide-')&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));
});
self.addEventListener('message',e=>{if(e.data==='SKIP_WAITING')self.skipWaiting()});

self.addEventListener('fetch',e=>{
  const req=e.request;
  if(req.method!=='GET')return;
  const url=new URL(req.url);
  if(url.origin!==location.origin)return; // 外部來源連結直接走網路
  // 頁面：用目前版本快取（穩定、離線可用），新版本由 SW 更新流程帶入
  if(req.mode==='navigate'){
    e.respondWith(caches.match('./index.html',{cacheName:CACHE}).then(r=>r||fetch(req)));
    return;
  }
  e.respondWith(caches.match(req,{ignoreSearch:true}).then(r=>r||fetch(req)));
});
