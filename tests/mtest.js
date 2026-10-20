// v34 campaign map and mission checks. Runs the real game in headless Chromium and drives the simulation directly.
// URL defaults to the build next to this script. Writes mtest_result.json; prints PASS/FAIL per check.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load resource/.test(m.text()))errs.push(m.text());});
 await p.goto(URL);await p.waitForTimeout(1500);await p.click('#m-campaign');await p.waitForTimeout(500);
 const R=[];const check=(name,ok,info)=>{R.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info));};
 // helper inside the page: start a sector with its story finished, so only the sector itself is under test
 await p.evaluate(()=>{window.__t={
   start(id){startMission(id);skipDlg();skipDlg();if(G.story){G.story.s='main';G.story.hold=false;G.story.cease=false;}$('tut').hidden=true;},
   run(sec){const n=Math.round(sec/STEP);for(let k=0;k<n&&!G.over;k++)step(STEP);},
   grow(){for(let k=0;k<3000;k++){step(STEP);if(G.core.wi>=G.core.wlist.length)break;}for(const e of G.enemies)e.dead=true;G.enemies=[];},
 };});
 // ---------------- Mission 1: Landfall ----------------
 const lf=await p.evaluate(()=>{__t.start('landfall');const m=MIS.landfall;const out={};
   out.track=mapDecor().filter(o=>o[0]==='track').length;
   // the track is open ground all the way from the map edge to its end
   let blocked=0;const P=m.patrol;for(let k=0;k<P.length-1;k++){const [ax,ay]=P[k],[bx,by]=P[k+1],L=Math.hypot(bx-ax,by-ay);for(let q=0;q<=L;q+=.5){const x=Math.round(ax+(bx-ax)*q/L),y=Math.round(ay+(by-ay)*q/L);if(blockedT(y*MW+x))blocked++;}}
   out.trackBlocked=blocked;
   out.startWeb=G.webCount;__t.grow();out.grownWeb=G.webCount;out.share=+(100*G.webCount/N).toFixed(1);out.reach=G.reach;
   // nearest Rootweb tile to the track, once the Bloom has finished growing on its own
   let best=1e9;for(let i=0;i<N;i++)if(G.web[i]){const x=i%MW,y=(i/MW)|0;for(const [px,py] of P)best=Math.min(best,Math.hypot(x-px,y-py));}out.webToTrack=+best.toFixed(1);
   // tutorial structures fit on the Bloom's own Rootweb: a Root Tap on copper, the Thorn Spitter ring, a node at the edge
   const cx=G.core.x+1.5,cy=G.core.y+1.5;let tap=null;for(const [vx,vy,it] of G.veins){if(it!==CU)continue;for(let y=Math.floor(vy)-3;y<=vy+2&&!tap;y++)for(let x=Math.floor(vx)-3;x<=vx+2&&!tap;x++)if(!placeCheck('drill',x,y)&&drillOre('drill',x,y).item===CU)tap=[x,y];}
   out.tapSpot=tap;const tx=G.core.x+7,ty=Math.floor(G.core.y+1.5);out.spitterRing=placeCheck('duo',tx,ty)||'ok';
   let nodeOK=0;for(let i=0;i<N;i++)if(G.web[i]&&!placeCheck('node',i%MW,(i/MW)|0))nodeOK++;out.nodeSpots=nodeOK;
   // each ore type the sector needs can be reached: on the Bloom's Rootweb now, or by chaining nodes over open ground
   out.oreOnWeb={};for(const it of [CU,PB,SAND]){let n=0;for(let i=0;i<N;i++)if(G.web[i]&&(it===SAND?G.terrain[i]===SANDF:G.ore[i]===it))n++;out.oreOnWeb[['cu','pb','','sand'][it]||'sand']=n;}
   return out;});
 check('Landfall: patrol track drawn and open end to end',lf.track===1&&lf.trackBlocked===0,lf);
 check('Landfall: Bloom Rootweb stays local (reach '+lf.reach+')',lf.share<12&&lf.webToTrack>=4,{grown:lf.grownWeb,share:lf.share,webToTrack:lf.webToTrack});
 check('Landfall: tutorial Root Tap, Thorn Spitter and node fit on the starting Rootweb',lf.tapSpot&&lf.spitterRing==='ok'&&lf.nodeSpots>50,{tap:lf.tapSpot,ring:lf.spitterRing,nodes:lf.nodeSpots,ore:lf.oreOnWeb});
 // Rootweb Nodes extend the reach (a node on the edge adds new ground beyond the Bloom's)
 const nd=await p.evaluate(()=>{const before=G.webCount;const cx=G.core.x+1.5,cy=G.core.y+1.5;let best=null,bd=-1;
   for(let i=0;i<N;i++){if(!G.web[i])continue;const x=i%MW,y=(i/MW)|0;if(placeCheck('node',x,y))continue;if(x<4||y<4||x>MW-5||y>MH-5)continue;const d=x;if(d>bd){bd=d;best=[x,y];}}
   G.items[CU]+=100;tryPlace('node',best[0],best[1],0,true);for(const b of G.blocks.values())b.built=1;__t.run(40);return {before,after:G.webCount,at:best};});
 check('Landfall: a Rootweb Node pushes Rootweb past the Bloom\'s reach',nd.after>nd.before+40,nd);
 // waves: every wave spawns, reaches the Bloom's area by ground (or air), and the sector is won after wave 10
 async function waves(id){return p.evaluate(id=>{__t.start(id);G.items=G.items.map(v=>v+5000);const hp0=G.core.hp;const W={};let launched=0;
   for(let w=1;w<=G.winWave&&!G.over;w++){G.countdown=0;step(STEP);launched=G.wave;const kinds=new Set();let near=0,total=0,minD=1e9;
     for(let k=0;k<Math.round(300/STEP)&&!G.over;k++){if(G.wave<G.winWave)G.countdown=Math.max(G.countdown,10);step(STEP);G.core.hp=hp0;
       for(const e of G.enemies){kinds.add(e.t);const d=Math.hypot(e.x-G.core.x-1.5,e.y-G.core.y-1.5);if(d<minD)minD=d;if(d<14&&!e.dead){e.dead=true;near++;}}
       if(!G.spawnQ.length&&G.enemies.every(e=>e.dead)&&k>30)break;}
     total=near;for(const e of G.enemies)e.dead=true;G.enemies=G.enemies.filter(e=>!e.dead);W[w]={n:total,kinds:[...kinds].join(','),minD:+minD.toFixed(1)};}
   for(let k=0;k<200&&!G.over;k++)step(STEP);
   return {launched,win:G.over,dlg:DLG.open,seq:DLG.seq&&Object.keys(SEQ).find(k=>SEQ[k]===DLG.seq),waves:W,evf:Object.keys(G.evf||{})};},id);}
 for(const id of ['landfall','ember','frost']){const r=await waves(id);const stuck=Object.entries(r.waves).filter(([w,v])=>v.minD>14).map(([w])=>w);
   check(`${MIS_NAME(id)}: all ${r.launched} waves reach the Bloom and the sector is won`,r.win&&stuck.length===0,{launched:r.launched,stuck,win:r.win,outro:r.seq,events:r.evf,first:r.waves[1],last:r.waves[r.launched],stuckInfo:stuck.map(w=>r.waves[w])});
   await p.evaluate(()=>{skipDlg();});}
 function MIS_NAME(id){return {landfall:'Landfall',ember:'Ember Fields',kilo:'Outpost Kilo',frost:'Frost Canyon',last:'The Last Colony'}[id];}
 // ---------------- Mission 2: Ember Fields ----------------
 const em=await p.evaluate(()=>{__t.start('ember');const depot=propsOf('depot')[0];const out={depot};
   out.depotReachable=false;// the depot is scenery: its tiles are solid and no open tile inside it
   let open=0;if(depot)for(let y=depot[1];y<depot[1]+depot[3];y++)for(let x=depot[0];x<depot[0]+depot[2];x++)if(!blockedT(y*MW+x))open++;out.depotOpen=open;
   out.coalNearStart=G.veins.filter(([x,y,it])=>it===COAL&&Math.hypot(x-G.core.x-1.5,y-G.core.y-1.5)<14).length;
   out.coalFields=G.veins.filter(([x,y,it])=>it===COAL).length;out.road=opOf('road').length;out.burns=opOf('burn').length;
   const order=STORY.ember.intro;out.brief=order.indexOf('e_brief');return out;});
 check('Ember Fields: Ember Depot represented as solid scenery, haul road and burned ground present',em.depot&&em.depotOpen===0&&em.road===1&&em.burns>=4,em);
 check('Ember Fields: coal within the Bloom\'s reach plus larger fields beyond it',em.coalNearStart>=1&&em.coalFields>=5,em);
 // ---------------- Mission 3: Outpost Kilo ----------------
 const ki=await p.evaluate(()=>{__t.start('kilo');const m=MIS.kilo,out={};
   // the ridge: a column of rock down the middle with one gap, at the pass
   let gaps=[],run=0;for(let y=2;y<MH-2;y++){let open=false;for(let x=43;x<=51;x++)if(!blockedT(y*MW+x)){open=true;}
     let wall=false;for(let x=43;x<=51;x++)if(blockedT(y*MW+x))wall=true;const through=(()=>{for(let x=43;x<=51;x++)if(blockedT(y*MW+x))return false;return true;})();if(through)run++;else{if(run)gaps.push([y-run,y-1]);run=0;}}
   out.gaps=gaps;out.lab=propsOf('lab')[0];out.drills=eCount(['drill','pdrill']);out.belts=eCount(['conveyor','junction']);out.duos=eCount('duo');out.efeed=G.efeed;out.outpost=G.outpost;out.gates=G.egates;
   // the core can be reached by ground from the Bloom (through doors, which ants can break)
   const c=G.ecores[0];out.core=[c.x,c.y];return out;});
 check('Outpost Kilo: one pass through the ridge',ki.gaps.length===1&&ki.gaps[0][0]<=MIS_PASS(ki)&&ki.gaps[0][1]>=MIS_PASS(ki),{gaps:ki.gaps});
 function MIS_PASS(){return 49;}
 check('Outpost Kilo: working outpost (drills, belts, turrets) and a containment laboratory',ki.drills>=3&&ki.belts>=10&&ki.duos>=6&&ki.lab,{drills:ki.drills,belts:ki.belts,duos:ki.duos,lab:ki.lab,outpost:ki.outpost,gates:ki.gates});
 // cut its supply: destroying a drill and its belts drops ammunition into its guns and fires the outpost's radio events
 const sup=await p.evaluate(()=>{__t.run(2);const duoAmmo=()=>{let a=0;for(const b of G.blocks.values())if(b.team===1&&b.t==='duo')for(const k in b.ammo||{})a+=b.ammo[k];return a;};
   __t.run(60);const a0=duoAmmo(),core0=G.eitems[CU];const cut=[...G.blocks.values()].filter(b=>b.team===1&&(b.t==='drill'||b.t==='conveyor'));for(const b of cut)destroyBlock(b);
   const ev0=Object.keys(G.evf);__t.run(1.2);const ev1=Object.keys(G.evf);
   // the colony rebuilds from its stock, so measure the next minute of copper income to its core with the supply cut
   let gainCut=0;{const c=G.eitems[CU];__t.run(30);gainCut=G.eitems[CU]-c;}
   return {cut:cut.length,ammoBefore:a0,events:ev1.filter(k=>!ev0.includes(k)),gainCut};});
 check('Outpost Kilo: cutting drills and belts fires the supply events',sup.cut>5&&sup.events.includes('k_drill')&&sup.events.includes('k_belt'),sup);
 const kv=await p.evaluate(async()=>{const near=async(c,d)=>{for(let i=0;i<40;i++){const cx=(cam.x+VW/2/cam.z)/T,cy=(cam.y+VH/2/cam.z)/T;if(c&&Math.hypot(cx-c[0],cy-c[1])<d)return true;await new Promise(r=>setTimeout(r,100));}return false;};const c=G.ecores[0];destroyBlock(c);await new Promise(r=>setTimeout(r,200));const seq=DLG.open&&Object.keys(SEQ).find(k=>SEQ[k]===DLG.seq);
   // since v46 the camera pans to the scene rather than jumping, so give it time to arrive
   const lab=propCentre('lab'),camAtLab=await near(lab,8);return {over:G.over,seq,camAtLab,ping:PINGS.map(p=>p.label)};});
 check('Outpost Kilo: destroying the core wins, and the outro looks at the laboratory',kv.over&&kv.seq==='k_out'&&kv.camAtLab,kv);
 await p.evaluate(()=>skipDlg());
 // ---------------- Mission 4: Frost Canyon ----------------
 const fr=await p.evaluate(()=>{__t.start('frost');const out={};out.biome=G.biome;out.ti=G.veins.filter(v=>v[2]===TI).map(v=>[Math.floor(v[0]),Math.floor(v[1])]);
   // titanium sits beside the cliffs (rock within 4 tiles) and is reachable over open ground
   out.tiByCliff=out.ti.filter(([x,y])=>{for(let yy=y-5;yy<=y+5;yy++)for(let xx=x-5;xx<=x+5;xx++)if(inMap(xx,yy)&&G.terrain[yy*MW+xx]===ROCK)return true;return false;}).length;
   out.barricades=propsOf('barricade').length;out.artillery=propsOf('artillery').length;out.ice=!!biome().ice;return out;});
 check('Frost Canyon: frozen canyon, titanium by the cliffs, barricades and artillery staging',fr.biome==='frost'&&fr.ice&&fr.tiByCliff>=2&&fr.barricades>=2&&fr.artillery>=2,fr);
 // ---------------- Mission 5: The Last Colony ----------------
 const la=await p.evaluate(()=>{__t.start('last');const out={};out.houses=(G.estate||[]).length;out.shelters=propsOf('shelter').length;out.command=propsOf('command').length;
   out.efeed=G.efeed;out.fail=(G.efeed||[]).filter(s=>/FAIL|nosrc|nodst/.test(s)).length;out.turrets=eCount(['duo','hail','lancer','scatter']);out.walls=eCount(['wall','wallL','twall']);out.doors=eCount(['door','doorL']);
   out.district=propsOf('house').every?null:null;
   // nothing of the district sits on the player's half
   out.leftSide=mapDecor().filter(o=>o[0]==='prop'&&o[2]<MW/2).length;return out;});
 check('The Last Colony: homes, shelters and a command centre on the colony side',la.houses>=20&&la.shelters>=3&&la.command===1&&la.leftSide===0,{houses:la.houses,shelters:la.shelters,command:la.command,left:la.leftSide});
 check('The Last Colony: colony economy and defences intact',la.fail===0&&la.turrets>=16&&la.walls>=20&&la.doors>=1,{efeed:la.efeed,turrets:la.turrets,walls:la.walls,doors:la.doors});
 const lc=await p.evaluate(async()=>{// the first direct exchange plays from the command centre
   const near=async(c,d)=>{for(let i=0;i<40;i++){const cx=(cam.x+VW/2/cam.z)/T,cy=(cam.y+VH/2/cam.z)/T;if(c&&Math.hypot(cx-c[0],cy-c[1])<d)return true;await new Promise(r=>setTimeout(r,100));}return false;};startMission('last');await new Promise(r=>setTimeout(r,150));let k=0,atCmd=false;
   while(DLG.open&&k++<200){const key=Object.keys(SEQ).find(q=>SEQ[q]===DLG.seq);if(key==='x_contact'){atCmd=await near(propCentre('command'),8);break;}advanceDlg();advanceDlg();}
   skipDlg();G.story.s='main';G.story.hold=false;const c=G.ecores[0];destroyBlock(c);await new Promise(r=>setTimeout(r,150));
   const seq=DLG.open&&Object.keys(SEQ).find(q=>SEQ[q]===DLG.seq);const camAtShelter=await near(propCentre('shelter'),12);
   return {atCmd,over:G.over,seq,camAtShelter};});
 check('The Last Colony: first contact plays from HDF Command; the core falls and the ending shows the shelters',lc.atCmd&&lc.over&&lc.seq==='x_out1'&&lc.camAtShelter,lc);
 await p.evaluate(()=>skipDlg());
 check('No page errors',errs.length===0,errs.slice(0,5));
 const fails=R.filter(r=>!r.ok).length;console.log(fails?`${fails} MISSION CHECKS FAILED`:`ALL ${R.length} MISSION CHECKS PASS`);fs.writeFileSync('mtest_result.json',JSON.stringify(R,null,1));await br.close();})();
