// v58 in the packaged Linux desktop app: the title screen beats, a key grows the vines with their sound, they part onto the menu in under
// ten seconds, and the menu clip plays from the app's own files with its sound decoding, at the default volume.
const {_electron}=require(process.env.PW||'playwright');const path=require('path'),os=require('os'),fs=require('fs');
const APP=process.env.LC_APP||path.join(__dirname,'../electron/out/Last Colony-linux-x64/Last Colony');
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
(async()=>{const cfg=fs.mkdtempSync(path.join(os.tmpdir(),'lccfg-'));
 const app=await _electron.launch({executablePath:APP,args:['--no-sandbox'],env:{...process.env,DISPLAY:process.env.DISPLAY||':99',XDG_CONFIG_HOME:cfg}});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));
 await w.waitForFunction(()=>{try{return $('splash').classList.contains('ready');}catch(e){return false;}},null,{timeout:20000});
 const h=await w.evaluate(async()=>{for(let i=0;i<60&&!SND.ready;i++)await new Promise(r=>setTimeout(r,100));SPL.nextPulse=0;let max=0;for(let i=0;i<30;i++){await new Promise(r=>setTimeout(r,20));max=Math.max(max,+getComputedStyle($('splash')).getPropertyValue('--hb')||0);}
   return {max,snd:SND.on&&SND.ctx.state,heart:!!SND.buf.title_heart_0};});
 ok('the title screen beats, with its heartbeat sound loaded',h.max>.8&&h.snd==='running'&&h.heart,JSON.stringify(h));
 await w.keyboard.press('Enter');const t0=Date.now();await w.waitForTimeout(1200);
 const v=await w.evaluate(()=>({vines:!!$('splashVn'),snd:!!(SPL.vine&&SPL.vine.snd)}));ok('a key grows the vines, and they are heard',v.vines&&v.snd,JSON.stringify(v));
 await w.waitForFunction(()=>!SPL.on,null,{timeout:12000});const dt=(Date.now()-t0)/1000;ok('they part onto the menu in under ten seconds',dt<10,dt.toFixed(1)+' s');
 await w.waitForTimeout(2500);await w.screenshot({path:process.env.SHOT||'elvines58.png'});
 const m=await w.evaluate(()=>({proto:location.protocol,src:MMB.el&&MMB.el.currentSrc,muted:MMB.el&&MMB.el.muted,paused:MMB.el&&MMB.el.paused,vol:MMB.el&&+MMB.el.volume.toFixed(2),bytes:MMB.el&&MMB.el.webkitAudioDecodedByteCount,focus:document.activeElement&&document.activeElement.id}));
 ok('the menu clip plays from the app\'s files with its sound',m.proto==='file:'&&/art\/menu\/\w+\.webm$/.test(m.src)&&!m.muted&&!m.paused&&Math.abs(m.vol-.8)<.05&&m.bytes>0&&m.focus==='m-campaign',JSON.stringify(m));
 ok('no errors',!errs.length,errs[0]);await app.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
