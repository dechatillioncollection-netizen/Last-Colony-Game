// v41 checks for the painted Petal Gate, Maw Gate and Healing Pod. Each check prints PASS or FAIL. The gates are checked against the
// game's own gate state (gateOpen's b.op, which the simulation saves) and against which ants the simulation actually lets through;
// the Healing Pod against the heal effects the game adds and the health it really restores. Some checks compare with v40 (OLD).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OLD=process.env.OLD||'lc2_v40_index.html',NEW=process.env.NEW||'lc2_index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const HELP=()=>{
  // a sealed pen: a wall line along row 6 (two deep at the gate), the gate in it, walls closing both sides
  window.__pen=(o)=>{let s=o.seed||9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
    const X=G.core.x+6,Y=G.core.y-10;for(let y=Y-3;y<Y+18;y++)for(let x=X-3;x<X+26;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
    const put=(t,x,y,team)=>{if(team)addBlock(t,X+x,Y+y,0,1);else tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
    const gx=8,gate=o.gate||'door';
    for(let x=0;x<18;x++){if(x===gx||(gate==='doorL'&&x===gx+1))continue;put(o.side&&(x===gx-1)?o.side:o.side2&&x===gx+(gate==='doorL'?2:1)?o.side2:'wall',x,6);if(gate==='doorL')put('wall',x,7);}
    const g=put(gate,gx,6);for(let y=-1;y<14;y++){put('wall',-1,y);put('wall',18,y);}
    for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
    cam.z=o.z||2;centerOn(X+gx+1,Y+7);window.__X=[X,Y];return {X,Y,g};};
  // alpha of a block drawn alone with drawArt (as the game draws it), at a point given as a fraction of its footprint
  window.__alpha=(b,fx,fy)=>{const a=ART.plant[b.t],n=b.size,box=a.box,S=4,cv=document.createElement('canvas');cv.width=cv.height=box*T*S;const c=cv.getContext('2d');c.scale(S,S);
    const o=(box-n)/2*T;drawArt(c,b.t,o,o,0,b,G.time,0);const px=Math.floor((o+fx*n*T)*S),py=Math.floor((o+fy*n*T)*S);return c.getImageData(px-2,py-2,5,5).data.filter((v,i)=>i%4===3).reduce((p,q)=>p+q,0)/25;};
  window.__inner=(b)=>{const v=[];for(const y of [.38,.44,.5,.56,.62])for(const x of [.38,.44,.5,.56,.62])if(x!==.5||y!==.5)v.push(Math.round(__alpha(b,x,y)));return {min:Math.min(...v),max:Math.max(...v)};};
  // ants of these kinds walk through the gate from above; each step: the game's open amount, and whether any ant overlaps the footprint
  window.__pass=(o)=>{const {X,Y,g}=__pen(o);const G=window.__game();const us=[];
    (o.units||[]).forEach((t,i)=>{const u=spawnUnit(t,X+8.5+(o.gate==='doorL'?.5:0)+((i%2)-.5)*(o.spread||0),Y+2.5-i*(o.gap??1.2));us.push(u);});
    if(us.length)sendAnts(us,X+8.5+(o.gate==='doorL'?.5:0),Y+11);
    let over=0,overLow=0,minOverOp=1,maxOp=0,hits=0;const crossed=us.map(()=>-1),n=g.size;let maxOff=0;
    for(let k=0;k<(o.steps||300);k++){
      if(o.hurtEvery&&k%o.hurtEvery===5&&G.blocks.has(g.id)){hurtBlock(g,g.max*.03);if(G.blocks.has(g.id))hits++;}
      step(1/30);render();
      const ov=us.some(u=>!u.dead&&u.x>g.x-radOf(u,0)&&u.x<g.x+n+radOf(u,0)&&u.y>g.y-radOf(u,0)&&u.y<g.y+n+radOf(u,0));
      if(ov){over++;minOverOp=Math.min(minOverOp,g.op||0);if((g.op||0)<.9)overLow++;
        for(const u of us)if(u.y>g.y&&u.y<g.y+n)maxOff=Math.max(maxOff,Math.abs(u.x-(g.x+n/2)));}
      maxOp=Math.max(maxOp,g.op||0);us.forEach((u,i)=>{if(crossed[i]<0&&u.y>Y+6+n+.3)crossed[i]=k;});}
    const s=OST.get(g)||{};return {crossed,over,overLow,minOverOp:+minOverOp.toFixed(3),maxOp:+maxOp.toFixed(3),endOp:+(g.op||0).toFixed(3),hits,flinches:s.n||0,mask:s.lm,maxOff:+maxOff.toFixed(3),alive:G.blocks.has(g.id)};};
};
(async()=>{const br=await chromium.launch();
 const page=async(file,init)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.warns=[];p.on('pageerror',e=>p.errs.push(String(e)));p.on('console',m=>{if(m.type()==='warning')p.warns.push(m.text());});
   if(init)await init(p);await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','high');}catch(e){}});
   await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1500);await p.evaluate(HELP);return p;};
 const p=await page(NEW);
 const st=await p.evaluate(()=>['door','doorL','mender'].map(t=>ART.plant[t].state));ok(st.every(s=>s==='ready'),'painted Petal Gate, Maw Gate and Healing Pod load',st);

 // ===================== Petal Gate =====================
 let r=await p.evaluate(()=>{const {g}=__pen({});for(let k=0;k<60;k++){step(1/30);render();}return {op:g.op||0,a:__alpha(g,.5,.5),aj:__alpha(g,.1,.5)};});
 ok(r.op===0&&r.a>200,'Petal Gate 1: closed with no ant near: the game keeps it shut and the petals meet over the passage',r);
 for(const [t,lab] of [['mite','2: a Mite Ant'],['tank','3: a Thornback']]){
   r=await p.evaluate(t=>__pass({units:[t]}),t);
   ok(r.crossed[0]>0&&r.over>0&&r.overLow<=1&&r.endOp<.05,`Petal Gate ${lab} walks through; whenever it overlaps the gate the game has it open (above 0.9 on all but at most the first frame) and the gate closes after`,r);}
 r=await p.evaluate(()=>{const o=__pass({units:['mite']});const {g}=__pen({});const u=spawnUnit('mite',g.x+.5,g.y+.5);for(let k=0;k<40;k++){u.x=g.x+.5;u.y=g.y+.5;step(1/30);render();}return {...o,a:__alpha(g,.5,.5),op:g.op};});
 ok(r.a<150&&r.op>.95,'Petal Gate: with an ant standing in it the petals are drawn back and the passage is clear (alpha at the seam)',{a:r.a,op:r.op});
 r=await p.evaluate(()=>__pass({units:['htank'],steps:420}));
 ok(r.crossed[0]>0&&r.overLow<=1,'Petal Gate 4: a Bulwark Ant: the simulation lets it through (finding: the "too narrow" line is only in the description), and the petals open whenever it is in the gate, so the art never shows it blocked while it walks through',r);
 r=await p.evaluate(()=>__pass({units:['mite','mite','tank','mite'],gap:1.0,steps:420}));
 ok(r.crossed.every(c=>c>0)&&r.overLow<=1&&r.endOp<.05,'Petal Gate 5: four ants in a queue: it stays open while any is in it and closes after the last',r);
 r=await p.evaluate(()=>__pass({units:['mite','mite'],hurtEvery:20,steps:300}));
 ok(r.crossed.every(c=>c>0)&&r.overLow<=1&&r.flinches===r.hits&&r.hits>5,'Petal Gate 6: hit every 20 steps while ants pass: one flinch per real hit, and it still opens for them',r);
 r=await p.evaluate(()=>{const {g}=__pen({});const G=window.__game();const a0=__alpha(g,.5,.5);const q=[];for(const f of [.8,.5,.2]){g.hp=g.max*f;step(1/30);render();q.push(Math.round(g.hp/g.max*20));}
   const id=g.id;hurtBlock(g,g.max*2);let e=0;try{for(let k=0;k<20;k++){step(1/30);render();}}catch(x){e++;}return {a0,q,gone:!G.blocks.has(id),e};});
 ok(r.gone&&r.e===0,'Petal Gate 7: hurt to 80%, 50%, 20% (wound steps '+r.q+'), then destroyed: no errors',r);
 r=await p.evaluate(()=>{const {g}=__pen({});render();const s=OST.get(g);const L=[];const {X,Y}=(()=>({X:__X[0],Y:__X[1]}))();
   // a vertical line with a gate in it
   tryPlace('wall',X+3,Y+1,0,true);tryPlace('door',X+3,Y+2,0,true);tryPlace('wall',X+3,Y+3,0,true);const v=blockAt(X+3,Y+2);for(const b of window.__game().blocks.values())b.built=1;render();
   return {h:s.lm,v:OST.get(v).lm,tr:gTrans(v,OST.get(v).lm),trh:gTrans(g,s.lm)};});
 ok(r.h===5&&r.v===10&&r.tr&&!r.trh,'Petal Gate 8: between Bark Walls it knits roots to both (left and right; up and down in a vertical line, where it is drawn turned so its petals part across the line)',r);
 r=await p.evaluate(()=>{const {g}=__pen({});const G=window.__game();for(const dx of [-1,-2,1]){const w=blockAt(g.x+dx,g.y);if(w)removeBlock(w);}
   tryPlace('wallL',g.x-2,g.y,0,true);tryPlace('twall',g.x+1,g.y,0,true);for(const b of G.blocks.values())b.built=1;G.dirty=true;render();const s=OST.get(g);
   const wl=[...G.blocks.values()].find(b=>b.t==='wallL'),tw=blockAt(g.x+1,g.y);if(g.t!=='door'||!wl||!tw||tw.t!=='twall')return {e:'layout',gt:g.t,wl:!!wl,tw:tw&&tw.t};return {m:s.lm,wl:OST.get(wl)&&OST.get(wl).lm,tw:OST.get(tw)&&OST.get(tw).lm};});
 ok((r.m&5)===5&&(r.tw&4)===4&&r.wl>0,'Petal Gate 9: beside Great Bark and Ironbark it knits roots to both, and they to it',r);
 r=await p.evaluate(()=>{const {X,Y,g}=__pen({});const G=window.__game();const u=spawnUnit('mite',g.x+.5,g.y-.6);for(let k=0;k<6;k++){step(1/30);render();}
   const op0=g.op,S=JSON.parse(JSON.stringify(snapGame()));applySave(S);const G2=window.__game();const g2=blockAt(X+8,Y+6);let e=0;try{for(let k=0;k<30;k++){step(1/30);render();}}catch(x){e++;}
   return {op0,saved:S.blocks.find(b=>b.t==='door'&&b.x===X+8).op,loaded:!!g2&&g2.t==='door',e,keys:Object.keys(S.blocks.find(b=>b.t==='door'&&b.x===X+8)).sort().join(',')};});
 ok(r.loaded&&r.e===0&&Math.abs(r.saved-r.op0)<1e-9,'Petal Gate 10: saved half open and loaded: the game\'s own open amount (b.op) comes back and it plays on without errors',r);

 // ===================== Maw Gate =====================
 r=await p.evaluate(()=>{const {g}=__pen({gate:'doorL'});for(let k=0;k<60;k++){step(1/30);render();}return {op:g.op||0,...__inner(g)};});
 ok(r.op===0&&r.min>200,'Maw Gate 1: closed with no ant near: its membranes close over the throat (alpha over the middle, a pinhole left at the very centre)',r);
 for(const [t,lab,st] of [['mite','2: a Mite Ant',300],['tank','3: a Thornback',300],['htank','4: a Bulwark Ant',480]]){
   r=await p.evaluate(([t,st])=>__pass({gate:'doorL',units:[t],steps:st}),[t,st]);
   ok(r.crossed[0]>0&&r.overLow<=1&&r.endOp<.05,`Maw Gate ${lab} walks through and the gate is open whenever it is in it, then closes`,r);
   if(t==='htank')ok(r.maxOff+.42<1.5*100/128/1.5*1.5,'Maw Gate: the Bulwark stays inside the drawn throat (its body centre within '+r.maxOff+' tiles of the middle, the throat is 0.78 tiles in radius)',{maxOff:r.maxOff});}
 r=await p.evaluate(()=>{const {g}=__pen({gate:'doorL'});const u=spawnUnit('htank',g.x+1,g.y+1);for(let k=0;k<40;k++){u.x=g.x+1;u.y=g.y+1;step(1/30);render();}return {...__inner(g),op:g.op};});
 ok(r.max<190&&r.op>.95,'Maw Gate: with a Bulwark standing in it the throat is drawn clear (only the dark throat floor, alpha about 171, is left in the middle)',r);
 r=await p.evaluate(()=>__pass({gate:'doorL',units:['mite','tank','htank','mite','tank'],spread:.8,gap:.5,steps:520}));
 ok(r.crossed.every(c=>c>0)&&r.overLow<=1&&r.endOp<.05,'Maw Gate 5: five ants of all kinds arriving together: open throughout, closes after the last',r);
 r=await p.evaluate(()=>__pass({gate:'doorL',units:['htank','mite'],hurtEvery:15,steps:480}));
 ok(r.overLow<=1&&r.flinches===r.hits,'Maw Gate 6 and 8: hit while ants pass: one flinch per real hit, still open for them',r);
 r=await p.evaluate(()=>{const {g}=__pen({gate:'doorL'});render();return {m:OST.get(g).lm};});
 ok((r.m&(1|2|16|32))===(1|2|16|32),'Maw Gate 7: knits root bundles into the walls either side, two per side',r);
 r=await p.evaluate(()=>{const {g}=__pen({gate:'doorL'});const G=window.__game();for(const f of [.6,.3]){g.hp=g.max*f;step(1/30);render();}const id=g.id;hurtBlock(g,g.max*2);let e=0;try{for(let k=0;k<20;k++){step(1/30);render();}}catch(x){e++;}return {gone:!G.blocks.has(id),e};});
 ok(r.gone&&r.e===0,'Maw Gate 8: hurt and destroyed without errors',r);
 r=await p.evaluate(()=>{const {X,Y,g}=__pen({gate:'doorL'});const u=spawnUnit('htank',g.x+1,g.y-.8);for(let k=0;k<8;k++){step(1/30);render();}const op0=g.op;const S=JSON.parse(JSON.stringify(snapGame()));applySave(S);const g2=blockAt(X+8,Y+6);let e=0;try{for(let k=0;k<30;k++){step(1/30);render();}}catch(x){e++;}return {op0,saved:S.blocks.find(b=>b.t==='doorL').op,loaded:!!g2&&g2.t==='doorL',e};});
 ok(r.loaded&&r.e===0&&Math.abs(r.saved-r.op0)<1e-9,'Maw Gate 9: save and load mid-opening',r);
 r=await p.evaluate(()=>{const out={};for(const z of [.6,1,2.5]){const {g}=__pen({gate:'doorL',z});const u=spawnUnit('mite',g.x+1,g.y+1);let e=0;try{for(let k=0;k<20;k++){u.x=g.x+1;u.y=g.y+1;step(1/30);render();}}catch(x){e++;}
   const lite=organLite('doorL');out[z]={e,lite,open:__inner(g).max<190,op:+g.op.toFixed(2)};}return out;});
 ok(Object.values(r).every(v=>v.e===0&&v.open)&&r[.6].lite&&!r[1].lite,'Maw Gate 10: zoom 0.6 (cached, no motion), 1 and 2.5: no errors, and an open gate still draws open when zoomed out',r);

 // ===================== Healing Pod =====================
 const POD=(o)=>p.evaluate(o=>{let sd=5;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+6,Y=G.core.y-10;for(let y=Y-3;y<Y+18;y++)for(let x=X-3;x<X+26;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
   const pod=put('mender',10,8);if(!o.nopower)for(let k=0;k<6;k++)put('solar',2+k,15);
   const L={};for(const [l,t,x,y] of o.blocks||[]){L[l]=put(t,x,y);}
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
   for(const [l,f] of Object.entries(o.hurt||{}))if(L[l])L[l].hp=L[l].max*f;
   cam.z=1.6;centerOn(X+10.5,Y+8.5);
   let pushes=[];const P0=PODFX.push;PODFX.push=function(...a){pushes.push(...a);return P0.apply(this,a);};
   let heals=0,pumps=0,lastPump,seen=new Set(),bad=0,rose={};const mends0={};for(const [l,b] of Object.entries(L))mends0[l]=0;
   for(let k=0;k<(o.steps||300);k++){const hp=new Map();for(const b of G.blocks.values())hp.set(b,b.hp);const n0=pushes.length;step(1/30);
     const up=new Set();for(const [b,h] of hp)if(b.hp>h+.01){up.add(b);for(const [l,x] of Object.entries(L))if(x===b)rose[l]=(rose[l]||0)+1;}
     for(const f of G.fx)if(f.k==='heal'&&!seen.has(f)){seen.add(f);heals++;}
     render();const s=OST.get(pod)||{};if(s.pumpT!==undefined&&s.pumpT!==lastPump){lastPump=s.pumpT;pumps++;}
     for(const q of pushes.slice(n0)){const t=[...up].find(b=>{const [cx,cy]=bCenter(b);return Math.abs(cx-q.tx)<1e-6&&Math.abs(cy-q.ty)<1e-6;});if(!t)bad++;}}
   const s=OST.get(pod)||{};const tl={};for(const q of pushes){const t=Object.entries(L).find(([l,b])=>{const [cx,cy]=bCenter(b);return Math.abs(cx-q.tx)<1e-6&&Math.abs(cy-q.ty)<1e-6;});if(t)tl[t[0]]=(tl[t[0]]||0)+1;}
   const wm={};for(const [l,b] of Object.entries(L)){const w=OST.get(b);if(w)wm[l]=w.m||0;}
   PODFX.push=P0;
   const S=o.save?JSON.parse(JSON.stringify(snapGame())):null;let e=0;if(S){applySave(S);try{for(let k=0;k<60;k++){step(1/30);render();}}catch(x){e++;}}
   return {heals,pumps,pulses:pushes.length,bad,targets:tl,rose,act:+(s.act||0).toFixed(3),powSat:G.powSat,wallMends:wm,saveErr:e,saveKeys:S?Object.keys(S.blocks.find(b=>b.t==='mender')).sort().join(','):null};},o);
 r=await POD({blocks:[['wall','wall',12,8]],steps:300});
 ok(r.heals===0&&r.pumps===0&&r.pulses===0&&r.act<.05,'Healing Pod 1: idle with nothing hurt: never pumps or sends sap, glow stays at rest',r);
 r=await POD({blocks:[['bark','wall',13,8]],hurt:{bark:.3},steps:300});
 ok(r.heals>0&&r.pumps===r.heals&&r.targets.bark===r.rose.bark&&r.bad===0,'Healing Pod 2: mending a hurt Bark Wall: one pump per repair the game makes, and sap runs to the wall each time its health really rises',r);
 r=await POD({blocks:[['great','wallL',12,5],['iron','twall',7,8]],hurt:{great:.3,iron:.3},steps:300});
 ok(r.targets.great===r.rose.great&&r.targets.iron===r.rose.iron&&r.rose.great>0&&r.rose.iron>0&&r.pumps===r.heals&&r.bad===0,'Healing Pod 3: Great Bark and Ironbark: sap to each on every real repair',r);
 r=await POD({blocks:[['a','wall',12,8],['b','wall',8,8],['c','twall',10,6],['d','door',10,11],['e','solar',13,10]],hurt:{a:.3,b:.4,c:.3,d:.2,e:.3},steps:300});
 ok(['a','b','c','d','e'].every(l=>r.targets[l]===r.rose[l])&&r.bad===0&&r.wallMends.a>0&&r.wallMends.d>0,'Healing Pod 4 and 8: five growths in range: sap to each one the game mends; walls and gates show their own v40 mend light ('+JSON.stringify(r.wallMends)+')',r);
 r=await POD({blocks:[['a','wall',12,8]],steps:240});
 ok(r.pumps===0&&r.pulses===0,'Healing Pod 5: everything at full health: no healing animation',r);
 r=await POD({blocks:[['a','wall',12,8]],hurt:{a:.3},nopower:true,steps:300});
 ok(r.heals===0&&r.pumps===0&&r.pulses===0&&r.act<.05&&r.powSat===0,'Healing Pod 6: no vigor (no Sunleaves) and a hurt wall: the game repairs nothing and the pod shows no active or pumping look',r);
 r=await POD({blocks:[['in','wall',16,8],['out','wall',17,8]],hurt:{in:.3,out:.3},steps:300});
 ok(r.rose.in>0&&!r.rose.out&&r.targets.in===r.rose.in&&!r.targets.out,'Healing Pod 7: repair radius still 6 tiles: a wall 6 tiles away is mended and gets sap, one 7 tiles away gets neither',r);
 const rOld=await (async()=>{const q=await page(OLD);await q.evaluate(HELP);const x=await q.evaluate(o=>{let sd=5;Math.random=()=>(sd=(sd*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+6,Y=G.core.y-10;for(let y=Y-3;y<Y+18;y++)for(let x=X-3;x<X+26;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};put('mender',10,8);for(let k=0;k<6;k++)put('solar',2+k,15);const a=put('wall',16,8),b=put('wall',17,8);for(const q of G.blocks.values())q.built=1;G.dirty=true;recompute();a.hp=a.max*.3;b.hp=b.max*.3;
   cam.z=1.6;centerOn(X+10.5,Y+8.5);for(let k=0;k<300;k++){step(1/30);render();}return [a.hp,b.hp,G.items];});await q.close();return x;})();
 const rNew=await p.evaluate(()=>0);
 r=await POD({blocks:[['in','wall',16,8],['out','wall',17,8]],hurt:{in:.3,out:.3},steps:300});
 const rN=await p.evaluate(()=>{const G=window.__game();const X=G.core.x+6,Y=G.core.y-10;return [blockAt(X+16,Y+8).hp,blockAt(X+17,Y+8).hp,G.items];});
 ok(JSON.stringify(rN)===JSON.stringify(rOld),'Healing Pod 7: the same repairs and stores as v40 after 10 s',{v41:rN.slice(0,2),v40:rOld.slice(0,2)});
 r=await p.evaluate(()=>{const {X,Y}=__pen({});const G=window.__game();tryPlace('mender',X+12,Y+10,0,true);const pod=blockAt(X+12,Y+10);if(!pod)return {e:'no pod'};pod.built=1;cam.z=2;centerOn(X+12.5,Y+10.5);
   render();step(1/30);render();hurtBlock(pod,20);render();step(1/30);render();const n=(OST.get(pod)||{}).n;const id=pod.id;hurtBlock(pod,999);let e=0;try{for(let k=0;k<20;k++){step(1/30);render();}}catch(x){e++;}return {n,gone:!G.blocks.has(id),e};});
 ok(r.n>=1&&r.gone&&r.e===0,'Healing Pod 9: a hit makes it flinch, and it is destroyed without errors',r);
 r=await POD({blocks:[['a','wall',12,8]],hurt:{a:.2},steps:90,save:true});
 ok(r.saveErr===0,'Healing Pod 10: saved and loaded mid-repair, plays on without errors; saved pod fields: '+r.saveKeys,r);

 // ===================== general =====================
 r=await p.evaluate(()=>{const {X,Y}=__pen({});const G=window.__game();const h=addBlock('door',X+3,Y+2,0,1);h.built=1;render();return {hdfArt:!!artFor('door',1),plantArt:!!artFor('door',0),hdfOst:!!OST.get(h)};});
 ok(!r.hdfArt&&r.plantArt&&!r.hdfOst,'HDF gates keep their colony look (only the hive\'s gates are painted)',r);
 r=await p.evaluate(()=>{const {g}=__pen({});SET.art=false;let e=0;try{for(let k=0;k<10;k++){step(1/30);render();}}catch(x){e++;}const off=!artFor('door',0)&&!artFor('mender',0);SET.art=true;render();return {e,off,on:!!artFor('door',0)};});
 ok(r.e===0&&r.off&&r.on,'painted art off gives the previous look, on again gives the painted one',r);
 r=await p.evaluate(()=>{const out={};for(const q of ['low','medium','high','epic']){applyQuality(q);let e=0;const {g}=__pen({});try{for(let k=0;k<10;k++){step(1/30);render();}}catch(x){e++;}out[q]={e,art:!!artFor('door',0)};}applyQuality('high');return out;});
 ok(Object.values(r).every(v=>v.e===0)&&!r.low.art&&r.medium.art&&r.epic.art,'Low, Medium, High, Epic: no errors; Low uses the previous look',r);
 r=await p.evaluate(()=>{const {X,Y}=__pen({z:1});const G=window.__game();let n={door:0,doorL:0,mender:0};
   for(let y=0;y<10;y++)for(let x=0;x<12;x++){const t=y<4?'door':y<7?'mender':'door';if(tryPlace(t,X+x+3,Y-2+y*1,0,true))n[t]++;}
   for(let k=0;k<6;k++)if(tryPlace('doorL',X+1+k*3,Y+9,0,true))n.doorL++;for(const b of G.blocks.values())b.built=1;cam.z=1;centerOn(X+10,Y+5);
   const g=blockAt(X+3,Y-2);const u=spawnUnit('mite',g.x+.5,g.y+.5);let e=0,t0=performance.now();try{for(let k=0;k<30;k++){u.x=g.x+.5;u.y=g.y+.5;step(1/30);render();}}catch(x){e++;}
   return {n,e,lite:organLite('door'),N:{...ORGAN_N},op:+g.op.toFixed(2),ms:+((performance.now()-t0)/30).toFixed(1)};});
 ok(r.e===0&&r.op>.9,'crowds: '+JSON.stringify(r.N)+' on screen, no errors; a gate still opens for an ant in a crowd',r);
 await p.close();
 // missing PNG: one layer of each fails to load
 {const q=await page(NEW,async q=>{await q.route(/(petal-gate\/frame|maw-gate\/leaf3|healing-pod\/glow)\.png/,r=>r.abort());});
  const x=await q.evaluate(()=>{const {g}=__pen({});let e=0;try{for(let k=0;k<10;k++){step(1/30);render();}}catch(x){e++;}return {st:['door','doorL','mender','wall','node'].map(t=>ART.plant[t].state),e,op:g.op};});
  ok(x.st[0]==='failed'&&x.st[1]==='failed'&&x.st[2]==='failed'&&x.st[3]==='ready'&&x.e===0&&q.warns.filter(w=>/art|PNG|png|load/i.test(w)).length>=3,'missing PNG: each of the three falls back to its previous look with a console warning; the walls stay painted',{...x,warns:q.warns.length});await q.close();}
 // saves across builds
 {const a=await page(OLD),b=await page(NEW);
  const mk=async q=>q.evaluate(()=>{const {g}=__pen({gate:'doorL'});const u=spawnUnit('mite',g.x+1,g.y-.5);for(let k=0;k<20;k++){step(1/30);render();}return encodeSave();});
  const sOld=await mk(a),sNew=await mk(b);
  const ld=async(q,s)=>q.evaluate(async s=>{let e=0;try{applySave(await decodeSave(s));for(let k=0;k<30;k++){step(1/30);render();}}catch(x){e++;}return {e,doors:[...window.__game().blocks.values()].filter(b=>b.t==='doorL').length};},s);
  const x1=await ld(b,sOld),x2=await ld(a,sNew);ok(x1.e===0&&x2.e===0&&x1.doors===1&&x2.doors===1,'a v40 save with gates loads in v41, and a v41 save loads in v40',{v40inV41:x1,v41inV40:x2});
  ok(a.errs.length===0&&b.errs.length===0,'no page errors',[a.errs.slice(0,2),b.errs.slice(0,2)]);await a.close();await b.close();}
 console.log(`${pass} passed, ${fail} failed`);await br.close();})();
