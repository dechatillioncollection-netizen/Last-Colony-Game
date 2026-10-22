// v55: the title splash screen. It shows on launch over the main menu; any key, mouse button or new controller button fades it into the menu
// without that input reaching the game or the menu; modifier keys and a controller button already held at launch do not count; it shows
// once per launch; starting a game another way (a loaded save, a test) removes it at once; the menu, campaign map, load and settings work
// afterwards; it fits 1920×1080 down to a phone; missing art still gives a working title; the title's sound bed runs through the ambience
// volume and fades on continue; Low quality and reduced motion work. Automated browsers skip it unless lc_splash=1 (set here).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',SHOTS=process.env.SHOTS||'shots55';
fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:o.vp||{width:1920,height:1080},reducedMotion:o.rm?'reduce':'no-preference'});const p=await ctx.newPage();p.errs=[];p.warns=[];
  p.on('pageerror',e=>p.errs.push(String(e)));p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
  if(o.block)await p.route('**/'+o.block,r=>r.abort());
  await p.addInitScript(([q,sp,pad])=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);if(sp)localStorage.setItem('lc_splash','1');}catch(e){}
    if(pad){// a pretend controller: button 0 held from the start, button 1 pressed when the test says so
      const P={id:'test pad',index:0,connected:true,buttons:Array.from({length:4},(_,i)=>({pressed:i===0,value:i===0?1:0})),axes:[0,0,0,0]};window.__pad=P;navigator.getGamepads=()=>[P,null,null,null];}},[o.q||'high',o.splash!==false,!!o.pad]);
  await p.goto(URL+NEW);await p.waitForTimeout(o.wait||1500);return p;};
const st=p=>p.evaluate(()=>({shown:!$('splash').hidden,on:SPL.on,out:$('splash').classList.contains('out'),menu:!$('overlay').hidden,planet:!!$('planet')&&!$('planet').hidden,fps:!$('fpsBox').hidden,set:!$('settings').hidden}));
(async()=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 // ---- 1. launch, then a key
 {const p=await open(br);let s=await st(p);
  const cover=await p.evaluate(()=>{const r=$('splash').getBoundingClientRect();const e=document.elementFromPoint(innerWidth/2,innerHeight/2);return {full:r.width===innerWidth&&r.height===innerHeight,top:$('splash').contains(e),bg:SPL.bg&&SPL.bg.complete,glow:!!SPL.glow};});
  ok('the title screen is up on launch, over the main menu, with its art loaded',s.shown&&s.on&&s.menu&&cover.full&&cover.top&&cover.bg&&cover.glow,JSON.stringify([s,cover]));
  await p.screenshot({path:`${SHOTS}/title_1920x1080.png`});
  await p.keyboard.press('Shift');await p.waitForTimeout(200);s=await st(p);ok('a modifier key alone does not continue',s.on&&!s.out);
  await p.keyboard.press('F3');await p.waitForTimeout(250);s=await st(p);ok('any key starts the fade, and the key does not reach the game (F3 does not open the frame counter)',s.out&&!s.fps,JSON.stringify(s));
  await p.screenshot({path:`${SHOTS}/title_fading.png`});
  await p.waitForTimeout(900);s=await st(p);const foc=await p.evaluate(()=>document.activeElement&&document.activeElement.id);
  ok('after the fade the main menu is there, focused on its first button',!s.shown&&!s.on&&s.menu&&foc==='m-campaign',foc);
  await p.screenshot({path:`${SHOTS}/menu_after.png`});
  await p.click('#m-settings');await p.waitForTimeout(200);s=await st(p);ok('the menu works afterwards: Settings opens',s.set);
  await p.click('#setClose');await p.click('#m-campaign');await p.waitForTimeout(400);s=await st(p);ok('the menu works afterwards: the campaign map opens',s.planet);
  await p.evaluate(()=>{closePlanet();showMenu();});await p.waitForTimeout(100);s=await st(p);ok('backing out to the main menu does not bring the title back',!s.shown&&s.menu);
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 2. a mouse click, on the spot where a menu button sits underneath
 {const p=await open(br);const r=await p.evaluate(()=>{const b=$('m-siege').getBoundingClientRect();return [b.x+b.width/2,b.y+b.height/2];});
  await p.mouse.click(r[0],r[1]);await p.waitForTimeout(1300);const s=await st(p);const g=await p.evaluate(()=>!!window.__game());
  ok('a mouse click continues to the menu, and does not press the menu button under it',!s.shown&&s.menu&&!g,JSON.stringify(s));
  ok('no errors (mouse)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 3. a controller
 {const p=await open(br,{pad:true});let s=await st(p);ok('a controller button already held at launch does not continue',s.on&&!s.out);
  await p.evaluate(()=>{__pad.buttons[1].pressed=true;__pad.buttons[1].value=1;});await p.waitForTimeout(300);s=await st(p);ok('a new controller button press continues',s.out);
  await p.waitForTimeout(1000);s=await st(p);ok('and the menu is shown',!s.shown&&s.menu);await p.context().close();}
 // ---- 4. a game started another way (a test, a loaded save) removes it at once; and without lc_splash an automated browser never sees it
 {const p=await open(br);await p.evaluate(()=>{startGame('survival');});const s=await st(p);ok('starting a game another way removes the title at once',!s.shown&&!s.on);
  ok('no errors (start)',!p.errs.length,p.errs[0]);await p.context().close();
  const q=await open(br,{splash:false});const s2=await st(q);ok('automated browsers go straight to the menu unless they ask for the title',!s2.shown&&s2.menu);await q.context().close();}
 // ---- 5. sizes
 for(const [w,h] of [[1920,1080],[2560,1440],[1280,720],[1024,768],[800,600],[390,844]]){const p=await open(br,{vp:{width:w,height:h},wait:3200});
  const r=await p.evaluate(()=>{const rg=n=>{const r=document.createRange();r.selectNodeContents(document.querySelector(n));return r.getBoundingClientRect();},t=rg('#splash h1'),pr=rg('#splash .sp'),cv=$('splashCv');
    return {tl:t.left,tr:t.right,pl:pr.left,pr:pr.right,tt:t.top,tb:t.bottom,pt:pr.top,pb:pr.bottom,pw:pr.width,cw:cv.width,ch:cv.height,W:innerWidth,H:innerHeight,sx:document.documentElement.scrollWidth};});
  const fits=r.tl>=0&&r.tr<=r.W&&r.pl>=0&&r.pr<=r.W&&r.tt>=0&&r.tb<r.pt&&r.pb<=r.H&&r.sx<=r.W&&r.cw>=r.W&&r.ch>=r.H;
  await p.screenshot({path:`${SHOTS}/title_${w}x${h}.png`});ok(`${w}×${h}: the title and prompt fit, the picture fills the screen`,fits&&!p.errs.length,JSON.stringify(r));await p.context().close();}
 // ---- 6. missing art
 {const p=await open(br,{block:'art/title/bg.jpg'});const s=await st(p);await p.screenshot({path:`${SHOTS}/title_no_art.png`});
  ok('without the picture the title screen still shows and the console names the file',s.on&&p.warns.some(w=>w.includes('Title art missing: bg.jpg')));
  await p.keyboard.press('Enter');await p.waitForTimeout(1200);const s2=await st(p);ok('and it continues to the menu',!s2.shown&&s2.menu&&!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 7. sound: with sound allowed at launch (as in the desktop app) the title's bed plays through the ambience bus and fades out on continue
 {const p=await open(br,{wait:600});const r=await p.evaluate(async()=>{sndUnlock();for(let i=0;i<60&&!(SND.ready&&SPL.amb);i++)await new Promise(r=>setTimeout(r,100));
    const a=SPL.amb;return {ready:SND.ready,run:SND.ctx&&SND.ctx.state,amb:!!a,menuAmb:Object.keys(SND.amb).length};});
  ok('the title plays its ambience (the menu wind and deep air, plus the bed under the ground)',r.amb&&r.menuAmb>0,JSON.stringify(r));
  const v=await p.evaluate(()=>{const a=SPL.amb;let toA=false;try{SPL.amb.g.disconnect(SND.bus.a);toA=true;SPL.amb.g.connect(SND.bus.a);}catch(e){}return toA;});
  ok('the bed goes through the ambience volume',v);
  await p.keyboard.press('a');await p.waitForTimeout(100);const r2=await p.evaluate(()=>({amb:!!SPL.amb}));ok('continuing fades the bed out',!r2.amb);
  ok('no errors (sound)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 8. Low quality and reduced motion
 for(const o of [{q:'low'},{rm:true}]){const p=await open(br,{...o,wait:4000});const s=await st(p);await p.screenshot({path:`${SHOTS}/title_${o.q||'reduced_motion'}.png`});
  await p.keyboard.press('Space');await p.waitForTimeout(1200);const s2=await st(p);ok(`${o.q?'Low quality':'reduced motion'}: shows and continues`,s.on&&!s2.shown&&s2.menu&&!p.errs.length,p.errs[0]);await p.context().close();}
 console.log(fails?`FAIL (${fails})`:'ALL PASS');await br.close();process.exit(fails?1:0);})();
