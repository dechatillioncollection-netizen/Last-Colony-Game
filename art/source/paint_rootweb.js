// Paints the Rootweb textures. Runs in a headless browser; each image comes back as a PNG data URL.
// cells.png is a seamless 256x256 tile laid over the membrane in world space (about 10.7 game tiles across), so it never shows a grid.
// pulse, sheen and bud are small sprites for the light that travels through the veins, the slow wet sheen and the throbbing fungal buds.
(()=>{
let sd=2718;const rnd=()=>(sd=(sd*16807)%2147483647)/2147483647;
const mk=(w,h=w)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return [c,c.getContext('2d')];};
const out={};
const glow=(c,x,y,r,rgb,a)=>{const g=c.createRadialGradient(x,y,0,x,y,r);g.addColorStop(0,`rgba(${rgb},${a})`);g.addColorStop(1,`rgba(${rgb},0)`);c.fillStyle=g;c.beginPath();c.arc(x,y,r,0,7);c.fill();};

// ---------- cells: translucent cell walls, darker cell hearts and fungal speckle, wrapping on every side ----------
{const S=256,[cv,c]=mk(S),img=c.createImageData(S,S),D=img.data;
  const P=[];for(let k=0;k<70;k++)P.push([rnd()*S,rnd()*S,rnd()]);
  const near=(x,y)=>{let d1=1e9,d2=1e9,id=0;for(let k=0;k<P.length;k++){let dx=Math.abs(x-P[k][0]),dy=Math.abs(y-P[k][1]);if(dx>S/2)dx=S-dx;if(dy>S/2)dy=S-dy;const d=dx*dx+dy*dy;
      if(d<d1){d2=d1;d1=d;id=k;}else if(d<d2)d2=d;}return [Math.sqrt(d1),Math.sqrt(d2),id];};
  for(let y=0;y<S;y++)for(let x=0;x<S;x++){const [a,b,id]=near(x,y),edge=b-a,k=(y*S+x)*4;
    let r=0,g=0,bl=0,al=0;
    if(edge<3.2){const t=1-edge/3.2;r=150;g=92;bl=172;al=.34*t*t;}                       // soft cell walls
    else{const h=P[id][2];if(h<.35){const t=Math.max(0,1-a/16)*(1-h/.35);r=14;g=4;bl=22;al=.32*t;}  // darker cell hearts
      else if(h>.86&&a<6){r=170;g=120;bl=180;al=.22*(1-a/6);}}                                // pale fungal specks
    D[k]=r;D[k+1]=g;D[k+2]=bl;D[k+3]=al*255;}
  c.putImageData(img,0,0);
  // a few clusters of fine fungal grain, drawn wrapped so the tile stays seamless
  for(let n=0;n<14;n++){const cx=rnd()*S,cy=rnd()*S,R=6+rnd()*10;for(let k=0;k<40;k++){const a=rnd()*6.283,rr=Math.sqrt(rnd())*R,x=cx+Math.cos(a)*rr,y=cy+Math.sin(a)*rr;
    for(const [ox,oy] of [[0,0],[S,0],[-S,0],[0,S],[0,-S]]){c.fillStyle=`rgba(${rnd()<.5?'196,150,210':'40,12,52'},${.18+rnd()*.15})`;c.fillRect(((x+ox)%S+S)%S,((y+oy)%S+S)%S,1.2,1.2);}}}
  out.cells=cv.toDataURL('image/png');}

// ---------- pulse: the nutrient light; the game only lets it show through the vein mask ----------
{const [cv,c]=mk(64);glow(c,32,32,32,'200,170,255',.95);glow(c,32,32,14,'190,255,236',.8);glow(c,32,32,5,'255,255,255',.7);out.pulse=cv.toDataURL('image/png');}
// ---------- sheen: a slow, wide wet reflection ----------
{const [cv,c]=mk(128);c.save();c.translate(64,64);c.rotate(-.55);c.scale(1.6,.75);glow(c,0,0,40,'230,215,255',.55);glow(c,6,-4,14,'255,255,255',.35);c.restore();out.sheen=cv.toDataURL('image/png');}
// ---------- bud: a small fungal node that swells and relaxes ----------
{const [cv,c]=mk(32);glow(c,16,16,16,'190,140,230',.45);
  const g=c.createRadialGradient(13,12,1,16,16,9);g.addColorStop(0,'#e6c8f2');g.addColorStop(.5,'#9a5ab4');g.addColorStop(1,'#3a1446');c.fillStyle=g;c.beginPath();c.arc(16,16,8,0,7);c.fill();
  c.strokeStyle='rgba(20,4,26,.7)';c.lineWidth=1.2;c.stroke();c.fillStyle='rgba(255,255,255,.75)';c.beginPath();c.arc(13,12.5,2,0,7);c.fill();out.bud=cv.toDataURL('image/png');}
window.__out=out;})();
