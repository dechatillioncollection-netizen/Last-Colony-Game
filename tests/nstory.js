// plays each campaign mission's intro through the real dialogue system and records the order the conversations run in
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('lc_quality','high');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_gl','0');});
 await p.goto(process.env.URL||'http://localhost:8123/index.html');await p.waitForTimeout(800);await p.click('#m-campaign');await p.waitForTimeout(600);
 const out={};
 for(const id of ['landfall','ember','kilo','frost','last']){
   await p.evaluate(id=>{window.__log=[];startMission(id);},id);await p.waitForTimeout(600);
   for(let k=0;k<400&&await p.evaluate(()=>DLG.open);k++){
     const info=await p.evaluate(()=>{const key=Object.keys(SEQ).find(k=>SEQ[k]===DLG.seq);if(window.__log[window.__log.length-1]!==key)window.__log.push(key);
       return {key,i:DLG.i,who:DLG.seq.lines[DLG.i][0],text:DLG.seq.lines[DLG.i][1]};});
     if(info.key==='e_brief'&&/Nymbria communis/.test(info.text)){await p.keyboard.press('Space');await p.waitForTimeout(150);await p.screenshot({path:'n_naming_scene.png'});await p.keyboard.press('Space');}
     else if(info.key==='fc_general'&&/Nymbris/.test(info.text)){await p.keyboard.press('Space');await p.waitForTimeout(150);await p.screenshot({path:'n_m1_nymbris.png'});await p.keyboard.press('Space');}
     else if(info.key==='l_intro'&&info.i===0){await p.keyboard.press('Space');await p.waitForTimeout(150);await p.screenshot({path:'n_m1_hive.png'});await p.keyboard.press('Space');}
     else if(info.key==='x_out2'&&info.i===10){await p.keyboard.press('Space');await p.waitForTimeout(150);await p.screenshot({path:'n_m5_end.png'});await p.keyboard.press('Space');}
     else await p.keyboard.press('Space');await p.waitForTimeout(25);}
   out[id]=await p.evaluate(()=>{const G=window.__game();return {played:window.__log,story:G.story&&G.story.s,mission:G.mission};});}
 // outros: landfall (patrol scenes run inside the mission) and ember outro
 const outro=await p.evaluate(()=>{window.__log=[];let done=false;storyOutro(()=>{done=true;});return true;});
 for(let k=0;k<200&&await p.evaluate(()=>DLG.open);k++){await p.evaluate(()=>{const key=Object.keys(SEQ).find(k=>SEQ[k]===DLG.seq);if(window.__log[window.__log.length-1]!==key)window.__log.push(key);});if(await p.evaluate(()=>DLG.seq===SEQ.x_out2&&DLG.i===11)){await p.keyboard.press('Space');await p.waitForTimeout(150);await p.screenshot({path:'n_m5_last.png'});}await p.keyboard.press('Space');await p.waitForTimeout(25);}
 out.lastOutro=await p.evaluate(()=>window.__log);
 console.log(JSON.stringify(out,null,1),errs);await br.close();})();
