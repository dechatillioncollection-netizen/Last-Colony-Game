// how "pitched" a sound is: after the attack, the strongest narrow spectral peak against the median level around it (dB), and the
// share of energy in the 10 strongest 10-Hz bins. A struck bar or a water drop scores high; noise-built sounds score low.
const fs=require('fs');
function readWav(p){const b=fs.readFileSync(p);const n=(b.length-44)/2,o=new Float32Array(n);for(let i=0;i<n;i++)o[i]=b.readInt16LE(44+i*2)/32768;return o;}
function fft(re,im){const n=re.length;for(let i=1,j=0;i<n;i++){let bit=n>>1;for(;j&bit;bit>>=1)j^=bit;j^=bit;if(i<j){[re[i],re[j]]=[re[j],re[i]];[im[i],im[j]]=[im[j],im[i]];}}
 for(let len=2;len<=n;len<<=1){const a=-2*Math.PI/len;for(let i=0;i<n;i+=len)for(let k=0;k<len/2;k++){const c=Math.cos(a*k),s=Math.sin(a*k),xr=re[i+k+len/2]*c-im[i+k+len/2]*s,xi=re[i+k+len/2]*s+im[i+k+len/2]*c;re[i+k+len/2]=re[i+k]-xr;im[i+k+len/2]=im[i+k]-xi;re[i+k]+=xr;im[i+k]+=xi;}}}
function tonal(x){const SR=44100;let pk=0,pi=0;for(let i=0;i<x.length;i++)if(Math.abs(x[i])>pk){pk=Math.abs(x[i]);pi=i;}
 const st=pi+Math.round(.012*SR),L=8192,re=new Float64Array(L),im=new Float64Array(L);for(let i=0;i<L;i++){const v=x[st+i]||0;re[i]=v*(0.5-0.5*Math.cos(2*Math.PI*i/L));}
 fft(re,im);const mag=[];for(let k=0;k<L/2;k++)mag.push(Math.hypot(re[k],im[k]));const f2k=f=>Math.round(f*L/SR);
 let best=0,tot=0,top=[];for(let k=f2k(200);k<f2k(8000);k++){tot+=mag[k]**2;top.push(mag[k]**2);const w=[];for(let j=k-40;j<=k+40;j++)if(Math.abs(j-k)>3)w.push(mag[j]);w.sort((a,b)=>a-b);const med=w[w.length>>1]||1e-12;best=Math.max(best,20*Math.log10(mag[k]/med));}
 top.sort((a,b)=>b-a);const share=top.slice(0,10).reduce((a,b)=>a+b,0)/(tot||1);return {peakDb:+best.toFixed(1),top10:+(share*100).toFixed(1)};}
module.exports={tonal,readWav};
if(require.main===module){const [a,b]=process.argv.slice(2);const names=fs.readdirSync(b).filter(f=>f.endsWith('.wav'));const rows=[];
 for(const f of names){if(!fs.existsSync(a+'/'+f))continue;const o=tonal(readWav(a+'/'+f)),n=tonal(readWav(b+'/'+f));if(o.peakDb===n.peakDb&&o.top10===n.top10)continue;rows.push([f.replace('.wav',''),o.peakDb,n.peakDb,o.top10,n.top10]);}
 for(const r of rows)console.log(r[0].padEnd(18),'peak dB',String(r[1]).padStart(5),'->',String(r[2]).padStart(5),'  top10 %',String(r[3]).padStart(5),'->',String(r[4]).padStart(5));
 fs.writeFileSync('tonal47.json',JSON.stringify(rows));}
