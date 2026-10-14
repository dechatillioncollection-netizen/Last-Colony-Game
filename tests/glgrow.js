const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const errs=[];const p=await br.newPage({viewport:{width:900,height:600}});p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl','2')}catch(e){}});
 await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);
 await p.evaluate(()=>{for(const el of document.querySelectorAll('body > *:not(canvas)'))if(el.tagName!=='SCRIPT'&&el.tagName!=='STYLE')el.style.visibility='hidden';});
 const fr=await p.evaluate(()=>{startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<30*12;k++)step(1/30);G.paused=true;repaintAllWeb();
   const L=webList(G.core);let nx=null;for(const i of L)if(!G.web[i]){nx=i;break;}const [cx,cy]=bCenter(G.core);const x=nx%MW,y=(nx/MW)|0;
   const dx=x+.5-cx,dy=y+.5-cy,l=Math.hypot(dx,dy);return {x:x+.5-dx/l*1.5,y:y+.5-dy/l*1.5,gpu:webGPU};});
 // drive game time by hand so the frames are evenly spaced even in software rendering
 await p.evaluate(([x,y])=>{cam.z=2.4;centerOn(x,y);},[fr.x,fr.y]);
 for(let k=0;k<6;k++){await p.evaluate(()=>{for(let j=0;j<10;j++)step(1/30);});await p.waitForTimeout(400);await p.screenshot({path:`gg${k}.png`});}
 console.log(JSON.stringify(fr),errs);await br.close();})();
