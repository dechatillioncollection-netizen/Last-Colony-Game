// v45 checks: the ant visual overhaul changes nothing in the game. Same seed, v44 against v45: a brood of every kind marching and fighting
// HDF waves for 90 s with the screen drawn every few steps gives the same save, byte for byte; ant deaths, hits and previews draw without
// errors; the three kinds have distinct silhouettes; frames come from the cache; and a 200-ant swarm draws in about the same time.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const NEW=process.env.NEW||'lc2_index.html',OLD=process.env.OLD||'lc2_v44_index.html';
let pass=0,fail=0;const ok=(c,m,d)=>{if(c){pass++;console.log('PASS',m,d!==undefined?JSON.stringify(d):'');}else{fail++;console.log('FAIL',m,d!==undefined?JSON.stringify(d):'');}};
(async()=>{const br=await chromium.launch();
 const page=async f=>{const p=await br.newPage({viewport:{width:1280,height:800}});p.errs=[];p.on('pageerror',e=>p.errs.push(String(e)));
   await p.addInitScript(()=>{try{localStorage.setItem('lc_fog','0');localStorage.setItem('lc_quality','high');}catch(e){}});
   await p.goto('http://localhost:8123/'+f);await p.waitForTimeout(1500);await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});return p;};
 const a=await page(OLD),b=await page(NEW);
 // 1. identity under rendering
 const sim=(p,o)=>p.evaluate(async o=>{let s=o.seed;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;if(DLG.open){DLG.done=null;closeDlg();}startGame(o.mode);const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+5000);
   for(let k=0;k<150;k++)step(1/30);const cx=G.core.x+1.5,cy=G.core.y+1.5,ts=['mite','tank','htank'];for(let k=0;k<24;k++)spawnUnit(ts[k%3],cx+3+(k%6)*.8,cy-2+Math.floor(k/6)*.9);
   if(o.attack)setCommand('attack');let deaths=0;cam.z=1.6;
   for(let w=0;w<3;w++){for(let k=0;k<10;k++)G.spawnQ.push({t:['dagger','mace','crawler','fortress'][k%4],at:G.time+k*.4});
     for(let k=0;k<900;k++){const n=G.units.length;step(1/30);deaths+=Math.max(0,n-G.units.length);if(k%o.draw===0){const u=G.units[0];if(u)centerOn(u.x,u.y);render();}}}
   const save=await encodeSave();return {len:save.length,h:[...save].reduce((h,c)=>(h*31+c.charCodeAt(0))|0,0),units:G.units.length,enemies:G.enemies.length,deaths,time:+G.time.toFixed(2),
     pos:G.units.slice(0,5).map(u=>[+u.x.toFixed(4),+u.y.toFixed(4),+u.hp.toFixed(2)])};},o);
 for(const o of [{seed:7,mode:'survival',draw:3,attack:true},{seed:11,mode:'survival',draw:1,attack:false},{seed:3,mode:'siege',draw:5,attack:true}]){
   const ra=await sim(a,o),rb=await sim(b,o);ok(JSON.stringify(ra)===JSON.stringify(rb)&&ra.deaths>0,`same game with the new ants drawn (${o.mode}, seed ${o.seed}, drawn every ${o.draw} step${o.draw>1?'s':''}, ${ra.deaths} ant deaths)`,{v44:ra,v45:rb});}
 // the screen drawn or not makes no difference in v45 either
 const nod=await sim(b,{seed:7,mode:'survival',draw:1e9,attack:true}),yes=await sim(b,{seed:7,mode:'survival',draw:1,attack:true});
 const nodA=await sim(a,{seed:7,mode:'survival',draw:1e9,attack:true});
 ok(JSON.stringify(nod)===JSON.stringify(nodA),'with the screen never drawn, v45 plays the same game as v44 too',{v44:nodA.h,v45:nod.h});
 console.log('note: drawn every step vs never drawn, v45',nod.h===yes.h?'same':'differs');
 // 2. render-only state: no new fields on ants, deaths kept off the save
 let r=await b.evaluate(()=>{startGame('survival');const G=window.__game();const u=spawnUnit('mite',G.core.x+5,G.core.y+1);const keys0=Object.keys(u).sort().join();render();drawTank(ctx,'mite',0,0,0,0,0,false,u);for(let k=0;k<3;k++){G.time+=.1;u.x+=.2;drawTank(ctx,'mite',0,0,0,0,0,false,u);}
   const keys1=Object.keys(u).sort().join();u.x-=.6;G.time-=.3;hurtUnit(u,1e6);return {same:keys0===keys1,die:ANTDIE.length,inG:JSON.stringify(Object.keys(G)).includes('ANTDIE')};});
 ok(r.same&&r.die>=1&&!r.inG,'animation state lives outside the game: no new fields on ants, deaths in a render-only list',r);
 // 3. silhouettes differ: compare the opaque masks of the three kinds scaled to the same size
 r=await b.evaluate(()=>{const N=48,mask=t=>{const S=antSprites(t),c=document.createElement('canvas');c.width=c.height=N;const x=c.getContext('2d');x.drawImage(S.idle[0],0,0,N,N);
     const d=x.getImageData(0,0,N,N).data,m=[];for(let i=0;i<N*N;i++)m.push(d[i*4+3]>140?1:0);return m;};
   const M={mite:mask('mite'),tank:mask('tank'),htank:mask('htank')},iou=(p,q)=>{let a=0,o=0;for(let i=0;i<p.length;i++){a+=p[i]&q[i];o+=p[i]|q[i];}return +(a/o).toFixed(3);};
   return {mite_tank:iou(M.mite,M.tank),mite_htank:iou(M.mite,M.htank),tank_htank:iou(M.tank,M.htank)};});
 ok(Object.values(r).every(v=>v<.75),'the three ant kinds have clearly different silhouettes (overlap of their shapes at the same size under 75%)',r);
 // 4. frames: cached, walk frames differ from each other, idle breathes, the gland turns on its own
 r=await b.evaluate(()=>{const out={};for(const t of ['mite','tank','htank']){const S=antSprites(t),S2=antSprites(t),px=cv=>cv.getContext('2d').getImageData(0,0,cv.width,cv.height).data;
     const diff=(p,q)=>{const a=px(p),b=px(q);let n=0;for(let i=3;i<a.length;i+=4)if(Math.abs(a[i]-b[i])>60)n++;return n;};
     out[t]={cached:S===S2,walk:S.walk.length,idle:S.idle.length,step:diff(S.walk[0],S.walk[4]),breath:diff(S.idle[0],S.idle[2]),dead:diff(S.idle[0],S.dead)};}return out;});
 ok(Object.values(r).every(v=>v.cached&&v.walk===8&&v.idle===4&&v.step>50&&v.breath>0&&v.dead>50),'each kind has a cached 8-frame walk, 4 idle frames and a death pose',r);
 // 5. walk phase follows distance moved (no moonwalking) and stops when the ant stops; facing eases round
 r=await b.evaluate(()=>{startGame('survival');const G=window.__game();const u=spawnUnit('tank',G.core.x+6,G.core.y+1);u.ang=0;drawTank(ctx,'tank',0,0,0,0,0,false,u);const s0=ANTV.get(u).ph;
   G.time+=.1;u.x+=.33;drawTank(ctx,'tank',0,0,0,0,0,false,u);const s=ANTV.get(u),p1=s.ph,adv=+(((p1-s0)+1)%1).toFixed(3);
   G.time+=.1;drawTank(ctx,'tank',0,0,0,0,0,false,u);G.time+=.4;drawTank(ctx,'tank',0,0,0,0,0,false,u);const still=s.ph===p1,mv=+s.mv.toFixed(2);
   u.ang=Math.PI/2;G.time+=.05;drawTank(ctx,'tank',0,0,0,0,0,false,u);const a1=+s.a.toFixed(3);G.time+=.3;drawTank(ctx,'tank',0,0,0,0,0,false,u);return {adv,want:+(.33/ANTD.tank.cyc).toFixed(3),still,mv,a1,a2:+s.a.toFixed(3)};});
 ok(Math.abs(r.adv-r.want)<.002&&r.still&&r.mv<.2&&r.a1>0&&r.a1<1.2&&Math.abs(r.a2-Math.PI/2)<.01,'the walk cycle advances with distance walked, stops with the ant, and the body turns smoothly to a new heading',r);
 // 6. shot kick and hit flash and previews draw; old saves load and draw
 r=await b.evaluate(async()=>{startGame('survival');const G=window.__game();G.items=G.items.map(v=>v+9999);const u=spawnUnit('htank',G.core.x+6,G.core.y+1);u.cd=U.htank.reload;u.hit=.1;cam.z=2;centerOn(u.x,u.y);render();
   tryPlace('nest',G.core.x-6,G.core.y,0,true);render();const icon=typeof renderTech==='function';hurtUnit(u,1e6);for(let k=0;k<20;k++){step(1/30);render();}return {left:ANTDIE.length,icon};});
 ok(b.errs.length===0,'firing, hit flash, nest previews and deaths draw with no errors',{...r,errs:b.errs.slice(0,3)});
 // 7. performance: 200 ants on screen, median frame time v44 vs v45
 const perf=p=>p.evaluate(()=>{let s=4;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();for(let k=0;k<60;k++)step(1/30);
   const cx=G.core.x+8,cy=G.core.y+1,ts=['mite','mite','tank','htank'];for(let k=0;k<200;k++)spawnUnit(ts[k%4],cx+(k%20)*.75-7,cy+Math.floor(k/20)*.75-4);for(const u of G.units)u.hold=[cx+20,cy];
   cam.z=1.2;centerOn(cx,cy);const fl=()=>ctx.getImageData(0,0,1,1);for(let k=0;k<20;k++){step(1/30);render();fl();}const T=[];
   for(let k=0;k<80;k++){step(1/30);const t=performance.now();render();fl();T.push(performance.now()-t);}T.sort((a,b)=>a-b);
   const D=[];for(let k=0;k<40;k++){const t=performance.now();for(const u of G.units)drawTank(ctx,u.t,u.x*T_,u.y*T_,u.ang,u.tang,0,false,u);fl();D.push(performance.now()-t);}D.sort((a,b)=>a-b);
   return {frame:+T[40].toFixed(2),p90:+T[72].toFixed(2),ants200:+D[20].toFixed(2)};}).catch(e=>({err:String(e)}));
 await a.evaluate(()=>{window.T_=T;});await b.evaluate(()=>{window.T_=T;});
 const pa=await perf(a),pb=await perf(b);fs.writeFileSync('perf45.json',JSON.stringify({v44:pa,v45:pb},null,1));
 ok(pb.frame<=pa.frame*1.25+1,'a frame with 200 ants on screen costs about the same as before',{v44:pa,v45:pb});
 ok(a.errs.length===0&&b.errs.length===0,'no page errors',[...a.errs,...b.errs].slice(0,4));
 console.log(`\n${pass} passed, ${fail} failed`);await br.close();process.exit(fail?1:0);})();
