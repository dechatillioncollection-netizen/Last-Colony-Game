// v38 energy scene: Sap Burners fed by a coal tap, one with no coal, a group round a Splitter Bulb; Sunleaves alone, in a cluster and
// beside a burner; a Spore Bellows next to a Rootweb Node that is still spreading (boosting it), and one with nothing to boost.
// Same layout in each build. Writes shots38/scene_<tag>_z<zoom>[_part].png and shots38/scene_<tag>.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||'previous/index.html:before,index.html:after').split(',').map(s=>s.split(':'));
const ZOOMS=(process.env.ZOOMS||'0.6,1,2.5').split(',').map(Number);
const SECS=+(process.env.SECS||8);
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots38',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1500,height:900},deviceScaleFactor:+(process.env.DSF||1)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);
  if(process.env.QUALITY)await p.evaluate(q=>applyQuality(q),process.env.QUALITY);
  if(process.env.ART==='off')await p.evaluate(()=>{SET.art=false;});
  const r=await p.evaluate(SECS=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+7,Y=G.core.y-9,W=30,H=22;
   for(let y=Y-1;y<Y+H;y++)for(let x=X-1;x<X+W;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
   const L={};const put=(t,x,y,r,label)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(label)L[label]=b;}return b;};
   // row 1: a Sap Burner fed by vine from a coal tap; one with no coal; three round a Splitter Bulb fed by another coal tap; one kept stocked
   ore(1,1,COAL);put('drill',1,1,0,'coal tap');put('conveyor',3,2,0);put('conveyor',4,2,0);put('combustion',5,2,0,'burner fed');
   put('combustion',8,2,0,'burner idle');
   ore(11,1,COAL);put('drill',11,1,0);put('conveyor',13,2,0);put('router',14,2);put('combustion',15,2,0,'burner group');put('combustion',14,1,0);put('combustion',14,3,0);
   put('combustion',18,2,0,'burner stocked');
   // row 2: Sunleaves: one alone, a cluster of eight, one beside a Sap Burner
   put('solar',1,6,0,'leaf');for(let k=0;k<8;k++)put('solar',4+k%4,6+(k>>2),0,k?null:'leaf cluster');put('solar',11,6,0,'leaf beside');put('combustion',12,6,0,'burner beside');
   // row 3: a Spore Bellows beside a Rootweb Node on bare ground (the node is still spreading, so the Bellows doubles it)
   for(let y=9;y<21;y++)for(let x=1;x<20;x++)setWeb((Y+y)*MW+X+x,0);
   put('bellows',3,13,0,'bellows active');setWeb((Y+14)*MW+X+8,1);put('node',8,14,0,'node');
   // and one far from anything still growing
   put('bellows',23,8,0,'bellows idle');
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   for(const b of [L['burner stocked'],L['burner beside']])if(b)b.inv[COAL]=10;
   cam.z=1;centerOn(X+14,Y+10);
   for(let k=0;k<SECS*30;k++){step(1/30);if(k%2===0)render();}
   const state={};for(const [l,b] of Object.entries(L))state[l]={t:b.t,burn:b.burn!=null?+b.burn.toFixed(3):null,inv:b.inv?b.inv.slice():null,wi:b.wi||0};
   window.__scene=[X,Y];msgEl.style.display='none';return {at:[X,Y],state,powSat:G.powSat,powGen:G.powGen,powUse:G.powUse,webCount:G.webCount};},SECS);
  for(const z of ZOOMS){await p.evaluate(z=>{const [X,Y]=window.__scene;cam.z=z;centerOn(X+14,Y+10);},z);
   if(z>2){for(const [nm,cx,cy] of [['burners',9,2.5],['leaves',7,7],['bellows',7,15]]){await p.evaluate(([cx,cy])=>{const [X,Y]=window.__scene;centerOn(X+cx,Y+cy);},[cx,cy]);await p.waitForTimeout(300);await p.screenshot({path:`shots38/scene_${tag}_z${z}_${nm}.png`});}}
   else{await p.waitForTimeout(300);await p.screenshot({path:`shots38/scene_${tag}_z${z}.png`});}}
  fs.writeFileSync('shots38/scene_'+tag+'.json',JSON.stringify(r,null,1));console.log(tag,'powSat',r.powSat,r.powGen,r.powUse,'web',r.webCount,'errors',errs);await p.close();}
 await br.close();})();
