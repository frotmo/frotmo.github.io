/* ============================================================
   frotmo 学习笔记 · 主页交互

   零依赖：不引入任何框架或 CDN。内容全部来自 assets/manifest.js，
   这个文件只负责把它渲染成 DOM。

   ── 为什么用 manifest.js 而不是 manifest.json ──────────────
   JSON 需要用 fetch() 读取，而 fetch 在 file:// 协议下会被
   CORS 拦掉 —— 那样本地双击打开 index.html 就是一片空白。
   用 JS 赋值给全局变量则 http/https/file 三种方式都能工作，
   排查问题时不用先起一个服务器。
   ============================================================ */

(function () {
  'use strict';

  const $ = (sel) => document.querySelector(sel);

  /* ── 兜底：清单没加载出来时给出可读的提示，而不是白屏 ── */
  const M = window.SITE_MANIFEST;
  if (!M) {
    document.addEventListener('DOMContentLoaded', () => {
      const box = $('#notes');
      if (box) {
        box.innerHTML =
          '<div class="empty">清单文件 assets/manifest.js 没有加载成功。<br>' +
          '请确认它与 index.html 在同一站点的 assets/ 目录下。</div>';
      }
    });
    return;
  }

  const CATS = {};
  (M.categories || []).forEach((c) => { CATS[c.id] = c; });

  /* 只有 status 不是 published 的条目才会被过滤掉；
     status 留空视为已发布，方便新增时少写一个字段。 */
  const NOTES = (M.notes || []).filter((n) => !n.status || n.status === 'published');

  /* ── 工具 ── */
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 允许内容里写少量 <b> / <code>，其余按纯文本处理
  const rich = (s) => esc(s).replace(/&lt;(\/?)(b|code|i)&gt;/g, '<$1$2>');

  const catStyle = (id) => {
    const c = CATS[id];
    return c ? `--cat-color:${c.color};--cat-soft:${c.soft}` : '';
  };

  const fmtDate = (s) => {
    if (!s) return '';
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
    return m ? `${m[1]}.${m[2]}.${m[3]}` : s;
  };

  /* ── 首屏统计 ── */
  function renderStats() {
    const box = $('#stats');
    if (!box) return;
    const n = NOTES.length;
    const tags = new Set();
    NOTES.forEach((x) => (x.tags || []).forEach((t) => tags.add(t)));
    const catUsed = new Set(NOTES.map((x) => x.category)).size;

    const items = [
      { val: String(n), unit: '篇', key: '已发布笔记' },
      { val: String(catUsed), unit: '个', key: '涉及方向' },
      { val: String(tags.size), unit: '个', key: '标签' },
      { val: fmtDate(M.site && M.site.updated), unit: '', key: '最近更新' }
    ];
    box.innerHTML = items.map((i) => `
      <div class="stat">
        <div class="stat-val">${esc(i.val)}${i.unit ? `<span class="unit">${esc(i.unit)}</span>` : ''}</div>
        <div class="stat-key">${esc(i.key)}</div>
      </div>`).join('');
  }

  /* ── 精选笔记 ── */
  function renderFeatured() {
    const box = $('#featured');
    if (!box) return;
    const f = NOTES.find((n) => n.featured) || NOTES[0];
    if (!f) { box.innerHTML = ''; return; }

    box.innerHTML = `
      <a class="feat" href="${esc(f.path)}" style="${catStyle(f.category)}">
        <div class="feat-top">
          <span class="badge-feat">精选</span>
          <span class="badge-cat">${esc((CATS[f.category] || {}).name || f.category)}</span>
          <span class="feat-meta">${esc(fmtDate(f.date))}${f.readingTime ? ' · ' + esc(f.readingTime) : ''}</span>
        </div>
        <div class="feat-body">
          <h3>${esc(f.title)}</h3>
          ${f.subtitle ? `<p class="feat-sub">${esc(f.subtitle)}</p>` : ''}
          ${f.summary ? `<p class="feat-sum">${rich(f.summary)}</p>` : ''}

          ${(f.metrics || []).length ? `
          <div class="feat-metrics">
            ${f.metrics.map((m) => `
              <div class="fm${m.good ? ' good' : ''}">
                <div class="fm-val">${esc(m.val)}${m.unit ? `<span class="unit">${esc(m.unit)}</span>` : ''}</div>
                <div class="fm-key">${esc(m.key)}</div>
              </div>`).join('')}
          </div>` : ''}

          <div class="feat-cols">
            ${(f.sections || []).length ? `
            <div class="feat-block">
              <h4>这篇讲了什么</h4>
              <ul class="feat-list">${f.sections.map((s) => `<li>${rich(s)}</li>`).join('')}</ul>
            </div>` : '<div></div>'}
            ${f.highlight ? `
            <div class="feat-block">
              <h4>最值得记住的结论</h4>
              <div class="feat-hl">${rich(f.highlight)}</div>
            </div>` : ''}
          </div>

          <span class="feat-cta">开始阅读 →</span>
        </div>
      </a>`;
  }

  /* ── 筛选 + 搜索 + 笔记卡片 ── */
  let curCat = 'all';
  let curQ = '';

  function renderFilter() {
    const bar = $('#filter');
    if (!bar) return;
    const counts = {};
    NOTES.forEach((n) => { counts[n.category] = (counts[n.category] || 0) + 1; });

    const cats = [{ id: 'all', name: '全部' }]
      .concat((M.categories || []).filter((c) => counts[c.id]));

    bar.innerHTML = cats.map((c) => `
      <button class="chip${c.id === curCat ? ' active' : ''}" data-cat="${esc(c.id)}" type="button">
        ${esc(c.name)}<span class="n">${c.id === 'all' ? NOTES.length : counts[c.id]}</span>
      </button>`).join('') +
      `<div class="search">
         <input type="search" id="q" placeholder="搜索标题、摘要、标签…"
                value="${esc(curQ)}" aria-label="搜索笔记">
       </div>`;

    bar.querySelectorAll('.chip').forEach((b) => {
      b.addEventListener('click', () => { curCat = b.dataset.cat; renderFilter(); renderNotes(); });
    });
    const q = $('#q');
    if (q) {
      q.addEventListener('input', () => { curQ = q.value.trim(); renderNotes(); });
    }
  }

  function matched() {
    const q = curQ.toLowerCase();
    return NOTES.filter((n) => {
      if (curCat !== 'all' && n.category !== curCat) return false;
      if (!q) return true;
      const hay = [n.title, n.subtitle, n.summary, (n.tags || []).join(' '), n.slug]
        .filter(Boolean).join(' ').toLowerCase();
      return hay.indexOf(q) >= 0;
    });
  }

  function renderNotes() {
    const box = $('#notes');
    if (!box) return;
    const list = matched();

    if (!list.length) {
      box.innerHTML = '<div class="empty">没有匹配的笔记。换个关键词，或点「全部」看看。</div>';
      return;
    }

    box.innerHTML = list.map((n) => `
      <article class="note" style="${catStyle(n.category)}">
        <div class="note-head">
          <span class="badge-cat">${esc((CATS[n.category] || {}).name || n.category)}</span>
          <span class="note-date">${esc(fmtDate(n.date))}</span>
        </div>
        <h3><a href="${esc(n.path)}">${esc(n.title)}</a></h3>
        ${n.subtitle ? `<p class="note-sub">${esc(n.subtitle)}</p>` : ''}
        ${n.summary ? `<p class="note-sum">${rich(n.summary)}</p>` : ''}
        ${(n.tags || []).length ? `
        <div class="note-tags">${n.tags.map((t) => `<span class="tag">${esc(t)}</span>`).join('')}</div>` : ''}
        <div class="note-foot">
          ${n.readingTime ? `<span>${esc(n.readingTime)}</span>` : '<span></span>'}
          <span class="note-go">阅读 →</span>
        </div>
      </article>`).join('');
  }

  /* ── 规划中 ── */
  function renderRoadmap() {
    const box = $('#roadmap');
    if (!box) return;
    const list = M.roadmap || [];
    if (!list.length) { box.innerHTML = ''; return; }
    box.innerHTML = list.map((r) => `
      <div class="rm" style="${catStyle(r.category)}">
        <div class="rm-head">
          <span class="rm-dot"></span>
          <h3>${esc(r.title)}</h3>
          <span class="rm-badge">规划中</span>
        </div>
        ${r.note ? `<p>${rich(r.note)}</p>` : ''}
      </div>`).join('');
  }

  /* ── 站点级文案 ── */
  function renderSite() {
    const s = M.site || {};
    const set = (sel, v) => { const el = $(sel); if (el && v) el.textContent = v; };
    set('#siteTitle', s.title);
    set('#siteTagline', s.tagline);
    set('#siteIntro', s.intro);
    set('#footerTitle', s.title);
    set('#footerAuthor', s.author);

    const y = $('#year');
    if (y) y.textContent = String(new Date().getFullYear());

    const gh = $('#ghLink');
    if (gh && s.repo) {
      gh.href = s.repo;
      gh.style.display = '';
    }
    const gh2 = $('#ghLinkFoot');
    if (gh2 && s.repo) gh2.href = s.repo;

    if (s.title) document.title = s.title + ' · 可视化学习文档';
  }

  /* ── 导航 ── */
  function initNav() {
    const toggle = $('#navToggle');
    const nav = $('#nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => {
        nav.classList.remove('open');
        toggle.setAttribute('aria-expanded', 'false');
      }));
    }

    const links = Array.prototype.slice.call(document.querySelectorAll('#nav a'));
    const targets = links
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!targets.length) return;

    const onScroll = () => {
      const y = window.scrollY + 130;
      let idx = 0;
      targets.forEach((t, i) => { if (t.offsetTop <= y) idx = i; });
      links.forEach((a, i) => a.classList.toggle('active', i === idx));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── 启动 ── */
  function init() {
    renderSite();
    renderStats();
    renderFeatured();
    renderFilter();
    renderNotes();
    renderRoadmap();
    initNav();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
