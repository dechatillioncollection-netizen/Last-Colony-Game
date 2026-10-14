const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1000,height:700}});
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1')}catch(e){}});
 await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(900);
 const r=await p.evaluate(async()=>{const n=25;Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+99999);G.countdown=1e9;
     const cx=G.core.x,cy=G.core.y;let k=0;const cols=10;for(let i=0;k<n&&i<400;i++){const x=cx+6+(i%cols)*2,y=cy-10+Math.floor(i/cols)*2;if(tryPlace('duo',x,y,0,true))k++;}
     for(const b of G.blocks.values()){b.built=1;if(b.t==='duo')b.ammo[CU]=30;}
     G.enemies=[];for(let j=0;j<12;j++){G.enemies.push({t:'dagger',x:cx+30,y:cy-10+j*2,hp:1e6,max:1e6,boss:false,cd:9,think:9,target:null,tu:null,dead:false,ang:Math.PI,orbit:0,vx:0,vy:0});}
     cam.z=1;centerOn(cx+15,cy);const tiles=[];for(let i=0;i<N;i++)if(G.web[i])tiles.push(i);
     const loop=(mode,paints)=>{let t=0,f=0;for(let j=0;j<40;j++){const a=performance.now();for(let q=0;q<paints;q++){const i=tiles[(j*paints+q)%tiles.length];if(mode==='hd'){wctx.clearRect((i%MW)*T,((i/MW)|0)*T,T,T);paintWebHD(i%MW,(i/MW)|0);}else paintWeb(i%MW,(i/MW)|0);}step(1/30);render();t+=performance.now()-a;}return +(t/40).toFixed(1);};
     const out={};webQ.clear();for(const bn of webBorn.values())bn.t=-99;while(webBorn.size)webArtTick();
     out.art0=loop('art',0);const fx=webArtFx;webArtFx=()=>{};out.art0nofx=loop('art',0);webArtFx=fx;out.wfx=WFX.length;cam.z=.6;out.art0z6=loop('art',0);SET.art=false;out.hd0z6=loop('hd',0);SET.art=true;cam.z=1;out.art3=loop('art',3);SET.art=false;out.hd0=loop('hd',0);out.hd3=loop('hd',3);SET.art=true;return out;});
 console.log(r);await br.close();})();
