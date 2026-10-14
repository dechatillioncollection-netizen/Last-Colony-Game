// processor time per frame for the Rootweb, GPU path vs 2D painter, during fast growth (the GPU's own drawing time is not included)
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const out={};
 for(const gl of ['2','0']){const p=await br.newPage({viewport:{width:1280,height:800}});
  await p.addInitScript(g=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1');localStorage.setItem('lc_gl',g)}catch(e){}},gl);
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1200);
  out[gl==='2'?'gpu':'2d']=await p.evaluate(()=>{Math.random=(()=>{let s=7;return()=>(s=(s*16807)%2147483647)/2147483647})();
    startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+20000);const cx=G.core.x,cy=G.core.y;
    const put=(t,x,y)=>{for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++)if(Math.max(Math.abs(dx),Math.abs(dy))===r&&tryPlace(t,x+dx,y+dy,0,true))return true;return false;};
    G.webFree=true;for(const [t,dx,dy] of [['nest',8,-3],['nest',-6,5],['nest',2,8],['duo',3,-4],['duo',-3,-3],['duo',6,3],['node',12,6],['node',-12,-6],['bellows',-8,-5]])put(t,cx+dx,cy+dy);
    for(const b of G.blocks.values())b.built=1;G.webFree=false;cam.z=1.2;centerOn(cx+2,cy+1);
    if(typeof GLR!=='undefined'){const di=ctx.drawImage;ctx.drawImage=function(s){if(s===GLR.cv)return;return di.apply(this,arguments);};}
    for(let k=0;k<10;k++)render();   // warm up (shaders, first uploads)
    const w0=G.webCount;let tr=0,ts=0;const n=150;
    for(let k=0;k<n;k++){let a=performance.now();for(let j=0;j<4;j++)step(1/30);ts+=performance.now()-a;a=performance.now();render();tr+=performance.now()-a;}
    let tv=0,tb=0;if(typeof GLR!=='undefined'&&webGPU){for(let k=0;k<n;k++){let a=performance.now();glVeins(Math.floor(cam.x/T),Math.floor(cam.y/T),Math.ceil((cam.x+VW/cam.z)/T),Math.ceil((cam.y+VH/cam.z)/T));tv+=performance.now()-a;
      a=performance.now();const d=GLR.woBuf;for(let i=0;i<N;i++){d[i*2]=G.web[i];d[i*2+1]=G.ore[i]>=0?1:0;}tb+=performance.now()-a;}}
    let tt=0;if(!webGPU){webQ.clear();for(let k=0;k<n;k++){for(let j=0;j<4;j++)step(1/30);const a=performance.now();webArtTick();tt+=performance.now()-a;}}
    let ti=0;for(let k=0;k<n;k++){const a=performance.now();render();ti+=performance.now()-a;}
    return {gpu:webGPU,grew:G.webCount-w0,renderMsGrowing:+(tr/n).toFixed(2),renderMsIdle:+(ti/n).toFixed(2),stepMsPerFrame:+(ts/n).toFixed(2),veinQuadsMs:+(tv/n).toFixed(3),coverageBufMs:+(tb/n).toFixed(3),painterTickMs:+(tt/n).toFixed(2)};});
  await p.close();}
 console.log(JSON.stringify(out));await br.close();})();
