// v35 connection scene: every vessel-to-structure case side by side, the same layout in two builds. Writes shots35/conn_<tag>.png and a transfer table.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const BUILDS=(process.env.BUILDS||''+(process.env.OLD||'previous/index.html')+':before,index.html:after').split(',').map(s=>s.split(':'));
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots35',{recursive:true});
 for(const [u,tag] of BUILDS){const p=await br.newPage({viewport:{width:1700,height:1000}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1500);
  const r=await p.evaluate(()=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+6,Y=G.core.y-8,W=34,H=20;
   for(let y=Y-1;y<Y+H;y++)for(let x=X-1;x<X+W;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;}
   const ore=(x,y,w,h,it)=>{for(let yy=Y+y;yy<Y+y+h;yy++)for(let xx=X+x;xx<X+x+w;xx++)G.ore[yy*MW+xx]=it;};
   for(let y=Y-1;y<Y+H;y++)for(let x=X-1;x<X+W;x++)setWeb(y*MW+x,1);
   const P=[];const put=(t,x,y,r,label)=>{const ok=tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b&&b.t===t){b.built=1;if(label)P.push([label,b.id]);}return ok;};
   // A: Root Tap, a vine leaving from each side (top-left and bottom-right tiles of the edges)
   ore(2,2,2,2,CU);window.__why=placeCheck('drill',X+2,Y+2);put('drill',2,2);put('conveyor',2,1,3,'tap top');put('conveyor',4,3,0,'tap right');put('conveyor',3,4,1,'tap bottom');put('conveyor',1,2,2,'tap left');
   // B: a vine running past a Root Tap's side (side feed), and one pointing into a Root Tap (dead end)
   ore(9,2,2,2,CU);put('drill',9,2);for(let k=4;k>=0;k--)put('conveyor',11,k,3,k===2?'past tap':null);put('conveyor',8,2,0,'into tap');
   // C: Resin Gland fed by a vine, a vine leaving it; a vine into a wall; two vines head-on
   ore(15,1,1,1,COAL);put('press',15,2);put('conveyor',14,2,0,'into gland');put('conveyor',17,3,0,'out of gland');put('wall',20,2);put('conveyor',19,2,0,'into wall');
   put('conveyor',22,2,0,'head-on A');put('conveyor',23,2,2,'head-on B');
   // D: Splitter Bulb: in from the left, out up/right/down via corners; a Node beside a second bulb
   put('conveyor',1,9,0,'bulb in');put('router',2,9);put('conveyor',2,8,3,'bulb up');put('conveyor',3,9,0,'bulb right');put('conveyor',2,10,1,'bulb down');put('conveyor',2,7,0,'bulb up turn');
   put('router',7,9);put('node',8,9);put('conveyor',6,9,0,'into bulb2');put('conveyor',7,10,1,'bulb2 out');
   // E: Sorting Gland, vine in and three out
   put('conveyor',11,9,0,'sorter in');put('sorter',12,9);put('conveyor',13,9,0,'sorter straight');put('conveyor',12,8,3,'sorter up');put('conveyor',12,10,1,'sorter down');
   // F: T-junction and Vine Knot crossing; Swift Vine into a Vine
   for(let k=16;k<=21;k++)put('conveyor',k,9,0,k===18?'T main':null);put('conveyor',18,7,1);put('conveyor',18,8,1,'T branch');
   put('conveyor',24,9,0);put('junction',25,9);put('conveyor',26,9,0,'knot out');put('conveyor',25,7,1);put('conveyor',25,8,1);put('conveyor',25,10,1,'knot down');
   put('tconveyor',28,9,0,'swift');put('conveyor',29,9,0,'swift into vine');
   // G: Deep Root (titanium) with a Swift Vine out of it, and a Sap Burner fed by a vine; a vine starting at a Spawning Pod
   ore(2,14,2,2,TI);put('pdrill',2,14);put('tconveyor',4,15,0,'swift out of deep root');put('tconveyor',5,15,0);
   put('conveyor',8,15,0,'into burner');put('combustion',9,15);
   put('nest',13,14);put('conveyor',15,14,0,'from pod');put('conveyor',12,15,0,'into pod');
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   // feed the inputs, run a while
   const feedIn=['bulb in','sorter in','into gland','into wall','head-on A','head-on B','into bulb2','T main','swift','into burner','into pod','knot out'];
   const byL=Object.fromEntries(P.map(([l,id])=>[l,G.blocks.get(id)]));
   const seen={};for(const [l] of P)seen[l]=0;
   for(let k=0;k<30*25;k++){if(k%15===0){const it=k%30?CU:COAL;for(const l of ['bulb in','sorter in','into gland','T main','swift','into burner','into wall','head-on A','head-on B','into bulb2'])if(byL[l]&&byL[l].belt.length<2)handle(byL[l],l==='into gland'||l==='into burner'?COAL:it,null);
     const t=G.blocks.get([...G.blocks.values()].find(b=>b.x===X+18&&b.y===Y+7)?.id);if(t&&t.belt.length<2)handle(t,PB,null);const t2=blockAt(X+25,Y+7);if(t2&&t2.belt.length<2)handle(t2,PB,null);}
     step(1/30);for(const [l,b] of Object.entries(byL))if(b&&b.belt&&b.belt.length)seen[l]++;}
   G.paused=true;cam.z=1.75;centerOn(X+15,Y+8.5);
   const ends={};for(const [l,b] of Object.entries(byL)){if(!b||!b.belt)continue;const st={};try{vineEnds(b,st);}catch(e){}ends[l]={fe:st.fe,be:st.be,side:b._st||0,curve:b._cv||0,cm:b._cm||0,carried:seen[l]>0};}
   return {at:[X,Y],why:window.__why,ends};});
  await p.waitForTimeout(1500);await p.screenshot({path:'shots35/conn_'+tag+'.png'});
  fs.writeFileSync('shots35/conn_'+tag+'.json',JSON.stringify(r,null,1));console.log(tag,'errors',errs);await p.close();}
 await br.close();})();
