// Paints the Root Tap, Deep Root and Chitin Vat layers (art/plant/root-tap, deep-root, chitin-vat). Runs in a headless browser like
// paint_organs.js; each layer comes back as a PNG data URL keyed "folder/name". Painted at 128 px per tile: the three are 2x2 growths,
// so their box layers are 384x384 with the footprint in the middle 256x256 and its centre at (192,192).
// Channels are 128x128 (one tile): the Vine's own vessel cross-section from the tile's right edge inward, so a Vine or Swift Vine
// that meets one of these growths carries straight on into it. The game turns them to whichever edge tile has a connection.
// Tendril tips and chamber sizes are repeated in the game (RT_TIPS, DR_TIPS, XG) so its pulses start where the painted roots end.
(()=>{
const P=128,C=64,W=384,K=192;
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
// tendril tips: [angle, distance from the footprint centre in px at 128 px a tile]; the game's RT_TIPS repeats these
const RT_TIPS=[[-2.34,158],[-1.40,120],[-0.78,156],[0.80,158],[1.78,120],[2.40,154]];
{const D='root-tap/',SX=58,SY=54,SCY=K-4;
  // roots: a fine net from each tendril tip, a little past the footprint, under neighbours
  {const [cv,c]=mk(W);sd=3711;hairRoots(c,RT_TIPS,40,2.6);put(D+'roots',cv);}
  // base: the root crown, thick fleshy knuckles round the sac, and a dark wet ring where it sits in the ground
  {const [cv,c]=mk(W);sd=3712;shadow(c,K,K,118,.62);
    const g=c.createRadialGradient(K,K,40,K,K,112);g.addColorStop(0,'rgba(10,4,16,.7)');g.addColorStop(.7,'rgba(14,6,22,.4)');g.addColorStop(1,'rgba(14,6,22,0)');c.fillStyle=g;c.beginPath();c.arc(K,K,112,0,7);c.fill();
    crown(c,RT_TIPS,78,40,['#9a64b2','#62307e','#30123e'],{lw:.34});
    // where the crown pinches round the sac
    c.strokeStyle='rgba(10,3,18,.6)';c.lineWidth=5;c.beginPath();c.ellipse(K,SCY,SX+8,SY+8,0,0,7);c.stroke();
    put(D+'base',cv);}
  // tendrils: fine roots from the crown to the deposit, each ending in a pit where it dissolves the mineral (the game pulls them in)
  {const [cv,c]=mk(W);sd=3713;
    for(const [a,r] of RT_TIPS){const x1=K+Math.cos(a)*r,y1=K+Math.sin(a)*r,bend=(rnd()<.5?1:-1)*(.22+rnd()*.18);pit(c,x1,y1,7,a);
      // the tip splits into fine roots that fan out over the deposit
      for(const d of [-.55,.5,.05]){const l=15+rnd()*6;taper(c,x1-Math.cos(a)*10,y1-Math.sin(a)*10,x1+Math.cos(a+d*.6)*l*.4,y1+Math.sin(a+d*.6)*l*.4,x1+Math.cos(a+d)*l,y1+Math.sin(a+d)*l,4.2,1.2,{rings:false,vein:.7});}
      taper(c,K+Math.cos(a)*84,K+Math.sin(a)*84,K+Math.cos(a+bend)*(r*.62),K+Math.sin(a+bend)*(r*.62),x1,y1,20,5,{ringStep:3,vein:2,cols:['#8a58a8','#5a2e76','#301446']});}
    put(D+'tendrils',cv);}
  // sac: the absorption chamber's fluid, pale and clear enough to see what it holds
  {const [cv,c]=mk(W);sd=3714;c.save();blobPath(c,K,SCY,SX,SY,.03,1.1);c.clip();
    const g=c.createRadialGradient(K-14,SCY-18,4,K,SCY,SX*1.05);g.addColorStop(0,'rgba(214,236,232,.78)');g.addColorStop(.45,'rgba(140,128,184,.72)');g.addColorStop(1,'rgba(52,22,74,.92)');c.fillStyle=g;c.fillRect(0,0,W,W);
    // where the tendrils' channels open into the sac
    for(const [a] of RT_TIPS){const x=K+Math.cos(a)*SX*.92,y=SCY+Math.sin(a)*SY*.92;glow(c,x,y,12,'30,10,44',.55);c.strokeStyle='rgba(190,240,224,.3)';c.lineWidth=2;c.beginPath();c.moveTo(x,y);c.lineTo(K+Math.cos(a)*SX*.6,SCY+Math.sin(a)*SY*.6);c.stroke();}
    for(let k=0;k<26;k++){const a=rnd()*6.283,r=SX*(.75+rnd()*.25);c.fillStyle='rgba(200,240,226,.12)';c.beginPath();c.ellipse(K+Math.cos(a)*r,SCY+Math.sin(a)*r*.93,2.5,5,a,0,7);c.fill();}
    c.restore();put(D+'sac',cv);}
  {const [cv,c]=mk(W);sd=3715;membrane(c,K,SCY,SX+5,SY+5,1.1,'184,140,222','74,32,98','rgba(30,10,44,.5)',{a0:.03,a1:.13,veins:12,speck:380,wob:.03});put(D+'membrane',cv);}
  // veins: the channels in the sac wall and the crown, lit (additively) while a pulse runs to the sac
  {const [cv,c]=mk(W);sd=3716;for(const [a,r] of RT_TIPS){const P0=[];let rr=r*.9,aa=a;for(let s=0;s<7;s++){P0.push([K+Math.cos(aa)*rr,K+Math.sin(aa)*rr]);rr-=(r*.9-SX*.5)/6;aa+=(rnd()-.5)*.12;}
      for(const [lw,col] of [[5,'rgba(120,230,206,.12)'],[1.6,'rgba(170,246,226,.5)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(P0[0][0],P0[0][1]);for(let i=1;i<P0.length;i++)c.lineTo(P0[i][0],P0[i][1]);c.stroke();}}
    put(D+'veins',cv);}
  {const [cv,c]=mk(W);drop(c,K-26,SCY-26,11,.6);drop(c,K-6,SCY-40,5,.55);drop(c,K+30,SCY-14,3.5,.45);drop(c,K+12,SCY+30,2.6,.4);
    for(let k=0;k<8;k++){const a=rnd()*6.283,r=70+rnd()*14;drop(c,K+Math.cos(a)*r,K+Math.sin(a)*r,2+rnd()*2,.4);}put(D+'shine',cv);}
  put(D+'grain',grain());
  const [ch,cg]=stub(.7);put(D+'chan',ch);put(D+'chan_glow',cg);
  put(D+'pulse',pulseSprite('170,246,226'));}

// =============================== Deep Root (art/plant/deep-root/) ===============================
// the same organ, evolved: a heavier crown armoured with hardened cellulose ridges, thicker and longer tendrils, and a smaller
// pressure chamber held in by ribs. The game's DR_TIPS repeats these tips.
const DR_TIPS=[[-2.36,164],[-1.52,122],[-0.80,162],[0.02,122],[0.76,164],[1.62,122],[2.38,162],[3.12,120]];
{const D='deep-root/',SX=46,SY=44,SCY=K-4;
  {const [cv,c]=mk(W);sd=3721;hairRoots(c,DR_TIPS,52,3.4);put(D+'roots',cv);}
  {const [cv,c]=mk(W);sd=3722;shadow(c,K,K,132,.7);
    const g=c.createRadialGradient(K,K,50,K,K,126);g.addColorStop(0,'rgba(8,3,14,.8)');g.addColorStop(.75,'rgba(10,4,18,.45)');g.addColorStop(1,'rgba(10,4,18,0)');c.fillStyle=g;c.beginPath();c.arc(K,K,126,0,7);c.fill();
    crown(c,DR_TIPS,92,30,['#64367e','#3c1c56','#1c0a2a'],{lw:.24,ring:7});
    // hardened cellulose ridges: pale, layered plates set like a lily's sepals round the chamber, with faint blue mineral glints
    {const R1=SX+34,R0=SX+4,cy=SCY;c.fillStyle='rgba(6,2,10,.6)';c.beginPath();c.ellipse(K+2,cy+4,R1+3,R1+1,0,0,7);c.fill();
      // the collar: layered cellulose, pale where it is oldest and hardest, split into armoured segments
      const g=c.createRadialGradient(K-14,cy-16,R0*.6,K,cy,R1);g.addColorStop(0,'#c0aac6');g.addColorStop(.55,'#86689a');g.addColorStop(1,'#3a2048');
      c.fillStyle=g;c.beginPath();c.ellipse(K,cy,R1,R1-2,0,0,7);c.fill();
      const n=9;for(let k=0;k<n;k++){const a=k/n*6.283+.15;
        for(const [lw,col,d] of [[4,'rgba(20,8,30,.8)',0],[1.4,'rgba(236,226,246,.35)',.03]]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(K+Math.cos(a+d)*R0,cy+Math.sin(a+d)*R0);c.quadraticCurveTo(K+Math.cos(a+d+.1)*(R0+R1)/2,cy+Math.sin(a+d+.1)*(R0+R1)/2,K+Math.cos(a+d)*R1,cy+Math.sin(a+d)*R1);c.stroke();}
        // growth layers along each segment and a few pale-blue mineral glints
        for(let r=R0+5;r<R1-2;r+=5){c.strokeStyle='rgba(30,12,40,.3)';c.lineWidth=1;c.beginPath();c.arc(K,cy,r,a+.08,a+6.283/n-.06);c.stroke();}
        c.strokeStyle='rgba(176,214,255,.5)';c.lineWidth=1.2;c.beginPath();c.arc(K,cy,R0+8+rnd()*12,a+.2,a+.2+.25+rnd()*.2);c.stroke();
        c.fillStyle='rgba(200,230,255,.75)';c.beginPath();c.arc(K+Math.cos(a+.4)*(R0+14),cy+Math.sin(a+.4)*(R0+14),1.2+rnd(),0,7);c.fill();}
      c.strokeStyle='rgba(14,4,22,.85)';c.lineWidth=2.4;c.beginPath();c.ellipse(K,cy,R1,R1-2,0,0,7);c.stroke();
      c.strokeStyle='rgba(240,232,250,.35)';c.lineWidth=1.6;c.beginPath();c.ellipse(K,cy,R1-3,R1-5,0,Math.PI*1.05,Math.PI*1.6);c.stroke();}
    put(D+'base',cv);}
  {const [cv,c]=mk(W);sd=3723;
    for(const [a,r] of DR_TIPS){const x1=K+Math.cos(a)*r,y1=K+Math.sin(a)*r,bend=(rnd()<.5?1:-1)*(.12+rnd()*.12);pit(c,x1,y1,9,a);
      for(const d of [-.6,.55,0]){const l=16+rnd()*5;taper(c,x1-Math.cos(a)*12,y1-Math.sin(a)*12,x1+Math.cos(a+d*.6)*l*.4,y1+Math.sin(a+d*.6)*l*.4,x1+Math.cos(a+d)*l,y1+Math.sin(a+d)*l,6,1.6,{rings:false,vein:.9,cols:['#6a3c86','#42205c','#200c30']});}
      taper(c,K+Math.cos(a)*92,K+Math.sin(a)*92,K+Math.cos(a+bend)*(r*.78),K+Math.sin(a+bend)*(r*.7),x1,y1,24,7,{ringStep:2,vein:2.4,cols:['#6a3c86','#42205c','#200c30'],veinCol:'rgba(150,206,255,.3)',veinCore:'rgba(214,236,255,.42)'});}
    put(D+'tendrils',cv);}
  // the pressure chamber: dense fluid behind a thick clear wall
  {const [cv,c]=mk(W);sd=3724;c.save();blobPath(c,K,SCY,SX,SY,.02,.4);c.clip();
    const g=c.createRadialGradient(K-10,SCY-12,3,K,SCY,SX*1.05);g.addColorStop(0,'rgba(206,230,246,.82)');g.addColorStop(.5,'rgba(110,120,176,.8)');g.addColorStop(1,'rgba(30,14,50,.95)');c.fillStyle=g;c.fillRect(0,0,W,W);
    c.restore();
    // internal channels: from the chamber wall out under the ridges towards each tendril
    for(const [a] of DR_TIPS){for(const [lw,col] of [[7,'rgba(10,4,18,.55)'],[3,'rgba(120,150,200,.45)'],[1,'rgba(214,236,255,.45)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();
        c.moveTo(K+Math.cos(a)*(SX-4),SCY+Math.sin(a)*(SY-4));c.lineTo(K+Math.cos(a)*(SX+16),SCY+Math.sin(a)*(SY+16));c.stroke();}}
    put(D+'sac',cv);}
  // membrane: darker, thicker skin, with three hardened ribs across it holding the pressure in
  {const [cv,c]=mk(W);sd=3725;membrane(c,K,SCY,SX+5,SY+5,.4,'150,120,206','40,16,60','rgba(20,6,30,.55)',{a0:.05,a1:.16,veins:10,speck:260,wob:.02,rimW:3});
    c.save();blobPath(c,K,SCY,SX+5,SY+5,.02,.4);c.clip();
    for(const a of [.5,.5+2.094,.5+4.189]){c.save();c.translate(K,SCY);c.rotate(a);for(const [lw,col] of [[9,'rgba(10,4,16,.5)'],[6,'#6e5478'],[2.4,'rgba(214,200,226,.55)']]){c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(-SX-8,0);c.quadraticCurveTo(0,-14,SX+8,0);c.stroke();}
      c.fillStyle='rgba(180,214,255,.6)';c.beginPath();c.arc(-4,-7,1.4,0,7);c.fill();c.restore();}
    c.restore();
    c.strokeStyle='rgba(30,10,44,.85)';c.lineWidth=5;blobPath(c,K,SCY,SX+7,SY+7,.02,.4);c.stroke();c.strokeStyle='rgba(160,140,180,.5)';c.lineWidth=1.6;blobPath(c,K,SCY,SX+9,SY+9,.02,.4);c.stroke();
    put(D+'membrane',cv);}
  {const [cv,c]=mk(W);sd=3726;for(const [a,r] of DR_TIPS){const P0=[];let rr=r*.92,aa=a;for(let s=0;s<8;s++){P0.push([K+Math.cos(aa)*rr,K+Math.sin(aa)*rr]);rr-=(r*.92-SX*.6)/7;aa+=(rnd()-.5)*.08;}
      for(const [lw,col] of [[7,'rgba(130,180,255,.12)'],[2.2,'rgba(180,214,255,.5)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(P0[0][0],P0[0][1]);for(let i=1;i<P0.length;i++)c.lineTo(P0[i][0],P0[i][1]);c.stroke();}}
    put(D+'veins',cv);}
  {const [cv,c]=mk(W);drop(c,K-18,SCY-20,8,.6);drop(c,K+16,SCY-8,3,.45);for(let k=0;k<10;k++){const a=rnd()*6.283,r=60+rnd()*30;drop(c,K+Math.cos(a)*r,K+Math.sin(a)*r,1.6+rnd()*2,.35);}put(D+'shine',cv);}
  put(D+'grain',grain());
  const [ch,cg]=stub(.82);put(D+'chan',ch);put(D+'chan_glow',cg);
  put(D+'pulse',pulseSprite('170,206,255','236,246,255'));}

// =============================== Chitin Vat (art/plant/chitin-vat/) ===============================
// a swollen translucent vat on a deep-purple fleshy foundation. Pale fluid inside, hardened plates forming in it, membrane folds
// round the opening on top. The game's XG repeats the vat and opening sizes.
{const D='chitin-vat/',VX=90,VY=84,VCY=K-4,OR=36;
  {const [cv,c]=mk(W);sd=3731;hairRoots(c,[[-2.4,120],[-.75,120],[.8,122],[2.35,120],[-1.57,110],[1.57,112]],34,2.6);put(D+'roots',cv);}
  // base: the fleshy foundation: heavy lobes spilling a little beyond the vat, with nutrient veins running up into it
  {const [cv,c]=mk(W);sd=3732;shadow(c,K,K,140,.7);
    for(let k=0;k<6;k++){const a=k/6*6.283+.5;mound(c,K+Math.cos(a)*62,K+Math.sin(a)*58,50,44,k,['#5a2a6e','#3a1650','#1c0828']);}
    mound(c,K,K+4,116,110,1.3,['#5e2c76','#3c1852','#1e0a2a'],.04);
    // nutrient veins over the foundation, converging on the vat
    for(let k=0;k<12;k++){let a=k/12*6.283+rnd()*.3,r=118;const P0=[];for(let s=0;s<6;s++){P0.push([K+Math.cos(a)*r,K+4+Math.sin(a)*r*.95]);a+=(rnd()-.5)*.12;r-=5;}
      for(const [lw,col] of [[4.6,'rgba(8,2,14,.5)'],[2.6,'#5a2a68'],[1,'rgba(226,170,236,.28)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(P0[0][0],P0[0][1]);for(let i=1;i<P0.length;i++)c.lineTo(P0[i][0],P0[i][1]);c.stroke();}}
    put(D+'base',cv);}
  // fluid: pale milky liquid filling the vat
  {const [cv,c]=mk(W);sd=3733;c.save();blobPath(c,K,VCY,VX,VY,.025,.8);c.clip();
    const g=c.createRadialGradient(K-24,VCY-28,6,K,VCY,VX*1.05);g.addColorStop(0,'rgba(218,212,222,.88)');g.addColorStop(.5,'rgba(148,128,174,.88)');g.addColorStop(1,'rgba(48,22,70,.96)');c.fillStyle=g;c.fillRect(0,0,W,W);
    for(let k=0;k<50;k++){const a=rnd()*6.283,r=VX*Math.sqrt(rnd())*.95;c.fillStyle='rgba(255,250,240,.12)';c.beginPath();c.arc(K+Math.cos(a)*r,VCY+Math.sin(a)*r*.94,1+rnd()*2.4,0,7);c.fill();}
    c.restore();put(D+'fluid',cv);}
  // swirl: faint streaks in the fluid (the game turns this slowly, faster while the vat works)
  {const [cv,c]=mk(W);sd=3734;c.save();blobPath(c,K,VCY,VX-4,VY-4,.025,.8);c.clip();
    for(let k=0;k<16;k++){const r=VX*(.25+rnd()*.68),a0=rnd()*6.283,len=.6+rnd()*1.1;c.strokeStyle=`rgba(${rnd()<.5?'255,250,236':'120,90,150'},${.1+rnd()*.14})`;c.lineWidth=2+rnd()*4;c.lineCap='round';c.beginPath();c.arc(K,VCY,r,a0,a0+len);c.stroke();}
    c.restore();put(D+'swirl',cv);}
  // plate: one hardened chitin plate, a rounded scale with growth lines, dark violet with a horn-like sheen and a pale hardened rim
  {const [cv,c]=mk(72);c.translate(36,36);const shape=()=>{c.beginPath();c.moveTo(0,-30);c.bezierCurveTo(22,-28,30,-6,24,12);c.bezierCurveTo(18,28,-18,28,-24,12);c.bezierCurveTo(-30,-6,-22,-28,0,-30);c.closePath();};
    c.fillStyle='rgba(10,4,16,.6)';c.save();c.translate(2,3);shape();c.fill();c.restore();
    shape();const g=c.createRadialGradient(-8,-12,2,0,0,32);g.addColorStop(0,'#9a86b4');g.addColorStop(.45,'#4e3a6e');g.addColorStop(1,'#20142e');c.fillStyle=g;c.fill();
    c.save();shape();c.clip();for(let i=1;i<6;i++){c.strokeStyle='rgba(12,6,20,.5)';c.lineWidth=1.3;c.beginPath();c.ellipse(0,26,26*i/5.5,48*i/5.5,0,Math.PI,2*Math.PI);c.stroke();
      c.strokeStyle='rgba(220,206,240,.22)';c.lineWidth=.9;c.beginPath();c.ellipse(0,25,26*i/5.5-1.5,48*i/5.5-1.5,0,Math.PI*1.1,Math.PI*1.6);c.stroke();}
    drop(c,-9,-15,8,.7);c.restore();
    shape();c.strokeStyle='rgba(12,4,20,.95)';c.lineWidth=3;c.stroke();shape();c.strokeStyle='rgba(226,214,244,.55)';c.lineWidth=1.3;c.save();c.translate(-.6,-.8);c.stroke();c.restore();put(D+'plate',cv);}
  // grains: coal (dark) and sand (pale) as they are drawn into the vat
  {const [cv,c]=mk(32);c.translate(16,16);c.beginPath();for(let i=0;i<7;i++){const a=i/7*6.283,r=9+rnd()*4;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();
    c.fillStyle='#19171e';c.fill();c.strokeStyle='rgba(150,150,170,.5)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(210,210,230,.4)';c.beginPath();c.arc(-3,-4,2.2,0,7);c.fill();put(D+'coal',cv);}
  {const [cv,c]=mk(32);for(let k=0;k<9;k++){const x=16+(rnd()-.5)*14,y=16+(rnd()-.5)*14,r=2.2+rnd()*2.2;const g=c.createRadialGradient(x-1,y-1,0,x,y,r);g.addColorStop(0,'#fff0d0');g.addColorStop(.6,'#e3c08d');g.addColorStop(1,'#8a6a40');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}put(D+'sand',cv);}
  // membrane: the vat's translucent wall, with the opening on top cut out of it
  {const [cv,c]=mk(W);sd=3735;membrane(c,K,VCY,VX+5,VY+5,.8,'186,150,214','64,24,88','rgba(36,12,52,.4)',{a0:.02,a1:.06,veins:16,speck:900,wob:.025,rimW:2.4});
    c.save();c.globalCompositeOperation='destination-out';const g=c.createRadialGradient(K,VCY-6,OR*.6,K,VCY-6,OR*1.15);g.addColorStop(0,'rgba(0,0,0,1)');g.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=g;c.beginPath();c.arc(K,VCY-6,OR*1.2,0,7);c.fill();c.restore();
    put(D+'membrane',cv);}
  // folds: soft flexible lips round the opening (the game draws them squeezing shut when a plate is finished)
  {const [cv,c]=mk(W);sd=3736;const n=11;
    for(let k=0;k<n;k++){const a=k/n*6.283+rnd()*.2;c.save();c.translate(K+Math.cos(a)*OR,VCY-6+Math.sin(a)*OR*.92);c.rotate(a+Math.PI/2);
      const w=19+rnd()*5,h=15+rnd()*4;const shape=()=>{c.beginPath();c.moveTo(-w/2,0);c.bezierCurveTo(-w/2,-h*.2,-w*.25,h*.9,0,h*.95);c.bezierCurveTo(w*.25,h*.9,w/2,-h*.2,w/2,0);c.quadraticCurveTo(0,-h*.5,-w/2,0);c.closePath();};
      c.fillStyle='rgba(6,2,10,.45)';c.save();c.translate(1,2.5);shape();c.fill();c.restore();
      shape();const g=c.createLinearGradient(0,-h*.4,0,h);g.addColorStop(0,'#3c1450');g.addColorStop(.55,'#7a3e92');g.addColorStop(1,'#c696da');c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(16,4,24,.7)';c.lineWidth=1.3;c.stroke();c.strokeStyle='rgba(240,214,255,.35)';c.lineWidth=1;c.beginPath();c.moveTo(-w*.3,h*.2);c.quadraticCurveTo(0,h*.7,w*.3,h*.2);c.stroke();c.restore();}
    // the lip's inner rim, wet
    c.strokeStyle='rgba(20,6,30,.7)';c.lineWidth=3;c.beginPath();c.ellipse(K,VCY-6,OR*.78,OR*.72,0,0,7);c.stroke();
    c.strokeStyle='rgba(240,220,255,.45)';c.lineWidth=1.4;c.beginPath();c.ellipse(K,VCY-6,OR*.74,OR*.68,0,Math.PI*1.05,Math.PI*1.6);c.stroke();
    put(D+'folds',cv);}
  {const [cv,c]=mk(W);sd=3737;for(let k=0;k<12;k++){let a=k/12*6.283+rnd()*.3,r=VX*.98;const P0=[];for(let s=0;s<6;s++){P0.push([K+Math.cos(a)*r,VCY+Math.sin(a)*r*.94]);a+=(rnd()-.5)*.25;r-=VX*.08;}
      for(const [lw,col] of [[5,'rgba(220,170,255,.10)'],[1.5,'rgba(236,200,255,.45)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(P0[0][0],P0[0][1]);for(let i=1;i<P0.length;i++)c.lineTo(P0[i][0],P0[i][1]);c.stroke();}}
    put(D+'veins',cv);}
  {const [cv,c]=mk(W);drop(c,K-50,VCY-46,14,.5);drop(c,K-20,VCY-70,7,.55);drop(c,K+58,VCY-26,5,.45);drop(c,K+36,VCY+56,4,.35);put(D+'shine',cv);}
  const [ch,cg]=stub(.85);put(D+'chan',ch);put(D+'chan_glow',cg);
  put(D+'pulse',pulseSprite('214,190,236','250,244,255'));}
return out;})()
