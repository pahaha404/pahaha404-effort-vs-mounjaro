// node tests/model.test.js
import assert from 'node:assert/strict';
import { simulate, doseAtWeek, stepWeek, weeklyDeathProb, class2ObesityPct, mortalityHR, exerciseKcal, drugShift } from '../src/model.js';
import { CHARACTER, SURMOUNT1, SURMOUNT4, MODEL, KCAL_PER_KG } from '../src/data.js';

const W0 = CHARACTER.weight0;
const pct = (w, base = W0) => (w / base - 1) * 100;
const near = (a, b, tol, msg) => assert.ok(Math.abs(a - b) <= tol, `${msg}: ${a.toFixed(2)} vs ${b} (±${tol})`);
let n = 0; const test = (name, fn) => { fn(); n++; console.log('✓', name); };

test('SURMOUNT-1 위약군: 주 150분 운동, 간식 없음 → 72주 −3.1 %', () => {
  const h = simulate(72, () => ({ exerciseMinutes: SURMOUNT1.lifestyleMinPerWeek, exerciseId: 'walk' }));
  near(pct(h[72].weight), SURMOUNT1.placeboPct, 0.15, '72주 체중 변화율');
});

test('SURMOUNT-1 15 mg: 운동 없음, 임상 증량 → 72주 −17.8 %p (−20.9 − (−3.1))', () => {
  const h = simulate(72, (wk) => ({ doseMg: doseAtWeek(wk, 15) }));
  near(pct(h[72].weight), SURMOUNT1.dosePct[15] - SURMOUNT1.placeboPct, 0.15, '72주 약물 효과분');
});

test('SURMOUNT-1 5 mg / 10 mg 군도 ±1 %p 안에서 재현', () => {
  const h5 = simulate(72, (wk) => ({ doseMg: doseAtWeek(wk, 5) }));
  const h10 = simulate(72, (wk) => ({ doseMg: doseAtWeek(wk, 10) }));
  near(pct(h5[72].weight), SURMOUNT1.dosePct[5] - SURMOUNT1.placeboPct, 1.0, '5 mg');
  near(pct(h10[72].weight), SURMOUNT1.dosePct[10] - SURMOUNT1.placeboPct, 1.0, '10 mg');
});

test('SURMOUNT-4: −20.9 %에서 중단(생활습관 유지) → 52주 후 +14.0 %', () => {
  const start = W0 * (1 + SURMOUNT4.leadInPct / 100);
  const h = simulate(52, () => ({ exerciseMinutes: 150, exerciseId: 'walk' }), { weight: start, w0: W0 });
  near(pct(h[52].weight, start), SURMOUNT4.regainPct, 0.3, '52주 재증가율');
});

test('증량 스케줄: 2.5→5→7.5→10→12.5→15, 4주 간격, 유지 용량에서 멈춤', () => {
  assert.deepEqual([0, 4, 8, 12, 16, 20, 40].map((w) => doseAtWeek(w)), [2.5, 5, 7.5, 10, 12.5, 15, 15]);
  assert.equal(doseAtWeek(40, 5), 5);
  assert.equal(doseAtWeek(2, 5), 2.5);
});

test('유령 바늘은 7,700 kcal/kg 산술 그대로, 실제 체중은 세트 포인트에 묶인다', () => {
  const s0 = { weight: W0, ghost: W0, age: 25 };
  const s1 = stepWeek(s0, { exerciseKcal: 7700, snackKcal: 0, doseMg: 0 });
  near(s1.ghost, W0 - 1, 1e-9, '유령 −1 kg');
  assert.ok(s1.weight > W0 - 1, '실제 감량은 1 kg보다 작다');
  const s2 = stepWeek(s0, { exerciseKcal: 0, snackKcal: 0, doseMg: 0 });
  near(s2.weight, W0, 1e-9, '아무것도 안 하면 세트 포인트 유지');
});

test('노화: 60세 이후에는 같은 조건에서 체중이 늘기 시작한다', () => {
  const a = stepWeek({ weight: W0, ghost: W0, age: 59 }, { doseMg: 0 });
  const b = stepWeek({ weight: W0, ghost: W0, age: 75 }, { doseMg: 0 });
  near(a.weight, W0, 1e-9, '59세 변화 없음');
  assert.ok(b.weight > W0, '75세는 증가');
});

test('사망·유병률 보조 함수', () => {
  assert.equal(mortalityHR(38), 1.94);
  assert.equal(mortalityHR(31), 1.45);
  assert.equal(mortalityHR(23), 1.0);
  assert.ok(weeklyDeathProb(25, 38) > 0 && weeklyDeathProb(25, 38) < weeklyDeathProb(80, 38));
  assert.equal(class2ObesityPct(25), 9.4);
  assert.equal(class2ObesityPct(37), 11.8);
  assert.equal(class2ObesityPct(90), 1.5);
  near(exerciseKcal(4.8, 100, 60), 504, 1e-9, 'MET 4.8, 100 kg, 60분 = 504 kcal');
  assert.ok(drugShift(15) < MODEL.drugShiftMax && drugShift(0) === 0);
});

console.log(`\n${n} tests passed`);
