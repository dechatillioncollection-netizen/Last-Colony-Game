const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const errs=[];
 async function page(hd,art){const p=await b.newPage({viewport:{width:1000,height:700}});p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()!=='log')errs.push(m.type()+': '+m.text())});
  await p.addInitScript(([hd,art])=>{try{localStorage.setItem('lc_hd',hd);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',art)}catch(e){}},[hd,art]);
  await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);return p;}
 const setup=(p,z)=>p.evaluate((z)=>{Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+5000);
   const cx=G.core.x,cy=G.core.y;tryPlace('nest',cx+4,cy,0,true);tryPlace('wall',cx-2,cy+1,0,true);tryPlace('wall',cx+1,cy-2,0,true);
   for(const [x,y,r] of [[cx+3,cy+1,2],[cx+3,cy+2,2]])tryPlace('conveyor',x,y,r,true);
   for(let k=0;k<30*4;k++)step(1/30);cam.z=z;centerOn(cx+1.5,cy+1.5);
   return {core:[cx,cy,G.core.size],state:ART.plant.core.state,hp:G.core.hp};},z);
 const shots={};
 for(const [hd,art,tag] of [['1','0','before'],['1','1','after'],['0','1','classic']]){const p=await page(hd,art);
   for(const z of [2.4,1,.6]){const r=await setup(p,z);await p.waitForTimeout(250);const f=`bl_${tag}_${z}.png`;await p.screenshot({path:f});if(z===2.4)console.log(tag,JSON.stringify(r));}
   if(tag==='after'){await setup(p,2.4);await p.waitForTimeout(200);await p.screenshot({path:'bl_anim_a.png'});await p.waitForTimeout(2500);await p.screenshot({path:'bl_anim_b.png'});
     await p.evaluate(()=>{const G=window.__game();G.core.hp=G.core.max*.25;G.core.hit=0;});await p.waitForTimeout(200);await p.screenshot({path:'bl_hurt.png'});
     // crowd: 100 pods must not simplify the Bloom
     const r=await p.evaluate(()=>{const G=window.__game();G.core.hp=G.core.max;const cx=G.core.x,cy=G.core.y;let n=0;for(let dy=-14;dy<=14;dy+=2)for(let dx=-22;dx<=22;dx+=2)if(n<100&&tryPlace('nest',cx+dx,cy+dy,0,true))n++;
       for(const b of G.blocks.values())b.built=1;cam.z=1;centerOn(cx+1.5,cy+1.5);render();return {pods:n,podsCheap:artLite};});
     console.log('crowd',JSON.stringify(r));await p.waitForTimeout(200);await p.screenshot({path:'bl_crowd.png'});}
   await p.close();}
 const fs=require('fs');fs.renameSync('art/plant/bloom/collar.png','art/plant/bloom/collar.bak');
 try{const p=await page('1','1');console.log('fallback',JSON.stringify(await setup(p,2.4)),await p.evaluate(()=>ART.plant.nest.state));await p.waitForTimeout(250);await p.screenshot({path:'bl_fallback.png'});await p.close();}
 finally{fs.renameSync('art/plant/bloom/collar.bak','art/plant/bloom/collar.png');}
 console.log('errs',errs);await b.close();})();
