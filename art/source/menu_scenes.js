// The main menu's background scenes, built inside the game page by art/source/rec_menu.js and recorded frame by frame.
// Each scene is a sandboxed demo game: a fixed seed and a hand-laid layout, no waves, no story, the clock stepped by the
// recorder (never by the page's own loop), and the camera on a closed path so the clip can loop. Nothing here ships in the
// game; only the recorded clips do. Returns {name, secs, cam(t) -> [x,y,zoom], tick(t,dt)}.
(function(){
const seed=s=>{Math.random=()=>(s=(s*16807)%2147483647)/2147483647;rnd=Math.random;};
// a demo game: no waves, no fog of war, everything paid for, the page's own loop kept from stepping it
const demo=(mode,s)=>{seed(s);startGame(mode);const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+30000);G.cap=1e6;G.webFree=true;G.paused=true;
  SET.fog=false;$('msg')&&($('msg').style.display='none');return G;};
const clear=(G,x0,y0,x1,y1,web)=>{for(let y=y0;y<y1;y++)for(let x=x0;x<x1;x++){if(!inMap(x,y)||blockAt(x,y))continue;const i=y*MW+x;G.terrain[i]=FLOOR;G.ore[i]=-1;if(web!==undefined)setWeb(i,web);}};
const ore=(G,x,y,it,s)=>{s=s||2;for(let yy=y;yy<y+s;yy++)for(let xx=x;xx<x+s;xx++){const i=yy*MW+xx;if(it===SAND)G.terrain[i]=SANDF;else G.ore[i]=it;}};
const put=(t,x,y,r,team)=>{if(!team&&tryPlace(t,x,y,r||0,true)){const b=blockAt(x,y);if(b){b.built=1;return b;}}
  if(!freeArea(x,y,B[t].size))return null;const b=addBlock(t,x,y,r||0,team||0);b.built=1;return b;};
const finish=G=>{for(const b of G.blocks.values()){b.built=1;b.hp=b.max;}G.dirty=true;recompute();drawTerrainAll();repaintAllWeb();};
// an organic patch of open ground around (cx,cy), radius about R, optionally covered in Rootweb
const site=(G,cx,cy,R,web,k)=>{for(let y=Math.floor(cy-R*1.4);y<cy+R*1.4;y++)for(let x=Math.floor(cx-R*1.4);x<cx+R*1.4;x++){if(!inMap(x,y))continue;
  const a=Math.atan2(y-cy,x-cx),r=Math.hypot(x-cx,y-cy),edge=R*(.82+.36*fbm(Math.cos(a)*1.7+9,Math.sin(a)*1.7+(k||3),k||5));if(r>edge)continue;
  const i=y*MW+x;if(!blockAt(x,y)){G.terrain[i]=FLOOR;G.ore[i]=-1;}if(web!==undefined&&r<edge-.5)setWeb(i,web);}};
const noWeb=G=>{for(let i=0;i<MW*MH;i++)setWeb(i,0);};
// moves the Bloom to (x,y) (its top-left tile), so a scene can sit in the middle of the map
const moveBloom=(G,x,y)=>{site(G,x+1.5,y+1.5,4);removeBlock(G.core);G.coreX=x;G.coreY=y;G.core=addBlock('core',x,y,0,0);G.core.built=1;G.core.hp=G.core.max;return G.core;};
// the camera, on a closed path; the scene's point of interest sits right of centre, clear of the menu rail
const loopCam=(cx,cy,z,ax,ay,secs,dz)=>t=>{const a=t/secs*Math.PI*2,zz=z*(1+(dz||0)*Math.sin(a));return [cx-.12*VW/zz/T+Math.sin(a)*ax,cy+Math.sin(a*2)*ay,zz];};
// walks a scripted machine (one the guns ignore and that ignores everything) along a route, round and round
const patrol=(G,t,route,wait)=>{const e=testSpawnEnemy?testSpawnEnemy(t,route[0][0],route[0][1]):spawnEnemy(t);e.x=route[0][0];e.y=route[0][1];
  e.script=1;e.route=route;e.wp=1;e.goal=route[1];e.wait=wait||0;e.id=G.nextId++;e.ang=Math.atan2(route[1][1]-route[0][1],route[1][0]-route[0][0]);return e;};
// runs the demo on before recording, so vines are full and the machines are already at work
const warm=(G,secs,tick)=>{for(let k=0;k<secs*30;k++){if(tick)tick(k/30,1/30);step(1/30);}};
const patrolTick=G=>{for(const e of G.enemies)if(e.script&&e.route&&e.wp>=e.route.length-1&&Math.hypot(e.goal[0]-e.x,e.goal[1]-e.y)<.8){e.wp=0;e.goal=e.route[0];}};

const S={};
// B. Living Factory: taps on every ore, vines and Swift Vines through Splitter Bulbs into glands, vats and the Bloom,
// Sunleaves and Sap Burners for vigor, Spawning Pods and a Brood Chamber hatching ants. No enemies.
S.factory=()=>{const G=demo('survival',11);noWeb(G);moveBloom(G,46,46);const cx=G.core.x,cy=G.core.y;
  site(G,cx+1.5,cy+1.5,19,1,4);
  const P=(t,x,y,r)=>put(t,cx+x,cy+y,r),O=(x,y,it,s)=>ore(G,cx+x,cy+y,it,s);
  // copper and lead north of the Bloom down one vine
  O(-3,-7,CU);P('drill',-3,-7);P('conveyor',-1,-6,0);for(let y=-6;y<0;y++)P('conveyor',0,y,1);O(1,-7,PB);P('drill',1,-7);P('conveyor',1,-5,2);
  // titanium from Deep Roots to the east along a long Swift Vine
  O(9,0,TI);P('pdrill',9,0);O(9,2,TI);P('pdrill',9,2);for(let x=3;x<9;x++)P('tconveyor',x,1,2);P('tconveyor',8,2,3);P('tconveyor',8,3,3);
  // coal and sand into a Chitin Vat to the west, chitin into the Bloom; Sunleaves
  P('smelter',-7,0);O(-7,-3,COAL);P('drill',-7,-3);P('conveyor',-6,-1,1);O(-10,0,SAND);P('drill',-10,0);P('conveyor',-8,1,0);
  for(let x=-4;x<0;x++)P('conveyor',x,1,0);
  for(let x=-12;x<-4;x+=1)P('solar',x,4);
  // a second copper field through a Splitter Bulb into three Thorn Spitters and on to the Bloom
  O(10,-7,CU);P('drill',10,-7);O(12,-7,CU);P('drill',12,-7);P('conveyor',9,-6,2);P('conveyor',11,-5,3);P('conveyor',11,-6,2);P('conveyor',10,-5,2);
  for(let x=8;x>5;x--)P('conveyor',x,-6,2);P('router',5,-6);P('duo',5,-8);P('duo',5,-5);P('conveyor',4,-6,2);P('router',3,-6);P('duo',3,-8);
  P('conveyor',3,-5,1);P('conveyor',3,-4,1);P('conveyor',3,-3,1);P('conveyor',3,-2,1);P('conveyor',3,-1,2);
  // a Resin Gland on a coal tap, its resin by Swift Vine into the Bloom
  O(8,6,COAL);P('drill',8,6);P('press',5,6);P('conveyor',7,7,2);for(let y=6;y>3;y--)P('tconveyor',5,y-1,3);P('tconveyor',5,3,2);P('tconveyor',4,3,3);
  // Spawning Pods and a Brood Chamber fed from the Bloom's south side
  P('nest',-1,6);P('nest',2,6);O(-4,8,CU);P('drill',-4,8);P('conveyor',-2,9,0);P('conveyor',-1,9,0);P('conveyor',0,9,3);P('conveyor',0,8,3);
  P('factory',-8,7);O(-11,8,COAL);P('drill',-11,8);P('conveyor',-9,8,0);
  // Sap Burners on a coal tap, Spore Bellows and a Rootweb Node at the edge of the web, Healing Pods
  O(-12,-6,COAL);P('drill',-12,-6);P('combustion',-10,-6);P('conveyor',-10,-5,0);P('combustion',-9,-5);
  P('bellows',13,4);P('node',15,-2);P('mender',-14,-1);P('mender',14,9);
  // a long copper line from the north-west field, along a Swift Vine past the Sunleaves' tap into the Chitin Vat line
  O(-16,-11,CU);P('drill',-16,-11);O(-14,-11,CU);P('drill',-14,-11);O(-12,-11,CU);P('drill',-12,-11);
  for(let x=-16;x<-5;x++)P('tconveyor',x,-9,0);P('tconveyor',-5,-9,1);for(let y=-8;y<-1;y++)P('tconveyor',-5,y,1);P('tconveyor',-5,-1,0);P('tconveyor',-4,-1,1);P('tconveyor',-4,0,1);
  // lead from the south-east through a Splitter Bulb: half to the Bloom, half to a Spore Flak
  O(11,11,PB);P('drill',11,11);O(13,11,PB);P('drill',13,11);for(let x=12;x>8;x--)P('conveyor',x,10,2);P('conveyor',13,10,2);P('router',8,10);P('scatter',8,12);
  for(let x=7;x>3;x--)P('conveyor',x,10,2);P('conveyor',3,10,3);P('conveyor',3,9,3);P('conveyor',3,8,2);
  finish(G);warm(G,40);
  // a few ants already about
  for(let k=0;k<5;k++)spawnUnit(k<3?'mite':'tank',cx+1.5+(k-2)*1.4,cy+12.5);
  const secs=30;return {name:'Living Factory',secs,cam:loopCam(cx+1.5,cy+1,1.5,3,1.2,secs,.04),tick(){}};};

// A. Quiet Frontier: a young Bloom on open meadow, a tap and a vine, the Rootweb creeping outward; far off, an HDF survey
// patrol crosses the ridge and does not stop. No guns, no story, nothing comes of it.
S.frontier=()=>{const G=demo('survival',7);G.reach=9;G.ezone=0;noWeb(G);moveBloom(G,62,46);const cx=G.core.x,cy=G.core.y;
  site(G,cx+1.5,cy+1.5,8.5,1,6);
  const P=(t,x,y,r)=>put(t,cx+x,cy+y,r),O=(x,y,it,s)=>ore(G,cx+x,cy+y,it,s);
  O(-4,-3,CU);P('drill',-4,-3);P('conveyor',-2,-2,0);P('conveyor',-1,-2,1);P('conveyor',-1,-1,0);
  O(4,2,PB);P('drill',4,2);P('conveyor',3,2,2);
  P('solar',-3,3);P('solar',-2,4);P('solar',-4,4);
  finish(G);warm(G,4);
  // a Rootweb Node just planted at the edge: its Rootweb spreads out over the clip
  site(G,cx+12,cy+1,3);const n=P('node',cx+10-cx,1);if(n){n.built=1;n.hp=n.max;}G.dirty=true;recompute();
  // the survey patrol: two Scout Tanks and a Flame Tank in line, across the far ridge from beyond the right edge and out of sight
  const route=[[93,30.5],[80,30.5],[68,30.5],[58,29],[57,18],[56,4]];
  ['dagger','dagger','mace'].forEach((t,k)=>{const e=patrol(G,t,route,k*2.2);});
  const secs=30;return {name:'Quiet Frontier',secs,cam:loopCam(cx+5,cy-3,1.35,2.5,1,secs,.03),tick(){}};};

// D. Human Frontier: the last colony at work, its drills and belts feeding its smelters, presses and guns, patrols on the
// perimeter road. Seen from its own side; no hive in sight.
S.human=()=>{const G=demo('siege',11);G.ezone=0;const c=G.ecores[0],cx=c.x+1.5,cy=c.y+1.5;
  const route=[[cx-12,cy-12],[cx+10,cy-13],[cx+13,cy+10],[cx-11,cy+12]],loop=[...route,route[0]];
  patrol(G,'dagger',loop,0);patrol(G,'dagger',loop.slice(2).concat(loop.slice(1,3)),0);
  const r2=[[cx-16,cy+4],[cx-16,cy-8],[cx-4,cy-17],[cx+8,cy-17]];patrol(G,'fortress',[...r2,...r2.slice(0,-1).reverse()],0);
  warm(G,40,()=>patrolTick(G));
  const secs=30;return {name:'Human Frontier',secs,cam:loopCam(cx,cy,1.5,0,0,secs,0),tick(){patrolTick(G);}};};

// C. Fortress Skirmish: Thornback and Mite Ants push at the colony's west gun line in small waves; its Duo Turrets, Lancer and
// Hail Cannons answer, and a few machines roll out to meet them. Never more than ten ants at once.
S.skirmish=()=>{const G=demo('siege',11);G.ezone=0;const c=G.ecores[0],cx=c.x+1.5,cy=c.y+1.5;G.command='attack';
  let next=0,wave=0;const send=()=>{const alive=G.units.filter(u=>!u.dead).length;if(alive>6)return;const n=Math.min(4,10-alive);
    for(let k=0;k<n;k++){const t=k===0&&wave%2?'htank':k<2?'tank':'mite';const u=spawnUnit(t,cx-40+rnd()*2,cy-3+k*2+(wave%3-1)*3);u.go=1;}wave++;};
  const tick=(t,dt)=>{next-=dt;if(next<=0){send();next=6.5;}};
  for(const [t,dy] of [['dagger',-4],['mace',2],['dagger',6]])testSpawnEnemy(t,cx-9,cy+dy);
  warm(G,12,tick);
  const secs=30;return {name:'Fortress Skirmish',secs,cam:loopCam(cx-27,cy,1.75,1.5,.8,secs,.02),tick};};

// the colony's lakes shimmer and its belts all move at Epic, which makes a clip three times the size; High looks the same from here
S.human.quality='high';
window.MS=S;
})();
