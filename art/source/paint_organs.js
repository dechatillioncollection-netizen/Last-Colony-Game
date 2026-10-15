// Paints the Splitter Bulb, Sorting Gland, Resin Gland and Rootweb Node layers. Runs in a headless browser; each layer comes back
// as a PNG data URL, keyed "folder/name". Everything is painted at 128 px per tile (5.33x the game's 24 px tile).
// 1x1 layers are 128x128 and cover the tile exactly. Resin Gland layers are 384x384: the 2x2 footprint is the middle 256x256.
// Rootweb Node tendrils are 384x384 with the node's tile in the middle. Vessel stubs (channels) use the Vine's own cross-section
// at the tile edge, so a Vine or Swift Vine running into one of these organs carries straight on into it.
(()=>{
const P=128,C=64;
let sd=5150;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w=P,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};const put=(k,cv)=>out[k]=cv.toDataURL('image/png');
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
const glow=(c,x,y,r,rgb,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const drop=(c,x,y,r,a=.75)=>{const g=c.createRadialGradient(x-r*.35,y-r*.35,0,x,y,r);g.addColorStop(0,`rgba(255,255,255,${a})`);g.addColorStop(.45,'rgba(220,240,255,.2)');g.addColorStop(1,'rgba(220,240,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};
const blobPath=(c,x,y,rx,ry,wob,ph,n=40)=>{c.beginPath();for(let i=0;i<=n;i++){const a=i/n*Math.PI*2,k=1+wob*Math.sin(a*3+ph)+wob*.6*Math.sin(a*5+ph*2);i?c.lineTo(x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k):c.moveTo(x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k);}c.closePath();};
const speck=(c,n,fx)=>{for(let k=0;k<n;k++){const [x,y]=fx();c.fillStyle=rnd()<.5?'rgba(0,0,0,.1)':'rgba(236,200,255,.07)';c.fillRect(x,y,1.5,1.5);}};
const NL=[];for(let i=0;i<64*64;i++)NL.push(rnd());
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),
  a=NL[(yi&63)*64+(xi&63)],b=NL[(yi&63)*64+((xi+1)&63)],c=NL[((yi+1)&63)*64+(xi&63)],d=NL[((yi+1)&63)*64+((xi+1)&63)];return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
// ---------- the Vine's vessel, per pixel (same colours as paint_vine.js): violet tissue round a green sap lumen ----------
const RV=22*P/96;   // the Vine's radius at a tile edge, at this scale
function vessel(x,y,R,cy=C){const a=Math.abs(y-cy),d=a/R,n1=vn(x/16,y/16);
  if(d>1){const t=(a-R)/5.6;return [12,4,16,.42*Math.exp(-t*t)];}
  const nz=Math.sqrt(1-d*d),wall=sm(.6,.78,d),n3=vn(x/21+5,y/9);
  let wr=34+60*(nz*.55+n1*.3)+10*(n3-.5),wg=13+30*(nz*.55+n1*.3)-4*(n3-.5),wb=46+70*(nz*.55+n1*.3)-14*(n3-.5);
  const rimDark=.5+.5*sm(1,.85,d);wr*=rimDark;wg*=rimDark;wb*=rimDark;
  const q=Math.pow(Math.max(0,1-d/.7),2);let lr=24+34*q,lg=46+74*q,lb=22+24*q;
  let r=lr+(wr-lr)*wall,g=lg+(wg-lg)*wall,b=lb+(wb-lb)*wall,al=.76+.21*wall;
  const sp=Math.exp(-Math.pow((d-.86)/.05,2))*(.08+.42*sm(.45,.75,vn(x/12+3,y/40)));r+=150*sp;g+=118*sp;b+=192*sp;
  const ib=Math.exp(-Math.pow((d-.64)/.03,2))*.45;r+=110*ib;g+=74*ib;b+=140*ib;return [r,g,b,al];}
// a vessel running along +x from x0 to x1 (at row cy), radius R(x); fades in over the first `fade` px so it can tuck under a chamber
function chan(w,h,x0,x1,Rf,cy,fade=10){const [cv,c]=mk(w,h),img=c.createImageData(w,h),D=img.data;
  for(let y=0;y<h;y++)for(let x=Math.max(0,Math.floor(x0));x<Math.min(w,Math.ceil(x1));x++){const R=Rf(x+.5);let [r,g,b,a]=vessel(x+.5,y+.5,R,cy);a*=sm(x0,x0+fade,x+.5);if(a<=0)continue;
    const k=(y*w+x)*4;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=Math.min(255,a*255);}
  c.putImageData(img,0,0);return cv;}
// a soft light along a channel (blended 'lighter' by the game when that way is active)
function chanGlow(w,h,x0,x1,Rf,cy,rgb){const [cv,c]=mk(w,h),img=c.createImageData(w,h),D=img.data,[R0,G0,B0]=rgb;
  for(let y=0;y<h;y++)for(let x=Math.floor(x0);x<Math.ceil(x1);x++){const R=Rf(x+.5),d=Math.abs(y+.5-cy)/(R*.62);if(d>1)continue;const a=Math.pow(1-d*d,1.5)*sm(x0,x0+12,x+.5);
    const k=(y*w+x)*4;D[k]=R0;D[k+1]=G0;D[k+2]=B0;D[k+3]=a*200;}c.putImageData(img,0,0);return cv;}
// a translucent membrane dome: dark rim, faint tint inside, veins and a wet highlight; (cx,cy,rx,ry) with a wobbly outline
function membrane(c,cx,cy,rx,ry,ph,tint,rim,veinCol,opts={}){
  c.save();blobPath(c,cx,cy,rx,ry,opts.wob??.035,ph);c.clip();
  const g=c.createRadialGradient(cx-rx*.25,cy-ry*.3,2,cx,cy,Math.max(rx,ry)*1.05);g.addColorStop(0,`rgba(${tint},${opts.a0??.1})`);g.addColorStop(.7,`rgba(${tint},${opts.a1??.18})`);g.addColorStop(.92,`rgba(${rim},.75)`);g.addColorStop(1,`rgba(${rim},.95)`);
  c.fillStyle=g;c.fillRect(cx-rx*1.2,cy-ry*1.2,rx*2.4,ry*2.4);
  for(let k=0;k<(opts.veins??9);k++){const a=k/(opts.veins??9)*6.283+rnd()*.4,r0=.98,r1=.45+rnd()*.25;c.strokeStyle=veinCol;c.lineWidth=1+rnd()*.8;c.beginPath();
    c.moveTo(cx+Math.cos(a)*rx*r0,cy+Math.sin(a)*ry*r0);c.quadraticCurveTo(cx+Math.cos(a+.3)*rx*.75,cy+Math.sin(a+.3)*ry*.75,cx+Math.cos(a+.15)*rx*r1,cy+Math.sin(a+.15)*ry*r1);c.stroke();
    const b=a+.2;c.lineWidth=.7;c.beginPath();c.moveTo(cx+Math.cos(b)*rx*.8,cy+Math.sin(b)*ry*.8);c.lineTo(cx+Math.cos(b+.25)*rx*.62,cy+Math.sin(b+.25)*ry*.62);c.stroke();}
  speck(c,opts.speck??220,()=>{const a=rnd()*6.283,r=Math.sqrt(rnd());return [cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r];});
  c.restore();
  c.strokeStyle='rgba(8,2,14,.6)';c.lineWidth=1.8;blobPath(c,cx,cy,rx,ry,opts.wob??.035,ph);c.stroke();
  c.strokeStyle='rgba(236,206,255,.5)';c.lineWidth=1.6;c.beginPath();c.ellipse(cx,cy,rx*.84,ry*.84,0,Math.PI*1.08,Math.PI*1.55);c.stroke();}
function mound(c,cx,cy,rx,ry,ph,cols=['#6e3f80','#45215a','#22102c']){
  c.fillStyle='rgba(8,3,14,.75)';blobPath(c,cx+1.5,cy+2.5,rx+2,ry+2,.06,ph);c.fill();
  const g=c.createRadialGradient(cx-rx*.3,cy-ry*.35,3,cx,cy,Math.max(rx,ry));g.addColorStop(0,cols[0]);g.addColorStop(.5,cols[1]);g.addColorStop(1,cols[2]);c.fillStyle=g;blobPath(c,cx,cy,rx,ry,.06,ph);c.fill();
  c.save();blobPath(c,cx,cy,rx,ry,.06,ph);c.clip();speck(c,rx*ry*.5,()=>[cx+(rnd()*2-1)*rx,cy+(rnd()*2-1)*ry]);
  for(let k=0;k<8;k++){const a=rnd()*6.283,r=.4+rnd()*.5;drop(c,cx+Math.cos(a)*rx*r,cy+Math.sin(a)*ry*r,1.2+rnd()*1.8,.45);}c.restore();}
const shadow=(c,cx,cy,r,a=.55)=>{const g=c.createRadialGradient(cx+2,cy+3,r*.3,cx+2,cy+3,r);g.addColorStop(0,`rgba(4,2,10,${a})`);g.addColorStop(1,'rgba(4,2,10,0)');c.fillStyle=g;c.beginPath();c.arc(cx+2,cy+3,r,0,7);c.fill();};
const pulseSprite=(rgb,core='255,255,255')=>{const [cv,c]=mk(48);const g=c.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,`rgba(${core},.95)`);g.addColorStop(.3,`rgba(${rgb},.7)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(0,0,48,48);return cv;};
const rootlet=(c,x0,y0,a,len,w)=>{for(const [lw,col] of [[w+2.4,'rgba(10,4,16,.7)'],[w,'#4a2558'],[w*.35,'rgba(214,176,236,.32)']]){c.lineCap='round';c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x0,y0);
  c.quadraticCurveTo(x0+Math.cos(a+.35)*len*.55,y0+Math.sin(a+.35)*len*.55,x0+Math.cos(a)*len,y0+Math.sin(a)*len);c.stroke();}};

// =============================== Splitter Bulb (art/plant/splitter-bulb/) ===============================
{const D='splitter-bulb/',BR=46;
  // base: a low wet mound with short rootlets into the tile's corners
  {const [cv,c]=mk();shadow(c,C,C,60,.6);sd=811;for(let k=0;k<4;k++){const a=Math.PI/4+k*Math.PI/2+(rnd()-.5)*.3;rootlet(c,C+Math.cos(a)*30,C+Math.sin(a)*30,a,30+rnd()*8,4.2);}
    mound(c,C,C,BR+6,BR+5,1.3);put(D+'base',cv);}
  // a branch: the Vine's vessel from the tile's right edge into the bulb, narrowing a little as it enters
  const Rb=x=>RV*(.78+.22*sm(C+18,P-6,x));
  put(D+'chan',chan(P,P,C+14,P,Rb,C,14));
  put(D+'chan_glow',chanGlow(P,P,C+20,P,Rb,C,[150,250,226]));
  // valve: two thin soft cusps where the branch leaves the bulb, closing outwards (the game opens them as an item passes)
  {const [cv,c]=mk();for(const [lw,col] of [[4.4,'rgba(10,3,16,.4)'],[2.4,'rgba(214,240,236,.7)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';
      for(const s of [-1,1]){c.beginPath();c.moveTo(C+BR-8,C+s*15);c.quadraticCurveTo(C+BR+2,C+s*11,C+BR+9,C+s*2.5);c.stroke();}}
    put(D+'valve',cv);}
  // fluid: the central chamber, pale turquoise with the branching channels showing through
  {const [cv,c]=mk();const g=c.createRadialGradient(C-8,C-10,3,C,C,BR-4);g.addColorStop(0,'rgba(170,246,232,.95)');g.addColorStop(.45,'rgba(70,150,150,.92)');g.addColorStop(1,'rgba(36,40,72,.95)');
    c.fillStyle=g;blobPath(c,C,C,BR-4,BR-5,.03,2);c.fill();
    c.save();blobPath(c,C,C,BR-4,BR-5,.03,2);c.clip();
    for(let k=0;k<4;k++){const a=k*Math.PI/2;for(const [lw,col] of [[9,'rgba(14,30,40,.35)'],[4,'rgba(190,255,240,.35)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(C+Math.cos(a)*6,C+Math.sin(a)*6);
        c.quadraticCurveTo(C+Math.cos(a+.25)*22,C+Math.sin(a+.25)*22,C+Math.cos(a)*(BR-4),C+Math.sin(a)*(BR-4));c.stroke();}}
    glow(c,C,C,14,'210,255,246',.5);c.restore();put(D+'fluid',cv);}
  // membrane: the translucent purple bulb over the chamber, slightly swollen beyond a Vine's width
  {const [cv,c]=mk();sd=812;membrane(c,C,C,BR,BR-1,.7,'150,96,190','70,30,92','rgba(30,10,44,.55)',{a0:.06,a1:.2,veins:10});put(D+'membrane',cv);}
  {const [cv,c]=mk();drop(c,C-17,C-19,9,.8);drop(c,C+14,C-8,3.5,.6);drop(c,C-6,C+20,2.5,.5);put(D+'shine',cv);}
  put(D+'pulse',pulseSprite('150,250,226'));}

// =============================== Sorting Gland (art/plant/sorting-gland/) ===============================
{const D='sorting-gland/',RX=54,RY=43;
  {const [cv,c]=mk();shadow(c,C,C,62,.6);sd=911;for(const [a,l] of [[.8,26],[2.4,30],[3.9,24],[5.5,28]])rootlet(c,C+Math.cos(a)*34,C+Math.sin(a)*26,a,l,3.8);
    mound(c,C-2,C+3,RX+5,RY+6,.4);
    // the lobe that makes it lopsided: a small swollen pouch below and behind the filter
    mound(c,C-24,C+24,17,13,2.1,['#7a4a8a','#4a2460','#24102e']);put(D+'base',cv);}
  // the straight-through channel, edge to edge, narrower where it passes the filter
  const Rm=x=>RV*(1-.28*Math.exp(-Math.pow((x-C)/22,2)));
  put(D+'main',chan(P,P,0,P,Rm,C,0));put(D+'main_glow',chanGlow(P,P,0,P,Rm,C,[255,204,120]));
  // a diversion channel: from the tile's right edge into the chamber, much thinner inside
  const Rs=x=>RV*(.5+.5*sm(C+24,P-4,x));
  put(D+'side',chan(P,P,C+20,P,Rs,C,12));put(D+'side_glow',chanGlow(P,P,C+24,P,Rs,C,[150,250,226]));
  // body: an oval chamber along the straight channel, with the lobe pouch showing as a darker sac
  {const [cv,c]=mk();sd=912;membrane(c,C,C,RX,RY,2.6,'176,124,206','74,32,96','rgba(30,10,44,.55)',{a0:.2,a1:.34,veins:12,wob:.025});
    c.strokeStyle='rgba(255,206,140,.35)';c.lineWidth=1.6;c.beginPath();c.ellipse(C,C,RX-3,RY-3,0,3.5,5.6);c.stroke();
    c.save();c.globalAlpha=.85;membrane(c,C-24,C+24,15,11,1,'120,70,150','60,24,80','rgba(30,10,44,.5)',{veins:4,speck:40});c.restore();
    // fine valve ridges along the inside of the chamber, pointing at the filter
    for(const s of [-1,1])for(let k=0;k<3;k++){const x=C+s*(18+k*9);c.strokeStyle='rgba(226,200,250,.38)';c.lineWidth=1.3;c.beginPath();c.moveTo(x,C-RY*.62+k*2);c.quadraticCurveTo(x-s*5,C,x,C+RY*.62-k*2);c.stroke();}
    put(D+'body',cv);}
  // filter: the translucent sieve across the middle, fine lamellae with an amber sheen
  {const [cv,c]=mk();const g=c.createLinearGradient(C-9,0,C+9,0);g.addColorStop(0,'rgba(255,200,120,0)');g.addColorStop(.5,'rgba(255,206,130,.42)');g.addColorStop(1,'rgba(255,200,120,0)');
    c.fillStyle=g;c.beginPath();c.ellipse(C,C,9,RY-5,0,0,7);c.fill();
    for(let k=-4;k<=4;k++){c.strokeStyle=`rgba(255,226,170,${.5-Math.abs(k)*.06})`;c.lineWidth=1;c.beginPath();c.moveTo(C-5,C+k*6.2);c.quadraticCurveTo(C,C+k*6.2+2,C+5,C+k*6.2);c.stroke();}
    c.strokeStyle='rgba(60,24,40,.5)';c.lineWidth=1.4;c.beginPath();c.ellipse(C,C,9,RY-5,0,0,7);c.stroke();put(D+'filter',cv);}
  {const [cv,c]=mk();drop(c,C-24,C-16,8,.75);drop(c,C+22,C-12,3,.55);drop(c,C+8,C+20,2.4,.45);put(D+'shine',cv);}
  // a dark socket behind the chosen item, so it reads against the chamber
  {const [cv,c]=mk(64);const g=c.createRadialGradient(32,32,8,32,32,32);g.addColorStop(0,'rgba(14,6,20,.88)');g.addColorStop(.62,'rgba(14,6,20,.72)');g.addColorStop(.8,'rgba(236,206,255,.55)');g.addColorStop(1,'rgba(236,206,255,0)');
    c.fillStyle=g;c.beginPath();c.arc(32,32,32,0,7);c.fill();put(D+'socket',cv);}
  put(D+'pulse',pulseSprite('255,204,120','255,246,220'));}

// =============================== Resin Gland (art/plant/resin-gland/) ===============================
{const D='resin-gland/',W=384,K=192,SX=88,SY=82,SCY=K-6;   // box, centre, sac radii, sac centre
  // roots: spreading out past the footprint into the Rootweb (drawn under neighbouring growths)
  {const [cv,c]=mk(W);shadow(c,K,K,170,.55);sd=1011;
    for(let k=0;k<9;k++){const a=k/9*6.283+rnd()*.4,r0=96;rootlet(c,K+Math.cos(a)*r0,K+Math.sin(a)*r0,a+(rnd()-.5)*.4,58+rnd()*30,9+rnd()*4);
      const b=a+(rnd()<.5?.6:-.6),r1=r0+30;rootlet(c,K+Math.cos(a)*r1,K+Math.sin(a)*r1,b,24+rnd()*12,4);}
    put(D+'roots',cv);}
  // base: thick fleshy foundation with a collar of small lily petals
  {const [cv,c]=mk(W);sd=1012;
    const petal=(a,len,wid,col)=>{c.save();c.translate(K+Math.cos(a)*96,K+Math.sin(a)*96);c.rotate(a-Math.PI/2);
      c.beginPath();c.moveTo(0,-4);c.bezierCurveTo(wid,4,wid*.9,len*.75,0,len);c.bezierCurveTo(-wid*.9,len*.75,-wid,4,0,-4);c.closePath();
      c.fillStyle='rgba(8,2,14,.5)';c.save();c.translate(1.5,2.5);c.fill();c.restore();
      const g=c.createLinearGradient(0,0,0,len);g.addColorStop(0,'#2a0e3a');g.addColorStop(.6,col);g.addColorStop(1,'#9a6ab8');c.fillStyle=g;c.fill();
      c.strokeStyle='rgba(230,200,250,.45)';c.lineWidth=1.4;c.stroke();c.strokeStyle='rgba(230,200,250,.25)';c.beginPath();c.moveTo(0,2);c.lineTo(0,len*.85);c.stroke();c.restore();};
    for(let k=0;k<14;k++)petal(k/14*6.283+.1,30+rnd()*8,13,'#5e2e7c');
    for(let k=0;k<14;k++)petal((k+.5)/14*6.283+.1,22+rnd()*6,10,'#6e3a8e');
    mound(c,K,K+4,118,112,.9);put(D+'base',cv);}
  // sac: the digestive chamber's dark fluid with folds and villi faintly inside
  {const [cv,c]=mk(W);sd=1013;c.save();blobPath(c,K,SCY,SX,SY,.03,1.7);c.clip();
    const g=c.createRadialGradient(K-20,SCY-28,6,K,SCY,SX*1.05);g.addColorStop(0,'rgba(104,140,112,.92)');g.addColorStop(.45,'rgba(58,60,70,.94)');g.addColorStop(1,'rgba(38,16,46,.97)');c.fillStyle=g;c.fillRect(0,0,W,W);
    for(let k=0;k<14;k++){const a=rnd()*6.283,r=SX*(.55+rnd()*.4);c.strokeStyle='rgba(10,6,16,.3)';c.lineWidth=3;c.beginPath();c.moveTo(K+Math.cos(a)*r,SCY+Math.sin(a)*r*.93);
      c.quadraticCurveTo(K+Math.cos(a+.2)*r*.75,SCY+Math.sin(a+.2)*r*.7,K+Math.cos(a+.35)*r*.55,SCY+Math.sin(a+.35)*r*.5);c.stroke();}
    for(let k=0;k<40;k++){const a=rnd()*6.283,r=SX*(.8+rnd()*.2);c.fillStyle='rgba(170,220,200,.12)';c.beginPath();c.ellipse(K+Math.cos(a)*r,SCY+Math.sin(a)*r*.93,3,6,a,0,7);c.fill();}
    c.restore();put(D+'sac',cv);}
  // resin: thick amber collecting in the lower chamber (the game shows as much of it as the gland holds, from the bottom up)
  {const [cv,c]=mk(W);c.save();blobPath(c,K,SCY,SX-3,SY-3,.03,1.7);c.clip();
    const g=c.createLinearGradient(0,SCY-SY,0,SCY+SY);g.addColorStop(0,'rgba(255,214,110,.9)');g.addColorStop(.5,'rgba(232,150,40,.92)');g.addColorStop(1,'rgba(150,72,14,.96)');c.fillStyle=g;c.fillRect(0,0,W,W);
    for(let k=0;k<30;k++){drop(c,K+(rnd()*2-1)*SX*.8,SCY+(rnd()*2-1)*SY*.8,2+rnd()*4,.35);}
    c.restore();put(D+'resin',cv);}
  // a coal fragment suspended in the fluid
  {const [cv,c]=mk(32);c.translate(16,16);c.beginPath();const n=7;for(let i=0;i<n;i++){const a=i/n*6.283,r=9+rnd()*5;i?c.lineTo(Math.cos(a)*r,Math.sin(a)*r):c.moveTo(Math.cos(a)*r,Math.sin(a)*r);}c.closePath();
    c.fillStyle='#17151b';c.fill();c.strokeStyle='rgba(150,150,170,.5)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(200,200,220,.35)';c.beginPath();c.arc(-3,-4,2.4,0,7);c.fill();put(D+'coal',cv);}
  // membrane: the outer skin, translucent, with dark veins and fungal speckle (the game swells and squeezes it)
  {const [cv,c]=mk(W);sd=1014;membrane(c,K,SCY,SX+6,SY+6,1.7,'160,104,190','66,28,86','rgba(26,8,36,.5)',{a0:.04,a1:.16,veins:16,speck:900,wob:.03});
    // fungal tissue round the rim
    for(let k=0;k<26;k++){const a=rnd()*6.283;const x=K+Math.cos(a)*(SX+4),y=SCY+Math.sin(a)*(SY+4);c.fillStyle='rgba(206,170,230,.28)';c.beginPath();c.arc(x,y,2+rnd()*2.5,0,7);c.fill();}
    put(D+'membrane',cv);}
  // veins: fine bioluminescent threads beneath the skin
  {const [cv,c]=mk(W);sd=1015;for(let k=0;k<11;k++){let a=k/11*6.283+rnd()*.4,r=SX*.97;const P=[];for(let s=0;s<6;s++){P.push([K+Math.cos(a)*r,SCY+Math.sin(a)*r*.93]);a+=(rnd()-.5)*.35;r*=.9;}
      for(const [lw,col] of [[4.5,'rgba(110,220,200,.10)'],[1.4,'rgba(150,240,220,.42)']]){c.strokeStyle=col;c.lineWidth=lw;c.lineCap='round';c.beginPath();c.moveTo(P[0][0],P[0][1]);
        for(let i=1;i<P.length-1;i++){const mx=(P[i][0]+P[i+1][0])/2,my=(P[i][1]+P[i+1][1])/2;c.quadraticCurveTo(P[i][0],P[i][1],mx,my);}c.stroke();}}
    put(D+'veins',cv);}
  {const [cv,c]=mk(W);drop(c,K-46,SCY-44,13,.45);drop(c,K-14,SCY-62,7,.6);drop(c,K+50,SCY-30,5,.5);drop(c,K+30,SCY+50,4,.4);put(D+'shine',cv);}
  put(D+'pulse',pulseSprite('255,170,60','255,236,180'));}

// =============================== Rootweb Node (art/plant/rootweb-node/) ===============================
{const D='rootweb-node/',W=384,K=192;
  // one tendril, from the node's centre out to the right, ending in a small bud (the game turns it to face covered ground)
  {const [cv,c]=mk(W);sd=1111;const L=150,pts=[];for(let i=0;i<=40;i++){const t=i/40;pts.push([K+18+t*L,K+Math.sin(t*5.2)*7*t]);}
    for(const [lw,col] of [[1.7,'rgba(14,4,22,.32)'],[1,'rgba(120,64,156,.85)'],[.55,'rgba(176,120,210,.55)'],[.22,'rgba(170,250,226,.6)']]){for(let i=0;i<40;i++){const t=i/40,w=(13*(1-t*.8))*lw;c.strokeStyle=col;c.lineWidth=w;c.lineCap='round';
      c.beginPath();c.moveTo(pts[i][0],pts[i][1]);c.lineTo(pts[i+1][0],pts[i+1][1]);c.stroke();}}
    for(const [t,s] of [[.45,1]]){const [x,y]=pts[Math.round(t*40)];rootlet(c,x,y,s*.9,16,2.2);}
    const [bx,by]=pts[40];glow(c,bx,by,10,'170,250,226',.35);const g=c.createRadialGradient(bx-2,by-2,1,bx,by,6.5);g.addColorStop(0,'#d8b8f0');g.addColorStop(.6,'#8a50a8');g.addColorStop(1,'#3a1648');c.fillStyle=g;c.beginPath();c.arc(bx,by,6.5,0,7);c.fill();
    drop(c,bx-1.5,by-2,2.2,.6);put(D+'root',cv);}
  // base: dark tissue that melts into the Rootweb (no hard edge)
  {const [cv,c]=mk();const g=c.createRadialGradient(C,C,10,C,C,60);g.addColorStop(0,'rgba(58,24,74,.95)');g.addColorStop(.55,'rgba(46,18,60,.75)');g.addColorStop(1,'rgba(40,14,52,0)');c.fillStyle=g;c.fillRect(0,0,P,P);
    sd=1112;speck(c,500,()=>{const a=rnd()*6.283,r=Math.sqrt(rnd())*44;return [C+Math.cos(a)*r,C+Math.sin(a)*r];});put(D+'base',cv);}
  // petal: one small lily petal, base at the top edge, pointing down (the game sets six round the heart)
  {const w=40,h=56,[cv,c]=mk(w,h),m=w/2;const shape=()=>{c.beginPath();c.moveTo(m,2);c.bezierCurveTo(m+15,10,m+19,34,m+12,h-6);c.bezierCurveTo(m+7,h-1,m-7,h-1,m-12,h-6);c.bezierCurveTo(m-19,34,m-15,10,m,2);c.closePath();};
    shape();const g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#1c0828');g.addColorStop(.5,'#4a1e64');g.addColorStop(1,'#8e5cb0');c.fillStyle=g;c.fill();
    c.save();shape();c.clip();for(let k=-2;k<=2;k++){c.strokeStyle='rgba(226,196,250,.22)';c.lineWidth=1;c.beginPath();c.moveTo(m,4);c.quadraticCurveTo(m+k*6,26,m+k*4,h-4);c.stroke();}drop(c,m-5,h*.6,3,.6);c.restore();
    shape();c.strokeStyle='rgba(226,196,250,.55)';c.lineWidth=1.4;c.stroke();put(D+'petal',cv);}
  // fluid: pale violet-turquoise liquid inside the heart
  {const [cv,c]=mk();const g=c.createRadialGradient(C-6,C-8,2,C,C,27);g.addColorStop(0,'rgba(196,246,240,.95)');g.addColorStop(.5,'rgba(132,120,206,.92)');g.addColorStop(1,'rgba(52,24,80,.95)');c.fillStyle=g;c.beginPath();c.arc(C,C,27,0,7);c.fill();put(D+'fluid',cv);}
  // nucleus: the glowing growth seed floating in the heart
  {const [cv,c]=mk(48);glow(c,24,24,24,'190,255,230',.55);const g=c.createRadialGradient(20,19,1,24,24,10);g.addColorStop(0,'#f6fff0');g.addColorStop(.5,'#b8f0c8');g.addColorStop(1,'#4c9a7a');c.fillStyle=g;c.beginPath();c.ellipse(24,24,9,10.5,.3,0,7);c.fill();
    c.strokeStyle='rgba(30,70,60,.5)';c.lineWidth=1;c.beginPath();c.moveTo(24,15);c.quadraticCurveTo(27,24,24,33);c.stroke();put(D+'nucleus',cv);}
  {const [cv,c]=mk();sd=1113;membrane(c,C,C,30,29,.4,'170,120,210','70,30,92','rgba(30,10,44,.45)',{a0:.04,a1:.16,veins:8,speck:80});drop(c,C-11,C-12,6,.75);drop(c,C+9,C+8,2.2,.5);put(D+'membrane',cv);}
  // ring: the soft pulse that runs outward when the node grows new Rootweb
  {const [cv,c]=mk();const g=c.createRadialGradient(C,C,C*.62,C,C,C);g.addColorStop(0,'rgba(180,250,226,0)');g.addColorStop(.6,'rgba(190,252,232,.75)');g.addColorStop(1,'rgba(180,250,226,0)');c.fillStyle=g;c.fillRect(0,0,P,P);put(D+'ring',cv);}
  put(D+'pulse',pulseSprite('180,250,226'));}
return out;})()
