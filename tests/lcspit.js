// Thorn Spitter painted-art checks: before/after shots, firing, ammo, air, damage, destruction, neighbours, crowds, save/load, fallback.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const OUT=process.argv[2]||'sp';
(async()=>{const br=await chromium.launch();const errs=[];
 async function page(hd,art){const p=await br.newPage({viewport:{width:1000,height:700}});p.on('pageerror',e=>errs.push(e.message+' '+(e.stack||'').split('\n')[1]));p.on('console',m=>{if(m.type()!=='log')errs.push(m.type()+': '+m.text())});
  await p.addInitScript(([hd,art])=>{try{localStorage.setItem('lc_hd',hd);localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art',art)}catch(e){}},[hd,art]);
  await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(900);
  await p.evaluate(()=>{window.__scene=(opt)=>{Math.random=(()=>{let s=11;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();
    G.webFree=true;G.items=G.items.map(v=>v+5000);G.countdown=1e9;G.paused=true;const cx=G.core.x,cy=G.core.y;let X=cx+8,Y=cy;
    for(let dx=8;dx<30;dx++){let ok=true;for(let yy=-3;yy<=3;yy++)for(let xx=-4;xx<=2;xx++)if(placeCheck('wall',cx+dx+xx,cy+yy))ok=false;if(ok){X=cx+dx;break;}}
    const put=(t,x,y,r=0)=>tryPlace(t,x,y,r,true);
    // three spitters (copper, resin, chitin) with a bark wall line, a vine and a Spore Flak beside them
    const sp=[[X,Y-2],[X,Y],[X,Y+2]];sp.forEach(([x,y])=>put('duo',x,y));
    for(let y=Y-3;y<=Y+3;y++)put('wall',X+2,y);for(let x=X-4;x<X;x++)put('conveyor',x,Y+1,0);put('scatter',X-3,Y-3);put('duo',X+1,Y+1);
    for(let k=0;k<30*3;k++)step(1/30);
    const S=sp.map(([x,y])=>G.blocks.get(G.bgrid[y*MW+x]));const AM=[CU,GRAPH,SI];
    [...G.blocks.values()].forEach(b=>{b.built=1;if(b.t==='duo'&&b.ammo){for(const k in b.ammo)b.ammo[k]=0;}});
    S.forEach((b,i)=>{b.ammo[AM[i]]=30;});const n4=G.blocks.get(G.bgrid[(Y+1)*MW+X+1]);if(n4)n4.ammo[CU]=30;
    G.enemies=[];G.bullets=[];
    if(opt.enemies)for(const [t,dx,dy] of opt.enemies){const d=E[t];G.enemies.push({t,x:X+dx,y:Y+dy,hp:d.hp*20,max:d.hp*20,boss:false,cd:9,think:9,target:null,tu:null,dead:false,ang:Math.PI,orbit:0,vx:0,vy:0,frozen:true});}
    for(let yy=Y-6;yy<=Y+6;yy++)for(let xx=X-8;xx<=X+4;xx++)if(inMap(xx,yy))setWeb(yy*MW+xx,1);
    cam.z=opt.z;centerOn(X+.5,Y+.5);return {X,Y,ids:S.map(b=>b.id)};};});
  return p;}
 const W=p=>p.waitForTimeout(250);
 const shots={};
 // ---------- before / after at normal and close zoom ----------
 for(const [hd,art,tag] of [['1','0','before'],['1','1','after'],['0','1','classicAfter']]){const p=await page(hd,art);
   for(const z of [1,2.4]){await p.evaluate(z=>{__scene({z,enemies:[['dagger',6,-3],['flare',5,4]]});const G=window.__game();
       // aim at the tanks and let a couple of shots fly, then hold the frame
       for(let k=0;k<20;k++){for(const e of G.enemies){e.x-=.02;}step(1/30);}},z);
     await W(p);await p.screenshot({path:`${OUT}_${tag}_z${z}.png`});}
   await p.close();}
 // ---------- behaviour checks on the painted build ----------
 const p=await page('1','1');
 const r1=await p.evaluate(()=>{const R={};const sc=__scene({z:2.4,enemies:[['dagger',7,-4]]});const G=window.__game();const S=sc.ids.map(i=>G.blocks.get(i));
   R.state=ART.plant.duo.state;R.split=ART.plant.duo.split;R.under=ART.plant.duo.under;
   // tracking a moving Scout Tank: the aim must follow the target, and thorn shots must start at the thorn tips
   const angs=[];let shotsSeen=0,badOrigin=0,lateFire=0;const seen=new Set();
   for(let k=0;k<30*4;k++){const e=G.enemies[0];e.y+=.06;step(1/30);angs.push(+S[1].ang.toFixed(3));
     for(const q of G.bullets){if(q.ox==null||seen.has(q))continue;seen.add(q);shotsSeen++;const b=[...G.blocks.values()].find(b=>b.t==="duo"&&Math.hypot(b.x+.5-q.ox,b.y+.5-q.oy)<.3);if(!b){badOrigin++;continue;}
       const ax=Math.cos(b.ang),ay=Math.sin(b.ang),lat=(q.ox-b.x-.5)*-ay+(q.oy-b.y-.5)*ax;if(Math.abs(Math.abs(lat)-.18)>.01)badOrigin++;
       const side=lat>0?1:-1;if((b.rr===1?1:-1)!==side)badOrigin++;if(Math.abs(G.time-b.shot)>1e-9)lateFire++;}}
   R.track={angStart:angs[0],angEnd:angs[angs.length-1],shotsSeen,badOrigin,lateFire};
   // every ammo type: what each spitter shows and what it fires
   R.ammo=S.map(b=>({ammo:bestAmmo(b),cols:[...new Set(G.bullets.filter(q=>Math.hypot(q.ox-b.x-.5,q.oy-b.y-.5)<.3).map(q=>q.col))]}));
   return R;});
 console.log('track',JSON.stringify(r1));
 // mid-shot frames for the firing sequence
 for(const [i,dt] of [[0,0],[1,.02],[2,.05],[3,.1],[4,.2],[5,.32]]){await p.evaluate(dt=>{const G=window.__game();const b=[...G.blocks.values()].find(b=>b.t==='duo'&&b.shot!=null);
     G.time=b.shot+dt;cam.z=2.5;centerOn(b.x+.5,b.y+.5);},dt);await p.waitForTimeout(120);await p.screenshot({path:`${OUT}_fire${i}.png`,clip:{x:400,y:250,width:200,height:200}});}
 // air target
 const r2=await p.evaluate(()=>{const sc=__scene({z:2.4,enemies:[['flare',4,5]]});const G=window.__game();const S=sc.ids.map(i=>G.blocks.get(i));
   for(let k=0;k<45;k++){G.enemies[0].x+=.05;step(1/30);}return {fired:S.map(b=>b.shot!=null),aimAtAir:S.map(b=>+b.ang.toFixed(2)),hp:G.enemies[0].hp<G.enemies[0].max};});
 console.log('air',JSON.stringify(r2));await W(p);await p.screenshot({path:`${OUT}_air.png`});
 // damage: health bar, flinch and deflate, then destruction
 const r3=await p.evaluate(()=>{const sc=__scene({z:2.4});const G=window.__game();const b=G.blocks.get(sc.ids[1]);hurtBlock(b,70);step(1/30);
   return {hp:b.hp,max:b.max,hit:b.hit};});
 console.log('hurt',JSON.stringify(r3));await p.waitForTimeout(60);await p.screenshot({path:`${OUT}_hurt.png`});
 const r4=await p.evaluate(()=>{const G=window.__game();const b=[...G.blocks.values()].find(b=>b.t==='duo'&&b.hp<b.max);const id=b.id;hurtBlock(b,500);for(let k=0;k<5;k++)step(1/30);
   return {gone:!G.blocks.has(id),decals:G.decals.length};});
 console.log('destroy',JSON.stringify(r4));await W(p);await p.screenshot({path:`${OUT}_destroyed.png`});
 // crowds of 25, 50, 100, all firing, normal zoom and zoomed out
 const r5=await p.evaluate(()=>{const R={};for(const n of [25,50,100]){Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+99999);G.countdown=1e9;G.paused=true;
     const cx=G.core.x,cy=G.core.y;let k=0;const cols=10;for(let i=0;k<n&&i<400;i++){const x=cx+6+(i%cols)*2-(i%cols>4?0:0),y=cy-10+Math.floor(i/cols)*2;if(tryPlace('duo',x,y,0,true))k++;}
     for(const b of G.blocks.values()){b.built=1;if(b.t==='duo')b.ammo[CU]=30;}
     G.enemies=[];for(let j=0;j<12;j++){const d=E.dagger;G.enemies.push({t:'dagger',x:cx+30,y:cy-10+j*2,hp:1e6,max:1e6,boss:false,cd:9,think:9,target:null,tu:null,dead:false,ang:Math.PI,orbit:0,vx:0,vy:0});}
     const ms=(z,fire)=>{cam.z=z;centerOn(cx+15,cy);for(let j=0;j<10;j++){if(fire)step(1/30);render();}const t=performance.now();for(let j=0;j<40;j++){if(fire){G.enemies.forEach(e=>e.x+=0);step(1/30);}render();}return +((performance.now()-t)/40).toFixed(2);};
     const r={spitters:k};for(const z of [1,.6]){SET.art=true;r['art_z'+z]=ms(z,true);r['lite_z'+z]=artLite;SET.art=false;r['old_z'+z]=ms(z,true);SET.art=true;}R['n'+n]=r;}
   return R;});
 console.log('crowd',JSON.stringify(r5));
 await p.evaluate(()=>{const G=window.__game();cam.z=1;centerOn(G.core.x+15,G.core.y);for(let j=0;j<8;j++)step(1/30);});await W(p);await p.screenshot({path:`${OUT}_crowd100_z1.png`});
 await p.evaluate(()=>{const G=window.__game();cam.z=.6;centerOn(G.core.x+15,G.core.y);});await W(p);await p.screenshot({path:`${OUT}_crowd100_z06.png`});
 const r5b=await p.evaluate(()=>{Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+99999);G.countdown=1e9;G.paused=true;
   const cx=G.core.x,cy=G.core.y;let k=0;for(let i=0;k<25&&i<200;i++){if(tryPlace('duo',cx+6+(i%5)*2,cy-4+Math.floor(i/5)*2,0,true))k++;}for(const b of G.blocks.values()){b.built=1;if(b.t==='duo')b.ammo[[CU,GRAPH,SI][b.id%3]]=30;}
   for(let j=0;j<5;j++)G.enemies.push({t:'dagger',x:cx+22,y:cy-4+j*2,hp:1e6,max:1e6,boss:false,cd:9,think:9,target:null,tu:null,dead:false,ang:Math.PI,orbit:0,vx:0,vy:0});
   for(let j=0;j<24;j++)step(1/30);cam.z=1.6;centerOn(cx+12,cy);return {k,lite:artLite};});
 await W(p);await p.screenshot({path:`${OUT}_group_firing.png`});console.log('group',JSON.stringify(r5b));
 // save and reload with painted spitters
 const r6=await p.evaluate(async()=>{const sc=__scene({z:2.4,enemies:[['dagger',6,0]]});const G=window.__game();for(let k=0;k<20;k++)step(1/30);
   const s=await encodeSave();const before=[...G.blocks.values()].filter(b=>b.t==='duo').map(b=>[b.id,b.hp,+b.ang.toFixed(3)]).sort();
   const S=await decodeSave(s);applySave(S);const G2=window.__game();G2.paused=true;const after=[...G2.blocks.values()].filter(b=>b.t==='duo').map(b=>[b.id,b.hp,+b.ang.toFixed(3)]).sort();
   const vis=[...G2.blocks.values()].some(b=>'_bd' in b);const saved=JSON.stringify(S.blocks).includes('"_bd"');for(let k=0;k<20;k++)step(1/30);render();
   return {same:JSON.stringify(before)===JSON.stringify(after),n:after.length,visualStateSaved:saved,len:s.length};});
 console.log('save',JSON.stringify(r6));
 // painted art off in Settings
 const r7=await p.evaluate(()=>{__scene({z:2.4,enemies:[['dagger',6,-3]]});const G=window.__game();for(let k=0;k<12;k++)step(1/30);SET.art=false;render();const old=artDrawn;return {artOff:!SET.art,artDrawnWhenOff:old};});
 console.log('artoff',JSON.stringify(r7));await W(p);await p.screenshot({path:`${OUT}_artoff.png`});
 await p.close();
 // missing PNG: the old Thorn Spitter comes back, the Bloom and pod keep their paintings
 fs.renameSync('art/plant/thorn-spitter/thorn.png','art/plant/thorn-spitter/thorn.bak');
 try{const q=await page('1','1');const r=await q.evaluate(()=>{__scene({z:2.4,enemies:[['dagger',6,-3]]});const G=window.__game();for(let k=0;k<12;k++)step(1/30);return {duo:ART.plant.duo.state,core:ART.plant.core.state,nest:ART.plant.nest.state};});
   console.log('fallback',JSON.stringify(r));await W(q);await q.screenshot({path:`${OUT}_fallback.png`});await q.close();}
 finally{fs.renameSync('art/plant/thorn-spitter/thorn.bak','art/plant/thorn-spitter/thorn.png');}
 console.log('errs',JSON.stringify(errs.filter(e=>!/Art missing for Thorn Spitter/.test(e))),'fallbackWarn',errs.some(e=>/Art missing for Thorn Spitter/.test(e)));await br.close();})();
