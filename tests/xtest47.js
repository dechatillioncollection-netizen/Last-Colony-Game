// v47 tests: the Landfall tutorial (copy, real step checks, hints, recovery, saves, replay and skip, first contact) and combat sound
// (impact chosen by what was hit, no sound for hits that never happened, the limiter, crowds, the sound test, cost).
// Runs against index.html on localhost:8123.
const {chromium}=require(process.env.PW||'playwright');
const NEW=process.env.NEW||'index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctx=await b.newContext({viewport:{width:1280,height:800}});
 const errs=[];
 const open=async(o={})=>{const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));await p.goto('http://localhost:8123/'+NEW);await p.waitForTimeout(700);
   if(o.clear)await p.evaluate(()=>localStorage.clear());await p.mouse.click(5,5);
   for(let i=0;i<80;i++){if(await p.evaluate(()=>!window.__snd||__snd.ready))break;await p.waitForTimeout(150);}
   // helpers in the page: run the game for a while (the sim paused in real time so the test drives every step), read the panel
   await p.evaluate(()=>{window.__run=(sec,until)=>{const n=Math.round(sec/STEP);for(let k=0;k<n;k++){step(STEP);storyFrame();frame++;if(until&&until())return true;}return false;};
     window.__panel=()=>({k:G.story&&G.story.k,s:G.story&&G.story.s,title:$('tutTitle').textContent,lead:$('tutLead').hidden?'':$('tutLead').textContent,text:$('tutText').hidden?'':$('tutText').textContent,
       info:$('tutInfo').textContent,hint:$('tutHint').hidden?'':$('tutHint').textContent,next:!!$('tutNext'),hidden:$('tut').hidden});
     window.__msgs=[];const m0=msg;msg=function(t,k){__msgs.push(t);return m0.apply(this,arguments);};});
   return p;};
 const p=await open({clear:true});
 const P=()=>p.evaluate(()=>__panel());

 // ---- fresh start: the welcome, Step 1
 await p.evaluate(()=>{SET.fog=false;startMission('landfall');while(DLG.open)skipDlg();setSpeed(0);});
 let r=await P();
 ok(r.s==='tut'&&r.k===0&&r.lead.startsWith('Welcome to Landfall.')&&/Enemy waves are paused/.test(r.lead)&&/WASD/.test(r.text)&&!/pinch/i.test(JSON.stringify(r)),'a fresh Landfall opens on Step 1 with the short welcome; no pinch-to-zoom anywhere',r);
 const allCopy=await p.evaluate(()=>{const st=G.story,o=[];for(const s of TUT)for(const f of ['lead','do','info','done'])o.push(tutVal(s[f],st));return o.join(' | ');});
 ok(!/pinch|Nymbri/i.test(allCopy)&&!/\bI\b/.test(allCopy)&&!/\bcolor\b|\bcenter\b|\btoward\b/.test(allCopy),'no unsupported controls, no species name, no "I", UK spelling in every panel',allCopy.length);
 ok(await p.evaluate(()=>TUT.filter(s=>s.next).map(s=>s.id).join())==='web','Step 6 (Rootweb) is the only step with a Next button');
 ok(!/ring/.test(await p.evaluate(()=>tutVal(TUT[5].info)))&&/ring/.test(await p.evaluate(()=>tutVal(TUT[8].info)))&&/orange/.test(await p.evaluate(()=>tutVal(TUT[6].info))),'the reach ring is explained at the Node step, ore colour at the Root Tap step, neither at Step 6');
 // real camera movement with the keyboard
 await p.keyboard.down('d');await p.waitForTimeout(700);await p.keyboard.up('d');await p.waitForTimeout(200);
 r=await P();ok(r.k===1,'Step 1 completes by moving the camera with D',r.k);
 ok(await p.evaluate(()=>__msgs.some(t=>/^Camera moved\./.test(t))&&!__msgs.some(t=>/: done\.$/.test(t))),'completion feedback says what was learned (no "Look around: done.")',await p.evaluate(()=>__msgs.slice(-2)));
 // Step 2: click the Bloom on screen
 const scr=(x,y)=>p.evaluate(([x,y])=>[(x*T-cam.x)*cam.z,(y*T-cam.y)*cam.z],[x,y]);
 await p.waitForTimeout(900);
 let c=await p.evaluate(()=>[G.core.x+1.5,G.core.y+1.5]);let s=await scr(c[0],c[1]);await p.mouse.click(s[0],s[1]);await p.waitForTimeout(200);
 r=await P();ok(r.k===2&&/Three Mite Ants/.test(r.text),'Step 2 completes by clicking the Bloom; Step 3 asks for one ant',r);
 ok(await p.evaluate(()=>G.units.filter(u=>u.t==='mite').length)===3,'three Mite Ants were budded, once');
 c=await p.evaluate(()=>[G.units[0].x,G.units[0].y]);s=await scr(c[0],c[1]);await p.mouse.click(s[0],s[1]);await p.waitForTimeout(200);
 r=await P();ok(r.k===3,'Step 3 completes by clicking an ant',r.k);
 // Step 4: a click on rock is not an order; a click on open ground is
 const rock=await p.evaluate(()=>{const u=G.units[0];for(let r=2;r<14;r++)for(let a=0;a<32;a++){const x=Math.floor(u.x+r*Math.cos(a*.2)),y=Math.floor(u.y+r*Math.sin(a*.2));if(inMap(x,y)&&G.terrain[y*MW+x]===ROCK&&onView(x+.5,y+.5,-1))return [x+.5,y+.5];}return null;});
 if(rock){s=await scr(rock[0],rock[1]);await p.mouse.click(s[0],s[1]);await p.waitForTimeout(200);r=await P();ok(r.k===3,'a click on rock gives no order and does not complete Step 4',{rock,k:r.k});
   c=await p.evaluate(()=>[G.units[0].x,G.units[0].y]);s=await scr(c[0],c[1]);await p.mouse.click(s[0],s[1]);await p.waitForTimeout(200);}
 else ok(true,'(no rock on screen near the ant to test an invalid order)');
 const og=await p.evaluate(()=>{const u=G.units[0];for(let r=2;r<6;r++)for(let a=0;a<16;a++){const x=Math.floor(u.x+r*Math.cos(a*.39)),y=Math.floor(u.y+r*Math.sin(a*.39)),i=y*MW+x;
   if(inMap(x,y)&&!blockAt(x,y)&&!solidTile(i,0)&&!G.units.some(v=>Math.hypot(v.x-x-.5,v.y-y-.5)<1.2))return [x+.5,y+.5];}});
 s=await scr(og[0],og[1]);await p.mouse.click(s[0],s[1]);await p.waitForTimeout(200);
 r=await P();ok(r.k===4&&/Swarm \(C\) twice/.test(r.text),'Step 4 completes with a move order onto open ground',r);
 // Step 5: the real states, Defend then Attack then Defend
 await p.keyboard.press('c');await p.waitForTimeout(500);r=await P();
 ok(r.k===4&&r.hint==='Now switch back to Defend.'&&await p.evaluate(()=>G.command)==='attack','one press switches to Attack and the step waits, asking for Defend',r);
 await p.keyboard.press('c');await p.waitForTimeout(150);r=await P();
 ok(r.k===5&&await p.evaluate(()=>G.command)==='defend','the second press returns to Defend and completes Step 5',r.k);
 ok(r.next&&!r.text&&/five connected tiles/.test(r.info)&&/Root Taps and Deep Roots/.test(r.info),'Step 6 explains the Rootweb in one panel with Next',r);
 await p.click('#tutNext');await p.waitForTimeout(150);r=await P();ok(r.k===6&&/Root Tap \(4\)/.test(r.text),'Next moves to Step 7',r.k);

 // ---- Step 7: a Root Tap touching the Bloom does not count; one on lead does not count; one on the copper does
 r=await p.evaluate(()=>{G.items[CU]+=400;const C=G.core;let spot=null;
   for(const [x,y] of [[C.x+C.size,C.y],[C.x-2,C.y],[C.x,C.y+C.size],[C.x,C.y-2]])if(!placeCheck('drill',x,y)||true){spot=[x,y];break;}
   for(let yy=spot[1];yy<spot[1]+2;yy++)for(let xx=spot[0];xx<spot[0]+2;xx++){const i=yy*MW+xx;if(!blockedT(i)&&!G.bgrid[i])G.ore[i]=CU;}
   const why=placeCheck('drill',spot[0],spot[1]),okp=tryPlace('drill',spot[0],spot[1],0,true);__run(.5);return {why,okp,spot,p:__panel()};});
 ok(r.okp&&r.p.k===6&&/touches the Bloom/.test(r.p.hint),'a Root Tap placed touching the Bloom does not complete Step 7, and the hint explains why',r);
 await p.evaluate(()=>{for(const b of hiveOf('drill'))deconstruct(b);__run(.2);});
 // the copper: a spot on the highlighted vein, beyond the Rootweb if there is one, otherwise the best spot
 r=await p.evaluate(()=>{const v=nearVein(CU),cx=G.core.x+1.5,cy=G.core.y+1.5;let best=null,bs=-1,off=null;
   for(let y=Math.floor(v[1])-3;y<=v[1]+2;y++)for(let x=Math.floor(v[0])-3;x<=v[0]+2;x++){if(placeCheck('drill',x,y))continue;const o=drillOre('drill',x,y);if(o.item!==CU)continue;
     if(!G.web[y*MW+x]&&!off)off=[x,y];if(o.count>bs){bs=o.count;best=[x,y];}}
   const at=best;const placed=tryPlace('drill',at[0],at[1],0,true);const tap=hiveOf('drill')[0];const site=isSite(tap);__run(.2);
   return {at,off,placed,site,p:__panel(),msgs:__msgs.slice(-2)};});
 ok(r.placed&&r.site&&r.p.k===7,'a Root Tap site on the highlighted copper completes Step 7 at once (placing the site), and it is still growing',r);
 ok(/once it has grown/.test(r.msgs.join(' ')),'the completion line says the Root Tap still has to grow',r.msgs);
 ok(/still growing/.test(r.p.hint),'Step 8 hints that the Root Tap is still growing',r.p.hint);
 // ---- Step 8: a Vine laid the wrong way does not count, and the hint names the arrows
 r=await p.evaluate(()=>{__run(4.5);const tap=hiveOf('drill')[0];routeBelt(G.core,tap,0);__run(.1);const n=hiveOf('conveyor').length;__run(12);return {n,out:tap.out,p:__panel(),vcore:G.story.vcore};});
 ok(r.n>0&&r.p.k===7&&r.vcore===0,'a Vine running from the Bloom to the Root Tap delivers nothing and Step 8 waits',r);
 ok(/points into the Root Tap/.test(r.p.hint)&&/arrows/.test(r.p.hint),'the hint says to check the Vine arrows',r.p.hint);
 r=await p.evaluate(()=>{for(const b of hiveOf('conveyor'))deconstruct(b);__run(.3);const tap=hiveOf('drill')[0],cu0=G.income[CU];routeBelt(tap,G.core,0);const n=hiveOf('conveyor').length;
   const done=__run(30,()=>G.story.k!==7);return {n,done,p:__panel(),msgs:__msgs.slice(-1)};});
 ok(r.n>0&&r.done&&r.p.k===8&&/Copper is flowing/.test(r.msgs[0]),'a Vine from the Root Tap to the Bloom completes Step 8 once copper arrives along it',r);
 // ---- Step 9: a Node deep inside the Rootweb does not count; one by the ring does
 r=await p.evaluate(()=>{const C=G.core;let at=null;for(const [dx,dy] of [[-2,1],[4,1],[1,-2],[1,4],[-2,-2]]){if(!placeCheck('node',C.x+dx,C.y+dy)&&nodeGain({x:C.x+dx,y:C.y+dy,id:-3})<6){at=[C.x+dx,C.y+dy];break;}}
   const placed=at&&tryPlace('node',at[0],at[1],0,true);__run(5);return {at,placed,p:__panel(),ring:G.story.nodeAt};});
 ok(r.placed&&r.p.k===8&&/deep inside the Rootweb/.test(r.p.hint),'a Rootweb Node next to the Bloom does not complete Step 9, and the hint says why',r);
 r=await p.evaluate(()=>{const a=G.story.nodeAt,placed=tryPlace('node',a[0],a[1],0,true),g=nodeGain({x:a[0],y:a[1],id:-4});const done=__run(8,()=>G.story.k!==8);return {a,placed,g,done,p:__panel()};});
 ok(r.placed&&r.g>=6&&r.done&&r.p.k===9,'a Rootweb Node on the highlighted spot near the edge completes Step 9',r);
 ok(await p.evaluate(()=>{const a=G.story.nodeAt;return !!a&&G.web[a[1]*MW+a[0]]===1;}),'the suggested Node spot is on the Rootweb (placeable without hunting)');
 // ---- Step 10: a grown but dry Thorn Spitter does not start first contact; once a Vine feeds it copper, it does
 r=await p.evaluate(()=>{const C=G.core;let at=null;for(let dx=5;dx<10&&!at;dx++)for(const dy of [1,0,2,-1,3])if(!placeCheck('duo',C.x+dx,C.y+dy)){at=[C.x+dx,C.y+dy];break;}
   tryPlace('duo',at[0],at[1],0,true);__run(.2);const h1=__panel().hint;__run(4);return {at,h1,p:__panel(),s:G.story.s,ammo:hiveOf('duo')[0].ammo};});
 ok(r.p.k===9&&r.s==='tut'&&/growing/.test(r.h1)&&/feed it copper/.test(r.p.hint),'a grown Thorn Spitter with no ammunition keeps the tutorial on Step 10 (no first contact) and the hint says to feed it',r);
 ok(/resin and chitin/.test(r.p.info),'Step 10 does not say copper is the only ammunition',r.p.info);
 r=await p.evaluate(()=>{const tap=hiveOf('drill')[0],duo=hiveOf('duo')[0];G.items[CU]+=200;const okr=routeBelt(tap,duo,0);const done=__run(40,()=>G.story.s!=='tut');
   return {okr:!!okr,done,s:G.story.s,ammo:duo.ammo[CU],msgs:__msgs.slice(-3),cease:G.story.cease,patrol:G.enemies.filter(e=>e.script).length};});
 ok(r.done&&r.s==='fc_walk'&&r.cease&&r.patrol===3,'once a Vine brings copper to the Thorn Spitter, first contact begins with the ceasefire on',r);
 ok(r.msgs.some(t=>t==='Your defences are ready. Movement has been detected on the survey track to the east.'),'the transition line is shown',r.msgs);
 // no early hostility: walk the patrol in and watch for shots and damage
 // (in real time at 4x speed: the patrol waits for the event camera, which moves with the frame clock)
 await p.evaluate(()=>{window.__P=G.enemies.filter(e=>e.script);window.__hp0=__P.map(e=>e.hp).join();window.__shots=0;setSpeed(4);
   window.__mon=setInterval(()=>{__shots+=G.bullets.filter(q=>q.team===0).length;},50);});
 for(let k=0;k<180&&!await p.evaluate(()=>DLG.open);k++)await p.waitForTimeout(500);
 r=await p.evaluate(()=>{clearInterval(__mon);setSpeed(0);return {hp0:__hp0,hp1:__P.map(e=>e.hp).join(),shots:__shots,dlg:DLG.open,s:G.story.s};});
 ok(r.hp0===r.hp1&&r.shots===0&&r.s==='fc_talk','the patrol reaches the meeting point untouched: no hive shots, no damage',r);
 // the conversation and the withdrawal play once each
 r=await p.evaluate(()=>{const seen=[];const ps=playStory;playStory=function(k,d){seen.push(k.join('+'));return ps.apply(this,arguments);};
   for(let n=0;n<4000&&G.story.s!=='main';n++){if(DLG.open)skipDlg();else{step(STEP);storyFrame();frame++;}}playStory=ps;
   return {s:G.story.s,seen,flags:CAMP.flags,tip:__msgs.some(t=>t===MIS.landfall.tip),done:__msgs.some(t=>/^Tutorial complete/.test(t))};});
 const dup=r.seen.filter((x,i)=>r.seen.indexOf(x)!==i);
 ok(r.s==='main'&&dup.length===0&&r.flags.tut1&&r.flags.firstContact,'first contact runs through to the mission once, with no repeated dialogue',r);
 ok(r.done&&r.tip,'after the tutorial the mission tip (the Bloom\'s reach) is finally shown',r);

 // ---- resume: a save in the middle of the tutorial comes back on the same step with the same checks
 r=await p.evaluate(async()=>{startMission('landfall');while(DLG.open)skipDlg();setSpeed(0);enterTut(7);const s0=__panel();const S=await decodeSave(await encodeSave());
   startGame('survival');applySave(S);while(DLG.open)skipDlg();setSpeed(0);const s1=__panel();return {s0,s1,vcore:G.story.vcore};});
 ok(r.s1.s==='tut'&&r.s1.k===7&&r.s1.title===r.s0.title&&r.s1.text===r.s0.text&&r.vcore===0,'a save made on Step 8 loads back on Step 8 with its panel and a fresh delivery count',r);
 // ---- the replay offer: replay includes first contact, skip does not
 r=await p.evaluate(()=>{CAMP.flags=CAMP.flags||{};CAMP.flags.tut1=1;startMission('landfall');while(DLG.open)skipDlg();setSpeed(0);
   return {p:__panel(),btn:[...document.querySelectorAll('#tutActs button')].map(b=>b.textContent)};});
 ok(r.p.k===-1&&/including the first meeting with the humans/.test(r.p.text)&&r.btn.join()==='Replay tutorial,Skip to the mission','the replay offer says replaying includes first contact and skipping does not',r);
 r=await p.evaluate(()=>{__msgs.length=0;$('tutSkip').click();return {s:G.story.s,hold:G.story.hold,hidden:$('tut').hidden,msgs:__msgs.slice(),tip:__msgs.some(t=>t===MIS.landfall.tip)};});
 ok(r.s==='main'&&!r.hold&&r.hidden&&r.tip,'Skip goes straight to the mission, with the goal and the mission tip',r);
 r=await p.evaluate(()=>{startMission('landfall');while(DLG.open)skipDlg();setSpeed(0);$('tutReplay').click();const a=__panel();enterTut(9);const duo=(()=>{const C=G.core;for(let dx=5;dx<10;dx++)if(tryPlace('duo',C.x+dx,C.y+1,0,true))return hiveOf('duo')[0];})();
   __run(4);const tap=(()=>{const v=nearVein(CU);for(let y=Math.floor(v[1])-3;y<=v[1]+2;y++)for(let x=Math.floor(v[0])-3;x<=v[0]+2;x++)if(drillOre('drill',x,y).item===CU&&tryPlace('drill',x,y,0,true))return hiveOf('drill')[0];})();
   __run(4.5);G.items[CU]+=200;routeBelt(tap,duo,0);const done=__run(40,()=>G.story.s!=='tut');return {a,done,s:G.story.s};});
 ok(r.a.k===0&&r.done&&r.s==='fc_walk','Replay starts at Step 1, and finishing it plays first contact again',r);

 // ---- placement messages
 r=await p.evaluate(()=>{startGame('survival');setSpeed(0);G.items=G.items.map(v=>v+9000);const o={};
   for(let y=2;y<MH-2&&!o.web;y++)for(let x=2;x<MW-2;x++){const i=y*MW+x;if(!G.web[i]&&!blockedT(i)&&G.ore[i]<0&&!territory(i)){const w=placeCheck('duo',x,y);if(w.startsWith('This growth must'))o.web=w;break;}}
   for(let y=2;y<MH-2&&!o.ore;y++)for(let x=2;x<MW-2;x++){const w=placeCheck('drill',x,y);if(w.startsWith('No ore'))o.ore=w;if(o.ore)break;}
   o.join=REACH_JOIN;o.far=reachFar(VREACH+1);o.reach=isReachWhy(o.far)&&isReachWhy(o.join);return o;});
 ok(/Root Taps and Deep Roots can go on ore beyond it/.test(r.web)&&/exposed ore/.test(r.ore)&&/5 connected tiles/.test(r.far)&&/connect to it/.test(r.join)&&r.reach,'placement messages state the real rules (Rootweb, exposed ore, the 5-tile Vine reach)',r);
 // ---- Controls help
 r=await p.evaluate(()=>({tut:$('tutKeys').textContent,set:$('setKeys').textContent}));
 ok(['Alt','Ctrl','R','Esc','Right-click','Q','T','Space','4×'].every(k=>r.tut.includes(k)&&r.set.includes(k)),'Controls help lists Alt, Ctrl-drag, R and the wheel, Esc, right-click, Q, T, Space and the speeds, in the tutorial and in Settings');
 // touch wording
 const tp=await b.newPage({viewport:{width:820,height:1180},hasTouch:true,isMobile:true});tp.on('pageerror',e=>errs.push('touch: '+e.message));await tp.goto('http://localhost:8123/'+NEW);await tp.waitForTimeout(800);
 r=await tp.evaluate(()=>{localStorage.clear();startMission('landfall');while(DLG.open)skipDlg();const st=G.story,o=[];for(const s of TUT)o.push(tutVal(s.do,st)+' '+tutVal(s.info,st));return {touch:tutTouch(),t:o.join(' | ')};});
 ok(r.touch&&!/WASD|mouse|\(\d\)|\(C\)|Press H/.test(r.t)&&/Drag with one finger/.test(r.t)&&!/pinch/i.test(r.t),'on a touch screen the panels give touch controls only (no keys, mouse or pinch)',r.touch);
 await tp.close();

 // ---- combat sound: the impact follows what was hit
 r=await p.evaluate(()=>{startGame('survival');SET.fog=false;setSpeed(0);const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);const log=[];const sa=sndAt;
   sndAt=function(n,x,y,o){if(/^(imp_|metal_|org_hit|ant_hit)/.test(n))log.push(n);return null;};const take=f=>{log.length=0;f();return log.join(',');};
   const C=G.core,cx=C.x+1.5,cy=C.y+1.5,put=(t)=>{for(let r=4;r<20;r++)for(let a=0;a<24;a++){const x=Math.floor(cx+r*Math.cos(a*.26)),y=Math.floor(cy+r*Math.sin(a*.26));if(tryPlace(t,x,y,0,true))return G.blocks.get(G.bgrid[y*MW+x]);}};
   const o={};for(const t of ['wall','wallL','twall','door','doorL','duo','node','drill'])o[t]=take(()=>{const b=put(t);hurtBlock(b,5);});
   o.core=take(()=>hurtBlock(G.core,30));
   const e=spawnEnemy('dagger');e.x=cx+12;e.y=cy;const f=spawnEnemy('fortress');f.x=cx+14;f.y=cy+2;const a=spawnEnemy('flare');a.x=cx+12;a.y=cy-3;
   o.scout=take(()=>damageEnemy(e,9));o.siege=take(()=>damageEnemy(f,26));o.air=take(()=>damageEnemy(a,9));
   const m=spawnUnit('mite',cx+3,cy),h=spawnUnit('htank',cx+3,cy+1);o.mite=take(()=>hurtUnit(m,3));o.bulwark=take(()=>hurtUnit(h,3));
   const fl=spawnEnemy('mace');fl.x=m.x+1;fl.y=m.y;fl.cd=0;o.flameAnt=take(()=>enemyFireAt(fl,m.x,m.y,null,m));o.flameWall=take(()=>enemyFireAt(fl,0,0,put('wall'),null));
   step(STEP);o.beam=take(()=>laserLine({team:0},e.x-4,e.y,e.x+2,e.y,20));o.beamMiss=take(()=>laserLine({team:0},cx-30,cy-30,cx-26,cy-30,20));
   const hd=spawnEnemy('dagger');hd.x=cx+12;hd.y=cy+5;const hb=put('wall');hurtBlock(hb,1e6);o.dead=take(()=>hurtBlock(hb,5));
   // an enemy shell landing on rock and on open ground; a bullet into rock; a bullet that runs out in the air
   let rk=null,gr=null;for(let y=2;y<MH-2;y++)for(let x=2;x<MW-2;x++){const i=y*MW+x;if(!rk&&G.terrain[i]===ROCK)rk=[x+.5,y+.5];if(!gr&&G.terrain[i]===FLOOR&&!G.bgrid[i]&&Math.hypot(x-cx,y-cy)>8)gr=[x+.5,y+.5];}
   G.bullets=[];o.shellRock=take(()=>snd('shell',{team:1,x:rk[0],y:rk[1]}));o.shellGround=take(()=>snd('shell',{team:1,x:gr[0],y:gr[1]}));
   G.enemies=[];G.units=[];
   o.bulletRock=take(()=>{G.bullets.push({x:rk[0]-.05,y:rk[1],vx:3,vy:0,life:1,team:1,dmg:5,tgt:0});for(let k=0;k<3;k++)step(STEP);});
   o.bulletAir=take(()=>{G.bullets=[{x:gr[0],y:gr[1],vx:0,vy:0,life:.02,team:1,dmg:5,tgt:0},{x:gr[0],y:gr[1],vx:0,vy:0,life:.02,team:0,dmg:5,ground:true}];for(let k=0;k<3;k++)step(STEP);});
   sndAt=sa;return o;});
 const has=(s,n)=>(s||'').split(',').includes(n);
 ok(has(r.wall,'imp_bark')&&has(r.door,'org_hit')&&has(r.wallL,'imp_bark_heavy')&&has(r.doorL,'imp_bark_heavy')&&has(r.twall,'imp_ironbark'),'Bark Wall, Great Bark, Maw Gate and Ironbark each sound denser; Petal Gate is soft tissue',r);
 ok(has(r.duo,'org_hit')&&has(r.node,'org_hit')&&has(r.drill,'org_hit')&&has(r.core,'org_hit'),'soft growths and the Bloom take a membrane hit',r);
 ok(has(r.scout,'metal_hit')&&has(r.siege,'metal_heavy')&&has(r.air,'metal_hit'),'HDF vehicles ring as metal: a heavy hit on a Siege Tank, a lighter one on a Scout Tank or a flyer',r);
 ok(has(r.mite,'ant_hit')&&has(r.bulwark,'imp_bark'),'ants: chitin for a Mite Ant, bark plates for a Bulwark Ant',r);
 ok(has(r.flameAnt,'imp_burn')&&has(r.flameWall,'imp_burn')&&has(r.beam,'imp_burn'),'flame and beam damage sounds like burning, not like a shot',r);
 ok(r.beamMiss===''&&r.dead===''&&r.bulletAir==='','no impact sound when nothing is hit: a beam into empty ground, a destroyed growth, a shot that runs out',r);
 ok(has(r.shellRock,'imp_rock')&&has(r.shellGround,'imp_ground')&&has(r.bulletRock,'imp_rock'),'shells and bullets that land on rock or soil make a rock or soil impact',r);
 // limiter: a loud fight never clips the output
 r=await p.evaluate(()=>new Promise(res=>{SND.vol={m:1,s:1,a:1,mute:false};sndApply(true);startGame('survival');SET.fog=false;const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);setSpeed(1);
   const cx=G.core.x+1.5,cy=G.core.y+1.5;for(let k=0;k<70;k++)spawnUnit(['mite','tank','htank'][k%3],cx+3+(k%10)*.7,cy-4+Math.floor(k/10)*.8);
   for(let k=0;k<80;k++){const e=spawnEnemy(['dagger','mace','crawler','fortress','flare','horizon'][k%6]);e.x=cx+16+(k%8);e.y=cy-6+(k%10)*1.3;}cam.z=1.1;centerOn(cx+9,cy);
   const a=SND.bus.meter,buf=new Float32Array(a.fftSize);let mx=0,vmax=0,n=0;const t0=performance.now();const s0=SND.stats.played;
   const f=()=>{a.getFloatTimeDomainData(buf);for(const v of buf)mx=Math.max(mx,Math.abs(v));vmax=Math.max(vmax,SND.voices.length);n++;if(performance.now()-t0<6000)setTimeout(f,30);
     else res({peak:+mx.toFixed(3),vmax,MAX:SND.MAX,played:SND.stats.played-s0,units:G.units.length+G.enemies.length,lim:!!SND.bus.lim});};f();}));
 ok(r.units>=100&&r.played>20&&r.lim&&r.peak<=1.0&&r.vmax<=r.MAX,'110 combatants at full volume: sounds play, the voice cap holds and the limiter keeps the peak at or below 1.0',r);
 // the sound test
 r=await p.evaluate(()=>new Promise(res=>{setSpeed(0);G.enemies=[];G.units=[];G.bullets=[];sndReset();openSettings();$('sgalBtn').click();const btn=[...document.querySelectorAll('#sgal button[data-s]')],pr=[...document.querySelectorAll('#sgal button[data-p]')];
   const s0=SND.stats.played;btn.forEach((b,i)=>setTimeout(()=>b.click(),i*60));setTimeout(()=>{const p1=SND.stats.played-s0;pr[0].click();setTimeout(()=>{
     const p2=SND.stats.played-s0-p1;SND.vol.mute=true;sndApply(true);const s1=SND.stats.played;btn[0].click();const note=$('sgalNote').textContent,p3=SND.stats.played-s1;SND.vol.mute=false;sndApply(true);
     $('sgalClose').click();$('settings').hidden=true;res({n:btn.length,pairs:pr.length,p1,p2,p3,note,hidden:$('sgal').hidden});},500);},btn.length*60+300);}));
 ok(r.n===32&&r.pairs>=12&&r.p1>=30&&r.p2===2&&r.p3===0&&/muted/.test(r.note)&&r.hidden,'the sound test plays every weapon, impact and destruction sound and the shot-and-impact pairs; muted, it plays nothing and says so',r);
 // cost of the sound code on the game thread
 r=await p.evaluate(()=>{startGame('survival');SET.fog=false;setSpeed(0);const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);const cx=G.core.x+1.5,cy=G.core.y+1.5;
   for(let k=0;k<60;k++)spawnUnit(['mite','tank','htank'][k%3],cx+3+(k%10)*.7,cy-4+Math.floor(k/10)*.8);for(let k=0;k<40;k++){const e=spawnEnemy(['dagger','mace','crawler','fortress','flare','horizon'][k%6]);e.x=cx+16+(k%5);e.y=cy-6+(k%8)*1.5;}
   let ts=0;const s0=snd;snd=function(){const t=performance.now();s0.apply(this,arguments);ts+=performance.now()-t;};const t0=performance.now();for(let k=0;k<600;k++)step(STEP);const tt=performance.now()-t0;snd=s0;
   return {msPerStepSound:+(ts/600).toFixed(3),msPerStep:+(tt/600).toFixed(3)};});
 ok(r.msPerStepSound<.25,'the sound code costs well under a quarter of a millisecond per step in a 100-unit fight',r);
 ok(errs.length===0,'no page errors',errs.slice(0,5));
 console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(fail?1:0);})();
