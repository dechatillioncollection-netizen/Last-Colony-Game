// v44 responsiveness: the time for one wheel step during a long (41-tile) vine drag to turn the line and redraw the frame (the plan is rebuilt
// on the same frame), against a frame with nothing changing; and a plain hover rotation. Headless Chromium, 1280x800.
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});
 await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','medium');}catch(e){}});
 await p.goto('http://localhost:8123/lc2_index.html');await p.waitForTimeout(1200);
 const r=await p.evaluate(()=>{window.requestAnimationFrame=()=>0;let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);
   for(let i=0;i<N;i++)G.web[i]=G.terrain[i]===ROCK||G.terrain[i]===WATER?0:1;for(let k=0;k<300;k++)step(1/30);cam.z=1;centerOn(G.core.x+1.5,G.core.y+1.5);const fl=()=>ctx.getImageData(0,0,1,1);
   setTool('conveyor');mouse.in=true;mouse.x=VW/2+420;mouse.y=VH/2+60;mouse.down={x:VW/2-420,y:VH/2-60,b:0,type:'mouse',cam:[cam.x,cam.y],moved:true,w:s2w(VW/2-420,VH/2-60)};
   const med=f=>{for(let k=0;k<10;k++){f();render();fl();}const T=[];for(let k=0;k<60;k++){const t=performance.now();f();render();fl();T.push(performance.now()-t);}T.sort((a,b)=>a-b);return {med:+T[30].toFixed(2),p90:+T[54].toFixed(2)};};
   const tiles=curPlan('conveyor',mouse.down,placeOrigin('conveyor',...s2w(mouse.x,mouse.y))).rows.length;
   const still=med(()=>{}),turn=med(()=>rotateTool(1));mouse.down=null;mouse.x=VW/2;mouse.y=VH/2;const hover=med(()=>rotateTool(1));return {tiles,still,turn,hover};});
 console.log(JSON.stringify(r));require('fs').writeFileSync('perf44.json',JSON.stringify(r,null,1));await br.close();})();
