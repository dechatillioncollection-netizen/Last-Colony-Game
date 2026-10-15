const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
(async()=>{const br=await chromium.launch();const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 const src=fs.readFileSync(process.argv[2],'utf8');const out=await p.evaluate(s=>eval(s),src);
 const dir=process.argv[3];fs.mkdirSync(dir,{recursive:true});
 for(const [k,v] of Object.entries(out)){const f=dir+'/'+k+'.png';fs.mkdirSync(require('path').dirname(f),{recursive:true});fs.writeFileSync(f,Buffer.from(v.split(',')[1],'base64'));}
 console.log(Object.keys(out).join(' '),errs);await br.close();})();
