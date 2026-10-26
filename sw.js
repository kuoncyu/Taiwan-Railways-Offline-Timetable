/* 台鐵時刻表 Service Worker：讓網頁沒有網路也能開啟（需與 HTML 放在同一資料夾） */
const C='tra-app-v1';
const keyOf=u=>{const x=new URL(u,self.location);return new Request(x.origin+x.pathname)};
self.addEventListener('install',e=>{self.skipWaiting()});
self.addEventListener('activate',e=>{e.waitUntil((async()=>{
  for(const k of await caches.keys())if(k!==C)await caches.delete(k);
  await self.clients.claim()})())});
async function fresh(url){const r=await fetch(url,{cache:'no-store'});if(r&&r.ok){(await caches.open(C)).put(keyOf(url),r.clone())}return r}
async function netFirst(req){
  const c=await caches.open(C),key=keyOf(req.url);
  const net=fresh(req.url);net.catch(()=>{});
  const wait=new Promise(res=>setTimeout(()=>res(null),4000));
  const fallback=async()=>(await c.match(key))||(await c.match(self.registration.scope))||(await c.keys().then(k=>k[0]&&c.match(k[0])));
  try{const r=await Promise.race([net,wait]);if(r)return r;return (await fallback())||await net}
  catch(e){const hit=await fallback();if(hit)return hit;throw e}}
self.addEventListener('message',e=>{const d=e.data||{};
  if(d.type==='precache'&&d.url)e.waitUntil(fresh(d.url).catch(()=>{}))});
self.addEventListener('fetch',e=>{const r=e.request,u=new URL(r.url);
  if(r.method!=='GET'||u.origin!==self.location.origin)return;
  if(r.mode==='navigate'||/\.html?$|\/$/.test(u.pathname))e.respondWith(netFirst(r))});
