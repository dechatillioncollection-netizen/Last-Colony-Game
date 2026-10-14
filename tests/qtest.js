// quality presets: menu access, each preset's effect in a running game, persistence, and old-settings migration
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const res={};let errs=[];
 const ctxFor=async(dpr,init)=>{const c=await br.newContext({viewport:{width:1100,height:760},deviceScaleFactor:dpr});const p=await c.newPage();
   p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load/.test(m.text()))errs.push(m.text());});
   if(init)await p.addInitScript(init);await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);return {c,p};};
 // a first-time player, on a high-density screen
 let {c,p}=await ctxFor(2,()=>{try{localStorage.setItem('lc_gl','2')}catch(e){}});
 res.fresh=await p.evaluate(()=>({q:SET.q,hd:SET.hd,hq:SET.hq,art:SET.art,gl:SET.gl,DPR}));
 await p.click('#m-settings');await p.waitForTimeout(200);res.menuOpens=await p.evaluate(()=>!$('settings').hidden);await p.screenshot({path:'q_panel.png'});
 await p.evaluate(()=>{$('settings').hidden=true;startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<30*20;k++)step(1/30);cam.z=1.3;centerOn(G.core.x+2,G.core.y+1);});
 res.presets={};
 for(const q of ['low','medium','high','epic','high']){await p.evaluate(()=>openSettings());await p.click(`.qbar button[data-q="${q}"]`);await p.waitForTimeout(900);
   res.presets[q]=await p.evaluate(()=>({q:SET.q,hd:SET.hd,hq:SET.hq,art:SET.art,gl:SET.gl,DPR,canvasW:cv.width,gpu:webGPU,webArt:webArtOn(),
     stored:['lc_quality','lc_hd','lc_hq','lc_art','lc_gl'].map(k=>localStorage.getItem(k)).join(','),on:[...document.querySelectorAll('.qbar button.on')].map(b=>b.dataset.q).join(),note:$('qgpu').textContent}));
   if(q!=='high'||res.presets.epic){await p.evaluate(()=>{$('settings').hidden=true;});await p.waitForTimeout(500);await p.screenshot({path:`q_${q}.png`});}}
 await p.reload();await p.waitForTimeout(1000);res.afterReload=await p.evaluate(()=>({q:SET.q,DPR}));await c.close();
 // someone upgrading from v29 who had HD on and High Quality off
 ({c,p}=await ctxFor(1,()=>{try{if(!sessionStorage.getItem('x')){localStorage.setItem('lc_hd','1');localStorage.setItem('lc_hq','0');localStorage.setItem('lc_art','1');sessionStorage.setItem('x','1');}}catch(e){}}));
 res.migrated=await p.evaluate(()=>SET.q);await c.close();
 ({c,p}=await ctxFor(1,()=>{try{localStorage.setItem('lc_hd','0')}catch(e){}}));res.migratedLow=await p.evaluate(()=>SET.q);await c.close();
 console.log(JSON.stringify(res,null,1));console.log('errors',errs);await br.close();})();
