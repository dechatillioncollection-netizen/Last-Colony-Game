// v40: 200 walls in joined rows (Bark Wall, Ironbark, Great Bark in turn), every fifth one at 40% health, in view at zoom 0.9 in both
// builds. Past the crowd limit (48 Great Bark) that kind draws its cached picture. Writes shots40/crowd_<tag>.png.
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();
 for(const [u,tag] of [['previous/index.html','before'],['index.html','after']]){const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto('http://localhost:8123/'+u);await p.waitForTimeout(1200);
  const r=await p.evaluate(()=>{let s=3;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    const X=G.core.x+5,Y=G.core.y-16;
    for(let y=Y-1;y<Y+34;y++)for(let x=X-1;x<X+44;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    let x=0,y=0,n=0;const kinds=['wall','twall','wallL'];
    while(n<200&&y<32){const t=kinds[n%3],w=t==='wallL'?2:1;if(x+w>40){x=0;y+=3;continue;}if(tryPlace(t,X+x,Y+y,0,true))n++;x+=w;}
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();G.paused=true;
    let k=0;for(const b of G.blocks.values())if((b.t==='wall'||b.t==='twall'||b.t==='wallL')&&(k++%5===0))b.hp=b.max*.4;
    cam.z=.9;centerOn(X+20,Y+12);for(let i=0;i<20;i++){step(1/30);render();}msgEl.style.display='none';
    return typeof organLite==='function'&&typeof DW!=='undefined'?['wall','twall','wallL'].map(t=>organLite(t)):null;});
  await p.waitForTimeout(300);await p.screenshot({path:'shots40/crowd_'+tag+'.png'});console.log(tag,JSON.stringify(r),errs);await p.close();}
 await br.close();})();
