// Paints the Bloom layers. Runs in a headless browser; each layer comes back as a PNG data URL.
// Box layers are 896x896 and cover the Bloom's 3x3 footprint plus 2 tiles of margin on every side (7x7 tiles, 128 px per tile).
// The footprint is the centre 384x384. Petals, the core and the pulse are separate small sprites that the game places and animates.
(()=>{
const N=896,C=448,DR=132; // chamber centre and radius
let sd=4242;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w=N,h=N)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};
const glow=(c,x,y,r,rgb,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const drop=(c,x,y,r)=>{const g=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,'rgba(255,255,255,.75)');g.addColorStop(.45,'rgba(220,240,255,.22)');g.addColorStop(1,'rgba(220,240,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};

// ---------- root paths, shared with the game for the travelling pulses ----------
const ROOTS=[];
for(const [deg,bend,len,w] of [[12,.22,470,48],[68,-.18,440,42],[118,.2,500,50],[172,-.15,430,42],[218,.24,480,48],[268,-.2,450,42],[318,.18,490,48]]){
  const a=deg*Math.PI/180,r0=150,r1=Math.min(len,C/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))-10);
  const x0=C+Math.cos(a)*r0,y0=C+Math.sin(a)*r0,cx=C+Math.cos(a+bend)*(r0+r1)*.55,cy=C+Math.sin(a+bend)*(r0+r1)*.55,x1=C+Math.cos(a)*r1,y1=C+Math.sin(a)*r1;
  ROOTS.push([x0,y0,cx,cy,x1,y1,w]);}
const q=(R,t)=>{const u=1-t;return [u*u*R[0]+2*u*t*R[2]+t*t*R[4],u*u*R[1]+2*u*t*R[3]+t*t*R[5]];};

// ---------- roots: wet ground, thick fleshy roots reaching out into the Rootweb ----------
{const [cv,c]=mk();
  const sh=c.createRadialGradient(C,C+10,120,C,C+10,380);sh.addColorStop(0,'rgba(4,14,14,.6)');sh.addColorStop(.6,'rgba(6,20,20,.32)');sh.addColorStop(1,'rgba(6,20,20,0)');c.fillStyle=sh;c.fillRect(0,0,N,N);
  // a thin wet sheen on the ground
  c.strokeStyle='rgba(120,200,190,.08)';c.lineWidth=3;for(let k=0;k<5;k++){c.beginPath();c.arc(C,C,220+k*28,3.6+k*.2,4.4+k*.15);c.stroke();}
  for(const R of ROOTS){const w0=R[6],steps=90;
    // small side rootlets first so the main root covers their base
    for(let k=0;k<5;k++){const t=.35+k*.13,[px,py]=q(R,t),[qx,qy]=q(R,t+.02),a=Math.atan2(qy-py,qx-px)+(rnd()<.5?1:-1)*(.7+rnd()*.5),l=30+rnd()*40;
      c.lineCap='round';for(const [lw,col] of [[7,'rgba(16,6,22,.8)'],[4,'#5c3a66'],[1.5,'rgba(220,180,230,.35)']]){c.strokeStyle=col;c.lineWidth=lw*(1-t*.5);c.beginPath();c.moveTo(px,py);c.quadraticCurveTo(px+Math.cos(a+.3)*l*.6,py+Math.sin(a+.3)*l*.6,px+Math.cos(a)*l,py+Math.sin(a)*l);c.stroke();}}
    const pass=(fn)=>{for(let i=0;i<=steps;i++){const t=i/steps,[px,py]=q(R,t),fade=t>.72?1-(t-.72)/.28:1,w=w0*(1-t*.72)*(1+.08*Math.sin(t*40));fn(px,py,w,fade,t);}};
    pass((x,y,w,f)=>{c.fillStyle=`rgba(12,4,18,${.85*f})`;c.beginPath();c.arc(x+2,y+3,w/2+3,0,7);c.fill();});
    pass((x,y,w,f)=>{const g=c.createRadialGradient(x-w*.18,y-w*.22,0,x,y,w/2);g.addColorStop(0,`rgba(170,120,170,${f})`);g.addColorStop(.6,`rgba(102,62,112,${f})`);g.addColorStop(1,`rgba(52,26,64,${f})`);c.fillStyle=g;c.beginPath();c.arc(x,y,w/2,0,7);c.fill();});
    // wet highlight stripe on the lit side
    pass((x,y,w,f)=>{c.fillStyle=`rgba(240,215,250,${.22*f})`;c.beginPath();c.arc(x-w*.16,y-w*.18,w*.13,0,7);c.fill();});
    // ring creases and glowing nodules
    for(let i=4;i<steps*.9;i+=6+Math.floor(rnd()*4)){const t=i/steps,[px,py]=q(R,t),[qx,qy]=q(R,t+.01),a=Math.atan2(qy-py,qx-px)+Math.PI/2,w=w0*(1-t*.72),f=t>.72?1-(t-.72)/.28:1;
      c.strokeStyle=`rgba(30,10,40,${.35*f})`;c.lineWidth=1.6;c.beginPath();c.moveTo(px+Math.cos(a)*w*.45,py+Math.sin(a)*w*.45);c.quadraticCurveTo(px+Math.cos(a-1.3)*w*.2,py+Math.sin(a-1.3)*w*.2,px-Math.cos(a)*w*.45,py-Math.sin(a)*w*.45);c.stroke();}
    for(const t of [.3,.55,.78]){const [px,py]=q(R,t),r=5+w0*.12;glow(c,px,py,r*2.2,'150,230,170',.22);const g=c.createRadialGradient(px-1.5,py-1.5,0,px,py,r);g.addColorStop(0,'#f2fff0');g.addColorStop(.5,'#9fdcae');g.addColorStop(1,'rgba(80,150,110,0)');c.fillStyle=g;c.beginPath();c.arc(px,py,r,0,7);c.fill();}
    for(let k=0;k<6;k++){const [px,py]=q(R,.2+rnd()*.6);drop(c,px+(rnd()-.5)*w0*.4,py+(rnd()-.5)*w0*.4,2+rnd()*3);}
  }
  out.roots=cv.toDataURL('image/png');}

// ---------- petals: one sprite each, pointing down from the flower centre (top middle of the sprite) ----------
const petal=(W,L,base,mid,tip,rim,vein,seed)=>{const [cv,c]=mk(W,L);sd=seed;const hw=W/2-6;
  const shape=()=>{c.beginPath();c.moveTo(W/2,0);c.bezierCurveTo(W/2+hw*1.05,L*.28,W/2+hw*.92,L*.8,W/2,L-4);c.bezierCurveTo(W/2-hw*.92,L*.8,W/2-hw*1.05,L*.28,W/2,0);c.closePath();};
  shape();const g=c.createLinearGradient(0,0,0,L);g.addColorStop(0,base);g.addColorStop(.45,mid);g.addColorStop(1,tip);c.fillStyle=g;c.fill();
  c.save();shape();c.clip();
  // cross shading so the petal reads as a curved, fleshy surface
  const sg=c.createLinearGradient(W/2-hw,0,W/2+hw,0);sg.addColorStop(0,'rgba(10,0,20,.42)');sg.addColorStop(.35,'rgba(255,255,255,0)');sg.addColorStop(.55,'rgba(255,255,255,.06)');sg.addColorStop(1,'rgba(10,0,20,.5)');c.fillStyle=sg;c.fillRect(0,0,W,L);
  // veins fanning from the base
  for(let k=-6;k<=6;k++){const ex=W/2+k*hw*.15,a=.12+rnd()*.1;c.strokeStyle=k===0?`rgba(${vein},.5)`:`rgba(${vein},${a})`;c.lineWidth=k===0?2.4:1.1;
    c.beginPath();c.moveTo(W/2,L*.06);c.quadraticCurveTo(W/2+k*hw*.12,L*.45,ex,L*(.9-Math.abs(k)*.035));c.stroke();}
  // mottled bruise-like blotches near the base: organic, a little unsettling
  for(let k=0;k<40;k++){const y=L*(.08+rnd()*.4),x=W/2+(rnd()-.5)*hw*1.3*(y/L+.3),r=2+rnd()*7;c.fillStyle=`rgba(30,4,30,${.08+rnd()*.12})`;c.beginPath();c.ellipse(x,y,r,r*.7,rnd()*3,0,7);c.fill();}
  for(let k=0;k<500;k++){c.fillStyle=rnd()<.5?'rgba(0,0,0,.07)':'rgba(255,230,255,.05)';c.fillRect(rnd()*W,rnd()*L,1.5,1.5);}
  // wet specular streak along one side
  c.strokeStyle='rgba(255,245,255,.16)';c.lineWidth=9;c.beginPath();c.moveTo(W/2-hw*.42,L*.22);c.quadraticCurveTo(W/2-hw*.62,L*.55,W/2-hw*.3,L*.82);c.stroke();
  c.strokeStyle='rgba(255,250,255,.35)';c.lineWidth=2.5;c.beginPath();c.moveTo(W/2-hw*.42,L*.26);c.quadraticCurveTo(W/2-hw*.6,L*.55,W/2-hw*.32,L*.78);c.stroke();
  for(let k=0;k<7;k++)drop(c,W/2+(rnd()-.5)*hw*1.1,L*(.3+rnd()*.6),2.5+rnd()*4);
  c.restore();
  // translucent edges: thin the alpha in a band along the outline
  c.save();c.globalCompositeOperation='destination-out';shape();c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=22;c.stroke();c.strokeStyle='rgba(0,0,0,.35)';c.lineWidth=10;c.stroke();c.restore();
  shape();c.strokeStyle=`rgba(${rim},.55)`;c.lineWidth=2;c.stroke();c.strokeStyle='rgba(20,0,30,.35)';c.lineWidth=1;c.stroke();
  return cv.toDataURL('image/png');};
out.petal_outer=petal(176,340,'#24103a','#62348f','#a57fd6','226,200,255','214,180,255',7);
out.petal_inner=petal(146,262,'#2c0f36','#7a3a86','#d09ade','255,214,246','255,200,240',19);

// ---------- collar: fleshy fungal ring around the chamber, with glowing water-fungus caps ----------
{const [cv,c]=mk();sd=77;
  glow(c,C,C,200,'0,0,0',.55);
  // outer lobes
  for(let k=0;k<24;k++){const a=k/24*Math.PI*2+(rnd()-.5)*.14,rr=158+rnd()*16,x=C+Math.cos(a)*rr,y=C+Math.sin(a)*rr,rx=19+rnd()*14,ry=13+rnd()*8;
    c.save();c.translate(x,y);c.rotate(a);c.fillStyle='rgba(14,4,20,.8)';c.beginPath();c.ellipse(2,3,rx+2,ry+2,0,0,7);c.fill();
    const g=c.createRadialGradient(-rx*.3,-ry*.4,1,0,0,rx);g.addColorStop(0,'#b993b6');g.addColorStop(.55,'#7a5482');g.addColorStop(1,'#3a2244');c.fillStyle=g;c.beginPath();c.ellipse(0,0,rx,ry,0,0,7);c.fill();
    c.strokeStyle='rgba(30,10,40,.4)';c.lineWidth=1.2;for(let j=-3;j<=3;j++){c.beginPath();c.moveTo(-rx*.8,j*ry*.22);c.quadraticCurveTo(0,j*ry*.3,rx*.85,j*ry*.2);c.stroke();}
    c.fillStyle='rgba(255,240,255,.28)';c.beginPath();c.ellipse(-rx*.25,-ry*.4,rx*.35,ry*.16,0,0,7);c.fill();c.restore();}
  // inner frill
  for(let k=0;k<40;k++){const a=k/40*Math.PI*2,rr=DR+16,x=C+Math.cos(a)*rr,y=C+Math.sin(a)*rr;
    const e=.7+rnd()*.6,g=c.createRadialGradient(x-2,y-3,1,x,y,13*e);g.addColorStop(0,'#c9a6cc');g.addColorStop(.6,'#835a8c');g.addColorStop(1,'rgba(50,24,60,.9)');c.fillStyle=g;c.beginPath();c.ellipse(x,y,12*e,8*e,a+(rnd()-.5)*.4,0,7);c.fill();}
  // dark wet socket where the chamber sits
  c.fillStyle='#0d0712';c.beginPath();c.arc(C,C,DR+7,0,7);c.fill();
  c.strokeStyle='rgba(150,230,170,.22)';c.lineWidth=5;c.beginPath();c.arc(C,C,DR+4,0,7);c.stroke();
  // glowing water-fungus caps, in small clusters
  for(let k=0;k<9;k++){const a=k/9*Math.PI*2+.4+rnd()*.3,rr=178+rnd()*14;
    for(let j=0;j<3;j++){const x=C+Math.cos(a+j*.07)*(rr+j*7),y=C+Math.sin(a+j*.07)*(rr+j*7),r=6-j*1.4;
      glow(c,x,y,r*3,'140,240,190',.25);const g=c.createRadialGradient(x-1.5,y-1.5,0,x,y,r);g.addColorStop(0,'#f4fff4');g.addColorStop(.5,'#8fe0b4');g.addColorStop(1,'rgba(40,120,90,.85)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}}
  for(let k=0;k<30;k++){const a=rnd()*Math.PI*2,rr=150+rnd()*40;drop(c,C+Math.cos(a)*rr,C+Math.sin(a)*rr,2+rnd()*3.5);}
  out.collar=cv.toDataURL('image/png');}

// ---------- fluid: pale green, a little murky ----------
{const [cv,c]=mk();sd=5;c.save();c.beginPath();c.arc(C,C,DR,0,7);c.clip();
  const g=c.createRadialGradient(C-20,C-24,10,C,C,DR);g.addColorStop(0,'rgba(196,226,180,.95)');g.addColorStop(.55,'rgba(128,180,134,.96)');g.addColorStop(1,'rgba(40,86,70,.97)');c.fillStyle=g;c.fillRect(0,0,N,N);
  for(let k=0;k<22;k++){const a=rnd()*Math.PI*2,rr=rnd()*DR*.85,x=C+Math.cos(a)*rr,y=C+Math.sin(a)*rr;glow(c,x,y,20+rnd()*30,rnd()<.5?'60,110,80':'230,255,220',.12);}
  for(let k=0;k<160;k++){const a=rnd()*Math.PI*2,rr=Math.sqrt(rnd())*DR;c.fillStyle=`rgba(${rnd()<.6?'40,80,60':'240,255,230'},${.15+rnd()*.25})`;c.beginPath();c.arc(C+Math.cos(a)*rr,C+Math.sin(a)*rr,.8+rnd()*1.6,0,7);c.fill();}
  for(let k=0;k<10;k++){const a=rnd()*Math.PI*2,rr=rnd()*DR*.8,x=C+Math.cos(a)*rr,y=C+Math.sin(a)*rr,r=2+rnd()*5;c.strokeStyle='rgba(240,255,240,.4)';c.lineWidth=1;c.beginPath();c.arc(x,y,r,0,7);c.stroke();}
  const v=c.createRadialGradient(C,C,DR*.6,C,C,DR);v.addColorStop(0,'rgba(0,30,20,0)');v.addColorStop(1,'rgba(0,30,20,.45)');c.fillStyle=v;c.fillRect(0,0,N,N);
  c.restore();out.fluid=cv.toDataURL('image/png');}

// ---------- core: the suspended seed, with a translucent sac and trailing filaments ----------
{const W=200,[cv,c]=mk(W,W),x=W/2,y=W/2;sd=31;
  c.strokeStyle='rgba(220,240,200,.28)';c.lineWidth=1.2;for(let k=0;k<6;k++){const a=Math.PI/2+(k-2.5)*.28;c.beginPath();c.moveTo(x+Math.cos(a)*50,y+Math.sin(a)*60);
    c.bezierCurveTo(x+Math.cos(a)*70+(rnd()-.5)*30,y+Math.sin(a)*80,x+Math.cos(a)*80+(rnd()-.5)*40,y+88,x+Math.cos(a)*86+(rnd()-.5)*30,y+96);c.stroke();}
  const sac=c.createRadialGradient(x,y,40,x,y,80);sac.addColorStop(0,'rgba(230,255,220,0)');sac.addColorStop(.85,'rgba(230,255,220,.16)');sac.addColorStop(1,'rgba(230,255,220,0)');c.fillStyle=sac;c.beginPath();c.ellipse(x,y,74,84,0,0,7);c.fill();
  glow(c,x,y,70,'190,255,170',.35);
  c.fillStyle='rgba(20,40,20,.35)';c.beginPath();c.ellipse(x+5,y+7,46,58,0,0,7);c.fill();
  const g=c.createRadialGradient(x-14,y-20,4,x,y,58);g.addColorStop(0,'#fbf6dc');g.addColorStop(.5,'#cdd39a');g.addColorStop(1,'#66733f');c.fillStyle=g;c.beginPath();c.ellipse(x,y,44,56,0,0,7);c.fill();
  c.save();c.beginPath();c.ellipse(x,y,44,56,0,0,7);c.clip();
  c.strokeStyle='rgba(70,80,40,.45)';c.lineWidth=2;for(let k=0;k<7;k++){c.beginPath();c.moveTo(x-40,y-40+k*13);c.bezierCurveTo(x-15,y-48+k*14+rnd()*8,x+15,y-30+k*12-rnd()*8,x+42,y-38+k*13);c.stroke();}
  c.restore();
  // the germ: a dark slit that glows faintly green
  glow(c,x,y-30,20,'170,255,120',.45);c.fillStyle='#1d2a12';c.beginPath();c.ellipse(x,y-30,6,13,0,0,7);c.fill();c.fillStyle='rgba(200,255,150,.8)';c.beginPath();c.ellipse(x,y-31,1.6,8,0,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.55)';c.beginPath();c.ellipse(x-18,y-28,9,5,-.6,0,7);c.fill();
  out.core=cv.toDataURL('image/png');}

// ---------- membrane: veins across the chamber and a soft inner glow (pulses) ----------
{const [cv,c]=mk();sd=12;c.save();c.beginPath();c.arc(C,C,DR,0,7);c.clip();
  glow(c,C,C,DR,'160,255,170',.16);
  const vein=(x,y,a,len,w,d)=>{if(d>4||len<6)return;const x2=x+Math.cos(a)*len,y2=y+Math.sin(a)*len;c.strokeStyle=`rgba(230,150,255,${.55-d*.09})`;c.lineWidth=w;c.beginPath();c.moveTo(x,y);
    c.quadraticCurveTo((x+x2)/2+Math.cos(a+1.57)*len*.2,(y+y2)/2+Math.sin(a+1.57)*len*.2,x2,y2);c.stroke();vein(x2,y2,a-.5-rnd()*.3,len*.62,w*.65,d+1);vein(x2,y2,a+.45+rnd()*.3,len*.58,w*.65,d+1);};
  for(let k=0;k<12;k++){const a=k/12*Math.PI*2+rnd()*.2;vein(C+Math.cos(a)*DR,C+Math.sin(a)*DR,a+Math.PI+(rnd()-.5)*.3,46+rnd()*14,3.4,0);}
  c.restore();out.membrane=cv.toDataURL('image/png');}

// ---------- glass: wet membrane surface, fresnel edge, creases and a specular ----------
{const [cv,c]=mk();sd=3;
  const fr=c.createRadialGradient(C,C,DR*.55,C,C,DR);fr.addColorStop(0,'rgba(255,255,255,0)');fr.addColorStop(.85,'rgba(220,245,240,.08)');fr.addColorStop(1,'rgba(230,250,245,.32)');c.fillStyle=fr;c.beginPath();c.arc(C,C,DR,0,7);c.fill();
  for(let k=0;k<44;k++){const a=k/44*Math.PI*2+rnd()*.05,l=8+rnd()*14;c.strokeStyle='rgba(30,10,40,.25)';c.lineWidth=1.3;c.beginPath();c.moveTo(C+Math.cos(a)*DR,C+Math.sin(a)*DR);c.lineTo(C+Math.cos(a+.02)*(DR-l),C+Math.sin(a+.02)*(DR-l));c.stroke();}
  for(const [w,col] of [[7,'rgba(16,6,22,.9)'],[3.5,'#8a5c98'],[1.2,'rgba(240,220,250,.6)']]){c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.arc(C,C,DR+1,0,7);c.stroke();}
  c.save();c.beginPath();c.arc(C,C,DR-3,0,7);c.clip();
  const sp=c.createLinearGradient(C-80,C-90,C-15,C-25);sp.addColorStop(0,'rgba(255,255,255,.6)');sp.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=sp;c.beginPath();c.ellipse(C-44,C-52,58,22,-.75,0,7);c.fill();
  c.fillStyle='rgba(255,255,255,.85)';c.beginPath();c.ellipse(C-66,C-58,8,3.5,-.75,0,7);c.fill();c.beginPath();c.arc(C+58,C+64,3,0,7);c.fill();
  c.strokeStyle='rgba(255,255,255,.14)';c.lineWidth=5;c.beginPath();c.arc(C,C,DR-16,.2,1.3);c.stroke();
  c.restore();out.glass=cv.toDataURL('image/png');}

// ---------- highlight: soft drifting sheen ----------
{const [cv,c]=mk();c.save();c.beginPath();c.arc(C,C,DR-8,0,7);c.clip();
  const g=c.createRadialGradient(C+24,C+30,4,C+24,C+30,70);g.addColorStop(0,'rgba(220,255,225,.45)');g.addColorStop(1,'rgba(220,255,225,0)');c.fillStyle=g;c.beginPath();c.ellipse(C+24,C+30,70,30,.6,0,7);c.fill();
  c.strokeStyle='rgba(235,255,240,.28)';c.lineWidth=3;for(let k=0;k<4;k++){c.beginPath();c.arc(C+8,C+8,46+k*17,.5+k*.08,1.25+k*.05);c.stroke();}
  c.restore();out.highlight=cv.toDataURL('image/png');}

// ---------- stinger: the Bloom spits at enemies, so it keeps a thorn that turns to aim (points right at rest) ----------
{const [cv,c]=mk();const r0=DR+4,r1=DR+66;
  c.fillStyle='rgba(0,0,0,.45)';c.beginPath();c.moveTo(C+r0,C-9);c.quadraticCurveTo(C+r0+30,C-4,C+r1+3,C+4);c.quadraticCurveTo(C+r0+30,C+12,C+r0,C+13);c.fill();
  const g=c.createLinearGradient(0,C-10,0,C+10);g.addColorStop(0,'#eaffc0');g.addColorStop(.5,'#9bc46a');g.addColorStop(1,'#33561c');c.fillStyle=g;
  c.beginPath();c.moveTo(C+r0,C-11);c.quadraticCurveTo(C+r0+30,C-5,C+r1,C);c.quadraticCurveTo(C+r0+30,C+5,C+r0,C+11);c.closePath();c.fill();
  c.strokeStyle='rgba(20,40,10,.6)';c.lineWidth=1.5;c.stroke();c.strokeStyle='rgba(255,255,230,.5)';c.lineWidth=1.5;c.beginPath();c.moveTo(C+r0+4,C-6);c.quadraticCurveTo(C+r0+30,C-3,C+r1-6,C-.5);c.stroke();
  const b=c.createRadialGradient(C+r0,C,2,C+r0,C,16);b.addColorStop(0,'#c6a0c8');b.addColorStop(1,'#4a2a52');c.fillStyle=b;c.beginPath();c.ellipse(C+r0,C,10,15,0,0,7);c.fill();
  out.stinger=cv.toDataURL('image/png');}

// ---------- pulse: a small soft glow that travels along the roots ----------
{const [cv,c]=mk(64,64);glow(c,32,32,32,'190,255,200',.9);glow(c,32,32,10,'255,255,255',.7);out.pulse=cv.toDataURL('image/png');}

window.__out=out;window.__roots=ROOTS.map(R=>R.map((v,i)=>+(i<6?v/N:v/N).toFixed(4)));})();
