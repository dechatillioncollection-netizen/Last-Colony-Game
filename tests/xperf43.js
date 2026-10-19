// v43 performance. Part 1: simulation cost per step with 40, 100 and 160 enemies attacking a walled base with guns, v42 against this build
// (same seed, same base). Part 2 (this build): the vine route planner and reach count for drags of 20, 60 and 120 tiles with 0, 500 and 2000
// vines already grown; a frame with a 60-tile drag preview; the Alt grid and the route debug view drawn over a full screen.
const {chromium}=require(process.env.PW||'playwright');
const BUILDS=(process.env.BUILDS||'lc2_v42_index.html:v42,lc2_index.html:v43').split(',').map(s=>s.split(':'));
(async()=>{const br=await chromium.launch();const out={sim:[],plan:null,frame:null};
 const open=async u=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
   await p.addInitScript(()=>{try{localStorage.setItem('lc_quality','medium');localStorage.setItem('lc_fog','0');}catch(e){}});
   await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1200);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});return p;};
 for(const N of [40,100,160]){const row={N};
  for(const [u,tag] of BUILDS){const p=await open(u);
   row[tag]=await p.evaluate(N=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
     const X=G.core.x,Y=G.core.y;for(let k=0;k<20;k++){tryPlace('wall',X-9+k,Y-9,0,true);tryPlace('wall',X-9+k,Y+11,0,true);}for(let k=0;k<20;k++)if(k<8||k>11){tryPlace('wall',X-9,Y-9+k,0,true);tryPlace('wall',X+10,Y-9+k,0,true);}
     for(let k=0;k<6;k++){tryPlace('duo',X-6+k*3,Y-6,0,true);tryPlace('duo',X-6+k*3,Y+8,0,true);}for(const b of G.blocks.values()){b.built=1;if(b.ammo)b.ammo[0]=9999;}G.dirty=true;
     const ts=['dagger','dagger','crawler','mace','fortress','flare','horizon'];for(let k=0;k<N;k++){const e=spawnEnemy(ts[k%7]);e.hp=e.max=e.max*6;}
     const f0=typeof FLOWN==='number'?FLOWN:0;for(let k=0;k<30;k++)step(1/30);const T=[];
     for(let k=0;k<900;k++){const t=performance.now();step(1/30);T.push(performance.now()-t);}T.sort((a,b)=>a-b);
     return {mean:+(T.reduce((a,b)=>a+b,0)/T.length).toFixed(3),p90:+T[810].toFixed(3),max:+T[899].toFixed(2),alive:G.enemies.length,flows:typeof FLOWN==='number'?FLOWN-f0:null};},N);
   if(p.errs.length)row[tag].errs=p.errs.slice(0,2);await p.close();}
  out.sim.push(row);console.log('sim',JSON.stringify(row));}
 const p=await open(BUILDS[BUILDS.length-1][0]);
 out.plan=await p.evaluate(()=>{const res=[];for(const V of [0,500,2000]){let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);
     for(let i=0;i<N;i++)G.web[i]=G.terrain[i]===ROCK||G.terrain[i]===WATER?0:1;G.webCount=N;
     // V vines in rows away from the test lane
     let n=0;for(let y=4;y<MH-4&&n<V;y+=3)for(let x=4;x<MW-4&&n<V;x++){if(Math.abs(y-G.core.y)<14)continue;if(tryPlace('conveyor',x,y,0,true))n++;}
     for(let i=0;i<N;i++)if(Math.abs(((i/MW)|0)-G.core.y-1)<4&&(i%MW)>G.core.x+20)G.web[i]=0;
     for(const L of [20,60,120]){const a=[Math.max(3,G.core.x+24-L/2|0),G.core.y-3],b=[Math.min(MW-4,a[0]+L-6),G.core.y+3];
       for(const diag of [false,true]){const t0=performance.now();let rows;for(let k=0;k<10;k++){PLANC.k='';rows=planEval('conveyor',planVine('conveyor',a,b,diag));}res.push({vines:n,L,diag,tiles:rows.length,ms:+((performance.now()-t0)/10).toFixed(2)});}}
     const t1=performance.now();for(let k=0;k<10;k++)vineDist();res.push({vines:n,reachCount:+((performance.now()-t1)/10).toFixed(2)});}
   return res;});
 console.log('plan',JSON.stringify(out.plan));
 out.frame=await p.evaluate(()=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);
   for(let k=0;k<600;k++)step(1/30);cam.z=1;centerOn(G.core.x+1.5,G.core.y+1.5);const fl=()=>ctx.getImageData(0,0,1,1);
   const time=f=>{for(let k=0;k<10;k++){f();render();fl();}const T=[];for(let k=0;k<60;k++){f();const t=performance.now();render();fl();T.push(performance.now()-t);}T.sort((a,b)=>a-b);return +T[30].toFixed(2);};
   const base=time(()=>{});
   setTool('conveyor');const r=cv.getBoundingClientRect();mouse.in=true;mouse.x=VW/2+400;mouse.y=VH/2;mouse.down={x:VW/2-400,y:VH/2-120,b:0,type:'mouse',cam:[cam.x,cam.y],moved:true,w:s2w(VW/2-400,VH/2-120)};
   const drag=time(()=>{});mouse.down=null;setTool(null);
   keys.add('alt');const alt=time(()=>{});keys.delete('alt');DBG.nav=true;const dbg=time(()=>{});DBG.nav=false;
   return {base,drag,alt,dbg};});
 console.log('frame',JSON.stringify(out.frame));if(p.errs.length)console.log('errs',p.errs);
 require('fs').writeFileSync('perf43.json',JSON.stringify(out,null,1));await br.close();})();
