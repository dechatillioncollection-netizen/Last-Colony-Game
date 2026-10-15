// v34 in-game screenshots of each redesigned sector. Writes shots34/*.png
const {chromium}=require(process.env.PW||'playwright');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForTimeout(1500);await p.click('#m-campaign');await p.waitForTimeout(500);
 await p.evaluate(()=>{window.__s={
  start(id){SET.fog=false;startMission(id);skipDlg();skipDlg();if(G.story){G.story.s='main';G.story.hold=false;G.story.cease=false;}$('tut').hidden=true;
   for(let k=0;k<3000;k++){step(STEP);if(G.core.wi>=G.core.wlist.length)break;}for(const e of G.enemies)e.dead=true;G.enemies=[];G.countdown=150;$('msgs').innerHTML='';},
  look(x,y,z){G.paused=true;cam.z=z;centerOn(x,y);}};});
 const shot=async(name,x,y,z)=>{await p.evaluate(([x,y,z])=>__s.look(x,y,z),[x,y,z]);await p.waitForTimeout(900);await p.screenshot({path:'shots34/'+name+'.png'});console.log('wrote',name);};
 // Landfall: the Bloom's hollow, the survey track, then the patrol's first contact scene
 await p.evaluate(()=>__s.start('landfall'));
 await shot('1_landfall_hollow',22,38,1.1);await shot('1_landfall_track',48,32,.9);
 const fc=await p.evaluate(()=>{startMission('landfall');SET.fog=false;skipDlg();skipDlg();$('tut').hidden=true;
   for(let k=0;k<3000;k++){step(STEP);if(G.core.wi>=G.core.wlist.length)break;}
   G.items[CU]+=200;const [sx,sy]=[G.core.x+5,G.core.y-3];tryPlace('spitter',sx,sy,0,true);for(const b of G.blocks.values())b.built=1;
   G.story.s='tut';startFirstContact();let k=0;while(G.story.s==='fc_walk'&&k++<30*120)step(STEP);
   const lead=G.enemies.find(e=>e.script);return {s:G.story.s,dlg:DLG.open,lead:lead&&[lead.x,lead.y]};});
 console.log('first contact',JSON.stringify(fc));
 if(fc.lead){await p.evaluate(([x,y])=>{cam.z=1.1;centerOn(x-4,y+1);},fc.lead);await p.waitForTimeout(700);
   for(let k=0;k<4;k++){await p.keyboard.press('Space');await p.waitForTimeout(80);}await p.waitForTimeout(600);await p.screenshot({path:'shots34/1_landfall_first_contact.png'});console.log('wrote first contact');}
 await p.evaluate(()=>{skipDlg();skipDlg();skipDlg();});
 // Ember Fields
 await p.evaluate(()=>__s.start('ember'));await shot('2_ember_bloom_coal',24,64,.95);await shot('2_ember_haul_road',44,44,.85);await shot('2_ember_depot',66,13,1);
 // Outpost Kilo
 await p.evaluate(()=>__s.start('kilo'));await shot('3_kilo_pass',48,49,.8);await shot('3_kilo_outpost_lab',78,46,.85);
 // Frost Canyon
 await p.evaluate(()=>__s.start('frost'));await shot('4_frost_staging',47,14,.8);await shot('4_frost_canyon',48,52,.7);await shot('4_frost_bloom',48,78,.85);
 // The Last Colony
 await p.evaluate(()=>__s.start('last'));await shot('5_last_front',100,72,.6);await shot('5_last_district',131,72,.6);await shot('5_last_command',127,78,1);
 console.log('errors',errs);await br.close();})();
