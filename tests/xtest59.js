// v59: the main menu's live scenes, the title's heartbeat and the two-second tendril transition.
// Live scenes: each is a tiny world of its own (36×22 tiles) run by the game's own simulation and renderer behind the menu. The world is
// never the game: no game state is visible to the page, nothing is saved, input does not reach it, and it is thrown away when a game
// starts (repeatedly, with nothing left behind and the game's map its own full size). It steps 30 times a second, draws at most 30 frames
// a second whatever the frame-rate limit, stops in a hidden tab and under Settings > Moving menu background off (no simulation at all),
// keeps to its caps, runs four scenes in order (three calm to one battle, never two battles running), falls back to stills when a scene
// fails or a computer is too slow, and stays quiet until a key has been pressed.
// Title: every 5 to 8 seconds the Bloom alone contracts twice (lub, then a stronger, shorter dub 180 to 260 ms later), with no zoom of the
// picture, no scaling of the title and no change of brightness elsewhere; the lub and dub sounds are timed to the two peaks.
// Transition: a key grows tendrils and membranes that cover the whole screen by 0.85 s, put the menu underneath, and peel back onto it,
// all done by about 2.2 s; a second key goes straight to the menu; reduced motion is a crossfade of about 200 ms.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',SHOTS=process.env.SHOTS||'shots59';
fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:o.vp||{width:1600,height:900},reducedMotion:o.rm?'reduce':'no-preference'});const p=await ctx.newPage();p.errs=[];p.warns=[];
  p.on('pageerror',e=>p.errs.push(String(e)));p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
  await p.addInitScript(([sp,st,scene,fps])=>{try{localStorage.clear();localStorage.setItem('lc_quality','medium');if(sp)localStorage.setItem('lc_splash','1');if(st)localStorage.setItem('lc_menubg','0');
    if(scene!==null)localStorage.setItem('lc_menuScene',String(scene-1));if(fps!==null)localStorage.setItem('lc_fps',String(fps));}catch(e){}},[!!o.splash,!!o.still,o.scene===undefined?null:o.scene,o.fps===undefined?null:o.fps]);
  await p.goto(URL+NEW);
  if(o.splash)await p.waitForFunction(()=>$('splash').classList.contains('ready'),null,{timeout:15000});else await p.waitForTimeout(o.wait||1500);return p;};
const live=p=>p.evaluate(()=>({live:!!MD.G,id:MD.G?MMS[MD.i].id:null,steps:MD.steps,frames:MD.frames,MW,MH,N,g:!!window.__game(),units:MD.G?MD.G.units.length:0,enemies:MD.G?MD.G.enemies.length:0,
  blocks:MD.G?MD.G.blocks.size:0,bullets:MD.G?MD.G.bullets.length:0,fx:MD.G?MD.G.fx.length:0,builds:MD.builds,disposed:MD.disposed,mdlive:document.body.classList.contains('mdlive'),st:mmState()}));
const waitMs=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 // ---- 1. a live scene, its size and its isolation from the game
 {const p=await open(br,{scene:0});await p.waitForTimeout(2500);let s=await live(p);
  ok('the menu runs a live scene (Living Factory first), drawn on the game canvas under the menu',s.live&&s.id==='factory'&&s.mdlive&&s.steps>30&&s.frames>20,JSON.stringify(s));
  ok('its world is tiny: 36 by 22 tiles (792), never the size of a game map, and nothing of it is the game',s.MW===36&&s.MH===22&&s.N===792&&!s.g,JSON.stringify(s));
  const iso=await p.evaluate(async()=>{const keys=[];const si=Storage.prototype.setItem;Storage.prototype.setItem=function(k,v){keys.push(k);return si.call(this,k,v);};
    const camp=JSON.stringify(window.CAMP||null),blocks=MD.G.blocks.size,tool=MD.G.tool;
    // the player presses keys and clicks on the scene's ground: nothing reaches it
    for(const k of ['w','a','1','2','b','Delete',' ']){window.dispatchEvent(new KeyboardEvent('keydown',{key:k,bubbles:true}));window.dispatchEvent(new KeyboardEvent('keyup',{key:k,bubbles:true}));}
    const c=$('cv'),r=c.getBoundingClientRect(),el=document.elementFromPoint(r.width*.7,r.height*.5);
    for(const t of ['pointerdown','pointerup','click'])el.dispatchEvent(new PointerEvent(t,{clientX:r.width*.7,clientY:r.height*.5,bubbles:true,button:0}));
    await new Promise(r=>setTimeout(r,2500));Storage.prototype.setItem=si;
    return {keys:[...new Set(keys)],campSame:JSON.stringify(window.CAMP||null)===camp,blocks0:blocks,blocks1:MD.G.blocks.size,tool:MD.G.tool===tool,top:el.id||el.className,g:!!window.__game(),story:MD.G.story,msgs:$('msgs').children.length};});
  ok('nothing is saved while it runs (no writes but the scene number), and the campaign is untouched',iso.keys.every(k=>k==='lc_menuScene')&&iso.campSame,JSON.stringify(iso));
  ok('keys and clicks never reach it: the click lands on the menu, the scene\'s growths and tools are unchanged, no messages, no story',iso.top!=='cv'&&iso.blocks1===iso.blocks0&&iso.tool&&!iso.g&&iso.story===null&&iso.msgs===0,JSON.stringify(iso));
  const hud=await p.evaluate(()=>['top','bottom','msgs'].map(id=>getComputedStyle($(id)).visibility));ok('the game HUD stays hidden behind the menu',hud.every(v=>v==='hidden'),hud.join());
  await p.screenshot({path:`${SHOTS}/live_factory.png`});
  // ---- 2. it is thrown away when a game starts, again and again, and the game is a normal full-size game
  const cyc=await p.evaluate(async()=>{const o=[];for(let k=0;k<12;k++){startGame(k%2?'siege':'survival');const G=window.__game();
      o.push({k,map:MW+'x'+MH,demo:!!G.demo,md:!!MD.G,veh:VEHW.length,core:!!G.core,units:G.units.length,mdlive:document.body.classList.contains('mdlive')});
      for(let i=0;i<30;i++)step(1/30);await saveTo('auto');$('quitBtn').click();await new Promise(r=>setTimeout(r,700));
      o[k].back=!!MD.G&&MW===36&&MH===22&&!window.__game();}
    return {o,builds:MD.builds,disposed:MD.disposed,heap:performance.memory?Math.round(performance.memory.usedJSHeapSize/1048576):null};});
  const bad=cyc.o.filter(r=>r.demo||r.md||r.mdlive||!r.core||!r.back||r.map!==(r.k%2?'144x144':'96x96'));
  ok('twelve trips from the menu to a game and back: each game is a normal full-size game with no trace of the scene, and the menu builds a new scene each time',
    !bad.length&&cyc.builds-cyc.disposed===1,JSON.stringify(bad.length?bad[0]:{builds:cyc.builds,disposed:cyc.disposed,heap:cyc.heap}));
  const sv=await p.evaluate(()=>{const k=Object.keys(localStorage).filter(k=>/save|slot|auto/i.test(k));let demo=false;for(const x of k){const v=localStorage.getItem(x)||'';if(/"demo"/.test(v))demo=true;}return {k,demo};});
  ok('saves made in those games hold nothing of the scene',!sv.demo,JSON.stringify(sv));
  ok('no errors (isolation)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 3. pace, frame-rate limits, caps
 for(const fps of [0,30,240,-1]){const p=await open(br,{scene:2,fps});await p.waitForTimeout(1500);const a=await live(p);await p.waitForTimeout(5000);const b=await live(p);
  const sps=(b.steps-a.steps)/5,fr=(b.frames-a.frames)/5;
  ok(`frame-rate limit ${fps===0?'Screen':fps===-1?'Unlimited':fps}: the scene steps 30 times a second and draws at most 30 frames a second`,Math.abs(sps-30)<=2.5&&fr<=31&&fr>=(fps===30?20:24),JSON.stringify({sps,fr}));
  if(fps===-1){const caps=await p.evaluate(async()=>{let most={u:0,e:0,b:0,fx:0,d:0};for(let i=0;i<80;i++){await new Promise(r=>setTimeout(r,250));const G=MD.G;if(!G)continue;
      most={u:Math.max(most.u,G.units.length),e:Math.max(most.e,G.enemies.length),b:Math.max(most.b,G.bullets.length),fx:Math.max(most.fx,G.fx.length),d:Math.max(most.d,G.decals.length)};}return most;});
    ok('the battle keeps to its caps over 20 seconds (at most 10 ants, 70 shots, 90 effects, 40 marks)',caps.u<=10&&caps.b<=70&&caps.fx<=90&&caps.d<=40&&caps.u>0,JSON.stringify(caps));}
  await p.context().close();}
 // ---- 4. a hidden tab, Settings > Moving menu background off, reduced motion: no simulation at all
 {const p=await open(br,{scene:0});await p.waitForTimeout(1500);
  const hid=await p.evaluate(async()=>{Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,300));
    const a=MD.steps,f=MD.frames;await new Promise(r=>setTimeout(r,2000));const b=MD.steps,g=MD.frames;delete document.hidden;Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
    document.dispatchEvent(new Event('visibilitychange'));await new Promise(r=>setTimeout(r,1500));return {still:b===a&&g===f,resumed:MD.steps>b};});
  ok('a hidden tab stops the scene completely, and it carries on when the tab comes back',hid.still&&hid.resumed,JSON.stringify(hid));
  await p.click('#m-settings');await p.click('#optMenuBg');await p.waitForTimeout(1200);const a=await live(p);await p.waitForTimeout(3000);const b=await live(p);
  const img=await p.evaluate(()=>MMB.el&&MMB.el.tagName);
  ok('Moving menu background off: the world is thrown away, nothing steps or draws, and the scene\'s still picture shows',!b.live&&b.steps===a.steps&&b.frames===a.frames&&img==='IMG'&&!b.mdlive,JSON.stringify({a,b,img}));
  await p.click('#optMenuBg');await p.waitForTimeout(1500);const c=await live(p);ok('on again: the live scene comes back',c.live&&c.steps>b.steps,JSON.stringify(c));
  await p.context().close();}
 {const p=await open(br,{still:true,scene:0});await p.waitForTimeout(2500);const s=await live(p);ok('the switch is remembered, and with it off no world is ever built',!s.live&&s.builds===0&&s.steps===0,JSON.stringify(s));await p.context().close();}
 {const p=await open(br,{rm:true,scene:0});await p.waitForTimeout(2500);const s=await live(p);const img=await p.evaluate(()=>MMB.el&&MMB.el.tagName);
  ok('reduced motion: a still picture and no world',!s.live&&s.builds===0&&img==='IMG',JSON.stringify(s));await p.context().close();}
 // ---- 5. the rotation and the fallbacks
 {const p=await open(br,{scene:0});await p.evaluate(()=>{MMB.secs=3;});const seen=[];let fade=false,most=0;
  for(let k=0;k<170;k++){await p.waitForTimeout(100);const r=await p.evaluate(()=>({id:MD.G?MMS[MD.i].id:null,fade:MD.fade>0||$('mdFade').classList.contains('on'),n:MD.builds-MD.disposed}));
   if(r.fade)fade=true;most=Math.max(most,r.n);if(r.id&&seen[seen.length-1]!==r.id)seen.push(r.id);}
  const ids=await p.evaluate(()=>MMB.shown.slice());
  ok('scenes run in order: Living Factory, First Contact, Fortress Assault, Human Frontier, and round again',ids.slice(0,5).join()==='factory,frontier,assault,human,factory'&&seen.slice(0,5).join()==='factory,frontier,assault,human,factory',ids.join()+' / '+seen.join());
  const battles=ids.filter(i=>i==='assault').length,adj=ids.some((v,k)=>k&&v==='assault'&&ids[k-1]==='assault');
  ok('three calm scenes to one battle, and a battle never follows a battle',battles>=1&&ids.length-battles>=battles*3-1&&!adj,`calm ${ids.length-battles} battle ${battles}`);
  ok('each change fades through dark, and only one world ever exists',fade&&most<=1,JSON.stringify({fade,most}));
  const lab=await p.evaluate(()=>$('mmScene').textContent);ok('the scene name at the foot follows',/^Background scene: (Living Factory|First Contact|Fortress Assault|Human Frontier)$/.test(lab),lab);
  await p.evaluate(()=>{MMB.secs=45;});const i0=await p.evaluate(()=>MMB.i);await p.click('#mmNext');await p.waitForTimeout(1300);const i1=await p.evaluate(()=>MMB.i);const s=await live(p);
  ok('Next scene moves on one',i1===(i0+1)%4&&s.live&&!s.g,[i0,i1].join('>'));
  // a scene left on screen a long time (Settings open) starts again from its beginning
  const lp=await p.evaluate(async()=>{const b=MD.builds;MD.t=MD_LOOP-.05;await new Promise(r=>setTimeout(r,1500));return {rebuilt:MD.builds>b,t:+MD.t.toFixed(1)};});
  ok('a scene that has run its two minutes starts again from the beginning',lp.rebuilt&&lp.t<2,JSON.stringify(lp));
  // a scene that cannot be built shows its still and says why
  const fb=await p.evaluate(async()=>{MDS.human=()=>{throw new Error('test failure');};mmShow(3);await new Promise(r=>setTimeout(r,1200));return {live:!!MD.G,img:MMB.el&&MMB.el.tagName,id:MMB.el&&MMB.el.dataset.id};});
  ok('a scene that fails shows its still picture and says why in the console',!fb.live&&fb.img==='IMG'&&fb.id==='human'&&p.warns.some(w=>/Menu scene human could not be built/.test(w)),JSON.stringify(fb));
  // a computer too slow to keep the pace gets stills for the rest of the visit
  const slow=await p.evaluate(async()=>{mmShow(0);await new Promise(r=>setTimeout(r,1000));const rd=render;render=function(){const t=performance.now();while(performance.now()-t<60);return rd.apply(this,arguments);};
    await new Promise(r=>setTimeout(r,26000));render=rd;return {live:!!MD.G,no:MMB.noVideo,why:MD.why};});
  ok('a computer that cannot keep up gets still pictures for the rest of the visit',!slow.live&&slow.no&&/slow/.test(slow.why),JSON.stringify(slow));
  ok('no errors (rotation)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 6. sound: silent until a key; quieter than a game; fades with a scene change
 {const p=await open(br,{scene:2,splash:true});await p.waitForTimeout(800);
  const pre=await p.evaluate(()=>({ctx:!!SND.ctx&&SND.ctx.state,heard:mmHeard(),st:mmState()}));
  ok('before any key the scene is held under the title and nothing of it is heard',pre.st==='hold'&&!pre.heard,JSON.stringify(pre));
  await p.keyboard.press('Enter');await p.waitForFunction(()=>!SPL.on,null,{timeout:6000});
  const s=await p.evaluate(async()=>{for(let i=0;i<60&&!SND.ready;i++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,3500));
    return {heard:mmHeard(),vol:+MD.vol.toFixed(2),sd:+SND.bus.sd.gain.value.toFixed(2),beds:Object.keys(SND.beds).filter(k=>SND.beds[k]&&SND.beds[k].g&&SND.beds[k].g.gain.value>.001),voices:SND.voices.size||SND.voices.length||0};});
  ok('after the key the battle is heard through the game\'s own mixer, its effects held at about half',s.heard&&s.vol>.9&&s.sd>.35&&s.sd<.6,JSON.stringify(s));
  const f=await p.evaluate(async()=>{mmShow(3);await new Promise(r=>setTimeout(r,450));return {vol:+MD.vol.toFixed(2),sd:+SND.bus.sd.gain.value.toFixed(2)};});
  ok('a scene change fades the sound down with the picture',f.vol<.6,JSON.stringify(f));
  await p.click('#m-survival');await p.waitForTimeout(600);const g=await p.evaluate(()=>({sd:+SND.bus.sd.gain.value.toFixed(2),md:!!MD.G}));ok('and a game starts at full volume with the scene gone',!g.md&&g.sd>.9,JSON.stringify(g));
  ok('no errors (sound)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 7. the heartbeat
 {const p=await open(br,{splash:true});await p.waitForTimeout(2600);
  const sh=await p.evaluate(()=>{const o=[];for(let n=0;n<40;n++){const q=hbNew();let pk=[],last=0,up=false,t1=0,lo=0;const E=[];for(let t=0;t<=hbLen(q)+.01;t+=.002)E.push([t,hbEnv(q,t)]);
      for(let i=1;i<E.length-1;i++)if(E[i][1]>E[i-1][1]&&E[i][1]>=E[i+1][1]&&E[i][1]>.01)pk.push(E[i]);
      o.push({n:pk.length,gap:pk.length===2?pk[1][0]-pk[0][0]:0,a1:pk[0]&&pk[0][1],a2:pk[1]&&pk[1][1],c1:q.c1,r1:q.r1,len:hbLen(q),min:Math.min(...E.map(e=>e[1]))});}return o;});
  const good=sh.every(b=>b.n===2&&b.gap>=.17&&b.gap<=.27&&b.a1>=.03&&b.a1<=.05&&b.a2>b.a1&&b.a2<=.05&&b.c1>=.1&&b.c1<=.14&&b.r1>=.17&&b.r1<=.23&&b.min>-.01);
  ok('each beat is a lub and a stronger dub 180 to 260 ms later, 3 to 5% at most, contracting over 100 to 140 ms and releasing over 170 to 230 ms, and each beat differs',
    good&&new Set(sh.map(b=>b.gap.toFixed(3))).size>20,JSON.stringify(sh[0]));
  // the beat moves the Bloom only: the corners of the picture and the title are the same at rest and at the dub
  const px=await p.evaluate(()=>{cancelAnimationFrame(SPL.raf);SPL.nextPulse=99;SPL.pulses=[];const q={t:0,c1:.12,r1:.2,d:.22,c2:.08,r2:.14,a1:.035,a2:.045,rec:.6};
    const cv=$('splashCv'),g=cv.getContext('2d'),grab=()=>{const W=cv.width,H=cv.height,[bx,by]=SPL_PIC.bloom;const k=Math.max(cv.clientWidth/SPL_PIC.W,cv.clientHeight/SPL_PIC.H);
      return {corner:[...g.getImageData(10,10,40,40).data].join(),edge:[...g.getImageData(W-60,H*.5|0,40,40).data].join(),bloom:[...g.getImageData(W/2-60|0,H*.45|0,120,40).data]};};
    SPL.motes=[];SPL.fog=null;SPL.hb=null;splashDraw(SPL.t,0);const a=grab();SPL.hb=Object.assign({},q,{t:.34});splashDraw(SPL.t,0);const b=grab();
    let d=0;for(let i=0;i<a.bloom.length;i++)d+=Math.abs(a.bloom[i]-b.bloom[i]);
    return {corner:a.corner===b.corner,edge:a.edge===b.edge,bloomDiff:Math.round(d/a.bloom.length*10)/10,h1:getComputedStyle(document.querySelector('#splash h1')).transform,hb:$('splash').style.getPropertyValue('--hb')};});
  ok('only the Bloom moves: the picture\'s corners and edges are untouched, the title is not scaled, nothing else brightens',px.corner&&px.edge&&px.bloomDiff>1&&px.h1==='none'&&!px.hb,JSON.stringify(px));
  // the beats keep coming every 5 to 8 seconds
  const gaps=await p.evaluate(async()=>{SPL.raf=requestAnimationFrame(splashLoop);SPL.nextPulse=.2;const t=[];let b=SPL.beats||0;const t0=performance.now();
    while(performance.now()-t0<15500){await new Promise(r=>setTimeout(r,50));if((SPL.beats||0)>b){b=SPL.beats;t.push(performance.now());}}return t.slice(1).map((v,i)=>+((v-t[i])/1000).toFixed(2));});
  ok('a beat every 5 to 8 seconds',gaps.length>=1&&gaps.every(g=>g>=4.9&&g<=8.2),JSON.stringify(gaps));
  await p.evaluate(async()=>{sndUnlock();for(let i=0;i<100&&!(SND.ready&&SND.buf.title_lub_0&&SND.buf.title_dub_0);i++)await new Promise(r=>setTimeout(r,100));});
  const snd=await p.evaluate(()=>{const o=[];const src=AudioBufferSourceNode.prototype.start;const c=SND.ctx;if(!c)return null;AudioBufferSourceNode.prototype.start=function(when){o.push([this.buffer===SND.buf.title_lub_0||this.buffer===SND.buf.title_lub_1?'lub':this.buffer===SND.buf.title_dub_0||this.buffer===SND.buf.title_dub_1?'dub':'?',when-c.currentTime]);return src.apply(this,arguments);};
    const q={t:0,c1:.12,r1:.2,d:.22,c2:.08,r2:.14,a1:.035,a2:.045,rec:.6};hbSound(q);AudioBufferSourceNode.prototype.start=src;return {o,state:c.state};});
  ok('the lub and the dub are timed to the two tightest moments',!!snd&&snd.state==='running'&&(snd.o.length===2&&snd.o[0][0]==='lub'&&Math.abs(snd.o[0][1]-.108)<.02&&snd.o[1][0]==='dub'&&Math.abs(snd.o[1][1]-.33)<.02),JSON.stringify(snd));
  await p.context().close();}
 // ---- 8. the transition
 for(let run=0;run<3;run++){const p=await open(br,{splash:true,scene:1});await p.waitForTimeout(600);
  await p.keyboard.press('Enter');
  const r=await p.evaluate(async()=>{const o={};const c=()=>{const cv=$('splashVn');if(!cv)return -1;const d=cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;let n=0,k=0;for(let i=3;i<d.length;i+=4*97){k++;if(d[i]>=240)n++;}return n/k;};
    const t0=SPL.vine.t0;let swapAt=null;while(SPL.on){const t=(performance.now()-t0)/1000;if(t>=.86&&o.cover==null)o.cover=c();if(t>=.35&&o.mid==null){o.mid=c();o.n=SPL.vine.T.length;}
      if(swapAt==null&&$('splash').classList.contains('vopen'))swapAt=t;await new Promise(r=>requestAnimationFrame(r));}
    o.swap=+SPL.swapT.toFixed(2);o.seen=+swapAt.toFixed(2);o.done=+((performance.now()-t0)/1000).toFixed(2);o.focus=document.activeElement&&document.activeElement.id;o.live=!!MD.G;o.st=mmState();return o;});
  if(!run)await p.screenshot({path:`${SHOTS}/after_transition.png`});
  ok(`transition ${run+1}: tendrils grow (${r.n} of them), the screen is fully covered by 0.85 s, the menu goes underneath while covered, all done by 2.2 s, keyboard on Campaign, scene running`,
    r.n>=5&&r.n<=8&&r.mid>.1&&r.mid<.99&&r.cover>=.995&&r.swap>=.85&&r.swap<=1.06&&r.done<=2.25&&r.focus==='m-campaign'&&r.live&&r.st==='play',JSON.stringify(r));
  ok(`no errors (transition ${run+1})`,!p.errs.length,p.errs[0]);await p.context().close();}
 {const p=await open(br,{splash:true});await p.waitForTimeout(600);await p.keyboard.press('Enter');await p.waitForTimeout(300);
  const dt=await p.evaluate(()=>{const t=performance.now();window.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',bubbles:true,cancelable:true}));return SPL.on?999:performance.now()-t;});
  await p.waitForTimeout(200);const s=await p.evaluate(()=>({splash:!$('splash').hidden,cv:!!$('splashVn'),set:!$('settings').hidden,planet:!$('planet').hidden,g:!!window.__game(),focus:document.activeElement.id}));
  ok('a second key goes straight to the menu at once (in the same moment), and presses nothing in it',dt<50&&!s.splash&&!s.cv&&!s.set&&!s.planet&&!s.g&&s.focus==='m-campaign',JSON.stringify({dt,...s}));await p.context().close();}
 {const p=await open(br,{splash:true,rm:true});await p.waitForTimeout(600);const t0=Date.now();await p.keyboard.press('Enter');await p.waitForFunction(()=>!SPL.on,null,{timeout:3000});const dt=Date.now()-t0;
  const s=await p.evaluate(()=>({cv:!!$('splashVn'),tr:getComputedStyle($('splash')).transitionDuration}));
  ok('reduced motion: no tendrils, a crossfade of about 200 ms',!s.cv&&dt<=400,JSON.stringify({dt,...s}));await p.context().close();}
 console.log(fails?`FAIL (${fails})`:'ALL PASS');await br.close();process.exit(fails?1:0);})();
