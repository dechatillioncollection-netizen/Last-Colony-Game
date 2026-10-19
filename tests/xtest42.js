// v42 checks. Part 1: the Bulwark Ant and the gates (the one gameplay change): it cannot pass a Petal Gate, uses a Maw Gate or another
// way round, never squeezes or teleports through, and saves stay safe. Part 2: the painted Spore Flak, Seed Mortar, Sunlance and
// Brood Chamber against what the game really does (every drawn shot, beam and hatching is a real one). Part 3: combat and production
// the same as v41 (OLD). Each check prints PASS or FAIL.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'lc2_v41_index.html',NEW=process.env.NEW||'lc2_index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const HELP=()=>{
  window.strip0=r=>({L:r.L});
  window.__seed=(n)=>{let s=n||9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;};
  // a cleared field; returns put(t,x,y) relative to it
  window.__field=(o={})=>{__seed(o.seed);startGame(o.mode||'survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    ['factory','htank','scatter','hail','lancer','door','doorL'].forEach(k=>G.unlocked&&G.unlocked.add(k));
    const X=G.core.x+6,Y=G.core.y-12;for(let y=Y-3;y<Y+20;y++)for(let x=X-3;x<X+28;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};window.__X=[X,Y];return {G,X,Y,put};};
  // a wall line two deep (rows 6 and 7) across x 0..17 with gates in it: o.gates [[type,x],...]; a Petal Gate sits in row 6 with row 7
  // behind it left open; a Maw Gate fills both rows. o.seal closes the box all round; o.gapAt leaves an open passage two wide at that x.
  window.__wall=(o={})=>{const {G,X,Y,put}=__field(o);const skip=new Set();const gates=[];
    for(const [t,gx] of o.gates||[]){skip.add(gx);if(t==='doorL')skip.add(gx+1);}
    if(o.gapAt!=null){skip.add(o.gapAt);skip.add(o.gapAt+1);}
    for(let x=0;x<18;x++){if(skip.has(x))continue;put('wall',x,6);put('wall',x,7);}
    for(const [t,gx] of o.gates||[])gates.push(put(t,gx,6));
    for(let y=-1;y<16;y++){put('wall',-1,y);put('wall',18,y);}
    if(o.seal)for(let x=-1;x<19;x++){put('wall',x,-1);put('wall',x,15);}
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=o.z||2;centerOn(X+9,Y+7);return {G,X,Y,gates};};
  // ants of these kinds sent from above the line to below it; per step: who overlaps which gate, the gates' open amounts, crossings
  window.__go=(o)=>{const {G,X,Y,gates}=__wall(o);const us=(o.units||[]).map((t,i)=>spawnUnit(t,X+(o.ux??8.5)+((i%3)-1)*(o.spread||0),Y+(o.uy??2.5)-Math.floor(i/3)*(o.gap??1.1)));
    if(o.preload)o.preload(us,gates);
    sendAnts(us,X+(o.tx??8.5),Y+(o.ty??11.5));
    const R=us.map(u=>({t:u.t,crossed:-1,cx:null,inDoor:0,inMaw:0,jump:0,path:0,last:[u.x,u.y],late:0}));const op={};let doorOpenLarge=0,mawOpenLarge=0,mawLargeIn=0;
    for(let k=0;k<(o.steps||600);k++){step(1/30);if(o.draw!==false&&k%2===0)render();
      us.forEach((u,i)=>{const r=R[i],rad=radOf(u,0);const d=Math.hypot(u.x-r.last[0],u.y-r.last[1]);if(d>.3)r.jump++;r.path+=d;if(k>(o.steps||600)-300)r.late+=d;r.last=[u.x,u.y];
        for(const g of gates){const n=g.size,inside=u.x>g.x-rad*.9&&u.x<g.x+n+rad*.9&&u.y>g.y-rad*.9&&u.y<g.y+n+rad*.9;
          if(inside){if(g.t==='door')r.inDoor++;else{r.inMaw++;if(U[u.t].large){mawLargeIn++;if((g.op||0)>.9)mawOpenLarge++;}}}}
        if(r.crossed<0&&u.y>Y+8.4){r.crossed=k;r.cx=+(u.x-X).toFixed(2);}});
      // a Petal Gate with only large ants near must stay shut
      for(const g of gates)if(g.t==='door'){const near=us.filter(u=>!u.dead&&Math.hypot(u.x-g.x-.5,u.y-g.y-.5)<2.2);if(near.length&&near.every(u=>U[u.t].large)&&(g.op||0)>.01)doorOpenLarge++;}}
    const alive=us.filter(u=>!u.dead&&G.units.includes(u)).length;
    return {R:R.map(r=>({...r,path:+r.path.toFixed(1),late:+r.late.toFixed(2),last:[+(r.last[0]-X).toFixed(2),+(r.last[1]-Y).toFixed(2)]})),doorOpenLarge,mawOpenLarge,mawLargeIn,alive,n:us.length,ops:gates.map(g=>+(g.op||0).toFixed(2))};};
  // alpha of a block drawn alone with drawArt, at a point given as a fraction of its footprint
  window.__alpha=(b,fx,fy)=>{const a=ART.plant[b.t],n=b.size,box=a.box,S=4,cv=document.createElement('canvas');cv.width=cv.height=box*T*S;const c=cv.getContext('2d');c.scale(S,S);
    const o=(box-n)/2*T;drawArt(c,b.t,o,o,0,b,G.time,0);const px=Math.floor((o+fx*n*T)*S),py=Math.floor((o+fy*n*T)*S);return c.getImageData(px-2,py-2,5,5).data.filter((v,i)=>i%4===3).reduce((p,q)=>p+q,0)/25;};
  // which painted layers a kind uses in each drawn frame (both the full and half size sets are watched)
  window.__spy=(t)=>{const a=ART.plant[t];if(!a)return ()=>[];const used=a.__used||(a.__used=new Set());used.clear();for(const k of ['I','IH']){const o=a[k];if(o.__spied)continue;const px=new Proxy(o,{get(tg,key){if(key==='__spied')return true;if(typeof key==='string')a.__used.add(key);return tg[key];}});a[k]=px;}
    a.cache=null;return ()=>{const s=[...used];used.clear();return s;};};
  // a single structure on the field with optional enemy, vigor and ammunition; runs n steps drawing each, logging per step
  window.__one=(o)=>{const {G,X,Y,put}=__field(o);if(o.solar)for(let k=0;k<o.solar;k++)put('solar',k%10,17+Math.floor(k/10));
    const b=put(o.t,o.bx??6,o.by??6);if(o.ammo)b.ammo[o.ammo]=o.n??999;
    if(o.unit){b.unit=o.unit;for(const [i,n] of U[o.unit].cost)b.inv[i]=n*(o.batches||3);b.prog=o.prog||0;}
    const es=(o.enemies||[]).map(([t,ex,ey])=>{const e=spawnEnemy(t);e.x=X+ex;e.y=Y+ey;e.hp=e.max=o.ehp||1e6;return e;});
    for(const q of G.blocks.values())q.built=1;G.dirty=true;recompute();cam.z=o.z||2;centerOn(X+(o.bx??6)+1,Y+(o.by??6)+1);render();
    const spy=__spy(o.t);spy();const L=[];let lastShot=b.shot,nb0=G.bullets.length;const tr=new Set();
    for(let k=0;k<(o.steps||300);k++){const n0=G.bullets.filter(q=>!q.team).length,u0=G.units.length;
      if(o.each)o.each(k,b,G);step(1/30);const born=G.bullets.filter(q=>!q.team&&!tr.has(q));born.forEach(q=>tr.add(q));render();const used=spy(),s=OST.get(b)||{};
      const lz=G.fx.find(f=>f.k==='laser'&&!f.team);
      L.push({k,t:G.time,shot:b.shot,newShot:b.shot!==lastShot,born:born.length,used,laser:!!lz,laserFresh:!!lz&&lz.max-lz.life<1/29,charge:b.charge,tgt:!!(b.target&&alive(b.target)),pow:G.powSat,
        prog:b.prog,wants:b.wants,unit:b.unit,units:G.units.length,spawned:G.units.length-u0,s:{pr:s.pr,g:s.g,act:s.act,ns:s.ns,relT:s.relT,th:s.th,n:s.n,m:s.m},ammo:o.ammo?b.ammo[o.ammo]:null});lastShot=b.shot;}
    return {L,b,G,X,Y,es};};
};
const strip=r=>JSON.parse(JSON.stringify(r,(k,v)=>k==='b'||k==='G'||k==='es'?undefined:v));
(async()=>{const br=await chromium.launch();
 const page=async(file,init)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.warns=[];p.on('pageerror',e=>p.errs.push(String(e)));p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
   if(init)await init(p);await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','high');}catch(e){}});
   await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.evaluate(HELP);return p;};
 const p=await page(NEW);let r;
 // ===================== Part 1: Bulwark Ants and gates =====================
 const box=g=>({seal:true,gates:g});
 r=await p.evaluate(o=>__go(o),{...box([['door',8]]),units:['mite'],steps:300});
 ok(r.R[0].crossed>0&&r.R[0].jump===0,'Gate 1: a Mite Ant walks through a Petal Gate',r.R[0]);
 r=await p.evaluate(o=>__go(o),{...box([['door',8]]),units:['tank'],steps:300});
 ok(r.R[0].crossed>0&&r.R[0].jump===0,'Gate 2: a Thornback walks through a Petal Gate',r.R[0]);
 r=await p.evaluate(o=>__go(o),{...box([['door',8]]),units:['htank'],steps:900});
 ok(r.R[0].crossed<0&&r.R[0].inDoor===0&&r.R[0].jump===0&&r.alive===1,'Gate 3: a Bulwark Ant in a box whose only way out is a Petal Gate never enters the gate or crosses (and is not removed)',r.R[0]);
 ok(r.R[0].late<.5,'Gate 6: no endless attempts: in its last 10 s it has moved '+r.R[0].late+' tiles (it waits by the gate; the game re-plans its route every few seconds)',{late:r.R[0].late,last:r.R[0].last});
 ok(r.doorOpenLarge===0&&r.ops[0]===0,'Gate 7: the Petal Gate never opens for the Bulwark (open amount 0 on every step with only it near)',{doorOpenLarge:r.doorOpenLarge,op:r.ops[0]});
 r=await p.evaluate(()=>{const {G,X,Y,gates}=__wall({seal:true,gates:[['door',8]]});const g=gates[0];const u=spawnUnit('htank',X+8.5,Y+5.1);for(let k=0;k<60;k++){u.x=X+8.5;u.y=Y+5.1;step(1/30);render();}return {op:g.op||0,seam:__alpha(g,.5,.5)};});
 ok(r.op===0&&r.seam>200,'Gate 7: a Bulwark held right against the Petal Gate: the game keeps it shut and the petals stay closed over the passage',r);
 r=await p.evaluate(o=>__go(o),{...box([['doorL',8]]),units:['htank'],steps:600});
 ok(r.R[0].crossed>0&&r.R[0].jump===0,'Gate 4: a Bulwark Ant walks through a Maw Gate',r.R[0]);
 ok(r.mawLargeIn>0&&r.mawOpenLarge>=r.mawLargeIn-1,'Gate 8: the Maw Gate opens for it (open above 0.9 on all but at most one of the '+r.mawLargeIn+' steps it is in the gate)',{in:r.mawLargeIn,open:r.mawOpenLarge});
 r=await p.evaluate(o=>__go(o),{...box([['door',8],['doorL',14]]),units:['htank'],steps:900});
 ok(r.R[0].crossed>0&&r.R[0].inDoor===0&&r.R[0].cx>13.5&&r.R[0].cx<16.5&&r.R[0].jump===0,'Gate 5: with a Petal Gate straight ahead and a Maw Gate six tiles along, the Bulwark goes round to the Maw Gate (crossed at x '+r.R[0].cx+')',r.R[0]);
 r=await p.evaluate(o=>__go(o),{gates:[['door',8]],gapAt:16,units:['htank'],steps:1200});
 ok(r.R[0].crossed>0&&r.R[0].inDoor===0&&r.R[0].cx>15.4&&r.R[0].jump===0,'Gate 5: with no Maw Gate but an open gap in the line, it takes the gap instead (crossed at x '+r.R[0].cx+')',r.R[0]);
 r=await p.evaluate(o=>__go(o),{...box([['door',4],['door',8],['doorL',13]]),units:['mite','tank','htank','mite','tank','htank'],spread:1,gap:1.1,steps:1200});
 {const L=r.R.filter(x=>x.t==='htank'),S=r.R.filter(x=>x.t!=='htank');
  ok(S.every(x=>x.crossed>0)&&L.every(x=>x.crossed>0&&x.inDoor===0&&x.cx>12.5&&x.cx<15.5)&&r.R.every(x=>x.jump===0)&&r.alive===6,'Gate 9: a mixed group (two each of Mite, Thornback, Bulwark): the small ants cross by any gate, both Bulwarks by the Maw Gate only',r.R.map(x=>[x.t,x.crossed,x.cx,x.inDoor]));}
 // saves: a v41 Bulwark saved standing inside a Petal Gate (v41 allowed it), loaded in v42
 {const q=await page(OLD);const S=await q.evaluate(async()=>{const {G,X,Y,gates}=__wall({seal:true,gates:[['door',8],['doorL',14]]});const g=gates[0];const u=spawnUnit('htank',X+8.5,Y+6.5);sendAnts([u],X+8.5,Y+11.5);step(1/30);u.x=X+8.5;u.y=Y+6.5;return encodeSave();});await q.close();
  r=await p.evaluate(async S=>{applySave(await decodeSave(S));const G=window.__game();const [X,Y]=[...G.blocks.values()].filter(b=>b.t==='door').map(b=>[b.x-8,b.y-6])[0];const u=G.units.find(u=>u.t==='htank');const at=[+(u.x-X).toFixed(2),+(u.y-Y).toFixed(2)];
    let k,out=-1,jumps=0,lx=u.x,ly=u.y;for(k=0;k<900;k++){step(1/30);if(k%2===0)render();const d=Math.hypot(u.x-lx,u.y-ly);if(d>.3)jumps++;lx=u.x;ly=u.y;const inDoor=u.x>X+8-.38&&u.x<X+9+.38&&u.y>Y+6-.38&&u.y<Y+7+.38;if(out<0&&!inDoor)out=k;}
    const g=blockAt(X+8,Y+6);return {at,out,jumps,hop:jumps,alive:G.units.includes(u)&&!u.dead,end:[+(u.x-X).toFixed(2),+(u.y-Y).toFixed(2)],door:g&&g.t,units:G.units.length};},S);
  ok(r.alive&&r.out>=0&&r.out<10&&r.door==='door','Gate 10: a v41 save with a Bulwark standing inside a Petal Gate loads; it is moved out of the gate to the nearest open ground within '+r.out+' steps (the game\'s own unstick, one short hop), not deleted, and plays on',r);}
 r=await p.evaluate(async()=>{const o={seal:true,gates:[['door',8],['doorL',14]]};const {G,X,Y}=__wall(o);const u=spawnUnit('htank',X+8.5,Y+2.5);sendAnts([u],X+8.5,Y+11.5);for(let k=0;k<120;k++)step(1/30);
   const s=await encodeSave();applySave(await decodeSave(s));const G2=window.__game();const u2=G2.units.find(q=>q.t==='htank');let inDoor=0,crossed=-1;
   for(let k=0;k<900;k++){step(1/30);if(u2.x>X+8-.38&&u2.x<X+9+.38&&u2.y>Y+6-.38&&u2.y<Y+7+.38)inDoor++;if(crossed<0&&u2.y>Y+8.4)crossed=k;}
   const keys=Object.keys(snapGame()).sort().join(',');return {crossed,inDoor,cx:+(u2.x-X).toFixed(2),keys};});
 ok(r.crossed>0&&r.inDoor===0,'Gate 10: saved on its way and loaded, it still keeps out of the Petal Gate and crosses by the Maw Gate',r);
 r=await p.evaluate(()=>{const {G,X,Y,gates}=__wall({seal:true,gates:[['door',8]]});const u=spawnUnit('htank',X+8.5,Y+2.5);sendAnts([u],X+8.5,Y+11.5);for(let k=0;k<300;k++)step(1/30);
   // the player replaces the Petal Gate with a Maw Gate: the waiting Bulwark now goes through
   removeBlock(gates[0]);const w=blockAt(X+9,Y+6);if(w)removeBlock(w);const w2=blockAt(X+9,Y+7);if(w2)removeBlock(w2);const w3=blockAt(X+8,Y+7);if(w3)removeBlock(w3);
   tryPlace('doorL',X+8,Y+6,0,true);for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();let crossed=-1;for(let k=0;k<600;k++){step(1/30);if(crossed<0&&u.y>Y+8.4)crossed=k;}return {crossed,maw:blockAt(X+8,Y+6)&&blockAt(X+8,Y+6).t};});
 ok(r.crossed>0&&r.maw==='doorL','Gate 3/6: not permanently stuck: when the Petal Gate it waits at is replaced by a Maw Gate, the Bulwark goes through',r);
 r=await p.evaluate(()=>{const {G,X,Y,gates}=__wall({seal:true,gates:[['door',8]]});const e=spawnEnemy('dagger');e.x=X+8.5;e.y=Y+2.5;e.hp=e.max=1e6;let into=0;for(let k=0;k<300;k++){step(1/30);if(Math.abs(e.x-X-8.5)<.5&&Math.abs(e.y-Y-6.5)<.5)into++;}return {into,op:gates[0].op||0};});
 ok(r.into===0&&r.op===0,'enemies still cannot pass a hive Petal Gate',r);
 // the siege flow field for large ants
 r=await p.evaluate(()=>{__seed(4);startGame('siege');const G=window.__game();let e=0;const u=spawnUnit('htank',G.core.x+2,G.core.y+2);G.units.push;try{for(let k=0;k<300;k++){step(1/30);if(k%3===0)render();}}catch(x){e++;}return {e,flowl:!!FLOWL.n,alive:!u.dead};});
 ok(r.e===0&&r.flowl,'Siege: the Bulwark\'s own route field is built and the mode runs without errors',r);
 // colony scenario: three Petal Gates and one Maw Gate in a long wall, the three kinds travelling together
 r=await p.evaluate(o=>__go(o),{seal:true,gates:[['door',2],['door',6],['doorL',10],['door',15]],units:['mite','tank','htank','mite','tank','htank','mite','tank','htank'],ux:8,spread:1.2,gap:1,steps:1500});
 {const L=r.R.filter(x=>x.t==='htank');ok(r.R.every(x=>x.crossed>0)&&L.every(x=>x.inDoor===0&&x.cx>9.5&&x.cx<12.5)&&r.R.every(x=>x.jump===0),'Colony: a wall with three Petal Gates and one Maw Gate, nine ants of the three kinds sent together: all arrive; every Bulwark uses the Maw Gate, none enters a Petal Gate, nobody jumps',r.R.map(x=>[x.t,x.crossed,x.cx,x.inDoor,x.inMaw]));}

 // ===================== Part 2: the four painted structures =====================
 const st=await p.evaluate(()=>['scatter','hail','lancer','factory'].map(t=>ART.plant[t].state));ok(st.every(s=>s==='ready'),'painted Spore Flak, Seed Mortar, Sunlance and Brood Chamber load',st);
 // ---- Spore Flak ----
 r=await p.evaluate(()=>strip0(__one({t:'scatter',ammo:PB,steps:300})));
 ok(r.L.every(l=>!l.newShot&&!l.used.includes('puff'))&&r.L.every(l=>!(l.s.pr>.01)),'Spore Flak idle (ammunition, nothing to shoot): no shot drawn, the sacs never tighten',{shots:r.L.filter(l=>l.newShot).length});
 r=await p.evaluate(()=>strip0(__one({t:'scatter',ammo:PB,steps:300,enemies:[['horizon',18,7],['mace',10,7]]})));
 {const shots=r.L.filter(l=>l.newShot),bullets=999-r.L[r.L.length-1].ammo,puffBad=r.L.filter(l=>l.used.includes('puff')&&!(l.t-l.shot<.24)).length,shotNoPuff=shots.filter(l=>!l.used.includes('puff')).length;
  ok(shots.length>3&&shots.length===bullets&&puffBad===0&&shotNoPuff===0,'Spore Flak firing at a Bomber: '+shots.length+' drawn discharges, '+bullets+' rounds really fired; the discharge only ever follows a real shot and every shot shows one',{shots:shots.length,bullets,puffBad,shotNoPuff});}
 r=await p.evaluate(()=>{const o=__one({t:'scatter',ammo:PB,steps:240,enemies:[['mace',12,7],['dagger',10,9]]});return {shots:o.L.filter(l=>l.newShot).length,born:o.L.reduce((a,l)=>a+l.born,0)};});
 ok(r.shots===0&&r.born===0,'Spore Flak: ground enemies in range: it never shoots (air only, as before)',r);
 r=await p.evaluate(()=>strip0(__one({t:'scatter',ammo:PB,n:3,steps:300,enemies:[['horizon',18,7]]})));
 ok(r.L.filter(l=>l.newShot).length===3&&r.L[r.L.length-1].ammo===0,'Spore Flak with 3 rounds: exactly 3 shots drawn, then none (no shots during an empty cooldown)',{shots:r.L.filter(l=>l.newShot).length});
 // ---- Seed Mortar ----
 r=await p.evaluate(()=>strip0(__one({t:'hail',ammo:GRAPH,steps:400,enemies:[['mace',19.5,6.5]]})));
 {const shots=r.L.filter(l=>l.newShot),bullets=999-r.L[r.L.length-1].ammo,puffBad=r.L.filter(l=>l.used.includes('puff')&&!(l.t-l.shot<.32)).length,seedEarly=r.L.filter(l=>l.shot!=null&&l.t-l.shot<.5&&l.used.includes('seed')).length,seedIdle=r.L.filter(l=>(l.shot==null||l.t-l.shot>.95)&&!l.used.includes('seed')).length;
  ok(shots.length>=2&&shots.length===bullets&&puffBad===0&&seedEarly===0&&seedIdle===0,'Seed Mortar firing at a Flame Tank 13 tiles away: every drawn throw is a real seed; the seed leaves the opening on the shot and is back once reloaded',{shots:shots.length,bullets,puffBad,seedEarly,seedIdle});}
 r=await p.evaluate(()=>{const o=__one({t:'hail',ammo:GRAPH,steps:300,enemies:[['mace',24,6.5]]});const l=o.L.find(l=>l.newShot);return {range:B.hail.tur.range,firstShotAt:l?l.t:null};});
 const mortarFirst=r;
 r=await p.evaluate(()=>{const o=__one({t:'hail',ammo:GRAPH,n:0,steps:90,enemies:[['mace',16,6.5]]});return {shots:o.L.filter(l=>l.newShot).length,seed:o.L.filter(l=>l.used.includes('seed')).length};});
 ok(r.shots===0&&r.seed===0,'Seed Mortar with no ammunition: no shots and no seed in the opening (the warning dot shows)',r);
 // ---- Sunlance ----
 r=await p.evaluate(()=>strip0(__one({t:'lancer',solar:20,steps:420,enemies:[['mace',15,7]]})));
 {const beams=r.L.filter(l=>l.laserFresh).length,beamDraw=r.L.filter(l=>l.used.includes('bpulse')),bad=beamDraw.filter(l=>!l.laser).length,glowBad=(()=>{let last=-9,n=0;for(const l of r.L){if((l.tgt&&l.pow>0)||l.laser)last=l.t;if(l.used.includes('glow')&&l.t-last>1.5)n++;}return n;})();
  ok(beams>=2&&bad===0&&beamDraw.length>=beams&&glowBad===0,'Sunlance with vigor: '+beams+' real beams; the painted beam is drawn only while the game\'s beam is live, and the lens only lights while really charging or just after a beam (fading within 1.5 s)',{beams,beamFrames:beamDraw.length,bad,glowBad});}
 r=await p.evaluate(()=>strip0(__one({t:'lancer',solar:0,steps:300,enemies:[['mace',15,7]]})));
 ok(r.L.every(l=>!l.laser&&!l.used.includes('bpulse')&&!(l.s.g>.05))&&r.L.some(l=>l.tgt)&&!(r.L[r.L.length-1].s.g>.001),'Sunlance with no vigor and a target in range: no beam (the game fires none either) and no charge shown (the game banks 2% in the one step before vigor runs out; that faint flicker fades to nothing)',{tgt:r.L.some(l=>l.tgt),pow:r.L[5].pow,charge:r.L[r.L.length-1].charge});
 r=await p.evaluate(()=>strip0(__one({t:'lancer',solar:20,steps:300})));
 ok(r.L.every(l=>!l.laser&&!l.used.includes('glow')),'Sunlance idle with vigor but nothing to shoot: dark lens, no beam',{});
 // ---- Brood Chamber ----
 for(const u of ['tank','htank']){
  r=await p.evaluate(u=>strip0(__one({t:'factory',solar:30,unit:u,prog:.5,steps:u==='tank'?400:700,bx:7,by:5})),u);
  const spawns=r.L.reduce((a,l)=>a+l.spawned,0),rel=r.L[r.L.length-1].s.ns||0,wrong=r.L.filter(l=>l.used.includes(u==='tank'?'embB':'embT')).length,right=r.L.filter(l=>l.prog>.05&&l.used.includes(u==='tank'?'embT':'embB')).length,growing=r.L.filter(l=>l.prog>.05).length,
    gapBad=r.L.filter(l=>l.used.includes('gap')&&!(l.s.relT!=null&&l.t-l.s.relT<.95)).length,flowBad=r.L.filter(l=>l.used.includes('flow')&&!(l.wants&&l.pow>0)).length;
  ok(spawns>=1&&rel===spawns&&wrong===0&&right===growing&&gapBad===0&&flowBad===0,`Brood Chamber growing a ${u==='tank'?'Thornback':'Bulwark Ant'}: its form shows in every growing frame (never the other kind); ${spawns} hatching(s), ${rel} drawn; the opening parts only on a real hatching; nutrients flow only while it is producing`,{spawns,rel,wrong,right,growing,gapBad,flowBad});}
 r=await p.evaluate(()=>{const o=__one({t:'factory',solar:30,unit:'tank',prog:.8,steps:200,bx:7,by:5,each:(k,b)=>{if(k===20){b.unit='htank';b.prog=0;}}});const l=o.L[o.L.length-1];return {ns:l.s.ns||0,spawned:o.L.reduce((a,x)=>a+x.spawned,0),embT:o.L.slice(25).filter(x=>x.used.includes('embT')).length};});
 ok(r.ns===0&&r.spawned===0&&r.embT===0,'Brood Chamber: changing what it grows at 80% (the game resets progress) is not drawn as a hatching, and the old form disappears',r);
 r=await p.evaluate(()=>strip0(__one({t:'factory',solar:0,unit:'tank',prog:.4,steps:300,bx:7,by:5})));
 ok(r.L.every((l,i)=>!l.used.includes('gap')&&(!l.used.includes('flow')||l.prog>(i?r.L[i-1].prog:.4)))&&Math.abs(r.L[r.L.length-1].prog-r.L[30].prog)<1e-9&&(r.L[r.L.length-1].s.act||0)<.01,'Brood Chamber with no vigor: progress stays where it is (after the one step the game runs before it counts vigor use, which really advances it) and nothing flows or opens unless progress really rose',{prog:r.L[r.L.length-1].prog,prog30:r.L[30].prog,flow:r.L.filter(l=>l.used.includes('flow')).length,gap:r.L.filter(l=>l.used.includes('gap')).length,act:r.L[r.L.length-1].s.act,firstFlow:r.L.findIndex(l=>l.used.includes('flow')||l.used.includes('gap'))});
 r=await p.evaluate(()=>{const o=__one({t:'factory',solar:30,steps:120,bx:7,by:5});const b=o.b;b.unit='tank';for(const k in b.inv)b.inv[k]=0;for(let k=0;k<120;k++){step(1/30);render();}const s=OST.get(b);return {prog:b.prog,wants:b.wants,act:s.act};});
 ok(r.prog===0&&!r.wants&&r.act<.01,'Brood Chamber with nothing to build from: idle, no activity',r);
 r=await p.evaluate(()=>{const out=[];for(const [bx,by,sx] of [[7,5,0],[2,9,0]]){const o=__one({t:'factory',solar:30,unit:'htank',prog:.97,steps:90,bx,by});const b=o.b,s=OST.get(b);NARROW=1;const e=exitTile(b);NARROW=0;
   const th=Math.atan2(e[1]-(b.y+1.5),e[0]-(b.x+1.5));const u=o.G.units[o.G.units.length-1];const inside=u&&u.x>b.x&&u.x<b.x+3&&u.y>b.y&&u.y<b.y+3;
   out.push({dth:+Math.abs(((s.th-th+Math.PI*3)%(Math.PI*2))-Math.PI).toFixed(3),spawn:u?[+(u.x-b.x).toFixed(2),+(u.y-b.y).toFixed(2)]:null,inside});}return out;});
 ok(r.every(x=>x.dth<.05&&x.spawn&&!x.inside),'Brood Chamber: the release opening faces the tile the game hatches onto, and hatchlings appear on that tile outside the chamber',r);
 // ---- shared checks for the four ----
 const KINDS=[['scatter',{ammo:'PB',solar:6,enemies:[['horizon',16,7]]}],['hail',{ammo:'GRAPH',solar:6,enemies:[['mace',17,6.5]]}],['lancer',{solar:20,enemies:[['mace',14,7]]}],['factory',{solar:30,unit:'tank',prog:.6,bx:7,by:5}]];
 for(const [t,o] of KINDS){
  r=await p.evaluate(([t,o])=>{if(o.ammo)o.ammo=eval(o.ammo);let e=0;const out={};try{
    const a=__one({t,...o,steps:60});const b=a.b;const s0=(OST.get(b)||{}).n||0;let hits=0;for(let k=0;k<6;k++){hurtBlock(b,b.max*.04);hits++;for(let j=0;j<10;j++){step(1/30);render();}}out.flinch=((OST.get(b)||{}).n||0)-s0;out.hits=hits;
    // repaired by a Healing Pod (the game restores 12% at a time)
    const m0=(OST.get(b)||{}).m||0;b.hp=b.max*.5;tryPlace('mender',b.x-2,b.y,0,true);const pod=blockAt(b.x-2,b.y);if(pod)pod.built=1;for(const q of window.__game().blocks.values())q.built=1;for(let k=0;k<200;k++){step(1/30);render();}out.mends=((OST.get(b)||{}).m||0)-m0;out.hp=+(b.hp/b.max).toFixed(2);
    // under construction, beside neighbours, at far and near zoom, art off and on
    b.built=.3;render();b.built=1;const G=window.__game();for(const [dx,dy] of [[-1,0],[b.size,0],[0,-1],[0,b.size]])tryPlace(dx<0||dy<0?'wall':'conveyor',b.x+dx,b.y+dy,0,true);for(const q of G.blocks.values())q.built=1;
    for(const z of [.6,1,2.6]){cam.z=z;for(let k=0;k<6;k++){step(1/30);render();}out['lite'+z]=organLite(t);}
    SET.art=false;for(let k=0;k<6;k++){step(1/30);render();}out.off=!artFor(t,0);SET.art=true;render();out.on=!!artFor(t,0);
    // destroyed
    const id=b.id;hurtBlock(b,b.max*3);for(let k=0;k<20;k++){step(1/30);render();}out.gone=!G.blocks.has(id);}catch(x){e++;out.err=String(x);}out.e=e;return out;},[t,o]);
  ok(r.e===0&&r.flinch===r.hits&&r.mends>0&&r['lite0.6']&&!r['lite2.6']&&r.off&&r.on&&r.gone,`${t}: hits (one flinch each, ${r.flinch}/${r.hits}), Healing Pod repairs (${r.mends} drawn), construction, neighbours, zoom 0.6/1/2.6, art off/on, destruction: no errors`,r);}
 r=await p.evaluate(()=>{const out={};for(const q of ['low','medium','high','epic']){applyQuality(q);let e=0;try{const a=__one({t:'scatter',ammo:PB,steps:30,enemies:[['horizon',16,7]]});const {put}={put:(t,x,y)=>tryPlace(t,__X[0]+x,__X[1]+y,0,true)};
     put('hail',12,2);put('lancer',12,9);put('factory',2,1);for(const b of window.__game().blocks.values())b.built=1;for(let k=0;k<30;k++){step(1/30);render();}}catch(x){e++;}out[q]={e,art:['scatter','hail','lancer','factory'].map(t=>!!artFor(t,0))};}applyQuality('high');return out;});
 ok(Object.values(r).every(v=>v.e===0)&&r.low.art.every(a=>!a)&&r.medium.art.every(a=>a)&&r.epic.art.every(a=>a),'Low, Medium, High, Epic: no errors; Low keeps the previous look',r);
 // crowds of 25 and 100 of each kind, all in view
 for(const t of ['scatter','hail','lancer','factory'])for(const N of [25,100]){r=await p.evaluate(([t,N])=>{__seed(3);startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    const X=G.core.x+4,Y=G.core.y-36;for(let y=Y-1;y<Y+34;y++)for(let x=X-1;x<X+62;x++){const i=y*MW+x;if(!inMap(x,y))continue;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    let n=0;const s=B[t].size;for(let y=0;y<32&&n<N;y+=s)for(let x=0;x<60&&n<N;x+=s)if(tryPlace(t,X+x,Y+y,0,true))n++;
    for(let k=0;k<20;k++)tryPlace('solar',X+k,Y+33,0,true);
    for(const b of G.blocks.values()){b.built=1;if(b.ammo)for(const k in B[b.t].tur.ammo)b.ammo[k]=99;if(b.t==='factory'){b.unit='tank';for(const [i,n] of U.tank.cost)b.inv[i]=n*3;}}
    for(let k=0;k<6;k++){const e2=spawnEnemy(k%2?'horizon':'mace');e2.x=X+20+k*3;e2.y=Y+10+k;e2.hp=e2.max=1e6;}
    let e=0;cam.z=N>50?.78:1;centerOn(X+30,Y+16);try{for(let k=0;k<60;k++){step(1/30);render();}}catch(x){e++;}return {placed:n,e,onScreen:ORGAN_N[t],lite:organLite(t)};},[t,N]);
  ok(r.e===0&&r.placed===N,`crowd: ${N} ${t} (${r.onScreen} on screen, cheap mode ${r.lite}): no errors`,r);}
 // saves mid-fire and mid-production, and the save format
 r=await p.evaluate(async()=>{const a=__one({t:'factory',solar:30,unit:'htank',prog:.7,steps:30,bx:7,by:5});const G=window.__game();tryPlace('scatter',__X[0]+2,__X[1]+2,0,true);tryPlace('hail',__X[0]+2,__X[1]+10,0,true);tryPlace('lancer',__X[0]+13,__X[1]+11,0,true);
   for(const b of G.blocks.values()){b.built=1;if(b.ammo){for(const k in B[b.t].tur.ammo)b.ammo[k]=50;}}for(const t of ['horizon','mace']){const e=spawnEnemy(t);e.x=__X[0]+14;e.y=__X[1]+4;e.hp=e.max=1e6;}
   for(let k=0;k<90;k++){step(1/30);render();}const S=await encodeSave();const keys={};const snap=snapGame();for(const b of snap.blocks)if(['scatter','hail','lancer','factory'].includes(b.t))keys[b.t]=Object.keys(b).sort().join(',');
   applySave(await decodeSave(S));let e=0;try{for(let k=0;k<200;k++){step(1/30);render();}}catch(x){e++;}const G2=window.__game();return {e,keys,units:G2.units.length,kinds:[...G2.blocks.values()].filter(b=>['scatter','hail','lancer','factory'].includes(b.t)).map(b=>b.t).sort()};});
 const keysNew=r.keys;
 {const q=await page(OLD);const k2=await q.evaluate(async()=>{const a=__one({t:'factory',solar:30,unit:'htank',prog:.7,steps:30,bx:7,by:5});const G=window.__game();tryPlace('scatter',__X[0]+2,__X[1]+2,0,true);tryPlace('hail',__X[0]+2,__X[1]+10,0,true);tryPlace('lancer',__X[0]+13,__X[1]+11,0,true);
   for(const b of G.blocks.values()){b.built=1;if(b.ammo){for(const k in B[b.t].tur.ammo)b.ammo[k]=50;}}for(const t of ['horizon','mace']){const e=spawnEnemy(t);e.x=__X[0]+14;e.y=__X[1]+4;e.hp=e.max=1e6;}for(let k=0;k<90;k++){step(1/30);render();}
   const keys={};for(const b of snapGame().blocks)if(['scatter','hail','lancer','factory'].includes(b.t))keys[b.t]=Object.keys(b).sort().join(',');return {keys,S:await encodeSave()};});
  const x=await p.evaluate(async S=>{let e=0;try{applySave(await decodeSave(S));for(let k=0;k<120;k++){step(1/30);render();}}catch(x){e++;}return e;},k2.S);await q.close();
  ok(r.e===0&&JSON.stringify(keysNew)===JSON.stringify(k2.keys)&&x===0,'save mid-fire and mid-hatch, load, play on: no errors; the saved fields of the four are exactly v41\'s; a v41 save loads',{keysNew,same:JSON.stringify(keysNew)===JSON.stringify(k2.keys),v41load:x});}
 r=await p.evaluate(()=>{const {G,X,Y}=__field({});const out={};for(const [t,x] of [['scatter',2],['hail',6],['lancer',9],['factory',13]]){const h=addBlock(t,X+x,Y+2,0,1);h.built=1;}render();
   return {hdf:['scatter','hail','lancer','factory'].map(t=>!!artFor(t,1)),ost:[...G.blocks.values()].filter(b=>b.team===1).some(b=>OST.get(b))};});
 ok(r.hdf.every(v=>!v)&&!r.ost,'HDF versions keep their colony look',r);
 await p.close();
 // missing PNG: one layer of each fails
 {const q=await page(NEW,async q=>{await q.route(/(spore-flak\/neck|seed-mortar\/chamber|sunlance\/lens|brood-chamber\/sac)\.png/,r=>r.abort());});
  const x=await q.evaluate(()=>{let e=0;try{const a=__field({});const {put}=a;put('scatter',2,2);put('hail',6,2);put('lancer',9,2);put('factory',13,2);for(const b of a.G.blocks.values())b.built=1;for(let k=0;k<20;k++){step(1/30);render();}}catch(x){e++;}
    return {st:['scatter','hail','lancer','factory','door'].map(t=>ART.plant[t].state),e};});
  ok(x.st.slice(0,4).every(s=>s==='failed')&&x.st[4]==='ready'&&x.e===0&&q.warns.filter(w=>/Art missing/.test(w)).length>=4,'missing PNG: each of the four falls back to its previous look with a console warning; the rest stay painted',{...x,warns:q.warns.filter(w=>/Art missing/.test(w)).length});await q.close();}

 // ===================== Part 3: combat and production the same as v41 =====================
 const SC=()=>{const out={};const runs=[['flak',{t:'scatter',ammo:PB,steps:600,ehp:400,enemies:[['horizon',18,7],['flare',17,4],['mace',12,7]]}],['mortar',{t:'hail',ammo:GRAPH,steps:600,ehp:500,enemies:[['mace',19,6.5],['dagger',16,9]]}],
     ['lance',{t:'lancer',solar:20,steps:600,ehp:800,enemies:[['mace',15,7],['dagger',14,5]]}],['lance0',{t:'lancer',solar:2,steps:600,ehp:800,enemies:[['mace',15,7]]}],['brood',{t:'factory',solar:30,unit:'tank',batches:3,steps:1200,bx:7,by:5}],['broodH',{t:'factory',solar:30,unit:'htank',batches:2,steps:1500,bx:7,by:5}]];
   for(const [n,o] of runs){const a=__one({...o,draw:true});const G=window.__game();out[n]={shots:a.L.filter(l=>l.newShot||l.laserFresh).length,enemies:a.es.map(e=>[+e.hp.toFixed(3),e.dead,+e.x.toFixed(3),+e.y.toFixed(3)]),units:G.units.map(u=>[u.t,+u.x.toFixed(3),+u.y.toFixed(3)]),items:G.items.slice(),inv:JSON.parse(JSON.stringify(a.b.inv)),prog:+(a.b.prog||0).toFixed(6),charge:+(a.b.charge||0).toFixed(6),ammo:a.b.ammo?JSON.parse(JSON.stringify(a.b.ammo)):null,kills:G.kills};}
   return out;};
 const pn=await page(NEW),po=await page(OLD);
 const rn=await pn.evaluate(`(${SC})()`),ro=await po.evaluate(`(${SC})()`);
 for(const k of Object.keys(rn)){const same=JSON.stringify(rn[k])===JSON.stringify(ro[k]);ok(same,`combat/production "${k}" identical to v41 after ${k.startsWith('brood')?'40-50':'20'} s`,same?{shots:rn[k].shots,units:rn[k].units.map(u=>u[0]),kills:rn[k].kills}:{v42:rn[k],v41:ro[k]});}
 {const q=await page(OLD);const x=await q.evaluate(()=>{const o=__one({t:'hail',ammo:GRAPH,steps:300,enemies:[['mace',24,6.5]]});const l=o.L.find(l=>l.newShot);return {range:B.hail.tur.range,firstShotAt:l?l.t:null};});await q.close();
  ok(JSON.stringify(x)===JSON.stringify(mortarFirst)&&x.range===15,'Seed Mortar keeps its long reach: range 15, and its first shot at a Flame Tank approaching from 17.5 tiles comes at the same moment as in v41',{v42:mortarFirst,v41:x});}
 ok(rn.flak.enemies[2][0]===400,'Spore Flak never hurts the ground Flame Tank in its range',{mace:rn.flak.enemies[2]});
 ok(rn.lance0.shots<rn.lance.shots,'Sunlance with little vigor: '+rn.lance0.shots+' beams in 20 s vs '+rn.lance.shots+' with full vigor (charging scales with vigor, as before)',{});
 ok(rn.brood.units.every(u=>u[0]==='tank')&&rn.broodH.units.every(u=>u[0]==='htank')&&rn.brood.units.length===3&&rn.broodH.units.length===2,'Brood Chamber makes only its own ants, one per batch paid for (3 Thornbacks from 3 batches, 2 Bulwarks from 2), nothing duplicated',{t:rn.brood.units.length,h:rn.broodH.units.length});
 ok(pn.errs.length===0&&po.errs.length===0,'no page errors',[pn.errs.slice(0,3),po.errs.slice(0,3)]);
 console.log(`${pass} passed, ${fail} failed`);await br.close();})();
