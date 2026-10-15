const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage({viewport:{width:1280,height:800}});const errs=[];
 p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()==='error')errs.push(m.text())});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(500);
 await p.click('#m-campaign');await p.waitForTimeout(800);await p.click('#launch');await p.waitForTimeout(900);
 await p.screenshot({path:'s_intro1.png'});
 const st=()=>p.evaluate(()=>{const G=window.__game();return {s:G.story&&G.story.s,k:G.story&&G.story.k,dlg:DLG.open,time:+G.time.toFixed(1),cd:+G.countdown.toFixed(1),wave:G.wave};});
 console.log('at start',JSON.stringify(await st()));
 // advance intro: 3 clicks shows full line, next, ... click until closed
 for(let k=0;k<6;k++){await p.mouse.click(640,700);await p.waitForTimeout(120);}
 await p.waitForTimeout(400);await p.screenshot({path:'s_intro2.png'});
 for(let k=0;k<20&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(60);}
 console.log('after intro',JSON.stringify(await st()));
 await p.screenshot({path:'s_tut1.png'});
 // step 1: move camera with keys
 await p.keyboard.down('d');await p.waitForTimeout(700);await p.keyboard.up('d');await p.waitForTimeout(300);console.log('look',JSON.stringify(await st()));
 // step 2: click the Bloom
 const scr=await p.evaluate(()=>{const G=window.__game();const x=(G.core.x+1.5)*T,y=(G.core.y+1.5)*T;return [(x-cam.x)*cam.z,(y-cam.y)*cam.z];});
 await p.mouse.click(scr[0],scr[1]);await p.waitForTimeout(300);console.log('bloom',JSON.stringify(await st()));
 await p.waitForTimeout(300);await p.screenshot({path:'s_tut3.png'});
 // step 3: click an ant
 const ua=await p.evaluate(()=>{const u=window.__game().units[0];return [(u.x*T-cam.x)*cam.z,(u.y*T-cam.y)*cam.z];});
 await p.mouse.click(ua[0],ua[1]);await p.waitForTimeout(300);console.log('ant',JSON.stringify(await st()));
 // step 4: click ground
 // (pick open ground near the ant: a fixed offset can land on the Landfall ridge's rock, which deselects instead)
 const og=await p.evaluate(([sx,sy])=>{const u=window.__game().units[0];for(let r=2;r<6;r++)for(let a=0;a<16;a++){const x=Math.floor(u.x+r*Math.cos(a*.39)),y=Math.floor(u.y+r*Math.sin(a*.39)),i=y*MW+x;
   if(inMap(x,y)&&!blockAt(x,y)&&!solidTile(i,0)&&!window.__game().units.some(v=>Math.hypot(v.x-x-.5,v.y-y-.5)<1.2))return [((x+.5)*T-cam.x)*cam.z,((y+.5)*T-cam.y)*cam.z];}return [sx,sy];},[ua[0]+60,ua[1]+70]);
 await p.mouse.click(og[0],og[1]);await p.waitForTimeout(300);console.log('order',JSON.stringify(await st()));
 await p.waitForTimeout(1500);await p.screenshot({path:'s_tut4.png'});
 await p.keyboard.press('c');await p.keyboard.press('c');await p.waitForTimeout(300);console.log('swarm',JSON.stringify(await st()));
 await p.click('#tutNext');await p.waitForTimeout(200);console.log('web',JSON.stringify(await st()));
 await p.waitForTimeout(400);await p.screenshot({path:'s_tut6.png'});
 // build drill, vine, node, turret through game functions
 const r=await p.evaluate(()=>{const G=window.__game();G.webFree=true;const cx=G.core.x+1.5,cy=G.core.y+1.5;
   let best=null,bs=-1;for(const [vx,vy,vi] of G.veins){if(vi!==CU)continue;for(let y=Math.floor(vy)-3;y<=vy+2;y++)for(let x=Math.floor(vx)-3;x<=vx+2;x++){if(placeCheck('drill',x,y))continue;const o=drillOre('drill',x,y);if(o.item===CU&&o.count-Math.hypot(x-cx,y-cy)*.2>bs){bs=o.count-Math.hypot(x-cx,y-cy)*.2;best=[x,y];}}}
   tryPlace('drill',best[0],best[1],0,true);return best;});
 await p.waitForTimeout(400);console.log('tap',JSON.stringify(await st()));
 await p.evaluate(()=>{const G=window.__game();const d=[...G.blocks.values()].find(b=>b.t==='drill');routeBelt(d,G.core,0);});
 for(let k=0;k<40&&(await st()).k===7;k++)await p.waitForTimeout(250);
 console.log('vine',JSON.stringify(await st()));
 await p.evaluate(()=>{const G=window.__game();for(let r=6;r<14;r++){if(tryPlace('node',G.core.x-r,G.core.y+1,0,true))break;}});await p.waitForTimeout(400);console.log('node',JSON.stringify(await st()));
 await p.evaluate(()=>{const G=window.__game();for(let r=5;r<12;r++){if(tryPlace('duo',G.core.x+r,G.core.y-2,0,true))break;}});
 await p.waitForTimeout(1500);console.log('turret',JSON.stringify(await st()));
 await p.screenshot({path:'s_fc_walk.png'});
 // watch the patrol walk; record HP and bullets
 let mon=[];for(let k=0;k<140;k++){const s=await p.evaluate(()=>{const G=window.__game();const P=G.enemies.filter(e=>e.script);return {s:G.story.s,n:P.length,hp:P.map(e=>e.hp|0).join('/'),pb:G.bullets.filter(b=>b.team===0).length,eb:G.bullets.filter(b=>b.team===1).length,cease:G.story.cease,dlg:DLG.open,pos:P.map(e=>e.x.toFixed(1)+','+e.y.toFixed(1)).join(' ')};});
   mon.push(s);if(s.dlg)break;await p.waitForTimeout(500);}
 console.log('seenAt',await p.evaluate(()=>JSON.stringify(window.__game().story.seenAt)));console.log('walk samples',JSON.stringify(mon.filter((x,i)=>i%6===0||x.dlg)));
 await p.waitForTimeout(500);await p.screenshot({path:'s_fc_talk1.png'});
 for(let k=0;k<4;k++){await p.keyboard.press('Space');await p.waitForTimeout(50);}
 await p.waitForTimeout(800);await p.screenshot({path:'s_fc_talk2.png'});
 for(let k=0;k<80&&await p.evaluate(()=>DLG.open&&DLG.seq&&DLG.seq.chan.indexOf('SUPREME')<0);k++){await p.keyboard.press('Space');await p.waitForTimeout(40);}
 await p.waitForTimeout(900);await p.screenshot({path:'s_fc_general.png'});
 for(let k=0;k<200&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(40);}
 console.log('after talk',JSON.stringify(await st()));
 mon=[];for(let k=0;k<140;k++){const s=await p.evaluate(()=>{const G=window.__game();const P=G.enemies.filter(e=>e.script);return {s:G.story.s,n:P.length,hp:P.map(e=>e.hp|0).join('/'),pb:G.bullets.filter(b=>b.team===0).length,eb:G.bullets.filter(b=>b.team===1).length,cease:G.story.cease,dlg:DLG.open};});
   mon.push(s);if(s.dlg)break;await p.waitForTimeout(500);}
 console.log('withdraw samples',JSON.stringify(mon.filter((x,i)=>i%6===0||x.dlg)));
 await p.waitForTimeout(600);await p.screenshot({path:'s_fc_after.png'});
 for(let k=0;k<30&&await p.evaluate(()=>DLG.open);k++){await p.keyboard.press('Space');await p.waitForTimeout(40);}
 console.log('final',JSON.stringify(await st()),await p.evaluate(()=>JSON.stringify(CAMP.flags)));
 await p.waitForTimeout(500);await p.screenshot({path:'s_main.png'});
 console.log('errors',errs.slice(0,8));await b.close();})();
