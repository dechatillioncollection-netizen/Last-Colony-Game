// Deliverable captures for the living Rootweb.
const {chromium}=require(process.env.PW||'playwright');
(async()=>{const br=await chromium.launch();const errs=[];
 const open=async()=>{const p=await br.newPage({viewport:{width:1200,height:800}});p.on('pageerror',e=>errs.push(e.message));
   await p.addInitScript(()=>{try{localStorage.setItem('lc_hd','1');localStorage.setItem('lc_fog','0');localStorage.setItem('lc_art','1')}catch(e){}});
   await p.goto('http://localhost:8123/index.html');await p.waitForTimeout(900);
   await p.evaluate(()=>{const s=document.createElement('style');s.textContent='#hud,#top,.hud,#menu,#build,#info,#mini,#msg,#toast,#side,#bottom,#panel,#tip{visibility:hidden!important}';document.head.appendChild(s);
     window.__flush=()=>{for(const bn of webBorn.values())bn.t=-99;let g=0;while((webQ.size||webBorn.size)&&g++<5000)webArtTick();};});
   return p;};
 const hideUI=async p=>p.evaluate(()=>{for(const el of document.querySelectorAll('body > *:not(canvas)'))if(el.tagName!=='SCRIPT'&&el.tagName!=='STYLE')el.style.visibility='hidden';});
 let p=await open();await hideUI(p);
 // a colony: pods out at a little distance so their channels show, spitters, a Node and Bellows
 const sc=await p.evaluate(()=>{startGame('survival');const G=window.__game();G.countdown=1e9;G.items=G.items.map(v=>v+9000);const cx=G.core.x,cy=G.core.y;
   const put=(t,x,y)=>{for(let r=0;r<4;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){if(Math.max(Math.abs(dx),Math.abs(dy))!==r)continue;if(tryPlace(t,x+dx,y+dy,0,true))return true;}return false;};
   for(let k=0;k<30*25;k++)step(1/30);
   put('nest',cx+8,cy-3);put('nest',cx-6,cy+5);put('nest',cx+2,cy+8);put('duo',cx+3,cy-4);put('duo',cx-3,cy-3);put('duo',cx+6,cy+3);put('node',cx+12,cy+6);put('bellows',cx-8,cy-5);
   for(let k=0;k<30*30;k++)step(1/30);for(const b of G.blocks.values())b.built=1;G.paused=true;repaintAllWeb();__flush();
   // let the spitters have something to aim at so their feeder veins pulse
   return {cx,cy};});
 const view=async(z,x,y,f,wait=1600)=>{await p.evaluate(([z,x,y])=>{cam.z=z;centerOn(x,y);},[z,x,y]);await p.waitForTimeout(wait);await p.screenshot({path:f});};
 await p.evaluate(()=>{const G=window.__game();G.paused=false;G.countdown=1e9;});   // running, so the pulses move
 await view(1.25,sc.cx+2,sc.cy+1.5,'d_after.png',2500);
 await view(2.1,sc.cx+4.5,sc.cy+.5,'d_connect.png',2200);
 await view(2.6,sc.cx+5,sc.cy-1,'d_close.png',1500);
 await view(.55,sc.cx+2,sc.cy+1.5,'d_far.png',800);
 // the same scene with the older HD membrane under the same painted buildings
 await p.evaluate(()=>{window.__on=webArtOn;webArtOn=()=>false;repaintAllWeb();});
 await view(1.25,sc.cx+2,sc.cy+1.5,'d_before.png',600);await view(2.6,sc.cx+5,sc.cy-1,'d_before_close.png',400);
 await p.evaluate(()=>{webArtOn=window.__on;repaintAllWeb();__flush();});
 await p.close();
 // the expanding edge, in real time
 p=await open();await hideUI(p);
 const fr=await p.evaluate(()=>{startGame('survival');const G=window.__game();G.countdown=1e9;for(let k=0;k<30*12;k++)step(1/30);G.paused=true;repaintAllWeb();__flush();
   const L=webList(G.core);let nx=null;for(const i of L)if(!G.web[i]){nx=i;break;}const [cx,cy]=bCenter(G.core);const x=nx%MW,y=(nx/MW)|0;
   // look a little behind the front, towards the Bloom
   const dx=x+.5-cx,dy=y+.5-cy,l=Math.hypot(dx,dy);return {x:x+.5-dx/l*1.5,y:y+.5-dy/l*1.5};});
 await p.evaluate(([x,y])=>{cam.z=2.4;centerOn(x,y);const G=window.__game();G.paused=false;},[fr.x,fr.y]);
 for(let k=0;k<6;k++){await p.waitForTimeout(k?330:150);await p.screenshot({path:`d_grow${k}.png`});}
 await p.close();console.log(JSON.stringify(sc),errs);await br.close();})();
