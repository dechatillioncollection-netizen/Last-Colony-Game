// Small DSP toolkit for making Last Colony's sound effects offline. Everything is deterministic (seeded).
'use strict';
const SR = 44100;
function rng(seed) { let s = (seed * 2654435761) >>> 0 || 1; return () => { s ^= s << 13; s >>>= 0; s ^= s >>> 17; s ^= s << 5; s >>>= 0; return s / 4294967296; }; }
const N = sec => Math.max(1, Math.round(sec * SR));
const buf = sec => new Float32Array(N(sec));
const lerp = (a, b, k) => a + (b - a) * k;
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
const db = d => Math.pow(10, d / 20);

// ---- noise
function white(n, r) { const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = r() * 2 - 1; return o; }
function pink(n, r) { const o = new Float32Array(n); let b0 = 0, b1 = 0, b2 = 0, b3 = 0, b4 = 0, b5 = 0, b6 = 0;
  for (let i = 0; i < n; i++) { const w = r() * 2 - 1; b0 = .99886 * b0 + w * .0555179; b1 = .99332 * b1 + w * .0750759; b2 = .969 * b2 + w * .153852;
    b3 = .8665 * b3 + w * .3104856; b4 = .55 * b4 + w * .5329522; b5 = -.7616 * b5 - w * .016898; o[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + w * .5362) * .11; b6 = w * .115926; }
  return o; }
function brown(n, r) { const o = new Float32Array(n); let v = 0; for (let i = 0; i < n; i++) { v = v * .996 + (r() * 2 - 1) * .06; o[i] = v * 3.2; } return o; }

// ---- filters. f and q may be numbers or functions of time in seconds (updated every 16 samples)
function coef(type, f, q, g) {
  f = clamp(f, 10, SR * .45); const w = 2 * Math.PI * f / SR, cs = Math.cos(w), sn = Math.sin(w), a = sn / (2 * q), A = Math.pow(10, (g || 0) / 40);
  let b0, b1, b2, a0, a1, a2;
  switch (type) {
    case 'lp': b0 = (1 - cs) / 2; b1 = 1 - cs; b2 = b0; a0 = 1 + a; a1 = -2 * cs; a2 = 1 - a; break;
    case 'hp': b0 = (1 + cs) / 2; b1 = -(1 + cs); b2 = b0; a0 = 1 + a; a1 = -2 * cs; a2 = 1 - a; break;
    case 'bp': b0 = a; b1 = 0; b2 = -a; a0 = 1 + a; a1 = -2 * cs; a2 = 1 - a; break;
    case 'peak': b0 = 1 + a * A; b1 = -2 * cs; b2 = 1 - a * A; a0 = 1 + a / A; a1 = -2 * cs; a2 = 1 - a / A; break;
    case 'notch': b0 = 1; b1 = -2 * cs; b2 = 1; a0 = 1 + a; a1 = -2 * cs; a2 = 1 - a; break;
    case 'ls': { const s = 2 * Math.sqrt(A) * a; b0 = A * ((A + 1) - (A - 1) * cs + s); b1 = 2 * A * ((A - 1) - (A + 1) * cs); b2 = A * ((A + 1) - (A - 1) * cs - s);
      a0 = (A + 1) + (A - 1) * cs + s; a1 = -2 * ((A - 1) + (A + 1) * cs); a2 = (A + 1) + (A - 1) * cs - s; break; }
    case 'hs': { const s = 2 * Math.sqrt(A) * a; b0 = A * ((A + 1) + (A - 1) * cs + s); b1 = -2 * A * ((A - 1) + (A + 1) * cs); b2 = A * ((A + 1) + (A - 1) * cs - s);
      a0 = (A + 1) - (A - 1) * cs + s; a1 = 2 * ((A - 1) - (A + 1) * cs); a2 = (A + 1) - (A - 1) * cs - s; break; }
  }
  return [b0 / a0, b1 / a0, b2 / a0, a1 / a0, a2 / a0];
}
function filt(x, type, f, q = .707, g = 0) {
  const o = new Float32Array(x.length), fv = typeof f === 'function', qv = typeof q === 'function';
  let c = coef(type, fv ? f(0) : f, qv ? q(0) : q, g), x1 = 0, x2 = 0, y1 = 0, y2 = 0;
  for (let i = 0; i < x.length; i++) {
    if ((fv || qv) && (i & 15) === 0) c = coef(type, fv ? f(i / SR) : f, qv ? q(i / SR) : q, g);
    const y = c[0] * x[i] + c[1] * x1 + c[2] * x2 - c[3] * y1 - c[4] * y2; x2 = x1; x1 = x[i]; y2 = y1; y1 = y; o[i] = y;
  }
  return o;
}
const lp = (x, f, q) => filt(x, 'lp', f, q || .707), hp = (x, f, q) => filt(x, 'hp', f, q || .707), bp = (x, f, q) => filt(x, 'bp', f, q || 1);
function lp1(x, f) { const o = new Float32Array(x.length), a = Math.exp(-2 * Math.PI * f / SR); let y = 0; for (let i = 0; i < x.length; i++) { y = x[i] + (y - x[i]) * a; o[i] = y; } return o; }
function hp1(x, f) { const l = lp1(x, f); const o = new Float32Array(x.length); for (let i = 0; i < x.length; i++) o[i] = x[i] - l[i]; return o; }

// ---- envelopes and arithmetic
// points: [[t,v],...] piecewise linear; or exponential-ish when curve>1 (applied per segment)
function env(n, pts, curve = 1) { const o = new Float32Array(n); let k = 0;
  for (let i = 0; i < n; i++) { const t = i / SR; while (k < pts.length - 2 && t > pts[k + 1][0]) k++;
    const [t0, v0] = pts[k], [t1, v1] = pts[Math.min(k + 1, pts.length - 1)]; let u = t1 > t0 ? clamp((t - t0) / (t1 - t0), 0, 1) : 1; if (curve !== 1) u = v1 < v0 ? 1 - Math.pow(1 - u, curve) : Math.pow(u, curve); o[i] = lerp(v0, v1, u); }
  return o; }
// fast attack, exponential decay
function ad(n, att, tau, delay = 0) { const o = new Float32Array(n); for (let i = 0; i < n; i++) { const t = i / SR - delay; o[i] = t < 0 ? 0 : t < att ? t / att : Math.exp(-(t - att) / tau); } return o; }
function mul(a, b) { const o = new Float32Array(a.length); for (let i = 0; i < a.length; i++) o[i] = a[i] * (typeof b === 'number' ? b : (b[i] || 0)); return o; }
function addTo(dst, src, at = 0, g = 1) { const s = Math.round(at * SR); for (let i = 0; i < src.length && s + i < dst.length; i++) if (s + i >= 0) dst[s + i] += src[i] * g; return dst; }
function mix(n, ...parts) { const o = new Float32Array(n); for (const [s, g, at] of parts) addTo(o, s, at || 0, g == null ? 1 : g); return o; }
function sat(x, drive = 1) { const o = new Float32Array(x.length), k = Math.tanh(drive); for (let i = 0; i < x.length; i++) o[i] = Math.tanh(x[i] * drive) / k; return o; }
function peak(x) { let m = 0; for (let i = 0; i < x.length; i++) { const a = Math.abs(x[i]); if (a > m) m = a; } return m; }
function rms(x) { let s = 0; for (let i = 0; i < x.length; i++) s += x[i] * x[i]; return Math.sqrt(s / x.length); }
function norm(x, p = .89) { const m = peak(x) || 1; return mul(x, p / m); }
function normRms(x, r) { const m = rms(x) || 1; return mul(x, r / m); }
function fade(x, fin = .002, fout = .01) { const o = Float32Array.from(x), a = N(fin), b = N(fout);
  for (let i = 0; i < a && i < o.length; i++) o[i] *= i / a; for (let i = 0; i < b && i < o.length; i++) o[o.length - 1 - i] *= i / b; return o; }
function trim(x, sec) { return x.slice(0, N(sec)); }
function rev(x) { return Float32Array.from(x).reverse(); }
function delay(x, sec, fb = 0, wet = 1) { const d = N(sec), o = Float32Array.from(x); for (let i = d; i < o.length; i++) o[i] += o[i - d] * fb + (fb ? 0 : x[i - d] * wet); return o; }

// ---- oscillators: f is a number or a function of time; shape sine|saw|tri|sq
function osc(n, f, shape = 'sine', ph = 0) { const o = new Float32Array(n), fv = typeof f === 'function'; let p = ph;
  for (let i = 0; i < n; i++) { const fr = fv ? f(i / SR) : f; p += fr / SR; p -= Math.floor(p);
    o[i] = shape === 'sine' ? Math.sin(2 * Math.PI * p) : shape === 'saw' ? 2 * p - 1 : shape === 'tri' ? 1 - 4 * Math.abs(p - .5) : p < .5 ? 1 : -1; }
  return o; }
// modal resonator bank: modes [[freq, decay(s), amp]] struck at t=0 (a sum of decaying sines, as a metal or wooden body rings)
function modal(n, modes, r, jit = 0) { const o = new Float32Array(n);
  for (const [f, d, a] of modes) { const fr = f * (1 + (r ? (r() - .5) * jit : 0)), ph = r ? r() * 6.283 : 0, w = 2 * Math.PI * fr / SR, k = Math.exp(-1 / (d * SR));
    let g = a; for (let i = 0; i < n; i++) { o[i] += Math.sin(w * i + ph) * g; g *= k; if (g < 1e-5) break; } }
  return o; }
// one gas bubble in liquid (a Minnaert resonance): the pitch rises as the bubble moves up while it rings down
function bubble(dst, at, f0, tau, amp, rise = .6) { const s = Math.round(at * SR), L = Math.min(N(tau * 6), dst.length - s); let p = 0;
  for (let i = 0; i < L; i++) { if (s + i < 0) continue; const t = i / SR, f = f0 * (1 + rise * t / tau * .35); p += f / SR; const e = Math.min(1, t * 4000) * Math.exp(-t / tau); dst[s + i] += Math.sin(2 * Math.PI * p) * e * amp; } }
// a sharp click: a few samples of noise through a band
function click(dst, at, amp, f, q, r, len = .003) { const c = bp(white(N(len + .02), r), f, q); const e = ad(c.length, .0002, len); addTo(dst, mul(c, e), at, amp); }
// stick-slip creak: impulses whose spacing slides from p0 to p1 seconds, rung through body resonances
function creak(sec, p0, p1, bodies, r, jit = .25) { const n = N(sec), x = new Float32Array(n); let t = 0;
  while (t < sec) { const k = t / sec, per = lerp(p0, p1, k) * (1 + (r() - .5) * jit); const i = Math.round(t * SR); if (i < n) x[i] += (.6 + r() * .4) * (r() < .5 ? 1 : -1); t += per; }
  let o = new Float32Array(n); for (const [f, q, g] of bodies) addTo(o, bp(x, f, q), 0, g); return o; }
// scatter grains over a span: fn(dst, at, r) is called count times
function grains(n, count, span, fn, r, at0 = 0) { const o = new Float32Array(n); for (let k = 0; k < count; k++) fn(o, at0 + r() * span, r, k); return o; }

// ---- reverb (Freeverb-style), mono in, mono out, with tail
function verb(x, room = .7, damp = .35, wet = .3, tail = 1.2, pre = .012) {
  const n = x.length + N(tail), inp = new Float32Array(n); inp.set(x);
  const combs = [1116, 1188, 1277, 1356, 1422, 1491, 1557, 1617].map(l => ({ b: new Float32Array(l), i: 0, f: 0 })), aps = [556, 441, 341, 225].map(l => ({ b: new Float32Array(l), i: 0 }));
  const fb = .7 + room * .28, d1 = damp, d2 = 1 - damp, pd = N(pre); const o = new Float32Array(n);
  for (let i = 0; i < n; i++) { const xi = (i >= pd ? inp[i - pd] : 0) * .015; let s = 0;
    for (const c of combs) { const y = c.b[c.i]; c.f = y * d2 + c.f * d1; c.b[c.i] = xi + c.f * fb; c.i = (c.i + 1) % c.b.length; s += y; }
    for (const a of aps) { const y = a.b[a.i]; a.b[a.i] = s + y * .5; a.i = (a.i + 1) % a.b.length; s = y - s; }
    o[i] = inp[i] * (1 - wet * .5) + s * wet * 3; }
  return o; }

// ---- loops: blend the tail into the head so the sound repeats without a seam; returns exactly L seconds
function loopify(x, L, X = .8) { const n = N(L), xf = N(X); if (x.length < n + xf) throw new Error('loop source too short');
  const o = new Float32Array(n); for (let i = 0; i < n; i++) o[i] = x[i + xf];
  for (let i = n - xf; i < n; i++) { const u = (i - (n - xf)) / xf, a = Math.cos(u * Math.PI / 2), b = Math.sin(u * Math.PI / 2); o[i] = x[i + xf] * a + x[i + xf - n] * b; }
  return o; }
// a smooth random curve (sum of slow sines with random phases), values about -1..1
function drift(r, rates) { const ph = rates.map(() => r() * 6.283); return t => rates.reduce((s, w, k) => s + Math.sin(t * w * 6.283 + ph[k]), 0) / rates.length; }
// a smooth random curve that loops exactly every L seconds (integer cycles)
function driftL(r, L, cycles) { const ph = cycles.map(() => r() * 6.283); return t => cycles.reduce((s, c, k) => s + Math.sin(t / L * c * 6.283 + ph[k]), 0) / cycles.length; }

// ---- WAV
function wav(path, ch) { const fs = require('fs'), chans = Array.isArray(ch) ? ch : [ch], n = chans[0].length, nc = chans.length, b = Buffer.alloc(44 + n * nc * 2);
  b.write('RIFF', 0); b.writeUInt32LE(36 + n * nc * 2, 4); b.write('WAVEfmt ', 8); b.writeUInt32LE(16, 16); b.writeUInt16LE(1, 20); b.writeUInt16LE(nc, 22); b.writeUInt32LE(SR, 24);
  b.writeUInt32LE(SR * nc * 2, 28); b.writeUInt16LE(nc * 2, 32); b.writeUInt16LE(16, 34); b.write('data', 36); b.writeUInt32LE(n * nc * 2, 40);
  for (let i = 0; i < n; i++) for (let c = 0; c < nc; c++) b.writeInt16LE(Math.round(clamp(chans[c][i], -1, 1) * 32767), 44 + (i * nc + c) * 2);
  fs.writeFileSync(path, b); }

module.exports = { SR, rng, N, buf, lerp, clamp, db, white, pink, brown, filt, lp, hp, bp, lp1, hp1, env, ad, mul, addTo, mix, sat, peak, rms, norm, normRms, fade, trim, rev, delay, osc, modal, bubble, click, creak, grains, verb, loopify, drift, driftL, wav };
