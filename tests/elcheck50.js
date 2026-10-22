// v50: the packaged Linux desktop app (the same code as the Windows and Mac builds), under a virtual display. Checks the desktop bridge, saves
// as files (and bringing over older browser-storage saves), Ultra and the steady-frame-rate guard, full screen, Quit, and the intro.
const {_electron}=require(process.env.PW||'playwright');const fs=require('fs'),path=require('path'),os=require('os');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));const ud=path.join(cfg,'Last Colony'),sv=path.join(ud,'saves');
const launch=()=>_electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
const R={},ck=[];const T=(n,ok,d)=>{ck.push([n,!!ok]);console.log((ok?'PASS ':'FAIL ')+n+(d!==undefined?'  '+JSON.stringify(d):''));};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 // ---- first run
 let app=await launch();let w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3000);await w.evaluate(()=>{if(window.splashEnd)splashEnd(true);});   // v55: past the title screen to the menu

 const b=await w.evaluate(async()=>({desk:DESK,ver:lcDesktop.version,plat:lcDesktop.platform,mode:await Store.init(),url:location.protocol,node:typeof require,
   quit:!$('m-quit').hidden,full:await lcDesktop.isFullScreen(),vw:VW,vh:VH,ultra:!!QUALITY.ultra}));
 T('the desktop bridge is there and nothing else of Node is',b.desk&&b.ver===require(path.join(__dirname,'../electron/package.json')).version&&b.plat==='linux'&&b.url==='file:'&&b.node==='undefined',b);
 T('saves are kept as files',b.mode==='files');
 T('the main menu has Quit',b.quit);
 T('the first run opens full screen',b.full&&b.vw===1920&&b.vh===1080,{full:b.full,vw:b.vw,vh:b.vh});
 // saves: a file per key, written whole; an older browser-storage save is brought over once
 const s1=await w.evaluate(async()=>{localStorage.setItem('lc_sector-old','{"from":"browser"}');const got=await Store.get('sector-old');
   await Store.set('sector-new','{"n":1}');await Store.set('sector-gone','x');await Store.del('sector-gone');
   let bad;try{await lcDesktop.saves.set('../escape','x');bad='written';}catch(e){bad='refused';}
   return {got,bad};});
 const files=fs.existsSync(sv)?fs.readdirSync(sv).sort():[];
 T('an older browser save is brought over into a file',s1.got==='{"from":"browser"}'&&fs.readFileSync(path.join(sv,'sector-old.json'),'utf8')==='{"from":"browser"}',files);
 T('saving writes a file, deleting removes it, no temporary files are left',files.join()==='sector-new.json,sector-old.json',files);
 T('a save name cannot reach outside the saves folder',s1.bad==='refused'&&!fs.existsSync(path.join(ud,'escape.json')),s1.bad);
 // Steam is not running here: achievements are a quiet no-op
 T('without Steam, achievements are a quiet no-op',await w.evaluate(()=>lcDesktop.achieve('CAPTURE_LANDFALL'))===false);
 // ---- Ultra and the guard
 await w.evaluate(()=>{openSettings();});await w.waitForTimeout(300);
 const st=await w.evaluate(()=>({ub:!document.querySelector('[data-q=ultra]').hidden,steady:!$('optSteady').closest('.dsk,label').hidden&&$('optSteady').checked,full:$('optFull').checked}));
 T('Settings offers Ultra, Steady frame rate (on) and Full screen',st.ub&&st.steady&&st.full,st);
 await w.evaluate(()=>{try{closeSettings()}catch(e){};$('settings')&&($('settings').hidden=true);startMission('landfall');});await w.waitForTimeout(800);await w.keyboard.press('Escape');await w.waitForTimeout(800);
 await w.evaluate(()=>{while(DLG.open)skipDlg();});
 const ep=await w.evaluate(()=>{applyQuality('epic');return {dpr:DPR,cw:cv.width};});
 const ul=await w.evaluate(()=>{applyQuality('ultra');return {dpr:DPR,cw:cv.width,ch:cv.height,max:DYN.max,min:DYN.min,q:SET.q};});
 T('Ultra draws at twice the screen resolution, Epic at the screen resolution',ep.dpr===1&&ul.dpr===2&&ul.cw===3840&&ul.ch===2160&&ul.min===.75,{ep,ul});
 // load: make every frame take about 40 ms of work; the guard brings the resolution down, then back up once the load goes
 await w.evaluate(()=>{window.__burn=40;const r0=render;render=function(){const t=performance.now();while(performance.now()-t<__burn);return r0.apply(this,arguments);};
   DYN.cur=DYN.max;resize();window.__trace=[];window.__ti=setInterval(()=>__trace.push([Math.round(performance.now()),+DYN.cur.toFixed(3),+DYN.ema.toFixed(1)]),500);});
 await w.waitForTimeout(9000);
 const down=await w.evaluate(()=>({cur:DYN.cur,min:DYN.min,period:DYN.period,ema:DYN.ema,cw:cv.width}));
 T('under heavy load the guard lowers the resolution, never below 75% of the screen',down.cur<ul.max-.01&&down.cur>=ul.min-1e-9,down);
 await w.evaluate(()=>{__burn=0;});await w.waitForTimeout(20000);
 const up=await w.evaluate(()=>({cur:DYN.cur,work:+DYN.work.toFixed(1),ema:+DYN.ema.toFixed(1),period:DYN.period}));
 R.trace=await w.evaluate(()=>__trace);R.up=up;
 // this machine has no graphics card, so whether it climbs back here depends on its speed; report it, then check the stepping rules with set frame times
 console.log('INFO after the load went (software rendering, no GPU):',JSON.stringify(up));
 const sim=await w.evaluate(()=>{const s0={...DYN};const out=[];let now=1e7;DYN.on=true;DYN.cur=DYN.min;DYN.lastDown=now-1e5;DYN.lastUp=0;DYN.wait=8000;DYN.ema=0;DYN.work=0;DYN.period=1000/60;
   const run=(secs,dt,work)=>{for(let i=0,n=Math.round(secs*1000/dt);i<n;i++){now+=dt;dynFrame(dt,work,now);}out.push(+DYN.cur.toFixed(3));};
   run(20,16.7,3);                         // easy frames: climbs in steps of 12%, at most one every 3 s
   const climbed=DYN.cur;run(2.5,40,30);   // heavy frames: drops by 15% a second
   const dropped=DYN.cur;DYN.wait=8000;const w1=DYN.wait;run(9.5,16.7,3);const reclimb=DYN.cur;run(2.5,40,30);   // a step up that has to be undone doubles the wait before the next
   const w2=DYN.wait;const r={climbed,dropped,reclimb,max:DYN.max,min:DYN.min,w1,w2,out};Object.assign(DYN,s0);resize();return r;});
 T('the guard climbs back in small steps when frames are easy',sim.climbed>sim.min*1.5&&sim.climbed<=sim.max+1e-9,sim);
 T('the guard drops quickly when frames are heavy, and waits longer after a step up that did not hold',sim.dropped<sim.climbed*.8&&sim.reclimb>sim.dropped&&sim.w2===sim.w1*2,sim);
 const fpsTxt=await w.evaluate(async()=>{$('fpsBox').hidden=false;await new Promise(r=>setTimeout(r,1200));return $('fpsBox').textContent;});
 T('the F3 readout shows the drawing resolution',/resolution \d+%/.test(fpsTxt),fpsTxt);
 // switching the guard off holds Ultra at full resolution
 const off=await w.evaluate(async()=>{$('optSteady').checked=false;$('optSteady').onchange({target:$('optSteady')});return {on:DYN.on,dpr:DPR,ls:localStorage.getItem('lc_steady')};});
 T('Steady frame rate off holds the full Ultra resolution and is remembered',!off.on&&off.dpr===2&&off.ls==='0',off);
 await w.evaluate(()=>{$('optSteady').checked=true;$('optSteady').onchange({target:$('optSteady')});clearInterval(__ti);});
 // achievements fire from a capture without breaking it
 const ach=await w.evaluate(()=>{const calls=[];const a=lcDesktop.achieve;try{captureSector();}catch(e){return 'threw '+e.message;}return 'ok';});
 T('capturing a sector still works in the desktop app',ach==='ok',ach);
 // ---- full screen off, then Quit from the main menu
 await w.evaluate(()=>lcDesktop.setFullScreen(false));await w.waitForTimeout(1200);
 const nf=await w.evaluate(()=>lcDesktop.isFullScreen());
 await w.evaluate(()=>{G=null;showMenu?showMenu():0;});
 const closed=new Promise(r=>app.process().once('exit',()=>r(true)));
 await w.evaluate(()=>{$('m-quit').click();}).catch(()=>{});
 const q=await Promise.race([closed,sleep(8000).then(()=>false)]);
 const winj=JSON.parse(fs.readFileSync(path.join(ud,'window.json'),'utf8'));
 T('Quit closes the app and remembers windowed mode',!nf&&q&&winj.full===false,{nf,q,winj});
 // ---- second run: saves are still there, the window comes back windowed, the intro plays for a new campaign
 app=await launch();w=await app.firstWindow();w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3000);await w.evaluate(()=>{if(window.splashEnd)splashEnd(true);});   // v55: past the title screen to the menu

 const r2=await w.evaluate(async()=>({full:await lcDesktop.isFullScreen(),old:await Store.get('sector-old'),nw:await Store.get('sector-new'),steady:DYN.on}));
 T('the second run keeps the saves and the window mode',!r2.full&&r2.old==='{"from":"browser"}'&&r2.nw==='{"n":1}'&&r2.steady,r2);
 await w.evaluate(async()=>{if(DLG.open){DLG.done=null;closeDlg();}G=null;CAMP=freshCamp();await saveCamp();openPlanet();});await w.waitForTimeout(600);await w.click('#launch');await w.waitForTimeout(1500);
 const intro=await w.evaluate(()=>({on:INTRO.on,mode:INTRO.mode,t:INTRO.t}));
 T('a new campaign plays the intro in the app',intro.on&&intro.mode==='first'&&intro.t>0,intro);
 T('the campaign is saved as a file',fs.existsSync(path.join(sv,'campaign.json')));
 // v51: in a match, Esc opens the pause menu, which has Quit in the app; Quit saves the game and closes the app
 await w.evaluate(()=>{introSkip();while(DLG.open)skipDlg();G=null;startGame('survival');G.sel=0;G.selU=0;G.selUs=[];G.tool=null;renderPanel(true);document.activeElement&&document.activeElement.blur();});await w.waitForTimeout(300);
 await w.keyboard.press('Escape');await w.waitForTimeout(300);
 const pm=await w.evaluate(()=>({open:!$('pmenu').hidden,quit:!$('pmQuit').hidden,note:$('pmNote').textContent,dlg:DLG.open,intro:INTRO.on,sel:G&&G.sel,selU:G&&G.selU,tool:G&&G.tool,over:G&&G.over,G:!!G,tech:$('tech').hidden}));
 const closed2=new Promise(r=>app.process().once('exit',()=>r(true)));
 await w.click('#pmQuit').catch(()=>{});const q2=await Promise.race([closed2,sleep(10000).then(()=>false)]);
 T('in a match Esc opens the pause menu, and its Quit saves and closes the app',pm.open&&pm.quit&&/Quit/.test(pm.note)&&q2&&fs.existsSync(path.join(sv,'auto.json')),{pm,q2,files:fs.readdirSync(sv)});
 if(!q2)await app.close();
 T('no page errors',errs.length===0,errs);
 fs.writeFileSync('elcheck50_result.json',JSON.stringify({checks:ck,trace:R.trace,up:R.up},null,1));
 const pass=ck.filter(c=>c[1]).length;console.log(pass+' of '+ck.length+' pass');process.exit(pass===ck.length?0:1);
})().catch(e=>{console.log('ERROR',e);process.exit(2);});
