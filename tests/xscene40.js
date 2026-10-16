// v40 wall scene: each wall alone at full health; the three side by side; lines of Bark Wall and Ironbark, a mixed line running
// into a Great Bark and a Petal Gate, an L-shaped corner and a two-deep block; and each wall at 80%, 50% and 20% health.
// Same layout in each build. Writes shots40/scene_<tag>_z<zoom>[_part].png and shots40/scene_<tag>.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||'previous/index.html:before,index.html:after').split(',').map(s=>s.split(':'));
const ZOOMS=(process.env.ZOOMS||'0.6,1,2.5').split(',').map(Number);
const SECS=+(process.env.SECS||3);
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots40',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1500,height:900},deviceScaleFactor:+(process.env.DSF||1)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);
  if(process.env.QUALITY)await p.evaluate(q=>applyQuality(q),process.env.QUALITY);
  if(process.env.ART==='off')await p.evaluate(()=>{SET.art=false;});
  const r=await p.evaluate(SECS=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+7,Y=G.core.y-9,W=30,H=22;
   for(let y=Y-1;y<Y+H;y++)for(let x=X-1;x<X+W;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const L={};const put=(t,x,y,label)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(label)L[label]=b;}return b;};
   // row 1: each alone, then the three side by side
   put('wall',1,1,'bark alone');put('twall',4,1,'iron alone');put('wallL',7,1,'great alone');
   put('wall',12,1,'trio bark');put('twall',13,1);put('wallL',14,1);
   // row 2: a line of Bark Wall, a line of Ironbark, a mixed line into a Great Bark and a Petal Gate
   for(let k=0;k<6;k++)put('wall',1+k,5,k?null:'bark line');for(let k=0;k<6;k++)put('twall',9+k,5,k?null:'iron line');
   put('wall',17,5,'mixed');put('twall',18,5);put('wall',19,5);put('wallL',20,4);put('wall',22,5);put('door',23,5);put('twall',24,5);
   // row 3: an L corner of Bark Wall and a two-deep block of all three
   for(let k=0;k<5;k++)put('wall',1+k,9);for(let k=1;k<4;k++)put('wall',1,9+k);
   put('wallL',8,9,'block');put('wallL',10,9);put('twall',12,9);put('twall',12,10);put('wall',8,11);put('wall',9,11);put('twall',10,11);put('wall',11,11);put('wall',12,11);
   // row 4: hurt: each at 80%, 50% and 20% of its health
   [['wall',1],['twall',8],['wallL',15]].forEach(([t,x0])=>{[.8,.5,.2].forEach((f,i)=>{const b=put(t,x0+i*(t==='wallL'?3:2),15,t+' '+Math.round(f*100));if(b)b.hp=b.max*f;});});
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   cam.z=1;centerOn(X+13,Y+9);
   for(let k=0;k<SECS*30;k++){step(1/30);if(k%2===0)render();}
   const state={};for(const [l,b] of Object.entries(L))state[l]={t:b.t,hp:+b.hp.toFixed(2),max:b.max};
   window.__scene=[X,Y];msgEl.style.display='none';return {at:[X,Y],state,blocks:G.blocks.size};},SECS);
  for(const z of ZOOMS){await p.evaluate(z=>{const [X,Y]=window.__scene;cam.z=z;centerOn(X+13,Y+9);},z);
   if(z>2){for(const [nm,cx,cy] of [['alone',8.5,2],['lines',12.5,5.5],['mixed',21,5.5],['block',7,11],['hurt',11,16]]){await p.evaluate(([cx,cy])=>{const [X,Y]=window.__scene;centerOn(X+cx,Y+cy);},[cx,cy]);await p.waitForTimeout(300);await p.screenshot({path:`shots40/scene_${tag}_z${z}_${nm}.png`});}}
   else{await p.waitForTimeout(300);await p.screenshot({path:`shots40/scene_${tag}_z${z}.png`});}}
  fs.writeFileSync('shots40/scene_'+tag+'.json',JSON.stringify(r,null,1));console.log(tag,'blocks',r.blocks,'errors',errs);await p.close();}
 await br.close();})();
