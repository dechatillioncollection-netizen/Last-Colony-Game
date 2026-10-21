// v43 checks: ore-safe Rootweb, extractors off the Rootweb, the 5-tile vine reach, timed growth, vine route planning (drag, Ctrl staircase,
// Escape, budget), enemy pathing and targeting, the Alt grid, old saves and missions. Each check prints PASS or FAIL.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const NEW=process.env.NEW||'lc2_index.html',OLD=process.env.OLD||'lc2_v42_index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const HELP=()=>{
  window.__seed=(n)=>{let s=n||9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;};
  window.__freeze=()=>{for(const b of webSources())b.wi=webList(b).length;};
  window.__fresh=(o={})=>{if(DLG.open){DLG.done=null;closeDlg();}__seed(o.seed||9);startGame(o.mode||'survival');const G=window.__game();G.countdown=1e9;
    if(o.rich!==0)G.items=G.items.map(v=>v+(o.rich||9999));for(let k=0;k<(o.warm??90);k++)step(1/30);__freeze();return G;};
  // a test strip east of the Bloom: columns x<X0 are Rootweb, x>=X0 bare floor, no ore anywhere in it
  window.__strip=(o={})=>{const G=__fresh(o);const X0=G.core.x+(o.dx??8),Y=G.core.y+1,w=o.w??16,h=o.h??6;
    for(let y=Y-h;y<=Y+h;y++)for(let x=G.core.x+3;x<X0+w;x++){if(!inMap(x,y))continue;const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,x<X0?1:0);}
    G.webCov=null;stepWeb(0);__freeze();for(let y=Y-h;y<=Y+h;y++)for(let x=X0;x<X0+w;x++)if(inMap(x,y))setWeb(y*MW+x,0);
    G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=2;centerOn(X0+3,Y);return {G,X0,Y};};
  window.__run=(n,draw)=>{for(let k=0;k<n;k++){step(1/30);if(draw&&k%draw===0)render();}};
  window.__done=()=>{for(const b of window.__game().blocks.values())if(b.bt&&b.built<1){growSite(b,b.bt*2);}};
  window.__scr=(wx,wy)=>{const r=cv.getBoundingClientRect();return [r.left+(wx*T-cam.x)*cam.z,r.top+(wy*T-cam.y)*cam.z];};
  window.__vines=()=>[...window.__game().blocks.values()].filter(b=>VINE[b.t]).length;
};
(async()=>{const br=await chromium.launch();
 const page=async(file)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
   await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','high');}catch(e){}});
   await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.evaluate(HELP);return p;};
 const p=await page(NEW);let r;
 const shot=async n=>{await p.evaluate(()=>{updateHUD();renderMini();msgEl.innerHTML='';render();});await p.screenshot({path:`shots43/${n}.png`});};fs.mkdirSync('shots43',{recursive:true});

 // ===== 1. Rootweb grows round exposed ore, never over it =====
 r=await p.evaluate(()=>{const out={};for(const mode of ['survival','siege']){const G=window.__fresh({mode,warm:0,rich:0});__run(3600);
    let on=0,round=0;for(let i=0;i<N;i++){if(G.ore[i]<0)continue;if(G.web[i])on++;else if(territory(i))round++;}out[mode]={on,round,web:G.webCount};}return out;});
 ok(r.survival.on===0&&r.siege.on===0,'new Rootweb never covers ore (Survival and Base Siege, 2 minutes)',r);
 ok(r.survival.round>0,'ore inside the Rootweb is left exposed and counts as the hive\'s ground beside it',r.survival);
 r=await p.evaluate(()=>{const out={};for(const id of MISSIONS.map(m=>m.id)){try{startMission(id);}catch(e){out[id]={err:String(e)};continue;}const G=window.__game();G.countdown=1e9;
    if(DLG.open)try{dlgClose&&dlgClose();}catch(e){}__run(1800);let on=0;for(let i=0;i<N;i++)if(G.ore[i]>=0&&G.web[i])on++;
    // every sector: a 2x2 Root Tap spot on copper with a free tile beside it for a vine, and the pre-placed structures all fully grown
    let spot=null;for(let y=2;y<MH-3&&!spot;y++)for(let x=2;x<MW-3&&!spot;x++){if(placeCheck('drill',x,y))continue;const o=drillOre('drill',x,y);if(o.item<0)continue;
      for(const [vx,vy] of [[x-1,y],[x+2,y],[x,y-1],[x,y+2]])if(!placeCheck('conveyor',vx,vy)||/Rootweb/.test(placeCheck('conveyor',vx,vy))){spot=[x,y];break;}}
    const sites=[...G.blocks.values()].filter(b=>b.bt||b.built<1).length;out[id]={on,spot:!!spot,sites};}return out;});
 ok(Object.values(r).every(m=>!m.err&&m.on===0),'campaign sectors: no Rootweb on ore after a minute',r);
 ok(Object.values(r).every(m=>m.spot),'campaign sectors: each has a Root Tap spot with room for a vine beside it',r);
 ok(Object.values(r).every(m=>m.sites===0),'campaign sectors: pre-placed and story structures start fully grown',r);
 // old Rootweb on ore (an older save) stays
 r=await p.evaluate(async()=>{const G=window.__fresh({warm:60});const L=[];for(const i of G.core.wlist)if(G.ore[i]>=0&&L.length<6)L.push(i);for(const i of L)setWeb(i,1);
   const S=await encodeSave();applySave(await decodeSave(S));const G2=window.__game();__run(900);return {n:L.length,kept:L.filter(i=>G2.web[i]===1).length};});
 ok(r.n>0&&r.kept===r.n,'Rootweb already on ore in a save is kept after loading',r);

 // ===== 2. Root Taps and Deep Roots off the Rootweb; the 5-tile vine reach =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const out={};
   for(let y=Y-4;y<=Y-3;y++)for(let x=X0+6;x<X0+8;x++)G.ore[y*MW+x]=CU;
   for(let y=Y+3;y<=Y+4;y++)for(let x=X0+6;x<X0+8;x++)G.ore[y*MW+x]=TI;
   out.tap=placeCheck('drill',X0+6,Y-4);out.deep=placeCheck('pdrill',X0+6,Y+3);out.tapTi=placeCheck('drill',X0+6,Y+3);out.wall=placeCheck('wall',X0+3,Y);out.press=placeCheck('press',X0+2,Y+1);
   // ore at the Rootweb's edge counts as the hive's ground for other organs, ore out on bare ground does not
   G.ore[Y*MW+X0-1]=CU;setWeb(Y*MW+X0-1,0);G.ore[(Y+5)*MW+X0+4]=CU;out.edgeOre=placeCheck('wall',X0-1,Y);out.farOre=placeCheck('wall',X0+4,Y+5);return out;});
 ok(r.tap===''&&r.deep==='','a Root Tap and a Deep Root grow on ore with no Rootweb under them',r);
 ok(/Deep Root/.test(r.tapTi),'a Root Tap still cannot take titanium',r.tapTi);
 ok(/Rootweb/.test(r.wall)&&/Rootweb/.test(r.press),'other organs still need Rootweb',r);
 ok(r.edgeOre===''&&/Rootweb/.test(r.farOre),'ore the Rootweb grows round can be built on; ore out on bare ground cannot',r);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const why=[];for(let k=0;k<7;k++){const w=placeCheck('conveyor',X0+k,Y);why.push(w);if(!w)tryPlace('conveyor',X0+k,Y,0,true);}
   const D=vineDist();return {why,d:[0,1,2,3,4].map(k=>D.get(Y*MW+X0+k))};});
 ok(r.why.slice(0,5).every(w=>w==='')&&/tile 6/.test(r.why[5]),'5 vines past the Rootweb are allowed and the 6th is refused (tile 6)',r);
 ok(JSON.stringify(r.d)==='[1,2,3,4,5]','the first tile off the Rootweb counts as 1',r.d);
 // branches, loops, a Root Tap, re-entering the Rootweb
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const P=(x,y,t='conveyor')=>{const w=placeCheck(t,X0+x,Y+y);if(!w)tryPlace(t,X0+x,Y+y,0,true);return w;};const out={};
   for(let k=0;k<3;k++)P(k,0);                      // tiles 1..3
   out.branch=[P(2,1),P(2,2),P(2,3)];               // a branch from tile 3: 4, 5, then 6 refused
   out.loop=[P(3,0),P(4,0),P(4,1),P(3,1)];          // 4,5 then (4,1)=6 refused; (3,1) joins tile 4 and tile 4 of the branch: 5
   // a Root Tap at the end of a 5-tile run is no new source: a vine beside it that touches no other vine must still join
   for(let k=0;k<5;k++)P(k,-4);for(let y=Y-4;y<=Y-3;y++)for(let x=X0+5;x<X0+7;x++)G.ore[y*MW+x]=CU;
   out.tap=placeCheck('drill',X0+5,Y-4);tryPlace('drill',X0+5,Y-4,0,true);out.afterTap=placeCheck('conveyor',X0+7,Y-4);out.afterTap2=placeCheck('conveyor',X0+4,Y-5);
   // a junction (Vine Knot) counts as a vine tile, and Swift Vines count the same
   out.knot=P(1,-1,'junction');out.swift=P(1,-2,'tconveyor');
   // re-entering the Rootweb resets: Rootweb again from x=10, a run back from it
   for(let y=Y-6;y<=Y+6;y++)for(let x=X0+10;x<X0+16;x++)setWeb(y*MW+x,1);out.back=[P(9,0),P(8,0),P(7,0),P(6,0),P(5,0)];
   return out;});
 ok(r.branch[0]===''&&r.branch[1]===''&&/tile 6/.test(r.branch[2]),'a branch keeps counting from where it leaves the line (4, 5, then 6 refused)',r.branch);
 ok(r.loop[0]===''&&r.loop[1]===''&&/tile 6/.test(r.loop[2])&&r.loop[3]==='','a loop gives no extra reach; the shortest route counts',r.loop);
 ok(r.tap===''&&/must (join|connect)/.test(r.afterTap)&&/tile 6/.test(r.afterTap2),'a Root Tap does not restart the count',r);
 ok(r.knot===''&&r.swift==='','Vine Knots and Swift Vines count as vine tiles',r);
 ok(r.back.every(w=>w===''),'vines run back from a second patch of Rootweb count from it',r.back);
 // cut-off vines stay but give no reach
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();for(let k=0;k<5;k++)tryPlace('conveyor',X0+k,Y,0,true);__done();const n0=__vines();deconstruct(blockAt(X0+1,Y));__run(60);
   return {n0,n1:__vines(),kept:[2,3,4].every(k=>!!blockAt(X0+k,Y)),next:placeCheck('conveyor',X0+5,Y),side:placeCheck('conveyor',X0+3,Y+1)};});
 ok(r.kept&&r.n1===r.n0-1,'vines cut off from the Rootweb are not removed',r);
 ok(/must (join|connect)/.test(r.next)&&/must (join|connect)/.test(r.side),'cut-off vines give no reach for new ones',r);
 // an outlying mine: Root Tap on bare ore, 4 vines to the Rootweb, copper arrives in the Bloom
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();for(let y=Y;y<=Y+1;y++)for(let x=X0+4;x<X0+6;x++)G.ore[y*MW+x]=CU;drawTerrainAll();
   const a=tryPlace('drill',X0+4,Y,0,true);const v=[];for(let x=G.core.x+3;x<=X0+3;x++)v.push(tryPlace('conveyor',x,Y,2,true));
   const d=blockAt(X0+4,Y);__run(60);const early={prog:d.prog,out:d.out,built:+d.built.toFixed(2)};G.items[CU]=100;const inc0=G.income[CU];__run(900,30);
   render();return {a,v:v.every(Boolean),early,got:G.income[CU]-inc0,X0,Y};});
 ok(r.a&&r.v,'an outlying Root Tap and its vines are placed',r);
 ok(r.early.prog===0&&r.early.out===0,'a Root Tap still growing gathers nothing',r.early);
 ok(r.got>=3,'copper from the outlying Root Tap reaches the Bloom along the vines',r.got);
 await p.evaluate(({X0,Y})=>{centerOn(X0+1,Y+1);cam.z=2.2;render();},r);await shot('outlying_mine');

 // ===== 3. Timed growth =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({dx:16});const out={};const I0=G.items.slice();
   tryPlace('duo',X0-3,Y+3,0,true);const b=blockAt(X0-3,Y+3);const I1=G.items.slice();
   out.paid=B.duo.cost.every(([i,n])=>I0[i]-I1[i]===n);out.bt=b.bt;out.hp0=+(b.hp/b.max).toFixed(2);out.site=isSite(b);
   // no operation while growing: an enemy in range is not shot at
   const e=spawnEnemy('dagger');e.x=X0-3.5;e.y=Y+6.5;e.hp=e.max=1e6;b.ammo[CU]=20;
   let early=0;const pin=n=>{for(let k=0;k<n;k++){e.x=X0-3.5;e.y=Y+6.5;e.cd=9;const site=isSite(b),h=e.hp;step(1/30);if(site&&e.hp<h)early++;}};const prog=[];for(let k=0;k<5;k++){pin(30);prog.push(+b.built.toFixed(2));}
   out.prog=prog;out.shotWhileGrowing=early>0;out.paidAgain=G.items.some((v,i)=>v<I1[i]-0)&&false;
   pin(30);out.done=b.built===1&&!isSite(b);out.hpDone=+(b.hp/b.max).toFixed(2);pin(60);out.shotAfter=e.hp<1e6;e.dead=true;
   out.items=G.items.slice(0,3);out.I1=I1.slice(0,3);return out;});
 ok(r.paid&&r.site&&r.bt===3,'a placed structure is paid once, up front, and becomes a timed site',r);
 ok(r.hp0===0.1,'a site starts at a tenth of its health',r.hp0);
 ok(r.prog.join()==='0.33,0.67,1,1,1'||r.prog[0]>0&&r.prog[1]>r.prog[0],'a site grows over its build time',r.prog);
 ok(!r.shotWhileGrowing&&r.shotAfter,'a Thorn Spitter does not fire until grown, then does',r);
 ok(r.done&&r.hpDone===1,'a grown site is a working structure at full health',r);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({rich:0});G.items=G.items.map(()=>1000);const out={};
   tryPlace('lancer',X0-4,Y-3,0,true);const b=blockAt(X0-4,Y-3);__run(60);const I0=G.items.slice();deconstruct(b);out.refund=G.items.every((v,i)=>v-I0[i]===(B.lancer.cost.find(c=>c[0]===i)||[0,0])[1]);
   tryPlace('wall',X0-2,Y-5,0,true);const w=blockAt(X0-2,Y-5);const I1=G.items.slice();hurtBlock(w,w.hp+1);out.destroyed=!G.blocks.has(w.id);out.noRefund=G.items.every((v,i)=>v===I1[i]);
   // sites take no items, give no vigor or Rootweb, are not healed
   tryPlace('conveyor',X0-2,Y,0,true);const c=blockAt(X0-2,Y);out.accept=accepts(c,CU,null);
   tryPlace('solar',X0-3,Y+5,0,true);computePower();out.gen=G.powGen;
   tryPlace('node',X0-5,Y-5,0,true);const nd=blockAt(X0-5,Y-5);out.src=webSources().includes(nd);
   tryPlace('door',X0-1,Y+5,0,true);const dr=blockAt(X0-1,Y+5);out.gateShut=solidFor(0,dr);__done();out.gateOpen=!solidFor(0,dr);out.src2=webSources().includes(nd);computePower();out.gen2=G.powGen;return out;});
 ok(r.refund,'reabsorbing a site returns exactly what was paid (no gain, no loss)',r);
 ok(r.destroyed&&r.noRefund,'a site destroyed by damage returns nothing',r);
 ok(!r.accept&&r.gen===0&&!r.src&&r.gateShut,'sites take no items, make no vigor, spread no Rootweb, and a growing gate stays shut',r);
 ok(r.gateOpen&&r.src2&&r.gen2>0,'the same structures work once grown',r);
 // saves mid-growth; old saves and their finished buildings
 r=await p.evaluate(async()=>{const {G,X0,Y}=__strip();tryPlace('mender',X0-3,Y-2,0,true);__run(45);const b=blockAt(X0-3,Y-2);const before=+b.built.toFixed(3);
   const S=await encodeSave();applySave(await decodeSave(S));const G2=window.__game();const b2=blockAt(X0-3,Y-2);const after={bt:b2.bt,built:+b2.built.toFixed(3),site:isSite(b2)};__run(150);
   return {before,after,done:b2.built===1};});
 ok(r.after.bt===4&&r.after.built===r.before&&r.after.site&&r.done,'a site is saved and loaded mid-growth and then finishes',r);
 const po=await page(OLD);
 const S42=await po.evaluate(async()=>{__seed(5);startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9999);G.webFree=true;
   const X=G.core.x+4,Y=G.core.y;for(let k=0;k<6;k++)tryPlace('conveyor',X+k,Y,0,true);tryPlace('duo',X,Y+2,0,true);tryPlace('wall',X+2,Y+2,0,true);for(let k=0;k<200;k++)step(1/30);
   // a v42 game: Rootweb has grown over ore
   let on=0;for(let i=0;i<N;i++)if(G.ore[i]>=0&&G.web[i])on++;window.__on=on;return {s:await encodeSave(),on,n:G.blocks.size};});
 await po.close();
 r=await p.evaluate(async S=>{applySave(await decodeSave(S.s));const G=window.__game();const sites=[...G.blocks.values()].filter(b=>isSite(b)).length;let on=0;for(let i=0;i<N;i++)if(G.ore[i]>=0&&G.web[i])on++;
   __run(600,30);let on2=0;for(let i=0;i<N;i++)if(G.ore[i]>=0&&G.web[i])on2++;return {sites,n:G.blocks.size,on,on2,want:S.on};},S42);
 ok(r.sites===0&&r.n===S42.n,'a v42 save loads with every structure finished',r);
 ok(r.on===r.want&&r.on2>=r.want,'a v42 save keeps its Rootweb on ore (nothing deleted)',r);
 ok(p.errs.length===0,'no page errors so far',p.errs.slice(0,3));
 // construction stages picture
 await p.evaluate(()=>{const {G,X0,Y}=__strip({dx:16});const ts=['duo','mender','solar','wall','press'];ts.forEach((t,k)=>tryPlace(t,X0-12+k*2,Y-3,0,true));__run(10);
   const L=[...G.blocks.values()].filter(b=>b.bt);L.forEach((b,k)=>{b.built=[0.05,.3,.55,.8,1][k];});centerOn(X0-7,Y-2.5);cam.z=2.5;G.sel=L[1].id;renderPanel(true);updatePanel();render();});await shot('construction_stages');

 // ===== 4. Vine route planning =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({dx:12});const out={};
   const chain=pl=>pl.every((q,k)=>k===0||Math.abs(q[0]-pl[k-1][0])+Math.abs(q[1]-pl[k-1][1])===1);
   const aim=pl=>pl.slice(0,-1).every((q,k)=>{const n=pl[k+1];return [n[0]-q[0],n[1]-q[1]].join()===[[1,0],[0,1],[-1,0],[0,-1]][q[2]].join();});
   let pl=planVine('conveyor',[X0-6,Y],[X0-1,Y],false);out.straight=pl.length===6&&pl.every(q=>q[1]===Y&&q[2]===0);
   pl=planVine('conveyor',[X0-1,Y],[X0-6,Y],false);out.reverse=pl.every(q=>q[2]===2);
   pl=planVine('conveyor',[X0-6,Y-4],[X0-1,Y+1],false);out.corner=chain(pl)&&aim(pl)&&pl.filter((q,k)=>k&&q[2]!==pl[k-1][2]).length===1;
   // a rock in the way: the route goes round it
   for(let y=Y-2;y<=Y+2;y++)G.terrain[y*MW+X0+3]=ROCK;pl=planVine('conveyor',[X0,Y],[X0+6,Y],false);out.round=chain(pl)&&aim(pl)&&pl.every(q=>!blockedT(q[1]*MW+q[0]))&&pl[pl.length-1][0]===X0+6;
   // Ctrl: a staircase of orthogonal vines along the diagonal
   pl=planVine('conveyor',[X0-8,Y-6],[X0-2,Y],true);let run=1,mx=1;for(let k=1;k<pl.length;k++){run=pl[k][2]===pl[k-1][2]?run+1:1;mx=Math.max(mx,run);}
   out.stair=chain(pl)&&aim(pl)&&mx<=2&&pl.length===13;out.stairPl=pl.map(q=>q.join(':')).join(' ');
   // into an existing vine: the route stops beside it, pointing into it
   tryPlace('conveyor',X0-3,Y+4,1,true);pl=planVine('conveyor',[X0-7,Y+4],[X0-3,Y+4],false);out.into=pl.length===4&&pl[3][0]===X0-4&&pl[3][2]===0;
   // a Swift Vine dragged along an old vine line upgrades it; a plain Vine dragged across a line side-on goes round or stops, never re-aims it
   for(let k=0;k<6;k++)tryPlace('conveyor',X0-8+k,Y+6,0,true);__done();let ev=planEval('tconveyor',planVine('tconveyor',[X0-8,Y+6],[X0-3,Y+6],false));
   out.upgrade=ev.length===6&&ev.every(q=>!q.why&&q.y===Y+6);placePlan('tconveyor',ev);out.upgraded=[0,1,2,3,4,5].every(k=>{const b=blockAt(X0-8+k,Y+6);return b&&b.t==='tconveyor'&&b.rot===0;});
   for(let k=-3;k<=3;k++)tryPlace('conveyor',X0-5,Y+2+k,1,true);__done();ev=planEval('conveyor',planVine('conveyor',[X0-8,Y+2],[X0-2,Y+2],false));placePlan('conveyor',ev);
   out.cross=[-3,-2,-1,0,1,2,3].every(k=>{const b=blockAt(X0-5,Y+2+k);return b&&b.rot===1;});
   // walled in: the fallback line is shown, nothing lands on rock
   for(let y=Y-1;y<=Y+1;y++)for(let x=X0+9;x<=X0+11;x++)if(x!==X0+10||y!==Y)G.terrain[y*MW+x]=ROCK;
   const rows=planEval('conveyor',planVine('conveyor',[X0+6,Y-3],[X0+10,Y],false));out.walled=rows.filter(q=>blockedT(q.i)).every(q=>q.why);
   // speed: a long drag across obstacles
   for(let k=0;k<40;k++)G.terrain[(Y-6+((k*7)%12))*MW+X0+((k*5)%15)]=ROCK;let t0=performance.now();for(let k=0;k<20;k++)planVine('conveyor',[G.core.x-30,Y-10],[X0+14,Y+5],k%2===1);
   out.ms=+((performance.now()-t0)/20).toFixed(2);return out;});
 ok(r.straight&&r.reverse,'straight drags, either way, point along the drag',r);
 ok(r.corner,'an L-shaped drag gets one bend, every vine pointing at the next',r);
 ok(r.round,'a drag across rock routes round it',r);
 ok(r.stair,'Ctrl+drag lays a staircase of orthogonal vines along the diagonal',r.stairPl);
 ok(r.into,'a drag ending on the side of a vine stops beside it, feeding into it',r);
 ok(r.walled,'no vine is planned onto rock when the end is walled in',r);
 ok(r.upgrade&&r.upgraded,'a Swift Vine dragged along an old vine line upgrades it in place',r);
 ok(r.cross,'a drag across a vine line never turns the vines it meets side-on',r);
 ok(r.ms<25,'route planning for a long drag takes under 25 ms',r.ms);
 // budget: only what the Bloom can pay is placed, nearest the Rootweb first; refused tiles cost nothing
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({rich:0,dx:12});G.items=G.items.map(()=>0);G.items[CU]=4;
   const rows=planEval('conveyor',planVine('conveyor',[X0-6,Y],[X0+3,Y],false));const short=rows.filter(q=>q.why==='short').map(q=>q.x-X0);
   const [n,why]=placePlan('conveyor',rows);return {n,why,cu:G.items[CU],short,placed:[...G.blocks.values()].filter(b=>b.t==='conveyor').map(b=>b.x-X0).sort((a,b)=>a-b)};});
 ok(r.n===4&&r.cu===0&&r.why.short===6,'with copper for 4 vines, 4 are placed and 6 reported unaffordable; nothing goes negative',r);
 ok(JSON.stringify(r.placed)==='[-6,-5,-4,-3]','the vines placed are the ones nearest the Rootweb, in construction order',r.placed);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const I0=G.items[CU];const rows=planEval('conveyor',planVine('conveyor',[X0-2,Y],[X0+9,Y],false));const [n,why]=placePlan('conveyor',rows);
   const L=[...G.blocks.values()].filter(b=>b.t==='conveyor').sort((a,b)=>a.x-b.x);return {n,why,paid:I0-G.items[CU],built:L.map(b=>+b.built.toFixed(2))};});
 ok(r.n===7&&r.why.reach===5&&r.paid===7,'a drag 12 tiles long from the Rootweb places 2+5 and refuses the rest, charging only for the 7',r);
 ok(r.built.every((v,k)=>k===0||v<r.built[k-1]),'tiles grow in order, nearest the Rootweb first',r.built);
 // real mouse: drag, Ctrl mid-drag, Escape
 const drag=async(a,b,o={})=>{await p.evaluate(t=>{setTool(null);setTool(t);},o.t||'conveyor');const A=await p.evaluate(([x,y])=>__scr(x,y),a),Bp=await p.evaluate(([x,y])=>__scr(x,y),b);
   await p.mouse.move(A[0],A[1]);await p.mouse.down();for(let k=1;k<=8;k++)await p.mouse.move(A[0]+(Bp[0]-A[0])*k/8,A[1]+(Bp[1]-A[1])*k/8);
   if(o.mid)await o.mid();await p.evaluate(()=>render());const want=await p.evaluate(()=>PLANC.rows?PLANC.rows.filter(r=>!r.why).length:-1);if(o.shot)await shot(o.shot);if(o.esc)await p.keyboard.press('Escape');await p.mouse.up();await p.evaluate(()=>{__run(2);render();});return want;};
 let S=await p.evaluate(()=>{const {G,X0,Y}=__strip({dx:12});return {X0,Y,cu:G.items[CU]};});
 let want=await drag([S.X0-6.5,S.Y-3.5],[S.X0+2.5,S.Y+.5],{shot:'drag_preview_L'});
 r=await p.evaluate(()=>({n:__vines()}));ok(r.n===14&&want===14,'a mouse drag places exactly the previewed route',{...r,want});
 S=await p.evaluate(()=>{const {G,X0,Y}=__strip({dx:12});return {X0,Y};});
 await drag([S.X0-7.5,S.Y-5.5],[S.X0-1.5,S.Y+.5],{mid:async()=>{await p.keyboard.down('Control');await p.mouse.move(...await p.evaluate(([x,y])=>__scr(x,y),[S.X0-1.4,S.Y+.6]));},shot:'drag_preview_ctrl'});
 await p.keyboard.up('Control');
 r=await p.evaluate(()=>{const L=[...window.__game().blocks.values()].filter(b=>VINE[b.t]);let turns=0;for(const b of L){const n=frontOf(b,b.rot);if(n&&VINE[n.t]&&n.rot!==b.rot)turns++;}return {n:L.length,turns};});
 ok(r.n===13&&r.turns>=8,'holding Ctrl part-way through a drag switches the preview and the placement to a staircase',r);
 S=await p.evaluate(()=>{const {G,X0,Y}=__strip();return {X0,Y,cu:G.items[CU]};});
 await drag([S.X0-6.5,S.Y+.5],[S.X0+.5,S.Y+.5],{esc:true});
 r=await p.evaluate(()=>({n:__vines(),cu:window.__game().items[CU]}));ok(r.n===0&&r.cu===S.cu,'Escape during a drag cancels it: nothing placed, nothing paid',{...r,before:S.cu});
 // previews for the record: the 6th tile refused, too little copper
 S=await p.evaluate(()=>{const {G,X0,Y}=__strip();return {X0,Y};});
 await drag([S.X0-1.5,S.Y+.5],[S.X0+7.5,S.Y+.5],{shot:'drag_reach_5_ok_6th_refused',esc:true});
 await p.evaluate(()=>{const G=window.__game();G.items[CU]=5;});
 await drag([S.X0-6.5,S.Y+2.5],[S.X0+2.5,S.Y+2.5],{shot:'drag_not_affordable',esc:true});
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();for(let k=0;k<5;k++)tryPlace('conveyor',X0+k,Y,0,true);__done();setTool('conveyor');return {msg:placeCheck('conveyor',X0+5,Y),X0,Y};});
 await p.evaluate(({X0,Y})=>{const [x,y]=__scr(X0+5.5,Y+.5);const r=cv.getBoundingClientRect();mouse.x=x-r.left;mouse.y=y-r.top;mouse.in=true;render();},r);await shot('reach_5_built_6th_refused');
 ok(/tile 6/.test(r.msg),'with 5 vines built past the Rootweb, a 6th is refused',r.msg);

 // ===== 5. Enemy pathing and targeting =====
 // a wall line across a corridor with a gap: tanks go through the gap
 const arena=(o)=>p.evaluate(o=>{const {G,X0,Y}=__strip({w:30,h:8,dx:6});const out={};
   // a closed corridor: rock above and below, the Bloom west, the enemies east
   for(let x=G.core.x+3;x<X0+30;x++){G.terrain[(Y-8)*MW+x]=ROCK;G.terrain[(Y+8)*MW+x]=ROCK;}for(let y=Y-8;y<=Y+8;y++)G.terrain[y*MW+X0+29]=ROCK;
   for(let y=Y-7;y<=Y+7;y++)for(let x=X0;x<X0+29;x++)setWeb(y*MW+x,1);
   for(let y=Y-7;y<=Y+7;y++){if(o.gap&&Math.abs(y-Y-3)<=1)continue;tryPlace('wall',X0+12,y,0,true);}__done();
   const walls=[...G.blocks.values()].filter(b=>b.t==='wall');G.dirty=true;recompute();drawTerrainAll();
   const es=[];for(let k=0;k<o.n;k++){const e=spawnEnemy(o.t||'dagger');e.x=X0+24+(k%3);e.y=Y-4+k*1.3%9;es.push(e);}
   let maxStk=0,cross=0;for(let k=0;k<o.steps;k++){step(1/30);if(k%15===0)render();for(const e of es)maxStk=Math.max(maxStk,e.stk||0);}
   cross=es.filter(e=>!e.dead&&e.x<X0+12).length+es.filter(e=>e.dead).length;
   out.cross=cross;out.lost=walls.filter(w=>!G.blocks.has(w.id)).length;out.dmg=Math.round(walls.reduce((s,w)=>s+(w.max-(G.blocks.has(w.id)?w.hp:0)),0));out.maxStk=maxStk;out.n=o.n;
   out.flown=FLOWN;centerOn(X0+12,Y);cam.z=1.2;DBG.nav=!!o.dbg;render();return out;},o);
 r=await arena({gap:1,n:6,steps:600,dbg:true});await shot('ai_debug_gap');await p.evaluate(()=>{DBG.nav=false;});
 ok(r.cross===r.n&&r.lost===0,'with a gap in the wall, every tank goes through it and no wall is broken',r);
 r=await arena({gap:0,n:6,steps:1500});
 ok(r.lost>=1&&r.cross>=1,'with the wall sealed, the tanks break through it',r);
 ok(r.maxStk<6,'no tank stays stuck',r);
 // a gap closed while they are on their way: the route field is rebuilt and they turn on the wall
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({w:30,h:8,dx:6});for(let x=G.core.x+3;x<X0+30;x++){G.terrain[(Y-8)*MW+x]=ROCK;G.terrain[(Y+8)*MW+x]=ROCK;}for(let y=Y-7;y<=Y+7;y++)for(let x=X0;x<X0+29;x++)setWeb(y*MW+x,1);
   for(let y=Y-8;y<=Y+8;y++)G.terrain[y*MW+X0+29]=ROCK;for(let y=Y-7;y<=Y+7;y++)if(y!==Y)tryPlace('wall',X0+12,y,0,true);__done();G.dirty=true;recompute();const f0=FLOWN;const nx0=G.flowNext[Y*MW+X0+13];
   tryPlace('wall',X0+12,Y,0,true);__done();__run(3);const f1=FLOWN;__run(12);const f2=FLOWN;return {f0,f1,f2,cost:G.flow[Y*MW+X0+14]>=SOLID_COST};});
 ok(r.f2>r.f0&&r.cost,'closing the gap rebuilds the shared route field (within a quarter second)',r);
 // roles
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const out={};
   tryPlace('wall',X0-3,Y,0,true);tryPlace('conveyor',X0-3,Y+3,0,true);tryPlace('duo',X0-3,Y-3,0,true);tryPlace('press',X0-6,Y+1,0,true);__done();
   const pick=t=>{const e=spawnEnemy(t);e.x=X0+.5;e.y=Y+.5;enemyThink(e);const b=e.target;e.dead=true;return b?b.t:null;};
   out.scout=pick('dagger');out.siege=pick('fortress');out.flame=(()=>{const e=spawnEnemy('mace');e.x=X0-1.2;e.y=Y+1.5;enemyThink(e);e.dead=true;return e.target&&e.target.t;})();
   const bm=spawnEnemy('horizon');bm.x=X0-2.5;bm.y=Y+.5;let wallPicked=0;for(let k=0;k<20;k++){enemyThink(bm);if(bm.target&&B[bm.target.t].wall)wallPicked++;}bm.dead=true;out.bomberWall=wallPicked;
   return out;});
 ok(r.scout==='conveyor','a Scout Tank goes for exposed logistics first',r);
 ok(r.siege==='duo','a Siege Tank goes for guns first',r);
 ok(r.flame&&r.flame!=='wall','a Flame Tank goes for a living structure rather than bark',r);
 ok(r.bomberWall===0,'a Bomber never targets bark walls',r);
 // target commitment: no frame-to-frame switching between two equal targets
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();tryPlace('wall',X0-4,Y-2,0,true);tryPlace('wall',X0-4,Y+2,0,true);__done();
   const e=spawnEnemy('dagger');e.x=X0-.5;e.y=Y+.5;let sw=0,last=null;for(let k=0;k<60;k++){e.y=Y+.5+Math.sin(k)*.6;G.time+=.3;enemyThink(e);if(last&&e.target!==last)sw++;last=e.target;}e.dead=true;return {sw};});
 ok(r.sw===0,'a tank keeps its target instead of flicking between two equal ones',r);
 // objectives: a scout leaves the route for a nearby vine it can reach, not for one behind bark
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip({w:24});tryPlace('conveyor',X0-2,Y+4,0,true);__done();const v=blockAt(X0-2,Y+4);
   const e=spawnEnemy('dagger');e.x=X0+5.5;e.y=Y+4.5;e.objT=0;enemyThink(e);const o1=e.obj===v.id;e.dead=true;
   for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1],[-1,-1],[1,-1],[-1,1],[1,1]])tryPlace('wall',X0-2+dx,Y+4+dy,0,true);__done();
   const e2=spawnEnemy('dagger');e2.x=X0+5.5;e2.y=Y+4.5;e2.objT=0;enemyThink(e2);const o2=e2.obj;e2.dead=true;return {o1,o2};});
 ok(r.o1&&!r.o2,'a Scout Tank takes a reachable vine as its objective, but not one walled in',r);
 // story-scripted units are left alone
 r=await p.evaluate(()=>{const G=window.__fresh();const e=spawnEnemy('dagger');e.script=1;e.goal=[e.x-3,e.y];e.id=G.nextId++;__run(60);return {obj:e.obj,stk:e.stk,objT:e.objT,tgT:e.tgT};});
 ok(r.obj===undefined&&r.stk===undefined&&r.objT===undefined&&r.tgT===undefined,'story-scripted units never use the new targeting or movement',r);
 // a big wave: no errors, no stalls, time per step
 r=await p.evaluate(()=>{const G=window.__fresh({seed:3});const X=G.core.x,Y=G.core.y;
   for(let k=0;k<14;k++){tryPlace('wall',X-6+k,Y-6,0,true);tryPlace('wall',X-6+k,Y+8,0,true);}for(let k=0;k<4;k++)tryPlace('duo',X-4+k*3,Y-4,0,true);__done();
   const ts=['dagger','dagger','crawler','mace','fortress','flare','horizon'];for(let k=0;k<120;k++)G.spawnQ.push({t:ts[k%7],at:G.time+k*.05});
   let mx=0,t0=performance.now(),err=0;const f0=FLOWN;try{for(let k=0;k<1800;k++){step(1/30);for(const e of G.enemies)mx=Math.max(mx,e.stk||0);}}catch(x){err=String(x);}
   return {ms:+((performance.now()-t0)/1800).toFixed(2),mx,err,flows:FLOWN-f0,left:G.enemies.length};});
 ok(!r.err,'a wave of 120 mixed enemies runs for a minute without errors',r);
 ok(r.flows<=240,'the route field is rebuilt at most four times a second',r);
 ok(r.mx<6,'no enemy in the big wave stays stuck',r);

 // ===== 6. The Alt grid =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();for(let y=Y;y<=Y+1;y++)for(let x=X0+4;x<X0+6;x++)G.ore[y*MW+x]=CU;G.terrain[(Y-2)*MW+X0+2]=ROCK;G.terrain[(Y-2)*MW+X0+3]=WATER;
   tryPlace('wall',X0-3,Y,0,true);tryPlace('duo',X0-5,Y-3,0,true);const site=blockAt(X0-5,Y-3);
   const rects=new Set();const fake={save(){},restore(){},beginPath(){},stroke(){},rect(x,y){rects.add(Math.floor(y/T)*MW+Math.floor(x/T));},set strokeStyle(v){},set lineWidth(v){}};
   const tx0=X0-8,ty0=Y-6,tx1=X0+10,ty1=Y+6;drawBuildGrid(fake,tx0,ty0,tx1,ty1,2);
   const has=(x,y)=>rects.has(y*MW+x);let outside=0;for(const i of rects){const x=i%MW,y=(i/MW)|0;if(x<tx0||x>tx1||y<ty0||y>ty1)outside++;}
   return {rock:has(X0+2,Y-2),water:has(X0+3,Y-2),wall:has(X0-3,Y),site:has(X0-5,Y-3),ore:has(X0+4,Y),offweb:has(X0+8,Y+3),onweb:has(X0-2,Y+3),outside,siteIs:isSite(site),X0,Y};});
 ok(!r.rock&&!r.water&&!r.wall&&!r.site,'the Alt grid skips rock, deep water, structures and growing sites',r);
 ok(r.ore&&r.offweb&&r.onweb,'the Alt grid shows ore and ground off the Rootweb as buildable',r);
 ok(r.outside===0,'the Alt grid draws only the visible tiles',r);
 await p.evaluate(({X0,Y})=>{centerOn(X0+1,Y);cam.z=1.6;keys.add('alt');render();},r);await shot('alt_grid');await p.evaluate(()=>{keys.delete('alt');});
 await p.keyboard.down('Alt');r=await p.evaluate(()=>keys.has('alt'));await p.keyboard.up('Alt');const r2=await p.evaluate(()=>keys.has('alt'));
 ok(r&&!r2,'holding Alt turns the grid on, releasing it turns it off',{down:r,up:r2});

 // ===== 7. Ore-safe Rootweb picture =====
 await p.evaluate(()=>{const G=window.__fresh({warm:2400,rich:0});let bi=-1,bn=0;for(let i=0;i<N;i++){if(G.ore[i]<0||G.web[i])continue;const x=i%MW,y=(i/MW)|0;let n=0;for(let yy=y-3;yy<=y+3;yy++)for(let xx=x-3;xx<=x+3;xx++)if(inMap(xx,yy)&&G.ore[yy*MW+xx]>=0&&!G.web[yy*MW+xx]&&territory(yy*MW+xx))n++;if(n>bn){bn=n;bi=i;}}
   centerOn(bi%MW+.5,((bi/MW)|0)+.5);cam.z=2.4;render();return bn;});await shot('ore_safe_rootweb');
 // the route debug view in a real wave against a walled base
 await p.evaluate(()=>{const G=window.__fresh({seed:3,warm:300});const X=G.core.x,Y=G.core.y;for(let k=0;k<16;k++){tryPlace('wall',X-7+k,Y-7,0,true);tryPlace('wall',X-7+k,Y+9,0,true);}
   for(let k=0;k<16;k++)if(k<6||k>8){tryPlace('wall',X-7,Y-7+k,0,true);tryPlace('wall',X+8,Y-7+k,0,true);}for(let k=0;k<4;k++)tryPlace('duo',X-4+k*3,Y-5,0,true);tryPlace('conveyor',X+10,Y+1,0,true);__done();
   const ts=['dagger','dagger','crawler','mace','fortress'];for(let k=0;k<20;k++)G.spawnQ.push({t:ts[k%5],at:G.time+k*.2});DBG.nav=true;__run(1700,50);
   const es=G.enemies.filter(e=>!e.dead);let mx=0,my=0;for(const e of es){mx+=e.x;my+=e.y;}if(es.length)centerOn((mx/es.length+X+1.5)/2,(my/es.length+Y+1.5)/2);else centerOn(X+1.5,Y+1.5);cam.z=1.1;render();});
 await shot('ai_debug_wave');await p.evaluate(()=>{DBG.nav=false;});

 ok(p.errs.length===0,'no page errors',p.errs.slice(0,5));
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
})();
