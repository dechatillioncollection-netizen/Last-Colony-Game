// v41 frame sequences from the game canvas: a Mite Ant and a Thornback through a Petal Gate, a Bulwark Ant through a Maw Gate, and
// a Healing Pod mending hurt walls (from the step its repair lands). Each run is the real simulation, drawn every step.
// Writes shots41/seq_<name>_<i>.png (cropped) and shots41/seq_<name>.json with the gate's open amount and the ant's position.
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/lc2_index.html',TAG=process.env.TAG||'after',Z=+(process.env.Z||3);
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots41',{recursive:true});
 const p=await br.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForTimeout(1500);
 // the page's own animation loop is stopped so each picture is exactly one simulation step and one draw (the gates open at the
 // game's rate per drawn frame, so with the loop running they open between pictures)
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(200);
 await p.evaluate(()=>{window.__S=(o)=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+6,Y=G.core.y-10;for(let y=Y-3;y<Y+18;y++)for(let x=X-3;x<X+26;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
   // a sealed pen: a wall line along row 6 with a Petal Gate at column 4 and a Maw Gate at columns 12-13 (rows 6-7, the line two deep there)
   for(let x=0;x<20;x++){if(x===4||x===12||x===13)continue;put(x%3===2?'twall':'wall',x,6);put('wall',x,7);}
   put('door',4,6);put('wall',4,7);/* the gate's back is open: */removeBlock(blockAt(X+4,Y+7));
   put('doorL',12,6);put('wallL',16,8);
   for(let y=-1;y<14;y++){put('wall',-1,y);put('wall',20,y);}
   // a Healing Pod among hurt walls, on Sunleaves
   put('mender',8,10);for(let k=0;k<6;k++)put('solar',1+k,13);
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   return {X,Y};};});
 const crop=async(cx,cy,w,h)=>p.evaluate(([cx,cy,w,h])=>{const z=cam.z;return {x:(cx*T-cam.x)*z-w/2,y:(cy*T-cam.y)*z-h/2,width:w,height:h};},[cx,cy,w,h]);
 async function run(name,o){const r=await p.evaluate(([o,Z])=>{const {X,Y}=__S(o);const G=window.__game();cam.z=Z;centerOn(X+o.cx,Y+o.cy);
    if(o.unit){const u=spawnUnit(o.unit,X+o.ux,Y+o.uy);sendAnts([u],X+o.ux,Y+o.uy+8);window.__u=u;}
    if(o.hurt){for(const b of G.blocks.values())if(b.t!=='core'&&b.t!=='mender'&&b.t!=='solar'&&Math.hypot(b.x-X-8,b.y-Y-10)<6.5)b.hp=b.max*.4;const pod=blockAt(X+8,Y+10);pod.prog=1.2;window.__pod=pod;}
    window.__X=[X,Y];render();return {X,Y};},[o,Z]);
  const log=[];let shot=0;const cl=await crop(r.X+o.cx,r.Y+o.cy,o.w,o.h);
  for(let k=0;k<o.steps;k++){
    const st=await p.evaluate(o=>{step(1/30);render();const G=window.__game();const g=o.gate?blockAt(__X[0]+o.gate[0],__X[1]+o.gate[1]):null;const u=window.__u;const pod=window.__pod;
      const healed=G.fx.some(f=>f.k==='heal'&&f.max-f.life<.04);
      return {t:+G.time.toFixed(3),op:g?+(g.op||0).toFixed(3):null,ux:u?+(u.x-__X[0]).toFixed(2):null,uy:u?+(u.y-__X[1]).toFixed(2):null,healed,pfx:typeof PODFX!=='undefined'?PODFX.length:0,prog:pod?+pod.prog.toFixed(2):null};},o);
    log.push(st);
    if(o.every?k%o.every===0&&k>=o.from:false){await p.screenshot({path:`shots41/seq_${name}_${TAG}_${String(shot).padStart(2,'0')}.png`,clip:cl});shot++;}
    if(o.hurt&&st.healed&&o.afterHeal===undefined){o.afterHeal=k;o.from=k;o.every=3;o.steps=Math.min(o.steps,k+48);}
  }
  fs.writeFileSync(`shots41/seq_${name}_${TAG}.json`,JSON.stringify(log));console.log(name,shot,'frames',errs.length?errs:'');}
 await run('petal_mite',{unit:'mite',ux:4.5,uy:2.5,gate:[4,6],cx:4.5,cy:6.5,w:300,h:300,steps:150,every:4,from:0});
 await run('petal_thorn',{unit:'tank',ux:4.5,uy:2.5,gate:[4,6],cx:4.5,cy:6.5,w:300,h:300,steps:170,every:5,from:0});
 await run('petal_bulwark',{unit:'htank',ux:4.5,uy:2.5,gate:[4,6],cx:4.5,cy:6.5,w:300,h:300,steps:300,every:8,from:0});
 await run('maw_bulwark',{unit:'htank',ux:13,uy:2.5,gate:[12,6],cx:13,cy:7,w:420,h:420,steps:330,every:9,from:0});
 // every drawn step, for the frame-by-frame opening and closing
 await run('petal_open',{unit:'mite',ux:4.5,uy:2.5,gate:[4,6],cx:4.5,cy:6.5,w:300,h:300,steps:170,every:1,from:0});
 await run('maw_open',{unit:'htank',ux:13,uy:2.5,gate:[12,6],cx:13,cy:7,w:420,h:420,steps:330,every:1,from:0});
 await run('pod_heal',{hurt:true,cx:8.5,cy:10.5,w:520,h:420,steps:400,every:0,from:9999});
 await br.close();})();
