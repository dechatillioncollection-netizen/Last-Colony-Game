// v64 terrain screenshots: the same views in any build (TAG=before on the previous page, after on this one).
// URL the page, OUT the folder, Q the quality preset (low|medium|high|epic). Writes <OUT>/<tag>_<view>_<q>.png and prints bake times.
const {chromium}=require(process.env.PW||'playwright');const GLF=process.env.SWGL?['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']:[];
const URL=process.env.URL||'http://localhost:8123/index.html',OUT=process.env.OUT||'shots64',TAG=process.env.TAG||'after',QS=(process.env.Q||'high').split(',');
const fs=require('fs');fs.mkdirSync(OUT,{recursive:true});
(async()=>{const br=await chromium.launch({args:GLF});
 for(const q of QS){
 const p=await br.newPage({viewport:{width:1600,height:900},deviceScaleFactor:+(process.env.DPR||1)});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForTimeout(1200);
 await p.evaluate(q=>{try{localStorage.setItem('lc_steady','0');}catch(e){}applyQuality(q);SET.fog=false;window.__s={
  start(id){const t0=performance.now();if(id==='survival'||id==='siege'){rnd=(()=>{let s=+(new URLSearchParams(location.search).get('seed')||7);return()=>{s=(Math.imul(s,1103515245)+12345)>>>0;return s/4294967296;};})();startGame(id);rnd=Math.random;}
   else{startMission(id);try{skipDlg();skipDlg();}catch(e){}if(G.story){G.story.s='main';G.story.hold=false;G.story.cease=false;}$('tut').hidden=true;}
   const ms=performance.now()-t0;for(const e of G.enemies)e.dead=true;G.enemies=[];G.countdown=999;$('msgs').innerHTML='';G.paused=true;return ms;},
  look(x,y,z){G.paused=true;cam.z=z;centerOn(x,y);},ore(){const o=[];for(let i=0;i<N;i++)if(G.ore[i]>=0)o.push(i);const i=o[(o.length*.37)|0];return [i%MW,(i/MW)|0];}};},q);
 const shot=async(name,x,y,z)=>{await p.evaluate(([x,y,z])=>__s.look(x,y,z),[x,y,z]);await p.waitForTimeout(500);await p.screenshot({path:`${OUT}/${TAG}_${name}_${q}.png`});};
 const views=process.env.VIEWS?process.env.VIEWS.split(','):['landfall','ember','frost','last','kilo','survival','siege'];
 for(const v of views){const ms=await p.evaluate(v=>__s.start(v),v);console.log(q,v,'start ms',Math.round(ms));
  const [cx,cy]=await p.evaluate(()=>[G.coreX+1.5,G.coreY+1.5]);const [ox,oy]=await p.evaluate(()=>__s.ore());
  await shot(v+'_base',cx+6,cy,1);await shot(v+'_ore_close',ox+.5,oy+.5,2.5);await shot(v+'_ore',ox+.5,oy+.5,1.4);await shot(v+'_far',cx+20,cy,.5);}
 console.log(q,'errors',errs);await p.close();}
 await br.close();})();
