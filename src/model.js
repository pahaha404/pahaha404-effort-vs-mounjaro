// ============================================================
// 체중 모델 — 순수 함수만. DOM·난수 없음(난수는 인자로 받는다).
// 단위: kg, kcal, 주(week).
//
// 핵심 식 (주 1회 적용)
//   net   = 간식 kcal + 노화 잉여 kcal − 운동 kcal × (1 − compensation)
//   W'    = W + net / 7700 + κ · (Wset − W)
//   κ     = kappaUp   (W < Wset: 세트 포인트로 "되돌아가는" 힘)
//         = kappaDown (W > Wset: 세트 포인트로 "내려가는" 힘, 투여 중 감량)
//   Wset  = W0 × (1 − s(용량)),  s(d) = drugShiftMax · d / (d + drugShiftK50), 미투여 시 s = 0
//
// 유령 바늘(칼로리 계산상 체중)은 플레이어의 행동(운동·간식)만 7,700 kcal/kg 산술로 누적한 값이다.
//   G'    = G + (간식 kcal − 운동 kcal) / 7700   (κ 항·노화 항 없음)
// ============================================================
import {
  CHARACTER, EXERCISES, KCAL_PER_KG, MODEL, METABOLIC_DECLINE, BMI_MORTALITY_HR,
  MALE_DEATH_PROB, MALE_DEATH_PROB_100PLUS, CLASS2_OBESITY_MEN_BY_AGE, bmrMifflin,
  SNACK, DOSE_STEPS, SURMOUNT1,
} from './data.js';

export const bmi = (kg, h = CHARACTER.heightM) => kg / (h * h);

/** 운동 소비 열량 (kcal) — Compendium MET × ACSM 환산식 */
export function exerciseKcal(met, kg, minutes) {
  return (met * 3.5 * kg / 200) * minutes;
}
export function exerciseById(id) { return EXERCISES.find(e => e.id === id) || EXERCISES[0]; }

/** 용량(mg)에 따른 세트 포인트 이동 비율 s ∈ [0, drugShiftMax) */
export function drugShift(mg, p = MODEL) {
  if (!mg) return 0;
  return p.drugShiftMax * mg / (mg + p.drugShiftK50);
}

/** 60세 이후 기초대사 감소로 생기는 주간 잉여 kcal (Pontzer 2021: 연 0.7%) */
export function agingSurplusKcalPerWeek(kg, age, h = CHARACTER.heightM) {
  const yrs = Math.max(0, age - METABOLIC_DECLINE.fromAge);
  if (yrs <= 0) return 0;
  const bmr = bmrMifflin(kg, h, METABOLIC_DECLINE.fromAge);
  const factor = 1 - Math.pow(1 - METABOLIC_DECLINE.perYear, yrs);
  return bmr * factor * 7;
}

/**
 * 한 주 진행. state: { weight, ghost, age } / input: { exerciseKcal, snackKcal, doseMg, w0 }
 * 반환: 새 state (불변).
 */
export function stepWeek(state, input, p = MODEL) {
  const w0 = input.w0 ?? CHARACTER.weight0;
  const ex = (input.exerciseKcal || 0);
  const snack = input.snackKcal || 0;
  const aging = agingSurplusKcalPerWeek(state.weight, state.age);
  const netReal = snack + aging - ex * (1 - p.compensation);
  const netGhost = snack - ex;
  const wset = w0 * (1 - drugShift(input.doseMg, p));
  const kappa = state.weight < wset ? p.kappaUp : p.kappaDown;
  const weight = state.weight + netReal / KCAL_PER_KG + kappa * (wset - state.weight);
  const ghost = (state.ghost ?? state.weight) + netGhost / KCAL_PER_KG;
  return { ...state, weight: Math.max(30, weight), ghost: Math.max(20, ghost), setPoint: wset };
}

/** 임상 증량 스케줄: 투여 n주차(0부터)의 용량. holdAt 이 있으면 그 용량에서 멈춘다. */
export function doseAtWeek(weeksOnDrug, holdAt = null) {
  const idx = Math.min(DOSE_STEPS.length - 1, Math.floor(weeksOnDrug / SURMOUNT1.titrationStepWeeks));
  const mg = DOSE_STEPS[idx];
  return holdAt ? Math.min(mg, holdAt) : mg;
}

/** BMI → 전체 사망 HR (Lancet 2016 Table 2) */
export function mortalityHR(b) {
  const row = BMI_MORTALITY_HR.find(r => b >= r.min && b < r.max);
  return row ? row.hr : 1;
}
/** 한국 남자 연령별 연간 사망확률 */
export function annualDeathProb(age) {
  const a = Math.floor(age);
  if (a >= MALE_DEATH_PROB.length) return MALE_DEATH_PROB_100PLUS;
  return MALE_DEATH_PROB[Math.max(0, a)];
}
/** 주간 사망 위험 = 연간 q(x) × HR(BMI) / 52 (상한 1) */
export function weeklyDeathProb(age, b) {
  return Math.min(1, annualDeathProb(age) * mortalityHR(b) / 52);
}
/** 같은 나이 한국 남성 중 2단계 비만(BMI 30–34.9) 비율 (%) */
export function class2ObesityPct(age) {
  const a = Math.floor(age);
  const row = CLASS2_OBESITY_MEN_BY_AGE.find(r => a >= r.from && a <= r.to);
  return row ? row.pct : CLASS2_OBESITY_MEN_BY_AGE[CLASS2_OBESITY_MEN_BY_AGE.length - 1].pct;
}

/** 하루 간식 확률 */
export function snackProbPerDay(rewardGauge, onDrug) {
  const p = SNACK.basePerDay + SNACK.slopePerDay * Math.max(0, Math.min(1, rewardGauge));
  return Math.min(1, onDrug ? p * SNACK.onDrugFactor : p);
}

/**
 * 시뮬레이션 보조: 주 단위로 n주 돌린다.
 * weekFn(week) → { exerciseMinutes, exerciseId, snackKcal, doseMg }
 */
export function simulate(weeks, weekFn, init = {}, p = MODEL) {
  let s = { weight: init.weight ?? CHARACTER.weight0, ghost: init.ghost ?? init.weight ?? CHARACTER.weight0, age: init.age ?? CHARACTER.age0 };
  const w0 = init.w0 ?? CHARACTER.weight0;
  const hist = [s];
  for (let wk = 0; wk < weeks; wk++) {
    const i = weekFn(wk, s) || {};
    const ex = i.exerciseMinutes ? exerciseKcal(exerciseById(i.exerciseId || 'walk').met, s.weight, i.exerciseMinutes) : 0;
    s = stepWeek(s, { exerciseKcal: ex, snackKcal: i.snackKcal || 0, doseMg: i.doseMg || 0, w0 }, p);
    s = { ...s, age: s.age + 1 / 52 };
    hist.push(s);
  }
  return hist;
}
