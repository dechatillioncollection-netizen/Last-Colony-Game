// v52 drawing cost: 70 HDF ground vehicles (all four kinds, some bosses, some damaged) advancing on a defended Bloom, timed per render()
// over 150 frames at three zoom levels, in v51 (built-in look) and this build (painted), at Medium, High and Epic. Writes perf52.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v51.html';
const run=async(br,file,q,z)=>{const p=await br.newPage({viewport:{width:1600,height:900}});
 await p.addInitScript(q=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q);
 await p.goto(URL+file);await p.waitForTimeout(1500);
 const r=await p.evaluate(([q,z])=>{applyQuality(q);let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.paused=true;
   const c=G.core,T0=['dagger','crawler','mace','fortress','dagger','mace'];
   for(let i=0;i<70;i++){const e=spawnEnemy(T0[i%6],i%11===0);e.x=c.x+16+(i%10)*1.4;e.y=c.y-7+(i/10|0)*1.7;if(i%3===0)e.hp=e.max*(.2+(i%5)*.12);}
   cam.z=z;centerOn(c.x+21,c.y-1);for(let i=0;i<20;i++){step(1/30);render();}
   const t=[];for(let i=0;i<150;i++){step(1/30);if(i%3===0)for(const e of G.enemies)e.hit=.1;const a=performance.now();render();t.push(performance.now()-a);}
   t.sort((a,b)=>a-b);const n=G.enemies.filter(e=>!E[e.t].air).length;return {mean:t.reduce((a,b)=>a+b,0)/t.length,p95:t[Math.floor(t.length*.95)],n};},[q,z]);
 await p.close();return r;};
(async()=>{const br=await chromium.launch();const out=[];
 for(const q of (process.env.QS||'medium,high,epic').split(','))for(const z of (process.env.ZS||'2,1,.6').split(',').map(Number)){const a=await run(br,OLD,q,z),b=await run(br,NEW,q,z);out.push({q,z,v51:a,v52:b});
  console.log(q,'zoom',z,'v51',a.mean.toFixed(2),'ms (p95',a.p95.toFixed(2)+')','v52',b.mean.toFixed(2),'ms (p95',b.p95.toFixed(2)+')','vehicles',b.n);}
 fs.writeFileSync(process.env.OUT||'perf52.json',JSON.stringify(out,null,1));await br.close();})();
