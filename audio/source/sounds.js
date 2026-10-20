// Last Colony v46 sound recipes. Each entry makes one sound (or several variations) from the DSP toolkit; make.js writes and encodes them.
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
def('org_hit', 4, (r, v) => { const sec = .32, n = N(sec);
  // a round striking living tissue: a wet slap and a short tear of fibres
  const slap = mul(bp(white(n, r), 650 + v * 120, 1.2), ad(n, .001, .03));
  const o = mix(n, [slap, 1], [thump(r, sec, 140, 70, .05, .2), .7], [fibre(r, .14, 6, 1500, 4), .35, .015]);
  bubble(o, .02 + r() * .03, 300 + r() * 200, .02, .3); return lp(o, 5200); });

def('org_burst', 3, (r, v) => { const sec = 1.6, n = N(sec);
  // a growth bursting: a deep wet rupture, tearing fibres, then sap spattering down
  const rup = mul(lp(brown(n, r), t => 1800 * Math.exp(-t / .25) + 160), ad(n, .004, .3));
  const tear = mul(creak(.5, .004, .009, [[700, 3, 1], [1600, 4, .5]], r, .6), env(N(.5), [[0, 1], [.5, 0]]));
  const o = mix(n, [rup, 1.1], [thump(r, sec, 95 + v * 10, 38, .22, .2), .9], [tear, .3, .02]);
  for (let k = 0; k < 18; k++) { const at = .1 + r() * 1.1; bubble(o, at, 250 + r() * 700, .01 + r() * .02, .12 + r() * .12, 1.2); click(o, at, .08, 2500 + r() * 2000, 2, r); }
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
def('thorn_spit', 3, (r, v) => { const sec = .3, n = N(sec);
  // Thorn Spitter: a hard wet spit and the thorn's whistle away
  const o = new Float32Array(n); click(o, 0, .9, 1900 + v * 200, 1.5, r, .004);
  const pth = mul(filt(white(n, r), 'bp', t => 3200 - 1800 * t / .12, 2), ad(n, .001, .04));
  addTo(o, pth, .002, .7); addTo(o, thump(r, .2, 220 + v * 20, 120, .03, .2), 0, .5); bubble(o, .01, 650 + v * 80, .012, .3);
  return verb(o, .35, .5, .12, .25); });
def('flak_puff', 2, (r, v) => { const sec = .5, n = N(sec);
  // Spore Flak: a pressurised pod popping and a hiss of spores
  const pop = thump(r, .3, 260, 90, .03, .6);
  const hiss = mul(filt(white(n, r), 'bp', t => 4200 - 1600 * t / sec, 1), ad(n, .004, .1));
  return verb(mix(n, [pop, .9], [hiss, .5, .006]), .45, .45, .2, .4); });
def('mortar_launch', 2, (r, v) => { const sec = .8, n = N(sec);
  // Seed Mortar: a deep hollow pod-gun thoomp
  const o = mix(n, [thump(r, sec, 140 + v * 10, 42, .12, .3), 1], [mul(lp(brown(n, r), 600), ad(n, .002, .09)), .7]);
  bubble(o, .03, 210, .05, .3, .2); return verb(lp(o, 2500), .6, .5, .3, .7); });
def('seed_burst', 3, (r, v) => { const sec = 1.0, n = N(sec);
  // a seed shell landing and bursting: a heavy splat and a spray
  const o = mix(n, [mul(lp(brown(n, r), t => 2500 * Math.exp(-t / .1) + 200), ad(n, .002, .14)), 1], [thump(r, sec, 110, 45, .12, .3), .8]);
  for (let k = 0; k < 14; k++) { bubble(o, .02 + r() * .5, 300 + r() * 800, .012, .14, 1); click(o, .02 + r() * .5, .06, 3000 + r() * 2000, 2, r); }
  return verb(lp(o, 6000), .6, .4, .25, .7); });
def('lance', 2, (r, v) => { const sec = .7, n = N(sec);
  // Sunlance: stored light let go: a bright, glassy surge with a sizzle
  const e = env(n, [[0, 0], [.015, 1], [.12, .5], [sec, 0]], 1.5);
  const tone = mix(n, [osc(n, t => 880 - 300 * t), .4], [osc(n, t => 1320 - 420 * t), .25], [osc(n, t => 2210 - 600 * t), .12]);
  const siz = mul(hp(white(n, r), 3500), env(n, [[0, 0], [.01, .5], [.2, .15], [sec, 0]]));
  return verb(mix(n, [mul(tone, e), .6], [siz, .3]), .6, .3, .3, .7); });

// ---------------- ants ----------------
def('ant_scuttle', 1, (r) => { const L = 3, sec = L + 1, n = N(sec);
  // many small legs on soil: clustered chitin ticks over a soft rustle (one bed for the whole swarm, scaled by how many are moving)
  const o = new Float32Array(n); let t = 0; while (t < sec) { const burst = 2 + Math.floor(r() * 4); for (let k = 0; k < burst; k++) click(o, t + k * (.012 + r() * .01), .25 + r() * .5, 3200 + r() * 3500, 4, r, .0012); t += .03 + r() * .07; }
  const rust = mul(bp(pink(n, r), 2400, .7), .12); return loopify(mix(n, [o, 1], [rust, 1]), L, .5); }, { loop: 3 });
def('mite_fire', 3, (r, v) => { const sec = .16, n = N(sec), o = new Float32Array(n);
  // Mite Ant: a tiny sharp spit
  click(o, 0, .8, 3600 + v * 400, 2, r, .002); addTo(o, mul(filt(white(n, r), 'bp', t => 5000 - 2500 * t / .06, 2), ad(n, .001, .02)), 0, .5); bubble(o, .004, 1100 + v * 120, .008, .3);
  return verb(o, .2, .5, .08, .15); });
def('thornback_fire', 3, (r, v) => { const sec = .24, n = N(sec), o = new Float32Array(n);
  click(o, 0, .9, 2600 + v * 300, 1.6, r, .003); addTo(o, mul(filt(white(n, r), 'bp', t => 4200 - 2400 * t / .1, 2), ad(n, .001, .03)), 0, .6);
  addTo(o, thump(r, .15, 320, 170, .02, .2), 0, .4); bubble(o, .006, 800 + v * 90, .01, .3); return verb(o, .3, .5, .1, .2); });
def('bulwark_fire', 2, (r, v) => { const sec = .7, n = N(sec);
  // Bulwark Ant: an acid seed lobbed from the pod: a thick gloop
  const o = mix(n, [thump(r, sec, 170 + v * 15, 70, .07, .25), 1], [squelch(r, .35, 260, 900, 300, 5, 6, [180, 500]), .6, .01]);
  return verb(lp(o, 3500), .45, .5, .2, .4); });
def('ant_hit', 4, (r, v) => { const sec = .14, n = N(sec);
  // a hit on chitin: a hard little tick and crunch
  const o = modal(n, [[2100 + v * 250, .025, .5], [3900 + v * 300, .015, .3], [5600, .01, .2]], r, .1); click(o, 0, .6, 3000, 1.5, r, .002);
  addTo(o, fibre(r, .08, 5, 2600, 3), .005, .4); return o; });
def('ant_die', 3, (r, v) => { const sec = .9, n = N(sec);
  // an ant killed: a chitin crunch, a soft wet pop, sap fizzing out
  const crunch = grains(N(.12), 22, .09, (o, at, r) => click(o, at, .3 + r() * .7, 1800 + r() * 3000, 3, r, .0015), r);
  const o = mix(n, [crunch, .9], [thump(r, sec, 200 + v * 20, 90, .05, .25), .6, .02]);
  for (let k = 0; k < 12; k++) bubble(o, .06 + r() * .5, 600 + r() * 900, .008 + r() * .01, .12, 1.4);
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
function gun(r, sec, crackF, body, clack, tail, room) { const n = N(sec);
  const crack = mul(hp(white(n, r), crackF), ad(n, .0004, .012));
  const blast = mul(lp(white(n, r), 2600), ad(n, .0008, .035));
  const o = mix(n, [crack, .8], [blast, .9], [mul(osc(n, t => body[1] + (body[0] - body[1]) * Math.exp(-t / .02)), ad(n, .001, body[2])), 1]);
  if (clack) addTo(o, modal(N(.15), [[clack, .04, .4], [clack * 2.31, .03, .25], [clack * 3.9, .02, .15]], r, .05), .035, .5);
  return verb(lp(sat(o, 2.2), 9000), room, .45, tail, .6); }
def('gun_scout', 3, (r, v) => gun(r, .6, 1800, [150 + v * 10, 60, .06], 1900 + v * 120, .2, .4));
def('gun_mg', 3, (r, v) => gun(r, .4, 2400, [190 + v * 10, 90, .03], 2600 + v * 150, .14, .3));
def('gun_jet', 2, (r, v) => { const sec = .5, n = N(sec), o = new Float32Array(n);
  // Interceptor cannon: a short ripping burst
  for (let k = 0; k < 4; k++) addTo(o, gun(r, .2, 2800, [230, 120, .015], 0, .05, .2), k * .045, .7); return verb(o, .4, .4, .15, .4); });
def('cannon', 2, (r, v) => { const sec = 1.6, n = N(sec);
  // Siege Tank and Hail Cannon: a heavy gun, a deep boom and a long outdoor tail
  const o = mix(n, [gun(r, 1.0, 900, [90 + v * 8, 35, .18], 900, .3, .7), 1], [mul(lp(brown(n, r), t => 900 * Math.exp(-t / .3) + 80), ad(n, .002, .4)), .8]);
  return lp(o, 7000); });
def('flame', 3, (r, v) => { const sec = .55, n = N(sec);
  // Flame Tank: a burst of burning fuel, roaring with ragged flutter
  const fl = new Float32Array(n); let a = 0; for (let i = 0; i < n; i++) { if (i % 220 === 0) a = .5 + r() * .5; fl[i] = a; }
  const roar = mul(mul(lp(mix(n, [brown(n, r), 1], [pink(n, r), .6]), 1400), lp1(fl, 40)), env(n, [[0, 0], [.04, 1], [.35, .8], [sec, 0]]));
  const hiss = mul(bp(white(n, r), 3500, .8), env(n, [[0, 0], [.03, .5], [.3, .3], [sec, 0]]));
  return mix(n, [sat(roar, 1.4), 1], [hiss, .25]); });
def('zap', 2, (r, v) => { const sec = .5, n = N(sec);
  // Lancer: an electric discharge, a rising whine snapping into a crackling buzz
  const w = mul(osc(n, t => 600 + 3000 * Math.min(1, t / .08), 'saw'), env(n, [[0, 0], [.08, .5], [.09, 0], [sec, 0]]));
  const buzz = mul(mul(hp(white(n, r), 1500), osc(n, 120, 'sq')), env(n, [[0, 0], [.08, 0], [.09, 1], [.3, .2], [sec, 0]]));
  return verb(lp(mix(n, [w, .3], [buzz, .6]), 9000), .5, .3, .2, .4); });
def('flak_gun', 2, (r, v) => gun(r, .9, 1300, [120, 50, .1], 1200, .3, .6));
def('shell_boom', 3, (r, v) => { const sec = 2.2, n = N(sec);
  // a shell or bomb exploding: a crack, a deep boom, falling dirt
  const o = mix(n, [mul(hp(white(n, r), 1200), ad(n, .0005, .02)), .6], [mul(lp(brown(n, r), t => 3000 * Math.exp(-t / .15) + 120), ad(n, .002, .45)), 1.3],
    [mul(osc(n, t => 30 + 40 * Math.exp(-t / .08)), ad(n, .003, .45)), 1]);
  for (let k = 0; k < 30; k++) click(o, .1 + r() * 1.2, .05 + r() * .08, 600 + r() * 2500, 1.5, r, .004);
  return verb(lp(sat(o, 1.6), 6500), .75, .5, .3, 1.4); });
def('metal_hit', 4, (r, v) => { const sec = .35, n = N(sec), f = 900 + v * 230;
  // a thorn or seed striking a hull: a dull clank with an inharmonic ring
  const o = modal(n, [[f, .09, .6], [f * 2.76, .06, .35], [f * 5.4, .035, .2], [f * 8.9, .02, .1]], r, .04);
  click(o, 0, .7, 2500, 1, r, .003); addTo(o, thump(r, .15, 180, 90, .02, .4), 0, .4); return verb(o, .3, .4, .1, .2); });
def('metal_heavy', 2, (r, v) => { const sec = .7, n = N(sec), f = 300 + v * 90;
  const o = modal(n, [[f, .25, .6], [f * 2.32, .16, .4], [f * 4.25, .1, .25], [f * 6.8, .06, .12]], r, .05);
  click(o, 0, .8, 1500, 1, r, .005); addTo(o, thump(r, .3, 120, 55, .06, .4), 0, .6); return verb(o, .4, .4, .15, .4); });
def('veh_explode', 3, (r, v) => { const sec = 2.6, n = N(sec);
  // a vehicle destroyed: a blast, a metallic crash, fuel whoomph and debris rattling down
  const o = mix(n, [mul(lp(brown(n, r), t => 3500 * Math.exp(-t / .18) + 150), ad(n, .002, .5)), 1.3], [mul(osc(n, t => 32 + 50 * Math.exp(-t / .07)), ad(n, .002, .5)), .9],
    [mul(hp(white(n, r), 1500), ad(n, .0005, .03)), .5]);
  for (let k = 0; k < 16; k++) { const f = 700 + r() * 3000; addTo(o, modal(N(.25), [[f, .05, .3], [f * 2.4, .03, .2]], r, .1), .15 + r() * 1.3, .2 + r() * .3); }
  return verb(lp(sat(o, 1.7), 7000), .8, .5, .3, 1.5); });
def('ram_blast', 1, (r) => { const sec = 1.8, n = N(sec);
  // Rammer Drone detonating against a growth: sharper and drier than a tank going up
  const o = mix(n, [mul(hp(white(n, r), 900), ad(n, .0005, .04)), .8], [mul(lp(brown(n, r), t => 4000 * Math.exp(-t / .1) + 150), ad(n, .002, .3)), 1.2], [mul(osc(n, t => 40 + 60 * Math.exp(-t / .05)), ad(n, .002, .3)), .8]);
  return verb(lp(sat(o, 2), 8000), .7, .5, .28, 1.1); });
def('struct_fall', 2, (r, v) => { const sec = 2.4, n = N(sec);
  // a human building collapsing: metal groaning and crashing down
  const groan = mul(creak(1.2, .012, .02, [[140, 5, 1], [360, 6, .5], [900, 7, .2]], r, .3), env(N(1.2), [[0, 0], [.2, 1], [1.2, 0]]));
  const o = mix(n, [groan, .5], [mul(lp(brown(n, r), t => 2000 * Math.exp(-(t - .3) / .3) + 150), ad(n, .01, .6, .3)), 1.1]);
  for (let k = 0; k < 18; k++) { const f = 400 + r() * 2200; addTo(o, modal(N(.3), [[f, .08, .3], [f * 2.7, .05, .2]], r, .1), .3 + r() * 1.5, .2 + r() * .3); }
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

module.exports = S;
