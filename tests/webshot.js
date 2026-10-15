// Rootweb supply screenshots: healthy, cut off (dormant), recovering and reconnected, on the Low, Medium and Epic (GPU) presets.
// Writes shots35/web_<preset>_<state>.png and shots35/web_result.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const PRESETS=[['low','0'],['medium','0'],['epic','2']];
(async()=>{const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const out={};
 for(const [q,gl] of PRESETS){const p=await br.newPage({viewport:{width:1100,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(([q,gl])=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality',q);localStorage.setItem('lc_gl',gl);
    const Q={low:[0,0,0],medium:[1,0,1],epic:[1,1,1]}[q];localStorage.setItem('lc_hd',''+Q[0]);localStorage.setItem('lc_hq',''+Q[1]);localStorage.setItem('lc_art',''+Q[2]);}catch(e){}},[q,gl]);
  await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(1500);
  const info=await p.evaluate(()=>{let s=21;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');G.countdown=1e9;G.items=G.items.map(v=>v+99999);
   const cy=G.core.y+1,x0=G.core.x+3;
   for(let y=cy-16;y<=cy+16;y++)for(let x=x0;x<Math.min(MW-1,x0+70);x++){if(!inMap(x,y))continue;G.terrain[y*MW+x]=0;G.ore[y*MW+x]=-1;}
   drawTerrainAll();repaintAllWeb();
   window.__d={run(sec){const n=Math.round(sec*30);for(let k=0;k<n;k++)step(1/30);},
    node(x,y){const old=G.webFree;G.webFree=true;tryPlace('node',x,y,0,true);G.webFree=old;const b=blockAt(x,y);if(b){b.built=1;}G.dirty=true;return b;}};
   __d.run(150);let ex=0;for(let x=0;x<MW;x++)if(G.web[cy*MW+x])ex=x;
   const R=webRadius({t:'node',x:0,y:0,size:1});const cov=new Set(G.core.wlist);const near=(x,y)=>{for(let yy=y-1;yy<=y+1;yy++)for(let xx=x-1;xx<=x+1;xx++)if(cov.has(yy*MW+xx))return true;return false;};
   let S=R+1;for(;S<2*R-2;S++){const c={t:'node',x:ex-1+2*S,y:cy,size:1};let hit=false;for(const i of webList(c))if(near(i%MW,(i/MW)|0)){hit=true;break;}if(!hit)break;}
   const ax=ex-1,bx=ax+S,cx=bx+S;const A=__d.node(ax,cy);__d.run(40);const B=__d.node(bx,cy);__d.run(40);const C=__d.node(cx,cy);__d.run(60);
   window.__n={A,B,C,bx,cy};G.paused=true;cam.z=1.05;centerOn(bx+2,cy);return {gpu:webGPU,art:webArtOn(),q:SET.q,iso:WSUP.iso};});
  const shot=async st=>{await p.evaluate(()=>{let k=0;while((webQ.size||webBorn.size)&&k++<50000)webArtTick();});await p.waitForTimeout(1300);await p.screenshot({path:`shots35/web_${q}_${st}.png`,clip:{x:0,y:80,width:1100,height:540}});};
  await shot('1_healthy');
  info.cut=await p.evaluate(()=>{G.paused=false;destroyBlock(__n.B);let w=0;while(webFed(__n.C.x,__n.C.y)&&w++<30*90)step(1/30);__d.run(20);G.paused=true;return {cutAfter:+(w/30).toFixed(1),iso:WSUP.iso,fedC:webFed(__n.C.x,__n.C.y)};});
  await shot('2_dormant');
  info.re=await p.evaluate(()=>{G.paused=false;__n.B2=__d.node(__n.bx,__n.cy);let w=0;while(!webFed(__n.C.x,__n.C.y)&&w++<30*90)step(1/30);__d.run(3);G.paused=true;let s=0,n=0;for(let i=0;i<N;i++)if(G.web[i]){s+=WSUP.dorm[i];n++;}const P=webList(__n.C).filter(i=>G.web[i]);let m=0;for(const i of P)m+=WSUP.dorm[i];return {joinAfter:+(w/30).toFixed(1),iso:WSUP.iso,patchDorm:+(m/P.length).toFixed(2)};});
  await shot('3_recovering');
  info.done=await p.evaluate(()=>{G.paused=false;__d.run(10);G.paused=true;let mx=0;for(let i=0;i<N;i++)if(G.web[i])mx=Math.max(mx,WSUP.dorm[i]);return {iso:WSUP.iso,maxDorm:mx};});
  await shot('4_reconnected');
  info.errs=errs;out[q]=info;console.log(q,JSON.stringify(info));await p.close();}
 fs.writeFileSync('shots35/web_result.json',JSON.stringify(out,null,1));await br.close();})();
