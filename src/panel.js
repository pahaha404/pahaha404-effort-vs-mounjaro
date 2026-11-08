// ⓘ 데이터 패널 — 설계서 §1 표의 데이터셋·출처·계산식.
import {
  SURMOUNT1, SURMOUNT4, EXERCISES, KCAL_PER_KG, HOURLY_WAGE, MOUNJARO_BOX_PRICE, MOUNJARO_ESTIMATED_DOSES,
  BMI_MORTALITY_HR, CLASS2_OBESITY_MEN_BY_AGE, MALE_DEATH_PROB, METABOLIC_DECLINE, DAILY_INTAKE_MEN, SNACKS,
  SNACK, REWARD_GAUGE, FATIGUE_GAUGE, MODEL, MINUTES_PER_CLICK,
} from './data.js';

const won = (n) => n.toLocaleString('ko-KR') + '원';
const EST = '<span class="badge">추정</span>';
const OK = '<span class="badge ok">확인</span>';

const rows = [
  ['D1', 'SURMOUNT-1 (터제파타이드 72주 임상)', 'Jastreboff AM et al. <i>NEJM</i> 2022;387:205-16',
    `72주 체중 변화율: 위약 ${SURMOUNT1.placeboPct}%, 5 mg ${SURMOUNT1.dosePct[5]}%, 10 mg ${SURMOUNT1.dosePct[10]}%, 15 mg ${SURMOUNT1.dosePct[15]}%. 전 군 생활습관 중재(−500 kcal/일, 주 ${SURMOUNT1.lifestyleMinPerWeek}분 이상). 증량 2.5 mg → 4주마다 +2.5 mg`, OK],
  ['D2', 'SURMOUNT-4 (투여 중단 후 재증가)', 'Aronne LJ et al. <i>JAMA</i> 2024;331:38-48',
    `${SURMOUNT4.leadInWeeks}주 투여(${SURMOUNT4.leadInPct}%) 뒤 위약 전환 → ${SURMOUNT4.withdrawalWeeks}주 동안 +${SURMOUNT4.regainPct}% (생활습관 중재 유지). 계속 투여군 ${SURMOUNT4.continuePct}%`, OK],
  ['D3', '2024 Compendium of Physical Activities', 'Herrmann SD et al. 2024, pacompendium.com',
    EXERCISES.map((e) => `${e.name} ${e.met} MET (code ${e.code})`).join(' · ') + `<br><code>kcal/min = MET × 3.5 × kg / 200</code> · 클릭 1회 = ${MINUTES_PER_CLICK}분`, OK],
  ['D4', '지방 1 kg = 7,700 kcal', 'Wishnofsky M. <i>Am J Clin Nutr</i> 1958', `유령 바늘: <code>계산상 체중 = 105 − Σ(운동 kcal − 간식 kcal) / ${KCAL_PER_KG.toLocaleString()}</code> (플레이어 행동만 산술 누적, 세트 포인트·노화 없음)`, OK],
  ['D5', '2026년 최저임금', '최저임금위원회 의결(2025-07), 고용노동부 고시', `시급 ${won(HOURLY_WAGE)} → 알바 1시간 버튼`, OK],
  ['D6', '마운자로 국내 공급가(4주분 1박스 = 펜 4개)', '한국릴리 고지(2025-08), 데일리팜·약사공론 보도',
    Object.entries(MOUNJARO_BOX_PRICE).map(([d, p]) => `${d} mg ${won(p)}${MOUNJARO_ESTIMATED_DOSES.includes(Number(d)) ? EST : ''}`).join(' · ') + '<br>매주 펜 1개 = 박스값 ÷ 4. 약국 소비자가·진료비 제외', `부분 확인 (12.5·15 mg 미출시 보도와 혼재)`],
  ['D7', 'BMI별 전체 사망 위험(HR)', 'Global BMI Mortality Collaboration. <i>Lancet</i> 2016;388:776-86, Table 2',
    BMI_MORTALITY_HR.filter((r) => r.min >= 18.5).map((r) => `${r.min}–${r.max === 99 ? '' : r.max} ${r.hr}`).join(' · ') + ' (기준 22.5–25, 비흡연·만성질환 없음)', OK],
  ['D8', '한국 남성 연령별 2단계 비만 유병률', '대한비만학회 2024 Obesity Fact Sheet p.21 (2022년, BMI 30–34.9)',
    CLASS2_OBESITY_MEN_BY_AGE.map((r) => `${r.from}${r.to >= 100 ? '+' : '–' + r.to} ${r.pct}%`).join(' · '), OK],
  ['D9', '한국 남자 연령별 사망확률 q(x)', '통계청 2023년 완전생명표 (KOSIS)',
    `25세 ${MALE_DEATH_PROB[25]} · 40세 ${MALE_DEATH_PROB[40]} · 60세 ${MALE_DEATH_PROB[60]} · 70세 ${MALE_DEATH_PROB[70]} · 80세 ${MALE_DEATH_PROB[80]} · 90세 ${MALE_DEATH_PROB[90]} (0–99세 전부 사용, 100세+ 0.40${EST})<br><code>주간 사망 확률 = q(나이) × HR(BMI) / 52</code>`, OK],
  ['D10', '노화에 따른 에너지소비 감소', 'Pontzer H et al. <i>Science</i> 2021;373:808-12',
    `${METABOLIC_DECLINE.fromAge}세 이후 연 −${METABOLIC_DECLINE.perYear * 100}% → <code>노화 잉여 kcal/주 = BMR(60세) × (1 − 0.993^(나이−60)) × 7</code>`, OK],
  ['D11', '기초대사량', 'Mifflin-St Jeor 1990', '<code>BMR = 10·kg + 6.25·cm − 5·나이 + 5</code> (남, 키 166 cm)', OK],
  ['D12', '식사·간식 열량', '국민건강영양조사 2021(질병관리청); 간식은 식약처 영양DB 근사',
    `남자 1일 평균 ${DAILY_INTAKE_MEN.toLocaleString()} kcal → 하루 두 끼(세트 포인트 유지분, 모델에서 0). 간식: ` + SNACKS.map((s) => `${s.emoji} ${s.name} ${s.kcal}`).join(' · ') + ` kcal${EST}`, '부분 확인'],
  ['D13', '운동 후 보상(compensation)과 간식 확률', 'Thomas DM et al. <i>Obes Rev</i> 2012;13:835-47',
    `운동 감량은 예측보다 작다(섭취 증가·NEAT 감소). 게임 수치${EST}: 턴 시작 시 간식 유혹 확률 = 3 × (${SNACK.basePerDay} + ${SNACK.slopePerDay} × 보상게이지), 투여 중 간식 × ${SNACK.onDrugFactor}. 보상게이지 +${REWARD_GAUGE.perClick}/운동 10분, 주마다 ${REWARD_GAUGE.decayPerWeek * 100}% 감쇠. 연타 4초: 피로 +${FATIGUE_GAUGE.perClick}/클릭, 초당 −${FATIGUE_GAUGE.decayPerSecond}, 가득 차면 ${FATIGUE_GAUGE.lockSeconds}초 휴식`, '정성적 확인'],
];

export function buildPanel() {
  const body = document.querySelector('#panelBody');
  body.innerHTML = `
    <p class="note">서로 다른 데이터셋을 겹쳐서, 각각만 봐서는 안 보이는 관계를 드러냅니다. <span class="badge">추정</span>은 1차 자료에서 직접 확인하지 못했거나 게임 구동을 위해 정한 값입니다.</p>
    <table>
      <thead><tr><th>#</th><th>데이터셋</th><th>출처</th><th>게임에서 쓰는 값·계산식</th><th>검증</th></tr></thead>
      <tbody>${rows.map(([id, name, src, use, chk]) => `<tr><td class="id">${id}</td><td>${name}</td><td>${src}</td><td>${use}</td><td>${chk}</td></tr>`).join('')}</tbody>
    </table>
    <h4>세트 포인트 체중 모델 (src/model.js, 주 1회)</h4>
    <p><code>net = 간식 kcal + 노화 잉여 kcal − 운동 kcal × (1 − ${MODEL.compensation})</code></p>
    <p><code>W' = W + net / 7,700 + κ · (W_set − W)</code> &nbsp; κ = ${MODEL.kappaUp}(세트 포인트 아래) / ${MODEL.kappaDown}(위)</p>
    <p><code>W_set = 105 × (1 − ${MODEL.drugShiftMax} · 용량 / (용량 + ${MODEL.drugShiftK50}))</code> &nbsp; 미투여 시 105 kg</p>
    <p class="note">보정${EST}: compensation ← D1 위약군 72주 −3.1 % · κ(아래) ← D2 중단 후 52주 +14.0 % · κ(위) ← D1 15 mg 곡선 형태 · 용량 곡선 ← D1 5/10/15 mg. 검증은 <code>node tests/model.test.js</code>.</p>
    <h4>시간</h4>
    <p>턴제. 턴마다 멈추고 묻는다(운동? 알바? 투여?). 첫해 1턴 = 4주, 2~3년차 13주, 이후 52주. 두 캐릭터 모두 25세, 105 kg, 키 166 cm, BMI 38.1에서 시작. 끝 화면 없음.</p>
  `;
  const panel = document.querySelector('#panel'), back = document.querySelector('#panelBackdrop');
  const open = (v) => { panel.hidden = !v; back.hidden = !v; };
  document.querySelector('#dataBtn').addEventListener('click', () => open(true));
  document.querySelector('#panelClose').addEventListener('click', () => open(false));
  back.addEventListener('click', () => open(false));
  window.addEventListener('keydown', (e) => { if (e.key === 'Escape') open(false); });
}
