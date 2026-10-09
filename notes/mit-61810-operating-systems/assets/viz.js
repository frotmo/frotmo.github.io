/* ============================================================
   viz.js — 内联 SVG 可视化图库（浅色主题，零依赖）
   每个函数返回一段 <svg> 字符串，由数据文件按 id 引用。
   ============================================================ */
(function (global) {
  'use strict';

  var C = {
    ink: '#1c2024', dim: '#7b848f', line: '#c3ccd6', line2: '#aab4c0',
    blue: '#2563eb', blueL: '#e8f0fe', blueD: '#1e40af',
    purple: '#7c3aed', purpleL: '#f3e9fe',
    teal: '#0d9488', tealL: '#e2f4f1',
    amber: '#b45309', amberL: '#fdf0e0',
    rose: '#be123c', roseL: '#fdeaef',
    green: '#15803d', greenL: '#e6f4ea',
    gray: '#f0f2f5', gray2: '#e3e7ec', white: '#ffffff'
  };

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  /* ---------- 基础图元 ---------- */
  function rect(x, y, w, h, o) {
    o = o || {};
    return '<rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="' + (o.r == null ? 7 : o.r) +
      '" fill="' + (o.fill || C.white) + '" stroke="' + (o.stroke || C.line) + '" stroke-width="' + (o.lw || 1.2) + '"' +
      (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') + (o.op ? ' opacity="' + o.op + '"' : '') + '/>';
  }
  function text(x, y, s, o) {
    o = o || {};
    return '<text x="' + x + '" y="' + y + '" fill="' + (o.fill || C.ink) + '" font-size="' + (o.size || 12.5) +
      '" font-family="' + (o.mono ? 'ui-monospace,Consolas,monospace' : 'system-ui,-apple-system,"Microsoft YaHei",sans-serif') +
      '" text-anchor="' + (o.anchor || 'middle') + '" font-weight="' + (o.weight || 400) + '"' +
      (o.op ? ' opacity="' + o.op + '"' : '') + '>' + esc(s) + '</text>';
  }
  function line(x1, y1, x2, y2, o) {
    o = o || {};
    return '<line x1="' + x1 + '" y1="' + y1 + '" x2="' + x2 + '" y2="' + y2 +
      '" stroke="' + (o.stroke || C.line2) + '" stroke-width="' + (o.lw || 1.3) + '"' +
      (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') +
      (o.marker ? ' marker-end="url(#' + o.marker + ')"' : '') + '/>';
  }
  function path(d, o) {
    o = o || {};
    return '<path d="' + d + '" fill="' + (o.fill || 'none') + '" stroke="' + (o.stroke || C.line2) +
      '" stroke-width="' + (o.lw || 1.3) + '"' + (o.dash ? ' stroke-dasharray="' + o.dash + '"' : '') +
      (o.marker ? ' marker-end="url(#' + o.marker + ')"' : '') + '/>';
  }
  /* 竖直/水平折线箭头 */
  function elbow(x1, y1, x2, y2, o) {
    o = o || {};
    var d = 'M' + x1 + ',' + y1 + ' L' + x1 + ',' + ((y1 + y2) / 2) + ' L' + x2 + ',' + ((y1 + y2) / 2) + ' L' + x2 + ',' + y2;
    return path(d, o);
  }
  function circle(x, y, r, o) {
    o = o || {};
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + (o.fill || C.white) +
      '" stroke="' + (o.stroke || C.line) + '" stroke-width="' + (o.lw || 1.2) + '"/>';
  }
  /* 带标题的层框 */
  function layer(x, y, w, h, title, o) {
    o = o || {};
    var s = rect(x, y, w, h, { fill: o.fill || C.gray, stroke: o.stroke || C.line, dash: o.dash, r: 9 });
    if (title) s += text(x + 11, y + 17, title, { anchor: 'start', size: 12, weight: 700, fill: o.titleFill || C.dim });
    return s;
  }
  function tag(x, y, s, o) {
    o = o || {};
    var w = (s.length * 7.2 + 16);
    return '<g><rect x="' + x + '" y="' + y + '" width="' + w + '" height="19" rx="9" fill="' + (o.bg || C.blueL) +
      '" stroke="' + (o.stroke || 'none') + '"/><text x="' + (x + w / 2) + '" y="' + (y + 13.5) + '" font-size="11" font-weight="600" fill="' +
      (o.fill || C.blueD) + '" text-anchor="middle" font-family="system-ui,sans-serif">' + esc(s) + '</text></g>';
  }
  function defs() {
    return '<defs>' +
      '<marker id="ar" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.line2 + '"/></marker>' +
      '<marker id="arb" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.blue + '"/></marker>' +
      '<marker id="arr" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.rose + '"/></marker>' +
      '<marker id="ara" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.amber + '"/></marker>' +
      '<marker id="art" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.teal + '"/></marker>' +
      '<marker id="arpu" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">' +
      '<path d="M0,0 L10,5 L0,10 z" fill="' + C.purple + '"/></marker>' +
      '</defs>';
  }
  function svg(h, inner, w) {
    w = w || 760;
    return '<svg viewBox="0 0 ' + w + ' ' + h + '" xmlns="http://www.w3.org/2000/svg" role="img">' + defs() + inner + '</svg>';
  }
  function cap(s) { return '<div class="vizcap">' + s + '</div>'; }

  var VZ = {};

  /* =========================================================
     1. Sv39 三级页表遍历
     ========================================================= */
  VZ.sv39 = function () {
    var s = '';
    s += text(380, 18, 'RISC-V Sv39：64 位虚拟地址 → 三级页表 → 物理页', { size: 13.5, weight: 700 });
    // 地址拆分条
    var fields = [
      { t: '63..39 未使用', w: 100, c: C.gray2 },
      { t: 'L2 (9)', w: 90, c: C.blueL },
      { t: 'L1 (9)', w: 90, c: C.purpleL },
      { t: 'L0 (9)', w: 90, c: C.tealL },
      { t: '页内偏移 (12)', w: 130, c: C.amberL }
    ];
    var x = 150, y = 32;
    fields.forEach(function (f) {
      s += rect(x, y, f.w, 26, { fill: f.c, stroke: C.line });
      s += text(x + f.w / 2, y + 17.5, f.t, { size: 11.5, weight: 600, fill: C.ink });
      x += f.w;
    });
    s += text(140, y + 17.5, 'VA', { anchor: 'end', size: 12, weight: 700, mono: true });
    // 页表页
    var px = [150, 330, 510], py = 92;
    var names = ['根页表 (L2)', '中间页表 (L1)', '叶子页表 (L0)'];
    var cols = [C.blue, C.purple, C.teal];
    names.forEach(function (n, i) {
      s += rect(px[i], py, 150, 116, { fill: C.white, stroke: cols[i], lw: 1.6 });
      s += text(px[i] + 75, py + 18, n, { size: 12, weight: 700, fill: cols[i] });
      for (var k = 0; k < 5; k++) {
        var yy = py + 28 + k * 17;
        s += rect(px[i] + 10, yy, 130, 15, { fill: k === 1 ? cols[i] : C.gray, stroke: 'none', op: k === 1 ? .28 : 1 });
        s += text(px[i] + 16, yy + 11.5, 'PTE[' + (k === 1 ? (i === 0 ? 'L2' : i === 1 ? 'L1' : 'L0') : '…') + ']', { anchor: 'start', size: 10, mono: true, fill: C.dim });
      }
      if (i < 2) s += line(px[i] + 150, py + 58 + 17, px[i + 1], py + 58 + 17, { stroke: cols[i], marker: 'ar', lw: 1.8 });
    });
    s += text(px[2] + 160, py + 20, '物理页', { anchor: 'start', size: 12, weight: 700 });
    s += rect(px[2] + 150, py + 30, 100, 60, { fill: C.amberL, stroke: C.amber });
    s += text(px[2] + 200, py + 63, '4 KB 页', { size: 12, fill: C.amber, weight: 700 });
    s += line(px[2] + 150, py + 75 + 17, px[2] + 150, py + 60, { stroke: C.amber, marker: 'ara', lw: 1.8 });
    // PTE 格式
    var by = 232;
    s += text(380, by + 2, 'PTE (64 bit)', { size: 12, weight: 700, fill: C.dim });
    var pf = [
      { t: '保留 (10)', w: 90, c: C.gray2 }, { t: 'PPN (44)', w: 220, c: C.greenL },
      { t: 'RSW', w: 46, c: C.purpleL }, { t: 'D A G U X W R V', w: 150, c: C.roseL }
    ];
    x = 150;
    pf.forEach(function (f) {
      s += rect(x, by + 10, f.w, 24, { fill: f.c, stroke: C.line });
      s += text(x + f.w / 2, by + 26, f.t, { size: 10.5, weight: 600, mono: true });
      x += f.w;
    });
    s += text(150, by + 52, 'V 有效 · R 读 · W 写 · X 执行 · U 用户可访问 · A 已访问 · D 已脏 · G 全局（不被 TLB 刷新清掉）',
      { anchor: 'start', size: 11.5, fill: C.dim });
    return svg(292, s);
  };

  /* =========================================================
     2. 系统调用 / trap 全流程
     ========================================================= */
  VZ.trapflow = function () {
    var s = '';
    s += layer(30, 14, 330, 254, '用户空间 (U mode)', { fill: '#f2f7ff', stroke: '#c9dcf8' });
    s += layer(400, 14, 330, 254, '内核空间 (S mode)', { fill: '#fbf6ff', stroke: '#ded0fa' });
    var u = [
      ['用户程序 write(fd,…)', C.blueL, C.blue],
      ['usys.S: li a7,SYS_write; ecall', C.blueL, C.blue],
      ['（返回后继续执行）', C.gray, C.dim]
    ];
    var k = [
      ['trampoline: uservec 保存 32 个寄存器', C.purpleL, C.purple],
      ['usertrap(): scause==8 → syscall()', C.purpleL, C.purple],
      ['syscall(): 读 a7 → sys_write()', C.purpleL, C.purple],
      ['usertrapret() → trampoline: userret', C.purpleL, C.purple]
    ];
    u.forEach(function (it, i) {
      var y = 40 + i * 74;
      s += rect(48, y, 294, 46, { fill: it[1], stroke: it[2] });
      s += text(195, y + 28, it[0], { size: 12.5, weight: 600, fill: C.ink });
    });
    k.forEach(function (it, i) {
      var y = 40 + i * 60;
      s += rect(418, y, 294, 42, { fill: it[1], stroke: it[2] });
      s += text(565, y + 26, it[0], { size: 12.5, weight: 600, fill: C.ink });
    });
    s += text(195, 40 + 2 * 74 + 74, '↓ 只有 ecall / 中断 / 异常能进入内核', { size: 11.5, fill: C.dim });
    s += line(342, 63, 418, 61, { stroke: C.rose, marker: 'arr', lw: 2 });
    s += text(380, 52, 'ecall', { size: 11, weight: 700, fill: C.rose, mono: true });
    s += line(418, 40 + 3 * 60 + 21, 342, 40 + 2 * 74 + 23, { stroke: C.green, marker: 'ar', lw: 2 });
    s += text(380, 40 + 3 * 60 + 42, 'sret', { size: 11, weight: 700, fill: C.green, mono: true });
    s += text(380, 282, '关键：切换时页表不换（satp 不变），仅换特权级 + 栈',
      { size: 11.5, fill: C.dim });
    return svg(300, s);
  };

  /* =========================================================
     3. Copy-on-Write fork 三阶段
     ========================================================= */
  VZ.cow = function () {
    var s = '';
    var stages = [
      { t: '① fork 之前', pte: 'RWX', share: false },
      { t: '② fork 之后（延迟复制）', pte: 'R-X (清 PTE_W，置 COW 标志)', share: true },
      { t: '③ 子进程写该页 → page fault', pte: 'RW（各持一份私有副本）', share: false }
    ];
    var x0 = 24;
    stages.forEach(function (st, i) {
      var x = x0 + i * 246;
      s += rect(x, 16, 226, 250, { fill: C.white, stroke: C.line2 });
      s += text(x + 113, 36, st.t, { size: 12.5, weight: 700, fill: i === 2 ? C.rose : C.ink });
      // 父进程
      s += rect(x + 14, 50, 92, 26, { fill: C.blueL, stroke: C.blue });
      s += text(x + 60, 67, '父进程 PTE', { size: 11, weight: 600 });
      s += rect(x + 120, 50, 92, 26, { fill: C.tealL, stroke: C.teal });
      s += text(x + 166, 67, '子进程 PTE', { size: 11, weight: 600 });
      if (i === 0) {
        s += rect(x + 14, 90, 92, 40, { fill: C.gray, stroke: C.line });
        s += text(x + 60, 114, '（无子进程）', { size: 11, fill: C.dim });
        s += rect(x + 80, 150, 66, 62, { fill: C.amberL, stroke: C.amber });
        s += text(x + 113, 186, '物理页 P', { size: 12, weight: 700, fill: C.amber });
        s += line(x + 60, 130, x + 100, 150, { stroke: C.blue, marker: 'arb', lw: 1.6 });
      } else if (i === 1) {
        s += rect(x + 80, 150, 66, 62, { fill: C.amberL, stroke: C.amber });
        s += text(x + 113, 186, '物理页 P', { size: 12, weight: 700, fill: C.amber });
        s += text(x + 113, 204, 'refcnt = 2', { size: 10.5, fill: C.amber, mono: true });
        s += line(x + 60, 130, x + 100, 150, { stroke: C.blue, marker: 'arb', lw: 1.6 });
        s += line(x + 166, 130, x + 146, 150, { stroke: C.teal, marker: 'art', lw: 1.6 });
      } else {
        s += rect(x + 26, 150, 66, 62, { fill: C.amberL, stroke: C.amber });
        s += text(x + 59, 186, '物理页 P', { size: 12, weight: 700, fill: C.amber });
        s += text(x + 59, 204, 'refcnt = 1', { size: 10.5, fill: C.amber, mono: true });
        s += rect(x + 134, 150, 66, 62, { fill: C.greenL, stroke: C.green });
        s += text(x + 167, 186, '新页 P\'', { size: 12, weight: 700, fill: C.green });
        s += text(x + 167, 204, 'refcnt = 1', { size: 10.5, fill: C.green, mono: true });
        s += line(x + 60, 130, x + 66, 150, { stroke: C.blue, marker: 'arb', lw: 1.6 });
        s += line(x + 166, 130, x + 167, 150, { stroke: C.teal, marker: 'art', lw: 1.6 });
        s += text(x + 113, 232, 'kalloc + memmove + 置 PTE_W', { size: 10.5, fill: C.rose, weight: 600 });
      }
      s += text(x + 113, 88, st.pte, { size: 11, fill: C.dim, mono: true });
      if (i < 2) s += line(x + 226, 140, x + 246, 140, { stroke: C.line2, marker: 'ar', lw: 1.6 });
    });
    s += text(380, 286, '陷阱：kfree() 必须等 refcnt 归零才回收；copyout() 写用户内存也要走同一套 COW 逻辑',
      { size: 11.5, fill: C.rose });
    return svg(300, s);
  };

  /* =========================================================
     4. 锁竞争：单 freelist vs per-CPU freelist
     ========================================================= */
  VZ.lockcontention = function () {
    var s = '';
    s += text(190, 16, '改造前：一把 kmem.lock 保护一条全局空闲链表', { size: 12.5, weight: 700, fill: C.rose });
    s += text(570, 16, '改造后：每 CPU 一条链表 + 各自的锁', { size: 12.5, weight: 700, fill: C.green });
    // 左
    s += rect(150, 34, 120, 44, { fill: C.roseL, stroke: C.rose, lw: 1.6 });
    s += text(210, 60, 'kmem.freelist', { size: 12, weight: 700, fill: C.rose });
    [['CPU0', 60], ['CPU1', 120], ['CPU2', 180]].forEach(function (c) {
      s += rect(20, c[1], 96, 34, { fill: C.gray, stroke: C.line });
      s += text(68, c[1] + 22, c[0], { size: 12, weight: 600 });
      s += line(116, c[1] + 17, 150, 56, { stroke: C.rose, marker: 'arr', lw: 1.6 });
    });
    s += text(210, 232, '3 个核抢同一把锁 → 大量自旋 (#test-and-set)', { size: 11.5, fill: C.dim });
    // 右
    [['CPU0', 60], ['CPU1', 120], ['CPU2', 180]].forEach(function (c) {
      s += rect(400, c[1], 96, 34, { fill: C.gray, stroke: C.line });
      s += text(448, c[1] + 22, c[0], { size: 12, weight: 600 });
      s += rect(540, c[1], 118, 34, { fill: C.greenL, stroke: C.green });
      s += text(599, c[1] + 22, 'freelist + 锁', { size: 11.5, weight: 600, fill: C.green });
      s += line(496, c[1] + 17, 540, c[1] + 17, { stroke: C.green, marker: 'ar', lw: 1.6 });
    });
    s += text(599, 232, '各自分配 → 零竞争；某核链表空时才去别的核「偷」一批', { size: 11.5, fill: C.dim });
    s += line(599, 180, 599, 204, { stroke: C.amber, marker: 'ara', lw: 1.6, dash: '5 3' });
    s += text(690, 200, '偷页', { anchor: 'start', size: 11, weight: 700, fill: C.amber });
    return svg(250, s);
  };

  /* =========================================================
     5. xv6 inode：直接 / 一级间接 / 二级间接
     ========================================================= */
  VZ.inode = function () {
    var s = '';
    s += text(380, 16, 'xv6 dinode 的 addrs[]：12 直接 + 1 一级间接 = 268 块 → 改成 11 直接 + 1 一级 + 1 二级 = 65803 块',
      { size: 12, weight: 700 });
    // inode
    s += rect(24, 34, 168, 210, { fill: C.white, stroke: C.blue, lw: 1.6 });
    s += text(108, 52, 'struct dinode', { size: 12, weight: 700, fill: C.blue, mono: true });
    s += text(108, 68, 'addrs[NDIRECT+NINDIRECT+1]', { size: 9.5, fill: C.dim, mono: true });
    var rows = [];
    for (var i = 0; i < 11; i++) rows.push(['addrs[' + i + ']', '直接', C.gray]);
    rows.push(['addrs[11]', '一级间接', C.tealL]);
    rows.push(['addrs[12]', '二级间接', C.purpleL]);
    rows.forEach(function (r, i) {
      var y = 78 + i * 12.4;
      s += rect(32, y, 152, 11, { fill: r[2], stroke: 'none' });
      s += text(38, y + 9, r[0], { anchor: 'start', size: 9, mono: true, fill: C.dim });
      s += text(174, y + 9, r[1], { anchor: 'end', size: 9, fill: C.ink });
    });
    // 数据块
    s += rect(760 - 150, 34, 130, 40, { fill: C.amberL, stroke: C.amber });
    s += text(760 - 85, 58, '数据块 ×11', { size: 12, weight: 700, fill: C.amber });
    s += line(192, 90, 760 - 150, 54, { stroke: C.line2, marker: 'ar' });
    // 一级间接
    s += rect(760 - 190, 92, 168, 26, { fill: C.tealL, stroke: C.teal });
    s += text(760 - 106, 109, '间接块：256 个块号', { size: 11, weight: 600, fill: C.teal });
    s += line(192, 141, 760 - 190, 105, { stroke: C.teal, marker: 'art' });
    s += rect(760 - 150, 130, 130, 34, { fill: C.amberL, stroke: C.amber });
    s += text(760 - 85, 151, '数据块 ×256', { size: 11.5, weight: 700, fill: C.amber });
    s += line(760 - 106, 118, 760 - 85, 130, { stroke: C.teal, marker: 'art' });
    // 二级间接
    s += rect(760 - 190, 182, 168, 26, { fill: C.purpleL, stroke: C.purple });
    s += text(760 - 106, 199, '二级间接块：256 个间接块号', { size: 11, weight: 600, fill: C.purple });
    s += line(192, 154, 760 - 190, 195, { stroke: C.purple, marker: 'arpu' });
    for (var k = 0; k < 3; k++) {
      var x = 760 - 210 + k * 66;
      s += rect(x, 220, 58, 22, { fill: C.purpleL, stroke: C.purple, op: .85 });
      s += text(x + 29, 235, '间接块', { size: 9.5, fill: C.purple });
      s += line(760 - 106, 208, x + 29, 220, { stroke: C.purple, marker: 'arpu', lw: 1 });
    }
    s += rect(760 - 190, 250, 168, 30, { fill: C.amberL, stroke: C.amber });
    s += text(760 - 106, 269, '数据块 ×256×256 = 65536', { size: 11.5, weight: 700, fill: C.amber });
    s += text(380, 296, '总计 11 + 256 + 65536 = 65803 块（×1024 B ≈ 64 MB）',
      { size: 12, weight: 700, fill: C.green });
    return svg(310, s);
  };

  /* =========================================================
     6. mmap 与 VMA
     ========================================================= */
  VZ.vma = function () {
    var s = '';
    s += text(380, 16, '进程地址空间中的 VMA（虚拟内存区域）与懒加载页错误', { size: 12.5, weight: 700 });
    // 地址空间
    s += rect(40, 34, 170, 250, { fill: C.white, stroke: C.line });
    s += text(125, 50, '进程地址空间', { size: 12, weight: 700 });
    var segs = [
      ['text / data', 62, C.gray], ['heap', 100, C.gray],
      ['VMA #0  (fd=3, MAP_SHARED)', 140, C.blueL, C.blue],
      ['VMA #1  (fd=4, MAP_PRIVATE)', 180, C.purpleL, C.purple],
      ['（空闲）', 220, C.white],
      ['trapframe / trampoline', 252, C.tealL, C.teal]
    ];
    segs.forEach(function (g) {
      s += rect(52, g[1], 146, 32, { fill: g[2], stroke: g[3] || C.line });
      s += text(125, g[1] + 20, g[0], { size: 10.5, weight: 600, fill: g[3] || C.dim });
    });
    // VMA 表
    s += rect(300, 34, 420, 130, { fill: C.white, stroke: C.blue, lw: 1.5 });
    s += text(510, 52, 'struct vma（内核里固定大小数组，16 个够用）', { size: 11.5, weight: 700, fill: C.blue });
    s += '<g>' + rect(316, 62, 388, 20, { fill: C.gray2, stroke: 'none' }) +
      text(326, 76, 'addr', { anchor: 'start', size: 10, mono: true, fill: C.dim }) +
      text(432, 76, 'len', { anchor: 'start', size: 10, mono: true, fill: C.dim }) +
      text(510, 76, 'prot', { anchor: 'start', size: 10, mono: true, fill: C.dim }) +
      text(586, 76, 'flags', { anchor: 'start', size: 10, mono: true, fill: C.dim }) +
      text(660, 76, 'struct file*', { anchor: 'start', size: 10, mono: true, fill: C.dim }) + '</g>';
    [['0x40000000', '2 页', 'R|W', 'SHARED', '→ inode'], ['0x40002000', '1 页', 'R', 'PRIVATE', '→ inode']]
      .forEach(function (r, i) {
        var y = 84 + i * 22;
        s += rect(316, y, 388, 20, { fill: i ? C.purpleL : C.blueL, stroke: 'none' });
        s += text(326, y + 14, r[0], { anchor: 'start', size: 10, mono: true });
        s += text(432, y + 14, r[1], { anchor: 'start', size: 10, mono: true });
        s += text(510, y + 14, r[2], { anchor: 'start', size: 10, mono: true });
        s += text(586, y + 14, r[3], { anchor: 'start', size: 10, mono: true });
        s += text(660, y + 14, r[4], { anchor: 'start', size: 10, mono: true });
      });
    s += text(510, 154, 'mmap 只在 VMA 表登记，不分配物理页、不读文件', { size: 11, fill: C.dim });
    // 页错误流程
    s += rect(300, 176, 420, 108, { fill: C.white, stroke: C.rose, lw: 1.5 });
    s += text(510, 194, '首次访问 → page fault → 真正读盘', { size: 11.5, weight: 700, fill: C.rose });
    var st = ['① 访问 VA → scause=0xd/0xf', '② 查 VMA 找到区域', '③ kalloc 一页 + readi 读 4096 B', '④ mappages 建 PTE（权限来自 prot）'];
    st.forEach(function (t, i) {
      s += text(320, 214 + i * 17, t, { anchor: 'start', size: 11, fill: C.ink });
    });
    s += text(380, 300, 'munmap：MAP_SHARED 且 PTE_D 置位 → 先 writei 回写文件，再 uvmunmap 拆页',
      { size: 11.5, fill: C.amber });
    return svg(312, s);
  };

  /* =========================================================
     7. 宏内核 vs 微内核
     ========================================================= */
  VZ.monovsmicro = function () {
    var s = '';
    s += text(190, 16, '宏内核（xv6 / Linux）', { size: 13, weight: 700 });
    s += text(570, 16, '微内核（L4 / seL4）', { size: 13, weight: 700 });
    // 左
    s += rect(60, 34, 260, 150, { fill: C.blueL, stroke: C.blue, lw: 1.6 });
    s += text(190, 52, '一个特权程序', { size: 12, weight: 700, fill: C.blue });
    var mods = ['文件系统', '进程管理', '内存管理', '网络协议栈', '设备驱动'];
    mods.forEach(function (m, i) {
      var x = 74 + (i % 3) * 84, y = 64 + Math.floor(i / 3) * 44;
      s += rect(x, y, 76, 34, { fill: C.white, stroke: C.line });
      s += text(x + 38, y + 21, m, { size: 10.5 });
    });
    s += rect(60, 196, 260, 30, { fill: C.gray, stroke: C.line });
    s += text(190, 215, '硬件', { size: 12, weight: 600 });
    s += text(190, 244, '子系统间 = 函数调用，快但一损俱损', { size: 11.5, fill: C.dim });
    // 右
    s += rect(440, 34, 260, 60, { fill: C.purpleL, stroke: C.purple, lw: 1.6 });
    s += text(570, 58, '内核只留：地址空间 / 线程 / IPC', { size: 11.5, weight: 700, fill: C.purple });
    s += text(570, 78, '（+ 少量特权驱动）', { size: 11, fill: C.purple });
    var svc = ['文件服务', '网络服务', '显示服务', '磁盘驱动'];
    svc.forEach(function (m, i) {
      var x = 452 + i * 62;
      s += rect(x, 112, 56, 62, { fill: C.tealL, stroke: C.teal, r: 6 });
      s += text(x + 28, 142, m.slice(0, 2), { size: 11, weight: 700, fill: C.teal });
      s += text(x + 28, 160, m.slice(2), { size: 11, weight: 700, fill: C.teal });
      s += line(x + 28, 112, x + 28, 94, { stroke: C.purple, marker: 'arpu', lw: 1.4 });
    });
    s += text(570, 190, '服务之间、服务与内核之间 = IPC 消息', { size: 11, fill: C.dim });
    s += rect(440, 200, 260, 26, { fill: C.gray, stroke: C.line });
    s += text(570, 217, '硬件', { size: 12, weight: 600 });
    s += text(570, 244, '隔离好、可重启，但 IPC 开销大', { size: 11.5, fill: C.dim });
    s += text(380, 276, 'L4 论文的结论：微内核本身不慢，慢的是「Linux 语义 + IPC 边界」的叠加；用 4 个关键机制可把开销压到个位数百分比',
      { size: 11.5, fill: C.ink });
    return svg(290, s);
  };

  /* =========================================================
     8. 隔离技术光谱：进程 → 容器 → gVisor → Firecracker → VM
     ========================================================= */
  VZ.isolation = function () {
    var s = '';
    s += text(380, 16, '隔离强度 vs 开销：从左到右隔离越来越强，启动/内存开销也越来越大', { size: 12.5, weight: 700 });
    var items = [
      { n: '进程 + chroot', k: '共享宿主内核，仅改根目录', c: C.gray, s: C.line2, iso: 1, cost: 1 },
      { n: '容器 (LXC)', k: 'namespace + cgroups，共享内核', c: C.blueL, s: C.blue, iso: 2, cost: 2 },
      { n: 'gVisor', k: '用户态内核（Sentry）自己实现 syscall', c: C.tealL, s: C.teal, iso: 3.4, cost: 3 },
      { n: 'Firecracker', k: '微型 VM（KVM），裁掉大量设备', c: C.purpleL, s: C.purple, iso: 4.4, cost: 4.2 },
      { n: '传统 VM', k: '完整虚拟化硬件 + 完整 guest OS', c: C.amberL, s: C.amber, iso: 5, cost: 5 }
    ];
    var x = 30;
    items.forEach(function (it, i) {
      var w = 132;
      s += rect(x, 44, w, 122, { fill: it.c, stroke: it.s, lw: 1.6 });
      s += text(x + w / 2, 64, it.n, { size: 12, weight: 700, fill: C.ink });
      var words = it.k.length > 11 ? [it.k.slice(0, 11), it.k.slice(11)] : [it.k];
      words.forEach(function (w2, j) {
        s += text(x + w / 2, 84 + j * 15, w2, { size: 10.5, fill: C.text });
      });
      // 隔离条
      s += rect(x + 12, 112, w - 24, 10, { fill: C.white, stroke: C.line, r: 5 });
      s += rect(x + 12, 112, (w - 24) * it.iso / 5, 10, { fill: it.s, stroke: 'none', r: 5 });
      s += text(x + 12, 142, '隔离', { anchor: 'start', size: 9.5, fill: C.dim });
      s += rect(x + 12, 148, w - 24, 10, { fill: C.white, stroke: C.line, r: 5 });
      s += rect(x + 12, 148, (w - 24) * it.cost / 5, 10, { fill: C.rose, stroke: 'none', r: 5, op: .75 });
      s += text(x + 12, 162, '开销', { anchor: 'start', size: 9.5, fill: C.dim });
      x += w + 12;
    });
    s += text(380, 186, '→ 隔离增强、攻击面（暴露给 untrusted 代码的 syscall 接口）缩小', { size: 11.5, fill: C.dim });
    s += rect(30, 200, 690, 74, { fill: C.white, stroke: C.line });
    s += text(375, 218, 'gVisor：把 syscall 边界移到「用户态内核」—— 拦截 + 自己实现，宿主内核只暴露极小接口', { anchor: 'start', size: 11.5, fill: C.teal, weight: 600 });
    s += text(375, 238, 'Firecracker：把 syscall 边界移到「VM 边界」—— guest 有自己的内核，宿主机只跑一个极简 VMM', { anchor: 'start', size: 11.5, fill: C.purple, weight: 600 });
    s += text(375, 258, '两者都针对 serverless：要「快启动 + 高密度 + 强隔离」，于是分别从不同方向折中', { anchor: 'start', size: 11.5, fill: C.ink });
    return svg(286, s);
  };

  /* =========================================================
     9. RCU 时间线（grace period）
     ========================================================= */
  VZ.rcu = function () {
    var s = '';
    s += text(380, 16, 'RCU：读者不加锁；写者复制-更新；等一个 grace period 后才释放旧版本', { size: 12.5, weight: 700 });
    var rows = [
      { n: '读者 R1', x: 120, w: 300, c: C.blue, l: C.blueL },
      { n: '读者 R2', x: 200, w: 180, c: C.blue, l: C.blueL },
      { n: '写者 W', x: 300, w: 60, c: C.rose, l: C.roseL },
      { n: 'grace period', x: 300, w: 260, c: C.amber, l: C.amberL }
    ];
    rows.forEach(function (r, i) {
      var y = 44 + i * 40;
      s += text(112, y + 15, r.n, { anchor: 'end', size: 11.5, weight: 700 });
      s += rect(r.x, y, r.w, 22, { fill: r.l, stroke: r.c, r: 11 });
      if (i === 3) s += text(r.x + r.w / 2, y + 15, '等所有「已存在」的读者退出', { size: 11, weight: 700, fill: C.amber });
      if (i === 2) s += text(r.x + r.w / 2, y + 15, '替换指针', { size: 10.5, weight: 700, fill: C.rose });
      if (i < 2) s += text(r.x + r.w / 2, y + 15, 'rcu_read_lock() … rcu_read_unlock()', { size: 10.5, fill: C.blueD });
    });
    // 时间轴
    s += line(120, 200, 700, 200, { stroke: C.line2, marker: 'ar' });
    s += text(700, 216, '时间', { anchor: 'start', size: 11, fill: C.dim });
    [[120, '读开始'], [200, 'R2 开始'], [300, '写者换指针'], [360, '新读者只看到新版本'], [560, '可释放旧版本']]
      .forEach(function (t) {
        s += line(t[0], 196, t[0], 204, { stroke: C.line2 });
        s += text(t[0], 224, t[1], { size: 10, fill: C.dim });
      });
    s += rect(120, 238, 620, 52, { fill: C.white, stroke: C.line });
    s += text(430, 256, '代价：读者几乎零开销（无原子写、无 cacheline 争用）；代价是写者要等、内存里会短暂存在两份数据', { size: 11.5, fill: C.ink });
    s += text(430, 276, '对比 rwlock：rwlock 的读侧也要原子改计数器 → 多核下 cacheline 乒乓，反而可能比自旋锁还慢（见 RCU 论文 Figure 8）', { size: 11.5, fill: C.dim });
    return svg(300, s);
  };

  /* =========================================================
     10. Meltdown：乱序执行 + cache 侧信道
     ========================================================= */
  VZ.meltdown = function () {
    var s = '';
    s += text(380, 16, 'Meltdown：越权 load 在「异常被交付之前」已经把秘密带进了 cache', { size: 12.5, weight: 700, fill: C.rose });
    var steps = [
      { t: '① 越权读', d: 'x = *kernel_addr\n（用户态，本应非法）', c: C.blue, l: C.blueL },
      { t: '② 瞬时指令', d: 'y = probe[x * 4096]\n用秘密当索引去访问大数组', c: C.purple, l: C.purpleL },
      { t: '③ 异常回滚', d: '体系结构状态被丢弃\n寄存器里看不到 x', c: C.amber, l: C.amberL },
      { t: '④ 测时序', d: '遍历 probe[i] 计时\n快的那个 i 就是 secret', c: C.rose, l: C.roseL }
    ];
    steps.forEach(function (st, i) {
      var x = 24 + i * 184;
      s += rect(x, 34, 168, 128, { fill: st.l, stroke: st.c, lw: 1.6 });
      s += text(x + 84, 52, st.t, { size: 12, weight: 700, fill: st.c });
      st.d.split('\n').forEach(function (ln, j) {
        s += text(x + 84, 82 + j * 26, ln, { size: 10.5, mono: true, fill: C.ink });
      });
      s += text(x + 84, 152, '微架构副作用\n留在 cache 里', { size: 10.5, fill: C.dim });
      if (i < 3) s += line(x + 168, 98, x + 184, 98, { stroke: C.line2, marker: 'ar' });
    });
    s += rect(24, 178, 712, 74, { fill: C.white, stroke: C.line });
    s += text(380, 196, '关键设计教训：ISA（体系结构）承诺的隔离 ≠ 微架构实现真的守住了这个承诺', { size: 12, weight: 700, fill: C.ink });
    s += text(380, 216, 'xv6 视角：内核页表把整个内核映射到用户地址空间（trampoline 那一套），若 RISC-V 也这样乱序且不检查权限，用户程序能偷什么？', { size: 11.5, fill: C.dim });
    s += text(380, 236, '→ 整个内核的数据、所有进程的页、文件系统缓存。防御思路：KPTI（用户态切换不映射内核页）', { size: 11.5, fill: C.green });
    return svg(264, s);
  };

  /* =========================================================
     11. BPF：在内核里过滤，而不是把包都搬到用户态
     ========================================================= */
  VZ.bpf = function () {
    var s = '';
    s += text(190, 16, '传统方式：所有包都拷贝到用户态再过滤', { size: 12.5, weight: 700, fill: C.rose });
    s += text(570, 16, 'BPF：过滤程序在内核里跑，只留有用的包', { size: 12.5, weight: 700, fill: C.green });
    // 左
    s += rect(40, 40, 110, 40, { fill: C.gray, stroke: C.line });
    s += text(95, 64, '网卡收到 10000 包', { size: 11, weight: 600 });
    s += rect(40, 110, 110, 40, { fill: C.roseL, stroke: C.rose });
    s += text(95, 134, '全部拷到用户态', { size: 11, weight: 600, fill: C.rose });
    s += rect(40, 180, 110, 40, { fill: C.gray, stroke: C.line });
    s += text(95, 204, '用户程序丢掉 9990 个', { size: 11, weight: 600 });
    s += line(95, 80, 95, 110, { stroke: C.line2, marker: 'ar' });
    s += line(95, 150, 95, 180, { stroke: C.line2, marker: 'ar' });
    s += text(95, 240, '拷贝 + 上下文切换 ×10000', { size: 11, fill: C.rose });
    // 右
    s += rect(400, 40, 110, 40, { fill: C.gray, stroke: C.line });
    s += text(455, 64, '网卡收到 10000 包', { size: 11, weight: 600 });
    s += rect(400, 110, 110, 40, { fill: C.greenL, stroke: C.green });
    s += text(455, 134, 'BPF 过滤器（内核）', { size: 11, weight: 600, fill: C.green });
    s += rect(400, 180, 110, 40, { fill: C.gray, stroke: C.line });
    s += text(455, 204, '只拷 10 个给用户', { size: 11, weight: 600 });
    s += line(455, 80, 455, 110, { stroke: C.line2, marker: 'ar' });
    s += line(455, 150, 455, 180, { stroke: C.line2, marker: 'ar' });
    s += text(455, 240, '拷贝 ×10', { size: 11, fill: C.green });
    // 过滤器模型
    s += rect(540, 40, 200, 200, { fill: C.white, stroke: C.green, lw: 1.5 });
    s += text(640, 58, 'BPF 的「虚拟机」设计', { size: 11.5, weight: 700, fill: C.green });
    s += text(556, 78, '· 不是解释器跑任意代码，而是一个', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 94, '  受控的 CFG（有向无环图）', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 112, '· 每条指令只做「取包字段 / 比较 / 跳转」', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 130, '· 无循环 ⇒ 一定终止 ⇒ 可静态校验安全', { anchor: 'start', size: 10.5, fill: C.green, weight: 600 });
    s += text(556, 148, '· 寄存器 + 立即数，直接对 packet 做 load', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 166, '· 每包开销 O(指令数)，与包长弱相关', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 186, '· 内核态缓冲，攒够一批再唤醒用户', { anchor: 'start', size: 10.5, fill: C.ink });
    s += text(556, 206, '· 现代 eBPF：JIT 编译 + 更严的 verifier', { anchor: 'start', size: 10.5, fill: C.purple });
    s += text(556, 226, '· 用途早已超出抓包：可观测性、网络、安全', { anchor: 'start', size: 10.5, fill: C.dim });
    return svg(258, s);
  };

  /* =========================================================
     12. Receive Livelock：吞吐随输入速率先升后崩
     ========================================================= */
  VZ.livelock = function () {
    var s = '';
    s += text(380, 16, '接收活锁：输入速率超过某点后，CPU 全花在中断上，应用吞吐反而归零', { size: 12.5, weight: 700, fill: C.rose });
    var x0 = 90, y0 = 230, w = 560, h = 170;
    s += line(x0, y0, x0 + w, y0, { stroke: C.line2, marker: 'ar' });
    s += line(x0, y0, x0, y0 - h, { stroke: C.line2, marker: 'ar' });
    s += text(x0 + w / 2, y0 + 34, '输入包速率', { size: 12, weight: 600 });
    s += text(x0 - 18, y0 - h / 2, '应用吞吐', { size: 12, weight: 600, anchor: 'middle' });
    // 理想曲线
    s += path('M' + x0 + ',' + y0 + ' L' + (x0 + w * .55) + ',' + (y0 - h * .92) + ' L' + (x0 + w) + ',' + (y0 - h * .92),
      { stroke: C.green, lw: 2, dash: '6 4', fill: 'none' });
    // 真实曲线
    s += path('M' + x0 + ',' + y0 + ' C' + (x0 + w * .3) + ',' + (y0 - h * .85) + ' ' +
      (x0 + w * .45) + ',' + (y0 - h * .95) + ' ' + (x0 + w * .55) + ',' + (y0 - h * .9) +
      ' C' + (x0 + w * .72) + ',' + (y0 - h * .55) + ' ' + (x0 + w * .8) + ',' + (y0 - h * .12) + ' ' +
      (x0 + w) + ',' + (y0 - 3), { stroke: C.rose, lw: 2.6, fill: 'none' });
    s += text(x0 + w * .45, y0 - h * .78, '上升段：CPU 还够用', { size: 11, fill: C.green });
    s += text(x0 + w * .74, y0 - h * .30, '崩塌段', { size: 11, weight: 700, fill: C.rose });
    s += text(x0 + w * .78, y0 - h * .16, '中断吃满 CPU', { size: 11, fill: C.rose });
    s += rect(x0 + w * .62, y0 - h - 4, w * .38, h - 10, { fill: C.roseL, stroke: 'none', op: .5, r: 6 });
    s += text(x0 + w * .81, y0 - h + 14, '活锁区', { size: 12, weight: 700, fill: C.rose });
    // 图例
    s += line(120, 274, 156, 274, { stroke: C.green, lw: 2.6, dash: '6 4' });
    s += text(162, 278, '理想（不受中断干扰）', { anchor: 'start', size: 11 });
    s += line(340, 274, 376, 274, { stroke: C.rose, lw: 2.6 });
    s += text(382, 278, '真实（中断优先于进程）', { anchor: 'start', size: 11 });
    s += rect(90, 288, 560, 46, { fill: C.white, stroke: C.line });
    s += text(370, 306, '解法（Mogul & Ramakrishnan）：中断时关掉该设备的中断，改为轮询处理一批包；配额用尽或队列空了再开中断（"中断 + 轮询"混合）', { size: 11.5, fill: C.ink });
    s += text(370, 324, 'xv6 对照：UART 每收一个字节就中断一次；若主机疯狂往控制台灌数据，理论上也会吃掉全部 CPU', { size: 11.5, fill: C.dim });
    return svg(348, s);
  };

  /* =========================================================
     13. 尾延迟
     ========================================================= */
  VZ.taillatency = function () {
    var s = '';
    s += text(380, 16, '为什么平均延迟很好但用户体验很差：你关心的是分布的长尾', { size: 12.5, weight: 700 });
    var x0 = 80, y0 = 210, w = 580, h = 160;
    s += line(x0, y0, x0 + w, y0, { stroke: C.line2, marker: 'ar' });
    s += line(x0, y0, x0, y0 - h, { stroke: C.line2, marker: 'ar' });
    s += text(x0 + w / 2, y0 + 32, '延迟（对数刻度）→', { size: 12, weight: 600 });
    s += text(x0 - 14, y0 - h / 2, '请求数', { size: 12, weight: 600 });
    // 分布
    var pts = [[0, 4], [10, 30], [20, 96], [30, 140], [40, 122], [50, 74], [60, 44], [70, 26], [80, 15], [90, 8], [100, 3], [110, 1.5]];
    var d = 'M' + x0 + ',' + y0;
    pts.forEach(function (p) { d += ' L' + (x0 + p[0] / 110 * (w - 60)) + ',' + (y0 - p[1] / 140 * h); });
    d += ' L' + (x0 + w - 60) + ',' + y0 + ' Z';
    s += path(d, { fill: C.blueL, stroke: C.blue, lw: 1.8 });
    // 标记
    [[0.16, 'p50', C.green], [0.42, 'p99', C.amber], [0.62, 'p99.9', C.rose]].forEach(function (m) {
      var x = x0 + m[0] * (w - 60);
      s += line(x, y0, x, y0 - h * .55, { stroke: m[2], lw: 1.4, dash: '4 3' });
      s += text(x, y0 - h * .55 - 6, m[1], { size: 11.5, weight: 700, fill: m[2] });
    });
    s += text(x0 + w * .72, y0 - h * .36, '长尾：排队、GC、后台任务、负载不均、\n调度延迟、丢包重传…', { size: 11, fill: C.rose });
    s += rect(x0, 240, w, 52, { fill: C.white, stroke: C.line });
    s += text(x0 + w / 2, 258, '一个用户请求扇出到 100 台机器：即使单台 p99 才 1 秒，也有约 63% 的用户请求会超过 1 秒', { size: 12, weight: 700, fill: C.ink });
    s += text(x0 + w / 2, 278, 'Shenango 的做法：用极高频（微秒级）的 CPU 重分配，让核跟着「排队情况」走，而不是固定分给某个应用', { size: 11.5, fill: C.dim });
    return svg(304, s);
  };

  /* =========================================================
     14. 超级页：4 KB vs 2 MB
     ========================================================= */
  VZ.superpage = function () {
    var s = '';
    s += text(190, 16, '4 KB 页：映射 8 MB 需要 2048 个叶子 PTE', { size: 12.5, weight: 700 });
    s += text(570, 16, '2 MB 超级页：只需 4 个 PTE', { size: 12.5, weight: 700, fill: C.green });
    // 左
    s += rect(60, 36, 260, 44, { fill: C.gray, stroke: C.line });
    s += text(190, 63, '2 个中间页表页（各 512 项）', { size: 11.5 });
    for (var i = 0; i < 16; i++) {
      var x = 62 + i * 16;
      s += rect(x, 92, 14, 40, { fill: i < 8 ? C.blueL : C.purpleL, stroke: i < 8 ? C.blue : C.purple, lw: .8 });
    }
    s += text(190, 148, '…共 2048 个 PTE，占 16 KB 页表内存', { size: 11.5, fill: C.dim });
    s += rect(60, 160, 260, 40, { fill: C.amberL, stroke: C.amber });
    s += text(190, 184, 'TLB：8 MB 需要 2048 个表项', { size: 11.5, weight: 600, fill: C.amber });
    // 右
    s += rect(440, 36, 260, 44, { fill: C.gray, stroke: C.line });
    s += text(570, 63, '1 个中间页表页', { size: 11.5 });
    for (var j = 0; j < 4; j++) {
      s += rect(442 + j * 64, 92, 60, 40, { fill: C.greenL, stroke: C.green, lw: 1.2 });
      s += text(472 + j * 64, 116, '2 MB', { size: 11.5, weight: 700, fill: C.green });
    }
    s += text(570, 148, '4 个 PTE 搞定，页表内存几乎为零', { size: 11.5, fill: C.green });
    s += rect(440, 160, 260, 40, { fill: C.greenL, stroke: C.green });
    s += text(570, 184, 'TLB：4 个表项覆盖同样 8 MB', { size: 11.5, weight: 600, fill: C.green });
    // 说明
    s += rect(40, 216, 660, 78, { fill: C.white, stroke: C.line });
    s += text(370, 234, '但 Navarro 论文指出：超级页不是「能建就建」', { size: 12, weight: 700, fill: C.ink });
    s += text(370, 254, '· 必须整段物理内存 2 MB 对齐且已分配 → 否则要「提升」（promote），可能触发内存回收/碎片整理', { anchor: 'start', size: 11.5, fill: C.text });
    s += text(370, 272, '· 部分写脏 / 部分换出 / 权限不一致 时要「降级」（demote）回小页，反过来又增加 TLB miss', { anchor: 'start', size: 11.5, fill: C.text });
    s += text(370, 290, '· 论文的关键设计：只在进程访问过超级页内每一个基础页之后才安装超级页映射 —— 避免无谓的预分配与污染', { anchor: 'start', size: 11.5, fill: C.blue, weight: 600 });
    return svg(306, s);
  };

  /* =========================================================
     15. 系统调用拦截（Janus）
     ========================================================= */
  VZ.interpose = function () {
    var s = '';
    s += text(380, 16, 'Janus：在系统调用边界上插一个「监视器」，按策略放行或拒绝', { size: 12.5, weight: 700 });
    s += rect(40, 44, 130, 50, { fill: C.gray, stroke: C.line });
    s += text(105, 74, '不可信程序', { size: 12, weight: 700 });
    s += rect(300, 40, 160, 58, { fill: C.purpleL, stroke: C.purple, lw: 1.6 });
    s += text(380, 62, 'Janus 监视器', { size: 12.5, weight: 700, fill: C.purple });
    s += text(380, 80, '（用户态进程，ptrace）', { size: 10.5, fill: C.purple });
    s += rect(590, 44, 130, 50, { fill: C.blueL, stroke: C.blue });
    s += text(655, 74, '内核', { size: 12, weight: 700, fill: C.blue });
    s += line(170, 62, 300, 62, { stroke: C.line2, marker: 'ar', lw: 1.6 });
    s += text(235, 52, 'syscall', { size: 11, mono: true });
    s += line(300, 82, 170, 82, { stroke: C.green, marker: 'ar', lw: 1.6 });
    s += text(235, 100, '放行', { size: 11, fill: C.green });
    s += path('M170,58 L150,58 L150,140 L250,140', { stroke: C.rose, marker: 'arr', lw: 1.8, dash: '5 3' });
    s += text(210, 132, '拒绝（返回错误）', { size: 11, fill: C.rose });
    s += line(460, 62, 590, 62, { stroke: C.blue, marker: 'arb', lw: 1.6 });
    s += text(525, 52, '真正执行', { size: 11, fill: C.blue });
    // 陷阱清单
    s += rect(40, 156, 680, 116, { fill: C.white, stroke: C.rose, lw: 1.4 });
    s += text(380, 174, '《Traps and Pitfalls》总结的四类坑（这正是 xv6 syscall lab 里 interpose() 要你体会的）', { size: 11.5, weight: 700, fill: C.rose });
    var traps = [
      ['① 参数语义：路径要解析成真实文件，光看字符串不够（符号链接、相对路径、..、chroot）'],
      ['② 间接路径：open 被禁但 openat / 继承来的 fd / exec 之后的行为 仍可能绕过'],
      ['③ 并发：检查参数与实际使用之间有时间窗，多线程可以「TOCTOU」替换参数'],
      ['④ 状态复制：进程自己fork/exec/fd 继承带来的状态，监视器必须跟着同步维护']
    ];
    traps.forEach(function (t, i) {
      s += text(56, 194 + i * 19, t[0], { anchor: 'start', size: 10.8, fill: C.text });
    });
    return svg(284, s);
  };

  /* =========================================================
     16. 线程切换 swtch
     ========================================================= */
  VZ.swtch = function () {
    var s = '';
    s += text(380, 16, 'xv6 的线程切换：切换的是「内核线程」的上下文（ra / sp / callee-saved）', { size: 12.5, weight: 700 });
    function proc(x, label, col, l) {
      var g = '';
      g += rect(x, 36, 190, 46, { fill: l, stroke: col, lw: 1.6 });
      g += text(x + 95, 63, label, { size: 12.5, weight: 700, fill: col });
      g += rect(x + 20, 96, 150, 120, { fill: C.white, stroke: C.line });
      g += text(x + 95, 112, '内核栈', { size: 10.5, fill: C.dim });
      ['ra (返回地址)', 'sp', 's0–s11', '…'].forEach(function (r, i) {
        g += rect(x + 32, 120 + i * 24, 126, 20, { fill: i === 0 ? col : C.gray, op: i === 0 ? .3 : 1, stroke: 'none' });
        g += text(x + 95, 134 + i * 24, r, { size: 10.5, mono: true });
      });
      return g;
    }
    s += proc(40, '进程 A（运行中）', C.blue, C.blueL);
    s += proc(530, '进程 B（就绪）', C.teal, C.tealL);
    s += rect(280, 70, 200, 90, { fill: C.purpleL, stroke: C.purple, lw: 1.6 });
    s += text(380, 92, 'swtch(&a->context, &b->context)', { size: 11, weight: 700, fill: C.purple, mono: true });
    s += text(380, 112, '① 把当前寄存器存进 A->context', { size: 10.5, fill: C.ink });
    s += text(380, 130, '② 从 B->context 恢复寄存器', { size: 10.5, fill: C.ink });
    s += text(380, 148, '③ ret → 跳到 B 上次 swtch 的下一条', { size: 10.5, fill: C.ink });
    s += line(230, 140, 280, 115, { stroke: C.purple, marker: 'arpu', lw: 1.6 });
    s += line(480, 115, 530, 140, { stroke: C.purple, marker: 'arpu', lw: 1.6 });
    s += rect(40, 232, 680, 50, { fill: C.white, stroke: C.line });
    s += text(370, 250, '要点：swtch 只换 ra/sp/callee-saved，不换页表（页表切换在 scheduler 里单独做 satp 写入 + sfence.vma）', { size: 11.5, fill: C.ink });
    s += text(370, 270, '进程第一次被调度时 ra 指向 forkret，这样「返回」就落到内核线程的入口；锁从 scheduler 手里交接，避免中途被别的核捡走', { size: 11.5, fill: C.dim });
    return svg(292, s);
  };

  /* =========================================================
     17. xv6 文件系统磁盘布局
     ========================================================= */
  VZ.fslayout = function () {
    var s = '';
    s += text(380, 16, 'xv6 磁盘布局（一个块 = 1024 字节）', { size: 12.5, weight: 700 });
    var blocks = [
      { n: '块 0\nboot', w: 70, c: C.gray },
      { n: '块 1\nsuperblock', w: 110, c: C.blueL, s: C.blue },
      { n: 'log\n（WAL）', w: 110, c: C.purpleL, s: C.purple },
      { n: 'inode\n（dinode 数组）', w: 130, c: C.tealL, s: C.teal },
      { n: 'bitmap\n（空闲块位图）', w: 120, c: C.amberL, s: C.amber },
      { n: 'data 区（文件内容 + 目录项 + 间接块）', w: 190, c: C.greenL, s: C.green }
    ];
    var x = 20;
    blocks.forEach(function (b) {
      s += rect(x, 34, b.w, 54, { fill: b.c, stroke: b.s || C.line });
      b.n.split('\n').forEach(function (ln, i) {
        s += text(x + b.w / 2, 54 + i * 15 + (b.n.indexOf('\n') < 0 ? 8 : 0), ln, { size: 11, weight: 600 });
      });
      x += b.w;
    });
    // 日志细节
    s += rect(30, 104, 330, 140, { fill: C.white, stroke: C.purple, lw: 1.5 });
    s += text(195, 122, 'log（预写日志）的结构', { size: 12, weight: 700, fill: C.purple });
    s += rect(46, 132, 298, 26, { fill: C.gray, stroke: C.line });
    s += text(195, 149, 'header：n + 块号列表', { size: 11, mono: true });
    s += text(46, 176, '数据块 ×n', { anchor: 'start', size: 11.5, weight: 600 });
    for (var i = 0; i < 6; i++) {
      s += rect(46 + i * 48, 182, 44, 30, { fill: C.purpleL, stroke: C.purple });
      s += text(68 + i * 48, 201, '' + (i + 1), { size: 11, fill: C.purple });
    }
    s += text(195, 232, 'commit() = 把 header 落盘（原子点）', { size: 11, fill: C.ink });
    // 崩溃恢复
    s += rect(380, 104, 330, 140, { fill: C.white, stroke: C.rose, lw: 1.5 });
    s += text(545, 122, '崩溃恢复的三个时刻', { size: 12, weight: 700, fill: C.rose });
    [['写日志途中崩溃', 'header 未 commit → 直接丢弃日志'],
     ['commit 后、install 前崩溃', '重放日志 → 重做'],
     ['install 后、clear 前崩溃', '重放是幂等的 → 无害']].forEach(function (r, i) {
      s += text(396, 144 + i * 30, '· ' + r[0], { anchor: 'start', size: 11, weight: 600, fill: C.ink });
      s += text(396, 160 + i * 30, '   ' + r[1], { anchor: 'start', size: 10.8, fill: C.dim });
    });
    s += text(380, 262, '代价：一次文件写要写两遍磁盘（先日志后原位），且 xv6 的 log 是全局串行的', { size: 11.5, fill: C.amber });
    return svg(278, s);
  };

  /* =========================================================
     18. 用户级虚拟内存原语（Appel & Li）→ 现代 mmap
     ========================================================= */
  VZ.vmprimitives = function () {
    var s = '';
    s += text(380, 16, 'Appel & Li (1991) 提议的 6 个原语 → 今天 Unix 里分别由什么提供', { size: 12.5, weight: 700 });
    var rows = [
      ['TRAP', '把页错误交给用户态处理', 'sigaction(SIGSEGV)', C.blue],
      ['PROT1', '降低单个页的访问权限', 'mprotect(addr, 4096, …)', C.purple],
      ['PROTN', '降低 N 个页的访问权限', 'mprotect(addr, len, …)', C.purple],
      ['UNPROT', '恢复某页的访问权限', 'mprotect(addr, len, PROT_RW)', C.purple],
      ['DIRTY', '取回自上次调用以来被写脏的页', '没有直接对应，要靠 mincore / 软脏位 / 用户态跟踪', C.amber],
      ['MAP2', '同一物理页映射成两个 VA，权限不同', 'shm_open + mmap 两次（近似）', C.amber]
    ];
    s += '<g>' + rect(40, 34, 680, 24, { fill: C.gray2, stroke: 'none', r: 0 }) +
      text(56, 50, '原语', { anchor: 'start', size: 11.5, weight: 700, fill: C.dim }) +
      text(200, 50, '含义', { anchor: 'start', size: 11.5, weight: 700, fill: C.dim }) +
      text(400, 50, '今天的对应物', { anchor: 'start', size: 11.5, weight: 700, fill: C.dim }) + '</g>';
    rows.forEach(function (r, i) {
      var y = 60 + i * 26;
      s += rect(40, y, 680, 24, { fill: i % 2 ? C.gray : C.white, stroke: 'none' });
      s += text(56, y + 17, r[0], { anchor: 'start', size: 11.5, weight: 700, fill: r[3], mono: true });
      s += text(200, y + 17, r[1], { anchor: 'start', size: 11, fill: C.ink });
      s += text(400, y + 17, r[2], { anchor: 'start', size: 10.8, mono: true, fill: C.text });
    });
    s += rect(40, 220, 680, 54, { fill: C.white, stroke: C.line });
    s += text(380, 238, '论文的真正影响：不是这 6 个原语本身被采纳，而是「页错误应该可以由应用程序自己处理」这个观念', { size: 11.5, weight: 700, fill: C.ink });
    s += text(380, 258, '它直接通向 mmap + 用户态页错误处理 —— 也就是 xv6 的 cow lab 与 mmap lab 在做的事（GC、检查点、DSM、压缩分页…）', { size: 11.5, fill: C.dim });
    return svg(286, s);
  };

  /* =========================================================
     19. 换页（page to disk）
     ========================================================= */
  VZ.paging = function () {
    var s = '';
    s += text(380, 16, '把 RAM 当作磁盘的缓存：页错误 = cache miss，淘汰 = eviction', { size: 12.5, weight: 700 });
    // 页表
    s += rect(30, 34, 170, 132, { fill: C.white, stroke: C.blue, lw: 1.5 });
    s += text(115, 52, '页表（4 个 PTE）', { size: 11.5, weight: 700, fill: C.blue });
    [['VA 0', '→ PA1', C.greenL], ['VA 1', '→ PA0', C.greenL], ['VA 2', '→ 磁盘（无效）', C.roseL], ['VA 3', '→ 未分配', C.gray]]
      .forEach(function (r, i) {
        var y = 62 + i * 25;
        s += rect(40, y, 150, 21, { fill: r[2], stroke: 'none' });
        s += text(48, y + 15, r[0], { anchor: 'start', size: 10.5, mono: true });
        s += text(182, y + 15, r[1], { anchor: 'end', size: 10.5, fill: C.ink });
      });
    // RAM
    s += rect(240, 34, 150, 132, { fill: C.gray, stroke: C.line });
    s += text(315, 52, '物理内存（2 页）', { size: 11.5, weight: 700 });
    s += rect(252, 62, 126, 46, { fill: C.greenL, stroke: C.green });
    s += text(315, 88, 'PA0（VA1）', { size: 11.5, weight: 700, fill: C.green });
    s += rect(252, 112, 126, 46, { fill: C.greenL, stroke: C.green });
    s += text(315, 138, 'PA1（VA0）', { size: 11.5, weight: 700, fill: C.green });
    // 磁盘
    s += rect(430, 34, 150, 132, { fill: C.gray, stroke: C.line });
    s += text(505, 52, '磁盘（后备存储）', { size: 11.5, weight: 700 });
    [0, 1, 2, 3].forEach(function (i) {
      s += rect(442, 62 + i * 25, 126, 21, { fill: i === 2 ? C.roseL : C.amberL, stroke: 'none' });
      s += text(505, 77 + i * 25, 'disk page ' + i, { size: 10.5, mono: true });
    });
    // 事件
    s += rect(610, 34, 120, 132, { fill: C.white, stroke: C.purple, lw: 1.5 });
    s += text(670, 52, '一次缺页', { size: 11.5, weight: 700, fill: C.purple });
    ['① 访问 VA2', '② 无空闲 PA', '③ 选 PA1 淘汰', '④ PTE2→无效', '⑤ 写回 disk1', '⑥ 读入 disk2', '⑦ PTE2→PA1'].forEach(function (t, i) {
      s += text(670, 70 + i * 14, t, { size: 10, fill: C.ink });
    });
    s += text(380, 190, 'xv6 不做换页（没有磁盘作为后备存储），但 cow lab / mmap lab 用的是同一套「页错误 → 内核按需供给页面」的机制', { size: 11.5, fill: C.ink });
    s += text(380, 210, '理解换页的意义：它是「虚拟内存 = 一层间接」最完整的体现，也是理解 superpage 论文上下文的前提', { size: 11.5, fill: C.dim });
    return svg(226, s);
  };

  /* =========================================================
     20. sleep / wakeup 协调
     ========================================================= */
  VZ.sleepwake = function () {
    var s = '';
    s += text(380, 16, 'sleep(chan, lk) / wakeup(chan)：为什么必须带着锁睡', { size: 12.5, weight: 700 });
    s += rect(40, 40, 300, 96, { fill: C.roseL, stroke: C.rose, lw: 1.5 });
    s += text(190, 58, '❌ 错误写法：先释放锁，再 sleep', { size: 12, weight: 700, fill: C.rose });
    s += text(190, 80, 'A: 检查条件（无数据）', { size: 11, fill: C.ink });
    s += text(190, 98, 'A: release(&lk)  ← 窗口打开', { size: 11, fill: C.rose, weight: 600 });
    s += text(190, 116, 'B: 放入数据 + wakeup(chan)  ← 没人睡着，丢失唤醒', { size: 11, fill: C.rose, weight: 600 });
    s += text(190, 134, 'A: sleep(chan)   ← 永久沉睡', { size: 11, fill: C.rose, weight: 700 });
    s += rect(410, 40, 300, 96, { fill: C.greenL, stroke: C.green, lw: 1.5 });
    s += text(560, 58, '✅ 正确写法：把锁交给 sleep', { size: 12, weight: 700, fill: C.green });
    s += text(560, 80, 'A: acquire(&lk) 后检查条件', { size: 11, fill: C.ink });
    s += text(560, 98, 'A: sleep(chan, &lk)', { size: 11, fill: C.green, weight: 600 });
    s += text(560, 116, '  → 原子地「把自己标为 SLEEPING + 释放 lk」', { size: 10.5, fill: C.ink });
    s += text(560, 134, 'B: acquire(&lk) → 改条件 → wakeup → release', { size: 11, fill: C.ink });
    s += rect(40, 152, 670, 62, { fill: C.white, stroke: C.line });
    s += text(375, 170, '「丢失的唤醒」（lost wakeup）是并发里最经典的 bug 之一：条件检查与进入睡眠必须是原子的', { size: 11.5, weight: 700, fill: C.ink });
    s += text(375, 190, '所以 sleep 的锁参数是必需的：它保证「我睡着」这个事实对后来的 wakeup 可见，且中间不会插进一个 wakeup', { size: 11.5, fill: C.dim });
    s += text(375, 208, '另外：调用 wakeup 时持有被等待的锁不是必须的，但 xv6 通常持有，以避免 wakeup 与 sleep 交错', { size: 11.5, fill: C.dim });
    return svg(226, s);
  };

  /* =========================================================
     21. 内核/用户地址空间（xv6）
     ========================================================= */
  VZ.xv6addrspace = function () {
    var s = '';
    s += text(190, 16, 'xv6 用户地址空间', { size: 13, weight: 700 });
    s += text(570, 16, 'xv6 内核地址空间（每进程一份内核页表）', { size: 13, weight: 700 });
    var u = [
      ['0x0000 起：text / data / heap', C.gray],
      ['栈（guard page 在下面）', C.blueL],
      ['USYSCALL（pgtbl lab：getpid 加速）', C.tealL],
      ['mmap 区域（mmap lab）', C.purpleL],
      ['TRAPFRAME（一页，保存寄存器）', C.amberL],
      ['TRAMPOLINE（最高一页，用户也映射）', C.roseL]
    ];
    u.forEach(function (g, i) {
      var y = 200 - (i + 1) * 30;
      s += rect(60, y, 260, 28, { fill: g[1], stroke: C.line });
      s += text(190, y + 19, g[0], { size: 10.5, weight: 600 });
    });
    s += text(190, 224, '低地址 → 高地址（自下而上）', { size: 10.5, fill: C.dim });
    var k = [
      ['0x80000000：内核代码与数据（直接映射）', C.gray],
      ['内核栈 × N（各带 guard page）', C.blueL],
      ['PLIC / UART / VIRTIO 等 MMIO（直接映射）', C.tealL],
      ['物理内存直接映射区（identity）', C.purpleL],
      ['TRAMPOLINE（与用户同一物理页）', C.roseL]
    ];
    k.forEach(function (g, i) {
      var y = 200 - (i + 1) * 30;
      s += rect(430, y, 290, 28, { fill: g[1], stroke: C.line });
      s += text(575, y + 19, g[0], { size: 10.5, weight: 600 });
    });
    s += text(575, 224, '内核地址 = 物理地址（KERNBASE 之上恒等映射）', { size: 10.5, fill: C.dim });
    s += text(380, 250, 'TRAMPOLINE 被映射到用户与内核地址空间的同一个虚拟地址 —— 这样切换页表的瞬间，取指仍能在同一 VA 上继续执行', { size: 11.5, fill: C.ink });
    s += text(380, 270, 'TRAPFRAME 也是同样思路：切换 satp 之后内核要有个已知位置存放刚保存下来的用户寄存器', { size: 11.5, fill: C.dim });
    return svg(286, s);
  };

  /* =========================================================
     22. RISC-V 与 x86 的机制对照
     ========================================================= */
  VZ.riscvvsx86 = function () {
    var s = '';
    s += text(380, 16, '同一个 OS 概念，两套硬件机制', { size: 13, weight: 700 });
    var rows = [
      ['特权级', 'M / S / U 三级（xv6 只用 S 与 U）', 'Ring 0–3（实际只用 0 与 3）'],
      ['系统调用指令', 'ecall（带参数在 a0–a7）', 'int 0x80 / syscall（SYSENTER）'],
      ['陷入入口', 'stvec 寄存器指向 trampoline', 'IDT + IDTR，按向量号索引门描述符'],
      ['页表基址', 'satp（存根页表 PPN + ASID）', 'CR3（指向页目录）'],
      ['页表结构', 'Sv39 三级，硬件 walker 填 A/D 位', '32 位二级 / PAE 三级 / 64 位四级'],
      ['TLB 刷新', 'sfence.vma（可按 ASID/VA 局部）', '重新加载 CR3 或 invlpg'],
      ['中断控制器', 'PLIC（外部）+ CLINT（时钟/软中断）', 'PIC → APIC / LAPIC + IOAPIC'],
      ['设备 I/O', '只有 MMIO（统一编址）', 'MMIO + 独立的 in/out 端口空间'],
      ['原子操作', 'LR/SC + amo*（amoswap / amoadd）', 'lock 前缀 / xchg / cmpxchg'],
      ['调用约定', 'a0–a7 传参，ra 存返回地址', 'x86-64: rdi,rsi…；32 位靠栈'],
      ['中断开关', 'sstatus.SIE + sie 寄存器', 'EFLAGS.IF + 中断屏蔽'],
      ['返回指令', 'sret（回到 sepc）', 'iret（从栈上弹出 CS/IP/EFLAGS）']
    ];
    s += '<g>' + rect(30, 32, 700, 24, { fill: C.gray2, stroke: 'none', r: 0 }) +
      text(46, 48, '概念', { anchor: 'start', size: 11.5, weight: 700, fill: C.dim }) +
      text(280, 48, 'RISC-V（xv6-riscv）', { anchor: 'start', size: 11.5, weight: 700, fill: C.blueD }) +
      text(510, 48, '80x86（JOS / xv6-x86）', { anchor: 'start', size: 11.5, weight: 700, fill: C.purple }) + '</g>';
    rows.forEach(function (r, i) {
      var y = 58 + i * 20;
      s += rect(30, y, 700, 19, { fill: i % 2 ? '#fafbfc' : C.white, stroke: 'none' });
      s += text(46, y + 14, r[0], { anchor: 'start', size: 11, weight: 700, fill: C.ink });
      s += text(280, y + 14, r[1], { anchor: 'start', size: 10.5, mono: true, fill: C.text });
      s += text(510, y + 14, r[2], { anchor: 'start', size: 10.5, mono: true, fill: C.text });
    });
    return svg(300, s);
  };

  /* =========================================================
     23. 栈帧与 backtrace
     ========================================================= */
  VZ.stackframe = function () {
    var s = '';
    s += text(380, 16, 'xv6 内核栈：每个栈帧里 ra 在 fp-8，上一个 fp 在 fp-16', { size: 12.5, weight: 700 });
    var frames = [
      { n: 'panic()', col: C.rose }, { n: 'sys_pause()', col: C.purple },
      { n: 'syscall()', col: C.blue }, { n: 'usertrap()', col: C.teal }
    ];
    frames.forEach(function (f, i) {
      var y = 40 + i * 52;
      s += rect(120, y, 220, 46, { fill: C.white, stroke: f.col, lw: 1.4 });
      s += text(230, y + 19, f.n, { size: 12, weight: 700, fill: f.col });
      s += rect(132, y + 24, 90, 16, { fill: C.amberL, stroke: 'none' });
      s += text(177, y + 36, 'ra', { size: 10, mono: true, fill: C.amber });
      s += rect(230, y + 24, 90, 16, { fill: C.blueL, stroke: 'none' });
      s += text(275, y + 36, 'prev fp', { size: 10, mono: true, fill: C.blueD });
      s += text(230, y + 19, f.n, { size: 12, weight: 700, fill: f.col });
      if (i < 3) s += line(275, y + 40, 275, y + 52, { stroke: C.blue, marker: 'arb', lw: 1.4 });
    });
    s += text(380, 40 + 4 * 52 + 6, '…（栈向低地址增长，最上面是栈底）', { size: 11, fill: C.dim });
    s += rect(380, 60, 340, 150, { fill: C.white, stroke: C.line });
    s += text(550, 78, 'backtrace 的做法', { size: 12, weight: 700 });
    ['① r_fp() 读 s0 得到当前 fp', '② ra = *(fp - 8)，打印', '③ fp = *(fp - 16)，向上一层',
      '④ 直到 fp 越过本页边界（PGROUNDDOWN）为止'].forEach(function (t, i) {
      s += text(396, 100 + i * 22, t, { anchor: 'start', size: 11, fill: C.ink });
    });
    s += text(396, 196, '为什么能停：每个内核栈恰好一页，且页对齐', { anchor: 'start', size: 10.5, fill: C.dim });
    return svg(260, s);
  };

  /* =========================================================
     24. 中断 vs 轮询（设备驱动）
     ========================================================= */
  VZ.intrpoll = function () {
    var s = '';
    s += text(190, 16, '纯中断：低负载延迟好，高负载活锁', { size: 12.5, weight: 700 });
    s += text(570, 16, '纯轮询：吞吐稳，低负载白烧 CPU', { size: 12.5, weight: 700 });
    s += rect(50, 40, 280, 160, { fill: C.white, stroke: C.rose, lw: 1.5 });
    s += text(190, 58, '每个包 → 一次中断 → 一次上下文切换', { size: 11.5, weight: 700, fill: C.rose });
    [0, 1, 2, 3, 4].forEach(function (i) {
      s += rect(66 + i * 52, 76, 44, 40, { fill: C.roseL, stroke: C.rose });
      s += text(88 + i * 52, 100, 'IRQ', { size: 11, fill: C.rose });
    });
    s += text(190, 134, 'CPU 时间：几乎全在中断处理', { size: 11, fill: C.dim });
    s += text(190, 154, '应用吞吐：0（活锁）', { size: 11.5, weight: 700, fill: C.rose });
    s += text(190, 178, '延迟：低负载时极低', { size: 11, fill: C.green });
    s += rect(400, 40, 300, 160, { fill: C.white, stroke: C.teal, lw: 1.5 });
    s += text(550, 58, '循环：收一批 → 处理 → 再收', { size: 11.5, weight: 700, fill: C.teal });
    s += rect(416, 76, 268, 40, { fill: C.tealL, stroke: C.teal });
    s += text(550, 100, '一次循环里处理 N 个包（批量）', { size: 11.5, fill: C.teal });
    s += text(550, 134, 'CPU 时间：可控（不会失控）', { size: 11, fill: C.dim });
    s += text(550, 154, '吞吐：稳定不塌', { size: 11.5, weight: 700, fill: C.green });
    s += text(550, 178, '延迟：低负载时多出轮询等待', { size: 11, fill: C.amber });
    s += rect(50, 214, 650, 52, { fill: C.white, stroke: C.line });
    s += text(375, 232, '现实做法（Linux NAPI / Mogul 论文）：混合 —— 有包来时先中断，进入后就关掉该设备中断转轮询，',
      { size: 11.5, fill: C.ink });
    s += text(375, 252, '处理到配额用尽或队列为空，再开中断退出。网络设备驱动（xv6 net lab）与 UART 都适用这个思路。',
      { size: 11.5, fill: C.dim });
    return svg(278, s);
  };

  /* =========================================================
     25. 锁的粒度：粗 → 细
     ========================================================= */
  VZ.lockgranularity = function () {
    var s = '';
    s += text(380, 16, '并行化三板斧：拆数据结构 / 拆锁 / 换成更适合并发的算法', { size: 12.5, weight: 700 });
    var items = [
      { t: '一把大锁（粗粒度）', d: '正确性最容易\n并行度 = 1', c: C.rose, l: C.roseL, p: 1 },
      { t: '按对象拆锁', d: '每个 inode / 每个桶一把锁\n并行度 ↑，但要防死锁（定序）', c: C.amber, l: C.amberL, p: 2 },
      { t: '每 CPU 一份', d: '各自操作各自的数据\n并行度 ≈ NCPU，偶尔要「偷」', c: C.green, l: C.greenL, p: 3 },
      { t: '无锁 / RCU', d: '读侧完全不写共享计数器\n读多写少场景最优', c: C.blue, l: C.blueL, p: 4 }
    ];
    items.forEach(function (it, i) {
      var x = 30 + i * 182;
      s += rect(x, 36, 166, 132, { fill: it.l, stroke: it.c, lw: 1.5 });
      s += text(x + 83, 56, it.t, { size: 12, weight: 700, fill: it.c });
      it.d.split('\n').forEach(function (ln, j) {
        s += text(x + 83, 84 + j * 18, ln, { size: 10.8, fill: C.ink });
      });
      s += rect(x + 18, 138, 130, 12, { fill: C.white, stroke: C.line, r: 6 });
      s += rect(x + 18, 138, 130 * it.p / 4, 12, { fill: it.c, stroke: 'none', r: 6 });
      s += text(x + 83, 166, '并行度', { size: 10, fill: C.dim });
      if (i < 3) s += line(x + 166, 100, x + 182, 100, { stroke: C.line2, marker: 'ar' });
    });
    s += rect(30, 184, 700, 62, { fill: C.white, stroke: C.line });
    s += text(380, 202, 'lock lab 走的是第 2→3 步：kalloc 从「全局链表 + 一锁」变成「每 CPU 链表 + 每 CPU 锁 + 偷页」', { size: 11.5, weight: 700, fill: C.ink });
    s += text(380, 222, '判断依据不是直觉，而是量出来的 #test-and-set：它直接暴露「有多少次 acquire 在空转」', { size: 11.5, fill: C.dim });
    s += text(380, 242, '注意：并行化常常要改数据结构本身 —— 这是本 lab 的核心思维，而不是「换个锁 API」', { size: 11.5, fill: C.dim });
    return svg(258, s);
  };

  /* =========================================================
     26. 操作系统分层与「唯一入口」
     ========================================================= */
  VZ.oslayers = function () {
    var s = '';
    // 用户层
    s += layer(30, 12, 700, 60, '用户空间（U mode，不可执行特权指令）', { fill: '#f2f7ff', stroke: '#c9dcf8' });
    var apps = ['shell', 'ls / cat', '你的程序', '数据库', '浏览器'];
    apps.forEach(function (a, i) {
      var x = 48 + i * 136;
      s += rect(x, 30, 122, 32, { fill: C.white, stroke: C.blue });
      s += text(x + 61, 50, a, { size: 11.5, weight: 600 });
    });
    // 系统调用接口
    s += rect(30, 82, 700, 34, { fill: C.roseL, stroke: C.rose, lw: 1.6 });
    s += text(380, 103, '系统调用接口：fork  exec  open  read  write  mmap  kill  pipe  …  ← 唯一入口',
      { size: 12, weight: 700, fill: C.rose });
    // 内核
    s += layer(30, 124, 700, 96, '内核（S mode，全部特权）', { fill: '#fbf6ff', stroke: '#ded0fa' });
    var subs = ['进程 / 调度', '虚拟内存', '文件系统', '设备驱动', '网络协议栈'];
    subs.forEach(function (m, i) {
      var x = 44 + i * 136;
      s += rect(x, 142, 124, 62, { fill: C.white, stroke: C.purple });
      s += text(x + 62, 172, m, { size: 11.5, weight: 600, fill: C.purple });
    });
    // 硬件
    s += rect(30, 228, 700, 34, { fill: C.gray, stroke: C.line });
    s += text(380, 249, '硬件：多核 CPU · 内存 · 磁盘 · 网卡 · 定时器 · UART', { size: 12, weight: 600 });
    // 箭头
    s += path('M380,72 L380,82', { stroke: C.rose, marker: 'arr', lw: 2 });
    s += text(470, 74, 'ecall（唯一入口）', { anchor: 'start', size: 10.5, fill: C.rose, weight: 700 });
    s += text(270, 74, 'sret（返回）', { anchor: 'end', size: 10.5, fill: C.green, weight: 700 });
    s += path('M240,82 L240,72', { stroke: C.green, marker: 'ar', lw: 2 });
    s += text(380, 276, '进程之间不能直接互相访问内存，也不能直接调用内核函数 —— 所有跨边界行为都必须经过中间那条红线',
      { size: 11.5, fill: C.dim });
    return svg(290, s);
  };

  /* ---------- 对外暴露 ---------- */
  global.VIZ = VZ;
  global.VIZC = C;
  global.vizWrap = function (svgstr, caption) {
    return '<div class="viz">' + svgstr + (caption ? cap(caption) : '') + '</div>';
  };

})(window);
