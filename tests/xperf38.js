// v38 rendering cost: groups of 25, 50 and 100 Sap Burners (all burning), Sunleaves or Spore Bellows, all in view, in the v37 build
// (procedural look) and this build (painted). Times one render() per frame, with the simulation stepping between frames.
const {chromium}=require(process.env.PW||'playwright');
const BUILDS=(process.env.BUILDS||'previous/index.html:v37,index.html:v38').split(',').map(s=>s.split(':'));
const Q=process.env.QUALITY||'medium';
(async()=>{const br=await chromium.launch();const rows=[];
 for(const kind of ['combustion','solar','bellows','mixed'])for(const N of [25,50,100]){const row={kind,N};
  for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(String(e)));
   await p.addInitScript(q=>{try{localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},Q);
   await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(900);await p.evaluate(q=>applyQuality(q),Q);
   const r=await p.evaluate(([kind,N])=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    const cols=10,X=G.core.x+6,Y=G.core.y-14;
    for(let y=Y-1;y<Y+32;y++)for(let x=X-1;x<X+32;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    for(let k=0;k<N;k++){const t=kind==='mixed'?['combustion','solar','bellows'][k%3]:kind,big=t==='bellows'||kind==='mixed',x=X+(k%cols)*(big?3:2),y=Y+Math.floor(k/cols)*(big?3:2);tryPlace(t,x,y,0,true);}
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();G.paused=true;
    cam.z=.9;centerOn(X+15,Y+15);
    const tick=()=>{for(const b of G.blocks.values())if(b.t==='combustion')b.inv[COAL]=5;step(1/30);};
    for(let k=0;k<60;k++){tick();render();}
    const T0=[];for(let k=0;k<150;k++){tick();const t=performance.now();render();T0.push(performance.now()-t);}
    T0.sort((a,b)=>a-b);const n=[...G.blocks.values()].filter(b=>b.t===kind||kind==='mixed'&&(b.t==='combustion'||b.t==='solar'||b.t==='bellows')).length;
    return {med:T0[75],p90:T0[135],mean:T0.reduce((a,b)=>a+b,0)/T0.length,n,lite:typeof organLite==='function'&&ART.plant.solar?['combustion','solar','bellows'].map(t=>organLite(t)):null};},[kind,N]);
   row[tag]=r;row[tag+'err']=errs.length;await p.close();}
  rows.push(row);const f=x=>x.toFixed(1);
  console.log(kind.padEnd(8),String(N).padStart(4),BUILDS.map(([u,t])=>`${t}: median ${f(row[t].med)} ms p90 ${f(row[t].p90)} (n=${row[t].n}${row[t].lite?' lite '+row[t].lite.map(x=>x?1:0).join(''):''}, errors ${row[t+'err']})`).join('  |  '));}
 require('fs').writeFileSync('shots38/perf38_'+Q+'.json',JSON.stringify(rows,null,1));await br.close();})();
