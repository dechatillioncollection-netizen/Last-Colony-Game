// Paints the Spore Flak, Seed Mortar, Sunlance and Brood Chamber layers (art/plant/spore-flak, seed-mortar, sunlance, brood-chamber). 128 px per tile.
(()=>{
const P=128,C=64,W=384;let K=192;
let sd=3701;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w=P,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};const put=(k,cv)=>out[k]=cv.toDataURL('image/png');
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const glow=(c,x,y,r,rgb,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const drop=(c,x,y,r,a=.75)=>{const g=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.45,'rgba(220,240,255,.2)');g.addColorStop(1,'rgba(220,240,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const blobPath=(c,x,y,rx,ry,wob,ph,n=48)=>{c.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,k=1+wob*Math.sin(a*3+ph)+wob*.6*Math.sin(a*5+ph*2);i?c.lineTo(x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k):c.moveTo(x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k);}c.closePath();};
const speck=(c,n,fx,a1=.1,a2=.07)=>{for(let k=0;k<n;k++){const [x,y]=fx();c.fillStyle=rnd()<.5?`rgba(0,0,0,${a1})`:`rgba(236,200,255,${a2})`;c.fillRect(x,y,1.5,1.5);}};
const NL=[];for(let i=0;i<64*64;i++)NL.push(rnd());
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),
  a=NL[(yi&63)*64+(xi&63)],b=NL[(yi&63)*64+((xi+1)&63)],c=NL[((yi+1)&63)*64+(xi&63)],d=NL[((yi+1)&63)*64+((xi+1)&63)];return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
// ---------- the Vine's vessel, per pixel (same as paint_vine.js / paint_organs.js) ----------
const RV=22*P/96;
function vessel(x,y,R,cy=C){const a=Math.abs(y-cy),d=a/R,n1=vn(x/16,y/16);
  if(d>1){const t=(a-R)/5.6;return [12,4,16,.42*Math.exp(-t*t)];}
  const nz=Math.sqrt(1-d*d),wall=sm(.6,.78,d),n3=vn(x/21+5,y/9);
  let wr=34+60*(nz*.55+n1*.3)+10*(n3-.5),wg=13+30*(nz*.55+n1*.3)-4*(n3-.5),wb=46+70*(nz*.55+n1*.3)-14*(n3-.5);
  const rimDark=.5+.5*sm(1,.85,d);wr*=rimDark;wg*=rimDark;wb*=rimDark;
  const q=Math.pow(Math.max(0,1-d/.7),2);let lr=24+34*q,lg=46+74*q,lb=22+24*q;
  let r=lr+(wr-lr)*wall,g=lg+(wg-lg)*wall,b=lb+(wb-lb)*wall,al=.76+.21*wall;
  const sp=Math.exp(-Math.pow((d-.86)/.05,2))*(.08+.42*sm(.45,.75,vn(x/12+3,y/40)));r+=150*sp;g+=118*sp;b+=192*sp;
  const ib=Math.exp(-Math.pow((d-.64)/.03,2))*.45;r+=110*ib;g+=74*ib;b+=140*ib;return [r,g,b,al];}
function chan(w,h,x0,x1,Rf,cy,fade=10){const [cv,c]=mk(w,h),img=c.createImageData(w,h),D=img.data;
  for(let y=0;y<h;y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(w,Math.ceil(x1));x++){const R=Rf(x+.5);let [r,g,b,a]=vessel(x+.5,y+.5,R,cy);a*=sm(x0,x0+fade,x+.5);if(a<=0)continue;
    const k=(y*w+x)*4;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=Math.min(255,a*255);}
  c.putImageData(img,0,0);return cv;}
function chanGlow(w,h,x0,x1,Rf,cy,rgb){const [cv,c]=mk(w,h),img=c.createImageData(w,h),D=img.data,[R0,G0,B0]=rgb;
  for(let y=0;y<h;y++)for(let x=Math.floor(x0);x<Math.ceil(x1);x++){const R=Rf(x+.5),d=Math.abs(y+.5-cy)/(R*.62);if(d>1)continue;const a=Math.pow(1-d*d,1.5)*sm(x0,x0+12,x+.5);
    const k=(y*w+x)*4;D[k]=R0;D[k+1]=G0;D[k+2]=B0;D[k+3]=a*200;}c.putImageData(img,0,0);return cv;}
function membrane(c,cx,cy,rx,ry,ph,tint,rim,veinCol,opts={}){
  c.save();blobPath(c,cx,cy,rx,ry,opts.wob??.035,ph);c.clip();
  const g=c.createRadialGradient(cx-rx*.25,cy-ry*.3,2,cx,cy,Math.max(rx,ry)*1.05);g.addColorStop(0,`rgba(${tint},${opts.a0??.1})`);g.addColorStop(.7,`rgba(${tint},${opts.a1??.18})`);g.addColorStop(.92,`rgba(${rim},.75)`);g.addColorStop(1,`rgba(${rim},.95)`);
  c.fillStyle=g;c.fillRect(cx-rx*1.2,cy-ry*1.2,rx*2.4,ry*2.4);
  for(let k=0;k<(opts.veins??9);k++){const a=k/(opts.veins??9)*6.283+rnd()*.4,r0=.98,r1=.45+rnd()*.25;c.strokeStyle=veinCol;c.lineWidth=1+rnd()*.8;c.beginPath();
    c.moveTo(cx+Math.cos(a)*rx*r0,cy+Math.sin(a)*ry*r0);c.quadraticCurveTo(cx+Math.cos(a+.3)*rx*.75,cy+Math.sin(a+.3)*ry*.75,cx+Math.cos(a+.15)*rx*r1,cy+Math.sin(a+.15)*ry*r1);c.stroke();
    const b=a+.2;c.lineWidth=.7;c.beginPath();c.moveTo(cx+Math.cos(b)*rx*.8,cy+Math.sin(b)*ry*.8);c.lineTo(cx+Math.cos(b+.25)*rx*.62,cy+Math.sin(b+.25)*ry*.62);c.stroke();}
  speck(c,opts.speck??220,()=>{const a=rnd()*6.283,r=Math.sqrt(rnd());return [cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r];});
  c.restore();
  c.strokeStyle='rgba(8,2,14,.6)';c.lineWidth=opts.rimW??1.8;blobPath(c,cx,cy,rx,ry,opts.wob??.035,ph);c.stroke();
  c.strokeStyle='rgba(236,206,255,.5)';c.lineWidth=1.6;c.beginPath();c.ellipse(cx,cy,rx*.84,ry*.84,0,Math.PI*1.08,Math.PI*1.55);c.stroke();}
function mound(c,cx,cy,rx,ry,ph,cols=['#6e3f80','#45215a','#22102c'],wob=.06){
  c.fillStyle='rgba(8,3,14,.75)';blobPath(c,cx+2,cy+3.5,rx+3,ry+3,wob,ph);c.fill();
  const g=c.createRadialGradient(cx-rx*.3,cy-ry*.35,3,cx,cy,Math.max(rx,ry));g.addColorStop(0,cols[0]);g.addColorStop(.5,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;blobPath(c,cx,cy,rx,ry,wob,ph);c.fill();
  c.save();blobPath(c,cx,cy,rx,ry,wob,ph);c.clip();speck(c,rx*ry*.5,()=>[cx+(rnd()*2-1)*rx,cy+(rnd()*2-1)*ry]);
  for(let k=0;k<10;k++){const a=rnd()*6.283,r=.4+rnd()*.5;drop(c,cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,1.4+rnd()*2,.42);}c.restore();}
const shadow=(c,cx,cy,r,a=.55)=>{const g=c.createRadialGradient(cx+3,cy+5,r*.3,cx+3,cy+5,r);g.addColorStop(0,`rgba(4,2,10,${a})`);g.addColorStop(1,'rgba(4,2,10,0)');c.fillStyle=g;c.beginPath();c.arc(cx+3,cy+5,r,0,7);c.fill();};
const pulseSprite=(rgb,core='255,255,255')=>{const [cv,c]=mk(48);const g=c.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,`rgba(${core},.95)`);g.addColorStop(.3,`rgba(${rgb},.7)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(0,0,48,48);return cv;};
const hair=(c,x0,y0,a,len,w,col='rgba(60,30,74,.8)')=>{c.lineCap='round';c.strokeStyle=col;c.lineWidth=w;c.beginPath();c.moveTo(x0,y0);
  const b=a+(rnd()-.5)*.9;c.quadraticCurveTo(x0+Math.cos(b)*len*.5,y0+Math.sin(b)*len*.5,x0+Math.cos(a)*len,y0+Math.sin(a)*len);c.stroke();};

// a root that tapers from w0 at (x0,y0) to w1 at its tip, bending through a control point: dark outline, violet body lit from the
// upper left, a pale vascular line down the middle and faint growth rings
function taper(c,x0,y0,cx1,cy1,x1,y1,w0,w1,o={}){
  const N=36,pts=[];for(let i=0;i<=N;i++){const t=i/N,v=1-t;pts.push([v*v*x0+2*v*t*cx1+t*t*x1,v*v*y0+2*v*t*cy1+t*t*y1,w0+(w1-w0)*Math.pow(t,o.pow??.9)]);}
  const nrm=i=>{const a=pts[Math.max(0,i-1)],b=pts[Math.min(N,i+1)],dx=b[0]-a[0],dy=b[1]-a[1],l=Math.hypot(dx,dy)||1;return [-dy/l,dx/l];};
  const outline=(k,dx=0,dy=0)=>{c.beginPath();for(let i=0;i<=N;i++){const [nx,ny]=nrm(i),p=pts[i],w=p[2]*k/2;i?c.lineTo(p[0]+nx*w+dx,p[1]+ny*w+dy):c.moveTo(p[0]+nx*w+dx,p[1]+ny*w+dy);}
    {const [nx,ny]=nrm(N),p=pts[N],an=Math.atan2(ny,nx);c.arc(p[0]+dx,p[1]+dy,p[2]*k/2,an,an-Math.PI,true);}
    for(let i=N;i>=0;i--){const [nx,ny]=nrm(i),p=pts[i],w=p[2]*k/2;c.lineTo(p[0]-nx*w+dx,p[1]-ny*w+dy);}
    {const [nx,ny]=nrm(0),p=pts[0],an=Math.atan2(ny,nx);c.arc(p[0]+dx,p[1]+dy,p[2]*k/2,an+Math.PI,an,true);}c.closePath();};
  c.fillStyle=o.shadow??'rgba(6,2,12,.55)';outline(1.12,2,3.5);c.fill();
  c.fillStyle=o.edge??'#1c0a26';outline(1.08);c.fill();
  const [a0,a1,a2]=o.cols??['#7a4896','#4e2668','#2c1240'];
  // body: three bands across the root, light on the upper-left side
  for(const [k,col,dx,dy] of [[.98,a2,0,0],[.74,a1,-.6,-.8],[.4,a0,-1.4,-1.8]]){c.fillStyle=col;outline(k,dx*w0/14,dy*w0/14);c.fill();}
  if(o.rings!==false){c.save();outline(1);c.clip();c.strokeStyle=o.ringCol??'rgba(10,3,18,.2)';
    for(let i=3;i<N-1;i+=o.ringStep??3){const [nx,ny]=nrm(i),p=pts[i],w=p[2]*.52;c.lineWidth=Math.max(.8,p[2]*.07);c.beginPath();c.moveTo(p[0]+nx*w,p[1]+ny*w);c.quadraticCurveTo(p[0]+(pts[i+1][0]-p[0])*.9,p[1]+(pts[i+1][1]-p[1])*.9,p[0]-nx*w,p[1]-ny*w);c.stroke();}
    c.restore();}
  // vascular line and a wet streak
  c.lineCap='round';
  for(const [lw,col] of [[o.vein??2.2,o.veinCol??'rgba(170,236,214,.30)'],[(o.vein??2.2)*.4,o.veinCore??'rgba(220,255,240,.38)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();
    for(let i=1;i<=N-3;i++){const p=pts[i];i>1?c.lineTo(p[0],p[1]):c.moveTo(p[0],p[1]);}c.stroke();}
  c.strokeStyle=o.streak??'rgba(240,214,255,.38)';c.lineWidth=Math.max(1,w0*.08);c.beginPath();
  for(let i=2;i<=N*.8;i++){const [nx,ny]=nrm(i),p=pts[i],w=p[2]*.3;const x=p[0]-Math.abs(nx)*w*Math.sign(nx||1)*0-nx*w,y=p[1]-ny*w;i>2?c.lineTo(x,y):c.moveTo(x,y);}c.stroke();
  return pts;}
// where a tendril digs into the ground: a dark wet pit with crumbs thrown up and fine root hairs gripping the surface
function pit(c,x,y,r,a){c.save();
  const g=c.createRadialGradient(x,y,0,x,y,r*1.6);g.addColorStop(0,'rgba(6,2,10,.85)');g.addColorStop(.55,'rgba(14,6,20,.5)');g.addColorStop(1,'rgba(14,6,20,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r*1.6,0,7);c.fill();
  for(let k=0;k<9;k++){const b=a+(rnd()-.5)*2.6,l=r*(1+rnd()*1.4);hair(c,x,y,b,l,.9+rnd()*.7,'rgba(70,36,86,.85)');hair(c,x,y,b,l*.9,.4,'rgba(210,180,236,.35)');}
  for(let k=0;k<7;k++){const b=rnd()*6.283,rr=r*(.9+rnd()*.7);c.fillStyle=rnd()<.5?'rgba(120,104,126,.6)':'rgba(40,30,44,.7)';c.beginPath();c.arc(x+Math.cos(b)*rr,y+Math.sin(b)*rr,.9+rnd()*1.6,0,7);c.fill();}
  c.restore();}
// a fine root net spreading past the footprint (drawn by the game under neighbouring growths)
function hairRoots(c,tips,len,w){for(const [a,r] of tips){const x=K+Math.cos(a)*r,y=K+Math.sin(a)*r;
  for(let k=0;k<4;k++){const b=a+(rnd()-.5)*1.3,l=len*(.5+rnd()*.7);for(const [lw,col] of [[w+2,'rgba(8,3,14,.45)'],[w,'rgba(66,32,82,.85)'],[w*.35,'rgba(210,176,236,.28)']]){c.lineCap='round';c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x,y);
      c.quadraticCurveTo(x+Math.cos(b+.4)*l*.5,y+Math.sin(b+.4)*l*.5,x+Math.cos(b)*l,y+Math.sin(b)*l);c.stroke();}
    const bx=x+Math.cos(b)*l,by=y+Math.sin(b)*l;for(let j=0;j<3;j++)hair(c,bx,by,b+(rnd()-.5)*1.6,6+rnd()*8,.7,'rgba(70,36,86,.7)');}}}
// a small irregular grain, pale grey with a darker rim; the game tints a copy per resource (copper, lead, coal, sand, titanium)
function grain(){const [cv,c]=mk(32);c.translate(16,16);const n=8,R=[];for(let i=0;i<n;i++)R.push(8+rnd()*5);
  const path=()=>{c.beginPath();for(let i=0;i<=n;i++){const a=i/n*6.283,r=R[i%n];i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();};
  path();const g=c.createRadialGradient(-3,-4,1,0,0,13);g.addColorStop(0,'#ffffff');g.addColorStop(.6,'#c8c8c8');g.addColorStop(1,'#7a7a7a');c.fillStyle=g;c.fill();
  c.strokeStyle='rgba(40,40,40,.7)';c.lineWidth=1.4;c.stroke();c.fillStyle='rgba(255,255,255,.8)';c.beginPath();c.arc(-3.5,-4,2.2,0,7);c.fill();return cv;}
function stub(R0){const Rf=x=>RV*(R0+(1-R0)*sm(10,P-6,x));return [chan(P,P,6,P,Rf,C,22),chanGlow(P,P,14,P,Rf,C,[200,240,226])];}

// the root crown seen from above: one fleshy silhouette with a buttress lobe flaring out towards each tendril, creased between
// the lobes, lit along their tops, wet and speckled
function crown(c,tips,R0,lobe,cols,o={}){const rad=a=>{let r=R0;for(const [t] of tips){const d=Math.atan2(Math.sin(a-t),Math.cos(a-t));r+=lobe*Math.exp(-Math.pow(d/(o.lw??.3),2));}return r*(1+.03*Math.sin(a*7+1));};
  const path=(k=1,dx=0,dy=0)=>{c.beginPath();for(let i=0;i<=120;i++){const a=i/120*6.283,r=rad(a)*k;i?c.lineTo(K+dx+Math.cos(a)*r,K+dy+Math.sin(a)*r):c.moveTo(K+dx+Math.cos(a)*r,K+dy+Math.sin(a)*r);}c.closePath();};
  c.fillStyle='rgba(6,2,12,.7)';path(1.04,3,5);c.fill();
  c.fillStyle=cols[3]??'#160620';path(1.02);c.fill();
  const g=c.createRadialGradient(K-R0*.35,K-R0*.4,4,K,K,R0+lobe);g.addColorStop(0,cols[0]);g.addColorStop(.5,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;path();c.fill();
  c.save();path();c.clip();
  // creases between the lobes
  for(let i=0;i<tips.length;i++){const a0=tips[i][0],a1=tips[(i+1)%tips.length][0];let m=(a0+a1)/2;if(a1<a0)m+=Math.PI;
    for(const [lw,col,off] of [[4,'rgba(8,2,14,.55)',0],[1.4,'rgba(230,200,250,.16)',.05]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(K+Math.cos(m+off)*(R0*.55),K+Math.sin(m+off)*(R0*.55));c.quadraticCurveTo(K+Math.cos(m+off+.08)*R0*.85,K+Math.sin(m+off+.08)*R0*.85,K+Math.cos(m+off)*(R0*1.2),K+Math.sin(m+off)*(R0*1.2));c.stroke();}}
  // the lobes' tops catch the light; growth rings across them
  for(const [a] of tips){const L0=R0*.5,L1=R0+lobe*.9;
    for(const [lw,col] of [[10,'rgba(160,110,190,.16)'],[3,'rgba(236,206,255,.22)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(K+Math.cos(a-.05)*L0,K+Math.sin(a-.05)*L0);c.lineTo(K+Math.cos(a-.03)*L1,K+Math.sin(a-.03)*L1);c.stroke();}
    for(let r=L0+8;r<L1;r+=o.ring??9){const w=.22*R0/r*1.6;c.strokeStyle='rgba(10,3,18,.26)';c.lineWidth=1.3;c.beginPath();c.arc(K,K,r,a-w,a+w);c.stroke();}}
  speck(c,R0*R0*1.4,()=>{const a=rnd()*6.283,r=Math.sqrt(rnd())*(R0+lobe);return [K+Math.cos(a)*r,K+Math.sin(a)*r];},.14,.08);
  for(let k=0;k<16;k++){const a=rnd()*6.283,r=R0*(.5+rnd()*.6);drop(c,K+Math.cos(a)*r,K+Math.sin(a)*r,1.4+rnd()*2.2,.4);}
  c.restore();
  c.strokeStyle='rgba(226,190,250,.28)';c.lineWidth=1.6;c.beginPath();for(let i=60;i<=100;i++){const a=i/120*6.283,r=rad(a)*.97;i>60?c.lineTo(K+Math.cos(a)*r,K+Math.sin(a)*r):c.moveTo(K+Math.cos(a)*r,K+Math.sin(a)*r);}c.stroke();}

const W2=256;
// a soft-edged blob of colour (no hard rim): mist, soot, heat
const haze=(c,x,y,rx,ry,stops)=>{c.save();c.translate(x,y);c.scale(1,ry/rx);const g=c.createRadialGradient(0,0,0,0,0,rx);for(const [o,col] of stops)g.addColorStop(o,col);c.fillStyle=g;c.beginPath();c.arc(0,0,rx,0,7);c.fill();c.restore();};
// a fleshy fold or lip, pointing outward from (x,y) at angle a (as round the Chitin Vat's opening)
function lip(c,x,y,a,w,h,cols){c.save();c.translate(x,y);c.rotate(a+Math.PI/2);
  const shape=()=>{c.beginPath();c.moveTo(-w/2,0);c.bezierCurveTo(-w/2,-h*.2,-w*.25,h*.9,0,h*.95);c.bezierCurveTo(w*.25,h*.9,w/2,-h*.2,w/2,0);c.quadraticCurveTo(0,-h*.5,-w/2,0);c.closePath();};
  c.fillStyle='rgba(6,2,10,.45)';c.save();c.translate(1,2);shape();c.fill();c.restore();
  shape();const g=c.createLinearGradient(0,-h*.4,0,h);g.addColorStop(0,cols[0]);g.addColorStop(.55,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;c.fill();
  c.strokeStyle='rgba(16,4,24,.75)';c.lineWidth=1.2;c.stroke();c.strokeStyle='rgba(255,226,236,.32)';c.lineWidth=.9;c.beginPath();c.moveTo(-w*.28,h*.2);c.quadraticCurveTo(0,h*.66,w*.28,h*.2);c.stroke();c.restore();}
// a vein that wanders from (x0,y0) towards angle a for len px, as a polyline
function wander(x0,y0,a,len,n=6,j=.16){const P0=[[x0,y0]];let x=x0,y=y0,b=a;for(let s=0;s<n;s++){b+=(rnd()-.5)*j;x+=Math.cos(b)*len/n;y+=Math.sin(b)*len/n;P0.push([x,y]);}return P0;}
function line(c,P0,lw,col){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.lineJoin='round';c.beginPath();c.moveTo(P0[0][0],P0[0][1]);for(let i=1;i<P0.length;i++)c.lineTo(P0[i][0],P0[i][1]);c.stroke();}

// =============================== the three walls: shared parts ===============================
// a rounded square (a superellipse, n about 3-4) with a slow organic wobble round its edge
function rsq(c,cx,cy,hw,hh,n,wob,ph,dx=0,dy=0,k=1){c.beginPath();for(let i=0;i<=160;i++){const a=i/160*6.283,ca=Math.cos(a),sa=Math.sin(a),
  r=1/Math.pow(Math.pow(Math.abs(ca),n)+Math.pow(Math.abs(sa),n),1/n),w=1+wob*Math.sin(a*5+ph)+wob*.7*Math.sin(a*9+ph*1.7)+wob*.4*Math.sin(a*14+ph*2.3);
  const x=cx+dx+ca*hw*r*w*k,y=cy+dy+sa*hh*r*w*k;i?c.lineTo(x,y):c.moveTo(x,y);}c.closePath();}
// bark grain: many short, slightly bent fibres running one way
function fibres(c,x0,y0,w,h,n,ang,lw,cols){c.lineCap='round';for(let k=0;k<n;k++){const x=x0+rnd()*w,y=y0+rnd()*h,l=8+rnd()*24,b=ang+(rnd()-.5)*.3,bend=(rnd()-.5)*5;
  c.strokeStyle=cols[k%cols.length];c.lineWidth=lw*(.6+rnd()*.8);c.beginPath();c.moveTo(x-Math.cos(b)*l/2,y-Math.sin(b)*l/2);
  c.quadraticCurveTo(x-Math.sin(b)*bend,y+Math.cos(b)*bend,x+Math.cos(b)*l/2,y+Math.sin(b)*l/2);c.stroke();}}
// a crease in the tissue: a dark groove with its upper lip catching the light
function seam(c,P0,w,dark='rgba(12,3,8,.72)',lit='rgba(255,222,232,.2)'){line(c,P0,w,dark);line(c,P0.map(([x,y])=>[x-.9,y-1.1]),Math.max(.7,w*.32),lit);}
// a crack that forks as it runs: returns every polyline so the same cracks can be lit again elsewhere
function crack(x,y,a,len,fork=2,j=.5){const out=[wander(x,y,a,len,6,j)];if(fork>0){const P0=out[0],m=P0[2+Math.floor(rnd()*3)];out.push(...crack(m[0],m[1],a+(rnd()<.5?-1:1)*(.5+rnd()*.5),len*.5,fork-1,j));}return out;}
// a torn gash: a long lens of raw wet tissue with a dark rim, its upper edge peeled back in pale flaps
function gash(c,x,y,a,len,wid,raw,flap){c.save();c.translate(x,y);c.rotate(a);
  const path=(k=1)=>{c.beginPath();c.moveTo(-len/2,0);c.bezierCurveTo(-len*.2,-wid*k,len*.2,-wid*k*.8,len/2,0);c.bezierCurveTo(len*.2,wid*k*.7,-len*.2,wid*k*.9,-len/2,0);c.closePath();};
  haze(c,0,0,len*.62,wid*2.6,[[0,'rgba(20,4,12,.5)'],[.6,'rgba(20,4,12,.22)'],[1,'rgba(20,4,12,0)']]);
  path(1.12);c.fillStyle='rgba(8,2,6,.9)';c.fill();
  path();const g=c.createLinearGradient(0,-wid,0,wid);g.addColorStop(0,raw[2]);g.addColorStop(.35,raw[1]);g.addColorStop(.7,raw[0]);g.addColorStop(1,raw[2]);c.fillStyle=g;c.fill();
  c.save();path();c.clip();for(let k=0;k<7;k++){c.strokeStyle='rgba(40,6,20,.35)';c.lineWidth=.9;c.beginPath();const u=(rnd()-.5)*len*.8;c.moveTo(u,-wid);c.lineTo(u+(rnd()-.5)*4,wid);c.stroke();}
    drop(c,-len*.12,-wid*.15,wid*.55,.7);drop(c,len*.2,wid*.1,wid*.3,.5);c.restore();
  // pale torn bark curling up along the top edge
  for(let k=0;k<5;k++){const u=-len*.36+k*len*.18+(rnd()-.5)*3,v=-wid*(.75-Math.abs(u)/len*.8);
    c.fillStyle=flap[1];c.beginPath();c.moveTo(u-4,v);c.quadraticCurveTo(u,v-5-rnd()*3,u+4,v);c.closePath();c.fill();c.strokeStyle=flap[0];c.lineWidth=.8;c.stroke();}
  c.restore();}
// a single bead of sap (the game shows one where the wall is actually hit)
function bead(rgb,dark){const [cv,c]=mk(48);c.fillStyle='rgba(6,2,6,.45)';c.beginPath();c.ellipse(25,28,13,12,0,0,7);c.fill();
  const g=c.createRadialGradient(20,19,1,24,24,14);g.addColorStop(0,`rgb(${rgb})`);g.addColorStop(.7,`rgb(${dark})`);g.addColorStop(1,'rgb(20,4,12)');c.fillStyle=g;
  c.beginPath();c.moveTo(24,8);c.bezierCurveTo(31,15,37,20,37,27);c.arc(24,27,13,0,Math.PI);c.bezierCurveTo(11,20,17,15,24,8);c.fill();
  drop(c,19,21,6,.85);c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.arc(18.5,20,1.8,0,7);c.fill();return cv;}
// a root that is the same thickness most of its way (the woven strands and the bundles between walls)
function strand(c,P,w,o){return taper(c,P[0][0],P[0][1],P[1][0],P[1][1],P[2][0],P[2][1],w,w*(o.end??.8),o);}
// the joining bundle: two strands twisting past each other on the shared edge, drawn from the tile's centre (x=0) to a quarter
// tile past its edge (x=96) and turned by the game to face each neighbouring wall. Both walls draw one, so the bundle reads whole.
function bridge(w,cols,o={}){const [cv,c]=mk(96,P);const off=o.off??13;
  haze(c,64,64,34,24,[[0,'rgba(6,2,10,.55)'],[1,'rgba(6,2,10,0)']]);
  strand(c,[[30,64-off],[64,64+off*.25],[98,64+off*.7]],w,{...o,end:.95,pow:1});
  strand(c,[[30,64+off],[64,64-off*.25],[98,64-off*.7]],w*.9,{...o,end:.95,pow:1});
  if(o.knot){mound(c,64,64,w*.7,w*.95,1.1,o.knot,.12);}
  return cv;}
// light caught along the upper-left rim of a body: its outline stroked, kept to the upper-left half
function rimLight(c,path,n,col,lw){c.save();c.beginPath();c.moveTo(0,0);c.lineTo(n*.92,0);c.lineTo(0,n*.92);c.closePath();c.clip();path();c.strokeStyle=col;c.lineWidth=lw;c.stroke();c.restore();}
const qpt=(S,t)=>{const v=1-t;return [v*v*S[0][0]+2*v*t*S[1][0]+t*t*S[2][0],v*v*S[0][1]+2*v*t*S[1][1]+t*t*S[2][1]];};
function cross(A,B2){let best=1e9,p=null;for(let i=0;i<=40;i++)for(let j=0;j<=40;j++){const a=qpt(A,i/40),b=qpt(B2,j/40),d=(a[0]-b[0])**2+(a[1]-b[1])**2;if(d<best){best=d;p=[(a[0]+b[0])/2,(a[1]+b[1])/2];}}return p;}
const BARK_RAW=['#b46e84','#7a3452','#2e0818'];

// shared: a soft dark wet gap (what shows through an opened gate) and a translucent window punched into a painted piece
const punch=(c,x,y,rx,ry,a)=>{c.save();c.globalCompositeOperation='destination-out';haze(c,x,y,rx,ry,[[0,`rgba(0,0,0,${a})`],[.7,`rgba(0,0,0,${a*.6})`],[1,'rgba(0,0,0,0)']]);c.restore();};
// fine nutrient veins branching out from (x,y) towards angle a
function veins(c,x,y,a,len,n,col=['rgba(150,236,200,.34)','rgba(220,255,236,.4)'],w=1.6){for(let k=0;k<n;k++){const b=a+(k-(n-1)/2)*.32+(rnd()-.5)*.15,P0=wander(x,y,b,len*(.7+rnd()*.4),6,.25);
  line(c,P0,w,col[0]);line(c,P0,w*.4,col[1]);const m=P0[2+Math.floor(rnd()*3)];const P1=wander(m[0],m[1],b+(rnd()<.5?-.7:.7),len*.35,4,.3);line(c,P1,w*.7,col[0]);}}
// striated muscle: a fan of pale strands from a base line, each with darker gaps between
function muscle(c,P0,P1,n,w,cols=['rgba(10,2,14,.45)','rgba(230,170,210,.34)','rgba(255,220,240,.22)']){c.lineCap='round';
  for(let k=0;k<n;k++){const t=(k+.5)/n,x0=P0[0][0]+(P0[1][0]-P0[0][0])*t,y0=P0[0][1]+(P0[1][1]-P0[0][1])*t,x1=P1[0][0]+(P1[1][0]-P1[0][0])*t,y1=P1[0][1]+(P1[1][1]-P1[0][1])*t,
    mx=(x0+x1)/2+(rnd()-.5)*4,my=(y0+y1)/2+(rnd()-.5)*4;
    for(const [lw,col] of [[w*1.5,cols[0]],[w,cols[1]],[w*.35,cols[2]]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(mx,my,x1,y1);c.stroke();}}}
// bark tissue filling a path, as on the Bark Wall: umber, grain running one way, creases, damp speckle, darker towards the edge
function barkFill(c,path,x0,y0,w,h,ang,cols=['#a07060','#6a4236','#34191c']){c.save();path();c.clip();
  const g=c.createRadialGradient(x0+w*.3,y0+h*.25,2,x0+w/2,y0+h/2,Math.max(w,h)*.75);g.addColorStop(0,cols[0]);g.addColorStop(.55,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;c.fillRect(x0-4,y0-4,w+8,h+8);
  fibres(c,x0,y0,w,h,Math.round(w*h/26),ang,1,['rgba(30,10,12,.34)','rgba(220,170,150,.13)','rgba(60,24,26,.3)']);
  for(let k=0;k<Math.max(2,w*h/1400);k++)seam(c,wander(x0+rnd()*w,y0+rnd()*h,ang+(rnd()-.5)*.5,10+rnd()*12,4,.4),1.6);
  speck(c,w*h/12,()=>[x0+rnd()*w,y0+rnd()*h],.12,.06);for(let k=0;k<w*h/900;k++)drop(c,x0+rnd()*w,y0+rnd()*h,1.1+rnd()*1.6,.36);c.restore();}

// shared by the four: violet root colours, a soft mend light and a wound pair cut into a round body
const ROOTV={cols:['#7c4a8a','#4c2660','#26102e'],edge:'#14061a',shadow:'rgba(6,2,10,.5)',vein:1.8,veinCol:'rgba(170,236,214,.14)',veinCore:'rgba(220,255,240,.16)',ringCol:'rgba(16,4,20,.22)',ringStep:3,streak:'rgba(240,214,250,.18)'};
const RAW=['#c06aa0','#7a2c62','#2a0620'];
function rootFan(c,cx,cy,n,r0,r1,w0,ph,o=ROOTV,jit=.5){for(let k=0;k<n;k++){const a=k/n*6.283+ph+(rnd()-.5)*.25,r2=r1*(.85+rnd()*.3),b=a+(rnd()-.5)*jit;
  taper(c,cx+Math.cos(a)*r0,cy+Math.sin(a)*r0,cx+Math.cos(b)*(r0+r2)/2,cy+Math.sin(b)*(r0+r2)/2,cx+Math.cos(a+(b-a)*.3)*r2,cy+Math.sin(a+(b-a)*.3)*r2,w0*(.85+rnd()*.3),w0*.28,o);
  pit(c,cx+Math.cos(a+(b-a)*.3)*r2,cy+Math.sin(a+(b-a)*.3)*r2,w0*.22,a);}}
function mendLayer(w,cx,cy,r){const [cv,c]=mk(w);haze(c,cx,cy,r,r,[[0,'rgba(180,255,170,.0)'],[.55,'rgba(170,250,150,.32)'],[.8,'rgba(150,240,140,.42)'],[1,'rgba(150,240,140,0)']]);
  for(let k=0;k<14;k++){const a=k/14*6.283;veins(c,cx+Math.cos(a)*r*.45,cy+Math.sin(a)*r*.45,a,r*.45,1,['rgba(170,255,150,.5)','rgba(230,255,220,.6)'],1.6);}return cv;}
function woundPair(D,w,cx,cy,r,s1,s2){
  {const [cv,c]=mk(w);sd=s1;for(let k=0;k<7;k++){const a=rnd()*6.283,rr=r*(.45+rnd()*.45);for(const P0 of crack(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,a+(rnd()-.5),r*.22+rnd()*r*.12,1)){line(c,P0,2.6,'rgba(10,2,8,.85)');line(c,P0.map(([x,y])=>[x-.7,y-.8]),.8,'rgba(255,214,230,.3)');}}
    for(let k=0;k<6;k++){const a=rnd()*6.283,rr=r*(.4+rnd()*.5);c.fillStyle='rgba(214,120,170,.75)';c.beginPath();c.arc(cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,1.8+rnd()*1.4,0,7);c.fill();}put(D+'wound1',cv);}
  {const [cv,c]=mk(w);sd=s2;for(let k=0;k<3;k++){const a=rnd()*6.283,rr=r*(.45+rnd()*.35);gash(c,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,a+1.4+(rnd()-.5)*.6,r*.42,r*.075,RAW,['rgba(30,6,30,.8)','#d6a0d0']);}
    for(let k=0;k<3;k++){const a=rnd()*6.283,rr=r*(.3+rnd()*.5);haze(c,cx+Math.cos(a)*rr,cy+Math.sin(a)*rr,r*.12,r*.08,[[0,'rgba(200,90,150,.55)'],[1,'rgba(200,90,150,0)']]);}put(D+'wound2',cv);}}
// a thick waterlily petal from radius r0 to r1 along angle a (drawn about cx,cy): dark violet body, translucent paler edge, veins
function lily(c,cx,cy,a,r0,r1,w,cols,o={}){c.save();c.translate(cx,cy);c.rotate(a);
  const path=(k=1)=>{c.beginPath();c.moveTo(r0,0);c.bezierCurveTo(r0+(r1-r0)*.25,-w*k,r0+(r1-r0)*.8,-w*.85*k,r1,-w*.05*k);c.quadraticCurveTo(r1+w*.12,0,r1,w*.05*k);c.bezierCurveTo(r0+(r1-r0)*.8,w*.85*k,r0+(r1-r0)*.25,w*k,r0,0);c.closePath();};
  c.fillStyle='rgba(6,2,10,.5)';c.save();c.translate(2,3.5);path(1.06);c.fill();c.restore();
  const g=c.createLinearGradient(r0,0,r1,0);g.addColorStop(0,cols[0]);g.addColorStop(.55,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;path();c.fill();
  c.save();path();c.clip();const gl=c.createLinearGradient(0,-w,0,w);gl.addColorStop(0,'rgba(255,235,255,.22)');gl.addColorStop(.4,'rgba(255,235,255,0)');gl.addColorStop(1,'rgba(10,2,16,.35)');c.fillStyle=gl;c.fillRect(r0,-w,r1-r0+w,2*w);
    for(let j=-3;j<=3;j++){c.strokeStyle=o.vein??'rgba(70,20,80,.38)';c.lineWidth=1;c.beginPath();c.moveTo(r0+3,0);c.quadraticCurveTo((r0+r1)/2,j*w*.3,r1-3,j*w*.1);c.stroke();}
    c.strokeStyle=o.mid??'rgba(200,250,220,.22)';c.lineWidth=1.4;c.beginPath();c.moveTo(r0+3,0);c.lineTo(r1-6,0);c.stroke();
    // a translucent paler rim
    c.strokeStyle=o.rim??'rgba(240,200,250,.4)';c.lineWidth=w*.28;path();c.stroke();
    speck(c,(r1-r0)*w*.18,()=>[r0+rnd()*(r1-r0),(rnd()*2-1)*w*.8],.1,.06);c.restore();
  c.strokeStyle='rgba(20,4,26,.7)';c.lineWidth=1.3;path();c.stroke();
  c.strokeStyle='rgba(255,236,255,.45)';c.lineWidth=1.1;c.beginPath();c.moveTo(r0+6,-w*.55);c.quadraticCurveTo((r0+r1)/2,-w*.98,r1-5,-w*.12);c.stroke();c.restore();}
// a hardened cellulose ridge: a pale bony crescent lying round the body at radius r, centred on angle a, half-width in radians h
function ridge(c,cx,cy,a,r,h,th,cols=['#efe2d2','#b6a090','#5e4a48']){const P0=[],P1=[];for(let i=0;i<=24;i++){const t=a-h+2*h*i/24,k=Math.sin(Math.PI*i/24);P0.push([cx+Math.cos(t)*(r+th*k*.5),cy+Math.sin(t)*(r+th*k*.5)]);P1.push([cx+Math.cos(t)*(r-th*k*.5),cy+Math.sin(t)*(r-th*k*.5)]);}
  const path=(dx=0,dy=0)=>{c.beginPath();P0.forEach(([x,y],i)=>i?c.lineTo(x+dx,y+dy):c.moveTo(x+dx,y+dy));for(let i=P1.length-1;i>=0;i--)c.lineTo(P1[i][0]+dx,P1[i][1]+dy);c.closePath();};
  c.fillStyle='rgba(6,2,10,.55)';path(2,3.5);c.fill();
  const g=c.createRadialGradient(cx+Math.cos(a)*(r+th*.5)-th*.4,cy+Math.sin(a)*(r+th*.5)-th*.5,1,cx+Math.cos(a)*r,cy+Math.sin(a)*r,th*2.2+r*h);g.addColorStop(0,cols[0]);g.addColorStop(.5,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;path();c.fill();
  c.save();path();c.clip();for(let k=0;k<7;k++){const t=a-h+2*h*(k+.5)/7;c.strokeStyle='rgba(60,40,40,.35)';c.lineWidth=1;c.beginPath();c.moveTo(cx+Math.cos(t)*(r-th*.6),cy+Math.sin(t)*(r-th*.6));c.lineTo(cx+Math.cos(t+.02)*(r+th*.6),cy+Math.sin(t+.02)*(r+th*.6));c.stroke();}
    speck(c,r*h*th*.4,()=>{const t=a-h+2*h*rnd(),rr=r+(rnd()-.5)*th;return [cx+Math.cos(t)*rr,cy+Math.sin(t)*rr];},.12,.1);c.restore();
  c.strokeStyle='rgba(30,16,20,.75)';c.lineWidth=1.2;path();c.stroke();
  c.strokeStyle='rgba(255,250,240,.55)';c.lineWidth=1;c.beginPath();P0.slice(3,-3).forEach(([x,y],i)=>i?c.lineTo(x-.5,y-.6):c.moveTo(x-.5,y-.6));c.stroke();}
// a translucent fluid sac (centre x,y, radii rx,ry): membrane rim, fluid gradient, suspended specks and a wet highlight
function sac(c,x,y,rx,ry,fl,rim,o={}){c.fillStyle='rgba(6,2,10,.5)';c.beginPath();c.ellipse(x+2,y+3.5,rx+2,ry+2,0,0,7);c.fill();
  const g=c.createRadialGradient(x-rx*.3,y-ry*.35,1,x,y,Math.max(rx,ry));const al=o.al??1;g.addColorStop(0,`rgba(${fl[0]},${.92*al})`);g.addColorStop(.55,`rgba(${fl[1]},${.82*al})`);g.addColorStop(.88,`rgba(${fl[2]},${.85*al})`);g.addColorStop(1,`rgba(${rim},.95)`);
  c.fillStyle=g;blobPath(c,x,y,rx,ry,.03,o.ph??1);c.fill();
  c.save();blobPath(c,x,y,rx,ry,.03,o.ph??1);c.clip();haze(c,x+rx*.15,y+ry*.45,rx*.9,ry*.45,[[0,`rgba(${fl[2]},.5)`],[1,`rgba(${fl[2]},0)`]]);
    for(let k=0;k<(o.dots??14);k++){const a=rnd()*6.283,r=Math.sqrt(rnd())*.8;c.fillStyle=o.dot??'rgba(250,255,220,.7)';c.beginPath();c.arc(x+Math.cos(a)*rx*r,y+Math.sin(a)*ry*r,(o.dotR??1.4)*(.6+rnd()*.8),0,7);c.fill();}
    for(let k=0;k<6;k++){const a=rnd()*6.283;c.strokeStyle=o.veinCol??'rgba(60,20,70,.3)';c.lineWidth=.9;c.beginPath();c.moveTo(x+Math.cos(a)*rx,y+Math.sin(a)*ry);c.quadraticCurveTo(x+Math.cos(a+.5)*rx*.5,y+Math.sin(a+.5)*ry*.5,x+Math.cos(a+.9)*rx*.25,y+Math.sin(a+.9)*ry*.25);c.stroke();}c.restore();
  c.strokeStyle='rgba(20,4,26,.8)';c.lineWidth=o.rimW??1.8;blobPath(c,x,y,rx,ry,.03,o.ph??1);c.stroke();
  c.strokeStyle='rgba(255,255,255,.5)';c.lineWidth=Math.max(1,rx*.08);c.lineCap='round';c.beginPath();c.ellipse(x,y,rx*.72,ry*.72,0,Math.PI*1.1,Math.PI*1.45);c.stroke();
  drop(c,x-rx*.35,y-ry*.4,Math.max(2,rx*.22),.75);}
const W4=512;

// =============================== Spore Flak (art/plant/spore-flak/) ===============================
// a pressurised dispersal organ for shooting down flyers: a broad rooted violet foundation, thick protective petals, a crown of
// pale hardened ridges round a well where five translucent spore sacs feed a raised launching neck. The neck leans and its mouth
// opens upward-forward (painted aiming along +x; the game turns it to the real aim). 2x2 in a 384x384 box (centre 192,192).
{K=192;const D='spore-flak/';
  {const [cv,c]=mk(W);sd=5101;haze(c,K+3,K+6,170,170,[[0,'rgba(10,4,14,.5)'],[.6,'rgba(10,4,14,.3)'],[1,'rgba(10,4,14,0)']]);
    rootFan(c,K,K,9,100,166,22,.2);for(let k=0;k<12;k++){const a=k/12*6.283+.1;veins(c,K+Math.cos(a)*104,K+Math.sin(a)*104,a,44,1,['rgba(150,236,200,.2)','rgba(220,255,236,.24)'],1.5);}put(D+'roots',cv);}
  {const [cv,c]=mk(W);sd=5102;shadow(c,K,K+3,128,.55);mound(c,K,K+4,112,106,.7,['#8a4c9c','#542466','#24102e'],.05);
    // thick protective petals round the rim, then the crown of hardened ridges between them
    for(let k=0;k<7;k++)lily(c,K,K+2,k/7*6.283+.15,52,118,26,['#3a1446','#7a3c8c','#c890d4']);
    for(let k=0;k<7;k++)ridge(c,K,K+2,k/7*6.283+.15+Math.PI/7,70,.36,15);
    // the well the sacs sit in
    haze(c,K,K,74,74,[[0,'rgba(12,3,16,.85)'],[.75,'rgba(20,6,26,.65)'],[1,'rgba(20,6,26,0)']]);
    c.strokeStyle='rgba(230,200,240,.25)';c.lineWidth=2;c.beginPath();c.arc(K,K,62,Math.PI*1.05,Math.PI*1.6);c.stroke();put(D+'base',cv);}
  // one pressurised spore sac (drawn five times round the neck): yellow-green spore fluid, spores suspended, violet rim
  {const [cv,c]=mk(96);sd=5103;sac(c,48,48,26,30,['236,250,180','190,220,110','92,120,50'],'60,24,70',{dots:24,dot:'rgba(255,255,230,.8)',dotR:1.6});
    for(let k=0;k<3;k++){c.strokeStyle='rgba(70,24,80,.45)';c.lineWidth=1.4;c.beginPath();c.ellipse(48,48,26-k*7,30-k*8,0,Math.PI*.15,Math.PI*.85);c.stroke();}put(D+'sac',cv);}
  // the launching neck, leaning along +x: a muscular stalk rising from the middle to a flared mouth with a hardened rim
  {const [cv,c]=mk(W);sd=5104;const MX=K+30,MY=K,MRX=19,MRY=24;
    c.fillStyle='rgba(6,2,10,.55)';c.beginPath();c.ellipse(K+16,K+6,44,34,0,0,7);c.fill();
    // the stalk: a fleshy column from the centre towards the mouth
    const stalk=(k=1,dx=0,dy=0)=>{c.beginPath();c.moveTo(K-30*k+dx,K-20*k+dy);c.bezierCurveTo(K-6+dx,K-34*k+dy,MX-6+dx,MY-MRY*k+dy,MX+dx,MY-MRY*k+dy);c.lineTo(MX+dx,MY+MRY*k+dy);c.bezierCurveTo(MX-6+dx,MY+MRY*k+dy,K-6+dx,K+34*k+dy,K-30*k+dx,K+20*k+dy);c.quadraticCurveTo(K-40*k+dx,K+dy,K-30*k+dx,K-20*k+dy);c.closePath();};
    c.fillStyle='#1a0822';stalk(1.06);c.fill();
    const g=c.createLinearGradient(K-30,K-30,MX,MY+30);g.addColorStop(0,'#a466b4');g.addColorStop(.45,'#663078');g.addColorStop(1,'#2a1034');c.fillStyle=g;stalk();c.fill();
    c.save();stalk();c.clip();muscle(c,[[K-34,K-18],[K-34,K+18]],[[MX,MY-MRY],[MX,MY+MRY]],9,2.2);
      for(let k=0;k<3;k++){c.strokeStyle='rgba(150,236,200,.3)';c.lineWidth=1.6;c.beginPath();c.moveTo(K-28,K-12+k*12);c.quadraticCurveTo(K,K-14+k*14,MX-4,MY-12+k*12);c.stroke();}
      speck(c,500,()=>[K-40+rnd()*80,K-36+rnd()*72],.1,.07);c.restore();
    c.strokeStyle='rgba(255,230,255,.4)';c.lineWidth=1.6;c.beginPath();c.moveTo(K-26,K-22);c.bezierCurveTo(K-6,K-33,MX-8,MY-MRY+1,MX-1,MY-MRY+2);c.stroke();
    // the flared mouth seen from above, with a reinforced pale cellulose rim and dark throat
    c.fillStyle='rgba(6,2,10,.5)';c.beginPath();c.ellipse(MX+3,MY+3,MRX+5,MRY+5,0,0,7);c.fill();
    const rg=c.createRadialGradient(MX-6,MY-8,2,MX,MY,MRY+5);rg.addColorStop(0,'#f2e6d6');rg.addColorStop(.6,'#b8a090');rg.addColorStop(1,'#5a4048');c.fillStyle=rg;c.beginPath();c.ellipse(MX,MY,MRX+5,MRY+5,0,0,7);c.fill();
    for(let k=0;k<14;k++){const a=k/14*6.283;c.strokeStyle='rgba(70,46,50,.45)';c.lineWidth=1.1;c.beginPath();c.moveTo(MX+Math.cos(a)*MRX*.95,MY+Math.sin(a)*MRY*.95);c.lineTo(MX+Math.cos(a)*(MRX+5),MY+Math.sin(a)*(MRY+5));c.stroke();}
    const tg=c.createRadialGradient(MX,MY,1,MX,MY,MRY);tg.addColorStop(0,'#0a0208');tg.addColorStop(.6,'#24082a');tg.addColorStop(1,'#4a1a52');c.fillStyle=tg;c.beginPath();c.ellipse(MX,MY,MRX,MRY,0,0,7);c.fill();
    for(let k=0;k<9;k++){const a=rnd()*6.283,r=rnd()*.6;glow(c,MX+Math.cos(a)*MRX*r,MY+Math.sin(a)*MRY*r,3,'220,250,150',.6);}
    c.strokeStyle='rgba(30,16,22,.8)';c.lineWidth=1.4;c.beginPath();c.ellipse(MX,MY,MRX+5,MRY+5,0,0,7);c.stroke();
    c.strokeStyle='rgba(255,250,240,.6)';c.lineWidth=1.2;c.beginPath();c.ellipse(MX,MY,MRX+3,MRY+3,0,Math.PI*1.05,Math.PI*1.6);c.stroke();
    put(D+'neck',cv);}
  // the launch membrane stretched over the throat: translucent violet with radial folds; it contracts when the organ fires
  {const [cv,c]=mk(W);const MX=K+30,MY=K;c.save();c.beginPath();c.ellipse(MX,MY,19,24,0,0,7);c.clip();
    const g=c.createRadialGradient(MX,MY,1,MX,MY,24);g.addColorStop(0,'rgba(60,16,70,.35)');g.addColorStop(.6,'rgba(140,70,160,.55)');g.addColorStop(1,'rgba(200,140,220,.7)');c.fillStyle=g;c.fillRect(MX-24,MY-26,48,52);
    for(let k=0;k<12;k++){const a=k/12*6.283;c.strokeStyle='rgba(40,8,50,.45)';c.lineWidth=1.2;c.beginPath();c.moveTo(MX,MY);c.lineTo(MX+Math.cos(a)*20,MY+Math.sin(a)*25);c.stroke();
      c.strokeStyle='rgba(240,200,250,.25)';c.lineWidth=.8;c.beginPath();c.moveTo(MX+Math.cos(a+.13)*4,MY+Math.sin(a+.13)*5);c.lineTo(MX+Math.cos(a+.13)*19,MY+Math.sin(a+.13)*24);c.stroke();}
    c.restore();c.fillStyle='rgba(16,4,20,.85)';c.beginPath();c.ellipse(MX,MY,3.5,4.5,0,0,7);c.fill();drop(c,MX-7,MY-9,4,.6);put(D+'iris',cv);}
  // feeding veins from the sacs into the neck (added with a light blend; brighter while it pressurises)
  {const [cv,c]=mk(W);sd=5105;for(let k=0;k<5;k++){const a=k/5*6.283+.6;veins(c,K+Math.cos(a)*50,K+Math.sin(a)*50,a+Math.PI,34,1,['rgba(200,250,120,.55)','rgba(250,255,210,.65)'],1.8);}
    for(let k=0;k<7;k++){const a=k/7*6.283+.15+Math.PI/7;veins(c,K+Math.cos(a)*70,K+Math.sin(a)*70,a,40,1,['rgba(180,240,120,.35)','rgba(240,255,210,.4)'],1.4);}put(D+'veins',cv);}
  // the discharge: a puff of pale spores and sap mist thrown out of the mouth
  {const [cv,c]=mk(96);sd=5106;haze(c,48,48,44,44,[[0,'rgba(236,250,190,.75)'],[.4,'rgba(200,236,140,.38)'],[1,'rgba(200,236,140,0)']]);
    for(let k=0;k<26;k++){const a=rnd()*6.283,r=6+rnd()*34;c.fillStyle=`rgba(${230+rnd()*25|0},255,${170+rnd()*60|0},${.6+rnd()*.35})`;c.beginPath();c.arc(48+Math.cos(a)*r,48+Math.sin(a)*r,1.4+rnd()*2.4,0,7);c.fill();}put(D+'puff',cv);}
  // the projectile: a tight cluster of pressurised spores, each a pale yellow-green ball with a dark rim, in a faint haze
  {const [cv,c]=mk(40);sd=5107;haze(c,20,20,19,19,[[0,'rgba(220,255,150,.55)'],[.5,'rgba(200,250,120,.22)'],[1,'rgba(200,250,120,0)']]);
    for(const [x,y,r] of [[20,20,5.2],[13,16,3.8],[27,15,3.6],[14,26,3.6],[27,26,4],[20,10,3],[20,30,3]]){c.fillStyle='rgba(30,40,10,.85)';c.beginPath();c.arc(x,y,r+1,0,7);c.fill();
      const g=c.createRadialGradient(x-r*.35,y-r*.35,.5,x,y,r);g.addColorStop(0,'#fbffe0');g.addColorStop(.5,'#cdf07a');g.addColorStop(1,'#6a9a2c');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}put(D+'spore',cv);}
  // a cluster bursting in the air: spores flung out in a ring with a soft cloud (the game scales and fades it)
  {const [cv,c]=mk(96);sd=5108;haze(c,48,48,46,46,[[0,'rgba(220,250,160,.35)'],[.6,'rgba(190,236,120,.18)'],[1,'rgba(190,236,120,0)']]);
    for(let k=0;k<22;k++){const a=k/22*6.283+rnd()*.2,r=24+rnd()*18,x=48+Math.cos(a)*r,y=48+Math.sin(a)*r,s=1.5+rnd()*2.2;c.strokeStyle='rgba(220,250,150,.35)';c.lineWidth=s*.8;c.beginPath();c.moveTo(48+Math.cos(a)*r*.55,48+Math.sin(a)*r*.55);c.lineTo(x,y);c.stroke();
      c.fillStyle='rgba(30,40,10,.8)';c.beginPath();c.arc(x,y,s+.8,0,7);c.fill();c.fillStyle='#d8f590';c.beginPath();c.arc(x,y,s,0,7);c.fill();}put(D+'burst',cv);}
  put(D+'mend',mendLayer(W,K,K,120));woundPair(D,W,K,K+2,104,5111,5112);put(D+'seep',bead('200,236,140','80,110,40'));}

// =============================== Seed Mortar (art/plant/seed-mortar/) ===============================
// a compact explosive seed-launching organ: a muscular root knot holding a thick curved launching chamber of dark violet membrane
// hooped with pale hardened cellulose, fibres along it and vascular channels bringing ammunition to a reinforced opening where the
// next hardened seed sits. Painted aiming along +x. 1x1 in a 256x256 box (centre 128,128).
{K=128;const D='seed-mortar/';
  {const [cv,c]=mk(W2);sd=5201;haze(c,K+2,K+4,74,74,[[0,'rgba(10,4,14,.5)'],[.7,'rgba(10,4,14,.25)'],[1,'rgba(10,4,14,0)']]);rootFan(c,K,K,7,40,74,13,.3);put(D+'roots',cv);}
  // the muscular root base: a knot of fleshy bands round a socket
  {const [cv,c]=mk(W2);sd=5202;shadow(c,K,K+2,62,.55);mound(c,K,K+3,50,47,2.1,['#7c4290','#4a1e5c','#200c28'],.08);
    c.save();blobPath(c,K,K+3,50,47,.08,2.1);c.clip();for(let k=0;k<6;k++){const a=k/6*6.283+.3;muscle(c,[[K+Math.cos(a-.35)*20,K+Math.sin(a-.35)*20],[K+Math.cos(a+.35)*20,K+Math.sin(a+.35)*20]],[[K+Math.cos(a-.3)*50,K+Math.sin(a-.3)*48],[K+Math.cos(a+.3)*50,K+Math.sin(a+.3)*48]],5,1.8);}c.restore();
    for(let k=0;k<3;k++)ridge(c,K,K+2,k/3*6.283+.9,40,.42,10);
    haze(c,K,K,26,26,[[0,'rgba(10,2,14,.8)'],[1,'rgba(10,2,14,0)']]);put(D+'base',cv);}
  // the launching chamber, curved slightly and widest at the back, hooped with pale ridges; channels run to the opening
  {const [cv,c]=mk(W2);sd=5203;const FX=K+34;
    const body=(k=1,dx=0,dy=0)=>{c.beginPath();c.moveTo(FX+dx,K-15*k+dy);c.bezierCurveTo(K+14+dx,K-24*k+dy,K-18+dx,K-36*k+dy,K-34*k+dx,K-16*k+dy);c.quadraticCurveTo(K-46*k+dx,K+2+dy,K-32*k+dx,K+20*k+dy);c.bezierCurveTo(K-16+dx,K+36*k+dy,K+14+dx,K+24*k+dy,FX+dx,K+15*k+dy);c.closePath();};
    c.fillStyle='rgba(6,2,10,.55)';body(1.04,3,5);c.fill();c.fillStyle='#16061c';body(1.07);c.fill();
    const g=c.createRadialGradient(K-14,K-14,2,K,K,48);g.addColorStop(0,'#8a4aa0');g.addColorStop(.5,'#4e1e62');g.addColorStop(1,'#1e0826');c.fillStyle=g;body();c.fill();
    c.save();body();c.clip();muscle(c,[[K-40,K-10],[K-40,K+10]],[[FX,K-14],[FX,K+14]],8,2,['rgba(10,2,14,.45)','rgba(210,150,220,.3)','rgba(255,220,240,.2)']);
      for(const ox of [-24,-8,8,22]){const w=(ox<0?33:26)-Math.abs(ox)*.1;c.strokeStyle='rgba(40,24,36,.8)';c.lineWidth=5;c.beginPath();c.moveTo(K+ox+4,K-w);c.quadraticCurveTo(K+ox-5,K,K+ox+4,K+w);c.stroke();
        const rg=c.createLinearGradient(K+ox-4,0,K+ox+6,0);rg.addColorStop(0,'#5e4a48');rg.addColorStop(.5,'#e8dccb');rg.addColorStop(1,'#8a7468');c.strokeStyle=rg;c.lineWidth=3.2;c.beginPath();c.moveTo(K+ox+4,K-w);c.quadraticCurveTo(K+ox-5,K,K+ox+4,K+w);c.stroke();}
      for(const oy of [-9,9]){c.strokeStyle='rgba(150,236,200,.35)';c.lineWidth=1.6;c.beginPath();c.moveTo(K-36,K+oy*1.2);c.quadraticCurveTo(K,K+oy*1.4,FX-2,K+oy*.8);c.stroke();}
      speck(c,420,()=>[K-46+rnd()*84,K-36+rnd()*72],.12,.07);drop(c,K-16,K-18,5,.45);c.restore();
    c.strokeStyle='rgba(255,230,255,.4)';c.lineWidth=1.5;c.beginPath();c.moveTo(K-30,K-18);c.bezierCurveTo(K-16,K-33,K+12,K-22,FX-2,K-14);c.stroke();put(D+'chamber',cv);}
  // the reinforced opening: a thick pale cellulose ring with a dark wet mouth (it widens when the seed is thrown)
  {const [cv,c]=mk(W2);const FX=K+34;c.fillStyle='rgba(6,2,10,.5)';c.beginPath();c.ellipse(FX+2,K+3,13,19,0,0,7);c.fill();
    const rg=c.createRadialGradient(FX-4,K-6,1,FX,K,19);rg.addColorStop(0,'#f4e8d8');rg.addColorStop(.55,'#bca694');rg.addColorStop(1,'#56404a');c.fillStyle=rg;c.beginPath();c.ellipse(FX,K,12,18,0,0,7);c.fill();
    for(let k=0;k<12;k++){const a=k/12*6.283;c.strokeStyle='rgba(70,46,50,.5)';c.lineWidth=1;c.beginPath();c.moveTo(FX+Math.cos(a)*7,K+Math.sin(a)*11);c.lineTo(FX+Math.cos(a)*12,K+Math.sin(a)*18);c.stroke();}
    const tg=c.createRadialGradient(FX+1,K,1,FX,K,11);tg.addColorStop(0,'#060104');tg.addColorStop(1,'#3a1440');c.fillStyle=tg;c.beginPath();c.ellipse(FX+1,K,6.5,10.5,0,0,7);c.fill();
    c.strokeStyle='rgba(30,16,22,.8)';c.lineWidth=1.3;c.beginPath();c.ellipse(FX,K,12,18,0,0,7);c.stroke();c.strokeStyle='rgba(255,250,240,.6)';c.lineWidth=1;c.beginPath();c.ellipse(FX,K,10.5,16.5,0,Math.PI*1.05,Math.PI*1.6);c.stroke();put(D+'lip',cv);}
  // the next seed sitting in the opening: a hardened capsule with pale ridges (hidden after a shot until it reloads)
  const seedPaint=(c,x,y,L,R)=>{c.fillStyle='rgba(6,2,4,.55)';c.beginPath();c.ellipse(x+1.5,y+2.5,L+1,R+1,0,0,7);c.fill();
    const g=c.createRadialGradient(x-L*.3,y-R*.4,.5,x,y,L);g.addColorStop(0,'#d8c27a');g.addColorStop(.45,'#8a6a34');g.addColorStop(1,'#2e1c12');c.fillStyle=g;c.beginPath();c.ellipse(x,y,L,R,0,0,7);c.fill();
    c.save();c.beginPath();c.ellipse(x,y,L,R,0,0,7);c.clip();for(let k=-2;k<=2;k++){c.strokeStyle='rgba(250,236,190,.45)';c.lineWidth=1;c.beginPath();c.moveTo(x-L,y+k*R*.38);c.quadraticCurveTo(x,y+k*R*.48,x+L,y+k*R*.38);c.stroke();}
      c.strokeStyle='rgba(255,170,90,.75)';c.lineWidth=1.2;c.beginPath();c.moveTo(x-L*.8,y);c.lineTo(x+L*.8,y);c.stroke();c.restore();
    c.strokeStyle='rgba(20,10,6,.85)';c.lineWidth=1.1;c.beginPath();c.ellipse(x,y,L,R,0,0,7);c.stroke();drop(c,x-L*.35,y-R*.4,Math.max(1.5,R*.4),.7);};
  {const [cv,c]=mk(W2);seedPaint(c,K+33,K,6,8.5);put(D+'seed',cv);}
  // the discharge: sap mist and fibres thrown out of the opening
  {const [cv,c]=mk(64);sd=5206;haze(c,32,32,30,30,[[0,'rgba(240,220,200,.7)'],[.4,'rgba(200,170,190,.32)'],[1,'rgba(200,170,190,0)']]);
    for(let k=0;k<14;k++){const a=rnd()*6.283,r=5+rnd()*22;c.fillStyle=`rgba(${220+rnd()*35|0},${200+rnd()*40|0},${190+rnd()*40|0},.7)`;c.beginPath();c.arc(32+Math.cos(a)*r,32+Math.sin(a)*r,1+rnd()*1.8,0,7);c.fill();}put(D+'puff',cv);}
  // the projectile: the hardened seed capsule, long axis along +x
  {const [cv,c]=mk(40);seedPaint(c,20,20,11,8);put(D+'shell',cv);}
  // impact: the casing split into two halves, and fragments with a short pale burst
  {const [cv,c]=mk(40);c.save();c.beginPath();c.rect(0,0,40,20);c.clip();seedPaint(c,20,20,11,8);c.restore();c.fillStyle='#e8a050';c.fillRect(9,19,22,2);put(D+'half',cv);}
  {const [cv,c]=mk(96);sd=5208;haze(c,48,48,40,40,[[0,'rgba(255,230,170,.55)'],[.35,'rgba(230,170,110,.3)'],[1,'rgba(200,120,80,0)']]);
    for(let k=0;k<16;k++){const a=rnd()*6.283,r=12+rnd()*30,x=48+Math.cos(a)*r,y=48+Math.sin(a)*r;c.save();c.translate(x,y);c.rotate(a+rnd());c.fillStyle='rgba(30,16,8,.85)';c.beginPath();c.moveTo(-3.5,-2);c.lineTo(3.5,-1);c.lineTo(2,2.5);c.lineTo(-3,1.5);c.closePath();c.fill();
      c.fillStyle=rnd()<.5?'#a8844a':'#d8c27a';c.beginPath();c.moveTo(-2.6,-1.3);c.lineTo(2.6,-.6);c.lineTo(1.3,1.7);c.lineTo(-2.2,.9);c.closePath();c.fill();c.restore();}
    for(let k=0;k<10;k++){const a=rnd()*6.283,r=6+rnd()*26;c.fillStyle='rgba(150,220,120,.55)';c.beginPath();c.arc(48+Math.cos(a)*r,48+Math.sin(a)*r,1.2+rnd()*1.4,0,7);c.fill();}put(D+'frag',cv);}
  put(D+'mend',mendLayer(W2,K,K,62));woundPair(D,W2,K,K+2,46,5211,5212);put(D+'seep',bead('210,160,200','110,50,100'));}

// =============================== Sunlance (art/plant/sunlance/) ===============================
// an energy-focusing organ: a broad rooted base braced by hardened ribs, a dish of large focusing petals with translucent conducting
// membranes and gold veins round a central luminous lens of fluid. Petals, membranes and lens are painted aiming along +x; the
// game turns them to the aim and tightens the petals as vigor gathers. 2x2 in a 384x384 box (centre 192,192).
{K=192;const D='sunlance/';
  {const [cv,c]=mk(W);sd=5301;haze(c,K+3,K+6,170,170,[[0,'rgba(10,4,14,.5)'],[.6,'rgba(10,4,14,.3)'],[1,'rgba(10,4,14,0)']]);rootFan(c,K,K,8,96,168,24,.4);
    for(let k=0;k<10;k++){const a=k/10*6.283+.3;veins(c,K+Math.cos(a)*100,K+Math.sin(a)*100,a,46,1,['rgba(240,210,120,.18)','rgba(255,240,200,.22)'],1.5);}put(D+'roots',cv);}
  // the base: a broad mound, a ring of hardened ribs arching in from the rim, and a dark socket the dish turns in
  {const [cv,c]=mk(W);sd=5302;shadow(c,K,K+3,128,.55);mound(c,K,K+4,110,106,2.4,['#5a2a74','#34124a','#160620'],.05);
    for(let k=0;k<8;k++){const a=k/8*6.283+.2;const P0=[[K+Math.cos(a)*104,K+Math.sin(a)*100],[K+Math.cos(a+.22)*84,K+Math.sin(a+.22)*82],[K+Math.cos(a+.36)*58,K+Math.sin(a+.36)*58]];
      strand(c,P0,13,{cols:['#e6d6c4','#a88e80','#4a3438'],edge:'#1c1014',shadow:'rgba(6,2,10,.55)',vein:1,veinCol:'rgba(255,240,210,.2)',veinCore:'rgba(255,250,240,.2)',ringCol:'rgba(60,40,40,.3)',ringStep:4,streak:'rgba(255,250,240,.4)',end:.55});}
    haze(c,K,K,64,64,[[0,'rgba(10,2,14,.9)'],[.75,'rgba(16,4,22,.7)'],[1,'rgba(16,4,22,0)']]);put(D+'base',cv);}
  // one large focusing petal, painted from the lens outward along +x: deep violet with a translucent gold-veined membrane window
  {const [cv,c]=mk(W);sd=5303;c.save();c.translate(K,K);const r0=20,r1=124,w=34;
    const path=(k=1)=>{c.beginPath();c.moveTo(r0,0);c.bezierCurveTo(r0+24,-w*k,r1-36,-w*.95*k,r1,-w*.15*k);c.quadraticCurveTo(r1+8,0,r1,w*.15*k);c.bezierCurveTo(r1-36,w*.95*k,r0+24,w*k,r0,0);c.closePath();};
    c.fillStyle='rgba(6,2,10,.55)';c.save();c.translate(2,4);path(1.04);c.fill();c.restore();
    const g=c.createLinearGradient(r0,0,r1,0);g.addColorStop(0,'#24082e');g.addColorStop(.5,'#5a2276');g.addColorStop(1,'#9a5cb4');c.fillStyle=g;path();c.fill();
    c.save();path();c.clip();
      // the translucent window: paler violet, gold veins running out along it
      c.save();c.globalCompositeOperation='destination-out';haze(c,(r0+r1)*.56,0,(r1-r0)*.36,w*.6,[[0,'rgba(0,0,0,.45)'],[1,'rgba(0,0,0,0)']]);c.restore();
      haze(c,(r0+r1)*.56,0,(r1-r0)*.36,w*.6,[[0,'rgba(220,180,240,.22)'],[1,'rgba(220,180,240,0)']]);
      for(let j=-3;j<=3;j++){c.strokeStyle='rgba(255,220,130,.4)';c.lineWidth=j?1:1.8;c.beginPath();c.moveTo(r0+4,0);c.quadraticCurveTo((r0+r1)/2,j*w*.3,r1-4,j*w*.1);c.stroke();}
      c.strokeStyle='rgba(30,6,40,.45)';c.lineWidth=w*.3;path();c.stroke();speck(c,700,()=>[r0+rnd()*(r1-r0),(rnd()*2-1)*w],.1,.06);c.restore();
    c.strokeStyle='rgba(14,2,20,.8)';c.lineWidth=1.4;path();c.stroke();c.strokeStyle='rgba(255,236,190,.5)';c.lineWidth=1.2;c.beginPath();c.moveTo(r0+8,-w*.6);c.bezierCurveTo(r0+30,-w*.98,r1-40,-w*.9,r1-4,-w*.16);c.stroke();
    c.restore();put(D+'petal',cv);}
  // the conducting membrane stretched between the petals: a translucent violet-gold fan behind the lens
  {const [cv,c]=mk(W);sd=5304;c.save();c.translate(K,K);c.beginPath();c.moveTo(-6,0);for(let i=0;i<=40;i++){const a=Math.PI*.5+i/40*Math.PI,r=96+8*Math.sin(i/40*Math.PI*6);c.lineTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();
    const g=c.createRadialGradient(0,0,10,0,0,100);g.addColorStop(0,'rgba(255,220,150,.45)');g.addColorStop(.5,'rgba(150,80,180,.38)');g.addColorStop(1,'rgba(90,30,120,.5)');c.fillStyle=g;c.fill();c.save();c.clip();
    for(let k=0;k<14;k++){const a=Math.PI*.5+(k+.5)/14*Math.PI;c.strokeStyle='rgba(255,220,140,.3)';c.lineWidth=1;c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(a)*100,Math.sin(a)*100);c.stroke();}c.restore();
    c.strokeStyle='rgba(20,4,26,.6)';c.lineWidth=1.4;c.stroke();c.restore();put(D+'web',cv);}
  // the lens: a sphere of luminous fluid in a pale rim, gold at the heart with a pale cyan edge, set a little forward
  {const [cv,c]=mk(W);const LX=K+8,R=26;c.fillStyle='rgba(6,2,10,.55)';c.beginPath();c.arc(LX+3,K+4,R+6,0,7);c.fill();
    const rg=c.createRadialGradient(LX-6,K-8,2,LX,K,R+6);rg.addColorStop(0,'#efe0cc');rg.addColorStop(.7,'#9a8070');rg.addColorStop(1,'#3a2630');c.fillStyle=rg;c.beginPath();c.arc(LX,K,R+6,0,7);c.fill();
    const g=c.createRadialGradient(LX+4,K-3,1,LX,K,R);g.addColorStop(0,'rgba(255,250,220,.98)');g.addColorStop(.3,'rgba(255,214,120,.92)');g.addColorStop(.7,'rgba(170,110,60,.85)');g.addColorStop(.92,'rgba(120,220,230,.8)');g.addColorStop(1,'rgba(40,20,50,.95)');c.fillStyle=g;c.beginPath();c.arc(LX,K,R,0,7);c.fill();
    c.save();c.beginPath();c.arc(LX,K,R,0,7);c.clip();for(let k=0;k<8;k++){const a=rnd()*6.283;c.strokeStyle='rgba(255,240,190,.35)';c.lineWidth=1;c.beginPath();c.moveTo(LX+Math.cos(a)*R,K+Math.sin(a)*R);c.quadraticCurveTo(LX+Math.cos(a+.6)*R*.4,K+Math.sin(a+.6)*R*.4,LX+R*.35,K);c.stroke();}c.restore();
    c.strokeStyle='rgba(20,8,16,.85)';c.lineWidth=1.6;c.beginPath();c.arc(LX,K,R+6,0,7);c.stroke();c.strokeStyle='rgba(30,10,30,.8)';c.lineWidth=1.4;c.beginPath();c.arc(LX,K,R,0,7);c.stroke();
    c.strokeStyle='rgba(255,255,255,.6)';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.arc(LX,K,R-5,Math.PI*1.08,Math.PI*1.45);c.stroke();drop(c,LX-9,K-10,6,.8);put(D+'lens',cv);}
  // the lens lit up (added with a light blend as vigor gathers) and gold veins over the base and petals
  {const [cv,c]=mk(W);haze(c,K+8,K,70,70,[[0,'rgba(255,240,190,.75)'],[.3,'rgba(255,210,120,.4)'],[.7,'rgba(160,220,240,.12)'],[1,'rgba(160,220,240,0)']]);haze(c,K+14,K,16,16,[[0,'rgba(255,255,245,.95)'],[1,'rgba(255,240,200,0)']]);put(D+'glow',cv);}
  {const [cv,c]=mk(W);sd=5305;for(let k=0;k<10;k++){const a=k/10*6.283+.25;veins(c,K+Math.cos(a)*40,K+Math.sin(a)*40,a,64,1,['rgba(255,200,100,.5)','rgba(255,245,210,.6)'],1.8);}put(D+'veins',cv);}
  // a pulse running along the beam and the beam's restrained impact
  put(D+'bpulse',pulseSprite('255,214,130','255,252,235'));
  {const [cv,c]=mk(96);haze(c,48,48,46,46,[[0,'rgba(255,250,230,.85)'],[.2,'rgba(255,220,140,.55)'],[.55,'rgba(200,140,220,.2)'],[1,'rgba(200,140,220,0)']]);
    sd=5307;for(let k=0;k<10;k++){const a=rnd()*6.283;c.strokeStyle='rgba(255,236,180,.5)';c.lineWidth=1.2;c.beginPath();c.moveTo(48+Math.cos(a)*8,48+Math.sin(a)*8);c.lineTo(48+Math.cos(a)*(20+rnd()*16),48+Math.sin(a)*(20+rnd()*16));c.stroke();}put(D+'impact',cv);}
  put(D+'mend',mendLayer(W,K,K,120));woundPair(D,W,K,K+2,100,5311,5312);put(D+'seep',bead('240,200,120','120,80,40'));}

// =============================== Brood Chamber (art/plant/brood-chamber/) ===============================
// the advanced reproductive organ, a matured Seed Pod: thick anchoring roots, a ring of protective petals under hardened cellulose
// ridges, three translucent incubation sacs joined by nutrient vessels round a deep central brood cavity. The release opening is a
// separate pair of lips the game sets on the side facing the tile where hatchlings really come out. 3x3 in a 512x512 box (centre 256,256).
{K=256;const D='brood-chamber/',SR=96,SA=[-Math.PI/2,Math.PI/6,Math.PI*5/6];
  {const [cv,c]=mk(W4);sd=5401;haze(c,K+4,K+8,236,236,[[0,'rgba(10,4,14,.55)'],[.6,'rgba(10,4,14,.32)'],[1,'rgba(10,4,14,0)']]);
    const RB={...ROOTV,vein:2.4};rootFan(c,K,K,11,150,236,36,.1,RB,.4);for(let k=0;k<16;k++){const a=k/16*6.283;veins(c,K+Math.cos(a)*156,K+Math.sin(a)*156,a,60,1,['rgba(150,236,200,.2)','rgba(220,255,236,.24)'],1.6);}put(D+'roots',cv);}
  {const [cv,c]=mk(W4);sd=5402;shadow(c,K,K+4,178,.55);mound(c,K,K+5,166,160,.4,['#8a4c9c','#542466','#24102e'],.045);
    for(let k=0;k<10;k++)lily(c,K,K+3,k/10*6.283+.1,80,174,34,['#341040','#7a3c8c','#d0a0dc']);
    for(let k=0;k<10;k++)ridge(c,K,K+3,k/10*6.283+.1+Math.PI/10,128,.27,22);
    haze(c,K,K,140,140,[[0,'rgba(36,12,44,.7)'],[.8,'rgba(36,12,44,.5)'],[1,'rgba(36,12,44,0)']]);
    put(D+'base',cv);}
  // nutrient vessels from the rim to each sac and from each sac to the cavity (a layer of its own: the game turns the sac ring so
  // the gap between two sacs faces the release opening)
  {const [cv,c]=mk(W4);sd=5408;
    for(const a of SA){const sx=K+Math.cos(a)*SR,sy=K+Math.sin(a)*SR;
      for(const s of [-1,1]){const b=a+s*.55;strand(c,[[K+Math.cos(b)*150,K+Math.sin(b)*150],[K+Math.cos(a+s*.35)*128,K+Math.sin(a+s*.35)*128],[sx+Math.cos(a+s*1.2)*30,sy+Math.sin(a+s*1.2)*30]],9,{...ROOTV,cols:['#a46ab4','#6a3480','#341440'],end:.7,vein:2,veinCol:'rgba(170,240,210,.35)',veinCore:'rgba(230,255,240,.4)'});}
      strand(c,[[sx-Math.cos(a)*30,sy-Math.sin(a)*30],[K+Math.cos(a+.25)*58,K+Math.sin(a+.25)*58],[K+Math.cos(a)*44,K+Math.sin(a)*44]],10,{...ROOTV,cols:['#a46ab4','#6a3480','#341440'],end:.75,vein:2,veinCol:'rgba(170,240,210,.35)',veinCore:'rgba(230,255,240,.4)'});}
    put(D+'vessels',cv);}
  // the central brood cavity: a deep wet pit with a thick fleshy rim and faint bioluminescent spots
  {const [cv,c]=mk(W4);sd=5403;const R=50;c.fillStyle='rgba(6,2,10,.6)';c.beginPath();c.arc(K+3,K+5,R+14,0,7);c.fill();
    mound(c,K,K,R+14,R+12,1.7,['#9a5aac','#5a2a6c','#28102e'],.06);
    const g=c.createRadialGradient(K,K+4,2,K,K,R);g.addColorStop(0,'#040104');g.addColorStop(.6,'#1a0620');g.addColorStop(1,'#46184e');c.fillStyle=g;blobPath(c,K,K,R,R-3,.05,.8);c.fill();
    c.save();blobPath(c,K,K,R,R-3,.05,.8);c.clip();for(let k=0;k<16;k++){const a=k/16*6.283;c.strokeStyle='rgba(120,50,130,.35)';c.lineWidth=1.4;c.beginPath();c.moveTo(K+Math.cos(a)*R,K+Math.sin(a)*R);c.quadraticCurveTo(K+Math.cos(a+.3)*R*.6,K+Math.sin(a+.3)*R*.6,K+Math.cos(a+.4)*R*.3,K+Math.sin(a+.4)*R*.3);c.stroke();}
      for(let k=0;k<10;k++){const a=rnd()*6.283,r=R*(.3+rnd()*.6);glow(c,K+Math.cos(a)*r,K+Math.sin(a)*r,3.5,'170,250,200',.55);}c.restore();
    c.strokeStyle='rgba(255,230,255,.35)';c.lineWidth=2;c.beginPath();c.arc(K,K,R+6,Math.PI*1.05,Math.PI*1.6);c.stroke();put(D+'cavity',cv);}
  // one incubation sac (drawn three times): pale aqua nutrient fluid in a translucent violet-rimmed membrane
  {const [cv,c]=mk(160);sd=5404;sac(c,80,80,54,48,['214,246,236','132,200,196','70,96,120'],'70,30,84',{al:.72,dots:30,dot:'rgba(240,255,250,.6)',dotR:1.6,rimW:2.4,veinCol:'rgba(70,30,90,.32)'});
    for(let k=0;k<2;k++){c.strokeStyle='rgba(80,30,96,.4)';c.lineWidth=1.6;c.beginPath();c.ellipse(80,80,54-k*14,48-k*12,0,Math.PI*.2,Math.PI*.8);c.stroke();}put(D+'sac',cv);}
  // the sac lit from inside as it nears hatching (added with a light blend)
  {const [cv,c]=mk(160);haze(c,80,80,74,70,[[0,'rgba(200,255,220,.7)'],[.45,'rgba(140,240,200,.35)'],[1,'rgba(140,240,200,0)']]);put(D+'sacglow',cv);}
  // what grows inside: a curled Thornback form and a heavier Bulwark form, dark through the fluid (drawn only for the real unit)
  const emb=(n,L,Wd,legs,plates)=>{const [cv,c]=mk(128);c.translate(64,64);c.fillStyle='rgba(22,6,30,.9)';
    for(let k=0;k<legs;k++){const t=(k-(legs-1)/2)*.42;for(const s of [-1,1]){c.strokeStyle='rgba(22,6,30,.8)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.moveTo(t*L*.5,s*Wd*.5);c.quadraticCurveTo(t*L*.5+6*s*0,s*Wd*1.05,t*L*.7-4,s*Wd*1.25);c.stroke();}}
    c.beginPath();c.ellipse(0,0,L,Wd,0,0,7);c.fill();c.beginPath();c.ellipse(L*.95,0,Wd*.55,Wd*.6,0,0,7);c.fill();
    for(let k=0;k<plates;k++){c.strokeStyle='rgba(120,70,130,.45)';c.lineWidth=1.6;const x=-L*.6+k*L*1.2/(plates-1||1);c.beginPath();c.moveTo(x,-Wd*.9);c.quadraticCurveTo(x+4,0,x,Wd*.9);c.stroke();}
    glow(c,L*.95+Wd*.2,0,Wd*.3,'200,255,220',.4);put(D+n,cv);};
  emb('embT',22,13,3,4);emb('embB',34,22,3,6);
  // the nutrient pulse that runs along the vessels to the sac in use (added with a light blend)
  put(D+'flow',pulseSprite('150,250,200','240,255,250'));
  // the release opening: two fleshy lips of a slit, painted with the slit along y at x=0, opening outward along +x
  for(const [n,s] of [['lipA',-1],['lipB',1]]){const [cv,c]=mk(160);sd=n==='lipA'?5406:5407;c.translate(40,80);
    const path=(k=1)=>{c.beginPath();c.moveTo(-6,0);c.bezierCurveTo(-4,s*34*k,30,s*42*k,56,s*14*k);c.quadraticCurveTo(62,s*4,58,0);c.closePath();};
    c.fillStyle='rgba(6,2,10,.5)';c.save();c.translate(2,3);path(1.05);c.fill();c.restore();
    const g=c.createLinearGradient(0,0,0,s*40);g.addColorStop(0,'#c07ac8');g.addColorStop(.5,'#7a3a8c');g.addColorStop(1,'#341440');c.fillStyle=g;path();c.fill();
    c.save();path();c.clip();muscle(c,[[0,0],[56,0]],[[4,s*30],[46,s*24]],8,1.6);c.restore();
    c.strokeStyle='rgba(20,4,26,.8)';c.lineWidth=1.4;path();c.stroke();c.strokeStyle='rgba(255,236,255,.5)';c.lineWidth=1.4;c.beginPath();c.moveTo(0,s*2);c.lineTo(56,s*2);c.stroke();put(D+n,cv);}
  // the dark wet gap that shows between the lips when they part
  {const [cv,c]=mk(160);haze(c,72,80,40,42,[[0,'rgba(4,1,6,.95)'],[.6,'rgba(30,8,36,.7)'],[1,'rgba(30,8,36,0)']]);put(D+'gap',cv);}
  put(D+'mend',mendLayer(W4,K,K,176));woundPair(D,W4,K,K+3,150,5411,5412);put(D+'seep',bead('200,240,220','80,140,130'));}
return out;})()
