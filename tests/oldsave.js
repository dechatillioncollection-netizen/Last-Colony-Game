// a campaign save made in v33 loads in v34 with its own map and v33 Rootweb rules; a v34 save round-trips its events
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const errs=[];
 const open=async u=>{const p=await br.newPage();p.on('pageerror',e=>errs.push(u+': '+e.message));await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1200);await p.click('#m-campaign');await p.waitForTimeout(400);return p;};
 const old=await open((process.env.OLD||'previous/index.html'));
 const snaps=await old.evaluate(()=>{const o={};for(const id of ['landfall','ember','last']){startMission(id);skipDlg();skipDlg();if(G.story){G.story.s='main';G.story.hold=false;}for(let k=0;k<30*60;k++)step(STEP);o[id]=JSON.stringify(snapGame());}return o;});
 const p=await open('index.html');
 for(const id of Object.keys(snaps)){const r=await p.evaluate(s=>{const S=JSON.parse(s);applySave(S);const t0=[...G.terrain].join('').length;for(let k=0;k<30*30;k++)step(STEP);
   return {mis:G.mission&&G.mission.id||G.mis,mapv:G.mapv||0,reach:G.reach||0,web:G.webCount,blocks:G.blocks.size,time:+G.time.toFixed(0),evf:Object.keys(G.evf||{}).length};},snaps[id]);console.log('v33 save',id,JSON.stringify(r));}
 const rt=await p.evaluate(()=>{startMission('ember');skipDlg();skipDlg();G.story.s='main';G.story.hold=false;for(let k=0;k<30*5;k++)step(STEP);const ev=Object.keys(G.evf);const S=JSON.stringify(snapGame());startMission('landfall');skipDlg();applySave(JSON.parse(S));return {before:ev,after:Object.keys(G.evf),mapv:G.mapv,reach:G.reach,biome:G.biome};});
 console.log('v34 round trip',JSON.stringify(rt));
 const restart=await p.evaluate(()=>{startMission('ember');skipDlg();skipDlg();return Object.keys(G.evf).length;});console.log('restart clears events',restart===0);
 console.log('errors',errs);await br.close();})();
