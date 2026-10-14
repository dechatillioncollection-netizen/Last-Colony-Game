const {chromium}=require(process.env.PW||'playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();
 await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','0')}catch(e){}});
 await p.goto('file://'+process.cwd()+'/index.html');await p.waitForTimeout(300);
 for(const mode of ['survival','siege'])for(let r=0;r<2;r++){const o=await p.evaluate((mode)=>{startGame(mode);const G=window.__game();G.core.hp=1e9;
   const cap=coreWebCap(),res={...G.res},out=[];
   for(let s=1;s<=600;s++){for(let k=0;k<30;k++){G.enemies.length=0;step(1/30);}if(s%60===0)out.push(s+'s:'+(100*G.webCount/N).toFixed(1)+'%');}
   let maxX=0;for(let i=0;i<N;i++)if(G.web[i])maxX=Math.max(maxX,i%MW);
   return {mode,cap,res,listLen:webList(G.core).length,maxX,MW,cover:out.join(' ')};},mode);console.log(JSON.stringify(o));}
 await b.close();})();
