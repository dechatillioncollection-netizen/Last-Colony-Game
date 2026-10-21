// v46 tests: the sound system (mixer, sliders, saving, muting, triggers, pooling, clean-up, ambience, cost), the event camera and the
// Mission 1 patrol arrival. Runs against index.html (v46) and lc2_v45_index.html (the previous release) on localhost:8123.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'lc2_v45_index.html',NEW=process.env.NEW||'index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const ctxB=await b.newContext({viewport:{width:1280,height:800}});
 const errs=[];
 const open=async(f,o={})=>{const p=await (o.ctx||ctxB).newPage();p.on('pageerror',e=>errs.push(f+': '+e.message));await p.goto('http://localhost:8123/'+f);await p.waitForTimeout(700);
   if(o.clear)await p.evaluate(()=>localStorage.clear());await p.mouse.click(5,5);
   for(let i=0;i<80;i++){if(await p.evaluate(()=>!window.__snd||__snd.ready))break;await p.waitForTimeout(150);}if(o.norAF)await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});return p;};
 const wait=ms=>new Promise(r=>setTimeout(r,ms));
 const N=await open(NEW,{clear:true});
 ok(await N.evaluate(()=>__snd.ready&&__snd.ctx.state==='running'&&Object.keys(__snd.buf).length>=140),'the sounds load and play after the first click (145 sounds decoded)',await N.evaluate(()=>({n:Object.keys(__snd.buf).length,state:__snd.ctx.state})));

 // ---- 1, 2, 3: the three sliders, Master multiplying, saved between sessions
 await N.evaluate(()=>openSettings());
 const setSlider=(id,v)=>N.evaluate(([id,v])=>{const el=document.getElementById(id);el.value=v;el.dispatchEvent(new Event('input',{bubbles:true}));el.dispatchEvent(new Event('change',{bubbles:true}));},[id,v]);
 await setSlider('vol_m',50);await setSlider('vol_s',80);await setSlider('vol_a',60);await wait(300);
 let r=await N.evaluate(()=>{const B=__snd.bus;return {vol:__snd.vol,eff:sndEff(),gm:+B.master.gain.value.toFixed(3),gs:+B.s.gain.value.toFixed(3),ga:+B.a.gain.value.toFixed(3),labels:['m','s','a'].map(k=>$('volv_'+k).textContent),
   chainS:+(B.master.gain.value*B.s.gain.value).toFixed(3),chainA:+(B.master.gain.value*B.a.gain.value).toFixed(3)};});
 ok(r.gm===.5&&r.gs===.8&&r.ga===.6&&r.labels.join()==='50%,80%,60%','all three sliders set their own gains at once and show their percentages',r);
 ok(Math.abs(r.eff.s-.4)<1e-9&&Math.abs(r.eff.a-.3)<1e-9&&r.chainS===.4&&r.chainA===.3,'Master 50% with Sound Effects 80% and Ambience 60% gives 40% and 30%, in the mixer itself',r);
 await setSlider('vol_m',100);await wait(300);
 r=await N.evaluate(()=>({vol:__snd.vol,eff:sndEff(),gs:+__snd.bus.s.gain.value.toFixed(3),ga:+__snd.bus.a.gain.value.toFixed(3)}));
 ok(r.vol.s===.8&&r.vol.a===.6&&r.gs===.8&&r.ga===.6&&Math.abs(r.eff.s-.8)<1e-9,'Master back at 100% leaves Sound Effects at 80% and Ambience at 60% (it never rewrote them)',r);
 await setSlider('vol_m',70);await setSlider('vol_s',35);await setSlider('vol_a',90);await N.evaluate(()=>{$('optMute').checked=true;$('optMute').dispatchEvent(new Event('change'));});
 const P2=await open(NEW);await P2.evaluate(()=>openSettings());
 r=await P2.evaluate(()=>({vol:__snd.vol,ui:['m','s','a'].map(k=>[+$('vol_'+k).value,$('volv_'+k).textContent]),mute:$('optMute').checked,gm:__snd.bus.master.gain.value}));
 ok(r.vol.m===.7&&r.vol.s===.35&&r.vol.a===.9&&r.vol.mute===true&&r.ui[1][1]==='35%'&&r.mute&&r.gm===0,'the settings are saved and come back in a new session (values, labels and the mute switch)',r);
 await P2.evaluate(()=>{$('optMute').checked=false;$('optMute').dispatchEvent(new Event('change'));SND.vol={m:.8,s:.8,a:.6,mute:false};sndApply(true);sndSave();});await P2.close();
 await N.evaluate(()=>{SND.vol={m:.8,s:.8,a:.6,mute:false};sndApply(true);sndSave();$('settings').hidden=true;});

 // a fight in real time, used by several checks below
 const fight=(p,n)=>p.evaluate(n=>{SET.fog=false;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);const cx=G.core.x+1.5,cy=G.core.y+1.5,ts=['mite','tank','htank'];
   for(let k=0;k<n;k++)spawnUnit(ts[k%3],cx+3+(k%10)*.7,cy-4+Math.floor(k/10)*.8);cam.z=1.1;centerOn(cx+9,cy);
   for(let k=0;k<12;k++){const e=spawnEnemy(['dagger','mace','crawler','fortress','flare','horizon'][k%6]);e.x=cx+19+(k%3);e.y=cy-4+(k%6)*1.6;}},n);
 const rms=(p,ms)=>p.evaluate(ms=>new Promise(res=>{const a=__snd.bus.meter,buf=new Float32Array(a.fftSize);let s=0,n=0,mx=0;const t0=performance.now();
   const f=()=>{a.getFloatTimeDomainData(buf);for(const v of buf){s+=v*v;n++;mx=Math.max(mx,Math.abs(v));}if(performance.now()-t0<ms)setTimeout(f,40);else res({rms:Math.sqrt(s/n),peak:mx});};f();}),ms);

 // ---- 4: a muted category makes no sound at all
 await fight(N,20);await wait(2500);
 const loud=await rms(N,1200);
 await N.evaluate(()=>{SND.vol.mute=true;sndApply();});await wait(400);const muted=await rms(N,1200);
 await N.evaluate(()=>{SND.vol.mute=false;SND.vol.s=0;SND.vol.a=0;sndApply();});await wait(400);const zero=await rms(N,1200);
 ok(loud.rms>.002&&muted.peak===0&&zero.peak===0,'muting, or both sliders at 0%, gives exactly silent output during a fight (every sample is 0)',{loud,muted,zero});
 await N.evaluate(()=>{SND.vol.s=0;SND.vol.a=.6;sndApply();});await wait(1500);
 r=await N.evaluate(()=>new Promise(res=>{let maxV=0,eng=0,beds=0;const t0=performance.now();const f=()=>{maxV=Math.max(maxV,__snd.voices.length);eng=Math.max(eng,__snd.eng.size);beds=Math.max(beds,Object.keys(__snd.beds).length);
   if(performance.now()-t0<2000)setTimeout(f,50);else res({maxV,eng,beds,amb:Object.keys(__snd.amb).length,played:__snd.stats.played});};f();}));
 const ambOnly=await rms(N,800);
 ok(r.maxV===0&&r.eng===0&&r.beds===0&&r.amb>0&&ambOnly.rms>0,'Sound Effects at 0%: no effect voices, engines or beds at all, while the ambience still plays',{...r,ambOnly});
 await N.evaluate(()=>{SND.vol.s=.8;SND.vol.a=0;sndApply();});await wait(1500);
 r=await N.evaluate(()=>({amb:Object.keys(__snd.amb).length,ga:__snd.bus.a.gain.value,voices:__snd.voices.length+__snd.eng.size}));
 ok(r.amb===0&&r.ga===0&&r.voices>0,'Ambience at 0%: every ambience loop is stopped, while effects carry on',r);
 await N.evaluate(()=>{SND.vol={m:.8,s:.8,a:.6,mute:false};sndApply(true);sndSave();});

 // ---- 6: sounds only for things that really happen
 r=await N.evaluate(async()=>{startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);G.webFree=true;const cx=G.core.x,cy=G.core.y;
   const put=(t,x,y)=>{for(let r=0;r<8;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(tryPlace(t,x+dx,y+dy,0,true))return true;return false;};put('combustion',cx-4,cy-3);put('duo',cx+6,cy-3);for(const b of G.blocks.values()){b.built=1;b.bt=0;}cam.z=1.3;centerOn(cx+1,cy);
   const s0={...__snd.stats.by};await new Promise(r=>setTimeout(r,3000));
   const idle={feed:(__snd.stats.by.burner_feed||0)-(s0.burner_feed||0),bed:!!__snd.beds.burner,spit:(__snd.stats.by.thorn_spit||0)-(s0.thorn_spit||0)};
   const bu=[...G.blocks.values()].find(b=>b.t==='combustion');bu.inv[COAL]=2;await new Promise(r=>setTimeout(r,2500));
   const fed={feed:(__snd.stats.by.burner_feed||0)-(s0.burner_feed||0),bed:!!__snd.beds.burner&&__snd.beds.burner.g.gain.value>.05,burn:+bu.burn.toFixed(2)};
   bu.inv[COAL]=0;await new Promise(r=>setTimeout(r,4500));const out={burn:+bu.burn.toFixed(2),bed:__snd.beds.burner?+__snd.beds.burner.g.gain.value.toFixed(3):0};
   return {idle,fed,out};});
 ok(r.idle.feed===0&&!r.idle.bed&&r.idle.spit===0,'an idle Sap Burner (no coal) and a Thorn Spitter with no target make no sound',r.idle);
 ok(r.fed.feed>=1&&r.fed.bed,'given coal, the Sap Burner takes it in with a whumph and its burning bed starts',r.fed);
 ok(r.out.burn<=0&&r.out.bed<.01,'when the coal runs out the burning bed fades away',r.out);
 r=await N.evaluate(async()=>{const by0={...__snd.stats.by};await new Promise(r=>setTimeout(r,3000));const d={};for(const k in __snd.stats.by){const v=__snd.stats.by[k]-(by0[k]||0);if(v)d[k]=v;}return d;});
 const combat=Object.keys(r).filter(k=>/gun|cannon|flame|explode|boom|hit|die|fire|spit|blast/.test(k));
 ok(combat.length===0,'with no enemies, no combat sound plays',r);
 r=await N.evaluate(async()=>{const G=window.__game();G.story=null;const before=__snd.stats.by.thorn_spit||0;const tu=[...G.blocks.values()].find(b=>b.t==='duo');tu.ammo[CU]=20;
   const e=spawnEnemy('dagger');e.x=tu.x+4;e.y=tu.y+1;e.hp=1e5;e.max=1e5;await new Promise(r=>setTimeout(r,2500));const shots=G.bullets.length;return {spits:(__snd.stats.by.thorn_spit||0)-before,shot:tu.shot>0,hits:__snd.stats.by.metal_hit||0};});
 ok(r.spits>=2&&r.hits>=1,'a Thorn Spitter firing at a vehicle spits, and its thorns clank on the hull',r);

 // ---- 7, 8: a large swarm stays within the voice budget; nothing keeps playing after its source is gone
 await fight(N,30);await N.evaluate(()=>{const G=window.__game();const cx=G.core.x+1.5,cy=G.core.y+1.5;for(let k=0;k<70;k++)spawnUnit(['mite','tank'][k%2],cx-6+(k%10)*.7,cy+3+Math.floor(k/10)*.8);sendAnts(G.units,cx+20,cy);});
 r=await N.evaluate(()=>new Promise(res=>{let maxV=0,maxSame=0,beds=new Set(),maxEng=0;const by0={...__snd.stats.by},t0=performance.now();
   const f=()=>{maxV=Math.max(maxV,__snd.voices.length);const c={};for(const v of __snd.voices)c[v.name]=(c[v.name]||0)+1;maxSame=Math.max(maxSame,...Object.values(c),0);for(const k in __snd.beds)beds.add(k);maxEng=Math.max(maxEng,__snd.eng.size);
     if(performance.now()-t0<5000)setTimeout(f,30);else{const d={};for(const k in __snd.stats.by){const v=__snd.stats.by[k]-(by0[k]||0);if(v)d[k]=v;}res({ants:window.__game().units.length,maxV,maxSame,beds:[...beds],maxEng,played5s:d,req:__snd.stats.req});}};f();}));
 const antFire=(r.played5s.mite_fire||0)+(r.played5s.thornback_fire||0);
 ok(r.ants>=90&&r.maxV<=24&&r.maxSame<=3&&r.maxEng<=4&&r.beds.filter(k=>k==='scuttle').length===1&&antFire<=5/.04,'100 ants fighting: at most 24 voices, at most 3 of any one sound, 4 engines, one shared scuttle bed',{...r,antFire});
 r=await N.evaluate(async()=>{const G=window.__game();for(const e of G.enemies)damageEnemy(e,1e9);const t0=performance.now();let gone=null;
   while(performance.now()-t0<3000){await new Promise(r=>setTimeout(r,50));if(!__snd.eng.size&&gone===null)gone=performance.now()-t0;}
   for(const u of G.units)hurtUnit(u,1e9);await new Promise(r=>setTimeout(r,2000));const sc=__snd.beds.scuttle?__snd.beds.scuttle.g.gain.value:0;
   const bu=[...G.blocks.values()];return {engGoneMs:gone,scuttle:+sc.toFixed(4),enemies:G.enemies.length};});
 ok(r.engGoneMs!==null&&r.engGoneMs<800&&r.scuttle<.02,'destroyed vehicles stop their engines at once, and dead ants leave no scuttle',r);
 r=await N.evaluate(async()=>{startGame('survival');const G=window.__game();G.countdown=1e9;G.webFree=true;G.items=G.items.map(v=>v+9000);const put=(t,x,y)=>{for(let r=0;r<8;r++)for(let dx=-r;dx<=r;dx++)for(let dy=-r;dy<=r;dy++)if(tryPlace(t,x+dx,y+dy,0,true))return true;return false;};put('combustion',G.core.x-4,G.core.y-3);
   const bu=[...G.blocks.values()].find(b=>b.t==='combustion');bu.built=1;bu.bt=0;bu.inv[COAL]=50;cam.z=1.3;centerOn(G.core.x,G.core.y);await new Promise(r=>setTimeout(r,2500));
   const on=__snd.beds.burner?__snd.beds.burner.g.gain.value:0;destroyBlock(bu);await new Promise(r=>setTimeout(r,2500));return {on:+on.toFixed(3),after:__snd.beds.burner?+__snd.beds.burner.g.gain.value.toFixed(4):0};});
 ok(r.on>.05&&r.after<.01,'a burning Sap Burner that is destroyed stops sounding',r);
 r=await N.evaluate(async()=>{const G=window.__game();G.over=true;await new Promise(r=>setTimeout(r,1500));return {beds:Object.keys(__snd.beds).length,eng:__snd.eng.size};});
 ok(r.beds===0&&r.eng===0,'a finished game leaves no beds or engines running',r);

 // ---- 9: ambience moves smoothly between calm, threat and combat, and settles back afterwards
 r=await N.evaluate(async()=>{startGame('survival');const G=window.__game();G.countdown=1e9;cam.z=1;centerOn(G.core.x+1.5,G.core.y+1.5);await new Promise(r=>setTimeout(r,2500));
   const g=k=>__snd.amb[k]?__snd.amb[k].g.gain.value:0,log=[];const cx=G.core.x+1.5,cy=G.core.y+1.5;
   for(let k=0;k<4;k++){const e=spawnEnemy('fortress');e.x=cx+34+k;e.y=cy+k;}
   for(let i=0;i<40;i++){await new Promise(r=>setTimeout(r,100));log.push([g('amb_threat'),g('amb_combat')]);}
   for(let k=0;k<30;k++)sndHeat(.5);for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,100));log.push([g('amb_threat'),g('amb_combat')]);}
   for(const e of G.enemies)e.dead=true;for(let i=0;i<60;i++){await new Promise(r=>setTimeout(r,100));log.push([g('amb_threat'),g('amb_combat')]);}
   let jump=0;for(let i=1;i<log.length;i++)jump=Math.max(jump,Math.abs(log[i][0]-log[i-1][0]),Math.abs(log[i][1]-log[i-1][1]));
   return {threat4s:+log[39][0].toFixed(3),combat7s:+log[69][1].toFixed(3),threatEnd:+log[129][0].toFixed(3),combatEnd:+log[129][1].toFixed(3),combatMid:+log[100][1].toFixed(3),jump:+jump.toFixed(4),wind:+g('amb_meadow').toFixed(3)};});
 ok(r.threat4s>.1&&r.combat7s>.15&&r.threatEnd<r.threat4s*.5&&r.combatEnd<r.combat7s&&r.combatMid>r.combatEnd&&r.jump<.06&&r.wind>.3,'ambience: machines far off bring a rising rumble, a fight rouses the hive, and both ease back afterwards without a jump',r);

 // ---- 10: cost. The same 200-ant fight on one page, sound switched on and off in turns (so both sides get the same warm-up),
 // comparing frame times and the time a game step takes; and the game itself must be unchanged
 const pr=await N.evaluate(async()=>{SET.fog=false;startGame('survival');const G=window.__game();G.countdown=1e9;const cx=G.core.x+1.5,cy=G.core.y+1.5;
   for(let k=0;k<30;k++)spawnUnit(['mite','tank','htank'][k%3],cx+3+(k%10)*.7,cy-4+Math.floor(k/10)*.8);for(let k=0;k<170;k++)spawnUnit(['mite','tank'][k%2],cx-14+(k%17)*.8,cy-8+Math.floor(k/17)*.9);
   for(let k=0;k<14;k++){const e=spawnEnemy(['dagger','mace','fortress'][k%3]);e.x=cx+16+(k%3);e.y=cy-6+k;e.hp=e.max=1e5;}cam.z=.8;centerOn(cx+2,cy);
   const real={snd,sndTick},quiet=()=>{},res={on:{fr:[],st:[],voices:0},off:{fr:[],st:[],voices:0}};let sMs=0,sSteps=0,tMs=0,tN=0;
   // the time the game's own thread spends in sound code, measured directly around every sound call and the 10 Hz sound update
   const timedSnd=(k,a,b)=>{const t=performance.now();real.snd(k,a,b);sMs+=performance.now()-t;},timedTick=dt=>{const t=performance.now();real.sndTick(dt);tMs+=performance.now()-t;tN++;};
   for(let k=0;k<60;k++)step(1/30);   // warm-up
   for(let round=0;round<8;round++){const on=round%2===0,R=on?res.on:res.off;snd=on?timedSnd:quiet;sndTick=on?timedTick:quiet;if(!on)for(const v of [...SND.voices])sndKill(v);
     let last=performance.now();await new Promise(r=>{let n=0;const f=t=>{if(n++)R.fr.push(t-last);last=t;if(n<40)requestAnimationFrame(f);else r();};requestAnimationFrame(f);});
     for(let j=0;j<5;j++){const t=performance.now();for(let k=0;k<20;k++)step(1/30);R.st.push((performance.now()-t)/20);if(on)sSteps+=20;}if(on)R.voices=Math.max(R.voices,SND.voices.length);}
   snd=real.snd;sndTick=real.sndTick;const med=a=>{a=[...a].sort((x,y)=>x-y);return +a[a.length>>1].toFixed(2);},p90=a=>{a=[...a].sort((x,y)=>x-y);return +a[Math.floor(a.length*.9)].toFixed(1);};
   const f=R=>({median:med(R.fr),p90:p90(R.fr),stepMs:med(R.st),voices:R.voices});return {on:f(res.on),off:f(res.off),req:SND.stats.req,soundMsPerStep:+(sMs/Math.max(1,sSteps)).toFixed(4),soundTickMs:+(tMs/Math.max(1,tN)).toFixed(3)};});
 const pOn=pr.on,pOff=pr.off;
 // (the step times with sound on and off are reported but not judged: the browser mixes audio on its own thread, which on a busy 4-core test machine
 // competes with the game for the processor and makes a whole-step comparison noisy; the game thread's own sound work is measured directly instead)
 ok(pOn.median<=pOff.median*1.15+2&&pr.soundMsPerStep<.25&&pr.soundTickMs<1&&pOn.voices>0,'200 ants fighting: frames cost the same with sound on as off, and sound work on the game thread is under 0.25 ms a step and 1 ms per sound update',pr);
 const sim=(p,o)=>p.evaluate(async o=>{SET.fog=false;let s=o.seed;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;if(DLG.open){DLG.done=null;closeDlg();}startGame(o.mode);const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+5000);
   for(let k=0;k<150;k++)step(1/30);const cx=G.core.x+1.5,cy=G.core.y+1.5,ts=['mite','tank','htank'];for(let k=0;k<24;k++)spawnUnit(ts[k%3],cx+3+(k%6)*.8,cy-2+Math.floor(k/6)*.9);
   if(o.attack)setCommand('attack');let deaths=0;cam.z=1.6;
   for(let w=0;w<3;w++){for(let k=0;k<10;k++)G.spawnQ.push({t:['dagger','mace','crawler','fortress'][k%4],at:G.time+k*.4});
     for(let k=0;k<900;k++){const n=G.units.length;step(1/30);deaths+=Math.max(0,n-G.units.length);if(k%o.draw===0){const u=G.units[0];if(u)centerOn(u.x,u.y);render();if(window.sndTick){SND.tAcc=1;sndTick(.1);}}}}
   const save=await encodeSave();rnd=Math.random=Math.random;return {len:save.length,h:[...save].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0),deaths,time:+G.time.toFixed(2),sounds:window.__snd?__snd.stats.played:0};},o);
 const A=await open(OLD,{norAF:true}),Bn=await open(NEW,{norAF:true});
 for(const o of [{seed:7,mode:'survival',draw:3,attack:true},{seed:3,mode:'siege',draw:5,attack:true},{seed:11,mode:'survival',draw:1e9,attack:false}]){
   const ra=await sim(A,o),rb=await sim(Bn,o);const same=ra.h===rb.h&&ra.len===rb.len&&ra.deaths===rb.deaths;
   ok(same&&rb.sounds>0&&(ra.deaths>0||o.draw>1e8),`the game is unchanged by sound: byte-identical save to v45 (${o.mode}, seed ${o.seed}, ${o.draw>1e8?'never drawn':'drawn every '+o.draw+' steps'}, ${rb.deaths} ant deaths, sound playing)`,{v45:ra,v46:rb});}
 await A.close();await Bn.close();

 // ---- campaign: the event camera and the Mission 1 patrol
 const fc=async(f)=>{const p=await open(f,{clear:true});
   await p.click('#m-campaign');await p.waitForTimeout(800);await p.click('#launch');await p.waitForTimeout(900);
  // v48: a new campaign opens with the intro; skip it (Escape) to reach Landfall
  if(await p.evaluate(()=>typeof INTRO!=='undefined'&&INTRO.on)){await p.keyboard.press('Escape');await p.waitForTimeout(700);}
   for(let k=0;k<60&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(40);}
   const pre=await p.evaluate(()=>{const G=window.__game();G.webFree=true;window.__seq=[];const ns=nextSeq;nextSeq=function(){const k=DLG.queue[0];if(k)__seq.push(k);return ns.apply(this,arguments);};
     for(let r=5;r<12;r++){if(tryPlace('duo',G.core.x+r,G.core.y-2,0,true))break;}for(const b of G.blocks.values())if(b.t==='duo'){b.built=1;b.bt=0;}
     cam.z=1;centerOn(G.core.x+1.5,G.core.y+1.5);window.__c0=[cam.x,cam.y,cam.z];const v0=[cam.x/T,cam.y/T,VW/cam.z/T,VH/cam.z/T];G.story.k=TUT.length-1;tutDone();
     const P=G.enemies.filter(e=>e.script);const inV=(x,y)=>x>v0[0]&&x<v0[0]+v0[2]&&y>v0[1]&&y<v0[1]+v0[3];
     return {n:P.length,types:P.map(e=>e.t),valid:P.every(e=>inMap(Math.floor(e.x),Math.floor(e.y))&&!solidTile(tileAt(e.x,e.y),1)),seenInPlayerView:P.some(e=>inV(e.x,e.y)),
       frame:G.story.frame||null,start:typeof CINE!=='undefined'?(P[0].park||[P[0].x,P[0].y]):null};});
   const t0=await p.evaluate(()=>window.__game().time);let firstVis=null,heardOff=null,lockHeld=null,log=[];
   for(let k=0;k<400;k++){const s=await p.evaluate(()=>{const G=window.__game(),P=G.enemies.filter(e=>e.script&&!e.dead);const vw=VW/cam.z/T,vh=VH/cam.z/T,x0=cam.x/T,y0=cam.y/T;
       const vis=P.some(e=>e.x>x0&&e.x<x0+vw&&e.y>y0&&e.y<y0+vh);let eg=0;if(window.__snd)for(const v of __snd.eng.values())eg=Math.max(eg,v.g.gain.value);
       return {s:G.story.s,t:G.time,dlg:DLG.open,vis,eg,cam:[cam.x,cam.y,cam.z],lock:typeof CINE!=='undefined'&&CINE.lock,frame:typeof CINE!=='undefined'&&CINE.on?[CINE.x,CINE.y]:null};});
     if(s.vis&&firstVis===null)firstVis=s.t;if(!s.vis&&s.eg>.02&&heardOff===null)heardOff=s.t;log.push(s);
     if(k===10){const c0=s.cam;await p.keyboard.down('d');await p.waitForTimeout(350);await p.keyboard.up('d');await p.mouse.move(640,400);await p.mouse.wheel(0,-300);await p.waitForTimeout(150);
       const c1=await p.evaluate(()=>[cam.x,cam.y,cam.z]);lockHeld={lock:s.lock,moved:Math.hypot(c1[0]-c0[0],c1[1]-c0[1]),dz:Math.abs(c1[2]-c0[2])};}
     if(s.dlg)break;await p.waitForTimeout(150);}
   const talk=await p.evaluate(()=>({t:window.__game().time,s:window.__game().story.s}));
   for(let k=0;k<300&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(25);}
   let wd=[];for(let k=0;k<400;k++){const s=await p.evaluate(()=>{const G=window.__game();const vw=VW/cam.z/T,vh=VH/cam.z/T,x0=cam.x/T,y0=cam.y/T;
       return {s:G.story.s,t:G.time,dlg:DLG.open,n:G.enemies.filter(e=>e.script&&!e.dead).length,vanishInView:0,cine:typeof CINE!=='undefined'?CINE.on:false,eng:window.__snd?__snd.eng.size:0,
         inView:G.enemies.filter(e=>e.script&&!e.dead).map(e=>e.x>x0-.5&&e.x<x0+vw+.5&&e.y>y0-.5&&e.y<y0+vh+.5)};});
     wd.push(s);if(s.dlg)break;await p.waitForTimeout(150);}
   // a vehicle must never vanish while on screen: between two samples, a count drop only when the vehicles that went were off screen
   let vanished=0;for(let i=1;i<wd.length;i++)if(wd[i].n<wd[i-1].n&&wd[i-1].inView.filter(Boolean).length>wd[i].inView.filter(Boolean).length&&wd[i-1].inView.length-wd[i].inView.length>wd[i-1].inView.filter(v=>!v).length)vanished++;
   for(let k=0;k<60&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(25);}
   await p.waitForTimeout(2500);
   const end=await p.evaluate(()=>({s:window.__game().story.s,seq:__seq,cam:[cam.x,cam.y,cam.z],c0:__c0,cine:typeof CINE!=='undefined'?[CINE.on,CINE.lock]:[false,false],
     eng:window.__snd?__snd.eng.size:0,threat:window.__snd&&__snd.amb.amb_threat?__snd.amb.amb_threat.g.gain.value:0,flags:CAMP.flags}));
   const c1=await p.evaluate(()=>[cam.x,cam.y]);await p.keyboard.down('d');await p.waitForTimeout(400);await p.keyboard.up('d');const c2=await p.evaluate(()=>[cam.x,cam.y]);
   return {p,pre,arrive:+(talk.t-t0).toFixed(1),firstVis:firstVis===null?null:+(firstVis-t0).toFixed(1),heardOff:heardOff===null?null:+(heardOff-t0).toFixed(1),lockHeld,log,wd,vanished,end,controls:c2[0]-c1[0]};};
 const fo=await fc(OLD),fn=await fc(NEW);
 ok(fn.pre.n===3&&fn.pre.types.join()===fo.pre.types.join()&&fn.pre.valid,'the patrol is the same three Scout Tanks as before, all starting on open ground inside the map',{v45:fo.pre.types,v46:fn.pre});
 ok(!fn.pre.seenInPlayerView,'no vehicle appears inside the player\'s view when the event starts (one in view waits further back, out of sight)',fn.pre);
 ok(fn.arrive<fo.arrive*.4&&fn.arrive<14,'Mission 1: the patrol reaches the meeting place far sooner',{v45_seconds:fo.arrive,v46_seconds:fn.arrive});
 ok(fn.firstVis!==null&&fn.firstVis>=2&&fn.firstVis<8,'the vehicles drive into view a few seconds after the event begins, not instantly',{firstVisible:fn.firstVis});
 ok(fn.heardOff!==null&&fn.heardOff<fn.firstVis,'their engines are heard before they come into view',{heardAt:fn.heardOff,seenAt:fn.firstVis});
 const camLocked=fn.log.slice(3,15).every(s=>s.lock),framed=fn.log.slice(8).some(s=>s.frame);
 ok(camLocked&&framed&&fn.lockHeld.lock&&fn.lockHeld.moved<4&&fn.lockHeld.dz<.01,'the camera pans to the scene and holds there: keys and the wheel do not move it during the moment',fn.lockHeld);
 ok(fn.end.seq.join()===fo.end.seq.join()&&fn.end.s==='main'&&fn.end.flags.firstContact===1,'the story plays in the same order as before and the tutorial completes',{v45:fo.end.seq,v46:fn.end.seq});
 ok(Math.abs(fn.end.cam[0]-fn.end.c0[0])<2&&Math.abs(fn.end.cam[1]-fn.end.c0[1])<2&&Math.abs(fn.end.cam[2]-fn.end.c0[2])<.005&&!fn.end.cine[0]&&fn.controls>20,'afterwards the camera is back where the player had it, at their zoom, and the controls work at once',{end:fn.end.cam,before:fn.end.c0,controlsMovedPx:fn.controls});
 ok(fn.vanished===0&&fn.end.eng===0&&fn.end.threat<.05,'the patrol leaves without vanishing on screen, and its engines and the far rumble die away',{vanished:fn.vanished,eng:fn.end.eng,threat:fn.end.threat});
 await fo.p.close();
 // a save made while the patrol drives in: the player's camera is what gets saved; loading resumes the scene with the camera on it
 r=await fn.p.evaluate(async()=>{localStorage.removeItem('lc_camp');startMission('landfall');for(let k=0;k<60&&DLG.open;k++){DLG.done&&0;advanceDlg();}while(DLG.open)skipDlg();
   const G=window.__game();G.webFree=true;for(let r=5;r<12;r++){if(tryPlace('duo',G.core.x+r,G.core.y-2,0,true))break;}for(const b of G.blocks.values())if(b.t==='duo'){b.built=1;b.bt=0;}
   cam.z=1;centerOn(G.core.x+1.5,G.core.y+1.5);const c0=[cam.x,cam.y,cam.z];G.story.k=TUT.length-1;tutDone();await new Promise(r=>setTimeout(r,1500));
   const mid=[cam.x,cam.y,cam.z],S=await decodeSave(await encodeSave());const savedCam=[S.cam.x,S.cam.y,S.cam.z];applySave(S);await new Promise(r=>setTimeout(r,1800));
   return {c0,mid,savedCam,s:window.__game().story.s,cineOn:CINE.on,lock:CINE.lock};});
 ok(Math.abs(r.savedCam[0]-r.c0[0])<1&&Math.abs(r.savedCam[2]-r.c0[2])<.001&&Math.abs(r.mid[0]-r.c0[0])>20&&r.s==='fc_walk'&&r.cineOn&&r.lock,'a save during the scene keeps the player\'s own camera; loading it resumes the scene with the camera framing it again',r);
 // a restart in the middle of the moment leaves no locked camera behind; overlapping moments return to the first saved view
 r=await fn.p.evaluate(async()=>{startMission('landfall');while(DLG.open)skipDlg();const a={on:CINE.on,lock:CINE.lock};
   cam.z=1.2;centerOn(30,30);const c0=[cam.x,cam.y,cam.z];cineFocus(10,10,{z:1});await new Promise(r=>setTimeout(r,500));cineFocus(50,40,{z:.9});await new Promise(r=>setTimeout(r,800));cineEnd();await new Promise(r=>setTimeout(r,2600));
   return {afterRestart:a,back:[cam.x,cam.y,cam.z],c0,on:CINE.on};});
 ok(!r.afterRestart.on&&!r.afterRestart.lock&&Math.abs(r.back[0]-r.c0[0])<2&&Math.abs(r.back[2]-r.c0[2])<.005&&!r.on,'restarting mid-scene unlocks the camera, and two overlapping moments still return to the view from before the first',r);
 // other scripted story moments that point at a place (Mission 2's depot) pan there and come back
 r=await fn.p.evaluate(async()=>{CAMP.captured.landfall={time:1};startMission('ember');const G=window.__game();const c0=[cam.x,cam.y,cam.z];let seen=null;
   for(let k=0;k<200&&DLG.open;k++){if(CINE.on&&CINE.lock&&!seen)seen={why:CINE.why,lock:CINE.lock};advanceDlg();advanceDlg();await new Promise(r=>setTimeout(r,60));}
   await new Promise(r=>setTimeout(r,2600));return {seen,c0,end:[cam.x,cam.y,cam.z],on:CINE.on};});
 ok(r.seen&&r.seen.lock&&Math.abs(r.end[0]-r.c0[0])<2&&Math.abs(r.end[1]-r.c0[1])<2&&!r.on,'a story line that points at a place (Mission 2: the depot) pans there, holds, and returns afterwards',r);
 await fn.p.close();
 ok(errs.length===0,'no page errors',errs.slice(0,5));
 fs.writeFileSync('perf46.json',JSON.stringify(pr,null,1));
 console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(fail?1:0);})();
