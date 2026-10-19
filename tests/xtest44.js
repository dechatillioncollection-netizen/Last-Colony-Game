// v44 checks: mouse-wheel rotation of directional growths (Vine, Swift Vine) before placement and at the end of a vine drag. Real mouse and
// wheel input through Playwright. Each check prints PASS or FAIL.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const NEW=process.env.NEW||'lc2_index.html',OLD=process.env.OLD||'lc2_v43_index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
const HELP=()=>{
  window.__seed=(n)=>{let s=n||9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;};
  window.__freeze=()=>{for(const b of webSources())b.wi=webList(b).length;};
  window.__fresh=(o={})=>{if(DLG.open){DLG.done=null;closeDlg();}__seed(o.seed||9);startGame(o.mode||'survival');const G=window.__game();G.countdown=1e9;
    if(o.rich!==0)G.items=G.items.map(v=>v+(o.rich||9999));for(let k=0;k<(o.warm??90);k++)step(1/30);__freeze();return G;};
  window.__strip=(o={})=>{const G=__fresh(o);const X0=G.core.x+(o.dx??12),Y=G.core.y+1,w=o.w??16,h=o.h??6;
    for(let y=Y-h;y<=Y+h;y++)for(let x=G.core.x+3;x<X0+w;x++){if(!inMap(x,y))continue;const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,x<X0?1:0);}
    G.webCov=null;stepWeb(0);__freeze();for(let y=Y-h;y<=Y+h;y++)for(let x=X0;x<X0+w;x++)if(inMap(x,y))setWeb(y*MW+x,0);
    G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();cam.z=2;centerOn(X0+1,Y);G.rot=0;return {G,X0,Y};};
  window.__run=(n,draw)=>{for(let k=0;k<n;k++){step(1/30);if(draw&&k%draw===0)render();}};
  window.__done=()=>{for(const b of window.__game().blocks.values())if(b.bt&&b.built<1){growSite(b,b.bt*2);}};
  window.__scr=(wx,wy)=>{const r=cv.getBoundingClientRect();return [r.left+(wx*T-cam.x)*cam.z,r.top+(wy*T-cam.y)*cam.z];};
  window.__vines=()=>[...window.__game().blocks.values()].filter(b=>VINE[b.t]).sort((a,b)=>a.x-b.x||a.y-b.y);
  window.__end=()=>{const R=PLANC.rows;return R&&R.length?R[R.length-1]:null;};
};
(async()=>{const br=await chromium.launch();
 const page=async(file)=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
   await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','high');}catch(e){}});
   await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(1500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.evaluate(HELP);return p;};
 const p=await page(NEW);let r;fs.mkdirSync('shots44',{recursive:true});
 const shot=async n=>{await p.evaluate(()=>{updateHUD();renderMini();msgEl.innerHTML='';render();});await p.screenshot({path:`shots44/${n}.png`});};
 const at=async(x,y)=>{const s=await p.evaluate(([x,y])=>__scr(x,y),[x,y]);await p.mouse.move(s[0],s[1]);await p.evaluate(()=>render());return s;};
 const wheel=async(n)=>{for(let k=0;k<Math.abs(n);k++){await p.mouse.wheel(0,n>0?100:-100);await p.waitForTimeout(30);}await p.evaluate(()=>render());};
 const tool=t=>p.evaluate(t=>{setTool(null);if(t)setTool(t);},t);
 // a drag held open: move to a, press, move to b in steps; returns without releasing
 const hold=async(a,b)=>{await at(...a);await p.mouse.down();const A=await p.evaluate(([x,y])=>__scr(x,y),a),Bp=await p.evaluate(([x,y])=>__scr(x,y),b);
   for(let k=1;k<=8;k++)await p.mouse.move(A[0]+(Bp[0]-A[0])*k/8,A[1]+(Bp[1]-A[1])*k/8);await p.evaluate(()=>render());};
 const release=async()=>{await p.mouse.up();await p.evaluate(()=>{__run(1);render();});};

 // ===== 1. clockwise and anticlockwise =====
 let S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y};});
 await tool('conveyor');await at(S.X0-3.5,S.Y+.5);
 const gr=()=>p.evaluate(()=>window.__game().rot);
 r={start:await gr()};await wheel(1);r.d1=await gr();await wheel(1);r.d2=await gr();await wheel(-1);r.u1=await gr();await wheel(-2);r.u3=await gr();await wheel(4);r.full=await gr();
 ok(r.start===0&&r.d1===1&&r.d2===2&&r.u1===1&&r.u3===3&&r.full===3,'wheel down turns the Vine clockwise a quarter per notch, wheel up anticlockwise, and it wraps',r);
 r={z0:await p.evaluate(()=>cam.z)};await wheel(3);r.z1=await p.evaluate(()=>cam.z);
 ok(r.z0===r.z1,'with a Vine chosen the wheel never also zooms',r);
 r=await p.evaluate(()=>{const G=window.__game();G.rot=0;render();const a=__end().r;G.rot=1;render();const b=__end().r;G.rot=0;return {a,b};});
 ok(r.a===0&&r.b===1,'the hover preview faces the chosen direction',r);
 // a touchpad: small pixel deltas add up to one step, not one per event
 await p.evaluate(()=>{window.__game().rot=0;});for(let k=0;k<5;k++){await p.mouse.wheel(0,15);await p.waitForTimeout(20);}r={pad:await gr()};
 for(let k=0;k<2;k++){await p.mouse.wheel(0,10);await p.waitForTimeout(20);}r.small=await gr();
 ok(r.pad===1&&r.small===1,'touchpad scrolling: 75 px of small deltas is one step; 20 px is none',r);
 // R and Shift+R still rotate the same way
 await p.evaluate(()=>{window.__game().rot=0;});await p.keyboard.press('r');r={r:await gr()};await p.keyboard.press('Shift+R');r.sr=await gr();
 ok(r.r===1&&r.sr===0,'R turns clockwise and Shift+R anticlockwise, as before',r);
 await tool('tconveyor');await p.evaluate(()=>{window.__game().rot=0;});await wheel(1);r={swift:await gr()};
 ok(r.swift===1,'the Swift Vine rotates with the wheel too',r);

 // ===== 2. placement keeps the chosen orientation =====
 for(const n of [0,1,2,3]){S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y};});await tool('conveyor');await at(S.X0-3.5,S.Y+.5);await wheel(n);
   const pre=await p.evaluate(()=>__end().r);await p.mouse.down();await p.mouse.up();await p.evaluate(()=>__run(1));
   r=await p.evaluate(()=>__vines().map(b=>({x:b.x,rot:b.rot,site:isSite(b)})));ok(r.length===1&&r[0].rot===n&&pre===n,`a Vine turned ${n} quarter${n===1?'':'s'} is placed facing that way (preview ${pre})`,r);}
 await p.evaluate(()=>render());await shot('single_vine_rotated');

 // ===== 3. the drag preview follows the wheel: as in Mindustry, turning during a drag turns the whole line =====
 S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y,cu:window.__game().items[CU]};});await tool('conveyor');
 await hold([S.X0-6.5,S.Y+.5],[S.X0-1.5,S.Y+.5]);
 r={before:await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''))};await shot('drag_line_default');
 await wheel(1);r.after=await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));r.ok=await p.evaluate(()=>PLANC.rows.every(r=>!r.why));await p.waitForTimeout(150);await shot('drag_line_turned_down');
 ok(r.before==='000000'&&r.after==='111111'&&r.ok,'wheel down during an eastward drag turns every vine of the line clockwise to face south, at once',r);
 await wheel(-2);r.up=await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));ok(r.up==='333333','wheel up turns the whole line the other way (north)',r.up);
 await wheel(-1);r.back=await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));ok(r.back==='222222','turning on reverses the line (west): its items will flow back towards the start',r.back);
 await wheel(-1);
 // moving on keeps the turned direction
 const B2=await p.evaluate(([x,y])=>__scr(x,y),[S.X0-.5,S.Y+.5]);await p.mouse.move(B2[0],B2[1]);await p.evaluate(()=>render());r.moved=await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));
 ok(r.moved==='1111111','the chosen direction holds as the drag goes on, for the new tiles too',r.moved);
 await release();
 // ===== 4. construction follows the preview =====
 r=await p.evaluate(cu=>{const L=__vines();return {rots:L.map(b=>b.rot).join(''),sites:L.map(b=>isSite(b)),paid:cu-window.__game().items[CU]};},S.cu);
 ok(r.rots==='1111111'&&r.sites.every(Boolean)&&r.paid===7,'released: the vines start growing exactly as previewed, all facing south, paid once',r);
 r.grown=await p.evaluate(()=>{__run(150);return __vines().map(b=>({r:b.rot,s:isSite(b)}));});
 ok(r.grown.every(v=>!v.s)&&r.grown.map(v=>v.r).join('')==='1111111','after growing, every vine keeps the direction it was placed with',r.grown);
 r=await p.evaluate(()=>window.__game().rot);ok(r===1,'the next Vine starts facing the way the line was turned',r);
 // items really go the way the vines face: a turned line feeds a row of vines south of it
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const rows=planEval('conveyor',planVine('conveyor',[X0-6,Y],[X0-3,Y],false,1));placePlan('conveyor',rows);
   for(let x=X0-6;x<=X0-3;x++)tryPlace('conveyor',x,Y+1,0,true);tryPlace('conveyor',X0-2,Y+1,0,true);__done();for(let x=X0-6;x<=X0-3;x++)blockAt(x,Y).belt.push({i:CU,p:0});__run(60);
   let top=0,below=0;for(let x=X0-6;x<=X0-3;x++){top+=blockAt(x,Y).belt.length;}for(let x=X0-6;x<=X0-2;x++)below+=blockAt(x,Y+1).belt.length;return {rots:[...Array(4)].map((_,k)=>blockAt(X0-6+k,Y).rot).join(''),top,below};});
 ok(r.rots==='1111'&&r.top===0&&r.below===4,'items leave each turned vine through the side it faces, not the way the drag ran',r);
 // ===== 5. the five-vine reach still holds =====
 S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y};});await tool('conveyor');
 await hold([S.X0-2.5,S.Y+.5],[S.X0+7.5,S.Y+.5]);r={pre:await p.evaluate(()=>PLANC.rows.map(r=>r.why?'x':'o').join(''))};
 for(const n of [1,1,1,1]){await wheel(n);}r.post=await p.evaluate(()=>PLANC.rows.map(r=>r.why?'x':'o').join(''));r.lastWhy=await p.evaluate(()=>__end().why);await p.waitForTimeout(150);await shot('drag_reach_rotated');await release();
 r.built=await p.evaluate(X0=>__vines().filter(b=>b.x>=X0).length,S.X0);
 ok(r.pre==='ooooooooxxx'&&r.post===r.pre&&/tile/.test(r.lastWhy)&&r.built===5,'turning a long drag does not lift the limit: 5 past the Rootweb, the rest refused',r);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();for(let k=0;k<5;k++)tryPlace('conveyor',X0+k,Y,0,true);__done();const o={};for(const q of [0,1,2,3]){G.rot=q;o[q]=placeCheck('conveyor',X0+5,Y);}return o;});
 ok(Object.values(r).every(m=>/tile 6/.test(m)),'a 6th vine is refused whichever way it faces',r);

 // ===== 6. timed growth is unchanged =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();setTool('conveyor');G.rot=2;tryPlace('conveyor',X0-3,Y,2,true);const b=blockAt(X0-3,Y);const o={bt:b.bt,want:buildTime('conveyor'),b0:+b.built.toFixed(3),hp:+(b.hp/b.max).toFixed(2)};
   for(let k=0;k<6;k++)rotateTool(1);__run(3);o.mid=isSite(b);o.rot=b.rot;__run(30);o.grown=!isSite(b);return o;});
 ok(r.bt===r.want&&r.b0<=0&&r.hp<=.11&&r.mid&&r.rot===2&&r.grown,'a rotated Vine is still a site that grows for its growth time; turning the tool later does not touch it',r);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();const rows=planEval('conveyor',planVine('conveyor',[X0-6,Y],[X0-1,Y],false,1));placePlan('conveyor',rows);
   const L=__vines();return L.map(b=>+b.built.toFixed(2));});
 ok(r.every((v,k)=>k===0||v<r[k-1]),'a rotated drag still grows in construction order',r);

 // ===== 7. invalid stays invalid =====
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();G.terrain[Y*MW+X0-3]=ROCK;const o={};for(const q of [0,1,2,3]){G.rot=q;PLANC.k='';o[q]=planEval('conveyor',planVine('conveyor',[X0-3,Y],[X0-3,Y],false))[0].why;}
   G.items[CU]=0;G.terrain[Y*MW+X0-3]=0;for(const q of [0,1,2,3]){G.rot=q;o['p'+q]=planEval('conveyor',planVine('conveyor',[X0-3,Y],[X0-3,Y],false))[0].why;}return o;});
 ok([0,1,2,3].every(q=>r[q]&&r[q]!=='same')&&[0,1,2,3].every(q=>r['p'+q]==='short'),'rock stays refused and an unaffordable vine stays unaffordable in every direction',r);
 // a turned line the Bloom can only part-pay: the same tiles are placed and the rest stay unaffordable, never charged
 S=await p.evaluate(()=>{const {G,X0,Y}=__strip();G.items[CU]=3;return {X0,Y};});await tool('conveyor');
 await hold([S.X0-6.5,S.Y+.5],[S.X0-1.5,S.Y+.5]);r={pre:await p.evaluate(()=>PLANC.rows.map(r=>r.why||'o').join(','))};await wheel(1);r.post=await p.evaluate(()=>PLANC.rows.map(r=>r.why||'o').join(','));
 await p.waitForTimeout(150);await shot('drag_line_turned_short');await release();r.after=await p.evaluate(()=>({n:__vines().length,cu:window.__game().items[CU],rots:__vines().map(b=>b.rot).join('')}));
 ok(r.pre==='o,o,o,short,short,short'&&r.post===r.pre&&r.after.n===3&&r.after.cu===0&&r.after.rots==='111','a turned line the Bloom can pay 3 of: the same 3 are placed, the rest stay unaffordable and cost nothing',r);
 // the planned end over an existing vine that it would cross side-on stays refused when rotated
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();tryPlace('wall',X0-3,Y,0,true);const o={};for(const q of [0,1,2,3])o[q]=planEval('conveyor',planVine('conveyor',[X0-3,Y],[X0-3,Y],false,q))[0].why;return o;});
 ok(Object.values(r).every(w=>w&&w!=='same'),'a tile with a wall on it is refused in every direction',r);

 // ===== 8. other controls unchanged =====
 S=await p.evaluate(()=>{const {X0,Y}=__strip();setTool(null);return {X0,Y,z:cam.z};});r=S.z;await at(S.X0-3.5,S.Y+.5);await wheel(2);r={none0:r,none1:await p.evaluate(()=>cam.z),rot:await gr()};
 await p.evaluate(()=>{cam.z=1.5;});await tool('wall');await wheel(-1);r.wall=await p.evaluate(()=>cam.z);r.wallRot=await gr();
 await p.evaluate(()=>{cam.z=1.5;});await tool('drill');await wheel(-1);r.drill=await p.evaluate(()=>cam.z);await p.evaluate(()=>{cam.z=1.5;});await tool('remove');await wheel(-1);r.remove=await p.evaluate(()=>cam.z);
 await p.evaluate(()=>{cam.z=1.5;});await tool('router');await wheel(-1);r.router=await p.evaluate(()=>cam.z);await tool(null);
 ok(r.none1<r.none0&&r.rot===0&&r.wall>1.5&&r.wallRot===0&&r.drill>1.5&&r.remove>1.5&&r.router>1.5,'with nothing chosen, or a symmetrical organ (Bark Wall, Root Tap, Splitter Bulb) or reabsorb, the wheel zooms as before',r);
 // same zoom as v43 for the same wheel input
 const q=await page(OLD);const zoom=async pg=>{await pg.evaluate(()=>{__fresh();setTool(null);cam.z=1;centerOn(window.__game().core.x,window.__game().core.y);});await pg.mouse.move(500,300);
   for(const d of [100,100,-100,-100,-100])await pg.mouse.wheel(0,d);return pg.evaluate(()=>[+cam.z.toFixed(4),+cam.x.toFixed(2),+cam.y.toFixed(2)]);};
 r={v44:await zoom(p),v43:await zoom(q)};await q.close();ok(JSON.stringify(r.v44)===JSON.stringify(r.v43),'zoom and its anchor point are identical to v43',r);
 // Escape, Ctrl staircase and the right-button reabsorb still work after rotating
 S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y,cu:window.__game().items[CU]};});await tool('conveyor');await hold([S.X0-6.5,S.Y+.5],[S.X0-1.5,S.Y+.5]);await wheel(1);
 await p.keyboard.press('Escape');await release();r={n:(await p.evaluate(()=>__vines().length)),paid:S.cu-await p.evaluate(()=>window.__game().items[CU])};
 ok(r.n===0&&r.paid===0,'Escape after rotating still cancels the drag: nothing placed, nothing paid',r);
 // Ctrl staircase keeps its own directions (as in Mindustry); letting go of Ctrl mid-drag applies the turned direction
 S=await p.evaluate(()=>{const {X0,Y}=__strip();return {X0,Y};});await tool('conveyor');await hold([S.X0-7.5,S.Y-4.5],[S.X0-1.5,S.Y+.5]);await p.keyboard.down('Control');
 await p.mouse.move(...await p.evaluate(([x,y])=>__scr(x,y),[S.X0-1.4,S.Y+.6]));await p.evaluate(()=>render());const zc=await p.evaluate(()=>cam.z);await wheel(1);
 r={stair:await p.evaluate(()=>new Set(PLANC.rows.map(r=>r.r)).size),diag:await p.evaluate(()=>PLANC.diag),zoom:await p.evaluate(z=>cam.z===z,zc)};
 await p.keyboard.up('Control');await p.mouse.move(...await p.evaluate(([x,y])=>__scr(x,y),[S.X0-1.5,S.Y+.5]));await p.evaluate(()=>render());r.free=await p.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));await release();
 r.turns=await p.evaluate(()=>new Set(__vines().map(b=>b.rot)).size);
 ok(r.diag&&r.stair===2&&r.zoom&&/^1+$/.test(r.free)&&r.turns===1,'with Ctrl the staircase keeps its own turns (no zoom either); letting go of Ctrl applies the turned direction',r);
 r=await p.evaluate(()=>{const {G,X0,Y}=__strip();tryPlace('conveyor',X0-3,Y,1,true);__done();G.items[CU]=100;const i0=G.items[CU];setTool('conveyor');return {X0,Y,i0};});
 await at(r.X0-2.5,r.Y+.5);await p.mouse.down({button:'right'});await p.mouse.up({button:'right'});
 r.click=await p.evaluate(()=>({n:__vines().length,tool:window.__game().tool}));
 const c1=await p.evaluate(([x,y])=>__scr(x,y),[r.X0-3.9,r.Y+.1]),c2=await p.evaluate(([x,y])=>__scr(x,y),[r.X0-2.1,r.Y+.9]);
 await p.mouse.move(c1[0],c1[1]);await p.mouse.down({button:'right'});await p.mouse.move(c2[0],c2[1],{steps:4});await p.mouse.up({button:'right'});
 r.after=await p.evaluate(()=>({n:__vines().length,cu:window.__game().items[CU]}));
 ok(r.click.n===1&&r.click.tool===null&&r.after.n===0&&r.after.cu===r.i0+1,'right-click with a Vine chosen still drops the tool, and a right-drag still reabsorbs (full refund)',r);
 // a rotated half-grown vine saves and loads with its direction and growth
 r=await p.evaluate(async()=>{const {G,X0,Y}=__strip();tryPlace('conveyor',X0-3,Y,3,true);__run(5);const b=blockAt(X0-3,Y),w={rot:b.rot,built:+b.built.toFixed(3)};
   applySave(await decodeSave(await encodeSave()));const c=blockAt(X0-3,Y);return {w,got:{rot:c.rot,built:+c.built.toFixed(3),site:isSite(c)}};});
 ok(r.got.rot===r.w.rot&&r.got.built===r.w.built&&r.got.site,'a half-grown turned vine keeps its direction and growth through a save',r);
 // help text
 r=await p.evaluate(()=>document.body.innerHTML.includes('wheel rotates a Vine'));ok(r,'the help line explains the wheel',r);

 ok(p.errs.length===0,'no page errors',p.errs.slice(0,5));
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);
})();
