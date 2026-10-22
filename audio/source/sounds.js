// Last Colony sound recipes (v46, combat sounds remade in v47). Each entry makes one sound (or several variations) from the DSP toolkit; make.js writes and encodes them.
// The hive is wet and aquatic (waterlily and water-fungus forms, sap, membranes): its sounds are bubbles, squelches, soft fibrous creaks
// and membrane thumps. Human machines are metal, combustion and electricity, so the two sides never sound alike.
'use strict';
const D = require('./dsp');
const { SR, N, white, pink, brown, filt, lp, hp, bp, lp1, hp1, env, ad, mul, addTo, mix, sat, norm, normRms, fade, trim, osc, modal, bubble, click, creak, grains, verb, loopify, drift, driftL, lerp } = D;

const S = {};
// def(name, variations, fn(r, v) -> Float32Array, opts) ; opts.loop: seconds (made seamless), opts.peak
function def(name, vars, fn, o = {}) { S[name] = Object.assign({ vars, fn }, o); }

// ---------------- shared organic pieces ----------------
// a wet squelch: noise through a resonant band that sweeps, with a few bubbles
function squelch(r, sec, f0, f1, f2, q = 6, bubbles = 4, bub = [180, 600]) {
  const n = N(sec), x = mul(pink(n, r), ad(n, .004, sec * .32));
  let o = filt(x, 'bp', t => t < sec * .35 ? lerp(f0, f1, t / (sec * .35)) : lerp(f1, f2, Math.min(1, (t - sec * .35) / (sec * .65))), q);
  o = mix(n, [o, 1.6], [lp(x, 500), .35]);
  for (let k = 0; k < bubbles; k++) bubble(o, r() * sec * .6, bub[0] + r() * (bub[1] - bub[0]), .012 + r() * .03, .25 + r() * .3);
  return o;
}
// a soft membrane thump: a low sine that drops in pitch, with a little body noise
function thump(r, sec, f0, f1, tau, nz = .25) { const n = N(sec);
  const s = mul(osc(n, t => f1 + (f0 - f1) * Math.exp(-t / (tau * .5))), ad(n, .003, tau));
  return mix(n, [s, 1], [mul(lp(white(n, r), 700), ad(n, .001, tau * .4)), nz]); }
// soil and fibres: a cluster of tiny low crackles
function fibre(r, sec, count, fc = 900, q = 3) { const n = N(sec);
  return grains(n, count, sec * .85, (o, at, r) => click(o, at, .3 + r() * .7, fc * (.6 + r() * .9), q, r, .002 + r() * .006), r); }

// ---------------- v47 combat pieces ----------------
// v46's combat sounds rang: hull hits and chitin ticks were a few long, clean sine modes (a struck bar, so each hit was a note) and the hive's
// shots and hits carried bubbles (a falling drop of water). v47 builds every shot and impact from noise: a sharp transient, a short noise
// body through broad bands, a low thud whose pitch falls too fast to hear as a note, and debris. Where metal must ring, it rings as a dense
// cluster of many short inharmonic modes, which reads as "metal" without a pitch.
// a sharp transient: a few milliseconds of high-passed noise
function snap(n, r, f, len, at = 0) { const o = new Float32Array(n); addTo(o, mul(hp(white(N(len * 4 + .004), r), f), ad(N(len * 4 + .004), .0002, len)), at); return o; }
// a broad noise body: lowpassed noise with a fast attack, the weight of a blow or a blast
function body(n, r, f, tau, att = .001, col = 'brown') { const src = col === 'white' ? white(n, r) : col === 'pink' ? pink(n, r) : brown(n, r); return mul(lp(src, typeof f === 'function' ? f : f, .8), ad(n, att, tau)); }
// a low thud: a sub sine dropping through more than an octave in a few tens of milliseconds (felt, not heard as a note), plus noise
function thud(r, sec, f0, f1, tau, nz = .5) { const n = N(sec);
  const s = mul(osc(n, t => f1 + (f0 - f1) * Math.exp(-t / (tau * .35))), ad(n, .002, tau));
  return mix(n, [s, 1], [mul(lp(brown(n, r), f0 * 3), ad(n, .001, tau * .8)), nz]); }
// a dense metal cluster: many inharmonic modes spread over a band, each short, at random strengths, so no single pitch stands out
function cluster(n, r, f0, f1, count, d0, d1, amp = 1) { const modes = [];
  for (let k = 0; k < count; k++) modes.push([f0 * Math.pow(f1 / f0, r()), d0 + r() * (d1 - d0), (.3 + r() * .7) * amp / Math.sqrt(count)]);
  return modal(n, modes, r, .02); }
// debris and rattle: scattered tiny noise clicks after the blow
function rattle(r, sec, count, f0, f1, at0, span, amp = 1, q = 1.5) { const n = N(sec);
  return grains(n, count, span, (o, at, r) => click(o, at, amp * (.25 + r() * .75) * Math.exp(-(at - at0) / (span * .5)), f0 + r() * (f1 - f0), q, r, .0015 + r() * .004), r, at0); }
// a fibrous tear: band noise gated by a ragged flutter (fibres parting one after another)
function tear(r, sec, f, q, rate, tau) { const n = N(sec), g = new Float32Array(n); let a = 0, next = 0;
  for (let i = 0; i < n; i++) { if (i >= next) { a = r() < .65 ? .3 + r() * .7 : .05; next = i + Math.round(SR / (rate * (.6 + r() * .8))); } g[i] = a; }
  return mul(mul(bp(white(n, r), f, q), lp1(g, 300)), ad(n, .002, tau)); }
// a cellulose crack: a hard woody split, fast stick-slip through dry, damped bodies
function woodCrack(r, sec, f, dens) { const c = creak(sec, .0012 / dens, .004 / dens, [[f, 2.2, 1], [f * 2.3, 2.6, .5], [f * 4.1, 3, .25]], r, .5);
  return mul(c, ad(c.length, .0005, sec * .3)); }
// pressurised air or sap leaving a chamber: a short burst of noise sweeping down through a band
function gush(r, sec, f0, f1, q, tau) { const n = N(sec); return mul(filt(white(n, r), 'bp', t => f1 + (f0 - f1) * Math.exp(-t / (tau * .6)), q), ad(n, .002, tau)); }

// ---------------- Rootweb, vines, placement ----------------
def('web_creep', 4, (r, v) => { const sec = .9;
  const cr = creak(sec, .011 + v * .002, .006, [[260 + v * 40, 4, 1], [610, 5, .5], [1300, 6, .18]], r, .5);
  const e = env(cr.length, [[0, 0], [.05, 1], [.45, .7], [sec, 0]]);
  const soil = mul(lp(hp(pink(N(sec), r), 150), 1400), env(N(sec), [[0, 0], [.1, .6], [.6, .3], [sec, 0]]));
  let o = mix(N(sec), [mul(cr, e), .6], [soil, .5], [fibre(r, sec, 14, 700), .5]);
  o = lp(o, 1800); return verb(o, .5, .6, .18, .4); });

def('vine_lay', 3, (r, v) => { const sec = .42, n = N(sec);
  // a tendril unfurling: a short rising rustle that ends in a soft wet tap
  const rust = mul(filt(white(n, r), 'bp', t => 900 + t / sec * 2200, 1.4), env(n, [[0, 0], [.08, .8], [.3, .35], [sec, 0]]));
  const o = mix(n, [rust, .45], [fibre(r, sec * .8, 9, 1600, 4), .45]);
  const tip = thump(r, .25, 420 + v * 50, 210, .04, .1); addTo(o, tip, .26, .7); bubble(o, .28, 520 + v * 60, .02, .35);
  return verb(lp(o, 5000), .4, .5, .14, .3); });

def('vine_grow', 4, (r, v) => { const sec = .18, n = N(sec), o = new Float32Array(n);
  // one vine piece closing: a tiny wet tick
  bubble(o, .004, 700 + v * 90 + r() * 60, .014, .6); click(o, 0, .5, 2400, 3, r, .002); return verb(lp(o, 6000), .3, .5, .1, .2); });

def('place_organ', 3, (r, v) => { const sec = .7, n = N(sec);
  // a seed pressed into wet ground
  const o = mix(n, [thump(r, sec, 150 + v * 15, 62, .09, .3), .9], [squelch(r, .45, 300, 1100, 380, 5, 5, [160, 420]), .55, .02]);
  return verb(lp(o, 4500), .55, .5, .2, .5); });

def('grown_organ', 2, (r, v) => { const sec = 1.1, n = N(sec);
  // the growth opening: a soft swell of fluid with a few bright bubbles rising through it
  const sw = mul(lp(pink(n, r), t => 300 + 1800 * Math.sin(Math.min(1, t / .5) * Math.PI / 2)), env(n, [[0, 0], [.25, .6], [.55, .25], [sec, 0]]));
  const o = mix(n, [sw, .5], [thump(r, sec, 120, 80, .25, .1), .5]);
  for (let k = 0; k < 7; k++) bubble(o, .12 + k * .07 + r() * .04, 380 + k * 70 + r() * 120 + v * 40, .03 + r() * .03, .22);
  return verb(lp(o, 6500), .7, .45, .3, .9); });

def('deny', 1, (r) => { const sec = .4, n = N(sec);
  // refused: a dull, dry double knock, muffled
  const k1 = thump(r, .2, 170, 120, .035, .5), o = new Float32Array(n); addTo(o, k1, 0, .9); addTo(o, thump(r, .2, 150, 105, .04, .5), .11, .75);
  return lp(o, 900); });

def('rotate', 2, (r, v) => { const sec = .2;
  // a fibrous twist: a quick stick-slip creak
  const cr = creak(sec, .006 + v * .001, .0032, [[880 + v * 120, 7, 1], [1900, 6, .35]], r, .3);
  return verb(lp(mul(cr, env(cr.length, [[0, 0], [.02, 1], [.14, .5], [sec, 0]])), 5000), .3, .5, .1, .2); });

// ---------------- hive structures under attack ----------------
def('org_hit', 4, (r, v) => { const sec = .3, n = N(sec);
  // a round striking soft living tissue: a wet, dull thud, a fibrous tear, and a little sap spatter (no drops of water)
  const o = mix(n, [thud(r, sec, 150 + v * 15, 55, .045, .7), 1], [body(n, r, 900, .025, .001, 'pink'), .5], [tear(r, .16, 1400 + v * 200, 1.4, 260, .05), .45, .006]);
  addTo(o, rattle(r, .25, 5, 1500, 3000, .02, .12, .25, 2), 0, 1);
  return lp(o, 6000); });

def('org_burst', 3, (r, v) => { const sec = 1.6, n = N(sec);
  // a growth bursting: a deep wet rupture, fibres tearing apart, and torn tissue and sap spattering down (no bubbling)
  const rup = body(n, r, t => 1800 * Math.exp(-t / .25) + 160, .3, .004);
  const tr = mul(creak(.5, .004, .009, [[700, 3, 1], [1600, 4, .5]], r, .6), env(N(.5), [[0, 1], [.5, 0]]));
  const o = mix(n, [rup, 1.1], [thud(r, sec, 95 + v * 10, 34, .22, .6), .9], [tr, .3, .02], [tear(r, .6, 1100, 1, 90, .2), .45, .03]);
  addTo(o, rattle(r, sec, 26, 400, 2200, .1, 1.0, .3, 1.2), 0, 1);
  return verb(lp(o, 5000), .65, .45, .28, 1); });

def('heal', 1, (r) => { const sec = 1.3, n = N(sec);
  // a Healing Pod pulse: sap welling up, a calm rising shimmer of small bubbles
  const sw = mul(lp(pink(n, r), t => 200 + 900 * t / sec), env(n, [[0, 0], [.4, .4], [1, .2], [sec, 0]]));
  const o = mix(n, [sw, .45], [mul(osc(n, t => 220 + 40 * t), env(n, [[0, 0], [.3, .25], [sec, 0]])), .2], [mul(osc(n, t => 330 + 60 * t), env(n, [[0, 0], [.5, .15], [sec, 0]])), .15]);
  for (let k = 0; k < 14; k++) bubble(o, .1 + k * .07 + r() * .03, 500 + k * 45 + r() * 100, .025, .16);
  return verb(o, .75, .4, .35, 1); });

// ---------------- organs at work ----------------
// Sap Burner: low biological combustion, a bubbling, smouldering churn (loop)
def('burner_loop', 1, (r) => { const L = 5, sec = L + 1, n = N(sec);
  const g = driftL(r, L, [1, 2, 3]); const fl = t => .6 + .4 * g(t);
  const roar = lp(brown(n, r), t => 260 + 160 * fl(t));
  const hiss = mul(bp(white(n, r), 2200, .8), .05);
  const o = mix(n, [roar, 1], [hiss, 1], [mul(lp(osc(n, 46, 'tri'), 120), .25), 1]);
  for (let k = 0; k < 70; k++) bubble(o, r() * sec, 90 + r() * 260, .02 + r() * .05, .06 + r() * .1, .3);
  for (let k = 0; k < 40; k++) click(o, r() * sec, .05 + r() * .06, 1500 + r() * 2500, 2, r);
  return loopify(lp(o, 3200), L, .9); }, { loop: 5 });
def('burner_feed', 2, (r, v) => { const sec = .9, n = N(sec);
  // a lump of coal taken in: a soft whumph of flaring sap
  const f = mul(lp(brown(n, r), t => 900 * Math.exp(-t / .2) + 200), env(n, [[0, 0], [.04, 1], [.25, .4], [sec, 0]]));
  const o = mix(n, [f, 1], [thump(r, sec, 85 + v * 8, 50, .15, .2), .6]);
  for (let k = 0; k < 8; k++) bubble(o, .05 + r() * .4, 150 + r() * 250, .03, .2, .3);
  return verb(o, .5, .5, .2, .5); });

// Sunleaf: a gentle energy pulse, airy and glassy, very soft
def('sun_pulse', 2, (r, v) => { const sec = 1.8, n = N(sec), f0 = v ? 392 : 349;
  const e = env(n, [[0, 0], [.35, 1], [.8, .45], [sec, 0]], 1.6);
  const tone = mix(n, [osc(n, f0), .5], [osc(n, f0 * 2.01), .22], [osc(n, f0 * 3.0), .08], [osc(n, f0 * 1.5), .12]);
  const air = bp(pink(n, r), 3200, .7);
  const o = mix(n, [mul(tone, e), .5], [mul(air, e), .18]);
  return verb(o, .8, .3, .4, 1.2); });
def('sun_loop', 1, (r) => { const L = 8, sec = L + 1, n = N(sec);
  const g = driftL(r, L, [1, 3]); const tone = mix(n, [osc(n, 174.6), .4], [osc(n, 261.6 + 0.4), .25], [osc(n, 349.2 + .7), .12]);
  const o = mix(n, [mul(tone, env(n, [[0, 1], [sec, 1]])), .5], [bp(pink(n, r), 2800, .6), .12]);
  const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = .7 + .3 * g(i / SR);
  return loopify(lp(mul(o, am), 4000), L, 1); }, { loop: 8 });

// Spore Bellows: one soft pressurised breath (in, out through the vents), and the spore release on the out-breath
def('bellows_breath', 1, (r) => { const sec = 2.8, n = N(sec);
  // the cycle the art uses: about 62% filling, then the squeeze
  const inh = mul(filt(pink(n, r), 'bp', t => 400 + 500 * Math.min(1, t / 1.7), 1.6), env(n, [[0, 0], [.9, .5], [1.7, .35], [1.74, 0], [sec, 0]]));
  const exh = mul(filt(pink(n, r), 'bp', t => 1200 - 500 * Math.min(1, Math.max(0, t - 1.74) / 1), 1.2), env(n, [[0, 0], [1.74, 0], [1.85, 1], [2.4, .3], [sec, 0]]));
  const body = mul(lp(brown(n, r), 180), env(n, [[0, 0], [1.7, .5], [1.9, .8], [sec, 0]]));
  return mix(n, [inh, .6], [exh, .7], [body, .4]); }, { loop: 2.8 });
def('spore_puff', 3, (r, v) => { const sec = .6, n = N(sec);
  const p = mul(filt(white(n, r), 'bp', t => 2600 - 1400 * t / sec, 1.1), ad(n, .01, .12));
  const o = mix(n, [p, .7], [thump(r, sec, 110, 70, .06, .3), .35]);
  for (let k = 0; k < 10; k++) click(o, .02 + r() * .25, .08, 3500 + r() * 2500, 3, r);
  return verb(lp(o, 7000), .5, .4, .25, .5); });

def('tap_draw', 3, (r, v) => { const sec = .4, n = N(sec);
  // a Root Tap drawing ore up: a small, deep gulp
  const o = mix(n, [thump(r, sec, 120 + v * 15, 75, .05, .15), .6], [squelch(r, .25, 200, 600, 260, 7, 2, [140, 300]), .4]);
  return lp(o, 2400); });
def('gland_work', 2, (r, v) => { const sec = .8, n = N(sec);
  // a gland finishing a batch: a thick gurgle
  const o = squelch(r, sec, 160, 520 + v * 80, 200, 5, 9, [120, 380]); return verb(lp(o, 3000), .45, .5, .2, .4); });
def('hatch', 2, (r, v) => { const sec = 1.2, n = N(sec);
  // an ant hatching: a membrane splitting, a wet slide, and the first leg clicks
  const o = mix(n, [squelch(r, .7, 250, 1400, 320, 4, 8, [200, 700]), .8], [thump(r, sec, 130, 60, .14, .2), .6]);
  for (let k = 0; k < 9; k++) click(o, .6 + k * .045 + r() * .02, .3, 3800 + r() * 1800, 5, r, .0015);
  return verb(o, .5, .45, .2, .6); });
def('gate', 2, (r, v) => { const sec = .5, n = N(sec);
  // the Petal Gate folding open (v0) or closing (v1): a leathery membrane flap
  const x = mul(filt(pink(n, r), 'bp', t => v ? 900 - 500 * t / sec : 400 + 600 * t / sec, 1.8), env(n, [[0, 0], [.06, 1], [.25, .5], [sec, 0]]));
  const o = mix(n, [x, .8], [creak(sec, .009, .005, [[500, 5, 1], [1100, 6, .4]], r, .4), .25]);
  return lp(o, 3000); });

// ---------------- hive weapons ----------------
def('thorn_spit', 3, (r, v) => { const sec = .35, n = N(sec);
  // Thorn Spitter: a sharp muscular snap, a pressurised discharge, and the thorn hissing away
  const o = mix(n, [thud(r, sec, 190 + v * 15, 70, .03, .5), .9], [snap(n, r, 2600, .002), .9], [gush(r, .22, 4200, 1300, 1.3, .045), .55, .003],
    [tear(r, .08, 2200, 1.6, 900, .02), .3]);
  return verb(lp(sat(o, 1.6), 9000), .3, .5, .1, .25); });
def('flak_puff', 2, (r, v) => { const sec = .6, n = N(sec);
  // Spore Flak: the sac clenches, then a forceful clustered discharge, a burst of spores spreading out
  const squeeze = mul(lp(brown(n, r), 300), env(n, [[0, 0], [.05, .5], [.07, 0], [sec, 0]], 1.5));
  const o = mix(n, [squeeze, .6], [thud(r, sec, 170, 60, .05, .6), .9, .06], [snap(n, r, 1800, .003), .6, .06]);
  for (let k = 0; k < 7; k++) addTo(o, gush(r, .16, 3600 + r() * 1800, 1500, 1.1, .03), .065 + k * (.009 + r() * .01), .32);
  return verb(lp(o, 9000), .45, .45, .18, .4); });
def('mortar_launch', 2, (r, v) => { const sec = 1.0, n = N(sec);
  // Seed Mortar: heavy tissue clenching, then the seed pod thrown out with a deep, fibrous thoomp
  const clench = mul(woodCrack(r, .12, 260, .7), env(N(.12), [[0, 0], [.08, 1], [.12, 0]]));
  const o = mix(n, [clench, .35], [thud(r, sec, 120 + v * 10, 38, .14, .9), 1.1, .1], [body(n, r, 700, .07), .8, .1], [gush(r, .3, 1600, 400, .9, .08), .45, .105]);
  return verb(lp(sat(o, 1.4), 4500), .6, .5, .25, .7); });
def('seed_burst', 3, (r, v) => { const sec = 1.1, n = N(sec);
  // a seed shell landing: the husk cracks, the pod ruptures with fibrous tearing, and soil and seed fragments fall
  const o = mix(n, [snap(n, r, 1500, .004), .7], [thud(r, sec, 110 + v * 8, 40, .15, 1), 1.1], [body(n, r, t => 2400 * Math.exp(-t / .08) + 220, .16), .9],
    [tear(r, .35, 900 + v * 150, 1, 140, .1), .5, .01]);
  addTo(o, rattle(r, sec, 22, 500, 2400, .06, .55, .35, 1.2), 0, 1);
  return verb(lp(sat(o, 1.5), 6500), .6, .45, .22, .7); });
def('lance', 2, (r, v) => { const sec = .9, n = N(sec);
  // Sunlance: light drawn in and focused (a rising, fluttering surge of filtered noise), then let go as a concentrated, searing burst
  const charge = mul(mul(filt(pink(n, r), 'bp', t => 500 + 2600 * Math.min(1, t / .22), 3), env(n, [[0, 0], [.2, 1], [.23, 0], [sec, 0]], 1.4)),
    osc(n, t => 28 + 30 * t, 'tri').map(s => .7 + .3 * s));
  const sear = mul(filt(white(n, r), 'bp', t => 5200 - 2600 * Math.min(1, (t - .22) / .4), .9), env(n, [[0, 0], [.22, 0], [.235, 1], [.45, .25], [sec, 0]]));
  const o = mix(n, [charge, .55], [sear, .55], [thud(r, .4, 160, 60, .05, .4), .6, .225], [snap(n, r, 3000, .003), .5, .225]);
  return verb(lp(o, 11000), .55, .3, .25, .6); });

// ---------------- ants ----------------
def('ant_scuttle', 1, (r) => { const L = 3, sec = L + 1, n = N(sec);
  // many small legs on soil: clustered chitin ticks over a soft rustle (one bed for the whole swarm, scaled by how many are moving)
  const o = new Float32Array(n); let t = 0; while (t < sec) { const burst = 2 + Math.floor(r() * 4); for (let k = 0; k < burst; k++) click(o, t + k * (.012 + r() * .01), .25 + r() * .5, 3200 + r() * 3500, 4, r, .0012); t += .03 + r() * .07; }
  const rust = mul(bp(pink(n, r), 2400, .7), .12); return loopify(mix(n, [o, 1], [rust, 1]), L, .5); }, { loop: 3 });
def('mite_fire', 3, (r, v) => { const sec = .18, n = N(sec);
  // Mite Ant: a small gland flicking a bead of sap: a tiny muscular tick and a hiss
  const o = mix(n, [snap(n, r, 3200, .0015), .7], [gush(r, .1, 5200, 2200, 1.4, .02), .5, .002], [thud(r, .1, 280, 140, .012, .4), .35]);
  return verb(lp(o, 10000), .2, .5, .06, .12); });
def('thornback_fire', 3, (r, v) => { const sec = .26, n = N(sec);
  // Thornback Ant: a hard flick of the back and a thorn snapping loose
  const o = mix(n, [snap(n, r, 2400, .002), .9], [thud(r, .18, 240 + v * 20, 100, .02, .5), .55], [gush(r, .15, 4400, 1700, 1.4, .03), .5, .002],
    [woodCrack(r, .05, 1300, 1.4), .3]);
  return verb(lp(sat(o, 1.5), 9000), .3, .5, .08, .18); });
def('bulwark_fire', 2, (r, v) => { const sec = .7, n = N(sec);
  // Bulwark Ant: the seed pod's heavy muscular heave, and an acid seed lobbed out with a thick sap rush
  const o = mix(n, [thud(r, sec, 150 + v * 15, 50, .08, .8), 1], [body(n, r, 600, .05), .6], [gush(r, .3, 1800, 500, .9, .07), .5, .01],
    [tear(r, .12, 700, 1.2, 180, .04), .3, .005]);
  return verb(lp(sat(o, 1.3), 4000), .45, .5, .18, .4); });
def('ant_hit', 4, (r, v) => { const sec = .16, n = N(sec);
  // a hit on chitin: a dry crunch with a little body (a crack through the shell, not a tick with a pitch)
  const o = mix(n, [snap(n, r, 2000, .002), .7], [thud(r, sec, 230 + v * 20, 100, .02, .5), .6], [body(n, r, 2600, .012, .0005, 'white'), .35]);
  addTo(o, rattle(r, sec, 9, 1800, 4200, .002, .045, .45, 2.5), 0, 1);
  return lp(o, 9000); });
def('ant_die', 3, (r, v) => { const sec = .9, n = N(sec);
  // an ant killed: its shell crunching, a soft wet burst, and fragments scattering
  const crunch = grains(N(.12), 22, .09, (o, at, r) => click(o, at, .3 + r() * .7, 1800 + r() * 3000, 3, r, .0015), r);
  const o = mix(n, [crunch, .9], [thud(r, sec, 190 + v * 20, 70, .06, .7), .7, .01], [tear(r, .25, 1300, 1.2, 200, .07), .35, .02]);
  addTo(o, rattle(r, sec, 12, 900, 3000, .06, .5, .25, 1.5), 0, 1);
  return verb(lp(o, 7000), .4, .5, .15, .4); });

// ---------------- human machines ----------------
// a diesel-like engine with tracks: firing pulses through exhaust resonances, mechanical rattle, a gear whine and track clank (loop)
function engine(r, L, fire, form, rattle, whine, clank, clankRate, rumble) { const sec = L + 1, n = N(sec);
  const g = driftL(r, L, [1, 2]); const pulses = new Float32Array(n); let t = 0;
  while (t < sec) { const i = Math.round(t * SR); if (i < n) pulses[i] = .8 + r() * .4; t += 1 / (fire * (1 + .02 * g(t))) * (1 + (r() - .5) * .04); }
  const ex = lp(pulses, 900); let o = new Float32Array(n);
  for (const [f, q, a] of form) addTo(o, bp(ex, f, q), 0, a);
  addTo(o, lp(brown(n, r), rumble), 0, .6);
  const rat = mul(hp(white(n, r), 2500), lp(pulses, 60)); addTo(o, rat, 0, rattle);
  addTo(o, mul(osc(n, t => whine * (1 + .01 * g(t))), .06 + .02), 0, whine ? .5 : 0);
  if (clank) { let ct = .05; while (ct < sec) { const m = modal(N(.12), [[clank * (1 + (r() - .5) * .1), .03, .5], [clank * 2.7, .02, .3], [clank * 4.1, .012, .2]], r, .05); addTo(o, m, ct, .3 + r() * .3); ct += 1 / clankRate * (1 + (r() - .5) * .3); } }
  return loopify(sat(o, 1.5), L, .5); }
def('eng_scout', 1, (r) => engine(r, 4, 34, [[120, 3, 1.4], [420, 4, .6], [900, 5, .25]], .25, 760, 1500, 7.5, 160), { loop: 4 });
def('eng_heavy', 1, (r) => engine(r, 4, 21, [[70, 3, 1.8], [260, 4, .8], [600, 5, .3]], .3, 420, 900, 4.5, 110), { loop: 4 });
def('eng_flame', 1, (r) => engine(r, 4, 26, [[90, 3, 1.6], [330, 4, .7], [760, 5, .25]], .35, 520, 1100, 5.5, 130), { loop: 4 });
def('eng_drone', 1, (r) => { const L = 3, sec = L + 1, n = N(sec);
  // Rammer Drone: an electric motor's whine with a buzzing commutator
  const g = driftL(r, L, [2, 3]); const base = t => 190 * (1 + .015 * g(t));
  const o = mix(n, [lp(osc(n, base, 'saw'), 2400), .35], [osc(n, t => base(t) * 6.03), .08], [mul(hp(white(n, r), 4000), mul(osc(n, t => base(t) * 2, 'sq'), .5)), .05], [lp(brown(n, r), 220), .4]);
  return loopify(o, L, .5); }, { loop: 3 });
def('eng_jet', 1, (r) => { const L = 4, sec = L + 1, n = N(sec);
  // Interceptor: a small turbine, an airy roar and a high whine
  const g = driftL(r, L, [1, 3]);
  const o = mix(n, [bp(pink(n, r), 1300, .9), .9], [bp(pink(n, r), 3400, 1.2), .4], [osc(n, t => 4200 * (1 + .01 * g(t))), .05], [lp(brown(n, r), 250), .5]);
  return loopify(o, L, .6); }, { loop: 4 });
def('eng_bomber', 1, (r) => engine(r, 4, 48, [[95, 2, 1.2], [300, 3, .6], [1600, 4, .15]], .1, 2100, 0, 0, 90), { loop: 4 });

// a gunshot: a sharp crack, a low muzzle thump, the action's metallic clack, an outdoor slap-back
function gun(r, sec, crackF, body0, clack, tail, room) { const n = N(sec);
  // a gun: the muzzle crack, the blast, the barrel's low punch, and the breech or recoil clack as broadband noise (it used to ring as a note)
  const crack = mul(hp(white(n, r), crackF), ad(n, .0004, .012));
  const blast = mul(lp(white(n, r), 2600), ad(n, .0008, .035));
  const o = mix(n, [crack, .8], [blast, .9], [thud(r, sec, body0[0], body0[1], body0[2], .7), 1]);
  if (clack) { addTo(o, mul(bp(white(N(.05), r), clack, 1.4), ad(N(.05), .0005, .01)), .03, .35); addTo(o, cluster(N(.08), r, clack * .8, clack * 3, 40, .003, .008, .25), .03, 1); }
  return verb(lp(sat(o, 2.2), 9000), room, .45, tail, .6); }
def('gun_scout', 3, (r, v) => gun(r, .6, 1800, [150 + v * 10, 60, .06], 1900 + v * 120, .2, .4));
def('gun_mg', 3, (r, v) => gun(r, .4, 2400, [190 + v * 10, 90, .03], 2600 + v * 150, .14, .3));
def('gun_jet', 2, (r, v) => { const sec = .55, n = N(sec), o = new Float32Array(n);
  // Interceptor cannon: a short ripping burst of rounds
  for (let k = 0; k < 5; k++) addTo(o, gun(r, .2, 3000, [260, 110, .012], 0, .05, .2), k * .038 + (r() - .5) * .006, .65 + r() * .2); return verb(o, .4, .4, .15, .4); });
def('cannon', 2, (r, v) => { const sec = 1.8, n = N(sec);
  // Siege Tank and Hail Cannon: a forceful crack, the deep blast and the shove of the recoil, and a long outdoor tail
  const o = mix(n, [gun(r, 1.0, 900, [95 + v * 8, 32, .16], 700, .3, .7), 1], [body(n, r, t => 900 * Math.exp(-t / .3) + 80, .35, .002), .8],
    [cluster(N(.3), r, 400, 2200, 70, .006, .02, .35), 1, .05]);
  return lp(o, 7000); });
def('flame', 3, (r, v) => { const sec = .65, n = N(sec);
  // Flame Tank: a valve opening on pressurised fuel (a hard hiss), the ignition whump, and a ragged, roaring jet
  const fl = new Float32Array(n); let a = 0; for (let i = 0; i < n; i++) { if (i % 200 === 0) a = .45 + r() * .55; fl[i] = a; }
  const roar = mul(mul(lp(mix(n, [brown(n, r), 1], [pink(n, r), .6]), 1500), lp1(fl, 45)), env(n, [[0, 0], [.06, 1], [.4, .8], [sec, 0]]));
  const hiss = mul(bp(white(n, r), 3800, .8), env(n, [[0, 0], [.008, .9], [.05, .35], [.4, .25], [sec, 0]]));
  return mix(n, [sat(roar, 1.5), 1], [hiss, .35], [thud(r, .3, 110, 45, .05, .9), .5, .04]); });
def('zap', 2, (r, v) => { const sec = .5, n = N(sec);
  // Lancer: an electric discharge, a rising whine snapping into a crackling buzz
  const w = mul(osc(n, t => 600 + 3000 * Math.min(1, t / .08), 'saw'), env(n, [[0, 0], [.08, .5], [.09, 0], [sec, 0]]));
  const buzz = mul(mul(hp(white(n, r), 1500), osc(n, 120, 'sq')), env(n, [[0, 0], [.08, 0], [.09, 1], [.3, .2], [sec, 0]]));
  return verb(lp(mix(n, [w, .3], [buzz, .6]), 9000), .5, .3, .2, .4); });
def('flak_gun', 2, (r, v) => gun(r, .9, 1300, [120, 50, .1], 1200, .3, .6));
def('shell_boom', 3, (r, v) => { const sec = 2.2, n = N(sec);
  // a shell or bomb exploding on the ground: a crack, a deep boom, and soil and stone falling back
  const o = mix(n, [snap(n, r, 1200, .006), .7], [body(n, r, t => 3000 * Math.exp(-t / .15) + 120, .45, .002), 1.3], [thud(r, sec, 75, 28, .3, .5), 1]);
  addTo(o, rattle(r, sec, 34, 500, 2800, .12, 1.1, .4, 1.3), 0, 1);
  return verb(lp(sat(o, 1.6), 6500), .75, .5, .3, 1.4); });
def('metal_hit', 4, (r, v) => { const sec = .3, n = N(sec);
  // a round striking a vehicle hull: a hard metallic strike, the hull's dull body, and a brief rattle (no ringing note)
  const o = mix(n, [snap(n, r, 2400, .0025), .8], [cluster(n, r, 700 + v * 60, 5200, 70, .004, .016, .9), 1], [thud(r, sec, 170 + v * 12, 70, .03, .6), .65],
    [body(n, r, 1800, .02, .0005, 'white'), .3]);
  addTo(o, rattle(r, sec, 7, 2000, 5000, .03, .12, .3, 3), 0, 1);
  return verb(lp(o, 10000), .25, .45, .08, .2); });
def('metal_heavy', 2, (r, v) => { const sec = .7, n = N(sec);
  // a heavy blow on armour or an HDF structure: a crunching strike, a deep structural body and rattling parts
  const o = mix(n, [snap(n, r, 1600, .004), .8], [cluster(n, r, 300 + v * 40, 3200, 90, .008, .03, 1), 1], [thud(r, sec, 110 + v * 10, 40, .07, .8), .9],
    [body(n, r, 1200, .05), .5]);
  addTo(o, rattle(r, sec, 14, 900, 4000, .05, .4, .35, 2.5), 0, 1);
  return verb(lp(sat(o, 1.3), 8000), .4, .45, .14, .4); });
def('veh_explode', 3, (r, v) => { const sec = 2.6, n = N(sec);
  // a vehicle destroyed: a blast, a metallic crash, a fuel whoomph and debris rattling down
  const o = mix(n, [body(n, r, t => 3500 * Math.exp(-t / .18) + 150, .5, .002), 1.3], [thud(r, sec, 82, 30, .35, .5), .9], [snap(n, r, 1500, .008), .5],
    [cluster(N(.6), r, 300, 4000, 110, .01, .04, 1), .9, .01]);
  addTo(o, rattle(r, sec, 40, 700, 4200, .15, 1.4, .45, 2.5), 0, 1);
  return verb(lp(sat(o, 1.7), 7000), .8, .5, .3, 1.5); });
def('ram_blast', 1, (r) => { const sec = 1.8, n = N(sec);
  // Rammer Drone detonating against a growth: sharper and drier than a tank going up
  const o = mix(n, [mul(hp(white(n, r), 900), ad(n, .0005, .04)), .8], [mul(lp(brown(n, r), t => 4000 * Math.exp(-t / .1) + 150), ad(n, .002, .3)), 1.2], [mul(osc(n, t => 40 + 60 * Math.exp(-t / .05)), ad(n, .002, .3)), .8]);
  return verb(lp(sat(o, 2), 8000), .7, .5, .28, 1.1); });
def('struct_fall', 2, (r, v) => { const sec = 2.4, n = N(sec);
  // a human building collapsing: metal groaning and crashing down
  const groan = mul(creak(1.2, .012, .02, [[140, 5, 1], [360, 6, .5], [900, 7, .2]], r, .3), env(N(1.2), [[0, 0], [.2, 1], [1.2, 0]]));
  const o = mix(n, [groan, .5], [mul(lp(brown(n, r), t => 2000 * Math.exp(-(t - .3) / .3) + 150), ad(n, .01, .6, .3)), 1.1], [cluster(N(.8), r, 250, 3500, 110, .01, .045, 1), .8, .3]);
  addTo(o, rattle(r, sec, 40, 400, 3000, .3, 1.6, .45, 1.8), 0, 1);
  return verb(lp(sat(o, 1.4), 6000), .8, .45, .3, 1.4); });

// ---------------- interface ----------------
def('ui_select', 2, (r, v) => { const sec = .12, n = N(sec);
  // a soft organic tick
  const o = modal(n, [[640 + v * 90, .03, .6], [1720 + v * 140, .015, .25]], r, 0); bubble(o, .002, 900 + v * 120, .01, .2); return lp(o, 5000); });
def('ui_tool', 1, (r) => { const sec = .16, n = N(sec), o = modal(n, [[820, .035, .5], [2100, .02, .2]], r, 0); bubble(o, .01, 1150, .015, .3); return lp(o, 6000); });
def('ui_cancel', 1, (r) => { const sec = .22, n = N(sec), o = new Float32Array(n); bubble(o, 0, 760, .025, .4, -1.2); bubble(o, .07, 560, .03, .35, -1.2); return lp(o, 4000); });
def('ui_open', 1, (r) => { const sec = .35, n = N(sec);
  return verb(mul(filt(pink(n, r), 'bp', t => 300 + 1600 * t / sec, 1.4), env(n, [[0, 0], [.18, .8], [sec, 0]])), .4, .5, .15, .3); });
def('ui_close', 1, (r) => { const sec = .3, n = N(sec);
  return verb(mul(filt(pink(n, r), 'bp', t => 1600 - 1300 * t / sec, 1.4), env(n, [[0, 0], [.05, .8], [sec, 0]])), .4, .5, .15, .3); });
def('ui_alert', 1, (r) => { const sec = 1.0, n = N(sec);
  // a warning: two low organic pulses, like a heart quickening
  const o = new Float32Array(n); addTo(o, thump(r, .4, 110, 72, .09, .15), 0, 1); addTo(o, thump(r, .4, 104, 68, .1, .15), .22, .8);
  addTo(o, mul(osc(N(.6), 440), ad(N(.6), .02, .12)), .01, .06); return verb(lp(o, 2500), .6, .5, .25, .6); });
def('ui_good', 1, (r) => { const sec = .9, n = N(sec), o = new Float32Array(n);
  // something done: two drops, a fifth apart
  bubble(o, 0, 523, .06, .5, .15); bubble(o, .11, 784, .07, .45, .15); return verb(o, .7, .4, .35, .8); });
def('comm_radio', 2, (r, v) => { const sec = .35, n = N(sec);
  // HDF radio: a squelch of static and a keyed tone
  const st = mul(bp(white(n, r), 1800, .9), env(n, [[0, 0], [.01, .7], [.12, .5], [.14, 0], [sec, 0]]));
  const o = mix(n, [st, .6], [mul(osc(n, v ? 1250 : 1100, 'sq'), env(n, [[0, 0], [.14, 0], [.15, .1], [.23, .1], [.24, 0], [sec, 0]])), .5]);
  return bp(o, 1700, .6); });
def('comm_hive', 2, (r, v) => { const sec = .9, n = N(sec);
  // the root-link stirring: a low formant murmur and a few bubbles
  const m = mul(filt(brown(n, r), 'bp', t => 250 + 300 * Math.sin(t / sec * Math.PI), 3), env(n, [[0, 0], [.2, .7], [.6, .3], [sec, 0]]));
  const o = mix(n, [m, .9], [thump(r, sec, 90, 70, .2, 0), .3]); for (let k = 0; k < 4; k++) bubble(o, .1 + k * .12, 260 + v * 40 + k * 50, .03, .2);
  return verb(o, .7, .5, .3, .7); });

// ---------------- ambience (mono loops; the game plays two offset copies left and right for width) ----------------
function windBed(r, L, centre, width, gust, hiss) { const sec = L + 2, n = N(sec);
  const g = driftL(r, L, [1, 2, 3, 5]), h = driftL(r, L, [2, 4, 7]);
  const base = filt(pink(n, r), 'bp', t => centre * (1 + width * g(t)), .8);
  const am = new Float32Array(n), am2 = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; am[i] = .55 + gust * (.45 * g(t) + .25 * h(t)); am2[i] = Math.max(0, .3 + .7 * h(t)); }
  return mix(n, [mul(base, am), 1], [mul(mul(hp(pink(n, r), 3000), am2), hiss), 1], [lp(brown(n, r), 140), .5]); }
def('amb_meadow', 1, (r) => { const L = 24, o = windBed(r, L, 650, .45, .9, .35);
  // grass and leaves stirred by the gusts
  const n = o.length; const leaves = grains(n, 260, L + 1.5, (d, at, r) => click(d, at, .04 + r() * .06, 3000 + r() * 4000, 2, r, .006), r);
  return loopify(mix(n, [o, 1], [leaves, 1]), L, 1.5); }, { loop: 24 });
def('amb_frost', 1, (r) => { const L = 24, sec = L + 2, n = N(sec), o = windBed(r, L, 900, .3, .8, .5);
  // a cold wind whistling round ice edges: narrow resonances gliding slowly
  const g = driftL(r, L, [1, 3]), g2 = driftL(r, L, [2, 5]);
  const wh = mix(n, [filt(pink(n, r), 'bp', t => 980 * (1 + .25 * g(t)), 14), 1.2], [filt(pink(n, r), 'bp', t => 1560 * (1 + .2 * g2(t)), 16), .8]);
  const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = Math.max(0, .2 + .8 * g2(i / SR));
  return loopify(mix(n, [o, .8], [mul(wh, am), 1]), L, 1.5); }, { loop: 24 });
def('amb_ash', 1, (r) => { const L = 24, sec = L + 2, n = N(sec), o = windBed(r, L, 420, .5, 1, .25);
  // a dry hot wind over cinders: embers ticking, the ground groaning far below
  const em = grains(n, 160, sec, (d, at, r) => click(d, at, .05 + r() * .1, 2000 + r() * 3000, 3, r, .002), r);
  const deep = mul(lp(brown(n, r), 70), 1.4);
  return loopify(mix(n, [o, 1], [em, 1], [deep, 1]), L, 1.5); }, { loop: 24 });
def('amb_pass', 1, (r) => { const L = 24, sec = L + 2, n = N(sec), o = windBed(r, L, 380, .6, 1, .3);
  // a mountain pass: the wind moans in hollow tones
  const g = driftL(r, L, [1, 2]); const moan = filt(brown(n, r), 'bp', t => 230 * (1 + .3 * g(t)), 9);
  const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = Math.max(0, .3 + .7 * g(i / SR));
  return loopify(mix(n, [o, 1], [mul(moan, am), 1.6]), L, 1.5); }, { loop: 24 });
def('amb_colony', 1, (r) => { const L = 24, sec = L + 2, n = N(sec), o = windBed(r, L, 600, .35, .7, .25);
  // a human settlement: the wind, and machinery humming somewhere across the valley
  const g = driftL(r, L, [1, 3]);
  const hum = mix(n, [osc(n, 50), .3], [osc(n, 100.2), .2], [osc(n, 150.3), .1], [bp(pink(n, r), 300, 2), .4]);
  const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = .6 + .4 * g(i / SR);
  return loopify(mix(n, [o, 1], [lp(mul(hum, am), 600), .5]), L, 1.5); }, { loop: 24 });
def('amb_soil', 1, (r) => { const L = 20, sec = L + 2, n = N(sec);
  // the small lives in the soil: a faint stridulating chorus that swells and settles
  const o = new Float32Array(n), g = driftL(r, L, [1, 2, 4]);
  for (let k = 0; k < 90; k++) { const at = r() * sec, f = 4200 + r() * 2500, rate = 30 + r() * 30, len = .15 + r() * .5, m = N(len);
    const tr = mul(mul(osc(m, f), osc(m, rate, 'sq').map(v => v > 0 ? 1 : 0)), env(m, [[0, 0], [len * .2, 1], [len * .8, 1], [len, 0]])); addTo(o, tr, at, .04 + r() * .05); }
  const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = Math.max(0, .3 + .7 * g(i / SR));
  return loopify(lp(mul(o, am), 7000), L, 1.5); }, { loop: 20 });
def('amb_low', 1, (r) => { const L = 20, sec = L + 2, n = N(sec), g = driftL(r, L, [1, 2]);
  // the air itself: a deep, slow rumble under everything
  const o = lp(brown(n, r), 90); const am = new Float32Array(n); for (let i = 0; i < n; i++) am[i] = .7 + .3 * g(i / SR);
  return loopify(mix(n, [mul(o, am), 1], [mul(lp(osc(n, 38, 'tri'), 60), .15), 1]), L, 1.5); }, { loop: 20 });
def('amb_hive', 1, (r) => { const L = 20, sec = L + 2, n = N(sec);
  // the colony living: sap moving in the roots, soft bubbling, slow wet creaks and a deep slow pulse
  const o = new Float32Array(n);
  for (let k = 0; k < 160; k++) bubble(o, r() * sec, 120 + r() * 380, .03 + r() * .06, .05 + r() * .08, .3);
  for (let k = 0; k < 9; k++) { const c = creak(1 + r(), .02, .012, [[160 + r() * 120, 5, 1], [420, 6, .4]], r, .5); addTo(o, mul(c, env(c.length, [[0, 0], [.3, 1], [c.length / SR, 0]])), r() * (sec - 2), .12); }
  const per = L / 12; for (let k = 0; k < 13; k++) addTo(o, thump(r, .7, 62, 44, .18, 0), k * per + .2, .35);   // one beat every 1.67 s, a whole number of beats per loop
  const trickle = mul(bp(pink(n, r), 900, 2), .05);
  return loopify(lp(mix(n, [o, 1], [trickle, 1]), 2500), L, 1.5); }, { loop: 20 });
def('amb_threat', 1, (r) => { const L = 20, sec = L + 2, n = N(sec), g = driftL(r, L, [1, 2]);
  // machines somewhere beyond the hills: engine drones carried on the wind, and the odd far clank
  const e1 = lp(engine(r, L + 1.5, 23, [[80, 3, 1.6], [280, 4, .7]], .1, 0, 0, 0, 110), 400), e2 = lp(engine(r, L + 1.5, 31, [[110, 3, 1.3], [380, 4, .5]], .1, 0, 0, 0, 140), 380);
  const m = Math.min(e1.length, e2.length, n), o = new Float32Array(n), am = new Float32Array(n);
  for (let i = 0; i < n; i++) { const t = i / SR; am[i] = .6 + .4 * g(t); }
  addTo(o, mul(e1.slice(0, m), am), 0, .8); addTo(o, e2.slice(0, m), 0, .5);
  for (let k = 0; k < 6; k++) { const f = 300 + r() * 600; addTo(o, lp(modal(N(.5), [[f, .15, .3], [f * 2.5, .1, .2]], r, .1), 900), 1 + r() * (sec - 3), .4); }
  return loopify(verb(o, .85, .6, .35, 0), L, 1.5); }, { loop: 20 });
def('amb_combat', 1, (r) => { const L = 12, sec = L + 2, n = N(sec);
  // the hive roused: a quicker, tense pulse and agitated chittering
  const o = new Float32Array(n); const per = L / 18;
  for (let k = 0; k < 20; k++) addTo(o, thump(r, .4, 78, 52, .08, 0), k * per, .5);
  for (let k = 0; k < 120; k++) { const at = r() * sec; for (let j = 0; j < 4; j++) click(o, at + j * .015, .1 + r() * .15, 2500 + r() * 2500, 4, r, .0012); }
  const tens = mul(bp(pink(n, r), 600, 3), .15);
  return loopify(lp(mix(n, [o, 1], [tens, 1]), 6000), L, 1); }, { loop: 12 });

// occasional distant sounds, placed at random times by the game
def('far_rumble', 2, (r, v) => { const sec = 4, n = N(sec);
  return verb(mul(lp(brown(n, r), t => 140 + 80 * Math.sin(t)), env(n, [[0, 0], [.8, 1], [2, .6], [sec, 0]])), .8, .6, .3, 1.5); });
def('far_groan', 3, (r, v) => { const sec = 2.4;
  // something huge and organic shifting deep under the ground
  const c = creak(sec, .03 + v * .005, .018, [[110 + v * 25, 6, 1], [260 + v * 30, 7, .5], [520, 8, .2]], r, .4);
  return verb(lp(mul(c, env(c.length, [[0, 0], [.6, 1], [1.6, .6], [sec, 0]])), 800), .85, .6, .4, 1.6); });
def('far_gust', 2, (r) => { const sec = 3.5, n = N(sec);
  return mul(filt(pink(n, r), 'bp', t => 500 + 700 * Math.sin(t / sec * Math.PI), .9), env(n, [[0, 0], [1.4, 1], [sec, 0]], 1.5)); });
def('ice_crack', 2, (r, v) => { const sec = 1.6, n = N(sec);
  const o = modal(n, [[1800 + v * 400, .2, .4], [3300, .15, .3], [520, .5, .3]], r, .05); click(o, 0, .8, 3000, 1, r, .004);
  return verb(lp(o, 6000), .8, .4, .45, 1.2); });
def('far_clank', 2, (r, v) => { const sec = 2, n = N(sec), f = 260 + v * 120;
  return verb(lp(modal(n, [[f, .4, .5], [f * 2.3, .3, .3], [f * 3.9, .2, .2]], r, .05), 1200), .9, .6, .5, 1.4); });

// ---------------- v47 impacts by target material ----------------
// Bark Wall, Great Bark and Ironbark: progressively denser cellulose cracks with more resistance (a woody split, not a knock with a pitch)
def('imp_bark', 3, (r, v) => { const sec = .3, n = N(sec);
  const o = mix(n, [snap(n, r, 1800, .003), .6], [woodCrack(r, .08, 900 + v * 120, 1), .8], [thud(r, sec, 190 + v * 15, 80, .035, .7), .8], [tear(r, .12, 2400, 1.5, 400, .035), .25, .01]);
  addTo(o, rattle(r, sec, 6, 1200, 2600, .015, .1, .3, 2), 0, 1); return lp(o, 8000); });
def('imp_bark_heavy', 3, (r, v) => { const sec = .45, n = N(sec);
  const o = mix(n, [snap(n, r, 1400, .004), .7], [woodCrack(r, .12, 620 + v * 90, 1.3), 1], [thud(r, sec, 140 + v * 10, 55, .06, .8), 1], [body(n, r, 700, .05), .45]);
  addTo(o, rattle(r, sec, 10, 800, 2200, .02, .18, .35, 1.8), 0, 1); return lp(sat(o, 1.2), 7000); });
def('imp_ironbark', 3, (r, v) => { const sec = .4, n = N(sec);
  // Ironbark: bark grown dense and hard, so a hit cracks sharply and is shrugged off
  const o = mix(n, [snap(n, r, 2600, .0025), .9], [woodCrack(r, .07, 1300 + v * 150, 2), .7], [cluster(n, r, 500, 2600, 50, .004, .012, .45), 1], [thud(r, sec, 160 + v * 12, 60, .05, .7), .9]);
  addTo(o, rattle(r, sec, 8, 1500, 3500, .015, .12, .3, 2.5), 0, 1); return lp(sat(o, 1.3), 9000); });
// HDF buildings: a hard structural clang and crunch of concrete and plate
def('imp_struct', 3, (r, v) => { const sec = .5, n = N(sec);
  const o = mix(n, [snap(n, r, 1800, .003), .8], [cluster(n, r, 350 + v * 50, 3800, 80, .006, .025, .8), 1], [thud(r, sec, 130 + v * 10, 50, .05, .8), .8], [body(n, r, 2200, .03, .0005, 'pink'), .45]);
  addTo(o, rattle(r, sec, 16, 600, 3000, .02, .3, .4, 1.4), 0, 1); return verb(lp(o, 9000), .35, .45, .1, .3); });
// rounds striking bare rock: a sharp crack and a scatter of stone chips
def('imp_rock', 3, (r, v) => { const sec = .35, n = N(sec);
  const o = mix(n, [snap(n, r, 3000, .002), .8], [thud(r, sec, 200 + v * 20, 90, .02, .5), .5], [body(n, r, 3200, .01, .0004, 'white'), .3]);
  addTo(o, rattle(r, sec, 12, 2500, 6500, .004, .16, .5, 2.5), 0, 1); return verb(lp(o, 11000), .3, .4, .08, .2); });
// soil: a dull ground thump with a little grit
def('imp_ground', 2, (r, v) => { const sec = .4, n = N(sec);
  const o = mix(n, [thud(r, sec, 120 + v * 15, 45, .05, 1), 1], [body(n, r, 800, .04), .6]);
  addTo(o, rattle(r, sec, 10, 600, 2000, .02, .25, .25, 1.2), 0, 1); return lp(o, 5000); });
// a flame jet licking a growth: a searing hiss and the crackle of tissue scorching
def('imp_burn', 2, (r, v) => { const sec = .5, n = N(sec);
  const o = mix(n, [mul(bp(white(n, r), 3000, .7), env(n, [[0, 0], [.03, .6], [.3, .3], [sec, 0]])), .6], [tear(r, sec, 1200, 1, 120, .2), .4]);
  addTo(o, rattle(r, sec, 14, 1500, 4500, .01, .4, .35, 2), 0, 1); return lp(o, 9000); });

// ---------------- v48 intro cinematic ----------------
// sparse and restrained: a high, thin orbit hum, radio static, the ground's room tone, a distant industrial resonance, soil moving and
// living tissue. Nothing here is a melody or a stinger.
// orbit: a very low, slowly beating hum with faint far radio hiss over it
def('intro_orbit', 1, (r) => { const L = 16, sec = L + 2, n = N(sec), g = driftL(r, L, [1, 2]), h = driftL(r, L, [3, 5]);
  const hum = lp(mix(n, [osc(n, t => 46 * (1 + .004 * g(t))), .5], [osc(n, t => 69.3 * (1 + .003 * h(t))), .22], [lp(brown(n, r), 120), .7]), 260);
  const hiss = mul(bp(white(n, r), 2600, .5), new Float32Array(n).map((_, i) => .12 + .1 * h(i / SR)));
  return loopify(mix(n, [hum, 1], [hiss, .35]), L, 2); }, { loop: 16 });
// a short burst of radio static under a line of radio traffic
def('intro_static', 2, (r, v) => { const sec = 1.4, n = N(sec);
  const st = mul(bp(white(n, r), 1900 + v * 300, .7), env(n, [[0, 0], [.03, .7], [.5, .35], [1.1, .25], [sec, 0]]));
  const crk = grains(n, 40, sec * .9, (d, at, r) => click(d, at, .2 + r() * .5, 2500 + r() * 2500, 2, r, .002), r);
  return mix(n, [st, .7], [crk, .5]); });
// beneath the soil: a close, muffled room tone of earth: deep pressure, faint trickles of grit, slow settling
def('intro_under', 1, (r) => { const L = 16, sec = L + 2, n = N(sec), g = driftL(r, L, [1, 3]);
  const deep = mul(lp(brown(n, r), 75), new Float32Array(n).map((_, i) => .65 + .35 * g(i / SR)));
  const grit = grains(n, 70, sec, (d, at, r) => click(d, at, .05 + r() * .12, 700 + r() * 900, 2.5, r, .004 + r() * .01), r);
  return loopify(mix(n, [deep, 1.2], [lp(grit, 2200), .6], [lp(pink(n, r), 300), .12]), L, 2); }, { loop: 16 });
// far away, through the rock: a heavy industrial resonance that swells and passes (a drill, perhaps; never named)
def('intro_drill', 1, (r) => { const sec = 6.5, n = N(sec), g = driftL(r, sec, [3, 5]);
  const thr = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR; thr[i] = Math.max(0, Math.sin(t * 2 * Math.PI * 7.3)) ** 3; }
  const body = mul(lp(brown(n, r), 110), thr);
  const tone = lp(mix(n, [osc(n, t => 31 * (1 + .01 * g(t))), .5], [osc(n, 62.4), .18]), 140);
  const sw = env(n, [[0, 0], [1.6, .6], [3.2, 1], [4.8, .55], [sec, 0]]);
  return mul(mix(n, [body, 1.4], [tone, .8], [mul(bp(pink(n, r), 180, 1.2), thr), .5]), sw); });
// living tissue: one slow, soft pulse of fluid through a membrane (a muffled push and release, no pitch)
def('intro_pulse', 2, (r, v) => { const sec = 1.8, n = N(sec);
  const push = mul(lp(brown(n, r), 160), env(n, [[0, 0], [.18, 1], [.45, .35], [.6, .55], [1.1, .1], [sec, 0]]));
  const wet = mul(filt(pink(n, r), 'bp', t => 260 + 160 * Math.exp(-t * 3), 1.4), env(n, [[0, 0], [.2, .5], [.7, .1], [sec, 0]]));
  return lp(mix(n, [push, 1.3], [wet, .35 + v * .1]), 900); });
// soil shifting and lifting: a slow grind of grit and small stones turning over
def('intro_soil', 2, (r, v) => { const sec = 3.2, n = N(sec);
  const grind = mul(lp(brown(n, r), 260), env(n, [[0, 0], [.6, .8], [2.2, .6], [sec, 0]]));
  const stones = grains(n, 60 + v * 20, sec * .9, (d, at, r) => click(d, at, .15 + r() * .5, 500 + r() * 1400, 2, r, .004 + r() * .012), r);
  const fall = grains(n, 120, sec, (d, at, r) => click(d, at, .04 + r() * .1, 2500 + r() * 3000, 2, r, .002), r);
  return mix(n, [grind, 1], [stones, .7], [lp(fall, 6000), .35]); });
// the first Bloom opening: wet tissue unfolding, a long soft fibrous creak and a breath of air as the petals part
def('intro_bloom', 1, (r) => { const sec = 4.5, n = N(sec);
  const unfold = mul(filt(pink(n, r), 'bp', t => 300 + 500 * Math.min(1, t / 3), 1.6), env(n, [[0, 0], [1, .5], [2.6, .8], [3.6, .3], [sec, 0]]));
  const fib = grains(n, 90, sec * .85, (d, at, r) => click(d, at, .05 + r() * .2, 600 + r() * 900, 3, r, .003 + r() * .008), r, .4);
  const air = mul(lp(hp(white(n, r), 900), 3500), env(n, [[0, 0], [2.4, 0], [3, .25], [sec, 0]]));
  return mix(n, [unfold, 1], [fib, .6], [air, .4], [mul(lp(brown(n, r), 90), env(n, [[0, 0], [1.5, .6], [sec, 0]])), .7]); });

// ---------------- v49 intro, second pass ----------------
// the first real response after the long sleep: one deep, slow organic pulse; a soft low push through dense tissue with a damp after-swell
def('intro_wake', 1, (r) => { const sec = 3.6, n = N(sec);
  const push = mul(lp(brown(n, r), t => 70 + 50 * Math.exp(-t * 2)), env(n, [[0, 0], [.32, 1], [.8, .45], [1.15, .62], [2.2, .12], [sec, 0]]));
  const low = mul(osc(n, t => 38 - 6 * Math.min(1, t / 1.5)), env(n, [[0, 0], [.35, .55], [1.4, .25], [sec, 0]]));
  const wet = mul(filt(pink(n, r), 'bp', t => 220 + 120 * Math.exp(-t * 2.5), 1.2), env(n, [[0, 0], [.4, .35], [1.2, .12], [sec, 0]]));
  return lp(mix(n, [push, 1.4], [lp(low, 120), .8], [wet, .3]), 700); });
// nutrients moving upward along a root: a slow rising breath of fluid through a long channel, no pitch, no whoosh
def('intro_rise', 1, (r) => { const sec = 3.8, n = N(sec);
  const flow = mul(filt(pink(n, r), 'bp', t => 180 + 420 * Math.min(1, t / 3), 1.3), env(n, [[0, 0], [1.2, .5], [2.8, .8], [3.4, .3], [sec, 0]]));
  const gl = grains(n, 50, sec * .9, (d, at, r) => click(d, at, .04 + r() * .1, 400 + r() * 500, 4, r, .006 + r() * .01), r, .3);
  return mix(n, [flow, 1], [lp(gl, 1800), .5], [mul(lp(brown(n, r), 90), env(n, [[0, 0], [1.6, .5], [sec, 0]])), .6]); });
// the organism awake: a low, living room tone that slowly breathes under the soil (builds in as it wakes)
def('intro_life', 1, (r) => { const L = 16, sec = L + 2, n = N(sec), g = driftL(r, L, [1, 2]), h = driftL(r, L, [2, 4]);
  const breath = mul(lp(brown(n, r), 140), new Float32Array(n).map((_, i) => { const t = i / SR; return .45 + .35 * Math.max(0, Math.sin(t * 2 * Math.PI / 4)) ** 2 + .2 * g(t); }));
  const tone = lp(mix(n, [osc(n, t => 41 * (1 + .006 * h(t))), .3], [osc(n, t => 61.7 * (1 + .005 * g(t))), .12]), 160);
  const wet = mul(filt(pink(n, r), 'bp', 320, 1.5), new Float32Array(n).map((_, i) => .08 + .06 * h(i / SR)));
  return loopify(mix(n, [breath, 1], [tone, .8], [wet, .5]), L, 2); }, { loop: 16 });

// ---------------- v58 title screen ----------------
// a heartbeat for the title screen's pulse: a deep "lub" and a lighter "dub" a third of a second later, felt more than heard, damp and fleshy
def('title_heart', 2, (r, v) => { const sec = 1.3, n = N(sec);
  const beat = (at, f0, f1, tau, g) => { const m = N(sec), b = mul(osc(m, t => t < at ? 0 : f1 + (f0 - f1) * Math.exp(-(t - at) / (tau * .45))), ad(m, .006, tau, at));
    const bd = mul(lp(brown(m, r), 130), ad(m, .004, tau * .8, at)); return mix(m, [b, g], [bd, g * .9]); };
  const wet = mul(filt(pink(n, r), 'bp', 240 + v * 30, 1.6), mix(n, [ad(n, .01, .08), .5], [ad(n, .01, .06, .3), .35]));
  return lp(mix(n, [beat(0, 62, 40, .16, 1), 1], [beat(.3, 74, 48, .11, .72), 1], [wet, .25]), 420); });
// the vines that cover the title screen: soil splitting, then a rising mass of wet fibrous creaks, rustles and squelches as the growth
// closes over the screen (about 5 s), a deep settle when it meets, and at 5.6 s the tear and breath of the vines parting onto the menu
def('title_vines', 1, (r) => { const sec = 7.4, n = N(sec);
  const rise = env(n, [[0, .15], [1.2, .45], [3.4, .8], [4.9, 1], [5.4, .5], [sec, 0]]);
  const soil = grains(n, 70, 1.4, (d, at, r) => click(d, at, .2 + r() * .6, 400 + r() * 1200, 2, r, .004 + r() * .012), r);
  const rustle = mul(filt(pink(n, r), 'bp', t => 500 + 900 * Math.min(1, t / 4.6), 1.1), mul(rise, new Float32Array(n).map((_, i) => .35 + .3 * Math.abs(Math.sin(i / SR * 6.1)) * Math.abs(Math.sin(i / SR * 2.3 + 1)))));
  const creaks = new Float32Array(n);
  for (let k = 0; k < 16; k++) { const at = .3 + r() * 4.4, len = .35 + r() * .7, f = 180 + r() * 380;
    const c = mul(creak(len, .006 + r() * .01, .002 + r() * .004, [[f, 4, 1], [f * 2.4, 5, .45], [f * 5.1, 6, .15]], r, .4), env(N(len), [[0, 0], [len * .3, 1], [len, 0]]));
    addTo(creaks, c, at, .5 + r() * .5); }
  const sq = new Float32Array(n); for (let k = 0; k < 9; k++) addTo(sq, squelch(r, .5, 300 + r() * 200, 700 + r() * 400, 250, 5, 3), .5 + r() * 4.2, .25 + r() * .25);
  const groan = mul(lp(brown(n, r), t => 60 + 90 * Math.min(1, t / 4.8)), env(n, [[0, 0], [2, .4], [4.8, 1], [5.3, .6], [6, 0], [sec, 0]]));
  const meet = mul(osc(n, t => t < 4.85 ? 0 : 34 + 20 * Math.exp(-(t - 4.85) * 6)), ad(n, .01, .45, 4.85));
  const tear = mul(filt(white(n, r), 'bp', t => 900 + 1400 * Math.min(1, Math.max(0, t - 5.6) / .7), 1.3), env(n, [[0, 0], [5.55, 0], [5.75, .7], [6.4, .25], [7.1, 0], [sec, 0]]));
  const fib = grains(n, 80, .9, (d, at, r) => click(d, at, .1 + r() * .35, 700 + r() * 1300, 3, r, .003 + r() * .008), r, 5.55);
  const air = mul(lp(hp(white(n, r), 700), 3200), env(n, [[0, 0], [5.6, 0], [6.2, .35], [sec, 0]]));
  return verb(mix(n, [soil, .7], [rustle, .55], [creaks, .8], [sq, .8], [groan, 1.2], [lp(meet, 120), 1.1], [tear, 4], [fib, 3], [air, 3]), .5, .4, .18, .8); });

module.exports = S;
