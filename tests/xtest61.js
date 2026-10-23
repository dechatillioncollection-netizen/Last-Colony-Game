// v61: the colony's circulation (looks only).
// The in-game Bloom beats twice and rests (its chamber tightens and brightens, the petals follow, the membrane's veins flare); each beat
// pumps a few nutrient lights out along the Rootweb the Bloom actually feeds; a growth being grown gets a steady stream and a temporary
// feeding tendril that enters it, then dulls and fades when it is done. None of it touches the game.
// Most checks hold the game's own loop and draw frames themselves on a game clock they advance, so they are exact and repeatable;
// the ones about completion run the real simulation. Run with a web server on the repo root (port 8123). SHOTS is where pictures go.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',SHOTS=process.env.SHOTS||'shots61';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:{width:1280,height:800},reducedMotion:o.rm?'reduce':'no-preference'});const p=await ctx.newPage();
  p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');localStorage.setItem('lc_splash','1');}catch(e){}});
  await p.goto(URL+'index.html');await p.waitForTimeout(1200);
  await p.evaluate(()=>{
    // the test's own frame driver: the game's loop draws nothing while held, and the test draws each frame on a clock it advances
    window.T61={R0:render,
      hold(){window.render=()=>{};G.paused=true;},
      free(){window.render=T61.R0;G.paused=false;},
      run(sec,sim,each){const n=Math.round(sec*30);for(let i=0;i<n;i++){if(sim){G.enemies.length=0;step(1/30);}else G.time+=1/30;T61.R0();if(each)each(i);}},
      setup(offs,t){startGame('survival');G.core.hp=1e9;for(let s=0;s<40*30;s++){G.enemies.length=0;step(1/30);}for(const k in G.items)G.items[k]=99999;
        T61.hold();const [cx,cy]=bCenter(G.core);cam.z=1.4;centerOn(cx,cy);const placed=[];
        for(const [dx,dy] of offs||[]){const tt=t||'press',sz=B[tt].size;let done=false;
          // the nearest free spot to the one asked for, wholly on fed Rootweb
          for(let rr=0;rr<=4&&!done;rr++)for(let oy=-rr;oy<=rr&&!done;oy++)for(let ox=-rr;ox<=rr&&!done;ox++){if(Math.max(Math.abs(ox),Math.abs(oy))!==rr)continue;
            const x=Math.round(cx+dx+ox),y=Math.round(cy+dy+oy);let fed=true;for(let yy=y;yy<y+sz;yy++)for(let xx=x;xx<x+sz;xx++)if(!inMap(xx,yy)||!G.web[yy*MW+xx]||!WSUP.live[yy*MW+xx])fed=false;
            if(fed&&!placeCheck(tt,x,y)&&!blockAt(x,y)&&tryPlace(tt,x,y,0,true)){placed.push(blockAt(x,y));done=true;}}}
        T61.run(.2);return placed.map(b=>b&&b.id);},
      beat(){CIRC.beat=null;CIRC.next=G.time+.02;},
      fedNear(x,y){for(let yy=Math.floor(y)-1;yy<=Math.floor(y)+1;yy++)for(let xx=Math.floor(x)-1;xx<=Math.floor(x)+1;xx++){if(!inMap(xx,yy))continue;const i=yy*MW+xx;if(G.web[i]&&WSUP.live[i])return true;}return false;},
      inside(b,x,y,m=.6){return x>=b.x-m&&x<=b.x+b.size+m&&y>=b.y-m&&y<=b.y+b.size+m;}};});
  return p;};
// the share of pixels that differ between two screenshots of the same region
const diff=async(p,a,b)=>p.evaluate(async([A,Bb])=>{const ld=async s=>{const im=new Image();im.src='data:image/png;base64,'+s;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const g=c.getContext('2d');g.drawImage(im,0,0);return g.getImageData(0,0,c.width,c.height).data;};
  const x=await ld(A),y=await ld(Bb);let n=0,d=0;for(let i=0;i<x.length;i+=4){n++;if(Math.abs(x[i]-y[i])+Math.abs(x[i+1]-y[i+1])+Math.abs(x[i+2]-y[i+2])>30)d++;}return d/n;},[a.toString('base64'),b.toString('base64')]);
// a screen rectangle (canvas pixels) round some tiles
const clipOf=async(p,x0,y0,x1,y1)=>p.evaluate(([x0,y0,x1,y1])=>{const r=$('cv').getBoundingClientRect(),
  sx=X=>(X*T-cam.x)*cam.z+r.left,sy=Y=>(Y*T-cam.y)*cam.z+r.top;return {x:Math.max(0,sx(x0)),y:Math.max(0,sy(y0)),width:Math.max(4,sx(x1)-sx(x0)),height:Math.max(4,sy(y1)-sy(y0))};},[x0,y0,x1,y1]);
(async()=>{const br=await chromium.launch();
 // ---- 1, 2, 3: the beat, its two bursts, and the lights travelling through the fed Rootweb
 {const p=await open(br);await p.evaluate(()=>T61.setup([]));
  const r=await p.evaluate(()=>{const b=G.core,fp=[b.x,b.y,b.size].join(),rec=[];let cur=null;
    const AL=artLayer;window.artLayer=function(c,a,L,im,bx,by,BS,tt,ph,br,bb,hk){if(bb===G.core&&cur){const di=c.drawImage;let sc=null;c.drawImage=function(...q){if(sc===null)sc=c.getTransform().a;return di.apply(this,q);};
        const ga=c.globalAlpha;try{AL.apply(this,arguments);}finally{delete c.drawImage;}
        if(L.f==='collar.png')cur.collar=sc;if(L.f==='fluid.png')cur.dome=sc;if(L.anim==='petals'&&L.f==='petal_outer.png')cur.hk=hk;if(L.f==='membrane.png')cur.mem=ga*(L.min+(L.max-L.min)*(.5+.5*Math.sin(tt*6.283/L.period+ph)))*(1+artHB*.9);return;}
      return AL.apply(this,arguments);};
    const OB=circBurst,bursts=[];window.circBurst=function(k){const n0=CIRC.P.length;OB(k);const ps=CIRC.P.slice(n0);for(const q of ps)q.s0=q.s;bursts.push({u:+(G.time-CIRC.beat.t0).toFixed(3),k,ps});};
    T61.beat();const t0=G.time;
    T61.run(3.2,false,()=>{cur={t:G.time-t0,A:CIRC.A,Ap:CIRC.Ap};rec.push(cur);});
    T61.run(.1);window.artLayer=AL;
    // the bursts' lights: where they start, whether every point they pass lies on fed Rootweb, how far out they are over time
    const ps=bursts.flatMap(x=>x.ps),[cx,cy]=bCenter(b);let off=0,pts=0;const dAt=[];
    for(const q of ps){const R=q.r;const st=R.P[0];if(Math.hypot(st[0]-cx,st[1]-cy)>b.size/2+.2)off+=1000;
      for(let s=0;s<=R.L;s+=.25){const [x,y]=circAt(R,s);pts++;if(!(T61.inside(b,x,y,.2)||T61.fedNear(x,y)))off++;}}
    for(const tt of [.15,.4,.8,1.4])dAt.push(+Math.max(...ps.map(q=>Math.min(q.r.L,Math.max(0,q.s0+q.v*tt)))).toFixed(2));
    const L=ps.map(q=>q.r.L);
    const peaks=[];for(let i=1;i<rec.length-1;i++)if(rec[i].A>.004&&rec[i].A>=rec[i-1].A&&rec[i].A>rec[i+1].A)peaks.push([+rec[i].t.toFixed(2),+rec[i].A.toFixed(4)]);
    const pk=rec.reduce((m,x)=>x.A>m.A?x:m,rec[0]),pkp=rec.reduce((m,x)=>x.Ap>m.Ap?x:m,rec[0]);
    const col=rec.map(x=>x.collar).filter(x=>x!=null),dom=rec.map(x=>x.dome).filter(x=>x!=null),hk=rec.map(x=>x.hk).filter(x=>x!=null),mem=rec.map(x=>x.mem).filter(x=>x!=null);
    return {fp0:fp,fp1:[b.x,b.y,b.size].join(),peaks,lag:+(pkp.t-pk.t).toFixed(3),collar:[Math.min(...col),Math.max(...col)].map(v=>+v.toFixed(4)),
      dome:+(Math.min(...dom)/Math.max(...dom)).toFixed(4),hk:+(Math.min(...hk)/Math.max(...hk)).toFixed(4),mem:[+Math.min(...mem).toFixed(3),+Math.max(...mem).toFixed(3)],
      bursts:bursts.map(x=>({u:x.u,k:x.k,n:x.ps.length})),off,pts,dAt,maxL:+Math.max(...L).toFixed(1),kinds:[...new Set(ps.map(q=>q.kind))]};});
  console.log(JSON.stringify(r));
  ok('1. the Bloom beats twice: two separate contractions, the second softer',r.peaks.length===2&&r.peaks[1][1]<r.peaks[0][1]&&r.peaks[1][0]-r.peaks[0][0]>.2,JSON.stringify(r.peaks));
  ok('1. the chamber tightens while the collar (and so the footprint) stays put; the petals follow a moment later and less',r.dome<.985&&r.collar[1]-r.collar[0]<1e-6&&r.hk<.995&&r.hk>r.dome&&r.lag>0&&r.fp0===r.fp1,`dome ${r.dome} petals ${r.hk} collar ${r.collar} lag ${r.lag}s`);
  ok('1. the membrane\'s veins flare with the beat',r.mem[1]>r.mem[0]*1.25,JSON.stringify(r.mem));
  ok('2. both beats pump a few lights out of the Bloom (the second fewer)',r.bursts.length===2&&r.bursts[0].n>=3&&r.bursts[1].n>=2&&r.bursts[1].n<=r.bursts[0].n,JSON.stringify(r.bursts));
  ok('3. every light starts at the Bloom and keeps to fed Rootweb',r.off===0&&r.pts>50,`${r.pts} points checked`);
  ok('3. the lights advance progressively, not all at once',r.dAt[0]<r.dAt[1]&&r.dAt[1]<r.dAt[2]&&r.dAt[0]<r.maxL*.35,`furthest light at 0.15/0.4/0.8/1.4 s: ${r.dAt} of ${r.maxL} tiles`);
  // a still sequence of one beat, for the docs
  await p.evaluate(()=>{T61.beat();T61.run(.05);});
  for(const [i,dt] of [[0,.08],[1,.12],[2,.12],[3,.2],[4,.3],[5,.4]]){await p.evaluate(dt=>T61.run(dt),dt);await p.screenshot({path:`${SHOTS}/beat_${i}.png`,clip:await clipOf(p,...await p.evaluate(()=>{const [x,y]=bCenter(G.core);return [x-9,y-6,x+9,y+6];}))});}
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 4, 5: one growth: its feeder enters it, it gets more traffic, and the beat's lights reach it
 {const p=await open(br);const ids=await p.evaluate(()=>T61.setup([[5,-1]],'factory'));
  const r=await p.evaluate(()=>{const id=(()=>{for(const b of G.blocks.values())if(isSite(b))return b.id;})();const e=CIRC.sites.get(id);if(!e||!e.r||!e.r.P)return {none:1};
    const cnt=()=>CIRC.P.filter(q=>q.site===e).length;let sum=0,n=0;T61.run(2,false,()=>{sum+=cnt();n++;});
    const busy=sum/n;let feed=0;const S0=CIRC.spawned;
    // the beat's lights bound for this growth: do they get all the way in?
    const OB=circBurst;let mine=[];window.circBurst=function(k){const n0=CIRC.P.length;OB(k);mine.push(...CIRC.P.slice(n0).filter(q=>q.site===e));};
    T61.beat();let last=new Map(),g=0;T61.run(4,false,()=>{for(const q of mine)if(CIRC.P.includes(q))last.set(q,q.s);g=Math.max(g,e.glow);});window.circBurst=OB;
    const reached=mine.filter(q=>!CIRC.P.includes(q)&&last.get(q)>=q.r.L-.4).length;
    const end=e.r.P[e.r.P.length-1],b=e.b,root=circAt(e.r,e.r.f0);
    return {id,L:+e.r.L.toFixed(1),f0:+e.r.f0.toFixed(1),busy:+busy.toFixed(2),mine:mine.length,reached,glow:+g.toFixed(2),endIn:T61.inside(b,end[0],end[1],-.15),rootFed:T61.fedNear(root[0],root[1]),
      box:[b.x,b.y,b.size],root};});
  console.log(JSON.stringify(r));
  ok('4. the growth has a route over fed Rootweb, and its feeder rises from fed Rootweb and ends inside it',!r.none&&r.endIn&&r.rootFed,JSON.stringify(r.box));
  ok('4. nutrient traffic to it while it grows',r.busy>=1.5,`${r.busy} lights on the way on average`);
  ok('5. the beat sends lights to it and they arrive all the way in (it brightens as they enter)',r.mine>=1&&r.reached===r.mine&&r.glow>.5,`${r.reached} of ${r.mine}, glow ${r.glow}`);
  // the feeder really is drawn, along its route and over the growth: the same frame with and without the feeders
  if(!r.none){const [x0,y0,x1,y1]=[Math.min(r.box[0],r.root[0])-1,Math.min(r.box[1],r.root[1])-1,Math.max(r.box[0]+r.box[2],r.root[0])+1,Math.max(r.box[1]+r.box[2],r.root[1])+1];
    const clip=await clipOf(p,x0,y0,x1,y1),inClip=await clipOf(p,r.box[0]+.2,r.box[1]+.2,r.box[0]+r.box[2]-.2,r.box[1]+r.box[2]-.2);
    await p.evaluate(()=>{CIRC.P.length=0;T61.R0();});const a=await p.screenshot({clip}),ai=await p.screenshot({clip:inClip});
    await p.evaluate(()=>{window.F0=circFeeder;window.circFeeder=()=>{};T61.R0();});const b=await p.screenshot({clip}),bi=await p.screenshot({clip:inClip});
    await p.evaluate(()=>{window.circFeeder=F0;T61.run(.6);});
    const d=await diff(p,a,b),di=await diff(p,ai,bi);
    ok('4. the feeder is drawn, and it visibly enters the growth',d>.02&&di>.005,`changed: ${(d*100).toFixed(1)}% of the area, ${(di*100).toFixed(1)}% inside the growth`);
    await p.evaluate(()=>{cam.z=2.2;const e=[...CIRC.sites.values()][0];centerOn(...bCenter(e.b));T61.run(.4);});
    await p.screenshot({path:SHOTS+'/feeder_close.png'});}
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 6: several growths at once: each gets its branch, within the shared budget
 {const p=await open(br);await p.evaluate(()=>T61.setup([[6,1],[-7,-2],[1,-7],[-2,6],[7,-6]],'factory'));
  const r=await p.evaluate(()=>{const S=[...CIRC.sites.values()].filter(e=>e.r&&e.r.P),got=new Map(S.map(e=>[e,0]));let mx=0;
    const OB=circBurst;window.circBurst=function(k){const n0=CIRC.P.length;OB(k);for(const q of CIRC.P.slice(n0))if(got.has(q.site))got.set(q.site,got.get(q.site)+1);};
    T61.run(1);let fed=0;const OA=circAdd;window.circAdd=function(r,v,w,site,lag,kind){const n0=CIRC.P.length;OA.apply(this,arguments);if(kind==='feed'&&CIRC.P.length>n0)fed++;};
    for(let k=0;k<2;k++){T61.beat();T61.run(4,false,()=>{mx=Math.max(mx,CIRC.P.length);});}const rate=fed/8;window.circBurst=OB;window.circAdd=OA;
    const ends=S.map(e=>e.r.P[e.r.P.length-1].map(v=>+v.toFixed(1)).join(','));
    return {sites:S.length,all:CIRC.sites.size,beatEach:[...got.values()],mx,cap:circCap(),rate:+rate.toFixed(2),feedCap:circQ().all,distinct:new Set(ends).size};});
  console.log(JSON.stringify(r));
  ok('6. three or more growths each get their own branch, and the beats\' lights are shared round them',r.sites>=3&&r.distinct===r.sites&&r.beatEach.every(v=>v>=1),JSON.stringify(r.beatEach));
  ok('6. the lights stay within the budget',r.mx<=r.cap&&r.rate<=r.feedCap+.3,`at most ${r.mx} of ${r.cap} at once; the steady streams together ${r.rate} lights a second (budget ${r.feedCap})`);
  await p.evaluate(()=>{cam.z=1.1;centerOn(...bCenter(G.core));T61.beat();T61.run(.9);});await p.screenshot({path:SHOTS+'/multi_site.png'});
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 7: completion, in the real simulation: the stream eases off and the feeder dulls and fades; the Rootweb is untouched
 {const p=await open(br);await p.evaluate(()=>T61.setup([[5,2]],'press'));
  const r=await p.evaluate(()=>{const e=[...CIRC.sites.values()][0];if(!e)return {none:1};const b=e.b,web0=G.webCount,sig0=G.web.join('');
    const feeds=[];let tDone=null,cnt=0;
    // count feed lights born for this growth each half second
    const OA=circAdd;window.circAdd=function(r,v,w,site,lag,kind){if(site===e&&kind==='feed')cnt++;return OA.apply(this,arguments);};
    let guard=0;while(!e.done&&guard++<30*40)T61.run(1/30,true);tDone=G.time;const bt=b.bt;
    for(let k=0;k<8;k++){cnt=0;T61.run(.5,true);feeds.push(cnt);}window.circAdd=OA;
    return {done:!!e.done,built:b.built,bt,want:BUILD_T.press,gone:!CIRC.sites.has(b.id),feeds,web:G.webCount-web0,left:CIRC.P.filter(q=>q.site===e).length};});
  console.log(JSON.stringify(r));
  ok('7. the growth finishes on its own time, unchanged',r.done&&r.built>=1&&r.bt===r.want,`build time ${r.bt}s`);
  ok('7. the stream eases off, the feeder is gone within 2 s, and no light is left bound for it',r.gone&&r.feeds.slice(3).every(v=>v===0)&&r.left===0,JSON.stringify(r.feeds));
  // the fade itself, frame by frame: drawn while dulling, then gone
  const q=await p.evaluate(()=>{T61.setup([[-5,3]],'press');const e=[...CIRC.sites.values()][0];if(!e)return {none:1};const b=e.b;
    let n=0;const F=circFeeder,al=[];window.circFeeder=function(c,ee,time,inside){if(ee===e&&!inside){const ga=c.globalAlpha;n++;}return F.apply(this,arguments);};
    while(!e.done)T61.run(1/30,true);const t0=G.time;const out=[];for(let k=0;k<10;k++){n=0;T61.run(.2,true);out.push(n);}window.circFeeder=F;return {out};});
  ok('7. the feeder keeps being drawn for about 1.5 s after completion, fading, then stops',q.out&&q.out.slice(0,6).every(v=>v>0)&&q.out.slice(9).every(v=>v===0),JSON.stringify(q.out));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 8: a cut in the Rootweb stops the lights at the cut; mending it brings them back
 {const p=await open(br);await p.evaluate(()=>T61.setup([[8,0]],'factory'));
  const r=await p.evaluate(()=>{const e=[...CIRC.sites.values()][0];if(!e||!e.r||!e.r.P)return {none:1};const b=e.b,[cx,cy]=bCenter(G.core),R0=G.core.size/2+2.2,R1=R0+1.6,cut=[];
    for(let i=0;i<N;i++){const x=i%MW+.5,y=((i/MW)|0)+.5,d=Math.hypot(x-cx,y-cy);if(d>=R0&&d<R1&&G.web[i]){cut.push(i);setWeb(i,0);}}
    webSupply();WSUP.t=G.time;T61.run(.3);const before=e.r&&e.r.P?'route':e.r&&e.r.dim?'dim':'none';
    let beyond=0,toSite=0;T61.beat();T61.run(4,false,()=>{for(const q of CIRC.P){const [x,y]=circAt(q.r,Math.max(0,q.s));if(Math.hypot(x-cx,y-cy)>R0+.3)beyond++;if(q.site===e)toSite++;}});
    for(const i of cut)setWeb(i,1);webSupply();WSUP.t=G.time;T61.run(.3);const after=e.r&&e.r.P?'route':'none';let back=0;T61.beat();T61.run(3,false,()=>{back+=CIRC.P.filter(q=>q.site===e).length;});
    return {cut:cut.length,before,beyond,toSite,after,back};});
  console.log(JSON.stringify(r));
  ok('8. cut off: the growth gets no route and no lights, and no light passes the cut',!r.none&&r.cut>0&&r.before!=='route'&&r.beyond===0&&r.toSite===0,JSON.stringify(r));
  ok('8. mended: the route and the lights come back',r.after==='route'&&r.back>0,`${r.back} light-frames bound for it`);
  await p.evaluate(()=>{const e=[...CIRC.sites.values()][0],[cx,cy]=bCenter(G.core);for(let i=0;i<N;i++){const x=i%MW+.5,y=((i/MW)|0)+.5,d=Math.hypot(x-cx,y-cy);if(d>=G.core.size/2+2.2&&d<G.core.size/2+3.8&&G.web[i])setWeb(i,0);}
    webSupply();WSUP.t=G.time;T61.run(.5);cam.z=1.2;centerOn(cx+4,cy);T61.beat();T61.run(.8);});
  await p.screenshot({path:SHOTS+'/cut_rootweb.png'});
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 9: a Root Tap off the Rootweb is placed as before and gets no route and no lights
 {const p=await open(br);await p.evaluate(()=>T61.setup([]));
  const r=await p.evaluate(()=>{let spot=null;
    for(let i=0;i<N&&!spot;i++){const x=i%MW,y=(i/MW)|0;if(!G.ore[i]||blockAt(x,y)||placeCheck('drill',x,y))continue;let near=false;for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<=x+3;xx++)if(inMap(xx,yy)&&G.web[yy*MW+xx])near=true;for(let yy=y-3;yy<=y+B.drill.size+2;yy++)for(let xx=x-3;xx<=x+B.drill.size+2;xx++)if(inMap(xx,yy)&&G.web[yy*MW+xx])near=true;if(!near)spot=[x,y];}
    if(!spot)return {none:1};const why=placeCheck('drill',...spot),whyP=placeCheck('press',...spot);const placed=tryPlace('drill',spot[0],spot[1],0,true);T61.run(.4);
    const b=blockAt(...spot),e=b&&CIRC.sites.get(b.id);T61.beat();let mine=0;T61.run(3,false,()=>{mine+=CIRC.P.filter(q=>q.site===e).length;});
    return {spot,why,whyP,placed,site:!!b&&isSite(b),entry:!!e,route:!!(e&&e.r&&e.r.P),mine};});
  console.log(JSON.stringify(r));
  ok('9. off-Rootweb placement rules are unchanged (a Root Tap may go on ore beyond it, a press may not)',!r.none&&!r.why&&!!r.whyP&&r.placed,JSON.stringify([r.why,r.whyP]));
  ok('9. that Root Tap grows with no false route and no lights',r.site&&!r.route&&r.mine===0,JSON.stringify(r));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 10, 11: quality settings, painted art off, far zoom, pause, reduced motion
 {const p=await open(br);await p.evaluate(()=>T61.setup([[6,1],[-6,2],[0,-7]],'factory'));
  for(const q of ['low','medium','high','epic']){const r=await p.evaluate(q=>{applyQuality(q);T61.hold();T61.beat();let mx=0;T61.run(2.5,false,()=>{mx=Math.max(mx,CIRC.P.length);});return {q:SET.q,art:SET.art,mx,cap:circCap()};},q);
    await p.screenshot({path:`${SHOTS}/quality_${q}.png`});ok(`10. ${q} quality draws it, within its cap`,r.mx>0&&r.mx<=r.cap,JSON.stringify(r));}
  {const r=await p.evaluate(()=>{applyQuality('high');T61.hold();SET.art=false;T61.beat();let mx=0,A=0;T61.run(2.5,false,()=>{mx=Math.max(mx,CIRC.P.length);A=Math.max(A,CIRC.A);});return {mx,A};});
   await p.screenshot({path:SHOTS+'/art_off.png'});ok('10. painted art off: the drawn Bloom still beats and the lights and feeders still run',r.mx>0&&r.A>.01,JSON.stringify(r));
   await p.evaluate(()=>{SET.art=true;});}
  {const r=await p.evaluate(()=>{cam.z=.45;centerOn(...bCenter(G.core));T61.beat();let mx=0;T61.run(3,false,()=>{mx=Math.max(mx,CIRC.P.length);});const o={mx,cap:circCap(),full:circQ().cap};cam.z=1.4;return o;});
   await p.screenshot({path:SHOTS+'/far_zoom.png'});ok('11. zoomed far out: fewer lights',r.cap<r.full&&r.mx<=r.cap,JSON.stringify(r));}
  {await p.evaluate(()=>{T61.free();G.paused=true;});await p.waitForTimeout(300);const a=await p.evaluate(()=>CIRC.P.map(q=>q.s).join()+'|'+CIRC.A);await p.waitForTimeout(700);
   const b=await p.evaluate(()=>CIRC.P.map(q=>q.s).join()+'|'+CIRC.A);ok('11. paused: everything holds still',a===b&&a.length>2,a.slice(0,40));}
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 {const p=await open(br,{rm:true});await p.evaluate(()=>T61.setup([[6,1]],'factory'));
  const r=await p.evaluate(()=>{T61.beat();let mx=0,A=0;T61.run(3,false,()=>{mx=Math.max(mx,CIRC.P.length);A=Math.max(A,Math.abs(CIRC.A));});return {rm:ART_RM,mx,A,sites:CIRC.sites.size};});
  ok('11. reduced motion: no beat and no moving lights; the feeder still shows the growth\'s supply',r.rm&&r.mx===0&&r.A===0&&r.sites===1,JSON.stringify(r));await p.close();}
 // ---- 12, 13: saves and the game itself are untouched
 {const p=await open(br);await p.evaluate(()=>T61.setup([[6,1],[-6,2]],'factory'));
  const r=await p.evaluate(async()=>{const t=G.time,j0=JSON.stringify(snapGame());T61.beat();T61.run(20);G.time=t;const j1=JSON.stringify(snapGame());
    const s=await encodeSave();const S=await decodeSave(s);applySave(S);T61.hold();T61.run(.5);
    const e=[...CIRC.sites.values()];return {same:j0===j1,len:j0.length,circ:/circ|glow|feeder/i.test(j0),G:CIRC.G===G,sites:e.length,routes:e.filter(x=>x.r&&x.r.P).length,
      siteN:[...G.blocks.values()].filter(isSite).length};});
  console.log(JSON.stringify(r));
  ok('13. drawing 20 s of circulation changes nothing in the game (its whole save is identical)',r.same&&!r.circ,`${r.len} characters compared`);
  ok('12. saved and loaded mid-growth: the growths carry on and get their feeders back',r.G&&r.sites===r.siteN&&r.routes===r.siteN&&r.siteN===2,JSON.stringify(r));
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 // ---- 14: what it costs: the game's own loop drawing a still game, frames a second with the circulation and without it, in alternating
 // 2.5 s windows (6 of each, medians); a usual handful of growths, and sixteen at once
 for(const n of [3,16]){const p=await open(br);const offs=[];for(let a=0;a<n;a++)offs.push([Math.round(Math.cos(a/n*6.283)*(6+a%3*2)),Math.round(Math.sin(a/n*6.283)*(6+a%3*2))]);
  await p.evaluate(o=>{T61.setup(o,'wall');T61.free();G.paused=true;cam.z=1;centerOn(...bCenter(G.core));window.__f=0;const f=()=>{__f++;requestAnimationFrame(f)};requestAnimationFrame(f);
    window.K={F:circFrame,O:circOver,S:circSiteGlow};},offs);
  const res={on:[],off:[]};
  for(let k=0;k<6;k++)for(const m of ['on','off']){await p.evaluate(m=>{if(m==='on'){window.circFrame=K.F;window.circOver=K.O;window.circSiteGlow=K.S;}else{window.circFrame=()=>{};window.circOver=()=>{};window.circSiteGlow=()=>{};}
      CIRC.beat=null;CIRC.next=G.time;},m);await p.waitForTimeout(400);
    const a=await p.evaluate(()=>[__f,performance.now()]);await p.waitForTimeout(2500);const b=await p.evaluate(()=>[__f,performance.now()]);res[m].push((b[0]-a[0])*1000/(b[1]-a[1]));}
  const med=a=>+a.sort((x,y)=>x-y)[a.length>>1].toFixed(1),r={sites:await p.evaluate(()=>CIRC.sites.size),on:med(res.on),off:med(res.off)};console.log(JSON.stringify(r));
  ok(`14. ${n} growths at once: the frame rate holds`,r.sites>=n-1&&r.on>=r.off*.9,`${r.on} frames a second with it, ${r.off} without (software drawing)`);
  ok('no page errors',!p.errs.length,p.errs.slice(0,3).join(' | '));await p.close();}
 await br.close();console.log(fails?`${fails} FAILED`:'ALL PASSED');process.exit(fails?1:0);})();
