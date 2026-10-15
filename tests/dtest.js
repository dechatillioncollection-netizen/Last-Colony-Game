// Rootweb supply and dormancy (looks only): patches cut off from the Bloom stop pulsing and fade, recover when joined again,
// survive save and load, and nothing in the game itself changes. GL=0 (2D painter, default) or GL=2 (GPU Rootweb, forced).
// Writes dtest_result.json and dtest_*.png; prints PASS/FAIL per check.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html',GLM=process.env.GL||'0';
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1400,height:860}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(g=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl',g);}catch(e){}},GLM);
 await p.goto(URL);await p.waitForTimeout(1500);
 const R=[];const check=(name,ok,info)=>{R.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info));};
 const setup=await p.evaluate(()=>{let s=21;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;startGame('survival');G.countdown=1e9;G.items=G.items.map(v=>v+99999);
  const cy=G.core.y+1,x0=G.core.x+3;
  for(let y=cy-16;y<=cy+16;y++)for(let x=x0;x<Math.min(MW-1,x0+70);x++){if(!inMap(x,y))continue;G.terrain[y*MW+x]=0;G.ore[y*MW+x]=-1;}
  drawTerrainAll();repaintAllWeb();
  window.__d={run(sec){const n=Math.round(sec*30);for(let k=0;k<n;k++)step(1/30);},
   node(x,y){const old=G.webFree;G.webFree=true;tryPlace('node',x,y,0,true);G.webFree=old;const b=blockAt(x,y);if(b){b.built=1;}G.dirty=true;return b;},
   patch(b){const L=webList(b);return L.filter(i=>G.web[i]);},
   dorm(list){let mx=0,mn=1,sum=0;for(const i of list){const d=WSUP.dorm[i];mx=Math.max(mx,d);mn=Math.min(mn,d);sum+=d;}return {min:+mn.toFixed(2),max:+mx.toFixed(2),avg:+(sum/Math.max(1,list.length)).toFixed(2)};},
   pulses(b,sec){// run the real pulse spawner over the area around b and count the pulses that start at b
     const [cx,cy]=bCenter(b);const c=document.createElement('canvas').getContext('2d');let n=0;WFX.length=0;const z=cam.z;cam.z=Math.max(cam.z,1.2);
     for(let k=0;k<sec*30;k++){webArtFx(c,1000+k/30,Math.floor(cx-8),Math.floor(cy-8),Math.floor(cx+8),Math.floor(cy+8));for(const f of WFX)if(!f.seen){f.seen=1;if(f.b===b||(f.c&&Math.hypot(f.c.pts[f.c.pts.length-2]-cx,f.c.pts[f.c.pts.length-1]-cy)<1))n++;}if(WFX.length>40)WFX.length=0;}
     cam.z=z;return n;}};
  // let the Bloom finish its own Rootweb
  __d.run(150);let ex=0;for(let x=0;x<MW;x++)if(G.web[cy*MW+x])ex=x;
  const R=webRadius({t:'node',x:0,y:0,size:1});
  // spacing: the far Node's Rootweb must not touch the Bloom's own (which is fed directly), and neighbours in the chain must overlap
  const cov=new Set(G.core.wlist);const near=(x,y)=>{for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(cov.has(yy*MW+xx))return true;return false;};
  let S=R+1;for(;S<2*R-2;S++){const c={t:'node',x:ex-1+2*S,y:cy,size:1};let hit=false;for(const i of webList(c))if(near(i%MW,(i/MW)|0)){hit=true;break;}if(!hit)break;}
  return {S,cy,ex,R,gpu:webGPU,art:webArtOn(),gl:SET.gl,why:GLR.why};});
 const {cy,ex,R:NR,S}=setup;console.log('setup',JSON.stringify(setup));
 // a chain of Rootweb Nodes out from the Bloom's edge: A (on the Bloom's Rootweb), B, C; and D, a second route from A to C
 const ax=ex-1,bx=ax+S,cx=bx+S,dx=ax+S,dy=cy+Math.round(NR*.75);
 let r=await p.evaluate(([ax,bx,cx,cy,dx,dy])=>{const A=__d.node(ax,cy);__d.run(40);const B=__d.node(bx,cy);__d.run(40);const C=__d.node(cx,cy);__d.run(40);
   const cut0=WSUP.iso;window.__n={A,B,C};return {placed:[!!A,!!B,!!C],iso:cut0,live:webFed(cx,cy),dormC:__d.dorm(__d.patch(C)),pulsesC:__d.pulses(C,8),pulsesA:__d.pulses(A,8)};},[ax,bx,cx,cy,dx,dy]);
 check('1 fully joined Rootweb is fed: no dormant tiles, pulses run out to the far Node',r.placed.every(Boolean)&&r.iso===0&&r.live&&r.dormC.max===0&&r.pulsesC>0,r);
 // 7. two routes: add D (also joining A and C), cut B: C stays fed through D
 r=await p.evaluate(([dx,dy])=>{const {A,B,C}=__n;const D=__d.node(dx,dy);__d.run(40);__n.D=D;destroyBlock(B);__d.run(45);return {D:!!D,Bgone:!G.blocks.has(B.id),iso:WSUP.iso,live:webFed(C.x,C.y),dormC:__d.dorm(__d.patch(C))};},[dx,dy]);
 check('7 two supply routes, one severed: the far Node stays fed through the other',r.D&&r.Bgone&&r.iso===0&&r.live&&r.dormC.max===0,r);
 // 2-6. cut the second route: the patch is cut off, new pulses stop at once, the colour fades over about 14 s, the tissue stays
 r=await p.evaluate(()=>{const {A,C,D}=__n;destroyBlock(D);let w=0;while(webFed(C.x,C.y)&&w++<30*60)step(1/30);const cutAfter=+(w/30).toFixed(1);const patch=__d.patch(C);const iso=WSUP.iso;
   const at={};__d.run(.5);at.s0=__d.dorm(patch);const pul=__d.pulses(C,8),pulA=__d.pulses(A,8);__d.run(4);at.s4=__d.dorm(patch);__d.run(5);at.s9=__d.dorm(patch);__d.run(8);at.s17=__d.dorm(patch);__d.run(30);
   return {cutAfter,iso,patch:patch.length,live:webFed(C.x,C.y),pulsesC:pul,pulsesA:pulA,at,stillThere:patch.every(i=>G.web[i]===1),nodeAlive:G.blocks.has(C.id)};});
 check('2-3 severing the last link cuts the patch off (the Node keeps its own Rootweb)',r.iso>0&&r.iso>=r.patch&&!r.live&&r.stillThere&&r.nodeAlive,{iso:r.iso,patch:r.patch,live:r.live});
 check('4 no new nutrient pulses start in the cut-off patch; fed Rootweb keeps pulsing',r.pulsesC===0&&r.pulsesA>0,{cut:r.pulsesC,fed:r.pulsesA});
 check('5-6 dormancy comes on gradually (about 14 s) and the Rootweb stays visible',r.at.s0.max<.15&&r.at.s4.avg>.15&&r.at.s4.avg<.6&&r.at.s9.avg>r.at.s4.avg&&r.at.s17.min>=.99&&r.stillThere,r.at);
 await p.evaluate(()=>{const {C}=__n;G.paused=true;cam.z=1.25;centerOn(C.x-4,C.y);});await p.waitForTimeout(1600);await p.screenshot({path:`dtest_dormant_gl${GLM}.png`});await p.evaluate(()=>{G.paused=false;});
 // 11. growth carries on while cut off: a new Node on the patch spreads Rootweb, and the new tissue is dormant too
 r=await p.evaluate(()=>{const {C}=__n;const E=__d.node(C.x+3,C.y);__d.run(30);const pe=__d.patch(E).filter(i=>!__d.patch(C).includes(i));__d.run(16);__n.E=E;return {E:!!E,newTiles:pe.length,dorm:__d.dorm(pe),liveE:webFed(E.x,E.y)};});
 check('11 Rootweb still grows while cut off, and the new growth is dormant',r.E&&r.newTiles>0&&!r.liveE&&r.dorm.min>=.99,r);
 // 9. an isolated Node on its own (placed away from any Rootweb) is dormant from the start
 r=await p.evaluate(([x,y])=>{const F=__d.node(x,y);__d.run(30);__n.F=F;const pf=__d.patch(F);return {F:!!F,tiles:pf.length,live:webFed(F.x,F.y),pulses:__d.pulses(F,6)};},[cx+12,cy-15]);
 check('9 an isolated Rootweb Node is not a nutrient source: its patch never pulses',r.F&&r.tiles>0&&!r.live&&r.pulses===0,r);
 // 8. several separate cut-off patches are counted together
 r=await p.evaluate(()=>{const {C,F}=__n;const a=__d.patch(C).length,b=__d.patch(F).length;let comp=0;const seen=new Uint8Array(N);
   for(let i=0;i<N;i++){if(!G.web[i]||WSUP.live[i]||seen[i])continue;comp++;const st=[i];seen[i]=1;while(st.length){const j=st.pop(),x=j%MW;const y=(j/MW)|0;for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++){if(!inMap(xx,yy))continue;const k=yy*MW+xx;if(G.web[k]&&!WSUP.live[k]&&!seen[k]){seen[k]=1;st.push(k);}}}}
   return {islands:comp,iso:WSUP.iso};});
 check('8 several cut-off patches at once',r.islands>=2,r);
 // 12. save and load while dormant: the same tiles are cut off and they come back already dormant (no fade from healthy)
 r=await p.evaluate(()=>{const {C}=__n;webSupply();const cut=[];for(let i=0;i<N;i++)if(G.web[i]&&!WSUP.live[i])cut.push(i);const before=__d.dorm(__d.patch(C));const S=JSON.stringify(snapGame());applySave(JSON.parse(S));__d.run(.2);webSupply();
   const C2=blockAt(C.x,C.y);return {iso0:cut.length,stillCut:cut.filter(i=>G.web[i]&&!WSUP.live[i]).length,before,after:__d.dorm(__d.patch(C2)),saveHasSupply:/"dorm"|"live"|WSUP/.test(S)};});
 check('12 save and load during dormancy: rebuilt from the Rootweb, still dormant, nothing extra in the save',r.iso0>0&&r.iso0===r.stillCut&&r.after.min>=.99&&!r.saveHasSupply,r);
 // 7/recovery: plant B again: the patch joins up, pulses return, the colour recovers over a few seconds
 r=await p.evaluate(([bx,cy])=>{const C=blockAt(__n.C.x,__n.C.y);const B=__d.node(bx,cy);let w=0;while(!webFed(C.x,C.y)&&w++<30*60)step(1/30);const patch=__d.patch(C);const at={joinedAfter:+(w/30).toFixed(1)};at.s0=__d.dorm(patch);
   __d.run(2);at.s2=__d.dorm(patch);__d.run(8);at.s10=__d.dorm(patch);return {B:!!B,live:webFed(C.x,C.y),at,pulses:__d.pulses(C,8)};},[bx,cy]);
 check('reconnecting: the patch is fed again, pulses return and the colour recovers gradually',r.B&&r.live&&r.at.s0.min>.85&&r.at.s2.avg>.4&&r.at.s2.avg<.8&&r.at.s10.max===0&&r.pulses>0,r);
 // 10. buildings on cut-off Rootweb keep working (a Thorn Spitter there still has its ammo, and dormancy never touches block state)
 r=await p.evaluate(()=>{const F=blockAt(__n.F.x,__n.F.y);const old=G.webFree;G.webFree=false;const ok=tryPlace('duo',F.x-2,F.y,0,true);G.webFree=old;const s=blockAt(F.x-2,F.y);if(s)s.built=1;
   const keys=s?Object.keys(s).sort().join(','):'';return {placedOnDormant:ok,blockFields:keys,fed:webFed(F.x-2,F.y)};});
 check('10 building on dormant Rootweb is allowed as before; no new block state',r.placedOnDormant&&!/dorm|fed|supply/i.test(r.blockFields)&&!r.fed,r);
 check('no page errors',errs.length===0,errs);
 const bad=R.filter(c=>!c.ok);console.log(bad.length?bad.length+' ROOTWEB SUPPLY CHECKS FAILED':'ALL '+R.length+' ROOTWEB SUPPLY CHECKS PASS');fs.writeFileSync(GLM==='0'?'dtest_result.json':'dtest_result_gl.json',JSON.stringify(R,null,1));await br.close();})();
