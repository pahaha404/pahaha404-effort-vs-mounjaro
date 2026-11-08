// 두 사람의 체중 타임라인 차트 (인라인 SVG). 주황 실선 = 노력, 보라 실선 = 주사, 주황 점선 = 칼로리 계산상.
const NS = 'http://www.w3.org/2000/svg';
const PAD = { l: 44, r: 16, t: 14, b: 30 };

export function createChart(root) {
  const narrow = root.clientWidth > 0 && root.clientWidth < 700;   // 모바일: 더 높은 비율
  const W = narrow ? 600 : 1000, H = narrow ? 260 : 210;
  root.innerHTML = `
<svg viewBox="0 0 ${W} ${H}" xmlns="${NS}" aria-label="체중 타임라인" style="width:100%;display:block">
  <defs><clipPath id="ch-clip"><rect x="0" y="0" width="${W}" height="${H - PAD.b}"/></clipPath></defs>
  <g id="ch-drug"></g>
  <g id="ch-grid" stroke="#E6D8C3" stroke-width="1"></g>
  <g id="ch-axis" font-size="12" font-weight="700" fill="#7A6A5C"></g>
  <polyline id="ch-ghost" clip-path="url(#ch-clip)" fill="none" stroke="#F28C28" stroke-width="2" stroke-dasharray="6 5" opacity=".85"/>
  <polyline id="ch-L" fill="none" stroke="#F28C28" stroke-width="3.5" stroke-linejoin="round"/>
  <polyline id="ch-R" fill="none" stroke="#7B3FBF" stroke-width="3.5" stroke-linejoin="round"/>
  <g id="ch-snacks"></g>
  <g id="ch-marks" font-size="11" font-weight="700" style="paint-order:stroke" stroke="#fff" stroke-width="3"></g>
  <circle id="ch-dotL" r="5" fill="#F28C28" stroke="#fff" stroke-width="2"/>
  <circle id="ch-dotR" r="5" fill="#7B3FBF" stroke="#fff" stroke-width="2"/>
</svg>`;
  const $ = (id) => root.querySelector('#' + id);
  const el = { drug: $('ch-drug'), grid: $('ch-grid'), axis: $('ch-axis'), ghost: $('ch-ghost'), L: $('ch-L'), R: $('ch-R'), snacks: $('ch-snacks'), marks: $('ch-marks'), dotL: $('ch-dotL'), dotR: $('ch-dotR') };

  /** data: { L:number[], R:number[], G:number[], snacks:number[] (week idx), drugWeeks:number[] (week idx on drug), marks:[{week,label}], deadL, deadR } */
  function update(d) {
    const n = Math.max(d.L.length, d.R.length);
    const xmax = Math.max(52, n - 1);
    const all = [...d.L, ...d.R].filter(Number.isFinite); // 유령선은 눈금에 영향 주지 않고 아래로 잘린다
    let ymin = Math.min(...all) - 2, ymax = Math.max(...all) + 2;
    if (ymax - ymin < 12) { const c = (ymin + ymax) / 2; ymin = c - 6; ymax = c + 6; }
    const x = (w) => PAD.l + (w / xmax) * (W - PAD.l - PAD.r);
    const y = (kg) => PAD.t + (1 - (kg - ymin) / (ymax - ymin)) * (H - PAD.t - PAD.b);
    const pts = (arr) => arr.map((v, i) => `${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
    el.L.setAttribute('points', pts(d.L)); el.R.setAttribute('points', pts(d.R)); el.ghost.setAttribute('points', pts(d.G));
    // y grid
    let g = '', a = '';
    const step = (ymax - ymin) > 40 ? 10 : 5;
    for (let kg = Math.ceil(ymin / step) * step; kg <= ymax; kg += step) {
      g += `<line x1="${PAD.l}" x2="${W - PAD.r}" y1="${y(kg).toFixed(1)}" y2="${y(kg).toFixed(1)}"/>`;
      a += `<text x="${PAD.l - 6}" y="${(y(kg) + 4).toFixed(1)}" text-anchor="end">${kg}</text>`;
    }
    // x axis: 년
    const yearStep = xmax <= 156 ? 1 : xmax <= 520 ? 2 : xmax <= 1560 ? 5 : 10;
    for (let yr = 0; yr * 52 <= xmax; yr += yearStep) {
      const xx = x(yr * 52);
      g += `<line x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${PAD.t}" y2="${H - PAD.b}" opacity=".6"/>`;
      a += `<text x="${xx.toFixed(1)}" y="${H - 10}" text-anchor="middle">${yr === 0 ? '시작' : yr + '년'}</text>`;
    }
    el.grid.innerHTML = g; el.axis.innerHTML = a;
    // 투여 구간 음영
    let dr = '';
    if (d.drugWeeks && d.drugWeeks.length) {
      let s = d.drugWeeks[0], prev = s;
      const flush = () => { dr += `<rect x="${x(s).toFixed(1)}" y="${PAD.t}" width="${Math.max(1, x(prev + 1) - x(s)).toFixed(1)}" height="${H - PAD.t - PAD.b}" fill="#7B3FBF" opacity=".08"/>`; };
      for (let i = 1; i < d.drugWeeks.length; i++) { const w = d.drugWeeks[i]; if (w !== prev + 1) { flush(); s = w; } prev = w; }
      flush();
    }
    el.drug.innerHTML = dr;
    el.snacks.innerHTML = (d.snacks || []).filter((w) => w < d.L.length).map((w) => `<circle cx="${x(w).toFixed(1)}" cy="${y(d.L[w]).toFixed(1)}" r="4" fill="#fff" stroke="#D7392B" stroke-width="2"/>`).join('');
    el.marks.innerHTML = (d.marks || []).map((m, i) => { const xx = x(m.week); const right = xx > W * 0.8; return `<line x1="${xx.toFixed(1)}" x2="${xx.toFixed(1)}" y1="${PAD.t}" y2="${H - PAD.b}" stroke="${m.color || '#2B2118'}" stroke-width="1.5" stroke-dasharray="3 3" stroke-opacity=".8"/><text x="${(xx + (right ? -4 : 4)).toFixed(1)}" y="${PAD.t + 12 + (i % 2) * 14}" text-anchor="${right ? 'end' : 'start'}" fill="${m.color || '#2B2118'}" stroke="#fff" stroke-width="3" paint-order="stroke">${m.label}</text>`; }).join('');
    const last = (arr) => arr.length ? arr[arr.length - 1] : null;
    const setDot = (dot, arr, dead) => { if (!arr.length || dead) { dot.setAttribute('r', 0); return; } dot.setAttribute('r', 5); dot.setAttribute('cx', x(arr.length - 1).toFixed(1)); dot.setAttribute('cy', y(last(arr)).toFixed(1)); };
    setDot(el.dotL, d.L, d.deadL); setDot(el.dotR, d.R, d.deadR);
  }
  return { update };
}
