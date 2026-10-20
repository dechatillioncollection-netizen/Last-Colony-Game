// renders every sound in sounds.js to WAV, then encodes MP3 with ffmpeg; writes manifest.json
'use strict';
const fs = require('fs'), path = require('path'), { execFileSync } = require('child_process');
const D = require('./dsp'), S = require('./sounds');
const out = process.argv[2] || 'out', only = process.argv[3] ? new RegExp(process.argv[3]) : null;
fs.mkdirSync(out + '/wav', { recursive: true }); fs.mkdirSync(out + '/mp3', { recursive: true });
const man = fs.existsSync(out + '/manifest.json') ? JSON.parse(fs.readFileSync(out + '/manifest.json')) : {};
let seed = 1;
for (const [name, d] of Object.entries(S)) {
  const files = [];
  for (let v = 0; v < d.vars; v++) {
    const id = d.vars > 1 ? name + '_' + v : name, s0 = (seed++) * 7919 + v * 104729;
    if (only && !only.test(name)) { files.push(id); continue; }
    const t0 = Date.now(); let x = d.fn(D.rng(s0 + name.length), v);
    // no DC offset (lowpassed brown noise drifts): a loop has its mean taken off, so its seam stays exact
    if (d.loop) { let m = 0; for (const v of x) m += v; m /= x.length; x = x.map(v => v - m); } else x = D.hp1(x, 22);
    if (d.loop) { x = D.normRms(x, D.db(-18)); const p = D.peak(x); if (p > .95) x = D.mul(x, .95 / p); }
    else { x = D.norm(x, .89); let e = x.length - 1; while (e > 0 && Math.abs(x[e]) < .0012) e--; x = D.fade(x.slice(0, Math.min(x.length, e + Math.round(.03 * D.SR))), .0005, .03); }
    D.wav(`${out}/wav/${id}.wav`, x);
    const kbps = name.startsWith('amb_') ? '48k' : '64k';
    execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-i', `${out}/wav/${id}.wav`, '-ac', '1', '-ar', '44100', '-codec:a', 'libmp3lame', '-b:a', kbps, `${out}/mp3/${id}.mp3`]);
    man[id] = { len: x.length, loop: !!d.loop, bytes: fs.statSync(`${out}/mp3/${id}.mp3`).size };
    console.log(id.padEnd(18), (x.length / D.SR).toFixed(2) + 's', man[id].bytes + 'B', (Date.now() - t0) + 'ms');
    files.push(id);
  }
}
fs.writeFileSync(out + '/manifest.json', JSON.stringify(man, null, 1));
let tot = 0; for (const k in man) tot += man[k].bytes; console.log('sounds', Object.keys(man).length, 'total', (tot / 1024).toFixed(0) + ' KB');
