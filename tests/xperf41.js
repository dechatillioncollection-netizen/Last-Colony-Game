// v41 rendering cost: 50, 100 and 200 Petal Gates, Maw Gates or Healing Pods (or all three mixed), laid in rows, all in view, in the
// v40 build (procedural look for these three) and this build (painted). 'active' is the mixed set with every structure at 40% health,
// an ant held inside every fourth gate (so it is drawn open), Sunleaves giving vigor so the pods repair and pump, and one in five
// structures taking a hit each second. Times one render() per frame, including the canvas finishing its drawing (read back after
// each frame), with the simulation stepping between frames.
const {chromium}=require(process.env.PW||'playwright');
const BUILDS=(process.env.BUILDS||'lc2_v40_index.html:v40,lc2_index.html:v41').split(',').map(s=>s.split(':'));
const Q=process.env.QUALITY||'medium',Z=+(process.env.Z||.9);
(async()=>{const br=await chromium.launch();const rows=[];
 for(const kind of (process.env.KINDS||'door,doorL,mender,mixed,active').split(','))for(const N of (process.env.NS||'50,100,200').split(',').map(Number)){const row={kind,N};
  for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
   await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},Q);
   await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(900);await p.evaluate(q=>applyQuality(q),Q);
   const r=await p.evaluate(([kind,N,Z])=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    const X=G.core.x+5,Y=G.core.y-16;
    for(let y=Y-1;y<Y+40;y++)for(let x=X-1;x<X+44;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    let x=0,y=0,n=0;const kinds=['door','doorL','mender'],TS={door:1,doorL:1,mender:1};
    while(n<N&&y<32){const t=kind==='mixed'||kind==='active'?kinds[n%3]:kind,w=t==='doorL'?2:1;if(x+w>40){x=0;y+=3;continue;}if(tryPlace(t,X+x,Y+y,0,true))n++;x+=w;}
    if(kind==='active')for(let i=0;i<20;i++)tryPlace('solar',X+i*2,Y+36,0,true);
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
    const W=[...G.blocks.values()].filter(b=>TS[b.t]);const held=[];
    if(kind==='active'){for(const b of W)b.hp=b.max*.4;W.filter(b=>b.t!=='mender').forEach((b,i)=>{if(i%4===0)held.push([spawnUnit('mite',b.x+b.size/2,b.y+b.size/2),b]);});}
    cam.z=Z;centerOn(X+20,Y+10);let f=0;
    const tick=()=>{if(kind==='active'&&f%6===0){const b=W[(f/6*7)%W.length];if(G.blocks.has(b.id))b.hp=Math.max(1,b.hp-b.max*.01);}for(const [u,b] of held){u.x=b.x+b.size/2;u.y=b.y+b.size/2;}f++;step(1/30);};
    for(let k=0;k<60;k++){tick();render();}
    const fl=()=>ctx.getImageData(0,0,1,1);for(let k=0;k<10;k++){tick();render();fl();}
    const T0=[];for(let k=0;k<150;k++){tick();const t=performance.now();render();fl();T0.push(performance.now()-t);}
    T0.sort((a,b)=>a-b);
    return {med:T0[75],p90:T0[135],mean:T0.reduce((a,b)=>a+b,0)/T0.length,n:W.length,powSat:G.powSat,fx:typeof PODFX!=='undefined'?PODFX.length:null,lite:typeof organLite==='function'&&typeof PODFX!=='undefined'?kinds.map(t=>organLite(t)):null};},[kind,N,Z]);
   row[tag]=r;row[tag+'err']=errs.length;await p.close();}
  rows.push(row);const f=x=>x.toFixed(2);
  console.log(kind.padEnd(6),String(N).padStart(4),BUILDS.map(([u,t])=>`${t}: median ${f(row[t].med)} ms, mean ${f(row[t].mean)}, p90 ${f(row[t].p90)} (n=${row[t].n}${row[t].lite?' lite '+row[t].lite.map(x=>x?1:0).join(''):''}${kind==='active'?' vigor '+(+row[t].powSat).toFixed(2):''}, errors ${row[t+'err']})`).join('  |  '));}
 require('fs').mkdirSync('shots41',{recursive:true});require('fs').writeFileSync('shots41/perf41_'+Q+'_z'+Z+'.json',JSON.stringify(rows,null,1));await br.close();})();
