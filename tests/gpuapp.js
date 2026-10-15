// desktop-app GPU presets: with an Electron user agent every preset should draw the ground and Rootweb on the GPU; a normal browser keeps Low/Medium on the 2D painter
const {chromium}=require('/opt/node22/lib/node_modules/playwright');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});const out={};let fail=0;
 for(const ua of ['app','web']){
  const ctx=await br.newContext({viewport:{width:1280,height:800},userAgent:ua==='app'?'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) last-colony/1.0.0 Chrome/130.0.0.0 Electron/33.0.0 Safari/537.36':undefined});
  // lc_gl=2 lets the test use the software WebGL that headless Chromium has
  await ctx.addInitScript(()=>{try{localStorage.setItem('lc_gl','2');localStorage.setItem('lc_quality','low');}catch(e){}});
  const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.waitForTimeout(800);await p.click('#m-survival').catch(()=>{});await p.waitForTimeout(2500);
  out[ua]={APP:await p.evaluate(()=>APP)};
  for(const q of ['low','medium','high','epic']){await p.evaluate(q=>applyQuality(q),q);await p.waitForTimeout(1500);
    out[ua][q]=await p.evaluate(()=>({gl:SET.gl,glOn:glOn(),webGPU,art:SET.art,hd:SET.hd,note:document.getElementById('qgpu').textContent.slice(0,60),desc:QDESC[SET.q].slice(0,50)}));
    if(ua==='app'&&q==='low'||ua==='app'&&q==='medium')await p.screenshot({path:'gpu_app_'+q+'.png'});}
  out[ua].errs=errs;await ctx.close();}
 console.log(JSON.stringify(out,null,1));
 for(const q of ['low','medium','high','epic']){if(!out.app[q].webGPU){fail++;console.log('FAIL app',q,'not on GPU');}}
 for(const q of ['low','medium']){if(out.web[q].webGPU){fail++;console.log('FAIL web',q,'changed');}}
 for(const q of ['high','epic']){if(!out.web[q].webGPU){fail++;console.log('FAIL web',q,'lost GPU');}}
 if(out.app.errs.length||out.web.errs.length)fail++;
 console.log(fail?'GPU PRESET CHECKS FAILED':'GPU PRESET CHECKS PASS');await br.close();})();
