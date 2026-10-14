const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1000,height:700}});
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1')}catch(e){}});
 await p.goto('http://localhost:8123/'+(process.argv[2]||'index.html'));await p.waitForTimeout(900);
 await p.evaluate((process_arg)=>{const n=25;Math.random=(()=>{let s=5;return()=>(s=(s*16807)%2147483647)/2147483647})();startGame('survival');const G=window.__game();G.webFree=true;G.items=G.items.map(v=>v+99999);G.countdown=1e9;G.paused=true;
     const cx=G.core.x,cy=G.core.y;let k=0;const cols=10;for(let i=0;k<n&&i<400;i++){const x=cx+6+(i%cols)*2,y=cy-10+Math.floor(i/cols)*2;if(tryPlace('duo',x,y,0,true))k++;}
     for(const b of G.blocks.values()){b.built=1;if(b.t==='duo')b.ammo[CU]=30;}
     G.enemies=[];for(let j=0;j<12;j++){G.enemies.push({t:'dagger',x:cx+30,y:cy-10+j*2,hp:1e6,max:1e6,boss:false,cd:9,think:9,target:null,tu:null,dead:false,ang:Math.PI,orbit:0,vx:0,vy:0});}
     cam.z=1;centerOn(cx+15,cy);if(process_arg==="nopat")webPat=null;if(process_arg==="z6")cam.z=.6;if(process_arg==="nomask"){webPat=null;wmctx.putImageData=()=>{};}for(let j=0;j<10;j++){step(1/30);render();}window.__G=G;},process.argv[3]||'');
 const cdp=await p.context().newCDPSession(p);await cdp.send('Profiler.enable');await cdp.send('Profiler.setSamplingInterval',{interval:100});await cdp.send('Profiler.start');
 const ms=await p.evaluate(()=>{const t=performance.now();for(let j=0;j<40;j++){step(1/30);render();}return (performance.now()-t)/40;});
 const {profile}=await cdp.send('Profiler.stop');const self={};const dt=profile.timeDeltas;const id2n={};for(const n of profile.nodes)id2n[n.id]=n;
 const par={};for(const n of profile.nodes)for(const c of (n.children||[]))par[c]=n.id;
 profile.samples.forEach((id,k)=>{let n=id2n[id];let key=n.callFrame.functionName+':'+n.callFrame.lineNumber;if(/putImageData|save/.test(n.callFrame.functionName)){let q=par[id],ch=[];for(let d=0;d<4&&q;d++){ch.push(id2n[q].callFrame.functionName+':'+id2n[q].callFrame.lineNumber);q=par[q];}key+=' <- '+ch.join(' <- ');}self[key]=(self[key]||0)+(dt[k]||0);});
 console.log('ms/frame',ms.toFixed(1),'web',await p.evaluate(()=>window.__G.webCount));console.log(Object.entries(self).sort((a,b)=>b[1]-a[1]).slice(0,14).map(([k,v])=>k+' '+(v/1000).toFixed(0)+'ms').join('\n'));await br.close();})();
