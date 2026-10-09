/* ==========================================================================
   MIT 6.824 可视化学习指南 — 交互脚本
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 工具 ---------- */
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    const e = document.createElementNS(SVGNS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }

  /* ---------- 顶部导航 ---------- */
  function initNav() {
    const toggle = $('.nav-toggle');
    const links = $('.nav-links');
    if (toggle && links) {
      toggle.addEventListener('click', () => links.classList.toggle('open'));
    }
    const path = location.pathname.split('/').pop() || 'index.html';
    $$('.nav-links a').forEach(a => {
      const href = a.getAttribute('href');
      if (href === path || (path === '' && href === 'index.html')) a.classList.add('active');
    });
  }

  /* ---------- 滚动显现 ---------- */
  function initReveal() {
    const els = $$('.reveal');
    if (!els.length) return;
    if (!('IntersectionObserver' in window)) { els.forEach(e => e.classList.add('in')); return; }
    const io = new IntersectionObserver((entries) => {
      entries.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { rootMargin: '0px 0px -60px 0px', threshold: 0.05 });
    els.forEach(e => io.observe(e));
  }

  /* ---------- 侧栏目录 + 滚动高亮 ---------- */
  function initTOC() {
    const nav = $('.side-nav');
    if (!nav) return;
    const links = $$('a', nav);
    if (!links.length) return;
    const targets = links.map(a => {
      const id = (a.getAttribute('href') || '').replace('#', '');
      return document.getElementById(id);
    }).filter(Boolean);
    if (!targets.length) return;
    function onScroll() {
      const y = window.scrollY + 120;
      let active = targets[0];
      targets.forEach(t => { if (t.offsetTop <= y) active = t; });
      links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + active.id));
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ---------- 标签页 ---------- */
  function initTabs() {
    $$('.tabs').forEach(box => {
      const btns = $$('.tab-btn', box);
      const panels = $$('.tab-panel', box);
      btns.forEach((btn, i) => {
        btn.addEventListener('click', () => {
          btns.forEach(b => b.classList.remove('active'));
          panels.forEach(p => p.classList.remove('active'));
          btn.classList.add('active');
          if (panels[i]) panels[i].classList.add('active');
        });
      });
    });
  }

  /* ---------- 手风琴 ---------- */
  function initAccordion() {
    $$('.acc-head').forEach(head => {
      head.addEventListener('click', () => {
        const item = head.closest('.acc-item');
        const acc = head.closest('.acc');
        if (acc && !acc.dataset.multi) {
          $$('.acc-item', acc).forEach(it => { if (it !== item) it.classList.remove('open'); });
        }
        item.classList.toggle('open');
      });
    });
  }

  /* ---------- 代码复制 ---------- */
  function initCopy() {
    $$('.code-head').forEach(head => {
      const pre = head.nextElementSibling;
      if (!pre) return;
      const btn = document.createElement('button');
      btn.className = 'copy-btn';
      btn.textContent = '复制';
      btn.addEventListener('click', () => {
        const text = pre.innerText;
        navigator.clipboard && navigator.clipboard.writeText(text).then(() => {
          btn.textContent = '已复制 ✓';
          setTimeout(() => (btn.textContent = '复制'), 1400);
        });
      });
      head.appendChild(btn);
    });
  }

  /* ==========================================================================
     序列图播放器 —— 数据驱动的通信示例动画
     cfg = { actors:[{id,label,sub}], steps:[ {from,to,label,kind,dashed} | {note,actor} | {divider} ] }
     ========================================================================== */
  const SEQ_COLORS = {
    req: '#4f46e5', res: '#0d9488', async: '#0ea5e9', loss: '#dc2626',
    commit: '#16a34a', vote: '#9333ea', warn: '#d97706', info: '#64748b'
  };

  function SequencePlayer(mount, cfg) {
    const actors = cfg.actors;
    const steps = cfg.steps;
    const W = 720;
    const rowH = 44;
    const headH = 58;
    const padTop = headH + 14;
    const nMsg = steps.length;
    const H = padTop + nMsg * rowH + 26;
    const laneW = W / actors.length;
    const laneX = i => laneW * i + laneW / 2;
    const idx = id => actors.findIndex(a => a.id === id);

    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}`, role: 'img' });
    // defs: arrow markers
    const defs = svgEl('defs');
    Object.keys(SEQ_COLORS).forEach(k => {
      const m = svgEl('marker', { id: `arw-${k}`, viewBox: '0 0 10 10', refX: '9', refY: '5', markerWidth: '7', markerHeight: '7', orient: 'auto-start-reverse' });
      m.appendChild(svgEl('path', { d: 'M0,0 L10,5 L0,10 z', fill: SEQ_COLORS[k] }));
      defs.appendChild(m);
    });
    svg.appendChild(defs);

    // lane headers
    actors.forEach((a, i) => {
      const x = laneX(i);
      const g = svgEl('g');
      const c = a.color && SEQ_COLORS[a.color] ? SEQ_COLORS[a.color] : '#4f46e5';
      g.appendChild(svgEl('rect', { x: x - laneW / 2 + 12, y: 10, width: laneW - 24, height: 38, rx: 10, fill: '#f4f6fb', stroke: '#e3e7f1' }));
      const t = svgEl('text', { x, y: 27, 'text-anchor': 'middle', 'font-size': '13', 'font-weight': '700', fill: '#1a2038' });
      t.textContent = a.label;
      g.appendChild(t);
      if (a.sub) {
        const s = svgEl('text', { x, y: 41, 'text-anchor': 'middle', 'font-size': '10.5', fill: '#8a93ab' });
        s.textContent = a.sub; g.appendChild(s);
      }
      g.appendChild(svgEl('line', { x1: x, y1: 54, x2: x, y2: H - 10, stroke: c, 'stroke-width': '1.5', 'stroke-dasharray': '4 5', opacity: '0.35' }));
      svg.appendChild(g);
    });

    // steps
    const stepEls = [];
    steps.forEach((st, i) => {
      const y = padTop + i * rowH + rowH / 2 - 6;
      const g = svgEl('g', { opacity: '0' });
      g.style.transition = 'opacity .35s ease';
      if (st.divider) {
        g.appendChild(svgEl('line', { x1: 10, y1: y, x2: W - 10, y2: y, stroke: '#e3e7f1', 'stroke-width': '1' }));
        const t = svgEl('text', { x: 14, y: y - 6, 'font-size': '11', 'font-weight': '700', fill: '#8a93ab', 'letter-spacing': '.05em' });
        t.textContent = st.divider.toUpperCase();
        g.appendChild(t);
      } else if (st.note) {
        const ai = st.actor != null ? idx(st.actor) : 0;
        const x = laneX(ai);
        g.appendChild(svgEl('rect', { x: x - laneW / 2 + 20, y: y - 13, width: laneW - 40, height: 26, rx: 7, fill: '#fdf1de', stroke: '#f3d9a8' }));
        const t = svgEl('text', { x, y: y + 4, 'text-anchor': 'middle', 'font-size': '11.5', fill: '#92400e' });
        t.textContent = st.note; g.appendChild(t);
      } else {
        const a = idx(st.from), b = idx(st.to);
        const x1 = laneX(a), x2 = laneX(b);
        const col = SEQ_COLORS[st.kind] || SEQ_COLORS.req;
        const line = svgEl('line', { x1: x1 + (x2 > x1 ? 6 : -6), y1: y, x2: x2 + (x2 > x1 ? -6 : 6), y2: y, stroke: col, 'stroke-width': '2', 'marker-end': `url(#arw-${st.kind || 'req'})` });
        if (st.dashed) line.setAttribute('stroke-dasharray', '6 5');
        g.appendChild(line);
        const lx = (x1 + x2) / 2;
        const t = svgEl('text', { x: lx, y: y - 7, 'text-anchor': 'middle', 'font-size': '11.5', fill: col, 'font-weight': '600' });
        t.textContent = st.label || '';
        g.appendChild(t);
        if (st.sub) {
          const s2 = svgEl('text', { x: lx, y: y + 15, 'text-anchor': 'middle', 'font-size': '10.5', fill: '#8a93ab' });
          s2.textContent = st.sub; g.appendChild(s2);
        }
      }
      svg.appendChild(g);
      stepEls.push(g);
    });

    // controls
    const wrapEl = document.createElement('div');
    const ctrl = document.createElement('div');
    ctrl.className = 'seq-controls';
    const playBtn = document.createElement('button');
    playBtn.className = 'seq-btn primary'; playBtn.textContent = '▶ 播放';
    const prevBtn = document.createElement('button'); prevBtn.className = 'seq-btn'; prevBtn.textContent = '‹ 上一步';
    const nextBtn = document.createElement('button'); nextBtn.className = 'seq-btn'; nextBtn.textContent = '下一步 ›';
    const resetBtn = document.createElement('button'); resetBtn.className = 'seq-btn'; resetBtn.textContent = '⟲ 重置';
    const prog = document.createElement('span'); prog.className = 'seq-progress';
    ctrl.append(playBtn, prevBtn, nextBtn, resetBtn, prog);
    const label = document.createElement('div'); label.className = 'seq-step-label';

    wrapEl.appendChild(svg);
    wrapEl.appendChild(label);
    wrapEl.appendChild(ctrl);
    mount.appendChild(wrapEl);

    let cur = 0, timer = null;
    function render() {
      stepEls.forEach((g, i) => { g.setAttribute('opacity', i < cur ? '1' : '0'); });
      prog.textContent = `${cur} / ${stepEls.length}`;
      prevBtn.disabled = cur === 0;
      nextBtn.disabled = cur >= stepEls.length;
      const s = cur > 0 ? steps[cur - 1] : null;
      if (s) {
        label.innerHTML = s.divider ? `<b>阶段：</b>${s.divider}` : (s.note ? `<b>说明：</b>${s.note}` : `<b>${s.from} → ${s.to}</b> ${s.label || ''}${s.sub ? '　—　' + s.sub : ''}`);
      } else { label.innerHTML = '点击「播放」或「下一步」逐步查看通信过程。'; }
    }
    function stop() { if (timer) { clearInterval(timer); timer = null; } playBtn.textContent = '▶ 播放'; }
    playBtn.addEventListener('click', () => {
      if (timer) { stop(); return; }
      if (cur >= stepEls.length) cur = 0;
      playBtn.textContent = '❚❚ 暂停';
      timer = setInterval(() => {
        if (cur >= stepEls.length) { stop(); return; }
        cur++; render();
      }, 780);
      render();
    });
    prevBtn.addEventListener('click', () => { stop(); cur = Math.max(0, cur - 1); render(); });
    nextBtn.addEventListener('click', () => { stop(); cur = Math.min(stepEls.length, cur + 1); render(); });
    resetBtn.addEventListener('click', () => { stop(); cur = 0; render(); });
    render();
  }

  function initSequences() {
    $$('[data-seq]').forEach(el => {
      let cfg;
      try { cfg = JSON.parse(el.getAttribute('data-seq')); } catch (e) { return; }
      SequencePlayer(el, cfg);
    });
  }

  /* ==========================================================================
     线性一致性检查器（真实搜索 + 可视化）
     ops: [{id, client, type:'W'|'R', key, val, s, e}]  (s,e 为时间刻度)
     ========================================================================== */
  function checkLinearizable(ops) {
    const n = ops.length;
    const perm = [];
    const used = new Array(n).fill(false);
    let solution = null;
    function validPrefix(order) {
      // 实时序约束：若 A.e <= B.s，则 A 必须在 B 之前
      for (let i = 0; i < order.length; i++) {
        for (let j = i + 1; j < order.length; j++) {
          const A = ops[order[i]], B = ops[order[j]];
          if (B.e <= A.s) return false; // B 完成早于 A 开始，但排在 A 后 → 违反
        }
      }
      return true;
    }
    function stateOk(order) {
      const st = {};
      for (const i of order) {
        const o = ops[i];
        if (o.type === 'W') st[o.key] = o.val;
        else {
          const cur = (o.key in st) ? st[o.key] : null;
          if (cur !== o.val) return false;
        }
      }
      return true;
    }
    function dfs() {
      if (solution) return;
      if (perm.length === n) { if (stateOk(perm)) solution = perm.slice(); return; }
      for (let i = 0; i < n; i++) {
        if (used[i]) continue;
        used[i] = true; perm.push(i);
        if (validPrefix(perm)) dfs();
        perm.pop(); used[i] = false;
        if (solution) return;
      }
    }
    dfs();
    return { ok: !!solution, order: solution };
  }

  function renderHistory(ops) {
    const W = 700, laneH = 46, padL = 92, padR = 26, padT = 34;
    const H = padT + ops.length * laneH + 20;
    const clients = [...new Set(ops.map(o => o.client))];
    const tMax = Math.max(...ops.map(o => o.e));
    const tMin = Math.min(...ops.map(o => o.s));
    const xOf = t => padL + (t - tMin) / (tMax - tMin) * (W - padL - padR);
    const svg = svgEl('svg', { viewBox: `0 0 ${W} ${H}` });
    // time axis
    for (let t = 0; t <= tMax; t++) {
      const x = xOf(t);
      svg.appendChild(svgEl('line', { x1: x, y1: padT - 12, x2: x, y2: H - 12, stroke: '#eef1f8', 'stroke-width': '1' }));
      const tx = svgEl('text', { x, y: padT - 18, 'text-anchor': 'middle', 'font-size': '10', fill: '#8a93ab' });
      tx.textContent = t; svg.appendChild(tx);
    }
    ops.forEach((o, i) => {
      const y = padT + i * laneH + laneH / 2;
      const ci = clients.indexOf(o.client);
      const lbl = svgEl('text', { x: 12, y: y + 4, 'font-size': '12.5', 'font-weight': '700', fill: '#4b5570' });
      lbl.textContent = o.client; svg.appendChild(lbl);
      const isW = o.type === 'W';
      const col = isW ? '#4f46e5' : '#0d9488';
      const x1 = xOf(o.s), x2 = xOf(o.e);
      svg.appendChild(svgEl('rect', { x: x1, y: y - 11, width: Math.max(24, x2 - x1), height: 22, rx: 6, fill: isW ? '#eeefff' : '#e2f6f3', stroke: col, 'stroke-width': '1.4' }));
      const t = svgEl('text', { x: (x1 + x2) / 2 + (x2 - x1 < 60 ? 34 : 0), y: y + 4, 'font-size': '11.5', 'font-weight': '700', fill: col, 'text-anchor': (x2 - x1 < 60 ? 'start' : 'middle') });
      t.textContent = isW ? `put(${o.key},${o.val})` : `get(${o.key})→${o.val === null ? '∅' : o.val}`;
      svg.appendChild(t);
      svg.appendChild(svgEl('line', { x1: x1, y1: y - 16, x2: x1, y2: y + 16, stroke: col, 'stroke-width': '2' }));
      svg.appendChild(svgEl('line', { x1: x2, y1: y - 16, x2: x2, y2: y + 16, stroke: col, 'stroke-width': '2' }));
    });
    return svg;
  }

  function initLinearizability() {
    const mount = $('#linz-widget');
    if (!mount) return;
    const histories = {
      h1: {
        title: '历史 A：读到的都是"写之后"的值',
        ops: [
          { client: 'C1', type: 'W', key: 'x', val: 1, s: 0, e: 3 },
          { client: 'C2', type: 'R', key: 'x', val: 1, s: 2, e: 4 },
          { client: 'C1', type: 'W', key: 'x', val: 2, s: 4, e: 7 },
          { client: 'C2', type: 'R', key: 'x', val: 2, s: 6, e: 8 }
        ]
      },
      h2: {
        title: '历史 B：并发读写，读到旧值也合法',
        ops: [
          { client: 'C1', type: 'W', key: 'x', val: 1, s: 0, e: 3 },
          { client: 'C1', type: 'W', key: 'x', val: 2, s: 5, e: 8 },
          { client: 'C2', type: 'R', key: 'x', val: 1, s: 7, e: 9 }
        ]
      },
      h3: {
        title: '历史 C：读到"穿越"的值（有问题的历史）',
        ops: [
          { client: 'C1', type: 'W', key: 'x', val: 1, s: 0, e: 3 },
          { client: 'C1', type: 'W', key: 'x', val: 2, s: 5, e: 8 },
          { client: 'C2', type: 'R', key: 'x', val: 2, s: 4, e: 6 },
          { client: 'C2', type: 'R', key: 'x', val: 1, s: 9, e: 11 }
        ]
      },
      h4: {
        title: '历史 D：过期读（读到已被覆盖的旧值）',
        ops: [
          { client: 'C1', type: 'W', key: 'x', val: 1, s: 0, e: 2 },
          { client: 'C1', type: 'W', key: 'x', val: 2, s: 4, e: 6 },
          { client: 'C2', type: 'R', key: 'x', val: 1, s: 8, e: 10 }
        ]
      }
    };
    const stage = document.createElement('div');
    const btns = document.createElement('div');
    btns.className = 'seq-controls';
    Object.keys(histories).forEach((k, i) => {
      const b = document.createElement('button');
      b.className = 'seq-btn' + (i === 0 ? ' primary' : '');
      b.textContent = histories[k].title.split('：')[0];
      b.dataset.k = k;
      b.addEventListener('click', () => select(k, b));
      btns.appendChild(b);
    });
    const titleEl = document.createElement('div');
    titleEl.className = 'seq-step-label';
    const diagram = document.createElement('div');
    const verdict = document.createElement('div');
    verdict.style.marginTop = '14px';
    const judge = document.createElement('div');
    judge.className = 'seq-controls';
    const btnL = document.createElement('button'); btnL.className = 'seq-btn'; btnL.textContent = '✓ 判定：线性一致';
    const btnN = document.createElement('button'); btnN.className = 'seq-btn'; btnN.textContent = '✗ 判定：非线性一致';
    judge.append(btnL, btnN);

    mount.append(btns, titleEl, diagram, judge, verdict);

    let current = null;
    function select(k, btn) {
      current = k;
      $$('.seq-btn', btns).forEach(b => b.classList.remove('primary'));
      if (btn) btn.classList.add('primary');
      const h = histories[k];
      titleEl.innerHTML = `<b>${h.title}</b>　（横轴 = 真实时间；竖线 = 请求发出/收到应答的时刻）`;
      diagram.innerHTML = '';
      diagram.appendChild(renderHistory(h.ops));
      verdict.innerHTML = '';
      btnL.disabled = btnN.disabled = false;
    }
    function answer(userSaysLin) {
      if (!current) return;
      const h = histories[current];
      const res = checkLinearizable(h.ops);
      const correct = res.ok === userSaysLin;
      let html = `<div class="note-box ${correct ? 'nb-tip' : 'nb-danger'}"><span class="nb-ic">${correct ? '✅' : '❌'}</span><div>`;
      html += `<p><strong>${correct ? '判断正确！' : '再想一想～'}</strong> 这段历史实际上${res.ok ? '<strong>是</strong>' : '<strong>不是</strong>'}线性一致的。</p>`;
      if (res.ok) {
        const seq = res.order.map(i => {
          const o = h.ops[i];
          return o.type === 'W' ? `put(${o.key},${o.val})` : `get(${o.key})→${o.val}`;
        }).join(' → ');
        html += `<p>存在一种合法的线性化顺序（每个操作都能在其开始~结束之间找到一个"线性化点"）：<br><code>${seq}</code></p>`;
      } else {
        html += `<p>不存在任何一种执行顺序，能同时满足"实时先后约束"与"读写语义"。也就是说，没有任何一组"线性化点"能让结果自洽。</p>`;
      }
      html += '</div></div>';
      verdict.innerHTML = html;
    }
    btnL.addEventListener('click', () => answer(true));
    btnN.addEventListener('click', () => answer(false));
    select('h1', $('.seq-btn', btns));
  }

  /* ---------- 启动 ---------- */
  document.addEventListener('DOMContentLoaded', () => {
    initNav(); initReveal(); initTOC(); initTabs(); initAccordion(); initCopy();
    initSequences(); initLinearizability();
  });
})();
