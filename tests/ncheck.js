// v33 naming and chronology checks: species name timing, the hive never says or answers to its human name, hive voice (no "I"), old names gone, speaker codes kept
const {chromium}=require('/opt/node22/lib/node_modules/playwright');const fs=require('fs');
const URL=process.env.URL||'http://localhost:8123/index.html';
(async()=>{const br=await chromium.launch();const p=await br.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto(URL);await p.waitForTimeout(800);
 const r=await p.evaluate(()=>{const R={};const NAME=/\bNymbri(a)?\b|communis/i,FIRST=/\b(I|I'm|I've|I'll|I'd|me|my|mine|myself)\b/;
   const order=[['landfall',['l_intro','fc_patrol','fc_command','fc_general','fc_after','l_out']],['ember',[...STORY.ember.intro,...STORY.ember.outro]],
     ['kilo',[...STORY.kilo.intro,...STORY.kilo.outro]],['frost',[...STORY.frost.intro,...STORY.frost.outro]],['last',[...STORY.last.intro,...STORY.last.outro]]];
   const all=new Set(Object.keys(SEQ));const used=new Set(order.flatMap(o=>o[1]));R.unusedSeq=[...all].filter(k=>!used.has(k));
   let first=null;const hiveFirstPerson=[],seedName=[],perMission={};
   for(const [m,ids] of order){let w=0,n=0;for(const id of ids){for(const [sp,t] of SEQ[id].lines){
       if(!first&&NAME.test(t))first={mission:m,seq:id,speaker:sp,line:t};
       if((sp==='seed'||sp==='bloom')&&FIRST.test(t))hiveFirstPerson.push([id,sp,t]);
       if((sp==='seed'||sp==='bloom')&&NAME.test(t))seedName.push([m,id,t]);
       if(sp==='seed'||sp==='bloom'){w+=t.split(/\s+/).length;n++;}}}
     perMission[m]={hiveLines:n,wordsPerLine:+(w/n).toFixed(1)};}
   R.firstSpeciesName=first;R.hiveFirstPerson=hiveFirstPerson;R.hiveSaysName=seedName;R.hiveWordsPerLine=perMission;
   const m1=MIS.landfall;R.mission1BriefingClean=!NAME.test(m1.desc+m1.tip+m1.name);R.tutorialClean=!TUT.some(s=>NAME.test(s.title+s.text));
   const src=document.documentElement.innerHTML;R.plAnt=(src.match(/Pl-Ant/gi)||[]).length;R.brandt=(src.match(/Brandt/gi)||[]).length;
   R.sci=CHARS.sci;R.speakers=Object.keys(CHARS);R.menu=document.querySelector('#ovcard li').textContent.slice(0,90);
   R.scientific=(JSON.stringify(SEQ).match(/Nymbria communis/g)||[]).length;R.storyOrder=STORY.ember;return R;});
 console.log(JSON.stringify(r,null,1));
 const ok=r.firstSpeciesName&&r.firstSpeciesName.seq==='e_brief'&&r.hiveFirstPerson.length===0&&r.hiveSaysName.length===0&&r.mission1BriefingClean&&r.tutorialClean&&r.plAnt===0&&r.brandt===0&&r.sci.name.includes('NYMBRIS')&&r.unusedSeq.length===0&&!errs.length;
 console.log(ok?'ALL NAMING CHECKS PASS':'NAMING CHECKS FAILED',errs);fs.writeFileSync('ncheck_result.json',JSON.stringify(r,null,1));await br.close();})();
