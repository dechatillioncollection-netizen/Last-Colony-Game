// Painted Vines performance: networks of ~100, 500 and 1,000 vessel tiles, all carrying items, painted art vs the old look
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});const res=[];
 for(const art of ['0','1']){
  const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(a=>{try{localStorage.setItem('lc_quality','high');localStorage.setItem('lc_art',a);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_gl','0')}catch(e){}},art);
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1000);
  for(const n of [100,500,1000]){
   const r=await p.evaluate(n=>{rnd=seeded(3);startGame('siege');rnd=Math.random;const G=window.__game();G.items=G.items.map(()=>1e6);G.webFree=true;G.countdown=1e9;
     // rows of vessels: every 4th row a Swift Vine, a Vine Knot every 10 tiles; lines 40 tiles long
     const L=40,rows=Math.ceil(n/L),x0=Math.max(2,G.core.x-L-6),y0=Math.max(2,G.core.y-rows-6);const lines=[];let placed=0;
     for(let k=0;k<90&&placed<n;k++){const y=y0+k*2,t=k%4===3?'tconveyor':'conveyor',line=[];
       for(let i=0;i<L&&placed<n;i++){const x=x0+i;const tt=(i%10===5&&k%2===0)?'junction':t;if(tryPlace(tt,x,y,0,true)){placed++;const b=blockAt(x,y);if(b&&b.t!=='junction')line.push(b);}}
       lines.push(line);}
     for(const b of G.blocks.values())b.built=1;
     window.__tick=()=>{for(const ln of lines){if(!ln.length)continue;const a=ln[0],z=ln[ln.length-1];if(accepts(a,0,null))a.belt.unshift({i:(Math.random()*7)|0,p:0});
       if(z.belt.length&&z.belt[z.belt.length-1].p>=1)z.belt.pop();}step(1/60);};
     for(let k=0;k<60*5;k++)__tick();
     let items=0,vis=0;for(const b of G.blocks.values())if(b.belt)items+=b.belt.length;
     return {placed,items,cx:x0+L/2,cy:y0+rows*1.2};},n);
   const out={art,n:r.placed,items:r.items};
   for(const z of [1.6,.8,.5]){
     const t=await p.evaluate(([z,cx,cy])=>{cam.z=z;centerOn(cx,cy);const G=window.__game();for(let k=0;k<10;k++){__tick();render();}
       const vx1=cam.x+VW/z,vy1=cam.y+VH/z,tx0=Math.floor(cam.x/T),ty0=Math.floor(cam.y/T),tx1=Math.floor(vx1/T),ty1=Math.floor(vy1/T);
       const inView=(x,y,m)=>x>=tx0-m&&x<=tx1+1+m&&y>=ty0-m&&y<=ty1+1+m;
       const setT=()=>{ctx.setTransform(DPR*z,0,0,DPR*z,-cam.x*DPR*z,-cam.y*DPR*z);ctx.imageSmoothingEnabled=SET.hd;};
       // only the vessels and their items, rasterised every iteration (getImageData forces the canvas to draw)
       const draw=()=>{setT();if(vineArtOn())drawVinesPass(ctx,inView,G.time,z);else for(const b of G.blocks.values())if(VINE[b.t]&&inView(b.x,b.y,3))drawBlock(ctx,b.t,b.x*T,b.y*T,b.rot,b,G.time,0);};
       const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);};
       const med=a=>a.sort((x,y)=>x-y)[a.length>>1];const A=[],B0=[];
       for(let r=0;r<40;r++){__tick();let t0=performance.now();clear();ctx.getImageData(0,0,1,1);B0.push(performance.now()-t0);
         t0=performance.now();clear();draw();ctx.getImageData(0,0,1,1);A.push(performance.now()-t0);}
       let inv=0;for(const b of G.blocks.values())if(VINE[b.t]&&inView(b.x,b.y,1))inv++;
       return {vines_ms:+(med(A)-med(B0)).toFixed(2),visible:inv,lite:typeof vineLite!=='undefined'?vineLite:null};},[z,r.cx,r.cy]);
     out['z'+z]=t;}
   if(n===1000)await p.screenshot({path:'perf_'+art+'_1000.png'});
   res.push(out);console.log(JSON.stringify(out));}
  if(errs.length)console.log('errs',errs.slice(0,3));await p.close();}
 await br.close();})();
