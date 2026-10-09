/* ============================================================
   data-notes.js — Notes 可视化知识点（机制图 + 白话讲解 + corner case）
   ============================================================ */
var NOTES_DATA = {
  groups: [

    /* ============ 组 1 ============ */
    {
      name: "一、操作系统是什么：三个目标与它们之间的矛盾",
      desc: "在读任何机制之前，先把「为什么要有操作系统」和「为什么每个设计都有代价」这两件事想清楚。",
      items: [
        {
          id: "n-osdesign", no: "N01", short: "OS 的三个目标",
          title: "抽象、复用、隔离 —— 以及它们之间永恒的矛盾",
          subtitle: "操作系统所有设计决定的来源：它同时要「好用」「共享」「安全」，而这三者互相拉扯。",
          meta: [["对应讲义", "LEC 1 / LEC 3"], ["难度", "★☆☆"]],
          tags: ["基础|green", "必读|purple"],
          blocks: [
            { t: "viz", id: "oslayers", cap: "内核是硬件之上的一层；系统调用是用户程序唯一能穿过这道墙的地方" },
            { t: "p", html: "操作系统同时在做三件互相拉扯的事，几乎所有设计取舍都来自这三者之间的张力。" },
            { t: "ol", items: [
              "<b>抽象</b>：把 messy 的硬件包装成好用的概念（CPU→进程，内存→地址空间，磁盘→文件，网卡→socket）。",
              "<b>复用</b>：让多个程序同时使用一份硬件，且互不察觉（调度、页表、锁）。",
              "<b>隔离</b>：一个程序出错或作恶，不能影响别人（页表、特权级、系统调用）。"
            ] },
            { t: "h", text: "矛盾在哪里" },
            { t: "table", head: ["张力", "一边", "另一边", "例子"], rows: [
              ["抽象强度", "抽象越强越方便", "抽象越强越慢、越不灵活", "微内核论文：exec() 在宏内核里一次系统调用搞定，在 L4 上要多次 IPC"],
              ["隔离强度", "隔离越强越安全", "隔离越强开销越大", "KPTI 修复 Meltdown 带来显著性能损失"],
              ["共享程度", "共享越多越快", "共享越多越容易竞争", "lock lab：共享的 freelist 就是瓶颈"],
              ["硬件优化", "优化越激进越快", "越激进越可能破坏抽象", "Meltdown：乱序执行泄漏了特权数据"]
            ] },
            { t: "note", kind: "purple", title: "这是本门课最重要的一句话", html: "学 OS 不是背概念，而是反复问：<b>这个机制如果不做会怎样？做了又要付出什么代价？</b> 每一节都要同时找到这两半。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "「隔离」常常是顺带实现的，不是刻意设计的", open: false, blocks: [
              { t: "p", html: "xv6 把 TRAMPOLINE 和 TRAPFRAME 放在用户页表里，当初的理由是「切换页表时还要能继续执行」——这是<b>功能性</b>需求。但副作用是它<b>恰好没有</b>把内核数据映射到用户地址空间，从而减少了暴露面。" },
              { t: "p", html: "反过来说：很多安全漏洞来自「为了性能或方便而做的共享」，事后才发现它也打开了通道。Meltdown 的 KPTI 修复恰恰就是<b>去掉</b>这种共享。" }
            ] }
          ]
        },
        {
          id: "n-organization", no: "N02", short: "宏内核 vs 微内核",
          title: "内核应该有多大？",
          subtitle: "这是 OS 领域最著名的架构辩论。讲义的立场是：没有标准答案，只有不同的取舍。",
          meta: [["对应讲义", "LEC 12"], ["配套论文", "L4 微内核（论文 04）"], ["难度", "★★☆"]],
          tags: ["架构|purple", "核心|purple"],
          blocks: [
            { t: "viz", id: "monovsmicro", cap: "宏内核：一个特权大程序；微内核：只留地址空间/线程/IPC，其余搬到用户态服务" },
            { t: "h", text: "宏内核为什么自然会长这么大" },
            { t: "p", html: "因为<b>大抽象需要子系统之间深度协作</b>。Unix 的 <code>exec()</code> 需要同时操作进程、内存、文件三个子系统；在宏内核里这只是函数调用，所以实现起来很容易，也很快。子系统之间<b>没有边界</b>，也就没有开销。" },
            { t: "h", text: "那它的问题是什么" },
            { t: "ul", items: [
              "<b>大 ⇒ 复杂 ⇒ 可能有 bug</b>：Linux 几千万行，无法完整验证；",
              "<b>过度通用 ⇒ 可能很慢</b>：讲义问了个好问题——「用 UNIX pipe 发送一个字节，要执行多少代码？」（缓冲、锁、睡眠唤醒、调度器）；",
              "<b>大抽象会强制一堆设计决定</b>：也许我想 wait 一个不是我子进程的任务？也许数据库比内核更懂怎么在磁盘上排 B 树？在宏内核里你只能接受内核给你的那一套。"
            ] },
            { t: "h", text: "微内核想换什么" },
            { t: "p", html: "微内核的口号是「<b>内核尽可能小</b>」，做法是把大部分 OS 功能搬到用户态服务进程。内核只提供：地址空间、线程、IPC、ID。" },
            { t: "table", head: ["维度", "宏内核（xv6 / Linux）", "微内核（L4 / seL4）"], rows: [
              ["协作成本", "函数调用（纳秒）", "IPC（微秒）"],
              ["故障域", "一个驱动崩 = 整机崩", "驱动是用户进程，可单独重启"],
              ["可验证性", "千万行，无法完整验证", "万行级，seL4 已形式化验证"],
              ["定制/扩展", "改内核或加模块", "换一个用户态服务"],
              ["优化空间", "子系统可深度协同（零拷贝等）", "跨边界协同困难"],
              ["适用", "通用服务器、桌面", "安全关键、虚拟化、嵌入式"]
            ] },
            { t: "note", kind: "warn", title: "不要只记住「微内核慢」", html: "L4 论文用实测修正了这个印象：<b>微内核本身不慢，慢的是「在微内核上模拟宏内核 API」</b>。整体开销可以做到几个百分点，但<b>集中在跨地址空间的操作上</b>（fork/exec、mmap、pipe 传输）。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "「把驱动移出内核」听起来完美，但会带来新问题", open: false, blocks: [
              { t: "p", html: "驱动在用户态之后，它访问硬件需要<b>特权</b>、访问其他服务的内存需要<b>授权</b>、中断要<b>转发</b>而不是直接处理。这些都要通过 IPC 与内核协商，于是又引入新的开销和新的故障模式（比如驱动服务挂了，谁来重启它？它持有的设备状态怎么恢复？）。" },
              { t: "p", html: "这正是「把代码移出内核」不能自动等于「更安全/更可靠」的原因——<b>可靠性取决于故障域和恢复机制，不只是位置</b>。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 2 ============ */
    {
      name: "二、控制权：用户态与内核态之间怎么来回",
      desc: "trap 是 OS 的「心跳」。这一组讲清一次系统调用的完整路径、栈帧的物理形态，以及线程切换到底换了什么。",
      items: [
        {
          id: "n-syscall", no: "N03", short: "系统调用与 trap",
          title: "一次 write() 究竟经过了多少地方",
          subtitle: "trap 分三类（系统调用、中断、异常），xv6 用同一条路径处理它们，靠 scause 区分。",
          meta: [["对应讲义", "LEC 6"], ["配套", "syscall lab / traps lab"], ["难度", "★★☆"]],
          tags: ["陷阱|purple", "核心|purple"],
          blocks: [
            { t: "viz", id: "trapflow", cap: "用户态 → ecall → trampoline → usertrap → syscall() 分发 → 实现函数 → 原路返回" },
            { t: "h", text: "三个必须记住的事实" },
            { t: "ol", items: [
              "<b>切换特权级，但不切换页表</b>：<code>ecall</code> 只把 CPU 从 U mode 切到 S mode，<code>satp</code>（页表基址）<b>不变</b>。内核的代码和数据本来就在同一张页表里（U 位为 0，所以用户访问不到）。",
              "<b>寄存器必须先存起来</b>：因为内核要用同一套寄存器干活。存哪里？存进 <code>trapframe</code>——一页被映射在固定虚拟地址的普通内存。",
              "<b>返回时整个状态被恢复</b>：改 <code>trapframe</code> 就等于改「返回后程序看到的世界」。这也是 sigalarm / 信号 / 调试器 / 检查点恢复的原理。"
            ] },
            { t: "h", text: "scause 速查（RISC-V）" },
            { t: "table", head: ["scause", "含义", "xv6 里的处理"], rows: [
              ["<b>8</b>", "来自 U mode 的 <code>ecall</code>（系统调用）", "<code>syscall()</code> 分发"],
              ["<b>12</b>", "取指缺页", "杀进程（或 COW/mmap 处理）"],
              ["<b>13</b>", "读（load）缺页", "<code>vmfault()</code>"],
              ["<b>15</b>", "写（store）缺页", "<code>vmfault()</code>：COW 复制 / mmap 读盘"],
              ["<b>≥ 2<sup>63</sup></b>（最高位为 1）", "<b>中断</b>（不是异常）", "<code>devintr()</code>：时钟 / UART / 磁盘 / 网卡"]
            ] },
            { t: "note", kind: "purple", title: "判断陷阱类型的方法", html: "看 <code>scause</code> 的<b>最高位</b>：<b>0 = 异常（同步，由指令触发）</b>，<b>1 = 中断（异步，由设备触发）</b>。<br><br>这个区分很重要，因为异常是<b>可重现的</b>（同一条指令一定会再发生），而中断是<b>随机插入的</b>——后者才是并发 bug 的来源。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "① 内核不能随便解引用用户传来的指针", open: true, blocks: [
              { t: "p", html: "用户说「我的缓冲区在地址 0x1234」，内核不能直接 <code>*(char*)0x1234</code>。原因有两个：" },
              { t: "ul", items: [
                "<b>它可能根本没映射</b> → 内核自己触发缺页 → panic（syscall lab 里就让你故意试一次，看 <code>scause=0xd</code>）；",
                "<b>更阴险的是 double fetch</b>：内核读了这个地址两次，中间另一个线程改掉了它。第一次读到的「长度」和第二次读到的「内容」对不上 → 安全漏洞。这就是 <b>TOCTOU</b>，也正是 Janus 论文踩的坑。"
              ] },
              { t: "p", html: "正确做法：用 <code>argstr</code> / <code>copyin</code> <b>把数据拷进内核缓冲区</b>，之后只用副本。" }
            ] },
            { t: "acc", title: "② 持有锁时被中断会死锁", open: false, blocks: [
              { t: "p", html: "如果在持有 <code>lk</code> 时被时钟中断打断，中断处理又试图获取 <code>lk</code>，它永远等不到（因为要等自己释放）。" },
              { t: "p", html: "xv6 的处理：<code>usertrap</code> / <code>kerneltrap</code> 在陷入时关中断，返回时恢复。这就是为什么锁的实现里有 <code>push_off/pop_off</code> 这套机制。" }
            ] }
          ]
        },
        {
          id: "n-stack", no: "N04", short: "栈帧与 backtrace",
          title: "调用栈不是抽象，是内存里真实存在的一条链",
          subtitle: "理解栈帧布局，你才能看懂 gdb 的 backtrace，也才能自己实现它。",
          meta: [["对应讲义", "LEC 2"], ["配套", "traps lab"], ["难度", "★★☆"]],
          tags: ["基础|green", "调试|amber"],
          blocks: [
            { t: "viz", id: "stackframe", cap: "每个栈帧在 fp-8 存返回地址、fp-16 存调用者的 fp —— 于是栈帧串成链表" },
            { t: "p", html: "RISC-V 里 <code>s0</code>（也叫 fp）指向当前栈帧。只要知道两个固定偏移，就能沿着调用链一路往上走：" },
            { t: "ul", items: [
              "<code>*(fp - 8)</code> = 返回地址 <code>ra</code>",
              "<code>*(fp - 16)</code> = 调用者的 <code>fp</code>"
            ] },
            { t: "h", text: "为什么能知道走到头了" },
            { t: "p", html: "因为 <b>xv6 的每个内核栈恰好是一页，且页对齐</b>。所以判断 <code>PGROUNDDOWN(fp)</code> 是否还等于当前栈所在页，就能知道是否越界。" },
            { t: "note", kind: "warn", title: "为什么内核栈不能动态增长", html: "用户栈可以靠缺页按需扩展；<b>内核栈不行</b>——因为内核没有安全的「处理自己栈缺页」的方式（处理缺页本身又要压栈）。<br><br>所以内核栈溢出是<b>灾难性</b>的：它会静默破坏相邻内存。真实内核的对策除了固定大小，还有 vmalloc 栈、栈溢出检测（stack canary / guard page）。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "编译器优化会让 backtrace 不准", open: false, blocks: [
              { t: "p", html: "<b>帧指针省略（-fomit-frame-pointer）</b>：优化编译时会把 <code>s0</code> 当普通寄存器用，栈帧链就断了。xv6 的 Makefile 里显式加了 <code>-fno-omit-frame-pointer</code> 正是为此。" },
              { t: "p", html: "<b>内联</b>：小函数被内联后根本没有自己的栈帧，backtrace 里看不到它（traps lab 的汇编题专门问了这一点）。" }
            ] }
          ]
        },
        {
          id: "n-swtch", no: "N05", short: "线程切换",
          title: "swtch 到底换了什么（以及没换什么）",
          subtitle: "「上下文切换」这个词被用得很泛。xv6 里的 swtch 只做一件事：换寄存器。",
          meta: [["对应讲义", "LEC 13"], ["配套", "xv6 book Ch.7"], ["难度", "★★★"]],
          tags: ["调度|purple", "并发|rose"],
          blocks: [
            { t: "viz", id: "swtch", cap: "swtch 保存当前线程的 ra/sp/callee-saved 到 A->context，从 B->context 恢复；ret 后落到 B 上次切换的下一条指令" },
            { t: "h", text: "换了什么" },
            { t: "p", html: "只换 <b>callee-saved 寄存器 + ra + sp</b>。也就是 <code>struct context</code> 里那十几个字。caller-saved 寄存器不需要保存，因为编译器保证调用者在函数调用后不依赖它们（swtch 本身就是一个函数调用）。" },
            { t: "h", text: "没换什么（同样重要）" },
            { t: "ul", items: [
              "<b>不换页表</b>：切换到别的<b>进程</b>时，页表切换（写 <code>satp</code> + <code>sfence.vma</code>）由 <code>scheduler()</code> 单独完成，不在 swtch 里；",
              "<b>不换特权级</b>：线程切换都在内核态发生；",
              "<b>不做调度决策</b>：swtch 是「机制」，谁该运行是「策略」（ scheduler 的循环）。"
            ] },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "① 新进程第一次运行时 ra 指向哪", open: true, blocks: [
              { t: "p", html: "一个新 fork 出来的进程，从没执行过 swtch，它的 context 里没有「上次切换点」。xv6 的做法是在 <code>allocproc()</code> 里把 <code>ra</code> <b>伪造</b>成 <code>forkret</code> 的地址。" },
              { t: "p", html: "于是调度器 swtch 到它、执行 <code>ret</code> 时，就「返回」到了 <code>forkret</code> ——这是内核线程的入口。<b>用「返回」来「进入」一个新线程</b>，是很优雅的技巧。" }
            ] },
            { t: "acc", title: "② 锁的交接：为什么 scheduler 要持有 p->lock", open: false, blocks: [
              { t: "p", html: "如果进程刚被标记 RUNNABLE、还没真正停下，就可能被另一个核的 scheduler 捡起来同时运行——于是两个核用同一个内核栈，灾难。" },
              { t: "p", html: "xv6 的约定：<b>swtch 时持有 <code>p-&gt;lock</code>，由切换的目标方释放</b>。这个「锁跨越上下文切换交接」的模式很反直觉，但它保证进程状态不会同时被两个核看见。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 3 ============ */
    {
      name: "三、虚拟内存：一层可以被编程的间接",
      desc: "页表是 OS 最重要的机制。这一组讲清地址翻译、xv6 的地址空间布局，以及「RAM 当磁盘缓存」的换页模型。",
      items: [
        {
          id: "n-pagetable", no: "N06", short: "页表与地址翻译",
          title: "页表是「内核写、硬件读」的一份契约",
          subtitle: "理解这一点的直接推论：改了页表必须通知硬件（sfence.vma），而且有些位是硬件写的。",
          meta: [["对应讲义", "LEC 4"], ["配套", "pgtbl lab"], ["难度", "★★★"]],
          tags: ["虚拟内存|teal", "核心|purple"],
          blocks: [
            { t: "viz", id: "sv39", cap: "Sv39：39 位虚拟地址拆成 9-9-9-12，三级页表逐级查找；PTE 里的标志位决定权限与状态" },
            { t: "h", text: "三个关键性质" },
            { t: "ol", items: [
              "<b>格式由硬件规定</b>：你不能自定义 PTE 布局，必须按 RISC-V 特权手册来。这是为什么 pgtbl lab 要求你去查手册定义 <code>PTE_A</code>。",
              "<b>硬件会写一部分位</b>：<code>PTE_A</code>（accessed）和 <code>PTE_D</code>（dirty）是 MMU 在解析 TLB miss 时<b>自动置位</b>的。内核只能读和清，不能靠自己维护。",
              "<b>硬件会缓存翻译结果</b>：TLB。所以<b>任何页表修改都必须 <code>sfence.vma</code></b>，否则硬件还在用旧翻译。"
            ] },
            { t: "note", kind: "danger", title: "最容易犯的错误", html: "<b>改了 PTE 却忘了 sfence.vma。</b>典型症状非常迷惑：pgaccess 清了 A 位，下次读还是 1；COW 清了 W 位，父进程仍然能写。<br><br>因为 TLB 里缓存的是<b>旧 PTE</b>，硬件不会再去内存里读你改过的那份。" },
            { t: "h", text: "权限位速查" },
            { t: "table", head: ["位", "含义", "典型用法"], rows: [
              ["<b>V</b>", "有效", "无效 PTE 会导致缺页"],
              ["<b>R / W / X</b>", "读 / 写 / 执行", "COW 靠清 W 拦截写；代码段给 R+X 不给 W"],
              ["<b>U</b>", "用户态可访问", "<b>内核映射必须清掉 U</b>，否则用户程序能直接读写内核内存"],
              ["<b>A</b>", "已访问（硬件置位）", "LRU 近似、pgaccess、工作集估计"],
              ["<b>D</b>", "已脏（硬件置位）", "换页时判断是否需要写回；mmap 回写判断"],
              ["<b>G</b>", "全局（TLB 刷新时不清）", "内核映射常用，减少 TLB 失效开销"]
            ] },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "中间层 vs 叶子：怎么区分", open: true, blocks: [
              { t: "p", html: "规则：<b>如果一个 PTE 的 R、W、X 三位全为 0，那么它就是指向下一级页表的指针</b>（即使 V 位为 1）。" },
              { t: "p", html: "这条规则是 <code>freewalk</code> 能正确递归释放页表的前提，也是 pgtbl lab 里 <code>vmprint</code> 判断「要不要继续递归」的依据。手册没说，但你必须知道。" }
            ] },
            { t: "acc", title: "三个地址空间可能看到同一个物理页", open: false, blocks: [
              { t: "p", html: "同一块物理内存可以同时出现在：内核的直接映射区、进程 A 的用户映射、进程 B 的用户映射（COW 或共享内存）。" },
              { t: "p", html: "由此带来两个必答问题：<b>① 什么时候能释放它？</b>（引用计数 → cow lab）；<b>② 如果硬件有 Meltdown 类缺陷，泄漏范围会成倍扩大</b>。" }
            ] }
          ]
        },
        {
          id: "n-addrspace", no: "N07", short: "xv6 地址空间布局",
          title: "用户地址空间和内核地址空间分别长什么样",
          subtitle: "记住这张图，xv6 里所有与地址相关的代码都能对得上号。",
          meta: [["对应讲义", "LEC 4 / LEC 6"], ["配套", "pgtbl / traps lab"], ["难度", "★★☆"]],
          tags: ["虚拟内存|teal", "xv6|amber"],
          blocks: [
            { t: "viz", id: "xv6addrspace", cap: "左：用户地址空间（含 USYSCALL、VMA、TRAPFRAME、TRAMPOLINE）；右：内核地址空间（恒等映射 + MMIO + 内核栈）" },
            { t: "h", text: "两个「同一地址、两边都映射」的特殊页" },
            { t: "vs", a: { title: "TRAMPOLINE", html: "被映射到用户和内核地址空间的<b>同一个虚拟地址</b>。<br><br>原因：<b>切换 <code>satp</code> 的瞬间，当前指令必须仍然有效</b>。放在两边同一地址，切换后就能继续执行下一条指令。<br><br>它里面只有 <code>uservec</code> 和 <code>userret</code> 两段汇编。" }, b: { title: "TRAPFRAME", html: "一页，保存陷入内核时的<b>全部 32 个用户寄存器</b>。<br><br>原因：切完页表后，内核需要一个<b>已知地址</b>来存放刚保存下来的状态。<br><br>它是「可修改的执行状态」——改它的 <code>epc</code> 就能改变返回后从哪执行（sigalarm 的原理）。" } },
            { t: "note", kind: "purple", title: "这个技巧的通用名字", html: "在地址空间里留一个 <b>same-address window</b>。凡是「切换上下文的代码本身不能被切换影响」的地方都需要它：进程切换、虚拟机切换、线程切换都有类似的影子结构。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "内核是「恒等映射」的，所以物理地址 = 虚拟地址", open: false, blocks: [
              { t: "p", html: "xv6 把物理内存直接映射到 <code>0x80000000</code> 之上。这意味着内核里做 VA→PA 转换可以<b>直接加减一个常量</b>，非常方便——但也意味着<b>内核能看见全部物理内存</b>。" },
              { t: "p", html: "这正是 Meltdown 作业题的关键：如果硬件允许越权读，用户程序能偷到的东西等于「内核能看到的一切」——所有进程的页、buffer cache、文件系统日志。" }
            ] },
            { t: "acc", title: "用户页表里也映射了内核的 trampoline，但没映射其他内核内容", open: false, blocks: [
              { t: "p", html: "这是「最小权限」的意外收获。真实 Linux 在 Meltdown 之前会把<b>整个内核</b>映射到用户页表（为了系统调用快），KPTI 修复正是把这个映射去掉了——代价是每次系统调用要多切一次页表 + 刷 TLB。" }
            ] }
          ]
        },
        {
          id: "n-paging", no: "N08", short: "换页：RAM 作为磁盘的缓存",
          title: "虚拟内存最初是为了「程序比内存大」",
          subtitle: "xv6 不做换页，但理解它能让你明白页错误的完整语义，也是 Superpages 论文的上下文。",
          meta: [["对应讲义", "LEC 9"], ["配套", "Superpages 论文"], ["难度", "★★☆"]],
          tags: ["虚拟内存|teal"],
          blocks: [
            { t: "viz", id: "paging", cap: "RAM 只有 2 页、程序要用 4 页：靠缺页按需调入、靠淘汰写回磁盘" },
            { t: "p", html: "核心思想极其简单：<b>把 RAM 当成磁盘的一个 cache</b>。页错误 = cache miss，淘汰 = eviction。" },
            { t: "h", text: "一次缺页的完整流程" },
            { t: "steps", items: [
              { h: "访问未映射的 VA", p: "硬件查页表，PTE 无效 → 触发缺页（scause 13/15），把地址放进 <code>stval</code>。" },
              { h: "内核判断这个访问合法吗", p: "地址属于某个 VMA / 匿名映射区吗？权限对吗？不合法 → 杀进程（这就是「段错误」）。" },
              { h: "找一页物理内存", p: "有空闲页直接用；没有就要<b>淘汰</b>一页——如果那页的 <code>PTE_D</code> 置位（脏），必须先写回磁盘。" },
              { h: "把内容填进去", p: "从文件读（mmap / 代码段）或者清零（匿名内存 / 堆）。" },
              { h: "建 PTE 并返回", p: "重新执行那条指令。用户程序完全不知道发生过什么。" }
            ] },
            { t: "note", kind: "ok", title: "为什么 xv6 不做这个，却仍然要学", html: "因为 xv6 用<b>同一套机制</b>做了别的事：COW、lazy allocation、mmap 懒加载。<b>「缺页 → 内核按需供应」</b>这个模式是通用的，换页只是它的一个应用。<br><br>另外，理解换页是理解 Superpages 论文的前提——那篇论文的整个讨论背景就是「页可能在磁盘上、可能被换出、可能权限不一致」。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "淘汰时如果目标页正在被设备 DMA", open: false, blocks: [
              { t: "p", html: "如果网卡正在往某页 DMA，而内核把它淘汰并分配给别人，就会造成数据破坏。真实内核要靠<b>页锁定（pinning）</b>或引用计数来防止这类页被换出。" },
              { t: "p", html: "这是「换页」与「设备驱动」交叉处的一类经典 bug，也是为什么内核里 <code>get_user_pages</code> 这类接口要非常小心。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 4 ============ */
    {
      name: "四、页错误：把「失败」变成编程工具",
      desc: "这是现代 OS 最重要的思维转变。COW 和 mmap 都是它的一次应用。",
      items: [
        {
          id: "n-pagefault", no: "N09", short: "页错误的四种用法",
          title: "不要杀进程，先问内核「你想让它发生什么」",
          subtitle: "缺页不是错误，是「内核请求服务」的信号。xv6 用它实现了 COW、lazy allocation、mmap。",
          meta: [["对应讲义", "LEC 8"], ["配套", "cow lab / mmap lab"], ["难度", "★★★"]],
          tags: ["页错误|teal", "核心|purple"],
          blocks: [
            { t: "viz", id: "cow", cap: "COW 三阶段：这是「把写操作拦下来，等真需要时再复制」的完整形态" },
            { t: "h", text: "同一个机制的四种用法" },
            { t: "table", head: ["用法", "怎么触发", "内核做什么"], rows: [
              ["<b>按需分配（lazy allocation）</b>", "sbrk 时只登记不分配，首次访问才缺页", "kalloc + 清零 + 建映射"],
              ["<b>写时复制（COW）</b>", "fork 时把父子所有可写页改成只读", "缺页时 kalloc + memmove + 改回可写"],
              ["<b>内存映射文件（mmap）</b>", "mmap 时只建 VMA，首次访问才缺页", "kalloc + readi 读文件 + 建映射"],
              ["<b>换页（demand paging）</b>", "页被换出后 PTE 无效", "从磁盘读回 + 建映射（必要时先淘汰）"]
            ] },
            { t: "p", html: "共同点：<b>先登记「意图」（VMA / 页表权限 / COW 标志），把真正的工作推迟到第一次访问</b>。这就是「按需」原则，也是 Superpages 论文里那条判据（访问过每一页才 promote）的精神来源。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "① 必须能区分「COW 造成的只读」和「本来就是只读」", open: true, blocks: [
              { t: "p", html: "如果不区分，程序写<b>代码段</b>（本来就是只读）时也会被当成 COW，内核会好心地给它复制一份可写副本——于是<b>本该被杀掉的非法写操作静默成功了</b>，安全性被削弱。" },
              { t: "p", html: "解法：用 PTE 里<b>保留给软件的位（RSW）</b>自己打标记。cow lab 手册直接提示了这一点。" }
            ] },
            { t: "acc", title: "② copyout 是「内核代表用户写内存」，不走缺页路径", open: false, blocks: [
              { t: "p", html: "<code>copyout()</code> 是内核直接按虚拟地址翻译后写入。它<b>不会触发用户态缺页</b>，所以遇到 COW 只读页时<b>会直接写进共享的物理页</b>——父子进程看到了对方的私有修改。" },
              { t: "p", html: "这是 cow lab 里最隐蔽的 bug，只在「read() 的缓冲区恰好是 COW 页」时出现。<code>cowtest</code> 的 <b>file</b> 测试就是专门测它的。" }
            ] },
            { t: "acc", title: "③ 引用计数：共享之后「什么时候能释放」变成新问题", open: false, blocks: [
              { t: "p", html: "一旦多个页表指向同一物理页，必须在<b>最后一个引用消失时</b>才释放。早释放 = 数据错乱，晚释放 = 内存泄漏。" },
              { t: "p", html: "cow lab 手册自己点出了它在真实内核里的难度，并引用了 《Patching until the COWs come home》——那篇文章讲的是 Linux 上因 COW 引用计数处理不当导致的一系列<b>可利用的安全漏洞</b>。" }
            ] }
          ]
        },
        {
          id: "n-vma", no: "N10", short: "VMA 与 mmap",
          title: "页表是机制，VMA 是语义",
          subtitle: "页表只说「VA→PA + 权限」，它不知道这段地址属于哪个文件。所以需要额外一层。",
          meta: [["对应讲义", "LEC 10"], ["配套", "mmap lab / Appel & Li 论文"], ["难度", "★★★"]],
          tags: ["虚拟内存|teal", "mmap|teal"],
          blocks: [
            { t: "viz", id: "vma", cap: "VMA 表记录每段映射的语义；缺页时先查 VMA 决定「怎么办」，再改页表执行" },
            { t: "p", html: "这个分离很重要，值得单独记：<b>页表是机制（mechanism），VMA 是策略/语义（policy）</b>。" },
            { t: "ul", items: [
              "页表说：这个 VA 映射到那个 PA，权限是 RW；",
              "VMA 说：这段 VA 是 <code>fd=3</code> 那个文件从偏移 0 开始的映射，MAP_SHARED。"
            ] },
            { t: "p", html: "缺页发生时，内核<b>先查 VMA 决定该怎么办，再改页表去执行</b>。这种「语义层 + 机制层」的分离在 OS 里反复出现：VFS 与具体文件系统、调度器类与调度策略、netfilter 与协议栈。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "① struct file 的引用计数", open: true, blocks: [
              { t: "p", html: "mmap 之后即使应用 <code>close(fd)</code>，映射也必须继续有效。所以 mmap 要 <code>filedup()</code>，munmap 时递减。" },
              { t: "p", html: "这和 COW 的 refcnt、inode 的 nlink 是同一个模式：<b>资源何时释放，取决于所有引用者的集合，而不只是「谁打开了它」</b>。" }
            ] },
            { t: "acc", title: "② 进程退出时也要回写 MAP_SHARED", open: false, blocks: [
              { t: "p", html: "手册明确要求：进程退出时，它对 MAP_SHARED 区域的修改应当被写回，<b>就像它调用了 munmap 一样</b>。" },
              { t: "p", html: "这是最容易漏的一块。漏掉的症状是「程序修改了映射文件然后退出，文件内容没变」。" }
            ] },
            { t: "acc", title: "③ 只读映射不能给写权限", open: false, blocks: [
              { t: "p", html: "mmaptest 有一项专门测「往只读映射里写」，它<b>期望看到缺页并被杀</b>（输出里会出现 <code>scause=0xf</code>）。如果你给了 <code>PTE_W</code>，测试就会失败。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 5 ============ */
    {
      name: "五、并发：正确性、性能与那些「看起来对」的 bug",
      desc: "这一组覆盖锁的粒度阶梯、协调（sleep/wakeup）的经典陷阱，以及死锁的预防。",
      items: [
        {
          id: "n-lock", no: "N11", short: "锁的粒度阶梯",
          title: "并行化不是换锁，是换数据结构",
          subtitle: "从一把大锁到无锁，每一档都在用「少一点共享」换「多一点并行」。",
          meta: [["对应讲义", "LEC 5 / LEC 20"], ["配套", "lock lab"], ["难度", "★★★"]],
          tags: ["并发|rose", "核心|purple"],
          blocks: [
            { t: "viz", id: "lockgranularity", cap: "四档阶梯：粗锁 → 按对象拆锁 → 每 CPU 一份 → 无锁/RCU" },
            { t: "h", text: "第一条原则：锁保护的是数据，不是代码" },
            { t: "p", html: "同一个函数操作<b>不同对象</b>时可以并发——只要它们各自持有各自对象的锁。由此直接推出并行化的第一步：<b>把「一个大对象 + 一把大锁」拆成「很多小对象 + 每对象一把锁」</b>。" },
            { t: "h", text: "第二条原则：竞争要测量，不要猜" },
            { t: "p", html: "<code>kalloctest</code> 输出的 <code>#test-and-set</code> 是自旋失败次数。<b>先测量 → 重构 → 再测量。</b>" },
            { t: "note", kind: "danger", title: "直觉在多核下经常是错的", html: "最典型例子：读写锁「允许并发读」听起来一定比自旋锁快，但 RCU 论文的实测显示 <b>4 核并发读同一个链表时，读写锁反而更慢</b>。<br><br>因为读侧仍要<b>原子地改共享计数器</b> → 那条 cacheline 在 4 个核之间来回搬运。<b>「允许并发读」不等于「可扩展」。</b>" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "① per-CPU 数据要求关中断才能用 cpuid()", open: true, blocks: [
              { t: "p", html: "读到 CPU 编号之后、用它索引数组之前，如果发生时钟中断并把进程迁移到另一个核，那么「读到的 CPU 号」和「实际所在的核」就不一致 → 操作了错误的链表。" },
              { t: "p", html: "所以用 <code>push_off()</code> / <code>pop_off()</code> 关中断。这是 xv6 里反复出现的模式。" }
            ] },
            { t: "acc", title: "② 窃取（stealing）会带来跨 CPU 的锁顺序问题", open: false, blocks: [
              { t: "p", html: "窃取需要同时持有两把锁。两个 CPU 互相窃取就会死锁。<br>解法有两种：<b>按 CPU 编号严格排序拿锁</b>（lock ordering），或者<b>窃取前先释放自己的锁</b>（因为此刻自己链表是空的，不需要保护）。" }
            ] }
          ]
        },
        {
          id: "n-sleepwake", no: "N12", short: "协调与「丢失的唤醒」",
          title: "sleep(chan, lk)：为什么必须带着锁睡",
          subtitle: "「丢失的唤醒」是并发里最经典的 bug 之一，也是理解 xv6 sleep/wakeup 的关键。",
          meta: [["对应讲义", "LEC 14"], ["配套", "net lab"], ["难度", "★★★"]],
          tags: ["并发|rose", "经典坑|amber"],
          blocks: [
            { t: "viz", id: "sleepwake", cap: "错误写法在「释放锁」和「进入睡眠」之间开了一个窗口，wakeup 落进窗口就永久丢失" },
            { t: "p", html: "问题的本质：<b>「检查条件」与「进入睡眠」必须是原子的</b>。否则在两者之间，另一个 CPU 可能放好数据并发了 wakeup——但此时还没人睡着，这个唤醒就<b>永久丢失</b>了。" },
            { t: "p", html: "xv6 的解法是把锁交给 <code>sleep</code>：<code>sleep(chan, &lk)</code> 会<b>原子地</b>「把自己标为 SLEEPING」+「释放 lk」。这样一来：" },
            { t: "ul", items: [
              "wakeup 要么在我睡着<b>之前</b>发生（那时我还持有锁，它得等我放锁，我放锁后立刻睡，它会看到 SLEEPING 状态）；",
              "要么在我睡着<b>之后</b>发生（正常唤醒）。"
            ] },
            { t: "note", kind: "warn", title: "调用 wakeup 时必须持有锁吗", html: "严格说<b>不是必须</b>——只要能防止与 sleep 交错即可。但 xv6 通常持有被等待的锁，这是最省心的做法。<br><br>真正的铁律是：<b>修改「被等待的条件」时必须在锁的保护下进行</b>，否则 sleep 方看到的条件本身就是脏的。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "为什么要用 while 而不是 if 来等待条件", open: true, blocks: [
              { t: "p", html: "<b>虚假唤醒（spurious wakeup）</b>：<code>wakeup(chan)</code> 会唤醒<b>所有</b>睡在这个 chan 上的进程。第一个被唤醒的拿走了数据，后面的发现条件又不满足了。" },
              { t: "p", html: "所以正确写法永远是 <code>while (条件不满足) sleep(chan, &lk);</code> 而不是 <code>if</code>。这是所有条件变量的标准写法。" }
            ] },
            { t: "acc", title: "唤醒丢失的另一种形式：chan 选错", open: false, blocks: [
              { t: "p", html: "<code>sleep</code> 和 <code>wakeup</code> 必须<b>用同一个 chan</b>。如果用「进程指针」当 chan，那就只能唤醒特定进程；如果用「缓冲区编号」当 chan，就能唤醒所有等这块盘的进程。" },
              { t: "p", html: "选 chan 本质是<b>选择唤醒粒度</b>——选粗了会惊群（thundering herd），选细了会漏唤醒。xv6 的磁盘驱动用的是「磁盘块号」，正好匹配「等同一块」的语义。" }
            ] }
          ]
        },
        {
          id: "n-deadlock", no: "N13", short: "死锁与锁排序",
          title: "四种必要条件，一种通用解法",
          subtitle: "死锁不是玄学，它有明确的产生条件，也因此有明确的预防方法。",
          meta: [["对应讲义", "LEC 5"], ["难度", "★★☆"]],
          tags: ["并发|rose"],
          blocks: [
            { t: "p", html: "死锁的四个必要条件（缺一不可）：" },
            { t: "ol", items: [
              "<b>互斥</b>：资源同时只能被一个持有者使用；",
              "<b>持有并等待</b>：持有一把锁的同时去等另一把；",
              "<b>不可抢占</b>：不能强行把锁从别人手里抢过来；",
              "<b>循环等待</b>：A 等 B，B 等 C，C 等 A。"
            ] },
            { t: "p", html: "实践中<b>最有效</b>的破解点是第 4 条：<b>给所有锁定一个全局顺序，永远按这个顺序获取</b>。这样就不可能形成环。" },
            { t: "table", head: ["策略", "做法", "代价"], rows: [
              ["<b>锁排序（最常用）</b>", "定义全局锁层次，只能按序获取", "要维护层次文档；复杂系统难保证"],
              ["<b>一次性获取全部</b>", "先把所有需要的锁一次拿下", "降低并发度，且要知道需要哪些"],
              ["<b>trylock + 回退</b>", "拿不到就释放已有的重试", "有活锁风险，代码复杂"],
              ["<b>避免嵌套</b>", "临界区内不调用可能加锁的函数", "重构成本高"],
              ["<b>死锁检测</b>", "运行期构建等待图，定期检测环", "运行时开销；检测到了也只能回滚"]
            ] },
            { t: "note", kind: "purple", title: "xv6 里的实例", html: "xv6 有一条明确的锁顺序规则，例如文件系统：<b>必须先拿 inode 锁，再拿磁盘驱动的锁</b>；进程表相关的是 <code>wait_lock</code> 在最外层。<br><br>lock lab 里偷页时必须遵守「按 CPU 编号拿锁」也是同一个原则。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "中断导致的隐式死锁", open: false, blocks: [
              { t: "p", html: "这一种特别隐蔽：你在进程上下文里拿了锁 A，此时中断到来，中断处理试图拿锁 A——它永远不会可用，因为「你」就是那个持有者，而你要等中断处理完才能继续。" },
              { t: "p", html: "解法：<b>持有锁时关中断</b>。xv6 的 <code>acquire()</code> 会 <code>push_off()</code>，<code>release()</code> 时 <code>pop_off()</code>。这也解释了为什么 xv6 禁止在持有自旋锁时睡眠——睡眠会让中断状态混乱。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 6 ============ */
    {
      name: "六、设备与中断：CPU 与一块硬件的并行协议",
      desc: "驱动是 OS 里唯一「和另一个独立执行体协作」的部分。这一组讲中断/轮询的取舍与活锁。",
      items: [
        {
          id: "n-driver", no: "N14", short: "中断 vs 轮询",
          title: "设备通知你的两种方式，以及为什么现实总是混合",
          subtitle: "中断的作用是「通知有事」，不是「完成工作」。",
          meta: [["对应讲义", "LEC 11"], ["配套", "net lab"], ["难度", "★★☆"]],
          tags: ["设备驱动|amber"],
          blocks: [
            { t: "viz", id: "intrpoll", cap: "纯中断在低负载延迟最优、高负载崩塌；纯轮询吞吐稳但白烧 CPU；现实中两者混合" },
            { t: "p", html: "两种模型的取舍非常清晰：" },
            { t: "vs", a: { title: "中断", html: "<b>低负载</b>：延迟极低（有事立刻知道）<br><b>高负载</b>：每个事件一次上下文切换，开销随速率线性增长 → 可能吃满 CPU<br><br>适合：事件稀疏、要求低延迟" }, b: { title: "轮询", html: "<b>低负载</b>：白烧 CPU，且延迟受轮询间隔限制<br><b>高负载</b>：批量处理，吞吐稳定不塌<br><br>适合：事件密集、吞吐优先" } },
            { t: "p", html: "现实方案（Linux NAPI、也是 Mogul 论文的提议）：<b>有事件来时先中断，进入后关掉该设备中断转轮询，处理到配额用尽或队列为空再开中断退出。</b>" },
            { t: "h", text: " DMA 与描述符环" },
            { t: "p", html: "现代设备不靠 CPU 一个字节一个字节搬——它用 <b>DMA</b> 自己去内存里搬。驱动和设备的协议是<b>描述符环（ring）+ 所有权位</b>：" },
            { t: "ul", items: [
              "驱动填好「缓冲区地址 + 长度」，把所有权位交给硬件；",
              "硬件搬完后把所有权位还给驱动，并触发中断；",
              "驱动取走数据，<b>补一个新缓冲区并再次交出所有权</b>。"
            ] },
            { t: "note", kind: "danger", title: "漏掉「交还所有权」的典型症状", html: "<b>能收几个包，然后就再也不收了。</b>因为环上所有槽位都不再归硬件，它没地方放东西了。<br><br>这是 net lab 里最常见的 bug，另两个同类是：没清中断状态位（只中断一次）、环指针没取模（越界）。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "MMIO 读写有副作用，不能被优化或缓存", open: false, blocks: [
              { t: "p", html: "读一次状态寄存器可能就<b>清掉</b>一个中断标志。所以 MMIO 访问必须 <code>volatile</code>（防编译器优化掉）且<b>不可缓存</b>（防 CPU 用旧值）。" },
              { t: "p", html: "另外 RISC-V 内存序较宽松，对同一设备的多次寄存器写需要屏障保证顺序。" }
            ] },
            { t: "acc", title: "DMA 用的是物理地址", open: false, blocks: [
              { t: "p", html: "设备不知道你的虚拟地址。写进描述符的必须是<b>物理地址</b>。真实系统里还要考虑 IOMMU（防止设备 DMA 到任意内存）——xv6 没有 IOMMU。" }
            ] }
          ]
        },
        {
          id: "n-livelock", no: "N15", short: "接收活锁",
          title: "系统很忙，但没有一件事做完",
          subtitle: "活锁比死锁更难发现，因为系统看起来「在正常运转」。",
          meta: [["对应讲义", "LEC 15"], ["配套", "Receive Livelock 论文"], ["难度", "★★☆"]],
          tags: ["设备驱动|amber", "经典坑|amber"],
          blocks: [
            { t: "viz", id: "livelock", cap: "吞吐随输入速率先升后崩：越过临界点后，CPU 全花在「接收」上，应用吞吐归零" },
            { t: "p", html: "<b>死锁</b>：大家都不动。<b>活锁</b>：大家都在拼命动，但没有一个请求真正完成。" },
            { t: "p", html: "根因是<b>中断的调度优先级高于任何用户进程</b>：每来一个包一次中断、一次上下文切换。输入越快，中断越密；CPU 全花在「进中断 → 把包放进队列 → 出中断」，而「把队列里的包交给应用」这个真正有用的活永远排不上。" },
            { t: "note", kind: "warn", title: "怎么识别活锁", html: "特征三件套：<b>① CPU 100% 忙；② 应用吞吐接近零；③ 降低输入速率后立刻恢复正常。</b><br><br>第三条是关键——如果降低输入后仍然慢，那不是活锁，是别的瓶颈。" },
            { t: "h", text: "解法回顾" },
            { t: "ul", items: [
              "<b>中断 + 轮询混合</b>（关掉设备中断，批量处理，做完再开）；",
              "<b>配额</b>：每次中断最多处理 N 个包，防止一次中断做太久；",
              "<b>早丢包（early drop）</b>：在最早的位置丢弃注定要丢的包——这是 BPF 论文「把过滤下沉到数据源」的同一思想，今天在 XDP 里体现。"
            ] },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "活锁不只出现在网络", open: false, blocks: [
              { t: "p", html: "课程作业题问：xv6 的 UART 连着 shell，主机狂灌数据会不会活锁？<b>会。</b>xv6 的 UART 每收一个字节触发一次中断，shell 会被不断抢占，表现为「敲命令没反应但系统看起来还在跑」。" },
              { t: "p", html: "同样模式也出现在：<b>高频定时器中断</b>、<b>磁盘完成中断风暴</b>、以及 lock lab 里 <code>wait_lock</code> 上千万次的自旋（那是「锁竞争型活锁」——CPU 都在忙，但没人推进）。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 7 ============ */
    {
      name: "七、文件系统：把「持久」做对",
      desc: "磁盘上的数据结构 + 崩溃一致性。这一组讲 inode 结构与 WAL 的三个崩溃时刻。",
      items: [
        {
          id: "n-fs", no: "N16", short: "inode 与磁盘布局",
          title: "文件没有名字，名字指向文件",
          subtitle: "inode 存元数据和数据块位置；目录只是「名字 → inode 号」的表。",
          meta: [["对应讲义", "LEC 17"], ["配套", "fs lab"], ["难度", "★★☆"]],
          tags: ["文件系统|green"],
          blocks: [
            { t: "viz", id: "inode", cap: "xv6 inode 的 addrs[]：11 直接 + 1 一级间接 + 1 二级间接 = 65803 块" },
            { t: "viz", id: "fslayout", cap: "xv6 磁盘分区：boot | superblock | log | inodes | bitmap | data" },
            { t: "h", text: "这个拆分带来的两个性质" },
            { t: "ul", items: [
              "<b>硬链接</b>：多个名字指向同一个 inode（inode 里有一个「链接计数」）；",
              "<b>「文件没有名字」</b>：文件由 inode 号标识，名字只是一个目录项。<code>mv</code> 在同一个文件系统内只是改目录项，不搬数据。"
            ] },
            { t: "vs", a: { title: "硬链接", html: "目录项直接指向 inode 号。<br><br>· 不能跨设备<br>· 不能指向目录（防环）<br>· <b>增加</b>目标 inode 的链接计数<br>· 删除名字只有当计数归零才真正删文件" }, b: { title: "符号链接（symlink）", html: "一个特殊的 inode，<b>内容是一段路径字符串</b>。<br><br>· 可跨设备<br>· 可指向目录<br>· <b>不影响</b>目标的链接计数<br>· 目标不存在时成为「悬空链接」<br>· 可能形成环（需要跟随深度限制）" } },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "bread 之后必须 brelse", open: true, blocks: [
              { t: "p", html: "buffer cache 的槽位数量固定。漏掉 <code>brelse</code> 会耗尽它，表现为<b>「跑一会儿之后所有磁盘操作卡死」</b>——这类 bug 往往要跑很久才暴露，非常难查。" },
              { t: "p", html: "fs lab 手册把这条列为唯一的显式警告，可见它有多常见。" }
            ] },
            { t: "acc", title: "改了 on-disk 格式必须重建 fs.img", open: false, blocks: [
              { t: "p", html: "<code>mkfs</code> 用 <code>NDIRECT</code> 构造镜像。改了常量却不重建，文件系统会处于「内核认为一种格式、磁盘是另一种格式」的状态，表现极其诡异。" },
              { t: "p", html: "这反映了磁盘格式的一个本质属性：<b>它是一种持久化的 ABI</b>。真实文件系统为此发展出「特性标志 + 向后兼容」的复杂机制。" }
            ] },
            { t: "acc", title: "符号链接让「路径字符串比较」变得不可靠", open: false, blocks: [
              { t: "p", html: "<code>./README</code>、<code>a/../README</code>、以及一个指向 README 的符号链接，是三个不同的字符串、却是同一个文件。" },
              { t: "p", html: "这正是 Janus 论文第 ① 类坑。正确做法是在<b>内核路径解析之后</b>比较解析出的 inode，而不是比较字符串。" }
            ] }
          ]
        },
        {
          id: "n-crash", no: "N17", short: "崩溃一致性与日志",
          title: "每个可能的崩溃点都必须有一个正确结果",
          subtitle: "不是「大多数情况下没问题」，而是「任何时刻断电都能恢复到一个正确的状态」。",
          meta: [["对应讲义", "LEC 18"], ["配套", "kernel/log.c + xv6 book File system 章"], ["难度", "★★★"]],
          tags: ["文件系统|green", "崩溃恢复|green"],
          blocks: [
            { t: "p", html: "问题：一次文件写会修改<b>多个块</b>（inode、bitmap、数据块）。如果改到一半断电，文件系统就处于不一致状态——比如 bitmap 说某块已分配，却没有任何 inode 指向它（这块空间永久泄漏）。" },
            { t: "h", text: "预写日志（WAL）的四步" },
            { t: "steps", items: [
              { h: "① 把要改的块写进磁盘的 log 区", p: "此时真正位置还没动。" },
              { h: "② 写 log header（块号列表 + 数量）", p: "<b>这一步是原子提交点</b>。写完它，就代表「这次事务已提交」。" },
              { h: "③ install：把块写到真正的位置", p: "可以重复做，<b>幂等</b>。" },
              { h: "④ 清空 log（把 header 的 n 置 0）", p: "事务结束。" }
            ] },
            { t: "h", text: "三个崩溃时刻，逐一检查" },
            { t: "table", head: ["崩溃发生在", "重启时看到什么", "结果"], rows: [
              ["① 写日志途中", "header 未提交（n=0）", "直接丢弃日志 → 保持旧状态 ✅"],
              ["② 提交后、install 前", "header 已提交", "重放日志 → 改动生效 ✅"],
              ["③ install 后、清空前", "header 仍显示已提交", "重放是<b>幂等</b>的 → 无害 ✅"]
            ] },
            { t: "note", kind: "purple", title: "这套分析方法的精髓", html: "<b>枚举所有可能的中断点，逐一论证每个点的结果是正确的。</b>这是「崩溃一致性」这门学问的核心方法，也是所有日志/事务系统的通用论证方式。<br><br>注意关键前提：<b>③ 的幂等性</b>。如果 install 不幂等（比如是「追加」而不是「覆写」），重放就会出错。" },
            { t: "h", text: "代价" },
            { t: "ul", items: [
              "<b>写两遍</b>：每个块要先写日志再写原位，磁盘带宽翻倍；",
              "<b>串行化</b>：xv6 的 log 是全局的，一次只能有一个未完成的事务（<code>begin_op</code> / <code>end_op</code> 的计数就是为此）。"
            ] },
            { t: "p", html: "真实文件系统为此做了大量优化：ext4 的 journal 有多种模式（writeback / ordered / data）、支持多个事务；btrfs / ZFS 用写时复制（COW）替代日志，从而天然避免「写两遍」。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "日志区溢出", open: false, blocks: [
              { t: "p", html: "如果一个事务要修改的块数超过 log 区容量，就无法提交。xv6 的做法是<b>限制单个系统调用修改的块数</b>（<code>MAXOPBLOCKS</code>），并要求 <code>begin_op</code> 时预留。<br><br>这也是为什么 fs.c 里到处是断言——它们保证不会超出预留。" }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 8 ============ */
    {
      name: "八、多核可扩展性：当读侧也要写共享内存",
      desc: "RCU 是「让读侧完全不写共享内存」的一次语义升级。",
      items: [
        {
          id: "n-rcu", no: "N18", short: "RCU 与 grace period",
          title: "读者什么都不做，写者复制后等一个宽限期",
          subtitle: "核心洞察：读写锁的读侧仍然要原子改共享计数器，这在多核下就是瓶颈。",
          meta: [["对应讲义", "LEC 20"], ["配套", "RCU 论文 / lock lab"], ["难度", "★★★"]],
          tags: ["并发|rose", "可扩展性|rose"],
          blocks: [
            { t: "viz", id: "rcu", cap: "写者换指针后必须等所有「已存在的读者」退出（grace period），才能释放旧版本" },
            { t: "h", text: "三步" },
            { t: "ol", items: [
              "<b>读者几乎什么都不做</b>：不执行原子写、不改共享计数器、不拿锁。",
              "<b>写者复制 + 原子换指针</b>：老读者看到的仍是旧版本，<b>不会被阻塞</b>。",
              "<b>延迟释放</b>：等一个 grace period，确认没人再引用旧版本，才释放。"
            ] },
            { t: "h", text: "grace period 怎么判定：跟踪「静止」而不是「读者」" },
            { t: "p", html: "如果要数「现在有几个读者」，就得维护一个共享计数器——于是又回到 cacheline 争用。RCU 反过来：<b>跟踪每个 CPU 是否经过了「静止状态」</b>（上下文切换、idle、回到用户态）。一旦所有 CPU 都报告过一次，就保证换指针那一刻存在的所有读临界区都已结束。" },
            { t: "note", kind: "purple", title: "为什么这样就够", html: "因为 RCU 有一条语义约束：<b>读临界区内不能睡眠、不能被抢占出内核</b>。所以「经过一次静止状态」⇔「这个 CPU 上没有活跃的读临界区」。<br><br>这条约束也正是 RCU 的使用成本之一——它把「读侧便宜」的代价转嫁给了「编程时必须守规矩」。" },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "读者可能读到旧值", open: true, blocks: [
              { t: "p", html: "这是 RCU 的<b>语义特性</b>，不是 bug。它意味着 RCU 只适合「读到过期数据无害」的场景（路由表、缓存、配置）。" },
              { t: "p", html: "反例：银行余额、引用计数、任何需要「读到的立刻是最新的」的地方，都不适合 RCU。" }
            ] },
            { t: "acc", title: "代价清单", open: false, blocks: [
              { t: "ul", items: [
                "<b>内存</b>：新旧两份共存直到 grace period 结束；",
                "<b>写者延迟</b>：<code>synchronize_rcu()</code> 通常毫秒级（可用 <code>call_rcu()</code> 异步化）；",
                "<b>语义负担</b>：读者必须接受「可能看到旧值」，且读临界区内不能睡眠；",
                "<b>只适用读多写少</b>：写频繁反而更糟。"
              ] }
            ] }
          ]
        }
      ]
    },

    /* ============ 组 9 ============ */
    {
      name: "九、隔离与安全：边界该放在哪，以及它会不会失效",
      desc: "课程最后一部分的现代议题：容器/微 VM 的光谱，以及硬件抽象被违反时会发生什么。",
      items: [
        {
          id: "n-isolation", no: "N19", short: "隔离技术光谱",
          title: "同一个目标，三种抽象层次",
          subtitle: "唯一的设计变量是：不可信代码发出的系统调用，最终由谁来处理。",
          meta: [["对应讲义", "LEC 21"], ["配套", "Blending 论文"], ["难度", "★★☆"]],
          tags: ["隔离|blue", "现代议题|blue"],
          blocks: [
            { t: "viz", id: "isolation", cap: "从共享宿主内核的容器，到用户态内核（gVisor），到微型 VM（Firecracker），到完整 VM" },
            { t: "h", text: "Linux 上为什么隔离这么难" },
            { t: "p", html: "因为内核里有<b>大量共享状态</b>，而且系统调用通过「命名」来访问它们：PID、文件名、IP/端口、uid……典型的访问控制围绕 <b>uid</b> 设计，目标是「在分时系统里隔离不同用户」，<b>而不是隔离同一个用户的两个应用</b>。" },
            { t: "p", html: "（顺带说：xv6 连 uid 和文件权限都没有——所以任何进程都能读任何文件。这正好说明「内核提供什么抽象」直接决定「应用能实现怎样的安全策略」。）" },
            { t: "h", text: "三种方案 = 三种边界位置" },
            { t: "table", head: ["方案", "边界在哪", "用什么换什么"], rows: [
              ["<b>容器（LXC）</b>", "宿主内核的 syscall 入口", "几乎零开销换「攻击面 = 整个 Linux」"],
              ["<b>gVisor</b>", "用户态重新实现的内核（Sentry）", "用「重新实现一个内核」换「宿主内核不被直接暴露」"],
              ["<b>Firecracker</b>", "硬件虚拟化边界（极简 VMM）", "用「多跑一个内核」换「强隔离 + 容器级敏捷」"]
            ] },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "chroot 的越狱手法（为什么光有 chroot 不够）", open: false, blocks: [
              { t: "p", html: "<code>chroot</code> 只是把进程的根目录改掉。但它<b>不限制其他系统调用</b>：<code>kill &lt;pid&gt;</code> 仍然可以杀别的进程，网络、IPC、设备也全都还在。" },
              { t: "p", html: "而且即使只看文件系统，也有 <code>..</code>、符号链接、以及「先 chdir 进子目录再 chroot」等逃逸手法。这就是后来需要 namespace + cgroups 的原因。" }
            ] },
            { t: "acc", title: "ABI 覆盖不全是最容易被低估的风险", open: false, blocks: [
              { t: "p", html: "gVisor 只实现了 Linux syscall 的一个子集。不支持的行为要么失败、要么<b>悄悄语义不同</b>——后者更危险，因为应用会「跑起来但结果不对」。" },
              { t: "p", html: "这其实是 Janus 教训的放大版：Janus 只需复刻路径解析，gVisor 要复刻<b>整个内核</b>。" }
            ] }
          ]
        },
        {
          id: "n-meltdown", no: "N20", short: "Meltdown 与侧信道",
          title: "ISA 是一份契约，微架构不一定遵守它",
          subtitle: "体系结构层面你确实没拿到数据，但微架构层面数据已经被读过，并留下了痕迹。",
          meta: [["对应讲义", "LEC 23"], ["配套", "Meltdown 论文"], ["难度", "★★☆"]],
          tags: ["安全|rose", "硬件|rose"],
          blocks: [
            { t: "viz", id: "meltdown", cap: "四步：越权 load → 瞬时指令用秘密当索引 → 异常回滚 → 用 cache 时序把秘密读回来" },
            { t: "h", text: "为什么延迟交付异常是关键" },
            { t: "p", html: "乱序执行让 CPU 在指令「退休」之前就执行了后面的指令，而<b>权限检查失败要等到退休时才交付异常</b>。于是中间那段「瞬时执行」已经跑过了——它不该跑，但它跑了，而且<b>它对 cache 的修改不会被回滚</b>。" },
            { t: "h", text: "Meltdown vs Spectre（容易混淆）" },
            { t: "table", head: ["维度", "Meltdown", "Spectre"], rows: [
              ["利用的特性", "乱序执行 + 权限检查延迟", "分支预测（推测走错路径）"],
              ["越过的边界", "用户 → 内核（<b>读到了不该读的</b>）", "同特权级（<b>骗受害者访问它自己的</b>）"],
              ["影响范围", "部分 Intel / ARM / IBM", "<b>几乎所有</b>现代高性能 CPU"],
              ["可修补性", "<b>可以</b>：KPTI 分离页表", "<b>很难</b>：需插屏障、改编译器"]
            ] },
            { t: "h", text: "典型 corner case" },
            { t: "acc", title: "xv6 在这个假设下能偷到什么（课程作业题）", open: true, blocks: [
              { t: "p", html: "答案：<b>几乎一切</b>。因为 xv6 的内核页表把<b>全部物理内存做了恒等映射</b>，内核能看到所有进程页、buffer cache、文件系统日志；而 xv6 也没有 KPTI 之类防护。" },
              { t: "p", html: "换句话说，进程隔离完全依赖「硬件会执行页表的权限检查」这一条假设。这条假设一旦失效，<b>所有隔离机制同时失效</b>——不管你在软件层做了多少努力。" }
            ] },
            { t: "acc", title: "修复本身也有代价，而且是「隔离的代价」的又一次体现", open: false, blocks: [
              { t: "p", html: "KPTI 的做法是「用户态运行时使用一套不含内核映射的页表」。代价：<b>每次系统调用要多切一次页表 + 刷 TLB</b>，性能损失显著。" },
              { t: "p", html: "这正好把整门课串起来反问一遍：页表提供的隔离依赖硬件真的执行它；特权级边界被微架构偷偷跨过；而修复它要付出的性能代价，又一次证明「<b>任何隔离都有成本</b>」。" }
            ] }
          ]
        }
      ]
    }
  ]
};
