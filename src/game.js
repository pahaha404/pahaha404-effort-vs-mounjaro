// 메인 게임: 상태, 주 단위 진행, 렌더링. 체중 계산은 model.js(순수 함수)에 위임.
import {
  CHARACTER, EXERCISES, MINUTES_PER_CLICK, HOURLY_WAGE, DOSE_STEPS, MOUNJARO_ESTIMATED_DOSES, penPrice,
  SNACKS, SECONDS_PER_WEEK, SPEEDS, REWARD_GAUGE, FATIGUE_GAUGE, SURMOUNT1,
} from './data.js';
import {
  bmi, exerciseKcal, exerciseById, stepWeek, doseAtWeek, weeklyDeathProb, class2ObesityPct, snackProbPerDay,
} from './model.js';
import { manSVG, tableSVG, dialSVG, setNeedle, syringeSVG, tombSVG } from './characters.js';

const $ = (s) => document.querySelector(s);
const fmt = (n) => Math.round(n).toLocaleString('ko-KR');
const fmt1 = (n) => n.toFixed(1);

function newPerson() {
  return {
    weight: CHARACTER.weight0, ghost: CHARACTER.weight0, age: CHARACTER.age0,
    alive: true, deathAge: null,
    // 왼쪽
    exerciseId: 'walk', clicksThisWeek: 0, totalMinutes: 0, fatigue: 0, reward: 0, lockedUntil: 0,
    // 오른쪽
    balance: 0, workHours: 0, spent: 0, treating: false, weeksOnDrug: 0, hold: null, currentDose: 0, stoppedForMoney: false,
    snacksThisWeek: 0,
  };
}

export function createGame() {
  const S = {
    week: 0, speedIdx: 1, paused: false, acc: 0, mealAcc: 0, mealIdx: 0,
    L: newPerson(), R: newPerson(),
  };
  const el = {
    age: $('#age'), weeks: $('#weeks'), prev: $('#prev'), speedBtn: $('#speedBtn'), pauseBtn: $('#pauseBtn'),
    manL: $('#manL'), manR: $('#manR'), tableL: $('#tableL'), tableR: $('#tableR'), floatL: $('#floatL'), floatR: $('#floatR'),
    dialL: $('#dialL'), dialR: $('#dialR'), wL: $('#wL'), wR: $('#wR'), gL: $('#gL'), bmiL: $('#bmiL'), bmiR: $('#bmiR'),
    exChips: $('#exChips'), exBtn: $('#exBtn'), minBar: $('#minBar'), minWeek: $('#minWeek'),
    fatigueBar: $('#fatigueBar'), rewardBar: $('#rewardBar'), statusL: $('#statusL'),
    workBtn: $('#workBtn'), injectBtn: $('#injectBtn'), injectSub: $('#injectSub'), holdChk: $('#holdChk'),
    balance: $('#balance'), doseTrack: $('#doseTrack'), statusR: $('#statusR'), syringeR: $('#syringeR'),
    tombL: $('#tombL'), tombR: $('#tombR'), sideL: $('#sideL'), sideR: $('#sideR'),
  };

  // ---- 초기 DOM ----
  el.tableL.innerHTML = tableSVG(); el.tableR.innerHTML = tableSVG();
  el.dialL.innerHTML = dialSVG({ id: 'L', ghost: true, color: '#3FA34D', ghostColor: '#F28C28' });
  el.dialR.innerHTML = dialSVG({ id: 'R', ghost: false, color: '#7B3FBF' });
  el.syringeR.innerHTML = syringeSVG();
  el.exChips.innerHTML = EXERCISES.map((e) => `<button data-ex="${e.id}" class="${e.id === 'walk' ? 'on' : ''}">${e.name}<small>${e.met} MET</small></button>`).join('');
  el.doseTrack.innerHTML = DOSE_STEPS.map((d) => `<span data-dose="${d}" class="${MOUNJARO_ESTIMATED_DOSES.includes(d) ? 'est' : ''}" title="${MOUNJARO_ESTIMATED_DOSES.includes(d) ? '약값 추정' : ''}">${d}</span>`).join('');

  // ---- 입력 ----
  el.exChips.addEventListener('click', (e) => {
    const b = e.target.closest('button'); if (!b) return;
    S.L.exerciseId = b.dataset.ex;
    [...el.exChips.children].forEach((c) => c.classList.toggle('on', c === b));
  });
  const onExercise = (e) => {
    e.preventDefault();
    const P = S.L; if (!P.alive || S.paused) return;
    const now = performance.now();
    if (now < P.lockedUntil) return;
    P.fatigue += FATIGUE_GAUGE.perClick;
    if (P.fatigue >= 1) { P.fatigue = 1; P.lockedUntil = now + FATIGUE_GAUGE.lockSeconds * 1000; }
    P.clicksThisWeek += 1;
    P.reward = Math.min(1, P.reward + REWARD_GAUGE.perClick);
    renderLeftLive();
  };
  el.exBtn.addEventListener('pointerdown', onExercise);
  el.workBtn.addEventListener('pointerdown', (e) => {
    e.preventDefault();
    const P = S.R; if (!P.alive || S.paused) return;
    P.balance += HOURLY_WAGE; P.workHours += 1;
    popText(el.floatR, `+${fmt(HOURLY_WAGE)}원`);
    renderRightLive();
  });
  el.injectBtn.addEventListener('click', () => {
    const P = S.R; if (!P.alive) return;
    P.treating = !P.treating;
    P.stoppedForMoney = false;
    if (P.treating) {
      const dose = doseAtWeek(P.weeksOnDrug, P.hold);
      if (P.balance < penPrice(dose)) { P.treating = false; popText(el.floatR, '잔액 부족'); }
      else popText(el.floatR, '💉');
    }
    renderRightLive();
  });
  el.holdChk.addEventListener('change', () => {
    const P = S.R;
    P.hold = el.holdChk.checked ? (P.currentDose || doseAtWeek(P.weeksOnDrug)) : null;
    renderRightLive();
  });
  el.speedBtn.addEventListener('click', () => { S.speedIdx = (S.speedIdx + 1) % SPEEDS.length; el.speedBtn.textContent = `×${SPEEDS[S.speedIdx]}`; });
  el.pauseBtn.addEventListener('click', () => { S.paused = !S.paused; el.pauseBtn.textContent = S.paused ? '▶' : '❚❚'; el.pauseBtn.classList.toggle('active', S.paused); });
  window.addEventListener('keydown', (e) => { if (e.code === 'Space' && !e.target.closest('button,input')) { e.preventDefault(); el.pauseBtn.click(); } });

  // ---- 애니메이션 보조 ----
  function popText(layer, text, cls = 'text') {
    const d = document.createElement('div'); d.className = `pop ${cls}`; d.textContent = text;
    d.style.left = `${25 + Math.random() * 50}%`;
    layer.appendChild(d); setTimeout(() => d.remove(), 1500);
  }
  function bite(tableEl, idx) {
    const p = tableEl.querySelector(`[data-plate="${idx % 2}"]`); if (!p) return;
    p.classList.remove('eating'); void p.getBoundingClientRect(); p.classList.add('eating');
  }

  // ---- 주 단위 진행 ----
  function drawSnacks(P, onDrug) {
    let kcal = 0, n = 0; const list = [];
    for (let d = 0; d < 7; d++) {
      if (Math.random() < snackProbPerDay(P.reward, onDrug)) { const s = SNACKS[Math.floor(Math.random() * SNACKS.length)]; kcal += s.kcal; n++; list.push(s); }
    }
    return { kcal, n, list };
  }
  function advanceWeek() {
    S.week += 1;
    const L = S.L, R = S.R;
    // 왼쪽
    if (L.alive) {
      const minutes = L.clicksThisWeek * MINUTES_PER_CLICK;
      const ex = exerciseById(L.exerciseId);
      const kcal = exerciseKcal(ex.met, L.weight, minutes);
      const snack = drawSnacks(L, false);
      L.snacksThisWeek = snack.n;
      if (snack.n) snack.list.slice(0, 2).forEach((s, i) => setTimeout(() => popText(el.floatL, s.emoji, 'emoji'), i * 300));
      const next = stepWeek(L, { exerciseKcal: kcal, snackKcal: snack.kcal, doseMg: 0 });
      Object.assign(L, next);
      L.totalMinutes += minutes; L.clicksThisWeek = 0;
      L.reward *= (1 - REWARD_GAUGE.decayPerWeek);
      L.age += 1 / 52;
      if (Math.random() < weeklyDeathProb(L.age, bmi(L.weight))) die(L, 'L');
    }
    // 오른쪽
    if (R.alive) {
      let dose = 0;
      if (R.treating) {
        dose = doseAtWeek(R.weeksOnDrug, R.hold);
        const cost = penPrice(dose);
        if (R.balance >= cost) { R.balance -= cost; R.spent += cost; R.weeksOnDrug += 1; R.currentDose = dose; }
        else { R.treating = false; R.stoppedForMoney = true; dose = 0; R.currentDose = 0; }
      } else R.currentDose = 0;
      const snack = drawSnacks(R, dose > 0);
      R.snacksThisWeek = snack.n;
      if (snack.n) popText(el.floatR, snack.list[0].emoji, 'emoji');
      const next = stepWeek(R, { exerciseKcal: 0, snackKcal: snack.kcal, doseMg: dose });
      Object.assign(R, next);
      R.age += 1 / 52;
      if (Math.random() < weeklyDeathProb(R.age, bmi(R.weight))) die(R, 'R');
    }
    renderWeek();
  }
  function die(P, side) {
    P.alive = false; P.deathAge = Math.floor(P.age);
    const lines = side === 'L'
      ? [`${P.deathAge}세`, `누적 운동 ${fmt(P.totalMinutes / 60)}시간`, `누적 지출 0원`]
      : [`${P.deathAge}세`, `누적 알바 ${fmt(P.workHours)}시간`, `누적 지출 ${fmt(P.spent)}원`];
    const tomb = side === 'L' ? el.tombL : el.tombR;
    tomb.innerHTML = tombSVG(lines); tomb.hidden = false;
    (side === 'L' ? el.sideL : el.sideR).classList.add('dead');
    (side === 'L' ? el.manL : el.manR).hidden = true;
    (side === 'L' ? el.tableL : el.tableR).hidden = true;
    if (side === 'R') el.syringeR.classList.remove('on');
  }

  // ---- 렌더 ----
  function renderLeftLive() {
    const P = S.L;
    el.minBar.style.width = `${Math.min(100, (P.clicksThisWeek * MINUTES_PER_CLICK) / 250 * 100)}%`;
    el.minWeek.textContent = P.clicksThisWeek * MINUTES_PER_CLICK;
    el.fatigueBar.style.width = `${P.fatigue * 100}%`;
    el.rewardBar.style.width = `${P.reward * 100}%`;
    const locked = performance.now() < P.lockedUntil;
    el.exBtn.classList.toggle('tired', locked);
    el.fatigueBar.parentElement.classList.toggle('full', locked);
    el.exBtn.firstChild.textContent = locked ? '지쳤다…' : '운동하기';
  }
  function renderRightLive() {
    const P = S.R;
    const dose = P.treating ? doseAtWeek(P.weeksOnDrug, P.hold) : (P.currentDose || doseAtWeek(P.weeksOnDrug, P.hold));
    el.balance.textContent = fmt(P.balance);
    el.injectBtn.classList.toggle('treating', P.treating);
    el.injectBtn.firstChild.textContent = P.treating ? '투여 중단' : '주사 맞기';
    el.injectSub.textContent = `${dose} mg · 펜 1개 ${fmt(penPrice(dose))}원/주`;
    el.syringeR.classList.toggle('on', P.treating);
    [...el.doseTrack.children].forEach((c) => c.classList.toggle('on', P.treating && Number(c.dataset.dose) === dose));
    el.holdChk.checked = !!P.hold;
    let st;
    if (!P.alive) st = '';
    else if (P.treating) st = `투여 중 · ${dose} mg${P.hold ? ' 유지' : ' (4주마다 증량)'} · 매주 ${fmt(penPrice(dose))}원 차감`;
    else if (P.stoppedForMoney) st = `약값 부족으로 중단 · 체중이 되돌아옵니다 (SURMOUNT-4 회복 곡선)`;
    else st = P.weeksOnDrug ? '투여 중단 · 체중이 되돌아옵니다' : '미투여 · 알바로 약값을 모으세요';
    el.statusR.textContent = st;
  }
  function renderWeek() {
    const L = S.L, R = S.R;
    const alive = [L, R].filter((p) => p.alive);
    const age = alive.length ? Math.max(...alive.map((p) => p.age)) : Math.max(L.age, R.age);
    el.age.textContent = Math.floor(age);
    el.weeks.textContent = S.week;
    el.prev.textContent = class2ObesityPct(age).toFixed(1);
    if (L.alive) {
      el.manL.innerHTML = manSVG({ bmi: bmi(L.weight), age: L.age, shirt: '#F28C28' });
      setNeedle($('#L-real'), L.weight); setNeedle($('#L-ghost'), L.ghost);
      el.wL.textContent = fmt1(L.weight); el.gL.textContent = fmt1(L.ghost); el.bmiL.textContent = fmt1(bmi(L.weight));
      el.statusL.textContent = L.snacksThisWeek ? `이번 주 간식 ${L.snacksThisWeek}번 · 하루 두 끼` : '하루 두 끼 · 간식 없음';
    }
    if (R.alive) {
      el.manR.innerHTML = manSVG({ bmi: bmi(R.weight), age: R.age, shirt: '#7B3FBF' });
      setNeedle($('#R-real'), R.weight);
      el.wR.textContent = fmt1(R.weight); el.bmiR.textContent = fmt1(bmi(R.weight));
    }
    renderLeftLive(); renderRightLive();
  }

  // ---- 루프 ----
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(0.1, (now - last) / 1000); last = now;
    const L = S.L;
    // 피로는 실시간으로 빠진다(속도와 무관)
    if (L.alive && !S.paused) {
      L.fatigue = Math.max(0, L.fatigue - FATIGUE_GAUGE.decayPerSecond * dt);
      renderLeftLive();
    }
    if (!S.paused && (S.L.alive || S.R.alive)) {
      const speed = SPEEDS[S.speedIdx];
      S.acc += dt * speed;
      // 식사 애니메이션: 주당 14끼, 너무 빠르면 생략
      const mealEvery = SECONDS_PER_WEEK / 14;
      S.mealAcc += dt * speed;
      if (S.mealAcc >= mealEvery) {
        S.mealAcc = 0; S.mealIdx++;
        if (speed <= 4) { if (S.L.alive) bite(el.tableL, S.mealIdx); if (S.R.alive) bite(el.tableR, S.mealIdx); }
      }
      let guard = 0;
      while (S.acc >= SECONDS_PER_WEEK && guard++ < 64) { S.acc -= SECONDS_PER_WEEK; advanceWeek(); }
    }
    requestAnimationFrame(frame);
  }
  renderWeek();
  requestAnimationFrame(frame);
  return S;
}
