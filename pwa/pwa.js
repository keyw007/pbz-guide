/* ===== PWA 外殼腳本（由 build.py 注入，__APP_VERSION__ 會被替換） ===== */
(function(){
  const VERSION='__APP_VERSION__';
  const KEY='pbz_book_checks';
  const side=document.querySelector('.sidebar');
  if(!side) return;

  // --- 側欄工具盒 ---
  const box=document.createElement('div');
  box.className='pwa-box no-print';
  box.innerHTML=`
    <div><span class="pwa-net" id="pwaNet">● 已連線</span></div>
    <div class="pwa-row">
      <button class="pwa-btn gold" id="pwaInstall" hidden>⬇ 安裝 App</button>
      <button class="pwa-btn" id="pwaCheck">檢查更新</button>
    </div>
    <div class="pwa-ios" id="pwaIos">iPhone／iPad：Safari 分享 ⎋ →「加入主畫面」</div>
    <div class="pwa-row">
      <button class="pwa-btn" id="pwaExport">匯出進度</button>
      <button class="pwa-btn" id="pwaImport">匯入進度</button>
      <input type="file" id="pwaFile" accept="application/json,.json" hidden>
    </div>
    <div class="pwa-ver">版本 ${VERSION}</div>`;
  side.appendChild(box);

  const brand=side.querySelector('.brand');
  if(brand){
    const m=document.createElement('button');
    m.className='pwa-menu no-print';m.textContent='⚙︎';m.title='App 設定';
    m.onclick=()=>side.classList.toggle('pwa-open');
    brand.appendChild(m);
  }

  // --- 網路狀態 ---
  const net=document.getElementById('pwaNet');
  const setNet=()=>{const on=navigator.onLine;net.textContent=on?'● 已連線':'● 離線模式（可正常閱讀）';net.classList.toggle('off',!on)};
  addEventListener('online',setNet);addEventListener('offline',setNet);setNet();

  // --- 安裝 ---
  let deferred=null;const ib=document.getElementById('pwaInstall');
  addEventListener('beforeinstallprompt',e=>{e.preventDefault();deferred=e;ib.hidden=false});
  ib.onclick=async()=>{if(!deferred)return;deferred.prompt();await deferred.userChoice;deferred=null;ib.hidden=true};
  const standalone=matchMedia('(display-mode: standalone)').matches||navigator.standalone;
  if(/iphone|ipad|ipod/i.test(navigator.userAgent)&&!standalone) document.getElementById('pwaIos').style.display='block';

  // --- 進度匯出／匯入（換裝置、換網址時用） ---
  document.getElementById('pwaExport').onclick=()=>{
    const data={app:'pbz-guide',version:VERSION,exported:new Date().toISOString(),checks:JSON.parse(localStorage.getItem(KEY)||'{}')};
    const a=document.createElement('a');
    a.href=URL.createObjectURL(new Blob([JSON.stringify(data,null,1)],{type:'application/json'}));
    a.download=`影之刃零進度_${new Date().toISOString().slice(0,10)}.json`;a.click();
    setTimeout(()=>URL.revokeObjectURL(a.href),2000);
  };
  const file=document.getElementById('pwaFile');
  document.getElementById('pwaImport').onclick=()=>file.click();
  file.onchange=async()=>{
    const f=file.files[0];if(!f)return;
    try{
      const d=JSON.parse(await f.text());const inc=d.checks||d;
      if(typeof inc!=='object')throw 0;
      const cur=JSON.parse(localStorage.getItem(KEY)||'{}');
      const n=Object.keys(inc).length;
      if(!confirm(`匯入 ${n} 筆進度，與目前進度合併？`))return;
      localStorage.setItem(KEY,JSON.stringify(Object.assign(cur,inc)));
      location.reload();
    }catch(e){alert('檔案格式不正確')}
    file.value='';
  };

  // --- Service Worker 與更新提示 ---
  if(!('serviceWorker' in navigator)||location.protocol==='file:') {box.querySelector('#pwaCheck').hidden=true;return;}
  const toast=document.createElement('div');toast.className='pwa-toast no-print';
  toast.innerHTML='<span>攻略本有新版本</span><button class="pwa-btn gold">立即更新</button>';
  document.body.appendChild(toast);
  let waiting=null,reloading=false;
  const showUpdate=w=>{waiting=w;toast.classList.add('show')};
  toast.querySelector('button').onclick=()=>{if(waiting)waiting.postMessage('SKIP_WAITING')};
  navigator.serviceWorker.addEventListener('controllerchange',()=>{if(reloading)return;reloading=true;location.reload()});

  navigator.serviceWorker.register('./sw.js').then(reg=>{
    if(reg.waiting&&navigator.serviceWorker.controller) showUpdate(reg.waiting);
    reg.addEventListener('updatefound',()=>{
      const nw=reg.installing;
      nw.addEventListener('statechange',()=>{if(nw.state==='installed'&&navigator.serviceWorker.controller)showUpdate(nw)});
    });
    const chk=document.getElementById('pwaCheck');
    chk.onclick=async()=>{chk.textContent='檢查中…';try{await reg.update()}catch(e){}
      setTimeout(()=>{chk.textContent=(reg.waiting||reg.installing)?'有新版本':'已是最新';setTimeout(()=>chk.textContent='檢查更新',2500)},1200)};
    // 從背景回到 App 時自動檢查
    document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='visible')reg.update().catch(()=>{})});
  });
})();
