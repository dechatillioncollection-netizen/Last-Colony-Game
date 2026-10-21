// v47 (run from audio/source after make.js): no combat sound may ring as a note. Every variation of every shot, impact and destruction sound must have its strongest narrow
// spectral peak no more than 22 dB above the level around it (v46's hull hits were about 50 dB; plain noise scores about 10 to 12).
const fs=require('fs'),{tonal,readWav}=require('./tonal.js');const dir=process.argv[2]||'out/wav',LIM=22;
const C=/^(thorn_spit|flak_puff|mortar_launch|seed_burst|lance|mite_fire|thornback_fire|bulwark_fire|gun_scout|gun_mg|gun_jet|cannon|flame|flak_gun|shell_boom|org_hit|ant_hit|metal_hit|metal_heavy|imp_[a-z_]+?|org_burst|ant_die|veh_explode|struct_fall|ram_blast)(_\d)?\.wav$/;
let worst=['',0],n=0,bad=[];for(const f of fs.readdirSync(dir).filter(f=>C.test(f))){const t=tonal(readWav(dir+'/'+f));n++;if(t.peakDb>worst[1])worst=[f,t.peakDb];if(t.peakDb>LIM)bad.push([f,t.peakDb]);}
console.log(JSON.stringify({checked:n,worst,over:bad}));console.log(bad.length?'FAIL some combat sounds still ring':'PASS no combat sound rings as a note (every peak at or under '+LIM+' dB)');process.exit(bad.length?1:0);
