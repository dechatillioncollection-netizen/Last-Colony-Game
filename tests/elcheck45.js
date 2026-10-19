// v45 in the Windows app (Electron): the new ants draw (walking brood, a fight, deaths) with no errors, frames come from the cache
const {_electron}=require('/opt/node22/lib/node_modules/playwright');
(async()=>{const app=await _electron.launch({executablePath:__dirname+'/elx/electron',args:['--no-sandbox',__dirname+'/exe/out/Last Colony-win32-x64/resources/app']});
 const w=await app.firstWindow();const errs=[];w.on('pageerror',e=>errs.push(e.message));await w.waitForTimeout(3000);
 const r=await w.evaluate(()=>{if(DLG.open){DLG.done=null;closeDlg();}startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<60;k++)step(1/30);
   const cx=G.core.x+1.5,cy=G.core.y+1.5,ts=['mite','tank','htank'];for(let k=0;k<18;k++)spawnUnit(ts[k%3],cx+4+(k%6)*.8,cy-2+Math.floor(k/6)*.9);setCommand('attack');
   for(let k=0;k<6;k++)G.spawnQ.push({t:k%2?'dagger':'mace',at:G.time+k*.3});cam.z=2;let deaths=0,frames=0;
   for(let k=0;k<1200;k++){const n=G.units.length;step(1/30);deaths+=Math.max(0,n-G.units.length);if(k%4===0){const u=G.units[0];if(u)centerOn(u.x,u.y);render();frames++;}}
   for(const u of G.units.slice(0,3))hurtUnit(u,1e6);const dying=ANTDIE.length;for(let k=0;k<30;k++){step(1/30);render();}
   return {dying,app:APP,ua:navigator.userAgent.match(/Electron\/[\d.]+/)[0],deaths,frames,kinds:Object.keys(ANTSPR),walk:ANTSPR.mite&&ANTSPR.mite.walk.length};});
 await w.evaluate(()=>{const G=window.__game();const u=G.units[0];if(u)centerOn(u.x,u.y);render();});await w.screenshot({path:'el_v45.png'});console.log(JSON.stringify(r),errs);await app.close();})();
