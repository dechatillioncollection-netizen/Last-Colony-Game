// v59: renders the main menu's still pictures (art/menu/<scene>.jpg) from the live scenes themselves at High quality with the menu hidden,
// each at a moment it looks its best. Start a web server on the repo root (port 8123), then run node tests/stills59.js.
// SHOTS is where the full-size PNGs go. Needs Python with Pillow for the JPEG step.
const {chromium}=require(process.env.PW||'playwright');const {execFileSync}=require('child_process'),path=require('path'),fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/',SHOTS=process.env.SHOTS||'shots59';fs.mkdirSync(SHOTS,{recursive:true});
(async()=>{const br=await chromium.launch({args:['--use-gl=swiftshader']});
 for(const [i,id,secs] of [[0,'factory',14],[1,'frontier',11],[2,'assault',12],[3,'human',16]]){const ctx=await br.newContext({viewport:{width:1920,height:1080}});const p=await ctx.newPage();
  await p.addInitScript(i=>{localStorage.clear();localStorage.setItem('lc_quality','high');localStorage.setItem('lc_menuScene',String(i-1));},i);
  await p.goto(URL+'index.html');await p.waitForTimeout(1500);await p.evaluate(()=>{MMB.secs=1e9;});
  await p.addStyleTag({content:'#ovcard,#mmFoot,.mmvig{visibility:hidden!important}'});await p.waitForTimeout(secs*1000);
  const st=await p.evaluate(()=>({live:!!MD.G,id:MMS[MD.i]&&MMS[MD.i].id,units:MD.G&&MD.G.units.length,machines:MD.G&&MD.G.enemies.length}));console.log(id,JSON.stringify(st));
  const png=path.join(SHOTS,'still_'+id+'.png'),jpg=path.join(__dirname,'../art/menu',id+'.jpg');await p.screenshot({path:png});await ctx.close();
  execFileSync('python3',['-c','import sys;from PIL import Image;Image.open(sys.argv[1]).convert("RGB").save(sys.argv[2],quality=86,optimize=True,progressive=True)',png,jpg]);}
 await br.close();})();
