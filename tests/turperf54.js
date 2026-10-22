// v54 drawing cost: 25, 50, 100 and 200 HDF turrets (all four kinds, a third damaged) in a dense block, turning, firing (shot times,
// Lancer beams and hit flashes fed every few frames) and timed per render() over 120 frames (median, mean and 95th percentile) at three zoom levels, in v53 (built-in
// look) and this build (painted), at Medium, High and Epic. Writes perf54.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',NEW=process.env.NEW||'index.html',OLD=process.env.OLD||'_v53.html';
const run=async(br,file,q,z,N)=>{const p=await br.newPage({viewport:{width:1600,height:900}});
 await p.addInitScript(q=>{try{localStorage.clear();localStorage.setItem('lc_quality',q);localStorage.setItem('lc_fog','0');}catch(e){}},q);
 await p.goto(URL+file);await p.waitForTimeout(1500);
 const r=await p.evaluate(([q,z,N])=>{applyQuality(q);let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.paused=true;
   const c=G.core,K=['duo','hail','scatter','lancer'],L=[];let n=0;
   for(let y=-12;y<=12&&n<N;y+=2)for(let x=8;x<=50&&n<N;x+=2){const t=K[n%4],X=c.x+x,Y=c.y+y;if(!freeArea(X,Y,B[t].size))continue;const b=addBlock(t,X,Y,0,1);b.built=1;b.ang=n*.7;if(n%3===0)b.hp=b.max*(.2+(n%5)*.12);L.push(b);n++;}
   cam.z=z;centerOn(c.x+22,c.y);for(let i=0;i<20;i++){step(1/30);render();}
   const t=[];for(let i=0;i<120;i++){step(1/30);
     L.forEach((b,j)=>{b.ang+=.02*((j%3)-1);if((i+j)%6===0){if(b.t==='lancer'){const [x,y]=bCenter(b);G.fx.push({k:'laser',x1:x,y1:y,x2:x+6*Math.cos(b.ang),y2:y+6*Math.sin(b.ang),life:.25,max:.25,team:1});}else{b.shot=G.time;b.rr^=1;}}if((i+j)%9===0)b.hit=.1;});
     const a=performance.now();render();t.push(performance.now()-a);}
   t.sort((a,b)=>a-b);return {med:t[t.length>>1],mean:t.reduce((a,b)=>a+b,0)/t.length,p95:t[Math.floor(t.length*.95)],n};},[q,z,N]);
 await p.close();return r;};
(async()=>{const br=await chromium.launch();const out=[];
 for(const q of (process.env.QS||'medium,high,epic').split(','))for(const N of (process.env.NS||'25,50,100,200').split(',').map(Number))for(const z of (process.env.ZS||'2,1,.6').split(',').map(Number)){
  const a=await run(br,OLD,q,z,N),b=await run(br,NEW,q,z,N);out.push({q,z,N,v53:a,v54:b});
  console.log(q,N,'turrets zoom',z,'median v53',a.med.toFixed(2),'v54',b.med.toFixed(2),'| mean v53',a.mean.toFixed(2),'v54',b.mean.toFixed(2),'| p95 v53',a.p95.toFixed(2),'v54',b.p95.toFixed(2));}
 fs.writeFileSync(process.env.OUT||'perf54.json',JSON.stringify(out,null,1));await br.close();})();
