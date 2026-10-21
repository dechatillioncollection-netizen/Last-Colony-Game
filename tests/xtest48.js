// v48 tests: the intro cinematic. First play of a new campaign (in real time, start to finish), the hand-off into Landfall's Root-Link
// opening and tutorial, Skip from every scene, no second play, older campaigns and saves, Replay intro, sound through the mixer, layout at
// several screen sizes, the same picture every time, and cost per frame. Runs against index.html on localhost:8123.
const {chromium}=require(process.env.PW||'playwright');
const NEW=process.env.NEW||'index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const errs=[];
 const fresh=async(o={})=>{const ctx=await b.newContext({viewport:o.vp||{width:1280,height:720}});const p=await ctx.newPage();p.on('pageerror',e=>errs.push(e.message));
   await p.goto('http://localhost:8123/'+NEW);await p.waitForTimeout(500);await p.evaluate(()=>localStorage.clear());if(o.camp)await p.evaluate(c=>localStorage.setItem('lc_campaign',c),o.camp);
   await p.reload();await p.waitForTimeout(600);await p.mouse.click(5,5);
   await p.evaluate(()=>{window.__plays=[];const ps=playStory;playStory=function(k,d){__plays.push(k.join('+'));return ps.apply(this,arguments);};
     window.__begins=0;const sb=storyBegin;storyBegin=function(){__begins++;return sb.apply(this,arguments);};});
   return {p,ctx};};
 const launch=async p=>{await p.click('#m-campaign');await p.waitForTimeout(800);await p.click('#launch');await p.waitForTimeout(300);};
 const state=p=>p.evaluate(()=>({on:INTRO.on,mode:INTRO.mode,t:+INTRO.t.toFixed(2),s:G&&G.story&&G.story.s,paused:G&&G.paused,time:G&&+G.time.toFixed(3),cd:G&&G.countdown,dlg:DLG.open,
   chan:DLG.open&&DLG.seq?DLG.seq.chan:'',plays:__plays.slice(),begins:__begins,hud:getComputedStyle($('top')).opacity,hidehud:document.body.classList.contains('intro-on'),flags:CAMP&&CAMP.flags,cam:[+cam.x.toFixed(1),+cam.y.toFixed(1),+cam.z.toFixed(2)],
   want:G&&(()=>{const [x,y,z]=introGameCam();return [+((x*T)-VW/2/z).toFixed(1),+((y*T)-VH/2/z).toFixed(1),z];})(),tut:$('tut').hidden?'':$('tutTitle').textContent}));

 // ---- 1: a new campaign plays the intro once, in real time, and hands over to Landfall
 {const {p,ctx}=await fresh();await launch(p);let r=await state(p);
  ok(r.on&&r.mode==='first'&&r.s==='intro'&&r.paused&&!r.dlg&&r.hidehud&&r.begins===0,'Launch on Landfall in a new campaign starts the intro, with the mission held still underneath and no dialogue or interface',r);
  await p.keyboard.press('c');await p.keyboard.press('t');await p.keyboard.press(' ');
  r=await p.evaluate(()=>({cmd:G.command,tech:$('tech').hidden,on:INTRO.on}));ok(r.cmd==='defend'&&r.tech&&r.on,'the game\'s keys do nothing while the intro plays (C, T and Space)',r);
  // sample the captions and the frame time while it plays
  const seen=[];let fr=[];await p.evaluate(()=>{window.__ft=[];let l=0;const f=now=>{if(l)__ft.push(now-l);l=now;if(INTRO.on)requestAnimationFrame(f);};requestAnimationFrame(f);});
  for(let k=0;k<160;k++){const s=await p.evaluate(()=>({on:INTRO.on,t:INTRO.t,cap:$('introCap').classList.contains('on')?$('introCap').textContent:'',rad:$('introRadio').classList.contains('on')?$('introRadio').textContent:'',tit:$('introTitle').classList.contains('on')?$('introTitle').textContent:''}));
    for(const x of [s.cap,s.rad,s.tit])if(x&&!seen.includes(x))seen.push(x);if(!s.on)break;await p.waitForTimeout(500);}
  fr=await p.evaluate(()=>{const a=__ft.slice().sort((x,y)=>x-y);return {n:a.length,median:+a[a.length>>1].toFixed(1),p95:+a[Math.floor(a.length*.95)].toFixed(1)};});
  r=await state(p);
  ok(!r.on&&r.dlg&&/ROOT-LINK/.test(r.chan)&&r.plays.join()==='l_intro'&&r.begins===1,'at the end the Root-Link opening starts once, as on a normal launch',r);
  ok(r.time<.05&&r.cd===150,'the mission did not run during the intro (game time 0, the first wave timer untouched)',{time:r.time,cd:r.cd});
  ok(JSON.stringify(r.cam)===JSON.stringify(r.want),'the camera ends exactly where a normal launch puts it',{cam:r.cam,want:r.want});
  ok(r.hud==='1'||+r.hud>.5||await p.evaluate(()=>!document.body.classList.contains('intro-on')),'the interface comes back',r.hud);
  ok(r.flags.intro===1&&r.flags.v48===1,'the campaign remembers the intro was seen (one flag)',r.flags);
  const want=['NERETHHuman Frontier Territory','Dark.','Still.','Pressure.','Movement.','Reach.','Hunger.','MISSION 1LANDFALL'];
  ok(want.every(w=>seen.includes(w))&&seen.filter(x=>/RADIO/.test(x)).length===4,'every title, radio line and instinct caption was shown, in order',seen);
  ok(seen.indexOf('Dark.')<seen.indexOf('Hunger.')&&seen.indexOf('NERETHHuman Frontier Territory')===0,'the order is as written',seen.slice(0,3));
  ok(fr.median<=34,'it plays smoothly in real time (median frame '+fr.median+' ms)',fr);
  // the rest of Landfall is unchanged: the dialogue leads into the tutorial's Step 1
  await p.evaluate(()=>{while(DLG.open)skipDlg();});r=await state(p);
  ok(r.s==='tut'&&/Look around/.test(r.tut)&&await p.evaluate(()=>TUT.length)===10,'after the Root-Link opening the tutorial starts on Step 1 with its ten steps',r.tut);
  // a second launch of Landfall in the same campaign does not play it again
  await p.evaluate(()=>{G=null;openPlanet();});await p.waitForTimeout(500);await p.click('#launch');await p.waitForTimeout(400);r=await state(p);
  ok(!r.on&&r.dlg&&r.plays.slice(-1)[0]==='l_intro','launching Landfall again goes straight to the mission',r);
  await ctx.close();}

 // ---- 2: Skip from every scene, by key, by button and twice in a row
 for(const [t,how] of [[2,'Escape'],[12,'button'],[25,'Enter'],[40,'Escape'],[50,'button'],[55,'Escape'],[59.5,'Escape'],[60.8,'double'],[31,'Tab+Space']]){
  const {p,ctx}=await fresh();await launch(p);await p.evaluate(t=>{introSeek(t);INTRO.hold=false;},t);await p.waitForTimeout(150);
  if(how==='button')await p.click('#introSkip');else if(how==='Tab+Space'){await p.focus('#introSkip');await p.keyboard.press(' ');}else if(how==='double'){await p.keyboard.press('Escape');await p.keyboard.press('Escape');await p.click('#introSkip').catch(()=>{});}else await p.keyboard.press(how);
  await p.waitForTimeout(900);const r=await state(p);
  ok(!r.on&&r.begins===1&&r.plays.join()==='l_intro'&&r.dlg&&r.time<.05&&r.cd===150&&JSON.stringify(r.cam)===JSON.stringify(r.want)&&r.flags.intro===1,`Skip at ${t} s (${how}) starts Landfall once, at the start, with the normal camera`,{plays:r.plays,begins:r.begins,time:r.time,cam:r.cam,want:r.want});
  const beds=await p.evaluate(()=>Object.keys(INTRO.beds).length);ok(beds===0,`no intro sound is left playing after a skip at ${t} s`,beds);
  await ctx.close();}

 // ---- 3: older campaigns and saves never have it forced on them
 {const old=JSON.stringify({v:1,flags:{},researched:[],captured:{},global:[0,0,0,0,0,0,0],last:Date.now()});
  const {p,ctx}=await fresh({camp:old});await launch(p);const r=await state(p);
  ok(!r.on&&r.dlg&&r.plays.join()==='l_intro','a campaign started before v48 launches Landfall straight into the mission, as before',r);
  // a save from the middle of Landfall loads without the intro
  const S=await p.evaluate(async()=>{while(DLG.open)skipDlg();enterTut(4);return await encodeSave();});
  await p.evaluate(async S=>{G=null;const D=await decodeSave(S);applySave(D);},S);await p.waitForTimeout(300);
  const r2=await p.evaluate(()=>({on:INTRO.on,s:G.story.s,k:G.story.k}));ok(!r2.on&&r2.s==='tut'&&r2.k===4,'loading a save does not play the intro and keeps its tutorial step',r2);
  await ctx.close();}

 // ---- 4: Replay intro from the planet screen keeps the campaign as it was
 {const {p,ctx}=await fresh();await launch(p);await p.keyboard.press('Escape');await p.waitForTimeout(800);
  await p.evaluate(()=>{while(DLG.open)skipDlg();CAMP.captured.landfall={rates:[5,0,0,0,0,0,0],time:600,when:Date.now()};CAMP.global[0]=777;CAMP.captured.landfall.rates=[0,0,0,0,0,0,0];saveCamp();G=null;openPlanet();});await p.waitForTimeout(600);
  const before=await p.evaluate(()=>(j=>{j=JSON.parse(j);delete j.last;j.global=j.global.map(Math.floor);return JSON.stringify(j);})(campToJSON(CAMP)));
  await p.click('#pIntro');await p.waitForTimeout(400);let r=await state(p);
  ok(r.on&&r.mode==='replay'&&!r.dlg&&r.begins===1&&r.plays.length===1,'Replay intro plays it again from the planet screen',r);
  await p.evaluate(()=>{introSeek(56);INTRO.hold=false;});await p.waitForTimeout(6500);
  r=await p.evaluate(()=>({on:INTRO.on,G:!!G,planet:!$('planet').hidden,dlg:DLG.open,after:(j=>{j=JSON.parse(j);delete j.last;j.global=j.global.map(Math.floor);return JSON.stringify(j);})(campToJSON(CAMP))}));
  ok(!r.on&&!r.G&&r.planet&&!r.dlg&&r.after===before,'when it ends it returns to the planet with the campaign exactly as it was (captures, research, stock, flags)',{planet:r.planet,same:r.after===before});
  await p.click('#pIntro');await p.waitForTimeout(300);await p.keyboard.press('Escape');await p.waitForTimeout(800);
  r=await p.evaluate(()=>({on:INTRO.on,G:!!G,planet:!$('planet').hidden,plays:__plays.length}));ok(!r.on&&!r.G&&r.planet,'skipping a replay also returns to the planet, with nothing started',r);
  r=await p.evaluate(()=>{startMission('ember');const live=!!G;introStart('replay');return {live,on:INTRO.on,m:G&&G.mission};});
  ok(r.live&&!r.on&&r.m==='ember','the intro never replays over a mission in progress',r);
  await ctx.close();}

 // ---- 5: sound goes through the game's mixer: Mute silences it, the intro's beds stop at the end
 {const {p,ctx}=await fresh();for(let i=0;i<60;i++){if(await p.evaluate(()=>!!(window.__snd&&__snd.ctx)))break;await p.waitForTimeout(100);}
  await launch(p);await p.waitForTimeout(3500);
  const meter=()=>p.evaluate(()=>new Promise(res=>{const a=__snd.bus.meter,buf=new Float32Array(a.fftSize);let mx=0,s=0,n=0;const t0=performance.now();const f=()=>{a.getFloatTimeDomainData(buf);for(const v of buf){mx=Math.max(mx,Math.abs(v));s+=v*v;n++;}if(performance.now()-t0<900)setTimeout(f,40);else res({peak:+mx.toFixed(4),rms:+Math.sqrt(s/n).toFixed(4)});};f();}));
  const on=await meter();await p.evaluate(()=>{SND.vol.mute=true;sndApply(true);});await p.waitForTimeout(300);const off=await meter();
  const routes=await p.evaluate(()=>({beds:Object.keys(INTRO.beds),amb:Object.keys(SND.amb).length}));
  ok(on.rms>.002&&off.peak===0,'the orbit hum and static are heard, and Mute silences the intro completely',{on,off});
  ok(routes.beds.includes('intro_orbit')&&routes.amb===0,'the intro plays its own bed and the game\'s ambience waits',routes);
  await p.evaluate(()=>{SND.vol.mute=false;sndApply(true);});await p.keyboard.press('Escape');await p.waitForTimeout(1500);
  const after=await p.evaluate(()=>({beds:Object.keys(INTRO.beds).length}));ok(after.beds===0,'nothing of the intro keeps playing after the hand-off',after);
  await ctx.close();}

 // ---- 6: layout at several screen sizes, the same picture each time, and the cost of a frame
 for(const vp of [{width:1920,height:1080},{width:1280,height:720},{width:390,height:844},{width:844,height:390}]){
  const {p,ctx}=await fresh({vp});await launch(p);
  const r=await p.evaluate(()=>{const out=[];for(const t of [5,15,30,53,59.5]){introSeek(t);for(const id of ['introTitle','introRadio','introCap','introSkip']){const el=$(id);const cs=getComputedStyle(el);if(id!=='introSkip'&&!el.classList.contains('on'))continue;
      const b=el.getBoundingClientRect();out.push({t,id,ok:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,w:Math.round(b.width)});}}
    const sk=$('introSkip').getBoundingClientRect(),rd=(introSeek(15),$('introRadio').getBoundingClientRect());
    return {bad:out.filter(o=>!o.ok),n:out.length,overlap:!(sk.right<rd.left||sk.left>rd.right||sk.bottom<rd.top||sk.top>rd.bottom),scroll:document.documentElement.scrollWidth>innerWidth};});
  ok(r.bad.length===0&&!r.scroll&&!r.overlap,`${vp.width}×${vp.height}: titles, radio, captions and Skip stay on screen, and Skip never covers the radio`,r);
  await ctx.close();}
 {const {p,ctx}=await fresh();await launch(p);
  const r=await p.evaluate(()=>{const cv=$('introCv'),g=cv.getContext('2d');const h=()=>{const d=g.getImageData(0,0,cv.width,cv.height).data;let s=0;for(let i=0;i<d.length;i+=97)s=(s*31+d[i])>>>0;return s;};
    const o={};for(const t of [4,14,27,44]){introSeek(t);const a=h();introSeek(t+3);introSeek(t);o[t]=a===h();}
    const cost=(q)=>{INTRO.low=q;INTRO.soil=null;introPrep();const R={};for(const [n,a,b2] of [['orbit',1,8],['meadow',11,18],['under',23,31],['waking',40,47],['surface',52,57]]){let tt=0,k=0;for(let t=a;t<b2;t+=.25){const t0=performance.now();introDraw(t);tt+=performance.now()-t0;k++;}R[n]=+(tt/k).toFixed(2);}return R;};
    return {same:o,high:cost(false),low:cost(true)};});
  ok(Object.values(r.same).every(Boolean),'the same moment always draws the same picture',r.same);
  ok(Object.values(r.high).every(v=>v<16)&&Object.values(r.low).every(v=>v<10),'each scene draws in well under a frame (high and low quality, ms per frame)',{high:r.high,low:r.low});
  ok(Object.keys(r.low).every(k=>r.low[k]<=r.high[k]*1.15+.3),'low quality draws less',r);
  await ctx.close();}

 // ---- 7: the words: no species name, no "I", the hive speaks only in instincts
 {const {p,ctx}=await fresh();const r=await p.evaluate(()=>({all:INTRO_LINES.map(l=>l[3]+' '+l[4]).join(' | '),inst:INTRO_LINES.filter(l=>l[2]==='inst').map(l=>l[4])}));
  ok(!/Nymbri|Nymbris|alien|creature|organism|hive/i.test(r.all)&&!/\bI\b|\bme\b|\bmy\b/.test(r.inst.join(' '))&&r.inst.every(w=>/^[A-Z][a-z]+\.$/.test(w)),'no species name or threat in the radio; the instincts are single words with no "I"',r);
  await ctx.close();}

 ok(errs.length===0,'no page errors',errs.slice(0,5));
 console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(fail?1:0);})();
