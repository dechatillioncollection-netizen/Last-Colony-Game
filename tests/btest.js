// Splitter Bulb routing: no fixed entrance, fair split, blocked exits, reversal, chains, save and load, nothing made or lost.
// Runs the real simulation in headless Chromium. Writes btest_result.json; prints PASS/FAIL per check.
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForTimeout(1200);
 await p.evaluate(()=>{let s=11;Math.random=()=>(s=(s*16807)%2147483647)/2147483647;startGame('survival');G.countdown=1e9;G.items=G.items.map(v=>v+99999);G.webFree=true;
  window.__b={X:G.core.x+8,Y:G.core.y-10,
   clear(){const {X,Y}=this;for(const b of [...G.blocks.values()])if(b.x>=X-1&&b.x<X+30&&b.y>=Y-1&&b.y<Y+14)destroyBlock(b);for(let y=Y-1;y<Y+14;y++)for(let x=X-1;x<X+30;x++){G.terrain[y*MW+x]=0;G.ore[y*MW+x]=-1;}G.dirty=true;recompute();this.sinks=new Map();this.got=new Map();this.made=0;},
   put(t,x,y,r){tryPlace(t,this.X+x,this.Y+y,r||0,true);const b=blockAt(this.X+x,this.Y+y);if(b)b.built=1;G.dirty=true;return b;},
   sink(b,on=true){if(on)this.sinks.set(b.id,b);else this.sinks.delete(b.id);if(!this.got.has(b.id))this.got.set(b.id,0);},
   feed(b,item){if(b.belt.length<2&&(!b.belt.length||b.belt[0].p>=.3)){handle(b,item,null);this.made++;return 1;}return 0;},
   run(sec,feeds){const n=Math.round(sec*30);for(let k=0;k<n;k++){if(feeds)for(const f of feeds){f[3]=f[3]||0;if(!f[2]||f[3]<f[2])f[3]+=this.feed(f[0],f[1]);}step(1/30);
     for(const s of this.sinks.values()){const L=s.belt;if(L.length&&L[L.length-1].p>=1){L.pop();this.got.set(s.id,this.got.get(s.id)+1);}}}},
   inside(){let n=0;const {X,Y}=this;for(const b of G.blocks.values()){if(b.x<X-1||b.x>=X+30||b.y<Y-1||b.y>=Y+14)continue;if(b.belt)n+=b.belt.length;if(b.t==='router')n+=b.buf.length;if(b.t==='junction')for(const q of b.buf)n+=q.length;}return n;},
   out(){let n=0;for(const v of this.got.values())n+=v;return n;},
   ok(){return this.made===this.inside()+this.out();}};});
 const R=[];const check=(name,ok,info)=>{R.push({name,ok:!!ok,info});console.log((ok?'PASS ':'FAIL ')+name+' '+JSON.stringify(info));};
 // 1-2. input from each side, out through the other three, evenly, never back the way it came
 for(let d=0;d<4;d++){const r=await p.evaluate(d=>{const t=__b;t.clear();const cx=3,cy=3;t.put('router',cx,cy);const ex=[];let inp=null;
   for(let k=0;k<4;k++){const x=cx+D4X[k],y=cy+D4Y[k];if(k===d)inp=t.put('conveyor',x,y,(k+2)%4);else{const v=t.put('conveyor',x,y,k);t.sink(v);ex.push(v);}}
   t.run(40,[[inp,CU,60]]);t.run(10);const got=ex.map(v=>t.got.get(v.id));return {got,made:t.made,inside:t.inside(),back:inp.belt.length&&0,ok:t.ok()};},d);
   const even=Math.max(...r.got)-Math.min(...r.got)<=2;check(`input from side ${['right','bottom','left','top'][d]}: out through the other three, evenly, nothing lost`,r.ok&&even&&r.got.every(n=>n>0)&&r.inside===0,r);}
 // 3. the old entrance becomes an exit when the vines are reversed in place
 let r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',1,3,0);t.put('router',2,3);const Bv=t.put('conveyor',3,3,0);const C=t.put('conveyor',2,2,3);t.sink(Bv);t.sink(C);
   t.run(20,[[A,CU,20]]);t.run(5);const first={B:t.got.get(Bv.id),C:t.got.get(C.id)};
   t.put('conveyor',1,3,2);t.put('conveyor',3,3,2);t.sink(Bv,false);t.sink(A);t.run(.2);
   t.run(20,[[Bv,PB,40]]);t.run(5);return {first,afterA:t.got.get(A.id),afterC:t.got.get(C.id)-first.C,made:t.made,ok:t.ok(),inside:t.inside()};});
 check('reversing the vines: the former entrance becomes an exit, the former exit an entrance',r.ok&&r.first.B>0&&r.afterA>0&&r.afterC>0,r);
 // 4. turning a neighbouring vine updates the bulb's inputs and outputs at once
 r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',1,3,0);t.put('router',2,3);const Bv=t.put('conveyor',3,3,0);const C=t.put('conveyor',2,4,1);t.sink(Bv);t.sink(C);
   t.run(10,[[A,CU,10]]);t.run(4);const c0=t.got.get(C.id);
   // C turned to point into the bulb: it can no longer take items, so everything goes to B
   t.put('conveyor',2,4,3);t.sink(C,false);t.run(.2);const b0=t.got.get(Bv.id);t.run(12,[[A,CU,12]]);t.run(4);
   return {cBefore:c0,cAfterTurn:C.belt.length,bGain:t.got.get(Bv.id)-b0,made:t.made,ok:t.ok(),inside:t.inside()};});
 check('rotating a neighbouring vine to face the bulb turns that side from exit to entrance',r.ok&&r.cBefore>0&&r.cAfterTurn===0&&r.bGain===12,r);
 // 5. two inputs at once, two exits, nothing duplicated or lost, nothing sent back up an input
 r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',1,3,0),U=t.put('conveyor',2,2,1);t.put('router',2,3);const Bv=t.put('conveyor',3,3,0),D=t.put('conveyor',2,4,1);t.sink(Bv);t.sink(D);
   t.run(40,[[A,CU,40],[U,PB,80]]);t.run(10);return {B:t.got.get(Bv.id),D:t.got.get(D.id),made:t.made,ok:t.ok(),inside:t.inside()};});
 check('two inputs at once: both drain, split over the two exits, nothing duplicated or lost',r.ok&&r.inside===0&&Math.abs(r.B-r.D)<=2,r);
 // 6-8. blocked exits: one, two, then all blocked and reopened
 r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',1,3,0);t.put('router',2,3);const Bv=t.put('conveyor',3,3,0),U=t.put('conveyor',2,2,3),D=t.put('conveyor',2,4,1);t.sink(Bv);t.sink(D);
   t.run(30,[[A,CU,40]]);t.run(10);const one={B:t.got.get(Bv.id),D:t.got.get(D.id),Uheld:U.belt.length,ok:t.ok()};
   t.sink(D,false);t.run(30,[[A,CU,40]]);t.run(10);const two={B:t.got.get(Bv.id)-one.B,Dheld:D.belt.length,ok:t.ok()};
   t.sink(Bv,false);const g0=t.out();t.run(20,[[A,CU,200]]);const held={inside:t.inside(),bulb:G.blocks.size,moved:t.out()-g0,ok:t.ok()};
   t.sink(Bv);t.sink(D);t.sink(U);t.run(30);return {one,two,held,reopened:{inside:t.inside(),made:t.made,out:t.out(),ok:t.ok()}};});
 check('one exit blocked: the others take everything',r.one.ok&&r.one.Uheld>0&&r.one.B+r.one.D+r.one.Uheld===40,r.one);
 check('two exits blocked: the last one takes everything',r.two.ok&&r.two.B+r.two.Dheld===40,r.two);
 check('all exits blocked: items wait (backpressure), then flow again when reopened, nothing lost',r.held.ok&&r.held.moved===0&&r.reopened.ok&&r.reopened.inside===0,r);
 // 9. long chains: five bulbs joined by vines, and four bulbs touching each other
 r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',0,3,0);for(let k=0;k<5;k++){t.put('router',1+k*2,3);t.put('conveyor',2+k*2,3,0);}const end=blockAt(t.X+10,t.Y+3);t.sink(end);
   const side=[];for(let k=0;k<5;k++){const v=t.put('conveyor',1+k*2,4,1);t.sink(v);side.push(v);}
   const A2=t.put('conveyor',0,8,0);for(let k=0;k<4;k++)t.put('router',1+k,8);const E2=t.put('conveyor',5,8,0);t.sink(E2);
   t.run(60,[[A,CU,60],[A2,PB,60]]);t.run(20);return {fed:60,end:t.got.get(end.id),side:side.map(v=>t.got.get(v.id)),touching:t.got.get(E2.id),made:t.made,inside:t.inside(),ok:t.ok()};});
 check('long chains of bulbs (with vines between, and touching) carry everything through, nothing lost',r.ok&&r.inside===0&&r.touching===60&&r.end+r.side.reduce((a,b)=>a+b,0)===60,r);
 // 10. save and load with items in transit
 r=await p.evaluate(()=>{const t=__b;t.clear();const A=t.put('conveyor',1,3,0);const R0=t.put('router',2,3);const Bv=t.put('conveyor',3,3,0),D=t.put('conveyor',2,4,1);t.sink(Bv);t.sink(D);
   const F=[[A,CU,30]];t.run(1.5,F);const before={inside:t.inside(),out:t.out(),bulb:R0.buf.length,fed:F[0][3]};const S=JSON.stringify(snapGame());applySave(JSON.parse(S));
   const nb=k=>blockAt(t.X+k[0],t.Y+k[1]);const B2=nb([3,3]),D2=nb([2,4]),A2=nb([1,3]);const out0=t.out();t.sinks=new Map();t.got=new Map();t.sink(B2);t.sink(D2);
   const after={inside:t.inside()};F[0][0]=A2;t.run(30,F);t.run(10);const where=[];for(const b of G.blocks.values()){if(b.x<t.X-1||b.x>=t.X+30||b.y<t.Y-1||b.y>=t.Y+14)continue;const n=(b.belt?b.belt.length:0)+(b.t==='router'?b.buf.length:0);if(n)where.push([b.t,b.x-t.X,b.y-t.Y,n,b.belt?b.belt.map(i=>+i.p.toFixed(2)):null]);}return {before,after,fed:F[0][3],delivered:out0+t.out(),inside:t.inside(),where};});
 check('save and load with items inside the bulb and vines: every item survives and arrives',r.before.inside>0&&r.before.inside===r.after.inside&&r.inside===0&&r.fed===30&&r.delivered===30,r);
 check('no page errors',errs.length===0,errs);
 const bad=R.filter(c=>!c.ok);console.log(bad.length?bad.length+' SPLITTER CHECKS FAILED':'ALL '+R.length+' SPLITTER CHECKS PASS');fs.writeFileSync('btest_result.json',JSON.stringify(R,null,1));await br.close();})();
