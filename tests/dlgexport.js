const fs=require('fs');const src=fs.readFileSync(process.argv[2],'utf8'),old=fs.readFileSync(process.argv[3],'utf8');
const grab=n=>{const i=src.indexOf('const '+n+'={');let d=0,j=src.indexOf('{',i);for(let k=j;k<src.length;k++){if(src[k]=='{')d++;else if(src[k]=='}'){d--;if(!d)return src.slice(j,k+1);}}};
const CHARS=eval('('+grab('CHARS')+')'),SEQ=eval('('+grab('SEQ')+')'),STORY=eval('('+grab('STORY')+')');
const WHEN={};old.replace(/=== (\w+) ===\nWHEN: (.*)/g,(m,id,w)=>{WHEN[id]=w;});
WHEN.e_brief='Mission 2. Opening, right after the plants and before the Ember Depot. The scientific name is first spoken here.';
const notes={l_intro:'# TUTORIAL (UI, NOT SPOKEN) runs after l_intro. Building the first Thorn Spitter triggers fc_patrol.'};
const M=[['MISSION 1, LANDFALL',['l_intro','fc_patrol','fc_command','fc_general','fc_after','l_out']],
 ['MISSION 2, EMBER FIELDS',[...STORY.ember.intro,...STORY.ember.outro]],
 ['MISSION 3, OUTPOST KILO',[...STORY.kilo.intro,...STORY.kilo.outro]],
 ['MISSION 4, FROST CANYON',[...STORY.frost.intro,...STORY.frost.outro]],
 ['MISSION 5, THE LAST COLONY',[...STORY.last.intro,...STORY.last.outro]]];
const used=new Set(M.flatMap(x=>x[1]));const missing=Object.keys(SEQ).filter(k=>!used.has(k));if(missing.length)throw 'unlisted '+missing;
let o=`LAST COLONY - CAMPAIGN DIALOGUE (v33, exported from the game)
==============================================================

This file is generated from the game's SEQ table, so it matches the build exactly.
The older scripts dialogue.txt and dialogue-rewritten.txt are kept for history.

NAMING RULES (v33)
- Nymbri, Nymbria and communis never appear before Mission 2's e_brief.
- In Mission 1 Castell only mentions that Dr Nymbris wants samples.
- The Seed Cluster and the Bloom never say "I". They say "we", or use no pronoun.
- Hive language grows: M1 instinct, M2 recognition, M3 cause and effect,
  M4 questions, M5 intentional but alien.
- The hive never says or answers to its human name in the opening campaign.
- The scientific name is shown in italics in the comm box.

CHARACTERS (code | name shown in game | role line)
`;
for(const [k,c] of Object.entries(CHARS))o+=`${k.toUpperCase().padEnd(5)} | ${c.name} | ${c.role}\n`;
for(const [title,ids] of M){o+=`\n${'-'.repeat(60)}\n${title}\n${'-'.repeat(60)}\n`;
 for(const id of ids){const s=SEQ[id];o+=`\n=== ${id} ===\nWHEN: ${WHEN[id]||''}\nCHANNEL: ${s.chan}\n`;for(const [sp,t] of s.lines)o+=`${sp.toUpperCase()}: ${t}\n`;if(notes[id])o+='\n'+notes[id]+'\n';}}
fs.writeFileSync(process.argv[4],o);console.log(o.split('\n').length,'lines');
