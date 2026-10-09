/* ============================================================
   data-xv6.js — xv6 手册：章节地图、lab 必备基础、RISC-V vs 80x86
   ============================================================ */
var XV6_DATA = {
  groups: [

    /* ============ 组 1 ============ */
    {
      name: "一、xv6 鸟瞰：一个刻意保持「能一口气读完」的 Unix",
      desc: "先知道 xv6 是什么、不是什么，以及它的代码该怎么读。",
      items: [
        {
          id: "x-intro", no: "X01", short: "xv6 是什么",
          title: "xv6：Dennis Ritchie 的 Unix v6 的 RISC-V 重实现",
          subtitle: "它的设计目标不是「快」或「功能全」，而是「让一个学期内能读懂一个真正的操作系统内核」。",
          meta: [["代码量", "约 1 万行（Linux 是千万行级）"], ["血统", "Unix v6 (1975) → xv6 (RISC-V)"], ["源码", "github.com/mit-pdos/xv6-riscv"]],
          tags: ["xv6|amber", "入门|green"],
          blocks: [
            { t: "p", html: "xv6 是 MIT 为教学重写的 Unix 第六版。它<b>刻意保留</b>了 v6 的结构与风格，但用现代 C 和 RISC-V 重写。理解它的定位要抓住三点：" },
            { t: "ul", items: [
              "<b>它是真的操作系统</b>：有多进程、虚拟内存、中断、文件系统、系统调用。不是玩具模拟器。",
              "<b>它牺牲了性能与功能</b>：没有 uid/权限、没有换页、没有网络协议栈（net lab 才加）、调度是朴素 round-robin、文件系统日志是全局串行。这些「缺失」都是<b>有意的</b>，为了让代码短。",
              "<b>它是宏内核</b>：所有子系统在一个特权程序里，靠函数调用协作。这既是它简单的原因，也是它和 L4 这类微内核的对照物。"
            ] },
            { t: "viz", id: "oslayers", cap: "xv6 在整门课里的位置：它就是中间那层「内核」，而你写的 lab 就是在改它的某一块" },
            { t: "note", kind: "purple", title: "一条重要的阅读策略", html: "不要试图「通读」xv6。<b>按 lab 读</b>：做哪个 lab 就读哪几个文件。本站第二部分每个 lab 都列了「必须先看懂哪些函数」。<br><br>原因：内核代码高度耦合，从 <code>main()</code> 开始线性读会立刻迷失；而带着一个具体问题（「fork 怎么复制页表？」）去读，效率会高一个数量级。" },
            { t: "h", text: "xv6 的七条设计取舍" },
            { t: "table", head: ["取舍", "xv6 的选择", "省掉了什么", "代价"], rows: [
              ["内核结构", "宏内核，单特权程序", "IPC、服务进程", "一个驱动崩 = 整机崩"],
              ["调度", "朴素 round-robin", "优先级、负载均衡、NUMA", "不适合真实负载"],
              ["内存管理", "不做换页，页分配即给", "页面替换、内存回收", "不能运行超内存的程序"],
              ["文件系统", "简单的 inode + 全局串行日志", "并发事务、extent、COW", "写性能差、并发度低"],
              ["安全", "无 uid、无权限检查", "整套 DAC 机制", "无法做真正的多用户隔离"],
              ["同步", "自旋锁 + 睡眠唤醒", "RCU、无锁结构、读写锁（lock lab 才加）", "多核扩展性差"],
              ["硬件支持", "只支持 QEMU virt + 少量设备", "多平台、热插拔、电源管理", "不能在真机跑（一般）"]
            ] }
          ]
        },
        {
          id: "x-source", no: "X02", short: "源码地图",
          title: "kernel/ 目录里每个文件是干什么的",
          subtitle: "先知道「去哪找」，比知道「怎么实现」更重要。",
          meta: [["难度", "★☆☆"]],
          tags: ["xv6|amber", "参考|green"],
          blocks: [
            { t: "h", text: "kernel/ 核心文件速查" },
            { t: "table", head: ["文件", "职责", "关联 lab"], rows: [
              ["<code>entry.S</code> / <code>start.c</code>", "最早期启动：从 M mode 切到 S mode，设置栈与 <code>satp</code> 开分页", "—"],
              ["<code>main.c</code>", "初始化各个子系统，然后启动第一个用户进程 <code>init</code>", "—"],
              ["<code>proc.h</code> / <code>proc.c</code>", "<b>进程</b>：proc 表、fork/exec/exit/wait、调度器、sleep/wakeup、swtch", "syscall, traps, cow, mmap"],
              ["<code>vm.c</code>", "<b>虚拟内存</b>：kvm/uvm 系列、walk、mappages、uvmcopy、copyout", "pgtbl, cow, mmap"],
              ["<code>kalloc.c</code>", "<b>物理内存分配</b>：空闲链表、kalloc/kfree", "lock, cow"],
              ["<code>memlayout.h</code>", "内存布局常量（TRAMPOLINE、TRAPFRAME、USYSCALL、KERNBASE…）", "pgtbl, traps"],
              ["<code>riscv.h</code>", "特权寄存器读写、PTE 标志常量、地址对齐宏", "pgtbl, traps"],
              ["<code>trampoline.S</code>", "<b>进出内核的汇编</b>：uservec（保存寄存器）、userret（恢复）", "traps"],
              ["<code>trap.c</code>", "陷阱处理：usertrap / kerneltrap / devintr / clockintr", "traps, net"],
              ["<code>syscall.c</code> / <code>syscall.h</code>", "系统调用分发表与参数读取（argint/argaddr/argstr）", "syscall"],
              ["<code>sysproc.c</code> / <code>sysfile.c</code>", "各系统调用的具体实现", "syscall, mmap, fs"],
              ["<code>spinlock.c</code> / <code>spinlock.h</code>", "自旋锁；lock lab 里要加读写锁", "lock"],
              ["<code>file.h</code> / <code>file.c</code>", "<code>struct file</code>、fd 表、管道", "util, mmap"],
              ["<code>fs.h</code> / <code>fs.c</code>", "<b>文件系统</b>：inode、目录、路径解析（namei）、bmap", "fs"],
              ["<code>bio.c</code>", "<b>buffer cache</b>：bread/bwrite/brelse", "fs"],
              ["<code>log.c</code>", "<b>预写日志</b>：begin_op / log_write / commit", "fs"],
              ["<code>uart.c</code>", "串口驱动（最简单的中断驱动设备）", "net"],
              ["<code>virtio_disk.c</code>", "磁盘驱动（描述符环 + DMA）", "fs"],
              ["<code>plic.c</code>", "中断控制器：中断路由与分发", "net"],
              ["<code>printf.c</code> / <code>printk.c</code>", "内核打印；traps lab 里要加 backtrace", "traps"]
            ] },
            { t: "h", text: "user/ 侧需要知道的三个文件" },
            { t: "ul", items: [
              "<code>user/user.h</code> —— 系统调用的 C 声明（你在 util lab 里看的就是它）；",
              "<code>user/usys.pl</code> —— 生成 <code>usys.S</code> 的脚本（每个 syscall 一段 <code>li a7, N; ecall; ret</code>）；",
              "<code>user/sh.c</code> —— shell，一个<b>普通用户程序</b>，展示了 fork/exec/wait/fd 怎么拼出命令行体验。"
            ] },
            { t: "note", kind: "warn", title: "一个新版本的重要变化", html: "2026 版的 xv6 <b>每个进程有自己独立的内核页表</b>（旧版所有进程共享一个内核页表）。<br><br>这影响你对 <code>TRAMPOLINE</code> 的理解：它必须在<b>每一个</b>用户页表和每一个内核页表里都映射到同一个虚拟地址。<br><br>如果你参考的是旧资料，注意这个区别——很多旧笔记写的是「内核页表只有一份」。" }
          ]
        },
        {
          id: "x-book", no: "X03", short: "xv6 book 章节地图",
          title: "11 章分别讲什么，对应哪些 lab",
          subtitle: "不要通读，按 lab 需要跳着读。",
          meta: [["书", "mit-pdos.github.io/xv6-riscv-book"], ["难度", "★☆☆"]],
          tags: ["xv6|amber", "参考|green"],
          blocks: [
            { t: "table", head: ["章", "标题", "核心内容", "对应 lab"], rows: [
              ["Ch.1", "Operating system interfaces", "进程与内存、I/O 与 fd、管道、文件系统、shell。<b>从使用者视角</b>看 OS", "<b>util</b>"],
              ["Ch.2", "Operating system organization", "抽象、特权模式（U/S）、内核组织、进程抽象、xv6 启动、第一个进程", "<b>syscall</b>"],
              ["Ch.3", "Page tables", "分页硬件、Sv39、进程地址空间、内核地址空间、物理内存分配、<b>Figure 3-2 / 3-3 / 3-4</b>", "<b>pgtbl</b>, cow"],
              ["Ch.4", "Traps and system calls", "RISC-V 陷入机制、trampoline、trapframe、<b>§4.3/§4.4</b> 系统调用路径、§4.6 缺页", "<b>traps</b>, cow, mmap"],
              ["Ch.5", "Interrupts and device drivers", "（对应讲义 LEC 11）控制台输入、UART、定时器、<b>中断与轮询</b>", "<b>net</b>"],
              ["Ch.6", "Locking", "竞争、锁、死锁、锁的粒度、<b>§6.x 调度与 sleep/wakeup</b>", "<b>lock</b>"],
              ["Ch.7", "Scheduling", "多路复用、上下文切换（swtch）、调度器、睡眠与唤醒", "lock"],
              ["Ch.8", "File system", "inode、目录、buffer cache、logging 与崩溃恢复、<b>Figure 8-3 inode 图</b>", "<b>fs</b>"]
            ] },
            { t: "note", kind: "warn", title: "章节编号可能因版本变化", html: "lab 手册里引用的章节号（如「Chapter 10: File system」「Chapter 7: Locking」）来自<b>特定年份的版本</b>。<br><br>请按<b>标题</b>而不是编号来找：<b>Locking / Page tables / Traps / File system</b> 这四个标题是稳定的锚点。" },
            { t: "h", text: "必看的三张图" },
            { t: "ul", items: [
              "<b>Figure 3-2 / 3-3</b>：xv6 的<b>内核地址空间</b>布局（谁映射在哪、地址 0 为什么没映射）；",
              "<b>Figure 3-4</b>：一个<b>用户进程的地址空间</b>（text/data/heap/stack/trapframe/trampoline）；",
              "<b>Figure 8-3</b>：<b>inode</b> 的直接块 + 一级间接块结构（fs lab 要在这张图上加一层）。"
            ] },
            { t: "p", html: "这三张图几乎覆盖了 pgtbl / syscall / traps / fs 四个 lab 的背景知识。<b>先把它们手画一遍</b>，比读十页文字有效。" }
          ]
        }
      ]
    },

    /* ============ 组 2 ============ */
    {
      name: "二、每个 lab 必须掌握的 xv6 设计基础",
      desc: "按 lab 组织：做之前先看懂哪些文件、哪些函数、哪些结构。",
      items: [
        {
          id: "x-lab-util", no: "X04", short: "util 的 xv6 基础",
          title: "util：从使用者视角看 xv6 的接口",
          subtitle: "必备：Ch.1 + user/ 下的几个程序 + 三个核心概念。",
          meta: [["对应", "Lab util"], ["必读", "xv6 book Ch.1"]],
          tags: ["xv6|amber", "util|blue"],
          blocks: [
            { t: "h", text: "必须先看懂的三样东西" },
            { t: "ol", items: [
              "<b><code>user/sh.c</code></b>：shell 是怎么工作的。它展示了一个「命令行」完全可以由 fork + exec + wait + fd 拼出来。看完你会明白<b>shell 不是内核的一部分</b>。",
              "<b><code>user/ls.c</code></b>：目录是文件。读目录 = open + read 出一串 <code>struct dirent</code>。这是 find 题的直接模板。",
              "<b><code>user/user.h</code></b>：xv6 对外暴露的<b>全部</b>系统调用列表。数一数有多少个 —— 这个数字决定了 xv6 里程序能力的上限。"
            ] },
            { t: "h", text: "三个必须想通的设计" },
            { t: "acc", title: "① fork + exec 为什么要分两步", open: true, blocks: [
              { t: "p", html: "<code>fork()</code> 复制进程，<code>exec()</code> <b>替换</b>地址空间（<b>不创建新进程</b>）。中间的窗口让子进程可以改 fd、改状态，再 exec。<code>cat &lt; in.txt &gt; out.txt</code> 就是靠这个窗口实现的。" }
            ] },
            { t: "acc", title: "② fd 是进程私有表的下标", open: false, blocks: [
              { t: "p", html: "<code>struct proc</code> 里有 <code>ofile[NOFILE]</code>。fork 时子进程<b>复制这张表</b>，但表项指向<b>同一个 <code>struct file</code></b>。这就是 shell 能把 stdout 传给子进程的原因。" }
            ] },
            { t: "acc", title: "③ 一切皆文件", open: false, blocks: [
              { t: "p", html: "xv6 里管道、设备（console）、普通文件都是 fd。看 <code>user/sh.c</code> 里的 <code>runcmd</code> 处理 <code>|</code> 的那段——管道就是一个 fd。" }
            ] },
            { t: "note", kind: "ok", title: "这个 lab 的隐藏目标", html: "让你建立「<b>程序能做的事是被枚举出来的</b>」这个直觉。看一眼 <code>user/user.h</code> 里那二十来个声明，你就明白了为什么「拦截系统调用」是个如此自然的想法（→ Janus 论文）。" }
          ]
        },
        {
          id: "x-lab-syscall", no: "X05", short: "syscall 的 xv6 基础",
          title: "syscall：进程结构与系统调用分发",
          subtitle: "必备：Ch.2 + §4.3/§4.4 + proc.h + 五个改动点。",
          meta: [["对应", "Lab syscall"], ["必读", "xv6 book Ch.2 + §4.3/§4.4"]],
          tags: ["xv6|amber", "syscall|blue"],
          blocks: [
            { t: "viz", id: "trapflow", cap: "一次系统调用的完整路径，以及你要插入拦截逻辑的位置（syscall() 里，分发之前）" },
            { t: "h", text: "必须先看懂的文件" },
            { t: "table", head: ["文件", "看什么"], rows: [
              ["<code>kernel/proc.h</code>", "<code>struct proc</code> 的全部字段。你要往里加 <code>mask</code> 和 <code>allowed[]</code>，所以必须知道它有哪些邻居（<code>pagetable</code>、<code>ofile</code>、<code>trapframe</code>、<code>state</code>…）"],
              ["<code>kernel/syscall.c</code>", "<code>syscall()</code> 函数：读 <code>a7</code> → 查表 → 调用 → 把返回值写回 <code>a0</code>。<b>你的拦截逻辑就插在查表之后、调用之前</b>"],
              ["<code>kernel/syscall.h</code>", "syscall 编号。<b>1 &lt;&lt; num</b> 就是 mask 的位"],
              ["<code>user/usys.pl</code>", "生成 stub 的脚本。看它长什么样，你就知道为什么要改它"],
              ["<code>kernel/proc.c</code> 的 <code>kfork()</code>", "父进程状态怎么复制给子进程。<b>你要在这里加 mask 的继承</b>"]
            ] },
            { t: "h", text: "三个关键机制" },
            { t: "acc", title: "① 参数是怎么从用户传进来的", open: true, blocks: [
              { t: "p", html: "用户把参数放进 <code>a0</code>–<code>a5</code>，<code>ecall</code> 之后它们被保存在 <code>p-&gt;trapframe-&gt;a0..a5</code>。内核用 <code>argint</code> / <code>argaddr</code> / <code>argstr</code> 读取。" },
              { t: "note", kind: "danger", title: "为什么 argstr 要拷贝", html: "因为用户指针<b>不能直接信任</b>：它可能没映射（内核解引用会 panic），也可能在内核两次读取之间被另一个线程改掉（TOCTOU）。<br><br>所以 <code>argstr</code> 把字符串<b>拷进内核缓冲区</b>。你在 proc 里存路径时也必须存这个副本，<b>不能只存指针</b>。" }
            ] },
            { t: "acc", title: "② 返回值怎么回去", open: false, blocks: [
              { t: "p", html: "<code>syscall()</code> 把 <code>sys_xxx()</code> 的返回值写进 <code>p-&gt;trapframe-&gt;a0</code>。返回用户态后，用户的 <code>write()</code> 就「返回」了这个值。<br><br>这说明 <b>trapframe 就是进程的执行状态本身</b>，改它等于改进程看到的世界。" }
            ] },
            { t: "acc", title: "③ 地址 0 为什么没映射（lab 让你故意踩一次）", open: false, blocks: [
              { t: "p", html: "看 xv6 book 的<b>内核地址空间图</b>：<code>0x80000000</code> 以下大片未映射。所以内核里解引用 NULL 会立刻 <code>scause=0xd</code> panic，而不是悄悄读到垃圾。" },
              { t: "p", html: "这是<b>刻意的设计</b>：让内核 bug 尽早暴露。syscall lab 让你亲手触发一次，并学会用 <code>sepc</code> + <code>addr2line</code> 定位源码行。" }
            ] }
          ]
        },
        {
          id: "x-lab-pgtbl", no: "X06", short: "pgtbl 的 xv6 基础",
          title: "pgtbl：页表相关的全部 API",
          subtitle: "必备：Ch.3 + vm.c 里的四个核心函数 + 地址空间布局。",
          meta: [["对应", "Lab pgtbl"], ["必读", "xv6 book Ch.3 + memlayout.h"]],
          tags: ["xv6|amber", "pgtbl|teal"],
          blocks: [
            { t: "viz", id: "sv39", cap: "Sv39 的三级查找与 PTE 格式（pgtbl lab 全部工作都在这张图里）" },
            { t: "viz", id: "xv6addrspace", cap: "用户与内核地址空间布局：USYSCALL、VMA、TRAPFRAME、TRAMPOLINE 各自在哪" },
            { t: "h", text: "vm.c 里必须掌握的四个函数" },
            { t: "table", head: ["函数", "作用", "本 lab 哪里用"], rows: [
              ["<code>walk(pagetable, va, alloc)</code>", "顺着三级表走到 va 对应的 PTE 地址；<code>alloc=1</code> 时沿途创建缺失的中间表", "<b>pgaccess</b>（找 PTE 读 A 位）、超级页（找一级 PTE）"],
              ["<code>mappages(pagetable, va, size, pa, perm)</code>", "把一段 VA 映射到 PA，逐页建 PTE", "<b>USYSCALL</b>（建共享页）、超级页（改造版）"],
              ["<code>uvmunmap(pagetable, va, npages, do_free)</code>", "拆除映射并可选释放物理页", "USYSCALL 的释放、mmap lab"],
              ["<code>freewalk(pagetable)</code>", "<b>递归释放</b>整个页表树", "<b>vmprint</b> 的递归模板（它教你怎么区分叶子与中间层）"]
            ] },
            { t: "h", text: "三个常量与宏的位置" },
            { t: "ul", items: [
              "<code>kernel/riscv.h</code> 末尾：<code>PTE_V</code>、<code>PTE_R/W/X/U</code>、<code>PTE2PA</code>、<code>PA2PTE</code>、<code>PGROUNDDOWN</code> 等。<b><code>PTE_A</code> 要你自己加在这里</b>（bit 6）。",
              "<code>kernel/memlayout.h</code>：<code>TRAMPOLINE</code>、<code>TRAPFRAME</code>、<code>USYSCALL</code>、<code>KERNBASE</code>。",
              "<code>kernel/param.h</code>：<code>NCPU</code>、<code>MAXARG</code>、<code>FSSIZE</code>。"
            ] },
            { t: "h", text: "USYSCALL 的生命周期（对照 trapframe 学）" },
            { t: "p", html: "手册提示「参考 trapframe 的处理」。确实，USYSCALL 页要做的事和 trapframe 完全同构：" },
            { t: "table", head: ["阶段", "trapframe 的做法（在 proc.c 里）", "USYSCALL 照做"], rows: [
              ["创建", "<code>allocproc()</code> 里分配并映射", "在 <code>allocproc()</code> 里 kalloc + mappages"],
              ["使用", "<code>uservec</code> 保存寄存器进去", "内核写 pid，用户直接读"],
              ["释放", "<code>freeproc()</code> 里 uvmunmap + kfree", "在 <code>freeproc()</code> 里同样处理"]
            ] },
            { t: "note", kind: "danger", title: "最容易漏的一步", html: "<b>忘记在 <code>freeproc()</code> 里释放 USYSCALL 页。</b>每个进程泄漏一页，<code>usertests</code> 会创建大量进程，很快把内存耗尽。<br><br>凡是「在 allocproc 里分配的东西」，都必须在 freeproc 里对称释放——这是一条通用规则。" }
          ]
        },
        {
          id: "x-lab-traps", no: "X07", short: "traps 的 xv6 基础",
          title: "traps：trampoline 与 trapframe",
          subtitle: "必备：Ch.4 + trampoline.S + trap.c + riscv.h。",
          meta: [["对应", "Lab traps"], ["必读", "xv6 book Ch.4"]],
          tags: ["xv6|amber", "traps|purple"],
          blocks: [
            { t: "h", text: "必须看懂的两段汇编与一个结构" },
            { t: "acc", title: "① trampoline.S：uservec 与 userret", open: true, blocks: [
              { t: "p", html: "<b>uservec</b>：进入内核时执行。它做三件事——<b>(a)</b> 把所有 32 个用户寄存器存进 trapframe；<b>(b)</b> 加载内核栈、内核页表地址；<b>(c)</b> 跳到 <code>usertrap</code>。" },
              { t: "p", html: "<b>userret</b>：返回时执行，反向操作。" },
              { t: "note", kind: "purple", title: "为什么这段必须写在汇编里，而且必须放在固定地址", html: "因为它<b>正在切换栈和页表</b>——此时任何 C 代码都无法安全运行（栈变了、地址空间也变了）。<br><br>所以它必须：(a) 是手写汇编，(b) 被映射到<b>用户页表和内核页表的同一个虚拟地址</b>（TRAMPOLINE），这样切换 <code>satp</code> 之后取指仍然连续。<br><br>这是 xv6 里最精妙的一处设计，务必读懂。" }
            ] },
            { t: "acc", title: "② trap.c：usertrap / usertrapret / devintr", open: false, blocks: [
              { t: "p", html: "<code>usertrap()</code> 的分派逻辑：<code>scause == 8</code> → <code>syscall()</code>；<code>scause</code> 最高位为 1 → <code>devintr()</code>（中断）；否则是异常（缺页等）。" },
              { t: "p", html: "<code>usertrapret()</code> 做返回的准备工作，最后跳回 trampoline 的 <code>userret</code>。" }
            ] },
            { t: "acc", title: "③ struct trapframe：一份「可修改的存档」", open: false, blocks: [
              { t: "p", html: "它包含 32 个通用寄存器 + 内核页表地址 + 内核栈 + <code>epc</code> 等。关键是：<b>内核拥有完全的读写权</b>。" },
              { t: "ul", items: [
                "改 <code>epc</code> → 返回后从新地址继续执行（<b>这正是 sigalarm 的实现方式</b>）；",
                "改 <code>a0</code> → 改变系统调用的返回值；",
                "整份保存 + 整份恢复 → 可以实现「先跑一段别的，再原样回来」。"
              ] },
              { t: "p", html: "这套「可读写存档」是现代信号、用户级线程、检查点/恢复、甚至进程迁移的基础。" }
            ] },
            { t: "h", text: "sigalarm 的实现要点（对照 xv6 的时钟中断）" },
            { t: "steps", items: [
              { h: "时钟中断在哪", p: "<code>devintr()</code> 里 <code>which_dev == 2</code> 分支调用 <code>clockintr()</code>，后者递增 <code>ticks</code> 并唤醒等待的进程。" },
              { h: "计数与触发", p: "在 <code>usertrap</code> 的时钟分支里累加 <code>ticks_passed</code>，达到 interval 就把 <code>trapframe-&gt;epc</code> 改成 handler。" },
              { h: "保存现场", p: "<b>改 epc 之前必须整份拷贝 trapframe</b>，否则 handler 会把寄存器全改掉，回不去。" },
              { h: "sigreturn", p: "把保存的那份整份写回，于是从原处继续。" }
            ] },
            { t: "note", kind: "danger", title: "两个必踩的坑", html: "<b>① 重入</b>：handler 跑得慢时下一个 tick 又到 → 不加「正在处理」标志就会无限递归打爆栈。<br><br><b>② <code>interval=0</code></b>：手册要求它表示<b>关闭</b>，而不是「每 0 tick 触发」。" }
          ]
        },
        {
          id: "x-lab-cow", no: "X08", short: "cow 的 xv6 基础",
          title: "cow：缺页处理与物理页生命周期",
          subtitle: "必备：§4.6（缺页）+ vm.c 的 uvmcopy / copyout + kalloc.c。",
          meta: [["对应", "Lab cow"], ["必读", "xv6 book Ch.3 + §4.6"]],
          tags: ["xv6|amber", "cow|teal"],
          blocks: [
            { t: "viz", id: "cow", cap: "COW 三阶段与 xv6 里要改的三个位置：uvmcopy、vmfault、copyout + kalloc/kfree 的 refcnt" },
            { t: "h", text: "要改的四个地方" },
            { t: "table", head: ["位置", "原本做什么", "改成什么"], rows: [
              ["<code>vm.c: uvmcopy()</code>", "fork 时 kalloc 新页 + memmove 复制", "只把子 PTE 指向父的物理页；<b>父子双方都清 PTE_W</b> 并打 COW 标记"],
              ["<code>trap.c / vm.c: vmfault()</code>", "缺页时杀进程", "识别 COW 写缺页 → kalloc + memmove + 改回可写"],
              ["<code>vm.c: copyout()</code>", "内核直接按 VA 写入", "遇到 COW 页要走和 vmfault 一样的复制逻辑"],
              ["<code>kalloc.c: kalloc()/kfree()</code>", "无引用计数", "维护 refcnt；kfree 只在计数归零时真正释放"]
            ] },
            { t: "h", text: "xv6 里两个关键的既有约定" },
            { t: "acc", title: "① PTE 的 RSW 位可以随便用", open: true, blocks: [
              { t: "p", html: "RISC-V 的 PTE 有 2 位 <b>RSW（Reserved for Software）</b>，硬件完全忽略它们。xv6 用它们来标记「这是 COW 页」。<br><br>这是一种通用技巧：<b>硬件格式里预留给软件的位，是 OS 存放自己元数据的免费空间</b>。Linux 的 PTE 里也大量使用软件位（如 <code>_PAGE_SOFTW1</code> 用于 swap 类型、migration entry 等）。" }
            ] },
            { t: "acc", title: "② xv6 的 kalloc 用「空闲链表嵌在空闲页里」", open: false, blocks: [
              { t: "p", html: "<code>struct run</code> 直接<b>存放在空闲页本身</b>的前几个字节里（因为空闲页没人用）。这省掉了额外的簿记内存，非常巧妙。" },
              { t: "note", kind: "warn", title: "但这也带来一个陷阱", html: "因为你不能在被释放的页里存 refcnt（它随时可能被分配出去并被用户数据覆盖）。<br><br>所以 refcnt 必须存在<b>页之外</b>的一个数组里（按 <code>pa/PGSIZE</code> 索引）。这正是 cow lab 手册建议的做法。" }
            ] },
            { t: "h", text: "为什么 copyout 必须改" },
            { t: "p", html: "<code>copyout()</code> 是内核<b>代表用户进程</b>往用户地址写（例如 <code>read()</code> 填缓冲区）。它<b>不走用户执行路径，因此不会触发缺页</b>——遇到 COW 只读页会直接写进共享的物理页，父子进程互相看到对方的私有修改。" },
            { t: "p", html: "这是一个只在「read() 的缓冲区恰好是 COW 页」时才出现的隐蔽 bug，<code>cowtest</code> 的 <b>file</b> 测试专测它。" }
          ]
        },
        {
          id: "x-lab-lock", no: "X09", short: "lock 的 xv6 基础",
          title: "lock：xv6 的锁、调度与 sleep/wakeup",
          subtitle: "必备：Ch.6（锁）+ Ch.7（调度）+ §3.5（物理内存分配器）+ spinlock.c。",
          meta: [["对应", "Lab lock"], ["必读", "xv6 book Ch.6 / Ch.7 / §3.5"]],
          tags: ["xv6|amber", "lock|rose"],
          blocks: [
            { t: "h", text: "xv6 自旋锁的三个约定" },
            { t: "ol", items: [
              "<b>获取锁时关中断</b>：<code>acquire()</code> 调用 <code>push_off()</code>，<code>release()</code> 调用 <code>pop_off()</code>。这防止「持有锁时被中断、中断处理又来拿同一把锁」的死锁。",
              "<b>持有自旋锁时不能睡眠</b>：否则别的核会一直自旋直到中断被重新打开。",
              "<b>锁有名字</b>：<code>initlock(&lk, \"kmem\")</code>。这不是装饰——<b>lock lab 的测试脚本靠名字前缀统计竞争</b>，所以你的锁名必须以 <code>kmem</code> 开头。"
            ] },
            { t: "h", text: "要改的地方" },
            { t: "table", head: ["位置", "原本", "改成"], rows: [
              ["<code>kalloc.c: kmem</code>", "一个全局 <code>{lock, freelist}</code>", "<code>kmem[NCPU]</code> 数组，每 CPU 一份"],
              ["<code>kalloc()</code>", "拿 kmem.lock 取一页", "关中断 → <code>cpuid()</code> → 拿自己 CPU 的锁 → 取页；空则窃取"],
              ["<code>kfree()</code>", "拿 kmem.lock 放回", "放回当前 CPU 的链表（可以放回任意 CPU，这是允许的）"],
              ["<code>kinit()/freerange()</code>", "全部给一个链表", "全部给<b>正在执行它的那个 CPU</b>"],
              ["<code>spinlock.c/h</code>", "只有自旋锁", "加 <code>rwspinlock</code> 的五个 API"]
            ] },
            { t: "note", kind: "danger", title: "cpuid() 为什么必须关中断", html: "读到 CPU 号之后、用它索引数组之前，如果发生时钟中断并把进程迁移到另一个核，那么「读到的 CPU 号」与「实际所在核」不一致 → 操作了错误的链表。<br><br>所以必须用 <code>push_off()</code> / <code>pop_off()</code> 包住。这是 xv6 里反复出现的模式。" },
            { t: "h", text: "读写锁的两个硬性要求" },
            { t: "ul", items: [
              "<b>读侧必须 wait-free</b>：绝不能等待另一个正在持有/获取/释放读锁的 CPU。<b>所以不能用自旋锁实现</b>（自旋锁的本质就是等）。必须直接用原子操作。",
              "<b>写者不能被饿死</b>：有写者等待时，新的读者必须让路。"
            ] },
            { t: "note", kind: "purple", title: "做完之后去看 RCU 论文 Figure 8", html: "你会看到 4 核上并发读同一链表时，<b>这样的读写锁可能比朴素自旋锁还慢</b>——因为读侧仍要原子改一个共享计数器，那条 cacheline 在核间来回搬运。<br><br>这也就是 RCU 存在的理由。" }
          ]
        },
        {
          id: "x-lab-net", no: "X10", short: "net 的 xv6 基础",
          title: "net：xv6 的中断与设备驱动框架",
          subtitle: "必备：Ch.5（中断与设备驱动）+ plic.c + uart.c + virtio_disk.c + pci.c。",
          meta: [["对应", "Lab net"], ["必读", "xv6 book Ch.5 + Tulip 手册 §1.1/3.2/4.2/4.3"]],
          tags: ["xv6|amber", "net|amber"],
          blocks: [
            { t: "h", text: "xv6 已有的驱动，以及它们给你的模板" },
            { t: "table", head: ["驱动", "特点", "能借鉴什么"], rows: [
              ["<code>uart.c</code>", "最简单的中断驱动设备：每字节一次中断，读写 CSR 一样的 MMIO 寄存器", "MMIO 访问、中断注册、<code>uartintr</code> 的结构"],
              ["<code>virtio_disk.c</code>", "<b>描述符环 + DMA</b>，与 Tulip 结构高度相似", "<b>最重要的参考</b>：环的初始化、所有权交接、中断处理、与进程同步"],
              ["<code>plic.c</code>", "PLIC 中断控制器的初始化与响应", "怎么注册一个新中断源、怎么 ack"],
              ["<code>pci.c</code>", "扫描 PCI 总线找设备（lab 已给，用来找 Tulip）", "拿到 CSR 的 MMIO 地址"]
            ] },
            { t: "note", kind: "ok", title: "强烈建议先读 virtio_disk.c", html: "它和 Tulip 是<b>同一类驱动</b>：都是「描述符环 + DMA + 完成中断」。<br><br>读懂它的 <code>virtio_disk_init</code> / <code>virtio_disk_rw</code> / <code>virtio_disk_intr</code> 三个函数，你就有了写 Tulip 的完整骨架。这是本 lab 最大的捷径。" },
            { t: "h", text: "xv6 中断路径的三个层次" },
            { t: "steps", items: [
              { h: "① 硬件", p: "设备拉中断线 → PLIC 根据优先级路由到某个 hart。" },
              { h: "② 内核陷入", p: "<code>usertrap</code>/<code>kerneltrap</code> 判断是外部中断 → <code>devintr()</code> → <code>plic_claim()</code> 拿到中断号 → 分发到对应驱动的 handler。" },
              { h: "③ 驱动", p: "读设备状态寄存器 → 处理完成的工作 → <b>清中断</b> → <code>plic_complete()</code> 表示处理完。" }
            ] },
            { t: "note", kind: "warn", title: "xv6 特有的一个约束", html: "<code>devintr()</code> 里对中断号的处理是<b>硬编码的 switch</b>（UART=10、VIRTIO=1…）。加新的设备中断要在 <code>kernel/trap.c</code> 和 <code>kernel/plic.c</code> 里都注册。<br><br>另外 xv6 用 <b>MMIO</b> 访问一切，没有 x86 的 <code>in/out</code>。" },
            { t: "h", text: "DMA 与物理地址" },
            { t: "p", html: "设备做 DMA 用的是<b>物理地址</b>。写进描述符的缓冲区地址必须是 PA。xv6 没有 IOMMU，所以设备可以 DMA 到任意物理内存——这在真实系统里是个安全问题。" }
          ]
        },
        {
          id: "x-lab-fs", no: "X11", short: "fs 的 xv6 基础",
          title: "fs：inode、buffer cache 与日志",
          subtitle: "必备：Ch.8（文件系统）+ fs.h/fs.c + bio.c + log.c。",
          meta: [["对应", "Lab fs"], ["必读", "xv6 book Ch.8"]],
          tags: ["xv6|amber", "fs|green"],
          blocks: [
            { t: "viz", id: "inode", cap: "inode 的 addrs[] 结构：fs lab 要在这张图上再加一层二级间接" },
            { t: "viz", id: "fslayout", cap: "磁盘布局：boot | superblock | log | inodes | bitmap | data" },
            { t: "h", text: "三层结构要分清" },
            { t: "table", head: ["层", "文件", "职责", "关键函数"], rows: [
              ["<b>磁盘布局层</b>", "<code>fs.h</code>", "定义 on-disk 结构：<code>struct superblock</code>、<code>struct dinode</code>、<code>struct dirent</code>", "—"],
              ["<b>inode 层</b>", "<code>fs.c</code>", "inode 缓存、路径解析、块映射", "<code>namei</code>、<code>bmap</code>、<code>ialloc</code>、<code>itrunc</code>、<code>readi</code>、<code>writei</code>"],
              ["<b>块缓存 + 日志层</b>", "<code>bio.c</code> / <code>log.c</code>", "磁盘块的缓存与原子性", "<code>bread</code>/<code>bwrite</code>/<code>brelse</code>、<code>begin_op</code>/<code>log_write</code>/<code>commit</code>"]
            ] },
            { t: "h", text: "两个必须理解的机制" },
            { t: "acc", title: "① buffer cache 的锁就是「块的锁」", open: true, blocks: [
              { t: "p", html: "<code>bread()</code> 返回的是一个<b>已被锁住的</b>缓冲块。这个锁同时起到两个作用：(a) 保证块内容已从磁盘读入；(b) 保证同一时刻只有一个执行流在改这个块。" },
              { t: "p", html: "所以 <code>brelse()</code> 就是「解锁 + 释放引用」。漏掉它 = 永久占用一个 bcache 槽位。" }
            ] },
            { t: "acc", title: "② 日志是「写两遍」换「原子性」", open: false, blocks: [
              { t: "p", html: "所有对文件系统的修改都必须包在 <code>begin_op()</code> 与 <code>end_op()</code> 之间，且每次改块要用 <code>log_write()</code> 而不是 <code>bwrite()</code>。" },
              { t: "p", html: "这也是为什么 fs lab 里改 <code>bmap</code> 时，分配新块的操作必须仍然走 <code>balloc</code>（它内部已经处理了日志）——<b>不要绕过日志直接写盘</b>。" }
            ] },
            { t: "h", text: "bmap 的逻辑块号 → 磁盘块号" },
            { t: "p", html: "<code>bmap(ip, bn)</code> 是 fs lab 的核心。它处理两种块号：入参 <code>bn</code> 是<b>文件内的逻辑块号</b>；<code>ip-&gt;addrs[]</code> 里和 <code>bread()</code> 用的是<b>磁盘块号</b>。读时翻译，写时顺带分配。" },
            { t: "note", kind: "warn", title: "手册唯一的显式警告", html: "<b>Don't forget to brelse() each block that you bread().</b><br><br>漏掉的症状是「跑一会儿之后所有磁盘操作卡死」——因为 bcache 槽位耗尽。这类 bug 要跑很久才暴露，非常难查。" }
          ]
        },
        {
          id: "x-lab-mmap", no: "X12", short: "mmap 的 xv6 基础",
          title: "mmap：把 vm.c 与 fs.c 缝在一起",
          subtitle: "必备：Ch.3 + Ch.8 + 缺页处理 + struct file 的引用计数。",
          meta: [["对应", "Lab mmap"], ["必读", "xv6 book Ch.3 + Ch.8"]],
          tags: ["xv6|amber", "mmap|teal"],
          blocks: [
            { t: "viz", id: "vma", cap: "VMA 表 + 懒加载缺页：mmap lab 要新增的就是这一层" },
            { t: "h", text: "xv6 已有的、你要复用的四块" },
            { t: "table", head: ["机制", "在哪", "怎么用"], rows: [
              ["缺页识别", "<code>trap.c: usertrap()</code>", "判断 <code>scause</code> 为 13/15，从 <code>stval</code> 取地址"],
              ["建映射", "<code>vm.c: mappages()</code>", "在缺页处理里建 PTE（权限来自 VMA 的 prot）"],
              ["读文件", "<code>fs.c: readi()</code>", "<b>注意：调用者必须持有 inode 锁</b>"],
              ["文件引用计数", "<code>file.c: filedup() / fileclose()</code>", "mmap 时 dup，munmap 时 close"]
            ] },
            { t: "h", text: "要在 xv6 里新增的" },
            { t: "ol", items: [
              "<b><code>struct vma</code> + proc 里的数组（16 个）</b>：记录 addr / len / prot / flags / <code>struct file*</code> / offset。",
              "<b>选一个空闲地址区间</b>：xv6 没有内核 malloc，所以 VMA 用固定数组；地址建议从高往低找（避开向上增长的堆）。",
              "<b>fork 时复制 VMA 数组</b>（并 <code>filedup</code>），否则子进程访问映射区会被杀。",
              "<b>exit 时遍历 VMA 做 munmap</b>，MAP_SHARED 且脏的要回写。"
            ] },
            { t: "note", kind: "danger", title: "readi 的锁约定", html: "手册明确提示：<b>“you will have to lock/unlock the inode passed to readi”</b>。<br><br><code>readi</code> 假设调用者持有 inode 锁。忘了加锁会在并发场景下破坏文件系统（而且 xv6 里会触发断言）。<br><br>写法：<code>ilock(vma-&gt;f-&gt;ip); readi(...); iunlock(...);</code>" },
            { t: "h", text: "为什么这个 lab 是「集大成」" },
            { t: "ul", items: [
              "页表操作（<code>walk</code>/<code>mappages</code>）→ 来自 pgtbl；",
              "缺页处理 → 来自 cow；",
              "文件读取与 inode 加锁 → 来自 fs；",
              "进程创建/退出的资源生命周期 → 来自 syscall / cow；",
              "脏位判断（<code>PTE_D</code>）→ 来自 pgtbl 的 A 位概念。"
            ] }
          ]
        }
      ]
    },

    /* ============ 组 3 ============ */
    {
      name: "三、RISC-V 与 80x86：同一个 OS 概念，两套硬件机制",
      desc: "逐项对比特权级、页表、陷阱、I/O、原子操作，并分析各自的优缺点与设计独特之处。",
      items: [
        {
          id: "x-isa-overview", no: "X13", short: "ISA 对照总表",
          title: "一张表看完两套机制的映射关系",
          subtitle: "如果你以前看过 x86 版的 OS 教材（JOS / xv6-x86），这张表能把你的知识平移过来。",
          meta: [["难度", "★★☆"]],
          tags: ["架构对比|purple", "参考|green"],
          blocks: [
            { t: "viz", id: "riscvvsx86", cap: "12 个核心概念的逐项对照：左列 RISC-V（xv6-riscv），右列 80x86（JOS / xv6-x86）" },
            { t: "note", kind: "purple", title: "最重要的一个观念", html: "对比完之后你会发现：<b>「进程」「虚拟内存」「系统调用」「锁」这些是 OS 的普适思想，两套 ISA 都要实现；而「用 CR3 还是 satp」「用 IDT 还是 stvec」只是实现细节。</b><br><br>学会区分这两者，你就能把在一个架构上学到的东西迁移到任何架构上——这是本部分最大的价值。" }
          ]
        },
        {
          id: "x-isa-priv", no: "X14", short: "特权级与系统调用",
          title: "M/S/U 三级 vs Ring 0–3",
          subtitle: "RISC-V 明确设计成三层且只用两层；x86 的四环是历史产物，实际只用两个。",
          meta: [["难度", "★★☆"]],
          tags: ["架构对比|purple"],
          blocks: [
            { t: "vs", a: { title: "RISC-V", html: "<b>三档</b>：M（机器，固件/最底层）、S（监管，内核）、U（用户）。另有可选的 H（虚拟化）扩展。<br><br>xv6 的启动路径：<b>M mode（start.c 做最早期初始化）→ S mode（内核）→ U mode（用户进程）</b>。<br><br>切换指令：<code>ecall</code>（升级）<code>sret</code> / <code>mret</code>（降级）。" }, b: { title: "80x86", html: "<b>四环</b>：Ring 0（内核）～ Ring 3（用户）。<br><br>现实中<b>几乎只用 0 和 3</b>：OS/2 曾用 Ring 2 放驱动，某些系统用 Ring 1，但都失败了。<br><br>切换指令：<code>int 0x80</code> / <code>syscall</code> / <code>sysenter</code>；返回 <code>iret</code> / <code>sysexit</code>。" } },
            { t: "h", text: "设计差异的根源" },
            { t: "p", html: "x86 的权限模型与<b>分段</b>深度绑定：代码段描述符里有 CPL/DPL/RPL，门描述符（call gate / interrupt gate / trap gate）里再做权限检查。这套机制是 1982 年 80286 保护模式留下的，为了兼容一直保留到今天。" },
            { t: "p", html: "RISC-V 是 2010 年后从零设计的，<b>没有分段</b>，权限就是一个 CSR 字段（<code>sstatus.SPP</code>）里的 1 位。整个特权架构手册只有一百多页，而 Intel SDM 是数千页。" },
            { t: "table", head: ["维度", "RISC-V", "80x86"], rows: [
              ["特权级数量", "3（M/S/U）+ 可选 H", "4 环（实际用 2）+ VMX root/non-root"],
              ["与分段的关系", "<b>完全无关</b>（没有分段）", "<b>深度耦合</b>（GDT/LDT、CPL/DPL/RPL）"],
              ["系统调用指令", "<code>ecall</code>（统一一条）", "<code>int 0x80</code> / <code>sysenter</code> / <code>syscall</code>（三种并存，历史演进）"],
              ["参数传递", "全走寄存器 <code>a0–a7</code>", "32 位走栈；64 位走寄存器"],
              ["规范规模", "特权手册约 100+ 页", "Intel SDM 数千页"]
            ] },
            { t: "note", kind: "ok", title: "各自的优点", html: "<b>RISC-V</b>：概念清晰、实现简单、教学友好（你可以真的读懂全部特权机制）。<br><br><b>x86</b>：生态成熟、向后兼容做到极致（30 年前的程序今天还能跑）、虚拟化扩展（VT-x）与各类工具完善。<br><br><b>x86 的代价</b>：为了这份兼容，现代 CPU 上电时仍然要先进入 1978 年的<b>实模式</b>，还要处理 A20 门、GDT、TSS 这些早已没必要的东西。" }
          ]
        },
        {
          id: "x-isa-vm", no: "X15", short: "页表与 TLB",
          title: "Sv39 vs x86 分页",
          subtitle: "两者都由硬件遍历页表，但 RISC-V 的设计更干净，x86 的历史包袱更重。",
          meta: [["难度", "★★★"]],
          tags: ["架构对比|purple", "虚拟内存|teal"],
          blocks: [
            { t: "viz", id: "sv39", cap: "RISC-V Sv39：9-9-9-12 三级页表，satp 存根页表 PPN + ASID" },
            { t: "table", head: ["维度", "RISC-V（Sv39 / Sv48 / Sv57）", "80x86"], rows: [
              ["页表级数", "Sv39 = 3 级；Sv48 = 4 级；Sv57 = 5 级（<b>可选，由实现决定</b>）", "32 位 = 2 级（10-10-12）；PAE = 3 级（2-9-9-12）；x86-64 = 4/5 级"],
              ["页表基址", "<code>satp</code> 寄存器（MODE + ASID + 根页表 PPN）", "<code>CR3</code>（指向页目录物理地址）"],
              ["地址空间标识", "<b>ASID 在 satp 里</b>，切换时不刷全局项", "<b>PCID</b>（需 CR4.PCIDE 开启），机制更绕"],
              ["A/D 位", "硬件 walker 自动置位（可配置为陷入由软件维护）", "硬件置位（一直如此）"],
              ["缓存属性", "<b>不在 PTE 里</b>，放在 PMA（物理内存属性）中", "<b>在 PTE 里</b>：PCD / PWT / PAT 位"],
              ["大页", "megapage（2 MB）/ gigapage（1 GB），由哪一级 PTE 决定", "PSE（4 MB）/ 1 GB 大页，靠 PTE 的 PS 位"],
              ["TLB 刷新", "<code>sfence.vma</code>（可按 ASID / 地址局部刷新）", "重载 CR3（全局刷）或 <code>invlpg</code>（单项）/ <code>invpcid</code>"],
              ["遍历方式", "<b>硬件 walker</b>（也可配置为由软件处理）", "<b>硬件 walker</b>"]
            ] },
            { t: "h", text: "设计独特之处" },
            { t: "vs", a: { title: "RISC-V：把「策略」从 PTE 里拿走", html: "RISC-V 的 PTE 非常干净：PPN + RSW（给软件）+ 8 个标志位。<b>缓存属性、内存类型这些「策略」被移到 PMA</b>，由平台定义，不占用 PTE 位。<br><br>好处：页表格式简单，未来扩展容易；<br>代价：同一物理内存对不同 hart 的属性必须一致（灵活性略低）。" }, b: { title: "x86：把历史都塞进 PTE", html: "x86 的 PTE 里除了物理地址和权限，还有 PCD/PWT/PAT（缓存控制）、PAT 配合 MTRR、以及为了兼容保留的位。<br><br>好处：控制粒度细，可以按页设置缓存策略；<br>代价：<b>页表格式的每一次扩展都要在有限的位里挤</b>（这就是为什么 PAE 之后要再扩到 4 级/5 级）。" } },
            { t: "note", kind: "warn", title: "对写 OS 的人最直接的影响", html: "<b>ASID 是 RISC-V 的显著优势。</b>进程切换时可以<b>不刷新 TLB</b>（只要 ASID 不冲突），而 x86 传统做法是重载 CR3 导致 TLB 全刷。<br><br>这也是为什么现代 OS 普遍使用 <b>PCID</b> —— 但它开启与否、与 Meltdown 修复的 KPTI 如何交互，比 RISC-V 的 ASID 复杂得多。" }
          ]
        },
        {
          id: "x-isa-trap", no: "X16", short: "陷阱与中断",
          title: "「硬件只存 PC」vs「硬件帮你压栈」",
          subtitle: "这是两套架构在陷阱处理上最本质的哲学差别，也直接决定了 xv6 必须手写 trampoline。",
          meta: [["难度", "★★★"]],
          tags: ["架构对比|purple", "陷阱|purple"],
          blocks: [
            { t: "vs", a: { title: "RISC-V：最小硬件，其余交给软件", html: "陷入时硬件只做：<br>· 把 PC 存进 <code>sepc</code><br>· 把原因存进 <code>scause</code><br>· 附加信息存进 <code>stval</code><br>· 改特权级、跳到 <code>stvec</code><br><br><b>32 个通用寄存器一个都不保存</b> —— 全靠软件（trampoline.S 的 <code>uservec</code>）手工存进 trapframe。" }, b: { title: "x86：硬件帮你做全套", html: "中断/陷阱时硬件<b>自动压栈</b>：SS、RSP、EFLAGS、CS、RIP（x86-64 还会从 TSS 里加载内核栈）。<br><br>通过 <b>IDT + IDTR</b> 按向量号找到入口；门描述符里指定目标与权限。<br><br>返回用 <code>iret</code>，硬件自动弹出这些值。" } },
            { t: "h", text: "这个差别怎么影响 xv6" },
            { t: "p", html: "因为 RISC-V 不保存寄存器，xv6 必须有一段手写汇编（<code>trampoline.S</code>）来完成「保存 32 个寄存器 + 换栈 + 换页表」这套动作。而且因为它在<b>切换页表的同时执行</b>，它必须被映射到用户页表和内核页表的<b>同一个虚拟地址</b>（TRAMPOLINE）——这是 xv6 里最精妙也最容易看漏的一处设计。" },
            { t: "p", html: "x86 版本（xv6-x86 / JOS）则不需要这么一段：硬件已经帮你压好栈、换好栈，你直接写 C 的 <code>trap()</code> 就行。" },
            { t: "table", head: ["维度", "RISC-V", "80x86"], rows: [
              ["入口查找", "<code>stvec</code> 一个寄存器（支持 direct / vectored 模式）", "<b>IDT</b>：256 个门描述符，由 IDTR 指向"],
              ["保存的 PC", "<code>sepc</code>", "压在栈上（CS:RIP）"],
              ["原因", "<code>scause</code>（最高位区分中断/异常）", "向量号（IDT 下标）+ 错误码"],
              ["附加信息", "<code>stval</code>（如缺页地址）", "<b>CR2</b>（缺页线性地址）"],
              ["内核栈", "<b>软件切换</b>（xv6 在 trapframe 里存内核栈地址）", "<b>硬件从 TSS 加载</b>"],
              ["中断控制器", "<b>PLIC</b>（外部）+ CLINT（时钟/软中断）", "8259A PIC → <b>LAPIC + IOAPIC</b> + MSI/MSI-X"],
              ["中断开关", "<code>sstatus.SIE</code> + <code>sie</code> 寄存器", "EFLAGS.IF + 各设备的屏蔽位"]
            ] },
            { t: "note", kind: "ok", title: "各自的优劣", html: "<b>RISC-V 的做法</b>：硬件极简、OS 完全自由（trapframe 布局自己定、可以选择保存哪些寄存器、可以做快速的「轻量陷入」）。代价是<b>每个 OS 都要写这段汇编</b>，且容易写错。<br><br><b>x86 的做法</b>：OS 几乎不用写汇编，一个 C 函数就能处理所有陷阱。代价是<b>硬件锁死了保存格式</b>（想做优化没门），而且自动压栈的路径在侧信道时代成了安全分析的麻烦（Meltdown 的很多细节就与这套自动保存有关）。" }
          ]
        },
        {
          id: "x-isa-io", no: "X17", short: "I/O 与原子操作",
          title: "统一编址 vs 独立端口空间；LR/SC vs lock 前缀",
          subtitle: "这两项决定了驱动代码长什么样，以及并发代码能有多「随意」。",
          meta: [["难度", "★★☆"]],
          tags: ["架构对比|purple", "并发|rose"],
          blocks: [
            { t: "h", text: "I/O 编址" },
            { t: "vs", a: { title: "RISC-V：只有 MMIO", html: "设备寄存器被映射进物理地址空间，<b>像读写内存一样访问</b>。没有 <code>in/out</code> 指令。<br><br>好处：指令集小、设备访问可以被<b>页表</b>保护（可以把设备区映射给某个进程、也可以不映射）。<br><br>代价：必须把设备区标记为<b>不可缓存</b>（靠 PMA），且要小心内存序。" }, b: { title: "x86：MMIO + 独立端口空间", html: "除了 MMIO，还有一套<b>独立的 I/O 地址空间</b>，用 <code>in</code> / <code>out</code> 指令访问（还有 <code>ins/outs</code> 串操作）。<br><br>好处：不占用内存地址空间；访问简单。<br><br>代价：<b>它绕过 MMU，无法用页表保护</b>，只能靠 TSS 里的 I/O 权限位图（IOPB）控制；而且这套机制在现代系统里已基本被淘汰，是为兼容保留的。" } },
            { t: "h", text: "原子操作与内存序（最重要的一项）" },
            { t: "vs", a: { title: "RISC-V：LR/SC + amo*（弱内存序 RVWMO）", html: "原子读改写靠 <b>LR（load-reserved）/ SC（store-conditional）</b> 对：<code>lr.d</code> 标记一个保留集，<code>sc.d</code> 只有在其间没人写过才成功（否则失败，软件重试）。<br><br>另有 <code>amoswap</code> / <code>amoadd</code> / <code>amoand</code> / <code>amoor</code> / <code>amomax</code> 等。<br><br>内存模型是 <b>RVWMO（弱序）</b>，需要显式 <code>fence</code> 或 <code>.aq/.rl</code>（获取/释放）后缀。" }, b: { title: "x86：lock 前缀（强内存序 TSO）", html: "原子操作靠 <code>lock</code> 前缀（<code>lock add</code>、<code>lock cmpxchg</code>、<code>lock bts</code>），<code>xchg</code> 隐含 lock。<br><br>内存模型是 <b>TSO（总存储序）</b>：<b>load 不会被重排到 load 之前，store 不会被重排到 store 之前</b>；只有 store→load 可能重排（因为 store buffer）。" } },
            { t: "note", kind: "danger", title: "这条对写并发代码的影响极大", html: "在 x86 上，很多<b>缺少内存屏障但仍然能正确运行</b>的并发代码，是因为 TSO 帮你兜住了。<b>把同样的代码搬到 RISC-V 或 ARM 上，它可能就开始出错。</b><br><br>所以在 xv6（RISC-V）里写并发代码时：<br>· 不要依赖「我写完别人就能看到」的直觉；<br>· 使用编译器提供的 <code>__sync_*</code> / <code>__atomic_*</code> builtin（它们会按目标架构生成正确的指令与屏障）；<br>· lock lab 的 rwspinlock 明确要求「直接用原子操作」，指的就是这些 builtin。" },
            { t: "h", text: "调用约定（读汇编时会用到）" },
            { t: "table", head: ["项目", "RISC-V", "x86-64 (System V)"], rows: [
              ["通用寄存器", "32 个（x0 恒为 0）", "16 个"],
              ["参数", "a0–a7", "rdi, rsi, rdx, rcx, r8, r9"],
              ["返回值", "a0, a1", "rax, rdx"],
              ["返回地址", "ra 寄存器", "压在栈上"],
              ["栈指针", "sp", "rsp"],
              ["帧指针", "s0（也叫 fp）", "rbp"],
              ["callee-saved", "s0–s11", "rbx, rbp, r12–r15"]
            ] },
            { t: "note", kind: "purple", title: "一个小但重要的差别", html: "RISC-V 的返回地址在<b>寄存器 <code>ra</code></b> 里，x86 在<b>栈上</b>。<br><br>这直接影响了 <b>swtch</b> 的实现：xv6 的 <code>struct context</code> 里要显式保存 <code>ra</code>，而 x86 版的上下文切换保存的是栈指针（返回地址随栈一起切换）。" }
          ]
        },
        {
          id: "x-isa-verdict", no: "X18", short: "总结：各自的优势与代价",
          title: "为什么教学选 RISC-V，为什么工业界仍是 x86",
          subtitle: "这不是「谁更好」的问题，而是「各自的包袱与目标不同」。",
          meta: [["难度", "★☆☆"]],
          tags: ["架构对比|purple", "总结|green"],
          blocks: [
            { t: "table", head: ["维度", "RISC-V", "80x86"], rows: [
              ["<b>规范规模</b>", "特权架构手册 100+ 页，<b>可以真的读完</b>", "Intel SDM 数千页，没人能通读"],
              ["<b>历史包袱</b>", "<b>几乎没有</b>：无实模式、无分段、无 A20、无 8259", "<b>极重</b>：上电进入 1978 年的实模式，为兼容保留大量废弃机制"],
              ["<b>硬件替 OS 做的事</b>", "少（只存 PC，其余软件来）", "多（自动压栈、TSS 换栈、门描述符权限检查）"],
              ["<b>写 OS 的难度</b>", "要手写 trampoline，但<b>完全可控、可读懂</b>", "基本不用写汇编，但<b>被硬件格式锁死</b>"],
              ["<b>内存序</b>", "弱序（RVWMO），<b>并发 bug 更容易暴露</b>", "强序（TSO），很多错误代码侥幸能跑"],
              ["<b>生态与工具</b>", "较新，QEMU/工具链成熟但周边少", "极成熟：调试器、性能剖析、文档、虚拟化全都有"],
              ["<b>ISA 授权</b>", "开源免费，可自由实现与扩展", "闭源（x86 授权历史上只有少数几家）"],
              ["<b>高级特性</b>", "虚拟化 H 扩展、IOMMU 仍在演进", "VT-x、IOMMU、SGX、各类扩展成熟"]
            ] },
            { t: "h", text: "各自的「设计独特之处」一句话总结" },
            { t: "vs", a: { title: "RISC-V 的独特之处", html: "<b>「把策略从硬件里拿走」。</b><br><br>· 陷阱只存最小状态，格式由 OS 定；<br>· 缓存属性不在 PTE 里，放到 PMA；<br>· 页表级数可选（Sv39/48/57），按需实现；<br>· 原子操作用 LR/SC 而不是固定指令，给实现更大自由。<br><br>结果：<b>硬件简单、OS 灵活、适合教学与研究</b>，代价是 OS 作者要写更多代码、要更懂内存序。" }, b: { title: "x86 的独特之处", html: "<b>「向后兼容压倒一切」。</b><br><br>· 1978 年的实模式至今仍是上电起点；<br>· 四环、分段、TSS、任务门都是为当年的设计目标服务的，今天多数已废弃却必须保留；<br>· 三种系统调用指令（int 0x80 / sysenter / syscall）并存，正是三代性能优化叠加的痕迹。<br><br>结果：<b>生态无敌、老软件能跑</b>，代价是规范庞大、新 OS 作者要花大量精力绕过历史包袱。" } },
            { t: "note", kind: "purple", title: "对本课程学习者的实际建议", html: "1. <b>用 RISC-V 学概念</b>：因为机制干净，你能把注意力放在「OS 在做什么」而不是「这个寄存器第几位是什么」。<br><br>2. <b>用 x86 对照检查理解</b>：如果一个概念你只能用它在一边的实现来描述（比如「系统调用就是 int 0x80」），那说明你还没理解到概念层。<br><br>3. <b>特别留意内存序</b>：这是从 x86 思维转到 RISC-V 时最容易翻车的地方。在 xv6 里写并发代码，一律用 <code>__sync_*</code> builtin，不要自己「优化」掉屏障。" },
            { t: "quiz", items: [
              "为什么 xv6 需要 trampoline.S，而 x86 版的 JOS 不需要这么一段？",
              "把一段在 x86 上「一直运行正常」的无屏障并发代码移植到 RISC-V，可能会出什么问题？",
              "RISC-V 的 ASID 与 x86 的 PCID 解决的是同一个问题吗？它们的机制复杂度差别在哪？",
              "为什么 x86 的端口 I/O（in/out）无法用页表保护？这带来什么安全影响？"
            ] }
          ]
        }
      ]
    }
  ]
};
