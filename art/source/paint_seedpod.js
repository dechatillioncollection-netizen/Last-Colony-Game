// Paints the Seed Pod layers at high resolution. Runs in a headless browser; each layer comes back as a PNG data URL.
// Every layer is a 256x256 transparent image covering the pod's 2x2 tile footprint exactly.
(()=>{
const S=256,CX=128,CY=124,DR=62; // dome centre and radius
let sd=91;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w=S,h=S)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};
// ---------- base: lily pads, fungal collar, roots, socket ----------
{const [cv,c]=mk();
  const sh=c.createRadialGradient(CX,CY+8,40,CX,CY+8,128);sh.addColorStop(0,'rgba(0,0,0,.55)');sh.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sh;c.fillRect(0,0,S,S);
  const pad=(x,y,r,rot,notch,c1,c2,c3)=>{c.save();c.translate(x,y);c.rotate(rot);
    c.beginPath();c.moveTo(0,0);c.arc(0,0,r,notch/2,Math.PI*2-notch/2);c.closePath();
    const g=c.createRadialGradient(-r*.2,-r*.25,r*.1,0,0,r);g.addColorStop(0,c1);g.addColorStop(.7,c2);g.addColorStop(1,c3);c.fillStyle=g;c.fill();
    c.save();c.clip();
    for(let k=0;k<26;k++){const a=notch/2+(Math.PI*2-notch)*(k+.5)/26;c.strokeStyle=`rgba(190,240,190,${.10+rnd()*.08})`;c.lineWidth=1.2;c.beginPath();c.moveTo(0,0);
      const mx=Math.cos(a+.08)*r*.55,my=Math.sin(a+.08)*r*.55;c.quadraticCurveTo(mx,my,Math.cos(a)*r,Math.sin(a)*r);c.stroke();}
    for(let k=0;k<900;k++){const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*r;c.fillStyle=rnd()<.5?'rgba(0,0,0,.08)':'rgba(200,255,210,.06)';c.fillRect(Math.cos(a)*rr,Math.sin(a)*rr,1.5,1.5);}
    for(let k=0;k<14;k++){const a=rnd()*Math.PI*2,rr=r*(.3+rnd()*.6);const wr=2+rnd()*4;const wg=c.createRadialGradient(Math.cos(a)*rr-wr*.3,Math.sin(a)*rr-wr*.3,0,Math.cos(a)*rr,Math.sin(a)*rr,wr);
      wg.addColorStop(0,'rgba(255,255,255,.7)');wg.addColorStop(.4,'rgba(200,255,230,.25)');wg.addColorStop(1,'rgba(200,255,230,0)');c.fillStyle=wg;c.beginPath();c.arc(Math.cos(a)*rr,Math.sin(a)*rr,wr,0,7);c.fill();}
    c.restore();
    c.lineWidth=2.5;c.strokeStyle='rgba(8,24,18,.85)';c.stroke();c.lineWidth=1.2;c.strokeStyle='rgba(170,110,220,.45)';c.beginPath();c.arc(0,0,r-2,notch/2+.1,Math.PI*2-notch/2-.1);c.stroke();
    c.strokeStyle='rgba(220,255,220,.28)';c.lineWidth=2;c.beginPath();c.arc(0,0,r-5,Math.PI*1.05,Math.PI*1.55);c.stroke();c.restore();};
  pad(206,48,46,2.4,.5,'#3f8a62','#255c45','#123428');pad(46,212,44,-.7,.55,'#3f8a62','#255c45','#123428');pad(214,214,34,.9,.6,'#4a9a6c','#2a6248','#143a2b');
  pad(CX,CY+2,112,-2.2,.42,'#3d8560','#22553f','#0f2c22');
  // roots reaching the middle of each edge, so vines arriving there look connected
  const root=(x2,y2)=>{c.lineCap='round';const ang=Math.atan2(y2-CY,x2-CX);
    for(const [w,col] of [[11,'rgba(20,8,26,.9)'],[8,'#5a2f6e'],[4,'#8a54a8']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(CX+Math.cos(ang)*60,CY+Math.sin(ang)*60);
      c.bezierCurveTo(CX+Math.cos(ang+.35)*85,CY+Math.sin(ang+.35)*85,x2-Math.cos(ang-.4)*22,y2-Math.sin(ang-.4)*22,x2,y2);c.stroke();}
    for(const f of [.45,.8]){const px=CX+(x2-CX)*f,py=CY+(y2-CY)*f;const g=c.createRadialGradient(px-1.5,py-1.5,0,px,py,7);g.addColorStop(0,'#f4e2ff');g.addColorStop(.5,'#b97be0');g.addColorStop(1,'rgba(120,60,170,0)');c.fillStyle=g;c.beginPath();c.arc(px,py,7,0,7);c.fill();}};
  root(CX,2);root(254,CY);root(CX,254);root(2,CY);
  // fungal frill collar
  for(let ring=0;ring<2;ring++)for(let k=0;k<34;k++){const a=k/34*Math.PI*2+ring*.09,rr=DR+8+ring*7+rnd()*3,x=CX+Math.cos(a)*rr,y=CY+Math.sin(a)*rr;
    c.save();c.translate(x,y);c.rotate(a);const g=c.createLinearGradient(-8,0,8,0);g.addColorStop(0,ring?'#3a1850':'#5a2878');g.addColorStop(1,ring?'#9a5cc8':'#d8a2ff');
    c.fillStyle=g;c.beginPath();c.ellipse(0,0,8-ring*2,6.5,0,0,7);c.fill();c.strokeStyle='rgba(20,6,30,.55)';c.lineWidth=1;c.stroke();c.restore();}
  // glowing water-fungus caps on the pads
  const shroom=(x,y,r)=>{const g=c.createRadialGradient(x,y,0,x,y,r*2.4);g.addColorStop(0,'rgba(210,140,255,.45)');g.addColorStop(1,'rgba(210,140,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r*2.4,0,7);c.fill();
    const cg=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);cg.addColorStop(0,'#fbeaff');cg.addColorStop(.45,'#c78af0');cg.addColorStop(1,'#5b2a7c');c.fillStyle=cg;c.beginPath();c.arc(x,y,r,0,7);c.fill();
    c.fillStyle='rgba(255,255,255,.85)';for(let k=0;k<4;k++){const a=rnd()*7;c.beginPath();c.arc(x+Math.cos(a)*r*.5,y+Math.sin(a)*r*.5,1.1,0,7);c.fill();}};
  shroom(36,40,8);shroom(52,26,5);shroom(222,168,6);shroom(30,170,5);shroom(176,226,6);
  // socket the dome sits in
  const so=c.createRadialGradient(CX,CY,DR-10,CX,CY,DR+6);so.addColorStop(0,'#05020a');so.addColorStop(.8,'#1c0b26');so.addColorStop(1,'rgba(28,11,38,0)');c.fillStyle=so;c.beginPath();c.arc(CX,CY,DR+6,0,7);c.fill();
  out.base=cv.toDataURL('image/png');}
// ---------- liquid: green-teal fluid with caustics and bubbles ----------
{const [cv,c]=mk();c.save();c.beginPath();c.arc(CX,CY,DR-2,0,7);c.clip();
  const g=c.createRadialGradient(CX-10,CY-14,4,CX,CY,DR);g.addColorStop(0,'rgba(140,250,170,.95)');g.addColorStop(.45,'rgba(50,170,120,.95)');g.addColorStop(.85,'rgba(18,80,78,.97)');g.addColorStop(1,'rgba(10,36,50,1)');
  c.fillStyle=g;c.fillRect(0,0,S,S);
  c.globalCompositeOperation='lighter';
  for(let k=0;k<70;k++){const x=CX+(rnd()-.5)*DR*1.8,y=CY+(rnd()-.5)*DR*1.8;c.strokeStyle=`rgba(170,255,200,${.04+rnd()*.07})`;c.lineWidth=1+rnd()*2;c.beginPath();c.moveTo(x,y);
    c.bezierCurveTo(x+(rnd()-.5)*30,y+(rnd()-.5)*30,x+(rnd()-.5)*30,y+(rnd()-.5)*30,x+(rnd()-.5)*40,y+(rnd()-.5)*40);c.stroke();}
  c.globalCompositeOperation='source-over';
  for(let k=0;k<26;k++){const a=rnd()*7,rr=Math.sqrt(rnd())*(DR-8),x=CX+Math.cos(a)*rr,y=CY+Math.sin(a)*rr,r=1+rnd()*2.6;c.strokeStyle='rgba(220,255,235,.55)';c.lineWidth=.9;c.beginPath();c.arc(x,y,r,0,7);c.stroke();c.fillStyle='rgba(255,255,255,.6)';c.fillRect(x-r*.5,y-r*.5,1,1);}
  const v=c.createRadialGradient(CX,CY,DR*.55,CX,CY,DR);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(4,14,24,.6)');c.fillStyle=v;c.fillRect(0,0,S,S);
  c.restore();out.liquid=cv.toDataURL('image/png');}
// ---------- seed: a single floating seed, drawn several times by the float animation ----------
{const [cv,c]=mk(64,64);const g=c.createRadialGradient(32,32,0,32,32,30);g.addColorStop(0,'rgba(210,255,150,.55)');g.addColorStop(1,'rgba(210,255,150,0)');c.fillStyle=g;c.fillRect(0,0,64,64);
  c.save();c.translate(32,32);c.rotate(-.5);const bg=c.createRadialGradient(-4,-6,1,0,0,15);bg.addColorStop(0,'#f8ffd8');bg.addColorStop(.5,'#a6e05a');bg.addColorStop(1,'#356e1e');c.fillStyle=bg;
  c.beginPath();c.ellipse(0,0,10,15,0,0,7);c.fill();c.strokeStyle='rgba(20,50,10,.6)';c.lineWidth=1.2;c.stroke();
  c.strokeStyle='rgba(60,120,30,.6)';c.beginPath();c.moveTo(0,-13);c.quadraticCurveTo(3,0,0,13);c.stroke();
  c.strokeStyle='#d9ff9a';c.lineWidth=2;c.lineCap='round';c.beginPath();c.moveTo(0,-14);c.quadraticCurveTo(6,-22,1,-25);c.stroke();
  c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(-4,-6,2.4,4,-.3,0,7);c.fill();c.restore();out.seed=cv.toDataURL('image/png');}
// ---------- membrane: glowing veins over the dome (pulses) ----------
{const [cv,c]=mk();c.save();c.beginPath();c.arc(CX,CY,DR-1,0,7);c.clip();
  const rg=c.createRadialGradient(CX,CY,DR*.6,CX,CY,DR);rg.addColorStop(0,'rgba(200,130,255,0)');rg.addColorStop(1,'rgba(200,130,255,.55)');c.fillStyle=rg;c.fillRect(0,0,S,S);
  c.shadowColor='rgba(220,160,255,.9)';c.shadowBlur=6;c.lineCap='round';
  const vein=(x,y,a,len,w,d)=>{if(d>3||len<6)return;const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;c.strokeStyle=`rgba(236,196,255,${.75-d*.12})`;c.lineWidth=w;c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo((x+x2)/2+Math.cos(a+1.57)*len*.18,(y+y2)/2+Math.sin(a+1.57)*len*.18,x2,y2);c.stroke();vein(x2,y2,a-.45-rnd()*.3,len*.62,w*.65,d+1);vein(x2,y2,a+.4+rnd()*.3,len*.58,w*.65,d+1);};
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2+rnd()*.2;vein(CX+Math.cos(a)*DR,CY+Math.sin(a)*DR,a+Math.PI+(rnd()-.5)*.3,24+rnd()*8,2.6,0);}
  c.restore();out.membrane=cv.toDataURL('image/png');}
// ---------- glass: pearl rim, fresnel edge and fixed specular ----------
{const [cv,c]=mk();
  const fr=c.createRadialGradient(CX,CY,DR*.55,CX,CY,DR);fr.addColorStop(0,'rgba(255,255,255,0)');fr.addColorStop(.85,'rgba(220,240,255,.10)');fr.addColorStop(1,'rgba(230,245,255,.38)');c.fillStyle=fr;c.beginPath();c.arc(CX,CY,DR,0,7);c.fill();
  for(const [w,col] of [[10,'rgba(18,6,26,.95)'],[7,'#6e3a8c'],[3.5,'#c99ae8'],[1.2,'rgba(255,240,255,.9)']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(CX,CY,DR+1,0,7);c.stroke();}
  for(let k=0;k<6;k++){const a=k/6*Math.PI*2+.3,x=CX+Math.cos(a)*(DR+1),y=CY+Math.sin(a)*(DR+1);const g=c.createRadialGradient(x-1,y-1,0,x,y,5);g.addColorStop(0,'#fff');g.addColorStop(.4,'#e3b8ff');g.addColorStop(1,'rgba(160,90,210,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,5,0,7);c.fill();}
  c.save();c.beginPath();c.arc(CX,CY,DR-3,0,7);c.clip();
  const sp=c.createLinearGradient(CX-40,CY-50,CX-5,CY-10);sp.addColorStop(0,'rgba(255,255,255,.75)');sp.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sp;
  c.beginPath();c.ellipse(CX-22,CY-28,30,13,-.75,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.ellipse(CX-34,CY-30,5,2.5,-.75,0,7);c.fill();c.beginPath();c.arc(CX+30,CY+34,2.2,0,7);c.fill();
  c.strokeStyle='rgba(255,255,255,.18)';c.lineWidth=3;c.beginPath();c.arc(CX,CY,DR-9,.2,1.3);c.stroke();
  c.restore();out.glass=cv.toDataURL('image/png');}
// ---------- highlight: a soft liquid sheen that drifts (shimmer) ----------
{const [cv,c]=mk();c.save();c.beginPath();c.arc(CX,CY,DR-6,0,7);c.clip();
  const g=c.createRadialGradient(CX+12,CY+16,2,CX+12,CY+16,34);g.addColorStop(0,'rgba(200,255,220,.55)');g.addColorStop(1,'rgba(200,255,220,0)');c.fillStyle=g;c.beginPath();c.ellipse(CX+12,CY+16,34,16,.6,0,7);c.fill();
  c.strokeStyle='rgba(230,255,240,.35)';c.lineWidth=2;for(let k=0;k<4;k++){c.beginPath();c.arc(CX+4,CY+4,22+k*9,.5+k*.08,1.25+k*.05);c.stroke();}
  c.restore();out.highlight=cv.toDataURL('image/png');}
window.__out=out;})();
