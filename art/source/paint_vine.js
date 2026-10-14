// Paints the Vine, Swift Vine and Vine Knot layers. Runs in a headless browser; each image comes back as a PNG data URL.
// One tile is 96 px here (4x the game's 24 px). A straight vessel runs along +x (the flow direction) through the middle of the tile.
// Everything near the two ends of a straight piece is the same plain cross-section, and all texture repeats every 96 px along x,
// so pieces join without a seam: straight to straight, straight to curve, Vine to Swift Vine, and either one to a Vine Knot.
// Curves are the straight frames bent round a quarter circle (entering at the middle of the bottom edge, leaving at the middle
// of the right edge), so they match the straights exactly where they meet.
(()=>{
const P=96,M=48,F=16; // tile size, middle, flow frames per cycle (frame F is the quiet frame used when a vine is empty)
let sd=4242;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};
const sm=(a,b,x)=>{const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t);};
// value noise that repeats every `per` lattice cells along x, so textures tile along the vessel
const NL=[];for(let i=0;i<64*64;i++)NL.push(rnd());
const vn=(x,y,per)=>{const xi=Math.floor(x),yi=Math.floor(y),fx=x-xi,fy=y-yi,ux=fx*fx*(3-2*fx),uy=fy*fy*(3-2*fy),w=v=>((v%per)+per)%per,
  a=NL[(yi&63)*64+w(xi)],b=NL[(yi&63)*64+w(xi+1)],c=NL[((yi+1)&63)*64+w(xi)],d=NL[((yi+1)&63)*64+w(xi+1)];return a+(b-a)*ux+(c-a)*uy+(a-b-c+d)*ux*uy;};
// the vessel's radius along its length: the Swift Vine is wider and pinches back to the Vine's width at each end
// plus a gentle swelling in the middle of each tile, so a run of vine reads as living segments rather than a pipe
const RV=22,RS=26,Rof=(x,swift)=>{const env=sm(4,18,x)*sm(92,78,x);return (swift?RV+(RS-RV)*env:RV)*(1+env*(swift?.035:.06)*(.5+.5*Math.sin((x/P*2-.25)*6.283*(swift?2:1))));};
// ---------- the vessel body, per pixel: wall, translucent lumen, soft contact shadow ----------
function body(x,y,swift,lumTint){
  const R=Rof(x,swift),dy=y-M,a=Math.abs(dy),d=a/R,n1=vn(x/12,y/12,8),n2=vn(x/4,y/4+20,24);
  if(d>1){const t=(a-R)/4.2;const al=.42*Math.exp(-t*t);return [12,4,16,al];}            // soft dark contact halo, the same all round
  const nz=Math.sqrt(1-d*d),wall=sm(.6,.78,d),n3=vn(x/16+5,y/7,6);
  // mottled tissue: deep violet with darker, browner patches
  let wr=34+60*(nz*.55+n1*.3)+10*(n3-.5),wg=13+30*(nz*.55+n1*.3)-4*(n3-.5),wb=46+70*(nz*.55+n1*.3)-14*(n3-.5);
  const rimDark=.5+.5*sm(1,.85,d);wr*=rimDark;wg*=rimDark;wb*=rimDark;
  const cell=.88+.24*n2;wr*=cell;wg*=cell;wb*=cell;
  // the lumen carries sap: green in the Vine, turquoise in the Swift Vine
  const e=swift?1:0,mix=(a,b)=>a.map((v,i)=>v+(b[i]-v)*e);
  const lc=lumTint||mix([24,46,22],[16,58,60]),qa=mix([34,74,24],[44,104,96]),q=Math.pow(Math.max(0,1-d/.7),2);
  let lr=lc[0]+qa[0]*q,lg=lc[1]+qa[1]*q,lb=lc[2]+qa[2]*q;
  const ln=.92+.16*vn(x/7+30,y/7,96/7|0||1);lr*=ln;lg*=ln;lb*=ln;
  let r=lr+(wr-lr)*wall,g=lg+(wg-lg)*wall,b=lb+(wb-lb)*wall,al=(swift?.8:.76)+(.97-(swift?.8:.76))*wall;
  const sp=Math.exp(-Math.pow((d-.86)/.05,2))*(.08+.42*sm(.45,.75,vn(x/9+3,y/30,96/9|0||1)));r+=150*sp;g+=118*sp;b+=192*sp;   // wet highlight along both walls, in patches
  const ib=Math.exp(-Math.pow((d-.64)/.03,2))*.45;r+=110*ib;g+=74*ib;b+=140*ib;                      // the inner membrane edge
  if(swift){const rg=Math.exp(-Math.pow((d-.73)/.035,2))*.55*sm(10,22,x)*sm(86,74,x);r+=120*rg;g+=150*rg;b+=170*rg;}  // two longitudinal ridges
  return [r,g,b,al];}
function bodyCanvas(swift,lumTint,w=P){const [cv,c]=mk(w,P),img=c.createImageData(w,P),D=img.data;
  for(let y=0;y<P;y++)for(let x=0;x<w;x++){const [r,g,b,a]=body(x+.5,y+.5,swift,lumTint),k=(y*w+x)*4;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=a*255;}
  c.putImageData(img,0,0);return cv;}
// small branching veins along the sides, out on the ground; kept to the middle of the tile so they never meet a tile edge
function veins(c,swift){sd=swift?777:333;
  for(const [x0,side,len] of [[24,-1,14],[60,-1,11],[38,1,13],[74,1,10]]){const R=Rof(x0,swift),y0=M+side*(R-2),a=-Math.PI/2*side*-1;
    const ang=side*(Math.PI/2)+(rnd()-.5)*.9,ex=x0+Math.cos(ang)*len,ey=y0+Math.sin(ang)*len,mx=(x0+ex)/2+(rnd()-.5)*8,my=(y0+ey)/2;
    for(const [lw,col] of [[3.6,'rgba(14,5,20,.75)'],[2.2,swift?'#4a3f6a':'#4b2559'],[.8,swift?'rgba(170,240,230,.45)':'rgba(214,170,236,.4)']]){
      c.lineCap='round';c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(mx,my,ex,ey);c.stroke();
      const bx=(x0+mx)/2,by=(y0+my)/2;c.lineWidth=lw*.6;c.beginPath();c.moveTo(bx,by);c.lineTo(bx+(rnd()<.5?-1:1)*6,by+side*5);c.stroke();}}}
// the direction mark: a pale venous valve, two soft cusps closing towards the flow
function valve(c,swift){const col=swift?'rgba(188,250,238,.55)':'rgba(206,250,168,.5)';
  for(const [lw,cc] of [[4.6,'rgba(10,3,16,.35)'],[2.6,col]]){c.strokeStyle=cc;c.lineWidth=lw;c.lineCap='round';
    c.beginPath();c.moveTo(37,M-12);c.quadraticCurveTo(47,M-9,56,M-1.5);c.stroke();c.beginPath();c.moveTo(37,M+12);c.quadraticCurveTo(47,M+9,56,M+1.5);c.stroke();}}
// a few wet glints on the walls
function glints(c,swift){sd=swift?99:55;for(let k=0;k<2;k++){const x=16+rnd()*64,side=rnd()<.5?-1:1,y=M+side*Rof(x,swift)*.86;
  const g=c.createRadialGradient(x,y,0,x,y,2.6);g.addColorStop(0,'rgba(255,250,255,.45)');g.addColorStop(1,'rgba(255,250,255,0)');c.fillStyle=g;c.beginPath();c.arc(x,y,2.6,0,7);c.fill();}}
// nutrient fluid moving through the lumen: soft streaks that repeat every tile, at phase ph (0..1)
function sheen(c,swift,ph){const w=P,img=c.getImageData(0,0,w,P),D=img.data,n=swift?3:2,A=swift?.42:.26;
  for(let y=0;y<P;y++)for(let x=0;x<w;x++){const R=Rof(x+.5,swift),dy=y+.5-M,d=Math.abs(dy)/R;if(d>.66)continue;let s=0;
    for(let k=0;k<n;k++){const cx=(k/n+ph)*P,dx=(((x+.5-cx)%P)+P*1.5)%P-P/2,oy=(k%2?1:-1)*R*.18,ey=(dy-oy)/(R*.26);s+=Math.exp(-dx*dx/(swift?90:150)-ey*ey);}
    s=Math.min(1,s)*A*sm(.66,.4,d);if(s<=0)continue;const o=(y*w+x)*4,a0=D[o+3]/255;
    const e=swift?1:0,tr=196-20*e,tg=250,tb=150+86*e;
    D[o]=D[o]+(tr-D[o])*s;D[o+1]=D[o+1]+(tg-D[o+1])*s;D[o+2]=D[o+2]+(tb-D[o+2])*s;D[o+3]=Math.min(255,(a0+(1-a0)*s*.6)*255);}
  c.putImageData(img,0,0);}
// the Swift Vine's pressure chambers: small swellings on both walls that squeeze in turn
function nodes(c,ph){for(const [x,side,o] of [[30,-1,0],[30,1,.5],[66,-1,.25],[66,1,.75]]){const pump=ph<0?.35:.5+.5*Math.sin((ph*2+o)*6.283),r=4.2+1.8*pump,R=Rof(x,true),y=M+side*(R-1.2);
  c.fillStyle='rgba(10,4,16,.5)';c.beginPath();c.ellipse(x,y+side*.8,r+1.4,r*.8+1.2,0,0,7);c.fill();
  const g=c.createRadialGradient(x-1,y-1,0,x,y,r);g.addColorStop(0,`rgba(${120+70*pump|0},${200+40*pump|0},214,.92)`);g.addColorStop(.55,'rgba(64,92,118,.92)');g.addColorStop(1,'rgba(40,22,58,.96)');
  c.fillStyle=g;c.beginPath();c.ellipse(x,y,r,r*.78,0,0,7);c.fill();c.fillStyle='rgba(255,255,255,.4)';c.beginPath();c.arc(x-r*.35,y-r*.3,.9,0,7);c.fill();}}
// one straight frame: ph in 0..1 is the flow phase; ph<0 is the quiet frame
function frame(swift,ph){const [cv,c]=mk(P);veins(c,swift);c.drawImage(BODY[swift?1:0],0,0);valve(c,swift);glints(c,swift);if(ph>=0)sheen(c,swift,ph);if(swift)nodes(c,ph);return cv;}
const BODY=[bodyCanvas(false),bodyCanvas(true)];
// bends a straight 96x96 piece round the quarter circle: centre (96,96), radius 48, entry (48,96) to exit (96,48)
function bend(src){const [cv,c]=mk(P),S=src.getContext('2d').getImageData(0,0,P,P).data,img=c.createImageData(P,P),D=img.data;
  const at=(x,y,k)=>{x=Math.max(0,Math.min(P-1,x));y=Math.max(0,Math.min(P-1,y));return S[(y*P+x)*4+k];};
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){const dx=x+.5-P,dy=y+.5-P,r=Math.hypot(dx,dy);let th=Math.atan2(dy,dx);if(th>0)th-=2*Math.PI;   // -pi..-pi/2
    const u=(th+Math.PI)/(-Math.PI/2)*-1;if(u<0||u>1)continue;const sx=u*P-.5,sy=M+(M-r)-.5;if(sy<-1||sy>P)continue;
    const x0=Math.floor(sx),y0=Math.floor(sy),fx=sx-x0,fy=sy-y0,o=(y*P+x)*4;
    for(let k=0;k<4;k++){const a=at(x0,y0,k)*(1-fx)+at(x0+1,y0,k)*fx,b=at(x0,y0+1,k)*(1-fx)+at(x0+1,y0+1,k)*fx;D[o+k]=a*(1-fy)+b*fy;}}
  c.putImageData(img,0,0);return cv;}
function sheet(swift,curve){const [cv,c]=mk(P*(F+1),P);for(let k=0;k<=F;k++){const f=frame(swift,k<F?k/F:-1);c.drawImage(curve?bend(f):f,k*P,0);}return cv;}
// where a Swift Vine meets a Vine or a Vine Knot: the Vine's own tissue fading into the Swift Vine over its first third,
// laid over the Swift Vine at that end only, so the two colours flow into each other instead of meeting at a line
function joinFade(atEnd){const [cv,c]=mk(P),img=c.createImageData(P,P),D=img.data;
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){const u=atEnd?P-1-x:x,f=sm(34,2,u+.5);if(f<=0)continue;const [r,g,b,a]=body(x+.5,y+.5,false);const k=(y*P+x)*4;
    const R=Rof(x+.5,true),d=Math.abs(y+.5-M)/R;if(d>1)continue;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=a*f*sm(1,.9,d)*255;}
  c.putImageData(img,0,0);return cv;}
out.join_in=joinFade(false).toDataURL();out.join_out=joinFade(true).toDataURL();
out.join_in_curve=bend(joinFade(false)).toDataURL();out.join_out_curve=bend(joinFade(true)).toDataURL();
out.vine=sheet(false,false).toDataURL();out.vine_curve=sheet(false,true).toDataURL();
out.swift=sheet(true,false).toDataURL();out.swift_curve=sheet(true,true).toDataURL();
// ---------- the film over passing items: two faint wet streaks along the inside of the membrane ----------
{const [cv,c]=mk(P);for(const side of [-1,1]){const g=c.createLinearGradient(0,M+side*8,0,M+side*13);g.addColorStop(0,'rgba(235,220,255,0)');g.addColorStop(.6,'rgba(226,250,214,.32)');g.addColorStop(1,'rgba(235,220,255,0)');
  c.fillStyle=g;c.fillRect(0,M+side*8-(side<0?5:0),P,5);}out.film=cv.toDataURL();out.film_curve=bend(cv).toDataURL();}
// ---------- caps: a sealed, rounded end for a vessel with nothing beyond it (straight part 0..20, dome to 20+R) ----------
function cap(swift){const R=swift?RS:RV,[cv,c]=mk(P),img=c.createImageData(P,P),D=img.data;
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){const px=x+.5,py=y+.5,k=(y*P+x)*4;
    // the straight part keeps the vessel's own cross-section; past it, the same cross-section is swept round into a dome
    const [r,g,b,a]=px<=20?body(48+px,py,swift):body(68,M+Math.hypot(px-20,py-M),swift);
    D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=a*255;}
  c.putImageData(img,0,0);
  // the lumen closes: a dark pucker where the tissue folds shut
  c.strokeStyle='rgba(12,4,18,.6)';c.lineWidth=2;c.beginPath();c.arc(20,M,R*.55,-.9,.9);c.stroke();
  c.strokeStyle=swift?'rgba(180,250,236,.35)':'rgba(200,246,170,.35)';c.lineWidth=1.2;c.beginPath();c.arc(19,M,R*.55,-.7,.7);c.stroke();return cv;}
out.cap=cap(false).toDataURL();out.swift_cap=cap(true).toDataURL();
// ---------- mouth: a fleshy collar where a vessel opens into a growth; centred on the tile edge ----------
{const [cv,c]=mk(P);const cx=M,cy=M;
  c.fillStyle='rgba(10,3,16,.55)';c.beginPath();c.ellipse(cx,cy,10,30,0,0,7);c.fill();
  const g=c.createLinearGradient(cx-9,0,cx+9,0);g.addColorStop(0,'#2a1034');g.addColorStop(.45,'#6a3a7c');g.addColorStop(1,'#23102e');c.fillStyle=g;c.beginPath();c.ellipse(cx,cy,8,28,0,0,7);c.fill();
  c.fillStyle='#14061c';c.beginPath();c.ellipse(cx+1,cy,3.6,17,0,0,7);c.fill();
  c.strokeStyle='rgba(222,186,248,.55)';c.lineWidth=1.4;c.beginPath();c.ellipse(cx,cy,6.5,26,0,Math.PI*.6,Math.PI*1.4);c.stroke();
  for(let k=0;k<7;k++){const a=-1.3+k*.43;c.strokeStyle='rgba(12,4,18,.5)';c.lineWidth=1;c.beginPath();c.moveTo(cx+Math.cos(a)*4,cy+Math.sin(a)*15);c.lineTo(cx+Math.cos(a)*8,cy+Math.sin(a)*28);c.stroke();}
  out.mouth=cv.toDataURL();}
// ---------- item bulge: the membrane stretched round a passing item, a pale backdrop that keeps dark resources readable ----------
{const [cv,c]=mk(48);const g=c.createRadialGradient(24,24,0,24,24,24);g.addColorStop(0,'rgba(228,244,214,.55)');g.addColorStop(.5,'rgba(186,220,170,.3)');g.addColorStop(.78,'rgba(100,130,90,.16)');g.addColorStop(.9,'rgba(14,5,20,.28)');g.addColorStop(1,'rgba(14,5,20,0)');
  c.fillStyle=g;c.beginPath();c.arc(24,24,24,0,7);c.fill();out.bulge=cv.toDataURL();}
// ---------- pulse: a faint nutrient light travelling down the vessel ----------
{const [cv,c]=mk(64,32);c.save();c.translate(32,16);c.scale(1,.42);const g=c.createRadialGradient(0,0,0,0,0,30);g.addColorStop(0,'rgba(230,255,248,.9)');g.addColorStop(.35,'rgba(150,240,226,.55)');g.addColorStop(1,'rgba(150,120,240,0)');c.fillStyle=g;c.beginPath();c.arc(0,0,30,0,7);c.fill();c.restore();out.pulse=cv.toDataURL();}
// ---------- Vine Knot: a swollen junction where one vessel passes over the other ----------
const KR=(t,mid)=>RV+(mid-RV)*sm(.06,.3,t)*sm(.94,.7,t);
// a vessel along x with radius varying along it, for the knot's two passages
function passage(lum,mid,raised){const [cv,c]=mk(P),img=c.createImageData(P,P),D=img.data;
  for(let y=0;y<P;y++)for(let x=0;x<P;x++){const R=KR((x+.5)/P,mid),py=M+(y+.5-M)*RV/R;if(Math.abs(y+.5-M)>R+9)continue;
    const e0=sm(.06,.3,(x+.5)/P)*sm(.94,.7,(x+.5)/P),lt=[24,46,22].map((v,i)=>v+(lum[i]-v)*e0);   // the Vine's own colours at both ends
    let [r,g,b,a]=body(x+.5,py,false,lt);if(Math.abs(y+.5-M)>R){a*=1-(raised?.25:.2)*e0;}
    if(raised){const d=Math.abs(y+.5-M)/R,e=sm(.06,.3,(x+.5)/P)*sm(.94,.7,(x+.5)/P);if(d<=1){r*=1+.12*e;g*=1+.12*e;b*=1+.14*e;if(d<.66)a*=1-.4*e;}}   // the raised passage is lit a little brighter, and its lumen is see-through
    const k=(y*P+x)*4;D[k]=r;D[k+1]=g;D[k+2]=b;D[k+3]=Math.min(255,a*255);}
  c.putImageData(img,0,0);return cv;}
{const [cv,c]=mk(P);sd=909;
  // supporting roots out to the four corners
  for(let q=0;q<4;q++){const a=Math.PI/4+q*Math.PI/2+(rnd()-.5)*.25,len=44+rnd()*6;
    for(const [lw,col] of [[9,'rgba(10,3,16,.6)'],[6,'#3b1a48'],[1.4,'rgba(206,160,232,.35)']]){c.lineCap='round';c.strokeStyle=col;c.lineWidth=lw;c.beginPath();c.moveTo(M,M);
      c.quadraticCurveTo(M+Math.cos(a+.25)*len*.55,M+Math.sin(a+.25)*len*.55,M+Math.cos(a)*len,M+Math.sin(a)*len);c.stroke();}
    for(const s of [-1,1]){const b=a+s*.55,l2=14+rnd()*6,x0=M+Math.cos(a)*24,y0=M+Math.sin(a)*24;c.strokeStyle='#341640';c.lineWidth=2.6;c.beginPath();c.moveTo(x0,y0);c.lineTo(x0+Math.cos(b)*l2,y0+Math.sin(b)*l2);c.stroke();}}
  // the swollen membrane round the crossing
  const halo=c.createRadialGradient(M,M,30,M,M,47);halo.addColorStop(0,'rgba(10,3,16,.5)');halo.addColorStop(1,'rgba(10,3,16,0)');c.fillStyle=halo;c.beginPath();c.arc(M,M,47,0,7);c.fill();
  c.beginPath();for(let i=0;i<=40;i++){const a=i/40*6.283,rr=42*(1+.05*Math.sin(a*3+1)+.035*Math.sin(a*5));i?c.lineTo(M+Math.cos(a)*rr,M+Math.sin(a)*rr):c.moveTo(M+Math.cos(a)*rr,M+Math.sin(a)*rr);}c.closePath();
  const bg=c.createRadialGradient(M-10,M-12,4,M,M,44);bg.addColorStop(0,'rgba(214,160,226,.97)');bg.addColorStop(.45,'rgba(138,78,156,.97)');bg.addColorStop(1,'rgba(58,22,72,.98)');c.fillStyle=bg;c.fill();c.strokeStyle='rgba(10,3,16,.7)';c.lineWidth=2.4;c.stroke();
  c.save();c.clip();for(let k=0;k<260;k++){const a=rnd()*6.283,rr=Math.sqrt(rnd())*42;c.fillStyle=rnd()<.5?'rgba(0,0,0,.12)':'rgba(230,190,255,.08)';c.fillRect(M+Math.cos(a)*rr,M+Math.sin(a)*rr,1.6,1.6);}c.restore();
  c.strokeStyle='rgba(246,214,255,.6)';c.lineWidth=2;c.beginPath();c.arc(M,M,39,Math.PI*1.02,Math.PI*1.62);c.stroke();c.beginPath();c.arc(M,M,39,Math.PI*.05,Math.PI*.35);c.stroke();
  // the lower passage, running left to right, with a lavender lumen
  c.drawImage(passage([18,40,18],14.5,false),0,0);
  // and the membrane closes over it: a translucent veil, so the passage reads as running inside the swelling
  c.save();c.beginPath();for(let i=0;i<=40;i++){const a=i/40*6.283,rr=42*(1+.05*Math.sin(a*3+1)+.035*Math.sin(a*5));i?c.lineTo(M+Math.cos(a)*rr,M+Math.sin(a)*rr):c.moveTo(M+Math.cos(a)*rr,M+Math.sin(a)*rr);}c.closePath();
  const vg=c.createRadialGradient(M-10,M-12,4,M,M,44);vg.addColorStop(0,'rgba(214,160,226,.2)');vg.addColorStop(.6,'rgba(138,78,156,.18)');vg.addColorStop(1,'rgba(58,22,72,.45)');c.fillStyle=vg;c.fill();
  c.strokeStyle='rgba(246,214,255,.6)';c.lineWidth=2;c.beginPath();c.arc(M,M,39,Math.PI*1.02,Math.PI*1.62);c.stroke();c.restore();
  out.knot_base=cv.toDataURL();}
{// the raised passage, running top to bottom, with a turquoise lumen; it casts a soft shadow across the lower one
  const [cv,c]=mk(P);c.save();c.translate(P,0);c.rotate(Math.PI/2);
  // (rotated: +y here is towards the left of the tile, so the shadow falls down and to the right)
  const sh=c.createRadialGradient(0,0,10,0,0,27);sh.addColorStop(0,'rgba(6,2,10,.62)');sh.addColorStop(1,'rgba(6,2,10,0)');
  c.save();c.translate(M+3,M-5);c.scale(1.35,.8);c.fillStyle=sh;c.beginPath();c.arc(0,0,27,0,7);c.fill();c.restore();
  c.drawImage(passage([28,70,40],15.5,true),0,0);
  // collars where it lifts off the membrane
  for(const x of [20,76]){c.strokeStyle='rgba(12,4,18,.5)';c.lineWidth=2.6;c.beginPath();c.ellipse(x,M,2.8,19,0,0,7);c.stroke();c.strokeStyle='rgba(206,250,190,.42)';c.lineWidth=1.1;c.beginPath();c.ellipse(x-1,M,2.1,17.5,0,Math.PI*.6,Math.PI*1.4);c.stroke();}
  c.restore();out.knot_bridge=cv.toDataURL();}
// glows that show which passage is carrying something
for(const [k,rgb,vert] of [['knot_glow_h','190,250,140',false],['knot_glow_v','170,255,200',true]]){const [cv,c]=mk(P);c.save();if(vert){c.translate(P,0);c.rotate(Math.PI/2);}
  const g=c.createLinearGradient(0,M-14,0,M+14);g.addColorStop(0,`rgba(${rgb},0)`);g.addColorStop(.5,`rgba(${rgb},.55)`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.fillRect(4,M-14,P-8,28);c.restore();out[k]=cv.toDataURL();}
return out;})()
