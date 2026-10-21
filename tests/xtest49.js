// v49 tests: the intro cinematic, second pass (timeline, organism states, captions). Built on the v48 tests. First play of a new campaign (in real time, start to finish), the hand-off into Landfall's Root-Link
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
  ok(want.every(w=>seen.includes(w))&&seen.filter(x=>/RADIO/.test(x)).length===3,'every title, radio line and instinct caption was shown, in order',seen);
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
 for(const [t,how] of [[1,'Escape'],[12,'button'],[25,'Enter'],[31,'Tab+Space'],[35,'Escape'],[45,'button'],[50.8,'Escape'],[55,'Escape'],[59,'Escape'],[60.2,'double']]){
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
  const r=await p.evaluate(()=>{const out=[];for(const t of [5,11,15,24,32,45,52,57]){introSeek(t);for(const id of ['introTitle','introRadio','introCap','introSkip']){const el=$(id);const cs=getComputedStyle(el);if(id!=='introSkip'&&!el.classList.contains('on'))continue;
      const b=el.getBoundingClientRect();out.push({t,id,ok:b.left>=0&&b.right<=innerWidth&&b.top>=0&&b.bottom<=innerHeight,w:Math.round(b.width)});}}
    const sk=$('introSkip').getBoundingClientRect(),rd=(introSeek(15),$('introRadio').getBoundingClientRect());
    return {bad:out.filter(o=>!o.ok),n:out.length,overlap:!(sk.right<rd.left||sk.left>rd.right||sk.bottom<rd.top||sk.top>rd.bottom),scroll:document.documentElement.scrollWidth>innerWidth};});
  ok(r.bad.length===0&&!r.scroll&&!r.overlap,`${vp.width}×${vp.height}: titles, radio, captions and Skip stay on screen, and Skip never covers the radio`,r);
  await ctx.close();}
 {const {p,ctx}=await fresh();await launch(p);
  const r=await p.evaluate(()=>{const cv=$('introCv'),g=cv.getContext('2d');const h=()=>{const d=g.getImageData(0,0,cv.width,cv.height).data;let s=0;for(let i=0;i<d.length;i+=97)s=(s*31+d[i])>>>0;return s;};
    const o={};for(const t of [4,14,27,44]){introSeek(t);const a=h();introSeek(t+3);introSeek(t);o[t]=a===h();}
    const cost=(q)=>{INTRO.low=q;INTRO.soil=null;introPrep();const R={};for(const [n,a,b2] of [['orbit',1,7],['meadow',10,17],['under',22,30],['waking',40,48],['surface',52,57]]){let tt=0,k=0;for(let t=a;t<b2;t+=.25){const t0=performance.now();introDraw(t);tt+=performance.now()-t0;k++;}R[n]=+(tt/k).toFixed(2);}return R;};
    return {same:o,high:cost(false),low:cost(true)};});
  ok(Object.values(r.same).every(Boolean),'the same moment always draws the same picture',r.same);
  ok(Object.values(r.high).every(v=>v<16)&&Object.values(r.low).every(v=>v<10),'each scene draws in well under a frame (high and low quality, ms per frame)',{high:r.high,low:r.low});
  ok(Object.keys(r.low).every(k=>r.low[k]<=r.high[k]*1.15+.3),'low quality draws less',r);
  await ctx.close();}

 // ---- 7: the words: no species name, no "I", the hive speaks only in instincts
 {const {p,ctx}=await fresh();const r=await p.evaluate(()=>({all:INTRO_LINES.map(l=>l[3]+' '+l[4]).join(' | '),inst:INTRO_LINES.filter(l=>l[2]==='inst').map(l=>l[4])}));
  ok(!/Nymbri|Nymbris|alien|creature|organism|hive/i.test(r.all)&&!/\bI\b|\bme\b|\bmy\b/.test(r.inst.join(' '))&&r.inst.every(w=>/^[A-Z][a-z]+\.$/.test(w)),'no species name or threat in the radio; the instincts are single words with no "I"',r);
  await ctx.close();}

 // ---- 8: one continuous awakening: scene order, no going back, the organism's states, the first pulse heard, the same Bloom
 {const {p,ctx}=await fresh();await launch(p);
  const r=await p.evaluate(()=>{const seq=[];const names=['introOrbit','introMeadow','introUnder','introSurface'],orig={};
    for(const n of names){orig[n]=window[n];window[n]=function(){seq[seq.length-1].add(n);return orig[n].apply(this,arguments);};}
    const per=[];for(let t=0;t<=INTRO_END;t+=.1){seq.push(new Set());introSeek(t);per.push([+t.toFixed(1),[...seq[seq.length-1]]]);}
    for(const n of names)window[n]=orig[n];
    // the scene that owns each moment is the last one drawn (it is on top); count how often that changes back to an earlier one
    const order=names.map(n=>n),top=per.map(([t,s])=>[t,s.length?s.reduce((a,b)=>order.indexOf(b)>order.indexOf(a)?b:a):'']);
    let back=0,changes=[];for(let i=1;i<top.length;i++)if(top[i][1]!==top[i-1][1]){changes.push([top[i][0],top[i][1]]);if(order.indexOf(top[i][1])<order.indexOf(top[i-1][1]))back++;}
    const under=per.filter(([t])=>t>=20&&t<=50).every(([t,s])=>s.length===1&&s[0]==='introUnder');
    const aw=[];for(let t=18;t<=52;t+=.5)aw.push(introAwake(t));let mono=true;for(let i=1;i<aw.length;i++)if(aw[i]<aw[i-1]-1e-9)mono=false;
    const pk=(a,b)=>{let m=0;for(let t=a;t<=b;t+=.05)m=Math.max(m,introPulse(t));return +m.toFixed(2);};
    const wake=INTRO_CUES.find(c=>c[2]==='intro_wake'),first=INTRO_PULSES.find(p=>p[1]>=.9);
    return {changes,back,under,mono,states:{dormant:+introAwake(28).toFixed(2),disturbed:+introAwake(36).toFixed(2),stirring:+introAwake(43).toFixed(2),awakening:+introAwake(47).toFixed(2),emergence:+introAwake(51).toFixed(2)},
      calm:pk(18,32.3),firstPulse:pk(32.4,33.4),wake:wake&&wake[0],first:first&&first[0],reveal:INTRO_REVEAL.every(t=>INTRO_PULSES.some(p=>Math.abs(p[0]-t)<.01))};});
  ok(r.back===0&&r.changes.map(c=>c[1]).join()==='introMeadow,introUnder,introSurface','the scenes run once each, in order (orbit, meadow, underground, surface), and never cut back',r.changes);
  ok(r.under,'from 20 s to 50 s the camera stays underground with the organism',r.under);
  const S=r.states;ok(r.mono&&S.dormant<.02&&S.disturbed>.08&&S.disturbed<.2&&S.stirring>S.disturbed+.1&&S.awakening>S.stirring+.15&&S.emergence>.99,'it wakes in distinct, increasing states: dormant, disturbed, stirring, awakening, emergence',S);
  ok(r.calm<=.15&&r.firstPulse>=.9,'nothing more than a faint flicker before the disturbance; then one strong first pulse',{calm:r.calm,first:r.firstPulse});
  ok(Math.abs(r.wake-r.first)<=.2,'the first strong pulse has its own low organic sound, in sync',{sound:r.wake,pulse:r.first});
  ok(r.reveal,'each step of the Rootweb opening at the surface is driven by a pulse from below',r.reveal);
  // after the hand-off the world is exactly what a normal launch makes: one Bloom, the same Rootweb and ants
  await p.keyboard.press('Escape');await p.waitForTimeout(800);
  const a=await p.evaluate(()=>({ids:G.nextId,web:G.webCount,units:G.units.length,cores:(()=>{let n=0;for(const b of (G.blocks||[]))if(b.t==='core')n++;return n;})()}));
  await ctx.close();
  const old=JSON.stringify({v:1,flags:{},researched:[],captured:{},global:[0,0,0,0,0,0,0],last:Date.now()});const q=await fresh({camp:old});await launch(q.p);
  const b2=await q.p.evaluate(()=>({ids:G.nextId,web:G.webCount,units:G.units.length}));await q.ctx.close();
  ok(a.ids===b2.ids&&a.web===b2.web&&a.units===b2.units,'after the intro Landfall has the same Bloom, Rootweb and ants as a launch without it (nothing made twice)',{intro:a,normal:b2});}

 // ---- 9: every caption reads clearly: big enough, on screen, and with enough contrast against what is behind it
 for(const vp of [{width:1920,height:1080},{width:1280,height:720},{width:390,height:844}]){
  const {p,ctx}=await fresh({vp});await launch(p);
  const r=await p.evaluate(()=>{const cv=$('introCv'),g=cv.getContext('2d'),k=cv.width/cv.clientWidth,out=[];
    const lum=(r,g,b)=>{const f=c=>{c/=255;return c<=.03928?c/12.92:((c+.055)/1.055)**2.4;};return .2126*f(r)+.7152*f(g)+.0722*f(b);};
    const parse=c=>c.match(/[\d.]+/g).map(Number);
    for(const L of INTRO_LINES){const t=(L[0]+L[1])/2;introSeek(t);const id=L[2]==='inst'?'introCap':L[2]==='radio'?'introRadio':'introTitle';const el=$(id);
      const tx=id==='introTitle'?el.querySelector('b'):id==='introRadio'?el.querySelector('.txt'):el;const b=tx.getBoundingClientRect();
      const d=g.getImageData(Math.max(0,b.left*k)|0,Math.max(0,b.top*k)|0,Math.max(1,b.width*k)|0,Math.max(1,b.height*k)|0).data;const Ls=[];for(let i=0;i<d.length;i+=16)Ls.push(lum(d[i],d[i+1],d[i+2]));Ls.sort((a,b)=>a-b);
      const back=id==='introRadio'?.66:.45;   // the radio's backing is solid; the soft backings behind the title and instincts are counted at their value about two thirds of the way out, well below their centre
      const bg=Ls[Math.floor(Ls.length*.9)]*(1-back),fg=parse(getComputedStyle(tx).color),fl=lum(fg[0],fg[1],fg[2]);
      const ratio=(Math.max(fl,bg)+.05)/(Math.min(fl,bg)+.05),size=parseFloat(getComputedStyle(tx).fontSize),eb=el.getBoundingClientRect();
      out.push({t:+t.toFixed(1),text:L[4].slice(0,18),ratio:+ratio.toFixed(1),size,on:eb.left>=0&&eb.right<=innerWidth&&eb.top>=0&&eb.bottom<=innerHeight});}
    return out;});
  const min=vp.width>=1920?{radio:19,inst:34}:vp.width>=1280?{radio:15,inst:24}:{radio:15,inst:24};
  const bad=r.filter(o=>o.ratio<4.5||!o.on);const small=r.filter(o=>/[a-z]/.test(o.text)&&!/^[A-Z][a-z]+\.$/.test(o.text)&&o.size<min.radio||/^[A-Z][a-z]+\.$/.test(o.text)&&o.size<min.inst);
  ok(bad.length===0&&small.length===0,`${vp.width}×${vp.height}: every caption is at least 4.5:1 against the picture behind it, large enough and on screen`,{bad,small,sample:r.map(o=>o.text+' '+o.ratio+':1 '+o.size+'px')});
  await ctx.close();}

 ok(errs.length===0,'no page errors',errs.slice(0,5));
 console.log(`\n${pass} passed, ${fail} failed`);await b.close();process.exit(fail?1:0);})();
