// Runs art/source/paint_title.js inside the game page and saves art/title/. Start a web server on the repo root first
// (python3 -m http.server 8123); URL picks another address.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs'),path=require('path');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('lc_quality','high');}catch(e){}});
 await p.goto((process.env.URL||'http://localhost:8123/')+'index.html');await p.waitForTimeout(3500);
 const src=fs.readFileSync(path.join(__dirname,'paint_title.js'),'utf8');
 const out=await p.evaluate(s=>{startGame('survival');window.__game().paused=true;return eval(s);},src);
 const dir=process.argv[2]||path.join(__dirname,'../title');fs.mkdirSync(dir,{recursive:true});
 for(const [k,v] of Object.entries(out))fs.writeFileSync(path.join(dir,k),k.endsWith('.json')?v:Buffer.from(v.split(',')[1],'base64'));
 console.log(Object.keys(out).join(' '),errs);await br.close();})();
