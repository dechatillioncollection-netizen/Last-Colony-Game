// Living Rootweb: the 14 test cases plus gameplay invariants. Served over http so the web canvas can be read back.
const {chromium}=require(process.env.PW||'playwright');
const URL='http://localhost:8123/index.html';
const R={};const ok=(k,pass,info)=>{R[k]={pass:!!pass,info};console.log((pass?'PASS ':'FAIL ')+k+' '+JSON.stringify(info));};
(async()=>{const br=await chromium.launch();
 const open=async(opts={})=>{const p=await br.newPage({viewport:{width:1000,height:700}});const errs=[];p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
   p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text())});
   await p.addInitScript(o=>{try{localStorage.setItem('lc_hd',o.hd===false?'0':'1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',o.art===false?'0':'1')}catch(e){}},opts);
   if(opts.block)await p.route(opts.block,r=>r.abort());
   await p.goto(URL);await p.waitForTimeout(900);
   await p.evaluate(()=>{
     window.__seed=n=>{Math.random=(()=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647})();};
     window.__flush=()=>{for(const bn of webBorn.values())bn.t=-99;let g=0;while((webQ.size||webBorn.size)&&g++<5000)webArtTick();};
     // every pixel the Rootweb paints must sit on a covered tile; and tile borders must not be visible inside the membrane
     window.__check=()=>{const G=window.__game();let x0=MW,y0=MH,x1=0,y1=0;for(let i=0;i<N;i++)if(G.web[i]){const x=i%MW,y=(i/MW)|0;x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);}
       x0=Math.max(0,x0-2);y0=Math.max(0,y0-2);x1=Math.min(MW-1,x1+2);y1=Math.min(MH-1,y1+2);const W=(x1-x0+1)*T,H=(y1-y0+1)*T,D=webPeek(x0*T,y0*T,W,H).data;
       let leak=0,bS=0,bN=0,iS=0,iN=0;const px=(X,Y)=>(Y*W+X)*4;
       for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++){const c=G.web[ty*MW+tx];const ox=(tx-x0)*T,oy=(ty-y0)*T;
         if(!c){for(let j=0;j<T;j+=3)for(let k=0;k<T;k+=3)if(D[px(ox+k,oy+j)+3]>0){leak++;j=T;break;}continue;}
         // interior tiles (all 8 neighbours covered): compare the colour step across the right/bottom border with steps inside the tile
         let all=true;for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++)if(!webAt(tx+dx,ty+dy))all=false;if(!all||tx>=x1||ty>=y1)continue;
         for(let j=0;j<T;j++){const a=px(ox+T-1,oy+j),b=px(ox+T,oy+j),c1=px(ox+11,oy+j),c2=px(ox+12,oy+j);
           for(let q=0;q<4;q++){bS+=Math.abs(D[a+q]-D[b+q]);iS+=Math.abs(D[c1+q]-D[c2+q]);}bN++;iN++;
           const a2=px(ox+j,oy+T-1),b2=px(ox+j,oy+T),d1=px(ox+j,oy+11),d2=px(ox+j,oy+12);for(let q=0;q<4;q++){bS+=Math.abs(D[a2+q]-D[b2+q]);iS+=Math.abs(D[d1+q]-D[d2+q]);}bN++;iN++;}}
       return {leak,seam:+(bS/Math.max(1,bN)).toFixed(2),inside:+(iS/Math.max(1,iN)).toFixed(2)};};
     window.__alpha=(x,y)=>{const D=webPeek(x*T,y*T,T,T).data;let s=0,n=0,on=0;for(let k=3;k<D.length;k+=4){s+=D[k];n++;if(D[k]>40)on++;}return {mean:s/n,cover:on/n};};
     window.__setOnly=(tiles)=>{const G=window.__game();for(let i=0;i<N;i++)if(G.web[i])setWeb(i,0);for(const [x,y] of tiles)setWeb(y*MW+x,1);};
   });
   p.errs=errs;return p;};
 const shot=async(p,f,z,cx,cy)=>{await p.evaluate(([z,cx,cy])=>{cam.z=z;centerOn(cx,cy);},[z,cx,cy]);await p.waitForTimeout(350);await p.screenshot({path:f});};

 // ---------- 1. small patch around the Bloom ----------
 let p=await open();
 let r=await p.evaluate(()=>{__seed(5);startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<30*3;k++)step(1/30);G.paused=true;__flush();return {web:G.webCount,...__check(),cx:G.core.x,cy:G.core.y};});
 ok('01 small patch around the Bloom',r.leak===0&&r.web>50&&r.seam<r.inside*1.6+2,r);await shot(p,'t01_small.png',1.6,r.cx+1.5,r.cy+1.5);

 // ---------- 3. corridors, 4. diagonals and corners ----------
 r=await p.evaluate(()=>{const G=window.__game();const cx=G.core.x,cy=G.core.y,t=[];
   for(let x=cx-3;x<=cx+5;x++)for(let y=cy-3;y<=cy+5;y++)t.push([x,y]);                         // the patch under the Bloom
   const free=(x,y)=>inMap(x,y)&&!blockedT(y*MW+x);
   const lines=[];for(const w of [1,2,3]){const L=[];const y0=cy-3+(w-1)*0;}
   // corridors going right: 1, 2 and 3 tiles wide, 12 long
   const cor={1:[],2:[],3:[]};let yy=cy-3;for(const w of [1,2,3]){for(let x=cx+6;x<cx+18;x++)for(let k=0;k<w;k++){if(free(x,yy+k)){t.push([x,yy+k]);cor[w].push([x,yy+k]);}}yy+=w+2;}
   for(let x=cx+6;x<cx+6+1;x++)for(let y=cy-3;y<yy;y++)t.push([x,y]);
   // a diagonal staircase band and an L-shape going left
   // the diagonal direction with the least ore and rock in the way
   let bdir=[-1,-1],bs=1e9;for(const [sx,sy] of [[-1,-1],[-1,1],[1,1],[1,-1]]){let bad=0;for(let k=0;k<10;k++)for(let w=0;w<2;w++){const x=cx+1.5+sx*(5+k)|0,y=cy+1.5+sy*(5+k)+w|0;if(!free(x,y)||G.ore[y*MW+x]>=0)bad++;}if(bad<bs){bs=bad;bdir=[sx,sy];}}
   const dia=[];for(let k=0;k<10;k++)for(let w=0;w<2;w++){const x=cx+1.5+bdir[0]*(5+k)|0,y=cy+1.5+bdir[1]*(5+k)+w|0;if(free(x,y)){t.push([x,y]);if(G.ore[y*MW+x]<0)dia.push([x,y]);}}
   for(let k=0;k<5;k++){const x=cx+1.5+bdir[0]*k|0,y=cy+1.5+bdir[1]*k|0;t.push([x,y],[x+1,y],[x,y+1]);}   // joined to the patch
   for(let k=0;k<8;k++){t.push([cx-4-k,cy+5]);t.push([cx-11,cy+5-k]);}
   __setOnly(t);G.paused=true;__flush();const res={...__check()};
   for(const w of [1,2,3]){const a=cor[w].filter(([x,y])=>webAt(x,y)&&x<cx+17&&G.ore[y*MW+x]<0).map(([x,y])=>__alpha(x,y));res['w'+w+'min']=+Math.min(...a.map(v=>v.cover)).toFixed(2);res['w'+w+'avg']=+(a.reduce((s,v)=>s+v.cover,0)/a.length).toFixed(2);}
   // the outer corner pixel of a convex corner tile must be empty (rounded), the diagonal must still read as one band
   const ex=cx+17,ey=cy-3;const D=webPeek(ex*T,ey*T,T,T).data;res.cornerA=D[((0)*T+T-1)*4+3];
   const da=dia.filter(([x,y])=>webAt(x,y)).map(([x,y])=>__alpha(x,y).cover);res.diagMin=+Math.min(...da).toFixed(2);res.diagAvg=+(da.reduce((a,b)=>a+b,0)/da.length).toFixed(2);res.cx=cx;res.cy=cy;res.dir=bdir;return res;});
 ok('03 corridors keep a continuous membrane',r.leak===0&&r.w1min>.2&&r.w2avg>.45&&r.w3avg>.6,r);
 ok('04 diagonals and corners are rounded, not stepped',r.leak===0&&r.cornerA===0&&r.diagMin>.15&&r.diagAvg>.4,{cornerAlpha:r.cornerA,diagMin:r.diagMin,diagAvg:r.diagAvg});
 await shot(p,'t03_corridors.png',1.5,r.cx+11,r.cy);await shot(p,'t04_diagonal.png',1.5,r.cx+1.5+r.dir[0]*8,r.cy+1.5+r.dir[1]*8);

 // ---------- 5. ore ----------
 r=await p.evaluate(()=>{__seed(5);startGame('survival');const G=window.__game();G.countdown=1e9;G.paused=true;
   // the nearest ore patch: cover it and a margin around it
   let best=null,bd=1e9;for(let i=0;i<N;i++)if(G.ore[i]>=0){const x=i%MW,y=(i/MW)|0,d=Math.hypot(x-G.core.x,y-G.core.y);if(d<bd&&d>4){bd=d;best=[x,y];}}
   const t=[];for(let y=best[1]-6;y<=best[1]+6;y++)for(let x=best[0]-6;x<=best[0]+6;x++)if(inMap(x,y)&&!blockedT(y*MW+x))t.push([x,y]);__setOnly(t);__flush();
   let oa=0,on=0,na=0,nn=0,jump=0,jn=0;for(const [x,y] of t){const i=y*MW+x,a=__alpha(x,y).mean;if(G.ore[i]>=0){oa+=a;on++;}else{na+=a;nn++;}}
   // the change in membrane alpha across ore borders, against the change inside tiles
   for(const [x,y] of t){const i=y*MW+x;if(G.ore[i]<0||!webAt(x+1,y)||G.ore[i+1]>=0)continue;const D=webPeek(x*T+T-2,y*T,4,T).data;
     for(let j=0;j<T;j++){jump+=Math.abs(D[(j*4+1)*4+3]-D[(j*4+2)*4+3]);jn++;}}
   return {...__check(),oreAlpha:+(oa/on).toFixed(1),plainAlpha:+(na/nn).toFixed(1),oreTiles:on,borderJump:+(jump/Math.max(1,jn)).toFixed(2),x:best[0],y:best[1]};});
 ok('05 ore stays readable and its window has no hard edge',r.leak===0&&r.oreAlpha<r.plainAlpha*.75&&r.borderJump<6,r);await shot(p,'t05_ore.png',1.8,r.x+.5,r.y+.5);
 console.log('errors so far',p.errs);await p.close();

 // ---------- 6/7. painted and unpainted buildings sit on top; 8 Nodes; 9 Bellows ----------
 p=await open();
 r=await p.evaluate(()=>{__seed(11);startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);const cx=G.core.x,cy=G.core.y,put=(t,x,y)=>{for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(tryPlace(t,x+dx,y+dy,0,true)){const b=blockAt(x+dx,y+dy);return [b.x,b.y];}}return false;};
   for(let k=0;k<30*25;k++)step(1/30);
   const placed={nest:put('nest',cx+6,cy-2),nest2:put('nest',cx-6,cy+3),duo:put('duo',cx+2,cy-4),wall:put('wall',cx-2,cy+5),wall2:put('wall',cx-1,cy+5),conveyor:put('conveyor',cx+3,cy+5,0),node:put('node',cx+9,cy+5),bellows:put('bellows',cx-7,cy-4)};
   const w0=G.webCount;for(let k=0;k<30*30;k++)step(1/30);for(const b of G.blocks.values())b.built=1;G.paused=true;repaintAllWeb();__flush();
   const ch=webChan.map(c=>c.key.split('>').map(id=>G.blocks.get(+id).t).join('>'));
   return {placed,w0,w1:G.webCount,chans:ch,...__check(),cx,cy,unl:[...G.unlocked]};});
 const cx=r.cx,cy=r.cy;
 ok('08 Rootweb Nodes grow and link back',r.placed.node&&r.chans.some(c=>c.endsWith('>node'))&&r.w1>r.w0,{chans:r.chans,web:[r.w0,r.w1]});
 ok('09 Spore Bellows link back',r.placed.bellows&&r.chans.some(c=>c.endsWith('>bellows')),{placed:r.placed,chans:r.chans});
 // fill the whole Rootweb layer with pure magenta: wherever a building is opaque, no magenta may show through
 const P=r.placed;const cen=[['duo',P.duo[0]+.5,P.duo[1]+.5],['nest',P.nest[0]+1,P.nest[1]+1],['wall',P.wall[0]+.5,P.wall[1]+.5],['conveyor',P.conveyor[0]+.5,P.conveyor[1]+.5],['core',cx+1.5,cy+1.5],['node',P.node[0]+.5,P.node[1]+.5]];
 await p.evaluate(([cx,cy])=>{window.__fx=webArtFx;webArtFx=()=>{};WFX.length=0;cam.z=2;centerOn(cx+1.5,cy+1);},[cx,cy]);await p.waitForTimeout(300);
 await p.screenshot({path:'t06_buildings_art.png'});
 const pos=await p.evaluate(cen=>{const out={};for(const [n,x,y] of cen)out[n]=[(x*T-cam.x)*cam.z,(y*T-cam.y)*cam.z];for(const c of webCk)if(c){c.x.save();c.x.setTransform(1,0,0,1,0,0);c.x.fillStyle='#ff00ff';c.x.fillRect(0,0,WCP,WCP);c.x.restore();}return out;},cen);
 await p.waitForTimeout(250);await p.screenshot({path:'t06_magenta.png'});
 await p.evaluate(()=>{SET.art=false;repaintAllWeb();});await p.waitForTimeout(300);await p.screenshot({path:'t07_buildings_old.png'});
 await p.evaluate(()=>{SET.art=true;repaintAllWeb();__flush();webArtFx=window.__fx;});
 let same={};{const py=`
from PIL import Image
import json,sys
a=Image.open('t06_magenta.png').convert('RGB');pos=json.loads(sys.argv[1]);out={}
for k,(x,y) in pos.items():
  x=round(x);y=round(y);n=0
  for j in range(-2,3):
    for i in range(-2,3):
      p=a.getpixel((x+i,y+j))
      if p[0]>200 and p[1]<60 and p[2]>200: n+=1
  out[k]=n
print(json.dumps(out))`;require('fs').writeFileSync('cmp.py',py);same=JSON.parse(require('child_process').execSync(`python3 cmp.py '${JSON.stringify(pos)}'`).toString());}
 ok('06 painted buildings draw over the Rootweb',r.leak===0&&same.duo===0&&same.nest===0&&same.core===0,{magentaPixels:same});
 ok('07 unpainted buildings draw over the Rootweb',r.leak===0&&same.wall===0&&same.node===0,{magentaPixels:same});
 await shot(p,'t08_node_bellows.png',1.3,cx+1,cy);

 // ---------- 10. zoom: motion at normal zoom, none when far ----------
 r=await p.evaluate(async([cx,cy])=>{const G=window.__game();G.paused=false;G.countdown=1e9;cam.z=1.5;centerOn(cx+1.5,cy+1.5);
   const frames=async n=>{const ts=[];let last=performance.now();for(let k=0;k<n;k++){await new Promise(r=>requestAnimationFrame(r));const t=performance.now();ts.push(t-last);last=t;}return ts;};
   await frames(90);const near=WFX.length,kinds=[...new Set(WFX.map(f=>f.k))];cam.z=.6;await frames(10);const far=WFX.length;cam.z=1.5;return {near,kinds,far};},[cx,cy]);
 ok('10 living motion at normal zoom, none when zoomed out',r.near>0&&r.far===0,r);
 console.log('errors so far',p.errs);await p.close();
 // ---------- 2. large colony and 11. 30% coverage on the largest map ----------
 p=await open();
 r=await p.evaluate(async()=>{__seed(7);startGame('siege');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;G.unlocked.add('root1');G.unlocked.add('root2');
   const cx=G.core.x,cy=G.core.y,put=(t,x,y)=>tryPlace(t,x,y,0,true);
   // grow towards the cap with Nodes spread over the map, timing the simulation (which includes painting the new Rootweb)
   let simMs=0,steps=0;const placeNodes=()=>{for(let k=0;k<8;k++){const a=Math.random()*6.283,d=6+Math.random()*40;put('node',Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d));}};
   for(let s=0;s<10;s++){placeNodes();const t=performance.now();for(let k=0;k<30*20;k++){step(1/30);steps++;}simMs+=performance.now()-t;webQ.clear();for(const bn of webBorn.values())bn.t=-99;}
   G.paused=true;const share=G.webCount/N;
   const t1=performance.now();repaintAllWeb();const syncMs=performance.now()-t1;const t2=performance.now();__flush();const fullMs=performance.now()-t2+syncMs;
   const chk=__check();
   // frame cost: draw the whole scene many times, painted Rootweb against the old HD membrane
   cam.z=1;centerOn(cx+1.5,cy+1.5);const fr=async n=>{const t=performance.now();for(let k=0;k<n;k++)render();return (performance.now()-t)/n;};
   await fr(10);const artFrame=await fr(60);cam.z=.5;await fr(5);const artFar=await fr(60);
   SET.art=false;repaintAllWeb();cam.z=1;const oldFrame=await fr(60);cam.z=.5;const oldFar=await fr(60);
   const t3=performance.now();repaintAllWeb();const oldRepaint=performance.now()-t3;SET.art=true;repaintAllWeb();__flush();cam.z=1;
   return {map:MW+'x'+MH,web:G.webCount,share:+share.toFixed(3),nodes:[...G.blocks.values()].filter(b=>b.t==='node').length,simMsPerSec:+(simMs/(steps/30)).toFixed(1),syncMs:Math.round(syncMs),fullMs:Math.round(fullMs),oldRepaint:Math.round(oldRepaint),
     artFrame:+artFrame.toFixed(2),oldFrame:+oldFrame.toFixed(2),artFar:+artFar.toFixed(2),oldFar:+oldFar.toFixed(2),...chk,cx,cy};});
 ok('02 large colony',r.leak===0&&r.web>3000&&r.seam<r.inside*1.6+2,r);
 ok('11 30% coverage performance',r.share>.25&&r.artFrame<r.oldFrame*1.6+2&&r.syncMs<200,{share:r.share,frameMs:[r.artFrame,r.oldFrame],farFrameMs:[r.artFar,r.oldFar],repaintMs:{visibleNow:r.syncMs,all:r.fullMs,oldHD:r.oldRepaint},simMsPerGameSecond:r.simMsPerSec});
 await shot(p,'t02_large_far.png',.45,r.cx+1.5,r.cy+1.5);await shot(p,'t02_large_mid.png',1,r.cx+1.5,r.cy+1.5);
 // the same growth with the old look, for the cost of painting during growth
 r=await p.evaluate(()=>{const run=art=>{SET.art=art;__seed(7);startGame('siege');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;G.unlocked.add('root1');G.unlocked.add('root2');
     const cx=G.core.x,cy=G.core.y;for(let k=0;k<30;k++){const a=Math.random()*6.283,d=6+Math.random()*40;tryPlace('node',Math.round(cx+Math.cos(a)*d),Math.round(cy+Math.sin(a)*d),0,true);}
     for(let k=0;k<30*8;k++)step(1/30);webQ.clear();for(const bn of webBorn.values())bn.t=-99;while(webBorn.size)webArtTick();const w0=G.webCount;
     const t=performance.now();let worst=0;for(let k=0;k<30*30;k++){const a=performance.now();step(1/30);if(art)webArtTick();worst=Math.max(worst,performance.now()-a);}return {ms:performance.now()-t,web:G.webCount,grown:G.webCount-w0,worst,backlog:webQ.size+webBorn.size};};
   const a=run(true),b=run(false);SET.art=true;return {art:a,old:b};});
 ok('11b growth cost per game second',r.art.ms/30<r.old.ms/30*2+40&&r.art.worst<30,{artMsPerSec:+(r.art.ms/30).toFixed(1),oldMsPerSec:+(r.old.ms/30).toFixed(1),tilesGrownPerSec:Math.round(r.art.grown/30),worstStepMs:[+r.art.worst.toFixed(1),+r.old.worst.toFixed(1)],backlog:r.art.backlog});
 console.log('errors so far',p.errs);await p.close();

 // ---------- 12. save and load ----------
 p=await open();
 r=await p.evaluate(async()=>{__seed(3);startGame('survival');const G0=window.__game();G0.countdown=1e9;G0.items=G0.items.map(v=>v+9000);const cx=G0.core.x,cy=G0.core.y;
   for(let k=0;k<30*20;k++)step(1/30);for(const [t,dx,dy] of [['nest',5,-1],['node',8,3],['duo',2,-4]])tryPlace(t,cx+dx,cy+dy,0,true);for(let k=0;k<30*20;k++)step(1/30);
   const sig=g=>({web:g.webCount,hash:Array.from(g.web).reduce((h,v,i)=>(h*31+v*(i+1))|0,0),blocks:g.blocks.size,time:Math.round(g.time)});
   const a=sig(G0);SET.art=true;const s1=await encodeSave();const j1=JSON.stringify(snapGame());SET.art=false;const j2=JSON.stringify(snapGame());SET.art=true;
   const chans=webChan.length;const S=await decodeSave(s1);applySave(S);const G1=window.__game();__flush();const b=sig(G1);
   const keys=Object.keys(S).join(',');const json=JSON.stringify(S);
   return {a,b,sameSaveArtOnOff:j1===j2,chans,chansAfter:webChan.length,leaks:/webBorn|webNod|webChan|WFX/.test(json),...__check()};});
 ok('12 save and load',JSON.stringify(r.a)===JSON.stringify(r.b)&&r.sameSaveArtOnOff&&!r.leaks&&r.chans===r.chansAfter&&r.leak===0,r);
 // ---------- 13. HD on and off, with and without the painted look ----------
 const modes={};for(const [hd,art] of [[true,true],[false,true],[true,false],[false,false]]){
   const m=await p.evaluate(([hd,art])=>{SET.hd=hd;if(hd)buildHDTerrain();SET.art=art;repaintAllWeb();__flush();const G=window.__game();const i=[...G.web.keys()].find(i=>G.web[i]&&webAt(i%MW+1,(i/MW|0))&&webAt(i%MW-1,(i/MW|0))&&webAt(i%MW,(i/MW|0)+1)&&webAt(i%MW,(i/MW|0)-1));
     return {path:webArtOn()?'painted':hd?'hd':'classic',alpha:Math.round(__alpha(i%MW,(i/MW)|0).mean),leak:__check().leak};},[hd,art]);
   modes[(hd?'HD':'noHD')+'/'+(art?'art':'noart')]=m;await p.evaluate(()=>{cam.z=1.4;centerOn(window.__game().core.x+1.5,window.__game().core.y+1.5);});await p.waitForTimeout(250);await p.screenshot({path:`t13_${hd?'hd':'nohd'}_${art?'art':'old'}.png`});}
 ok('13 HD and the older looks still work',modes['HD/art'].path==='painted'&&modes['noHD/art'].path==='painted'&&modes['HD/noart'].path==='hd'&&modes['noHD/noart'].path==='classic'&&Object.values(modes).every(m=>m.alpha>0)&&modes['HD/art'].leak===0&&modes['noHD/art'].leak===0,modes);
 // ---------- 14. the Settings toggle ----------
 r=await p.evaluate(async()=>{SET.hd=true;buildHDTerrain();SET.art=true;repaintAllWeb();$('setBtn').click();const cb=$('optArt');const before=webArtOn();cb.checked=false;cb.dispatchEvent(new Event('change'));const off=webArtOn();
   await new Promise(r=>setTimeout(r,100));cb.checked=true;cb.dispatchEvent(new Event('change'));__flush();const on=webArtOn();$('settings').hidden=true;return {before,off,on,stored:localStorage.getItem('lc_art')};});
 ok('14a Settings toggle switches the look both ways',r.before&&!r.off&&r.on,r);
 console.log('errors so far',p.errs);await p.close();
 // missing textures: the painted Rootweb quietly falls back to the existing look
 p=await open({block:'**/rootweb/cells.png'});
 r=await p.evaluate(()=>{__seed(3);startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<30*8;k++)step(1/30);G.paused=true;repaintAllWeb();
   return {state:ART.plant.rootweb.state,on:webArtOn(),bloomArt:!!artFor('core',0),web:G.webCount,alpha:Math.round(__alpha(G.core.x+4,G.core.y+1).mean)};});
 await p.evaluate(()=>{cam.z=1.4;centerOn(window.__game().core.x+1.5,window.__game().core.y+1.5);});await p.waitForTimeout(400);await p.screenshot({path:'t14_fallback.png'});
 ok('14b missing Rootweb art falls back to the HD membrane',r.state==='failed'&&!r.on&&r.web>0&&p.errs.length===0,{...r,errors:p.errs});await p.close();

 // ---------- gameplay is untouched: the same game with and without the painted look ----------
 p=await open();
 r=await p.evaluate(()=>{__seed(21);startGame('survival');let G=window.__game();G.countdown=1e9;const cx=G.core.x,cy=G.core.y;G.items=G.items.map(v=>v+3000);for(let k=0;k<30*20;k++)step(1/30);
   const S0=JSON.stringify(snapGame());
   const run=art=>{SET.art=art;applySave(JSON.parse(S0));__seed(99);const G=window.__game();G.countdown=1e9;
     for(const [t,dx,dy] of [['nest',5,-1],['node',8,3],['duo',2,-4],['duo',3,4],['bellows',-6,-3],['wall',-2,5]])tryPlace(t,cx+dx,cy+dy,0,true);
     for(let k=0;k<30*120;k++)step(1/30);return JSON.stringify(snapGame());};
   const a=run(false),b=run(false),c=run(true);SET.art=true;return {deterministic:a===b,same:a===c,snapshotBytes:a.length};});
 ok('15 gameplay identical with the painted Rootweb on or off (2 min growth, full save snapshot)',r.deterministic&&r.same,r);
 console.log('errors',p.errs);await p.close();
 require('fs').writeFileSync('wbtest_result.json',JSON.stringify(R,null,1));console.log(Object.values(R).filter(v=>v.pass).length+'/'+Object.keys(R).length+' passed');await br.close();})();
