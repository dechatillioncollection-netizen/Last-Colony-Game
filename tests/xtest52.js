// v52: painted HDF ground vehicles. Checks the art loads, that every motion follows the game (tracks and wheels only while travelling,
// heading and turret, recoil and flame on real shots, damage marks, wrecks only on real deaths), the missing-art and art-off fallbacks,
// every quality, far zoom and big groups, that drawing adds nothing to an enemy, Landfall's Patrol 7 against v51, and seeded gameplay
// identity against v51 (Scout, Rammer, Flame and Siege Tanks, bosses included, drawn every other step). OLD names the v51 page.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v51.html',SHOTS=process.env.SHOTS||'shots52';
fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,file,o={})=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.warns=[];p.on('pageerror',e=>p.errs.push(String(e)));
  p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
  if(o.block)await p.route('**/'+o.block,r=>r.abort());
  await p.addInitScript(q=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},o.q||'high');
  await p.goto(URL+file);await p.waitForTimeout(1500);return p;};
(async()=>{const br=await chromium.launch();
 // ---- 1. art, motion and events
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{const out={};startGame('survival');G.countdown=1e9;G.paused=true;
   out.ready=Object.values(ART.hdfv).every(a=>a.state==='ready');out.layers=Object.fromEntries(Object.entries(ART.hdfv).map(([k,a])=>[k,a.layers.length]));
   const e=spawnEnemy('dagger');e.x=G.core.x+12;e.y=G.core.y;e.ang=0;e.hit=0;const keys0=Object.keys(e).sort().join();cam.z=2;centerOn(e.x,e.y);
   const fr=()=>{G.time+=1/30;render();};fr();const s=VEHV.get(e);
   // standing still: tracks do not run
   const pl0=s.pl;for(let i=0;i<20;i++)fr();out.still=s.pl===pl0&&s.pr===pl0;
   // straight ahead: both tracks run the same distance forward
   for(let i=0;i<30;i++){e.x+=.95/30;fr();}out.fwd=[s.pl-pl0,s.pr-pl0];out.ha0=s.ha;
   // turning: the hull eases round (never snaps), the outer track runs further
   const a0=s.ha;e.x+=0;for(let i=0;i<4;i++){e.y+=.95/30;fr();}out.turnStep=Math.abs(s.ha-a0);const d0=[s.pl,s.pr];
   for(let i=0;i<40;i++){e.y+=.95/30;fr();}out.turned=s.ha;out.split=(s.pl-d0[0])-(s.pr-d0[1]);
   // turret follows the aim angle at its own rate
   e.ang=Math.PI;fr();out.slew1=Math.abs(vehWrap(s.ta-Math.PI));for(let i=0;i<30;i++)fr();out.slew2=Math.abs(vehWrap(s.ta-Math.PI));
   // a real shot: recoil from that moment
   const ft0=s.ft;enemyFireAt(e,e.x-4,e.y,null,null);out.fired=s.ft===G.time&&ft0!==s.ft;G.bullets=[];
   // flame: the painted flame replaces the line, from the nozzles
   const m=spawnEnemy('mace');m.x=e.x;m.y=e.y+3;m.ang=0;fr();const b=[...G.blocks.values()][0];enemyFireAt(m,m.x+2,m.y,b,null);const f=G.fx[G.fx.length-1];
   out.flame=f.k==='flame'&&FXV.has(f)&&FXV.get(f).x>m.x;fr();
   // damage marks, the hit flash and the boss overlays are drawn
   let used=new Set();const O=ctx.drawImage.bind(ctx);ctx.drawImage=function(im,...a){used.add(im);return O(im,...a);};
   const M=ART.hdfv.dagger.M,bs=spawnEnemy('dagger',true);bs.x=e.x+2;bs.y=e.y;e.hp=e.max*.5;e.hit=.1;fr();
   const has=n=>M[n].some(x=>used.has(x));out.dmg1=has('dmg1')&&has('tdmg1');out.boss=has('boss')&&has('tboss');out.flash=[...used].some(x=>VEHWH.has(M.hull[0])||VEHWH.has(M.hull[1])||VEHWH.has(M.hull[2]));
   used=new Set();e.hp=e.max*.2;fr();out.dmg2=has('dmg2')&&has('tdmg2');ctx.drawImage=O;
   out.keys=Object.keys(e).sort().join()===keys0;
   // deaths: a kill and a Rammer's blast leave wrecks, a scripted removal does not
   const w0=VEHW.length;damageEnemy(e,1e9);const c=spawnEnemy('crawler');c.x=e.x;c.y=e.y+5;explode(c);const sc=spawnEnemy('fortress');sc.script=1;sc.dead=true;
   out.wrecks=VEHW.length-w0;fr();G.enemies=G.enemies.filter(x=>!x.dead);fr();
   G.time+=11;render();out.wreckGone=VEHW.length===0;
   // Siege outriggers come down only after it has stood still
   const sg=spawnEnemy('fortress');sg.x=G.core.x+14;sg.y=G.core.y+4;fr();const S=VEHV.get(sg);for(let i=0;i<20;i++)fr();out.legEarly=S.leg;for(let i=0;i<70;i++)fr();out.legLate=S.leg;
   for(let i=0;i<20;i++){sg.x+=.42/30;fr();}out.legMoving=S.leg;
   // far zoom and crowds use the cheap mode; close up with a few does not
   cam.z=1;render();out.lite1=vehLite;cam.z=.6;render();out.lite06=vehLite;cam.z=1;for(let i=0;i<50;i++){const x=spawnEnemy('dagger');x.x=sg.x+(i%10)*.8-4;x.y=sg.y+(i/10|0)*.8-2;}centerOn(sg.x,sg.y);render();out.liteCrowd=vehLite;
   return out;});
  ok('art for all four vehicles loads',r.ready,JSON.stringify(r.layers));
  ok('tracks still while standing',r.still);
  ok('tracks run forward together',r.fwd[0]>15&&Math.abs(r.fwd[0]-r.fwd[1])<1e-6,JSON.stringify(r.fwd));
  ok('hull eases into a turn',r.turnStep>0&&r.turnStep<.7,r.turnStep.toFixed(3));
  ok('hull ends on the new heading',Math.abs(r.turned-Math.PI/2)<.05,r.turned.toFixed(3));
  ok('outer track runs further in a turn',r.split>.5,r.split.toFixed(2));
  ok('turret slews to the aim',r.slew1>.5&&r.slew2<.01,r.slew1.toFixed(2)+' -> '+r.slew2.toFixed(3));
  ok('recoil starts on a real shot',r.fired);
  ok('flame drawn from the nozzles',r.flame);
  ok('damage marks at two levels, hit flash, boss overlays',r.dmg1&&r.dmg2&&r.flash&&r.boss,JSON.stringify([r.dmg1,r.dmg2,r.flash,r.boss]));
  ok('drawing adds nothing to an enemy',r.keys);
  ok('wrecks for a kill and a blast, none for a scripted removal',r.wrecks===2,r.wrecks);
  ok('wrecks fade and go',r.wreckGone);
  ok('Siege outriggers deploy only after standing still',r.legEarly===0&&r.legLate===1&&r.legMoving<1,[r.legEarly,r.legLate,r.legMoving.toFixed(2)].join(' '));
  ok('cheap mode at far zoom and in crowds only',!r.lite1&&r.lite06&&r.liteCrowd);
  ok('no errors',!p.errs.length,p.errs.slice(0,2).join(' | '));await p.close();}
 // ---- 2. missing art keeps the built-in look; art off draws the built-in look
 {const p=await open(br,NEW,{block:'art/hdf/scout-tank/hull.png'});
  const r=await p.evaluate(()=>{startGame('survival');G.paused=true;const e=spawnEnemy('dagger');e.x=G.core.x+10;e.y=G.core.y;cam.z=2;centerOn(e.x,e.y);render();
    const st=Object.fromEntries(Object.entries(ART.hdfv).map(([k,a])=>[k,a.state]));return {st,on:!!vehOn(e)};});
  await p.screenshot({path:SHOTS+'/fallback_missing_hull.png'});
  ok('a missing layer falls back for that vehicle only',r.st.dagger==='failed'&&r.st.mace==='ready'&&!r.on,JSON.stringify(r.st));
  ok('the console names the missing file',p.warns.some(w=>/scout-tank|Scout Tank/.test(w)&&/hull\.png/.test(w)),p.warns[0]);
  const r2=await p.evaluate(()=>{SET.art=false;const e=spawnEnemy('mace');e.x=G.core.x+10;e.y=G.core.y+2;render();return !vehOn(e);});
  ok('art off draws the built-in look',r2&&!p.errs.length,p.errs[0]);await p.close();}
 // ---- 3. every quality, close and far, with a big mixed wave
 for(const q of ['low','medium','high','epic']){const p=await open(br,NEW,{q});
  const r=await p.evaluate(q=>{applyQuality(q);startGame('survival');G.countdown=1e9;G.paused=true;const T0=['dagger','crawler','mace','fortress'];
    for(let i=0;i<70;i++){const e=spawnEnemy(T0[i%4],i%9===0);e.x=G.core.x+10+(i%10)*1.5;e.y=G.core.y-6+(i/10|0)*1.6;}
    for(let i=0;i<30;i++){step(STEP);render();}cam.z=2;centerOn(G.core.x+16,G.core.y-1);render();const a=SET.art;cam.z=.6;render();return {art:a};},q);
  await p.screenshot({path:`${SHOTS}/quality_${q}.png`});
  ok(`quality ${q} draws 70 vehicles`,!p.errs.length&&(q==='low'?!r.art:r.art),'painted '+r.art+' '+(p.errs[0]||''));await p.close();}
 // ---- 4. Landfall: Patrol 7 walks its track, stops, talks and withdraws, step for step as in v51
 const patrol=async file=>{const p=await open(br,file);
  const r=await p.evaluate(()=>{const NR=Math.random;let s=17;const SR=()=>(s=(s*16807)%2147483647)/2147483647;Math.random=SR;rnd=Math.random;
   const draw=()=>{Math.random=NR;try{render();}finally{Math.random=SR;}};
   startMission('landfall');let k=0;while(DLG.open&&k++<50)skipDlg();const G=window.__game();
   if(G.story.s!=='fc_walk')startFirstContact();const seq=[G.story.s],pos=[];let n=0;
   for(let i=0;i<30*300&&G.story.s!=='main';i++){if(DLG.open){skipDlg();continue;}step(STEP);if(i%2===0)draw();
     if(seq[seq.length-1]!==G.story.s)seq.push(G.story.s);if(i%30===0)pos.push(G.enemies.filter(e=>e.script).map(e=>e.x.toFixed(3)+','+e.y.toFixed(3)).join(' '));n=i;}
   if(seq[seq.length-1]!==G.story.s)seq.push(G.story.s);   // the last dialogue's close moves it on between steps
   return {seq,seenAt:G.story.seenAt,pos:pos.join('|'),steps:n,left:G.enemies.filter(e=>e.script).length,S:JSON.stringify(snapGame())};});
  r.errs=p.errs;await p.close();return r;};
 {const a=await patrol(OLD),b=await patrol(NEW);
  ok('Patrol 7: walks, stops, talks, withdraws, then the mission carries on',b.seq.join('>')==='fc_walk>fc_talk>fc_withdraw>fc_after>main'&&b.left===0,b.seq.join('>')+' stopped at '+JSON.stringify(b.seenAt));
  ok('Patrol 7 identical to v51 (route, stop, timing, save)',a.pos===b.pos&&a.seq.join()===b.seq.join()&&a.S===b.S&&a.steps===b.steps,`steps ${a.steps}/${b.steps}`);
  ok('no errors in the mission',!a.errs.length&&!b.errs.length,(b.errs[0]||''));}
 // ---- 5. seeded gameplay identity: a defended Bloom against waves of all four vehicles (and bosses), drawn every other step
 const ident=async(file,art)=>{const p=await open(br,file);
  const r=await p.evaluate(art=>{SET.art=art;const NR=Math.random;let s=29;const SR=()=>(s=(s*16807)%2147483647)/2147483647;Math.random=SR;rnd=Math.random;
   const draw=()=>{Math.random=NR;try{render();}finally{Math.random=SR;}};
   startGame('survival');const G=window.__game();G.countdown=1e9;const c=G.core,sp=G.spawn,ax=sp.x-c.x,ay=sp.y-c.y,L=Math.hypot(ax,ay),ux=ax/L,uy=ay/L;
   const put=(t,d,q)=>{const x=Math.round(c.x+1+ux*d-uy*q),y=Math.round(c.y+1+uy*d+ux*q);if(!freeArea(x,y,B[t].size))return;const b=addBlock(t,x,y,0,0);b.built=1;b.bt=0;if(b.ammo)for(const i in B[t].tur.ammo)b.ammo[i]=400;};
   for(let q=-8;q<=8;q+=2)put('duo',7,q);for(let q=-6;q<=6;q+=4)put('hail',5,q);for(let q=-9;q<=9;q++)put('wall',9,q);
   cam.z=1.2;centerOn(c.x+ux*8,c.y+uy*8);
   for(const w of [8,16,24]){G.wave=w-1;launchWave();G.countdown=1e9;for(let i=0;i<30*40;i++){step(STEP);if(i%2===0)draw();}}
   return {S:JSON.stringify(snapGame()),kills:G.kills,wrecks:typeof VEHW!=='undefined'?VEHW.length:0};},art);
  r.errs=p.errs;await p.close();return r;};
 {const a=await ident(OLD,true),b=await ident(NEW,true),c=await ident(NEW,false);
  ok('gameplay identical to v51 with painted vehicles',a.S===b.S,`kills ${a.kills}/${b.kills}, save ${a.S.length}/${b.S.length} chars`);
  ok('gameplay identical with painted vehicles off',c.S===b.S);
  ok('no errors through three waves',!a.errs.length&&!b.errs.length&&!c.errs.length,(b.errs[0]||''));}
 console.log(fails?`FAIL (${fails})`:'ALL PASS');await br.close();})();
