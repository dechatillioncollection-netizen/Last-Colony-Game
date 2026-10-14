const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('file://'+process.cwd()+'/'+(process.argv[2]||'index.html'));await p.waitForTimeout(900);
 for(const m of ['survival','siege']){
 const r=await p.evaluate(async(m)=>{await loadCamp();CAMP.global=[777,555,0,0,0,0,0];startGame(m);const G=window.__game();return {mode:m,unlocked:G.unlocked.size,tech:TECH.length,items:G.items.join('/'),inCamp:inCampaign(),techItems:techItems().join('/')};},m);
 console.log(JSON.stringify(r));
 await p.click('#techBtn').catch(()=>p.evaluate(()=>openTech&&openTech()));await p.waitForTimeout(500);await p.screenshot({path:'sk_tech_'+m+'.png'});
 await p.keyboard.press('Escape');await p.evaluate(()=>{$('tech').hidden=true;});}
 console.log(errs);await b.close();})();
