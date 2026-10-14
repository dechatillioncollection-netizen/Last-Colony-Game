// Paints the Thorn Spitter layers. Runs in a headless browser; each layer comes back as a PNG data URL.
// Box layers are 256x256 and cover the 1x1 footprint plus half a tile of margin on every side (2x2 tiles, 128 px per tile).
// The footprint is the centre 128x128. The petal, thorn, ammo tips, pulse and spurt are small sprites the game places and animates.
// The weapon points right (+x) at rest. Each thorn sits 23 px (0.18 tile) to the side of the centre line, where the game spawns its shots.
(()=>{
const N=256,C=128,CR=24,LAT=23,TIP=62; // chamber radius, thorn side offset, thorn tip distance from the centre
let sd=1717;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w=N,h=N)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};
const glow=(c,x,y,r,rgb,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const drop=(c,x,y,r,a=.75)=>{const g=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.45,'rgba(220,240,255,.2)');g.addColorStop(1,'rgba(220,240,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const blob=(c,x,y,r,wob,n=28)=>{c.beginPath();const ph=rnd()*6;for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,rr=r*(1+wob*Math.sin(a*3+ph)+wob*.6*Math.sin(a*5+ph*2));i?c.lineTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr):c.moveTo(x+Math.cos(a)*rr,y+Math.sin(a)*rr);}c.closePath();};

// ---------- roots: a fleshy base growing out of the Rootweb, with short roots towards the neighbouring tiles ----------
const ROOTS=[];
for(const [deg,bend,len,w] of [[22,.16,88,26],[95,-.14,82,22],[158,.15,90,26],[218,-.16,84,22],[290,.14,88,24],[340,-.1,76,18]]){
  const a=deg*Math.PI/180,r0=34,x0=C+Math.cos(a)*r0,y0=C+Math.sin(a)*r0,x1=C+Math.cos(a)*len,y1=C+Math.sin(a)*len,
    cx=C+Math.cos(a+bend)*(r0+len)*.55,cy=C+Math.sin(a+bend)*(r0+len)*.55;ROOTS.push([x0,y0,cx,cy,x1,y1,w]);}
const q=(R,t)=>{const u=1-t;return [u*u*R[0]+2*u*t*R[2]+t*t*R[4],u*u*R[1]+2*u*t*R[3]+t*t*R[5]];};
{const [cv,c]=mk();
  const sh=c.createRadialGradient(C+3,C+5,20,C+3,C+5,100);sh.addColorStop(0,'rgba(4,10,14,.62)');sh.addColorStop(.55,'rgba(6,16,18,.3)');sh.addColorStop(1,'rgba(6,16,18,0)');c.fillStyle=sh;c.fillRect(0,0,N,N);
  for(const R of ROOTS){const w0=R[6],steps=60;
    for(let k=0;k<2;k++){const t=.35+k*.2,[px,py]=q(R,t),[qx,qy]=q(R,t+.03),a=Math.atan2(qy-py,qx-px)+(rnd()<.5?1:-1)*(.7+rnd()*.5),l=10+rnd()*12;
      c.lineCap='round';for(const [lw,col] of [[4,'rgba(14,5,20,.8)'],[2.2,'#57325f'],[.8,'rgba(220,180,230,.35)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+Math.cos(a+.3)*l*.6,py+Math.sin(a+.3)*l*.6,px+Math.cos(a)*l,py+Math.sin(a)*l);c.stroke();}}
    const pass=fn=>{for(let i=0;i<=steps;i++){const t=i/steps,[px,py]=q(R,t),fade=t>.35?Math.pow(1-(t-.35)/.65,1.6):1,w=w0*(1-t*.75)*(1+.06*Math.sin(t*24));fn(px,py,w,fade,t);}};
    pass((x,y,w,f)=>{c.fillStyle=`rgba(10,4,16,${.85*f})`;c.beginPath();c.arc(x+1,y+1.5,w/2+1.5,0,7);c.fill();});
    pass((x,y,w,f)=>{const g=c.createRadialGradient(x-w*.2,y-w*.25,0,x,y,w/2);g.addColorStop(0,`rgba(104,64,118,${f})`);g.addColorStop(.6,`rgba(66,32,80,${f})`);g.addColorStop(1,`rgba(36,14,46,${f})`);c.fillStyle=g;c.beginPath();c.arc(x,y,w/2,0,7);c.fill();});
    // a faint nutrient vein along the top of each root
    c.strokeStyle='rgba(140,240,210,.32)';c.lineWidth=1.3;c.beginPath();for(let i=0;i<=40;i++){const [px,py]=q(R,i/40*.85);i?c.lineTo(px-.6,py-.8):c.moveTo(px-.6,py-.8);}c.stroke();
    for(let k=0;k<4;k++){const [px,py]=q(R,.15+rnd()*.5);drop(c,px-2,py-2,2+rnd()*1.5,.5);}}
  // the fleshy base itself: an irregular wet mound
  c.fillStyle='rgba(10,4,16,.85)';blob(c,C+2,C+3,47,.06);c.fill();
  const g=c.createRadialGradient(C-14,C-16,6,C,C,48);g.addColorStop(0,'#7a4888');g.addColorStop(.45,'#4c2459');g.addColorStop(1,'#26102f');c.fillStyle=g;blob(c,C,C,45,.06);c.fill();
  c.save();blob(c,C,C,45,.06);c.clip();
  for(let k=0;k<700;k++){const a=rnd()*6.283,rr=Math.sqrt(rnd())*45;c.fillStyle=rnd()<.5?'rgba(0,0,0,.09)':'rgba(230,190,255,.06)';c.fillRect(C+Math.cos(a)*rr,C+Math.sin(a)*rr,1.4,1.4);}
  // fine glowing veins under the membrane, running from the roots towards the centre
  for(let k=0;k<12;k++){const a=k/12*6.283+rnd()*.3;c.strokeStyle=`rgba(140,240,210,${.18+rnd()*.12})`;c.lineWidth=1;c.beginPath();c.moveTo(C+Math.cos(a)*44,C+Math.sin(a)*44);
    c.quadraticCurveTo(C+Math.cos(a+.25)*30,C+Math.sin(a+.25)*30,C+Math.cos(a+.1)*20,C+Math.sin(a+.1)*20);c.stroke();}
  for(let k=0;k<10;k++){const a=rnd()*6.283,rr=22+rnd()*20;drop(c,C+Math.cos(a)*rr,C+Math.sin(a)*rr,1.5+rnd()*2.5,.55);}
  c.restore();
  c.strokeStyle='rgba(210,170,235,.25)';c.lineWidth=2;c.beginPath();c.arc(C,C,42,3.5,4.6);c.stroke();
  out.roots=cv.toDataURL('image/png');}

// ---------- petal: one small waterlily petal (points down from its base at the top edge); the game places five around the chamber ----------
{const W=96,H=120,[cv,c]=mk(W,H),m=W/2;
  const shape=()=>{c.beginPath();c.moveTo(m,4);c.bezierCurveTo(m+34,20,m+48,70,m+30,H-14);c.bezierCurveTo(m+18,H-2,m-18,H-2,m-30,H-14);c.bezierCurveTo(m-48,70,m-34,20,m,4);c.closePath();};
  c.save();c.translate(2,3);shape();c.fillStyle='rgba(8,2,14,.55)';c.fill();c.restore();
  shape();const g=c.createLinearGradient(0,0,0,H);g.addColorStop(0,'#170722');g.addColorStop(.4,'#3a1350');g.addColorStop(.8,'#5a2a7a');g.addColorStop(1,'#77449a');c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  const e=c.createRadialGradient(m,H*.55,10,m,H*.55,60);e.addColorStop(0,'rgba(0,0,0,0)');e.addColorStop(.75,'rgba(0,0,0,0)');e.addColorStop(1,'rgba(205,165,240,.6)');c.fillStyle=e;c.fillRect(0,0,W,H);
  for(let k=-3;k<=3;k++){c.strokeStyle=`rgba(220,190,245,${.16+(k===0?.14:0)})`;c.lineWidth=k===0?1.8:1.1;c.beginPath();c.moveTo(m,10);c.quadraticCurveTo(m+k*12,60,m+k*7,H-10);c.stroke();}
  for(let k=0;k<160;k++){c.fillStyle=rnd()<.5?'rgba(0,0,0,.1)':'rgba(240,210,255,.07)';c.fillRect(rnd()*W,rnd()*H,1.4,1.4);}
  drop(c,m-12,H*.5,5,.7);drop(c,m+10,H*.7,3.5,.6);drop(c,m-4,H*.82,2.5,.5);
  c.restore();
  shape();c.strokeStyle='rgba(225,195,250,.5)';c.lineWidth=2;c.stroke();
  out.petal=cv.toDataURL('image/png');}

// ---------- collar: a wet fleshy socket the chamber sits in (stationary) ----------
{const [cv,c]=mk();
  glow(c,C+2,C+3,CR+12,'6,2,12',.8);
  const g=c.createRadialGradient(C-6,C-8,CR-6,C,C,CR+8);g.addColorStop(0,'#2a1034');g.addColorStop(.6,'#40204e');g.addColorStop(1,'#1c0a24');c.fillStyle=g;blob(c,C,C,CR+7,.04,22);c.fill();
  c.strokeStyle='rgba(200,160,230,.35)';c.lineWidth=1.6;c.beginPath();c.arc(C,C,CR+5,3.4,4.8);c.stroke();
  for(let k=0;k<6;k++){const a=rnd()*6.283;drop(c,C+Math.cos(a)*(CR+4),C+Math.sin(a)*(CR+4),1.6,.5);}
  out.collar=cv.toDataURL('image/png');}

// ---------- fluid: pale turquoise liquid inside the pressure chamber ----------
{const [cv,c]=mk();
  c.save();c.beginPath();c.arc(C,C,CR,0,7);c.clip();
  const g=c.createRadialGradient(C-8,C-9,2,C,C,CR);g.addColorStop(0,'#c6f7e6');g.addColorStop(.35,'#7fdcc6');g.addColorStop(.8,'#2f9891');g.addColorStop(1,'#17555e');c.fillStyle=g;c.fillRect(0,0,N,N);
  // turbid swirls and suspended specks
  c.strokeStyle='rgba(20,90,90,.35)';c.lineWidth=3;c.beginPath();c.arc(C+4,C+6,15,.3,2.6);c.stroke();c.strokeStyle='rgba(220,255,240,.25)';c.lineWidth=2;c.beginPath();c.arc(C-3,C-2,11,3.6,5.4);c.stroke();
  for(let k=0;k<40;k++){const a=rnd()*6.283,rr=Math.sqrt(rnd())*CR*.9;c.fillStyle=`rgba(${rnd()<.6?'230,255,240':'30,90,80'},${.3+rnd()*.4})`;c.beginPath();c.arc(C+Math.cos(a)*rr,C+Math.sin(a)*rr,.8+rnd()*1.2,0,7);c.fill();}
  c.restore();out.fluid=cv.toDataURL('image/png');}

// ---------- channels: two narrow pressure channels from the chamber into the thorn bases (turn with the weapon) ----------
{const [cv,c]=mk();
  for(const s of [-1,1]){const path=()=>{c.beginPath();c.moveTo(C-4,C+s*3);c.quadraticCurveTo(C+4,C+s*16,C+16,C+s*LAT);};
    c.lineCap='round';path();c.strokeStyle='rgba(10,40,50,.55)';c.lineWidth=7;c.stroke();path();c.strokeStyle='rgba(60,150,150,.75)';c.lineWidth=4.5;c.stroke();
    path();c.strokeStyle='rgba(200,255,235,.75)';c.lineWidth=1.5;c.stroke();}
  glow(c,C-2,C,7,'210,255,240',.55);
  out.channels=cv.toDataURL('image/png');}

// ---------- membrane: the semi-transparent skin over the chamber ----------
{const [cv,c]=mk();
  c.save();c.beginPath();c.arc(C,C,CR,0,7);c.clip();
  const sh=c.createRadialGradient(C-8,C-10,CR*.4,C,C,CR);sh.addColorStop(0,'rgba(0,0,0,0)');sh.addColorStop(.7,'rgba(10,30,40,.1)');sh.addColorStop(1,'rgba(10,30,40,.5)');c.fillStyle=sh;c.fillRect(0,0,N,N);
  for(let k=0;k<7;k++){const a=k/7*6.283+.4;c.strokeStyle='rgba(110,50,140,.3)';c.lineWidth=1;c.beginPath();c.moveTo(C+Math.cos(a)*CR,C+Math.sin(a)*CR);c.quadraticCurveTo(C+Math.cos(a+.4)*CR*.7,C+Math.sin(a+.4)*CR*.7,C+Math.cos(a+.2)*CR*.45,C+Math.sin(a+.2)*CR*.45);c.stroke();}
  c.restore();
  c.strokeStyle='rgba(16,34,44,.75)';c.lineWidth=2.6;c.beginPath();c.arc(C,C,CR,0,7);c.stroke();
  c.strokeStyle='rgba(215,255,245,.28)';c.lineWidth=1.3;c.beginPath();c.arc(C,C,CR-2.4,0,7);c.stroke();
  c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(C,C,CR-6,3.55,4.45);c.stroke();
  drop(c,C-11,C-13,5,.9);drop(c,C+12,C+10,2.2,.45);
  out.membrane=cv.toDataURL('image/png');}

// ---------- highlight: a soft sheen that drifts over the liquid ----------
{const [cv,c]=mk();
  c.save();c.translate(C-6,C-4);c.rotate(-.6);c.scale(1.7,.8);glow(c,0,0,9,'235,255,250',.42);c.restore();
  out.highlight=cv.toDataURL('image/png');}

// ---------- thorn: one hollow, slightly curved hardened spine; the game draws it twice (mirrored) and turns it to aim ----------
// Sprite 64x32. Its axis runs along y=16; the base is at the left, the point at x=61.5 (the TIP distance from the box centre).
{const W=64,H=32,[cv,c]=mk(W,H),ay=x=>16+2.2*Math.sin(Math.PI*Math.min(1,x/60));
  const hw=x=>x<8?7.6:8*(1-Math.pow((x-8)/52,1.15))+.5; // half width
  const shape=(o=0)=>{c.beginPath();for(let x=2;x<=60;x+=1)c.lineTo(x,ay(x)-hw(x)-o);c.lineTo(61.5,ay(60));for(let x=60;x>=2;x-=1)c.lineTo(x,ay(x)+hw(x)+o);c.closePath();};
  c.save();c.translate(1.5,2);shape(.8);c.fillStyle='rgba(4,1,8,.7)';c.fill();c.restore();
  shape();const g=c.createLinearGradient(0,0,W,0);g.addColorStop(0,'#3a1448');g.addColorStop(.16,'#7a4a8c');g.addColorStop(.36,'#c9b2d4');g.addColorStop(.7,'#efe6ee');g.addColorStop(1,'#fffaf0');c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  const r=c.createLinearGradient(0,5,0,27);r.addColorStop(0,'rgba(40,10,50,.45)');r.addColorStop(.42,'rgba(255,255,255,0)');r.addColorStop(.58,'rgba(255,255,255,0)');r.addColorStop(1,'rgba(40,10,50,.5)');c.fillStyle=r;c.fillRect(0,0,W,H);
  for(const x of [9,14,20]){c.strokeStyle='rgba(30,6,38,.45)';c.lineWidth=1.1;c.beginPath();c.moveTo(x,ay(x)-9);c.quadraticCurveTo(x+1.8,ay(x),x,ay(x)+9);c.stroke();}
  c.restore();
  shape();c.strokeStyle='rgba(22,6,28,.9)';c.lineWidth=1.6;c.stroke();
  // wet ridge highlight along the spine
  c.strokeStyle='rgba(255,255,255,.75)';c.lineWidth=1.4;c.beginPath();for(let x=8;x<=50;x+=2)c.lineTo(x,ay(x)-hw(x)*.38);c.stroke();
  drop(c,30,ay(30)-2,2.6,.8);
  // the hollow opening near the tip, with a hard pale rim
  c.fillStyle='#fffaf0';c.beginPath();c.ellipse(54.5,ay(54.5),3.8,2.8,0,0,7);c.fill();
  c.fillStyle='#140716';c.beginPath();c.ellipse(54.9,ay(54.5),2.5,1.7,0,0,7);c.fill();
  // fleshy flare where the thorn grows out of the chamber
  const b=c.createRadialGradient(4,16,0,4,16,10);b.addColorStop(0,'rgba(96,52,110,.95)');b.addColorStop(1,'rgba(40,14,50,0)');c.fillStyle=b;c.beginPath();c.ellipse(4,16,7,10,0,0,7);c.fill();
  out.thorn=cv.toDataURL('image/png');}

// ---------- ammo tips: the loaded thorn just visible in each opening (copper, resin, chitin) ----------
for(const [k,body,lite,dark] of [['tip_copper','#b57a52','#ecb991','#4e2c1a'],['tip_resin','#e3a43a','#fff3c0','#7a4a10'],['tip_chitin','#3c3157','#d7cbf4','#151022']]){
  const W=16,H=12,[cv,c]=mk(W,H);
  c.beginPath();c.moveTo(1,6-3.2);c.lineTo(14.5,6);c.lineTo(1,6+3.2);c.closePath();c.fillStyle=body;c.fill();c.strokeStyle=dark;c.lineWidth=1;c.stroke();
  c.strokeStyle=lite;c.lineWidth=k==='tip_resin'?1.4:1;c.beginPath();c.moveTo(2,5);c.lineTo(12.5,5.8);c.stroke();
  if(k==='tip_resin')drop(c,4,4.5,2.2,.9);
  out[k]=cv.toDataURL('image/png');}

// ---------- pulse: a faint nutrient glow that travels inwards along the roots ----------
{const [cv,c]=mk(32,32);glow(c,16,16,16,'150,250,215',.85);glow(c,16,16,5,'240,255,250',.6);out.pulse=cv.toDataURL('image/png');}
// ---------- spurt: the pressure pulse, and the small wet mist at the opening when a thorn fires ----------
{const [cv,c]=mk(48,48);glow(c,24,24,24,'170,255,220',.55);glow(c,24,24,9,'235,255,245',.75);
  for(let k=0;k<7;k++){const a=rnd()*6.283,rr=8+rnd()*12;drop(c,24+Math.cos(a)*rr,24+Math.sin(a)*rr,1.4+rnd()*1.4,.7);}
  out.spurt=cv.toDataURL('image/png');}

window.__out=out;
// roots for the travelling pulses, reversed so the pulses run from each root tip in towards the weapon
window.__roots=ROOTS.map(R=>[R[4],R[5],R[2],R[3],R[0],R[1],R[6]].map(v=>+(v/N).toFixed(4)));})();
