// v53, desktop resolution guard: after the frame the guard lowers the resolution in, is the canvas the player sees still drawn? (alpha of the centre pixel)
const {chromium}=require(process.env.PW||'playwright');const URL=process.env.URL||'http://localhost:8123/';
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1000,height:600}});
 p.on('pageerror',e=>console.log('ERR',e.message));
 await p.addInitScript(()=>{window.lcDesktop={version:'0.6.1',saves:{get:async()=>null,set:async()=>true,del:async()=>true}};try{localStorage.clear();}catch(e){}});
 await p.goto(URL+(process.env.F||'index.html'));await p.waitForTimeout(2000);
 const r=await p.evaluate(()=>new Promise(res=>{startTestRange();const G=window.__game();
   // make every frame look slow so the guard steps down once a second
   DYN.period=16.7;DYN.ema=60;DYN.cur=DYN.max;DYN.tick=0;const out=[];const w0=cv.width;
   const probe=()=>{const c=document.createElement('canvas');c.width=c.height=1;const x=c.getContext('2d');x.drawImage(cv,cv.width/2,cv.height/2,1,1,0,0,1,1);return x.getImageData(0,0,1,1).data[3];};
   let n=0;const tick=()=>{DYN.ema=60;DYN.work=50;out.push([cv.width,probe()]);if(++n<200)setTimeout(tick,16);else res({w0,out:out.filter((x,i)=>i===0||x[0]!==out[i-1][0]||x[1]===0)});};
   setTimeout(tick,16);}));
 const steps=r.out.filter(x=>x[0]!==r.w0),blank=r.out.filter(x=>x[1]===0);
 const ok=steps.length>0&&!blank.length;
 console.log(ok?'PASS':'FAIL','the resolution guard stepped down',steps.length,'times and left the screen blank',blank.length,'times',JSON.stringify(r));
 await br.close();process.exit(ok?0:1);})();
