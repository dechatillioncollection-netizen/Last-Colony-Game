// Painted Vines (v31): the 14 checks from the brief. Served over http so canvases can be read back.
// Writes vtest_result.json and vt_*.png screenshots.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html';
const T=24;const R={};const ok=(k,pass,info)=>{R[k]={pass:!!pass,info};console.log((pass?'PASS ':'FAIL ')+k+' '+JSON.stringify(info));};
(async()=>{const br=await chromium.launch();
 const open=async(o={})=>{const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];
   p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
   p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED/.test(m.text()))errs.push(m.text())});
   await p.addInitScript(o=>{try{const q=o.q||'high',F={low:[0,0,0],medium:[1,0,1],high:[1,0,1],epic:[1,1,1]}[q];localStorage.setItem('lc_quality',q);localStorage.setItem('lc_hd',''+F[0]);localStorage.setItem('lc_hq',''+F[1]);localStorage.setItem('lc_art',''+F[2]);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_gl','0')}catch(e){}},o);
   if(o.block)await p.route(o.block,r=>r.abort());
   await p.goto(URL);await p.waitForTimeout(1000);
   await p.evaluate(()=>{
     // a clean floor (the Test Range) with Rootweb under the work area
     window.__range=()=>{startTestRange();const G=window.__game();G.paused=true;G.webFree=true;
       const W=36,H=22;for(let y=2;y+H<MH-2;y+=2)for(let x=2;x+W<MW-2;x+=2){let f=true;for(let yy=y;yy<y+H&&f;yy++)for(let xx=x;xx<x+W;xx++)if(G.bgrid[yy*MW+xx]||G.terrain[yy*MW+xx]!==FLOOR){f=false;break;}
         const near=o=>o.x>x-3&&o.x<x+W+3&&o.y>y-3&&o.y<y+H+3;if(f&&(G.test.labels.some(near)||G.units.some(near)||G.enemies.some(near)||[...G.blocks.values()].some(b=>near({x:b.x,y:b.y}))))f=false;
         if(f){for(let yy=y;yy<y+H;yy++)for(let xx=x;xx<x+W;xx++)if(!G.web[yy*MW+xx])setWeb(yy*MW+xx,1);for(const bn of webBorn.values())bn.t=-99;let g=0;while((webQ.size||webBorn.size)&&g++<5000)webArtTick();return [x+2,y+2];}}
       return null;};
     window.__put=(list)=>{const G=window.__game(),out=[];for(const [t,x,y,r] of list){const okp=tryPlace(t,x,y,r,true);const b=blockAt(x,y);if(b)b.built=1;out.push(okp?b:null);}return out;};
     // the camera on a world point at an exact pixel grid, so tile edges land on pixel edges
     window.__look=(wx,wy,z)=>{cam.z=z;cam.x=Math.round(wx-VW/2/z);cam.y=Math.round(wy-VH/2/z);};
     window.__frame=()=>{render();return ctx.getImageData(0,0,cv.width,cv.height);};
     window.__at=(I,wx,wy)=>{const sx=Math.floor((wx-cam.x)*cam.z*DPR),sy=Math.floor((wy-cam.y)*cam.z*DPR),k=(sy*I.width+sx)*4,D=I.data;return [D[k],D[k+1],D[k+2]];};
     window.__d=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);
     // seam across the shared edge of two connected vessels, against the pixel-to-pixel change inside the first one
     window.__seam=(a,b)=>{const dx=b.x-a.x,dy=b.y-a.y,ex=(a.x+.5+dx/2)*T,ey=(a.y+.5+dy/2)*T,z=4;__look(ex,ey,z);const I=__frame(),px=1/z/DPR;
       let edge=0,inner=0,n=0,m=0;
       for(let o=-12;o<=12;o+=2){const lx=-dy*o/z,ly=dx*o/z;
         const A=__at(I,ex-dx*px*.5+lx,ey-dy*px*.5+ly),Bp=__at(I,ex+dx*px*.5+lx,ey+dy*px*.5+ly);edge+=__d(A,Bp);n++;
         for(let k=6;k<40;k+=3){const P=__at(I,ex-dx*px*(k+.5)+lx,ey-dy*px*(k+.5)+ly),Q=__at(I,ex-dx*px*(k+1.5)+lx,ey-dy*px*(k+1.5)+ly);inner+=__d(P,Q);m++;}}
       return {edge:+(edge/n).toFixed(1),inner:+(inner/m).toFixed(1)};};
     window.__seamOK=s=>s.edge<=Math.max(3*s.inner,s.inner+14);
   });
   p.errs=errs;return p;};
 const shot=async(p,f,wx,wy,z,w=700,h=460)=>{await p.evaluate(([x,y,z])=>{__look(x,y,z);render();},[wx,wy,z]);await p.screenshot({path:f,clip:{x:700-w/2,y:450-h/2,width:w,height:h}});};

 let p=await open();
 const O=await p.evaluate(()=>__range());const [X,Y]=O;
 const art=await p.evaluate(()=>vineArtOn());ok('00 painted vines loaded',art,{at:O});

 // ---------- 1. a single Vine carrying resources: the item moves, sits on top, and the vessel animates only while it moves ----------
 let r=await p.evaluate(([X,Y])=>{const [b]=__put([['conveyor',X,Y,0]]);const G=window.__game();
   b.belt.length=0;__look((X+.5)*T,(Y+.5)*T,4);const I0=__frame();
   b.belt.push({i:CU,p:.2});const p0=.2;for(let k=0;k<3;k++)step(1/60);const p1=b.belt[0].p;
   const [ix,iy]=beltPos((X+.5)*T,(Y+.5)*T,0,0,p1);const I1=__frame();const c=__at(I1,ix,iy),e=__at(I0,ix,iy);
   const hex=IT[CU].c,ic=[1,3,5].map(k=>parseInt(hex.slice(k,k+2),16));
   const moving=vst(b).act===G.time;
   // the fluid moves while the item moves; an empty vessel shows its still frame
   const t0=G.time;b.belt[0].p=.3;const f1=vineFrame('conveyor',b,t0+.05,false);b.belt[0].p=.31;const f2=vineFrame('conveyor',b,t0+.1,false);
   b.belt.length=0;const e1=vineFrame('conveyor',b,t0+5,false),e2=vineFrame('conveyor',b,t0+5.37,false);
   return {moved:+(p1-p0).toFixed(3),itemVsEmpty:__d(c,e),itemVsColour:__d(c,ic),moving,movingFrames:[f1,f2],emptyFrames:[e1,e2]};},[X,Y]);
 ok('01 single Vine carries an item, drawn on top, still when empty',r.moved>0&&r.itemVsEmpty>60&&r.itemVsColour<150&&r.moving&&r.movingFrames[0]!==r.movingFrames[1]&&r.movingFrames[0]<16&&r.emptyFrames[0]===16&&r.emptyFrames[1]===16,r);
 await p.evaluate(([X,Y])=>{const b=blockAt(X,Y);b.belt.push({i:CU,p:.3},{i:GRAPH,p:.75});},[X,Y]);await shot(p,'vt01_single.png',(X+.5)*T,(Y+.5)*T,5,400,260);

 // ---------- 2. a long straight Vine: no seams between tiles ----------
 r=await p.evaluate(([X,Y])=>{const L=[];for(let i=0;i<22;i++)L.push(['conveyor',X+i,Y+2,0]);const bs=__put(L);
   const S=[];for(let i=0;i<21;i++)S.push(__seam(bs[i],bs[i+1]));const bad=S.filter(s=>!__seamOK(s)).length;
   return {joins:S.length,bad,worst:S.reduce((a,s)=>s.edge-s.inner>a.edge-a.inner?s:a,S[0]),placed:bs.filter(Boolean).length};},[X,Y]);
 ok('02 long straight Vine has no tile seams',r.placed===22&&r.bad===0,r);

 // ---------- 3. turning routes (both turn directions), 4. Swift chains, 5. Vine to Swift joins ----------
 r=await p.evaluate(([X,Y])=>{
   const path=[[0,0,0],[1,0,0],[2,0,1],[2,1,1],[2,2,0],[3,2,0],[4,2,3],[4,1,3],[4,0,0],[5,0,0],[6,0,1],[6,1,1],[6,2,2],[5,2,2]];
   const bs=__put(path.map(([dx,dy,r])=>['conveyor',X+dx,Y+5+dy,r]));const S=[];
   for(let i=0;i+1<bs.length;i++)S.push(__seam(bs[i],bs[i+1]));
   return {joins:S.length,bad:S.filter(s=>!__seamOK(s)).length,curves:bs.filter(b=>b&&beltCurve(b)).length,S};},[X,Y]);
 ok('03 turning Vine routes join without seams',r.bad===0&&r.curves>=5,{joins:r.joins,bad:r.bad,curves:r.curves,S:r.bad?r.S:undefined});
 r=await p.evaluate(([X,Y])=>{const bs=__put(Array.from({length:12},(_,i)=>['tconveyor',X+i,Y+10,0]));const S=[];for(let i=0;i<11;i++)S.push(__seam(bs[i],bs[i+1]));
   // and a Swift Vine turn
   const t=__put([['tconveyor',X+14,Y+10,0],['tconveyor',X+15,Y+10,1],['tconveyor',X+15,Y+11,1]]);S.push(__seam(t[0],t[1]),__seam(t[1],t[2]));
   return {joins:S.length,bad:S.filter(s=>!__seamOK(s)).length,worst:S.reduce((a,s)=>s.edge-s.inner>a.edge-a.inner?s:a,S[0])};},[X,Y]);
 ok('04 connected Swift Vines join without seams',r.bad===0,r);
 r=await p.evaluate(([X,Y])=>{const bs=__put([0,1,2,3,4,5,6,7].map(i=>[i%4<2?'conveyor':'tconveyor',X+i,Y+13,0]));
   // the outline must carry straight through each Vine/Swift join: compare the vessel's painted alpha either side of every join
   const prof=(im,col,rows)=>{const c=document.createElement('canvas');c.width=im.width;c.height=im.height;const x=c.getContext('2d');x.drawImage(im,0,0);
     const D=x.getImageData(0,0,c.width,c.height).data;return rows.map(([px,py])=>D[(py*c.width+px)*4+3]);};
   const col=(im,X0)=>prof(im,0,Array.from({length:96},(_,y)=>[X0,y]));const row=(im,Y0,X0=0)=>prof(im,0,Array.from({length:96},(_,x)=>[X0+x,Y0]));
   const md=(a,b)=>Math.max(...a.map((v,i)=>Math.abs(v-b[i])));
   const v0=col(VA.vine,VF*VP),v1=col(VA.vine,VF*VP+95),s0=col(VA.swift,VF*VP),s1=col(VA.swift,VF*VP+95);
   const vc=row(VA.vine_curve,95,VF*VP),sc=row(VA.swift_curve,95,VF*VP),kb=col(VA.knot_base,0),kb1=col(VA.knot_base,95),kr=row(VA.knot_bridge,0),kr1=row(VA.knot_bridge,95);
   const alpha={vineEnd_swiftStart:md(v1,s0),swiftEnd_vineStart:md(s1,v0),vine_curve:md(v0,vc),swift_curve:md(s0,sc),knot_lower:Math.max(md(v0,kb),md(v1,kb1)),knot_raised:Math.max(md(v0,kr),md(v1,kr1))};
   const S=[];for(let i=0;i<7;i++)S.push(__seam(bs[i],bs[i+1]));
   return {alpha,maxAlpha:Math.max(...Object.values(alpha)),seams:S.map(s=>s.edge+'/'+s.inner)};},[X,Y]);
 ok('05 Vine and Swift Vine outlines match at every join (and at curves and Knots)',r.maxAlpha<=40,r);
 await shot(p,'vt05_joins.png',(X+4)*T,(Y+13.5)*T,4,800,200);
 await shot(p,'vt03_turns.png',(X+3.5)*T,(Y+6.5)*T,3,800,420);

 // ---------- 6. a Vine Knot crossing two active streams, which never mix ----------
 r=await p.evaluate(([X,Y])=>{const G=window.__game(),kx=X+27,ky=Y+5;const L=[];
   for(let i=-5;i<=5;i++)if(i)L.push(['conveyor',kx+i,ky,0]);for(let i=-5;i<=5;i++)if(i)L.push(['tconveyor',kx,ky+i,1]);L.push(['junction',kx,ky,0]);__put(L);
   const hs=blockAt(kx-5,ky),vs=blockAt(kx,ky-5),he=blockAt(kx+5,ky),ve=blockAt(kx,ky+5),kn=blockAt(kx,ky);
   const got={h:{},v:{}};let both=0,frames=0;
   for(let k=0;k<60*8;k++){if(accepts(hs,CU,null))hs.belt.unshift({i:CU,p:0});if(accepts(vs,PB,null))vs.belt.unshift({i:PB,p:0});
     for(const [b,key] of [[he,'h'],[ve,'v']])if(b.belt.length&&b.belt[b.belt.length-1].p>=1){const it=b.belt.pop();got[key][it.i]=(got[key][it.i]||0)+1;}
     step(1/60);frames++;if((kn.buf[0].length||kn.buf[2].length)&&(kn.buf[1].length||kn.buf[3].length))both++;}
   // stop at a moment with an item in each passage, for the screenshot
   let g=0;while(!((kn.buf[0].length||kn.buf[2].length)&&(kn.buf[1].length||kn.buf[3].length))&&g++<600){if(accepts(hs,CU,null))hs.belt.unshift({i:CU,p:0});if(accepts(vs,PB,null))vs.belt.unshift({i:PB,p:0});step(1/240);}
   for(const b of [he,ve])b.belt.length=Math.min(b.belt.length,3);
   return {kx,ky,got,bothActiveFrames:both,frames};},[X,Y]);
 ok('06 Vine Knot carries two streams at once without mixing',r.got.h[0]>20&&r.got.v[1]>20&&!r.got.h[1]&&!r.got.v[0]&&r.bothActiveFrames>0,r);
 await shot(p,'vt06_knot.png',(r.kx+.5)*T,(r.ky+.5)*T,6,560,420);
 await shot(p,'vt06_knot_wide.png',(r.kx+.5)*T,(r.ky+.5)*T,2.4,700,460);

 // ---------- 7. every resource readable in the same vessel ----------
 r=await p.evaluate(([X,Y])=>{const bs=__put(Array.from({length:7},(_,i)=>[i<4?'conveyor':'tconveyor',X+i,Y+17,0]));
   const out={};__look((X+3.5)*T,(Y+17.5)*T,4);for(const b of bs)b.belt.length=0;const I0=__frame();
   bs.forEach((b,i)=>b.belt.push({i,p:.5}));const I1=__frame();
   bs.forEach((b,i)=>{const [ix,iy]=beltPos((b.x+.5)*T,(b.y+.5)*T,0,0,.5);const c=__at(I1,ix,iy),e=__at(I0,ix,iy),ic=[1,3,5].map(k=>parseInt(IT[i].c.slice(k,k+2),16));out[IT[i].n]={vsEmpty:__d(c,e),vsColour:__d(c,ic)};});
   return out;},[X,Y]);
 ok('07 copper, lead, sand, coal, titanium, resin and chitin all read on top of the vessel',Object.values(r).every(v=>v.vsEmpty>45&&v.vsColour<150),r);
 await shot(p,'vt07_resources.png',(X+3.5)*T,(Y+17.5)*T,4,720,170);

 // ---------- 9. resource movement at normal and distant zoom ----------
 r=await p.evaluate(([X,Y])=>{const out={};const b=blockAt(X+2,Y+17);
   for(const z of [2,.6]){__look((X+3.5)*T,(Y+17.5)*T,z);b.belt.length=0;const I0=__frame();b.belt.push({i:COAL,p:.5});const I1=__frame();
     const [ix,iy]=beltPos((b.x+.5)*T,(b.y+.5)*T,0,0,.5);out['z'+z]={vsEmpty:__d(__at(I1,ix,iy),__at(I0,ix,iy)),lite:vineLite};}
   return out;},[X,Y]);
 ok('09 items show at normal and distant zoom (distant zoom drops the extra motion)',r.z2.vsEmpty>45&&r['z0.6'].vsEmpty>30&&!r.z2.lite&&r['z0.6'].lite,r);
 const sR=await p.evaluate(()=>window.__game().time);

 // ---------- 13. saves: visual state never reaches a save; a save made with art loads and draws the same ----------
 r=await p.evaluate(async()=>{const G=window.__game();const S0=snapGame(),j=JSON.stringify(S0);
   const sig=g=>{let s='';for(const b of [...g.blocks.values()].sort((a,b)=>a.id-b.id))if(VINE[b.t])s+=b.t+b.x+','+b.y+':'+b.rot+'['+(b.belt||[]).map(i=>i.i+'@'+i.p.toFixed(4)).join(' ')+'|'+(b.buf&&b.t==='junction'?b.buf.map(q=>q.map(i=>i.i).join('.')).join('/'):'')+']';return s;};
   const a=sig(G);const s=await encodeSave();applySave(await decodeSave(s));const G1=window.__game();const bb=sig(G1);G1.paused=true;
   let errs=0;try{render();}catch(e){errs++;}
   const leaked=/"(act|fe|be|_st|_cv|_cvk)"/.test(j);
   return {same:a===bb,len:a.length,leaked,renderErrors:errs,vines:[...G1.blocks.values()].filter(b=>VINE[b.t]).length};});
 ok('13 save and load keep every vessel and item; no visual state is saved',r.same&&!r.leaked&&r.renderErrors===0&&r.vines>50,r);
 ok('00 no script errors (painted)',p.errs.length===0,p.errs.slice(0,5));
 await p.close();

 // ---------- 8. Root Taps and the Bloom ----------
 p=await open();
 r=await p.evaluate(()=>{rnd=seeded(3);startGame('survival');rnd=Math.random;const G=window.__game();G.items=G.items.map(()=>2000);G.webFree=true;G.countdown=1e9;
   const X=G.core.x,Y=G.core.y,dx=X<30?1:-1,x0=dx>0?X+3:X-1;
   // vine from the Bloom's side out 8 tiles, a Root Tap at the far end on copper
   const tiles=[];for(let i=0;i<8;i++)tiles.push(x0+dx*i);const far=tiles[7]+dx,dxs=dx>0?far:far-1;
   for(let yy=Y;yy<Y+2;yy++)for(let xx=dxs;xx<dxs+2;xx++)G.ore[yy*MW+xx]=CU;
   for(const x of tiles){if(!G.web[(Y+1)*MW+x])setWeb((Y+1)*MW+x,1);}for(let yy=Y;yy<Y+2;yy++)for(let xx=dxs;xx<dxs+2;xx++)if(!G.web[yy*MW+xx])setWeb(yy*MW+xx,1);
   const okD=tryPlace('drill',dxs,Y,0,true);for(const x of tiles)tryPlace('conveyor',x,Y+1,dx>0?2:0,true);
   for(const b of G.blocks.values())b.built=1;const c0=G.items[CU];
   for(let k=0;k<60*25;k++)step(1/60);
   const first=blockAt(tiles[7],Y+1),last=blockAt(tiles[0],Y+1);vineEnds(first,vst(first));vineEnds(last,vst(last));
   G.paused=true;return {okD,copper:Math.round(G.items[CU]-c0),firstBack:vst(first).be,lastFront:vst(last).fe,cx:(tiles[3]+.5)*T,cy:(Y+1.5)*T};});
 ok('08 a Root Tap feeds the Bloom: the vessel opens into both growths',r.okD&&r.copper>0&&r.firstBack===1&&r.lastFront===1,r);
 await shot(p,'vt08_tap_bloom.png',r.cx,r.cy,2.6,760,420);
 ok('00 no script errors (Root Tap scene)',p.errs.length===0,p.errs.slice(0,5));
 await p.close();

 // ---------- 11. Painted Artwork off (Low) and switched at runtime; transport identical either way ----------
 const runSim=async(q)=>{const p=await open({q});const out=await p.evaluate(()=>{const G0=__range();const [X,Y]=G0;const G=window.__game();
     const L=[];for(let i=0;i<12;i++)L.push([i===6?'junction':i>8?'tconveyor':'conveyor',X+i,Y,0]);for(let i=-4;i<=4;i++)if(i)L.push(['conveyor',X+6,Y+i,1]);
     for(let i=0;i<6;i++)L.push(['conveyor',X+12,Y+i,1]);L.push(['conveyor',X+12,Y+6,2]);__put(L);let n=0;
     const s1=blockAt(X,Y),s2=blockAt(X+6,Y-4);
     for(let k=0;k<60*10;k++){if(accepts(s1,n%7,null))s1.belt.unshift({i:n++%7,p:0});if(accepts(s2,CU,null))s2.belt.unshift({i:CU,p:0});step(1/60);if(k%3===0){__look((X+6)*T,Y*T,k%2?3:.7);render();}}
     let s='';for(const b of [...G.blocks.values()].sort((a,b)=>a.id-b.id))if(VINE[b.t])s+=b.t+'['+(b.belt||[]).map(i=>i.i+'@'+i.p.toFixed(6)).join(' ')+'|'+(b.t==='junction'?b.buf.map(q=>q.map(i=>i.i+':'+i.t.toFixed(4)).join('.')).join('/'):'')+']';
     return {sig:s,art:vineArtOn()};});out.errs=p.errs;await p.close();return out;};
 const A=await runSim('high'),Bq=await runSim('low');
 ok('11 transport is identical with Painted Artwork on and off',A.art&&!Bq.art&&A.sig===Bq.sig&&A.sig.length>200&&!A.errs.length&&!Bq.errs.length,{artOn:A.art,artOff:Bq.art,same:A.sig===Bq.sig,len:A.sig.length,errs:[...A.errs,...Bq.errs].slice(0,3)});
 p=await open({q:'low'});
 r=await p.evaluate(()=>{const [X,Y]=__range();__put([['conveyor',X,Y,0],['tconveyor',X+1,Y,0],['junction',X+2,Y,0]]);const off=vineArtOn();
   applyQuality('high');const on=vineArtOn();__look((X+1.5)*T,(Y+.5)*T,4);render();applyQuality('low');const off2=vineArtOn();render();applyQuality('medium');const med=vineArtOn();return {off,on,off2,med,X,Y};});
 ok('11b switching Low / High / Medium at runtime swaps the look',!r.off&&r.on&&!r.off2&&r.med,r);
 await p.evaluate(()=>applyQuality('low'));
 await p.evaluate(([X,Y])=>{__put([['conveyor',X,Y+2,0],['conveyor',X+1,Y+2,1],['conveyor',X+1,Y+3,1]]);for(const b of window.__game().blocks.values())if(b.belt)b.belt.push({i:CU,p:.5});},[r.X,r.Y]);
 await shot(p,'vt11_low.png',(r.X+1.5)*T,(r.Y+1.5)*T,4,600,420);
 await p.evaluate(()=>applyQuality('high'));await p.waitForTimeout(200);await shot(p,'vt11_high.png',(r.X+1.5)*T,(r.Y+1.5)*T,4,600,420);
 ok('00 no script errors (quality switching)',p.errs.length===0,p.errs.slice(0,5));await p.close();

 // ---------- 12. missing vine PNGs: the old look, no errors, other painted art unaffected ----------
 p=await open({block:/art\/plant\/vine\//});
 r=await p.evaluate(()=>{const [X,Y]=__range();__put([['conveyor',X,Y,0],['conveyor',X+1,Y,0],['junction',X+2,Y,0],['tconveyor',X+3,Y,0]]);for(const b of window.__game().blocks.values())if(b.belt)b.belt.push({i:CU,p:.5});
   __look((X+2)*T,(Y+.5)*T,4);let e=0;try{render();}catch(_){e++;}const D=ctx.getImageData(0,0,cv.width,cv.height).data;let nz=0;for(let k=0;k<D.length;k+=40)nz+=D[k]+D[k+1]+D[k+2]>0;
   return {vineState:ART.plant.vine.state,on:vineArtOn(),bloom:ART.plant.core.state,web:ART.plant.rootweb.state,renderErrors:e,drawn:nz>1000,X,Y};});
 ok('12 missing vine PNGs fall back to the old look',r.vineState==='failed'&&!r.on&&r.bloom==='ready'&&r.web==='ready'&&r.renderErrors===0&&r.drawn&&p.errs.length===0,{...r,errs:p.errs.slice(0,3)});
 await shot(p,'vt12_fallback.png',(r.X+2)*T,(r.Y+.5)*T,4,600,200);await p.close();

 fs.writeFileSync('vtest_result.json',JSON.stringify(R,null,1));
 const f=Object.entries(R).filter(([k,v])=>!v.pass);console.log(f.length?'FAILED: '+f.map(x=>x[0]).join(', '):'ALL PASS ('+Object.keys(R).length+')');
 await br.close();})();
