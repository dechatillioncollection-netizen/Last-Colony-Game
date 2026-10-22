// Records the main menu's background clips (art/menu/) from the real game. Builds each scene of art/source/menu_scenes.js in
// the game page, steps it at 30 frames a second on its own clock, draws each frame with the game's renderer and saves it, then
// encodes a looping WebM (VP9) and MP4 (H.264) and a still for each with ffmpeg. The last LOOP seconds are blended into the
// first, so each clip loops without a cut.
//   node art/source/rec_menu.js [scene ...] [--stills] [--encode]   (a web server on the repo root first: python3 -m http.server 8123)
// --stills saves four frames per scene to art/menu/preview/ instead of recording; --encode re-encodes frames kept from an earlier
// recording (KEEP=1) without recording again. The frames are deleted after encoding unless KEEP=1.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const URL=process.env.URL||'http://localhost:8123/',OUT=process.env.OUT||path.join(__dirname,'../menu'),FPS=30,LOOP=1.5,W=1920,H=1080;
const args=process.argv.slice(2),stills=args.includes('--stills'),encOnly=args.includes('--encode'),only=args.filter(a=>!a.startsWith('--'));
const SCENES=only.length?only:['factory','frontier','skirmish','human'];
// the Human Frontier's belts all move, so it needs a higher -crf to stay near the others' size
const CRF={human:'55'};
function encode(sc,secs){const dir=path.join(OUT,'frames_'+sc);
  // the clip: frames from LOOP s to the end, with the last LOOP s blended into the first LOOP s
  const L=secs+LOOP,fc=`[0]split[a][b];[a]trim=${LOOP}:${L},setpts=PTS-STARTPTS[m];[b]trim=0:${LOOP},setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=${LOOP}:offset=${secs-LOOP},format=yuv420p[v]`;
  const inp=(sz)=>['-y','-v','error','-framerate',String(FPS),'-i',path.join(dir,'f%05d.jpg'),'-filter_complex',fc.replace('[v]',sz?`,scale=${sz}[v]`:'[v]'),'-map','[v]','-an'];
  execFileSync('ffmpeg',[...inp(),'-c:v','libvpx-vp9','-b:v','0','-crf',process.env.CRF||CRF[sc]||'48','-row-mt','1','-deadline','good','-cpu-used','4','-g','90',path.join(OUT,sc+'.webm')]);
  execFileSync('ffmpeg',[...inp('960:540'),'-c:v','libx264','-preset','slow','-crf','30','-profile:v','high','-movflags','+faststart','-g','90',path.join(OUT,sc+'.mp4')]);
  execFileSync('ffmpeg',['-y','-v','error','-i',path.join(dir,`f${String(Math.round(LOOP*FPS)+FPS*4).padStart(5,'0')}.jpg`),'-q:v','4',path.join(OUT,sc+'.jpg')]);
  if(!process.env.KEEP)fs.rmSync(dir,{recursive:true});
  for(const e of ['webm','mp4','jpg'])console.log(' ',sc+'.'+e,(fs.statSync(path.join(OUT,sc+'.'+e)).size/1024).toFixed(0)+' KB');}
(async()=>{const br=await chromium.launch();const src=fs.readFileSync(path.join(__dirname,'menu_scenes.js'),'utf8');
 for(const sc of SCENES){if(encOnly){encode(sc,30);continue;}const p=await br.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('lc_quality','epic');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_steady','0');}catch(e){}});
  await p.goto(URL+'index.html');await p.waitForTimeout(2500);
  const info=await p.evaluate(([s,sc])=>{eval(s);applyQuality(MS[sc].quality||'epic');DYN.on=false;
    // no health bars: the game draws them as 3-unit-high strips in these colours; the clips show the world, not the interface
    const fr=ctx.fillRect,bar={'#000000':1,'#ee5a44':1,'#7fd06a':1};ctx.fillRect=function(x,y,w,h){if(h===3&&bar[this.fillStyle])return;return fr.call(this,x,y,w,h);};const r=MS[sc]();window.__sc=r;
    // the page's own loop draws the same frame again between ours; it never steps the demo, which stays paused
    window.__shot=(t,dt,grab)=>{const G=window.__game();if(dt>0){r.tick(t,dt);step(dt);}const [x,y,z]=r.cam(t);cam.z=z;cam.x=x*T-VW/2/z;cam.y=y*T-VH/2/z;if(!grab)return '';render();return cv.toDataURL('image/jpeg',.93);};
    return {name:r.name,secs:r.secs};},[src,sc]);
  const dir=path.join(OUT,stills?'preview':'frames_'+sc);fs.mkdirSync(dir,{recursive:true});
  const total=Math.round((info.secs+LOOP)*FPS),pick=stills?[0,Math.round(total/3),Math.round(total*2/3),total-1]:null;
  const t0=Date.now();
  for(let f=0;f<total;f++){const grab=!pick||pick.includes(f);const d=await p.evaluate(([f,fps,g])=>__shot(f/fps,f?1/fps:0,g),[f,FPS,grab]);
    if(grab)fs.writeFileSync(path.join(dir,stills?`${sc}_${f}.jpg`:`f${String(f).padStart(5,'0')}.jpg`),Buffer.from(d.split(',')[1],'base64'));
    if(f%150===0)console.log(sc,f,'/',total,((Date.now()-t0)/1000).toFixed(0)+'s');}
  const stat=await p.evaluate(()=>{const G=window.__game();return {units:G.units.length,enemies:G.enemies.filter(e=>!e.dead).length,blocks:G.blocks.size,bullets:G.bullets.length};});
  console.log(sc,info.name,JSON.stringify(stat),'errors',errs);await p.close();
  if(!stills)encode(sc,info.secs);}
 await br.close();})();
