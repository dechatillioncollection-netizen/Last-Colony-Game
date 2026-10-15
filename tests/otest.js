// Painted organs (v32): Splitter Bulb, Sorting Gland, Resin Gland, Rootweb Node. The checks from the brief.
// Served over http so canvases can be read back. Writes otest_result.json and ot_*.png screenshots.
// URL = the v32 page, OLD = the v31 page (same scene run in both for the "gameplay unchanged" checks).
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html',OLD=process.env.OLD||'http://localhost:8123/previous/index.html';
const R={};const ok=(k,pass,info)=>{R[k]={pass:!!pass,info};console.log((pass?'PASS ':'FAIL ')+k+' '+JSON.stringify(info));};
(async()=>{const br=await chromium.launch();
 const open=async(o={})=>{const p=await br.newPage({viewport:{width:1400,height:900}});const errs=[];
   p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));
   p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource|ERR_FAILED/.test(m.text()))errs.push(m.text())});
   await p.addInitScript(o=>{try{const q=o.q||'high',F={low:[0,0,0],medium:[1,0,1],high:[1,0,1],epic:[1,1,1]}[q];localStorage.setItem('lc_quality',q);localStorage.setItem('lc_hd',''+F[0]);localStorage.setItem('lc_hq',''+F[1]);localStorage.setItem('lc_art',''+F[2]);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_gl','0')}catch(e){}},o);
   if(o.block)for(const b of [].concat(o.block))await p.route(b,r=>r.abort());
   await p.goto(o.url||URL);await p.waitForTimeout(1200);
   await p.evaluate(()=>{
     window.__seed=n=>{Math.random=(()=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647})();rnd=Math.random;};
     window.__look=(wx,wy,z)=>{cam.z=z;cam.x=Math.round(wx-VW/2/z);cam.y=Math.round(wy-VH/2/z);};
     window.__frame=()=>{render();return ctx.getImageData(0,0,cv.width,cv.height);};
     window.__at=(I,wx,wy)=>{const sx=Math.floor((wx-cam.x)*cam.z*DPR),sy=Math.floor((wy-cam.y)*cam.z*DPR),k=(sy*I.width+sx)*4,D=I.data;return [D[k],D[k+1],D[k+2]];};
     window.__d=(a,b)=>Math.abs(a[0]-b[0])+Math.abs(a[1]-b[1])+Math.abs(a[2]-b[2]);
     window.__hex=i=>{const h=IT[i].c;return [1,3,5].map(k=>parseInt(h.slice(k,k+2),16));};
     // the test colony: a Splitter Bulb with three outlets, a Sorting Gland set to copper, a Resin Gland on coal and a Rootweb Node
     window.__build=()=>{__seed(7);startGame('survival');const G=window.__game();G.items=G.items.map(()=>9000);G.webFree=true;G.countdown=1e9;
       const X=G.core.x,Y=G.core.y,Rx=X+5;
       for(let y=Y-10;y<=Y+14;y++)for(let x=Rx-1;x<=Rx+22;x++){if(!inMap(x,y))continue;const o=blockAt(x,y);if(o&&o!==G.core)removeBlock(o);}
       const P=(t,x,y,r)=>{tryPlace(t,x,y,r,true);const b=blockAt(x,y);if(b)b.built=1;return b;};
       for(let x=Rx;x<Rx+4;x++)P('conveyor',x,Y-6,0);const SP=P('router',Rx+4,Y-6,0);P('conveyor',Rx+4,Y-7,3);P('conveyor',Rx+4,Y-8,3);P('conveyor',Rx+4,Y-5,1);for(let x=Rx+5;x<Rx+8;x++)P('conveyor',x,Y-6,0);
       for(let x=Rx;x<Rx+4;x++)P('conveyor',x,Y-2,0);const SO=P('sorter',Rx+4,Y-2,0);P('conveyor',Rx+4,Y-3,3);P('conveyor',Rx+4,Y-1,1);for(let x=Rx+5;x<Rx+8;x++)P('conveyor',x,Y-2,0);SO.cfg=CU;
       for(let x=Rx;x<Rx+4;x++)P('conveyor',x,Y+2,0);const PR=P('press',Rx+4,Y+2,0);for(let x=Rx+6;x<Rx+9;x++)P('conveyor',x,Y+3,0);
       const NO=P('node',Rx+12,Y-3,0);
       const heads=[[Rx,Y-6],[Rx,Y-2],[Rx,Y+2]].map(([x,y])=>blockAt(x,y));
       const tails={sp_up:[Rx+4,Y-8],sp_down:[Rx+4,Y-5],sp_right:[Rx+7,Y-6],so_up:[Rx+4,Y-3],so_down:[Rx+4,Y-1],so_right:[Rx+7,Y-2],press:[Rx+8,Y+3]};
       for(const k in tails)tails[k]=blockAt(...tails[k]);
       const cnt={};for(const k in tails)cnt[k]=[0,0,0,0,0,0,0];
       let n=0,coalIn=0;
       const feed=()=>{const[a,b,c]=heads;if(accepts(a,0,null))a.belt.unshift({i:[CU,PB,SAND][n%3],p:0});if(accepts(b,0,null))b.belt.unshift({i:[CU,PB,CU,SAND][n%4],p:0});
         if(window.__coal!==false&&accepts(c,0,null)){c.belt.unshift({i:COAL,p:0});coalIn++;}n++;
         for(const k in tails){const t=tails[k];if(!t)continue;if(k==='press'&&window.__holdPress)continue;t.belt=t.belt.filter(it=>{if(it.p>=.8){cnt[k][it.i]++;return false;}return true;});}};
       window.__C={G,X,Y,Rx,SP,SO,PR,NO,heads,tails,cnt,feed,coal:()=>coalIn};return window.__C;};
     // run the colony; draws a frame every `every` steps so the painted look runs alongside (0 = never draws)
     window.__sim=(secs,every)=>{const C=__C;for(let k=0;k<secs*60;k++){C.feed();step(1/60);if(every&&k%every===0)render();}};
     window.__hash=s=>{let h=0;for(let i=0;i<s.length;i++)h=(Math.imul(h,31)+s.charCodeAt(i))|0;return h;};
     window.__snap=()=>{const S=snapGame();delete S.cam;return JSON.stringify(S);};
   });
   p.errs=errs;return p;};
 const shot=async(p,f,wx,wy,z,w=460,h=400)=>{await p.evaluate(([x,y,z])=>{__look(x,y,z);render();},[wx,wy,z]);await p.screenshot({path:f,clip:{x:700-w/2,y:450-h/2,width:w,height:h}});};
 const T=24,ORGAN_MAX_={router:60,sorter:60,node:40,press:24};

 // ---------- gameplay identical: the same colony in v31 and in v32 (art on and off), full save snapshot after 90 s ----------
 const runScene=async(url,art)=>{const p=await open({url});const r=await p.evaluate(art=>{SET.art=art;__build();const C=__C;cam.z=2;centerOn(C.Rx+8,C.Y);
     __sim(90,3);const S=__snap();return {hash:__hash(S),bytes:S.length,cnt:C.cnt,coalIn:C.coal(),pressOut:C.PR.out,web:C.G.webCount,wi:C.NO.wi};},art);
   r.errs=p.errs;await p.close();return r;};
 const v31=await runScene(OLD,true),onA=await runScene(URL,true),off=await runScene(URL,false);
 ok('01 gameplay identical: v31 vs v32 painted vs v32 unpainted (90 s, full save snapshot, routing counts, web growth)',
   v31.hash===onA.hash&&onA.hash===off.hash&&JSON.stringify(v31.cnt)===JSON.stringify(onA.cnt)&&!onA.errs.length&&!off.errs.length,
   {v31:{hash:v31.hash,web:v31.web},v32art:{hash:onA.hash,web:onA.web},v32noart:{hash:off.hash,web:off.web},bytes:onA.bytes,counts:onA.cnt,errs:[...onA.errs,...off.errs]});

 let p=await open();
 let r=await p.evaluate(()=>{const s={};for(const t of ['router','sorter','press','node'])s[t]=ART.plant[t].state;return s;});
 ok('02 painted organs loaded',Object.values(r).every(v=>v==='ready'),r);
 await p.evaluate(()=>{__build();__sim(20,2);});

 // ---------- Splitter Bulb ----------
 // distribution: three outlets get the same share (round-robin unchanged), and the painted bulb's idea of where each item came from and went matches the game
 r=await p.evaluate(()=>{const C=__C,b=C.SP;const before=JSON.parse(JSON.stringify(C.cnt));let match=0,checks=0,inOK=0,ins=0;
   for(let k=0;k<60*30;k++){const q0=b.buf[0];C.feed();step(1/60);__look((b.x+.5)*24,(b.y+.5)*24,4);render();
     const s=OST.get(b);if(q0&&b.buf[0]!==q0&&s&&s.outT!==undefined){const p=b.prox,o=p[(b.rr-1+p.length)%p.length];checks++;if(s.out===relDir(b,o))match++;}
     if(b.buf[0]&&s&&s.inT!==undefined){ins++;if(s.inS===2)inOK++;}}
   const d=k=>C.cnt[k].reduce((a,v)=>a+v,0)-before[k].reduce((a,v)=>a+v,0);const shares=[d('sp_up'),d('sp_down'),d('sp_right')];
   return {shares,spread:Math.max(...shares)-Math.min(...shares),outMatches:match+'/'+checks,inletFromLeft:inOK+'/'+ins};});
 ok('03 Splitter Bulb: even three-way split, active outlet and inlet read from the real handoff',r.spread<=2&&Math.min(...r.shares)>20&&r.outMatches.split('/')[0]===r.outMatches.split('/')[1]&&+r.outMatches.split('/')[1]>20&&r.inletFromLeft.split('/')[0]===r.inletFromLeft.split('/')[1],r);
 // openings follow real connections: a lone bulb has no channel to the sides with nothing there
 r=await p.evaluate(()=>{const C=__C,G=C.G,x=C.Rx+16,y=C.Y+8;for(let yy=y-2;yy<=y+2;yy++)for(let xx=x-2;xx<=x+2;xx++){const o=blockAt(xx,yy);if(o)G.blocks.delete(o.id);}
   tryPlace('router',x,y,0,true);const b=blockAt(x,y);b.built=1;__look((x+.5)*24,(y+.5)*24,6);
   const green=I=>{const c=__at(I,(x+.92)*24,(y+.5)*24);return c[1]-Math.max(c[0],c[2]);};
   const g0=green(__frame());tryPlace('conveyor',x+1,y,0,true);blockAt(x+1,y).built=1;const g1=green(__frame());
   const s0=[];for(let k=0;k<4;k++){const o=blockAt(x+D4X[k],y+D4Y[k]);s0.push(!!o);}
   return {edgeGreenAlone:g0,edgeGreenWithVine:g1,neighbours:s0};});
 ok('04 Splitter Bulb: openings only where something is connected',r.edgeGreenAlone<10&&r.edgeGreenWithVine>20,r);
 await shot(p,'ot_splitter.png',(await p.evaluate(()=>(__C.SP.x+.5)*24)),(await p.evaluate(()=>(__C.SP.y+.5)*24)),5);

 // ---------- Sorting Gland ----------
 r=await p.evaluate(()=>{const C=__C,b=C.SO;const before=JSON.parse(JSON.stringify(C.cnt));
   let vis=0,frames=0,worst=0;const want=__hex(CU);
   for(let k=0;k<60*20;k++){C.feed();step(1/60);if(k%3)continue;__look((b.x+.5)*24,(b.y+.5)*24,4);const I=__frame();const c=__at(I,(b.x+.5)*24,(b.y+.5)*24);const d=__d(c,want);frames++;if(d<120)vis++;worst=Math.max(worst,d);}
   const d=(k,i)=>C.cnt[k][i]-before[k][i];
   return {straightCopper:d('so_right',CU),straightOther:d('so_right',PB)+d('so_right',SAND),sideCopper:d('so_up',CU)+d('so_down',CU),sideOther:[d('so_up',PB)+d('so_up',SAND),d('so_down',PB)+d('so_down',SAND)],iconVisible:vis+'/'+frames,worstColourDiff:worst};});
 ok('05 Sorting Gland: copper straight through, the rest split to the sides; chosen item visible in every frame',r.straightCopper>20&&r.straightOther===0&&r.sideCopper===0&&Math.abs(r.sideOther[0]-r.sideOther[1])<=1&&r.iconVisible.split('/')[0]===r.iconVisible.split('/')[1],r);
 // each item type stays recognisable on the gland, and nothing is drawn over it
 r=await p.evaluate(()=>{const C=__C,b=C.SO,res={};__look((b.x+.5)*24,(b.y+.5)*24,4);
   for(let i=0;i<IT.length;i++){b.cfg=i;const I=__frame();res[IT[i].n]=__d(__at(I,(b.x+.5)*24,(b.y+.5)*24),__hex(i));}b.cfg=-1;const I0=__frame();const ring=__at(I0,(b.x+.5)*24+4.5,(b.y+.5)*24);b.cfg=CU;
   return {colourDiff:res,emptyRing:ring};});
 ok('06 Sorting Gland: every possible chosen item reads in its own colour',Object.values(r.colourDiff).every(v=>v<120),r);
 await shot(p,'ot_sorter.png',(await p.evaluate(()=>(__C.SO.x+.5)*24)),(await p.evaluate(()=>(__C.SO.y+.5)*24)),5);

 // ---------- Resin Gland ----------
 r=await p.evaluate(()=>{const C=__C,b=C.PR;const inv0=b.inv[COAL]||0,out0=b.out,got0=C.cnt.press[GRAPH],coal0=C.coal();let convs=0,lp=b.prog,artConv=0,lastConv=-9,actFrames=0,pulses=0,lastR=-9;
   for(let k=0;k<60*30;k++){C.feed();step(1/60);if(b.prog<lp-.3)convs++;lp=b.prog;__look((b.x+1)*24,(b.y+1)*24,3);render();const s=OST.get(b);if(s.conv!==lastConv){artConv++;lastConv=s.conv;}if(s.rout!==lastR){pulses++;lastR=s.rout;}}
   const made=(b.out-out0)+(C.cnt.press[GRAPH]-got0),coalUsed=(C.coal()-coal0)-((b.inv[COAL]||0)-inv0);
   return {made,coalUsed,ratio:+(coalUsed/made).toFixed(3),perSec:+(made/30).toFixed(3),expectedPerSec:+(1/B.press.time).toFixed(3),conversions:convs,artContractions:artConv,resinPulses:pulses,shipped:C.cnt.press[GRAPH]-got0};});
 ok('07 Resin Gland: 2 coal to 1 resin at the same speed; each conversion and each resin shipment animates once',Math.abs(r.coalUsed-2*r.made)<=2&&Math.abs(r.perSec-r.expectedPerSec)<.05&&Math.abs(r.artContractions-r.conversions)<=1&&Math.abs(r.resinPulses-r.shipped)<=1,r);
 // idle vs working, and damage
 await p.evaluate(()=>{const b=__C.PR;window.__coal=false;__sim(45,0);const p0=b.prog;__sim(1,1);window.__idle={coal:b.inv[COAL]||0,still:b.prog===p0};});
 r=await p.evaluate(()=>{const C=__C,b=C.PR,G=C.G;__look((b.x+1)*24,(b.y+1)*24,4);const cx=(b.x+1)*24,cy=(b.y+1)*24;
   const idle=window.__idle;const s=OST.get(b);const restArt=G.time-s.act>.6;
   const I1=__frame();window.__coal=true;__sim(4,1);const s2=OST.get(b);const working=b.prog>0||(b.inv[COAL]||0)>=2;
   const hp0=b.hp;b.hp=b.max*.15;b.hit=.12;const I2=__frame();const flash=__at(I2,(b.x+.2)*24,(b.y+.2)*24);b.hit=0;const I3=__frame();const noflash=__at(I3,(b.x+.2)*24,(b.y+.2)*24);
   const bar=__at(I3,(b.x+.1)*24+1,b.y*24-3.5);b.hp=hp0;
   return {idleCoal:idle.coal,idleStill:idle.still,artAtRest:restArt,working,hitFlashBrighter:__d(flash,noflash),hpBar:bar};});
 ok('08 Resin Gland: rests when out of coal, works again when fed; hit flash and health bar still shown',r.idleCoal<2&&r.idleStill&&r.artAtRest&&r.working&&r.hitFlashBrighter>30&&r.hpBar[0]>150,r);
 await shot(p,'ot_press.png',(await p.evaluate(()=>(__C.PR.x+1)*24)),(await p.evaluate(()=>(__C.PR.y+1)*24)),4,520,420);

 // ---------- Rootweb Node ----------
 r=await p.evaluate(()=>{const C=__C,G=C.G,x=C.Rx+17,y=C.Y+9;
   for(let dy=-9;dy<=9;dy++)for(let dx=-9;dx<=9;dx++){const xx=x+dx,yy=y+dy;if(inMap(xx,yy)&&!blockAt(xx,yy))setWeb(yy*MW+xx,0);}
   tryPlace('node',x,y,0,true);const b=blockAt(x,y);b.built=1;C.N2=b;
   // tendrils: count how many the node would draw with no Rootweb round it, then with it
   const cnt=()=>{const fake={save(){},restore(){},translate(){},rotate(){},scale(){},drawImage(){}};const s=OST.get(b);if(s)s.tm=undefined;drawNodeUnder(fake,ART.plant.node,b,false);const m=(OST.get(b)||{}).tm||0;let n=0;for(let k=0;k<8;k++)n+=m>>k&1;return n;};
   const onWeb=()=>{let w=0;for(let k=0;k<NODE_ROOTS;k++){const ang=k/NODE_ROOTS*6.283+b.id*2.17+hash(b.id,k,9)*.5,tx=Math.floor(b.x+.5+Math.cos(ang)*1.25),ty=Math.floor(b.y+.5+Math.sin(ang)*1.25);if(webAt(tx,ty))w++;}return w;};
   const bareWeb=onWeb();
   const bare=cnt();let evBad=0,evs=0,grown=0,tilesBefore=G.webCount,frames=0,ringFrames=0;const seen=new Set();
   for(let k=0;k<60*12;k++){C.feed();step(1/60);__look((x+.5)*24,(y+.5)*24,3);render();frames++;const s=OST.get(b);
     for(const e of s.ev||[]){const key=e.x+','+e.y+','+e.t;if(seen.has(key))continue;seen.add(key);evs++;if(!G.web[e.y*MW+e.x]||!b.wlist.includes(e.y*MW+e.x))evBad++;}
     if(s.grow!==undefined&&G.time-s.grow<.6)ringFrames++;}
   const after=cnt();let tendrilsOverWeb=0,tendrilsOffWeb=0;
   for(let k=0;k<NODE_ROOTS;k++){const ang=k/NODE_ROOTS*6.283+b.id*2.17+hash(b.id,k,9)*.5,tx=Math.floor(b.x+.5+Math.cos(ang)*1.25),ty=Math.floor(b.y+.5+Math.sin(ang)*1.25);webAt(tx,ty)?tendrilsOverWeb++:tendrilsOffWeb++;}
   return {tendrilsBare:bare,bareTargetsOnWeb:bareWeb,tendrilsAfter:after,targetsOnWeb:tendrilsOverWeb,growthEvents:evs,eventsOnUncoveredOrForeignTiles:evBad,tilesGrown:G.webCount-tilesBefore};});
 ok('09 Rootweb Node: growth pulses only on tiles it really covered; tendrils only over existing Rootweb',r.tendrilsBare===r.bareTargetsOnWeb&&r.tendrilsBare<=2&&r.tendrilsAfter===r.targetsOnWeb&&r.tendrilsAfter>r.tendrilsBare&&r.growthEvents>10&&r.eventsOnUncoveredOrForeignTiles===0,r);
 await shot(p,'ot_node.png',(await p.evaluate(()=>(__C.N2.x+.5)*24)),(await p.evaluate(()=>(__C.N2.y+.5)*24)),4,520,420);

 // ---------- crowds, zoom and the cheap look ----------
 r=await p.evaluate(()=>{__build();const G2=window.__game();G2.paused=true;G2.items=G2.items.map(()=>9e5);
   const X=__C.Rx-1,Y=__C.Y-12;for(let yy=0;yy<24;yy++)for(let xx=0;xx<36;xx++){const o=blockAt(X+xx,Y+yy);if(o&&o!==G2.core)removeBlock(o);}let n={router:0,sorter:0,node:0,press:0};
   for(let yy=0;yy<24;yy++)for(let xx=0;xx<36;xx++){const x=X+xx,y=Y+yy;if(!G2.web[y*MW+x])setWeb(y*MW+x,1);}
   for(let yy=0;yy<24;yy++)for(let xx=0;xx<36;xx++){const i=(Y+yy)*MW+X+xx;G2.terrain[i]=FLOOR;G2.ore[i]=-1;}
   for(let yy=0;yy<20;yy+=2)for(let xx=0;xx<36;xx++){const t=['router','sorter','router','sorter','node'][(xx+yy/2)%5];if(tryPlace(t,X+xx,Y+yy,0,true)){n[t]++;const b=blockAt(X+xx,Y+yy);b.built=1;if(t==='sorter')b.cfg=xx%7;}}
   for(let xx=0;xx<36;xx+=3)if(tryPlace('press',X+xx,Y+21,0,true)){n.press++;blockAt(X+xx,Y+21).built=1;}
   for(const bn of webBorn.values())bn.t=-99;let g=0;while((webQ.size||webBorn.size)&&g++<5000)webArtTick();
   const t=(z)=>{__look((X+18)*24,(Y+12)*24,z);render();const t0=performance.now();for(let i=0;i<20;i++)render();return +((performance.now()-t0)/20).toFixed(2);};
   const near=t(1.2),liteNear={router:organLite('router'),sorter:organLite('sorter'),node:organLite('node'),press:organLite('press')};
   // the chosen items still show in the crowd look
   __look((X+18)*24,(Y+12)*24,1.2);const I=__frame();let vis=0,tot=0;const bad=[];for(let yy=0;yy<20;yy+=2)for(let xx=0;xx<36;xx++){const b=blockAt(X+xx,Y+yy);if(!b||b.t!=='sorter')continue;tot++;const dd=__d(__at(I,(b.x+.5)*24,(b.y+.5)*24),__hex(b.cfg));if(dd<130)vis++;else bad.push([b.x-X,b.y-Y,IT[b.cfg].n,dd,__at(I,(b.x+.5)*24,(b.y+.5)*24)]);}
   const far=t(.6),liteFar=organLite('router');
   return {placed:n,counts:{...ORGAN_N},msNear:near,crowdLite:liteNear,msFar:far,liteFar,sorterIconsVisibleInCrowd:vis+'/'+tot,bad};});
 await p.evaluate(()=>{const G=window.__game();});await p.screenshot({path:'ot_crowd.png'});
 ok('10 crowds and zoom: kinds past their limit switch to the baked look, the chosen items stay visible',r.crowdLite.router&&r.crowdLite.sorter&&r.crowdLite.node===(r.counts.node>ORGAN_MAX_.node)&&r.crowdLite.press===(r.counts.press>ORGAN_MAX_.press)&&r.liteFar&&r.sorterIconsVisibleInCrowd.split('/')[0]===r.sorterIconsVisibleInCrowd.split('/')[1]&&!p.errs.length,{...r,errs:p.errs});

 // ---------- save and load ----------
 r=await p.evaluate(async()=>{__build();__sim(10,2);__C.G.paused=true;const s=await encodeSave();const a=__snap();const S=await decodeSave(s);applySave(S);const b=__snap();
   const keys=new Set();for(const blk of S.blocks)for(const k in blk)keys.add(k);__look(window.__game().core.x*24,window.__game().core.y*24,2);render();
   return {same:a===b,bytes:s.length,saveHasArtState:[...keys].filter(k=>/ost|art|pulse|glow/i.test(k))};});
 ok('11 save and load round-trip; no painted-art state in the save',r.same&&r.saveHasArtState.length===0&&!p.errs.length,{...r,errs:p.errs});
 await p.close();

 // ---------- missing PNGs fall back to the older looks ----------
 p=await open({block:['**/splitter-bulb/valve.png','**/resin-gland/sac.png']});
 r=await p.evaluate(()=>{__build();__sim(5,2);__look((__C.Rx+6)*24,(__C.Y)*24,2.5);render();
   const s={};for(const t of ['router','sorter','press','node'])s[t]=ART.plant[t].state;return {states:s,vineArt:vineArtOn(),bloomArt:!!artFor('core',0)};});
 await p.screenshot({path:'ot_fallback.png',clip:{x:200,y:150,width:1000,height:600}});
 ok('12 missing Splitter Bulb / Resin Gland art: those two fall back, the others stay painted, no errors',r.states.router==='failed'&&r.states.press==='failed'&&r.states.sorter==='ready'&&r.states.node==='ready'&&!p.errs.length,{...r,errs:p.errs});await p.close();

 // ---------- every quality preset draws the colony without errors ----------
 const qs={};for(const q of ['low','medium','high','epic']){p=await open({q});qs[q]=await p.evaluate(()=>{__build();__sim(5,2);__look((__C.Rx+6)*24,__C.Y*24,2.5);render();return {art:!!artFor('router',0),hd:SET.hd};});qs[q].errs=p.errs.length;
   await p.screenshot({path:`ot_q_${q}.png`,clip:{x:200,y:150,width:1000,height:600}});await p.close();}
 ok('13 quality presets: Low uses the classic look, Medium/High/Epic the painted one, no errors',!qs.low.art&&qs.medium.art&&qs.high.art&&qs.epic.art&&Object.values(qs).every(v=>!v.errs),qs);

 const pass=Object.values(R).filter(v=>v.pass).length;console.log(pass+'/'+Object.keys(R).length+' passed');
 fs.writeFileSync('otest_result.json',JSON.stringify(R,null,1));await br.close();})();
