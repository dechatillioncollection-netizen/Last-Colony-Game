// v51: hatching from eggs (cost taken when the egg is laid, then the hatch time), and rally points for Spawning Pods and Brood Chambers.
const {chromium}=require(process.env.PW||'playwright');
const URL=process.env.URL||'http://localhost:8123/index.html';
const ck=[];const T=(n,ok,d)=>{ck.push([n,!!ok]);console.log((ok?'PASS ':'FAIL ')+n+(d!==undefined?'  '+JSON.stringify(d):''));};
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
await p.goto(URL);await p.waitForTimeout(1500);
// a Survival map with a Spawning Pod and a Brood Chamber placed next to the Bloom, fully grown, vigor at 100%
await p.evaluate(()=>{localStorage.clear();startGame('survival');G.paused=true;
  window.__place=(t)=>{const c=G.core;for(let r=3;r<14;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=c.x+dx,y=c.y+dy;if(!placeCheck(t,x,y)){const b=addBlock(t,x,y,0,0);b.built=1;b.bt=0;return b;}}return null;};
  window.__run=(sec,f)=>{let t=0;while(t<sec-1e-9){if(f)f();step(STEP);t+=STEP;}};
  window.__ps=1;const cp=computePower;computePower=function(){cp.apply(this,arguments);G.powSat=__ps;};window.__pod=__place('nest');window.__ch=__place('factory');G.unlocked.add('factory');G.unlocked.add('nest');G.unlocked.add('htank');});
const timing=await p.evaluate(()=>{const out={};
  for(const [b,k] of [[__pod,'mite'],[__ch,'tank'],[__ch,'htank']]){b.unit=k;b.egg=null;b.prog=0;b.inv.fill(0);for(const [i,n] of U[k].cost)b.inv[i]=n;
    const n0=G.units.length;let t=0,laid=null;while(G.units.length===n0&&t<60){step(STEP);t+=STEP;if(laid===null&&b.egg)laid={t:+t.toFixed(3),inv:U[k].cost.map(([i])=>b.inv[i])};
      if(G.powSat!==undefined)G.powSat=1;}
    out[k]={hatchAt:+t.toFixed(2),laid,time:U[k].time};}
  return out;});
T('the egg is laid as soon as the items are in, and its items are taken then',Object.values(timing).every(o=>o.laid&&o.laid.t<=STEP_OK(o)&&o.laid.inv.every(v=>v===0)),timing);
function STEP_OK(){return .05;}
T('a Mite Ant hatches 10 s after its egg is laid, a Thornback 15 s, a Bulwark 30 s',Math.abs(timing.mite.hatchAt-10)<.1&&Math.abs(timing.tank.hatchAt-15)<.1&&Math.abs(timing.htank.hatchAt-30)<.1,timing);
// items that arrive while an egg grows wait for the next egg; nothing hatches early
const flow=await p.evaluate(()=>{const b=__pod;b.unit='mite';b.egg=null;b.prog=0;b.inv.fill(0);b.inv[CU]=24;b.inv[PB]=12;const n0=G.units.length;const ts=[];let t=0;
  while(ts.length<2&&t<40){step(STEP);t+=STEP;if(G.units.length>n0+ts.length)ts.push(+t.toFixed(2));}
  return {ts,inv:[b.inv[CU],b.inv[PB]],egg:b.egg};});
T('with items for two ants waiting, they hatch one egg at a time, 10 s apart',flow.ts.length===2&&Math.abs(flow.ts[0]-10)<.1&&Math.abs(flow.ts[1]-20)<.15,flow);
// vigor: a Brood Chamber at half vigor grows its egg at half speed
const vig=await p.evaluate(()=>{const b=__ch;b.unit='tank';b.egg=null;b.prog=0;b.inv.fill(0);for(const [i,n] of U.tank.cost)b.inv[i]=n;
  let t=0;const n0=G.units.length;__ps=.5;
  while(G.units.length===n0&&t<60){step(STEP);t+=STEP;}__ps=1;return +t.toFixed(2);});
T('at half vigor a Brood Chamber egg takes twice as long',Math.abs(vig-30)<.2,vig);
// the swarm limit: no egg is laid at the limit, and a ready egg waits for room
const cap=await p.evaluate(()=>{const b=__pod;b.unit='mite';b.egg=null;b.prog=0;b.inv.fill(0);b.inv[CU]=12;b.inv[PB]=6;
  const fill=[];while(G.units.length<UNIT_CAP)fill.push(spawnUnit('mite',G.core.x-2,G.core.y-2));__run(2);const noEgg=!b.egg&&b.inv[CU]===12;
  fill.pop().dead=true;G.units=G.units.filter(u=>!u.dead);__run(.2);const laid=!!b.egg;spawnUnit('mite',G.core.x-2,G.core.y-2);__run(12);const waiting=b.egg&&b.prog>=1&&G.units.length===UNIT_CAP;
  const r1=G.units.pop();__run(.2);const hatched=!b.egg&&G.units.length===UNIT_CAP;
  for(const u of G.units)u.dead=true;G.units=[];return {noEgg,laid,waiting,hatched};});
T('at the swarm limit no egg is laid, and a ready egg waits for room, then hatches',cap.noEgg&&cap.laid&&cap.waiting&&cap.hatched,cap);
// switching what hatches gives back the egg's items to the Bloom
const sw=await p.evaluate(()=>{const b=__ch;b.unit='tank';b.egg=null;b.prog=0;b.inv.fill(0);for(const [i,n] of U.tank.cost)b.inv[i]=n;__run(3);
  G.sel=b.id;renderPanel(true);const si=G.items[SI],pb=G.items[PB],egg=b.egg;document.querySelector('#panel button[data-unit=htank]').click();
  return {egg,dSi:G.items[SI]-si,dPb:G.items[PB]-pb,after:b.egg,unit:b.unit,prog:b.prog};});
T('switching what hatches mid-egg returns that egg\'s items',sw.egg==='tank'&&sw.dSi===10&&sw.dPb===10&&!sw.after&&sw.unit==='htank'&&sw.prog===0,sw);
// ---- rally point with real clicks
await p.evaluate(()=>{G.paused=false;const b=__pod;G.sel=0;G.selU=0;G.selUs=[];renderPanel(true);cam.z=1;const c=bCenter(b);cam.x=c[0]*T-VW/2;cam.y=c[1]*T-VH/2;});
const at=(wx,wy)=>p.evaluate(([wx,wy])=>{const r=cv.getBoundingClientRect();return [r.left+(wx*T-cam.x)*cam.z,r.top+(wy*T-cam.y)*cam.z];},[wx,wy]);
const podC=await p.evaluate(()=>bCenter(__pod));
let [sx,sy]=await at(podC[0],podC[1]);await p.mouse.click(sx,sy);await p.waitForTimeout(100);
const spot=await p.evaluate(()=>{const b=__pod,c=bCenter(b);for(let r=6;r<12;r++)for(let a=0;a<6.28;a+=.3){const x=c[0]+r*Math.cos(a),y=c[1]+r*Math.sin(a),i=tileAt(x,y);if(i>=0&&!solidTile(i,0)&&!blockAt(Math.floor(x),Math.floor(y)))return [Math.floor(x)+.5,Math.floor(y)+.5];}});
[sx,sy]=await at(spot[0],spot[1]);await p.mouse.click(sx,sy);await p.waitForTimeout(150);
const rs=await p.evaluate(()=>({sel:G.sel===__pod.id,rally:__pod.rally&&__pod.rally.map(v=>+v.toFixed(2)),panel:$('panel').textContent.includes('Rally point')&&!!document.querySelector('#panel [data-act=rally0]')}));
T('with a Spawning Pod selected, a click on open ground sets its rally point and keeps it selected',rs.sel&&rs.rally&&Math.hypot(rs.rally[0]-spot[0],rs.rally[1]-spot[1])<.6&&rs.panel,{rs,spot});
await p.evaluate(()=>{G.paused=true;});await p.screenshot({path:(process.env.SHOTS||'shots51')+'/rally-selected.png'});
const walk=await p.evaluate(()=>{const b=__pod;b.unit='mite';b.egg=null;b.prog=0;b.inv.fill(0);b.inv[CU]=36;b.inv[PB]=18;const n0=G.units.length;
  __run(31);const ants=G.units.slice(n0);__run(15);
  return ants.map(u=>({hold:u.hold&&u.hold.map(v=>+v.toFixed(2)),d:+Math.hypot(u.x-u.hold[0],u.y-u.hold[1]).toFixed(2),toR:+Math.hypot(u.hold[0]-b.rally[0],u.hold[1]-b.rally[1]).toFixed(2)}));});
const distinct=new Set(walk.map(w=>w.hold.join())).size===walk.length;
T('each new ant walks to the rally point and they stand side by side, not on one spot',walk.length===3&&walk.every(w=>w.d<.8&&w.toR<2.6)&&distinct,walk);
await p.evaluate(()=>{const c=__pod.rally;cam.x=c[0]*T-VW/2;cam.y=c[1]*T-VH/2;});await p.screenshot({path:(process.env.SHOTS||'shots51')+'/rally-ants.png'});
// a click on a building with the pod selected selects that building instead; the Bloom is a building
const ob=await p.evaluate(()=>{const c=bCenter(G.core);return c;});[sx,sy]=await at(ob[0],ob[1]);
await p.evaluate(()=>{const c=bCenter(G.core);cam.x=c[0]*T-VW/2;cam.y=c[1]*T-VH/2;G.sel=__pod.id;renderPanel(true);});
[sx,sy]=await at(ob[0],ob[1]);await p.mouse.click(sx,sy);await p.waitForTimeout(100);
const sb=await p.evaluate(()=>({sel:G.sel===G.core.id,rallyKept:!!__pod.rally}));
T('with a pod selected, a click on a building selects that building',sb.sel&&sb.rallyKept,sb);
// with ants selected, a click on open ground still sends the ants and does not move any rally point
const send=await p.evaluate(()=>{const u=G.units.find(u=>!u.dead);setSelAnts([u.id]);G.sel=0;const r0=__pod.rally.join();return {id:u.id,r0};});
const tgt=await p.evaluate(()=>{const c=bCenter(G.core);for(let r=4;r<10;r++)for(let a=0;a<6.28;a+=.4){const x=c[0]+r*Math.cos(a),y=c[1]+r*Math.sin(a),i=tileAt(x,y);if(i>=0&&!solidTile(i,0)&&!blockAt(Math.floor(x),Math.floor(y)))return [x,y];}});
[sx,sy]=await at(tgt[0],tgt[1]);await p.mouse.click(sx,sy);await p.waitForTimeout(100);
const s2=await p.evaluate(([id,r0,tx,ty])=>{const u=G.units.find(u=>u.id===id);return {hold:!!u.hold&&Math.hypot(u.hold[0]-tx,u.hold[1]-ty)<1.5,same:__pod.rally.join()===r0};},[send.id,send.r0,tgt[0],tgt[1]]);
T('with ants selected, a click on open ground still sends the ants and leaves rally points alone',s2.hold&&s2.same,s2);
// clearing the rally point: new ants wait by the Bloom as before
const clr=await p.evaluate(()=>{G.selU=0;G.selUs=[];G.sel=__pod.id;renderPanel(true);document.querySelector('#panel [data-act=rally0]').click();
  const b=__pod;b.egg=null;b.prog=0;b.inv.fill(0);b.inv[CU]=12;b.inv[PB]=6;const n0=G.units.length;__run(10.2);const u=G.units[n0];return {rally:b.rally,hatched:!!u,hold:u?u.hold||null:'none'};});
T('Clear rally point: new ants wait by the Bloom as before',clr.rally===null&&clr.hatched&&clr.hold===null,clr);
// saves keep the egg, its progress and the rally point
const sv=await p.evaluate(async()=>{const b=__pod;b.rally=[b.x-3.5,b.y+.5];b.egg=null;b.prog=0;b.inv.fill(0);b.inv[CU]=12;b.inv[PB]=6;__run(4);
  const before={egg:b.egg,prog:+b.prog.toFixed(3),rally:b.rally.join()};const S=await decodeSave(await encodeSave());applySave(S);G.paused=true;
  const nb=G.blocks.get(b.id);return {before,after:{egg:nb.egg,prog:+nb.prog.toFixed(3),rally:nb.rally&&nb.rally.join()}};});
T('a save keeps the egg, how far it has grown, and the rally point',JSON.stringify(sv.before)===JSON.stringify(sv.after)&&sv.before.egg==='mite',sv);
// a save from before v51 part-way through hatching: its items are still in the pod, so the egg carries on from where it was
const old=await p.evaluate(()=>{const b=[...G.blocks.values()].find(o=>o.t==='nest'&&o.team===0);b.egg=undefined;delete b.egg;b.rally=undefined;delete b.rally;b.prog=.6;b.inv.fill(0);b.inv[CU]=12;b.inv[PB]=6;
  const n0=G.units.length;let t=0;step(STEP);const laid={egg:b.egg,cu:b.inv[CU],prog:+b.prog.toFixed(3)};while(G.units.length===n0&&t<20){step(STEP);t+=STEP;}return {laid,hatchAfter:+(t+STEP).toFixed(2)};});
T('a save from before v51, part-way through a hatch, carries on from where it was',old.laid.egg==='mite'&&old.laid.cu===0&&Math.abs(old.hatchAfter-4)<.15,old);
// the hatch bar and the rally line draw without errors at every quality
const dr=await p.evaluate(()=>{const out=[];const b=[...G.blocks.values()].find(o=>o.t==='nest'&&o.team===0);G.sel=b.id;b.rally=[b.x-3.5,b.y+.5];b.egg='mite';b.prog=.5;
  for(const q of ['low','medium','high','epic']){applyQuality(q);try{render();out.push(q);}catch(e){out.push(q+':'+e.message);}}return out;});
T('the hatch bar and rally line draw at every quality',dr.join()==='low,medium,high,epic',dr);
await p.evaluate(()=>{const b=[...G.blocks.values()].find(o=>o.t==='nest'&&o.team===0);const c=bCenter(b);cam.z=2.2;cam.x=c[0]*T-VW/2/2.2;cam.y=c[1]*T-VH/2/2.2;});await p.waitForTimeout(400);
await p.screenshot({path:(process.env.SHOTS||'shots51')+'/hatch-bar.png'});
// ---- the pause menu (Esc)
await p.evaluate(()=>{G.paused=false;setSpeed(2);G.sel=0;G.selU=0;G.selUs=[];G.tool=null;renderPanel(true);document.activeElement&&document.activeElement.blur();});
await p.keyboard.press('Escape');await p.waitForTimeout(150);
const m1=await p.evaluate(()=>({open:!$('pmenu').hidden,paused:G.paused,quit:$('pmQuit').hidden,btns:[...document.querySelectorAll('#pmenu button')].filter(b=>!b.hidden).map(b=>b.textContent)}));
await p.screenshot({path:(process.env.SHOTS||'shots51')+'/pause-menu.png'});
await p.keyboard.press('Escape');await p.waitForTimeout(150);
const m2=await p.evaluate(()=>({open:!$('pmenu').hidden,paused:G.paused,speed:G.speed}));
T('in a match Esc pauses and opens the menu (Resume, Settings, Save or load, Main menu; no Quit in a browser), and Esc again resumes at the same speed',
  m1.open&&m1.paused&&m1.quit&&m1.btns.join()==='Resume,Settings,Save or load,Main menu'&&!m2.open&&!m2.paused&&m2.speed===2,{m1,m2});
const m3=await p.evaluate(()=>{const r=[];setTool('wall');return r;});
await p.keyboard.press('Escape');await p.waitForTimeout(100);const a1=await p.evaluate(()=>({tool:G.tool,open:!$('pmenu').hidden}));
await p.evaluate(()=>{G.sel=G.core.id;renderPanel(true);});await p.keyboard.press('Escape');await p.waitForTimeout(100);const a2=await p.evaluate(()=>({sel:G.sel,open:!$('pmenu').hidden}));
await p.keyboard.press('Escape');await p.waitForTimeout(100);const a3=await p.evaluate(()=>!$('pmenu').hidden);
T('Esc first puts down a chosen growth, then clears a selection, and only then opens the menu',!a1.tool&&!a1.open&&!a2.sel&&!a2.open&&a3,{a1,a2,a3});
await p.click('#pmSettings');await p.waitForTimeout(150);const q1=await p.evaluate(()=>!$('settings').hidden);
await p.keyboard.press('Escape');await p.waitForTimeout(150);const q2=await p.evaluate(()=>({set:!$('settings').hidden,pm:!$('pmenu').hidden,paused:G.paused}));
await p.click('#pmSaves');await p.waitForTimeout(300);const q3=await p.evaluate(()=>!$('saves').hidden);
await p.keyboard.press('Escape');await p.waitForTimeout(150);const q4=await p.evaluate(()=>({saves:!$('saves').hidden,pm:!$('pmenu').hidden,paused:G.paused}));
T('Settings and Save or load open from the menu; Esc closes each and returns to the menu, still paused',q1&&!q2.set&&q2.pm&&q2.paused&&q3&&!q4.saves&&q4.pm&&q4.paused,{q1,q2,q3,q4});
await p.click('#pmResume');await p.waitForTimeout(100);await p.click('#pmBtn');await p.waitForTimeout(100);
const t0=await p.evaluate(()=>({open:!$('pmenu').hidden,time:G.time}));
await p.click('#pmMenu');await p.waitForTimeout(800);
const mm=await p.evaluate(async()=>({G:!!G,menu:!$('overlay').hidden&&!!$('m-survival'),pm:!$('pmenu').hidden,auto:!!(await Store.get('slot-auto')||await Store.get('auto'))}));
T('the Menu button opens it too, and Main menu saves the game and goes to the main menu',t0.open&&!mm.G&&mm.menu&&!mm.pm&&mm.auto,{t0,mm});
T('no page errors',errs.length===0,errs);
await br.close();const pass=ck.filter(c=>c[1]).length;console.log(pass+' passed, '+(ck.length-pass)+' failed');process.exit(pass===ck.length?0:1);})().catch(e=>{console.log('ERROR',e);process.exit(2);});
