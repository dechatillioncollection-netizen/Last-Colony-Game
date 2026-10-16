// v37: frame sequences of a Root Tap and a Deep Root mining a piece, and a Chitin Vat finishing a plate, taken from the game's own
// canvas, frame by frame, starting just before the real event. Writes shots37/anim_<name>.png (one strip per structure).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'index.html';
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots37',{recursive:true});
 const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8123/'+URL);await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-9;
  for(let y=Y-1;y<Y+14;y++)for(let x=X-1;x<X+24;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++)G.ore[yy*MW+xx]=it;};
  const put=(t,x,y,r)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
  ore(1,1,CU);const tap=put('drill',1,1);for(let k=0;k<3;k++)put('conveyor',3+k,2,0);
  ore(9,1,TI);const deep=put('pdrill',9,1);for(let k=0;k<3;k++)put('tconveyor',11+k,2,0);
  const vat=put('smelter',17,1);put('conveyor',16,1,0);put('conveyor',17,0,1);for(let k=0;k<3;k++)put('conveyor',19+k,2,0);
  put('combustion',17,5);put('combustion',18,5);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
  window.__a={tap,deep,vat,X,Y};G.paused=true;return [X,Y];});
 // run the colony a while so everything is flowing, keeping the vat and burners supplied and the far ends of the vines clear
 const tick=`(()=>{const {vat,X,Y}=window.__a;const G=window.__game();for(const o of G.blocks.values())if(o.t==='combustion')o.inv[COAL]=5;
   if(vat.inv[COAL]<2)vat.inv[COAL]++;if(vat.inv[SAND]<4)vat.inv[SAND]+=2;
   for(const [x,y] of [[5,2],[13,2],[21,2]]){const e=blockAt(X+x,Y+y);if(e)e.belt=e.belt.filter(i=>i.p<.9);}step(1/30);})()`;
 await p.evaluate(t=>{for(let k=0;k<300;k++)eval(t);},tick);
 const shots={tap:[2,2,'prog',1],deep:[10,2,'prog',1],vat:[18,2,'prog',1]};
 for(const [name,[cx,cy]] of Object.entries(shots)){
  const strip=await p.evaluate(([name,cx,cy,tick])=>{const {X,Y}=window.__a,b=window.__a[name];cam.z=2.5;centerOn(X+cx,Y+cy);render();
    // run until the next real event is a frame or two away
    // run (drawing every frame, as the game does) until the real event happens, then capture the frames after it
    let guard=0,last=b.prog;while(guard++<3000){eval(tick);render();if(b.prog<last)break;last=b.prog;}
    const N=12,sz=Math.round(2.6*T*cam.z*DPR),sheet=document.createElement('canvas');sheet.width=sz*N/2;sheet.height=sz*2;const sc=sheet.getContext('2d');
    const log=[];
    for(let f=0;f<N;f++){const n=f<6?2:3;for(let k=0;k<n;k++)eval(tick);render();
      const px=((X+cx-1.3)*T-cam.x)*cam.z*DPR,py=((Y+cy-1.3)*T-cam.y)*cam.z*DPR;sc.drawImage(cv,px,py,sz,sz,(f%6)*sz,Math.floor(f/6)*sz,sz,sz);
      sc.fillStyle='#fff';sc.font='12px monospace';sc.fillText(`t+${(f<6?(f+1)*2:12+(f-5)*3)}f prog ${b.prog.toFixed(2)} out ${b.out}`,(f%6)*sz+4,Math.floor(f/6)*sz+14);log.push([+b.prog.toFixed(2),b.out,+(G.time-(OST.get(b)||{}).mine).toFixed(2),organLite(b.t),ORGAN_N[b.t]]);}
    return {url:sheet.toDataURL('image/png'),log};},[name,cx,cy,tick]);
  fs.writeFileSync('shots37/anim_'+name+'.png',Buffer.from(strip.url.split(',')[1],'base64'));console.log(name,JSON.stringify(strip.log));}
 console.log('errors',errs);await br.close();})();
