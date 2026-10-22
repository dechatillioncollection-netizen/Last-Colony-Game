// v55 in the packaged Linux desktop app under a virtual display: the title screen shows on launch with its art from the app's files,
// its sound starts without waiting for a click (the desktop app may play sound at once), and a key fades it into the main menu
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(1500);
 const wd=await w.evaluate(()=>({webdriver:!!navigator.webdriver,on:SPL.on}));await w.waitForTimeout(2500);
 const a=await w.evaluate(async()=>{for(let i=0;i<50&&!SPL.amb;i++)await new Promise(r=>setTimeout(r,100));
   return {on:SPL.on,proto:location.protocol,bg:!!(SPL.bg&&SPL.bg.naturalWidth),glow:!!(SPL.glow&&SPL.glow.naturalWidth),snd:SND.ctx&&SND.ctx.state,amb:!!SPL.amb,ver:$('splashVer').textContent};});
 await w.screenshot({path:process.env.SHOT||'elsplash55.png'});
 await w.keyboard.press('Enter');await w.waitForTimeout(1300);
 const b=await w.evaluate(()=>({on:SPL.on,shown:!$('splash').hidden,menu:!$('overlay').hidden,game:!!window.__game()}));
 const ok=a.on&&a.proto==='file:'&&a.bg&&a.glow&&a.snd==='running'&&a.amb&&/^v\d/.test(a.ver)&&!b.on&&!b.shown&&b.menu&&!b.game&&!errs.length;
 console.log(ok?'PASS':'FAIL','the title screen in the desktop app',JSON.stringify({wd,a,b}),errs.slice(0,2));await app.close();process.exit(ok?0:1);})();
