// ============================================================
// 모든 상수와 데이터셋. 각 항목에 출처를 적는다.
// "추정" 표시가 있는 값은 1차 자료에서 직접 확인하지 못했거나
// 게임 구동을 위해 설계자가 정한 값이다. 데이터 패널에도 같은 표기를 쓴다.
// ============================================================

/** 캐릭터 초기값 (설계서 §3) */
export const CHARACTER = {
  age0: 25,              // 세
  weight0: 105,          // kg
  heightM: 1.66,         // m → BMI 105 / 1.66² = 38.1
  bmi0: 105 / (1.66 * 1.66),
};

/**
 * [D1] SURMOUNT-1 (Jastreboff AM et al. N Engl J Med 2022;387:205-16,
 * doi:10.1056/NEJMoa2206038). 72주, 비당뇨 비만 성인. 모든 군에 생활습관 중재
 * (하루 500 kcal 결핍 식이 + 주 150분 이상 신체활동) 동반.
 * 평균 체중 변화율(%): 위약 −3.1, 5 mg −15.0, 10 mg −19.5, 15 mg −20.9.
 * 용량은 2.5 mg로 시작해 4주마다 2.5 mg씩 증량.
 */
export const SURMOUNT1 = {
  weeks: 72,
  placeboPct: -3.1,
  dosePct: { 5: -15.0, 10: -19.5, 15: -20.9 },
  lifestyleMinPerWeek: 150,
  titrationStepWeeks: 4,
  titrationStepMg: 2.5,
  startMg: 2.5,
  maxMg: 15,
};

/**
 * [D2] SURMOUNT-4 (Aronne LJ et al. JAMA 2024;331:38-48, doi:10.1001/jama.2023.24945).
 * 36주 투여 후 위약 전환군은 이후 52주 동안 +14.0% (36주 시점 체중 대비) 재증가,
 * 계속 투여군은 −5.5%. 위약 기간에도 생활습관 중재는 유지됨.
 */
export const SURMOUNT4 = {
  leadInWeeks: 36,
  leadInPct: -20.9,
  withdrawalWeeks: 52,
  regainPct: 14.0,
  continuePct: -5.5,
};

/**
 * [D3] 2024 Compendium of Physical Activities (Herrmann SD et al. 2024,
 * pacompendium.com). MET 값과 코드.
 * kcal/min = MET × 3.5 × 체중(kg) / 200 (ACSM 환산식).
 */
export const EXERCISES = [
  { id: 'walk',  name: '빠르게 걷기', met: 4.8, code: 17200, desc: 'Walking, 3.5–3.9 mph, level, brisk' },
  { id: 'bike',  name: '자전거',     met: 6.8, code: '01020', desc: 'Bicycling, 10–11.9 mph, leisure, light effort' },
  { id: 'swim',  name: '수영',       met: 6.0, code: 18310, desc: 'Swimming, leisurely, not lap swimming' },
  { id: 'run',   name: '달리기',     met: 9.3, code: 12050, desc: 'Running, 6–6.3 mph (10 min/mile)' },
];
export const MINUTES_PER_CLICK = 10;

/** [D4] 지방 1 kg ≈ 7,700 kcal (Wishnofsky M. Am J Clin Nutr 1958;6:542-6). 유령 바늘의 계산식. */
export const KCAL_PER_KG = 7700;

/** [D5] 2026년 최저임금 시급 10,320원 (최저임금위원회, 2025-07 의결, 고용노동부 고시). */
export const HOURLY_WAGE = 10320;

/**
 * [D6] 마운자로(터제파타이드) 국내 공급가 — 한국릴리 고지, 4주분(펜 4개) 1박스 기준.
 * 2.5 mg 278,066원 / 5 mg 369,307원 / 7.5 mg·10 mg 521,377원 (2025-08~2026-04 보도, 데일리팜·약사공론).
 * 12.5 mg·15 mg는 2026-04 기준 국내 미출시로 보도된 자료와 675,131원으로 적은 자료가 혼재 → "추정".
 * 약국 소비자가·진료비는 제외(공급가만 사용).
 */
export const MOUNJARO_BOX_PRICE = {
  2.5: 278066,
  5: 369307,
  7.5: 521377,
  10: 521377,
  12.5: 675131, // 추정
  15: 675131,   // 추정
};
export const MOUNJARO_ESTIMATED_DOSES = [12.5, 15];
export const PENS_PER_BOX = 4;
export const DOSE_STEPS = [2.5, 5, 7.5, 10, 12.5, 15];
export function penPrice(mg) { return Math.round(MOUNJARO_BOX_PRICE[mg] / PENS_PER_BOX); }

/**
 * [D7] Global BMI Mortality Collaboration. Lancet 2016;388:776-86
 * (doi:10.1016/S0140-6736(16)30175-1). Table 2, 비흡연·만성질환 없는 집단, 전체 사망 HR,
 * 기준 BMI 22.5–<25.
 */
export const BMI_MORTALITY_HR = [
  { min: 0,    max: 18.5, hr: 1.51 },
  { min: 18.5, max: 20,   hr: 1.13 },
  { min: 20,   max: 25,   hr: 1.00 },
  { min: 25,   max: 27.5, hr: 1.07 },
  { min: 27.5, max: 30,   hr: 1.20 },
  { min: 30,   max: 35,   hr: 1.45 },
  { min: 35,   max: 40,   hr: 1.94 },
  { min: 40,   max: 99,   hr: 2.76 },
];

/**
 * [D8] 대한비만학회 2024 Obesity Fact Sheet p.21, 「2022년 5세별 2단계 비만병 유병률」
 * 남자, BMI 30–34.9 kg/m², 단위 %. (건강보험공단 검진자료, 20세 이상)
 */
export const CLASS2_OBESITY_MEN_BY_AGE = [
  { from: 20, to: 24, pct: 8.6 },
  { from: 25, to: 29, pct: 9.4 },
  { from: 30, to: 34, pct: 11.2 },
  { from: 35, to: 39, pct: 11.8 },
  { from: 40, to: 44, pct: 10.4 },
  { from: 45, to: 49, pct: 8.2 },
  { from: 50, to: 54, pct: 6.5 },
  { from: 55, to: 59, pct: 4.8 },
  { from: 60, to: 64, pct: 3.9 },
  { from: 65, to: 69, pct: 3.5 },
  { from: 70, to: 74, pct: 3.0 },
  { from: 75, to: 79, pct: 2.6 },
  { from: 80, to: 84, pct: 2.2 },
  { from: 85, to: 120, pct: 1.5 },
];

/**
 * [D9] 통계청 「2023년 완전생명표」 남자 연령별 사망확률 q(x)
 * (KOSIS, 2024-12-04 갱신; lifetable.de 사본 KOR000020232023CU1에서 전사).
 * 인덱스 = 나이(0~99). 100세 이상은 0.40으로 둔다(추정).
 */
export const MALE_DEATH_PROB = [
  0.00268,0.00023,0.00015,0.00011,0.00009,0.00009,0.00009,0.00008,0.00006,0.00006,
  0.00006,0.00007,0.00010,0.00013,0.00016,0.00020,0.00023,0.00027,0.00030,0.00034,
  0.00038,0.00042,0.00045,0.00047,0.00048,0.00052,0.00056,0.00061,0.00065,0.00066,
  0.00067,0.00068,0.00069,0.00070,0.00072,0.00078,0.00086,0.00094,0.00102,0.00109,
  0.00116,0.00124,0.00136,0.00150,0.00162,0.00172,0.00184,0.00201,0.00223,0.00250,
  0.00276,0.00301,0.00328,0.00357,0.00391,0.00430,0.00472,0.00514,0.00553,0.00591,
  0.00637,0.00694,0.00758,0.00823,0.00890,0.00966,0.01057,0.01161,0.01278,0.01413,
  0.01572,0.01759,0.01960,0.02194,0.02426,0.02679,0.02970,0.03343,0.03845,0.04469,
  0.05210,0.06036,0.06923,0.07867,0.08825,0.09971,0.11224,0.12586,0.14060,0.15649,
  0.17351,0.19166,0.21091,0.23123,0.25255,0.27480,0.29789,0.32171,0.34612,0.37099,
];
export const MALE_DEATH_PROB_100PLUS = 0.40; // 추정

/** [D10] Pontzer H et al. Science 2021;373:808-12. 60세 이후 보정 총에너지소비 연 −0.7%(±0.1). */
export const METABOLIC_DECLINE = { fromAge: 60, perYear: 0.007 };

/** [D11] Mifflin-St Jeor 기초대사량 (Mifflin MD et al. Am J Clin Nutr 1990;51:241-7), 남성. */
export function bmrMifflin(kg, heightM, age) {
  return 10 * kg + 6.25 * (heightM * 100) - 5 * age + 5;
}

/**
 * [D12] 식사·간식.
 * 하루 두 끼: 국민건강영양조사 2021 남자 1일 평균 에너지 섭취 2,129 kcal (질병관리청) → 끼당 약 1,065 kcal.
 * 기본 식사는 세트 포인트를 유지하는 양으로 본다(모델에서 0으로 처리).
 * 간식 열량은 식약처 식품영양성분DB 근사값 — 추정.
 */
export const DAILY_INTAKE_MEN = 2129;
export const MEALS_PER_DAY = 2;
export const SNACKS = [
  { name: '치킨 두 조각', kcal: 480, emoji: '🍗' },
  { name: '라면 한 그릇', kcal: 500, emoji: '🍜' },
  { name: '떡볶이 1인분', kcal: 450, emoji: '🥘' },
  { name: '맥주와 안주', kcal: 550, emoji: '🍺' },
  { name: '과자 한 봉지', kcal: 300, emoji: '🍪' },
  { name: '아이스크림', kcal: 250, emoji: '🍦' },
];

/**
 * [D13] 보상심리와 간식 확률 — 추정(게임 파라미터).
 * 근거: Thomas DM et al. Obes Rev 2012;13:835-47 — 운동 중재의 실제 감량은 예측보다 작고,
 * 섭취 증가·비운동 활동 감소 등 보상이 원인. 수치 자체는 설계자가 정함.
 * 하루 간식 확률 = base + slope × 보상게이지(0~1). 투여 중에는 × onDrugFactor.
 */
export const SNACK = { basePerDay: 0.03, slopePerDay: 0.25, onDrugFactor: 0.15 };
export const REWARD_GAUGE = { perClick: 0.03, decayPerWeek: 0.25 };   // 추정
export const FATIGUE_GAUGE = { perClick: 0.07, decayPerSecond: 0.28, lockSeconds: 1.2 }; // 추정

/**
 * [M] 세트 포인트 모델 보정 파라미터 (src/model.js 참조). 세 값 모두 아래 데이터로 보정한 "추정".
 *  - compensation: 운동 소비 열량 중 몸이 되돌려 받는 비율. D1 위약군 72주 −3.1%(주 150분)로 보정.
 *  - kappaUp: 세트 포인트 아래에 있을 때 되돌아가는 속도(주당 비율). D2 중단 후 52주 +14.0%로 보정.
 *  - kappaDown: 세트 포인트 위에 있을 때 내려가는 속도. D1 15 mg 곡선 형태로 보정.
 *  - drugShiftMax, drugShiftK50: 용량별 세트 포인트 이동 비율 s(d) = max·d/(d+K50). D1 세 군으로 보정.
 * 값은 tools/calibrate.js 실행 결과.
 */
export const MODEL = {
  compensation: 0.501,   // 운동 소비 열량의 약 절반이 되돌아옴
  kappaUp: 0.0195,       // 주당 1.95 %씩 세트 포인트로 복귀
  kappaDown: 0.045,      // 주당 4.5 %씩 (15 mg 곡선 형태 수동 보정)
  drugShiftMax: 0.2507,  // s(15 mg) ≈ 0.187 → 평형 −18.7 %
  drugShiftK50: 5.11,    // mg
};

/** 시간 흐름 (설계서 §3): 1주 ≈ 2초 (1배속). */
export const SECONDS_PER_WEEK = 2;
export const SPEEDS = [0.5, 1, 2, 4, 8, 16, 32];
