// 메인 게임 — 턴제. 턴마다 화면이 멈추고 묻는다: 운동을 하시겠습니까? 알바를 하시겠습니까? 약을 투여하시겠습니까?
// 답하면 그 턴(4주 → 13주 → 52주)이 재생되고 차트가 늘어난다. 체중 계산은 model.js(순수 함수)에 위임.
import {
  CHARACTER, EXERCISES, MINUTES_PER_CLICK, HOURLY_WAGE, DOSE_STEPS, MOUNJARO_ESTIMATED_DOSES, MOUNJARO_BOX_PRICE, penPrice,
  SNACKS, REWARD_GAUGE, FATIGUE_GAUGE, METABOLIC_DECLINE, TURN_WEEKS,
} from './data.js';
import { bmi, exerciseKcal, exerciseById, stepWeek, doseAtWeek, weeklyDeathProb, class2ObesityPct, snackProbPerDay } from './model.js';
import { manSVG, tableSVG, syringeSVG, tombSVG } from './characters.js';
import { createChart } from './chart.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const fmt1 = (n) => n.toFixed(1);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const BURST_SECONDS = 4;

/** 턴 길이(주): 첫해 4주, 2~3년차 13주, 이후 52주 */
export function turnWeeks(week) { return week < 52 ? TURN_WEEKS.year1 : week < 156 ? TURN_WEEKS.year2to3 : TURN_WEEKS.after; }
/** 턴 재생 속도: 주당 ms */
function msPerWeek(tw) { return tw <= 4 ? 450 : tw <= 13 ? 160 : 55; }

function newPerson() {
  return {
    weight: CHARACTER.weight0, ghost: CHARACTER.weight0, age: CHARACTER.age0, alive: true, deathAge: null,
    minutesPerWeek: 0, exerciseId: 'walk', totalMinutes: 0, reward: 0, snackHabit: null,
    hoursPerWeek: 0, balance: 0, workHours: 0, spent: 0, treating: false, weeksOnDrug: 0, hold: null, currentDose: 0,
  };
}

export function createGame() {
  const S = { week: 0, turn: 0, auto: false, L: newPerson(), R: newPerson(),
    hist: { L: [CHARACTER.weight0], R: [CHARACTER.weight0], G: [CHARACTER.weight0], snacks: [], drugWeeks: [], marks: [] } };
  const el = {
    age: $('#age'), weeks: $('#weeks'), prev: $('#prev'), turnLabel: $('#turnLabel'), autoBtn: $('#autoBtn'),
    manL: $('#manL'), manR: $('#manR'), tableL: $('#tableL'), tableR: $('#tableR'), floatL: $('#floatL'), floatR: $('#floatR'),
    wL: $('#wL'), wR: $('#wR'), bmiL: $('#bmiL'), bmiR: $('#bmiR'), dL: $('#dL'), dR: $('#dR'),
    lgL: $('#lgL'), lgR: $('#lgR'), lgG: $('#lgG'), lgDiff: $('#lgDiff'),
    cardL: $('#cardL'), cardR: $('#cardR'), syringeR: $('#syringeR'),
    tombL: $('#tombL'), tombR: $('#tombR'), sideL: $('#sideL'), sideR: $('#sideR'),
  };
  const chart = createChart($('#chart'));
  el.tableL.innerHTML = tableSVG(); el.tableR.innerHTML = tableSVG(); el.syringeR.innerHTML = syringeSVG();
  el.autoBtn.addEventListener('click', () => { S.auto = !S.auto; el.autoBtn.classList.toggle('active', S.auto); el.autoBtn.textContent = S.auto ? '같은 선택 반복 중' : '같은 선택 반복'; });

  // ---------- 카드(질문/연타/상태) ----------
  function ask(card, { title, text, options }) {
    return new Promise((resolve) => {
      card.innerHTML = `<div class="q"><p class="q-title">${title}</p>${text ? `<p class="q-text">${text}</p>` : ''}<div class="q-opts">${options.map((o, i) => `<button data-i="${i}" class="opt ${o.cls || ''}" ${o.disabled ? 'disabled' : ''}>${o.label}${o.sub ? `<small>${o.sub}</small>` : ''}</button>`).join('')}</div></div>`;
      card.classList.add('asking');
      card.querySelectorAll('button.opt').forEach((b) => b.addEventListener('click', () => { card.classList.remove('asking'); resolve(options[Number(b.dataset.i)].value); }));
    });
  }
  /** 연타 구간: 4초 동안 클릭 수를 센다. 피로 게이지가 차면 잠시 멈춰야 한다. */
  function burst(card, { label, unitLabel, perClick, hint }) {
    return new Promise((resolve) => {
      card.innerHTML = `<div class="burst"><p class="q-title">${label}</p><p class="q-text">${hint}</p>
        <button class="action big-btn" id="burstBtn">클릭!<small>${unitLabel}</small></button>
        <div class="burst-row"><span>이번 턴</span><b id="burstCount">0</b><span id="burstUnit"></span></div>
        <label class="gauge-row">피로 <span class="gauge fatigue"><i id="burstFatigue"></i></span></label>
        <div class="timer"><i id="burstTimer"></i></div></div>`;
      const btn = card.querySelector('#burstBtn'), cnt = card.querySelector('#burstCount'), fat = card.querySelector('#burstFatigue'), tmr = card.querySelector('#burstTimer');
      let clicks = 0, fatigue = 0, lockedUntil = 0, last = performance.now();
      const t0 = performance.now();
      const onDown = (e) => { e.preventDefault(); const now = performance.now(); if (now < lockedUntil) return; fatigue += FATIGUE_GAUGE.perClick; if (fatigue >= 1) { fatigue = 1; lockedUntil = now + FATIGUE_GAUGE.lockSeconds * 1000; } clicks++; cnt.textContent = clicks * perClick; };
      btn.addEventListener('pointerdown', onDown);
      const tick = (now) => {
        const dt = (now - last) / 1000; last = now;
        fatigue = Math.max(0, fatigue - FATIGUE_GAUGE.decayPerSecond * dt);
        fat.style.width = `${fatigue * 100}%`;
        const locked = now < lockedUntil; btn.classList.toggle('tired', locked); btn.firstChild.textContent = locked ? '지쳤다…' : '클릭!';
        const p = Math.min(1, (now - t0) / (BURST_SECONDS * 1000)); tmr.style.width = `${(1 - p) * 100}%`;
        if (p < 1) requestAnimationFrame(tick); else { btn.removeEventListener('pointerdown', onDown); btn.disabled = true; resolve(clicks * perClick); }
      };
      requestAnimationFrame(tick);
    });
  }
  function status(card, html) { card.innerHTML = `<div class="st">${html}</div>`; }
  function notice(card, html) { card.insertAdjacentHTML('afterbegin', `<div class="notice">${html}</div>`); }

  // ---------- 질문 단계 ----------
  async function askLeft(tw) {
    const P = S.L;
    if (S.auto && S.turn > 0) return; // 지난 선택 유지
    const ex = exerciseById(P.exerciseId);
    const doIt = await ask(el.cardL, {
      title: '운동을 하시겠습니까?',
      text: `다음 ${tw}주 동안의 루틴을 정합니다. ${S.turn ? `지난 턴: 주 ${P.minutesPerWeek}분 ${ex.name}` : ''}`,
      options: [
        ...EXERCISES.map((e) => ({ label: e.name, sub: `${e.met} MET`, value: e.id, cls: 'small' })),
        { label: '쉰다', sub: '운동 없음', value: null, cls: 'small muted' },
      ],
    });
    if (!doIt) { P.minutesPerWeek = 0; return; }
    P.exerciseId = doIt;
    P.minutesPerWeek = await burst(el.cardL, { label: `${exerciseById(doIt).name} — 빠르게 클릭!`, unitLabel: `클릭 1회 = 주 ${MINUTES_PER_CLICK}분`, perClick: MINUTES_PER_CLICK, hint: '4초 동안 클릭한 만큼이 매주 운동량이 됩니다. 지치면 잠깐 쉬어야 합니다.' });
    el.cardL.querySelector('#burstUnit').textContent = '분/주';
    await sleep(500);
  }
  async function askRight(tw) {
    const P = S.R;
    if (S.auto && S.turn > 0) return;
    const doIt = await ask(el.cardR, {
      title: '알바를 하시겠습니까?',
      text: `시급 ${fmt(HOURLY_WAGE)}원. 다음 ${tw}주 동안 매주 일할 시간을 정합니다. ${S.turn ? `지난 턴: 주 ${P.hoursPerWeek}시간` : ''}`,
      options: [{ label: '알바한다', sub: '4초 연타로 시간 결정', value: true }, { label: '쉰다', sub: '수입 없음', value: false, cls: 'muted' }],
    });
    if (!doIt) { P.hoursPerWeek = 0; return; }
    P.hoursPerWeek = await burst(el.cardR, { label: '알바 — 빠르게 클릭!', unitLabel: '클릭 1회 = 주 1시간', perClick: 1, hint: '4초 동안 클릭한 만큼이 매주 근무시간이 됩니다. 지치면 잠깐 쉬어야 합니다.' });
    el.cardR.querySelector('#burstUnit').textContent = '시간/주';
    await sleep(500);
  }
  async function askDrug(tw) {
    const P = S.R;
    const nextDose = doseAtWeek(P.weeksOnDrug, null);          // 스케줄상 이번 턴 용량
    const heldDose = P.hold ? Math.min(nextDose, P.hold) : nextDose;
    const weeklyIncome = P.hoursPerWeek * HOURLY_WAGE;
    const costOf = (mg) => penPrice(mg);
    const est = (mg) => MOUNJARO_ESTIMATED_DOSES.includes(mg) ? ' (약값 추정)' : '';
    if (S.auto && S.turn > 0) return; // 지난 선택 유지(증량 멈춤 설정 포함)
    const opts = [];
    if (!P.treating) {
      opts.push({ label: '투여한다', sub: `${heldDose} mg · 매주 ${fmt(costOf(heldDose))}원${est(heldDose)}`, value: 'start' });
      opts.push({ label: '투여하지 않는다', sub: P.weeksOnDrug ? '체중이 되돌아옵니다' : '알바로 돈을 모읍니다', value: 'none', cls: 'muted' });
    } else {
      const cur = P.currentDose;
      const canUp = cur < DOSE_STEPS[DOSE_STEPS.length - 1] && nextDose > cur;
      if (canUp) opts.push({ label: '증량한다', sub: `${nextDose} mg · 매주 ${fmt(costOf(nextDose))}원${est(nextDose)}`, value: 'up' });
      opts.push({ label: canUp ? '현재 용량 유지' : '계속 투여', sub: `${cur} mg · 매주 ${fmt(costOf(cur))}원`, value: 'hold' });
      opts.push({ label: '중단한다', sub: '체중이 되돌아옵니다', value: 'stop', cls: 'muted' });
    }
    const v = await ask(el.cardR, {
      title: '약을 투여하시겠습니까?',
      text: `잔액 ${fmt(P.balance)}원 · 주 수입 ${fmt(weeklyIncome)}원 · 매주 펜 1개 값이 빠지고, 잔액이 모자라면 그 주에 끊깁니다.`,
      options: opts,
    });
    if (v === 'start') { P.treating = true; P.hold = P.hold; }
    else if (v === 'none' || v === 'stop') { P.treating = false; }
    else if (v === 'up') { P.treating = true; P.hold = null; }
    else if (v === 'hold') { P.treating = true; P.hold = P.currentDose || heldDose; }
  }
  /** 간식 유혹 — 보상심리에 비례해 등장. 먹으면 이번 턴 동안 매주 그 간식이 추가된다. */
  async function askSnack(tw) {
    const P = S.L; if (!P.alive) return;
    const p = Math.min(0.9, snackProbPerDay(P.reward, false) * 3);
    if (Math.random() >= p) { P.snackHabit = null; return; }
    const s = SNACKS[Math.floor(Math.random() * SNACKS.length)];
    const v = await ask(el.cardL, {
      title: `${s.emoji} ${s.name}이(가) 당깁니다`,
      text: `운동한 보상으로 먹고 싶어집니다. 먹으면 다음 ${tw}주 동안 매주 ${s.kcal} kcal이 더해집니다.`,
      options: [{ label: '먹는다', sub: `${s.kcal} kcal`, value: true }, { label: '참는다', sub: '보상심리는 그대로', value: false, cls: 'muted' }],
    });
    P.snackHabit = v ? s : null;
    if (v) { popText(el.floatL, s.emoji, 'emoji'); S.hist.snacks.push(S.week); }
  }

  // ---------- 턴 재생 ----------
  function popText(layer, text, cls = 'text') {
    const d = document.createElement('div'); d.className = `pop ${cls}`; d.textContent = text;
    d.style.left = `${30 + Math.random() * 40}%`; layer.appendChild(d); setTimeout(() => d.remove(), 1500);
  }
  function bite(tableEl, idx) { const p = tableEl.querySelector(`[data-plate="${idx % 2}"]`); if (!p) return; p.classList.remove('eating'); void p.getBoundingClientRect(); p.classList.add('eating'); }

  function stepLeft() {
    const P = S.L; const before = P.weight;
    const ex = exerciseById(P.exerciseId);
    const kcal = exerciseKcal(ex.met, P.weight, P.minutesPerWeek);
    const snack = P.snackHabit ? P.snackHabit.kcal : 0;
    Object.assign(P, stepWeek(P, { exerciseKcal: kcal, snackKcal: snack, doseMg: 0 }));
    P.totalMinutes += P.minutesPerWeek;
    P.reward = Math.min(1, P.reward * (1 - REWARD_GAUGE.decayPerWeek) + REWARD_GAUGE.perClick * (P.minutesPerWeek / MINUTES_PER_CLICK));
    P.age += 1 / 52;
    S.hist.L.push(P.weight); S.hist.G.push(P.ghost);
    return P.weight - before;
  }
  function stepRight() {
    const P = S.R; const before = P.weight; let dose = 0; let broke = false;
    P.balance += P.hoursPerWeek * HOURLY_WAGE; P.workHours += P.hoursPerWeek;
    if (P.treating) {
      dose = doseAtWeek(P.weeksOnDrug, P.hold);
      const cost = penPrice(dose);
      if (P.balance >= cost) { P.balance -= cost; P.spent += cost; P.weeksOnDrug += 1; P.currentDose = dose; S.hist.drugWeeks.push(S.week); }
      else { P.treating = false; P.currentDose = 0; dose = 0; broke = true; }
    } else P.currentDose = 0;
    const snackP = snackProbPerDay(0, dose > 0) * 7; const snack = Math.random() < snackP ? SNACKS[Math.floor(Math.random() * SNACKS.length)].kcal : 0;
    Object.assign(P, stepWeek(P, { exerciseKcal: 0, snackKcal: snack, doseMg: dose }));
    P.age += 1 / 52;
    S.hist.R.push(P.weight);
    return { delta: P.weight - before, broke };
  }
  function die(P, side) {
    P.alive = false; P.deathAge = Math.floor(P.age);
    const lines = side === 'L' ? [`${P.deathAge}세`, `누적 운동 ${fmt(P.totalMinutes / 60)}시간`, `누적 지출 0원`] : [`${P.deathAge}세`, `누적 알바 ${fmt(P.workHours)}시간`, `누적 지출 ${fmt(P.spent)}원`];
    const tomb = side === 'L' ? el.tombL : el.tombR; tomb.innerHTML = tombSVG(lines); tomb.hidden = false;
    (side === 'L' ? el.sideL : el.sideR).classList.add('dead');
    (side === 'L' ? el.manL : el.manR).hidden = true; (side === 'L' ? el.tableL : el.tableR).hidden = true;
    if (side === 'R') el.syringeR.classList.remove('on');
    S.hist.marks.push({ week: S.week, label: side === 'L' ? '노력하는 나 사망' : '주사 맞는 나 사망', color: side === 'L' ? '#F28C28' : '#7B3FBF' });
    (side === 'L' ? el.cardL : el.cardR).hidden = true;
  }

  async function playTurn(tw) {
    const ms = msPerWeek(tw);
    const showPops = ms >= 150;
    status(el.cardL, S.L.alive ? routineL() : ''); status(el.cardR, S.R.alive ? routineR() : '');
    el.syringeR.classList.toggle('on', S.R.treating);
    for (let i = 0; i < tw; i++) {
      S.week += 1;
      let dl = 0, dr = { delta: 0, broke: false };
      if (S.L.alive) dl = stepLeft();
      if (S.R.alive) dr = stepRight();
      if (S.L.alive) { bite(el.tableL, i); if (showPops) popText(el.floatL, `${dl <= 0 ? '▼' : '▲'}${Math.abs(dl).toFixed(2)} kg`, dl <= 0 ? 'text down' : 'text up'); }
      if (S.R.alive) { bite(el.tableR, i); if (showPops) popText(el.floatR, `${dr.delta <= 0 ? '▼' : '▲'}${Math.abs(dr.delta).toFixed(2)} kg`, dr.delta <= 0 ? 'text down' : 'text up'); }
      // 사망 판정
      if (S.L.alive && Math.random() < weeklyDeathProb(S.L.age, bmi(S.L.weight))) die(S.L, 'L');
      if (S.R.alive && Math.random() < weeklyDeathProb(S.R.age, bmi(S.R.weight))) die(S.R, 'R');
      render();
      if (dr.broke) { S.hist.marks.push({ week: S.week, label: '약값 부족, 중단', color: '#C2399A' }); el.syringeR.classList.remove('on'); render();
        await ask(el.cardR, { title: '약값이 부족해 투여가 끊겼습니다', text: `잔액 ${fmt(S.R.balance)}원. 투여가 멈추면 체중이 세트 포인트로 되돌아갑니다(SURMOUNT-4: 52주 +14 %).`, options: [{ label: '확인', value: 1 }] });
        S.auto = false; el.autoBtn.classList.remove('active'); el.autoBtn.textContent = '같은 선택 반복';
        status(el.cardR, routineR());
      }
      const age = Math.max(S.L.age, S.R.age);
      if (!S.flag60 && age >= METABOLIC_DECLINE.fromAge) { S.flag60 = true; S.hist.marks.push({ week: S.week, label: '60세', color: '#8E8377' }); render();
        await ask(el.cardL, { title: '60세가 되었습니다', text: `이제부터 기초대사가 매년 ${METABOLIC_DECLINE.perYear * 100} %씩 줄어듭니다(Pontzer 2021). 같은 생활을 해도 조금씩 체중이 늘기 시작합니다.`, options: [{ label: '확인', value: 1 }] });
        status(el.cardL, S.L.alive ? routineL() : ''); S.auto = false; el.autoBtn.classList.remove('active'); el.autoBtn.textContent = '같은 선택 반복';
      }
      if (!S.L.alive && !S.R.alive) return;
      await sleep(ms);
    }
  }
  function routineL() { const P = S.L; return P.minutesPerWeek ? `주 ${P.minutesPerWeek}분 ${exerciseById(P.exerciseId).name}${P.snackHabit ? ` · 매주 ${P.snackHabit.emoji} ${P.snackHabit.name}` : ''}` : '운동 없음 · 하루 두 끼'; }
  function routineR() { const P = S.R; return `주 ${P.hoursPerWeek}시간 알바 · ${P.treating ? `${P.currentDose || doseAtWeek(P.weeksOnDrug, P.hold)} mg 투여 중` : (P.weeksOnDrug ? '투여 중단' : '미투여')} · 잔액 ${fmt(P.balance)}원`; }

  // ---------- 렌더 ----------
  function render() {
    const L = S.L, R = S.R;
    const alive = [L, R].filter((p) => p.alive);
    const age = alive.length ? Math.max(...alive.map((p) => p.age)) : Math.max(L.age, R.age);
    el.age.textContent = Math.floor(age); el.weeks.textContent = S.week; el.prev.textContent = class2ObesityPct(age).toFixed(1);
    const delta = (w) => { const d = w - CHARACTER.weight0; return `시작 대비 ${d <= 0 ? '−' : '+'}${Math.abs(d).toFixed(1)} kg`; };
    if (L.alive) { el.manL.innerHTML = manSVG({ bmi: bmi(L.weight), age: L.age, shirt: '#F28C28' }); el.wL.textContent = fmt1(L.weight); el.bmiL.textContent = fmt1(bmi(L.weight)); el.dL.textContent = delta(L.weight); }
    if (R.alive) { el.manR.innerHTML = manSVG({ bmi: bmi(R.weight), age: R.age, shirt: '#7B3FBF' }); el.wR.textContent = fmt1(R.weight); el.bmiR.textContent = fmt1(bmi(R.weight)); el.dR.textContent = delta(R.weight); }
    el.lgL.textContent = fmt1(L.weight); el.lgR.textContent = fmt1(R.weight); el.lgG.textContent = fmt1(L.ghost); el.lgDiff.textContent = fmt1(Math.abs(L.weight - R.weight));
    chart.update({ L: S.hist.L, R: S.hist.R, G: S.hist.G, snacks: S.hist.snacks, drugWeeks: S.hist.drugWeeks, marks: S.hist.marks, deadL: !L.alive, deadR: !R.alive });
  }

  // ---------- 메인 루프 ----------
  async function loop() {
    while (S.L.alive || S.R.alive) {
      const tw = turnWeeks(S.week);
      el.turnLabel.textContent = `${S.turn + 1}번째 턴 · 다음 ${tw}주`;
      if (S.L.alive) { await askSnack(tw); await askLeft(tw); }
      if (S.R.alive) { await askRight(tw); await askDrug(tw); }
      await playTurn(tw);
      S.turn += 1;
    }
    el.turnLabel.textContent = '';
  }
  render();
  loop();
  return S;
}
