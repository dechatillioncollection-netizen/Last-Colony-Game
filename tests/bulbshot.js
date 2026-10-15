// Splitter Bulb reversal close-up: copper in from the west, then the vines are turned round and lead comes in from the east.
// Writes shots35/bulb_1_before.png, bulb_2_after.png and bulb_result.json (items each vine delivered).
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1100,height:760}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1')}catch(e){}});
 await p.goto('http://localhost:8123/'+(process.env.BUILD||'index.html'));await p.waitForTimeout(1500);
 const res={};
 res.before=await p.evaluate(()=>{let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  const X=G.core.x+7,Y=G.core.y-9;
  for(let y=Y-3;y<Y+10;y++)for(let x=X-3;x<X+16;x++){const i=y*MW+x;const b=blockAt(x,y);if(b)destroyBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
  for(const [x,y] of [[0,2],[1,2],[0,3],[1,3]])G.ore[(Y+y)*MW+X+x]=CU;for(const [x,y] of [[12,2],[13,2],[12,3],[13,3]])G.ore[(Y+y)*MW+X+x]=PB;
  const put=(t,x,y,r)=>{tryPlace(t,X+x,Y+y,r||0,true);const b=blockAt(X+x,Y+y);if(b)b.built=1;return b;};
  put('drill',0,2);for(let x=2;x<=5;x++)put('conveyor',x,3,0);put('router',6,3);for(let x=7;x<=11;x++)put('conveyor',x,3,0);
  for(let y=2;y>=0;y--)put('conveyor',6,y,3);for(let y=4;y<=6;y++)put('conveyor',6,y,1);
  G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();
  const ends={west:blockAt(X+2,Y+3),east:blockAt(X+11,Y+3),north:blockAt(X+6,Y),south:blockAt(X+6,Y+6)};
  window.__s={X,Y,ends,got:{west:{},east:{},north:{},south:{}},sink:new Set(['east','north','south'])};
  window.__run=sec=>{const S=window.__s;for(let k=0;k<sec*30;k++){step(1/30);for(const n of S.sink){const L=S.ends[n].belt;if(L.length&&L[L.length-1].p>=1){const it=L.pop().i;S.got[n][it]=(S.got[n][it]||0)+1;}}}};
  __run(40);G.paused=true;cam.z=2.6;centerOn(X+6.5,Y+3.5);
  return JSON.parse(JSON.stringify(window.__s.got));});
 await p.waitForTimeout(1200);await p.screenshot({path:'shots35/bulb_1_before.png'});
 res.after=await p.evaluate(()=>{const S=window.__s,G=window.__game(),{X,Y}=S;G.paused=false;
  for(const n in S.got)S.got[n]={};
  // turn the west and east vines round, take the copper tap away and plant a lead tap at the east end
  destroyBlock(blockAt(X,Y+2));for(let x=2;x<=5;x++)tryPlace('conveyor',X+x,Y+3,2,true);for(let x=7;x<=11;x++)tryPlace('conveyor',X+x,Y+3,2,true);
  tryPlace('drill',X+12,Y+2,0,true);const d=blockAt(X+12,Y+2);if(d)d.built=1;
  S.sink=new Set(['west','north','south']);G.dirty=true;recompute();
  // let the old copper clear first, then count
  __run(15);for(const n in S.got)S.got[n]={};__run(40);G.paused=true;
  return JSON.parse(JSON.stringify(S.got));});
 await p.waitForTimeout(1200);await p.screenshot({path:'shots35/bulb_2_after.png'});
 res.errs=errs;console.log(JSON.stringify(res));fs.writeFileSync('shots35/bulb_result.json',JSON.stringify(res,null,1));await br.close();})();
