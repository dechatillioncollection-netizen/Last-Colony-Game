// packs the encoded sounds into audio/sounds.js: one script that defines window.LC_SOUNDS = {name: base64 MP3}
'use strict';
const fs = require('fs'), path = require('path');
const src = process.argv[2], dst = process.argv[3];
const names = fs.readdirSync(src).filter(f => f.endsWith('.mp3')).sort();
let s = '// Last Colony sound effects and ambience: original sounds made by audio/source (see audio/README.md). MP3, base64.\nwindow.LC_SOUNDS={\n';
s += names.map(f => JSON.stringify(f.slice(0, -4)) + ':"' + fs.readFileSync(path.join(src, f)).toString('base64') + '"').join(',\n');
s += '};\n';
fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.writeFileSync(dst, s);
console.log(names.length, 'sounds,', (s.length / 1024 / 1024).toFixed(2), 'MB');
