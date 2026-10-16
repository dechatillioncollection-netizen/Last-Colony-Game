// Paints the Petal Gate, Maw Gate and Healing Pod layers (art/plant/petal-gate, maw-gate, healing-pod). Runs in a headless browser
// like paint_defense.js, whose shared helpers it repeats; each layer comes back as a PNG data URL keyed "folder/name". 128 px per tile.
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

// =============================== Petal Gate (art/plant/petal-gate/) ===============================
// a short stretch of the living hedge that can open: two bark jambs, like a Bark Wall split down the middle, and between them two
// thick violet petals that meet at a central seam. Painted for a gate in a wall line running left to right (petals part left and
// right, units pass up and down); the game draws it transposed when the line runs up and down. 1x1 in a 256x256 box (tile in the
// middle, centre 128,128). The petals are separate layers so the game can contract each one towards its own jamb.
{K=128;const D='petal-gate/',JL=75,JR=181,JW=14,JH=66,X0=88,X1=168,ROOTC={cols:['#86646c','#52303e','#28121e'],edge:'#180710',shadow:'rgba(6,2,10,.5)',vein:1.4,veinCol:'rgba(170,236,214,.1)',veinCore:'rgba(220,255,240,.12)',ringCol:'rgba(16,4,14,.2)',ringStep:3,streak:'rgba(240,214,230,.16)'};
  let c0=null;const jamb=(x,k=1,dx=0,dy=0)=>rsq(c0,x,K,JW,JH,2.15,.045,x*.07,dx,dy,k);
  // roots: feet under the two jambs only (none across the passage), a damp stain under each
  {const [cv,c]=mk(W2);sd=4301;for(const x of [JL,JR])haze(c,x+2,K+4,30,74,[[0,'rgba(10,4,12,.5)'],[.7,'rgba(10,4,12,.26)'],[1,'rgba(10,4,12,0)']]);
    for(const [x,s] of [[JL,-1],[JR,1]])for(let k=0;k<5;k++){const a=(s<0?Math.PI:0)+(k-2)*.42+(rnd()-.5)*.15,y0=K+(k-2)*24,r1=22+rnd()*10,b=a+(rnd()-.5)*.5;
      taper(c,x+s*6,y0,x+s*6+Math.cos(b)*r1*.5,y0+Math.sin(b)*r1*.5,x+s*6+Math.cos(a)*r1,y0+Math.sin(a)*r1,11+rnd()*3,3,{...ROOTC,cols:['#6e4a54','#46283a','#22101a'],streak:'rgba(240,214,230,.12)'});
      pit(c,x+s*6+Math.cos(a)*r1,y0+Math.sin(a)*r1,3,a);}
    put(D+'roots',cv);}
  // the passage floor seen when the petals part: a damp dark throat between the jambs, lined with wet tissue along each jamb
  {const [cv,c]=mk(W2);sd=4302;haze(c,K,K,46,70,[[0,'rgba(14,4,18,.42)'],[.7,'rgba(14,4,18,.26)'],[1,'rgba(14,4,18,0)']]);
    for(const x of [X0,X1]){haze(c,x,K,9,62,[[0,'rgba(120,40,90,.45)'],[1,'rgba(120,40,90,0)']]);for(let k=0;k<4;k++)drop(c,x+(rnd()-.5)*6,K-50+rnd()*100,1.4+rnd()*1.4,.4);}
    for(let k=0;k<5;k++){const y=K-48+k*24+(rnd()-.5)*6;c.strokeStyle='rgba(220,180,230,.12)';c.lineWidth=1;c.beginPath();c.moveTo(X0+2,y);c.quadraticCurveTo(K,y+8+rnd()*6,X1-2,y+(rnd()-.5)*6);c.stroke();}
    put(D+'floor',cv);}
  // the frame: two bark jambs bound by a woven root each, their inner faces lined with wet violet tissue where the petals grow from
  {const [cv,c]=mk(W2);c0=c;sd=4303;
    for(const x of [JL,JR]){shadow(c,x,K,40,.45);c.fillStyle='#1a0a0e';jamb(x,1.06,2,3);c.fill();
      c.save();jamb(x);c.clip();{const g=c.createRadialGradient(x-6,K-30,4,x,K,JH);g.addColorStop(0,'#9a6a62');g.addColorStop(.5,'#62383a');g.addColorStop(1,'#2e1420');c.fillStyle=g;c.fillRect(x-JW-4,K-JH-4,JW*2+8,JH*2+8);
        const KN=[[x+(x<K?3:-3),K-26,5],[x-(x<K?2:-2),K+30,6]],flow=(px,py)=>{let a=Math.PI/2+.25*Math.sin(py/13);for(const [kx,ky,r] of KN){const ddx=px-kx,ddy=py-ky,d=Math.hypot(ddx,ddy);if(d<r*3){const w=1-d/(r*3);a=a*(1-w)+(Math.atan2(ddy,ddx)+Math.PI/2)*w;}}return a;};
        for(let k=0;k<170;k++){const px=x-JW+rnd()*JW*2,py=K-JH+rnd()*JH*2,a=flow(px,py),l=5+rnd()*10;c.strokeStyle=['rgba(30,10,16,.26)','rgba(220,170,170,.09)','rgba(60,24,34,.22)'][k%3];c.lineWidth=.7+rnd()*.8;c.lineCap='round';c.beginPath();c.moveTo(px-Math.cos(a)*l/2,py-Math.sin(a)*l/2);c.lineTo(px+Math.cos(a)*l/2,py+Math.sin(a)*l/2);c.stroke();}
        for(const [kx,ky,r] of KN)haze(c,kx,ky,r*1.3,r*1.1,[[0,'rgba(14,3,8,.75)'],[1,'rgba(40,14,20,0)']]);
        speck(c,380,()=>[x-JW+rnd()*JW*2,K-JH+rnd()*JH*2],.12,.06);for(let k=0;k<9;k++)drop(c,x-JW+4+rnd()*(JW*2-8),K-JH+8+rnd()*(JH*2-16),1.2+rnd()*1.6,.42);}c.restore();
      c.save();jamb(x);c.clip();const ao=c.createLinearGradient(x-JW,0,x+JW,0);ao.addColorStop(0,'rgba(10,2,6,.45)');ao.addColorStop(.3,'rgba(10,2,6,0)');ao.addColorStop(.7,'rgba(10,2,6,0)');ao.addColorStop(1,'rgba(10,2,6,.5)');c.fillStyle=ao;c.fillRect(0,0,W2,W2);c.restore();
      // the root that winds round the jamb
      const s=x<K?1:-1;for(let k=0;k<3;k++){const y=K-46+k*40;taper(c,x-s*16,y-8,x,y+10,x+s*16,y+14,8,6,{...ROOTC,pow:1});}
      // wet lining on the inner face
      const xi=x+s*(JW-3);for(const [lw,col] of [[7,'rgba(50,12,44,.75)'],[3.4,'rgba(120,52,100,.55)'],[1.1,'rgba(255,200,236,.22)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(xi,K-JH+6);c.quadraticCurveTo(xi+s*3,K,xi,K+JH-6);c.stroke();}
      rimLight(c,()=>jamb(x,.97,-.6,-.8),W2,'rgba(255,226,220,.26)',1.5);}
    put(D+'frame',cv);}
  // the two petals: thick violet lobes growing from each jamb's inner face, bark-edged top and bottom, a translucent membrane in the
  // middle crossed by nutrient veins, contractile fibres bunched at the base. The left one overlaps the right one at the seam.
  const petal=(s)=>{const [cv,c]=mk(W2);sd=s<0?4304:4305;const xb=s<0?X0-2:X1+2,xf=s<0?K+7:K-5,M=x=>x,dir=s<0?1:-1,
      path=(k=1,dx=0,dy=0)=>{const h=56*k,hf=46*k;c.beginPath();c.moveTo(xb+dx,K-h+dy);c.bezierCurveTo(xb+dir*24+dx,K-h-7+dy,xf-dir*16+dx,K-hf-6+dy,xf-dir*5+dx,K-hf+dy);
        c.bezierCurveTo(xf+dir*4+dx,K-hf*.55+dy,xf+dir*4+dx,K+hf*.55+dy,xf-dir*5+dx,K+hf+dy);c.bezierCurveTo(xf-dir*16+dx,K+hf+6+dy,xb+dir*24+dx,K+h+7+dy,xb+dx,K+h+dy);c.closePath();};
    // the overlapping lip of the left petal throws a soft shadow over the right one
    if(s<0)haze(c,xf+5,K+3,9,48,[[0,'rgba(6,1,10,.55)'],[1,'rgba(6,1,10,0)']]);
    c.fillStyle='rgba(6,1,10,.5)';path(1.04,2,3);c.fill();c.fillStyle='#16061e';path(1.03);c.fill();
    const g=c.createLinearGradient(xb,0,xf,0);g.addColorStop(0,'#2c0e3a');g.addColorStop(.35,'#6a2c80');g.addColorStop(.8,'#8a48a0');g.addColorStop(1,'#3c1450');c.fillStyle=g;path();c.fill();
    c.save();path();c.clip();
    // light from the upper left over the whole lobe
    const lg=c.createLinearGradient(xb-30,K-70,xf+20,K+60);lg.addColorStop(0,'rgba(255,220,255,.16)');lg.addColorStop(.5,'rgba(255,220,255,0)');lg.addColorStop(1,'rgba(10,0,20,.3)');c.fillStyle=lg;c.fillRect(0,0,W2,W2);
    // the translucent membrane window
    const mx=(xb+xf)/2+dir*4;haze(c,mx,K,22,34,[[0,'rgba(220,170,236,.32)'],[.7,'rgba(190,130,220,.16)'],[1,'rgba(190,130,220,0)']]);
    speck(c,320,()=>[Math.min(xb,xf)+rnd()*Math.abs(xf-xb),K-56+rnd()*112],.12,.07);
    veins(c,xb+dir*8,K,s<0?0:Math.PI,Math.abs(xf-xb)*.9,4);
    // bark edging along the top and bottom, as on the walls either side
    for(const sy of [-1,1]){const yb=K+sy*50;barkFill(c,()=>{c.beginPath();c.moveTo(xb,yb-sy*2);c.quadraticCurveTo((xb+xf)/2,yb+sy*4,xf,yb-sy*4);c.lineTo(xf,K+sy*70);c.lineTo(xb,K+sy*70);c.closePath();},Math.min(xb,xf),Math.min(yb,K+sy*70)-4,Math.abs(xf-xb),24,0);
      seam(c,[[xb,yb-sy*2],[(xb+xf)/2,yb+sy*4],[xf,yb-sy*4]].map(([x,y])=>[x,y]),2.2);}
    // contractile fibres at the base, bunched where the petal grows out of the jamb
    muscle(c,[[xb,K-46],[xb,K+46]],[[xb+dir*22,K-40],[xb+dir*22,K+40]],11,2.2);
    for(let k=0;k<8;k++)drop(c,mx+(rnd()-.5)*36,K+(rnd()-.5)*80,1.3+rnd()*1.8,.42);
    c.restore();
    punch(c,mx,K,16,26,.18);
    // the free edge: a thickened wet lip; the seam where the two petals press together
    c.save();path();c.clip();for(const [lw,col] of [[6,'rgba(20,4,26,.7)'],[2.2,'rgba(200,140,220,.45)'],[.9,'rgba(255,230,255,.55)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(xf-dir*6,K-44);c.quadraticCurveTo(xf+dir*2,K,xf-dir*6,K+44);c.stroke();}c.restore();
    if(s<0)for(let k=0;k<3;k++){drop(c,xf+1,K-24+k*22+(rnd()-.5)*6,2+rnd()*1.2,.6);}
    rimLight(c,()=>path(.985,-.6,-.8),W2,'rgba(255,230,250,.24)',1.4);
    return cv;};
  put(D+'petalR',petal(1));put(D+'petalL',petal(-1));
  // wounds over the closed gate (the game lays them only where each piece really is): cracks and sap, then torn petals and split jambs
  {const [cv,c]=mk(W2);sd=4306;c.fillStyle='rgba(24,6,12,.12)';c.fillRect(60,58,136,140);
    for(let k=0;k<7;k++){const x=k<3?(k%2?JL:JR):X0+rnd()*(X1-X0),y=K+(rnd()-.5)*100,a=rnd()*6.283;for(const P0 of crack(x,y,a,18+rnd()*14,2)){line(c,P0,2.6,'rgba(10,2,6,.85)');line(c,P0.map(([x,y])=>[x-.8,y-.9]),.8,'rgba(255,214,200,.3)');}}
    for(let k=0;k<6;k++){const x=X0+rnd()*(X1-X0),y=K+(rnd()-.5)*90;c.fillStyle='rgba(150,40,80,.85)';c.beginPath();c.arc(x,y,2+rnd()*1.4,0,7);c.fill();drop(c,x-.6,y-.8,1.5,.7);}
    put(D+'wound1',cv);}
  {const [cv,c]=mk(W2);sd=4307;c.fillStyle='rgba(34,6,18,.22)';c.fillRect(60,58,136,140);
    gash(c,JL,K-20,1.4,44,5,BARK_RAW,['rgba(40,14,14,.8)','#c9a090']);gash(c,JR,K+24,1.7,40,5,BARK_RAW,['rgba(40,14,14,.8)','#c9a090']);
    gash(c,K-20,K+10,-.6,40,7,['#c06aa0','#7a2c62','#2a0620'],['rgba(30,6,30,.8)','#d6a0d0']);gash(c,K+22,K-22,.5,34,6,['#c06aa0','#7a2c62','#2a0620'],['rgba(30,6,30,.8)','#d6a0d0']);
    put(D+'wound2',cv);}
  // mend: healing light along the jambs' roots and up their lined inner faces
  {const [cv,c]=mk(W2);c.lineCap='round';for(const x of [JL,JR]){const s=x<K?1:-1;for(const [lw,col] of [[9,'rgba(140,220,90,.18)'],[3,'rgba(200,250,150,.55)']]){c.strokeStyle=col;c.lineWidth=lw;
      for(let k=0;k<3;k++){const y=K-46+k*40;c.beginPath();c.moveTo(x-s*16,y-8);c.quadraticCurveTo(x,y+10,x+s*16,y+14);c.stroke();}
      c.beginPath();c.moveTo(x+s*(JW-3),K-JH+6);c.quadraticCurveTo(x+s*JW,K,x+s*(JW-3),K+JH-6);c.stroke();}}
    put(D+'mend',cv);}
  // join: the bundle that knits the jamb into the wall beside it, starting at the jamb so it never crosses the passage
  {const [cv,c]=mk(96,P);haze(c,70,64,26,24,[[0,'rgba(6,2,10,.5)'],[1,'rgba(6,2,10,0)']]);
    strand(c,[[46,52],[70,66],[98,72]],10,{...ROOTC,end:.95,pow:1});strand(c,[[46,76],[70,62],[98,56]],9,{...ROOTC,end:.95,pow:1});put(D+'join',cv);}
  put(D+'seep',bead('214,110,150','120,30,70'));}

// =============================== Maw Gate (art/plant/maw-gate/) ===============================
// a great muscular aperture: a thick ring of dark-violet tissue braced with pale cellulose ribs and bark plates at its corners,
// around a wide round throat closed by six overlapping reinforced membranes, like an iris. Each membrane is its own layer so the
// game can turn and draw it back into the ring about its own root. Not a mouth: no teeth, no lips. 2x2 in a 384x384 box (footprint
// in the middle 256x256, centre 192,192); the throat is 200 px across, a tile and a half, room for a Bulwark Ant.
{K=192;const D='maw-gate/',HW=122,RH=100,RP=108,NL=6,ROOTC={cols:['#74545a','#46283a','#22101a'],edge:'#120510',shadow:'rgba(4,2,8,.6)',vein:2,veinCol:'rgba(170,236,214,.08)',veinCore:'rgba(220,255,240,.1)',ringCol:'rgba(12,2,10,.22)',ringStep:2,streak:'rgba(240,214,230,.14)'};
  let c0=null;const body=(k=1,dx=0,dy=0)=>rsq(c0,K,K,HW,HW,3.3,.016,1.7,dx,dy,k);
  const ring=(c)=>{c.beginPath();body();c.moveTo(K+RH,K);c.arc(K,K,RH,0,Math.PI*2,true);};
  // roots: heavy buttress roots out of the four corners only, so all four sides stay clear to walk up to
  {const [cv,c]=mk(W);sd=4401;for(let q=0;q<4;q++){const a=Math.PI/4+q*Math.PI/2;haze(c,K+Math.cos(a)*120,K+Math.sin(a)*120,56,56,[[0,'rgba(8,3,10,.55)'],[1,'rgba(8,3,10,0)']]);
      for(let k=0;k<3;k++){const b=a+(k-1)*.3+(rnd()-.5)*.08,r0=118,r1=(k===1?150:140)+rnd()*6,cb=b+(rnd()-.5)*.12;
        taper(c,K+Math.cos(b)*r0,K+Math.sin(b)*r0,K+Math.cos(cb)*(r0+r1)/2,K+Math.sin(cb)*(r0+r1)/2,K+Math.cos(b)*r1,K+Math.sin(b)*r1,(k===1?34:28)+rnd()*4,8,{...ROOTC,cols:['#5e4048','#3a2028','#1c0c12'],streak:'rgba(240,214,230,.1)'});
        pit(c,K+Math.cos(b)*r1,K+Math.sin(b)*r1,4,b);}}
    put(D+'roots',cv);}
  // the throat: the wet lining just inside the ring, fading to the bare ground in the middle
  {const [cv,c]=mk(W);sd=4402;c.save();c.beginPath();c.arc(K,K,RH+2,0,7);c.clip();
    const g=c.createRadialGradient(K,K,RH*.45,K,K,RH+2);g.addColorStop(0,'rgba(20,4,24,.18)');g.addColorStop(.7,'rgba(70,16,60,.5)');g.addColorStop(.92,'rgba(104,40,90,.65)');g.addColorStop(1,'rgba(40,8,40,.9)');c.fillStyle=g;c.fillRect(0,0,W,W);
    for(let k=0;k<26;k++){const a=k/26*6.283+rnd()*.1;c.strokeStyle='rgba(230,170,220,.16)';c.lineWidth=1.2;c.beginPath();c.moveTo(K+Math.cos(a)*RH,K+Math.sin(a)*RH);c.lineTo(K+Math.cos(a+.05)*RH*.72,K+Math.sin(a+.05)*RH*.72);c.stroke();}
    for(let k=0;k<12;k++){const a=rnd()*6.283,r=RH*(.78+rnd()*.18);drop(c,K+Math.cos(a)*r,K+Math.sin(a)*r,1.6+rnd()*1.8,.45);}c.restore();put(D+'throat',cv);}
  // the ring: muscular tissue with circular fibres round the throat, radial cellulose ribs, bark plates and root bundles on its corners
  {const [cv,c]=mk(W);c0=c;sd=4403;shadow(c,K,K,150,.6);
    c.fillStyle='#120614';ring(c);c.save();c.translate(3,5);c.fill('evenodd');c.restore();
    const g=c.createRadialGradient(K-60,K-70,10,K,K,HW*1.35);g.addColorStop(0,'#6a2c7c');g.addColorStop(.5,'#3e1650');g.addColorStop(1,'#1a0624');c.fillStyle=g;ring(c);c.fill('evenodd');
    c.save();ring(c);c.clip('evenodd');
    // circular (sphincter) fibres round the throat, fading outwards
    for(let r=RH+3;r<RH+44;r+=3.2){const al=.32*(1-(r-RH)/44);c.strokeStyle=`rgba(230,160,220,${al})`;c.lineWidth=1.3;c.beginPath();c.arc(K,K,r+(rnd()-.5)*1.2,0,7);c.stroke();c.strokeStyle=`rgba(10,2,14,${al*1.2})`;c.lineWidth=.9;c.beginPath();c.arc(K,K,r+1.6,0,7);c.stroke();}
    speck(c,2600,()=>[K-HW+rnd()*HW*2,K-HW+rnd()*HW*2],.12,.07);
    // radial cellulose ribs, pale and hard, from the throat's edge out into the ring
    for(let k=0;k<16;k++){const a=k/16*6.283+.1,r0=RH+4,r1=Math.min(HW+8,(HW*1.0)/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))**.8)-6;
      taper(c,K+Math.cos(a)*r0,K+Math.sin(a)*r0,K+Math.cos(a+.04)*(r0+r1)/2,K+Math.sin(a+.04)*(r0+r1)/2,K+Math.cos(a)*r1,K+Math.sin(a)*r1,7,4,{cols:['#d8c4d0','#9a7c96','#4e3450'],edge:'#1a0a1c',shadow:'rgba(4,1,6,.5)',vein:1,veinCol:'rgba(255,255,255,.1)',veinCore:'rgba(255,255,255,.12)',ringCol:'rgba(30,10,30,.3)',ringStep:4,streak:'rgba(255,245,255,.3)'});}
    // bark plates braced over each corner, as on Great Bark
    for(let q=0;q<4;q++){const a=Math.PI/4+q*Math.PI/2,x=K+Math.cos(a)*120,y=K+Math.sin(a)*120;
      barkFill(c,()=>{c.beginPath();c.ellipse(x,y,46,34,a+Math.PI/2,0,7);},x-50,y-50,100,100,a,['#8a5e4c','#5a3428','#2a1412']);
      c.strokeStyle='rgba(8,2,4,.8)';c.lineWidth=2.4;c.beginPath();c.ellipse(x,y,46,34,a+Math.PI/2,0,7);c.stroke();
      c.strokeStyle='rgba(255,224,210,.22)';c.lineWidth=1.4;c.beginPath();c.ellipse(x,y,44,32,a+Math.PI/2,Math.PI*1.1,Math.PI*1.6);c.stroke();}
    const ao=c.createRadialGradient(K,K,HW*.7,K,K,HW*1.12);ao.addColorStop(0,'rgba(8,2,10,0)');ao.addColorStop(1,'rgba(8,2,10,.6)');c.fillStyle=ao;c.fillRect(0,0,W,W);
    c.restore();
    // thick root bundles over the corners, twisting into the ring
    for(let q=0;q<4;q++){const a=Math.PI/4+q*Math.PI/2;for(const s of [-1,1]){const b=a+s*.42;
      taper(c,K+Math.cos(b)*(HW+16),K+Math.sin(b)*(HW+16),K+Math.cos(a+s*.2)*(RH+30),K+Math.sin(a+s*.2)*(RH+30),K+Math.cos(a-s*.16)*(RH+12),K+Math.sin(a-s*.16)*(RH+12),17,7,{...ROOTC,pow:1.2});}}
    // the throat's rim: a thick fleshy lip, wet
    for(const [lw,col] of [[9,'rgba(14,2,18,.85)'],[5,'rgba(92,34,86,.8)'],[1.4,'rgba(255,200,240,.24)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.arc(K,K,RH+2,0,7);c.stroke();}
    for(let k=0;k<14;k++){const a=rnd()*6.283;drop(c,K+Math.cos(a)*(RH+5),K+Math.sin(a)*(RH+5),1.8+rnd()*2,.55);}
    rimLight(c,()=>body(.99,-.8,-1),W,'rgba(255,226,236,.22)',2);
    put(D+'base',cv);}
  // the six membranes, closed: each grows from a root under the ring and reaches past the middle, its leading edge laid over the
  // next one; a pale cellulose rib down its length and two side ribs, translucent between them, a thick dark violet edge
  const LA=k=>k/NL*6.283+.26,LEAF=(c,k,o={})=>{const a=LA(k),px=K+Math.cos(a)*RP,py=K+Math.sin(a)*RP,ax=a+Math.PI-.42;   // axis: towards the middle, swung round
    c.save();c.translate(px,py);c.rotate(ax);
    const path=(kk=1,dx=0,dy=0)=>{c.beginPath();c.moveTo(dx,-20*kk+dy);c.bezierCurveTo(40+dx,-52*kk+dy,104+dx,-50*kk+dy,138+dx,-14*kk+dy);c.quadraticCurveTo(146+dx,4+dy,132+dx,18*kk+dy);
      c.bezierCurveTo(100+dx,34*kk+dy,40+dx,34*kk+dy,dx,20*kk+dy);c.closePath();};
    return {path,a,ax,px,py};};
  for(let k=0;k<NL;k++){const [cv,c]=mk(W);sd=4410+k;const L=LEAF(c,k),{path}=L;
    c.fillStyle='rgba(6,1,10,.5)';path(1.05,3,4);c.fill();c.fillStyle='#14041c';path(1.04);c.fill();
    const g=c.createLinearGradient(0,0,140,0);g.addColorStop(0,'#2a0a36');g.addColorStop(.4,'#5e2470');g.addColorStop(.85,'#7c3c92');g.addColorStop(1,'#3a1048');c.fillStyle=g;path();c.fill();
    c.save();path();c.clip();
    // light from the upper left in screen terms, whatever way this membrane points
    c.rotate(-L.ax);const lg=c.createLinearGradient(-120,-120,120,120);lg.addColorStop(0,'rgba(255,220,255,.2)');lg.addColorStop(.5,'rgba(255,220,255,0)');lg.addColorStop(1,'rgba(8,0,16,.32)');c.fillStyle=lg;c.fillRect(-200,-200,400,400);c.rotate(L.ax);
    haze(c,78,-6,36,22,[[0,'rgba(220,170,240,.3)'],[1,'rgba(220,170,240,0)']]);haze(c,60,16,26,12,[[0,'rgba(200,150,230,.2)'],[1,'rgba(200,150,230,0)']]);
    speck(c,360,()=>[rnd()*140,(rnd()-.5)*90],.12,.07);
    veins(c,6,0,0,120,3,['rgba(150,236,200,.26)','rgba(220,255,236,.3)'],1.3);
    // contractile fibres where it roots under the ring
    muscle(c,[[0,-20],[0,20]],[[30,-30],[30,26]],9,2.4);
    c.restore();
    c.save();path();c.clip();punch(c,80,-4,30,18,.2);c.restore();
    // ribs: a midrib and two side ribs, pale cellulose, standing proud
    const rib=(P0,w)=>taper(c,P0[0][0],P0[0][1],P0[1][0],P0[1][1],P0[2][0],P0[2][1],w,w*.35,{cols:['#cdb6c8','#8e7090','#4a3050'],edge:'#1a0a1c',shadow:'rgba(4,1,6,.4)',vein:.8,veinCol:'rgba(255,255,255,.1)',veinCore:'rgba(255,255,255,.1)',rings:false,streak:'rgba(255,245,255,.32)'});
    rib([[4,0],[70,-4],[132,2]],6.5);rib([[22,-8],[64,-30],[110,-34]],3.6);rib([[22,8],[60,22],[104,24]],3.4);
    // the leading edge, thickened and dark, catching a line of wet light
    for(const [lw,col] of [[7,'rgba(16,2,22,.85)'],[2.6,'rgba(170,100,200,.55)'],[1,'rgba(255,230,255,.5)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(4,-22);c.bezierCurveTo(40,-50,104,-48,136,-14);c.stroke();}
    for(let j=0;j<5;j++)drop(c,30+rnd()*90,(rnd()-.5)*40,1.6+rnd()*2,.45);
    c.restore();put(D+'leaf'+k,cv);}
  // wounds over the closed gate: cracked ring and plates, torn membranes, then deep splits and a membrane ripped through
  {const [cv,c]=mk(W);sd=4420;c.fillStyle='rgba(24,6,12,.1)';c.beginPath();c.arc(K,K,HW+6,0,7);c.fill();
    for(let k=0;k<12;k++){const a=rnd()*6.283,r=rnd()<.5?RH*.4+rnd()*RH*.5:RH+10+rnd()*24,x=K+Math.cos(a)*r,y=K+Math.sin(a)*r;for(const P0 of crack(x,y,rnd()*6.283,26+rnd()*20,2)){line(c,P0,3.4,'rgba(8,2,4,.88)');line(c,P0.map(([x,y])=>[x-1,y-1.1]),1,'rgba(255,214,200,.28)');}}
    for(let k=0;k<10;k++){const a=rnd()*6.283,r=rnd()*RH*1.1,x=K+Math.cos(a)*r,y=K+Math.sin(a)*r;c.fillStyle='rgba(150,40,80,.85)';c.beginPath();c.arc(x,y,2.4+rnd()*2,0,7);c.fill();drop(c,x-.8,y-1,2,.7);}
    put(D+'wound1',cv);}
  {const [cv,c]=mk(W);sd=4421;c.fillStyle='rgba(34,6,18,.24)';c.beginPath();c.arc(K,K,HW+6,0,7);c.fill();
    const RAW=['#c06aa0','#7a2c62','#2a0620'];
    for(const [x,y,a,l,w] of [[K-40,K-30,-.5,70,9],[K+36,K+26,.4,62,8],[K-14,K+48,1.2,44,6],[K+58,K-50,-1,40,5.5]])gash(c,x,y,a,l,w,RAW,['rgba(30,6,30,.8)','#d6a0d0']);
    for(const [x,y,a,l] of [[K-104,K-96,.8,40],[K+102,K+100,.8,38]])gash(c,x,y,a,l,6,BARK_RAW,['rgba(36,12,12,.8)','#bf9484']);
    put(D+'wound2',cv);}
  // mend: healing light along the corner root bundles and round the throat's rim
  {const [cv,c]=mk(W);c.lineCap='round';for(const [lw,col] of [[14,'rgba(140,220,90,.14)'],[4,'rgba(200,250,150,.5)']]){c.strokeStyle=col;c.lineWidth=lw;
      for(let q=0;q<4;q++){const a=Math.PI/4+q*Math.PI/2;for(const s of [-1,1]){const b=a+s*.42;c.beginPath();c.moveTo(K+Math.cos(b)*(HW+16),K+Math.sin(b)*(HW+16));c.quadraticCurveTo(K+Math.cos(a+s*.2)*(RH+30),K+Math.sin(a+s*.2)*(RH+30),K+Math.cos(a-s*.16)*(RH+12),K+Math.sin(a-s*.16)*(RH+12));c.stroke();}}
      c.beginPath();c.arc(K,K,RH+3,0,7);c.stroke();}
    put(D+'mend',cv);}
  // join: a thick bundle starting at the ring's outer edge
  {const [cv,c]=mk(96,P);haze(c,64,64,34,26,[[0,'rgba(6,2,10,.55)'],[1,'rgba(6,2,10,0)']]);
    strand(c,[[34,50],[66,68],[98,74]],14,{...ROOTC,end:.95,pow:1});strand(c,[[34,78],[66,60],[98,54]],13,{...ROOTC,end:.95,pow:1});put(D+'join',cv);}
  put(D+'seep',bead('206,104,140','110,26,62'));}

// =============================== Healing Pod (art/plant/healing-pod/) ===============================
// a small regenerative organ: a fleshy violet foundation, a collar of small waterlily petals, and in the middle a translucent bulb
// of pale green regenerative sap with motes drifting in it, fine veins running out from it. Lighter and more delicate than the Seed
// Pod or the Resin Gland. 1x1 in a 256x256 box (tile in the middle, centre 128,128).
{K=128;const D='healing-pod/',CX=128,CY=124,CR=27,ROOTC={cols:['#7a4a86','#4a2458','#24102c'],edge:'#14061a',shadow:'rgba(6,2,10,.5)',vein:1.4,veinCol:'rgba(170,240,150,.18)',veinCore:'rgba(220,255,200,.2)',ringCol:'rgba(16,4,20,.2)',ringStep:3,streak:'rgba(240,214,250,.16)'};
  // roots: short fleshy feet and fine vascular channels reaching out from under it (drawn under neighbours)
  {const [cv,c]=mk(W2);sd=4501;haze(c,K+2,K+4,60,60,[[0,'rgba(10,4,14,.45)'],[.7,'rgba(10,4,14,.22)'],[1,'rgba(10,4,14,0)']]);
    for(let k=0;k<7;k++){const a=k/7*6.283+.4+rnd()*.3,r0=40,r1=58+rnd()*8,b=a+(rnd()-.5)*.5;
      taper(c,K+Math.cos(a)*r0,K+Math.sin(a)*r0,K+Math.cos(b)*(r0+r1)/2,K+Math.sin(b)*(r0+r1)/2,K+Math.cos(a)*r1,K+Math.sin(a)*r1,10+rnd()*3,3,ROOTC);pit(c,K+Math.cos(a)*r1,K+Math.sin(a)*r1,2.6,a);}
    for(let k=0;k<9;k++){const a=k/9*6.283+.1;veins(c,K+Math.cos(a)*44,K+Math.sin(a)*44,a,40,1,['rgba(120,210,120,.2)','rgba(200,255,190,.24)'],1.4);}
    put(D+'roots',cv);}
  // the foundation: a low fleshy mound
  {const [cv,c]=mk(W2);sd=4502;shadow(c,K,K+2,62,.55);mound(c,K,K+3,48,45,1.2,['#8a4c9c','#542466','#24102e'],.07);
    for(let k=0;k<7;k++){const a=k/7*6.283+.2;seam(c,wander(K+Math.cos(a)*30,K+3+Math.sin(a)*28,a,14,4,.3),1.6,'rgba(12,3,16,.6)','rgba(255,220,250,.16)');}
    put(D+'base',cv);}
  // the collar: eight small waterlily petals, pale and translucent, two rings offset
  {const [cv,c]=mk(W2);sd=4503;const leaf=(a,r0,r1,w,cols)=>{c.save();c.translate(CX,CY+2);c.rotate(a);
      const path=(k=1)=>{c.beginPath();c.moveTo(r0,0);c.bezierCurveTo(r0+(r1-r0)*.3,-w*k,r0+(r1-r0)*.8,-w*.8*k,r1,0);c.bezierCurveTo(r0+(r1-r0)*.8,w*.8*k,r0+(r1-r0)*.3,w*k,r0,0);c.closePath();};
      c.fillStyle='rgba(8,2,12,.4)';c.save();c.translate(1.5,2.5);path(1.05);c.fill();c.restore();
      const g=c.createLinearGradient(r0,0,r1,0);g.addColorStop(0,cols[0]);g.addColorStop(.6,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;path();c.fill();
      c.save();path();c.clip();for(let j=-2;j<=2;j++){c.strokeStyle='rgba(120,40,110,.3)';c.lineWidth=.9;c.beginPath();c.moveTo(r0+2,0);c.quadraticCurveTo((r0+r1)/2,j*w*.32,r1-2,j*w*.12);c.stroke();}
        c.strokeStyle='rgba(180,250,170,.25)';c.lineWidth=1.1;c.beginPath();c.moveTo(r0+2,0);c.lineTo(r1-4,0);c.stroke();c.restore();
      c.strokeStyle='rgba(40,10,40,.6)';c.lineWidth=1.1;path();c.stroke();c.strokeStyle='rgba(255,236,255,.45)';c.lineWidth=.9;c.beginPath();c.moveTo(r0+4,-w*.5);c.quadraticCurveTo((r0+r1)/2,-w*.95,r1-3,-1);c.stroke();c.restore();};
    for(let k=0;k<8;k++)leaf(k/8*6.283+.2,14,52,11,['#5a2468','#b07cc4','#e6c4ee']);
    for(let k=0;k<8;k++)leaf(k/8*6.283+.2+Math.PI/8,16,44,10,['#6a2c78','#c48ed4','#f0d6f6']);
    put(D+'petals',cv);}
  // the chamber: a translucent bulb of pale green sap, darker below, the membrane's rim violet
  {const [cv,c]=mk(W2);sd=4504;c.fillStyle='rgba(6,2,10,.45)';c.beginPath();c.arc(CX+2,CY+3,CR+3,0,7);c.fill();
    const g=c.createRadialGradient(CX-8,CY-10,2,CX,CY,CR);g.addColorStop(0,'rgba(220,255,200,.92)');g.addColorStop(.45,'rgba(150,230,130,.78)');g.addColorStop(.85,'rgba(60,140,80,.72)');g.addColorStop(1,'rgba(40,20,60,.9)');c.fillStyle=g;c.beginPath();c.arc(CX,CY,CR,0,7);c.fill();
    c.save();c.beginPath();c.arc(CX,CY,CR,0,7);c.clip();haze(c,CX+4,CY+12,CR*.9,CR*.5,[[0,'rgba(20,70,40,.5)'],[1,'rgba(20,70,40,0)']]);
      for(let k=0;k<6;k++){const a=rnd()*6.283;c.strokeStyle='rgba(60,130,70,.35)';c.lineWidth=1;c.beginPath();c.moveTo(CX+Math.cos(a)*CR,CY+Math.sin(a)*CR);c.quadraticCurveTo(CX+Math.cos(a+.6)*CR*.5,CY+Math.sin(a+.6)*CR*.5,CX+Math.cos(a+1)*CR*.3,CY+Math.sin(a+1)*CR*.3);c.stroke();}c.restore();
    c.strokeStyle='rgba(30,8,40,.85)';c.lineWidth=2.4;c.beginPath();c.arc(CX,CY,CR,0,7);c.stroke();c.strokeStyle='rgba(200,150,230,.5)';c.lineWidth=1.2;c.beginPath();c.arc(CX,CY,CR-2,0,7);c.stroke();
    put(D+'chamber',cv);}
  // gloss: the membrane's wet highlights
  {const [cv,c]=mk(W2);c.strokeStyle='rgba(255,255,255,.55)';c.lineWidth=3;c.lineCap='round';c.beginPath();c.arc(CX,CY,CR-6,Math.PI*1.08,Math.PI*1.45);c.stroke();
    drop(c,CX-10,CY-12,6,.75);drop(c,CX+9,CY+10,3,.35);c.fillStyle='rgba(255,255,255,.9)';c.beginPath();c.arc(CX-11,CY-13,1.8,0,7);c.fill();put(D+'gloss',cv);}
  // bioluminescent veins over the foundation and petals, radiating from the chamber (added with a light blend)
  {const [cv,c]=mk(W2);sd=4505;for(let k=0;k<8;k++){const a=k/8*6.283+.45;veins(c,CX+Math.cos(a)*(CR+2),CY+Math.sin(a)*(CR+2),a,26,1,['rgba(130,230,110,.5)','rgba(220,255,200,.6)'],1.6);}put(D+'veins',cv);}
  // healing glow over the chamber (added with a light blend while it pumps)
  {const [cv,c]=mk(W2);haze(c,CX,CY,58,58,[[0,'rgba(170,250,140,.6)'],[.35,'rgba(140,230,110,.28)'],[1,'rgba(140,230,110,0)']]);haze(c,CX,CY,18,18,[[0,'rgba(240,255,230,.85)'],[1,'rgba(200,255,180,0)']]);put(D+'glow',cv);}
  // a mote of regenerative matter drifting in the sap, and the pulse of sap the pod sends to what it mends
  {const [cv,c]=mk(32);haze(c,16,16,14,14,[[0,'rgba(240,255,230,.95)'],[.3,'rgba(190,250,170,.55)'],[1,'rgba(190,250,170,0)']]);put(D+'mote',cv);}
  {const [cv,c]=mk(48);haze(c,24,24,23,23,[[0,'rgba(245,255,235,.95)'],[.25,'rgba(190,250,160,.75)'],[.6,'rgba(130,220,100,.28)'],[1,'rgba(130,220,100,0)']]);put(D+'pulse',cv);}
  // wounds on the foundation and petals
  {const [cv,c]=mk(W2);sd=4506;for(let k=0;k<5;k++){const a=rnd()*6.283,r=30+rnd()*18;for(const P0 of crack(K+Math.cos(a)*r,K+3+Math.sin(a)*r,a+(rnd()-.5),14+rnd()*10,1)){line(c,P0,2.4,'rgba(10,2,8,.85)');line(c,P0.map(([x,y])=>[x-.7,y-.8]),.7,'rgba(255,214,230,.3)');}}
    for(let k=0;k<4;k++){const a=rnd()*6.283,r=32+rnd()*14;c.fillStyle='rgba(150,220,120,.75)';c.beginPath();c.arc(K+Math.cos(a)*r,K+3+Math.sin(a)*r,1.8+rnd(),0,7);c.fill();}put(D+'wound1',cv);}
  {const [cv,c]=mk(W2);sd=4507;const RAW=['#c06aa0','#7a2c62','#2a0620'];gash(c,K-26,K+20,-.7,30,5,RAW,['rgba(30,6,30,.8)','#d6a0d0']);gash(c,K+30,K-12,1.1,26,4.5,RAW,['rgba(30,6,30,.8)','#d6a0d0']);
    haze(c,K+18,K+34,10,7,[[0,'rgba(150,220,120,.6)'],[1,'rgba(150,220,120,0)']]);put(D+'wound2',cv);}
  put(D+'seep',bead('190,240,150','60,130,60'));}
return out;})()
