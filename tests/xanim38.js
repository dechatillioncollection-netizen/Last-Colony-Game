// v38: frame sequences taken from the game's own canvas: a Sap Burner taking in a piece of coal (from the moment its burn timer
// jumps back up), a Sunleaf through one of its ambient pulses, and a Spore Bellows through one breath while the Rootweb Node beside it
// is really spreading (so the Bellows is boosting it). Writes shots38/anim_<name>.png.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'index.html';
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots38',{recursive:true});
 const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8123/'+URL);await p.waitForTimeout(1500);
 const r=await p.evaluate(()=>{let s=7;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  // well away from the Bloom's own Rootweb, so the node's spread is the only growth here
  const R=webRadius(G.core),cl=new Set(webList(G.core));let X=-1,Y=-1;
  for(let y=3;y<MH-23&&X<0;y+=2)for(let x=3;x<MW-29;x+=2){let ok=true;for(let yy=y-1;yy<y+20&&ok;yy+=1)for(let xx=x-1;xx<x+26;xx++)if(cl.has(yy*MW+xx)){ok=false;break;}if(ok){X=x;Y=y;break;}}
  for(let y=Y-1;y<Y+20;y++)for(let x=X-1;x<X+26;x++){const i=y*MW+x;G.terrain[i]=0;G.ore[i]=-1;setWeb(i,0);}
  for(let y=Y-1;y<Y+6;y++)for(let x=X-1;x<X+26;x++)setWeb(y*MW+x,1);
  const ore=(x,y,it)=>{for(let yy=Y+y;yy<Y+y+2;yy++)for(let xx=X+x;xx<X+x+2;xx++)G.ore[yy*MW+xx]=it;};
  const put=(t,x,y,r)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
  ore(1,1,COAL);put('drill',1,1);put('conveyor',3,2,0);const burner=put('combustion',4,2);
  const leaf=put('solar',8,2);put('solar',9,2);put('solar',8,3);
  for(let k=0;k<4;k++)put('solar',12+k,2);
  const bel=put('bellows',4,10);setWeb((Y+11)*MW+X+9,1);const node=put('node',9,11);
  for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
  window.__a={burner,leaf,bel,node,X,Y};G.paused=true;return {X,Y,R,pow:G.powSat};});
 const tick=`(()=>{const {X,Y}=window.__a;const e=blockAt(X+3,Y+2);step(1/30);})()`;
 await p.evaluate(t=>{for(let k=0;k<20;k++){eval(t);render();}},tick);
 const shots={bel:[7,11.5,2.6],burner:[4.5,2.5,1.3],leaf:[8.5,2.5,1.3]};
 for(const [name,[cx,cy,box]] of Object.entries(shots)){
  const strip=await p.evaluate(([name,cx,cy,box,tick])=>{const {X,Y}=window.__a,b=window.__a[name];cam.z=2.5;centerOn(X+cx,Y+cy);render();
    let guard=0;
    if(name==='burner'){let last=b.burn;while(guard++<3000){eval(tick);render();if(b.burn>last+.5)break;last=b.burn;}}
    else if(name==='leaf'){const P=EG.solar.period;while(guard++<3000){eval(tick);render();const ph=((G.time+b.id*.37)/P)%1;if(ph<.04)break;}}
    else{let last=0;while(guard++<3000){eval(tick);render();const s=OST.get(b);if(s&&s.ph>0&&s.ph<last)break;if(s)last=s.ph;}}
    const N=12,stp=name==='burner'?5:name==='leaf'?9:7,sz=Math.round(box*2*T*cam.z*DPR),sheet=document.createElement('canvas');sheet.width=sz*N/2;sheet.height=sz*2;const sc=sheet.getContext('2d');
    const log=[];
    for(let f=0;f<N;f++){for(let k=0;k<stp;k++){eval(tick);render();}
      const px=((X+cx-box)*T-cam.x)*cam.z*DPR,py=((Y+cy-box)*T-cam.y)*cam.z*DPR;sc.drawImage(cv,px,py,sz,sz,(f%6)*sz,Math.floor(f/6)*sz,sz,sz);
      const s=OST.get(b)||{};sc.fillStyle='#fff';sc.font='12px monospace';
      sc.fillText(name==='burner'?`+${((f+1)*stp/30).toFixed(2)}s burn ${b.burn.toFixed(2)}`:name==='bel'?`breath ${(s.ph||0).toFixed(2)} web ${window.__a.node.wi}`:`+${((f+1)*stp/30).toFixed(1)}s`,(f%6)*sz+4,Math.floor(f/6)*sz+14);
      log.push(name==='burner'?[+b.burn.toFixed(2),b.inv[COAL],+(s.gl||0).toFixed(2)]:name==='bel'?[+(s.ph||0).toFixed(2),window.__a.node.wi,s.mot?s.mot.length:0,G.powSat]:[f]);}
    return {url:sheet.toDataURL('image/png'),log,guard};},[name,cx,cy,box,tick]);
  fs.writeFileSync('shots38/anim_'+name+'.png',Buffer.from(strip.url.split(',')[1],'base64'));console.log(name,strip.guard,JSON.stringify(strip.log));}
 console.log(JSON.stringify(r),'errors',errs);await br.close();})();
