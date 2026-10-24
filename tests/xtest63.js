// v63: the title's heartbeat on a slow computer, the vein a growth is fed through, and the title-to-menu transition.
// A growth being grown is fed along the colony's real supply network: from the Bloom Heart, along the links to its Rootweb Nodes (one
// after another), then a new branch over fed Rootweb into the growth, ending inside it. Growths share the links upstream; a cut stops the
// flow and a repair brings it back; a finished growth's branch fades. The transition's tendrils are the same vein, painted once and
// uncovered as they grow. None of it touches the game.
// Most checks hold the game's own loop and draw frames themselves on a game clock they advance; the network is built by the real
// simulation. Run with a web server on the repo root (port 8123). SHOTS is where pictures go.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',SHOTS=process.env.SHOTS||'shots63';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:{width:o.w||1280,height:o.h||800},deviceScaleFactor:o.dpr||1});const p=await ctx.newPage();
  p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(s=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_splash',s?'1':'0');}catch(e){}},!!o.title);
  await p.goto(URL+'index.html');await p.waitForTimeout(o.title?4500:1200);
  if(!o.title)await p.evaluate(()=>{
    window.T63={R0:render,
      hold(){window.render=()=>{};G.paused=true;},
      // growths named in T63.keep stay half grown however long the simulation runs, so the checks can see them being fed
      keep:[],sim(sec){for(let i=0;i<sec*30;i++){G.enemies.length=0;step(1/30);for(const id of T63.keep){const b=G.blocks.get(id);if(b&&b.built>.5)b.built=.5;}}},
      run(sec,each){const n=Math.round(sec*30);for(let i=0;i<n;i++){G.time+=1/30;T63.R0();if(each)each(i);}},
      // the Bloom, a chain of three Rootweb Nodes heading away from it (each planted on the fed edge, the Rootweb then growing from it),
      // and growths beyond the last one
      chain(){startGame('survival');G.core.max=G.core.hp=1e9;for(const k in G.items)G.items[k]=99999;const [cx,cy]=bCenter(G.core);T63.sim(20);const nodes=[];
        for(const dx of [5,11,17]){const x=Math.round(cx)+dx,y=Math.round(cy);let ok=false;for(let d=0;d<4&&!ok;d++)for(const yy of [y-d,y+d])if(!ok&&G.web[yy*MW+x]&&tryPlace('node',x,yy,0,true)){nodes.push(blockAt(x,yy).id);ok=true;}T63.sim(30);}
        T63.sim(10);return nodes;},
      site(t,nearId,ox,oy){const n=G.blocks.get(nearId),nx=n.x,ny=n.y;
        for(let r=0;r<5;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const x=nx+ox+dx,y=ny+oy+dy;if(!placeCheck(t,x,y)&&tryPlace(t,x,y,0,true))return blockAt(x,y).id;}return 0;},
      look(nodes){T63.hold();T63.run(.3);const a=bCenter(G.core),b=bCenter(G.blocks.get(nodes[nodes.length-1]));cam.z=1.1;centerOn((a[0]+b[0])/2+2,a[1]);
        for(let i=0;i<120;i++)webArtTick(30);T63.R0();},
      route(id){const e=CIRC.sites.get(id);return e&&e.r;},
      fed(x,y){const i=Math.floor(y)*MW+Math.floor(x);if(!inMap(Math.floor(x),Math.floor(y)))return false;if(G.web[i]&&WSUP.live[i])return true;const b=G.bgrid[i]&&G.blocks.get(G.bgrid[i]);return !!b&&b.team===0;},
      beat(){CIRC.beat=null;CIRC.next=G.time+.02;}};});
  return p;};
(async()=>{const br=await chromium.launch();
 // ---- 1 to 6: the whole route, through three Nodes, into the growth
 {const p=await open(br);
  const r=await p.evaluate(()=>{const nodes=T63.chain(),press=T63.site('press',nodes[2],4,-1),press2=T63.site('press',nodes[2],3,4),wall=T63.site('wall',nodes[0],0,-3);T63.look(nodes);
    const out={nodes:nodes.length,sites:[press,press2,wall].filter(Boolean).length,hubs:CIRC.hubs.size,keys:CIRC.keys.size};const R=T63.route(press),R2=T63.route(press2),b=G.blocks.get(press);
    out.ok=!!(R&&R.P);if(!out.ok)return out;
    // through the links Bloom > Node 1 > Node 2 > Node 3, every one a link the network counts
    out.links=R.keys.length;out.allCounted=R.keys.every(k=>CIRC.keys.has(k));out.hub=R.hub&&R.hub.id===nodes[2];
    const P=R.P,[cx,cy]=bCenter(G.core),e=P[P.length-1];
    out.start=+Math.hypot(P[0][0]-cx,P[0][1]-cy).toFixed(2);out.inside=e[0]>b.x&&e[0]<b.x+b.size&&e[1]>b.y&&e[1]<b.y+b.size;
    let gap=0;for(let j=1;j<P.length;j++)gap=Math.max(gap,Math.hypot(P[j][0]-P[j-1][0],P[j][1]-P[j-1][1]));out.gap=+gap.toFixed(2);
    // the new branch (after the last Node) runs only over fed Rootweb or the colony's growths: no shortcut over bare ground
    let off=0,n=0;for(let j=0;j<P.length;j++){if(R.S[j]<R.f0)continue;n++;if(!T63.fed(P[j][0],P[j][1]))off++;}out.branchPts=n;out.off=off;
    // the links run over fed Rootweb too, stepping over at most a small hole
    let lo=0;for(const k of R.keys){const L=CIRC.lk.get(k);for(const [x,y] of L.pts)if(!T63.fed(x,y))lo++;}out.linkOff=lo;
    // both growths beyond the last Node share the links upstream of it; the wall near Node 1 shares the first
    out.shared=R2&&R2.keys.length>=3&&R.keys.slice(0,3).join()===R2.keys.slice(0,3).join();const RW=T63.route(wall);out.wallShares=RW&&RW.keys.length>=1&&RW.keys[0]===R.keys[0];
    T63.keep=[press,press2,wall];window.__ids={nodes,press,press2,wall};return out;});
  console.log(JSON.stringify(r));
  ok('1. the growth has a route, from the Bloom through three Nodes (three links, all counted by the network)',r.ok&&r.links>=3&&r.allCounted&&r.hub,JSON.stringify({links:r.links,hub:r.hub}));
  ok('2. it starts at the Bloom\'s chamber and ends inside the growth',r.start<2&&r.inside,JSON.stringify({start:r.start,inside:r.inside}));
  ok('3. it is one continuous line (no jump of more than a tile and a half)',r.gap<=1.6,'largest step '+r.gap);
  ok('4. the branch and the links stay on fed Rootweb (no shortcut over bare ground)',r.off===0&&r.linkOff<=4,JSON.stringify({branchPts:r.branchPts,off:r.off,linkOff:r.linkOff}));
  ok('5. growths share the links upstream (two beyond Node 3, one off Node 1)',r.shared&&r.wallShares);
  await p.screenshot({path:SHOTS+'/route_whole.png'});
  // the lights: a beat sends a packet from the Bloom down the real routes, most of it to the growths being grown
  const L=await p.evaluate(()=>{CIRC.P.length=0;T63.beat();let mx=0,first=null,started=true,beat=0,toSites=0,track=null,mono=true,cap=circCap(),over=0,feed=0;
    T63.run(4,()=>{mx=Math.max(mx,CIRC.P.length);if(CIRC.P.length>cap)over++;for(const q of CIRC.P){if(!q.seen){q.seen=1;if(q.s>q.v/30+.01)started=false;if(q.kind==='beat'){beat++;if(q.site)toSites++;}else feed++;}}
      if(!track){track=CIRC.P.find(q=>q.site&&q.site.b.id===__ids.press&&q.kind==='beat');if(track)track.last=track.s;}else if(CIRC.P.includes(track)){if(track.s<track.last)mono=false;track.last=track.s;}});
    return {mx,cap,over,started,beat,toSites,feed,tracked:!!track,mono};});
  console.log(JSON.stringify(L));
  ok('6. each light starts at the Bloom and only moves on along its route; a beat\'s packet goes mostly to the growths; never over the cap',L.started&&L.tracked&&L.mono&&L.beat>0&&L.toSites>=L.beat*.5&&L.over===0,JSON.stringify(L));
  for(let i=0;i<4;i++){await p.evaluate(i=>{if(i===1)T63.beat();T63.run(.35);},i);await p.screenshot({path:`${SHOTS}/route_flow_${i}.png`});}
  // ---- 7: close up, at different zooms, the branch enters the growth
  for(const z of [.6,1.6,2.6]){await p.evaluate(z=>{const [x,y]=bCenter(G.blocks.get(__ids.press));cam.z=z;centerOn(x-1,y);T63.run(.3);},z);await p.screenshot({path:`${SHOTS}/press_zoom_${z}.png`});}
  // ---- 10: saved and loaded mid-growth: the growths get their routes back
  const S=await p.evaluate(async()=>{const s=await encodeSave();applySave(await decodeSave(s));T63.hold();T63.run(.6);const e=[...CIRC.sites.values()];
    return {sites:e.length,routes:e.filter(x=>x.r&&x.r.P).length,deep:e.filter(x=>x.r&&x.r.keys&&x.r.keys.length>=3).length,siteN:[...G.blocks.values()].filter(isSite).length};});
  console.log(JSON.stringify(S));
  ok('10. saved and loaded mid-growth: every growth gets its route back, the far ones through three Nodes',S.sites===S.siteN&&S.routes===S.siteN&&S.deep>=2,JSON.stringify(S));
  // ---- 8: the network cut: a strip of Rootweb four tiles wide between Node 1 and Node 2 withers (wider than the hole of up to two tiles a link may step over) (cleared here). Node 2 and Node 3 lose their links, the
  // growths beyond them lose their route and every light on it, and a dull stub that carries nothing is all they show. (The game's own
  // rule still counts the Bloom's whole reach as fed, so their growing carries on: the veins draw only a route that physically exists.)
  const C=await p.evaluate(()=>{const n1=G.blocks.get(__ids.nodes[0]),n2=G.blocks.get(__ids.nodes[1]),before=[...CIRC.keys];let bx=-1;
    // a strip with no growth standing on it (Rootweb under a growth would bridge the gap)
    for(let x=n1.x+n1.size;x<n2.x-3&&bx<0;x++){let clear=true;for(let y=0;y<MH&&clear;y++)for(const xx of [x,x+1,x+2,x+3]){const b=G.bgrid[y*MW+xx]&&G.blocks.get(G.bgrid[y*MW+xx]);if(b&&b.team===0)clear=false;}if(clear)bx=x;}
    for(let y=0;y<MH;y++)for(let x=bx;x<bx+4;x++){const i=y*MW+x;if(G.web[i])setWeb(i,0);}webSupply();WSUP.t=G.time+.01;T63.hold();T63.run(1.5);
    const R=T63.route(__ids.press),dead=before.filter(k=>!CIRC.keys.has(k));let ghost=0;for(const q of CIRC.P)if(q.r.keys)for(const k of q.r.keys)if(!CIRC.keys.has(k))ghost++;
    const toPress=CIRC.P.filter(q=>q.site&&(q.site.b.id===__ids.press||q.site.b.id===__ids.press2)).length;window.__gap=[bx,n1.y];
    let webCol=0;if(bx>=0)for(let y=0;y<MH;y++)webCol+=G.web[y*MW+bx];return {bx,n1:[n1.x,n1.size],n2:n2.x,webCol,dead:dead.length,route:!!(R&&R.P),dim:!!(R&&R.dim),ghost,toPress,hubs:CIRC.hubs.size};});
  console.log(JSON.stringify(C));await p.screenshot({path:SHOTS+'/route_cut.png'});
  ok('8. cut: the links beyond the gap stop counting, the cut-off growths have no route and no lights, no light runs on a dead link',C.dead>=2&&C.ghost===0&&!C.route&&C.toPress===0,JSON.stringify(C));
  // ---- 9: repaired: a Node planted in the gap, the Rootweb grows across, and the route (now through four Nodes) and its lights come back
  const F=await p.evaluate(()=>{const [x0,y]=__gap;let placed=false;for(const x of [x0+1,x0+2,x0,x0+3,x0-1])for(let d=0;d<3&&!placed;d++)for(const yy of [y-d,y+d])if(!placed&&tryPlace('node',x,yy,0,true))placed=true;
    T63.sim(30);T63.hold();T63.run(1);const R=T63.route(__ids.press);let lights=0;T63.beat();T63.run(3,()=>{lights=Math.max(lights,CIRC.P.filter(q=>q.site&&q.site.b.id===__ids.press).length);});
    return {placed,route:!!(R&&R.P),links:R&&R.keys?R.keys.length:0,lights,hubs:CIRC.hubs.size};});
  console.log(JSON.stringify(F));await p.screenshot({path:SHOTS+'/route_restored.png'});
  ok('9. reconnected: the route through the Nodes and its lights come back',F.placed&&F.route&&F.links>=3&&F.lights>0,JSON.stringify(F));
  // ---- 11: finished: the branch dulls and fades in about a second and a half, the links stay
  const D=await p.evaluate(()=>{const b=G.blocks.get(__ids.press2)||[...G.blocks.values()].find(isSite);const keys=CIRC.keys.size;b.built=1;T63.run(.2);const e=CIRC.sites.get(b.id);
    const at=[];for(let k=0;k<12;k++){T63.run(.2);at.push(CIRC.sites.has(b.id)?+(1-(G.time-e.done)/1.6).toFixed(2):0);}return {done:!!(e&&e.done),at,keys,keys2:CIRC.keys.size};});
  console.log(JSON.stringify(D));
  ok('11. finished growth: its branch fades over about 1.5 s and is then gone; the network\'s links remain',D.done&&D.at[1]>.4&&D.at[D.at.length-1]===0&&D.keys2===D.keys,JSON.stringify(D));
  // ---- 12: painted art off, every quality: the veins and lights still run, within each cap
  for(const q of ['low','medium','high','epic']){const r=await p.evaluate(q=>{applyQuality(q);T63.hold();SET.art=q!=='high';T63.beat();let mx=0;T63.run(2.5,()=>{mx=Math.max(mx,CIRC.P.length);});return {mx,cap:circCap(),art:SET.art};},q);
   ok(`12. ${q} quality${r.art?'':' with the painted art off'}: veins and lights run within the cap`,r.mx>0&&r.mx<=r.cap,JSON.stringify(r));}
  await p.evaluate(()=>{applyQuality('high');SET.art=true;});
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 13: looks only: drawing 20 s of the network's veins and lights changes nothing in the game
 {const p=await open(br);const r=await p.evaluate(()=>{const nodes=T63.chain();T63.site('press',nodes[2],4,-1);T63.site('factory',nodes[1],0,4);T63.look(nodes);const t=G.time,j0=JSON.stringify(snapGame());
    T63.beat();T63.run(20);G.time=t;const j1=JSON.stringify(snapGame());return {same:j0===j1,len:j0.length,sites:CIRC.sites.size};});
  ok('13. drawing 20 s of the veins and lights changes nothing in the game (its whole save is identical)',r.same&&r.sites>=2,JSON.stringify(r));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 14 to 18: the title and its transition, at 1080p and on a high-DPI screen
 for(const dpr of [1,2]){const p=await open(br,{title:true,w:1920,h:1080,dpr});
  // the heartbeat makes no new canvases (before v63 every pulse of light made two the size of the screen), and its frames stay short
  const H=await p.evaluate(async()=>{const ce=document.createElement.bind(document);let made=0;document.createElement=t=>{if(String(t).toLowerCase()==='canvas')made++;return ce(t);};
    const sd=window.splashDraw,F=[];window.splashDraw=function(){const a=performance.now();const r=sd.apply(this,arguments);if(SPL.hb||SPL.pulses.some(q=>q.t>0))F.push(performance.now()-a);return r;};
    const b0=SPL.beats;await new Promise(r=>setTimeout(r,9000));document.createElement=ce;window.splashDraw=sd;F.sort((x,y)=>x-y);
    return {beats:SPL.beats-b0,made,n:F.length,p95:F.length?+F[Math.floor(F.length*.95)].toFixed(1):0,max:F.length?+F[F.length-1].toFixed(1):0,canvas:[$('splashCv').width,$('splashCv').height]};});
  console.log(JSON.stringify(H));
  ok(`14. title at ${dpr}x: a heartbeat makes no new canvases and its frames stay short`,H.beats>=1&&H.made===0&&H.p95<25,JSON.stringify(H));
  await p.screenshot({path:`${SHOTS}/title_${dpr}x.png`});
  ok(`17. the menu scenes start at the screen's full resolution`,await p.evaluate(()=>MD.res===1));
  // the transition: prepared while the title waits (a handful of pictures), about two seconds, cheap frames
  const V0=await p.evaluate(()=>({planned:!!(VNP.T&&VNP.T.length),pics:VNP.T?VNP.T.reduce((n,t)=>n+1+t.br.length,0):0,ms:VNP.ms}));
  await p.evaluate(()=>{const vt=window.vineTick;window.__vt=[];window.vineTick=function(){const a=performance.now();const r=vt.apply(this,arguments);__vt.push(performance.now()-a);return r;};});
  await p.keyboard.press('Space');const shots=[];for(const ms of [350,450,450]){await p.waitForTimeout(ms);shots.push(await p.screenshot({path:`${SHOTS}/transition_${dpr}x_${shots.length}.png`}));}
  await p.waitForTimeout(1400);
  const V=await p.evaluate(()=>{const a=__vt,t=SPL.vfr||[];return {ended:!SPL.vine&&$('splash').hidden,last:t.length?t[t.length-1]:0,frames:t.length,avg:a.length?+(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):0,max:a.length?+Math.max(...a).toFixed(1):0};});
  console.log(JSON.stringify(V0),JSON.stringify(V));
  ok(`15. transition at ${dpr}x: prepared beforehand as a handful of pictures`,V0.planned&&V0.pics>0&&V0.pics<=30,JSON.stringify(V0));
  ok(`16. transition at ${dpr}x: over in about two seconds, its own drawing a few milliseconds a frame`,V.ended&&V.last>=1.8&&V.last<=2.6&&V.avg<8,JSON.stringify(V));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 18: a second key skips straight to the menu, even mid-growth; and with the painted art off the transition still plays
 for(const art of [true,false]){const p=await open(br,{title:true});if(!art)await p.evaluate(()=>{SET.art=false;});
  await p.keyboard.press('Space');await p.waitForTimeout(art?500:300);const mid=await p.evaluate(()=>!!SPL.vine);await p.keyboard.press('Space');await p.waitForTimeout(60);
  const r=await p.evaluate(()=>({gone:!SPL.vine,hidden:$('splash').hidden,menu:!$('overlay').hidden}));
  ok(`18. ${art?'':'painted art off: '}a second key mid-transition goes straight to the menu`,mid&&r.gone&&r.hidden&&r.menu,JSON.stringify(r));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 await br.close();console.log(fails?`${fails} FAILED`:'ALL PASSED');process.exit(fails?1:0);})();
