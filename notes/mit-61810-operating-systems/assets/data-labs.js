/* ============================================================
   data-labs.js — 9 个 Lab 的原理拆解与文档补充
   ============================================================ */
var LABS_DATA = {
  groups: [

    /* ============ 组 1 ============ */
    {
      name: "一、先当使用者：建立「操作系统 = 一组 API」的直觉",
      desc: "这两个 lab 不碰内核内部，只让你从外面看。但它们决定了后面所有内容的心智模型。",
      items: [
        {
          id: "lab-util", no: "L1", short: "util：Unix 工具",
          title: "Lab: Xv6 and Unix utilities",
          subtitle: "设计目的：在写内核之前，先当一次「应用程序作者」，体会操作系统对外暴露的那组 API 到底长什么样、能做什么、不能做什么。",
          meta: [["分支", "util"], ["必读", "xv6 book Ch.1"], ["任务", "sleep / sixfive / memdump / find / find -exec"], ["难度", "★☆☆"]],
          tags: ["用户态|blue", "系统调用|blue", "入门|green"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理：三个必须先想通的抽象" },
            { t: "p", html: "在做这个 lab 之前（以及做的时候反复问自己），下面三个概念不清楚就会一路卡到底：" },
            { t: "acc", title: "① 进程 = 一个地址空间 + 一条执行流 + 一组文件描述符", open: true, blocks: [
              { t: "p", html: "操作系统给应用的核心抽象是「进程」。它让你<b>以为自己独占一台机器</b>：独占内存（虚拟地址空间）、独占 CPU（执行流）、独占 I/O（fd 表）。这三个「独占」全是假的，由内核在背后 multiplex。" },
              { t: "p", html: "xv6 的 <code>struct proc</code> 就是这个抽象的物理实现：<code>pagetable</code>（地址空间）、<code>trapframe</code>+<code>context</code>（执行流的寄存器状态）、<code>ofile[]</code>（fd 表）。" },
              { t: "note", kind: "", title: "为什么这个视角重要", html: "后面每个 lab 都是在改这三样东西中的一样：<b>pgtbl</b> 改地址空间、<b>traps</b> 改执行流的进出、<b>fs</b> 改 fd 背后的东西。先建立这个模型，你才知道自己在改哪一块。" }
            ] },
            { t: "acc", title: "② fork + exec 为什么要分成两步？", open: false, blocks: [
              { t: "p", html: "这是 Unix 最有争议也最优雅的设计之一。<code>fork()</code> 复制出一个和父进程几乎一样的子进程；<code>exec()</code> <b>用新程序替换</b>当前进程的地址空间（注意：exec <b>不创建新进程</b>，进程还是那一个）。" },
              { t: "p", html: "分成两步的价值在于<b>中间那个窗口</b>：子进程在 fork 之后、exec 之前，可以任意修改自己的状态——重定向 fd、改 uid、改环境变量、设置资源限制——然后再 exec。shell 的 <code>cat &lt; in.txt &gt; out.txt</code> 就是靠这个窗口实现的。" },
              { t: "vs", a: { title: "Windows 的做法", html: "<code>CreateProcess()</code> 一步到位，参数里塞进所有设置。<br><br>优点：快（不用复制地址空间，因为有 COW 之前 fork 是真复制）。<br>缺点：<b>能设置的东西必须预先枚举</b>。" }, b: { title: "Unix 的做法", html: "<code>fork()</code> 然后 <code>exec()</code>。<br><br>优点：<b>中间窗口可编程</b>——任何你能想到的设置都能做，不需要 OS 支持新参数。<br>缺点：语义复杂，fork 的复制开销靠 COW 才解决（见 cow lab）。" } },
              { t: "note", kind: "warn", title: "这正是「抽象设计影响能力」的例子", html: "讲义在讲微内核时反复强调这一点：<b>大抽象会强制一堆设计决定</b>。fork+exec 是个「小抽象组合成大能力」的正面例子。" }
            ] },
            { t: "acc", title: "③ 文件描述符是一个「索引」，指向内核里的对象", open: false, blocks: [
              { t: "p", html: "<code>fd</code> 只是一个小整数。<b>每个进程有一张自己的 fd 表</b>，fd 是这张表的下标，表项指向内核里一个 <code>struct file</code>。这个间接层带来几个关键性质：" },
              { t: "ul", items: [
                "<b>fd 是进程私有的</b>：你的 fd 3 和我的 fd 3 可以指向完全不同的东西；",
                "<b>fd 可以被继承</b>：fork 时子进程拿到父进程 fd 表的副本（指向<b>同一个</b> struct file）；这就是 shell 能把 stdout 传给子进程的原因；",
                "<b>fd 可以跨 exec 存活</b>（除非设了 close-on-exec）；",
                "<b>fd 指向的不只是文件</b>：管道、设备、socket 都是 fd —— 这就是 Unix 的「一切皆文件」。"
              ] },
              { t: "p", html: "fd 0/1/2 = stdin/stdout/stderr 只是<b>约定</b>（由 shell 和 init 保证），不是内核强制的。理解这一点，你才能看懂 shell 里的重定向。" }
            ] },
            { t: "h", text: "② 设计目的：这个 lab 想让你发现什么" },
            { t: "ul", items: [
              "<b>发现「程序能做的事是被枚举出来的」</b>：xv6 只有二十来个系统调用，你能写的程序完全由它们决定。这是后面 Janus 论文（系统调用边界 = 安全边界）的感性基础。",
              "<b>发现 shell 只是个普通用户程序</b>：<code>user/sh.c</code> 不是内核的一部分。它靠 fork+exec+wait+fd 拼出「命令行」这种体验。拆掉这个幻觉，后面读内核才不会找错地方。",
              "<b>练 C 语言</b>：指针、结构体、字符串。这是硬门槛。<code>memdump</code> 一题就是在逼你把「指针 + 格式化 + 边界检查」练熟。"
            ] },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "sleep — 理解「系统调用是一个函数」", open: false, blocks: [
              { t: "p", html: "看似最简单，实则要看清三层：<code>user/user.h</code> 里的 C 声明 → <code>user/usys.S</code> 里的汇编 stub（<code>li a7, SYS_pause; ecall; ret</code>）→ <code>kernel/sysproc.c</code> 里的 <code>sys_pause</code>。<b>你调用的 <code>pause()</code> 根本不是普通函数，而是一次穿越特权边界的往返。</b>" },
              { t: "ul", items: [
                "参数缺失要报错（<code>argc</code> 检查）；",
                "命令行参数是字符串，要用 <code>atoi</code> 转整数；",
                "别忘了把程序加进 Makefile 的 <code>UPROGS</code>，否则不会被编译进 fs.img。"
              ] }
            ] },
            { t: "acc", title: "sixfive — 用流式解析理解 fd 与缓冲", open: false, blocks: [
              { t: "p", html: "逐字符读，遇到分隔符就把攒下的数字判断一次。<b>文件的开始和结束是隐式分隔符</b>——这是最容易漏的边界条件（末尾没有分隔符时最后一个数字不能丢）。" },
              { t: "p", html: "注意题目要求：<code>xv6</code> 里的 6 <b>不算</b>——因为数字必须是「被分隔符包围的一串数字」。这说明需求描述里每个字都要读清楚。" }
            ] },
            { t: "acc", title: "memdump — 指针与边界检查", open: false, blocks: [
              { t: "p", html: "按格式字符串逐个消费 <code>data</code>。核心陷阱是<b>边界</b>：任何格式字符需要的字节数超过剩余 <code>len</code> 时，必须打印 <code>memdump: not enough data for 'X'</code> 并停止。" },
              { t: "note", kind: "warn", title: "为什么这题在 OS 课里", html: "因为<b>「不能越过缓冲区边界读」是内核代码最重要的纪律之一</b>。内核里越界读不是崩溃那么简单——它可能把别的进程的数据泄漏出去（见 syscall lab 的 attack 部分，那正是故意删掉了清零代码造成的漏洞）。" }
            ] },
            { t: "acc", title: "find + find -exec — 目录是文件、递归、fork/exec/wait", open: false, blocks: [
              { t: "p", html: "<b>目录在磁盘上就是一个特殊文件，内容是「名字 + inode 号」的列表。</b>看 <code>user/ls.c</code> 就明白了：读目录 = open + read 出一个个 <code>struct dirent</code>。" },
              { t: "ul", items: [
                "递归时<b>必须跳过 <code>.</code> 和 <code>..</code></b>，否则无限递归；",
                "要构造完整路径（父路径 + <code>/</code> + 名字），注意缓冲区大小 <code>MAXPATH</code>；",
                "字符串比较用 <code>strcmp</code>，<b>不能用 <code>==</code></b>（那比的是指针）；",
                "<code>-exec</code> 部分：<code>fork()</code> → 子进程 <code>exec(cmd, argv)</code> → 父进程 <code>wait()</code>。<b>argv 必须以 NULL 结尾</b>，数组大小上限是 <code>MAXARG</code>；",
                "子进程要 <code>exit()</code>，否则父进程的 <code>wait()</code> 永远等不到它。"
              ] }
            ] },
            { t: "h", text: "④ 官方文档没说清楚的地方（补充）" },
            { t: "quote", html: "手册只说「把 sleep 加到 UPROGS」，但没解释<b>为什么</b>。原因：xv6 没有动态链接和文件系统执行权限的概念，<code>fs.img</code> 是<b>在宿主机上由 mkfs 预先打包好的</b>。Makefile 里的 <code>UPROGS</code> 就是打包清单。所以不加进去，你的程序根本不存在于 xv6 的世界里。", src: "补充：xv6 构建流程" },
            { t: "quote", html: "手册提到 <code>make qemu-fs</code> 可以复用上次的 fs.img。这是因为<b>每次 <code>make qemu</code> 都会重新生成 fs.img</b>，你在 xv6 里创建的文件会全部消失。调试 find 的递归行为时，用 <code>make qemu-fs</code> 能省下反复建目录的时间。", src: "补充：调试技巧" },
            { t: "p", html: "另外，xv6 <b>没有 <code>ps</code> 命令</b>——按 <code>Ctrl-p</code> 内核会打印所有进程。这个细节手册提了一句但没解释：它是内核里 <code>procdump()</code> 直接挂在控制台中断处理上的，属于 xv6 特有的调试设施。" },
            { t: "h", text: "⑤ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["忘记加 <code>UPROGS</code>", "程序不存在，shell 报 <code>exec failed</code>", "改 Makefile 后重新 <code>make qemu</code>"],
              ["字符串用 <code>==</code> 比较", "find 永远找不到文件", "用 <code>strcmp() == 0</code>"],
              ["递归没跳过 <code>.</code> / <code>..</code>", "栈溢出或死循环", "显式判断并 continue"],
              ["<code>exec</code> 的 argv 没以 NULL 结尾", "子进程行为未定义（内核会一直读下去）", "<code>argv[n] = 0;</code>"],
              ["子进程不 <code>exit()</code>", "shell 卡住 / 进程表泄漏", "exec 失败或成功后都 exit"],
              ["<code>memdump</code> 越界读", "读到垃圾数据", "每个格式字符消费前先检查剩余 len"]
            ] },
            { t: "h", text: "⑥ 与论文的联系" },
            { t: "p", html: "这个 lab 本身不配论文，但它是 <b>Janus 论文（系统调用拦截）</b> 的感性基础：当你意识到「程序能做的所有事都挤在这二十几个系统调用里」时，你才会明白为什么把拦截点放在这条边界上是如此自然的想法。" }
          ]
        },

        {
          id: "lab-syscall", no: "L2", short: "syscall：加系统调用 + 沙箱",
          title: "Lab: System calls（interpose 沙箱 + attack）",
          subtitle: "设计目的：亲手穿过一次用户/内核边界，看清系统调用是怎么被分发的；然后利用这个边界做一个沙箱（Janus 的极简版），再亲手利用一个内核 bug 打破隔离。",
          meta: [["分支", "syscall"], ["必读", "xv6 book Ch.2 + §4.3/§4.4"], ["任务", "gdb 练习 / interpose(mask, path) / attack"], ["难度", "★★☆"]],
          tags: ["系统调用|blue", "沙箱|blue", "隔离|blue"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理：一次系统调用的完整往返" },
            { t: "viz", id: "trapflow", cap: "一次 write() 系统调用的完整路径：用户 stub → ecall → trampoline → usertrap → syscall() 分发 → 返回" },
            { t: "acc", title: "① 三层结构：stub → 分发表 → 实现函数", open: true, blocks: [
              { t: "ul", items: [
                "<b>用户态 stub</b>：<code>user/usys.pl</code> 生成的 <code>user/usys.S</code>。每个系统调用一段 3 行汇编：把 syscall 号放进 <code>a7</code>，执行 <code>ecall</code>，然后 <code>ret</code>。",
                "<b>分发表</b>：<code>kernel/syscall.c</code> 里的 <code>syscalls[]</code> 数组，下标是 syscall 号，值是函数指针。",
                "<b>实现函数</b>：<code>kernel/sysproc.c</code> / <code>sysfile.c</code> 里的 <code>sys_xxx()</code>。"
              ] },
              { t: "p", html: "加一个系统调用要动五个地方：<code>user/user.h</code>（声明）、<code>user/usys.pl</code>（stub）、<code>kernel/syscall.h</code>（编号）、<code>kernel/syscall.c</code>（表项 + 外部声明）、<code>kernel/sysproc.c</code>（实现）。漏掉任何一处都是编译错误或 “unknown sys call”。" }
            ] },
            { t: "acc", title: "② 参数传递：为什么不能直接解引用用户指针？", open: false, blocks: [
              { t: "p", html: "用户调用 <code>interpose(mask, path)</code> 时，参数在寄存器 <code>a0</code>/<code>a1</code> 里，陷入内核后被保存在 <code>p-&gt;trapframe-&gt;a0..a5</code>。内核用 <code>argint()</code> / <code>argaddr()</code> / <code>argstr()</code> 取出来。" },
              { t: "note", kind: "danger", title: "这是内核编程最重要的纪律之一", html: "用户传进来的<b>指针不能直接用</b>。原因：<br>1. 它可能是个野指针，内核解引用会直接 panic（lab 里就让你故意这么做一次，看 <code>scause=0xd</code>）；<br>2. 更危险的是「<b>double fetch</b>」——用户可以在内核两次读同一地址之间改掉它（TOCTOU）。<br><br>所以 <code>argstr()</code> 会把字符串<b>拷进内核缓冲区</b>再用。这正是 Janus 论文第 ③ 类坑（TOCTOU）在内核里的标准解法。" }
            ] },
            { t: "acc", title: "③ 为什么地址 0 的解引用会让内核 panic", open: false, blocks: [
              { t: "p", html: "lab 让你把 <code>num = p-&gt;trapframe-&gt;a7</code> 改成 <code>num = *(int*)0</code>，然后看内核报 <code>scause=0xd sepc=0x...</code>。" },
              { t: "p", html: "<code>scause=0xd</code> 是 RISC-V 的 <b>Load page fault</b>。之所以会 panic 而不是优雅返回，是因为 <b>xv6 的内核页表没有映射虚拟地址 0</b>（见 xv6 book Figure 3-3：内核地址空间从 <code>0x80000000</code> 开始，下面是大片未映射区）。" },
              { t: "p", html: "这个设计的意义：<b>让内核自己的 bug 尽早暴露</b>。如果用户页能映射到地址 0，一个 NULL 指针解引用会悄悄读到垃圾数据而不是崩溃——那是最难查的一类 bug。" },
              { t: "note", kind: "ok", title: "顺带的习题价值", html: "lab 让你用 <code>addr2line</code> 把 <code>sepc</code> 翻译成源码行号，以及在 gdb 里看 <code>sstatus</code> 判断陷入前处于什么模式。这套「从 panic 信息反推源码位置」的技能，后面每个 lab 都会用。" }
            ] },
            { t: "h", text: "② 设计目的：为什么让你写一个沙箱" },
            { t: "p", html: "这个 lab 的 2026 版本把「加一个系统调用」包装成了 <b>interpose（拦截）</b>，这不是随便选的——它就是 Janus 论文的核心机制，只是放在内核里实现。" },
            { t: "quote", html: "Janus 的基本思路：限制一个进程能发起哪些系统调用，从而限制一个 buggy 或恶意应用能对系统其余部分造成的损害。", src: "6.1810 LEC 7 讲义" },
            { t: "p", html: "把它做成内核系统调用（而不是 Janus 那样的用户态 ptrace 监视器），正好<b>绕开了 Janus 后来踩到的所有坑</b>：你在内核里拿到的就是内核真正要用的那份数据，没有 TOCTOU，也没有「复刻内核路径解析」的问题。讲义自己也点明了这个历史转变：" },
            { t: "quote", html: "回想起来，现在很多操作系统都在内核里支持沙箱机制（Linux、Windows、macOS…），<b>部分原因正是为了避免这篇论文谈到的那些 traps and pitfalls</b>。", src: "6.1810 LEC 7 讲义" },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "Part A：interpose(mask, path) — 按系统调用号过滤", open: true, blocks: [
              { t: "steps", items: [
                { h: "在 struct proc 里加字段", p: "<code>int mask;</code> 记录被禁止的系统调用位图。这是「进程状态」的一部分，和 fd 表、页表同级。" },
                { h: "实现 sys_interpose()", p: "用 <code>argint(0, &mask)</code> 取第一个参数，存进 <code>myproc()-&gt;mask</code>。" },
                { h: "在 syscall() 分发前检查", p: "在 <code>syscall()</code> 里，算出 <code>num</code> 之后、调用 <code>syscalls[num]()</code> 之前，判断 <code>p-&gt;mask & (1 &lt;&lt; num)</code>，命中则返回 -1。" },
                { h: "fork 时继承", p: "修改 <code>kfork()</code>（<code>kernel/proc.c</code>），把父进程的 mask 拷给子进程。" }
              ] },
              { t: "note", kind: "warn", title: "为什么「fork 时继承」是必须的", html: "这正是 Janus 论文里的第 ④ 类坑 —— <b>状态复制</b>。如果不继承，被沙箱限制的程序只要 <code>fork()</code> 一个子进程，子进程就没有 mask 了，可以随意 <code>open</code> 任何文件。<b>沙箱的全部强度等于它最弱的那个传播路径。</b>" },
              { t: "p", html: "而且注意：限制必须<b>在 exec 之后仍然有效</b>（因为 mask 存在 proc 里而不是地址空间里），这正是「把策略放在内核进程对象上」的好处——它天然跟随进程生命周期，不需要 Janus 那样维护一份影子状态。" }
            ] },
            { t: "acc", title: "Part B：允许路径白名单", open: false, blocks: [
              { t: "p", html: "第二个参数 <code>path</code> 是「被允许的路径」。规则：<b>如果 open/exec 被 mask 掉了，但路径等于允许的 path，就放行</b>。" },
              { t: "ul", items: [
                "在 proc 里加 <code>char allowed[MAXPATH];</code>；",
                "用 <code>argstr(1, buf, MAXPATH)</code> 把字符串<b>拷进内核</b>（不能直接存用户指针！那会 TOCTOU 且会悬空）；",
                "在 <code>sys_open</code> / <code>sys_exec</code> 的入口（或在 <code>syscall()</code> 里统一处理）比较路径；",
                "fork 时同样要继承这个字符串。"
              ] },
              { t: "note", kind: "warn", title: "这暴露了 Janus 的第 ① 类坑", html: "xv6 这里做的是<b>字符串比较</b>，而 Janus 论文明确说「光比较字符串是错的」——因为 <code>./README</code>、<code>a/../README</code>、符号链接都指向同一个文件。<br><br>xv6 是教学系统，语义简单（没有符号链接、没有 <code>..</code> 的复杂语义），所以字符串比较勉强够用。<b>但你要知道这在真实系统里是不够的</b>——正确做法是在内核路径解析之后比较解析出的 inode。" }
            ] },
            { t: "acc", title: "Part C：attack — 亲手打破隔离", open: false, blocks: [
              { t: "p", html: "这一部分课程故意删掉了三行 <code>memset</code>：<code>uvmalloc()</code> 里清零新分配的页，以及 <code>kalloc.c</code> 里往空闲页填垃圾的两行。结果：<b>sbrk() 拿到的页还留着上一个使用者的内容</b>。" },
              { t: "p", html: "<code>secret</code> 程序把秘密写进自己的堆然后退出（内存被回收）；你的 <code>attack</code> 程序 <code>sbrk()</code> 拿到这些页，把它们读出来打印。" },
              { t: "note", kind: "danger", title: "这个练习想教什么", html: "<b>「不清零」看起来只是个性能优化，实际上是一个安全漏洞。</b>而且这类漏洞特别阴险：<br>· xv6 少了这三行，<b>大部分情况下仍然正常工作</b>，甚至能通过大部分 usertests；<br>· 它不影响「正确性」，只影响「隔离性」；<br>· 真实内核历史上出现过大量同类问题（未初始化内存泄漏、栈上残留数据等）。<br><br>lab 手册的原话是：<b>“不影响正确性的 bug 有时也能被利用来破坏安全。”</b>" },
              { t: "p", html: "攻击思路：<code>sbrk()</code> 扩大堆 → 扫描新获得的内存 → 找出符合「只含数字与字母」的串。注意 grader 会跑两次（因为页分配顺序不确定）。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["只改了 <code>syscall.h</code> 没改 <code>usys.pl</code>", "编译报 <code>undefined reference to interpose</code>", "五处全改：user.h / usys.pl / syscall.h / syscall.c / sysproc.c"],
              ["把用户指针直接存进 proc", "之后读到垃圾或触发缺页", "用 <code>argstr</code> 拷进内核缓冲区"],
              ["fork 没继承 mask", "<code>sandbox_fork</code> 测试失败", "在 <code>kfork()</code> 里复制"],
              ["mask 检查放在 <code>syscalls[num]()</code> 之后", "拦截无效", "必须放在调用之前"],
              ["<code>interpose</code> 自己被 mask 掉", "无法再调整策略（取决于测试期望）", "注意 syscall 号与位图的对应关系"],
              ["attack 只读了一页", "找不到 secret", "secret 可能写在任意一页，要扫完整个 sbrk 出来的区域"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Janus / Traps and Pitfalls</b>（论文 01）：interpose 就是 Janus 的内核版；fork 继承 = 论文的状态复制坑；路径比较 = 论文的路径解析坑。",
              "<b>Blending Containers and VMs</b>（论文 08）：本 lab 是「在宿主内核 syscall 入口做过滤」这一档，也就是最弱的一档隔离。学完那篇论文你会知道另外两档（用户态内核、硬件边界）分别是什么。",
              "<b>Meltdown</b>（论文 10）：attack 部分让你体会「隔离被一个实现细节破坏」；Meltdown 则是「隔离被硬件实现破坏」。两者都是「抽象承诺 vs 实现现实」的裂口。"
            ] }
          ]
        }
      ]
    },

    /* ============ 组 2 ============ */
    {
      name: "二、虚拟内存：把页表从概念变成你能打印出来的东西",
      desc: "pgtbl 让你把页表当数据结构操作；cow 让你第一次把「页错误」当成编程工具而不是错误。",
      items: [
        {
          id: "lab-pgtbl", no: "L3", short: "pgtbl：页表",
          title: "Lab: Page tables",
          subtitle: "设计目的：页表是操作系统最核心也最抽象的数据结构。这个 lab 通过「打印页表 → 读取硬件设置的位 → 插入共享页 → 使用超级页」四步，让你把它彻底去神秘化。",
          meta: [["分支", "pgtbl"], ["必读", "xv6 book Ch.3 + kernel/vm.c / memlayout.h / kalloc.c"], ["任务", "解释 PTE / vmprint / pgaccess / USYSCALL getpid / superpages"], ["难度", "★★★"]],
          tags: ["虚拟内存|teal", "页表|teal", "核心|purple"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① 页表是「内核写、硬件读」的数据结构", open: true, blocks: [
              { t: "p", html: "这是理解页表的第一要点：<b>页表由内核用普通内存指令构造，但被硬件的 MMU 在每次访存时查阅</b>。它是软硬件之间的一份契约。因此它有两个特性：" },
              { t: "ul", items: [
                "<b>格式由硬件规定</b>：你不能随便定义 PTE 布局，必须按 RISC-V 特权手册来（这是为什么 lab 让你去查手册定义 <code>PTE_A</code>）；",
                "<b>硬件会写一部分位</b>：<code>PTE_A</code>（accessed）和 <code>PTE_D</code>（dirty）是<b>硬件在解析 TLB miss 时自动置位</b>的，内核只能读和清。"
              ] },
              { t: "note", kind: "warn", title: "由此推出的一条铁律", html: "内核修改页表后，<b>必须让 TLB 失效</b>（<code>sfence.vma</code>），否则硬件还在用旧翻译。<br><br>这条规则在本 lab 和 cow lab 里反复出现。xv6 的 <code>mappages</code> / <code>uvmunmap</code> 里已经处理好了，但<b>你自己直接改 PTE 的地方必须自己处理</b>（例如 pgaccess 清 PTE_A、cow 改 PTE_W）。" }
            ] },
            { t: "acc", title: "② 三级页表为什么是「稀疏」的", open: false, blocks: [
              { t: "p", html: "Sv39 用三级 9-9-9-12。如果用一级表覆盖 39 位地址空间，需要 2<sup>27</sup> 个表项——完全不可行。<b>多级表的价值在于「按需分配」</b>：只有被用到的那部分地址范围才需要有对应的下级表页。" },
              { t: "p", html: "所以在 <code>vmprint</code> 的输出里，你会看到中间层很多表项是空的——这正是多级页表省内存的地方。" }
            ] },
            { t: "acc", title: "③ 内核页表 vs 用户页表，以及 trampoline 为什么特殊", open: false, blocks: [
              { t: "viz", id: "xv6addrspace", cap: "xv6 的用户地址空间与内核地址空间；TRAMPOLINE 被映射到两边同一个虚拟地址" },
              { t: "p", html: "xv6 里<b>每个进程有自己独立的内核页表</b>（这是新版本的变化，旧版共享一个）。TRAMPOLINE 和 TRAPFRAME 被映射到两边<b>相同的虚拟地址</b>，原因很实际：" },
              { t: "ul", items: [
                "<b>TRAMPOLINE</b>：切换 <code>satp</code> 的瞬间，当前指令地址必须在新页表里仍然有效。把它放在两边同一地址，切换后就能继续执行下一条指令。",
                "<b>TRAPFRAME</b>：切换完页表后，内核需要一个「已知地址」来存放刚保存下来的用户寄存器。"
              ] },
              { t: "note", kind: "ok", title: "这个技巧的通用名字", html: "叫做在地址空间里留一个 <b>“same-address window”</b>。凡是「切换上下文的代码本身不能被切换影响」的地方都需要它——进程切换、虚拟机切换、甚至线程切换都有类似的影子结构。" }
            ] },
            { t: "h", text: "② 设计目的：四个任务分别对应什么能力" },
            { t: "table", head: ["任务", "训练的能力", "在真实 OS 里的对应物"], rows: [
              ["<b>解释 PTE + vmprint</b>", "把页表当数据结构遍历、读位", "调试工具、<code>/proc/self/pagemap</code>、内核的 show_pte"],
              ["<b>pgaccess</b>", "<b>读硬件设置的 A 位并清零</b>", "GC 的读屏障、工作集估计、Linux 的 <code>idle page tracking</code>、LRU 近似（这正是 Appel&Li 的 DIRTY 原语的读版本）"],
              ["<b>USYSCALL 加速 getpid</b>", "<b>内核与用户共享只读页</b>，消除陷入", "Linux 的 <b>vsyscall / vDSO</b>（gettimeofday、getcpu 都这么做）"],
              ["<b>超级页</b>", "直接构造非 4KB 的映射", "THP / hugetlbfs（见 Superpages 论文）"]
            ] },
            { t: "h", text: "③ 任务拆解与文档补充" },
            { t: "acc", title: "vmprint — 递归遍历三级表", open: true, blocks: [
              { t: "p", html: "递归函数签名大概是 <code>void vmprint(pagetable_t pt, int level)</code>：遍历 512 个 PTE，跳过无效项，按 level 缩进打印；如果 PTE 的 R/W/X 位<b>全为 0</b> 说明它是中间层，递归下去。" },
              { t: "code", text: "// 判断是叶子还是中间层：叶子 PTE 必须至少有一个 R/W/X 位\nif((pte & (PTE_R|PTE_W|PTE_X)) == 0){\n  // 这是一个指向下级页表的 PTE\n  uint64 child = PTE2PA(pte);\n  vmprint((pagetable_t)child, level + 1);\n}" },
              { t: "note", kind: "warn", title: "手册省略的关键知识", html: "手册只说「参考 <code>freewalk</code>」，但没解释<b>怎么区分叶子和中间层</b>。RISC-V 的规则是：<b>如果一个 PTE 的 R、W、X 三个位全为 0，它就是指向下一级页表的指针</b>（即使 V 位为 1）。这是特权手册里的规定，也是 <code>freewalk</code> 能正确工作的原因。" },
              { t: "p", html: "另外手册给了样例输出让你核对，但<b>物理地址会不同、页的数量和虚拟地址必须相同</b>——这是判断你对不对的可靠标准。" }
            ] },
            { t: "acc", title: "pgaccess — 读 A 位并清零", open: false, blocks: [
              { t: "p", html: "三步：对每个虚拟页用 <code>walk()</code> 找到 PTE → 检查 <code>PTE_A</code> 是否置位 → <b>清零</b>并把结果写进位掩码 → <code>copyout()</code> 把结果拷回用户缓冲区。" },
              { t: "ul", items: [
                "<code>PTE_A</code> 需要你自己在 <code>kernel/riscv.h</code> 定义，值是 <b>bit 6</b>（<code>1L &lt;&lt; 6</code>）；",
                "清零后<b>必须 <code>sfence.vma</code></b>，否则 TLB 里缓存的旧 PTE 还会继续置 A 位；",
                "参数非法（页未映射、缓冲区地址非法）要返回 -1；",
                "建议设一个扫描页数上限（避免用户传个巨大的数把内核卡住）。"
              ] },
              { t: "note", kind: "purple", title: "为什么这个练习很值钱", html: "它演示了一个通用模式：<b>硬件替你收集信息（A 位 / D 位），OS 定期读走并清零，得到「自上次以来的增量」。</b><br><br>同样的模式用于：<br>· 页面替换算法的 LRU 近似（Linux 的 page reclaim 扫描 A 位）；<br>· 增量式 GC 的 DIRTY（Appel & Li 论文）；<br>· 检查点 / 增量快照；<br>· 内存去重（KSM）。" }
            ] },
            { t: "acc", title: "USYSCALL — 用共享页消除陷入", open: false, blocks: [
              { t: "p", html: "思路：进程创建时在 <code>USYSCALL</code> 这个固定虚拟地址映射一页，页里放一个 <code>struct usyscall</code>（其中存 pid）。用户态的 <code>ugetpid()</code> 直接读这个地址，<b>完全不进内核</b>。" },
              { t: "steps", items: [
                { h: "分配页", p: "在 <code>allocproc()</code> 里 <code>kalloc()</code> 一页。" },
                { h: "映射", p: "<code>mappages(pagetable, USYSCALL, PGSIZE, pa, PTE_R | PTE_U)</code> —— 注意<b>只有 R 和 U 位，没有 W</b>。" },
                { h: "初始化", p: "把 <code>pid</code> 写进 <code>struct usyscall</code>。" },
                { h: "释放", p: "在 <code>freeproc()</code> 里 <code>uvmunmap</code> + <code>kfree</code>，否则内存泄漏，usertests 会挂。" }
              ] },
              { t: "note", kind: "warn", title: "为什么不能有 PTE_W", html: "这是<b>安全要求</b>：如果用户可以写这一页，他就能把自己的 pid 改成别人的，绕过任何基于 pid 的权限检查。<br><br>这也解释了 xv6 book 里反复强调的：<b>用户页表里的 U 位是「用户可访问」的唯一开关，内核映射必须清掉 U 位</b>，否则用户程序能直接读写内核内存。" },
              { t: "p", html: "想一想手册最后问的：<b>还有哪些系统调用可以用这招加速？</b> 答案是那些「只读一个内核里的小变量、没有副作用」的：<code>uptime</code>（读 ticks）、<code>getpid</code>、真实的 <code>gettimeofday</code>、<code>getcpu</code>。反例：<code>fork</code>、<code>open</code> —— 它们有副作用，且需要内核的检查。" }
            ] },
            { t: "acc", title: "超级页 — 只用内核页表", open: false, blocks: [
              { t: "p", html: "复制一份 <code>mappages</code> 给 <code>kvmmap</code> 专用，识别「对齐且长度 ≥ 2MB」的区间，直接用<b>一级 PTE</b> 建 2MB 映射（只设 <code>PTE_V | PTE_R</code> 或加上 W/X，物理页号必须 2MB 对齐）。" },
              { t: "quote", html: "真实操作系统会为内核和用户进程<b>动态地</b>把一批页提升为 superpage。下面这篇参考文献解释了为什么这是个好主意、以及在更严肃的设计中什么最难：<b>Navarro et al., Practical, transparent operating system support for superpages (OSDI 2002)</b>。", src: "6.1810 pgtbl lab 手册原文引用" },
              { t: "p", html: "<b>为什么 lab 只要求内核页表？</b> 因为用户页表会遇到 Superpages 论文里所有难题：fork 之后要拆、COW 之后要拆、sbrk 增长时边界变化、部分页被换出/改权限要 demote。而内核映射是启动时一次性建好、之后不变的——<b>没有 promotion/demotion，也就没有策略问题</b>。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["改了 PTE 没 <code>sfence.vma</code>", "行为不确定（清了 A 位仍然读到 1）", "改页表后必须刷新 TLB"],
              ["<code>vmprint</code> 打印了无效 PTE", "输出里出现全 0 行", "只打印 <code>PTE_V</code> 置位的项"],
              ["没区分叶子与中间层", "<code>vmprint</code> 递归到垃圾数据", "R/W/X 全 0 = 中间层"],
              ["USYSCALL 页没在 <code>freeproc</code> 释放", "usertests 报内存泄漏 / kalloc 耗尽", "对称地释放"],
              ["USYSCALL 给了写权限", "用户可以伪造 pid", "只给 <code>PTE_R | PTE_U</code>"],
              ["超级页物理地址没 2MB 对齐", "映射范围错误 / 覆盖别的区域", "检查 <code>pa % (2*1024*1024) == 0</code> 且 size ≥ 2MB"],
              ["<code>walk()</code> 传了 <code>alloc=0</code> 却写了返回值", "空指针解引用", "只读场景用 0；要建映射用 1"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Superpages（论文 02）</b>：lab 的超级页任务是论文光谱上最简单的一档（静态、仅内核）。论文告诉你真实系统为什么难。",
              "<b>Appel & Li（论文 03）</b>：<code>pgaccess</code> 就是 DIRTY/TRAP 原语的姊妹版（读 A 位而不是 D 位）。手册里 “哪些系统调用能用共享页加速” 那问，也呼应论文「让应用直接看到内核状态」的思路。",
              "<b>RCU（论文 07）</b>：看似无关，但「USYSCALL 用只读共享页消除陷入」和「RCU 让读侧不写共享内存」是同一个优化思想：<b>消除对共享热点的写，就能消除扩展瓶颈</b>。"
            ] }
          ]
        },

        {
          id: "lab-cow", no: "L4", short: "cow：写时复制 fork",
          title: "Lab: Copy-on-Write Fork for xv6",
          subtitle: "设计目的：让你第一次把「页错误」当成一种可编程的事件而不是错误——这是现代 OS 里最重要的一个思维转变。",
          meta: [["分支", "cow"], ["必读", "xv6 book §4.6（缺页）、Ch.3"], ["任务", "uvmcopy 延迟复制 + vmfault 处理 + 引用计数 + copyout"], ["难度", "★★★"]],
          tags: ["虚拟内存|teal", "页错误|teal", "核心|purple"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理：虚拟内存是一层「可拦截的间接」" },
            { t: "acc", title: "① 「任何系统问题都能加一层间接解决」", open: true, blocks: [
              { t: "p", html: "lab 手册开头就引用了这句计算机系统的谚语。虚拟地址 → 物理地址这一层间接，让内核能够：" },
              { t: "ul", items: [
                "<b>拦截访问</b>：把 PTE 标为无效或只读，访问就会触发页错误，内核可以决定怎么办；",
                "<b>改变地址的含义</b>：改一个 PTE，同一段虚拟地址就指向别的地方。"
              ] },
              { t: "p", html: "COW 就是这两条的组合：<b>先把所有可写页改成只读（拦截），等真的有人写时再给一份私有副本（改含义）</b>。" }
            ] },
            { t: "acc", title: "② 为什么 fork 要复制，以及为什么这很浪费", open: false, blocks: [
              { t: "p", html: "<code>fork()</code> 的语义是「子进程拿到父进程地址空间的一份<b>独立副本</b>」。最直白的实现就是真的把每一页复制一遍。问题是：" },
              { t: "ol", items: [
                "<b>慢</b>：父进程大时复制耗时明显；",
                "<b>经常白复制</b>：Unix 里 <code>fork()</code> 之后紧跟 <code>exec()</code> 是<b>最常见</b>的用法（shell 就是这么干的）。exec 会丢弃整个地址空间——刚才复制的那些页，绝大部分<b>一个字节都没被读过就被扔了</b>。"
              ] },
              { t: "p", html: "COW 的洞察：<b>既然大部分复制是白做的，那就等真的需要时再做。</b>「需要」的判据就是「有人写了这一页」。" }
            ] },
            { t: "acc", title: "③ 引用计数：共享带来的生命周期问题", open: false, blocks: [
              { t: "p", html: "一旦多个页表指向同一个物理页，「什么时候能释放」就变成了新问题：<b>最后一个引用消失时才能释放，不能早也不能晚。</b>" },
              { t: "p", html: "这是操作系统里反复出现的模式（文件引用计数、inode 链接计数、<code>struct file</code> 的 refcnt、dentry、RCU 的 grace period）。lab 手册自己就点出了它在真实内核里有多难：" },
              { t: "quote", html: "在一个像 xv6 这样简单的内核里，这个簿记工作还算直接；但<b>在生产内核里这可能很难做对</b> —— 参见 Patching until the COWs come home。", src: "6.1810 cow lab 手册原文" },
              { t: "p", html: "（那篇文章讲的是 Linux 上因为 COW 的引用计数处理不当，导致的一系列可利用的安全漏洞。可见这不是纸上谈兵。）" }
            ] },
            { t: "h", text: "② 设计目的与方案" },
            { t: "viz", id: "cow", cap: "COW 三阶段：fork 前（可写）→ fork 后（双方只读共享，refcnt=2）→ 某一方写入时（分配新页、复制、改回可写）" },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "步骤 1：uvmcopy 改成共享而非复制", open: true, blocks: [
              { t: "p", html: "把「kalloc 新页 + memmove 复制」改成「把子进程的 PTE 指向父进程的物理页」，并且<b>父子双方的 PTE_W 都要清掉</b>。" },
              { t: "note", kind: "danger", title: "最容易漏的一步：父进程也要清 PTE_W", html: "很多人只改子进程的 PTE。但如果不把<b>父进程</b>的 PTE_W 也清掉，父进程写这一页时<b>不会触发缺页</b>，于是它会直接写进共享的物理页——子进程看到了本该私有的修改。<b>这是 COW 里最经典的 bug。</b>" },
              { t: "p", html: "同时要 <code>sfence.vma</code>（改了权限位）。" }
            ] },
            { t: "acc", title: "步骤 2：用一个标志记住「这是 COW 页」", open: false, blocks: [
              { t: "p", html: "关键问题：页错误发生时，内核看到一个只读 PTE，怎么知道「这是 COW 造成的只读」还是「这本来就是只读页（比如代码段）」？" },
              { t: "p", html: "<b>答案：用 PTE 里保留给软件的位（RSW，bits 8–9）自己打标记。</b>手册直接提示了这一点。" },
              { t: "note", kind: "warn", title: "不打标记会怎样", html: "如果只靠「PTE_W 为 0」判断，那么程序写代码段（本来就是只读）时也会被当成 COW，从而<b>给它复制一份可写副本</b>——于是本该被杀掉的非法写操作静默成功了。<b>安全性被削弱。</b><br><br>手册明确要求：<b>原本只读的页（如代码段）必须保持只读并共享，试图写它的进程应该被 kill。</b>" }
            ] },
            { t: "acc", title: "步骤 3：vmfault 里处理写缺页", open: false, blocks: [
              { t: "code", text: "// 判断：是 store page fault (scause=15) 且 PTE 有 COW 标志且原本可写\nif(r_scause() == 15 && (*pte & PTE_COW) && (*pte & PTE_W_MASK)){\n  // 1. kalloc 一页（失败则 kill 进程）\n  // 2. memmove 复制旧页内容\n  // 3. 改 PTE：指向新页，设 PTE_W，清 PTE_COW\n  // 4. kfree 旧页（会递减 refcnt，可能为 0 则真正释放）\n}" },
              { t: "ul", items: [
                "<b>scause</b>：RISC-V 里 13 = load page fault，15 = store page fault，12 = instruction page fault。写 COW 页是 15。",
                "<b>stval</b>：存放触发缺页的虚拟地址，你需要的就是这个。",
                "<b>没内存时 kill</b>：手册明确要求，不能无限等待。"
              ] }
            ] },
            { t: "acc", title: "步骤 4：引用计数改造 kalloc / kfree", open: false, blocks: [
              { t: "p", html: "用一个全局数组 <code>int refcnt[...]</code>，按 <code>pa / PGSIZE</code> 索引（手册建议用 <code>kinit()</code> 时的最高物理地址决定数组大小）。" },
              { t: "ul", items: [
                "<code>kalloc()</code> 时置 1；",
                "<code>fork</code> 共享时 +1；",
                "任何页表删除该映射时 -1；",
                "<code>kfree()</code> 只在计数归 0 时才真正放回空闲链表。"
              ] },
              { t: "note", kind: "warn", title: "并发与索引", html: "refcnt 数组本身是共享数据结构，<b>多核下必须加锁</b>。xv6 里最简单的做法是用 <code>kmem.lock</code> 保护（但要注意不要和已有的锁形成嵌套死锁）。<br><br>另外注意索引方式：如果你用 <code>pa/PGSIZE</code> 作为下标，需要确认 <code>kinit</code> 放进空闲链表的<b>最高</b>物理地址，否则会越界。" }
            ] },
            { t: "acc", title: "步骤 5：copyout 也要走 COW 逻辑（最容易漏）", open: false, blocks: [
              { t: "p", html: "<code>copyout()</code> 是内核<b>代表用户进程</b>往用户地址写数据（比如 <code>read()</code> 系统调用把数据填进用户缓冲区）。它是内核代码直接访问用户虚拟地址，<b>不走用户的那条执行路径，所以不会触发用户态缺页</b>。" },
              { t: "note", kind: "danger", title: "为什么必须特殊处理", html: "如果 copyout 遇到一个 COW 只读页，它<b>不会</b>触发缺页（因为内核是按虚拟地址翻译后直接写），而是<b>直接写进共享的物理页</b>——子进程/父进程看到了对方的私有修改。<br><br>这是一个非常隐蔽的 bug：只在「read() 的目标缓冲区正好是 COW 页」时才出现，所以 <code>cowtest</code> 里的 <b>file</b> 测试就是专门测这个的。手册把它单独列为一条，因为它太容易漏。" },
              { t: "p", html: "解法：在 <code>copyout()</code> 里检测目标 PTE 是否是 COW 页，如果是就走和 <code>vmfault</code> 一样的一段复制逻辑。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["只清子进程的 PTE_W", "父进程写页时子进程能看到（隔离破坏）", "<b>父子双方都要清</b>"],
              ["没用 COW 标志区分", "写代码段被静默允许", "用 PTE 的 RSW 位打标记"],
              ["忘记 <code>copyout</code>", "<code>cowtest file</code> 失败", "copyout 里复用同一套逻辑"],
              ["refcnt 没加锁", "多核下计数错乱、页被提前释放", "用锁保护 refcnt"],
              ["改了 PTE 没 <code>sfence.vma</code>", "TLB 里还是旧的可写项", "刷新 TLB"],
              ["<code>kfree</code> 没判断 refcnt", "别的进程还在用就被回收 → 数据错乱", "只有归零才真正释放"],
              ["缺页时无可用内存", "内核 panic", "按手册要求 kill 该进程"],
              ["<code>fork</code> 时 PTE 无效（未映射）", "误处理", "只处理有效且原本可写的页"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Appel & Li（论文 03）</b>：本 lab 就是论文里「把页错误当可编程事件」这一观念的最小示范。论文的 TRAP 原语要求把缺页交给用户态，xv6 里交给 <code>vmfault</code>，但思想是同一个。",
              "<b>Superpages（论文 02）</b>：COW 与超级页是<b>直接冲突</b>的两个优化——COW 需要把页拆细到 4KB，超级页需要把页合并。真实内核必须处理「一个 2MB 的 THP 页被 COW 时要不要拆」这个问题，这正是 Superpages 论文里 demotion 的复杂度来源。",
              "<b>Meltdown（论文 10）</b>：COW 让同一个物理页出现在多个地址空间里。如果硬件有 Meltdown 类缺陷，这种共享让泄漏范围更大。"
            ] }
          ]
        }
      ]
    },

    /* ============ 组 3 ============ */
    {
      name: "三、陷阱与控制流：谁在什么时候掌握 CPU",
      desc: "traps lab 让你理解控制权如何在内核与用户之间来回，并第一次实现「用户态也能处理异常」。",
      items: [
        {
          id: "lab-traps", no: "L5", short: "traps：陷阱与栈",
          title: "Lab: Traps",
          subtitle: "设计目的：理解「控制权」——用户程序、内核、中断处理程序三者之间是怎么交接 CPU 的；并亲手实现一次「内核把异常交回用户态处理」。",
          meta: [["分支", "traps"], ["必读", "xv6 book Ch.4 + trampoline.S / trap.c"], ["任务", "RISC-V 汇编问答 / backtrace / sigalarm+sigreturn"], ["难度", "★★★"]],
          tags: ["陷阱|purple", "控制流|purple", "核心|purple"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① 栈帧：函数调用的物理形态", open: true, blocks: [
              { t: "viz", id: "stackframe", cap: "xv6 内核栈的栈帧布局：返回地址在 fp-8，上一个帧指针在 fp-16" },
              { t: "p", html: "RISC-V 里 <code>s0</code>（fp）指向当前栈帧。每个栈帧在固定偏移处存两样东西：<b><code>fp-8</code> 是返回地址 ra</b>，<b><code>fp-16</code> 是调用者的 fp</b>。于是所有栈帧串成一条链表——这就是 backtrace 能工作的全部原理。" },
              { t: "p", html: "终止条件也来自一个 xv6 的设计决定：<b>每个内核栈恰好一页且页对齐</b>。所以当 fp 越过当前页的下边界（用 <code>PGROUNDDOWN(fp)</code> 判断），就说明走完了。" },
              { t: "note", kind: "warn", title: "为什么 xv6 敢这么假设", html: "因为内核栈不能增长（xv6 没有内核栈的动态扩展），一旦溢出就是灾难。真实 Linux 也是类似的处理：内核栈大小固定（8K 或 16K），溢出会直接 panic 而不是静默破坏内存。<br><br>顺带说：<b>用户栈可以增长</b>（通过缺页按需扩展），但内核栈不能——因为内核没有「处理自己栈缺页」的安全方式。" }
            ] },
            { t: "acc", title: "② trap 的完整路径与 trapframe", open: false, blocks: [
              { t: "p", html: "陷阱分三类：<b>系统调用</b>（ecall，scause=8）、<b>中断</b>（设备/时钟）、<b>异常</b>（缺页、非法指令）。xv6 用同一条路径处理它们，靠 <code>scause</code> 区分。" },
              { t: "p", html: "关键对象是 <code>struct trapframe</code>：<b>进入内核时，所有 32 个用户寄存器被保存在这里</b>。它不是一个抽象概念，而是一页被映射到用户和内核地址空间同一位置的内存。" },
              { t: "note", kind: "purple", title: "trapframe 是「可修改的执行状态」", html: "这一点是 sigalarm 任务的关键：<b>内核只要改 trapframe 里的 <code>epc</code>，返回用户态后程序就会从新地址继续执行</b>；改 <code>a0</code> 就能改变系统调用的返回值。<br><br>换句话说：<b>trapframe 就是进程的「存档」</b>，内核拥有完全的读写权。用户级线程库、信号、调试器、检查点/恢复、甚至迁移进程，全都是基于这个「可读写存档」的性质。" }
            ] },
            { t: "acc", title: "③ 中断与特权：为什么进内核时不能随便关中断", open: false, blocks: [
              { t: "p", html: "xv6 在 <code>usertrap</code> / <code>kerneltrap</code> 里会检查「当前是否已经持有锁」来决定是否开关中断，这是为了避免<b>嵌套陷入</b>导致死锁：如果在持有锁时被中断，中断处理又去拿同一把锁，就死锁了。" },
              { t: "p", html: "这个约束在 lock lab 里会再次出现（<code>cpuid()</code> 必须在关中断时调用）。" }
            ] },
            { t: "h", text: "② 设计目的" },
            { t: "ul", items: [
              "<b>读汇编</b>：不是为了写汇编，而是为了<b>在 gdb 里看懂内核在干什么</b>。后面每个 lab 你都会 <code>layout asm</code>。",
              "<b>backtrace</b>：让你亲手沿着栈帧链走一遍，理解「调用栈」不是编译器给你的抽象，而是内存里真实存在的一条链。",
              "<b>sigalarm</b>：这是本课程最重要的一次思维跳跃——<b>让内核把一个事件交给用户态函数处理</b>。这正是 Appel & Li 论文的 TRAP 原语，也是现代信号机制（<code>sigaction</code> + <code>SIGSEGV</code>）的雏形。"
            ] },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "Part A：RISC-V 汇编问答（答案要点）", open: false, blocks: [
              { t: "ul", items: [
                "<b>参数寄存器</b>：<code>a0–a7</code>。main 里传给 printf 的 13 在 <code>a2</code>（前两个是格式串和 57616）。",
                "<b>小函数被内联</b>：<code>f</code> 和 <code>g</code> 可能被编译器内联掉，所以汇编里找不到 <code>jalr</code> 调用——这就是为什么手册特意提示 “the compiler may inline functions”。",
                "<b>字节序题</b>：<code>0x00646c72</code> 在小端机器上按字节是 <code>72 6c 64 00</code> = “r l d \\0”。所以输出是 <code>He110 World</code>（57616 的十六进制是 0xE110）。<b>如果是大端，<code>i</code> 要改成 <code>0x726c6400</code>，而 57616 不需要改</b>（整数不受字节序影响）。",
                "<b><code>printf(\"x=%d y=%d\", 3)</code></b>：第二个 <code>%d</code> 没有对应参数，会<b>打印 <code>a2</code> 寄存器里当时恰好是什么</b>——答案不是一个具体值，而是「未定义，取决于调用前的寄存器状态」。这正是 C 可变参数的不安全性。"
              ] }
            ] },
            { t: "acc", title: "Part B：backtrace", open: false, blocks: [
              { t: "steps", items: [
                { h: "读当前 fp", p: "在 <code>kernel/riscv.h</code> 加 <code>r_fp()</code>（内联汇编 <code>mv %0, s0</code>）。" },
                { h: "循环", p: "<code>ra = *(fp-8)</code> 打印；<code>fp = *(fp-16)</code> 上移。" },
                { h: "终止", p: "<code>fp</code> 不在当前页内即停止：<code>PGROUNDDOWN(fp) != PGROUNDDOWN(original_fp)</code>。" },
                { h: "挂到 panic", p: "手册要求最后在 <code>panic()</code> 里调用，这样内核崩溃时自动打印调用栈。" }
              ] },
              { t: "p", html: "验证方式：<code>addr2line -e kernel/kernel</code> 然后粘地址进去，会输出 <code>kernel/sysproc.c:74</code> 这样的源码位置。<b>这套 addr2line 流程后面每个 lab 都会用到</b>，务必练熟。" }
            ] },
            { t: "acc", title: "Part C：sigalarm / sigreturn", open: true, blocks: [
              { t: "p", html: "目标：应用调用 <code>sigalarm(n, fn)</code> 之后，每消耗 n 个 tick 的 CPU 时间，内核就<b>强制调用</b>一次 <code>fn</code>；<code>fn</code> 返回后，应用<b>从被打断的地方继续</b>。" },
              { t: "p", html: "实现的核心（也是本 lab 最精妙的地方）：" },
              { t: "steps", items: [
                { h: "记录状态", p: "在 <code>struct proc</code> 里加：<code>interval</code>、<code>handler</code> 地址、<code>ticks_passed</code> 计数、以及一个「是否正在处理 alarm」的标志。" },
                { h: "计数与触发", p: "在 <code>usertrap()</code> 的时钟中断分支里，<code>ticks_passed++</code>；达到 interval 且当前不在处理中，就<b>把 <code>p-&gt;trapframe-&gt;epc</code> 改成 handler 地址</b>。返回用户态时，CPU 会跳到 handler。" },
                { h: "保存被打断的现场", p: "<b>关键</b>：改 epc 之前，必须把<b>整个 trapframe 拷贝一份</b>存起来，否则 handler 执行时会把寄存器全改掉，回不去。" },
                { h: "sigreturn", p: "handler 结束时调用 <code>sigreturn()</code>，内核<b>把之前保存的 trapframe 整个恢复回去</b>，于是返回后程序从原处继续，寄存器全部照旧。" }
              ] },
              { t: "note", kind: "danger", title: "两个必须处理的 corner case", html: "<b>① 重入</b>：如果 handler 本身跑得慢，下一个 tick 又到了，会不会再次跳进 handler？如果不加「正在处理」标志，就会<b>无限递归地把栈打爆</b>。所以需要一个 flag（或者计数归零 + flag 组合）。<br><br><b>② interval=0</b>：手册明确要求 <code>sigalarm(0, fn)</code> 表示<b>停止</b>周期性告警，而不是「每 0 tick 触发一次」（那会疯狂触发）。" },
              { t: "quote", html: "这个练习让你实现一个<b>原始的</b>用户级中断/异常处理机制。你可以用类似的东西来处理应用程序里的页错误。", src: "6.1810 traps lab 手册原文" },
              { t: "p", html: "这句话直接通向 Appel & Li 论文的 <b>TRAP 原语</b>，以及现代 Unix 的 <code>sigaction(SIGSEGV)</code> —— 讲义里明确把它们对应起来了：" },
              { t: "quote", html: "Unix today: <b>sigaction()</b> —— 配置一个信号处理函数（<b>想想 sigalarm() 这个 lab</b>）。<br>TRAP 原语怎么支持？→ <b>sigaction + SIGSEGV</b>", src: "6.1810 LEC 10 讲义" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["backtrace 没有终止条件", "走到别的栈的数据 / 死循环", "用 <code>PGROUNDDOWN</code> 判断页边界"],
              ["<code>r_fp()</code> 放在 <code>#ifdef __ASSEMBLER__</code> 里", "汇编文件里编译报错", "放在 <code>#ifndef __ASSEMBLER__</code> 段"],
              ["sigalarm 没保存完整 trapframe", "handler 返回后程序状态错乱", "整份拷贝，整份恢复"],
              ["没有重入保护", "栈溢出 / 无限触发", "加 in-handler 标志"],
              ["<code>interval=0</code> 当成「立即」", "疯狂触发", "按手册要求表示关闭"],
              ["只在 handler 里恢复 epc", "其他寄存器被 handler 改掉了", "恢复<b>全部</b>寄存器"],
              ["忘记 <code>usertests -q</code>", "部分测试挂掉", "手册要求 alarmtest <b>和</b> usertests 都过"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Appel & Li（论文 03）</b>：sigalarm 就是 TRAP 原语的雏形；讲义直接把它和 <code>sigaction(SIGSEGV)</code> 对应起来。mmap lab 会用同样的机制处理缺页。",
              "<b>Janus（论文 01）</b>：trapframe 是「内核拥有的用户状态」。Janus 在用户态复刻内核语义之所以难，正是因为它拿不到内核视角的权威状态——而 sigalarm 里你是在内核里直接改，非常容易。这个对比很能说明「边界放在哪」的差别。",
              "<b>Receive Livelock（论文 05）</b>：本 lab 的时钟中断是「中断抢占进程」的最小例子。当中断频率高到进程拿不到 CPU，就是活锁。"
            ] }
          ]
        }
      ]
    },

    /* ============ 组 4 ============ */
    {
      name: "四、并发：从「正确」到「快」",
      desc: "lock lab 是整门课最能体现「OS 设计 = 数据结构设计」的一个实验。",
      items: [
        {
          id: "lab-lock", no: "L6", short: "lock：并行化与读写锁",
          title: "Lab: Parallelism / Locking",
          subtitle: "设计目的：教你用「量化 → 重构数据结构 → 再量化」的方法提高并行度，并亲手实现一个读多写少的锁，体会它的性能陷阱。",
          meta: [["分支", "lock"], ["必读", "xv6 book Ch.7 + §3.5"], ["任务", "kalloc per-CPU freelist / rwspinlock"], ["难度", "★★★"]],
          tags: ["并发|rose", "锁|rose", "可扩展性|rose"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① 锁保护的是「数据」还是「代码」", open: true, blocks: [
              { t: "p", html: "<b>锁保护的是数据（不变量），不是代码。</b>这是并发编程最容易搞错的一点。同一个函数在操作不同数据对象时，可以并发执行——只要它们各自持有各自对象的锁。" },
              { t: "p", html: "由此直接推出并行化的第一条思路：<b>把「一个大对象 + 一把大锁」拆成「很多小对象 + 每对象一把锁」</b>。" }
            ] },
            { t: "acc", title: "② 竞争（contention）是可以测量的，不要靠猜", open: false, blocks: [
              { t: "p", html: "<code>kalloctest</code> 输出里的 <code>#test-and-set</code> 是 <code>acquire()</code> 里自旋循环<b>尝试但失败</b>的次数，<code>#acquire()</code> 是总调用次数。前者越大，说明越多 CPU 时间在空转。" },
              { t: "note", kind: "ok", title: "方法论价值", html: "这个 lab 最重要的一条可迁移技能：<b>先测量，再优化，优化后再测量。</b>不要凭直觉改并发代码——直觉在多核下经常是错的（正如 RCU 论文 Figure 8 显示的：读写锁可能比自旋锁还慢）。" },
              { t: "p", html: "手册还特意提醒：<b>必须在一台空闲的多核机器上跑</b>，否则数字没有意义。这本身也是实验方法的一部分。" }
            ] },
            { t: "acc", title: "③ per-CPU 数据：消除共享，而不是减少临界区", open: false, blocks: [
              { t: "p", html: "这是比「减小锁粒度」更彻底的一步：<b>如果每个 CPU 操作自己的那份数据，就根本不需要锁</b>（对常见路径而言）。" },
              { t: "p", html: "代价是必须处理「某个 CPU 的数据用完了」的情况——于是需要<b>窃取（stealing）</b>。而且 per-CPU 结构打破了「所有内存一视同仁」的假设：分配出去的内存不再能任意从一个 CPU 的链表上回收（xv6 里 free 可以回到任意 CPU 的链表，这是允许的）。" }
            ] },
            { t: "h", text: "② 设计目的与方案" },
            { t: "viz", id: "lockcontention", cap: "改造前：所有 CPU 抢同一条空闲链表；改造后：每 CPU 一条链表 + 各自的锁，仅在链表空时才跨 CPU 窃取" },
            { t: "viz", id: "lockgranularity", cap: "并行化的四档阶梯：本 lab 走的是「按对象拆锁 → 每 CPU 一份」这一段" },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "Part A：kalloc 的 per-CPU freelist", open: true, blocks: [
              { t: "steps", items: [
                { h: "把 kmem 改成数组", p: "<code>struct { struct spinlock lock; struct run *freelist; } kmem[NCPU];</code>" },
                { h: "初始化时给当前 CPU", p: "手册提示：<code>freerange</code> 把全部空闲内存交给<b>正在执行 freerange 的那个 CPU</b>（启动时是 CPU0）。" },
                { h: "kalloc 用自己 CPU 的链表", p: "先关中断（<code>push_off</code>）→ <code>cpuid()</code> → 拿该 CPU 的锁 → 取页 → 放锁 → 开中断（<code>pop_off</code>）。" },
                { h: "链表为空时窃取", p: "遍历其他 CPU 的链表，<b>一次搬一批</b>（而不是一页）到自己链表上，减少未来再次窃取的次数。" }
              ] },
              { t: "note", kind: "danger", title: "为什么必须关中断才能调 cpuid()", html: "<code>cpuid()</code> 返回当前核的编号（存在 <code>tp</code> 寄存器里）。如果在读它之后、用它索引数组之前发生了<b>时钟中断并且进程被迁移到另一个核</b>，那么「读到的 CPU 号」和「实际所在的核」就不一致了——你会去操作错误的链表。<br><br>所以用 <code>push_off()</code> / <code>pop_off()</code> 关中断，保证这段代码不会被抢占迁移。<b>这是 xv6 里一个反复出现的模式。</b>" },
              { t: "note", kind: "warn", title: "窃取时的死锁风险", html: "窃取需要<b>同时持有两把锁</b>（自己的 + 目标的）。如果有两个 CPU 同时互相窃取，就可能死锁。<br><br>xv6 里最简单的规避方式是<b>严格按 CPU 编号顺序拿锁</b>（锁排序，lock ordering）——这是并发编程里最经典的死锁预防技术。<br><br>另外一个更简单的选择是：窃取时<b>先释放自己的锁</b>再拿目标的锁（因为此刻自己链表是空的，不需要保护）。" },
              { t: "p", html: "测试要求：<b>所有锁名必须以 “kmem” 开头</b>（grading 脚本靠名字统计竞争）。另外要跑 <code>usertests sbrkmuch</code> 确认「仍能分配全部内存」——这是 per-CPU 方案最容易出的功能退化（所有页都集中在某个 CPU 上）。" }
            ] },
            { t: "acc", title: "Part B：读写自旋锁（rwspinlock）", open: false, blocks: [
              { t: "p", html: "动机：xv6 的 <code>sys_pause</code> 和 <code>sys_uptime</code> 只是<b>读</b>全局的 <code>ticks</code>，却因为 <code>clockintr</code> 会并发写，必须拿 <code>tickslock</code>。这把锁同时阻止了<b>多个读者并发读</b>——而那本来是安全的。" },
              { t: "p", html: "API：<code>initrwlock / read_acquire / read_release / write_acquire / write_release</code>。语义：要么一个写者（无读者无其他写者），要么多个读者（无写者）。" },
              { t: "note", kind: "danger", title: "两个硬性要求（这正是难点）", html: "<b>① 读侧必须 wait-free</b>：手册明确说 <code>read_acquire</code> <b>绝不能等待</b>另一个正在持有/获取/释放读锁的 CPU。这意味着<b>你不能用自旋锁来实现它</b>——自旋锁的本质就是等待。必须直接用原子操作（<code>__sync_fetch_and_add</code> / CAS 之类）。<br><br><b>② 写者不能被饿死</b>：如果有写者在等待，<b>新的读者必须让路</b>。否则读者源源不断，计数永远不归零，写者永远进不来。" },
              { t: "p", html: "一个可行的设计（用位区分）：" },
              { t: "code", text: "// rwspinlock->n 的低位存读者数，最高位（0x80000000）表示「有写者活跃」\n// read_acquire: CAS 循环，n+1；若发现写者位被置则等待（但不能等别的读者！）\n// write_acquire: 先置「有写者等待/活跃」标志，再等读者数归零\n// 关键：读侧只做原子自增/自减，不做任何「等别人」的操作" },
              { t: "note", kind: "purple", title: "做完之后，请去读 RCU 论文 Figure 8", html: "你会发现一个反直觉的事实：<b>在 4 核上并发读同一个链表时，这样的读写锁可能比朴素自旋锁还慢。</b><br><br>原因是读侧仍然要<b>原子地改一个共享计数器</b>——那条 cacheline 在 4 个核之间来回搬运（cacheline ping-pong）。<b>「允许并发读」不等于「可扩展」。</b><br><br>RCU 的解法是让读侧<b>完全不写共享内存</b>。这就是从本 lab 到论文 07 的完整逻辑链。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["<code>cpuid()</code> 没关中断", "进程被迁移后操作了错误的链表", "用 <code>push_off/pop_off</code>"],
              ["锁名不以 kmem 开头", "grading 统计不到 → 判定失败", "<code>initlock(&kmem[i].lock, \"kmem\")</code>"],
              ["窃取时锁顺序不一致", "死锁（两个 CPU 互相等）", "按 CPU 编号排序，或先释放自己的锁"],
              ["一次只偷一页", "仍频繁跨 CPU，竞争没降下来", "一次搬一批"],
              ["rwlock 读侧用了自旋锁", "违反 wait-free 要求，测试失败", "只用原子操作"],
              ["没实现写者优先", "写者饥饿，step 6/12 测试失败", "有等待写者时新读者阻塞"],
              ["改了数据结构但没改所有调用点", "访问了未初始化的链表", "检查 freerange / kinit / kfree 全路径"],
              ["在单核或负载高的机器上测", "数字毫无意义，误判成败", "手册要求：空闲的多核机器"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>RCU（论文 07）</b>：直接对应。rwlock 部分的动机（读多写少）就是 RCU 的起点，而论文 Figure 8 揭示了本方案的局限。讲义里那段 4 核实测数据（rwlock 比 spinlock 慢）是本 lab 最好的「课后作业」。",
              "<b>Shenango（论文 06）</b>：kalloc 的 per-CPU + 窃取，和 Shenango 的「核按微秒级需求在应用间流动」是<b>同一个设计模式</b>：把独占资源改成共享 + 快速重分配。",
              "<b>Receive Livelock（论文 05）</b>：<code>kalloctest</code> 里 <code>wait_lock</code> 的巨大 <code>#test-and-set</code>（讲义示例里达到千万级）就是「CPU 全在空转」的活锁前兆。"
            ] }
          ]
        },
        {
          id: "lab-net", no: "L7", short: "net：网卡驱动",
          title: "Lab: Network driver（Tulip / DEC 21143）",
          subtitle: "设计目的：让你写一个真实的 DMA 环形描述符设备驱动，理解「CPU 与设备并行工作」的整套协议，以及内核里网络协议栈是怎么接上去的。",
          meta: [["分支", "net"], ["必读", "xv6 book Ch.6（中断与设备驱动）+ Tulip 硬件手册 §1.1/3.2/4.2/4.3"], ["任务", "tulip_init / 发送 / 接收 + net_rx 补全"], ["难度", "★★★★"]],
          tags: ["设备驱动|amber", "DMA|amber", "网络|amber"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① 设备是怎么和 CPU 说话的：控制寄存器 + 状态寄存器", open: true, blocks: [
              { t: "p", html: "xv6 跑在 QEMU 的 <code>virt</code> 机器上，所有设备都是<b>内存映射 I/O（MMIO）</b>：设备的寄存器被映射成一段物理地址，内核像读写普通内存一样读写它们（没有 x86 的 <code>in/out</code> 端口）。" },
              { t: "p", html: "驱动与设备的交互就是三步：<b>写控制寄存器</b>（告诉它做什么）、<b>读状态寄存器</b>（看它做完了没）、<b>响应中断</b>（它做完了会打断你）。" },
              { t: "note", kind: "warn", title: "MMIO 的两个陷阱", html: "<b>① 不能缓存</b>：MMIO 地址的读写有副作用（读一次可能就清掉一个状态位），所以必须绕过 cache，且<b>编译器不能优化掉</b>（所以要 <code>volatile</code>）。<br><br><b>② 顺序很重要</b>：对同一设备的多次寄存器写必须按顺序到达。RISC-V 有宽松内存序，需要屏障（xv6 在页表里把设备区标记为不可缓存来规避）。" }
            ] },
            { t: "acc", title: "② DMA 与描述符环：设备自己去内存里搬数据", open: false, blocks: [
              { t: "p", html: "如果每个字节都要 CPU 从设备读出来再写进内存，CPU 会被完全占满（这正是 UART 的做法，也是活锁的来源）。现代设备用 <b>DMA</b>：<b>驱动把「缓冲区地址 + 长度」写进内存里的描述符，把描述符数组的地址告诉设备，设备自己用 DMA 去搬</b>。" },
              { t: "p", html: "描述符通常排成<b>环形（ring）</b>，并且<b>每个描述符有一位表示「这一项现在归谁」</b>——驱动准备好后把所有权交给硬件；硬件搬完再把所有权还给驱动。这就是<b>生产者-消费者</b>协议，只不过生产者和消费者分别是 CPU 和一块硬件。" },
              { t: "note", kind: "danger", title: "所有权位是并发正确性的核心", html: "Tulip 的 <b>RDES0 的 OWN 位</b>决定这一项归谁。<b>驱动在写一个描述符之前必须确认 OWN 位已经归还给自己</b>，否则会和设备同时写同一个描述符。<br><br>同理，驱动读完一个描述符后要把 OWN 位<b>交还给硬件</b>，让它能继续用这个槽位。<b>漏掉这一步，设备会在处理完环上一圈之后停下来</b>（因为没有任何槽位归它）——这是本 lab 最典型的「能收几个包然后卡死」bug。" }
            ] },
            { t: "acc", title: "③ 并发：驱动的上半部与下半部", open: false, blocks: [
              { t: "p", html: "驱动代码会在<b>三种上下文</b>里跑，而且它们可能同时在多核上跑：" },
              { t: "ul", items: [
                "<b>进程上下文</b>（系统调用）：应用调用 <code>write()</code> 发一个包 → 走协议栈 → 调用驱动的发送函数；",
                "<b>中断上下文</b>：设备收完包触发中断；",
                "<b>其他 CPU</b>：另一个核上的进程也在发包。"
              ] },
              { t: "p", html: "所以<b>发送路径和接收路径必须分别加锁</b>（通常是两把锁，因为收发是两个独立的环）。锁要覆盖「修改环指针 + 写描述符 + 通知硬件」这整个序列，否则两个核可能拿到同一个描述符槽位。" }
            ] },
            { t: "acc", title: "④ 协议分层与字节序", open: false, blocks: [
              { t: "p", html: "以太网帧 → IP → UDP 是一层层嵌套的头部。内核的 <code>net.c</code> 已经实现了发送方向的封装，你要补全接收方向的解封装。" },
              { t: "note", kind: "warn", title: "字节序（这是必踩的坑）", html: "<b>网络字节序是大端（big-endian）</b>，而 RISC-V 是小端。所有多字节的协议字段（以太网类型、IP 总长度、UDP 端口、IP 地址）在从包里读出来时必须做转换（<code>ntohs</code> / <code>ntohl</code>），写进去时反向转换。<br><br>忘了转换的典型症状：<b>能收到包，但协议类型/端口号看起来是乱七八糟的巨大数字</b>，于是包被静默丢弃。" }
            ] },
            { t: "h", text: "② 设计目的" },
            { t: "p", html: "这个 lab 在课程里的位置很特殊：它是<b>唯一一个「读硬件手册写代码」的实验</b>。它要训练的能力不是算法，而是：" },
            { t: "ul", items: [
              "<b>从硬件手册里提取出你需要的最小信息</b>（手册明确告诉你只看 §1.1/3.2/4.2/4.3，其余忽略）——这是一种真实工程能力；",
              "<b>理解「异步并行」</b>：CPU 和设备是两个独立的执行体，靠内存里的环通信；",
              "<b>理解中断与进程的交接</b>：中断里不能做太重的事，要把数据交给等待的进程（<code>net_rx</code> 最终要唤醒阻塞在 <code>read()</code> 上的 socket）。"
            ] },
            { t: "viz", id: "intrpoll", cap: "设备驱动的两种模型，以及现实中的混合方案。你的 tulip 驱动虽然用描述符环天然带批量，但仍然需要理解这个权衡" },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "Part One：tulip_init — 初始化", open: true, blocks: [
              { t: "steps", items: [
                { h: "定义描述符结构", p: "按手册 Figure 4-2（接收）与 4-7（发送）定义 struct，各含 4 个 <code>unsigned int</code>（RDES0–3 / TDES0–3）。注意<b>硬件要求的是精确的内存布局</b>——不要用编译器可能重排的结构（xv6 里 4 个 uint 是安全的）。" },
                { h: "建描述符数组", p: "全局数组，大小 4 就够（手册说不用 TDES3/RDES3）。" },
                { h: "初始化接收描述符", p: "为每个接收描述符<b>分配一个缓冲区（mbuf）</b>并把地址写进 RDES1/2，然后<b>把 OWN 位交给硬件</b>。" },
                { h: "写 CSR", p: "把接收环和发送环的<b>物理地址</b>写进 CSR3/CSR4，配置 CSR6（工作模式），最后<b>打开接收</b>（CSR6 的 RX 使能位）。" },
                { h: "开中断", p: "配置 CSR5/CSR7 的中断使能位。" }
              ] },
              { t: "note", kind: "danger", title: "地址必须是物理地址", html: "设备做 DMA 时用的是<b>物理地址</b>，它不知道你的内核虚拟地址。所以写进描述符的缓冲区地址必须做 <b>VA → PA 转换</b>（xv6 提供了这类辅助；内核里低地址区是恒等映射，但 mbuf 是 <code>kalloc</code> 出来的，要确认转换方式）。<br><br>另外 xv6 开启分页后设备看到的就是物理内存，不需要 IOMMU —— 真实系统里还要考虑 IOMMU 与安全（防止设备 DMA 到任意内存）。" }
            ] },
            { t: "acc", title: "Part One：发送与接收", open: false, blocks: [
              { t: "p", html: "<b>发送</b>：找一个 OWN 归自己的发送描述符 → 填缓冲区地址与长度 → 设置「首段/末段」标志并<b>把 OWN 交给硬件</b> → 写 CSR1 通知硬件有包要发 → 推进环指针。" },
              { t: "p", html: "<b>接收</b>（中断里）：读 CSR5 确认是接收中断 → 清中断 → 遍历接收描述符，找出 OWN 已归还且状态显示收完的那些 → 把 mbuf 交给协议栈 → <b>为该槽位分配新缓冲并交还 OWN</b> → 推进指针。" },
              { t: "note", kind: "warn", title: "「能收几个包然后就不收了」的三个常见原因", html: "1. <b>没有为新缓冲区交还 OWN 位</b>（最常见）；<br>2. <b>没有清中断状态位</b>（写 CSR5 对应位），于是设备不再产生新中断；<br>3. <b>环指针推进错误</b>（没取模，走到数组外面）。" }
            ] },
            { t: "acc", title: "Part Two：net_rx — 协议栈接收路径", open: false, blocks: [
              { t: "p", html: "<code>net.c</code> 已经给了发送侧的 UDP/IP 封装，你要补全接收侧。大致流程：" },
              { t: "steps", items: [
                { h: "解析以太网头", p: "读类型字段（<b>记得 ntohs</b>），判断是 IP 还是 ARP。" },
                { h: "处理 ARP", p: "如果是 ARP 请求且目标 IP 是自己，构造 ARP 应答发回去（否则对端根本不知道你的 MAC）。" },
                { h: "解析 IP 头", p: "检查版本、协议号（UDP=17）、目的 IP 是否是本机。" },
                { h: "解析 UDP 头", p: "取目的端口，找到对应的 socket。" },
                { h: "交给 socket", p: "把 payload 拷进该 socket 的接收队列，然后<b>唤醒等待在这个 socket 上的进程</b>。" }
              ] },
              { t: "note", kind: "purple", title: "最后一步是「协调」", html: "把数据放进队列之后必须唤醒等待的进程——这就是 <b>Notes 里的 sleep / wakeup</b> 模式（见「协调」一节）。<br><br>而「唤醒」这件事的正确性要求「检查条件」与「进入睡眠」是原子的，否则就是<b>丢失的唤醒</b>。本 lab 让你在真实场景里用一次。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["网络字节序没转换", "能收包但端口/类型是乱码，包被丢", "所有多字节字段 <code>ntohs/ntohl</code>"],
              ["描述符地址用了虚拟地址", "设备 DMA 到错误位置", "转物理地址"],
              ["没交还 OWN 位", "收几个包后停止", "每处理完一项就补缓冲并交还 OWN"],
              ["没清中断状态", "只中断一次", "写 CSR5 清除"],
              ["环指针越界", "内存破坏、行为随机", "取模回绕"],
              ["发送/接收没分别加锁", "多核下环被并发破坏", "两把锁分别保护两个环"],
              ["在中断里做太重的工作", "丢包、系统卡顿", "中断里只搬数据，处理交给下半部/进程"],
              ["忘记 ARP 应答", "对端一直 arp 不到你，包发不出去", "实现 ARP reply"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Receive Livelock（论文 05）</b>：最直接。你的驱动是纯中断驱动的；论文告诉你当输入速率过高时会发生什么，以及为什么需要「中断 + 轮询」混合。课程作业题直接让你把 xv6 的 UART 和论文场景对照。",
              "<b>BPF（论文 09）</b>：如果你要在 xv6 里加包过滤，应该放在哪一层？论文的答案是「尽可能早」。本 lab 的 <code>net_rx</code> 就是那个「早」的位置。",
              "<b>Tales of the Tail / Shenango（论文 06）</b>：本 lab 的收包路径（中断 → 协议栈 → socket → 唤醒进程）每一步都是确定开销，正是尾延迟论文剖析的那条链路。"
            ] }
          ]
        }
      ]
    },

    /* ============ 组 5 ============ */
    {
      name: "五、存储与内存映射：把「持久」和「内存」缝在一起",
      desc: "fs 让你改 on-disk 数据结构并处理崩溃一致性；mmap 让文件系统和虚拟内存相遇。",
      items: [
        {
          id: "lab-fs", no: "L8", short: "fs：大文件与符号链接",
          title: "Lab: File system",
          subtitle: "设计目的：让你读懂一个真实的 on-disk 数据结构（inode），并亲手扩展它；再实现符号链接，从而彻底理解路径解析。",
          meta: [["分支", "fs"], ["必读", "xv6 book Ch.10"], ["任务", "二级间接块（大文件）/ symlink"], ["难度", "★★★"]],
          tags: ["文件系统|green", "崩溃一致性|green", "inode|green"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① inode：文件的「元数据 + 数据块位置」", open: true, blocks: [
              { t: "p", html: "<b>文件名不在 inode 里。</b> inode 只存：类型（文件/目录/设备）、大小、链接数、以及<b>数据块的位置列表</b>。目录是一种特殊文件，内容是一串 <code>(名字, inode 号)</code>。" },
              { t: "p", html: "这个拆分带来 Unix 文件系统的两个特性：<b>硬链接</b>（多个名字指向同一 inode）和 <b>「文件没有名字，名字指向文件」</b>。" }
            ] },
            { t: "acc", title: "② 多级间接块：用「块号的块」扩展容量", open: false, blocks: [
              { t: "viz", id: "inode", cap: "xv6 inode 的 addrs[]：11 直接 + 1 一级间接 + 1 二级间接 = 65803 块" },
              { t: "p", html: "设计思路很朴素：inode 里放不下太多块号（xv6 的 dinode 大小固定），那就<b>拿一个数据块专门来存块号</b>，这就叫间接块。再套一层就是二级间接。" },
              { t: "note", kind: "ok", title: "为什么是「11 而不是 12」", html: "因为 dinode 的大小是固定的（不能改 on-disk 格式），所以为了放二级间接指针，必须<b>牺牲一个直接块号</b>。手册明确说明了这一点。<br><br>这个约束非常有代表性：<b>磁盘格式是一种持久化的 ABI</b>——你改它就得重新格式化。真实文件系统为此发展出了「特性标志 + 向后兼容」的复杂机制。" }
            ] },
            { t: "acc", title: "③ buffer cache：磁盘块的缓存与同步", open: false, blocks: [
              { t: "p", html: "<code>bread()</code> 返回一个<b>被锁住的</b>块缓冲，你用完必须 <code>brelse()</code>。这个「锁」保证了同一时刻只有一个执行流在改这个块。" },
              { t: "note", kind: "warn", title: "手册唯一明确警告的一点", html: "<b>“Don't forget to brelse() each block that you bread().”</b><br><br>buffer cache 的槽位数量固定，漏掉 brelse 会耗尽它，表现为「跑一会儿之后所有磁盘操作卡死」。这类 bug 在测试里往往要跑很久才暴露。" }
            ] },
            { t: "acc", title: "④ 日志（logging）：崩溃一致性", open: false, blocks: [
              { t: "viz", id: "fslayout", cap: "xv6 磁盘布局与预写日志：一次写要落两遍盘，换来崩溃后可重放" },
              { t: "p", html: "一次文件写会修改多个块（inode、bitmap、数据块）。<b>如果在修改一半时断电，文件系统就处于不一致状态</b>（比如 bitmap 说某块已分配但没有任何 inode 指向它）。" },
              { t: "p", html: "xv6 用<b>预写日志（WAL）</b>：先把所有要改的块写进磁盘上的 log 区 → 写 header（这一步是<b>原子提交点</b>）→ 再把块写到真正的位置 → 清空日志。崩溃后重启时，检查 header：如果已提交就重放，否则丢弃。" },
              { t: "note", kind: "purple", title: "三个崩溃时刻", html: "1. <b>写日志途中崩</b> → header 未提交 → 直接丢弃，文件系统保持旧状态（正确）；<br>2. <b>提交后、install 前崩</b> → 重放日志 → 改动生效（正确）；<br>3. <b>install 后、清空前崩</b> → 重放是<b>幂等</b>的 → 无害（正确）。<br><br>这套分析的精髓是：<b>每个可能的崩溃点都要有一个正确的结果</b>，而不是「大多数情况下没问题」。" }
            ] },
            { t: "h", text: "② 设计目的" },
            { t: "ul", items: [
              "<b>大文件</b>：让你亲手改一个 on-disk 数据结构，并被迫想清楚「逻辑块号 → 磁盘块号」的映射。这是理解所有文件系统（ext4、XFS、btrfs、ZFS）的基础；",
              "<b>符号链接</b>：让你彻底理解路径解析（<code>namei</code>）——手册自己说「实现这个系统调用是理解路径名查找如何工作的好练习」。"
            ] },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "Part A：大文件（二级间接块）", open: true, blocks: [
              { t: "p", html: "核心是改 <code>bmap()</code>（<code>kernel/fs.c</code>）。它把<b>逻辑块号</b>（文件内偏移）翻译成<b>磁盘块号</b>。" },
              { t: "steps", items: [
                { h: "改常量", p: "<code>NDIRECT</code> 从 12 改成 11；<code>MAXFILE</code> 相应调整。<b>同时要改 <code>struct inode</code> 里的 <code>addrs[]</code> 长度</b>，让它和 <code>struct dinode</code> 保持一致。" },
                { h: "加二级分支", p: "<code>bn &lt; NDIRECT</code> → 直接；<code>bn &lt; NINDIRECT + NDIRECT</code> → 一级间接；否则 → 二级间接。" },
                { h: "二级间接的索引", p: "先算出在二级块里的第几个（<code>(bn - NINDIRECT - NDIRECT) / NINDIRECT</code>），再算出在该间接块里的第几个（<code>% NINDIRECT</code>）。" },
                { h: "改 itrunc", p: "释放文件时要<b>递归释放</b>所有间接块与二级间接块，否则磁盘空间泄漏。" }
              ] },
              { t: "note", kind: "warn", title: "改了 NDIRECT 之后必须重建 fs.img", html: "因为 <code>mkfs</code> 会用 <code>NDIRECT</code> 来构造文件系统镜像。手册明确提醒：<b>“If you change the definition of NDIRECT, make sure to create a new fs.img.”</b><br><br>如果文件系统状态坏了，在<b>宿主机</b>（不是 xv6 里）删掉 <code>fs.img</code>，make 会重新生成一个干净的。" },
              { t: "p", html: "另外手册催你「先画一张图」——画出 addrs[]、间接块、二级间接块、数据块之间的关系。这个建议非常实在：<b>这种嵌套指针结构，靠在脑子里想一定出错</b>。" }
            ] },
            { t: "acc", title: "Part B：符号链接（symlink）", open: false, blocks: [
              { t: "p", html: "实现 <code>symlink(target, path)</code>：创建一个新文件，<b>类型是 T_SYMLINK，内容是目标路径字符串</b>（就存在文件的数据块里）。" },
              { t: "p", html: "然后在 <code>sys_open</code> 里处理跟随：解析路径时如果碰到 T_SYMLINK 且<b>调用方没有指定 O_NOFOLLOW</b>，就把路径替换为链接内容后重新解析。" },
              { t: "note", kind: "warn", title: "corner case", html: "<b>① 递归深度</b>：<code>a → b → a</code> 会无限循环。需要限制跟随次数（真实 Linux 有 <code>ELOOP</code>）。本 lab 说「不需要处理指向目录的符号链接」，但循环风险依然存在。<br><br><b>② 只有 open 需要跟随</b>：手册明确说你不必让所有系统调用都支持符号链接，只需要 <code>open</code>。<br><br><b>③ 硬链接 vs 符号链接</b>：手册给了一个很好的对比——硬链接指向<b>特定 inode</b>，不能跨设备、不能指向目录；符号链接指向<b>一个名字</b>，那个名字当前指什么它就是什么（可能什么都不是）。<br><br><b>④ 符号链接不增加目标 inode 的链接计数</b>——这是它和硬链接最本质的区别。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["只改 <code>dinode</code> 没改 <code>inode</code>", "内核与磁盘结构不一致", "两处 <code>addrs[]</code> 长度必须相同"],
              ["改了 NDIRECT 没重建 fs.img", "文件系统行为诡异", "删 fs.img 重新 make"],
              ["忘了 <code>brelse</code>", "跑到一半卡死（bcache 耗尽）", "每个 bread 配对一个 brelse"],
              ["<code>itrunc</code> 没释放二级间接块", "磁盘空间泄漏，后续写入失败", "递归释放"],
              ["二级索引算错", "大文件内容错乱", "先画索引关系图再写"],
              ["symlink 无限递归", "内核死循环 / 栈溢出", "限制跟随深度"],
              ["symlink 增加了目标链接数", "语义错误（删除行为不对）", "符号链接不影响 nlink"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Janus（论文 01）</b>：符号链接正是「路径解析」复杂性的典型例子——Janus 论文第 ① 类坑就是「光比较字符串不够，因为可能有符号链接」。本 lab 让你亲手实现这个坑。",
              "<b>Superpages（论文 02）</b>：间接块是「用一层索引换取容量」；超级页是「用更少索引换取 TLB 覆盖」。两者都是在调「索引粒度 vs 开销」这个旋钮。",
              "<b>Appel & Li（论文 03）</b>：符号链接的「名字 → 内容」与 MAP2 的「一个物理页两个视图」在精神上相通——都是<b>用一层间接改变语义</b>。"
            ] }
          ]
        },

        {
          id: "lab-mmap", no: "L9", short: "mmap：内存映射文件",
          title: "Lab: mmap",
          subtitle: "设计目的：把「页错误」和「文件系统」缝在一起——这是整门课的集大成实验，也是 Appel & Li 论文思想在 xv6 上的完整落地。",
          meta: [["分支", "mmap"], ["必读", "xv6 book Ch.3/Ch.4/Ch.10；Appel & Li 论文"], ["任务", "VMA 结构 / mmap / 懒加载缺页 / munmap 回写"], ["难度", "★★★★"]],
          tags: ["虚拟内存|teal", "文件系统|green", "集大成|purple"],
          blocks: [
            { t: "h", text: "① 必备 OS 原理" },
            { t: "acc", title: "① VMA：一段「有语义的」地址范围", open: true, blocks: [
              { t: "viz", id: "vma", cap: "进程地址空间里由 mmap 创建的区域（VMA），以及缺页时的懒加载流程" },
              { t: "p", html: "页表只记录了「VA → PA」和权限，它<b>不记录这段地址是什么</b>。而 mmap 需要知道：这块区域属于哪个文件？偏移多少？是 MAP_SHARED 还是 MAP_PRIVATE？" },
              { t: "p", html: "所以内核需要额外一个结构：<b>VMA（virtual memory area）</b>。它在页表之外，描述「这段地址范围的语义」。<b>这是本 lab 最核心的一个概念</b>——手册直接点名了它：" },
              { t: "quote", html: "定义一个与「virtual memory for applications」这堂课里讲的 <b>VMA（虚拟内存区域）</b> 相对应的结构……因为 xv6 内核没有可变大小的内存分配器，声明一个<b>固定大小的 VMA 数组</b>就够了，大小 16 应该够用。", src: "6.1810 mmap lab 手册原文" },
              { t: "note", kind: "purple", title: "为什么「页表之外还需要 VMA」这件事很重要", html: "因为它揭示了一个普遍原则：<b>页表是机制，VMA 是策略/语义。</b>页表说「这个 VA 映射到那个 PA，权限是 RW」；VMA 说「这段 VA 是 <code>fd=3</code> 那个文件从偏移 0 开始的映射，共享的」。<br><br>缺页发生时，内核<b>先查 VMA 决定「该怎么办」，再改页表执行</b>。这个「语义层 + 机制层」的分离，在整个 OS 里反复出现（VFS 与具体文件系统、调度器类与调度策略、netfilter 与协议栈）。" }
            ] },
            { t: "acc", title: "② 懒加载：为什么 mmap 不能立刻读文件", open: false, blocks: [
              { t: "p", html: "手册明确要求：<b>mmap 本身不分配物理内存、不读文件</b>，一切推迟到缺页时。" },
              { t: "p", html: "两个理由：" },
              { t: "ol", items: [
                "<b>快</b>：映射一个 1 GB 的文件，如果不懒加载，mmap 要读 1 GB 才能返回；",
                "<b>能映射比物理内存更大的文件</b>：懒加载下，只有真正被访问的页才需要驻留。"
              ] },
              { t: "note", kind: "ok", title: "这就是 demand paging 的复用", html: "它和 cow lab 是<b>同一个机制</b>：把 PTE 留空（或不给权限）→ 访问时触发缺页 → 内核在缺页处理里提供页面。<br><br>区别只在于「提供什么」：COW 提供的是一份复制的页，mmap 提供的是从文件读进来的一页。" }
            ] },
            { t: "acc", title: "③ struct file 的引用计数", open: false, blocks: [
              { t: "p", html: "mmap 之后，即使应用 <code>close(fd)</code>，映射也必须继续有效——因为地址空间里还引用着这个文件。<b>所以 mmap 必须 <code>filedup()</code> 增加引用计数</b>，munmap 时再递减。" },
              { t: "note", kind: "warn", title: "这是生命周期管理的经典案例", html: "「资源什么时候释放」不能只看「谁打开了它」，而要看<b>所有引用者的集合</b>。和 COW 的 refcnt、inode 的 nlink 是同一个模式。<br><br>漏掉 filedup 的症状：<code>close</code> 之后访问映射区 → 访问到被释放的 struct file → 数据错乱或崩溃。" }
            ] },
            { t: "h", text: "② 设计目的" },
            { t: "p", html: "这个 lab 是课程的收尾实验，它把前面几乎所有机制组合起来：" },
            { t: "table", head: ["用到的机制", "来自哪个 lab"], rows: [
              ["页表遍历与建立映射（<code>walk</code> / <code>mappages</code>）", "pgtbl"],
              ["页错误处理（在 <code>usertrap</code> 里识别 scause）", "cow"],
              ["读文件数据（<code>readi</code>）与 inode 加锁", "fs"],
              ["权限位、脏位（<code>PTE_D</code>）", "pgtbl（A 位的姊妹概念）"],
              ["进程创建/退出时的资源生命周期", "syscall / cow"]
            ] },
            { t: "h", text: "③ 任务拆解" },
            { t: "acc", title: "步骤 1：定义 VMA 并挂在 proc 上", open: true, blocks: [
              { t: "p", html: "每个 VMA 记录：<code>addr</code>、<code>len</code>、<code>prot</code>（读/写）、<code>flags</code>（SHARED/PRIVATE）、<code>struct file *f</code>、<code>offset</code>。<code>struct proc</code> 里放一个固定大小（16）的数组。" },
              { t: "p", html: "选地址的策略：手册说 <code>addr</code> 总是 0（由内核决定）。常见做法是<b>从高地址往下找</b>（和堆向上增长相反，避免冲突）。" }
            ] },
            { t: "acc", title: "步骤 2：mmap — 只登记，不做事", open: false, blocks: [
              { t: "ul", items: [
                "检查 prot / flags 的合法性（<code>prot</code> 只有 READ/WRITE；<code>flags</code> 只有 SHARED/PRIVATE）；",
                "从 fd 拿到 <code>struct file</code> 并 <code>filedup()</code>；",
                "找一个空闲 VMA 槽位，填好信息，返回起始地址；",
                "<b>不调用 mappages，不 kalloc，不 readi。</b>"
              ] }
            ] },
            { t: "acc", title: "步骤 3：缺页处理 — 真正读盘", open: false, blocks: [
              { t: "steps", items: [
                { h: "识别", p: "在 <code>usertrap</code> 里，<code>scause</code> 为 13/15（load/store page fault）时，取 <code>stval</code> 得到缺页地址。" },
                { h: "查 VMA", p: "遍历该进程的 VMA，判断地址落在哪个区域内。不在任何 VMA 里 → 按原逻辑杀进程。" },
                { h: "分配与读盘", p: "<code>kalloc()</code> 一页 → <b>锁住 inode</b> → <code>readi()</code> 读 4096 字节（偏移 = VMA 的 offset + 页内相对偏移）→ 解锁。" },
                { h: "建映射", p: "<code>mappages()</code>，权限由 <code>prot</code> 决定（读 → PTE_R，写 → PTE_W，都要 PTE_U）。" }
              ] },
              { t: "note", kind: "danger", title: "两个容易翻车的地方", html: "<b>① readi 要求调用者持有 inode 锁</b>。手册明确提示「you will have to lock/unlock the inode passed to readi」。忘了加锁会在并发场景下破坏文件系统（而且 xv6 里会触发断言）。<br><br><b>② 权限必须正确</b>：只读映射就不能给 <code>PTE_W</code>，否则测试里的 “writes to read-only mapped memory” 会失败（它期望看到 <code>scause=0xf</code> 的缺页）。" }
            ] },
            { t: "acc", title: "步骤 4：munmap — 回写与拆除", open: false, blocks: [
              { t: "ul", items: [
                "找到覆盖该地址范围的 VMA；",
                "<b>如果是 MAP_SHARED 且该页被写脏（<code>PTE_D</code>），先把页写回文件</b>（参考 <code>filewrite</code>）；",
                "<code>uvmunmap</code> 拆映射；",
                "如果整个区域都被 unmap 了，<code>fileclose()</code> 递减引用计数。"
              ] },
              { t: "note", kind: "warn", title: "进程退出时也要做", html: "手册明确要求：<b>进程退出时，它对 MAP_SHARED 区域所做的修改应当被写回文件，就像它调用了 munmap 一样。</b><br><br>所以要在 <code>exit()</code> 或 <code>freeproc()</code> 里遍历 VMA 做一遍 munmap。这是最容易漏的一块，而 mmaptest 会测它。" },
              { t: "p", html: "另外：mmaptest 里有一个 <b>fork 测试</b>——子进程应该也看到映射（因为它复制了页表和 VMA 数组）。手册说「映射同一 MAP_SHARED 文件的进程之间不共享物理页也没关系」，所以你<b>不必</b>做真正的共享内存，只要 fork 后映射仍然可用即可。" }
            ] },
            { t: "h", text: "④ 常见坑 / corner case" },
            { t: "table", head: ["坑", "症状", "正确做法"], rows: [
              ["mmap 里就读了文件", "语义错（大文件 mmap 变慢），测试可能仍过但设计错", "只在缺页时读"],
              ["忘了 <code>filedup</code>", "close 之后访问出错", "mmap 增引用，munmap 减引用"],
              ["<code>readi</code> 没锁 inode", "并发下文件系统损坏 / 断言失败", "ilock / iunlock 包住 readi"],
              ["只读映射给了写权限", "“writes to read-only” 测试失败", "按 prot 设置 PTE"],
              ["exit 时没回写 MAP_SHARED", "数据丢失，测试失败", "退出路径里遍历 VMA 做 munmap"],
              ["munmap 只拆页没清 VMA", "VMA 槽位泄漏，16 个很快用完", "整区 unmap 时释放槽位"],
              ["fork 后 VMA 没复制", "子进程访问映射区被杀", "fork 时复制 VMA 数组（并记得 filedup）"]
            ] },
            { t: "h", text: "⑤ 与论文的联系" },
            { t: "ul", items: [
              "<b>Appel & Li（论文 03）</b>：<b>本 lab 是这篇论文在 xv6 上的完整实现。</b>VMA 对应论文需要的元数据，懒加载缺页对应 TRAP 原语，mprotect 式的权限管理对应 PROT/UNPROT。讲义里那张「六个原语 vs 今天 Unix 对应物」的表，正是本 lab 的蓝图。",
              "<b>Superpages（论文 02）</b>：真实内核里 mmap 是 THP 最主要的用武之地——大段的映射正是应该 promote 成超级页的地方，也是最容易因为 munmap 一部分而 demote 的地方。",
              "<b>Meltdown（论文 10）</b>：mmap 让文件内容直接出现在进程地址空间里。如果硬件有缺陷，这扩大了「一次泄漏能拿到什么」的范围。"
            ] },
            { t: "quiz", items: [
              "为什么 mmap 必须懒加载？如果 eager 加载，什么场景下会直接不可用？",
              "VMA 为什么不能只用页表表达？举一个页表里没有、但 mmap 必须要知道的信息。",
              "MAP_SHARED 与 MAP_PRIVATE 在 munmap 时的行为差别是什么？在缺页时的差别呢？"
            ] }
          ]
        }
      ]
    }
  ]
};
