// Paints the Bark Wall, Great Bark and Ironbark layers (art/plant/bark-wall, great-bark, ironbark). Runs in a headless browser
// like paint_extract.js; each layer comes back as a PNG data URL keyed "folder/name". Painted at 128 px per tile. The two 1x1 walls
// use 256x256 box layers with their tile in the middle (centre 128,128) so root feet can reach under neighbours; the 2x2 Great Bark
// uses 384x384 with its footprint in the middle 256x256 (centre 192,192). Each wall's "join" layer is a 96x128 strip drawn from a
// tile's centre outward (x=0 at the centre, the tile's edge at x=64), which the game turns to face every neighbouring wall.
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

// =============================== Bark Wall (art/plant/bark-wall/) ===============================
// light and quick to grow: a basket of living roots woven over and under each other through soft bark tissue, damp, a little
// springy. 1x1 in a 256x256 box (tile in the middle, centre 128,128) so its root feet and joining bundles can reach out.
{K=128;const D='bark-wall/',HW=55,ROOTC={cols:['#86646c','#52303e','#28121e'],edge:'#180710',shadow:'rgba(6,2,10,.5)',vein:1.4,veinCol:'rgba(170,236,214,.1)',veinCore:'rgba(220,255,240,.12)',ringCol:'rgba(16,4,14,.2)',ringStep:3,streak:'rgba(240,214,230,.16)'};
  const body=(k=1,dx=0,dy=0)=>rsq(c0,K,K,HW,HW,3.1,.022,1.3,dx,dy,k);let c0=null;
  // the roots of the weave: three running across, two down, each bending its own way and thinning to a tip that dives under at the edge
  const HS=[[[K-60,K-24],[K-5,K-42],[K+60,K-12],12,7],[[K+60,K+8],[K,K+28],[K-60,K+2],13,8],[[K-56,K+40],[K+10,K+30],[K+58,K+46],9,5]],
    VS=[[[K-26,K-60],[K-42,K],[K-16,K+60],11,6],[[K+22,K+60],[K+36,K+2],[K+24,K-60],12,7]];
  // roots: short root feet into the ground all round, and a damp stain where it stands (drawn under the neighbours)
  {const [cv,c]=mk(W2);sd=4002;haze(c,K+2,K+4,66,66,[[0,'rgba(10,4,12,.5)'],[.75,'rgba(10,4,12,.3)'],[1,'rgba(10,4,12,0)']]);
    for(let k=0;k<9;k++){const a=k/9*6.283+.3+rnd()*.3,r0=44,r1=62+rnd()*8,b=a+(rnd()-.5)*.5;
      taper(c,K+Math.cos(a)*r0,K+Math.sin(a)*r0,K+Math.cos(b)*(r0+r1)/2,K+Math.sin(b)*(r0+r1)/2,K+Math.cos(a)*r1,K+Math.sin(a)*r1,12+rnd()*3,3,{...ROOTC,cols:['#6e4a54','#46283a','#22101a'],streak:'rgba(240,214,230,.12)'});
      pit(c,K+Math.cos(a)*r1,K+Math.sin(a)*r1,3,a);}
    put(D+'roots',cv);}
  {const [cv,c]=mk(W2);c0=c;sd=4003;shadow(c,K,K,74,.6);
    c.fillStyle='#1a0a0e';body(1.04,2,3);c.fill();
    const g=c.createRadialGradient(K-26,K-30,6,K,K,HW*1.3);g.addColorStop(0,'#a07060');g.addColorStop(.55,'#6a4236');g.addColorStop(1,'#34191c');c.fillStyle=g;body();c.fill();
    // the bark tissue: vertical grain, soft creases, damp speckle
    c.save();body();c.clip();
    // grain that flows round two knots in the tissue, as in living bark, rather than running straight
    const KN=[[K-20,K+16,9],[K+24,K-22,7]],flow=(x,y)=>{let a=Math.PI/2+.35*Math.sin(x/17+y/29);for(const [kx,ky,r] of KN){const dx=x-kx,dy=y-ky,d=Math.hypot(dx,dy);if(d<r*3.2){const w=1-d/(r*3.2);a=a*(1-w)+(Math.atan2(dy,dx)+Math.PI/2)*w;}}return a;};
    for(let k=0;k<340;k++){const x=K-60+rnd()*120,y=K-60+rnd()*120,a=flow(x,y),l=6+rnd()*14;c.strokeStyle=['rgba(30,10,12,.34)','rgba(220,170,150,.13)','rgba(60,24,26,.3)'][k%3];c.lineWidth=.7+rnd()*.9;c.lineCap='round';
      c.beginPath();c.moveTo(x-Math.cos(a)*l/2,y-Math.sin(a)*l/2);c.lineTo(x+Math.cos(a)*l/2,y+Math.sin(a)*l/2);c.stroke();}
    for(const [kx,ky,r] of KN){haze(c,kx,ky,r*1.4,r*1.2,[[0,'rgba(12,3,6,.85)'],[.5,'rgba(40,14,16,.5)'],[1,'rgba(40,14,16,0)']]);for(let q=1;q<4;q++){c.strokeStyle='rgba(18,5,8,.35)';c.lineWidth=1;c.beginPath();c.ellipse(kx,ky,r*(.8+q*.45),r*(.65+q*.38),.3,0,7);c.stroke();}}
    for(let k=0;k<9;k++){const x=K-48+rnd()*96,y=K-48+rnd()*96;seam(c,wander(x,y,Math.PI/2+(rnd()-.5)*.6,14+rnd()*14,4,.4),1.8);}
    speck(c,900,()=>[K-60+rnd()*120,K-60+rnd()*120],.12,.06);
    for(let k=0;k<12;k++)drop(c,K-50+rnd()*100,K-50+rnd()*100,1.2+rnd()*1.8,.38);
    // the inner edge darkens where the tissue curls under
    const ao=c.createRadialGradient(K,K,HW*.55,K,K,HW*1.12);ao.addColorStop(0,'rgba(10,2,6,0)');ao.addColorStop(1,'rgba(10,2,6,.55)');c.fillStyle=ao;c.fillRect(0,0,W2,W2);c.restore();
    // the weave: across, then down, then the across strands brought back over at alternate crossings
    const rt=S=>taper(c,S[0][0],S[0][1],S[1][0],S[1][1],S[2][0],S[2][1],S[3],S[4],ROOTC);
    for(const S of HS)rt(S);for(const S of VS)rt(S);
    for(let i=0;i<3;i++)for(let j=0;j<2;j++)if((i+j)%2===0){const [x,y]=cross(HS[i],VS[j]);c.save();c.beginPath();c.arc(x,y,11,0,7);c.clip();rt(HS[i]);c.restore();}
    rimLight(c,()=>body(.985,-.6,-.8),W2,'rgba(255,226,220,.26)',1.6);
    put(D+'base',cv);}
  // wound1: what the first hits do: split bark, a few scraped paler patches, beads of sap in the cracks
  {const [cv,c]=mk(W2);c0=c;sd=4004;c.save();body();c.clip();c.fillStyle='rgba(24,6,12,.14)';c.fillRect(0,0,W2,W2);
    for(let k=0;k<5;k++){const x=K-40+rnd()*80,y=K-40+rnd()*80;haze(c,x,y,10+rnd()*6,6+rnd()*4,[[0,'rgba(214,170,150,.28)'],[1,'rgba(214,170,150,0)']]);}
    for(let k=0;k<6;k++){const a=rnd()*6.283,x=K+(rnd()-.5)*70,y=K+(rnd()-.5)*70;for(const P0 of crack(x,y,a,24+rnd()*16,2)){line(c,P0,3,'rgba(10,2,6,.85)');line(c,P0.map(([x,y])=>[x-.8,y-.9]),.8,'rgba(255,214,200,.3)');}}
    for(let k=0;k<5;k++){const x=K+(rnd()-.5)*70,y=K+(rnd()-.5)*70;c.fillStyle='rgba(150,40,80,.85)';c.beginPath();c.arc(x,y,2+rnd()*1.5,0,7);c.fill();drop(c,x-.6,y-.8,1.6,.7);}
    c.restore();put(D+'wound1',cv);}
  // wound2: badly hurt: deep splits through to raw, wet tissue, bark torn back, one strand snapped and fraying
  {const [cv,c]=mk(W2);c0=c;sd=4005;c.save();body(1.02);c.clip();c.fillStyle='rgba(34,6,18,.3)';c.fillRect(0,0,W2,W2);
    gash(c,K-12,K-16,-.5,64,9,BARK_RAW,['rgba(40,14,14,.8)','#c9a090']);gash(c,K+20,K+20,.35,50,8,BARK_RAW,['rgba(40,14,14,.8)','#c9a090']);gash(c,K-26,K+28,1.2,30,4.5,BARK_RAW,['rgba(40,14,14,.8)','#c9a090']);
    // the snapped strand: a dark break with frayed fibres either side
    {const x=K+30,y=K-30;haze(c,x,y,14,10,[[0,'rgba(8,2,6,.9)'],[1,'rgba(8,2,6,0)']]);for(let k=0;k<12;k++){const a=(k<6?Math.PI:0)+(rnd()-.5)*1.3;hair(c,x,y,a,7+rnd()*7,1.1,'rgba(176,136,148,.8)');}}
    c.restore();put(D+'wound2',cv);}
  // sheen: the wet light along the top of each strand and a few standing drops
  {const [cv,c]=mk(W2);sd=4006;c.lineCap='round';for(const S of [...HS,...VS]){c.strokeStyle='rgba(255,236,240,.13)';c.lineWidth=1.6;c.beginPath();c.moveTo(S[0][0]-2,S[0][1]-3);c.quadraticCurveTo(S[1][0]-2,S[1][1]-3,S[2][0]-2,S[2][1]-3);c.stroke();}
    for(let k=0;k<9;k++)drop(c,K-50+rnd()*100,K-50+rnd()*100,1.6+rnd()*2.2,.6);put(D+'sheen',cv);}
  // mend: healing light running along the strands (added on top while a Healing Pod restores it)
  {const [cv,c]=mk(W2);c.lineCap='round';for(const S of [...HS,...VS])for(const [lw,col] of [[9,'rgba(140,220,90,.18)'],[3,'rgba(200,250,150,.55)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(S[0][0],S[0][1]);c.quadraticCurveTo(S[1][0],S[1][1],S[2][0],S[2][1]);c.stroke();}
    put(D+'mend',cv);}
  put(D+'join',bridge(11,ROOTC,{...ROOTC,off:12}));
  put(D+'seep',bead('214,110,150','120,30,70'));}

// =============================== Great Bark (art/plant/great-bark/) ===============================
// four walls' worth grown as one: thick bark plates overlapping like shingles, bound by two great root bundles that knot in the
// middle. Darker and heavier than the Bark Wall. 2x2 in a 384x384 box (footprint in the middle 256x256, centre 192,192).
{K=192;const D='great-bark/',HW=116,ROOTC={cols:['#74545a','#46283a','#22101a'],edge:'#120510',shadow:'rgba(4,2,8,.6)',vein:2,veinCol:'rgba(170,236,214,.08)',veinCore:'rgba(220,255,240,.1)',ringCol:'rgba(12,2,10,.22)',ringStep:2,streak:'rgba(240,214,230,.14)'};
  let c0=null;const body=(k=1,dx=0,dy=0)=>rsq(c0,K,K,HW,HW,3.4,.018,2.1,dx,dy,k);
  sd=4101;const HB=[[K-124,K+4],[K,K-6],[K+124,K+3]],VB=[[K-3,K-124],[K+6,K],[K-2,K+124]];
  const PL=[];for(let r=0;r<5;r++)for(let q=-1;q<=2;q++){const x=K+(q-.5)*84+(r%2?42:0)+(rnd()-.5)*8,y=K-112+r*52+(rnd()-.5)*5;PL.push([x,y,88+rnd()*8,64+rnd()*6,(rnd()-.5)*.12,r]);}
  // one bark plate: a broad shield whose rounded lower edge overlaps the plate below it and throws a deep shadow on it
  const plate=(c,x,y,w,h,a,cols)=>{c.save();c.translate(x,y);c.rotate(a);const path=(dx=0,dy=0,k=1)=>{c.beginPath();c.moveTo(-w/2*k+dx,-h/2*k+dy);c.quadraticCurveTo(dx,-h/2*k-8+dy,w/2*k+dx,-h/2*k+dy);
      c.bezierCurveTo(w/2*k+4+dx,h*.1+dy,w*.3*k+dx,h/2*k+10+dy,dx,h/2*k+10+dy);c.bezierCurveTo(-w*.3*k+dx,h/2*k+10+dy,-w/2*k-4+dx,h*.1+dy,-w/2*k+dx,-h/2*k+dy);c.closePath();};
    c.fillStyle='rgba(4,1,4,.7)';path(2,7);c.fill();
    c.fillStyle='#160a0a';path(0,0,1.03);c.fill();
    const g=c.createLinearGradient(-w*.3,-h/2,w*.2,h/2+10);g.addColorStop(0,cols[0]);g.addColorStop(.55,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;path();c.fill();
    c.save();path();c.clip();fibres(c,-w/2,-h/2-8,w,h+18,110,(rnd()-.5)*.2,1.2,['rgba(24,8,8,.34)','rgba(220,170,150,.12)','rgba(50,20,18,.3)']);
      for(let k=0;k<3;k++)seam(c,wander(-w*.4+rnd()*w*.2,-h*.1+k*h*.2,(rnd()-.5)*.2,w*.5+rnd()*w*.3,5,.25),1.6);
      speck(c,240,()=>[(rnd()-.5)*w,(rnd()-.5)*h],.12,.05);
      const sh=c.createLinearGradient(0,h*.1,0,h/2+10);sh.addColorStop(0,'rgba(8,2,4,0)');sh.addColorStop(1,'rgba(8,2,4,.5)');c.fillStyle=sh;c.fillRect(-w,-h,w*2,h*2);c.restore();
    c.strokeStyle='rgba(255,224,210,.24)';c.lineWidth=1.6;c.beginPath();c.moveTo(-w/2+5,-h/2+1);c.quadraticCurveTo(0,-h/2-6,w/2-5,-h/2+1);c.stroke();c.restore();};
  {const [cv,c]=mk(W);sd=4102;haze(c,K+3,K+5,132,132,[[0,'rgba(8,3,10,.6)'],[.75,'rgba(8,3,10,.32)'],[1,'rgba(8,3,10,0)']]);
    // buttress roots at the corners and the middle of each side, heavier than the Bark Wall's feet
    for(let k=0;k<12;k++){const a=k/12*6.283+.26+rnd()*.15,r0=100,r1=128+rnd()*12,b=a+(rnd()-.5)*.4,cr=1/Math.max(Math.abs(Math.cos(a)),Math.abs(Math.sin(a)))**.35;
      taper(c,K+Math.cos(a)*r0*cr,K+Math.sin(a)*r0*cr,K+Math.cos(b)*(r0+r1)/2*cr,K+Math.sin(b)*(r0+r1)/2*cr,K+Math.cos(a)*r1*cr,K+Math.sin(a)*r1*cr,22+rnd()*6,5,{...ROOTC,cols:['#5e4048','#3a2028','#1c0c12'],streak:'rgba(240,214,230,.1)'});
      pit(c,K+Math.cos(a)*r1*cr,K+Math.sin(a)*r1*cr,4,a);}
    put(D+'roots',cv);}
  {const [cv,c]=mk(W);c0=c;sd=4103;shadow(c,K,K,150,.65);
    c.fillStyle='#140708';body(1.03,3,5);c.fill();c.fillStyle='#3a1e1c';body();c.fill();
    c.save();body();c.clip();
    for(let r=4;r>=0;r--)for(const p of PL)if(p[5]===r)plate(c,p[0],p[1],p[2],p[3],p[4],['#8a5e4c','#5a3428','#2a1412']);
    const ao=c.createRadialGradient(K,K,HW*.6,K,K,HW*1.1);ao.addColorStop(0,'rgba(8,2,4,0)');ao.addColorStop(1,'rgba(8,2,4,.7)');c.fillStyle=ao;c.fillRect(0,0,W,W);c.restore();
    // the two great bundles, each a pair of roots twisted round each other, and the knot where they cross
    // each bundle grows out from the knot both ways, two roots twisting round each other and thinning as they dive under the rim
    for(const [S,w] of [[HB,22],[VB,20]]){const [a,m,b]=S,dx=S===HB?0:1,dy=S===HB?1:0;
      for(const e of [a,b]){const ex=m[0]+(e[0]-m[0])*.9,ey=m[1]+(e[1]-m[1])*.9,mx=(m[0]+ex)/2,my=(m[1]+ey)/2;
        taper(c,m[0]-dx*5,m[1]-dy*5,mx+dx*12,my+dy*12,ex-dx*4,ey-dy*4,w,w*.35,{...ROOTC,pow:1.4});
        taper(c,m[0]+dx*6,m[1]+dy*6,mx-dx*12,my-dy*12,ex+dx*5,ey+dy*5,w*.85,w*.3,{...ROOTC,pow:1.4});}}
    mound(c,K+2,K-2,20,18,.4,['#7a5862','#4a2a38','#1e0c14'],.12);
    for(let k=0;k<8;k++){const a=k/8*6.283+.2;lip(c,K+2+Math.cos(a)*18,K-2+Math.sin(a)*16,a,12,5,['#200c12','#4e2e3a','#7e5e68']);}
    rimLight(c,()=>body(.99,-.8,-1),W,'rgba(255,226,220,.22)',2);
    put(D+'base',cv);}
  {const [cv,c]=mk(W);c0=c;sd=4104;c.save();body();c.clip();c.fillStyle='rgba(24,6,12,.14)';c.fillRect(0,0,W,W);
    for(let k=0;k<8;k++){const x=K-90+rnd()*180,y=K-90+rnd()*180;haze(c,x,y,16+rnd()*8,9+rnd()*5,[[0,'rgba(210,160,140,.24)'],[1,'rgba(210,160,140,0)']]);}
    for(let k=0;k<11;k++){const a=rnd()*6.283,x=K+(rnd()-.5)*170,y=K+(rnd()-.5)*170;for(const P0 of crack(x,y,a,34+rnd()*24,2)){line(c,P0,3.8,'rgba(8,2,4,.88)');line(c,P0.map(([x,y])=>[x-1,y-1.1]),1,'rgba(255,214,200,.28)');}}
    for(let k=0;k<9;k++){const x=K+(rnd()-.5)*170,y=K+(rnd()-.5)*170;c.fillStyle='rgba(150,40,80,.85)';c.beginPath();c.arc(x,y,2.4+rnd()*2,0,7);c.fill();drop(c,x-.8,y-1,2,.7);}
    c.restore();put(D+'wound1',cv);}
  {const [cv,c]=mk(W);c0=c;sd=4105;c.save();body(1.02);c.clip();c.fillStyle='rgba(34,6,18,.3)';c.fillRect(0,0,W,W);
    for(const [x,y,a,l,w] of [[K-50,K-48,-.4,86,10],[K+46,K-30,.5,70,8],[K-30,K+52,.2,78,9],[K+56,K+60,-.9,52,6.5],[K-80,K+4,1.4,40,5]])gash(c,x,y,a,l,w,BARK_RAW,['rgba(36,12,12,.8)','#bf9484']);
    // a plate split clean off at one corner, the dark under-tissue showing
    haze(c,K+78,K-80,30,24,[[0,'rgba(30,6,16,.95)'],[.7,'rgba(60,14,34,.7)'],[1,'rgba(60,14,34,0)']]);for(let k=0;k<6;k++)drop(c,K+66+rnd()*24,K-92+rnd()*24,1.6+rnd()*2,.55);
    {const x=K-118,y=K+2;haze(c,x+14,y,16,12,[[0,'rgba(8,2,6,.9)'],[1,'rgba(8,2,6,0)']]);for(let k=0;k<14;k++)hair(c,x+14,y,Math.PI+(rnd()-.5)*1.4,9+rnd()*8,1.3,'rgba(160,124,136,.8)');}
    c.restore();put(D+'wound2',cv);}
  {const [cv,c]=mk(W);sd=4106;for(const p of PL){const [x,y,w,h,a]=p;if(Math.abs(x-K)>HW-20||Math.abs(y-K)>HW-20)continue;c.save();c.translate(x,y);c.rotate(a);
      c.strokeStyle='rgba(255,238,236,.1)';c.lineWidth=2.4;c.lineCap='round';c.beginPath();c.moveTo(-w*.3,-h/2+5);c.quadraticCurveTo(0,-h/2,w*.25,-h/2+5);c.stroke();c.restore();}
    for(const S of [HB,VB]){c.strokeStyle='rgba(255,236,240,.12)';c.lineWidth=2;c.beginPath();c.moveTo(S[0][0]-3,S[0][1]-4);c.quadraticCurveTo(S[1][0]-3,S[1][1]-4,S[2][0]-3,S[2][1]-4);c.stroke();}
    for(let k=0;k<14;k++)drop(c,K-100+rnd()*200,K-100+rnd()*200,1.8+rnd()*2.6,.55);drop(c,K-8,K-10,6,.6);put(D+'sheen',cv);}
  {const [cv,c]=mk(W);c.lineCap='round';for(const S of [HB,VB])for(const [lw,col] of [[16,'rgba(140,220,90,.16)'],[4,'rgba(200,250,150,.55)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(S[0][0],S[0][1]);c.quadraticCurveTo(S[1][0],S[1][1],S[2][0],S[2][1]);c.stroke();}
    sd=4107;for(const p of PL){const [x,y,w,h]=p;if(Math.abs(x-K)>HW||Math.abs(y-K)>HW)continue;c.strokeStyle='rgba(170,236,120,.3)';c.lineWidth=2;c.beginPath();c.moveTo(x-w*.4,y+h/2+4);c.quadraticCurveTo(x,y+h/2+12,x+w*.4,y+h/2+4);c.stroke();}
    haze(c,K,K,30,30,[[0,'rgba(200,250,150,.5)'],[1,'rgba(140,220,90,0)']]);put(D+'mend',cv);}
  put(D+'join',bridge(15,ROOTC,{...ROOTC,off:15}));
  put(D+'seep',bead('206,104,140','110,26,62'));}

// =============================== Ironbark (art/plant/ironbark/) ===============================
// the hardest bark: four domed plates fused so tight their seams are hairlines, near-black, flecked with the titanium it has taken
// up as pale mineral grit; hardened, knotted roots hooked round two of its corners. Still grown, not made: no straight lines anywhere.
{K=128;const D='ironbark/',HW=56,ROOTC={cols:['#5a4e66','#32283e','#16101c'],edge:'#07040a',shadow:'rgba(2,1,6,.65)',vein:1.2,veinCol:'rgba(150,180,220,.08)',veinCore:'rgba(210,225,255,.1)',ringCol:'rgba(0,0,4,.5)',ringStep:2,streak:'rgba(200,210,240,.12)'};
  let c0=null;const body=(k=1,dx=0,dy=0)=>rsq(c0,K,K,HW,HW,4,.014,.7,dx,dy,k);
  const grit=(c,n,x0,y0,w,h)=>{for(let k=0;k<n;k++){const x=x0+rnd()*w,y=y0+rnd()*h,s=1+rnd()*2.6,a=rnd()*6.283;c.fillStyle=rnd()<.6?'rgba(150,170,205,.32)':'rgba(5,4,10,.5)';c.beginPath();
    for(let i=0;i<3;i++){const b=a+i*2.1+(rnd()-.5)*.6;i?c.lineTo(x+Math.cos(b)*s,y+Math.sin(b)*s):c.moveTo(x+Math.cos(b)*s,y+Math.sin(b)*s);}c.closePath();c.fill();
    if(rnd()<.35){c.strokeStyle='rgba(210,225,255,.45)';c.lineWidth=.7;c.beginPath();c.moveTo(x+Math.cos(a)*s,y+Math.sin(a)*s);c.lineTo(x+Math.cos(a+2.1)*s,y+Math.sin(a+2.1)*s);c.stroke();}}};
  // the hardened roots: one hooked round the upper-left corner, one round the lower-right, one short one along the right side
  const FR=[[[K-HW-6,K+10],[K-HW-8,K-HW-8],[K+2,K-HW-6],19,4],[[K+HW+6,K-8],[K+HW+8,K+HW+8],[K-4,K+HW+6],19,4],[[K-HW+2,K+HW+6],[K-HW-6,K+HW-8],[K-HW-5,K+HW*.35],12,3]];
  sd=4201;const PL=[[-28,-26,30],[22,-30,29],[-30,24,30],[26,26,31],[-2,-2,24]].map(([x,y,r])=>[K+x+(rnd()-.5)*4,K+y+(rnd()-.5)*4,r]);
  {const [cv,c]=mk(W2);sd=4202;haze(c,K+2,K+4,66,66,[[0,'rgba(4,2,8,.6)'],[.75,'rgba(4,2,8,.34)'],[1,'rgba(4,2,8,0)']]);
    for(let k=0;k<8;k++){const a=k/8*6.283+.39+(rnd()-.5)*.2,r0=50,r1=72+rnd()*8,b=a+(rnd()-.5)*.3;
      taper(c,K+Math.cos(a)*r0,K+Math.sin(a)*r0,K+Math.cos(b)*(r0+r1)/2,K+Math.sin(b)*(r0+r1)/2,K+Math.cos(a)*r1,K+Math.sin(a)*r1,11+rnd()*3,3,{...ROOTC,ringStep:2});
      pit(c,K+Math.cos(a)*r1,K+Math.sin(a)*r1,3,a);}
    put(D+'roots',cv);}
  {const [cv,c]=mk(W2);c0=c;sd=4203;shadow(c,K,K,74,.7);
    c.fillStyle='#060408';body(1.04,2,3);c.fill();c.fillStyle='#0c0a12';body();c.fill();
    c.save();body();c.clip();
    // the plates: domed, lit from the upper left, crowded so tight they press into each other; the middle one sits on top
    for(const [x,y,r] of PL){const p=()=>rsq(c,x,y,r,r*.94,2.4,.05,x*.05,0,0,1);
      c.fillStyle='rgba(0,0,2,.7)';rsq(c,x,y,r,r*.94,2.4,.05,x*.05,1.5,2.5,1.04);c.fill();
      p();const g=c.createRadialGradient(x-r*.45,y-r*.5,2,x,y,r*1.4);g.addColorStop(0,'#6c6882');g.addColorStop(.45,'#3a344e');g.addColorStop(1,'#14101c');c.fillStyle=g;c.fill();
      c.save();p();c.clip();fibres(c,x-r,y-r,r*2,r*2,46,Math.PI/2+(rnd()-.5)*.3,.9,['rgba(4,2,8,.4)','rgba(170,180,215,.08)']);grit(c,r*3.4,x-r,y-r,r*2,r*2);
        drop(c,x-r*.4,y-r*.45,r*.26,.18);c.restore();
      p();c.strokeStyle='rgba(2,1,4,.9)';c.lineWidth=2.2;c.stroke();}
    const ao=c.createRadialGradient(K,K,HW*.6,K,K,HW*1.1);ao.addColorStop(0,'rgba(0,0,2,0)');ao.addColorStop(1,'rgba(0,0,2,.6)');c.fillStyle=ao;c.fillRect(0,0,W2,W2);c.restore();
    // the hardened roots gripping it, each ending in a knot where it bites into the ground
    for(const S of FR){taper(c,S[0][0],S[0][1],S[1][0],S[1][1],S[2][0],S[2][1],S[3],S[4],{...ROOTC,pow:.75});
      const [x,y]=S[2],a=Math.atan2(S[2][1]-S[1][1],S[2][0]-S[1][0]);for(let k=0;k<5;k++)hair(c,x,y,a+(rnd()-.5)*1.6,5+rnd()*6,.9,'rgba(40,32,52,.85)');
      mound(c,S[0][0],S[0][1],S[3]*.55,S[3]*.5,S[0][0]*.1,['#544a64','#2c2438','#100a16'],.18);}
    put(D+'base',cv);}
  {const [cv,c]=mk(W2);c0=c;sd=4204;c.save();body();c.clip();c.fillStyle='rgba(120,130,160,.08)';c.fillRect(0,0,W2,W2);
    for(let k=0;k<6;k++){const a=rnd()*6.283,x=K+(rnd()-.5)*70,y=K+(rnd()-.5)*70;for(const P0 of crack(x,y,a,22+rnd()*14,2,.7)){line(c,P0,3,'rgba(0,0,2,.92)');line(c,P0.map(([x,y])=>[x-.8,y-.9]),.9,'rgba(200,215,245,.42)');}}
    for(let k=0;k<4;k++){const x=K+(rnd()-.5)*70,y=K+(rnd()-.5)*70;haze(c,x,y,9,7,[[0,'rgba(180,195,225,.26)'],[1,'rgba(180,195,225,0)']]);}
    for(let k=0;k<4;k++){const x=K+(rnd()-.5)*70,y=K+(rnd()-.5)*70;c.fillStyle='rgba(110,40,110,.85)';c.beginPath();c.arc(x,y,1.8+rnd()*1.2,0,7);c.fill();drop(c,x-.6,y-.8,1.4,.7);}
    c.restore();put(D+'wound1',cv);}
  {const [cv,c]=mk(W2);c0=c;sd=4205;c.save();body(1.02);c.clip();c.fillStyle='rgba(30,8,36,.3)';c.fillRect(0,0,W2,W2);
    const RAW=['#9a5aa0','#5a2462','#1a0620'];
    gash(c,K-14,K-10,-.7,56,8,RAW,['rgba(0,0,2,.9)','#8a90a8']);gash(c,K+22,K+24,.25,42,7,RAW,['rgba(0,0,2,.9)','#8a90a8']);
    // a chip knocked out of one plate: dark violet under-tissue with a few raw crystals in it
    {const x=K+30,y=K-30;haze(c,x,y,15,13,[[0,'rgba(30,8,36,.95)'],[.7,'rgba(50,16,60,.7)'],[1,'rgba(50,16,60,0)']]);grit(c,16,x-10,y-9,20,18);}
    c.restore();put(D+'wound2',cv);}
  {const [cv,c]=mk(W2);sd=4206;for(const [x,y,r] of PL){c.strokeStyle='rgba(220,232,255,.2)';c.lineWidth=2;c.lineCap='round';
      c.beginPath();c.arc(x,y,r*.7,Math.PI*1.1,Math.PI*1.45);c.stroke();}
    for(let k=0;k<26;k++){const x=K-50+rnd()*100,y=K-50+rnd()*100;c.fillStyle=`rgba(230,240,255,${.35+rnd()*.4})`;c.fillRect(x,y,1.4,1.4);}
    for(const S of FR){c.strokeStyle='rgba(220,226,255,.16)';c.lineWidth=1.8;c.beginPath();c.moveTo(S[0][0]-2,S[0][1]-2);c.quadraticCurveTo(S[1][0]-2,S[1][1]-2,S[2][0]-2,S[2][1]-2);c.stroke();}
    put(D+'sheen',cv);}
  {const [cv,c]=mk(W2);c.lineCap='round';for(const [x,y,r] of PL)for(const [lw,col] of [[7,'rgba(140,220,90,.14)'],[2,'rgba(200,250,150,.5)']]){c.strokeStyle=col;c.lineWidth=lw;rsq(c,x,y,r,r*.94,2.4,.05,x*.05,0,0,1);c.stroke();}
    for(const S of FR)for(const [lw,col] of [[7,'rgba(140,220,90,.12)'],[2,'rgba(200,250,150,.4)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(S[0][0],S[0][1]);c.quadraticCurveTo(S[1][0],S[1][1],S[2][0],S[2][1]);c.stroke();}
    put(D+'mend',cv);}
  put(D+'join',bridge(11,ROOTC,{...ROOTC,off:11,knot:['#5e5470','#30283c','#120c18']}));
  put(D+'seep',bead('150,80,170','70,20,90'));}
return out;})()
