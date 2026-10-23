// v60: the polish pass on the title, the transition and the menu's scenes.
// Menu scenes: the Rootweb in a scene is the game's own painted Rootweb, the same look a game uses, even for a scene built before the
// painted art had loaded (it is repainted with the art when it arrives, under the title, with nothing left half-painted).
// Transition: living Rootweb overgrowth. Tendrils differ in width, pace, start, bend and side shoots; the membrane is painted once while
// the title waits and is a structured living surface (veins, cells, nodules, turquoise channels), not a flat fill; it covers the whole
// screen by 0.85 s and is gone again by 1.85 s; tendrils carry turquoise light inside them.
// Heartbeat: the heart brightens on each beat, the outer Bloom follows the heart a moment later, the filaments round it answer each beat,
// and the second beat's answer is the stronger.
// Menu: the descriptions keep a strong contrast even over the brightest scene, and the scene is quieter beside the panel.
// Run with a web server on the repo root (port 8123). SHOTS is where the screenshots go.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',SHOTS=process.env.SHOTS||'shots60';fs.mkdirSync(SHOTS,{recursive:true});
let fails=0;const ok=(name,c,extra='')=>{if(!c)fails++;console.log(c?'PASS':'FAIL',name,extra);};
const open=async(br,o={})=>{const ctx=await br.newContext({viewport:o.vp||{width:1600,height:900}});const p=await ctx.newPage();p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
  await p.addInitScript(([sp,scene])=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');if(sp)localStorage.setItem('lc_splash','1');if(scene!==null)localStorage.setItem('lc_menuScene',String(scene-1));}catch(e){}},[!!o.splash,o.scene===undefined?null:o.scene]);
  await p.goto(URL+'index.html');if(o.splash)await p.waitForFunction(()=>$('splash').classList.contains('ready'),null,{timeout:15000});else await p.waitForTimeout(1500);return p;};
// luminance spread and turquoise share of a screenshot region (PNG decoded in the page)
const stats=async(p,buf)=>p.evaluate(async b64=>{const im=new Image();im.src='data:image/png;base64,'+b64;await im.decode();const c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  const g=c.getContext('2d');g.drawImage(im,0,0);const d=g.getImageData(0,0,c.width,c.height).data;let n=0,s=0,s2=0,tq=0,cells=new Set();
  for(let i=0;i<d.length;i+=16){const r=d[i],gg=d[i+1],b=d[i+2],l=.2126*r+.7152*gg+.0722*b;n++;s+=l;s2+=l*l;if(gg>110&&b>100&&gg>r+35)tq++;cells.add((r>>4)+'/'+(gg>>4)+'/'+(b>>4));}
  const m=s/n;return {mean:+m.toFixed(1),sd:+Math.sqrt(s2/n-m*m).toFixed(1),turq:+(tq/n*100).toFixed(2),colours:cells.size};},buf.toString('base64'));
(async()=>{const br=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});
 // ---- 1. the menu's Rootweb is the painted Rootweb, the same as a game's
 {const p=await open(br,{splash:true,scene:0});
  await p.waitForFunction(()=>MD.G&&webArtLoaded()&&!webQ.size,null,{timeout:15000});const s=await p.evaluate(()=>({look:MD.look,art:SET.art,rep:MD.repaints||0}));
  await p.keyboard.press('Enter');await p.waitForFunction(()=>!SPL.on,null,{timeout:6000});await p.waitForTimeout(800);
  const m=await p.evaluate(()=>{const sw=G;G=MD.G;const o={look:mdLook(),q:webQ.size,tiles:G.web.reduce((a,v)=>a+v,0)};G=sw;return o;});
  await p.screenshot({path:SHOTS+'/menu_rootweb.png'});
  await p.evaluate(()=>startGame('survival'));await p.waitForTimeout(1500);const g=await p.evaluate(()=>mdLook());
  ok('the first scene (built under the title) is drawn with the painted Rootweb, finished before the title goes',s.look==='painted'&&s.art,JSON.stringify(s));
  ok('the menu\'s Rootweb is the same look as a game\'s, with nothing left to paint',m.look===g&&m.q===0&&m.tiles>100,JSON.stringify({menu:m,game:g}));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 2. a scene built before the art had loaded is repainted with it when it arrives
 {const p=await open(br,{scene:0});await p.waitForTimeout(2500);
  const r=await p.evaluate(async()=>{SET.art=false;mdShow(1);await new Promise(r=>setTimeout(r,1400));const before={look:MD.look,id:MMS[MD.i].id};
    SET.art=true;const r0=MD.repaints||0;webArtReady(ART.plant.rootweb);for(let i=0;i<60&&webQ.size;i++)await new Promise(r=>setTimeout(r,100));
    return {before,after:MD.look,repaints:(MD.repaints||0)-r0,q:webQ.size,game:!!window.__game()};});
  ok('a scene built with the plain Rootweb is repainted with the painted art when it arrives, and the game is untouched',r.before.look!=='painted'&&r.after==='painted'&&r.repaints===1&&r.q===0&&!r.game,JSON.stringify(r));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 3. the transition: living overgrowth, tendrils that differ, full cover, then gone
 {const p=await open(br,{splash:true});await p.waitForTimeout(1200);
  // the full version (a computer that draws the title quickly); the lighter one is checked after
  const pre=await p.evaluate(()=>{SPL.fdt=1/60;SPL.lite=false;VNS.dpr=0;vinePrep();return {sheet:!!VNS.c,veins:VNS.veins.length,ms:VNS.ms,tex:VNS.tex};});
  ok('the membrane is painted while the title waits (cells texture, veins with channels)',pre.sheet&&pre.veins>=5&&pre.tex,JSON.stringify(pre));
  const T=await p.evaluate(()=>{cancelAnimationFrame(SPL.raf);SPL.hb=null;splashDraw(SPL.t,0);vineStart();const V=SPL.vine,w=V.T.map(T=>T.w),s=V.T.map(T=>T.s),d=V.T.map(T=>T.dur),br=V.T.reduce((a,T)=>a+T.br.length,0);
    const field=t=>{vnField(V,t);let mn=255,mx=0;const M=V.mask.d.data;for(let i=3;i<M.length;i+=4){mn=Math.min(mn,M[i]);mx=Math.max(mx,M[i]);}return [mn,mx];};
    return {n:V.T.length,br,wr:+(Math.max(...w)/Math.min(...w)).toFixed(2),sr:+(Math.max(...s)-Math.min(...s)).toFixed(3),dr:+(Math.max(...d)-Math.min(...d)).toFixed(3),
      uniqS:new Set(s.map(x=>x.toFixed(3))).size,early:field(.3),cover:field(VN.COVER),gone:field(VN.GONE),grid:[V.GW,V.GH]};});
  ok('five or more tendrils with side shoots, no two alike: widths, starts and paces all differ',T.n>=5&&T.br>=T.n&&T.wr>=1.25&&T.sr>=.06&&T.dr>=.04&&T.uniqS===T.n,JSON.stringify(T));
  ok('the membrane grows in (part covered at 0.3 s), covers the whole screen by 0.85 s and has torn away completely by 1.85 s',T.early[0]===0&&T.early[1]===255&&T.cover[0]>=250&&T.gone[1]<=5,JSON.stringify(T));
  const shot=async t=>{await p.evaluate(t=>{SPL.vine.t0=performance.now()-t*1000;if(t<VN.SWAP)splashDraw(SPL.t,0);vineTick();},t);return p.screenshot({path:`${SHOTS}/tr_${t}.png`});};
  const s55=await stats(p,await shot(.55)),s80=await stats(p,await shot(.8));
  ok('covered, the screen is living tissue, not a flat fill: a wide spread of light and dark, many colours, and turquoise nutrient light',s80.sd>=18&&s80.colours>=120&&s80.turq>=.3,JSON.stringify(s80));
  ok('while the tendrils grow in, their turquoise channels show',s55.turq>=.3,JSON.stringify(s55));
  // the lighter version, for a slow computer: the same structure with fewer strokes
  await p.evaluate(()=>{vineClear();SPL.on=true;SPL.ending=false;$('splash').hidden=false;SPL.fdt=1/12;splashDraw(SPL.t,0);vineStart();});
  const l80=await stats(p,await shot(.8)),lite=await p.evaluate(()=>({lite:SPL.vlite,dpr:SPL.vine.dpr,n:SPL.vine.T.length}));
  ok('a computer that draws the title slowly gets the lighter version, still living tissue with turquoise light',lite.lite&&lite.n>=5&&l80.sd>=15&&l80.colours>=100&&l80.turq>=.1,JSON.stringify({...lite,...l80}));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 4. the transition in real time: its pace and its frames
 {const p=await open(br,{splash:true});await p.waitForTimeout(1500);await p.keyboard.press('Enter');const t0=Date.now();
  await p.waitForFunction(()=>!SPL.on,null,{timeout:6000});const dt=(Date.now()-t0)/1000;const f=await p.evaluate(()=>({frames:SPL.vfr.length,last:SPL.vfr[SPL.vfr.length-1],swap:SPL.swapT}));
  ok('the transition keeps to about two seconds on the wall clock, drawing at least 14 frames a second even on this machine with no graphics card',f.last>=2.05&&f.last<=2.6&&dt<=2.9&&f.frames/f.last>=14,JSON.stringify({...f,fps:+(f.frames/f.last).toFixed(1),seconds:dt}));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 5. the heartbeat: the heart brightens, the outer Bloom follows, the filaments answer, the second answer stronger
 {const p=await open(br,{splash:true});await p.waitForTimeout(1500);
  const h=await p.evaluate(async()=>{cancelAnimationFrame(SPL.raf);SPL.nextPulse=99;SPL.pulses=[];const P={t:0,c1:.12,r1:.2,d:.22,c2:.08,r2:.14,a1:.035,a2:.045,rec:.6};
    const cv=$('splashCv'),g=cv.getContext('2d'),W=cv.clientWidth,H=cv.clientHeight,k=Math.max(W/SPL_PIC.W,H/SPL_PIC.H)*1.02,dpr=cv.width/W;
    const lum=()=>{const P2=SPL_PIC,ox=W/2-P2.W/2*k,oy=Math.min(H*.56-P2.bloom[1]*k,Math.max(H-P2.H*k,0)),x=(ox+P2.bloom[0]*k)*dpr,y=(oy+P2.bloom[1]*k)*dpr,r=Math.round(90*k*dpr),d=g.getImageData(x-r,y-r,r*2,r*2).data;let s=0;for(let i=0;i<d.length;i+=4)s+=d[i]+d[i+1]+d[i+2];return s/(d.length/4);};
    SPL.hb=null;SPL.hbAft=0;splashDraw(SPL.t,0);const rest=lum();SPL.hb=Object.assign({},P,{t:P.c1});SPL.hbAft=0;splashDraw(SPL.t,0);const lub=lum();
    const lag=[hbEnv(P,P.c1),hbEnv(P,P.c1-(13.5/14)*.07)];const gl=[];for(let t=0;t<=1;t+=.01){SPL.hb=Object.assign({},P,{t});gl.push(hbGlow());}
    const lubG=Math.max(...gl.slice(0,30)),dubG=Math.max(...gl.slice(30));SPL.hb=null;return {rest:Math.round(rest),lub:Math.round(lub),core:+lag[0].toFixed(4),outer:+lag[1].toFixed(4),lubG:+lubG.toFixed(3),dubG:+dubG.toFixed(3)};});
  ok('on the lub the Bloom\'s heart brightens',h.lub>h.rest+8,JSON.stringify(h));
  ok('the outer Bloom follows its heart a moment later (still tightening when the heart peaks)',h.outer<h.core&&h.outer>0,JSON.stringify(h));
  ok('the filaments round the Bloom answer each beat, the second answer the stronger',h.lubG>.05&&h.dubG>h.lubG,JSON.stringify(h));
  ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 // ---- 6. the menu over its scene stays readable
 {const p=await open(br,{scene:2});await p.waitForTimeout(3500);
  const c=await p.evaluate(()=>{const lin=v=>{v/=255;return v<=.03928?v/12.92:Math.pow((v+.055)/1.055,2.4);},L=([r,g,b])=>.2126*lin(r)+.7152*lin(g)+.0722*lin(b);
    const rgb=s=>s.match(/[\d.]+/g).map(Number),sp=document.querySelector('#overlay.mm .mode span'),fg=rgb(getComputedStyle(sp).color);
    // the panel's lightest point (its right edge, 89% opaque) over a white scene: the worst case
    const bg=[9,11,19].map(v=>v*.89+255*.11),r=(L(fg)+.05)/(L(bg)+.05);return {fg,bg:bg.map(Math.round),ratio:+r.toFixed(2),vig:getComputedStyle(document.querySelector('#mmBg .mmvig')).backgroundImage.split('gradient').length-1};});
  ok('menu descriptions keep a contrast of at least 4.5 to 1 even over the brightest scene, and the scene is shaded beside the panel and under the footer',c.ratio>=4.5&&c.vig>=4,JSON.stringify(c));
  await p.screenshot({path:SHOTS+'/menu_assault.png'});ok('no errors',!p.errs.length,p.errs[0]);await p.context().close();}
 await br.close();console.log(fails?fails+' FAILED':'ALL PASS');process.exit(fails?1:0);})();
