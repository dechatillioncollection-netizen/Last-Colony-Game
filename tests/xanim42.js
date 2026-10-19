// v42 frame sequences from the game canvas, each the real simulation drawn every step (the page's own loop is stopped):
// Spore Flak shooting at a Bomber, Seed Mortar at a Flame Tank, Sunlance charging and firing (and the same with no vigor),
// Brood Chamber growing and hatching a Thornback and a Bulwark Ant. Writes shots42/seq_<name>_<i>.png and shots42/seq_<name>.json
// with the game's own state per step (shots, charge, beam effects, production progress, hatchings).
const {chromium}=require(process.env.PW||'/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/lc2_index.html',TAG=process.env.TAG||'after',Z=+(process.env.Z||3),ONLY=process.env.ONLY;
(async()=>{const br=await chromium.launch();fs.mkdirSync('shots42',{recursive:true});
 const p=await br.newPage({viewport:{width:1200,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('lc_quality','epic');localStorage.setItem('lc_fog','0');}catch(e){}});
 await p.goto(URL);await p.waitForTimeout(1500);
 await p.evaluate(()=>{window.requestAnimationFrame=()=>0;});await p.waitForTimeout(200);
 await p.evaluate(()=>{window.__S=(o)=>{let s=9;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   ['factory','htank','scatter','hail','lancer'].forEach(k=>G.unlocked.add(k));
   const X=G.core.x+6,Y=G.core.y-14;for(let y=Y-4;y<Y+20;y++)for(let x=X-4;x<X+30;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   const put=(t,x,y)=>{tryPlace(t,X+x,Y+y,0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
   if(o.solar)for(let k=0;k<o.solar;k++)put('solar',k%10,16+Math.floor(k/10));
   const b=put(o.t,o.bx,o.by);if(o.ammo)b.ammo[eval(o.ammo)]=999;
   if(o.unit){b.unit=o.unit;for(const [i,n] of U[o.unit].cost)b.inv[i]=n*3;b.prog=o.prog||0;}
   if(o.enemy){const e=spawnEnemy(o.enemy);e.x=X+o.ex;e.y=Y+o.ey;e.hp=e.max=1e6;window.__e=e;}
   for(const q of G.blocks.values())q.built=1;G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();window.__b=b;window.__X=[X,Y];return {X,Y};};});
 const crop=async(cx,cy,w,h)=>p.evaluate(([cx,cy,w,h])=>{const z=cam.z;return {x:Math.round((cx*T-cam.x)*z-w/2),y:Math.round((cy*T-cam.y)*z-h/2),width:w,height:h};},[cx,cy,w,h]);
 async function run(name,o){if(ONLY&&!ONLY.split(',').includes(name))return;const oj=JSON.parse(JSON.stringify(o));
  // the same run twice (the setup and the random numbers are fixed): first to find the step of the event, then to take the pictures
  let found=-1;
  for(const pass of [0,1]){
  const r=await p.evaluate(([o,Z])=>{const {X,Y}=__S(o);cam.z=o.z||Z;centerOn(X+o.cx,Y+o.cy);render();return {X,Y};},[oj,Z]);
  const cl=await crop(r.X+o.cx,r.Y+o.cy,o.w,o.h);const log=[];let shot=0,mark=pass?found:-1;
  for(let k=0;k<o.steps;k++){
    const st=await p.evaluate(o=>{step(1/60);render();const G=window.__game(),b=window.__b;
      const lz=G.fx.find(f=>f.k==='laser'&&!f.team&&f.max-f.life<1/59);
      return {t:+G.time.toFixed(3),shot:b.shot!=null?+b.shot.toFixed(3):null,reload:+(b.reload||0).toFixed(3),charge:+(b.charge||0).toFixed(3),powSat:+G.powSat.toFixed(2),
        target:!!(b.target&&alive(b.target)),beam:!!lz,bullets:G.bullets.filter(q=>!q.team).length,booms:G.fx.filter(f=>f.k==='boom').length,prog:+(b.prog||0).toFixed(3),wants:!!b.wants,units:G.units.length,ang:+(b.ang||0).toFixed(3)};},oj);
    log.push(st);const prev=log[k-1];
    const ev=o.ev==='shot'?(prev&&st.shot!==prev.shot):o.ev==='beam'?st.beam:o.ev==='spawn'?(prev&&st.units>prev.units):false;
    if(ev&&mark<0)mark=k;if(!pass){if(mark>=0||k===o.steps-1){found=mark;break;}continue;}
    const take=o.at?o.at(k,st,mark):(mark>=0&&k>=mark-(o.pre||0)&&k<mark+(o.post||40)&&(k-(mark-(o.pre||0)))%(o.every||1)===0);
    if(take){await p.screenshot({path:`shots42/seq_${name}_${TAG}_${String(shot).padStart(2,'0')}.png`,clip:cl});shot++;}
    if(o.stopAfter&&mark>=0&&k>mark+o.stopAfter)break;}
  if(!pass)continue;
  fs.writeFileSync(`shots42/seq_${name}_${TAG}.json`,JSON.stringify(log));console.log(name,shot,'frames, event at step',mark,errs.length?errs:'');}}
 // Spore Flak against a Bomber coming in: frames from 6 steps before its first real shot through the cluster bursting
 await run('flak',{t:'scatter',bx:6,by:6,ammo:'PB',enemy:'horizon',ex:21,ey:7,z:2.4,cx:12,cy:7,w:900,h:300,steps:900,ev:'shot',pre:8,post:30,every:1,stopAfter:40});
 // Seed Mortar against a Flame Tank at long range: the throw, the arc, the casing splitting
 await run('mortar',{t:'hail',bx:6,by:6,ammo:'GRAPH',enemy:'mace',ex:19,ey:6.5,z:2.2,cx:12.5,cy:6.5,w:960,h:300,steps:900,ev:'shot',pre:20,post:100,every:4,stopAfter:102});
 // Sunlance with vigor: gathering from the moment it has a target, the beam, the relaxing
 await run('sun',{t:'lancer',bx:6,by:6,solar:20,enemy:'mace',ex:15,ey:7,cx:10,cy:7,w:640,h:300,steps:900,ev:'beam',pre:100,post:40,every:5,stopAfter:42});
 // the same Sunlance with no vigor: a target in range, and nothing gathers and no beam (frames every half second)
 await run('sun_novigor',{t:'lancer',bx:6,by:6,solar:0,enemy:'mace',ex:15,ey:7,cx:10,cy:7,w:640,h:300,steps:360,at:(k)=>k%60===59});
 // Brood Chamber hatching a Thornback and a Bulwark Ant from 55% grown, with vigor: frames every 0.5 s, then every step round the hatching
 for(const [n,u] of [['brood_tank','tank'],['brood_htank','htank']])
   await run(n,{t:'factory',bx:7,by:5,solar:30,unit:u,prog:.55,cx:8.5,cy:6.5,w:420,h:420,steps:1500,ev:'spawn',at:(k,st,m)=>k<m?(m-k)%30===0:(k-m)<60&&(k-m)%4===0,stopAfter:60});
 await br.close();})();
