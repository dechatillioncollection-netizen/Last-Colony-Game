// v56: the main menu as a left rail over background scenes from the game (recorded clips in v56 to v58, live scenes since v59, whose
// own behaviour is tested in xtest59). The title screen still comes first and its key opens
// the menu once without pressing anything; the clips wait under it and start as it fades. Every menu entry is there in its old order
// and works (Campaign, Survival, Base Siege, Load Game, Settings; Quit stays hidden on the web), Escape backs out of Settings, Saves and
// the campaign map with the keyboard back on the button that opened them; the intro replay works; quitting a game goes straight back to
// the menu, which moves on one scene. Scenes change with a crossfade in the order Living Factory, Quiet Frontier, Fortress Skirmish, Human
// Frontier: three calm to one battle, never two battles running, never more than two clips loaded. A game, a hidden tab or a closed
// menu stops the clips; missing clips fall back to stills and missing stills to a dark backdrop; reduced motion and the Settings switch
// show stills. The clips are muted and silent and the menu's sound is the ambience bed. The rail fits from a phone to an ultrawide.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',SHOTS=process.env.SHOTS||'shots56';
fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:o.vp||{width:1920,height:1080},reducedMotion:o.rm?'reduce':'no-preference'});const p=await ctx.newPage();p.errs=[];p.warns=[];
  p.on('pageerror',e=>p.errs.push(String(e)));p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
  for(const b of o.block||[])await p.route(b,r=>r.abort());
  if(o.slow)await p.route(o.slow,r=>setTimeout(()=>r.continue(),5000));
  await p.addInitScript(([sp,st,scene])=>{try{localStorage.clear();localStorage.setItem('lc_quality','medium');if(sp)localStorage.setItem('lc_splash','1');if(st)localStorage.setItem('lc_menubg','0');
    if(scene!==null)localStorage.setItem('lc_menuScene',String(scene));}catch(e){}},[!!o.splash,!!o.still,o.scene===undefined?null:o.scene]);
  await p.goto(URL+NEW,o.early?{waitUntil:'commit'}:{});await p.waitForTimeout(o.wait||2500);return p;};
// what the background shows: the layers in it, which is on top and visible, and whether a clip is playing
// (v59: a live scene counts as one layer, LIVE, playing while its world steps)
const bg=p=>p.evaluate(()=>{const L=[...document.querySelectorAll('#mmBg video,#mmBg img')];const top=MMB.el,lv=!!MD.G;
  return {n:L.length+(lv?1:0),videos:L.filter(e=>e.tagName==='VIDEO').length,top:lv?'LIVE':top&&top.tagName,id:lv?MMS[MD.i].id:top&&top.dataset.id,on:lv||!!top&&top.classList.contains('on'),
    playing:lv&&mmState()==='play',shown:MMB.shown.slice(),i:MMB.i,mm:$('overlay').classList.contains('mm'),menu:!$('overlay').hidden,label:$('mmScene').textContent};});
(async()=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 // ---- 1. launch with the title screen: clips wait under it, one key opens the menu, nothing gets pressed
 {const p=await open(br,{splash:true,wait:1500,scene:3});let b=await bg(p);
  ok('under the title screen the first scene is built but held, ready for the transition',b.mm&&b.menu&&b.top==='LIVE'&&!b.playing&&b.on&&b.id==='factory',JSON.stringify(b));
  ok('no errors (launch)',!p.errs.length,p.errs[0]);
  await p.keyboard.press('Enter');await p.waitForFunction(()=>$('splash').hidden,null,{timeout:10000}).catch(()=>{});await p.waitForTimeout(1000);b=await bg(p);
  const st=await p.evaluate(()=>({splash:!$('splash').hidden,game:!!window.__game(),planet:!$('planet').hidden,set:!$('settings').hidden,saves:!$('saves').hidden,focus:document.activeElement&&document.activeElement.id}));
  ok('one key: the title fades to the menu, nothing in the menu is pressed, the first button has the keyboard',!st.splash&&!st.game&&!st.planet&&!st.set&&!st.saves&&st.focus==='m-campaign',JSON.stringify(st));
  ok('the scene runs once the title has gone',b.playing&&b.id==='factory',JSON.stringify(b));
  await p.screenshot({path:`${SHOTS}/menu_1920x1080.png`});
  ok('no errors (launch)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 1b. the title prompt does not show while the title picture is still loading (here held back five seconds)
 {const p=await open(br,{splash:true,wait:200,early:true,slow:'**/art/title/bg.jpg'});await p.waitForFunction(()=>window.SPL&&SPL.on);await p.waitForTimeout(3000);
  const a=await p.evaluate(()=>({ready:$('splash').classList.contains('ready'),op:getComputedStyle(document.querySelector('#splash .sp')).opacity,t:performance.now()}));
  await p.waitForTimeout(3500);const b=await p.evaluate(()=>({ready:$('splash').classList.contains('ready'),bg:!!SPL.bg}));
  ok('the title prompt stays hidden while the title picture loads, and shows once it has',!a.ready&&a.op==='0'&&b.ready&&b.bg,JSON.stringify([a,b]));await p.context().close();}
 // ---- 2. every entry, in order, working; Escape and focus; the intro replay; quitting a game
 {const p=await open(br,{scene:0});
  const ent=await p.evaluate(()=>[...document.querySelectorAll('#ovcard .mode')].map(b=>[b.id,b.hidden,b.querySelector('b').textContent]));
  ok('the menu entries are the same, in the same order, Quit hidden on the web',JSON.stringify(ent)===JSON.stringify([['m-campaign',false,'CAMPAIGN'],['m-survival',false,'SURVIVAL'],['m-siege',false,'BASE SIEGE'],['m-load',false,'LOAD GAME'],['m-settings',false,'SETTINGS'],['m-quit',true,'QUIT']]),JSON.stringify(ent));
  const how=await p.evaluate(()=>{const d=document.querySelector('#ovcard details.mmhow');return d&&d.querySelectorAll('li').length===3&&/Left-click/.test(d.textContent)&&/Nymbri Hive/.test(d.textContent);});
  ok('the play tips and controls are all still there, under How to play',how);
  await p.focus('#m-campaign');await p.keyboard.press('ArrowDown');await p.keyboard.press('ArrowDown');let f=await p.evaluate(()=>document.activeElement.id);
  await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');await p.keyboard.press('ArrowUp');const f2=await p.evaluate(()=>document.activeElement.id);
  const ring=await p.evaluate(()=>getComputedStyle(document.activeElement).outlineStyle);
  ok('up and down move between the buttons, wrapping, with a visible focus ring',f==='m-siege'&&f2==='m-settings'&&ring==='solid',[f,f2,ring].join(' '));
  await p.keyboard.press('Enter');await p.waitForTimeout(200);let s=await p.evaluate(()=>!$('settings').hidden);await p.keyboard.press('Escape');await p.waitForTimeout(150);
  f=await p.evaluate(()=>({set:!$('settings').hidden,focus:document.activeElement.id}));ok('Settings opens from the keyboard; Escape closes it and gives the keyboard back to Settings',s&&!f.set&&f.focus==='m-settings',JSON.stringify(f));
  await p.focus('#m-load');await p.keyboard.press('Enter');await p.waitForTimeout(400);s=await p.evaluate(()=>!$('saves').hidden);await p.keyboard.press('Escape');await p.waitForTimeout(150);
  f=await p.evaluate(()=>({saves:!$('saves').hidden,focus:document.activeElement.id}));ok('Load Game opens the saves; Escape closes them and gives the keyboard back to Load Game',s&&!f.saves&&f.focus==='m-load',JSON.stringify(f));
  await p.click('#m-campaign');await p.waitForTimeout(500);let b=await bg(p);s=await p.evaluate(()=>!$('planet').hidden);
  ok('Campaign opens the campaign map, and the menu scene is let go',s&&!b.menu&&b.n===0,JSON.stringify(b));
  await p.click('#pIntro');await p.waitForTimeout(600);s=await p.evaluate(()=>INTRO.on);await p.evaluate(()=>introSkip());await p.waitForTimeout(800);
  const after=await p.evaluate(()=>({intro:INTRO.on,planet:!$('planet').hidden}));ok('Replay intro still plays the intro and comes back to the map',s&&!after.intro&&after.planet,JSON.stringify(after));
  await p.keyboard.press('Escape');await p.waitForTimeout(600);b=await bg(p);ok('Escape on the campaign map goes back to the main menu, and a scene runs again',b.menu&&b.mm&&b.top==='LIVE'&&b.playing,JSON.stringify(b));
  const before=b.id;
  await p.click('#m-survival');await p.waitForTimeout(800);b=await bg(p);let g=await p.evaluate(()=>{const G=window.__game();return G&&G.mode;});
  ok('Survival starts a Survival game and the scene is gone',g==='survival'&&!b.menu&&b.n===0&&b.videos===0,JSON.stringify(b));
  await p.evaluate(()=>{$('quitBtn').click();});await p.waitForTimeout(900);b=await bg(p);
  const back=await p.evaluate(()=>({game:!!window.__game(),splash:!$('splash').hidden,mm:$('overlay').classList.contains('mm')}));
  ok('quitting the game goes straight back to the main menu (no title screen), one scene on',!back.game&&!back.splash&&back.mm&&b.playing&&b.id!==before,JSON.stringify([back,before,b.id]));
  await p.click('#m-siege');await p.waitForTimeout(800);g=await p.evaluate(()=>{const G=window.__game();return G&&G.mode;});ok('Base Siege starts a Base Siege game',g==='siege');
  ok('no errors (entries)',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 3-5. (v59) the rotation, Next scene, a hidden tab, fallbacks, reduced motion and the Settings switch are tested in xtest59
 {const p=await open(br,{scene:3});
  const snd=await p.evaluate(async()=>{sndUnlock();for(let i=0;i<60&&!SND.ready;i++)await new Promise(r=>setTimeout(r,100));await new Promise(r=>setTimeout(r,800));
    return {amb:Object.keys(SND.amb).filter(k=>SND.amb[k]&&SND.amb[k].g&&SND.amb[k].g.gain.value>0.01)};});
  ok('the menu plays the ambience bed (wind and deep air) through the ambience volume',snd.amb.length>=1,JSON.stringify(snd));
  await p.route('**/art/menu/**',r=>r.abort());const b=await p.evaluate(async()=>{MDS.factory=()=>{throw new Error('test');};mmShow(0);await new Promise(r=>setTimeout(r,1500));
    return {n:document.querySelectorAll('#mmBg img').length,live:!!MD.G,bg:getComputedStyle($('mmBg')).backgroundColor,txt:getComputedStyle(document.querySelector('#overlay.mm h1')).color};});
  await p.screenshot({path:`${SHOTS}/menu_no_art.png`});
  ok('with no scene and no still picture the menu stands on a dark backdrop and stays readable',!b.live&&b.n===0&&b.bg==='rgb(6, 8, 12)'&&b.txt==='rgb(238, 240, 244)',JSON.stringify(b));
  await p.click('#m-survival');await p.waitForTimeout(500);ok('and its buttons still work',await p.evaluate(()=>!!window.__game())&&!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 6. sizes: the rail is about a third of a desktop window, the whole width of a phone; every button fits; nothing scrolls sideways
 for(const [w,h] of [[1920,1080],[2560,1440],[3440,1440],[1280,720],[1024,768],[800,600],[390,844]]){const p=await open(br,{vp:{width:w,height:h},scene:3});
  const r=await p.evaluate(()=>{const c=$('ovcard').getBoundingClientRect(),B=[...document.querySelectorAll('#ovcard .mode')].filter(b=>!b.hidden).map(b=>b.getBoundingClientRect()),f=$('mmFoot').getBoundingClientRect(),v=(MD.G?$('cv'):MMB.el)&&(MD.G?$('cv'):MMB.el).getBoundingClientRect();
    return {cw:c.width,W:innerWidth,H:innerHeight,inside:B.every(b=>b.left>=0&&b.right<=c.right+.5),minH:Math.min(...B.map(b=>b.height)),reach:$('ovcard').scrollHeight<=$('ovcard').clientHeight+1||getComputedStyle($('ovcard')).overflowY==='auto',
      sx:document.documentElement.scrollWidth,foot:f.right<=innerWidth&&f.bottom<=innerHeight,bg:!!v&&v.width>=innerWidth&&v.height>=innerHeight};});
  // a third of a desktop window, capped at 760 pixels on ultrawide screens; at least 340 pixels in a small window; the whole width of a phone
  const ratio=r.cw/r.W,kind=w<=760?'phone':w<1024?'small':w<=2600?'desk':'ultra';
  const fit=kind==='phone'?r.cw>=r.W-1&&r.minH>=56:kind==='small'?r.cw>=340&&ratio<=.45:kind==='desk'?ratio>=.26&&ratio<=.36:r.cw>=600&&r.cw<=760;
  const good=r.inside&&r.reach&&r.sx<=r.W&&r.foot&&r.bg&&fit;
  await p.screenshot({path:`${SHOTS}/menu_${w}x${h}.png`});ok(`${w}×${h}: rail ${{phone:'full width with large buttons',small:'at least 340 pixels',desk:'about a third of the width',ultra:'capped'}[kind]}, every button inside, background fills the window`,good&&!p.errs.length,JSON.stringify({...r,ratio:+ratio.toFixed(3)}));await p.context().close();}
 // ---- 7. an old save still loads from the menu
 {const p=await open(br,{scene:0});const r=await p.evaluate(async()=>{let q=5;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();
   for(let k=0;k<90;k++)step(1/30);const t=G.time,n=G.blocks.size;await saveTo('slot1');$('quitBtn').click();await new Promise(r=>setTimeout(r,800));return {t,n,menu:$('overlay').classList.contains('mm')&&!$('overlay').hidden};});
  await p.click('#m-load');await p.waitForTimeout(500);const load=await p.$('#slotList button');let r2=null;
  if(load){await load.click();await p.waitForTimeout(800);r2=await p.evaluate(()=>{const G=window.__game();return G&&{t:G.time,n:G.blocks.size,menu:!$('overlay').hidden};});}
  ok('a save made in a game loads again from Load Game on the new menu',r.menu&&r2&&Math.abs(r2.t-r.t)<.25&&r2.n===r.n&&!r2.menu,JSON.stringify([r,r2]));
  ok('no errors (save)',!p.errs.length,p.errs[0]);await p.context().close();}
 console.log(fails?`FAIL (${fails})`:'ALL PASS');await br.close();process.exit(fails?1:0);})();
