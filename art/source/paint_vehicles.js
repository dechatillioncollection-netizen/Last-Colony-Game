// Paints the HDF ground vehicles: Scout Tank, Rammer Drone, Flame Tank and Siege Tank (art/hdf/scout-tank, rammer-drone,
// flame-tank, siege-tank). 128 px per tile, light from the top left, every vehicle facing +x (right). The sizes below are copied
// into the game's VEH table; change both together.
//   hull, dmg1, dmg2, boss, wreck, shadow: square boxes of box tiles centred on the vehicle's pivot
//   track_0..3 (or wheel_0..3): one track strip (or one wheel), four frames a quarter of a link apart
//   turret, barrel, tdmg1, tdmg2, tboss: square boxes of tbox tiles centred on the turret pivot
//   flash / flare, beacon, leg: small effect and part sprites, described where they are painted
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
// Each vehicle: geometry in tiles (G), then the paint. Pixel helper q(v)=v*P; the box centre is the vehicle pivot.
const KHAKI='#7b7457',OLIVE='#5d6146',GUN='#4a4f55',STEEL='#8b9096',RED='#b8463a';

// ---- Scout Tank: narrow hull on thin tracks, small forward turret with a slim gun, comms gear ----
function scout(){const D='scout-tank/',box=1.05,N=Math.round(box*P),C=N/2,q=v=>v*P,X=v=>C+q(v),Y=X;sd=1101;
  const tl=.80,tw=.13,ty=.215,pitch=q(.052);
  const tr=[0,1,2,3].map(f=>trackStrip(q(tl),q(tw),pitch,f));tr.forEach((t,i)=>put(D+'track_'+i,t));
  const [h,c]=mk(N);
  // the hull: a narrow tapered body riding between the tracks, with mudguards over the track fronts
  const body=poly([[X(-.37),Y(-.155)],[X(.19),Y(-.16)],[X(.36),Y(-.10)],[X(.39),Y(-.05)],[X(.39),Y(.05)],[X(.36),Y(.10)],[X(.19),Y(.16)],[X(-.37),Y(.155)],[X(-.39),Y(.12)],[X(-.39),Y(-.12)]]);
  for(const s of [-1,1]){metal(c,poly([[X(.29),Y(s*ty-.07)],[X(.38),Y(s*ty-.07)],[X(.42),Y(s*ty-.04)],[X(.42),Y(s*ty+.04)],[X(.38),Y(s*ty+.07)],[X(.29),Y(s*ty+.07)]]),sh(KHAKI,-.1),{bevel:1.3});
    rivets(c,X(.31),Y(s*ty-.045),X(.31),Y(s*ty+.045),3,.7);
    metal(c,rect(X(-.43),Y(s*ty-.065),q(.035),q(.13),1),'#232427',{bevel:.8});
    // side stowage bins hung on the hull edge
    metal(c,rect(X(-.24),Y(s*.155-.03),q(.17),q(.06),1.5),sh(OLIVE,-.05),{bevel:1.2});rivets(c,X(-.22),Y(s*.155),X(-.09),Y(s*.155),3,.8);}
  metal(c,body,KHAKI,{bevel:2.4});
  c.save();body(c);c.clip();
  // glacis break line and engine deck
  seam(c,X(.19),Y(-.15),X(.19),Y(.15));seam(c,X(-.12),Y(-.15),X(-.12),Y(.15));seam(c,X(-.37),Y(0),X(-.13),Y(0),.4);
  grille(c,X(-.33),Y(-.11),q(.17),q(.09),6,KHAKI);grille(c,X(-.33),Y(.025),q(.17),q(.08),6,KHAKI);
  // driver's hatch and vision blocks, front left; headlights in the nose
  hatch(c,X(.25),Y(-.07),q(.042),sh(KHAKI,.04));c.fillStyle='rgba(30,40,46,.9)';c.fillRect(X(.31),Y(-.10),q(.022),q(.06));c.fillStyle='rgba(160,200,210,.35)';c.fillRect(X(.31),Y(-.10),q(.008),q(.06));
  light(c,X(.355),Y(-.075),q(.017));light(c,X(.355),Y(.075),q(.017));
  // a red HDF identification band across the deck, and the unit stencil
  c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.105),Y(-.16),q(.035),q(.32));c.globalAlpha=1;edgeWear(c,rect(X(-.105),Y(-.16),q(.035),q(.32)),.6,1.2);
  stencil(c,'HDF',X(.07),Y(.09),7,0);stencil(c,'S-7',X(.07),Y(-.105),6,0,'rgba(226,220,196,.6)');
  rivets(c,X(.17),Y(-.13),X(.17),Y(.13),5,.85);rivets(c,X(-.36),Y(-.135),X(.15),Y(-.135),8,.7);rivets(c,X(-.36),Y(.135),X(.15),Y(.135),8,.7);
  dirt(c,[X(-.4),Y(-.17),q(.8),q(.34)],.5);scratches(c,[X(-.4),Y(-.17),q(.8),q(.34)],70);c.restore();edgeWear(c,body,.55);
  // tow hooks and the antenna base (the whip is drawn live)
  for(const s of [-1,1]){c.fillStyle='#2a2b2c';c.fillRect(X(-.42),Y(s*.07-.012),q(.03),q(.024));}
  metal(c,circ(X(-.30),Y(-.115),q(.02)),GUN,{bevel:1});
  put(D+'hull',h);
  // turret: a small cast turret with a cupola, a sensor pod on the right cheek and smoke dischargers
  const tbox=1.0,TN=Math.round(tbox*P),TC=TN/2,TX=v=>TC+q(v);
  const [t,tc]=mk(TN),[b,bc]=mk(TN);
  // gun: slim barrel with a thermal sleeve and a flash hider (drawn under the turret, slides back on recoil)
  cyl(bc,TX(.06),TX(.40),TC,q(.032),GUN);band(bc,TX(.16),TC,q(.04),q(.05),sh(OLIVE,-.1));band(bc,TX(.27),TC,q(.038),q(.03),sh(OLIVE,-.1));
  cyl(bc,TX(.385),TX(.44),TC,q(.042),sh(GUN,-.2),{cap:1.5});bc.fillStyle='#0a0a0a';bc.fillRect(TX(.437),TC-q(.009),q(.006),q(.018));
  bc.fillStyle='rgba(0,0,0,.5)';bc.fillRect(TX(.40),TC-q(.021),q(.03),1);bc.fillRect(TX(.40),TC+q(.021)-1,q(.03),1);
  const tur=poly([[TX(.12),TX(-.065)],[TX(.14),TX(-.03)],[TX(.14),TX(.03)],[TX(.12),TX(.065)],[TX(.04),TX(.11)],[TX(-.10),TX(.105)],[TX(-.155),TX(.06)],[TX(-.16),TX(-.06)],[TX(-.10),TX(-.105)],[TX(.04),TX(-.11)]]);
  metal(tc,rect(TX(.09),TX(-.035),q(.07),q(.07),2),sh(GUN,.1),{bevel:1.2});   // mantlet
  metal(tc,tur,sh(KHAKI,.04),{bevel:2.2});tc.save();tur(tc);tc.clip();
  hatch(tc,TX(-.05),TX(-.035),q(.045),sh(KHAKI,.08));seam(tc,TX(.07),TX(-.1),TX(.07),TX(.1),.45);
  grille(tc,TX(-.15),TX(-.02),q(.045),q(.05),3,KHAKI,false);
  dirt(tc,[TX(-.17),TX(-.12),q(.32),q(.24)],.4);scratches(tc,[TX(-.17),TX(-.12),q(.32),q(.24)],30);tc.restore();edgeWear(tc,tur,.5);
  metal(tc,rect(TX(-.04),TX(.055),q(.09),q(.05),1.5),'#3b3f42',{bevel:1.2});tc.fillStyle='#14232a';tc.beginPath();tc.arc(TX(.035),TX(.08),q(.014),0,7);tc.fill();
  tc.fillStyle='rgba(120,200,220,.55)';tc.beginPath();tc.arc(TX(.031),TX(.076),q(.005),0,7);tc.fill();
  for(const s of [-1,1])for(let i=0;i<2;i++)metal(tc,circ(TX(.07-i*.03),TX(s*.095),q(.012)),'#3a3d3e',{bevel:.8,lw:.7});
  metal(tc,circ(TX(-.11),TX(.065),q(.014)),GUN,{bevel:.8});   // antenna socket
  put(D+'turret',t);put(D+'barrel',b);
  const all=sprite(N,(c)=>{tr.forEach(()=>0);for(const s of [-1,1])c.drawImage(tr[0],X(-tl/2),Y(s*ty-tw/2));c.drawImage(h,0,0);});
  put(D+'shadow',shadowOf(all,3));
  put(D+'dmg1',damage(h,1,[[X(.27),Y(.05)],[X(-.2),Y(-.08)],[X(0),Y(.11)],[X(.1),Y(-.12)]]));
  put(D+'dmg2',damage(h,2,[[X(-.25),Y(.04)],[X(.22),Y(-.06)],[X(.02),Y(.1)],[X(-.05),Y(-.11)]]));
  const tb=sprite(TN,c=>{c.drawImage(b,0,0);c.drawImage(t,0,0);});
  put(D+'tdmg1',damage(tb,1,[[TX(.04),TX(.06)],[TX(-.1),TX(-.06)]],.7));put(D+'tdmg2',damage(tb,2,[[TX(-.06),TX(.04)],[TX(.06),TX(-.06)],[TX(.25),TX(0)]],.7));
  // command vehicle: extra appliqué armour, a second whip and red command chevrons
  put(D+'boss',sprite(N,c=>{for(const s of [-1,1]){metal(c,poly([[X(.20),Y(s*.16)],[X(.33),Y(s*.105)],[X(.36),Y(s*.125)],[X(.22),Y(s*.185)]]),sh(GUN,.15),{bevel:1.2});
      rivets(c,X(.23),Y(s*.165),X(.32),Y(s*.125),3,.8);}
    metal(c,rect(X(-.36),Y(-.06),q(.08),q(.12),1.5),'#3b3f42',{bevel:1.2});c.fillStyle=RED;for(let i=0;i<2;i++){c.beginPath();c.moveTo(X(-.02+i*.06),Y(-.05));c.lineTo(X(.02+i*.06),Y(0));c.lineTo(X(-.02+i*.06),Y(.05));
      c.lineTo(X(-.04+i*.06),Y(.05));c.lineTo(X(0+i*.06),Y(0));c.lineTo(X(-.04+i*.06),Y(-.05));c.fill();}}));
  put(D+'tboss',sprite(TN,c=>{metal(c,rect(TX(-.12),TX(-.10),q(.12),q(.035),1),sh(GUN,.1),{bevel:1});metal(c,rect(TX(-.12),TX(.07),q(.12),q(.035),1),sh(GUN,.1),{bevel:1});
    c.fillStyle=RED;c.fillRect(TX(-.155),TX(-.04),q(.02),q(.08));}));
  const wr=sprite(N,c=>{c.drawImage(all,0,0);c.save();c.translate(X(-.04),Y(.03));c.rotate(.6);c.drawImage(tb,-TC,-TC);c.restore();});put(D+'wreck',wreckOf(wr));
  put(D+'flash',flashSprite(48));}

// ---- Rammer Drone: low wheeled wedge with exposed wheels on swing arms, a reinforced plough, explosive drums and a beacon ----
function rammer(){const D='rammer-drone/',box=.85,N=Math.round(box*P),C=N/2,q=v=>v*P,X=v=>C+q(v),Y=X;sd=2203;
  const wl=.15,ww=.075,wx=[.16,-.17],wy=.20;
  const wh=[0,1,2,3].map(f=>wheel(q(wl),q(ww),f));wh.forEach((t,i)=>put(D+'wheel_'+i,t));
  const [h,c]=mk(N);
  // chassis rails and swing arms with coil springs
  metal(c,rect(X(-.29),Y(-.07),q(.56),q(.14),2),'#2e3135',{bevel:1.2});
  for(const s of [-1,1])for(const x of wx){metal(c,rect(X(x-.022),Y(s>0?.04:-wy+.02),q(.044),q(wy-.06),1.5),'#3a3d40',{bevel:1});
    c.strokeStyle='#8e8c84';c.lineWidth=1.2;c.beginPath();for(let i=0;i<=8;i++){const yy=s*(.06+i*(wy-.11)/8),xx=x+(i&1?.03:-.03);i?c.lineTo(X(xx),Y(yy)):c.moveTo(X(xx),Y(yy));}c.stroke();
    c.strokeStyle='rgba(0,0,0,.5)';c.lineWidth=.6;c.stroke();metal(c,circ(X(x),Y(s*(wy-.035)),q(.022)),STEEL,{bevel:.8,lw:.7});}
  // armoured wedge shell
  const shell=poly([[X(-.27),Y(-.12)],[X(.10),Y(-.135)],[X(.21),Y(-.075)],[X(.21),Y(.075)],[X(.10),Y(.135)],[X(-.27),Y(.12)],[X(-.30),Y(.07)],[X(-.30),Y(-.07)]]);
  metal(c,shell,'#565b5f',{bevel:2.2,lit:.2});c.save();shell(c);c.clip();
  seam(c,X(.10),Y(-.13),X(.10),Y(.13));seam(c,X(-.12),Y(-.12),X(-.12),Y(.12));
  // two explosive drums strapped on the back, with wiring to the charge box
  for(const s of [-1,1]){const cx=X(-.20),cy=Y(s*.06);metal(c,circ(cx,cy,q(.052)),'#7d2f25',{bevel:1.6,lit:.25});metal(c,circ(cx,cy,q(.03)),'#6a281f',{bevel:1,lw:.7});
    c.fillStyle='#c79a24';c.beginPath();c.arc(cx,cy,q(.052),-.5,.5);c.lineTo(cx,cy);c.fill();rivet(c,cx,cy,1);}
  c.strokeStyle='#1c1d1f';c.lineWidth=2.2;c.beginPath();c.moveTo(X(-.10),Y(0));c.lineTo(X(-.25),Y(0));c.stroke();c.strokeStyle='#8a2a20';c.lineWidth=1;c.beginPath();c.moveTo(X(-.15),Y(-.06));c.quadraticCurveTo(X(-.09),Y(-.03),X(-.05),Y(-.02));c.stroke();
  metal(c,rect(X(-.09),Y(-.04),q(.10),q(.08),1.5),'#3b3f42',{bevel:1.2});stencil(c,'!',X(-.04),Y(0),7,0,'rgba(214,168,34,.9)');
  c.fillStyle='rgba(0,0,0,.6)';for(let i=0;i<3;i++)c.fillRect(X(.13+i*.02),Y(-.05),1.2,q(.1));
  dirt(c,[X(-.3),Y(-.14),q(.52),q(.28)],.55);scratches(c,[X(-.3),Y(-.14),q(.52),q(.28)],50);c.restore();edgeWear(c,shell,.6);
  // beacon housing (the light itself is the live 'beacon' layer)
  metal(c,circ(X(.04),Y(0),q(.035)),'#2a2c2e',{bevel:1});c.fillStyle='#5a1a12';c.beginPath();c.arc(X(.04),Y(0),q(.024),0,7);c.fill();c.fillStyle='rgba(255,220,200,.35)';c.beginPath();c.arc(X(.033),Y(-.007),q(.008),0,7);c.fill();
  // the ram: a heavy V plough on push struts, hazard striped, with three teeth
  for(const s of [-1,1]){metal(c,poly([[X(.17),Y(s*.05)],[X(.29),Y(s*.16)],[X(.27),Y(s*.18)],[X(.15),Y(s*.07)]]),'#3a3d40',{bevel:1});}
  const plow=poly([[X(.40),Y(0)],[X(.27),Y(-.27)],[X(.22),Y(-.27)],[X(.31),Y(-.06)],[X(.31),Y(.06)],[X(.22),Y(.27)],[X(.27),Y(.27)]]);
  metal(c,poly([[X(.405),Y(0)],[X(.275),Y(-.28)],[X(.25),Y(-.28)],[X(.36),Y(0)],[X(.25),Y(.28)],[X(.275),Y(.28)]]),'#6c6f70',{bevel:1.2});
  hazard(c,plow,4.5);c.save();plow(c);c.clip();c.fillStyle='rgba(0,0,0,.35)';c.fillRect(X(.22),Y(-.28),q(.05),q(.56));c.restore();
  for(const s of [-1,0,1]){const ax=X(.40-Math.abs(s)*.06),ay=Y(s*.12);metal(c,poly([[ax+q(.05),ay],[ax-q(.005),ay-q(.025)],[ax-q(.005),ay+q(.025)]]),STEEL,{bevel:.8,lw:.8});}
  rivets(c,X(.30),Y(-.2),X(.36),Y(-.06),3,.9);rivets(c,X(.30),Y(.2),X(.36),Y(.06),3,.9);
  put(D+'hull',h);
  const all=sprite(N,c=>{for(const s of [-1,1])for(const x of wx)c.drawImage(wh[0],X(x-wl/2),Y(s*wy-ww/2));c.drawImage(h,0,0);});
  put(D+'shadow',shadowOf(all,2.5));
  put(D+'dmg1',damage(h,1,[[X(.0),Y(.07)],[X(-.2),Y(-.06)],[X(.3),Y(.1)]],.8));put(D+'dmg2',damage(h,2,[[X(-.15),Y(.05)],[X(.1),Y(-.07)],[X(.3),Y(-.12)]],.8));
  put(D+'boss',sprite(N,c=>{for(const s of [-1,1]){metal(c,rect(X(-.12),Y(s*.12-.025),q(.2),q(.05),1.5),sh(GUN,.1),{bevel:1.1});rivets(c,X(-.1),Y(s*.12),X(.06),Y(s*.12),3,.8);}
    hazard(c,poly([[X(.43),Y(0)],[X(.40),Y(-.07)],[X(.38),Y(0)],[X(.40),Y(.07)]]),3,1,['#b8463a','#1d1d1a']);}));
  // debris left when it blows: the plough, two wheels, bent arms and burnt fragments
  const deb=sprite(N,c=>{for(let i=0;i<5;i++)scorch(c,X(rr(-.25,.25)),Y(rr(-.25,.25)),q(rr(.08,.16)),.75);
    c.save();c.translate(X(.12),Y(-.08));c.rotate(.9);c.drawImage(h,-C+q(-.30),-C,N,N,0,0,0,0);c.restore();
    const piece=(sx,sy,sw,shh,dx,dy,a)=>{c.save();c.translate(X(dx),Y(dy));c.rotate(a);c.drawImage(h,X(sx),Y(sy),q(sw),q(shh),-q(sw)/2,-q(shh)/2,q(sw),q(shh));c.restore();};
    piece(.22,-.28,.19,.56,.16,.04,.5);piece(-.30,-.13,.2,.26,-.12,-.05,-.3);piece(-.08,-.13,.16,.12,.02,.16,1.4);
    c.save();c.translate(X(-.22),Y(.17));c.rotate(.4);c.drawImage(wh[0],-q(wl)/2,-q(ww)/2);c.restore();c.save();c.translate(X(.06),Y(-.22));c.rotate(-1.1);c.drawImage(wh[1],-q(wl)/2,-q(ww)/2);c.restore();});
  put(D+'wreck',wreckOf(deb));
  // the beacon's live light: a red glow (drawn with 'lighter')
  put(D+'beacon',sprite(32,(c,n)=>{const g=c.createRadialGradient(n/2,n/2,0,n/2,n/2,n/2);g.addColorStop(0,'rgba(255,220,190,1)');g.addColorStop(.2,'rgba(255,90,60,.95)');g.addColorStop(.55,'rgba(230,50,30,.35)');g.addColorStop(1,'rgba(200,30,20,0)');c.fillStyle=g;c.fillRect(0,0,n,n);}));}

// ---- Flame Tank: wide and heavy, layered glacis, armour skirts, twin fuel cylinders with hoses, squat turret, short twin projector ----
function flame(){const D='flame-tank/',box=1.45,N=Math.round(box*P),C=N/2,q=v=>v*P,X=v=>C+q(v),Y=X;sd=3307;
  const tl=1.10,tw=.20,ty=.33,pitch=q(.068);
  const BASE='#5a5c44';
  const tr=[0,1,2,3].map(f=>trackStrip(q(tl),q(tw),pitch,f));tr.forEach((t,i)=>put(D+'track_'+i,t));
  const [h,c]=mk(N);
  // armour skirts over the inner half of each track: four bolted panels a side
  for(const s of [-1,1]){for(let i=0;i<4;i++){const x0=-.46+i*.235;metal(c,rect(X(x0),Y(s>0?ty-.11:-ty+.01),q(.225),q(.10),1.5),sh(BASE,-.08+i%2*.04),{bevel:1.4});
      rivets(c,X(x0+.02),Y(s*(ty-.035)),X(x0+.2),Y(s*(ty-.035)),4,.8);}}
  const body=poly([[X(-.54),Y(-.25)],[X(.30),Y(-.26)],[X(.40),Y(-.22)],[X(.40),Y(.22)],[X(.30),Y(.26)],[X(-.54),Y(.25)],[X(-.57),Y(.2)],[X(-.57),Y(-.2)]]);
  metal(c,body,BASE,{bevel:2.6});c.save();body(c);c.clip();
  seam(c,X(.15),Y(-.25),X(.15),Y(.25));seam(c,X(-.20),Y(-.25),X(-.20),Y(.25));seam(c,X(-.2),Y(0),X(-.54),Y(0),.35);
  // fuel/pressure plant on the rear deck: two cylinders, red bands, a regulator with a valve wheel and gauges
  for(const s of [-1,1]){const yy=Y(s*.125);c.fillStyle='rgba(0,0,0,.45)';c.fillRect(X(-.53),yy-q(.08),q(.36),q(.17));
    cyl(c,X(-.53),X(-.19),yy,q(.15),'#6b6a5c',{cap:q(.05)});band(c,X(-.47),yy,q(.15),q(.025),'#8e3226');band(c,X(-.30),yy,q(.15),q(.025),'#8e3226');
    c.fillStyle='#232426';c.fillRect(X(-.40),yy-q(.08),q(.018),q(.16));c.fillRect(X(-.25),yy-q(.08),q(.018),q(.16));stencil(c,'FUEL',X(-.37)+q(.06),yy+q(.005),5.5,0,'rgba(226,220,196,.55)');}
  metal(c,rect(X(-.18),Y(-.06),q(.1),q(.12),1.5),'#3c3f40',{bevel:1.2});c.strokeStyle='#b23a2c';c.lineWidth=1.4;c.beginPath();c.arc(X(-.13),Y(0),q(.028),0,7);c.stroke();
  c.beginPath();c.moveTo(X(-.13)-q(.028),Y(0));c.lineTo(X(-.13)+q(.028),Y(0));c.moveTo(X(-.13),Y(0)-q(.028));c.lineTo(X(-.13),Y(0)+q(.028));c.stroke();
  for(const s of [-1,1]){c.fillStyle='#d9d4bc';c.beginPath();c.arc(X(-.16),Y(s*.045),q(.012),0,7);c.fill();c.strokeStyle='#222';c.lineWidth=.6;c.stroke();c.beginPath();c.moveTo(X(-.16),Y(s*.045));c.lineTo(X(-.155),Y(s*.045-.008));c.stroke();}
  // hoses from the tanks to the turret ring
  for(const s of [-1,1]){c.lineCap='round';c.strokeStyle='#121314';c.lineWidth=q(.032);c.beginPath();c.moveTo(X(-.19),Y(s*.125));c.bezierCurveTo(X(-.10),Y(s*.15),X(-.06),Y(s*.14),X(-.02),Y(s*.11));c.stroke();
    c.strokeStyle='#2e2f31';c.lineWidth=q(.02);c.stroke();c.strokeStyle='rgba(200,196,180,.25)';c.lineWidth=.8;c.stroke();
    c.fillStyle='#8b8a80';c.fillRect(X(-.12),Y(s*.14)-2,3,4);}
  // turret ring, engine louvres, crew hatch
  c.fillStyle='rgba(0,0,0,.5)';c.beginPath();c.arc(X(.07),Y(0),q(.21),0,7);c.fill();
  grille(c,X(-.56),Y(-.04),q(.025),q(.08),3,BASE,false);
  hatch(c,X(.25),Y(.13),q(.05),sh(BASE,.05));
  stencil(c,'HDF',X(.25),Y(-.15),8,0);c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.215),Y(-.25),q(.03),q(.5));c.globalAlpha=1;
  dirt(c,[X(-.6),Y(-.27),q(1),q(.54)],.55);scratches(c,[X(-.6),Y(-.27),q(1),q(.54)],140);c.restore();edgeWear(c,body,.55);
  // layered glacis: three stepped slabs, the front edge blackened by flame wash
  const slabs=[[.30,.25,.0],[.37,.22,.04],[.43,.17,.08]];
  slabs.forEach(([x,w,d],i)=>{const sl=poly([[X(x-.04),Y(-w)],[X(x+.06-d*.2),Y(-w+.02)],[X(x+.07-d*.2),Y(w-.02)],[X(x-.04),Y(w)]]);metal(c,sl,sh(BASE,.06-i*.05),{bevel:1.8});
    rivets(c,X(x),Y(-w+.04),X(x),Y(w-.04),5-i,.9);});
  c.save();c.globalCompositeOperation='source-atop';const gs=c.createLinearGradient(X(.32),0,X(.52),0);gs.addColorStop(0,'rgba(20,14,10,0)');gs.addColorStop(1,'rgba(20,14,10,.7)');c.fillStyle=gs;c.fillRect(X(.3),Y(-.3),q(.25),q(.6));c.restore();
  for(const s of [-1,1])light(c,X(.42),Y(s*.20),q(.018));
  put(D+'hull',h);
  const tbox=.8,TN=Math.round(tbox*P),TC=TN/2,TX=v=>TC+q(v);
  const [t,tc]=mk(TN),[b,bc]=mk(TN);
  // twin projector: two short nozzles in a perforated heat shroud, igniter blocks at the tips
  for(const s of [-1,1]){cyl(bc,TX(.12),TX(.33),TC+q(s*.034),q(.04),'#3d3d3a');}
  metal(bc,rect(TX(.14),TC-q(.068),q(.14),q(.136),2),'#4a4945',{bevel:1.3});
  bc.fillStyle='rgba(0,0,0,.7)';for(let i=0;i<5;i++)for(let j=0;j<4;j++){bc.beginPath();bc.arc(TX(.155+i*.026),TC+q(-.048+j*.032),1.1,0,7);bc.fill();}
  for(const s of [-1,1]){cyl(bc,TX(.31),TX(.355),TC+q(s*.034),q(.048),'#2a2826',{cap:1});const g=bc.createLinearGradient(TX(.33),0,TX(.355),0);g.addColorStop(0,'rgba(60,30,10,0)');g.addColorStop(1,'rgba(30,16,8,.9)');bc.fillStyle=g;bc.fillRect(TX(.33),TC+q(s*.034-.024),q(.03),q(.048));}
  metal(bc,rect(TX(.27),TC-q(.012),q(.06),q(.024),1),'#3a3d40',{bevel:.8,lw:.7});
  const tur=octo(TX(.0),TC,q(.195),q(.18));
  metal(tc,tur,sh(BASE,.05),{bevel:2.4});tc.save();tur(tc);tc.clip();
  hatch(tc,TX(-.06),TC-q(.06),q(.05),sh(BASE,.1));metal(tc,rect(TX(-.10),TC+q(.03),q(.09),q(.07),1.5),'#3c3f40',{bevel:1.1});
  tc.fillStyle='#14232a';tc.fillRect(TX(.06),TC-q(.12),q(.05),q(.022));tc.fillStyle='rgba(140,190,200,.3)';tc.fillRect(TX(.06),TC-q(.12),q(.05),q(.007));
  seamPath(tc,octo(TX(0),TC,q(.14),q(.13)),.35);dirt(tc,[TX(-.2),TC-q(.2),q(.4),q(.4)],.45);scratches(tc,[TX(-.2),TC-q(.2),q(.4),q(.4)],40);
  const g=tc.createLinearGradient(TX(.08),0,TX(.2),0);g.addColorStop(0,'rgba(20,14,10,0)');g.addColorStop(1,'rgba(20,14,10,.55)');tc.fillStyle=g;tc.fillRect(TX(.08),TC-q(.2),q(.14),q(.4));
  tc.restore();edgeWear(tc,tur,.5);
  for(const s of [-1,1])rivets(tc,TX(-.12),TC+q(s*.15),TX(.1),TC+q(s*.15),4,.85);
  put(D+'turret',t);put(D+'barrel',b);
  const all=sprite(N,c=>{for(const s of [-1,1])c.drawImage(tr[0],X(-tl/2),Y(s*ty-tw/2));c.drawImage(h,0,0);});put(D+'shadow',shadowOf(all,3.5));
  put(D+'dmg1',damage(h,1,[[X(.35),Y(.12)],[X(-.05),Y(-.2)],[X(-.4),Y(.2)],[X(.1),Y(.2)]],1.2));put(D+'dmg2',damage(h,2,[[X(.3),Y(-.15)],[X(-.35),Y(.12)],[X(.05),Y(.2)],[X(-.1),Y(-.2)]],1.2));
  const tb=sprite(TN,c=>{c.drawImage(b,0,0);c.drawImage(t,0,0);});
  put(D+'tdmg1',damage(tb,1,[[TX(.06),TC+q(.08)],[TX(-.1),TC-q(.1)]]));put(D+'tdmg2',damage(tb,2,[[TX(-.05),TC+q(.06)],[TX(.08),TC-q(.08)]]));
  put(D+'boss',sprite(N,c=>{for(const s of [-1,1]){metal(c,poly([[X(.30),Y(s*.27)],[X(.47),Y(s*.20)],[X(.49),Y(s*.23)],[X(.32),Y(s*.31)]]),sh(GUN,.1),{bevel:1.3});}
    metal(c,rect(X(.15),Y(-.08),q(.08),q(.16),1.5),sh(GUN,.12),{bevel:1.2});hazard(c,rect(X(-.58),Y(-.17),q(.03),q(.34)),3,1,['#b8463a','#1d1d1a']);}));
  put(D+'tboss',sprite(TN,c=>{metal(c,octo(TX(-.12),TC,q(.05),q(.12)),sh(GUN,.1),{bevel:1});c.fillStyle=RED;c.fillRect(TX(-.03),TC-q(.19),q(.06),q(.02));c.fillRect(TX(-.03),TC+q(.17),q(.06),q(.02));}));
  const wr=sprite(N,c=>{c.drawImage(all,0,0);c.save();c.translate(X(.03),Y(-.05));c.rotate(-.45);c.drawImage(tb,-TC,-TC);c.restore();});put(D+'wreck',wreckOf(wr));
  // projector flare: a short roaring tongue of flame from the nozzle tips (left middle is the nozzle)
  put(D+'flare',sprite(64,(c,n)=>{c.globalCompositeOperation='lighter';const y=n/2;
    for(const [L,w,a,col] of [[n,n*.22,.55,'255,110,30'],[n*.75,n*.14,.8,'255,170,60'],[n*.45,n*.07,.95,'255,240,190']]){const g=c.createLinearGradient(0,0,L,0);
      g.addColorStop(0,`rgba(${col},${a})`);g.addColorStop(.6,`rgba(${col},${a*.6})`);g.addColorStop(1,`rgba(${col},0)`);c.fillStyle=g;c.beginPath();c.moveTo(0,y-w*.4);c.quadraticCurveTo(L*.45,y-w,L,y);c.quadraticCurveTo(L*.45,y+w,0,y+w*.4);c.fill();}}));}

// ---- Siege Tank: very broad tracks under layered skirts, stepped armour, folded outriggers, big octagonal turret, long gun ----
function siege(){const D='siege-tank/',box=2.3,N=Math.round(box*P),C=N/2,q=v=>v*P,X=v=>C+q(v),Y=X;sd=4409;
  const tl=1.56,tw=.30,ty=.48,pitch=q(.09);
  const BASE='#666a5c',BASE2='#4f5348';
  const tr=[0,1,2,3].map(f=>trackStrip(q(tl),q(tw),pitch,f,{round:.22}));tr.forEach((t,i)=>put(D+'track_'+i,t));
  const [h,c]=mk(N);
  // layered skirts: an inner fender over the track's inner half, an outer row of hinged plates on its outer third
  for(const s of [-1,1]){metal(c,rect(X(-.74),Y(s>0?ty-.17:-ty+.06),q(1.46),q(.11),2),sh(BASE2,-.05),{bevel:1.6});
    for(let i=0;i<5;i++){const x0=-.70+i*.285;metal(c,rect(X(x0),Y(s>0?ty+.075:-ty-.165),q(.27),q(.09),1.5),sh(BASE2,.02+(i%2)*.04),{bevel:1.5});
      rivets(c,X(x0+.03),Y(s*(ty+.12)),X(x0+.24),Y(s*(ty+.12)),4,.95);}
    // mud flaps at the rear corners
    metal(c,rect(X(-.80),Y(s>0?ty-.12:-ty-.14),q(.06),q(.26),1.5),'#26272a',{bevel:1});}
  const body=poly([[X(-.76),Y(-.36)],[X(.56),Y(-.37)],[X(.70),Y(-.28)],[X(.72),Y(-.12)],[X(.72),Y(.12)],[X(.70),Y(.28)],[X(.56),Y(.37)],[X(-.76),Y(.36)],[X(-.79),Y(.3)],[X(-.79),Y(-.3)]]);
  metal(c,body,BASE,{bevel:3});c.save();body(c);c.clip();
  // stepped armour: the raised fighting compartment and the engine deck, lower steps on the sides
  const mid=cham(X(-.40),Y(-.30),q(.92),q(.60),q(.08));metal(c,mid,sh(BASE,.05),{bevel:2.6});
  seam(c,X(.52),Y(-.36),X(.52),Y(.36));seam(c,X(-.42),Y(-.36),X(-.42),Y(.36));
  // engine deck: large grilles, exhaust stacks at the rear corners, a hazard-marked access plate
  grille(c,X(-.74),Y(-.26),q(.28),q(.22),9,BASE);grille(c,X(-.74),Y(.04),q(.28),q(.22),9,BASE);
  for(const s of [-1,1]){metal(c,circ(X(-.70),Y(s*.315),q(.04)),'#2b2c2d',{bevel:1.2});c.fillStyle='#0b0b0b';c.beginPath();c.arc(X(-.70),Y(s*.315),q(.024),0,7);c.fill();
    c.fillStyle='rgba(30,22,16,.6)';c.beginPath();c.ellipse(X(-.74),Y(s*.315),q(.06),q(.035),0,0,7);c.fill();}
  hazard(c,rect(X(-.44),Y(-.04),q(.03),q(.08)),2.5);
  // glacis: spare track links bolted on as extra armour, driver's hatch and periscopes, headlights
  for(let i=0;i<4;i++){const yy=-.24+i*.12;c.drawImage(tr[0],0,0,q(.09)*1.0,q(tw),X(.56),Y(yy),q(.08),q(.10));}
  hatch(c,X(.62),Y(.24),q(.055),sh(BASE,.04));for(let i=0;i<3;i++){c.fillStyle='#14232a';c.fillRect(X(.555+i*.04),Y(.14),q(.025),q(.02));}
  for(const s of [-1,1])light(c,X(.67),Y(s*.32),q(.022));
  stencil(c,'HDF',X(.30),Y(.33),10,0);stencil(c,'SIEGE 12',X(-.05),Y(-.335),7,0,'rgba(226,220,196,.6)');
  c.fillStyle=RED;c.globalAlpha=.85;c.fillRect(X(-.46),Y(-.36),q(.035),q(.72));c.globalAlpha=1;
  rivets(c,X(-.38),Y(-.33),X(.48),Y(-.33),12,1);rivets(c,X(-.38),Y(.33),X(.48),Y(.33),12,1);
  dirt(c,[X(-.8),Y(-.38),q(1.52),q(.76)],.55);scratches(c,[X(-.8),Y(-.38),q(1.52),q(.76)],260);c.restore();edgeWear(c,body,.6,2);
  put(D+'hull',h);
  // folded outrigger: a box arm with a spade, hinge at the left middle of a 0.4 x 0.12 tile sprite, arm along +x
  put(D+'leg',sprite(Math.round(q(.42)),(c,n)=>{const y=n/2;metal(c,rect(q(.01),y-q(.025),q(.30),q(.05),1.5),'#3f4340',{bevel:1.2});
    metal(c,poly([[q(.29),y-q(.065)],[q(.38),y-q(.05)],[q(.40),y],[q(.38),y+q(.05)],[q(.29),y+q(.065)]]),sh(BASE2,.05),{bevel:1.3});
    hazard(c,rect(q(.15),y-q(.025),q(.12),q(.05)),2.5);metal(c,circ(q(.03),y,q(.035)),STEEL,{bevel:1});rivet(c,q(.03),y,1.2);}));
  const tbox=2.1,TN=Math.round(tbox*P),TC=TN/2,TX=v=>TC+q(v);
  const [t,tc]=mk(TN),[b,bc]=mk(TN);
  // the gun: long, thick, a fume extractor halfway and a slotted muzzle brake
  cyl(bc,TX(.22),TX(.92),TC,q(.088),'#4b4e50');cyl(bc,TX(.48),TX(.62),TC,q(.118),'#44474a',{cap:3});band(bc,TX(.30),TC,q(.1),q(.03),'#3a3d40');
  metal(bc,rect(TX(.88),TC-q(.07),q(.11),q(.14),2),'#3e4143',{bevel:1.3});bc.fillStyle='#090909';for(let i=0;i<3;i++){bc.fillRect(TX(.895+i*.03),TC-q(.068),q(.014),q(.03));bc.fillRect(TX(.895+i*.03),TC+q(.038),q(.014),q(.03));}
  bc.fillStyle='#050505';bc.fillRect(TX(.985),TC-q(.025),q(.008),q(.05));
  hazard(bc,rect(TX(.78),TC-q(.0375),q(.04),q(.075)),2.5,1,['#b8463a','#1d1d1a']);
  const tur=octo(TX(-.02),TC,q(.33),q(.30));
  metal(tc,rect(TX(.18),TC-q(.10),q(.16),q(.20),3),sh(GUN,.08),{bevel:2});   // mantlet
  // ammunition bustle at the back, rangefinder ears either side
  metal(tc,cham(TX(-.44),TC-q(.20),q(.18),q(.40),q(.05)),sh(BASE2,.02),{bevel:2});for(let i=0;i<4;i++)seam(tc,TX(-.42),TC-q(.15)+i*q(.1),TX(-.28),TC-q(.15)+i*q(.1),.4);
  for(const s of [-1,1]){metal(tc,rect(TX(-.05),TC+q(s*.32)-q(.035),q(.14),q(.07),2),'#3a3d40',{bevel:1.2});tc.fillStyle='#14232a';tc.beginPath();tc.arc(TX(.09),TC+q(s*.32),q(.022),0,7);tc.fill();}
  metal(tc,tur,sh(BASE,.04),{bevel:3});tc.save();tur(tc);tc.clip();
  seamPath(tc,octo(TX(-.02),TC,q(.25),q(.22)),.4);
  hatch(tc,TX(-.12),TC-q(.12),q(.075),sh(BASE,.08));hatch(tc,TX(-.10),TC+q(.13),q(.06),sh(BASE,.06));
  metal(tc,circ(TX(.08),TC+q(.03),q(.04)),'#3c3f40',{bevel:1.2});grille(tc,TX(-.28),TC-q(.06),q(.07),q(.12),4,BASE,false);
  for(const s of [-1,1])metal(tc,rect(TX(.05),TC+q(s*.20)-q(.04),q(.16),q(.08),1.5),sh(GUN,.1),{bevel:1.2});
  stencil(tc,'12',TX(-.02),TC+q(.0),10,0,'rgba(226,220,196,.55)');
  dirt(tc,[TX(-.36),TC-q(.32),q(.7),q(.64)],.5);scratches(tc,[TX(-.36),TC-q(.32),q(.7),q(.64)],110);tc.restore();edgeWear(tc,tur,.55,2);
  for(let k=0;k<8;k++){const a=Math.PI/8+k*Math.PI/4+Math.PI/8;rivet(tc,TX(-.02)+Math.cos(a)*q(.29),TC+Math.sin(a)*q(.265),1.1);}
  put(D+'turret',t);put(D+'barrel',b);
  const all=sprite(N,c=>{for(const s of [-1,1])c.drawImage(tr[0],X(-tl/2),Y(s*ty-tw/2));c.drawImage(h,0,0);});put(D+'shadow',shadowOf(all,5));
  put(D+'dmg1',damage(h,1,[[X(.5),Y(.2)],[X(-.2),Y(-.3)],[X(-.6),Y(.25)],[X(.2),Y(.38)]],1.6));put(D+'dmg2',damage(h,2,[[X(.45),Y(-.2)],[X(-.5),Y(.15)],[X(.1),Y(.4)],[X(-.1),Y(-.38)],[X(.6),Y(.25)]],1.6));
  const tb=sprite(TN,c=>{c.drawImage(b,0,0);c.drawImage(t,0,0);});
  put(D+'tdmg1',damage(tb,1,[[TX(.1),TC+q(.15)],[TX(-.2),TC-q(.15)],[TX(.6),TC]],1.3));put(D+'tdmg2',damage(tb,2,[[TX(-.1),TC+q(.12)],[TX(.12),TC-q(.15)],[TX(-.35),TC]],1.3));
  put(D+'boss',sprite(N,c=>{for(const s of [-1,1]){metal(c,poly([[X(.58),Y(s*.38)],[X(.76),Y(s*.26)],[X(.78),Y(s*.30)],[X(.60),Y(s*.43)]]),sh(GUN,.1),{bevel:1.6});
      rivets(c,X(.62),Y(s*.39),X(.74),Y(s*.30),3,1);}
    hazard(c,rect(X(-.82),Y(-.22),q(.04),q(.44)),3,1,['#b8463a','#1d1d1a']);}));
  put(D+'tboss',sprite(TN,c=>{for(const s of [-1,1])metal(c,poly([[TX(.12),TC+q(s*.29)],[TX(.30),TC+q(s*.14)],[TX(.33),TC+q(s*.18)],[TX(.15),TC+q(s*.34)]]),sh(GUN,.12),{bevel:1.4});
    c.fillStyle=RED;for(let i=0;i<3;i++)c.fillRect(TX(-.40)+i*q(.05),TC-q(.03),q(.03),q(.06));
    metal(c,circ(TX(-.2),TC+q(.2),q(.03)),'#2a2c2e',{bevel:1});}));
  const wr=sprite(N,c=>{c.drawImage(all,0,0);c.save();c.translate(X(-.06),Y(.06));c.rotate(.35);c.drawImage(tb,-TC,-TC,TN,TN);c.restore();});put(D+'wreck',wreckOf(wr));
  put(D+'flash',flashSprite(96));
}

scout();rammer();flame();siege();
// a puff of smoke for exhaust, muzzle smoke, damage smoke and burning wrecks; every vehicle folder gets its own copy
sd=777;const puff=sprite(48,(c,n)=>{for(let i=0;i<9;i++){const x=n/2+rr(-6,6),y=n/2+rr(-6,6),r=rr(11,17),g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,'rgba(200,196,186,.7)');g.addColorStop(.6,'rgba(200,196,186,.35)');g.addColorStop(1,'rgba(200,196,186,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();}});
for(const d of ['scout-tank/','rammer-drone/','flame-tank/','siege-tank/'])put(d+'puff',puff);
return out;})()
