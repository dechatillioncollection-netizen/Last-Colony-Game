// v57: a frame rate limit in Settings: Screen (one frame per screen refresh, the old behaviour and the default), 30, 60, 80, 120, 240 or
// Unlimited. The row is there with Screen chosen, a choice is kept across a reload, the quality bar beside it still works on its own,
// the limiter lets through the right number of frames for each limit (fed made-up screen refreshes of 60, 144 and 1000 a second), a real
// game drawn at 30 runs at 30 with the world at the same speed as at Screen, and the note says a browser cannot go above the refresh.
const {chromium}=require(process.env.PW||'playwright');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html';
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
(async()=>{const br=await chromium.launch();const ctx=await br.newContext({viewport:{width:1600,height:900}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{try{if(!sessionStorage.getItem('lc57')){localStorage.clear();sessionStorage.setItem('lc57','1');}localStorage.setItem('lc_splash','1');localStorage.setItem('lc_quality','medium');}catch(e){}});
 const pass=async()=>{await p.waitForTimeout(2500);await p.keyboard.press('Enter');await p.waitForTimeout(1500);};
 await p.goto(URL+NEW);await pass();
 // ---- 1. the row
 await p.click('#m-settings');await p.waitForTimeout(400);
 let s=await p.evaluate(()=>({btns:[...document.querySelectorAll('#fpsBar button')].map(b=>b.textContent),on:[...document.querySelectorAll('#fpsBar button.on')].map(b=>b.textContent),vis:$('fpsBar').getBoundingClientRect().height>0,note:$('fpsNote').textContent,q:[...document.querySelectorAll('.qbar button[data-q].on')].map(b=>b.dataset.q)}));
 ok('the row has Screen, 30, 60, 80, 120, 240 and Unlimited',s.btns.join()==='Screen,30,60,80,120,240,Unlimited'&&s.vis,s.btns.join());
 ok('Screen is chosen at first, as before',s.on.join()==='Screen');
 ok('the note names the screen\'s rate',/refresh of your screen/.test(s.note)&&/\(\d+ a second here\)/.test(s.note),s.note);
 await p.click('#fpsBar button[data-fps="120"]');s=await p.evaluate(()=>({note:$('fpsNote').textContent,ls:localStorage.getItem('lc_fps'),cap:FPSL.cap}));
 ok('120 says a browser cannot go above the refresh',s.cap===120&&s.ls==='120'&&/browser cannot show more frames/.test(s.note),s.note);
 await p.click('#fpsBar button[data-fps="30"]');s=await p.evaluate(()=>({note:$('fpsNote').textContent,on:[...document.querySelectorAll('#fpsBar [aria-checked=true]')].map(b=>b.textContent)}));
 ok('30 is chosen and says the game speed does not change',s.on.join()==='30'&&/same speed/.test(s.note),s.note);
 // the quality bar is still its own
 await p.click('.qbar button[data-q="high"]');s=await p.evaluate(()=>({q:localStorage.getItem('lc_quality'),fps:[...document.querySelectorAll('#fpsBar button.on')].map(b=>b.textContent)}));
 ok('the quality bar still works and leaves the limit alone',s.q==='high'&&s.fps.join()==='30',JSON.stringify(s));
 await p.reload();await pass();await p.click('#m-settings');await p.waitForTimeout(300);
 s=await p.evaluate(()=>({cap:FPSL.cap,on:[...document.querySelectorAll('#fpsBar button.on')].map(b=>b.textContent)}));
 ok('the limit is kept across a reload',s.cap===30&&s.on.join()==='30',JSON.stringify(s));
 await p.keyboard.press('Escape');
 // ---- 2. the limiter, fed made-up refreshes for ten seconds
 const pace=await p.evaluate(()=>{const keep={cap:FPSL.cap,iv:FPSL.iv,t:FPSL.t};const out={};
   for(const hz of [60,144,1000])for(const cap of [0,30,60,80,120,240,-1]){FPSL.cap=cap;FPSL.iv=cap>0?1000/cap:0;FPSL.t=0;let n=0;const step=1000/hz;
     for(let t=5000;t<15000;t+=step+(((t*7919)|0)%3-1)*step*.03)if(!fpsSkip(t))n++;out[hz+'/'+cap]=+(n/10).toFixed(1);}
   Object.assign(FPSL,keep);return out;});
 for(const hz of [60,144,1000])for(const cap of [0,30,60,80,120,240,-1]){const want=cap>0?Math.min(cap,hz):hz,got=pace[hz+'/'+cap];
   ok(`a ${hz} Hz screen, limit ${cap===0?'Screen':cap===-1?'Unlimited':cap}: ${want} a second`,Math.abs(got-want)<=Math.max(1,want*.03),got);}
 // ---- 3. a real game at 30 and at Screen: frames drawn, and how fast the world runs
 const real=await p.evaluate(async()=>{let n=0;const o=fpsSkip;fpsSkip=function(now){const s=o(now);if(!s)n++;return s;};let q=7;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');
   const res={};for(const c of [0,30]){fpsSet(c);await new Promise(r=>setTimeout(r,500));n=0;const g0=window.__game().time,t0=performance.now();await new Promise(r=>setTimeout(r,3000));const dt=(performance.now()-t0)/1000;res[c]={fps:+(n/dt).toFixed(1),speed:+((window.__game().time-g0)/dt).toFixed(3)};}
   fpsSkip=o;return res;});
 ok('a game drawn at 30 shows 30 frames a second',Math.abs(real[30].fps-30)<=1.5,JSON.stringify(real));
 ok('the world runs at the same speed at 30 as at Screen',Math.abs(real[30].speed-real[0].speed)<0.05&&Math.abs(real[0].speed-1)<0.05,JSON.stringify(real));
 ok('no errors',!errs.length,errs[0]);
 await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
