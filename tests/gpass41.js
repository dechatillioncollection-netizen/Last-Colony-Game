// which ants cross a wall line through a Petal Gate / Maw Gate (simulation only)
const {chromium}=require(process.env.PW||'playwright');const URL=process.env.URL||'http://localhost:8123/lc2_index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage();p.on('pageerror',e=>console.log('ERR',e.message));
 await p.goto(URL);await p.waitForTimeout(1200);
 for(const gate of ['door','doorL'])for(const ut of ['mite','tank','htank']){
  const r=await p.evaluate(([gate,ut])=>{let s=5;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
   const X=G.core.x+6,Y=G.core.y-8;for(let y=Y-2;y<Y+16;y++)for(let x=X-2;x<X+16;x++){const i=y*MW+x;const b=blockAt(x,y);if(b&&b!==G.core)removeBlock(b);G.terrain[i]=0;G.ore[i]=-1;setWeb(i,1);}
   // a horizontal wall line at row Y+6 from X to X+13 with the gate in the middle
   for(let x=X;x<X+14;x++){if(gate==='doorL'&&(x===X+6||x===X+7))continue;if(gate==='door'&&x===X+6)continue;tryPlace('wall',x,Y+6,0,true);}
   if(gate==='doorL'){for(let x=X;x<X+14;x++)if(x!==X+6&&x!==X+7)tryPlace('wall',x,Y+7,0,true);tryPlace('doorL',X+6,Y+6,0,true);}else tryPlace('door',X+6,Y+6,0,true);
   // close the sides so the only way is the gate: vertical walls at X-1 and X+14 from Y to Y+13
   for(let y=Y-1;y<Y+14;y++){tryPlace('wall',X-1,y,0,true);tryPlace('wall',X+14,y,0,true);}
   for(const b of G.blocks.values())b.built=1;G.dirty=true;recompute();
   const u=spawnUnit(ut,X+6.5,Y+2.5);sendAnts([u],X+6.5,Y+11.5);let crossed=-1,minOp=1,maxOp=0;const g=blockAt(X+6,Y+6);
   for(let k=0;k<30*30;k++){step(1/30);gateOpen(g,G.time);if(crossed<0&&u.y>Y+(gate==='doorL'?8:7)+.3)crossed=+(k/30).toFixed(1);}
   return {gate:g&&g.t,ut,crossed,end:[+u.x.toFixed(2),+u.y.toFixed(2)],r:U[ut].r,radOf:radOf(u,0)};},[gate,ut]);
  console.log(JSON.stringify(r));}
 await br.close();})();
