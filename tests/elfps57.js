// v57 in the packaged Linux desktop app: choosing a limit above 60 (or Unlimited) is saved for the app, which says to restart; after a
// restart the app starts with its frame limit off, says so, and a game can draw more than 60 frames a second where the computer can.
// Screen afterwards turns it back on at the next start.
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
const start=async()=>{const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
  const w=await app.firstWindow();w.errs=[];w.on('pageerror',e=>w.errs.push(e.message));await w.waitForFunction(()=>{try{return !!FPSL&&typeof $==='function';}catch(e){return false;}});return {app,w};};
const fpsFile=()=>{for(const d of fs.readdirSync(cfg)){const f=path.join(cfg,d,'fps.json');if(fs.existsSync(f))return JSON.parse(fs.readFileSync(f,'utf8'));}return null;};
// frames drawn a second in a Survival game with no limit in the page
const measure=w=>w.evaluate(async()=>{let n=0;const o=fpsSkip;fpsSkip=function(now){const s=o(now);if(!s)n++;return s;};if(!window.__game()){let q=3;Math.random=()=>(q=(q*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');}
  await new Promise(r=>setTimeout(r,1500));n=0;const t0=performance.now();await new Promise(r=>setTimeout(r,3000));fpsSkip=o;return +(n*1000/(performance.now()-t0)).toFixed(1);});
(async()=>{let {app,w}=await start();
 let s=await w.evaluate(()=>({unc:lcDesktop.uncapped,cap:FPSL.cap}));ok('first start: the frame limit is on, Screen chosen',s.unc===false&&s.cap===0,JSON.stringify(s));
 const before=await w.evaluate(()=>{fpsSet(-1);return 0;});const fps1=await measure(w);
 s=await w.evaluate(()=>({note:$('fpsNote').textContent}));ok('Unlimited says to restart the app',/Restart the app/.test(s.note),s.note);
 await w.waitForTimeout(300);ok('and is saved for the app',(fpsFile()||{}).fps===-1,JSON.stringify(fpsFile()));
 ok('no errors (first start)',!w.errs.length,w.errs[0]);await app.close();
 ({app,w}=await start());
 s=await w.evaluate(()=>({unc:lcDesktop.uncapped,cap:FPSL.cap,note:(fpsUI(),$('fpsNote').textContent)}));
 ok('after a restart the frame limit is off and the note says so',s.unc===true&&s.cap===-1&&/refresh limit is off/.test(s.note),JSON.stringify(s));
 const fps2=await measure(w);ok('a game draws more frames than with the limit on',fps2>fps1+5,JSON.stringify({limitOn:fps1,limitOff:fps2}));
 await w.evaluate(()=>fpsSet(0));await w.waitForTimeout(300);s=await w.evaluate(()=>$('fpsNote').textContent);
 ok('Screen then says to restart, and is saved (and names no rate, which it cannot know with the limit off)',/Restart the app/.test(s)&&!/a second here/.test(s)&&(fpsFile()||{}).fps===0,s);
 ok('no errors (second start)',!w.errs.length,w.errs[0]);await app.close();
 ({app,w}=await start());s=await w.evaluate(()=>lcDesktop.uncapped);ok('and the next start has the limit back on',s===false);await app.close();
 console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
