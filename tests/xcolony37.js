// v37 combined colony: the painted Root Taps, Deep Root and Chitin Vat working beside the Bloom, Thorn Spitters, Resin Gland,
// Spawning Pod, Splitter Bulb, Rootweb Node and vines. Writes shots37/colony_<tag>_z<zoom>.png.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||'previous/index.html:before,index.html:after').split(',').map(s=>s.split(':'));
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots37',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1500,height:900},deviceScaleFactor:2});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.setItem('lc_quality','high');localStorage.setItem('lc_fog','0');}catch(e){}});
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);await p.evaluate(()=>applyQuality('high'));
  const r=await p.evaluate(()=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+3000);G.webFree=true;
   const cx=G.core.x,cy=G.core.y;
   for(let y=cy-9;y<cy+10;y++)for(let x=cx-12;x<cx+14;x++){const i=y*MW+x;if(blockAt(x,y))continue;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
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
   put('nest',-2,5);put('node',10,-1);
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();G.paused=true;
   cam.z=1;centerOn(cx+1.5,cy+.5);
   for(let k=0;k<30*45;k++){step(1/30);if(k%2===0)render();}
   let g=0;while(typeof webQ!=='undefined'&&(webQ.size||webBorn.size)&&g++<800)webArtTick();
   msgEl.style.display='none';
   const kinds={};for(const b of G.blocks.values())kinds[b.t]=(kinds[b.t]||0)+1;return {kinds,items:G.items,cx,cy};});
  for(const z of [1,1.6]){await p.evaluate(([z,cx,cy])=>{cam.z=z;centerOn(cx+1.5,cy+.5);},[z,r.cx,r.cy]);await p.waitForTimeout(700);await p.screenshot({path:`shots37/colony_${tag}_z${z}.png`});}
  console.log(tag,JSON.stringify(r.kinds),'errors',errs);await p.close();}
 await br.close();})();
