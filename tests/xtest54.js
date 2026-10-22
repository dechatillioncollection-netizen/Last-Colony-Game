// v54: painted HDF turrets (Duo Turret, Hail Cannon, Flak Turret, Lancer). Checks the art loads; the head follows the aim; the Duo's
// flashes and recoil come from the barrel the game really fired from, in its alternating order; the Hail recoils on its shots, the Flak
// never fires at ground units (it is air-only and the hive has no flyers) and cycles its four guns, the Lancer's discharge is picked up from its real beam and the beam leaves the emitter;
// shots stay hidden until they clear the barrels; damage marks, the hit flash and the cheap mode; a turret being placed fades in; drawing adds nothing to a block; art off,
// Low quality and a missing image fall back; Low to Epic with 200 turrets; save and load; and seeded gameplay and combat sound identical
// to v53 in the Test Range, Base Siege and Landfall's Patrol 7 (art on and off). OLD names the v53 page.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v53.html',SHOTS=process.env.SHOTS||'shots54';
fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,file,o={})=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.warns=[];p.on('pageerror',e=>p.errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
  if(o.block)await p.route('**/'+o.block,r=>r.abort());
  await p.addInitScript(q=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},o.q||'high');
  await p.goto(URL+file);await p.waitForTimeout(1800);return p;};
(async()=>{const br=await chromium.launch();
 // ---- 1. the Test Range's HDF arena: all four turrets against hive units
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{const out={};let s=11;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;
   startTestRange();const G=window.__game();G.paused=true;G.test.cur=1;document.getElementById('testPanel').classList.add('min');
   out.ready=Object.values(ART.hdft).every(a=>a.state==='ready');
   const tb=t=>[...G.blocks.values()].find(b=>b.team===1&&b.t===t&&arenaAt(b.x,b.y)===1);const duo=tb('duo'),hail=tb('hail'),fl=tb('scatter'),la=tb('lancer');
   cam.z=2.4;cam.x=79.5*T-640/cam.z;cam.y=56*T-400/cam.z;
   // drawImage spy: which images are drawn, and the rotation they are drawn at
   let used=new Map();const O=ctx.drawImage.bind(ctx);ctx.drawImage=function(im,...a){const m=ctx.getTransform();used.set(im,Math.atan2(m.b,m.a));return O(im,...a);};
   const M=t=>ART.hdft[t].M,has=(t,n)=>M(t)[n].some(x=>used.has(x)),angOf=(t,n)=>{for(const x of M(t)[n])if(used.has(x))return used.get(x);return null;};
   // the head is drawn at the game's aim angle
   for(const b of G.blocks.values())if(b.team===1&&b.t==='duo')b.ang=1.1;render();out.aim=Math.abs(angOf('duo','head')-1.1)<1e-6;out.drawn=['duo','hail','scatter','lancer'].every(t=>has(t,'base')&&has(t,'head')&&has(t,'barrel'));
   // a turret still being placed fades in through the art (the game's own construction alpha)
   {let al=null;const D=ctx.drawImage;ctx.drawImage=function(im,...a){if(M("duo").head.includes(im))al=Math.min(al===null?1:al,ctx.globalAlpha);return D.call(ctx,im,...a);};duo.built=.5;render();duo.built=1;ctx.drawImage=D;out.fade=al!==null&&Math.abs(al-bAlpha({built:.5}))<1e-6;}
   // drawing adds nothing to a block
   const snap=b=>JSON.stringify(Object.keys(b).sort().map(k=>[k,typeof b[k]==='object'&&b[k]?Object.keys(b[k]).length:b[k]]));const k0=[duo,hail,fl,la].map(snap);render();out.keys=[duo,hail,fl,la].map(snap).join()===k0.join();
   // damage marks and the hit flash (each turret's own silhouette)
   used=new Map();duo.hp=duo.max*.5;hail.hp=hail.max*.2;fl.hit=.1;render();out.dmg=has('duo','dmg1')&&has('duo','hdmg1')&&has('hail','dmg2')&&has('hail','hdmg2');
   out.hit=['base','tflat'].every(n=>M('scatter')[n].some(x=>VEHWH.has(x)));
   // the cheap mode at far zoom: the baked head, no separate barrels
   used=new Map();cam.z=.6;render();out.lite=turLite&&has('duo','tflat')&&!has('duo','barrel');out.liteDbg=[turLite,has('duo','tflat'),has('duo','barrel')];cam.z=2.4;duo.hp=duo.max;hail.hp=hail.max;fl.hit=0;render();
   // the Flak's four guns, fed shot times by hand (see below)
   const flk=new Set(),fs0=fl.shot;for(let k=0;k<4;k++){fl.shot=9000+k;render();TURV.get(fl).ft.forEach((t,j)=>{if(t===fl.shot)flk.add(j);});}fl.shot=fs0;render();
   // fight: ground units for the Duo, Hail and Lancer
   G.test.count=10;testSpawn('u','htank');testSpawn('u','mite');testSpawn('u','tank');
   const ev={duo:[],hail:0,flak:flk,flakGround:0,lancer:[],lf:new Set()};const seen={duo:duo.shot,hail:hail.shot,fl:fl.shot};
   for(let i=0;i<30*25;i++){const nb=G.bullets.length;step(1/30);
     // a new Duo shot: which side of the gun the game fired from, and which barrel the drawing kicks
     for(const p of G.bullets.slice(nb))if(p.ox!=null&&p.team===1){const [cx,cy]=bCenter(duo);if(Math.hypot(p.ox-cx,p.oy-cy)>.3)continue;
       const side=Math.sign(-(Math.sin(duo.ang))*(p.ox-cx)+Math.cos(duo.ang)*(p.oy-cy));render();const st=TURV.get(duo),bi=st.ft.indexOf(duo.shot);
       ev.duo.push([side,bi>=0?Math.sign(TUR.duo.bar[bi]):0]);out.hideFresh=turHideShot(p);}
     if(hail.shot!==seen.hail){seen.hail=hail.shot;render();if(TURV.get(hail).ft[0]===hail.shot)ev.hail++;}
     if(fl.shot!==seen.fl){seen.fl=fl.shot;ev.flShots=(ev.flShots||0)+1;render();const st=TURV.get(fl);st.ft.forEach((t,j)=>{if(t===fl.shot)ev.flak.add(j);});
       const tg=fl.target;if(tg&&!U[tg.t].air)ev.flakGround++;}
     const lf=G.fx.find(f=>f.k==='laser'&&f.team===1&&!ev.lf.has(f));if(lf){ev.lf.add(lf);render();const st=TURV.get(la);ev.lancer.push(Math.abs(st.lt-(G.time-(lf.max-lf.life)))<1e-9);}
     if(i%5===0)render();}
   // the Flak is air-only and the hive has no flyers, so it stays idle in play; its four guns are checked by feeding the drawing shot times
   ev.flakIdle=!ev.flShots;ctx.drawImage=O;
   out.dbg={flShot:fl.shot,units:G.units.length,air:G.units.filter(u=>U[u.t].air).length,epow:G.epow,lch:la.charge,lt:la.target?la.target.t:null};out.ev={duo:ev.duo.length,duoMatch:ev.duo.every(([a,b])=>a===b),duoAlt:ev.duo.slice(1).some((d,i)=>d[0]!==ev.duo[i][0]),hail:ev.hail,flak:[...ev.flak].sort().join(),flakGround:ev.flakGround,flakIdle:ev.flakIdle,lancer:ev.lancer.length,lancerOk:ev.lancer.every(x=>x)};
   // a bullet that has cleared the barrels is drawn again
   const p0={team:1,ox:0,oy:0,x:.9,y:0,vx:14,vy:0};out.hideFar=!turHideShot(p0);
   // the beam leaves the emitter: the drawn line starts tip tiles out from the turret centre
   const [lx,ly]=bCenter(la);G.fx.push({k:'laser',x1:lx,y1:ly,x2:lx+8,y2:ly,life:.25,max:.25,team:1});let mv=null;const OM=ctx.moveTo.bind(ctx);ctx.moveTo=function(x,y){if(mv===null&&Math.abs(y-ly*T)<1)mv=x;return OM(x,y);};render();ctx.moveTo=OM;
   out.beam=mv!==null&&Math.abs(mv-(lx+TUR.lancer.tip)*T)<.5;G.fx.pop();
   return out;});
  await p.screenshot({path:`${SHOTS}/testrange_far.png`});
  ok('art loads for all four turrets',r.ready);
  ok('base, head and barrels drawn; the head at the aim angle',r.drawn&&r.aim);
  ok('Duo: each flash and recoil on the barrel the shot left from',r.ev.duo>=4&&r.ev.duoMatch,`${r.ev.duo} shots`);
  ok('Duo: the two barrels alternate as the game alternates them',r.ev.duoAlt);
  ok('Hail: recoil on every real shot',r.ev.hail>=2,`${r.ev.hail} shots`);
  ok('Flak: never fires at ground units, and its four guns cycle on shots',r.ev.flakGround===0&&r.ev.flakIdle&&r.ev.flak==='0,1,2,3',`guns ${r.ev.flak} `+JSON.stringify(r.dbg));
  ok('Lancer: discharge taken from its real beam',r.ev.lancer>=1&&r.ev.lancerOk,`${r.ev.lancer} beams`);
  ok('the HDF beam starts at the emitter',r.beam);
  ok('shots hidden inside the barrels, shown once clear',r.hideFresh===true&&r.hideFar);
  ok('damage marks at both levels; hit flash uses the turret silhouette',r.dmg&&r.hit,JSON.stringify([r.dmg,r.hit]));
  ok('cheap mode at far zoom',r.lite,JSON.stringify(r.liteDbg));
  ok('a turret being placed fades in with the art, as before',r.fade);
  ok('drawing adds nothing to a block',r.keys);
  ok('no errors in the Test Range',!p.errs.length,p.errs[0]);await p.close();}
 // ---- 2. art off, Low quality and a missing image fall back to the built-in look
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{startTestRange();const G=window.__game();G.paused=true;cam.z=2.4;cam.x=79.5*T-640/cam.z;cam.y=56*T-400/cam.z;
   let n=0;const O=ctx.drawImage.bind(ctx);const all=new Set();for(const a of Object.values(ART.hdft))for(const k in a.M)for(const x of a.M[k])all.add(x);
   ctx.drawImage=function(im,...a){if(all.has(im))n++;return O(im,...a);};SET.art=false;render();const off=n;SET.art=true;applyQuality('low');render();const low=n;ctx.drawImage=O;return {off,low};});
  ok('art off and Low quality draw the built-in turrets',r.off===0&&r.low===0&&!p.errs.length,JSON.stringify(r));await p.close();}
 {const p=await open(br,NEW,{block:'hdf/flak-turret/head.png'});
  const r=await p.evaluate(()=>{startTestRange();window.__game().paused=true;cam.z=2.4;cam.x=79.5*T-640/cam.z;cam.y=56*T-400/cam.z;render();
   return {fl:ART.hdft.scatter.state,others:['duo','hail','lancer'].map(t=>ART.hdft[t].state)};});
  await p.screenshot({path:`${SHOTS}/fallback_missing_flak.png`});
  ok('a missing image: that turret keeps the built-in look and the console names the file',r.fl==='failed'&&r.others.every(s=>s==='ready')&&p.warns.some(w=>w.includes('Flak Turret: head.png'))&&!p.errs.length);await p.close();}
 // ---- 3. every quality with 200 turrets on screen, close and far
 for(const q of ['low','medium','high','epic']){const p=await open(br,NEW,{q});
  const r=await p.evaluate(q=>{applyQuality(q);let sd=3;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.paused=true;const c=G.core,K=['duo','hail','scatter','lancer'];let n=0;
   for(let y=-16;y<=16&&n<200;y+=2)for(let x=8;x<=50&&n<200;x+=2){const t=K[n%4],X=c.x+x,Y=c.y+y;if(!freeArea(X,Y,B[t].size))continue;const b=addBlock(t,X,Y,0,1);b.built=1;b.ang=n*.7;n++;}
   for(let i=0;i<20;i++)step(STEP);cam.z=1.4;centerOn(c.x+22,c.y);render();cam.z=.5;render();cam.z=1.4;render();return {n,art:SET.art};},q);
  await p.screenshot({path:`${SHOTS}/quality_${q}.png`});
  ok(`quality ${q} draws ${r.n} turrets`,!p.errs.length&&r.n===200,'painted '+r.art+' '+(p.errs[0]||''));await p.close();}
 // ---- 4. save and load keep the turrets drawing
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{let sd=5;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;startGame('siege');const G=window.__game();G.paused=true;for(let i=0;i<60;i++)step(STEP);const S=snapGame();applySave(JSON.parse(JSON.stringify(S)));
   const S2=JSON.stringify(snapGame());const G2=window.__game();const b=[...G2.blocks.values()].find(b=>b.team===1&&b.t==='duo');cam.z=2;centerOn(b.x,b.y);let hit=0;const O=ctx.drawImage.bind(ctx);
   ctx.drawImage=function(im,...a){if(ART.hdft.duo.M.head.includes(im))hit++;return O(im,...a);};render();ctx.drawImage=O;return {hit,S2};});
  ok('save and load: turrets painted after loading',r.hit>0&&!p.errs.length,JSON.stringify(r.hit)+(p.errs[0]||''));await p.close();
  const q=await open(br,OLD);const o=await q.evaluate(()=>{let sd=5;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;startGame('siege');const G=window.__game();G.paused=true;for(let i=0;i<60;i++)step(STEP);applySave(JSON.parse(JSON.stringify(snapGame())));return JSON.stringify(snapGame());});await q.close();
  ok('save and load: the reloaded game is the same as v53\'s',o===r.S2);}
 // ---- 5. seeded gameplay and combat sound identity against v53
 const seeded=async(file,art,mode)=>{const p=await open(br,file);
  const r=await p.evaluate(([art,mode])=>{SET.art=art;const NR=Math.random;let s=31;const SR=()=>(s=(s*16807)%2147483647)/2147483647;Math.random=SR;rnd=Math.random;
   const draw=()=>{Math.random=NR;try{render();}finally{Math.random=SR;}};const fire=[];const os=snd;snd=function(k,b,...a){if(k==='fire'&&b&&b.team===1)fire.push(G.time.toFixed(3)+b.t);return os(k,b,...a);};
   let G;
   if(mode==='range'){startTestRange();G=window.__game();G.test.cur=1;G.test.count=10;for(const w of [0,1,2]){testSpawn('u','htank');testSpawn('u','tank');testSpawn('u','mite');for(let i=0;i<30*20;i++){step(STEP);if(i%2===0)draw();}}}
   else{startGame('siege');G=window.__game();const cr=[...G.blocks.values()].find(b=>b.team===1&&b.t==='core');for(const w of [0,1]){for(let k=0;k<14;k++){const u=spawnUnit(['mite','htank','tank'][k%3],cr.x-22+(k%4),cr.y-6+k);u.home=[cr.x,cr.y];}
     for(let i=0;i<30*45;i++){step(STEP);if(i%2===0)draw();}}}
   return {S:JSON.stringify(snapGame()),fire:fire.join(' '),shots:fire.length};},[art,mode]);
  r.errs=p.errs;await p.close();return r;};
 for(const mode of ['range','siege']){const a=await seeded(OLD,true,mode),b=await seeded(NEW,true,mode),c=await seeded(NEW,false,mode);
  ok(`${mode==='range'?'Test Range':'Base Siege'}: gameplay identical to v53 with painted turrets`,a.S===b.S&&a.S.length>1000,`save ${a.S.length}/${b.S.length} chars`);
  ok(`${mode==='range'?'Test Range':'Base Siege'}: gameplay identical with painted turrets off`,c.S===b.S);
  ok(`${mode==='range'?'Test Range':'Base Siege'}: HDF gun sounds at the same moments`,a.fire===b.fire&&b.shots>5,`${b.shots} shots ${a.fire===b.fire}`);
  ok(`${mode==='range'?'Test Range':'Base Siege'}: no errors`,!a.errs.length&&!b.errs.length&&!c.errs.length,b.errs[0]||c.errs[0]||'');}
 // ---- 6. Landfall: Patrol 7 walks its track, stops, talks and withdraws, step for step as in v53
 const patrol=async file=>{const p=await open(br,file);
  const r=await p.evaluate(()=>{const NR=Math.random;let s=17;const SR=()=>(s=(s*16807)%2147483647)/2147483647;Math.random=SR;rnd=Math.random;
   const draw=()=>{Math.random=NR;try{render();}finally{Math.random=SR;}};
   startMission('landfall');let k=0;while(DLG.open&&k++<50)skipDlg();const G=window.__game();
   if(G.story.s!=='fc_walk')startFirstContact();const seq=[G.story.s];let n=0;
   for(let i=0;i<30*300&&G.story.s!=='main';i++){if(DLG.open){skipDlg();continue;}step(STEP);if(i%2===0)draw();if(seq[seq.length-1]!==G.story.s)seq.push(G.story.s);n=i;}
   if(seq[seq.length-1]!==G.story.s)seq.push(G.story.s);return {seq:seq.join('>'),steps:n,S:JSON.stringify(snapGame())};});
  r.errs=p.errs;await p.close();return r;};
 {const a=await patrol(OLD),b=await patrol(NEW);
  ok('Patrol 7 identical to v53, with no fighting during the encounter',a.S===b.S&&a.seq===b.seq&&b.seq==='fc_walk>fc_talk>fc_withdraw>fc_after>main'&&!b.errs.length,b.seq);}
 console.log(fails?`FAIL (${fails})`:'ALL PASS');await br.close();})();
