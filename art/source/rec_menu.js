// Records the main menu's background clips (art/menu/) from the real game. Builds each scene of art/source/menu_scenes.js in
// the game page, steps it at 30 frames a second on its own clock, draws each frame with the game's renderer and saves it, then
// encodes a looping WebM (VP9) and MP4 (H.264) and a still for each with ffmpeg. The last LOOP seconds are blended into the
// first, so each clip loops without a cut. v58: the clips have sound. The game's own mixer is built on an OfflineAudioContext whose clock
// the recorder moves with the frames, so every shot, impact, engine, organ bed and the ambience land on the frame that caused them; the
// sound is blended at the loop the same way as the picture and set to one loudness (LUFS) for all four clips.
//   node art/source/rec_menu.js [scene ...] [--stills] [--encode]   (a web server on the repo root first: python3 -m http.server 8123)
// --stills saves four frames per scene to art/menu/preview/ instead of recording; --encode re-encodes frames kept from an earlier
// recording (KEEP=1) without recording again. The frames are deleted after encoding unless KEEP=1.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs'),path=require('path'),{execFileSync}=require('child_process');
const URL=process.env.URL||'http://localhost:8123/',OUT=process.env.OUT||path.join(__dirname,'../menu'),FPS=30,LOOP=1.5,W=1920,H=1080;
const args=process.argv.slice(2),stills=args.includes('--stills'),encOnly=args.includes('--encode'),only=args.filter(a=>!a.startsWith('--'));
const SCENES=only.length?only:['factory','frontier','skirmish','human'];
// the Human Frontier's belts all move, so it needs a higher -crf to stay near the others' size
const CRF={human:'55'};const PRE=6,LUFS=-21;   // seconds of sound run before the clip so the ambience has settled; the clips' loudness
function encode(sc,secs){const dir=path.join(OUT,'frames_'+sc),wav=path.join(dir,'sound.wav'),hasA=fs.existsSync(wav);let aw=wav;
  if(hasA){const m=/I:\s+(-?[\d.]+) LUFS/.exec(require('child_process').spawnSync('ffmpeg',['-hide_banner','-nostats','-i',wav,'-af','ebur128','-f','null','-']).stderr.toString().split('Summary:')[1]||'');
    const gain=m?Math.min(12,LUFS-(+m[1])):0;aw=path.join(dir,'sound_n.wav');
    execFileSync('ffmpeg',['-y','-v','error','-i',wav,'-af',`volume=${gain.toFixed(2)}dB,alimiter=limit=0.89:level=false`,aw]);console.log(' ',sc,'sound',m?m[1]+' LUFS':'?','gain',gain.toFixed(1)+' dB');}
  const ain=hasA?['-i',aw]:[],amap=(c)=>hasA?['-map','1:a',...c,'-shortest']:['-an'];
  // the clip: frames from LOOP s to the end, with the last LOOP s blended into the first LOOP s
  const L=secs+LOOP,fc=`[0]split[a][b];[a]trim=${LOOP}:${L},setpts=PTS-STARTPTS[m];[b]trim=0:${LOOP},setpts=PTS-STARTPTS[h];[m][h]xfade=transition=fade:duration=${LOOP}:offset=${secs-LOOP},format=yuv420p[v]`;
  const inp=(sz)=>['-y','-v','error','-framerate',String(FPS),'-i',path.join(dir,'f%05d.jpg'),'-filter_complex',fc.replace('[v]',sz?`,scale=${sz}[v]`:'[v]'),...ain,'-map','[v]'];
  execFileSync('ffmpeg',[...inp(),'-c:v','libvpx-vp9','-b:v','0','-crf',process.env.CRF||CRF[sc]||'48','-row-mt','1','-deadline','good','-cpu-used','4','-g','90',...amap(['-c:a','libopus','-b:a','96k']),path.join(OUT,sc+'.webm')]);
  execFileSync('ffmpeg',[...inp('960:540'),'-c:v','libx264','-preset','slow','-crf','30','-profile:v','high','-movflags','+faststart','-g','90',...amap(['-c:a','aac','-b:a','128k']),path.join(OUT,sc+'.mp4')]);
  execFileSync('ffmpeg',['-y','-v','error','-i',path.join(dir,`f${String(Math.round(LOOP*FPS)+FPS*4).padStart(5,'0')}.jpg`),'-q:v','4',path.join(OUT,sc+'.jpg')]);
  if(!process.env.KEEP)fs.rmSync(dir,{recursive:true});
  for(const e of ['webm','mp4','jpg'])console.log(' ',sc+'.'+e,(fs.statSync(path.join(OUT,sc+'.'+e)).size/1024).toFixed(0)+' KB');}
(async()=>{const br=await chromium.launch();const src=fs.readFileSync(path.join(__dirname,'menu_scenes.js'),'utf8');
 for(const sc of SCENES){if(encOnly){encode(sc,30);continue;}const p=await br.newPage({viewport:{width:W,height:H}});const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.addInitScript(()=>{try{localStorage.clear();localStorage.setItem('lc_quality','epic');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_steady','0');}catch(e){}});
  await p.goto(URL+'index.html');await p.waitForTimeout(2500);
  const info=await p.evaluate(([s,sc,pre])=>{window.__PRE=pre;eval(s);applyQuality(MS[sc].quality||'epic');DYN.on=false;
    // no health bars: the game draws them as 3-unit-high strips in these colours; the clips show the world, not the interface
    const fr=ctx.fillRect,bar={'#000000':1,'#ee5a44':1,'#7fd06a':1};ctx.fillRect=function(x,y,w,h){if(h===3&&bar[this.fillStyle])return;return fr.call(this,x,y,w,h);};loop=()=>{};const r=MS[sc]();window.__sc=r;
    // the page's own loop draws the same frame again between ours; it never steps the demo, which stays paused
    window.__shot=(t,dt,grab)=>{const G=window.__game();if(window.__oc)window.__vt=__PRE+t;if(dt>0){r.tick(t,dt);step(dt);}const [x,y,z]=r.cam(t);cam.z=z;cam.x=x*T-VW/2/z;cam.y=y*T-VH/2/z;if(window.__stick&&dt>0)__stick(dt);if(!grab)return '';render();return cv.toDataURL('image/jpeg',.93);};
    return {name:r.name,secs:r.secs};},[src,sc,PRE]);
  // the game's mixer on an offline clock: a Proxy gives it the recorder's time, and sources started 'now' start at that time
  if(!stills)await p.evaluate(async([total,fps,pre])=>{const SR=44100,oc=new OfflineAudioContext(2,Math.ceil((total/fps+pre+1)*SR),SR);window.__vt=0;window.__oc=oc;
    const P=new Proxy(oc,{get(o,k){if(k==='currentTime')return __vt;if(k==='state')return 'running';if(k==='resume'||k==='suspend')return ()=>Promise.resolve();const v=o[k];return typeof v==='function'?v.bind(o):v;}});
    const AB=AudioBufferSourceNode.prototype,s0=AB.start,s1=AB.stop;AB.start=function(w,...a){return s0.call(this,w===undefined||w<__vt?__vt:w,...a);};AB.stop=function(w){return s1.call(this,w===undefined||w<__vt?__vt:w);};
    window.AudioContext=function(){return P;};window.webkitAudioContext=undefined;SND.ctx=null;SND.on=false;sndUnlock();
    for(let i=0;i<400&&!SND.ready;i++)await new Promise(r=>setTimeout(r,50));
    const tick=sndTick;window.__stick=(dt)=>{SND.voices=SND.voices.filter(v=>v.t0+v.src.buffer.duration/v.src.playbackRate.value>__vt);tick(dt);};
    // the ambience and beds settle before the clip starts, with the world held still
    for(let k=0;k<pre*10;k++){__vt=k/10;__stick(.1);}__vt=pre;return SND.ready;},[Math.round((info.secs+LOOP)*FPS),FPS,PRE]);
  const dir=path.join(OUT,stills?'preview':'frames_'+sc);fs.mkdirSync(dir,{recursive:true});
  const total=Math.round((info.secs+LOOP)*FPS),pick=stills?[0,Math.round(total/3),Math.round(total*2/3),total-1]:null;
  const t0=Date.now();
  for(let f=0;f<total;f++){const grab=!pick||pick.includes(f);const d=await p.evaluate(([f,fps,g])=>__shot(f/fps,f?1/fps:0,g),[f,FPS,grab]);
    if(grab)fs.writeFileSync(path.join(dir,stills?`${sc}_${f}.jpg`:`f${String(f).padStart(5,'0')}.jpg`),Buffer.from(d.split(',')[1],'base64'));
    if(f%150===0)console.log(sc,f,'/',total,((Date.now()-t0)/1000).toFixed(0)+'s');}
  const stat=await p.evaluate(()=>{const G=window.__game();return {units:G.units.length,enemies:G.enemies.filter(e=>!e.dead).length,blocks:G.blocks.size,bullets:G.bullets.length};});
  if(!stills){const b64=await p.evaluate(async([secs,loop,pre])=>{const buf=await __oc.startRendering(),SR=buf.sampleRate,n=Math.round(secs*SR),L=Math.round(loop*SR),o0=Math.round(pre*SR);
      // the clip's sound runs from LOOP s to the end, its last LOOP s blended into the first, exactly as the picture is
      const out=new DataView(new ArrayBuffer(44+n*4));const W=(o,str)=>{for(let i=0;i<str.length;i++)out.setUint8(o+i,str.charCodeAt(i));};
      W(0,'RIFF');out.setUint32(4,36+n*4,true);W(8,'WAVEfmt ');out.setUint32(16,16,true);out.setUint16(20,1,true);out.setUint16(22,2,true);out.setUint32(24,SR,true);out.setUint32(28,SR*4,true);out.setUint16(32,4,true);out.setUint16(34,16,true);W(36,'data');out.setUint32(40,n*4,true);
      for(let ch=0;ch<2;ch++){const d=buf.getChannelData(ch);for(let i=0;i<n;i++){let v=d[o0+L+i];const j=i-(n-L);if(j>=0){const a=j/L;v=v*(1-a)+d[o0+j]*a;}out.setInt16(44+i*4+ch*2,Math.max(-32768,Math.min(32767,Math.round(v*32767))),true);}}
      const u=new Uint8Array(out.buffer);let s='';for(let i=0;i<u.length;i+=0x8000)s+=String.fromCharCode.apply(null,u.subarray(i,i+0x8000));return btoa(s);},[info.secs,LOOP,PRE]);
    fs.writeFileSync(path.join(dir,'sound.wav'),Buffer.from(b64,'base64'));
    const st=await p.evaluate(()=>({played:SND.stats.played,by:SND.stats.by}));console.log(sc,'sounds played',st.played,JSON.stringify(st.by));}
  console.log(sc,info.name,JSON.stringify(stat),'errors',errs);await p.close();
  if(!stills)encode(sc,info.secs);}
 await br.close();})();
