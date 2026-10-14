// Real game loop, instrumented: where does frame time go, with the painted Rootweb on and off.
const {chromium}=require(process.env.PW||'playwright');
const page=process.argv[2]||'index.html',speed=+(process.argv[3]||4),mode=process.argv[4]||'growth';
(async()=>{const br=await chromium.launch();const out={};
 for(const art of (process.argv[6]||'1,0').split(',')){const p=await br.newPage({viewport:{width:1280,height:800}});
  await p.addInitScript(v=>{window.__stub=v;},process.argv[5]||'');await p.addInitScript(a=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',a==='0'?'0':'1');localStorage.setItem('lc_gl',a==='g'?'2':'0')}catch(e){}},art);
  await p.goto('http://localhost:8123/'+page);await p.waitForTimeout(1200);
  const r=await p.evaluate(async([speed,mode])=>{const W={};const wrap=n=>{const f=window[n];if(typeof f!=='function')return;W[n]={ms:0,n:0};window[n]=function(){const t=performance.now();try{return f.apply(this,arguments);}finally{W[n].ms+=performance.now()-t;W[n].n++;}};};
    startGame(mode==='siege'?'siege':'survival');const G=window.__game();G.items=G.items.map(v=>v+20000);const cx=G.core.x,cy=G.core.y;
    if(mode==='big'){G.webFree=true;for(let k=0;k<30*300;k++)step(1/30);}
    const put=(t,x,y)=>{for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&tryPlace(t,x+dx,y+dy,0,true))return true;return false;};
    G.webFree=true;for(const [t,dx,dy] of [['nest',8,-3],['nest',-6,5],['nest',2,8],['duo',3,-4],['duo',-3,-3],['duo',6,3],['duo',-5,0],['node',12,6],['node',-12,-6],['bellows',-8,-5]])put(t,cx+dx,cy+dy);
    for(const b of G.blocks.values())b.built=1;G.webFree=false;
    cam.z=1.2;centerOn(cx+2,cy+1);G.speed=speed;G.paused=false;
    const stub=window.__stub||'';if(stub.includes('fx'))webArtFx=()=>{};if(stub.includes('tick'))webArtTick=()=>{};
    for(const n of ['step','render','webArtTick','webArtFx','paintWeb','paintWebArt','paintWebHD','stepWeb','webChanSync','renderMini','updateHUD','glDraw','glUpload','glVeins'])wrap(n);
    {W.blit={ms:0,n:0};const di=ctx.drawImage;ctx.drawImage=function(s){if(typeof GLR!=='undefined'&&s===GLR.cv){const t=performance.now();try{return di.apply(this,arguments);}finally{W.blit.ms+=performance.now()-t;W.blit.n++;}}return di.apply(this,arguments);};}
    const iv=[];let last=performance.now(),run=true;const tick=t=>{iv.push(t-last);last=t;if(run)requestAnimationFrame(tick);};requestAnimationFrame(tick);
    const w0=G.webCount;await new Promise(r=>setTimeout(r,6000));run=false;
    iv.sort((a,b)=>a-b);const pc=q=>+iv[Math.floor(iv.length*q)].toFixed(1);
    for(const k in W){W[k].ms=+W[k].ms.toFixed(0);}
    return {frames:iv.length,fps:+(iv.length/6).toFixed(1),p50:pc(.5),p95:pc(.95),p99:pc(.99),long:iv.filter(x=>x>34).length,grew:G.webCount-w0,web:G.webCount,fx:typeof WFX!=='undefined'?WFX.length:0,W};},[speed,mode]);
  out[art==='1'?'art':art==='g'?'gpu':'old']=r;await p.close();}
 console.log(JSON.stringify(out,null,1));await br.close();})();
