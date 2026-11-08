// node tools/calibrate.js — MODEL 파라미터를 데이터셋에 맞춰 수치 보정한다.
import { simulate, doseAtWeek } from '../src/model.js';
import { MODEL, SURMOUNT1, SURMOUNT4, CHARACTER } from '../src/data.js';

const W0 = CHARACTER.weight0;
const pct = (w) => (w / W0 - 1) * 100;

function placebo72(p) { // 주 150분 걷기, 간식 없음
  const h = simulate(72, () => ({ exerciseMinutes: 150, exerciseId: 'walk' }), {}, p);
  return pct(h[72].weight);
}
function drug72(p, maxMg) { // 운동 없음, 임상 증량
  const h = simulate(72, (wk) => ({ doseMg: doseAtWeek(wk, maxMg) }), {}, p);
  return pct(h[72].weight);
}
function regain52(p) { // SURMOUNT-4: −20.9%에서 중단, 생활습관(150분) 유지, 52주
  const start = W0 * (1 + SURMOUNT4.leadInPct / 100);
  const h = simulate(52, () => ({ exerciseMinutes: 150, exerciseId: 'walk' }), { weight: start, w0: W0 }, p);
  return (h[52].weight / start - 1) * 100;
}
function solve(f, target, lo, hi, iters = 60) { // 단조 함수(증가/감소 모두) 이분법
  const inc = f(hi) > f(lo);
  for (let i = 0; i < iters; i++) { const m = (lo + hi) / 2; ((f(m) < target) === inc) ? (lo = m) : (hi = m); }
  return (lo + hi) / 2;
}

const p = { ...MODEL };
// 1) kappaUp ← SURMOUNT-4 (+14.0%)  (compensation도 영향 주므로 2)와 교대로 반복)
for (let r = 0; r < 4; r++) {
  p.kappaUp = solve((k) => regain52({ ...p, kappaUp: k }), SURMOUNT4.regainPct, 0.001, 0.2);
  // 2) compensation ← SURMOUNT-1 위약 −3.1%  (compensation↑ → 감량↓ → pct↑)
  p.compensation = solve((c) => placebo72({ ...p, compensation: c }), SURMOUNT1.placeboPct, 0, 0.95);
}
// 3) drugShiftMax ← 15 mg 72주 = −(20.9−3.1) = −17.8 %p  (shift↑ → pct↓, 단조감소)
const target15 = SURMOUNT1.dosePct[15] - SURMOUNT1.placeboPct;
p.drugShiftMax = solve((s) => -drug72({ ...p, drugShiftMax: s }, 15), -target15, 0.05, 0.6);
// 4) K50 ← 5 mg / 15 mg 비율 (약물 효과분)
const target5 = SURMOUNT1.dosePct[5] - SURMOUNT1.placeboPct;
for (let r = 0; r < 3; r++) {
  p.drugShiftK50 = solve((k) => -drug72({ ...p, drugShiftK50: k }, 5), -target5, 0.5, 30);
  p.drugShiftMax = solve((s) => -drug72({ ...p, drugShiftMax: s }, 15), -target15, 0.05, 0.6);
}
const round = (x, d) => Number(x.toFixed(d));
const out = { compensation: round(p.compensation, 3), kappaUp: round(p.kappaUp, 4), kappaDown: p.kappaDown, drugShiftMax: round(p.drugShiftMax, 4), drugShiftK50: round(p.drugShiftK50, 2) };
console.log('MODEL =', JSON.stringify(out));
console.log('check placebo72 %:', placebo72(out).toFixed(2), '(target', SURMOUNT1.placeboPct, ')');
console.log('check 15mg 72 %:', drug72(out, 15).toFixed(2), '(target', -target15, ')');
console.log('check 10mg 72 %:', drug72(out, 10).toFixed(2), '(target', (SURMOUNT1.dosePct[10] - SURMOUNT1.placeboPct), ')');
console.log('check 5mg 72 %:', drug72(out, 5).toFixed(2), '(target', -target5, ')');
console.log('check regain52 %:', regain52(out).toFixed(2), '(target', SURMOUNT4.regainPct, ')');
const h15 = simulate(72, (wk) => ({ doseMg: doseAtWeek(wk, 15) }), {}, out);
console.log('15mg curve wk 12/24/36/48/60/72:', [12,24,36,48,60,72].map(w => pct(h15[w].weight).toFixed(1)).join(' / '));
