const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const errs=[];
 async function page(hd,art){const p=await b.newPage({viewport:{width:1100,height:700}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()!=='log')errs.push(m.type()+': '+m.text())});
  await p.addInitScript(([hd,art])=>{try{localStorage.setItem('lc_hd',hd);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',art)}catch(e){}},[hd,art]);
  await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(800);return p;}
 const setup=async(p)=>p.evaluate(()=>{startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+5000);G.unlocked.add('nest');
   const cx=G.core.x,cy=G.core.y;const pl=[];for(const [x,y] of [[cx+4,cy-1],[cx+4,cy+2],[cx-4,cy-1],[cx+7,cy-1]])pl.push(tryPlace('nest',x,y,0,true));
   for(let k=0;k<30*8;k++)step(1/30);const ns=[...G.blocks.values()].filter(b=>b.t==='nest');
   ns[0].prog=.85;ns[1].built=.5;
   cam.z=2.4;centerOn(cx+5,cy+1);
   return {placed:pl,nests:ns.length,state:ART.plant.nest.state,lite:artLite};});
 for(const [hd,art,name] of [['1','1','art_hd_on'],['1','0','art_hd_off'],['0','1','art_cl_on']]){
  const p=await page(hd,art);console.log(name,JSON.stringify(await setup(p)));await p.waitForTimeout(300);await p.screenshot({path:name+'.png'});
  if(name==='art_hd_on'){await p.waitForTimeout(1500);await p.screenshot({path:'art_hd_on2.png'});
   await p.evaluate(()=>{cam.z=1;centerOn(window.__game().core.x,window.__game().core.y);});await p.waitForTimeout(300);await p.screenshot({path:'art_z1.png'});
   // perf: 120 pods
   const r=await p.evaluate(()=>{const G=window.__game();let n=0;for(let y=4;y<MH-4&&n<120;y+=3)for(let x=4;x<MW-4&&n<120;x+=3)if(tryPlace('nest',x,y,0,true))n++;
     for(const b of G.blocks.values())b.built=1;cam.z=1;centerOn(G.core.x,G.core.y);
     const ms=()=>{const t=performance.now();for(let k=0;k<30;k++)render();return +((performance.now()-t)/30).toFixed(2)};
     const res={placed:n};SET.art=true;res.artOn=ms();res.lite=artLite;res.drawn=artDrawn;SET.art=false;res.artOff=ms();SET.art=true;
     cam.z=2.4;res.zoomInOn=ms();res.liteZoomed=artLite;res.drawnZoomed=artDrawn;SET.art=false;res.zoomInOff=ms();SET.art=true;return res;});
   console.log('perf',JSON.stringify(r));await p.screenshot({path:'art_crowd.png'});
   console.log('menu icon',await p.evaluate(()=>{selectTab(catOf('nest'));return !!document.querySelector('#mgrid canvas');}));
   await p.screenshot({path:'art_menu.png'});}
  await p.close();}
 // fallback: a missing layer
 const fs=require('fs');fs.renameSync('art/plant/seed-pod/glass.png','art/plant/seed-pod/glass.bak');
 try{const p=await page('1','1');console.log('fallback',JSON.stringify(await setup(p)));await p.waitForTimeout(300);await p.screenshot({path:'art_fallback.png'});await p.close();}
 finally{fs.renameSync('art/plant/seed-pod/glass.bak','art/plant/seed-pod/glass.png');}
 console.log('errs',errs);await b.close();})();
