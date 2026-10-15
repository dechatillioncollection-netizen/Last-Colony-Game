// Same seeded colony in the v34 build and this build: saves must be byte-identical (no gameplay change).
const {chromium}=require(process.env.PW||'playwright');
const run=async(br,file,mode)=>{const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(String(e)));
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1')}catch(e){}});
 await p.goto('http://localhost:8123/'+file);await p.waitForTimeout(800);
 const r=await p.evaluate(async(mode)=>{const seed=n=>{Math.random=(()=>{let s=n;return()=>(s=(s*16807)%2147483647)/2147483647})();rnd=Math.random;};
  seed(7);if(mode.startsWith('m:')){startMission(mode.slice(2));for(let i=0;i<6;i++)try{skipDlg();}catch(e){}const g0=window.__game();if(g0.story){g0.story.s='main';g0.story.hold=false;g0.story.cease=false;}}else startGame(mode);let G=window.__game();G.items=G.items.map(v=>v+5000);G.countdown=1e9;const cx=G.core.x,cy=G.core.y;
  const P=(t,x,y,r)=>tryPlace(t,x,y,r||0,true);let ok=0,tried=0;const why=[];const Q=(t,x,y,r)=>{tried++;const w=placeCheck(t,x,y);if(P(t,x,y,r))ok++;else why.push(t+'@'+(x-cx)+','+(y-cy)+':'+w);};
  for(let k=0;k<30*30;k++)step(1/30);
  // drills on the nearest ore, a belt line with a bulb, a junction, a side feed and a dead end
  const ores=[];for(let y=cy-10;y<=cy+10;y++)for(let x=cx-10;x<=cx+10;x++)if(G.ore[y*MW+x]>=0&&G.web[y*MW+x])ores.push([x,y]);
  for(const [x,y] of ores.slice(0,6))Q('drill',x,y);
  for(let i=3;i<10;i++)Q('conveyor',cx+i,cy,2);Q('router',cx+6,cy,0);Q('junction',cx+8,cy,0);
  for(let j=1;j<3;j++)Q('conveyor',cx+6,cy+j,3);Q('conveyor',cx+8,cy-2,3);Q('conveyor',cx+8,cy-1,3);
  Q('duo',cx+3,cy-4);Q('duo',cx+3,cy+4);Q('nest',cx-5,cy-2);Q('bellows',cx-6,cy+3);
  // a chain of nodes heading east, each planted at the edge of the web
  let nx=cx+4;for(let n=0;n<6;n++){let x=nx;while(G.web[(cy-6)*MW+x+1]&&x<MW-3)x++;x-=2;if(x<=nx+1)x=nx+6;Q("node",x,cy-6);nx=x;for(let k=0;k<30*60;k++)step(1/30);}
  for(let k=0;k<30*20;k++)step(1/30);
  G=window.__game();const nd=[...G.blocks.values()].filter(b=>b.t==='node').sort((a,b)=>a.x-b.x);for(const k of [1,2])if(nd[k])removeBlock(nd[k]);
  // a lone node planted away from all Rootweb (its patch is cut off from the Bloom)
  {let done=0;const clear=(x,y)=>{for(let yy=y-10;yy<=y+10;yy++)for(let xx=x-10;xx<=x+10;xx++)if(inMap(xx,yy)&&G.web[yy*MW+xx])return false;return x>9&&y>9&&x<MW-10&&y<MH-10;};for(let r=30;r<70&&!done;r+=2)for(let a=0;a<24&&!done;a++){const x=Math.round(cx+r*Math.cos(a*.26)),y=Math.round(cy+r*Math.sin(a*.26));
    if(!inMap(x,y)||!clear(x,y))continue;const o=G.webFree;G.webFree=true;if(tryPlace('node',x,y,0,true)){done=1;ok++;}G.webFree=o;}}
  for(let k=0;k<30*40;k++)step(1/30);
  const iso=typeof WSUP!=='undefined'?WSUP.iso:null;
  G.countdown=3;
  for(let k=0;k<30*150;k++)step(1/30);
  G=window.__game();const s=JSON.stringify(snapGame());
  let h=0;for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;
  return {why,ok,tried,iso,nodes:nd.length,len:s.length,h,wave:G.wave,blocks:G.blocks.size,units:(G.enemies||[]).length,s};},mode);
 r.errs=errs;await p.close();return r;};
(async()=>{const br=await chromium.launch();const out={};
 for(const mode of ['survival','siege','m:ember']){const a=await run(br,(process.env.OLD||'previous/index.html'),mode),b=await run(br,'index.html',mode);
  let d=null;if(a.s!==b.s){for(let i=0;i<a.s.length;i++)if(a.s[i]!==b.s[i]){d=[i,a.s.slice(i-150,i+60),b.s.slice(i-150,i+60)];break;}}
  out[mode]={same:a.s===b.s,placed:[a.ok+'/'+a.tried,b.ok+'/'+b.tried],why:b.why,nodes:[a.nodes,b.nodes],cutTiles:b.iso,len:[a.len,b.len],wave:[a.wave,b.wave],blocks:[a.blocks,b.blocks],units:[a.units,b.units],errs:[a.errs,b.errs],diff:d};}
 console.log(JSON.stringify(out,null,1));require('fs').writeFileSync('ident35_result.json',JSON.stringify(out,null,1));await br.close();})();
