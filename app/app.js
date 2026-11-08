(function(){
'use strict';
const G=window.GUIDE, KEY='pbz_book_checks';
const SLUG={'悲泣溪谷':'weeping-creek-valley','血色森林':'crimson-forest','陸家村':'village-of-lu','龐鎮':'pangzhen','正道大營':'mandate-encampment','梅谷湖':'meigu-lake','枷籠山':'mountain-of-imprisonment','戲夢山莊':'mirage-estate-pangzhen','斷魂山':'mount-soulrend'};
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let S={};try{S=JSON.parse(localStorage.getItem(KEY)||'{}')}catch(e){}
const save=()=>{try{localStorage.setItem(KEY,JSON.stringify(S))}catch(e){}};
const filt={todo:false,miss:false};
try{Object.assign(filt,JSON.parse(localStorage.getItem('pbz_v12_filters')||'{}'))}catch(e){}

// ---- 索引 ----
const P={}; // 'region:n' -> point
for(const [r,v] of Object.entries(G.points)) for(const p of v.points){p.r=r;p.k=v.key+':'+p.n;P[r+':'+p.n]=p}
const bossAt={}, bossNoAt={};
G.bosses.forEach(b=>{if(b.at)(bossAt[b.at]=bossAt[b.at]||[]).push(b);else(bossNoAt[b.ch]=bossNoAt[b.ch]||[]).push(b)});
const qStart={};G.quests.forEach(q=>{if(q.start)(qStart[q.start]=qStart[q.start]||[]).push(q)});
const ptCh={}, bossCh={};
G.chapters.forEach(ch=>{ch.keys=[];const walk=bl=>bl.forEach(b=>{if(b.t==='pts')for(let n=b.a;n<=b.b;n++){const id=b.r+':'+n;ptCh[id]=ch.id;ch.keys.push(P[id].k);(bossAt[id]||[]).forEach(x=>bossCh[x.id]=ch.id)}else if(b.t==='step')ch.keys.push(b.k)});walk(ch.intro);ch.segs.forEach(s=>walk(s.blocks))});

const prog=keys=>{const d=keys.filter(k=>S[k]).length;return[d,keys.length]};
const bar=(d,n)=>`<div class="bar"><i style="width:${n?d/n*100:0}%"></i></div><div class="barlbl">${d} / ${n}</div>`;

// ---- 元件 ----
function bossCard(b){
  const tips=(b.tips||[]).map(t=>`<li>${esc(t)}</li>`).join('');
  return `<details class="boss" id="boss-${b.id}"><summary><span style="font-size:22px">⚔</span><span><div class="bt">${b.main?'主線 BOSS':'可選 BOSS'}${b.hp?' · HP '+esc(b.hp):''}</div><div class="bn">${esc(b.name)}</div><div class="be">${esc(b.en)}</div></span></summary><div class="bd">${tips?`<ul>${tips}</ul>`:''}${b.note?`<div class="todo">${esc(b.note)}</div>`:''}${b.reward?`<div class="meta">🎁 ${esc(b.reward)}</div>`:''}${(b.src||[]).length?`<div class="src">來源：${b.src.map((u,i)=>`<a href="${esc(u)}" target="_blank" rel="noopener">${i+1}</a>`).join(' ')}</div>`:''}<label class="meta" style="display:block;margin-top:8px"><input type="checkbox" data-k="v12:boss:${b.id}" ${S['v12:boss:'+b.id]?'checked':''}> 已擊敗</label></div></details>`;
}
function point(p){
  const id=p.r+':'+p.n, ok=!!S[p.k];
  const qs=(qStart[id]||[]).map(q=>`<span class="badge b-q" data-q="${q.id}">📜 ${esc(q.name)}</span>`).join('');
  const bellEn=p.type==='鈴鐺'?(p.en||'').replace(/^Bell \((.*)\).*$/,'$1'):'';
  const icon=p.type==='鈴鐺'?'🔔 ':'';
  const nameHtml=p.zh?esc(icon+p.zh)+(p.zhGuess?' <span class="badge guess">暫譯</span>':''):(bellEn?esc(icon+bellEn):'');
  return `${(bossAt[id]||[]).map(bossCard).join('')}<div class="pt${p.miss?' miss':''}${ok?' ok':''}" id="p-${esc(p.r)}-${p.n}" data-miss="${p.miss?1:0}"><input type="checkbox" data-k="${esc(p.k)}" ${ok?'checked':''} aria-label="${esc(p.r)} #${p.n}"><div><div class="top"><span class="num">${esc(p.r)} #${p.n}</span><span class="ty t-${esc(p.type)}">${esc(p.type)}</span>${p.chest?'<span class="badge b-chest">寶箱</span>':''}${p.miss?'<span class="badge b-miss">⚠ 易錯過</span>':''}${qs}${nameHtml?`<span class="nm">${nameHtml}</span>`:''}</div><div class="hint">${esc(p.hint)}</div><div class="en">${esc(p.en||'')}${p.en?' · ':''}<a href="${esc(p.link||`https://www.powerpyx.com/phantom-blade-zero-${SLUG[p.r]}-collectible-locations/`)}" target="_blank" rel="noopener">看原圖 #${p.n} ↗</a></div></div></div>`;
}
function block(b){
  switch(b.t){
    case 'p':return `<p class="p">${esc(b.s)}</p>`;
    case 'warn':return `<div class="warn">⚠ ${esc(b.s)}</div>`;
    case 'tip':return `<div class="tip">💡 ${esc(b.s)}</div>`;
    case 'step':return `<div class="step${S[b.k]?' ok':''}"><input type="checkbox" data-k="${esc(b.k)}" ${S[b.k]?'checked':''}><div>${esc(b.s)}</div></div>`;
    case 'pts':{let h='';for(let n=b.a;n<=b.b;n++)h+=point(P[b.r+':'+n]);return h}
  }return '';
}
function segKeys(s){const k=[];s.blocks.forEach(b=>{if(b.t==='pts')for(let n=b.a;n<=b.b;n++)k.push(P[b.r+':'+n].k);else if(b.t==='step')k.push(b.k)});return k}

// ---- 頁面 ----
const view=document.getElementById('view');
function chapterPage(ch){
  const i=G.chapters.indexOf(ch),[d,n]=prog(ch.keys);
  const extra=bossNoAt[ch.short]||[];
  let h=`<div class="kicker">${esc(ch.en)}</div><h1>${esc(ch.title)}</h1>${bar(d,n)}${ch.intro.map(block).join('')}${extra.map(bossCard).join('')}`;
  ch.segs.forEach((s,si)=>{const[a,b]=prog(segKeys(s));h+=`<section class="seg" id="${ch.id}-s${si}"><h2><span>${esc(s.title)}</span><span class="pc">${a}/${b}</span></h2>${s.blocks.map(block).join('')}</section>`});
  const prev=G.chapters[i-1],next=G.chapters[i+1];
  h+=`<div class="navbtns">${prev?`<button data-go="${prev.id}">← ${esc(prev.title)}</button>`:'<span></span>'}${next?`<button data-go="${next.id}">${esc(next.title)} →</button>`:''}</div>`;
  return h;
}
function bossPage(){
  let h=`<div class="kicker">BOSS INDEX</div><h1>Boss 圖鑑</h1><p class="p">依劇情順序。點名稱跳到攻略中的位置；「打法資料待補」表示目前找不到可靠的具體打法。HP 為 Pathbreaker 難度（allthings.how）。</p>`;
  const done=G.bosses.filter(b=>S['v12:boss:'+b.id]).length;h+=bar(done,G.bosses.length);
  let last='';G.chapters.forEach(ch=>{const bs=G.bosses.filter(b=>bossCh[b.id]===ch.id||(!b.at&&(b.ch===ch.short)));if(!bs.length)return;h+=`<section class="seg"><h2><span>${esc(ch.title)}</span></h2>${bs.map(b=>`<div data-jump="boss-${b.id}" data-ch="${ch.id}" class="res"><b>${esc(b.name)}</b> <small>${b.main?'主線':'可選'} · ${esc(b.en)}${S['v12:boss:'+b.id]?' · ✅':''}</small></div>`).join('')}</section>`});
  return h;
}
function questPage(){
  const cats=['異聞','收集','迷局'];
  let h=`<div class="kicker">TALES</div><h1>支線總表</h1><p class="p">中文名依遊民星空等中文攻略用語，括號為英文（PowerPyx）。「迷局」是真結局相關任務。PowerPyx 列 36 篇支線，其內文寫 32 篇，以遊戲日誌為準。</p>`;
  cats.forEach(c=>{const qs=G.quests.filter(q=>q.cat===c);h+=`<section class="seg"><h2><span>${c}${c==='迷局'?'（真結局）':''}</span><span class="pc">${qs.filter(q=>S['v12:q:'+q.id]).length}/${qs.length}</span></h2>`;
    qs.forEach(q=>{h+=`<div class="card" id="q-${q.id}"><label style="display:flex;gap:10px;align-items:flex-start"><input type="checkbox" data-k="v12:q:${q.id}" ${S['v12:q:'+q.id]?'checked':''}><span><h3>${esc(q.name)} <span class="en">${esc(q.en)}</span></h3></span></label>${q.start?`<div class="qcat">接取：<a href="#" data-jump="p-${esc(q.start.replace(':','-'))}" data-ch="${ptCh[q.start]}">${esc(q.start.replace(':',' #'))}</a></div>`:''}${q.miss?`<div class="warn">⚠ ${esc(q.miss)}</div>`:''}${q.note?`<div class="todo en">${esc(q.note)}</div>`:''}<ol>${(q.steps||[]).map(s=>`<li>${esc(s)}</li>`).join('')}</ol></div>`});h+='</section>'});
  return h;
}
function endingPage(){return `<div class="kicker">ENDINGS</div><h1>結局與真結局條件</h1>
<div class="warn">⚠ 中英文來源對結局條件的說法不一致。最保險的做法：<b>兩邊的條件都做完</b>，並在「青蛇屋往戲夢山莊前」與「最後的挽回之地鈴鐺」各留一個手動存檔。</div>
<section class="seg"><h2><span>英文來源（PowerPyx）</span></h2>
<p class="p">兩種結局：普通與真結局。真結局在普通最終 Boss 夢華之後追加左殤戰。</p>
<ol><li>進戲夢山莊（龐鎮青蛇屋往前）之前完成 10 個迷局任務：溪谷深處、虛空幻象、機關船、浮華引、幻術琵琶、崑崙三傑、泣聲何來、夢差幻境、紅房子、湖心秘密。</li><li>戲夢山莊完成第五根龍柱，結算「血脈覺醒」（五根龍柱全破）。</li><li>斷魂山「最後的挽回之地」鈴鐺之後鎖定結局。</li></ol></section>
<section class="seg"><h2><span>中文來源（phantombladezero.help／18183／OSLink）</span></h2>
<p class="p">結局在<b>挑戰夢差：冷荼時</b>決定：</p>
<table><tr><th>結局</th><th>條件</th></tr><tr><td>決戰（真結局）</td><td>完成湖心秘密（含與虛空對話）＋五根龍柱全勝</td></tr><tr><td>龍之咆哮／龍吟</td><td>完成湖心秘密，但龍柱未全勝</td></tr><tr><td>湮滅</td><td>未完成湖心秘密</td></tr><tr><td>飲恨</td><td>六十六天計時模式（NG+）時間用完</td></tr></table>
<p class="p">PBZH 列的九項前置：全部紫色任務、兩顆水晶人偶眼珠（紅房子、枷籠山）、4 個滅法面具（寒歲、炎茹、雷婷、古河）、修好幻術琵琶、血脈覺醒（第五龍柱對手魔淵）、眼珠放進梅谷湖鏡界、湖心秘密、妙手小張全線、擊敗夢華。</p>
<div class="tip">💡 OSLink 有一則說法是「清完五根龍柱可能鎖結局」，與其他來源矛盾，暫不採信。結局總數各來源也不同（2 種～製作人提過 8 種）。</div></section>
<section class="seg"><h2><span>兩個無法回頭的點</span></h2><ol><li>龐鎮青蛇屋鈴鐺附近選「決意繼續前進！」：進戲夢山莊，血色森林冰雪化，5 個鈴鐺永久關閉（需重開）。</li><li>戲夢山莊靈堂附近破牆前進：之後無法回其他區域，進入斷魂山。</li><li>斷魂山「最後的挽回之地」鈴鐺：鎖定結局路線。</li></ol></section>`}
function statsPage(){
  const regs=Object.keys(G.points);let h=`<div class="kicker">PROGRESS</div><h1>收集進度</h1><div class="grid">`;
  const all=Object.values(P);const[d,n]=prog(all.map(p=>p.k));h+=`<div class="stat"><b>${d}/${n}</b>全部點位</div>`;
  regs.forEach(r=>{const ps=G.points[r].points;const[a,b]=prog(ps.map(p=>G.points[r].key+':'+p.n));h+=`<div class="stat"><b>${a}/${b}</b>${esc(r)}</div>`});
  h+=`</div><section class="seg"><h2><span>依類型</span></h2><table><tr><th>類型</th><th>已完成</th><th>總數</th></tr>`;
  const ty={};all.forEach(p=>{(ty[p.type]=ty[p.type]||[]).push(p.k)});Object.entries(ty).sort((a,b)=>b[1].length-a[1].length).forEach(([t,ks])=>{const[a,b]=prog(ks);h+=`<tr><td>${esc(t)}</td><td>${a}</td><td>${b}</td></tr>`});
  h+=`</table><p class="p" style="font-size:13px;color:var(--muted)">612 個點位對應 PowerPyx 各區編號，包含支線條目；PowerPyx 總覽的「573 個收集位置」不含支線。寶箱標記是從路線說明辨識（共 ${all.filter(p=>p.chest).length} 處），不是官方寶箱總數——目前中英文來源都沒有逐區寶箱數。</p></section>`;
  const miss=all.filter(p=>p.miss&&!S[p.k]);h+=`<section class="seg"><h2><span>尚未處理的易錯過項目</span><span class="pc">${miss.length}</span></h2>${miss.map(p=>`<div class="res" data-jump="p-${esc(p.r)}-${p.n}" data-ch="${ptCh[p.r+':'+p.n]}"><b>${esc(p.r)} #${p.n}</b> <small>${esc(p.hint.slice(0,60))}…</small></div>`).join('')}</section>`;
  return h;
}
function aboutPage(){return `<div class="kicker">ABOUT</div><h1>關於這本攻略</h1>
<p class="p">版本 V12（${esc(G.meta.date)}）。依劇情順序整理：每章依路線列出鈴鐺、寶箱、收集品、支線接取與交付、Boss 打法與不可逆警告；後期解鎖的回訪點放在可以拿的時間點。</p>
<section class="seg"><h2><span>資料來源</span></h2><ul>
<li>點位與路線：<a href="https://www.powerpyx.com/phantom-blade-zero-collectibles-guide-100-completion/" target="_blank" rel="noopener">PowerPyx 全收集</a>、<a href="https://www.powerpyx.com/phantom-blade-zero-all-side-quests-guide/" target="_blank" rel="noopener">全支線</a>、<a href="https://www.powerpyx.com/phantom-blade-zero-true-ending-guide/" target="_blank" rel="noopener">真結局</a></li>
<li>中文名稱與流程：<a href="https://www.gamersky.com/handbook/Special/dbzero/" target="_blank" rel="noopener">遊民星空</a>、<a href="https://www.3dmgame.com/gl/3993074.html" target="_blank" rel="noopener">3DM</a>、<a href="https://www.phantombladezero.help/zh-hant/guide" target="_blank" rel="noopener">phantombladezero.help</a></li>
<li>Boss 打法：allthings.how 各 Boss 頁、<a href="https://www.18183.com/gonglue/202610/9073424.html" target="_blank" rel="noopener">18183</a>、method.gg</li></ul>
<p class="p">中文名稱取自簡體中文攻略轉繁體，未必與遊戲繁中介面逐字相同；每條都附英文原名方便搜尋。以 PS5 版為準，遊戲版本 1.302.289（2026-11-04 更新：新娘阿花抓取頻率降低、Boss 微調，無新增內容）。按鍵提示寫「互動鍵」等通用說法，以遊戲畫面為準。</p></section>
<section class="seg"><h2><span>進度</span></h2><p class="p">勾選存在這台裝置。換裝置請用側欄 ⚙︎ 的「匯出／匯入進度」。V11 的點位勾選會自動沿用。</p><button class="chip" id="clearAll">清空所有勾選</button></section>`}

function trophyPage(){
  const T=G.trophies,k=i=>'v12:t:'+T[i].en;
  let h=`<div class="kicker">PS5 TROPHIES</div><h1>PS5 白金獎盃</h1><p class="p">共 ${T.length} 項（1 白金、3 金、14 銀、18 銅）。標 ⚠ 的會因錯過支線或沒走真結局而失效，一輪白金就照本攻略的截止提醒做。Boss 類獎盃點名稱可跳到打法卡。</p>`;
  const[d,n]=prog(T.map((_,i)=>k(i)));h+=bar(d,n);
  const cats=[...new Set(T.map(t=>t.cat))];
  cats.forEach(c=>{h+=`<section class="seg"><h2><span>${esc(c)}</span></h2>`;T.forEach((t,i)=>{if(t.cat!==c)return;const ok=!!S[k(i)];const b=t.boss&&G.bosses.find(x=>x.id===t.boss);
    h+=`<div class="step${ok?' ok':''}" data-miss="${t.miss?1:0}"><input type="checkbox" data-k="${esc(k(i))}" ${ok?'checked':''}><div><b>${esc(t.en)}</b> ${t.miss?'<span class="badge b-miss">⚠ 易錯過</span>':''}<div class="hint">${b?`<a href="#" data-jump="boss-${b.id}" data-ch="${bossCh[b.id]||''}">${esc(t.how)}</a>`:esc(t.how)}</div><div class="en">${esc(t.where)}</div></div></div>`});h+='</section>'});
  return h+'<p class="p" style="font-size:12px;color:var(--muted)">獎盃名稱依 PowerPyx、TrueTrophies 對照；中文說明為意譯。</p>';
}
const PAGES={boss:['Boss 圖鑑',bossPage],quests:['支線總表',questPage],trophies:['PS5 獎盃',trophyPage],endings:['結局條件',endingPage],stats:['收集進度',statsPage],about:['關於／來源',aboutPage]};

// ---- 導覽 ----
const nav=document.getElementById('nav');
function renderNav(cur){
  let h='<div class="grp">攻略路線</div>';
  G.chapters.forEach(ch=>{const[d,n]=prog(ch.keys);h+=`<button data-go="${ch.id}" class="${cur===ch.id?'on':''}${n&&d===n?' done':''}"><span>${esc(ch.navTitle)}</span><span class="pc">${n?Math.round(d/n*100)+'%':''}</span></button>`});
  h+='<div class="grp">圖鑑與工具</div>';
  for(const [id,[t]] of Object.entries(PAGES))h+=`<button data-go="${id}" class="${cur===id?'on':''}"><span>${t}</span></button>`;
  nav.innerHTML=h;
}
let cur=null;
function go(id,anchor){
  let ch=G.chapters.find(c=>c.id===id);
  if(!ch&&!PAGES[id]){ch=G.chapters[0];id=ch.id;anchor=null}
  cur=id;
  view.innerHTML=ch?chapterPage(ch):PAGES[id][1]();
  applyFilters();renderNav(id);
  if(location.hash.slice(1)!==id)history.replaceState(null,'','#'+id);
  try{localStorage.setItem('pbz_v12_last',id)}catch(e){}
  if(anchor){const el=document.getElementById(anchor);if(el){if(el.tagName==='DETAILS')el.open=true;el.scrollIntoView({block:'center'});el.classList.add('flash')}}
  else scrollTo(0,0);
  const on=nav.querySelector('.on');on&&on.scrollIntoView({block:'nearest',inline:'center'});
}
function applyFilters(){
  document.querySelectorAll('#fTodo').forEach(b=>b.classList.toggle('on',filt.todo));
  document.querySelectorAll('#fMiss').forEach(b=>b.classList.toggle('on',filt.miss));
  view.querySelectorAll('.pt,.step').forEach(el=>{const ok=el.classList.contains('ok');const m=el.dataset.miss==='1';el.classList.toggle('hidden',(filt.todo&&ok)||(filt.miss&&!m))});
  view.querySelectorAll('.p,.tip').forEach(el=>el.classList.toggle('hidden',filt.miss));
}

// ---- 事件 ----
document.addEventListener('change',e=>{const k=e.target.dataset&&e.target.dataset.k;if(!k)return;S[k]=e.target.checked;if(!e.target.checked)delete S[k];save();
  const row=e.target.closest('.pt,.step');row&&row.classList.toggle('ok',e.target.checked);
  const seg=e.target.closest('.seg');if(seg&&cur&&G.chapters.find(c=>c.id===cur)){const ch=G.chapters.find(c=>c.id===cur);const si=+seg.id.split('-s')[1];const[a,b]=prog(segKeys(ch.segs[si]));seg.querySelector('h2 .pc').textContent=a+'/'+b;const[d,n]=prog(ch.keys);view.querySelector('.bar i').style.width=(d/n*100)+'%';view.querySelector('.barlbl').textContent=d+' / '+n}
  renderNav(cur);if(filt.todo&&row)setTimeout(applyFilters,600)});
document.addEventListener('click',e=>{
  const g=e.target.closest('[data-go]');if(g){e.preventDefault();go(g.dataset.go);document.getElementById('q').value='';return}
  const j=e.target.closest('[data-jump]');if(j){e.preventDefault();go(j.dataset.ch,j.dataset.jump);return}
  const q=e.target.closest('[data-q]');if(q){go('quests','q-'+q.dataset.q);return}
  if(e.target.id==='clearAll'&&confirm('確定清空所有勾選？此動作無法復原（建議先匯出進度）。')){S={};save();go(cur)}
  if(e.target.id==='fTodo'){filt.todo=!filt.todo;saveF();applyFilters()}
  if(e.target.id==='fMiss'){filt.miss=!filt.miss;saveF();applyFilters()}
  if(e.target.id==='fOpen'){const ds=[...view.querySelectorAll('details.boss')];const open=!ds.every(d=>d.open);ds.forEach(d=>d.open=open)}
});
const saveF=()=>{try{localStorage.setItem('pbz_v12_filters',JSON.stringify(filt))}catch(e){}};
// 搜尋
const qi=document.getElementById('q');let qt;
qi.addEventListener('input',()=>{clearTimeout(qt);qt=setTimeout(search,200)});
function search(){
  const s=qi.value.trim().toLowerCase();if(!s){go(cur||G.chapters[0].id);return}
  const out=[];
  G.bosses.forEach(b=>{if((b.name+b.en+(b.tips||[]).join('')).toLowerCase().includes(s))out.push(`<div class="res" data-jump="boss-${b.id}" data-ch="${bossCh[b.id]||''}"><b>⚔ ${esc(b.name)}</b> <small>${esc(b.en)}</small></div>`)});
  G.quests.forEach(q=>{if((q.name+q.en+(q.steps||[]).join('')).toLowerCase().includes(s))out.push(`<div class="res" data-q="${q.id}"><b>📜 ${esc(q.name)}</b> <small>${esc(q.en)}</small></div>`)});
  Object.values(P).forEach(p=>{if((p.hint+p.en+p.zh+p.type).toLowerCase().includes(s))out.push(`<div class="res" data-jump="p-${esc(p.r)}-${p.n}" data-ch="${ptCh[p.r+':'+p.n]}"><b>${esc(p.r)} #${p.n}</b> <span class="ty t-${esc(p.type)}">${esc(p.type)}</span> <small>${esc(p.hint.slice(0,70))}</small></div>`)});
  view.innerHTML=`<h1>搜尋「${esc(qi.value)}」</h1><p class="p">${out.length} 筆結果</p>${out.slice(0,200).join('')}`;
}
// 下一個未完成：目前章節的第一個未勾項目；本章完成就往後找有未完成的章節
function nextTodo(){
  const visible=()=>[...view.querySelectorAll('.pt:not(.ok),.step:not(.ok)')].find(el=>!el.classList.contains('hidden'));
  const isCh=G.chapters.some(c=>c.id===cur);
  let el=isCh&&visible();
  if(!el){
    const i=Math.max(0,G.chapters.findIndex(c=>c.id===cur));
    const order=G.chapters.slice(isCh?i+1:0).concat(G.chapters.slice(0,isCh?i+1:0));
    const ch=order.find(c=>c.keys.some(k=>!S[k]));
    if(!ch){toast('全部完成！🎉');return}
    if(filt.todo||filt.miss){filt.todo=false;filt.miss=false;saveF()}
    go(ch.id);el=visible();if(!el)return;
  }
  el.scrollIntoView({block:'center',behavior:'smooth'});el.classList.remove('flash');void el.offsetWidth;el.classList.add('flash');
}
function toast(t){const d=document.createElement('div');d.className='mini-toast';d.textContent=t;document.body.appendChild(d);setTimeout(()=>d.remove(),2200)}
const fab=document.createElement('button');fab.className='fab no-print';fab.id='fNext';fab.title='跳到下一個未完成';fab.innerHTML='▶<span>下一個未完成</span>';
fab.onclick=nextTodo;document.body.appendChild(fab);
addEventListener('hashchange',()=>{const h=location.hash.slice(1);if(h&&h!==cur)go(h)});
// 手機版：讓工具列貼在側欄下方
const fixNavH=()=>document.documentElement.style.setProperty('--navh',(innerWidth<=950?document.querySelector('.sidebar').offsetHeight:0)+'px');
addEventListener('resize',fixNavH);
let start=location.hash.slice(1);if(!start){try{start=localStorage.getItem('pbz_v12_last')}catch(e){}}
go(start||G.chapters[0].id);fixNavH();
})();
