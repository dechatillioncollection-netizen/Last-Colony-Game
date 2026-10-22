// v58: the title screen beats like a heart; any key grows vines over it (with their sound) until nothing of it shows, and they part onto the
// main menu in under ten seconds; another key opens them at once and another goes straight to the menu; reduced motion fades as before.
// The menu clips have sound: each file has a 30-second sound track, the clip plays unmuted once a key has been pressed, follows the
// Ambience and Master volumes and Mute all sound, fades with the picture, and the menu's own ambience steps back while it is heard.
const {chromium}=require(process.env.PW||'playwright');const {execFileSync}=require('child_process'),path=require('path');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html';
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:{width:1600,height:900},reducedMotion:o.rm?'reduce':'no-preference'});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('lc_splash','1');localStorage.setItem('lc_quality','medium');localStorage.setItem('lc_menuScene','1');}catch(e){}});
  await p.goto(URL+NEW);await p.waitForFunction(()=>$('splash').classList.contains('ready'),null,{timeout:15000});return p;};
// how much of the vines' canvas is fully covered
const cover=p=>p.evaluate(()=>{const c=$('splashVn');if(!c)return -1;const d=c.getContext('2d').getImageData(0,0,c.width,c.height).data;let n=0,k=0;for(let i=3;i<d.length;i+=4*97){k++;if(d[i]>=240)n++;}return n/k;});
(async()=>{
 // ---- the clips' sound tracks
 for(const sc of ['factory','frontier','skirmish','human'])for(const ext of ['webm','mp4']){let a='';try{a=execFileSync('ffprobe',['-v','error','-select_streams','a','-show_entries','stream=codec_name,duration:format=duration','-of','csv=p=0',path.join(__dirname,'../art/menu',sc+'.'+ext)]).toString().trim().replace(/\n/g,' ');}catch(e){}
   ok(`${sc}.${ext} has a sound track`,/^(opus|aac)/.test(a),a);}
 const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 // ---- 1. the heartbeat
 {const p=await open(br);await p.waitForTimeout(800);
  const h=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),hb=()=>+getComputedStyle($('splash')).getPropertyValue('--hb')||0;SPL.nextPulse=0;let max=0;
    for(let i=0;i<30;i++){await w(20);max=Math.max(max,hb());}await w(1500);return {max,after:hb(),next:+SPL.nextPulse.toFixed(1),lub:+splashBeat(.07).toFixed(2),between:+splashBeat(.22).toFixed(2),dub:+splashBeat(.37).toFixed(2)};});
  ok('a heartbeat swells the title screen, beats twice and settles',h.max>.8&&h.after<.05&&h.next>=1.5&&h.lub>.95&&h.dub>h.between,JSON.stringify(h));
  // ---- 2. the vines
  await p.keyboard.press('Enter');const t0=Date.now();await p.waitForTimeout(400);
  let s=await p.evaluate(()=>({vines:$('splash').classList.contains('vines'),cv:!!$('splashVn'),prompt:getComputedStyle(document.querySelector('#splash .sp')).opacity,mm:mmState(),snd:!!(SPL.vine&&SPL.vine.snd)}));
  ok('a key starts the vines, hides the prompt and holds the menu under them',s.vines&&s.cv&&s.mm==='hold',JSON.stringify(s));
  await p.waitForFunction(()=>SPL.vine&&SPL.vine.snd,null,{timeout:2000}).catch(()=>{});s=await p.evaluate(()=>!!(SPL.vine&&SPL.vine.snd&&SND.buf.title_vines));
  ok('the vines are heard',s);
  await p.waitForFunction(()=>SPL.vine&&SPL.vine.t>=5.25,null,{timeout:9000});const cv=await cover(p);
  ok('by the time they part the vines cover the whole screen',cv>=.995,cv.toFixed(4));
  await p.screenshot({path:process.env.SHOT||'vines58.png'});
  await p.waitForFunction(()=>!SPL.on,null,{timeout:9000});const dt=(Date.now()-t0)/1000;
  ok('they part onto the menu in under ten seconds',dt<10,dt.toFixed(1)+' s');
  await p.waitForTimeout(1500);
  s=await p.evaluate(()=>({hidden:$('splash').hidden,cv:!!$('splashVn'),focus:document.activeElement&&document.activeElement.id,vid:MMB.el&&MMB.el.tagName,muted:MMB.el&&MMB.el.muted,paused:MMB.el&&MMB.el.paused,vol:MMB.el&&+MMB.el.volume.toFixed(2),heard:mmHeard(),audioBytes:MMB.el&&MMB.el.webkitAudioDecodedByteCount}));
  ok('then the menu: the title gone, the keyboard on Campaign',s.hidden&&!s.cv&&s.focus==='m-campaign',JSON.stringify(s));
  ok('the clip plays with its sound at the default volume',s.vid==='VIDEO'&&!s.muted&&!s.paused&&Math.abs(s.vol-.8)<.05&&s.heard&&s.audioBytes>0,JSON.stringify(s));
  // ---- 3. the clip's sound follows the sliders
  const v=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms)),o={};SND.vol.a=.3;await w(1500);o.amb30=+MMB.el.volume.toFixed(2);SND.vol.a=.6;SND.vol.mute=true;await w(1500);o.mute=+MMB.el.volume.toFixed(3);
    SND.vol.mute=false;await w(1500);o.back=+MMB.el.volume.toFixed(2);return o;});
  ok('it follows the Ambience volume and Mute all sound',Math.abs(v.amb30-.4)<.05&&v.mute===0&&Math.abs(v.back-.8)<.05,JSON.stringify(v));
  const x=await p.evaluate(async()=>{const old=MMB.el;$('mmNext').click();await new Promise(r=>setTimeout(r,300));const a={old:+old.volume.toFixed(2),cur:MMB.el!==old};await new Promise(r=>setTimeout(r,2500));a.now=+MMB.el.volume.toFixed(2);a.oldGone=!document.contains(old);return a;});
  ok('at a scene change the old clip\'s sound fades out and the new one\'s in',x.cur&&x.old<.8&&x.now>.7&&x.oldGone,JSON.stringify(x));
  await p.evaluate(()=>mmSetMoving(false));await p.waitForTimeout(2200);s=await p.evaluate(()=>({vids:document.querySelectorAll('#mmBg video').length,heard:mmHeard()}));
  ok('still pictures are silent',s.vids===0&&!s.heard,JSON.stringify(s));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 4. skipping
 {const p=await open(br);await p.keyboard.press('Enter');await p.waitForTimeout(1000);await p.keyboard.press('Enter');await p.waitForTimeout(150);
  let s=await p.evaluate(()=>({t:SPL.vine&&SPL.vine.t,ending:SPL.ending,open:$('splash').classList.contains('vopen')}));
  ok('a second key opens the vines at once',s.t>=5.6&&s.ending&&s.open,JSON.stringify(s));
  await p.keyboard.press('Enter');await p.waitForTimeout(150);s=await p.evaluate(()=>({on:SPL.on,hidden:$('splash').hidden,game:!!window.__game()}));
  ok('a third goes straight to the menu, and starts nothing',!s.on&&s.hidden&&!s.game,JSON.stringify(s));
  ok('no errors (skipping)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 5. reduced motion: no vines, the fade as before
 {const p=await open(br,{rm:true});await p.keyboard.press('Enter');await p.waitForTimeout(200);let s=await p.evaluate(()=>({cv:!!$('splashVn'),out:$('splash').classList.contains('out')}));
  await p.waitForTimeout(1200);const h=await p.evaluate(()=>$('splash').hidden);
  ok('reduced motion: no vines, a fade to the menu',!s.cv&&s.out&&h,JSON.stringify(s));await p.context().close();}
 await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
