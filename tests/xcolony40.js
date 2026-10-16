// v40 established colony: the v38 colony (taps, Chitin Vat, Bloom, Thorn Spitters, Resin Gland, Spawning Pod, Splitter Bulb, Sap Burners,
// Sunleaves, Spore Bellows, vines) walled in: Bark Wall runs with Great Bark corners, an Ironbark front with a Petal Gate, and Healing Pods.
// A real wave then hits the walls. Writes shots40/colony_<tag>_z<zoom>.png.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||'previous/index.html:before,index.html:after').split(',').map(s=>s.split(':'));
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots40',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1500,height:900},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('lc_quality','high');localStorage.setItem('lc_fog','0');}catch(e){}});
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);await p.evaluate(()=>applyQuality('high'));
  const r=await p.evaluate(()=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+3000);G.webFree=true;
   const cx=G.core.x,cy=G.core.y;
   for(let y=cy-11;y<cy+12;y++)for(let x=cx-15;x<cx+17;x++){const i=y*MW+x;if(blockAt(x,y))continue;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const ore=(x,y,it)=>{for(let yy=cy+y;yy<cy+y+2;yy++)for(let xx=cx+x;xx<cx+x+2;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
   const put=(t,x,y,r)=>{tryPlace(t,cx+x,cy+y,r||0,true);};
   // copper and lead north of the Bloom, into one vine down into it
   ore(-3,-6,CU);put('drill',-3,-6);put('conveyor',-1,-5,0);for(let y=-5;y<0;y++)put('conveyor',0,y,1);ore(1,-6,PB);put('drill',1,-6);
   // titanium from a Deep Root to the east, along a Swift Vine
   ore(5,0,TI);put('pdrill',5,0);put('tconveyor',4,1,2);put('tconveyor',3,1,2);
   // coal and sand feeding a Chitin Vat to the west, chitin out by vine into the Bloom, Sunleaves for its vigor
   put('smelter',-6,0);ore(-6,-2,COAL);put('drill',-6,-2);ore(-8,0,SAND);put('drill',-8,0);for(let x=-4;x<0;x++)put('conveyor',x,1,0);
   for(let x=-9;x<-3;x++)put('solar',x,3);
   // a second copper tap feeding two Thorn Spitters through a Splitter Bulb
   ore(7,-5,CU);put('drill',7,-5);put('conveyor',6,-4,2);put('router',5,-4);put('duo',5,-5);put('duo',5,-3);put('conveyor',4,-4,2);put('duo',3,-4);
   // a Resin Gland fed by a coal tap, a Spawning Pod, a Rootweb Node
   ore(7,4,COAL);put('drill',7,4);put('press',4,4);put('conveyor',6,5,2);
   put('nest',-2,5);
   // Sap Burners on a coal tap (one beside it, one along a vine) and a Spore Bellows beside the Rootweb Node, whose ground is still bare
   ore(-10,-5,COAL);put('drill',-10,-5);put('combustion',-8,-5);put('conveyor',-8,-4,0);put('combustion',-7,-4);
   for(let y=-6;y<6;y++)for(let x=9;x<14;x++)if(!blockAt(cx+x,cy+y))setWeb((cy+y)*MW+cx+x,0);setWeb((cy-1)*MW+cx+10,1);put('bellows',11,1);
   // the walls: a ring two tiles outside the colony, Great Bark at the corners, the side facing the spawn in Ironbark with a gate
   const sx=G.spawn.x-cx,sy=G.spawn.y-cy,face=Math.abs(sx)>Math.abs(sy)?(sx>0?'e':'w'):(sy>0?'s':'n');
   const x0=-14,x1=15,y0=-10,y1=10;
   for(const [qx,qy] of [[x0,y0],[x1-1,y0],[x0,y1-1],[x1-1,y1-1]])put('wallL',qx,qy);
   for(let x=x0+2;x<x1-1;x++){put(face==='n'?'twall':'wall',x,y0);put(face==='s'?'twall':'wall',x,y1);}
   for(let y=y0+2;y<y1-1;y++){put(face==='w'?'twall':'wall',x0,y);put(face==='e'?'twall':'wall',x1,y);}
   {const g=face==='n'?[0,y0]:face==='s'?[0,y1]:face==='w'?[x0,0]:[x1,0];const b=blockAt(cx+g[0],cy+g[1]);if(b)removeBlock(b);put('door',g[0],g[1]);}
   put('mender',-11,-7);put('mender',-11,7);
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();G.paused=true;
   cam.z=1;centerOn(cx+1.5,cy+.5);
   for(let k=0;k<30*45;k++){step(1/30);if(k%2===0)render();if(k===30*41){put('node',10,-1);const n=blockAt(cx+10,cy-1);if(n)n.built=1;G.dirty=true;recompute();}}
   G.countdown=2;const hurtN=()=>[...G.blocks.values()].filter(b=>(b.t==='wall'||b.t==='twall'||b.t==='wallL')&&b.hp<b.max*.85).length;
   for(let k=0;k<30*150;k++){step(1/30);if(k%2===0)render();if(k>30*50&&hurtN()>=3)break;}
   for(let k=0;k<30*1.5;k++){step(1/30);render();}
   msgEl.style.display='none';
   const kinds={};for(const b of G.blocks.values())kinds[b.t]=(kinds[b.t]||0)+1;const hurt=[...G.blocks.values()].filter(b=>(b.t==='wall'||b.t==='twall'||b.t==='wallL')&&b.hp<b.max).length;return {kinds,items:G.items,cx,cy,hurt,enemies:G.enemies.length};});
  for(const z of [.7,1,1.6]){await p.evaluate(([z,cx,cy])=>{cam.z=z;centerOn(cx+1.5,cy+.5);},[z,r.cx,r.cy]);await p.waitForTimeout(700);await p.screenshot({path:`shots40/colony_${tag}_z${z}.png`});}
  console.log(tag,JSON.stringify(r.kinds),'walls hurt',r.hurt,'enemies',r.enemies,'errors',errs);await p.close();}
 await br.close();})();
