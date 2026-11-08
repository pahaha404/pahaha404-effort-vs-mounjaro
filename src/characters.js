// 인라인 SVG 생성기 — 캐릭터, 테이블, 체중계, 주사기, 묘비
import { CHARACTER } from './data.js';

const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function mixHex(h1, h2, t) {
  const p = (h) => [1, 3, 5].map((i) => parseInt(h.slice(i, i + 2), 16));
  const [a, b] = [p(h1), p(h2)];
  return '#' + a.map((v, i) => Math.round(lerp(v, b[i], t)).toString(16).padStart(2, '0')).join('');
}

/** 나이 → 머리색 (검정 → 회색 → 흰색) */
export function hairColor(age) {
  if (age < 42) return '#2B2118';
  if (age < 62) return mixHex('#2B2118', '#9B948C', (age - 42) / 20);
  return mixHex('#9B948C', '#EDE7DC', clamp((age - 62) / 22, 0, 1));
}

/**
 * 뽀글머리 남성. bmi로 체형 폭, age로 머리색·주름이 연속 변한다.
 * shirt: 셔츠 색. viewBox 200×260.
 */
export function manSVG({ bmi = CHARACTER.bmi0, age = 25, shirt = '#F28C28', pants = '#6B5A4B', skin = '#F5C9A2' } = {}) {
  const f = clamp(Math.sqrt(bmi / 23), 0.82, 1.6);       // 체형 폭 계수 (BMI 23 = 1.0)
  const w = 58 * f;                                        // 몸통 폭
  const belly = 44 * f;                                    // 배 반지름
  const faceR = 28 + 7 * (f - 1);                          // 볼살
  const hair = hairColor(age);
  const wr = clamp((age - 45) / 35, 0, 1);                 // 주름 진하기
  const cx = 100;
  const curls = [];
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (0.05 + (i / 8) * 0.9);
    const x = cx - Math.cos(a) * (faceR + 2), y = 62 - Math.sin(a) * (faceR + 2);
    curls.push(`<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="11" fill="${hair}"/>`);
  }
  for (let i = 0; i < 6; i++) {
    const x = cx - 24 + i * 9.6;
    curls.push(`<circle cx="${x}" cy="${36 + (i % 2) * 3}" r="9" fill="${hair}"/>`);
  }
  const armL = `M${(cx - w / 2 - 2).toFixed(1)} 108 q -22 30 -14 78`;
  const armR = `M${(cx + w / 2 + 2).toFixed(1)} 108 q 22 30 14 78`;
  return `
<svg viewBox="0 0 200 260" xmlns="http://www.w3.org/2000/svg" aria-label="남성 캐릭터">
  <g class="legs">
    <rect x="${cx - w / 2 + 6}" y="178" width="${w / 2 - 9}" height="66" rx="10" fill="${pants}"/>
    <rect x="${cx + 3}" y="178" width="${w / 2 - 9}" height="66" rx="10" fill="${pants}"/>
    <rect x="${cx - w / 2 + 2}" y="236" width="${w / 2 - 4}" height="16" rx="8" fill="#2B2118"/>
    <rect x="${cx + 2}" y="236" width="${w / 2 - 4}" height="16" rx="8" fill="#2B2118"/>
  </g>
  <g class="arms" fill="none" stroke="${skin}" stroke-width="15" stroke-linecap="round">
    <path d="${armL}"/><path d="${armR}"/>
  </g>
  <g class="body">
    <ellipse cx="${cx}" cy="150" rx="${belly}" ry="${50 + 8 * (f - 1)}" fill="${shirt}"/>
    <rect x="${cx - w / 2}" y="92" width="${w}" height="70" rx="${Math.min(30, w / 2)}" fill="${shirt}"/>
    <ellipse cx="${cx}" cy="150" rx="${belly * 0.55}" ry="${26}" fill="#fff" opacity=".12"/>
  </g>
  <g class="head">
    <rect x="${cx - 9}" y="78" width="18" height="18" fill="${skin}"/>
    ${curls.join('')}
    <circle cx="${cx}" cy="62" r="${faceR}" fill="${skin}"/>
    <g class="wrinkles" stroke="#B88A66" stroke-width="2" fill="none" stroke-linecap="round" opacity="${wr.toFixed(2)}">
      <path d="M${cx - 14} 44 q 14 -4 28 0"/><path d="M${cx - 10} 38 q 10 -3 20 0"/>
      <path d="M${cx - 22} 70 q -3 5 0 10"/><path d="M${cx + 22} 70 q 3 5 0 10"/>
      <path d="M${cx - 18} 56 q -4 2 -6 6"/><path d="M${cx + 18} 56 q 4 2 6 6"/>
    </g>
    <circle cx="${cx - 10}" cy="58" r="3.2" fill="#2B2118"/><circle cx="${cx + 10}" cy="58" r="3.2" fill="#2B2118"/>
    <path d="M${cx - 7} 72 q 7 ${5 + 3 * (f - 1)} 14 0" stroke="#2B2118" stroke-width="2.5" fill="none" stroke-linecap="round"/>
    <circle cx="${cx - 18}" cy="68" r="5" fill="#F09A8A" opacity=".55"/><circle cx="${cx + 18}" cy="68" r="5" fill="#F09A8A" opacity=".55"/>
  </g>
</svg>`;
}

/** 빨간 테이블 + 접시 두 개(하루 두 끼). viewBox 300×70 */
export function tableSVG({ plates = 2 } = {}) {
  const ps = [];
  for (let i = 0; i < plates; i++) {
    const x = 150 + (i - (plates - 1) / 2) * 70;
    ps.push(`<g class="plate" data-plate="${i}"><ellipse cx="${x}" cy="22" rx="26" ry="9" fill="#fff" stroke="#E6D8C3" stroke-width="2"/><ellipse cx="${x}" cy="20" rx="14" ry="5" fill="#F7C873"/><ellipse cx="${x - 6}" cy="19" rx="5" ry="3" fill="#3FA34D"/><ellipse cx="${x + 7}" cy="19" rx="5" ry="3" fill="#D7392B"/></g>`);
  }
  return `
<svg viewBox="0 0 300 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
  <rect x="10" y="26" width="280" height="16" rx="6" fill="#D7392B"/>
  <rect x="10" y="26" width="280" height="5" rx="3" fill="#fff" opacity=".25"/>
  <rect x="30" y="42" width="12" height="28" rx="4" fill="#B52C21"/><rect x="258" y="42" width="12" height="28" rx="4" fill="#B52C21"/>
  ${ps.join('')}
</svg>`;
}

/** 반원 체중계. 60–130 kg. ghost: 유령 바늘 포함 여부. */
export function dialSVG({ id, ghost = false, color = '#2B2118', ghostColor = '#F28C28', min = 60, max = 130 } = {}) {
  const ticks = [];
  for (let kg = min; kg <= max; kg += 10) {
    const a = Math.PI * (1 - (kg - min) / (max - min));
    const x1 = 100 + Math.cos(a) * 78, y1 = 96 - Math.sin(a) * 78;
    const x2 = 100 + Math.cos(a) * 68, y2 = 96 - Math.sin(a) * 68;
    const tx = 100 + Math.cos(a) * 56, ty = 96 - Math.sin(a) * 56;
    ticks.push(`<line x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="#2B2118" stroke-width="2"/><text x="${tx.toFixed(1)}" y="${(ty + 4).toFixed(1)}" font-size="10" text-anchor="middle" fill="#7A6A5C" font-weight="700">${kg}</text>`);
  }
  return `
<svg viewBox="0 0 200 112" xmlns="http://www.w3.org/2000/svg" aria-label="체중계">
  <path d="M14 96 A86 86 0 0 1 186 96" fill="#fff" stroke="#E6D8C3" stroke-width="3"/>
  ${ticks.join('')}
  ${ghost ? `<line id="${id}-ghost" class="needle ghost" x1="100" y1="96" x2="100" y2="22" stroke="${ghostColor}" stroke-width="3" stroke-dasharray="5 4" stroke-linecap="round" opacity=".9"/>` : ''}
  <line id="${id}-real" class="needle real" x1="100" y1="96" x2="100" y2="20" stroke="${color}" stroke-width="4" stroke-linecap="round"/>
  <circle cx="100" cy="96" r="7" fill="${color}"/>
</svg>`;
}
/** 바늘 각도 적용. 각 바늘은 (100,96) 기준 회전. */
export function setNeedle(el, kg, min = 60, max = 130) {
  if (!el) return;
  const t = clamp((kg - min) / (max - min), -0.03, 1.03);
  const deg = -90 + t * 180;
  el.setAttribute('transform', `rotate(${deg.toFixed(2)} 100 96)`);
}

/** 주사기 (보라). viewBox 120×60 */
export function syringeSVG(color = '#7B3FBF', accent = '#C2399A') {
  return `
<svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-label="주사기">
  <rect x="26" y="20" width="62" height="20" rx="4" fill="#fff" stroke="${color}" stroke-width="3"/>
  <rect x="30" y="24" width="34" height="12" rx="2" fill="${accent}" opacity=".7"/>
  <rect x="88" y="26" width="24" height="8" rx="2" fill="${color}"/>
  <rect x="110" y="29" width="8" height="2" fill="${color}"/>
  <rect x="8" y="22" width="20" height="16" rx="3" fill="${color}"/>
  <rect x="2" y="16" width="8" height="28" rx="3" fill="${color}"/>
</svg>`;
}

/** 묘비. lines: 문자열 배열(최대 4줄). */
export function tombSVG(lines = []) {
  const ts = lines.map((l, i) => `<text x="100" y="${74 + i * 24}" text-anchor="middle" font-size="${i === 0 ? 20 : 13}" font-weight="${i === 0 ? 800 : 700}" fill="#2B2118">${l}</text>`).join('');
  return `
<svg viewBox="0 0 200 190" xmlns="http://www.w3.org/2000/svg" aria-label="묘비">
  <ellipse cx="100" cy="176" rx="90" ry="12" fill="#3FA34D" opacity=".45"/>
  <path d="M30 172 V70 A70 70 0 0 1 170 70 V172 Z" fill="#B9AFA3" stroke="#8E8377" stroke-width="3"/>
  <path d="M42 172 V72 A58 58 0 0 1 158 72 V172" fill="none" stroke="#fff" stroke-width="2" opacity=".5"/>
  <text x="100" y="44" text-anchor="middle" font-size="12" font-weight="800" fill="#8E8377">R.I.P.</text>
  ${ts}
</svg>`;
}
