// v62: the Bloom Heart. The floating seed in the Bloom's chamber is replaced by a painted heart (art/plant/bloom/heart.png) that
// squeezes harder than the chamber on each beat. Run with a web server on the repo root (port 8123). SHOTS is where pictures go.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',SHOTS=process.env.SHOTS||'shots62';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
(async()=>{const br=await chromium.launch();
 const open=async(art='1',rm=false)=>{const ctx=await br.newContext({viewport:{width:1280,height:800},reducedMotion:rm?'reduce':'no-preference'});const p=await ctx.newPage();
  p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(a=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');localStorage.setItem('lc_splash','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',a);}catch(e){}},art);
  await p.goto(URL+'index.html');await p.waitForTimeout(1500);
  await p.evaluate(()=>{window.T62={R0:render,
    setup(){startGame('survival');G.core.hp=1e9;for(let s=0;s<20*30;s++){G.enemies.length=0;step(1/30);}window.render=()=>{};G.paused=true;
      const [cx,cy]=bCenter(G.core);cam.z=2.6;centerOn(cx,cy);},
    // draws one frame at game time t and records the size the heart sprite is drawn at
    frame(t){const a=ART.plant.core,i=a.layers.findIndex(L=>L.f==='heart.png'),im=a.img[i];let z=null;const D=CanvasRenderingContext2D.prototype.drawImage;
      CanvasRenderingContext2D.prototype.drawImage=function(...x){if(x[0]===im&&x.length>=5)z=x[3];return D.apply(this,x);};
      G.time=t;try{T62.R0();}finally{CanvasRenderingContext2D.prototype.drawImage=D;}return {z,A:CIRC.A};}};});
  return p;};
 {const p=await open();
  const r=await p.evaluate(()=>{const a=ART.plant.core;return {state:a.state,files:a.layers.map(L=>L.f),old:a.layers.some(L=>L.f==='core.png')};});
  ok('1. the Bloom Heart art loads and the old seed is gone',r.state==='ready'&&r.files.includes('heart.png')&&!r.old,JSON.stringify(r));
  await p.evaluate(()=>T62.setup());
  // a beat from rest: the heart's size each frame against the chamber's tightening
  const s=await p.evaluate(()=>{const t0=G.time;CIRC.beat=null;CIRC.next=t0+.02;const out=[];for(let i=0;i<40;i++)out.push(T62.frame(t0+i/30));return out;});
  const rest=s[0].z,min=Math.min(...s.map(f=>f.z)),peak=s.reduce((m,f)=>f.A>m.A?f:m,s[0]);
  const squeeze=1-min/rest,chamber=1-(1-peak.A*1.15);
  ok('2. the heart is drawn and squeezes with the beat, harder than the chamber',rest>0&&squeeze>chamber*1.8,`heart ${(squeeze*100).toFixed(1)}%, chamber ${(chamber*100).toFixed(1)}%`);
  await p.evaluate(()=>{CIRC.beat=null;CIRC.next=G.time+999;CIRC.A=0;CIRC.aft=0;CIRC.P.length=0;T62.frame(G.time);});await p.screenshot({path:SHOTS+'/heart_rest.png',clip:{x:440,y:200,width:400,height:400}});
  const tp=await p.evaluate(()=>{const t0=G.time;CIRC.beat=null;CIRC.next=t0;T62.frame(t0);let best=t0,A=0;for(let i=1;i<20;i++){const f=T62.frame(t0+i/30);if(f.A>A){A=f.A;best=t0+i/30;}}return best;});
  await p.evaluate(t=>T62.frame(t),tp);await p.screenshot({path:SHOTS+'/heart_beat.png',clip:{x:440,y:200,width:400,height:400}});
  await p.evaluate(()=>{const [cx,cy]=bCenter(G.core);cam.z=1;centerOn(cx,cy);T62.frame(G.time+5);});await p.screenshot({path:SHOTS+'/heart_zoom1.png',clip:{x:340,y:100,width:600,height:600}});
  ok('no page errors',!p.errs.length,p.errs.join(' | '));await p.context().close();}
 {const p=await open('1',true);await p.evaluate(()=>T62.setup());
  const s=await p.evaluate(()=>{const t0=G.time;const out=[];for(let i=0;i<30;i++)out.push(T62.frame(t0+i/10).z);return out;});
  ok('3. reduced motion: the heart holds still',s.every(z=>z===s[0]),s.slice(0,3).join(','));
  ok('no page errors',!p.errs.length,p.errs.join(' | '));await p.context().close();}
 {const p=await open('0');await p.evaluate(()=>{T62.setup();T62.R0();});
  ok('4. painted art off: the drawn Bloom still draws',!p.errs.length,p.errs.join(' | '));await p.context().close();}
 await br.close();console.log(fails?fails+' FAILED':'ALL PASSED');process.exit(fails?1:0);})();
