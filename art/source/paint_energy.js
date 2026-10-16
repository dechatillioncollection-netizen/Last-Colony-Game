// Paints the Sap Burner, Sunleaf and Spore Bellows layers (art/plant/sap-burner, sunleaf, spore-bellows). Runs in a headless browser
// like paint_extract.js; each layer comes back as a PNG data URL keyed "folder/name". Painted at 128 px per tile. The two 1x1 growths
// use 256x256 box layers with their tile in the middle (centre 128,128) so roots can reach under neighbours; the 2x2 Spore Bellows
// uses 384x384 with its footprint in the middle 256x256 (centre 192,192). Sizes the game needs to match are repeated in its EG table.
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
  c.strokeStyle='rgba(240,214,255,.38)';c.lineWidth=Math.max(1,w0*.08);c.beginPath();
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

// =============================== Root Tap (art/plant/root-tap/) ===============================
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

// =============================== Sap Burner (art/plant/sap-burner/) ===============================
// a compact metabolism organ: a dense, ridged violet body round a small translucent reaction chamber. The tissue nearest the chamber
// is heat-darkened; the chamber holds the coal it is digesting and glows amber while it works. The game's EG.combustion repeats R.
{K=128;const D='sap-burner/',R=27,TIPS=[[-2.5],[-1.45],[-.4],[.62],[1.66],[2.7]];
  {const [cv,c]=mk(W2);sd=3801;hairRoots(c,[[-2.3,46],[-.7,48],[.85,47],[2.4,46]],26,2.2);put(D+'roots',cv);}
  // base: the body: a heavy lobed crown of ridges round the chamber, damp, with a heat-darkened, sooty ring of tissue inside it
  {const [cv,c]=mk(W2);sd=3802;shadow(c,K,K,66,.6);
    crown(c,TIPS,47,9,['#7a3e88','#4a1c58','#22082c'],{lw:.5,ring:6});
    // the protective ridges: a raised rim of thick folds round the chamber
    c.strokeStyle='rgba(8,2,12,.7)';c.lineWidth=6;c.beginPath();c.arc(K,K,R+9,0,7);c.stroke();
    haze(c,K,K,R+11,R+11,[[0,'rgba(14,4,12,.95)'],[.7,'rgba(28,8,24,.8)'],[.88,'rgba(44,14,40,.4)'],[1,'rgba(44,14,40,0)']]);
    // scorched, hardened tissue: fine dark cracks and a few rust-brown flecks near the chamber
    for(let k=0;k<22;k++){const a=rnd()*6.283,r0=R+2+rnd()*4;line(c,wander(K+Math.cos(a)*r0,K+Math.sin(a)*r0,a,6+rnd()*7,3,.6),1,'rgba(6,2,4,.55)');}
    for(let k=0;k<16;k++){const a=rnd()*6.283,r=R+3+rnd()*7;c.fillStyle=rnd()<.5?'rgba(120,60,40,.3)':'rgba(10,4,6,.5)';c.beginPath();c.arc(K+Math.cos(a)*r,K+Math.sin(a)*r,.8+rnd()*1.4,0,7);c.fill();}
    put(D+'base',cv);}
  // chamber: the reaction fluid at rest, a deep translucent amber-brown
  {const [cv,c]=mk(W2);sd=3803;c.save();blobPath(c,K,K,R,R,.03,.6);c.clip();
    const g=c.createRadialGradient(K-6,K-7,2,K,K,R*1.05);g.addColorStop(0,'rgba(170,104,70,.85)');g.addColorStop(.55,'rgba(96,40,40,.9)');g.addColorStop(1,'rgba(30,8,20,.97)');c.fillStyle=g;c.fillRect(0,0,W2,W2);
    for(let k=0;k<18;k++){const a=rnd()*6.283,r=R*Math.sqrt(rnd())*.9;c.fillStyle='rgba(255,210,170,.1)';c.beginPath();c.arc(K+Math.cos(a)*r,K+Math.sin(a)*r,.8+rnd()*1.6,0,7);c.fill();}
    c.restore();put(D+'chamber',cv);}
  // glow: the heat of the reaction, added on top (the game sets how strongly)
  {const [cv,c]=mk(W2);haze(c,K,K,R*1.5,R*1.5,[[0,'rgba(255,236,170,.95)'],[.25,'rgba(255,184,80,.8)'],[.6,'rgba(230,110,40,.4)'],[1,'rgba(200,70,30,0)']]);put(D+'glow',cv);}
  // the coal it is digesting: a dark lump with amber cracks where it is breaking down
  {const [cv,c]=mk(48);sd=3804;c.translate(24,24);const n=8,Rr=[];for(let i=0;i<n;i++)Rr.push(13+rnd()*6);
    const path=()=>{c.beginPath();for(let i=0;i<=n;i++){const a=i/n*6.283,r=Rr[i%n];i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();};
    path();const g=c.createRadialGradient(-4,-5,1,0,0,19);g.addColorStop(0,'#3a3038');g.addColorStop(.7,'#16121a');g.addColorStop(1,'#0a080c');c.fillStyle=g;c.fill();
    c.save();path();c.clip();for(let k=0;k<6;k++){const a=rnd()*6.283;line(c,wander(Math.cos(a)*16,Math.sin(a)*16,a+Math.PI,14+rnd()*8,4,.8),1.6,'rgba(255,150,60,.85)');}c.restore();
    c.strokeStyle='rgba(255,170,90,.5)';c.lineWidth=1.2;path();c.stroke();put(D+'ember',cv);}
  // a piece of coal arriving by vine
  {const [cv,c]=mk(32);c.translate(16,16);c.beginPath();for(let i=0;i<7;i++){const a=i/7*6.283,r=9+rnd()*4;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();
    c.fillStyle='#19171e';c.fill();c.strokeStyle='rgba(150,150,170,.5)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(210,210,230,.4)';c.beginPath();c.arc(-3,-4,2.2,0,7);c.fill();put(D+'coal',cv);}
  // membrane: the chamber's clear skin
  {const [cv,c]=mk(W2);sd=3805;membrane(c,K,K,R+2,R+2,.6,'236,180,150','70,22,44','rgba(40,10,20,.45)',{a0:.02,a1:.12,veins:8,speck:90,wob:.03,rimW:2});put(D+'membrane',cv);}
  // ridges: the fleshy folds that close over the chamber's rim (the game opens them a little when it takes in coal)
  {const [cv,c]=mk(W2);sd=3806;const n=10;for(let k=0;k<n;k++){const a=k/n*6.283+rnd()*.15;lip(c,K+Math.cos(a)*(R+4),K+Math.sin(a)*(R+4),a+Math.PI,19+rnd()*3,8+rnd()*2,['#24082a','#52205c','#86488a']);}
    put(D+'ridges',cv);}
  // veins: the vessels that carry the made vigor away, lit (additively) as an energy pulse runs out along them
  {const [cv,c]=mk(W2);sd=3807;for(const [a] of TIPS){const P0=wander(K+Math.cos(a)*(R+6),K+Math.sin(a)*(R+6),a,30,5,.3);
      line(c,P0,5,'rgba(255,170,80,.14)');line(c,P0,1.6,'rgba(255,210,140,.6)');}
    put(D+'veins',cv);}
  {const [cv,c]=mk(W2);drop(c,K-11,K-12,6,.6);drop(c,K+5,K-17,2.6,.5);for(let k=0;k<7;k++){const a=rnd()*6.283,r=40+rnd()*12;drop(c,K+Math.cos(a)*r,K+Math.sin(a)*r,1.4+rnd()*1.6,.38);}put(D+'shine',cv);}
  const [ch,cg]=stub(.62);put(D+'chan',ch);put(D+'chan_glow',cg);
  put(D+'pulse',pulseSprite('255,176,90','255,240,206'));}

// =============================== Sunleaf (art/plant/sunleaf/) ===============================
// a delicate photosynthetic rosette: broad translucent leaves like water-lily pads with pale turquoise veins, fanning from a small
// wet stem knot, and a softly glowing heart where the channels meet. The game's EG.solar repeats the leaf angles.
{K=128;const D='sunleaf/';
  const LV=[[-2.2,58,28],[-.95,60,30],[.3,57,27],[1.5,59,29],[2.75,56,26]],LV2=[[-1.58,38,18],[-.33,36,17],[.9,37,17],[2.12,38,18],[3.36,35,16]];
  // one leaf from the centre along angle a: broad and rounded, widest past its middle, with a shallow notch at the base like a lily pad
  const leafPath=(c,a,r1,w,r0=6)=>{c.save();c.translate(K,K);c.rotate(a);c.beginPath();c.moveTo(r0,0);
    c.bezierCurveTo(r0+r1*.18,-w*.9,r1*.7,-w*1.15,r1,-w*.15);c.quadraticCurveTo(r1*1.03,0,r1,w*.15);c.bezierCurveTo(r1*.7,w*1.15,r0+r1*.18,w*.9,r0,0);c.closePath();c.restore();};
  const leaf=(c,a,r1,w,cols)=>{c.save();c.translate(2,3.5);leafPath(c,a,r1,w);c.fillStyle='rgba(4,10,12,.28)';c.fill();c.restore();
    leafPath(c,a,r1,w);const g=c.createLinearGradient(K,K,K+Math.cos(a)*r1,K+Math.sin(a)*r1);g.addColorStop(0,cols[0]);g.addColorStop(.6,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;c.fill();
    // the lit upper-left of the leaf and the cell texture of the membrane
    c.save();leafPath(c,a,r1,w);c.clip();haze(c,K+Math.cos(a)*r1*.5-6,K+Math.sin(a)*r1*.5-7,r1*.55,r1*.45,[[0,'rgba(236,255,250,.28)'],[1,'rgba(236,255,250,0)']]);
      for(let k=0;k<70;k++){const t=.2+rnd()*.8,s=(rnd()-.5)*w*1.6,x=K+Math.cos(a)*r1*t-Math.sin(a)*s,y=K+Math.sin(a)*r1*t+Math.cos(a)*s;c.strokeStyle='rgba(20,60,64,.16)';c.lineWidth=.6;c.beginPath();c.arc(x,y,1.6+rnd()*1.6,0,7);c.stroke();}
    c.restore();
    leafPath(c,a,r1,w);c.strokeStyle='rgba(10,30,36,.7)';c.lineWidth=1.4;c.stroke();
    c.save();leafPath(c,a,r1,w);c.clip();leafPath(c,a,r1*.97,w*.9,8);c.strokeStyle='rgba(220,255,246,.32)';c.lineWidth=1.1;c.stroke();c.restore();};
  {const [cv,c]=mk(W2);sd=3811;hairRoots(c,[[-1.9,22],[-.2,24],[1.3,22],[2.9,23]],34,1.8);put(D+'roots',cv);}
  // base: the soft shadow of the rosette on the ground and the small wet stem knot it grows from
  {const [cv,c]=mk(W2);sd=3812;haze(c,K+4,K+6,64,62,[[0,'rgba(4,10,14,.5)'],[.7,'rgba(4,10,14,.3)'],[1,'rgba(4,10,14,0)']]);mound(c,K,K,16,15,.4,['#6a4a7e','#3c2452','#1c0e2a'],.08);put(D+'base',cv);}
  // leaves: an outer ring of five broad pads and an inner ring of five smaller ones, translucent turquoise fading to lavender at the rims
  {const [cv,c]=mk(W2);sd=3813;c.globalAlpha=.86;for(const [a,r,w] of LV)leaf(c,a,r,w,['rgba(60,128,120,.95)','rgba(108,184,170,.82)','rgba(170,150,214,.85)']);
    c.globalAlpha=.92;for(const [a,r,w] of LV2)leaf(c,a,r,w,['rgba(58,120,118,.95)','rgba(124,200,182,.86)','rgba(196,176,232,.9)']);c.globalAlpha=1;put(D+'leaves',cv);}
  // veins: a midrib and paired side veins in each leaf, converging on the heart (lit additively by the game)
  {const [cv,c]=mk(W2);sd=3814;
    for(const [a,r] of [...LV,...LV2]){const mid=[];for(let t=0;t<=6;t++){const rr=8+(r-10)*t/6;mid.push([K+Math.cos(a)*rr,K+Math.sin(a)*rr]);}line(c,mid,3.6,'rgba(150,250,226,.14)');line(c,mid,1.2,'rgba(190,255,236,.62)');
      for(let k=1;k<5;k++){const t=k/5,rr=8+(r-10)*t;for(const sg of [-1,1]){const x0=K+Math.cos(a)*rr,y0=K+Math.sin(a)*rr,b=a+sg*(.95-t*.35),l=r*(.24-t*.08)+4;
          c.strokeStyle='rgba(180,255,232,.42)';c.lineWidth=.8;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(x0+Math.cos(b-sg*.3)*l*.6,y0+Math.sin(b-sg*.3)*l*.6,x0+Math.cos(b)*l,y0+Math.sin(b)*l);c.stroke();}}}
    put(D+'veins',cv);}
  // heart: where the channels meet: a cup of small lavender bracts round a softly luminous centre
  {const [cv,c]=mk(W2);sd=3815;haze(c,K,K,20,20,[[0,'rgba(210,255,240,.9)'],[.35,'rgba(140,240,214,.5)'],[1,'rgba(140,240,214,0)']]);
    for(let k=0;k<6;k++){const a=k/6*6.283+.3;lip(c,K+Math.cos(a)*7,K+Math.sin(a)*7,a+Math.PI,9,7,['#4a2a60','#9a70b8','#e0c8f0']);}
    haze(c,K,K,6,6,[[0,'rgba(240,255,250,1)'],[1,'rgba(200,255,240,0)']]);put(D+'heart',cv);}
  // sheens: wet light on the leaves in two arrangements; the game fades between them so the light seems to move over the surface
  for(const [nm,seed,off] of [['sheen_a',3816,0],['sheen_b',3817,.6]]){const [cv,c]=mk(W2);sd=seed;
    for(const [a,r,w] of LV){c.save();leafPath(c,a,r,w);c.clip();const t=.45+.25*Math.sin(a*3+off*5),px=K+Math.cos(a)*r*t,py=K+Math.sin(a)*r*t;
      c.translate(px,py);c.rotate(a+.8+off);haze(c,0,0,r*.34,r*.09,[[0,'rgba(255,255,255,.5)'],[1,'rgba(255,255,255,0)']]);c.restore();}
    for(let k=0;k<6;k++){const [a,r]=LV[(k+(off?2:0))%5],t=.3+rnd()*.55;drop(c,K+Math.cos(a)*r*t,K+Math.sin(a)*r*t,1.6+rnd()*2.2,.55);}put(D+nm,cv);}
  put(D+'pulse',pulseSprite('160,250,226','236,255,250'));}

// =============================== Spore Bellows (art/plant/spore-bellows/) ===============================
// a respiratory dispersal organ: three translucent bellows sacs, heavy with spore mist, on a fleshy root base, breathing out through
// frilled vents where they meet. The sacs are painted once each in their own image so the game can inflate them one by one.
{K=192;const D='spore-bellows/';
  {const [cv,c]=mk(W);sd=3821;hairRoots(c,[[-2.5,112],[-1.5,104],[-.4,114],[.75,110],[1.75,106],[2.75,112]],40,2.8);put(D+'roots',cv);}
  // base: the fleshy foundation, lobed where it grips the ground, with veins running up into the sacs
  {const [cv,c]=mk(W);sd=3822;shadow(c,K,K,132,.66);
    crown(c,[[-2.5],[-1.5],[-.4],[.75],[1.75],[2.75]],100,16,['#6a3480','#401a58','#1e0a2c'],{lw:.36,ring:8});
    for(let k=0;k<14;k++){const a=k/14*6.283+rnd()*.25;line(c,wander(K+Math.cos(a)*112,K+Math.sin(a)*108,a+Math.PI,46,6,.25),4.4,'rgba(8,2,14,.5)');}
    sd=3822;for(let k=0;k<14;k++){const a=k/14*6.283+rnd()*.25;const P0=wander(K+Math.cos(a)*112,K+Math.sin(a)*108,a+Math.PI,46,6,.25);line(c,P0,2.4,'#5e2a70');line(c,P0,.9,'rgba(230,180,246,.3)');}
    put(D+'base',cv);}
  // sac: one bellows sac in its own 160x160 image: a taut translucent bag, darker spore-laden fluid inside, a strong rim and wet light
  {const [cv,c]=mk(160);sd=3823;const X=80,Y=80,RX=66,RY=62;K=80;
    c.save();blobPath(c,X,Y,RX,RY,.03,.9);c.clip();
    const g=c.createRadialGradient(X-20,Y-22,4,X,Y,RX*1.05);g.addColorStop(0,'rgba(206,176,232,.8)');g.addColorStop(.5,'rgba(124,80,164,.82)');g.addColorStop(1,'rgba(44,16,64,.95)');c.fillStyle=g;c.fillRect(0,0,160,160);
    // pleats where the sac folds as it empties
    for(let k=0;k<7;k++){const a=k/7*6.283+.3;c.strokeStyle='rgba(30,8,44,.32)';c.lineWidth=3;c.beginPath();c.moveTo(X+Math.cos(a)*RX*.3,Y+Math.sin(a)*RY*.3);c.quadraticCurveTo(X+Math.cos(a+.2)*RX*.7,Y+Math.sin(a+.2)*RY*.7,X+Math.cos(a)*RX,Y+Math.sin(a)*RY);c.stroke();
      c.strokeStyle='rgba(236,210,255,.16)';c.lineWidth=1.2;c.beginPath();c.moveTo(X+Math.cos(a+.06)*RX*.32,Y+Math.sin(a+.06)*RY*.32);c.quadraticCurveTo(X+Math.cos(a+.26)*RX*.7,Y+Math.sin(a+.26)*RY*.7,X+Math.cos(a+.06)*RX,Y+Math.sin(a+.06)*RY);c.stroke();}
    c.restore();
    membrane(c,X,Y,RX,RY,.9,'200,160,236','56,20,80','rgba(40,12,58,.45)',{a0:.03,a1:.1,veins:10,speck:260,wob:.03,rimW:2.6});
    drop(c,X-24,Y-26,12,.62);drop(c,X-4,Y-40,4.5,.5);drop(c,X+30,Y-12,3,.4);
    put(D+'sac',cv);K=192;}
  // mist: the spores inside a sac, a grainy pale cloud the game shows more of as the sac fills
  {const [cv,c]=mk(128);sd=3824;haze(c,64,64,52,48,[[0,'rgba(236,220,250,.55)'],[.6,'rgba(200,170,236,.3)'],[1,'rgba(200,170,236,0)']]);
    for(let k=0;k<160;k++){const a=rnd()*6.283,r=Math.sqrt(rnd())*46;c.fillStyle=`rgba(${rnd()<.7?'250,240,255':'200,170,236'},${.25+rnd()*.4})`;c.beginPath();c.arc(64+Math.cos(a)*r,64+Math.sin(a)*r*.92,.7+rnd()*1.3,0,7);c.fill();}put(D+'mist',cv);}
  // vents: frilled openings where the three sacs meet, gill-like folds round dark mouths
  {const [cv,c]=mk(W);sd=3825;const V=[[K-4,K-6,15],[K+24,K+14,10],[K-24,K+16,10]];
    for(const [x,y,r] of V){for(let k=0;k<9;k++){const a=k/9*6.283+rnd()*.2;lip(c,x+Math.cos(a)*r,y+Math.sin(a)*r,a+Math.PI,r*.95,r*.75,['#3c1652','#8a54a6','#dcb4ee']);}
      haze(c,x,y,r*.9,r*.9,[[0,'rgba(6,2,10,.95)'],[.7,'rgba(20,6,30,.8)'],[1,'rgba(20,6,30,0)']]);c.strokeStyle='rgba(236,210,255,.4)';c.lineWidth=1.2;c.beginPath();c.arc(x,y,r*.7,Math.PI*1.1,Math.PI*1.6);c.stroke();}
    put(D+'vents',cv);}
  // a single spore, and a released puff of them
  {const [cv,c]=mk(24);haze(c,12,12,11,11,[[0,'rgba(255,250,255,1)'],[.35,'rgba(226,200,250,.7)'],[1,'rgba(200,160,240,0)']]);put(D+'spore',cv);}
  {const [cv,c]=mk(128);sd=3826;haze(c,64,64,60,60,[[0,'rgba(226,206,246,.38)'],[.55,'rgba(196,166,232,.2)'],[1,'rgba(196,166,232,0)']]);
    for(let k=0;k<120;k++){const a=rnd()*6.283,r=Math.pow(rnd(),.7)*56;c.fillStyle=`rgba(244,232,255,${.2+rnd()*.35})`;c.beginPath();c.arc(64+Math.cos(a)*r,64+Math.sin(a)*r,.6+rnd()*1.1,0,7);c.fill();}put(D+'puff',cv);}
  // veins: up the foundation into the sacs, lit as it breathes out
  {const [cv,c]=mk(W);sd=3827;for(let k=0;k<10;k++){const a=k/10*6.283+rnd()*.3;const P0=wander(K+Math.cos(a)*116,K+Math.sin(a)*112,a+Math.PI,60,6,.2);line(c,P0,6,'rgba(214,170,255,.12)');line(c,P0,1.6,'rgba(236,206,255,.5)');}put(D+'veins',cv);}
  put(D+'pulse',pulseSprite('214,180,250','250,240,255'));}
return out;})()
