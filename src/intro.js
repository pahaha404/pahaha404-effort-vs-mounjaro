// 인트로 모션 (약 25초). 아무 곳이나 클릭하면 마지막 장면으로 건너뛴다.
import { manSVG, tableSVG, dialSVG, setNeedle, syringeSVG } from './characters.js';
import { CHARACTER, SURMOUNT1 } from './data.js';

const $ = (s) => document.querySelector(s);

export function runIntro(onStart) {
  const intro = $('#intro');
  const scenes = [...intro.querySelectorAll('.scene')];
  const show = (name) => scenes.forEach((s) => s.classList.toggle('on', s.dataset.scene === name));

  // 장면 3·4 소품
  $('#introMan').innerHTML = manSVG({ bmi: CHARACTER.bmi0, age: 25, shirt: '#8E8377' });
  $('#introTable').innerHTML = tableSVG();
  $('#introDial').innerHTML = dialSVG({ id: 'intro', ghost: false });
  $('#introSyringe').innerHTML = syringeSVG();
  const needle = $('#intro-real');
  setNeedle(needle, CHARACTER.weight0);
  // 장면 6: 갈라지는 남성
  const titleMan = manSVG({ bmi: CHARACTER.bmi0, age: 25, shirt: '#8E8377' });
  $('#halfL').innerHTML = titleMan; $('#halfR').innerHTML = titleMan;

  const timers = [];
  const at = (ms, fn) => timers.push(setTimeout(fn, ms));
  let finished = false;
  let calTimer = null;

  function countCalendar(ms, to) {
    const el = $('#calWeeks'); const t0 = performance.now();
    cancelAnimationFrame(calTimer);
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms);
      el.textContent = Math.round(p * to);
      if (p < 1) calTimer = requestAnimationFrame(tick);
    };
    calTimer = requestAnimationFrame(tick);
  }
  function animateNeedle(ms, fromKg, toKg) {
    const t0 = performance.now();
    const tick = (now) => {
      const p = Math.min(1, (now - t0) / ms); const e = 1 - Math.pow(1 - p, 3);
      setNeedle(needle, fromKg + (toKg - fromKg) * e);
      if (p < 1 && !finished) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }

  const W0 = CHARACTER.weight0;
  // 타임라인
  at(0, () => show('q1'));
  at(3000, () => show('q2'));
  at(6000, () => {
    show('effort');
    $('#introCaption').textContent = '주 150분 운동 · 식단 관리 · 72주';
    countCalendar(4200, SURMOUNT1.weeks);
    animateNeedle(4200, W0, W0 * (1 + SURMOUNT1.placeboPct / 100));
  });
  at(11000, () => {
    $('#introSyringe').classList.add('on');
    $('#introCaption').textContent = '터제파타이드 15 mg · 72주';
    countCalendar(4200, SURMOUNT1.weeks);
    animateNeedle(4200, W0 * (1 + SURMOUNT1.placeboPct / 100), W0 * (1 + SURMOUNT1.dosePct[15] / 100));
  });
  at(16000, () => show('q3'));
  at(21000, finish);

  function finish() {
    if (finished) return;
    finished = true;
    timers.forEach(clearTimeout);
    show('title');
    $('.skip-hint').hidden = true;
  }
  intro.addEventListener('click', (e) => {
    if (e.target.id === 'startBtn') return;
    if (!finished) finish();
  });
  $('#startBtn').addEventListener('click', () => {
    intro.style.transition = 'opacity .5s';
    intro.style.opacity = '0';
    setTimeout(() => { intro.hidden = true; onStart(); }, 500);
  });
}
