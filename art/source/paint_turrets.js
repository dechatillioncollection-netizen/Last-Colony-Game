// Paints the HDF defensive turrets: Duo Turret, Hail Cannon, Flak Turret and Lancer (art/hdf/duo-turret, hail-cannon, flak-turret,
// lancer). 128 px per tile, light from the top left, every turret facing +x (right). The painting helpers are the same as in
// paint_vehicles.js. The sizes below are copied into the game's TUR table; change both together.
//   base, dmg1, dmg2: the fixed foundation, a square of the footprint centred on the block
//   head, barrel, hdmg1, hdmg2, shadow (and the Lancer's glow and heat): squares of hb tiles centred on the turret pivot
//   flash, puff (Hail), radar (Flak): small effect and part sprites, described where they are painted
(()=>{
const P=128;
let sd=5201;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;const rr=(a,b)=>a+(b-a)*rnd();
const mk=(w,h=w)=>{const c=document.createElement('canvas');c.width=Math.round(w);c.height=Math.round(h);return [c,c.getContext('2d')];};
const out={};const put=(k,cv)=>out[k]=cv.toDataURL('image/png');
const NL=[];for(let i=0;i<64*64;i++)NL.push(rnd());
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),
  a=NL[(yi&63)*64+(xi&63)],b=NL[(yi&63)*64+((xi+1)&63)],c=NL[((yi+1)&63)*64+(xi&63)],d=NL[((yi+1)&63)*64+((xi+1)&63)];return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
const fbm=(x,y)=>vn(x,y)*.5+vn(x*2.1+7,y*2.1+3)*.27+vn(x*4.3+1,y*4.3+9)*.15+vn(x*8.7,y*8.7)*.08;
// one big grain texture (fine noise and slow mottling), drawn over painted metal with 'overlay'
const GR=(()=>{const [cv,c]=mk(512),img=c.createImageData(512,512),D=img.data;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const v=fbm(x/22,y/22)*.55+vn(x/3.1,y/3.1)*.3+NL[(x*7+y*13)&4095]*.15,k=(y*512+x)*4;
    D[k]=D[k+1]=D[k+2]=Math.max(0,Math.min(255,v*255));D[k+3]=255;}c.putImageData(img,0,0);return cv;})();
// dirt: brown blotches with soft holes
const DIRT=(()=>{const [cv,c]=mk(512),img=c.createImageData(512,512),D=img.data;
  for(let y=0;y<512;y++)for(let x=0;x<512;x++){const v=fbm(x/30+11,y/30+5),k=(y*512+x)*4,a=Math.max(0,Math.min(1,(v-.42)*3.2));
    D[k]=92;D[k+1]=78;D[k+2]=56;D[k+3]=a*255;}c.putImageData(img,0,0);return cv;})();
const hex=h=>h[0]==='#'?[parseInt(h.slice(1,3),16),parseInt(h.slice(3,5),16),parseInt(h.slice(5,7),16)]:h.match(/\d+/g).slice(0,3).map(Number);
const sh=(h,k)=>{const [r,g,b]=hex(h),f=v=>Math.max(0,Math.min(255,Math.round(k>0?v+(255-v)*k:v*(1+k))));return `rgb(${f(r)},${f(g)},${f(b)})`;};

// ---------- paths (in pixels) ----------
const poly=(pts)=>c=>{c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();};
const rect=(x,y,w,h,r=0)=>c=>{c.beginPath();if(c.roundRect&&r)c.roundRect(x,y,w,h,r);else c.rect(x,y,w,h);};
const cham=(x,y,w,h,k)=>poly([[x+k,y],[x+w-k,y],[x+w,y+k],[x+w,y+h-k],[x+w-k,y+h],[x+k,y+h],[x,y+h-k],[x,y+k]]);
const circ=(x,y,r)=>c=>{c.beginPath();c.arc(x,y,r,0,7);};
const octo=(x,y,rx,ry,rot=Math.PI/8)=>{const p=[];for(let i=0;i<8;i++){const a=rot+i*Math.PI/4;p.push([x+Math.cos(a)*rx,y+Math.sin(a)*ry]);}return poly(p);};
const bbOf=pf=>{const [cv,c]=mk(4);let x0=1e9,y0=1e9,x1=-1e9,y1=-1e9;const T={beginPath(){},closePath(){},moveTo(x,y){x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y);},
  lineTo(x,y){this.moveTo(x,y);},rect(x,y,w,h){this.moveTo(x,y);this.moveTo(x+w,y+h);},roundRect(x,y,w,h){this.moveTo(x,y);this.moveTo(x+w,y+h);},arc(x,y,r){this.moveTo(x-r,y-r);this.moveTo(x+r,y+r);},
  ellipse(x,y,a,b){this.moveTo(x-a,y-b);this.moveTo(x+a,y+b);}};pf(T);return [x0,y0,x1-x0,y1-y0];};

// ---------- painted metal ----------
// fill a path with base paint, top-left lighting, grain, a bevel (lit top-left edge, shaded bottom-right edge) and a dark outline
function metal(c,pf,base,o={}){const [x,y,w,h]=bbOf(pf),bv=o.bevel??2.2;
  c.save();pf(c);c.clip();
  c.fillStyle=base;c.fillRect(x-2,y-2,w+4,h+4);
  const g=c.createLinearGradient(x,y,x+w*.8,y+h);g.addColorStop(0,`rgba(255,250,235,${o.lit??.16})`);g.addColorStop(.55,'rgba(255,255,255,0)');g.addColorStop(1,`rgba(0,0,0,${o.dark??.24})`);
  c.fillStyle=g;c.fillRect(x-2,y-2,w+4,h+4);
  c.globalCompositeOperation='overlay';c.globalAlpha=o.grain??.32;c.drawImage(GR,rr(0,200),rr(0,200),w+4,h+4,x-2,y-2,w+4,h+4);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  if(bv>0){const band=(dx,dy,col)=>{c.beginPath();c.rect(x-10,y-10,w+20,h+20);c.save();c.translate(dx,dy);pf(c);c.restore();c.fillStyle=col;
      // evenodd of a big rect and the shifted shape leaves the band along the edges the shift uncovers
      const p=new Path2D();p.rect(x-10,y-10,w+20,h+20);const q=new Path2D();const pc={beginPath(){},closePath(){q.closePath();},moveTo:(a,b)=>q.moveTo(a+dx,b+dy),lineTo:(a,b)=>q.lineTo(a+dx,b+dy),
        rect:(a,b,cw,ch)=>q.rect(a+dx,b+dy,cw,ch),roundRect:(a,b,cw,ch,r)=>q.roundRect(a+dx,b+dy,cw,ch,r),arc:(a,b,r,s,e)=>q.arc(a+dx,b+dy,r,s,e),ellipse:(a,b,ra,rb,ro,s,e)=>q.ellipse(a+dx,b+dy,ra,rb,ro,s,e)};
      pf(pc);p.addPath(q);c.fill(p,'evenodd');};
    band(bv,bv,`rgba(255,248,228,${o.hi??.3})`);band(-bv,-bv,`rgba(0,0,0,${o.lo??.38})`);}
  if(o.inside)o.inside(c,[x,y,w,h]);
  c.restore();
  if(o.line!==false){c.strokeStyle=o.line||'rgba(12,12,10,.85)';c.lineWidth=o.lw??1.2;pf(c);c.stroke();}}
// engraved panel seam: a dark groove with its lit lower-right lip
function seam(c,x1,y1,x2,y2,a=.55){c.lineCap='butt';c.lineWidth=1;c.strokeStyle=`rgba(8,8,6,${a})`;c.beginPath();c.moveTo(x1,y1);c.lineTo(x2,y2);c.stroke();
  c.strokeStyle=`rgba(255,248,225,${a*.45})`;c.beginPath();c.moveTo(x1+.9,y1+.9);c.lineTo(x2+.9,y2+.9);c.stroke();}
function seamPath(c,pf,a=.5){c.save();c.lineWidth=1;c.strokeStyle=`rgba(8,8,6,${a})`;pf(c);c.stroke();c.translate(.9,.9);c.strokeStyle=`rgba(255,248,225,${a*.4})`;pf(c);c.stroke();c.restore();}
function rivet(c,x,y,r=1.1){c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.arc(x+.5,y+.6,r+.4,0,7);c.fill();
  c.fillStyle='rgba(150,148,138,.9)';c.beginPath();c.arc(x,y,r,0,7);c.fill();c.fillStyle='rgba(255,252,240,.7)';c.beginPath();c.arc(x-r*.35,y-r*.35,r*.45,0,7);c.fill();}
function rivets(c,x1,y1,x2,y2,n,r){for(let i=0;i<n;i++){const t=n<2?.5:i/(n-1);rivet(c,x1+(x2-x1)*t,y1+(y2-y1)*t,r);}}
function scratches(c,[x,y,w,h],n,a=.35){c.lineCap='round';for(let i=0;i<n;i++){const px=x+rnd()*w,py=y+rnd()*h,an=rnd()<.6?rr(-.5,.5)+(rnd()<.5?0:Math.PI/2):rr(0,6.3),L=rr(1.5,6);
  c.strokeStyle=rnd()<.75?`rgba(225,222,205,${a*rr(.4,1)})`:`rgba(0,0,0,${a*.8})`;c.lineWidth=rr(.4,.9);c.beginPath();c.moveTo(px,py);c.lineTo(px+Math.cos(an)*L,py+Math.sin(an)*L);c.stroke();}}
// worn edges: broken bright metal along an outline
function edgeWear(c,pf,a=.5,w=1.6){c.save();pf(c);c.clip();c.setLineDash([rr(1,3),rr(3,9),rr(.5,2),rr(4,12)]);c.lineDashOffset=rr(0,20);c.lineWidth=w;
  c.strokeStyle=`rgba(176,174,162,${a})`;pf(c);c.stroke();c.restore();}
function dirt(c,[x,y,w,h],a=.5,from=0){c.save();c.globalAlpha=a;c.drawImage(DIRT,rr(0,300),rr(0,300),w,h,x,y,w,h);c.restore();
  if(from){const g=c.createLinearGradient(0,y,0,y+h);}}
function grime(c,[x,y,w,h],a=.25){const g=c.createRadialGradient(x+w*.5,y+h*.5,Math.min(w,h)*.2,x+w*.5,y+h*.5,Math.max(w,h)*.7);
  g.addColorStop(0,'rgba(60,50,35,0)');g.addColorStop(1,`rgba(60,50,35,${a})`);c.fillStyle=g;c.fillRect(x,y,w,h);}
function hazard(c,pf,k=5,a=1,cols=['#c99a22','#1d1d1a']){const [x,y,w,h]=bbOf(pf);c.save();pf(c);c.clip();c.fillStyle=cols[1];c.fillRect(x,y,w,h);
  c.globalAlpha=a;c.fillStyle=cols[0];for(let s=-h-k*2;s<w+h;s+=k*2){c.beginPath();c.moveTo(x+s,y+h);c.lineTo(x+s+h,y);c.lineTo(x+s+h+k,y);c.lineTo(x+s+k,y+h);c.closePath();c.fill();}
  c.globalAlpha=1;c.globalCompositeOperation='overlay';c.globalAlpha=.4;c.drawImage(GR,rr(0,200),rr(0,200),w,h,x,y,w,h);c.globalAlpha=1;c.globalCompositeOperation='source-over';
  dirt(c,[x,y,w,h],.55);scratches(c,[x,y,w,h],(w*h)/40,.4);c.restore();c.strokeStyle='rgba(10,10,8,.8)';c.lineWidth=1;pf(c);c.stroke();}
// stencilled marking with worn paint
function stencil(c,txt,x,y,size,ang=0,col='rgba(226,220,196,.82)'){const [tc,t]=mk(size*txt.length+8,size+6);t.font=`bold ${size}px "DejaVu Sans Mono",monospace`;t.textBaseline='middle';t.fillStyle=col;t.fillText(txt,3,size/2+3);
  t.globalCompositeOperation='destination-out';for(let i=0;i<txt.length*size*1.5;i++){t.fillStyle=`rgba(0,0,0,${rr(.3,1)})`;t.fillRect(rnd()*tc.width,rnd()*tc.height,rr(.6,1.6),rr(.6,1.4));}
  c.save();c.translate(x,y);c.rotate(ang);c.drawImage(tc,-tc.width/2,-tc.height/2);c.restore();}
// a cylinder lying along the x axis in local space (barrels, fuel tanks); lit from the -y side
function cyl(c,x0,x1,y,w,base,o={}){const g=c.createLinearGradient(0,y-w/2,0,y+w/2);g.addColorStop(0,sh(base,-.35));g.addColorStop(.22,sh(base,.38));g.addColorStop(.4,sh(base,.08));
  g.addColorStop(.8,sh(base,-.42));g.addColorStop(1,sh(base,-.6));c.fillStyle=g;c.beginPath();if(o.cap)c.roundRect(x0,y-w/2,x1-x0,w,o.cap);else c.rect(x0,y-w/2,x1-x0,w);c.fill();
  c.save();c.beginPath();if(o.cap)c.roundRect(x0,y-w/2,x1-x0,w,o.cap);else c.rect(x0,y-w/2,x1-x0,w);c.clip();c.globalCompositeOperation='overlay';c.globalAlpha=.25;c.drawImage(GR,rr(0,300),rr(0,300),x1-x0,w,x0,y-w/2,x1-x0,w);c.restore();
  c.strokeStyle='rgba(10,10,8,.8)';c.lineWidth=1;c.beginPath();if(o.cap)c.roundRect(x0,y-w/2,x1-x0,w,o.cap);else c.rect(x0,y-w/2,x1-x0,w);c.stroke();}
function band(c,x,y,w,len,col){const g=c.createLinearGradient(0,y-w/2,0,y+w/2);g.addColorStop(0,sh(col,-.3));g.addColorStop(.25,sh(col,.3));g.addColorStop(.8,sh(col,-.4));
  c.fillStyle=g;c.fillRect(x,y-w/2,len,w);c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=.7;c.strokeRect(x,y-w/2,len,w);}
function hatch(c,x,y,r,base){metal(c,circ(x,y,r),sh(base,-.08),{bevel:1.4});metal(c,circ(x,y,r*.78),base,{bevel:1.2,lw:.8});
  c.fillStyle='rgba(0,0,0,.45)';c.fillRect(x-r*.1,y-r*.62,r*.2,r*.5);rivet(c,x+r*.45,y+r*.3,.9);c.strokeStyle='rgba(0,0,0,.4)';c.lineWidth=.8;c.beginPath();c.arc(x,y,r*.55,0,7);c.stroke();}
function grille(c,x,y,w,h,n,base,vert=true){metal(c,rect(x,y,w,h,1),sh(base,-.35),{bevel:1});
  for(let i=0;i<n;i++){const t=(i+.5)/n;c.fillStyle='rgba(0,0,0,.6)';if(vert)c.fillRect(x+t*w-.9,y+1.5,1.4,h-3);else c.fillRect(x+1.5,y+t*h-.9,w-3,1.4);
    c.fillStyle='rgba(255,248,225,.18)';if(vert)c.fillRect(x+t*w+.6,y+1.5,.7,h-3);else c.fillRect(x+1.5,y+t*h+.6,w-3,.7);}}
function light(c,x,y,r){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.arc(x+.4,y+.4,r+.8,0,7);c.fill();const g=c.createRadialGradient(x-r*.3,y-r*.3,0,x,y,r);
  g.addColorStop(0,'#f6f1d8');g.addColorStop(.5,'#b8b29a');g.addColorStop(1,'#545248');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}

// ---------- tracks and wheels ----------
// one track strip, len x wid pixels, links of pitch px, offset by f quarters of a link (the top run moves forward with the vehicle)
function trackStrip(len,wid,pitch,f,o={}){const [cv,c]=mk(len,wid),R=wid*(o.round??.32);
  const clip=rect(0,0,len,wid,R);c.save();clip(c);c.clip();c.fillStyle='#17181a';c.fillRect(0,0,len,wid);
  const off=f*pitch/4;sd=9100;   // same wear on every frame
  for(let x=-pitch*2+off;x<len+pitch;x+=pitch){const lw=pitch-1.2;
    const g=c.createLinearGradient(x,0,x+lw,0);g.addColorStop(0,'#3a3b3d');g.addColorStop(.35,'#4a4b4c');g.addColorStop(1,'#26272a');c.fillStyle=g;c.fillRect(x,1,lw,wid-2);
    // the grouser: a raised bar across the link
    c.fillStyle='#5c5c5a';c.fillRect(x+lw*.3,1,lw*.28,wid-2);c.fillStyle='rgba(205,200,186,.55)';c.fillRect(x+lw*.3,1,lw*.08,wid-2);c.fillStyle='rgba(0,0,0,.55)';c.fillRect(x+lw*.58,1,lw*.12,wid-2);
    // end connectors and the guide horn
    c.fillStyle='#2b2c2e';c.fillRect(x-1,0,2.2,wid);c.fillStyle='rgba(170,168,160,.6)';c.fillRect(x-.6,1,.9,1.6);c.fillRect(x-.6,wid-2.6,.9,1.6);
    if(o.horn!==false){c.fillStyle='#202124';c.fillRect(x+lw*.1,wid/2-wid*.08,lw*.75,wid*.16);c.fillStyle='rgba(190,186,170,.35)';c.fillRect(x+lw*.1,wid/2-wid*.08,lw*.75,.8);}
    // mud caught in the link (fixed to the link, so it travels with it)
    const mx=x+lw*rr(.05,.8);if(rnd()<.6){c.fillStyle=`rgba(${88+rnd()*20|0},${72+rnd()*14|0},50,${rr(.4,.8)})`;c.beginPath();c.ellipse(mx,rr(2,wid-2),rr(1,2.6),rr(1,2.4),0,0,7);c.fill();}}
  // curvature: the run drops away into the idler and sprocket at each end; side edges in shade
  const ge=c.createLinearGradient(0,0,len,0);ge.addColorStop(0,'rgba(0,0,0,.85)');ge.addColorStop(.07,'rgba(0,0,0,.25)');ge.addColorStop(.14,'rgba(0,0,0,0)');
  ge.addColorStop(.86,'rgba(0,0,0,0)');ge.addColorStop(.93,'rgba(0,0,0,.25)');ge.addColorStop(1,'rgba(0,0,0,.85)');c.fillStyle=ge;c.fillRect(0,0,len,wid);
  const gs=c.createLinearGradient(0,0,0,wid);gs.addColorStop(0,'rgba(255,250,235,.12)');gs.addColorStop(.2,'rgba(0,0,0,0)');gs.addColorStop(.8,'rgba(0,0,0,0)');gs.addColorStop(1,'rgba(0,0,0,.4)');c.fillStyle=gs;c.fillRect(0,0,len,wid);
  c.save();c.globalAlpha=.32;c.drawImage(DIRT,40,60,len,wid,0,0,len,wid);c.restore();
  c.restore();c.strokeStyle='rgba(6,6,6,.9)';c.lineWidth=1.2;clip(c);c.stroke();return cv;}
// one wheel seen from above: a tyre with chunky tread blocks, hub cap on the outer face (+y)
function wheel(len,wid,f){const [cv,c]=mk(len,wid);const clip=rect(0,0,len,wid,wid*.3);c.save();clip(c);c.clip();c.fillStyle='#1b1c1e';c.fillRect(0,0,len,wid);
  const pitch=len/5,off=f*pitch/4;
  for(let x=-pitch*2+off;x<len+pitch;x+=pitch){const k=Math.round((x-off)/pitch)&1;c.fillStyle='#38393b';c.fillRect(x+.6,k?1:wid*.12,pitch*.55,wid*(k?.5:.5));c.fillRect(x+pitch*.3,k?wid*.5:wid*.4,pitch*.55,wid*.5-1);
    c.fillStyle='rgba(200,196,180,.35)';c.fillRect(x+.6,k?1:wid*.12,pitch*.55,.8);}
  const ge=c.createLinearGradient(0,0,len,0);ge.addColorStop(0,'rgba(0,0,0,.9)');ge.addColorStop(.25,'rgba(0,0,0,.15)');ge.addColorStop(.5,'rgba(255,250,235,.1)');ge.addColorStop(.75,'rgba(0,0,0,.15)');ge.addColorStop(1,'rgba(0,0,0,.9)');
  c.fillStyle=ge;c.fillRect(0,0,len,wid);c.save();c.globalAlpha=.3;c.drawImage(DIRT,100,30,len,wid,0,0,len,wid);c.restore();c.restore();
  c.strokeStyle='rgba(5,5,5,.9)';c.lineWidth=1;clip(c);c.stroke();return cv;}

// ---------- damage, boss marks, shadows and wrecks ----------
function scorch(c,x,y,r,a=.7){const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(14,10,8,${a})`);g.addColorStop(.45,`rgba(30,22,16,${a*.7})`);g.addColorStop(1,'rgba(40,30,20,0)');
  c.fillStyle=g;c.beginPath();for(let i=0;i<=24;i++){const an=i/24*6.283,k=r*(.75+.35*vn(x/9+Math.cos(an)*2,y/9+Math.sin(an)*2));i?c.lineTo(x+Math.cos(an)*k,y+Math.sin(an)*k):c.moveTo(x+Math.cos(an)*k,y+Math.sin(an)*k);}c.fill();}
function impact(c,x,y,r){c.fillStyle='rgba(0,0,0,.55)';c.beginPath();c.arc(x,y,r*1.6,0,7);c.fill();c.fillStyle='rgba(190,186,172,.85)';c.beginPath();c.arc(x,y,r,0,7);c.fill();
  c.fillStyle='rgba(30,26,22,.9)';c.beginPath();c.arc(x+r*.2,y+r*.2,r*.55,0,7);c.fill();
  c.strokeStyle='rgba(220,216,200,.5)';c.lineWidth=.6;for(let i=0;i<4;i++){const a=rnd()*6.28,L=r*rr(1.6,3);c.beginPath();c.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);c.lineTo(x+Math.cos(a)*L,y+Math.sin(a)*L);c.stroke();}}
function dent(c,x,y,r,an){c.save();c.translate(x,y);c.rotate(an);c.fillStyle='rgba(0,0,0,.42)';c.beginPath();c.ellipse(0,0,r,r*.55,0,0,7);c.fill();
  c.fillStyle='rgba(255,248,226,.3)';c.beginPath();c.ellipse(r*.25,r*.18,r*.8,r*.35,0,0,Math.PI);c.fill();c.restore();}
function torn(c,x,y,w,h){c.save();c.beginPath();for(let i=0;i<=14;i++){const a=i/14*6.283,k=.7+rnd()*.5;i?c.lineTo(x+Math.cos(a)*w*k,y+Math.sin(a)*h*k):c.moveTo(x+Math.cos(a)*w*k,y+Math.sin(a)*h*k);}c.closePath();
  c.fillStyle='#8c8a80';c.fill();c.clip();c.fillStyle='rgba(120,70,40,.5)';c.fillRect(x-w,y-h,w*2,h*2);scratches(c,[x-w,y-h,w*2,h*2],w*h/4,.5);c.restore();
  c.strokeStyle='rgba(20,16,12,.8)';c.lineWidth=.8;c.stroke();}
function hole(c,x,y,r){scorch(c,x,y,r*2.6,.85);c.fillStyle='#050403';c.beginPath();for(let i=0;i<=10;i++){const a=i/10*6.283,k=r*(.6+rnd()*.6);i?c.lineTo(x+Math.cos(a)*k,y+Math.sin(a)*k):c.moveTo(x+Math.cos(a)*k,y+Math.sin(a)*k);}c.fill();
  c.strokeStyle='rgba(255,140,60,.55)';c.lineWidth=.8;c.stroke();}
// damage marks for a body: level 1 scuffs, impacts and a scorch; level 2 holes, torn plates and heavy burns. Clipped to the body.
function damage(body,lvl,pts,s=1){const N=body.width,[cv,c]=mk(N);sd=lvl*977+N;
  for(const [x,y] of pts.slice(0,lvl===1?3:pts.length)){
    if(lvl===1){scorch(c,x,y,rr(5,9)*s,.5);impact(c,x+rr(-4,4)*s,y+rr(-4,4)*s,rr(.9,1.4)*s);dent(c,x+rr(-6,6)*s,y+rr(-6,6)*s,rr(2.5,4)*s,rnd()*3);}
    else{scorch(c,x,y,rr(9,15)*s,.85);torn(c,x+rr(-4,4)*s,y+rr(-4,4)*s,rr(3,5)*s,rr(2,4)*s);hole(c,x+rr(-3,3)*s,y+rr(-3,3)*s,rr(1.3,2.2)*s);
      for(let i=0;i<3;i++)impact(c,x+rr(-10,10)*s,y+rr(-10,10)*s,rr(.8,1.3)*s);}}
  scratches(c,[0,0,N,N],N*N/(lvl===1?260:130),.45);
  c.globalCompositeOperation='destination-in';c.drawImage(body,0,0);return cv;}
// a silhouette of a canvas, blurred: the shadow the runtime draws offset down-right
function shadowOf(cv,blur=3,a=.62){const N=cv.width,[s,c]=mk(N);c.filter=`blur(${blur}px)`;c.drawImage(cv,0,0);c.filter='none';
  c.globalCompositeOperation='source-in';c.fillStyle=`rgba(6,6,8,${a})`;c.fillRect(0,0,N,N);return s;}
// burn a composite into a wreck: charred paint, rust and soot, with a few bright scrapes left
function wreckOf(cv){const N=cv.width,[w,c]=mk(N);c.drawImage(cv,0,0);c.globalCompositeOperation='source-atop';
  c.fillStyle='rgba(22,18,15,.5)';c.fillRect(0,0,N,N);
  c.globalAlpha=.55;c.drawImage(DIRT,rr(0,200),rr(0,200),N,N,0,0,N,N);c.globalAlpha=1;
  for(let i=0;i<N*N/1400;i++)scorch(c,rnd()*N,rnd()*N,rr(4,N/8),.75);
  for(let i=0;i<N*N/1500;i++){c.fillStyle=`rgba(${110+rnd()*30|0},${52+rnd()*15|0},28,${rr(.25,.5)})`;c.beginPath();c.ellipse(rnd()*N,rnd()*N,rr(2,6),rr(1.5,4),rnd()*3,0,7);c.fill();}
  scratches(c,[0,0,N,N],N*N/220,.35);c.globalCompositeOperation='source-over';return w;}
const sprite=(n,f)=>{const [cv,c]=mk(n);f(c,n);return cv;};
// muzzle flash: a bright core and four petals, pointing +x from the left middle
const flashSprite=(n)=>sprite(n,(c,N)=>{const y=N/2;c.globalCompositeOperation='lighter';
  const g=c.createRadialGradient(N*.22,y,0,N*.22,y,N*.42);g.addColorStop(0,'rgba(255,250,220,1)');g.addColorStop(.25,'rgba(255,200,110,.9)');g.addColorStop(1,'rgba(255,120,40,0)');c.fillStyle=g;c.beginPath();c.arc(N*.22,y,N*.42,0,7);c.fill();
  const pet=(a,L,w)=>{c.save();c.translate(N*.12,y);c.rotate(a);const g=c.createLinearGradient(0,0,L,0);g.addColorStop(0,'rgba(255,240,190,.95)');g.addColorStop(1,'rgba(255,140,50,0)');c.fillStyle=g;
    c.beginPath();c.moveTo(0,-w);c.quadraticCurveTo(L*.5,-w*.6,L,0);c.quadraticCurveTo(L*.5,w*.6,0,w);c.fill();c.restore();};
  pet(0,N*.86,N*.11);pet(.7,N*.38,N*.06);pet(-.7,N*.38,N*.06);});


// ---------------------------------------------------------------------------------------------------------------------------
// Each turret: geometry in tiles, then the paint. Pixel helper q(v)=v*P. The base is a square of the footprint centred on the block's
// centre; head, barrel, hdmg1, hdmg2, shadow and glow are squares of hb tiles centred on the turret pivot (the block centre), facing +x.
const SLATE='#5f6468',SLATE2='#4e5357',GUN='#3f4448',STEEL='#8b9096',OLIVE='#5b6146',RED='#b8463a',CONC='#6a675f',CYAN='150,215,235';
// a weathered concrete and steel foundation pad filling the footprint, with a bolted turret ring of radius ring
function pad(c,N,ring,o={}){const C=N/2,q=v=>v*P,X=v=>C+q(v),m=o.m??q(.04),k=o.k??q(.1);
  const slab=cham(m,m,N-2*m,N-2*m,k);metal(c,slab,o.col||CONC,{bevel:2,grain:.5,lit:.1,dark:.3});
  c.save();slab(c);c.clip();dirt(c,[0,0,N,N],.6);grime(c,[0,0,N,N],.35);scratches(c,[0,0,N,N],N*N/500,.3);
  // expansion joints in the concrete
  seam(c,C,m,C,N-m,.25);seam(c,m,C,N-m,C,.25);c.restore();
  if(o.inner!==false){const pl=octo(C,C,q(o.plate??ring*1.22),q(o.plate??ring*1.22));metal(c,pl,SLATE2,{bevel:1.8});c.save();pl(c);c.clip();dirt(c,[0,0,N,N],.35);scratches(c,[0,0,N,N],N*N/700,.35);c.restore();edgeWear(c,pl,.45,1.4);}
  // the turret ring: a dark race with bolts, and the lit lip of the bearing
  metal(c,circ(C,C,q(ring)),'#2f3336',{bevel:1.6});metal(c,circ(C,C,q(ring*.86)),'#26292c',{bevel:1.2,lw:.8});
  const nb=o.bolts??12;for(let i=0;i<nb;i++){const a=i/nb*6.283+.13;rivet(c,C+Math.cos(a)*q(ring*.93),C+Math.sin(a)*q(ring*.93),o.br??1.2);}
  return slab;}
// corner hazard chevrons and a small red HDF identification tab
function padMarks(c,N,k){const q=v=>v*P,m=q(.04);
  for(const [sx,sy] of [[0,0],[1,1]]){const x=sx?N-m:m,y=sy?N-m:m,dx=sx?-1:1,dy=sy?-1:1;
    hazard(c,poly([[x+dx*k,y],[x+dx*(k+q(.07)),y],[x,y+dy*(k+q(.07))],[x,y+dy*k]]),q(.035));}
  c.fillStyle=RED;c.globalAlpha=.8;c.fillRect(N-m-q(.2),m+q(.05),q(.12),q(.035));c.globalAlpha=1;}
const puff=sprite(48,(c,n)=>{sd=777;for(let i=0;i<9;i++){const x=n/2+rr(-6,6),y=n/2+rr(-6,6),r=rr(11,17),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(200,196,186,.7)');g.addColorStop(.6,'rgba(200,196,186,.35)');g.addColorStop(1,'rgba(200,196,186,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}});
// everything a turret needs besides its own parts: shadow and damage of the head, damage of the base
function finish(D,base,head,bar,barY,hb,dpts,bpts,ds){const TN=Math.round(hb*P),TC=TN/2;
  const tb=sprite(TN,c=>{for(const y of barY)c.drawImage(bar,0,y*P);c.drawImage(head,0,0);});
  put(D+'shadow',shadowOf(tb,4));
  put(D+'hdmg1',damage(head,1,dpts.map(([x,y])=>[TC+x*P,TC+y*P]),ds));put(D+'hdmg2',damage(head,2,dpts.map(([x,y])=>[TC+x*P,TC+y*P]),ds));
  const BN=base.width,BC=BN/2;
  put(D+'dmg1',damage(base,1,bpts.map(([x,y])=>[BC+x*P,BC+y*P]),ds));put(D+'dmg2',damage(base,2,bpts.map(([x,y])=>[BC+x*P,BC+y*P]),ds));
  put(D+'base',base);put(D+'head',head);put(D+'barrel',bar);}

// ---- Duo Turret: a compact mass-produced twin-gun perimeter mount ----
function duo(){const D='duo-turret/',N=P,hb=1.3,TN=Math.round(hb*P),TC=TN/2,q=v=>v*P,X=v=>TC+q(v);sd=2101;
  const [bs,b]=mk(N);pad(b,N,.34,{plate:.43});padMarks(b,N,q(.1));
  // a small ammunition locker on the pad corner, fed up through the ring
  metal(b,rect(q(.07),N-q(.22),q(.13),q(.15),2),OLIVE,{bevel:1.4});rivets(b,q(.09),N-q(.2),q(.18),N-q(.2),3,.8);stencil(b,'7.6',q(.135),N-q(.145),7,0,'rgba(226,220,196,.6)');
  // the barrel: one gun along +x centred on y=0 (drawn at each barrel position), a perforated cooling jacket and a flash hider
  const [bar,bc]=mk(TN);cyl(bc,X(.06),X(.6),TC,q(.068),'#43474b');
  cyl(bc,X(.15),X(.40),TC,q(.095),'#4c5154',{cap:2});bc.fillStyle='rgba(6,6,6,.85)';for(let i=0;i<6;i++)bc.fillRect(X(.175+i*.038),TC-q(.03),q(.016),q(.06));
  cyl(bc,X(.54),X(.63),TC,q(.085),'#2e3134',{cap:1.5});bc.fillStyle='#050505';bc.fillRect(X(.625),TC-q(.018),q(.006),q(.036));
  // the head: a squat armoured box with a green roof panel, the feed housing on its left and a sight block
  const [hd,c]=mk(TN);const box=cham(X(-.25),X(-.26),q(.43),q(.52),q(.07));
  metal(c,rect(X(-.21),X(-.37),q(.24),q(.12),2),'#3c4044',{bevel:1.4});   // feed housing (left side as it faces)
  c.strokeStyle='#26292b';c.lineWidth=q(.05);c.beginPath();c.moveTo(X(.0),X(-.31));c.quadraticCurveTo(X(.1),X(-.30),X(.12),X(-.22));c.stroke();   // feed chute
  for(let i=0;i<4;i++){c.fillStyle='#b88d3a';c.fillRect(X(-.18+i*.05),X(-.355),q(.03),q(.07));c.fillStyle='rgba(0,0,0,.4)';c.fillRect(X(-.18+i*.05)+q(.022),X(-.355),q(.008),q(.07));}
  metal(c,box,SLATE,{bevel:2.2});c.save();box(c);c.clip();
  metal(c,cham(X(-.15),X(-.17),q(.24),q(.34),q(.04)),OLIVE,{bevel:1.3,lw:.8});
  seam(c,X(.1),X(-.26),X(.1),X(.26),.5);seam(c,X(-.19),X(-.26),X(-.19),X(.26),.4);
  c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.245),X(-.2),q(.035),q(.4));c.globalAlpha=1;
  stencil(c,'HDF',X(-.03),X(.0),8,Math.PI/2,'rgba(226,220,196,.7)');
  dirt(c,[X(-.3),X(-.3),q(.6),q(.6)],.45);scratches(c,[X(-.3),X(-.3),q(.6),q(.6)],40);c.restore();edgeWear(c,box,.55,1.4);
  // mantlet where the two guns leave the box, and the sight
  metal(c,rect(X(.12),X(-.25),q(.08),q(.5),1.5),'#3a3e42',{bevel:1.3});for(const s of [-1,1])metal(c,circ(X(.16),X(s*.18),q(.048)),'#2b2e31',{bevel:1});
  metal(c,rect(X(.0),X(-.06),q(.1),q(.12),1.5),'#32363a',{bevel:1.2});c.fillStyle='#1d3440';c.fillRect(X(.075),X(-.04),q(.02),q(.08));c.fillStyle=`rgba(${CYAN},.5)`;c.fillRect(X(.075),X(-.04),q(.007),q(.08));
  rivets(c,X(-.22),X(-.23),X(.06),X(-.23),5,.8);rivets(c,X(-.22),X(.23),X(.06),X(.23),5,.8);
  finish(D,bs,hd,bar,[-.18,.18],hb,[[-.1,-.12],[.02,.15],[-.18,.05]],[[.25,-.25],[-.28,.2],[.2,.3]],.9);
  put(D+'flash',flashSprite(64));}

// ---- Hail Cannon: a heavy short-range artillery piece on a braced emplacement ----
function hail(){const D='hail-cannon/',N=P,hb=1.6,TN=Math.round(hb*P),TC=TN/2,q=v=>v*P,X=v=>TC+q(v),B=v=>N/2+q(v);sd=3301;
  const [bs,b]=mk(N);pad(b,N,.36,{plate:.47,bolts:16,br:1.3,k:q(.14),col:'#625f57'});
  // four diagonal braces from the pad corners to the ring, with hazard collars
  for(let i=0;i<4;i++){const a=Math.PI/4+i*Math.PI/2,ca=Math.cos(a),sa=Math.sin(a);b.save();b.translate(B(0),B(0));b.rotate(a);
    metal(b,rect(q(.36),-q(.035),q(.24),q(.07),1.5),'#45494c',{bevel:1.2});hazard(b,rect(q(.40),-q(.035),q(.05),q(.07)),q(.02));rivet(b,q(.55),0,1.2);b.restore();}
  padMarks(b,N,q(.14));
  // the gun: a thick tube with a reinforcing band and a slotted muzzle brake
  const [bar,bc]=mk(TN);cyl(bc,X(.0),X(.74),TC,q(.15),'#474b4e');band(bc,X(.26),TC,q(.17),q(.06),'#3b3f42');band(bc,X(.5),TC,q(.165),q(.035),'#3b3f42');
  metal(bc,rect(X(.70),TC-q(.115),q(.16),q(.23),3),'#35393c',{bevel:1.6});bc.fillStyle='#070707';for(let i=0;i<3;i++){bc.fillRect(X(.725+i*.042),TC-q(.112),q(.02),q(.05));bc.fillRect(X(.725+i*.042),TC+q(.062),q(.02),q(.05));}
  bc.fillStyle='#030303';bc.fillRect(X(.855),TC-q(.04),q(.01),q(.08));
  // the head: a heavy cradle, two recoil cylinders either side of the gun, the breech and loading tray behind, a sloped shield in front
  const [hd,c]=mk(TN);
  const breech=cham(X(-.44),X(-.14),q(.26),q(.28),q(.04));metal(c,breech,'#3a3e41',{bevel:1.8});c.save();breech(c);c.clip();hazard(c,rect(X(-.44),X(-.14),q(.05),q(.28)),q(.03));seam(c,X(-.3),X(-.14),X(-.3),X(.14),.5);c.restore();
  metal(c,rect(X(-.40),X(-.29),q(.2),q(.11),2),OLIVE,{bevel:1.3});for(let i=0;i<3;i++){c.fillStyle='#b88d3a';c.beginPath();c.ellipse(X(-.36+i*.065),X(-.235),q(.024),q(.04),0,0,7);c.fill();c.strokeStyle='rgba(0,0,0,.6)';c.lineWidth=.8;c.stroke();}   // shells in the loading tray
  const cradle=cham(X(-.2),X(-.24),q(.36),q(.48),q(.06));metal(c,cradle,SLATE,{bevel:2.4});
  c.save();cradle(c);c.clip();metal(c,cham(X(-.12),X(-.15),q(.2),q(.3),q(.03)),OLIVE,{bevel:1.2,lw:.8});c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.19),X(-.22),q(.03),q(.44));c.globalAlpha=1;
  dirt(c,[X(-.2),X(-.25),q(.4),q(.5)],.45);scratches(c,[X(-.2),X(-.25),q(.4),q(.5)],50);c.restore();edgeWear(c,cradle,.55,1.6);
  for(const s of [-1,1]){cyl(c,X(-.14),X(.30),X(s*.165),q(.075),STEEL,{cap:3});band(c,X(.12),X(s*.165),q(.085),q(.03),'#3b3f42');cyl(c,X(.26),X(.36),X(s*.165),q(.05),'#5a5f63',{cap:2});}   // shock absorbers
  const shield=poly([[X(.16),X(-.27)],[X(.26),X(-.22)],[X(.30),X(-.1)],[X(.30),X(.1)],[X(.26),X(.22)],[X(.16),X(.27)]]);metal(c,shield,SLATE2,{bevel:2});
  c.save();shield(c);c.clip();hazard(c,rect(X(.26),X(-.25),q(.05),q(.5)),q(.03),.9);c.restore();
  metal(c,circ(X(.28),TC,q(.07)),'#2c3033',{bevel:1.2});rivets(c,X(.19),X(-.22),X(.19),X(.22),5,.9);
  rivets(c,X(-.17),X(-.2),X(.12),X(-.2),5,.9);rivets(c,X(-.17),X(.2),X(.12),X(.2),5,.9);stencil(c,'155',X(-.03),X(.08),8,0,'rgba(226,220,196,.6)');
  finish(D,bs,hd,bar,[0],hb,[[-.05,-.12],[.1,.15],[-.3,.05]],[[.3,-.3],[-.3,.25],[.25,.32]],1);
  put(D+'flash',flashSprite(96));put(D+'puff',puff);}

// ---- Flak Turret: a raised anti-air mount with two twin-gun pairs, ammunition boxes and a search radar ----
function flak(){const D='flak-turret/',N=2*P,hb=2.3,TN=Math.round(hb*P),TC=TN/2,q=v=>v*P,X=v=>TC+q(v),B=v=>N/2+q(v);sd=4401;
  const [bs,b]=mk(N);pad(b,N,.62,{plate:.78,bolts:20,br:1.5,k:q(.2)});
  // levelling jacks at the corners, a hazard band along two edges and ready-use ammunition crates
  for(const [sx,sy] of [[-1,-1],[1,-1],[-1,1],[1,1]]){metal(b,rect(B(sx*.82)-q(.08),B(sy*.82)-q(.08),q(.16),q(.16),2),'#3f4347',{bevel:1.4});metal(b,circ(B(sx*.82),B(sy*.82),q(.045)),STEEL,{bevel:1});}
  hazard(b,rect(B(-.6),B(-.95),q(1.2),q(.06)),q(.04));hazard(b,rect(B(-.6),B(.89),q(1.2),q(.06)),q(.04));
  for(const [x,y] of [[.66,-.4],[.66,.4]]){metal(b,rect(B(x)-q(.1),B(y)-q(.14),q(.2),q(.28),2),OLIVE,{bevel:1.4});seam(b,B(x)-q(.1),B(y),B(x)+q(.1),B(y),.5);}
  stencil(b,'AA-3',B(-.66),B(0),12,-Math.PI/2,'rgba(226,220,196,.55)');padMarks(b,N,q(.2));
  // one gun barrel along +x centred on y=0: long and slim with a cone flash hider; drawn at four positions
  const [bar,bc]=mk(TN);cyl(bc,X(.18),X(1.05),TC,q(.058),'#43474b');band(bc,X(.36),TC,q(.065),q(.04),'#34383b');band(bc,X(.62),TC,q(.06),q(.025),'#34383b');
  bc.fillStyle='#2b2e31';bc.beginPath();bc.moveTo(X(1.01),TC-q(.034));bc.lineTo(X(1.12),TC-q(.05));bc.lineTo(X(1.12),TC+q(.05));bc.lineTo(X(1.01),TC+q(.034));bc.closePath();bc.fill();
  bc.strokeStyle='rgba(10,10,8,.8)';bc.lineWidth=1;bc.stroke();bc.fillStyle='#040404';bc.fillRect(X(1.115),TC-q(.02),q(.006),q(.04));
  // the head: rotating platform, side frames that carry the guns in elevation, ammo boxes outboard, the gunner's cab and the radar mast behind
  const [hd,c]=mk(TN);const plat=octo(TC,TC,q(.56),q(.56));metal(c,plat,SLATE2,{bevel:2.2});
  c.save();plat(c);c.clip();for(let i=0;i<8;i++){const a=i/8*6.283;c.save();c.translate(TC,TC);c.rotate(a);hazard(c,rect(q(.47),-q(.05),q(.08),q(.1)),q(.03));c.restore();}c.restore();
  for(const s of [-1,1]){metal(c,rect(X(-.24),X(s*.5)-q(.09),q(.34),q(.18),2.5),OLIVE,{bevel:1.6});for(let i=0;i<3;i++)seam(c,X(-.2+i*.1),X(s*.5)-q(.09),X(-.2+i*.1),X(s*.5)+q(.09),.45);
    stencil(c,'AMMO',X(-.07),X(s*.5),7,0,'rgba(226,220,196,.55)');
    // feed belt from the box into the gun pair
    c.strokeStyle='#8a6d33';c.lineWidth=q(.045);c.setLineDash([3,2]);c.beginPath();c.moveTo(X(.1),X(s*.47));c.quadraticCurveTo(X(.2),X(s*.42),X(.22),X(s*.33));c.stroke();c.setLineDash([]);
    const fr=poly([[X(-.28),X(s*.36)-q(.06)],[X(.30),X(s*.36)-q(.06)],[X(.36),X(s*.36)],[X(.30),X(s*.36)+q(.06)],[X(-.28),X(s*.36)+q(.06)]]);metal(c,fr,GUN,{bevel:1.6});
    for(let i=0;i<3;i++){c.fillStyle='rgba(0,0,0,.6)';c.beginPath();c.arc(X(-.18+i*.16),X(s*.36),q(.025),0,7);c.fill();}
    metal(c,rect(X(.12),X(s*.24)-q(.11),q(.22),q(.22),2.5),'#3a3e42',{bevel:1.5});rivets(c,X(.15),X(s*.24)-q(.08),X(.31),X(s*.24)-q(.08),3,.9);}   // gun cradles
  const cab=cham(X(-.3),X(-.17),q(.44),q(.34),q(.06));metal(c,cab,SLATE,{bevel:2.2});c.save();cab(c);c.clip();
  metal(c,cham(X(-.2),X(-.11),q(.24),q(.22),q(.03)),OLIVE,{bevel:1.2,lw:.8});c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.29),X(-.15),q(.035),q(.3));c.globalAlpha=1;
  c.fillStyle='#1b2f39';c.fillRect(X(.08),X(-.12),q(.04),q(.24));c.fillStyle=`rgba(${CYAN},.45)`;c.fillRect(X(.08),X(-.12),q(.012),q(.24));
  dirt(c,[X(-.3),X(-.2),q(.45),q(.4)],.45);scratches(c,[X(-.3),X(-.2),q(.45),q(.4)],50);c.restore();edgeWear(c,cab,.55,1.6);
  metal(c,circ(X(-.42),TC,q(.11)),'#33373a',{bevel:1.5});rivets(c,X(-.26),X(-.14),X(.06),X(-.14),5,.9);rivets(c,X(-.26),X(.14),X(.06),X(.14),5,.9);
  dirt(c,[0,0,TN,TN],.25);
  // the radar: a slotted antenna on a short mast, spun by the game while the turret is powered (drawn at (-.42, 0) on the head)
  const RN=Math.round(.62*P),RC=RN/2;put(D+'radar',sprite(RN,r=>{metal(r,rect(RC-q(.03),RC-q(.28),q(.07),q(.56),2),'#55595d',{bevel:1.3});
    for(let i=0;i<7;i++){r.fillStyle='rgba(0,0,0,.6)';r.fillRect(RC-q(.012),RC-q(.25)+i*q(.075),q(.03),q(.04));}
    metal(r,circ(RC,RC,q(.05)),'#2c3033',{bevel:1});r.fillStyle=RED;r.beginPath();r.arc(RC,RC-q(.27),q(.018),0,7);r.fill();}));
  finish(D,bs,hd,bar,[-.30,-.18,.18,.30],hb,[[-.1,-.1],[.1,.42],[-.2,-.45],[.25,-.25]],[[.6,-.6],[-.6,.5],[.5,.65],[-.4,-.7]],1.4);
  put(D+'flash',flashSprite(64));}

// ---- Lancer: a powered directed-energy projector with capacitor banks, cooling fins and a focusing tube ----
function lancer(){const D='lancer/',N=2*P,hb=2.4,TN=Math.round(hb*P),TC=TN/2,q=v=>v*P,X=v=>TC+q(v),B=v=>N/2+q(v);sd=5501;
  const [bs,b]=mk(N);pad(b,N,.64,{plate:.8,bolts:20,br:1.5,k:q(.2),col:'#5f5d58'});
  // transformer cabinets at two corners, heavy power conduits from the pad edge into the ring, small status lamps
  for(const [x,y] of [[-.66,-.66],[.66,.66]]){metal(b,rect(B(x)-q(.17),B(y)-q(.17),q(.34),q(.34),3),'#4a4f4a',{bevel:1.8});grille(b,B(x)-q(.12),B(y)-q(.12),q(.24),q(.15),6,'#4a4f4a');
    b.fillStyle='#16262d';b.beginPath();b.arc(B(x)+q(.08),B(y)+q(.1),q(.025),0,7);b.fill();b.fillStyle=`rgba(${CYAN},.65)`;b.beginPath();b.arc(B(x)+q(.08),B(y)+q(.1),q(.013),0,7);b.fill();}
  for(const [x0,y0,x1,y1] of [[-.95,.35,-.6,.25],[.35,-.95,.25,-.6],[-.95,.5,-.58,.4]]){b.lineCap='round';b.strokeStyle='#18191b';b.lineWidth=q(.075);b.beginPath();b.moveTo(B(x0),B(y0));b.lineTo(B(x1),B(y1));b.stroke();
    b.strokeStyle='rgba(255,250,235,.15)';b.lineWidth=q(.02);b.beginPath();b.moveTo(B(x0),B(y0)-q(.015));b.lineTo(B(x1),B(y1)-q(.015));b.stroke();
    for(let i=1;i<3;i++){const t=i/3;b.fillStyle='#c99a22';b.save();b.translate(B(x0+(x1-x0)*t),B(y0+(y1-y0)*t));b.rotate(Math.atan2(y1-y0,x1-x0));b.fillRect(-q(.015),-q(.04),q(.03),q(.08));b.restore();}}
  padMarks(b,N,q(.2));hazard(b,rect(B(.25),B(-.95),q(.5),q(.06)),q(.04));
  // the emitter: a focusing tube with coil rings, ending in an octagonal emitter head; it kicks back slightly on discharge
  const [bar,bc]=mk(TN);cyl(bc,X(.28),X(.86),TC,q(.15),'#4a4f53');
  for(let i=0;i<4;i++)band(bc,X(.36+i*.12),TC,q(.19),q(.045),'#2f3336');
  metal(bc,octo(X(.9),TC,q(.11),q(.13)),'#3a3e42',{bevel:1.6});metal(bc,circ(X(.93),TC,q(.06)),'#1a2a30',{bevel:1});
  // the head: a long angled housing, two capacitor banks along the flanks, cooling fins at the back, conduits forward to the emitter
  const [hd,c]=mk(TN);
  for(const s of [-1,1]){for(let i=0;i<3;i++){const x=-.5+i*.17;metal(c,circ(X(x),X(s*.39),q(.075)),'#555a5e',{bevel:1.5});metal(c,circ(X(x),X(s*.39),q(.045)),'#3a3f43',{bevel:1,lw:.6});
      c.fillStyle='#b88d3a';c.fillRect(X(x)-q(.012),X(s*.39)-q(.075),q(.024),q(.03));}
    c.lineCap='round';c.strokeStyle='#1a1b1d';c.lineWidth=q(.04);c.beginPath();c.moveTo(X(-.1),X(s*.38));c.quadraticCurveTo(X(.15),X(s*.36),X(.3),X(s*.12));c.stroke();}
  const fins=rect(X(-.78),X(-.24),q(.18),q(.48),3);metal(c,fins,'#3c4044',{bevel:1.4});for(let i=0;i<9;i++){c.fillStyle='rgba(0,0,0,.65)';c.fillRect(X(-.76),X(-.22)+i*q(.05),q(.14),q(.018));c.fillStyle='rgba(255,248,225,.2)';c.fillRect(X(-.76),X(-.22)+i*q(.05)+q(.018),q(.14),q(.008));}
  const hull=poly([[X(-.62),X(-.3)],[X(.12),X(-.3)],[X(.34),X(-.18)],[X(.34),X(.18)],[X(.12),X(.3)],[X(-.62),X(.3)]]);metal(c,hull,SLATE,{bevel:2.6});
  c.save();hull(c);c.clip();metal(c,poly([[X(-.45),X(-.2)],[X(.05),X(-.2)],[X(.18),X(-.1)],[X(.18),X(.1)],[X(.05),X(.2)],[X(-.45),X(.2)]]),OLIVE,{bevel:1.6,lw:.9});
  seam(c,X(-.1),X(-.3),X(-.1),X(.3),.45);seam(c,X(.12),X(-.3),X(.12),X(.3),.45);c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.6),X(-.28),q(.04),q(.56));c.globalAlpha=1;
  hazard(c,rect(X(.26),X(-.2),q(.06),q(.4)),q(.03),.9);stencil(c,'HDF',X(-.22),X(.0),12,Math.PI/2,'rgba(226,220,196,.65)');
  // the coil windows: glass slits the charge shows through (the glow layer lights them)
  for(let i=0;i<3;i++){c.fillStyle='#16262d';c.fillRect(X(-.4+i*.1),X(-.14),q(.04),q(.28));c.fillStyle=`rgba(${CYAN},.25)`;c.fillRect(X(-.4+i*.1),X(-.14),q(.012),q(.28));}
  dirt(c,[X(-.65),X(-.3),q(1),q(.6)],.45);scratches(c,[X(-.65),X(-.3),q(1),q(.6)],80);c.restore();edgeWear(c,hull,.55,1.8);
  rivets(c,X(-.58),X(-.26),X(.08),X(-.26),8,1);rivets(c,X(-.58),X(.26),X(.08),X(.26),8,1);metal(c,circ(X(.24),TC,q(.1)),'#2d3134',{bevel:1.4});
  // glow: what lights up with charge (coil windows and the lens), additive; heat: the fins after a discharge
  put(D+'glow',sprite(TN,g=>{g.globalCompositeOperation='lighter';
    for(let i=0;i<3;i++){const gr=g.createLinearGradient(X(-.4+i*.1),0,X(-.36+i*.1),0);gr.addColorStop(0,`rgba(${CYAN},.95)`);gr.addColorStop(1,`rgba(${CYAN},.55)`);g.fillStyle=gr;g.fillRect(X(-.4+i*.1),X(-.14),q(.04),q(.28));
      const h=g.createRadialGradient(X(-.38+i*.1),TC,0,X(-.38+i*.1),TC,q(.14));h.addColorStop(0,`rgba(${CYAN},.35)`);h.addColorStop(1,`rgba(${CYAN},0)`);g.fillStyle=h;g.fillRect(X(-.55+i*.1),X(-.2),q(.34),q(.4));}
    const l=g.createRadialGradient(X(.93),TC,0,X(.93),TC,q(.2));l.addColorStop(0,'rgba(235,252,255,1)');l.addColorStop(.25,`rgba(${CYAN},.85)`);l.addColorStop(1,`rgba(${CYAN},0)`);g.fillStyle=l;g.fillRect(X(.7),TC-q(.22),q(.45),q(.44));}));
  put(D+'heat',sprite(TN,g=>{g.globalCompositeOperation='lighter';for(let i=0;i<9;i++){g.fillStyle='rgba(255,120,50,.7)';g.fillRect(X(-.76),X(-.22)+i*q(.05)+q(.004),q(.14),q(.01));}
    const h=g.createRadialGradient(X(-.69),TC,0,X(-.69),TC,q(.3));h.addColorStop(0,'rgba(255,110,40,.35)');h.addColorStop(1,'rgba(255,110,40,0)');g.fillStyle=h;g.fillRect(X(-1),X(-.35),q(.62),q(.7));}));
  finish(D,bs,hd,bar,[0],hb,[[-.3,-.15],[.05,.18],[-.5,.1]],[[.6,-.55],[-.55,.6],[.2,.7]],1.4);
  // the discharge flash at the lens: pale blue-white
  put(D+'flash',sprite(64,(g,n)=>{g.globalCompositeOperation='lighter';const r=g.createRadialGradient(n*.3,n/2,0,n*.3,n/2,n*.45);r.addColorStop(0,'rgba(245,253,255,1)');r.addColorStop(.3,`rgba(${CYAN},.8)`);r.addColorStop(1,`rgba(${CYAN},0)`);g.fillStyle=r;g.fillRect(0,0,n,n);}));}

duo();hail();flak();lancer();
return out;})()
