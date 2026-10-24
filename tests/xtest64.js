// v64: the painted ground. The ground and ore are painted once, before play, from brush shapes traced from smooth fields, into
// chunk canvases that each frame only copies. Checks the brief's list: campaign sectors get their own painted ground, random maps
// are painted before the first step, nothing is painted again during play, the picture stays put, the painted regions agree with the
// tiles the game plays on, tile edges no longer show, ore reads by type, every zoom and preset, bake times, frame cost against v63,
// and that the game itself is untouched (terrain, ore, placement, a seeded match, saves both ways) against v63.
// Run with a web server on the repo root (port 8123). OLD names the v63 page (default _v63.html), SHOTS the screenshot folder.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v63.html',SHOTS=process.env.SHOTS||'shots64';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,file,o={})=>{const ctx=await br.newContext({viewport:{width:1280,height:800}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(([q,gl])=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_splash','0');if(gl)localStorage.setItem('lc_gl','2');}catch(e){}},[o.q||'high',!!o.gl]);
  await p.goto(URL+file);await p.waitForTimeout(1200);
  await p.evaluate(()=>{window.T64={
    // a fingerprint of every chunk (every 5th pixel)
    sum(){let h=2166136261;for(const q of PG.ch){const d=q.cv.getContext('2d').getImageData(0,0,q.w,q.h).data;for(let i=0;i<d.length;i+=20){h^=d[i]|d[i+1]<<8|d[i+2]<<16;h=Math.imul(h,16777619);}}return h>>>0;},
    // the ground at a world point in tiles, as baked
    px(x,y){const R=PG.R;for(const q of PG.ch){const X=x*R,Y=y*R;if(X>=q.x0&&X<q.x1&&Y>=q.y0&&Y<q.y1){return [...q.cv.getContext('2d').getImageData(Math.floor(X-q.ox),Math.floor(Y-q.oy),1,1).data].slice(0,3);}}return null;},
    // how many tiles' centres and inner points fall on the right side of a layer's outline
    agree(L,inSet){const S=4,c=document.createElement('canvas').getContext('2d'),p=new Path2D(),C=L.ct;
      for(let k=0;k<C.length;){const m=C[k],e=k+5+m*2;p.moveTo(C[k+5]*S,C[k+6]*S);for(let j=k+7;j<e;j+=2)p.lineTo(C[j]*S,C[j+1]*S);p.closePath();k=e;}
      let n=0,bad=0,badIn=0,nIn=0;
      for(let i=0;i<N;i++){const x=i%MW,y=(i/MW)|0,want=inSet(i);
        for(const [dx,dy] of [[.5,.5],[.25,.5],[.75,.5],[.5,.25],[.5,.75]]){const got=c.isPointInPath(p,(x+dx)*S,(y+dy)*S);n++;if(got!==want){bad++;if(dx===.5&&dy===.5)badIn++;}if(dx===.5&&dy===.5)nIn++;}}
      return {n,bad,centres:nIn,badCentres:badIn};},
    hold(){window.render0=window.render0||render;G.paused=true;}};});
  return p;};

(async()=>{const br=await chromium.launch();

 // ---- 1. campaign sectors: their own palette and their own painted ground
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{const out={};const want={landfall:'meadow',ember:'ash',kilo:'pass',frost:'frost',last:'colony'};
    for(const id in want){startMission(id);const m=MIS[id],P=pgPlan();
      // a painted landmark: the mean colour over a blob of the sector's own paint, with and without its paint
      const b=m.paint.find(o=>{if(o[0]!=='blob')return false;const i=Math.floor(o[3])*MW+Math.floor(o[2]);return G.terrain[i]===FLOOR&&G.ore[i]<0;});const at=()=>{let s=[0,0,0];for(let k=0;k<9;k++){const v=T64.px(b[2]+(k%3-1)*.6,b[3]+((k/3|0)-1)*.6);s=s.map((a,i)=>a+v[i]);}return s.map(a=>a/9);};
      const a=at();const keep=m.paint;m.paint=[];pgBake();const z=at();m.paint=keep;pgBake();
      out[id]={pal:PG.pal,want:want[id],chunks:PG.ch.length,layers:P.L.length,paint:m.paint.length,diff:Math.round(Math.abs(a[0]-z[0])+Math.abs(a[1]-z[1])+Math.abs(a[2]-z[2]))};}
    return out;});
  for(const id in r)ok(`campaign ${id}: painted with its ${r[id].want} palette, its own paint changes the ground`,r[id].pal===r[id].want&&r[id].chunks>0&&r[id].paint>0&&r[id].diff>6,JSON.stringify(r[id]));
  ok('campaign: no errors',!p.errs.length,p.errs[0]||'');await p.close();}

 // ---- 2-4. random maps: painted before the first step, never again during play, and the picture stays the same
 {const p=await open(br,NEW);
  for(const mode of ['survival','siege','range']){
   const r=await p.evaluate(mode=>{let calls=0,steps=0;const OC=pgChunk,OS=step;window.pgChunk=function(...a){calls++;return OC.apply(this,a);};
     const n0=PG.n;let atFirstStep=null;window.step=function(...a){if(atFirstStep===null)atFirstStep={n:PG.n,ch:PG.ch.length,calls};steps++;return OS.apply(this,a);};
     try{if(mode==='range')startTestRange();else startGame(mode);}catch(e){window.pgChunk=OC;window.step=OS;return {err:String(e)};}
     const before=T64.sum(),bakes=PG.n-n0,callsAtStart=calls;
     // two minutes of play, drawn every other step, at three zooms
     for(let i=0;i<3600;i++){OS(STEP);if(i%2===0){cam.z=[.6,1,2.2][(i/600|0)%3];render();}}
     const after=T64.sum();window.pgChunk=OC;window.step=OS;
     return {bakes,callsAtStart,callsInPlay:calls-callsAtStart,firstStep:atFirstStep,same:before===after,ms:Math.round(PG.ms),MW};},mode);
   if(r.err){ok(`${mode}: starts`,false,r.err);continue;}
   ok(`${mode}: the ground is painted before the first step`,r.bakes>=1&&r.callsAtStart>0&&(!r.firstStep||r.firstStep.ch>0),JSON.stringify(r));
   ok(`${mode}: nothing painted again in two minutes of play`,r.callsInPlay===0);
   ok(`${mode}: the painted ground is unchanged after play`,r.same);}
  ok('random maps: no errors',!p.errs.length,p.errs[0]||'');await p.close();}

 // ---- 5 and 20. the painted regions agree with the tiles: every rock, water, sand and ore tile's centre inside its region, every
 // other tile's centre outside, and points a quarter tile in from each side too (so outlines stay in the outer quarter of a tile)
 {const p=await open(br,NEW);
  for(const m of ['landfall','frost','last','survival','siege']){
   const r=await p.evaluate(m=>{if(MIS[m])startMission(m);else startGame(m);const P=pgPlan(),t=G.terrain,o=G.ore,out={};
     const dec=mapDecor()||[],prop=new Uint8Array(N);for(const d of dec)if(d[0]==='prop'&&PROP_SOLID[d[1]])for(let y=d[3];y<d[3]+(d[5]||1);y++)for(let x=d[2];x<d[2]+(d[4]||1);x++)if(inMap(x,y))prop[y*MW+x]=1;
     out.rock=T64.agree(P.rock,i=>t[i]===ROCK&&!prop[i]);out.water=P.wat.ct?T64.agree(P.wat,i=>t[i]===WATER):null;out.sand=P.sand.ct?T64.agree(P.sand,i=>t[i]===SANDF):null;
     for(const O of P.oreL)out['ore'+O.o]=T64.agree(O.bd,i=>o[i]===O.o);return out;},m);
   for(const k in r){if(!r[k])continue;const v=r[k];ok(`${m} ${k}: every tile centre on the right side, ${(100-v.bad/v.n*100).toFixed(2)}% of all test points`,v.badCentres===0&&v.bad/v.n<.01,JSON.stringify(v));}}
  await p.close();}

 // ---- 6-9. the look: each biome its own ground, ore readable by type, and no tile grid in the picture
 {const p=await open(br,NEW);
  const r=await p.evaluate(()=>{const out={};
    // mean colour of open ground for each biome
    const ground={};for(const id of ['landfall','ember','frost','last']){startMission(id);let s=[0,0,0],n=0;for(let i=0;i<N;i+=37){if(G.terrain[i]!==FLOOR||G.ore[i]>=0)continue;const v=T64.px(i%MW+.5,(i/MW|0)+.5);s=s.map((a,j)=>a+v[j]);n++;}ground[id]=s.map(a=>Math.round(a/n));}
    out.ground=ground;
    // ore: mean colour over each ore type's tiles, against each other and the ground around
    startGame('survival');const oc={};for(let i=0;i<N;i++){const t=G.ore[i];if(t<0)continue;const v=T64.px(i%MW+.5,(i/MW|0)+.5);(oc[t]=oc[t]||[0,0,0,0]);v.forEach((a,j)=>oc[t][j]+=a);oc[t][3]++;}
    out.ore={};for(const t in oc)out.ore[t]=oc[t].slice(0,3).map(a=>Math.round(a/oc[t][3]));
    // tile grid: the change in colour across tile edges against the change across the middle of tiles, over open ground in a whole chunk
    const grid=[];for(const m of ['survival','landfall']){if(MIS[m])startMission(m);else startGame(m);const q=PG.ch[0],R=PG.R,d=q.cv.getContext('2d').getImageData(0,0,q.w,q.h).data;
      let e=0,mid=0,ne=0,nm=0;for(let y=0;y<q.h;y+=3)for(let x=1;x<q.w;x++){const wx=x+q.ox,f=((wx%R)+R)%R;if(f!==0&&f!==Math.round(R/2))continue;const tx=Math.floor(wx/R),ty=Math.floor((y+q.oy)/R),open=i=>i>=0&&i<N&&G.terrain[i]===FLOOR&&G.ore[i]<0;if(!open(ty*MW+tx)||!open(ty*MW+tx-1))continue;const i=(y*q.w+x)*4,j=i-4,g=Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2]);if(f===0){e+=g;ne++;}else{mid+=g;nm++;}}
      grid.push({m,ratio:+(e/ne/(mid/nm)).toFixed(3)});}
    out.grid=grid;return out;});
  const dist=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);const g=r.ground,ids=Object.keys(g);let minG=1e9;for(const a of ids)for(const b of ids)if(a<b)minG=Math.min(minG,dist(g[a],g[b]));
  ok('each campaign biome has its own ground colour',minG>20,JSON.stringify(g));
  const ot=Object.keys(r.ore);let minO=1e9;for(const a of ot)for(const b of ot)if(a<b)minO=Math.min(minO,dist(r.ore[a],r.ore[b]));
  ok('ore types read apart from each other',ot.length>=3&&minO>30,JSON.stringify(r.ore));
  for(const v of r.grid)ok(`${v.m}: no tile grid in the painted ground (edge to middle change ${v.ratio})`,v.ratio<1.15&&v.ratio>.87);
  await p.close();
  // the same measure on v63, for the record
  const q=await open(br,OLD);const o=await q.evaluate(()=>{startGame('survival');const c=typeof hdCanvas!=='undefined'?hdCanvas:null;if(!c)return null;const R=c.width/MW,d=c.getContext('2d').getImageData(0,0,Math.min(c.width,1000),Math.min(c.height,1000)).data,w=Math.min(c.width,1000),h=Math.min(c.height,1000);
    let e=0,mid=0,ne=0,nm=0;for(let y=0;y<h;y+=3)for(let x=1;x<w;x++){const f=x%R;if(f!==0&&f!==R/2)continue;const i=(y*w+x)*4,j=i-4,g=Math.abs(d[i]-d[j])+Math.abs(d[i+1]-d[j+1])+Math.abs(d[i+2]-d[j+2]);if(f===0){e+=g;ne++;}else{mid+=g;nm++;}}return +(e/ne/(mid/nm)).toFixed(3);});
  console.log('     v63 survival edge to middle change, for comparison:',o);await q.close();}

 // ---- 10. every zoom and preset draws, far zoom uses the half-size copies, and the GPU path takes the chunks as textures
 {for(const q of ['low','medium','high','epic']){const p=await open(br,NEW,{q});
   const r=await p.evaluate(()=>{startMission('landfall');const out={R:PG.R,T,pal:PG.pal};let half=0,full=0;const O=CanvasRenderingContext2D.prototype.drawImage;
     CanvasRenderingContext2D.prototype.drawImage=function(im,...a){if(PG.ch.some(q=>q.half===im))half++;else if(PG.ch.some(q=>q.cv===im))full++;return O.call(this,im,...a);};
     for(const z of [.5,1,2.5]){cam.z=z;centerOn(30,40);render();}CanvasRenderingContext2D.prototype.drawImage=O;out.half=half;out.full=full;return out;});
   ok(`${q}: draws at three zooms from the painted chunks, half-size copies when zoomed out far enough`,(r.half>0)===(.5*r.T/r.R<.55)&&r.full>0&&!p.errs.length,JSON.stringify(r)+(p.errs[0]||''));
   for(const z of [.5,1.4,2.5]){await p.evaluate(z=>{G.paused=true;cam.z=z;centerOn(20,38);render();},z);await p.screenshot({path:`${SHOTS}/landfall_${q}_z${z}.png`});}
   await p.close();}
  const p=await open(br,NEW,{gl:true});const r=await p.evaluate(()=>{startMission('landfall');G.paused=true;cam.z=1;centerOn(30,40);render();render();return {on:!!(GLR&&GLR.on),tex:GLR&&GLR.pgTex?GLR.pgTex.length:0,ch:PG.ch.length};});
  await p.screenshot({path:`${SHOTS}/landfall_gl.png`});
  ok('GPU path: one texture per painted chunk',!r.on||r.tex===r.ch,JSON.stringify(r)+(p.errs[0]||''));await p.close();}

 // ---- 11-12. bake time before play, and the cost of a frame against v63
 {const p=await open(br,NEW);const t={};
  for(const m of ['landfall','ember','frost','kilo','last','survival','siege'])t[m]=await p.evaluate(m=>{if(MIS[m])startMission(m);else startGame(m);return Math.round(PG.ms);},m);
  ok('bake time before play at High under 4 s on every map (software drawing)',Object.values(t).every(v=>v<4000),JSON.stringify(t));await p.close();
  const frame=async file=>{const q=await open(br,file);const r=await q.evaluate(()=>{startGame('survival');G.paused=true;const res=[];for(const z of [.6,1,2]){cam.z=z;centerOn(MW/2,MH/2);for(let i=0;i<10;i++)render();const t0=performance.now();for(let i=0;i<60;i++)render();res.push(+((performance.now()-t0)/60).toFixed(2));}return res;});await q.close();return r;};
  const a=await frame(OLD),b=await frame(NEW);
  ok('a frame costs no more than v63\'s (ms at zoom .6, 1, 2)',b.every((v,k)=>v<=a[k]*1.15+.5),`v63 ${a} v64 ${b}`);}

 // ---- 13. menu, campaign map, a sector and back
 {const p=await open(br,NEW);await p.evaluate(()=>{G&&(G.paused=true);});
  const r=await p.evaluate(async()=>{const w=ms=>new Promise(r=>setTimeout(r,ms));document.getElementById('m-campaign').click();await w(400);startMission('ember');await w(300);try{skipDlg();skipDlg();}catch(e){}for(let i=0;i<300;i++)step(STEP);render();showMenu();await w(400);startGame('survival');for(let i=0;i<300;i++)step(STEP);render();return PG.ch.length;});
  ok('menu, campaign map, a sector, the menu and a random map in a row with no errors',r>0&&!p.errs.length,p.errs[0]||'');await p.close();}

 // ---- 16-19. the game is untouched: terrain, ore, placement, a seeded match and saves both ways, against v63
 {const facts=async file=>{const p=await open(br,file);const r=await p.evaluate(()=>{const out={};const h=a=>{let x=2166136261;for(let i=0;i<a.length;i++){x^=a[i]&255;x=Math.imul(x,16777619);}return x>>>0;};
    for(const id of ['landfall','ember','kilo','frost','last']){startMission(id);out[id]=[MW,MH,h(G.terrain),h(G.ore)].join();}
    let sd=7;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;
    for(const mode of ['survival','siege']){startGame(mode);out[mode]=[MW,MH,h(G.terrain),h(G.ore)].join();
      // where a Rootweb Node and a Root Tap may be placed, over the whole map
      let pl='';for(const t of ['node','drill'])if(B[t])for(let i=0;i<N;i++)pl+=placeCheck(t,i%MW,(i/MW)|0)?'0':'1';out[mode+'Place']=h(Array.from(pl,c=>c.charCodeAt(0)));}
    // a seeded Survival match with the swarm harvesting: the save after three minutes
    sd=11;startGame('survival');for(const k in G.items)G.items[k]=5000;let taps=0;for(let i=0;i<N&&taps<6;i++)if(G.ore[i]>=0&&!placeCheck('drill',i%MW,(i/MW)|0)&&tryPlace('drill',i%MW,(i/MW)|0,0,true))taps++;const NR=Math.random;for(let i=0;i<30*180;i++){step(STEP);if(i%3===0){const r0=Math.random;Math.random=NR;try{render();}finally{Math.random=r0;}}}
    out.match=JSON.stringify(snapGame());out.items=JSON.stringify(G.items)+' taps '+taps;return out;});const e=p.errs;await p.close();return [r,e];};
  const [a,ea]=await facts(OLD),[b,eb]=await facts(NEW);
  for(const k of ['landfall','ember','kilo','frost','last','survival','siege'])ok(`${k}: same map size, terrain and ore as v63`,a[k]===b[k],b[k]);
  ok('Rootweb Nodes and Root Taps may be placed on the same tiles as v63 (Survival, Base Siege)',a.survivalPlace===b.survivalPlace&&a.siegePlace===b.siegePlace);
  ok('a seeded three-minute Survival match ends in the same save as v63 (harvesting, building, combat)',a.match===b.match,`items v63 ${a.items} v64 ${b.items}`);
  // saves: a v63 save loads in v64 with the same ground painted as a fresh start would, and a v64 save loads in v63
  const sv=async(file,S)=>{const p=await open(br,file);const r=await p.evaluate(S=>{if(!S){startGame('survival');for(let i=0;i<300;i++)step(STEP);const J=JSON.stringify(snapGame());if(typeof PG==='undefined')return J;const a=T64.sum();applySave(JSON.parse(J));return {J,same:a===T64.sum()};}
    applySave(JSON.parse(S));const out={S:JSON.stringify(snapGame())};if(typeof T64!=='undefined'&&typeof PG!=='undefined'){out.n=PG.n;out.sum=T64.sum();applySave(JSON.parse(S));out.sum2=T64.sum();}return out;},S);const e=p.errs;await p.close();return [r,e];};
  const [s63]=await sv(OLD,null),[l64,e64]=await sv(NEW,s63);
  ok('a v63 save loads in v64 and paints the same ground every time',!e64.length&&l64.sum===l64.sum2&&l64.n>0,e64[0]||'');
  const [s64]=await sv(NEW,null),[l63,e63]=await sv(OLD,s64.J);
  ok('a v64 save repaints exactly the ground it was played on',s64.same);
  ok('a v64 save loads in v63',!e63.length&&!!l63.S,e63[0]||'');
  ok('no errors in either build',!ea.length&&!eb.length,(ea[0]||'')+(eb[0]||''));}

 await br.close();console.log(fails?`${fails} FAILED`:'all passed');process.exit(fails?1:0);})();
