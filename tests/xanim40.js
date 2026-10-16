// v40: frame sequences taken from the game's own canvas: each wall taking a hit (hurtBlock, from the frame its health drops), each
// wall being mended by a powered Healing Pod (from the frame its health rises), and each wall worn down from full health to 10%.
// Writes shots40/anim_<kind>_<hit|mend|wear>.png.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'index.html';
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots40',{recursive:true});
 const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8123/'+URL);await p.waitForTimeout(1500);
 await p.evaluate(()=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-9;
  for(let y=Y-1;y<Y+12;y++)for(let x=X-1;x<X+16;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
  const A={X,Y,wall:put('wall',2,2),twall:put('twall',6,2),wallL:put('wallL',9,1)};put('wall',1,2);put('wall',3,2);put('twall',5,2);put('twall',7,2);
  put('mender',6,6);for(let k=0;k<4;k++)put('solar',8+k,6);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();window.__a=A;G.paused=true;});
 for(const kind of ['wall','twall','wallL'])for(const what of ['hit','mend','wear']){
  const strip=await p.evaluate(([kind,what])=>{const A=window.__a,b=A[kind],{X,Y}=A,n=b.size,cx=b.x+n/2-X,cy=b.y+n/2-Y,box=n>1?1.6:1.05;
    cam.z=3;centerOn(X+cx,Y+cy);msgEl.style.display='none';
    const pod=[...G.blocks.values()].find(o=>o.t==='mender');
    // the Healing Pod would mend the hit straight away: hold its timer except for the mend sequence (screenshot script only)
    const fr=()=>{if(what!=='mend')pod.prog=0;step(1/30);render();};
    b.hp=what==='mend'?b.max*.5:b.max;for(let k=0;k<20;k++){if(what!=='mend')b.hp=b.max;fr();}
    let guard=0;
    if(what==='hit'){hurtBlock(b,b.max*.04);fr();}
    else if(what==='mend'){let last=b.hp;while(guard++<600){fr();if(b.hp>last+.01)break;last=b.hp;}}
    const N=12,stp=what==='wear'?1:2,sz=Math.round(box*2*T*cam.z*DPR),sheet=document.createElement('canvas');sheet.width=sz*6;sheet.height=sz*2;const sc=sheet.getContext('2d');const log=[];
    for(let f=0;f<N;f++){
      if(what==='wear'){b.hp=b.max*(1-f*.9/(N-1));for(let k=0;k<45;k++)fr();}else for(let k=0;k<stp;k++){if(what==='hit')b.hp=Math.max(b.hp,1);fr();}
      const px=((X+cx-box)*T-cam.x)*cam.z*DPR,py=((Y+cy-box)*T-cam.y)*cam.z*DPR;sc.drawImage(cv,px,py,sz,sz,(f%6)*sz,Math.floor(f/6)*sz,sz,sz);
      const s=OST.get(b)||{};sc.fillStyle='#fff';sc.font='12px monospace';
      sc.fillText(what==='wear'?`health ${Math.round(100*b.hp/b.max)}%`:`+${((f+1)*stp/30).toFixed(2)}s ${Math.round(100*b.hp/b.max)}%`,(f%6)*sz+4,Math.floor(f/6)*sz+14);
      log.push([Math.round(100*b.hp/b.max),s.n||0,s.m||0]);}
    b.hp=b.max;return {url:sheet.toDataURL('image/png'),log,guard};},[kind,what]);
  fs.writeFileSync(`shots40/anim_${kind}_${what}.png`,Buffer.from(strip.url.split(',')[1],'base64'));console.log(kind,what,strip.guard,JSON.stringify(strip.log));}
 console.log('errors',errs);await br.close();})();
