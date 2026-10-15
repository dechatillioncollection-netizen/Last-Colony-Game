// Frame time with many Splitter Bulbs / Sorting Glands / Resin Glands / Rootweb Nodes on screen: v31 (old look) vs v32 (painted). High preset.
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
// OLD and NEW are paths under http://localhost:8123/ (OLD: a copy of the previous build, e.g. previous/index.html)
const pages={old:process.env.OLD||'previous/index.html',new:process.env.NEW||'index.html'};const out={};
(async()=>{const br=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
 for(const [tag,url] of Object.entries(pages)){const p=await br.newPage({viewport:{width:1400,height:900}});
  await p.addInitScript(()=>{localStorage.setItem('lc_quality','high');localStorage.setItem('lc_hd','1');localStorage.setItem('lc_art','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_gl','0');});
  await p.goto('http://localhost:8123/'+url);await p.waitForTimeout(1200);
  out[tag]=await p.evaluate(()=>{const res={};
    const scene=(kind,N)=>{rnd=seeded(4);startGame('survival');rnd=Math.random;const G=window.__game();G.items=G.items.map(()=>9e6);G.webFree=true;G.countdown=1e9;
      const X=G.core.x+4,Y=G.core.y-12,W=40,H=26;
      for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++){const x=X+xx,y=Y+yy;if(!inMap(x,y))continue;const o=blockAt(x,y);if(o&&o!==G.core)removeBlock(o);const i=y*MW+x;G.terrain[i]=FLOOR;G.ore[i]=-1;if(!G.web[i])setWeb(i,1);}
      for(const bn of webBorn.values())bn.t=-99;let g=0;while((webQ.size||webBorn.size)&&g++<5000)webArtTick();
      let n=0;const kinds=kind==='mix'?['router','sorter','node','router','sorter']:[kind];const st=kind==='press'?2:1;
      for(let yy=0;yy<H&&n<N;yy+=(kind==='press'?2:1))for(let xx=0;xx<W&&n<N;xx+=st){const t=kinds[n%kinds.length];
        // checkerboard for 1x1 kinds keeps every one fed from the vines between them
        if(st===1&&(xx+yy)%2)continue;if(tryPlace(t,X+xx,Y+yy,0,true)){const b=blockAt(X+xx,Y+yy);b.built=1;if(t==='sorter')b.cfg=n%7;n++;}}
      // vines in the gaps, all carrying items, so routers and sorters are busy
      if(kind!=='press'&&kind!=='node')for(let yy=0;yy<H;yy++)for(let xx=0;xx<W;xx++)if((xx+yy)%2&&!blockAt(X+xx,Y+yy)){tryPlace('conveyor',X+xx,Y+yy,0,true);const b=blockAt(X+xx,Y+yy);if(b){b.built=1;b.belt.push({i:n%5,p:.3});}}
      if(kind==='press')for(const b of G.blocks.values())if(b.t==='press'){b.inv[COAL]=8;}
      for(let k=0;k<30;k++)step(1/60);
      cam.z=1.15;centerOn(X+W/2,Y+H/2);render();
      // only these structures, both passes, rasterised every time (getImageData forces the canvas to draw), minus an empty frame
      const K={router:1,sorter:1,node:1,press:1},L=[...G.blocks.values()].filter(b=>K[b.t]);
      const med=a=>a.sort((x,y)=>x-y)[a.length>>1];const r={placed:n};
      for(const z of [1.15,.6]){cam.z=z;centerOn(X+W/2,Y+H/2);render();
        const setT=()=>{ctx.setTransform(DPR*z,0,0,DPR*z,-cam.x*DPR*z,-cam.y*DPR*z);ctx.imageSmoothingEnabled=SET.hd;};
        const clear=()=>{ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#000';ctx.fillRect(0,0,cv.width,cv.height);};
        const draw=()=>{setT();for(const b of L)if(typeof drawArtUnder==='function')drawArtUnder(ctx,b,G.time);for(const b of L)drawBlock(ctx,b.t,b.x*T,b.y*T,b.rot,b,G.time,0);};
        const A=[],B0=[];for(let k=0;k<40;k++){step(1/60);let t0=performance.now();clear();ctx.getImageData(0,0,1,1);B0.push(performance.now()-t0);
          t0=performance.now();clear();draw();ctx.getImageData(0,0,1,1);A.push(performance.now()-t0);}
        r['z'+z]=+(med(A)-med(B0)).toFixed(2);}
      return r;};
    for(const kind of ['router','sorter','node','press','mix'])for(const N of (kind==='press'?[12,24,60,120]:[30,60,150,300])){res[kind+'@'+N]=scene(kind,N);}
    return res;});
  await p.close();}
 const rows=[];for(const k in out.old)rows.push({case:k,placed:out.new[k].placed,old_near:out.old[k]['z1.15'],new_near:out.new[k]['z1.15'],old_far:out.old[k]['z0.6'],new_far:out.new[k]['z0.6']});
 console.table(rows);fs.writeFileSync('operf_result.json',JSON.stringify(rows,null,1));await br.close();})();
