// renders each campaign sector's full HD ground with landmarks labelled, plus a sanity report
const {chromium}=require(process.env.PW||'playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html',IDS=(process.env.IDS||'landfall,ember,kilo,frost,last').split(',');
(async()=>{const br=await chromium.launch();const p=await br.newPage({viewport:{width:1280,height:800}});const errs=[];p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error')errs.push(m.text());});
 await p.goto(URL);await p.waitForTimeout(1500);await p.click('#m-campaign');await p.waitForTimeout(500);
 const rep={};
 for(const id of IDS){
  const r=await p.evaluate(async id=>{startMission(id);await new Promise(r=>setTimeout(r,300));skipDlg();await new Promise(r=>setTimeout(r,300));skipDlg();
    const m=MIS[id],sc=id==='last'?7:10,cv=document.createElement('canvas');cv.width=MW*sc;cv.height=MH*sc;const c=cv.getContext('2d');c.imageSmoothingEnabled=true;pgBlit(c,0,0,MW*T,MH*T,0,0,cv.width,cv.height);
    // the Bloom's starting Rootweb
    c.fillStyle='rgba(180,90,230,.35)';for(let i=0;i<N;i++)if(G.web[i])c.fillRect((i%MW)*sc,((i/MW)|0)*sc,sc,sc);
    c.strokeStyle='rgba(220,150,255,.9)';c.setLineDash([6,5]);c.lineWidth=2;c.beginPath();c.arc((G.core.x+1.5)*sc,(G.core.y+1.5)*sc,webRadius(G.core)*sc,0,7);c.stroke();c.setLineDash([]);
    const lab=(t,x,y,col)=>{c.font='bold 13px sans-serif';c.textAlign='center';const w=c.measureText(t).width+8;c.fillStyle='rgba(10,10,14,.75)';c.fillRect(x*sc-w/2,y*sc-9,w,17);c.fillStyle=col||'#fff';c.fillText(t,x*sc,y*sc+4);};
    for(const b of G.blocks.values())if(b.team===1){c.fillStyle=b.t==='core'?'#ff4030':B[b.t].belt?'rgba(255,140,90,.8)':'rgba(255,90,70,.9)';c.fillRect(b.x*sc,b.y*sc,b.size*sc,b.size*sc);}
    const IN=['Copper','Lead','Sand','Coal','Titanium'];const all=m.mirror?G.veins.concat(G.veins.map(([x,y,it])=>[MW-x,y,it])):G.veins;
    for(const [x,y,it] of all)lab(IN[it],x,y+3.6,'#ffe08a');
    lab('BLOOM',G.core.x+1.5,G.core.y-1.2,'#b6f07a');lab(m.kind==='attack'?'HDF CORE':'HDF ENTRY',G.spawn.x,G.spawn.y-2.5,'#ff8a70');
    const names={lab:'Containment lab',depot:'Ember Depot',command:'HDF Command',shelter:'Shelter',artillery:'Artillery',barricade:'Barricade',truck:'Survey truck',tripod:'Survey point',rig:'Abandoned rig',excavator:'Abandoned excavator',tower:'Water tower',pad:'Landing pad',mast:'Mast'};
    const seenK={};for(const o of mapDecor())if(o[0]==='prop'&&names[o[1]]&&(!seenK[o[1]]||o[1]==='shelter')){seenK[o[1]]=1;lab(names[o[1]],o[2]+(o[4]||1)/2,o[3]-.8,'#9fd0ff');}
    if(m.patrol){c.strokeStyle='rgba(255,170,60,.9)';c.lineWidth=2;c.setLineDash([3,4]);c.beginPath();m.patrol.forEach(([x,y],k)=>k?c.lineTo((x+.5)*sc,(y+.5)*sc):c.moveTo((x+.5)*sc,(y+.5)*sc));c.stroke();c.setLineDash([]);lab('Patrol track',m.patrol[1][0],m.patrol[1][1]-2,'#ffb060');}
    if(m.pass)lab('Kilo pass',m.pass[0],m.pass[1]-3,'#ffd27a');
    // checks: every ore vein and the drop zone connected to the Bloom by open ground
    const seen=new Uint8Array(N),q=[];const st=(G.core.y+1)*MW+G.core.x+1;const open=i=>!blockedT(i)&&!(G.bgrid[i]&&G.blocks.get(G.bgrid[i]).team===1&&!B[G.blocks.get(G.bgrid[i]).t].belt);
    seen[st]=1;q.push(st);while(q.length){const i=q.pop(),x=i%MW,y=(i/MW)|0;for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const j=(y+dy)*MW+x+dx;if(inMap(x+dx,y+dy)&&!seen[j]&&!blockedT(j)){seen[j]=1;q.push(j);}}}
    const unreach=all.filter(([x,y])=>!seen[Math.floor(y)*MW+Math.floor(x)]).map(v=>v.map(n=>+n.toFixed?+n.toFixed(1):n));
    const spawnOK=!!seen[Math.floor(G.spawn.y)*MW+Math.floor(G.spawn.x)]||m.kind==='attack';
    let propOnOre=0;for(const o of mapDecor())if(o[0]==='prop'&&PROP_SOLID[o[1]])for(let y=o[3];y<o[3]+(o[5]||1);y++)for(let x=o[2];x<o[2]+(o[4]||1);x++)if(G.ore[y*MW+x]>=0)propOnOre++;
    let trackBlocked=0;for(const o of mapDecor())if(o[0]==='track'||o[0]==='road')for(let k=0;k<o[1].length-1;k++){const [ax,ay]=o[1][k],[bx,by]=o[1][k+1],L=Math.hypot(bx-ax,by-ay);for(let qq=0;qq<=L;qq+=.5){const x=Math.round(ax+(bx-ax)*qq/L),y=Math.round(ay+(by-ay)*qq/L);if(x>=2&&y>=2&&x<MW-2&&y<MH-2&&blockedT(y*MW+x)&&!G.bgrid[y*MW+x])trackBlocked++;}}
    const coreWeb=G.core.wlist.length,webTiles=G.webCount;
    return {png:cv.toDataURL('image/png'),info:{MW,unreach,spawnOK,propOnOre,trackBlocked,estate:(G.estate||[]).length,coreWebList:coreWeb,startWeb:webTiles,reach:G.reach,efeed:G.efeed||null,eblocks:[...G.blocks.values()].filter(b=>b.team===1).length,res:G.res}};},id);
  fs.writeFileSync('map_'+id+'.png',Buffer.from(r.png.split(',')[1],'base64'));rep[id]=r.info;}
 console.log(JSON.stringify(rep,null,1));console.log('errors',errs);await br.close();})();
