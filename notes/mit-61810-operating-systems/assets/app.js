/* ============================================================
   app.js — 渲染引擎（TOC / 卡片 / 内容块 / 滚动高亮）
   ============================================================ */
(function () {
  'use strict';

  /* ---------- 顶栏高亮 ---------- */
  function initNav() {
    var f = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
    document.querySelectorAll('.navlinks a').forEach(function (a) {
      if (a.classList.contains('back')) return;   // 返回博客主页的链接不参与站内高亮
      var h = (a.getAttribute('href') || '').toLowerCase();
      if (h === f) a.classList.add('active');
    });
  }

  /* ---------- 内容块渲染 ---------- */
  function esc(s) { return String(s); }

  function renderBlocks(blocks) {
    if (!blocks) return '';
    return blocks.map(function (b) {
      switch (b.t) {
        case 'p': return '<p>' + b.html + '</p>';
        case 'h': return '<h4 class="bh">' + b.text + '</h4>';
        case 'ul': return '<ul>' + b.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ul>';
        case 'ol': return '<ol>' + b.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol>';
        case 'steps':
          return '<ol class="steps">' + b.items.map(function (i) {
            return '<li><h5>' + (i.h || '') + '</h5><p>' + (i.p || '') + '</p></li>';
          }).join('') + '</ol>';
        case 'note':
          return '<div class="note ' + (b.kind || '') + '">' +
            (b.title ? '<span class="nt">' + b.title + '</span>' : '') + b.html + '</div>';
        case 'quote':
          return '<div class="quote">' + b.html + (b.src ? '<span class="src">— ' + b.src + '</span>' : '') + '</div>';
        case 'code':
          return '<pre><code>' + String(b.text).replace(/&/g, '&amp;').replace(/</g, '&lt;') + '</code></pre>';
        case 'viz':
          var fn = window.VIZ && window.VIZ[b.id];
          return fn ? window.vizWrap(fn(), b.cap) : '';
        case 'table':
          return '<div class="tblwrap"><table><thead><tr>' +
            b.head.map(function (h) { return '<th>' + h + '</th>'; }).join('') +
            '</tr></thead><tbody>' +
            b.rows.map(function (r) {
              return '<tr>' + r.map(function (c) { return '<td>' + c + '</td>'; }).join('') + '</tr>';
            }).join('') + '</tbody></table></div>';
        case 'vs':
          return '<div class="vs"><div class="a"><h5>' + b.a.title + '</h5>' + b.a.html + '</div>' +
            '<div class="b"><h5>' + b.b.title + '</h5>' + b.b.html + '</div></div>';
        case 'acc':
          return '<details class="acc"' + (b.open ? ' open' : '') + '><summary>' + b.title + '</summary>' +
            '<div class="acc-bd">' + renderBlocks(b.blocks) + '</div></details>';
        case 'quiz':
          return '<div class="quiz"><div class="qt">想一想</div><ol>' +
            b.items.map(function (i) { return '<li>' + i + '</li>'; }).join('') + '</ol></div>';
        default: return '';
      }
    }).join('');
  }

  /* ---------- 条目卡片 ---------- */
  function renderItem(it, idx) {
    var tags = (it.tags || []).map(function (t) {
      var cls = '', name = t;
      if (t.indexOf('|') >= 0) { var p = t.split('|'); name = p[0]; cls = p[1]; }
      return '<span class="tag ' + cls + '">' + name + '</span>';
    }).join('');
    var meta = (it.meta || []).map(function (m) { return '<span><b>' + m[0] + '：</b>' + m[1] + '</span>'; }).join('');
    return '<section class="card" id="' + it.id + '">' +
      '<div class="card-hd">' +
      '<h3><span class="entryno">' + it.no + '</span>' + it.title + '</h3>' +
      (it.subtitle ? '<p class="sub">' + it.subtitle + '</p>' : '') +
      (meta ? '<div class="meta">' + meta + '</div>' : '') +
      (tags ? '<div class="tags">' + tags + '</div>' : '') +
      '</div>' +
      '<div class="card-bd">' + renderBlocks(it.blocks) + '</div>' +
      '</section>';
  }

  /* ---------- 主渲染 ---------- */
  function render(cfg) {
    var host = document.getElementById('content');
    var tocHost = document.getElementById('toc');
    if (!host) return;

    var html = '', toc = '';
    cfg.groups.forEach(function (g, gi) {
      html += '<div class="groupbar"><span class="gnum">' + (gi + 1) + '</span><h2>' + g.name + '</h2>' +
        (g.desc ? '<p>' + g.desc + '</p>' : '') + '</div>';
      if (tocHost) toc += '<div class="toc-group">' + g.name + '</div>';
      g.items.forEach(function (it) {
        html += renderItem(it);
        if (tocHost) toc += '<a href="#' + it.id + '" data-target="' + it.id + '">' + it.short + '</a>';
      });
    });
    host.innerHTML = html;
    if (tocHost) {
      tocHost.innerHTML = '<h4>本页目录</h4>' + toc;
      initScrollSpy();
    }
    initAccCtl();
  }

  /* ---------- 目录滚动高亮 ---------- */
  function initScrollSpy() {
    var links = Array.prototype.slice.call(document.querySelectorAll('#toc a[data-target]'));
    if (!links.length) return;
    var targets = links.map(function (a) { return document.getElementById(a.getAttribute('data-target')); });

    function update() {
      var y = window.scrollY + 140;
      var cur = 0;
      for (var i = 0; i < targets.length; i++) {
        if (targets[i] && targets[i].offsetTop <= y) cur = i;
      }
      links.forEach(function (a, i) { a.classList.toggle('active', i === cur); });
      var btn = document.getElementById('totop');
      if (btn) btn.classList.toggle('show', window.scrollY > 500);
    }
    window.addEventListener('scroll', update, { passive: true });
    update();

    var btn = document.getElementById('totop');
    if (btn) btn.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: 'smooth' }); });
  }

  /* ---------- 全部展开 / 收起 ---------- */
  function initAccCtl() {
    var host = document.getElementById('content');
    if (!host) return;
    var bar = document.createElement('div');
    bar.style.cssText = 'display:flex;gap:10px;justify-content:flex-end;margin:-4px 0 16px;';
    var b1 = document.createElement('button');
    b1.className = 'chip'; b1.textContent = '全部展开';
    var b2 = document.createElement('button');
    b2.className = 'chip'; b2.textContent = '全部收起';
    b1.onclick = function () { host.querySelectorAll('details.acc').forEach(function (d) { d.open = true; }); };
    b2.onclick = function () { host.querySelectorAll('details.acc').forEach(function (d) { d.open = false; }); };
    bar.appendChild(b1); bar.appendChild(b2);
    host.parentNode.insertBefore(bar, host);
  }

  window.Site = { render: render, renderBlocks: renderBlocks, initNav: initNav };
  document.addEventListener('DOMContentLoaded', initNav);
})();
