// Paints the title screen (art/title/): a night view straight down on a dark marsh on Nereth. A dormant Bloom (the game's own painted
// Bloom, drawn large) rests in a still pool among lily pads; Rootweb conduits creep out from it across wet ground; at the far top right
// a survey track, a parked Scout Tank with its lamps on and a line of survey stakes are the only sign of people.
// Runs inside the game page, because it draws the Bloom, the Seed Pods and the Scout Tank with the game's own art (run it with
// node art/source/runtitle.js, which serves nothing itself: start a web server on the repo root first).
// Outputs: bg (2560×1440, saved as JPEG): the whole scene, graded to night
//          glow (1280×720): only what gives off light (conduits, beads, the Bloom's heart, pods), blurred, for pulses on top
//          meta: positions the title screen animates (the Bloom's centre, the conduit beads, the survey lamps and tank lamps)
(()=>{
const W=2560,H=1440;let sd=4405;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;const rr=(a,b)=>a+(b-a)*rnd();
const mk=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const NL=[];for(let i=0;i<64*64;i++)NL.push(rnd());
const vn=(x,y)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),
  a=NL[(yi&63)*64+(xi&63)],b=NL[(yi&63)*64+((xi+1)&63)],c=NL[((yi+1)&63)*64+(xi&63)],d=NL[((yi+1)&63)*64+((xi+1)&63)];return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
const fbm=(x,y)=>vn(x,y)*.5+vn(x*2.1+7,y*2.1+3)*.27+vn(x*4.3+1,y*4.3+9)*.15+vn(x*8.7,y*8.7)*.08;
const BX=1280,BY=835;                       // the Bloom's centre
const meta={W,H,bloom:[BX,BY],beads:[],lamps:[],tank:null,pool:null};
const [cv,c]=mk(W,H),[gv,g]=mk(W,H);       // the scene, and the light it gives off
// ---------- 1. wet ground: dark loam, damp patches, grit ----------
{const [nv,n]=mk(W/4,H/4),img=n.createImageData(W/4,H/4),D=img.data;
 for(let y=0;y<H/4;y++)for(let x=0;x<W/4;x++){const v=fbm(x/38,y/38),m=fbm(x/11+40,y/11+20),k=(y*W/4+x)*4,wet=Math.max(0,(fbm(x/60+9,y/60+4)-.5)*2.4);
   D[k]=44+v*30-wet*12+m*9;D[k+1]=39+v*25-wet*8+m*8;D[k+2]=33+v*18-wet*2+m*6;D[k+3]=255;}
 n.putImageData(img,0,0);c.imageSmoothingEnabled=true;c.drawImage(nv,0,0,W,H);
 // grit and small stones
 for(let i=0;i<5200;i++){const x=rr(0,W),y=rr(0,H),r=rr(.6,2.4);c.fillStyle=`rgba(${rnd()<.5?'90,82,70':'12,10,9'},${rr(.15,.45)})`;c.beginPath();c.arc(x,y,r,0,7);c.fill();}
 for(let i=0;i<140;i++){const x=rr(0,W),y=rr(0,H),r=rr(4,13);const s=c.createRadialGradient(x-r*.3,y-r*.3,1,x,y,r);s.addColorStop(0,'#6b6458');s.addColorStop(1,'#26221d');
   c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(x+r*.35,y+r*.4,r,r*.8,0,0,7);c.fill();c.fillStyle=s;c.beginPath();c.ellipse(x,y,r,r*.8,rr(0,3),0,7);c.fill();}
 // low moss and reeds near the water
 for(let i=0;i<1800;i++){const a=rr(0,7),d=rr(260,1150)*(.7+.3*rnd()),x=BX+Math.cos(a)*d*1.5,y=BY+Math.sin(a)*d*.9;if(x<0||y<0||x>W||y>H)continue;
   c.strokeStyle=`rgba(${rr(40,70)|0},${rr(58,84)|0},${rr(38,52)|0},${rr(.25,.6)})`;c.lineWidth=rr(.8,1.8);const l=rr(5,15),t=rr(0,7);c.beginPath();c.moveTo(x,y);c.quadraticCurveTo(x+Math.cos(t)*l*.5+2,y+Math.sin(t)*l*.5,x+Math.cos(t)*l,y+Math.sin(t)*l);c.stroke();}}
// ---------- 2. water: the Bloom's pool and smaller pools, with stars reflected ----------
const blob=(x,y,rx,ry,seed,amp=.22)=>{const P=[];for(let i=0;i<72;i++){const a=i/72*Math.PI*2,k=1+amp*(fbm(Math.cos(a)*1.4+seed,Math.sin(a)*1.4+seed)-.5)*2;P.push([x+Math.cos(a)*rx*k,y+Math.sin(a)*ry*k]);}return P;};
const path=(cx,P)=>{cx.beginPath();P.forEach(([x,y],i)=>i?cx.lineTo(x,y):cx.moveTo(x,y));cx.closePath();};
const pools=[[BX,BY+10,520,330,3,.18],[380,1180,300,170,11],[2230,1130,260,150,17],[520,330,210,120,23],[1880,560,150,90,29],[880,1330,180,80,31]];
for(const [x,y,rx,ry,s,amp] of pools){const P=blob(x,y,rx,ry,s,amp);
  // a muddy rim, then the water
  c.save();path(c,P);c.lineWidth=26;c.strokeStyle='rgba(18,14,11,.55)';c.stroke();c.lineWidth=10;c.strokeStyle='rgba(58,50,40,.45)';c.stroke();
  path(c,P);c.clip();const w=c.createRadialGradient(x-rx*.2,y-ry*.3,10,x,y,Math.max(rx,ry)*1.1);w.addColorStop(0,'#16202c');w.addColorStop(.6,'#0b1119');w.addColorStop(1,'#06090e');c.fillStyle=w;c.fillRect(x-rx*2,y-ry*2,rx*4,ry*4);
  // stars of the night sky on the water
  for(let i=0;i<rx*ry/900;i++){const sx=x+rr(-rx,rx)*1.2,sy=y+rr(-ry,ry)*1.2,b=rnd();c.fillStyle=`rgba(${b<.15?'255,226,190':b<.3?'190,214,255':'230,236,255'},${rr(.4,1)})`;c.beginPath();c.arc(sx,sy,b<.06?2.4:rr(.8,1.5),0,7);c.fill();
    if(b<.04){g.fillStyle='rgba(200,220,255,.5)';g.beginPath();g.arc(sx,sy,3,0,7);g.fill();}}
  // a faint band of the galaxy across the big pool
  if(s===3){c.save();c.translate(x,y);c.rotate(-.42);const m=c.createLinearGradient(0,-90,0,90);m.addColorStop(0,'rgba(120,130,170,0)');m.addColorStop(.5,'rgba(120,130,170,.13)');m.addColorStop(1,'rgba(120,130,170,0)');c.fillStyle=m;c.fillRect(-rx*1.5,-90,rx*3,180);
    for(let i=0;i<500;i++){c.fillStyle=`rgba(220,228,255,${rr(.15,.6)})`;c.fillRect(rr(-rx*1.4,rx*1.4),rr(-70,70)*rnd(),1,1);}c.restore();meta.pool=[x,y,rx,ry];}
  // ripples and a wet sheen at the edge
  c.strokeStyle='rgba(150,170,200,.07)';c.lineWidth=1.2;for(let i=0;i<4;i++){c.beginPath();c.ellipse(x+rr(-rx,rx)*.5,y+rr(-ry,ry)*.5,rr(30,90),rr(12,36),0,0,7);c.stroke();}
  c.restore();path(c,P);c.lineWidth=2;c.strokeStyle='rgba(140,160,190,.18)';c.stroke();}
// ---------- 3. lily pads on the water ----------
const pad=(x,y,r,a)=>{c.save();c.translate(x,y);c.rotate(a);c.fillStyle='rgba(0,0,0,.35)';c.beginPath();c.ellipse(4,6,r,r*.96,0,0,7);c.fill();
  const p=c.createRadialGradient(-r*.3,-r*.3,2,0,0,r);p.addColorStop(0,'#3f6b4c');p.addColorStop(.7,'#284a36');p.addColorStop(1,'#1c3527');c.fillStyle=p;
  c.beginPath();c.moveTo(0,0);c.arc(0,0,r,.18,Math.PI*2-.18);c.closePath();c.fill();c.strokeStyle='rgba(120,170,130,.25)';c.lineWidth=1.2;
  for(let i=0;i<9;i++){const t=.35+i/9*(Math.PI*2-.7);c.beginPath();c.moveTo(0,0);c.lineTo(Math.cos(t)*r*.92,Math.sin(t)*r*.92);c.stroke();}
  c.strokeStyle='rgba(30,50,36,.8)';c.lineWidth=2;c.beginPath();c.arc(0,0,r,.18,Math.PI*2-.18);c.stroke();c.restore();};
for(let i=0;i<16;i++){const a=rr(0,7),d=rr(250,470),x=BX+Math.cos(a)*d,y=BY+10+Math.sin(a)*d*.62;pad(x,y,rr(26,58),rr(0,7));}
for(const [x,y,rx,ry] of pools.slice(1))for(let i=0;i<3;i++)pad(x+rr(-rx,rx)*.5,y+rr(-ry,ry)*.5,rr(14,30),rr(0,7));
// ---------- 4. Rootweb: living ground spreading from the Bloom ----------
{const [tv,t]=mk(W,H);
 const R=ART.plant.rootweb,src=R&&R.img&&R.img[0]||null;
 if(src){const pt=t.createPattern(src,'repeat');t.save();t.scale(1.6,1.6);t.fillStyle=pt;t.fillRect(0,0,W,H);t.restore();}
 else{t.strokeStyle='rgba(150,90,170,.5)';t.lineWidth=1.4;for(let i=0;i<2600;i++){const x=rr(0,W),y=rr(0,H);t.beginPath();t.moveTo(x,y);t.lineTo(x+rr(-30,30),y+rr(-30,30));t.stroke();}}
 // keep it to a ragged patch round the Bloom
 t.globalCompositeOperation='destination-in';const [mv,m]=mk(W/8,H/8),mi=m.createImageData(W/8,H/8),MD=mi.data;
 for(let y=0;y<H/8;y++)for(let x=0;x<W/8;x++){const dx=(x*8-BX)/1.45,dy=y*8-BY,d=Math.hypot(dx,dy)/760+(fbm(x/7+3,y/7+8)-.5)*.75,k=(y*W/8+x)*4;MD[k+3]=255*Math.max(0,Math.min(1,(1-d)*2.2));}
 m.putImageData(mi,0,0);t.drawImage(mv,0,0,W,H);
 c.save();c.globalAlpha=.55;c.globalCompositeOperation='screen';c.drawImage(tv,0,0);c.restore();
 // a violet stain under it
 const st=c.createRadialGradient(BX,BY,100,BX,BY,900);st.addColorStop(0,'rgba(70,30,80,.32)');st.addColorStop(1,'rgba(70,30,80,0)');c.save();c.scale(1.45,1);c.fillStyle=st;c.fillRect(0,0,W,H);c.restore();}
// ---------- 5. root conduits: branching, tapering, with light beads ----------
const roots=[];
const grow=(x,y,a,len,w,depth)=>{const pts=[[x,y,w]];let ang=a;const step=12,n=len/step|0;
  for(let i=0;i<n;i++){ang+=(vn(x/90+depth*7,y/90)-.5)*.22+(rnd()-.5)*.06;x+=Math.cos(ang)*step;y+=Math.sin(ang)*step*.82;const k=1-i/n;pts.push([x,y,Math.max(1.2,w*(.25+.75*k))]);
    if(depth<2&&i>8&&rnd()<(depth?.02:.035))grow(x,y,ang+(rnd()<.5?-1:1)*rr(.45,1.05),len*(1-i/n)*rr(.45,.7),w*k*.6,depth+1);}
  roots.push({pts,depth});};
for(let i=0;i<9;i++){const a=i/9*Math.PI*2+rr(-.2,.2)+.3,r0=215;grow(BX+Math.cos(a)*r0,BY+Math.sin(a)*r0*.8,a,rr(620,1250)*(Math.abs(Math.sin(a))<.5?1.15:.8),rr(18,26),0);}
const stroke=(cx,P,w,col)=>{cx.strokeStyle=col;cx.lineCap='round';cx.lineJoin='round';for(let i=1;i<P.length;i++){cx.lineWidth=P[i][2]*w;cx.beginPath();cx.moveTo(P[i-1][0],P[i-1][1]);cx.lineTo(P[i][0],P[i][1]);cx.stroke();}};
roots.sort((a,b)=>b.depth-a.depth);
for(const R of roots){const P=R.pts;c.save();c.translate(5,7);stroke(c,P,1.25,'rgba(0,0,0,.4)');c.restore();
  stroke(c,P,1,'#26142c');stroke(c,P,.72,'#3d2348');stroke(c,P,.38,'#5a3a6c');
  // the wet sheen and the sap channel inside
  c.save();c.translate(-P[0][2]*.12,-P[0][2]*.12);stroke(c,P,.12,'rgba(200,170,220,.35)');c.restore();
  stroke(g,P,.16,'rgba(110,210,220,.55)');
  for(let i=4;i<P.length;i+=rr(9,16)|0){const [x,y,w]=P[i];const r=Math.max(2,w*.32);c.fillStyle='#8fd8e0';c.beginPath();c.arc(x,y,r,0,7);c.fill();
    g.fillStyle='rgba(140,230,240,.9)';g.beginPath();g.arc(x,y,r*2.2,0,7);g.fill();meta.beads.push([Math.round(x),Math.round(y),+(r.toFixed(1)),+(Math.hypot(x-BX,y-BY).toFixed(0))]);}
  // fine hair roots
  c.strokeStyle='rgba(120,80,140,.35)';c.lineWidth=1;for(let i=3;i<P.length;i+=5){const [x,y,w]=P[i];const t=rr(0,7),l=w*rr(.8,2.2);c.beginPath();c.moveTo(x,y);c.lineTo(x+Math.cos(t)*l,y+Math.sin(t)*l);c.stroke();}}
// ---------- 6. Seed Pods along the conduits, and the Bloom ----------
const T0=window.T||24;
const drawOrgan=(t,x,y,size,time,cx=c)=>{const b={t,x:0,y:0,team:0,hp:100,max:100,rot:0,id:7,built:1};const S=B[t].size;cx.save();cx.translate(x,y);const k=size/(S*T0);cx.scale(k,k);cx.translate(-S*T0/2,-S*T0/2);
  try{drawArtUnder(cx,b,time);drawArt(cx,t,0,0,0,b,time,0);}catch(e){}cx.restore();};
const hide=(src)=>{g.save();g.globalCompositeOperation='destination-out';g.drawImage(src,0,0);g.restore();};
for(const [a,d,s] of [[-2.5,560,120],[.55,600,104],[2.2,520,96],[-.75,700,88]]){const x=BX+Math.cos(a)*d*1.3,y=BY+Math.sin(a)*d*.75;{const [ov,o]=mk(W,H);drawOrgan('nest',x,y,s,a*3,o);c.drawImage(ov,0,0);hide(ov);}
  const gl=g.createRadialGradient(x,y,0,x,y,s*.5);gl.addColorStop(0,'rgba(150,240,180,.55)');gl.addColorStop(1,'rgba(150,240,180,0)');g.fillStyle=gl;g.fillRect(x-s,y-s,s*2,s*2);}
// the Bloom: its reflection in the pool first, then the Bloom itself, closed a little for the night
{c.save();c.globalAlpha=.18;c.translate(BX+30,BY+60);c.scale(1,-.6);c.translate(-BX,-BY);drawOrgan('core',BX,BY,470,2.6);c.restore();
 const sh=c.createRadialGradient(BX+16,BY+22,60,BX+16,BY+22,300);sh.addColorStop(0,'rgba(0,0,0,.55)');sh.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=sh;c.fillRect(BX-400,BY-400,800,800);
 const [ov,o]=mk(W,H);drawOrgan('core',BX,BY,470,2.6,o);c.drawImage(ov,0,0);hide(ov);
 const hg=g.createRadialGradient(BX,BY,0,BX,BY,150);hg.addColorStop(0,'rgba(180,255,190,.6)');hg.addColorStop(.45,'rgba(120,220,160,.22)');hg.addColorStop(1,'rgba(120,220,160,0)');g.fillStyle=hg;g.fillRect(BX-200,BY-200,400,400);
 const pg=g.createRadialGradient(BX,BY,80,BX,BY,250);pg.addColorStop(0,'rgba(190,120,230,.0)');pg.addColorStop(.6,'rgba(190,120,230,.28)');pg.addColorStop(1,'rgba(190,120,230,0)');g.fillStyle=pg;g.fillRect(BX-300,BY-300,600,600);}
// ---------- 7. people: a survey track, stakes and a parked Scout Tank at the top right ----------
{const A=[1760,-60],Bp=[2660,560],ang=Math.atan2(Bp[1]-A[1],Bp[0]-A[0]),L=Math.hypot(Bp[0]-A[0],Bp[1]-A[1]),nx=-Math.sin(ang),ny=Math.cos(ang);
 for(const off of [-22,22]){c.strokeStyle='rgba(12,10,8,.55)';c.lineWidth=13;c.beginPath();c.moveTo(A[0]+nx*off,A[1]+ny*off);c.lineTo(Bp[0]+nx*off,Bp[1]+ny*off);c.stroke();
   c.strokeStyle='rgba(80,72,60,.25)';c.lineWidth=2;for(let s=0;s<L;s+=9){const x=A[0]+Math.cos(ang)*s+nx*off,y=A[1]+Math.sin(ang)*s+ny*off;c.beginPath();c.moveTo(x-nx*5,y-ny*5);c.lineTo(x+nx*5,y+ny*5);c.stroke();}}
 // survey stakes along the track, each with a small amber lamp
 for(let s=120;s<L;s+=210){const x=A[0]+Math.cos(ang)*s-nx*70,y=A[1]+Math.sin(ang)*s-ny*70;c.fillStyle='rgba(0,0,0,.5)';c.fillRect(x+2,y+3,7,7);c.fillStyle='#4a4f52';c.fillRect(x-3,y-3,7,7);
   c.fillStyle='#b8463a';c.fillRect(x-3,y-3,7,2);meta.lamps.push([Math.round(x),Math.round(y)]);}
 // the tank, stopped on the track, lamps toward the marsh
 const tx=A[0]+Math.cos(ang)*L*.42,ty=A[1]+Math.sin(ang)*L*.42,ta=Math.atan2(BY-ty,BX-tx);meta.tank=[Math.round(tx),Math.round(ty),+ta.toFixed(3)];
 for(const s of [-1,1]){const lx=tx+Math.cos(ta)*38+Math.cos(ta+Math.PI/2)*s*15,ly=ty+Math.sin(ta)*38+Math.sin(ta+Math.PI/2)*s*15;
   c.save();c.translate(lx,ly);c.rotate(ta);const cg=c.createRadialGradient(0,0,4,0,0,560);cg.addColorStop(0,'rgba(255,236,190,.34)');cg.addColorStop(1,'rgba(255,236,190,0)');c.fillStyle=cg;
   c.beginPath();c.moveTo(0,0);c.lineTo(560,-140);c.lineTo(560,140);c.closePath();c.fill();c.restore();}
 try{const e={t:'dagger',x:0,y:0,ang:ta,hp:100,max:100,id:99,boss:false,hit:0};const st=vehS(e);st.ha=st.ta=ta;c.save();c.translate(tx,ty);c.scale(3.4,3.4);meta.tankDrawn=vehDraw(c,e,0);c.restore();}catch(err){meta.tankErr=String(err);}}
// ---------- 8. night: cool the colours, darken the edges, add back what glows ----------
c.save();c.globalCompositeOperation='multiply';c.fillStyle='#6f7a98';c.fillRect(0,0,W,H);
const vg=c.createRadialGradient(BX,BY-60,250,BX,BY-60,1500);vg.addColorStop(0,'#ffffff');vg.addColorStop(.55,'#c8c8d0');vg.addColorStop(1,'#30303a');c.fillStyle=vg;c.fillRect(0,0,W,H);c.restore();
// a little of the Bloom's own colour back, so it reads as the living heart of the picture
c.save();c.globalCompositeOperation='soft-light';const lb=c.createRadialGradient(BX,BY,40,BX,BY,330);lb.addColorStop(0,'rgba(255,255,255,.5)');lb.addColorStop(1,'rgba(255,255,255,0)');c.fillStyle=lb;c.fillRect(BX-400,BY-400,800,800);c.restore();
const [hv,h]=mk(W/2,H/2);h.filter='blur(6px)';h.drawImage(gv,0,0,W/2,H/2);h.filter='none';const [hv2,h2]=mk(W/2,H/2);h2.filter='blur(2px)';h2.drawImage(gv,0,0,W/2,H/2);h2.filter='none';h.globalCompositeOperation='lighter';h.drawImage(hv2,0,0);
c.save();c.globalCompositeOperation='lighter';c.globalAlpha=.42;c.drawImage(hv,0,0,W,H);c.restore();
return {'bg.jpg':cv.toDataURL('image/jpeg',.9),'glow.png':hv.toDataURL('image/png'),'meta.json':JSON.stringify(meta)};
})()
