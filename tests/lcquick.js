const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(400);
 console.log(await p.evaluate(()=>{const out=[];for(const m of ['survival','siege']){startGame(m);const G=window.__game();for(let k=0;k<30*200;k++)step(1/30);out.push(m+' wave '+G.wave+' story '+G.story+' enemies '+G.enemies.length+' core '+G.core.hp);}return out.join(' | ');}));
 console.log(errs);await b.close();})();
