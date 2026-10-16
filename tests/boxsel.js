// Box selection of ants with the left mouse button, through real mouse input. Writes shots36/*.png and boxsel_result.json.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');}catch(e){}});
 await p.goto(URL);await p.waitForTimeout(1200);
 const R=[];const check=(name,ok,info)=>{R.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info));};
 const box=await p.evaluate(()=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;
  const cx=G.core.x+7,cy=G.core.y+1;for(let y=cy-6;y<cy+8;y++)for(let x=cx-3;x<cx+14;x++){G.terrain[y*MW+x]=0;const b=blockAt(x,y);if(b&&b.t!=='core')destroyBlock(b);}drawTerrainAll();
  for(const u of G.units)u.dead=true;G.units=[];
  // two groups of three: one inside the box we will draw, one outside it
  for(const [dx,dy] of [[0,0],[1.2,.4],[.4,1.4],[8,0],[8.5,1.2],[9,-.8]])spawnUnit('mite',cx+dx,cy+dy);
  for(const u of G.units){u.hold=[u.x,u.y];}
  cam.z=1.6;centerOn(cx+4.5,cy+.5);G.paused=true;
  const sc=(x,y)=>[(x*T-cam.x)*cam.z,(y*T-cam.y)*cam.z];
  return {a:sc(cx-1,cy-1),b:sc(cx+2.5,cy+2.5),c:sc(cx+7,cy-2),d:sc(cx+10.5,cy+2.5),ground:sc(cx+4,cy+5),one:sc(G.units[3].x,G.units[3].y),ids:G.units.map(u=>u.id)};});
 // 1. drag a box round the first three
 await p.mouse.move(box.a[0],box.a[1]);await p.mouse.down();await p.mouse.move((box.a[0]+box.b[0])/2,(box.a[1]+box.b[1])/2,{steps:4});await p.mouse.move(box.b[0],box.b[1],{steps:4});
 await p.waitForTimeout(300);await p.screenshot({path:'shots36/1_dragging.png'});await p.mouse.up();await p.waitForTimeout(250);
 let r=await p.evaluate(()=>({sel:G.selUs,selU:G.selU,panel:document.getElementById('panel').innerText.slice(0,160)}));
 check('1 a left-button drag selects every ant inside the box, and only those',r.sel.length===3&&r.sel.every(id=>box_ids_in(id)),r);
 function box_ids_in(id){return box.ids.slice(0,3).includes(id);}
 check('2 the panel shows the group',/3 ANTS SELECTED/.test(r.panel),r.panel);
 await p.screenshot({path:'shots36/2_selected.png'});
 // 3. click open ground: all three go, each to its own spot
 await p.mouse.click(box.ground[0],box.ground[1]);await p.waitForTimeout(250);
 r=await p.evaluate(()=>{const s=new Set(G.selUs);const sel=G.units.filter(u=>s.has(u.id));const holds=sel.map(u=>u.hold);let minD=9;for(let i=0;i<holds.length;i++)for(let j=i+1;j<holds.length;j++)minD=Math.min(minD,Math.hypot(holds[i][0]-holds[j][0],holds[i][1]-holds[j][1]));
   const others=G.units.filter(u=>!s.has(u.id)).map(u=>u.hold&&+u.hold[0].toFixed(1));return {n:sel.length,holds,minD:+minD.toFixed(2),stillSelected:G.selUs.length,others};});
 check('3 clicking open ground sends every selected ant, spread out (no two on one spot); the others stay put',r.n===3&&r.holds.every(Boolean)&&r.minD>=.8&&r.stillSelected===3,r);
 await p.evaluate(()=>{G.paused=false;});await p.waitForTimeout(1800);await p.evaluate(()=>{G.paused=true;});await p.screenshot({path:'shots36/3_moving.png'});
 // 4. Shift-drag adds the second group
 await p.keyboard.down('Shift');await p.mouse.move(box.c[0],box.c[1]);await p.mouse.down();await p.mouse.move(box.d[0],box.d[1],{steps:6});await p.mouse.up();await p.keyboard.up('Shift');await p.waitForTimeout(200);
 r=await p.evaluate(()=>({n:G.selUs.length,panel:document.getElementById('panel').innerText.slice(0,40)}));
 check('4 Shift-drag adds to the selection',r.n===6&&/6 ANTS/.test(r.panel),r);
 // 5. a plain click on one ant selects just that ant
 const one=await p.evaluate(id=>{const u=G.units.find(u=>u.id===id);return [(u.x*T-cam.x)*cam.z,(u.y*T-cam.y)*cam.z];},box.ids[3]);
 await p.mouse.click(one[0],one[1]);await p.waitForTimeout(200);
 r=await p.evaluate(()=>({sel:G.selUs,selU:G.selU,h:document.querySelector('#panel h3').textContent}));
 check('5 clicking one ant selects only that ant (single-ant panel)',r.sel.length===1&&r.selU===r.sel[0]&&/MITE/.test(r.h),r);
 // 6. Esc clears; a drag over empty ground clears
 await p.keyboard.press('Escape');r=await p.evaluate(()=>({sel:(G.selUs||[]).length,selU:G.selU}));
 check('6 Esc clears the selection',r.sel===0&&r.selU===0,r);
 await p.mouse.move(box.a[0],box.a[1]);await p.mouse.down();await p.mouse.move(box.b[0],box.b[1],{steps:4});await p.mouse.up();
 await p.mouse.move(box.ground[0]-150,box.ground[1]+60);await p.mouse.down();await p.mouse.move(box.ground[0]-60,box.ground[1]+120,{steps:4});await p.mouse.up();
 r=await p.evaluate(()=>({sel:(G.selUs||[]).length}));check('7 a drag over empty ground clears the selection',r.sel===0,r);
 // 8. with a vine chosen, a left drag still lays a vine line, and selects nothing
 r=await p.evaluate(()=>{G.items=G.items.map(v=>v+999);G.webFree=true;setTool('conveyor');return G.blocks.size;});
 await p.mouse.move(box.c[0],box.c[1]+120);await p.mouse.down();await p.mouse.move(box.d[0],box.d[1]+120,{steps:6});await p.mouse.up();
 r=await p.evaluate(b0=>{const n=G.blocks.size-b0;setTool(null);return {vines:n,sel:(G.selUs||[]).length};},r);check('8 with a growth chosen, a left drag still lays a line and selects nothing',r.vines>=3&&r.sel===0,r);
 // 9. a middle-button drag still pans, and selects nothing
 r=await p.evaluate(()=>[cam.x,cam.y]);await p.mouse.move(600,400);await p.mouse.down({button:'middle'});await p.mouse.move(500,350,{steps:5});await p.mouse.up({button:'middle'});
 const r2=await p.evaluate(()=>({cam:[cam.x,cam.y],sel:(G.selUs||[]).length}));check('9 a middle-button drag still pans the map',r2.cam[0]!==r[0]&&r2.sel===0,{before:r,after:r2});
 // 10. the selection never reaches a save
 r=await p.evaluate(()=>{setSelAnts(G.units.map(u=>u.id));const j=JSON.stringify(snapGame());return {hasSel:/selUs/.test(j)};});check('10 the selection is not saved',!r.hasSel,r);
 check('11 no page errors',errs.length===0,errs);
 fs.writeFileSync('boxsel_result.json',JSON.stringify(R,null,1));await br.close();})();
