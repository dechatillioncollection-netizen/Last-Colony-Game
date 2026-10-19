// v44 in the Windows app's Electron: the wheel turns a chosen Vine (and never zooms), placement keeps it, the wheel turns a whole vine line during a drag (as in Mindustry),
// and with no Vine chosen the wheel zooms. Real mouse input.
const {_electron}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const app=await _electron.launch({executablePath:__dirname+'/elx/electron',args:['--no-sandbox',__dirname+'/exe/out/Last Colony-win32-x64/resources/app']});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3000);
 const S=await w.evaluate(()=>{if(DLG.open){DLG.done=null;closeDlg();}startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+3000);for(let k=0;k<60;k++)step(1/30);
   cam.z=2;const X=G.core.x+12,Y=G.core.y+1;for(let x=X-6;x<=X;x++){const b=blockAt(x,Y);if(b&&b!==G.core)removeBlock(b);G.terrain[Y*MW+x]=0;setWeb(Y*MW+x,1);}centerOn(X-3,Y);G.rot=0;setTool('conveyor');render();
   const sc=(x,y)=>{const r=cv.getBoundingClientRect();return [r.left+(x*T-cam.x)*cam.z,r.top+(y*T-cam.y)*cam.z];};return {X,Y,a:sc(X-5.5,Y+.5),b:sc(X-.5,Y+.5),z:cam.z};});
 const gr=()=>w.evaluate(()=>window.__game().rot);const out={};
 await w.mouse.move(S.a[0],S.a[1]);await w.mouse.wheel(0,100);await w.waitForTimeout(50);out.down=await gr();await w.mouse.wheel(0,-100);await w.waitForTimeout(50);await w.mouse.wheel(0,-100);await w.waitForTimeout(50);out.up=await gr();
 out.zoomKept=await w.evaluate(z=>cam.z===z,S.z);
 await w.mouse.wheel(0,100);await w.waitForTimeout(50);await w.mouse.wheel(0,100);await w.waitForTimeout(50);// back to 1
 await w.mouse.click(S.a[0],S.a[1]);out.placed=await w.evaluate(([x,y])=>{const b=blockAt(x,y);return b&&{t:b.t,rot:b.rot,site:isSite(b)};},[S.X-6,S.Y]);
 await w.evaluate(([x,y])=>{removeBlock(blockAt(x,y));window.__game().rot=0;},[S.X-6,S.Y]);
 await w.mouse.move(S.a[0],S.a[1]);await w.mouse.down();await w.mouse.move(S.b[0],S.b[1],{steps:8});await w.evaluate(()=>render());await w.mouse.wheel(0,-100);await w.waitForTimeout(50);
 out.preview=await w.evaluate(()=>PLANC.rows.map(r=>r.r).join(''));await w.evaluate(()=>render());await w.screenshot({path:'el_v44.png'});await w.mouse.up();
 out.built=await w.evaluate(([X,Y])=>{const o=[];for(let x=X-6;x<=X;x++){const b=blockAt(x,Y);o.push(b&&VINE[b.t]?b.rot:'-');}return o.join('');},[S.X,S.Y]);
 await w.evaluate(()=>setTool(null));const z0=await w.evaluate(()=>cam.z);await w.mouse.wheel(0,100);await w.waitForTimeout(50);out.zoomNoTool=await w.evaluate(z0=>cam.z<z0,z0);
 out.ua=await w.evaluate(()=>navigator.userAgent.match(/Electron\/[\d.]+/)[0]);console.log(JSON.stringify(out),errs);await app.close();})();
