/* ============================================================
   SpeechOps 架构解读站 · 交互与内容

   零依赖：不引入任何框架或 CDN。全部内容以数据形式声明在下方，
   渲染函数负责把它变成 DOM。这样做的原因和项目本身一致 ——
   站点要能在离线内网打开。

   内容来源：docs/01-架构设计.md、docs/02-实验报告.md、README.md。
   改动这里之前请先核对上述文档，避免图文不一致。
   ============================================================ */

(function () {
  'use strict';

  const $  = (sel) => document.querySelector(sel);
  const $$ = (sel) => Array.from(document.querySelectorAll(sel));

  /* ═══════════════════════ 内容数据 ═══════════════════════ */

  const HERO = [
    { val: '8',      unit: '层', key: '分层架构（接入 → 再训练闭环）' },
    { val: '11',     unit: '条', key: '关键技术决策与取舍' },
    { val: '81',     unit: '个', key: '单元测试，全部守护静默失败', good: true },
    { val: '0.1792', unit: '',   key: '微调后 CER（基线 0.1956）', good: true },
    { val: '0.028',  unit: '',   key: 'PSI 与 CER 的秩相关 ρ（p=0.93）', warn: true }
  ];

  const PAINS = [
    {
      t: '模型权重散落在个人电脑里，没有版本',
      d: '训练产物就是一堆文件，谁也不知道线上跑的是哪一次训练的结果。',
      c: '线上出问题无法定位到底跑的哪个权重，只能靠"重新训一个试试"。'
    },
    {
      t: '训练环境和推理环境不一致',
      d: '离线评估用一套预处理代码，线上服务用另一套，两边行为不一致。',
      c: '"我本地是好的" 成为高频事故 —— 离线指标很好，一上线就崩。'
    },
    {
      t: '上线靠手工拷贝，没有回滚能力',
      d: '换模型等于重新构建镜像、重新推送、重新部署。',
      c: '一次坏发布要停机数小时，而回滚同样慢。'
    },
    {
      t: '模型上线后无人监控',
      d: '只有服务质量指标（QPS、延迟），没有模型质量和数据质量指标。',
      c: '数据分布悄悄漂移，指标劣化几周后才发现，业务已经受损。'
    },
    {
      t: '发现劣化后靠人工重训',
      d: '从发现问题到人工介入、重训、评估、上线，全链路手工。',
      c: '从发现到修复的周期以周计，而漂移是持续发生的。'
    }
  ];

  const LAYERS = [
    {
      n: '接入层', tag: 'Demo 面板 / curl / SDK', color: '#2f6df6',
      sub: '请求从这里进入系统',
      problem: '把同一套能力暴露给不同使用者：人看的演示面板、脚本调用的 curl、以及集成方用的 SDK。',
      comps: ['Demo 面板', 'curl', 'SDK'],
      points: [
        '面板是零依赖静态页，可离线内网运行',
        '所有入口都走同一套 HTTP 契约，不做特殊通道'
      ]
    },
    {
      n: '流量治理', tag: '鉴权 / 限流 / 灰度权重', color: '#6b46c1',
      sub: '在请求到达业务逻辑之前先做管控',
      problem: '鉴权、限流、请求体积限制、灰度权重分流 —— 这些都不该写进业务代码。',
      comps: ['Nginx Ingress', 'Argo Rollouts（K8s）'],
      points: [
        '音频请求体积大，体积限制必须在入口挡住，不能等到解码时才发现',
        '灰度权重在这里按比例分流，业务代码对灰度无感'
      ]
    },
    {
      n: '网关层', tag: 'FastAPI · 提交与轮询', color: '#2f6df6',
      sub: '只做编排，不做计算',
      problem: '接收任务、落存储、入队、返回任务号；以及提供状态查询与运维接口。',
      comps: ['POST /v1/transcriptions', 'GET /v1/transcriptions/{id}',
              'GET /v1/drift', 'POST /v1/drift/simulate', 'POST /v1/canary', 'GET /metrics'],
      points: [
        '提交接口立即返回，不阻塞等待推理结果',
        '自身不加载模型，因此可以轻量地多副本部署'
      ]
    },
    {
      n: '消息与存储', tag: 'Redis + MinIO', color: '#0d7d8c',
      sub: '把"任务"和"数据"分开存放',
      problem: '任务状态需要频繁读写且要求低延迟；音频与转写结果体积大、要求持久化。两类需求不该用同一个存储。',
      comps: ['Redis：任务状态 / 队列 / 特征滑窗', 'MinIO：原始音频 / 转写结果 / 模型权重'],
      points: [
        'Redis 用内存换延迟，适合高频状态轮询',
        'MinIO 是 S3 兼容接口，本地可跑、生产可无缝切云对象存储',
        '特征滑窗也放 Redis，多副本时才能共享同一份分布'
      ]
    },
    {
      n: '推理层', tag: 'Worker 池 · Whisper + LoRA', color: '#12a150',
      sub: '唯一真正吃算力的一层',
      problem: '消费队列里的任务，加载模型完成转写，同时把输入分布记录下来。',
      comps: ['WhisperEngine', 'EnginePool', 'Whisper + LoRA 适配器'],
      points: [
        'EnginePool 支持多版本并存，按权重路由 —— 这是灰度能力的基础',
        '推理引擎与离线评估共用同一份实现，消除 training-serving skew',
        '特征提取放在推理之前，推理失败也不影响漂移检测'
      ]
    },
    {
      n: '模型治理', tag: 'MLflow Registry', color: '#6b46c1',
      sub: '回答"线上到底跑的是哪个模型"',
      problem: '模型需要版本号、需要阶段流转、需要一键回滚，且这些不该和镜像构建绑在一起。',
      comps: ['版本号', '别名 production / staging / canary', '晋级门槛 CER 相对提升 ≥ 2%'],
      points: [
        '模型权重不打进镜像，切换版本改别名即可，秒级生效',
        '模型回滚 ≠ 镜像回滚 —— 这是运维最容易搞错的地方',
        '晋级历史落盘留痕，回滚时依赖它找到上一个 production'
      ]
    },
    {
      n: '可观测层', tag: 'Prometheus + Grafana', color: '#c97a06',
      sub: '三层指标缺一不可',
      problem: '只看服务质量，模型劣化不会暴露；只看模型质量，等发现时业务已受损。',
      comps: ['服务质量：QPS / P50 / P95 / 队列深度 / 错误率',
              '模型质量：CER / WER / RTF',
              '数据质量：10 个特征的 PSI / KS p 值 / 严重度'],
      points: [
        '数据质量是**最前置**的信号：输入分布的变化总是先于输出指标的变化',
        '共 10 条告警分三组：可用性 / 性能 / 模型质量',
        '阈值全部可配置 —— 硬编码阈值是运维的常见反模式'
      ]
    },
    {
      n: '自动再训练', tag: 'CT Pipeline · 漂移驱动', color: '#d93a3a',
      sub: '把"发现劣化到修复"的周期从周压缩到小时',
      problem: '漂移超阈值后自动走完判定 → 微调 → 评估 → 注册 → 晋级。',
      comps: ['drift_check', 'finetune', 'evaluate', 'register', 'promote'],
      points: [
        '带冷却期（默认 60 分钟），避免一次抖动触发连环重训',
        '晋级有门槛：CER 相对提升 ≥ 2% 才上 production，否则停在 staging 等人工判断',
        '没有门槛的自动再训练很危险 —— 它会把变差的模型自动推上生产'
      ]
    }
  ];

  /* ── 真实代码模块（依赖关系由 src/ 下的 import 语句实际提取） ──
     统计口径：只计模块级 `from src.X import ...` / `import src.X`，
     函数体内的延迟导入同样计入 —— 它们也是真实的调用关系。
     行数含 __init__.py。 */

  const MODULES = [
    {
      id: 'pipeline', name: 'src.pipeline', cn: '编排层', lines: 334, files: 2, fanin: 0,
      role: '顶层编排。把「漂移判定 → 微调 → 评估 → 注册 → 晋级」串成一条无人值守的流水线，是自动再训练闭环的入口。',
      dependsOn: ['common', 'monitor', 'registry', 'serving', 'train'],
      dependedBy: [],
      resp: [
        '按顺序驱动五个阶段，任一阶段失败即中止并留下记录',
        '带冷却期（默认 60 分钟），避免一次抖动触发连环重训',
        '晋级必须过 <b>CER 门槛</b>（相对提升 ≥ 2%），否则停在 staging 等人工判断'
      ],
      keyFiles: [['pipeline/retrain.py', 333]],
      code: '# 冷却是流水线级的，不是单阶段的。\n# 没有它，一次数据抖动会连续触发多次重训，\n# 每次都消耗数小时 GPU，还可能把更差的模型推上线。'
    },
    {
      id: 'serving', name: 'src.serving', cn: '在线服务层', lines: 1983, files: 7, fanin: 2,
      role: '在线推理服务。FastAPI 网关 + 任务存储 + Worker 池 + 推理引擎。整条链路唯一真正吃算力、也是唯一被反向依赖的模块。',
      dependsOn: ['common', 'data', 'monitor', 'train'],
      dependedBy: ['pipeline', 'train'],
      resp: [
        '<code>app.py</code> 只做编排：提交、轮询、运维接口，<b>自身不加载模型</b>',
        '<code>engine.py</code> 是唯一的推理实现，离线评估直接复用它 —— 消除 training-serving skew',
        '<code>EnginePool</code> 支持多版本并存并按权重路由，这是灰度能力的实现基础'
      ],
      keyFiles: [['serving/app.py', 631], ['serving/engine.py', 476], ['serving/taskstore.py', 259],
                 ['serving/service.py', 238], ['serving/worker.py', 221]],
      code: '# EnginePool.pick() 按权重选引擎 —— 灰度就体现在这一行。\n# 改权重即可改变流量分配，不需要重启进程。'
    },
    {
      id: 'monitor', name: 'src.monitor', cn: '监控与漂移层', lines: 928, files: 4, fanin: 2,
      role: '三层指标与漂移检测。既给在线服务提供滑窗与 PSI / KS 计算，也给再训练流水线提供「该不该重训」的判定。',
      dependsOn: ['common', 'data'],
      dependedBy: ['pipeline', 'serving'],
      resp: [
        '<code>drift.py</code> 实现 PSI + KS 双门限，并对 PSI 的硬上界做饱和保护',
        '<code>window.py</code> 提供内存滑窗与 Redis 滑窗两种实现，多副本时才需要后者',
        '<code>metrics.py</code> 统一 Prometheus 指标定义，服务与流水线共用同一套'
      ],
      keyFiles: [['monitor/drift.py', 506], ['monitor/metrics.py', 256], ['monitor/window.py', 165]],
      code: '# 构造漂移特征矩阵一律取自 detector.features，\n# 不能用 audio_features.FEATURE_NAMES —— 10 列 vs 7 列，\n# 会静默错位 4 个数量级，且不报错。'
    },
    {
      id: 'train', name: 'src.train', cn: '训练与评估层', lines: 1040, files: 4, fanin: 2,
      role: '微调、评估与数据切分。既是离线训练入口，也向在线服务反向提供数据切分与指标函数。',
      dependsOn: ['common', 'data', 'serving'],
      dependedBy: ['pipeline', 'serving'],
      resp: [
        '<code>dataset.py</code> 按说话人切分并实现分层抽样 —— 这是对照实验同源的前提',
        '<code>evaluate.py</code> 复用服务端引擎做评估，保证离线与线上同口径',
        '<code>finetune_whisper.py</code> 用 LoRA 微调，可训练参数仅占 <b>0.81%</b>'
      ],
      keyFiles: [['train/finetune_whisper.py', 410], ['train/evaluate.py', 405], ['train/dataset.py', 224]],
      code: '# 不要用 records[:N] 取样本 —— 清单按说话人分块排列，\n# 取前 N 条等于只取第一个说话人。\n# 统一用 dataset.stratified_sample()。'
    },
    {
      id: 'data', name: 'src.data', cn: '数据层', lines: 1342, files: 4, fanin: 3,
      role: '数据集准备、音频特征与漂移注入。被三个模块依赖，是「输入长什么样」的唯一权威来源。',
      dependsOn: ['common'],
      dependedBy: ['monitor', 'serving', 'train'],
      resp: [
        '<code>prepare_dataset.py</code> 从 tar 流中直接读取音频，<b>不做落盘解压</b>',
        '<code>audio_features.py</code> 定义 10 个特征，是漂移检测的输入',
        '<code>drift_inject.py</code> 生成可控的扰动样本，用于验证检测器是否真的有效'
      ],
      keyFiles: [['data/prepare_dataset.py', 598], ['data/drift_inject.py', 435], ['data/audio_features.py', 308]],
      code: '# 扰动算子必须先验证保真度：\n# librosa.effects.time_stretch 的相位声码器伪影会主导 CER，\n# 已改用自实现 WSOLA。验证手段 = 对称性检验 + 无损基线对照。'
    },
    {
      id: 'registry', name: 'src.registry', cn: '模型注册层', lines: 412, files: 2, fanin: 1,
      role: '模型版本治理。回答「线上到底跑的是哪个模型」，并负责晋级与回滚。',
      dependsOn: ['common'],
      dependedBy: ['pipeline'],
      resp: [
        '用<b>别名</b>而非 stage 做版本流转（stage 已被 MLflow 官方标记为废弃）',
        '晋级历史落盘到 <code>artifacts/registry/&lt;model&gt;-history.json</code>，回滚依赖它找到上一个 production',
        '<code>ensure_registry_supported()</code> 提前拦住「文件存储后端不支持 Registry」这个坑'
      ],
      keyFiles: [['registry/model_registry.py', 411]],
      code: '# 模型回滚 ≠ 镜像回滚。\n# 若故障原因是模型版本，回滚镜像既慢又没必要 ——\n# 镜像没变，只是别名指错了。'
    },
    {
      id: 'common', name: 'src.common', cn: '公共地基', lines: 1123, files: 7, fanin: 6,
      role: '零业务逻辑的公共地基。配置、日志、路径、存储、文本归一化、实验跟踪 —— 被全部 6 个模块依赖。',
      dependsOn: [],
      dependedBy: ['data', 'monitor', 'pipeline', 'registry', 'serving', 'train'],
      resp: [
        '<code>text.py</code> 承载<b>两层归一化</b>（服务输出口径 / 指标计算口径），是 CER 可信的前提',
        '<code>config.py</code> 做四层配置合并：base + overlay + 环境变量 + 运行时覆盖',
        '<code>storage.py</code> 统一对象存储访问，本地文件系统与 S3 走同一套接口'
      ],
      keyFiles: [['common/text.py', 339], ['common/config.py', 239], ['common/storage.py', 238],
                 ['common/tracking.py', 170], ['common/logging.py', 94]],
      code: '# 两层归一化必须分开：\n# postprocess_transcript —— 服务输出（保留标点与中文数字）\n# normalize_for_cer      —— 指标口径（剔标点 + 中文数字转阿拉伯）\n# 两者混用会让 CER 差 35%（0.3029 → 0.1956）。'
    }
  ];

  // 依赖图的纵向层级：越靠上越高层，越靠下越基础。
  // 由 fan-out 拓扑排序得到；train ↔ serving 的环按"去掉反向边"处理。
  const MOD_ROWS = [
    ['pipeline'],
    ['serving'],
    ['monitor', 'train'],
    ['data', 'registry'],
    ['common']
  ];

  const FLOW = [
    { t: '提交转写请求', a: '客户端',
      d: 'POST /v1/transcriptions，以 multipart 形式上传音频文件。这是整条链路的入口。' },
    { t: '体积校验 → 音频写入 MinIO', a: 'FastAPI',
      d: '先在入口做体积校验，超限直接拒绝。校验通过后把音频写入对象存储 —— 请求体不进内存队列，避免大文件把进程撑爆。' },
    { t: '探测音频时长', a: 'FastAPI',
      d: '用 soundfile 读取文件头拿时长，**不解码全量音频**。这一步只为后续判断是否超时、以及给指标打标签，成本必须极低。' },
    { t: '创建任务记录 status=pending', a: 'FastAPI',
      d: '在 Redis 写入任务记录，状态为 pending。任务号（task_id）同时作为后续轮询的凭据。' },
    { t: '任务入队', a: 'FastAPI',
      d: '把任务推入队列。此时请求处理结束 —— 注意网关从头到尾没有加载过模型。' },
    { t: '立即返回 {task_id, poll_url}', a: 'FastAPI',
      d: '返回任务号与轮询地址，连接立刻释放。这就是异步架构的核心：把"等待算力"从 HTTP 连接里剥离出去。' },
    { t: '取任务 → status=running', a: 'Worker',
      d: 'Worker 从队列取出任务，把状态改为 running。排队等待时长在这里被记录下来 —— 它必须和推理时长分开计量。' },
    { t: '取音频 → 解码 → 重采样 16 kHz', a: 'Worker',
      d: '从 MinIO 取回原始音频，解码为波形并重采样到模型要求的 16 kHz。这一步与离线评估走的是同一份代码。' },
    { t: '提取 10 个音频特征 → 写入滑窗', a: 'Worker',
      d: '提取 rms、snr_db、spectral_centroid 等 10 个特征，写入 Redis 里的滑动窗口。**刻意放在推理之前** —— 推理失败也要留下输入分布的记录。' },
    { t: 'EnginePool.pick() 按权重选引擎', a: 'Worker',
      d: '引擎池按权重挑选版本（stable / canary）。灰度能力就体现在这一行：改权重即可改变流量分配，无需重启。' },
    { t: '推理 → 文本后处理', a: 'Worker',
      d: 'Whisper 推理得到原始文本，再做繁转简与汉字间空格清理。后处理与指标计算共用同一个归一化模块，避免两边口径漂移。' },
    { t: '记录指标', a: 'Worker',
      d: '记录延迟、RTF（实时率）、音频时长。RTF 是模型效率的核心指标 —— 小于 1 表示快于实时。' },
    { t: 'status=succeeded，结果写回', a: 'Worker',
      d: '任务状态改为 succeeded，结果同时写回 Redis（供快速轮询）与 MinIO（供长期保存）。' },
    { t: '轮询拿到文本与延迟', a: '客户端',
      d: 'GET /v1/transcriptions/{id} 取回结果。注意客户端观测到的端到端耗时会被**轮询间隔量化** —— 判断服务端性能要看排队与推理耗时，不能看端到端。' }
  ];

  const CATS = {
    serve:    { name: '服务架构',   color: '#1f52c9', soft: '#eaf1ff' },
    registry: { name: '模型治理',   color: '#6b46c1', soft: '#f1ecfd' },
    drift:    { name: '监控与漂移', color: '#0d7d8c', soft: '#e2f5f7' },
    ops:      { name: '部署运维',   color: '#12a150', soft: '#e7f7ee' },
    robust:   { name: '工程健壮性', color: '#c97a06', soft: '#fdf3e2' }
  };

  const DECISIONS = [
    {
      id: '3.1', cat: 'serve', t: '异步推理，而非同步推理',
      why: '一段 10 秒音频在 CPU 上推理要数秒。同步 HTTP 会带来三个问题：客户端超时阈值必须调很大，而网关/负载均衡各有自己的超时，任何一环不匹配就出现"服务端还在算、客户端已经断开"；连接被长时间占用，并发能力被连接数而非算力限制；无法优雅处理排队，看不到队列长度，也就无法基于队列深度做扩缩容。',
      cost: '客户端需要实现轮询逻辑；服务端需要维护任务状态与 TTL。',
      code: '# 排队时长必须与推理时长分开计量\nreturn max(0.0, (self.started_at - self.created_at) * 1000)\n# 时钟回拨、跨节点漂移、坏时间戳都会产生负值，\n# 负值会让监控图直接失效'
    },
    {
      id: '3.2', cat: 'serve', t: '推理引擎单一实现，消除 training-serving skew',
      why: '工业界高频事故模式：离线评估用一套预处理代码，线上服务用另一套，两边行为不一致，导致"离线指标很好、上线就崩"。把推理收敛成单一实现是最直接的消除手段。本项目体现为三处共享：推理引擎、文本归一化、模型解析。',
      cost: '引擎必须设计成无状态、可被两条路径复用，不能夹带只对某一侧有效的假设。'
    },
    {
      id: '3.3', cat: 'registry', t: '模型版本与镜像解耦',
      why: '如果模型权重打进镜像，"换一个模型版本"就等于"重新构建并推送镜像"，耗时以十分钟计，回滚同样要重建。更糟的是模型版本和代码版本被绑死，无法独立演进。解耦后切换版本与回滚都是秒级（改别名），只有改服务代码才需要重建镜像。',
      cost: '需要额外的注册表基础设施；容器启动时要有能力拉取模型权重。',
      code: '模型回滚 ≠ 镜像回滚\n\n线上出问题时第一反应往往是"回滚"。但若故障原因是\n模型版本，回滚镜像既慢又没必要 —— 镜像没变，只是别名指错了。'
    },
    {
      id: '3.4', cat: 'registry', t: '用别名，而不是阶段',
      why: 'MLflow 的 stage 机制（Staging / Production / Archived）已被官方标记为废弃。别名机制更灵活：同一个版本可以同时挂多个别名（灰度期间 canary 和 staging 可以指向同一版本），而 stage 是单值的。',
      cost: '需要自己维护晋级历史（本项目落在 artifacts/registry/<model>-history.json），回滚时依赖它找到上一个 production 版本。'
    },
    {
      id: '3.5', cat: 'drift', t: '漂移检测用 PSI + KS 双门限',
      why: '两种方法各有失效场景，且方向相反：PSI 在样本量小时虚高（误报）；KS 在样本量大时微小差异也显著（误报）。单用任何一个都会产生大量误报，而"自动再训练"这条链路上误报代价很高 —— 一次重训消耗数小时 GPU，还会把线上模型换成可能更差的版本。',
      cost: '双门限把误报压下来，代价是漏报概率略升。在"误报代价 >> 漏报代价"的场景下，这个方向是对的。',
      code: 'PSI 分箱用「基线分布的分位数」做等频分箱，\n而不是等宽分箱 —— 等宽分箱在长尾特征（如 duration）\n上会出现空箱，导致 PSI 爆炸。'
    },
    {
      id: '3.6', cat: 'drift', t: '漂移基线必须来自训练集',
      why: '漂移检测本质是分布比较，需要一个参照系。如果拿线上数据当基线，系统会逐渐把"已经漂移的状态"当作正常 —— 这在工业界叫 baseline poisoning。它的危险之处在于**静默**：基线被污染后，面板上一切正常，告警不会响，但模型其实已经在劣化。',
      cost: '线上真实分布变化时需要滚动更新基线，训练集基线只适合作为冷启动的初始参照。',
      code: '推论：对照样本也必须与基线同源\n\n本项目按说话人切分（train S0002–S0006 / test S0008），\n音频特征自带说话人痕迹。用 test 比对 train 基线，\n一个字节都不扰动 PSI 也会到 3.68 —— 把"换了个人说话"\n误当成了数据漂移。'
    },
    {
      id: '3.7', cat: 'ops', t: 'K8s 三探针分离',
      why: '这是模型服务与普通 Web 服务最重要的运维差异。模型加载需要 60–180 秒，如果只有 liveness 探针且初始延迟设置不当，K8s 会在模型还没加载完时判定容器已死、杀掉重启、再次超时，进入 CrashLoopBackOff 永远起不来。',
      cost: '三个探针的阈值需要按实际加载时间调参，配置复杂度上升。',
      code: 'startupProbe    → 进程启动完了吗？（≈300s 窗口，期间抑制其他探针）\nreadinessProbe  → 能接流量了吗？（模型加载完成后才开始通过）\nlivenessProbe   → 还活着吗？（宽松阈值，避免瞬时卡顿被误杀）'
    },
    {
      id: '3.8', cat: 'ops', t: 'HPA 快扩慢缩',
      why: '扩容需要加载 60–180 秒的模型，所以必须提前扩 —— 等 CPU 打满再扩，扩出来的副本还要两分钟才能接流量，用户已经等了很久。因此 CPU 阈值下调到 60% 并缩短扩容稳定窗口。缩容则相反：扩出来又缩回去是纯浪费，加长缩容窗口可避免流量抖动导致的反复扩缩。',
      cost: '缩容慢意味着资源回收慢，低峰期会多占用一段时间的算力。',
      code: '扩容：stabilizationWindowSeconds 30 / CPU 阈值 60%\n缩容：stabilizationWindowSeconds 300 / 每次最多缩 25%\n另挂自定义指标 speechops_queue_depth ——\n队列深度比 CPU 更前置：任务已堆积，CPU 可能还没打满。'
    },
    {
      id: '3.9', cat: 'robust', t: '优雅降级，且降级必须显式',
      why: '这套项目要在很多环境里跑通 —— 评审的笔记本、CI、演示机。如果"少一个 Redis 就起不来"，那它只在作者自己的机器上能跑。但降级必须显式记录：静默降级比不降级更危险，使用者会以为数据写进了生产 MLflow，实际只落在一台机器的 SQLite 里。',
      cost: '代码里到处是降级分支，复杂度上升；需要额外的测试覆盖各条降级路径。',
      code: 'MinIO/S3  → 本地文件系统\nRedis     → 进程内字典 + 线程池\nCelery    → ThreadPoolExecutor\nMLflow    → 本地 SQLite\n繁简转换   → 恒等函数'
    },
    {
      id: '3.10', cat: 'robust', t: '降级目标选 SQLite 而非文件存储',
      why: 'MLflow 的文件存储后端（./mlruns）**不支持 Model Registry**，用文件存储做本地开发时 register_model() 会直接失败。因此本地降级目标是 sqlite:///mlflow.db —— 它既能跑 tracking 也能跑 registry，与线上用 PostgreSQL 的行为一致。',
      cost: '需要额外依赖；SQLite 并发写入能力弱，只适合单机开发。',
      code: 'ensure_registry_supported() 会提前拦住这个问题：\n等到 register_model 才报错，前面几十分钟的\n训练与评估已经白跑了。'
    },
    {
      id: '3.11', cat: 'ops', t: 'Compose 主干 + K8s 清单',
      why: '评估过 kind 与 minikube，都不适用：kind 需要 Docker 拉取体积大的 kindest/node 镜像且对 Docker 版本敏感；minikube 的 WSL 驱动在本环境被安全策略阻止；本地 6 GB 显存 + 16 GB 内存同时跑 K8s 控制面与应用栈资源紧张。Compose 能拉起完全相同的服务拓扑，足以验证架构正确性。',
      cost: 'Compose 验证不了 HPA 扩缩容、探针行为、Ingress 灰度这些**集群侧**能力 —— 只能靠清单本身的正确性与 K8s 语义保证。',
      code: '这个取舍的边界必须说清楚：\nCompose 证明的是"架构能跑通"，\n不是"集群行为正确"。'
    }
  ];

  const EXPERIMENTS = [
    {
      tag: 'E0', t: '归一化消融',
      q: '繁简统一、标点剔除、数字归一各自贡献了多少 CER 改善？',
      rows: [
        ['原始口径', '0.3029', ''],
        ['+ 繁简统一', '0.3008', '−0.22pt'],
        ['+ 剔除标点', '0.2268', '−7.40pt'],
        ['+ 数字归一', '0.1956', '−7.22pt']
      ],
      head: ['阶段', 'CER', '增量'],
      concl: '数字归一贡献最大，累计 CER 下降 <b>35.4%</b>。不做这一步，E1/E2 的数字都不可信 —— 因为"模型变好了"可能只是归一化口径变了。'
    },
    {
      tag: 'E1', t: 'LoRA 微调收益',
      q: '微调到底带来了多少提升？统计上显著吗？',
      rows: [
        ['CER', '0.1956', '0.1792', '−8.4%'],
        ['WER', '0.8328', '0.8170', '−1.9%'],
        ['cer_p50', '0.1739', '0.1429', '−17.8%'],
        ['cer_p90', '0.4137', '0.3636', '−12.1%']
      ],
      head: ['指标', '基线', '微调', '变化'],
      concl: '配对符号检验 <b>p = 0.0030，显著</b>（更好 107 / 更差 67 / 相同 143）。但 WER 相对提升仅 1.9%，<b>未达晋级门槛 2%</b> —— 说明中文 ASR 应以 CER 为判据，WER 天然接近 1、区分度差。'
    },
    {
      tag: 'E2', t: '漂移敏感性与 PSI 有效性',
      q: '输入退化到什么程度触发告警？PSI 能代表识别质量吗？',
      bars: [
        { name: 'clean',        psi: 0.0269, cer: 1.00, cls: 'ok' },
        { name: 'speed_mild',   psi: 0.2951, cer: 1.07, cls: 'warn' },
        { name: 'speed_severe', psi: 0.6239, cer: 2.77, cls: 'bad' },
        { name: 'gain_mild',    psi: 9.7093, cer: 1.01, cls: 'warn' },
        { name: 'gain_severe',  psi: 12.4352, cer: 1.02, cls: 'bad' }
      ],
      concl: '<b>PSI 与 CER 的 Spearman 秩相关 ρ = 0.028（p = 0.93）—— 统计上完全不相关。</b>gain_severe 的 PSI 顶到饱和值 12.44 而 CER 只涨 2%；speed_severe 的 PSI 仅 0.62 而 CER 涨 2.77 倍。所以 PSI 只能当线索，必须与业务指标门禁联合使用。'
    },
    {
      tag: 'E3', t: '服务性能与瓶颈定位',
      q: '并发升高时，时间花在哪里？瓶颈是模型还是别的？',
      rows: [
        ['1', '2.09', '521.8', '3.1', '423.4'],
        ['2', '3.32', '520.7', '2.9', '614.4'],
        ['4', '3.52', '1028.2', '646.0', '705.7'],
        ['8', '3.43', '2307.3', '1932.6', '711.0']
      ],
      head: ['并发', '吞吐', 'e2e P50', '排队 P95', '推理 P95'],
      concl: '吞吐封顶 <b>3.5–3.9 req/s</b>（worker 池为 2）。并发 ≥4 后排队从 3ms 暴涨到 1933ms，而推理 P95 始终稳定在 ~700ms —— <b>瓶颈是 worker 池，不是模型</b>。所以扩容信号必须取队列深度，取 GPU 利用率无效（排队时 GPU 一直 100%，无法区分健康满负荷与严重积压）。'
    }
  ];

  // 优先级：core 核心（不掌握就做不下去）/ imp 重要（决定设计质量）/ adv 进阶（决定能否安全演进）
  const PRIO = {
    core: { name: '核心', color: '#1f52c9', soft: '#eaf1ff', line: '#bcd2fd' },
    imp:  { name: '重要', color: '#0a6674', soft: '#e2f5f7', line: '#b5e0e6' },
    adv:  { name: '进阶', color: '#6b7789', soft: '#eef2f8', line: '#dfe5ee' }
  };

  const KNOWLEDGE = [
    {
      id: 'cloud', icon: '☁', title: '云计算与基础设施',
      items: [
        { p: 'core', t: '容器与镜像：多阶段构建、镜像分层、体积优化（换 CPU 版 torch 可省约 2 GB）' },
        { p: 'core', t: 'Docker Compose：服务拓扑、依赖健康检查、命名卷与绑定挂载的区别' },
        { p: 'core', t: 'Kubernetes 核心对象：Deployment / Service / Ingress / ConfigMap / Secret' },
        { p: 'core', t: '键值存储：Redis 作为缓存 / 消息代理 / 共享状态（特征滑窗）' },
        { p: 'imp',  t: '弹性伸缩：HPA 的工作原理、CPU 与自定义指标、稳定窗口（stabilization window）' },
        { p: 'imp',  t: '对象存储：S3 兼容 API、桶与权限、预签名 URL' },
        { p: 'imp',  t: '容器网络与端口映射、反向代理与 Ingress 的分工' },
        { p: 'adv',  t: '关系型数据库：PostgreSQL 作为元数据后端、连接池' }
      ]
    },
    {
      id: 'mlops', icon: '⟳', title: 'MLOps 与模型生命周期',
      items: [
        { p: 'core', t: '实验跟踪：MLflow Tracking 记录参数 / 指标 / 产物' },
        { p: 'core', t: '模型注册表：版本号、别名（alias）、阶段流转、一键回滚' },
        { p: 'core', t: '模型与镜像解耦：为什么权重不该打进镜像' },
        { p: 'core', t: '持续训练（CT）：触发条件、冷却期、防止连环重训' },
        { p: 'imp',  t: '别名 vs 阶段（stage）：为什么 MLflow 弃用了 stage' },
        { p: 'imp',  t: '灰度发布 / 金丝雀：权重路由、指标门禁、自动晋级与回滚' },
        { p: 'imp',  t: '晋级门槛设计：相对提升阈值，以及「没有门槛的自动上线有多危险」' },
        { p: 'imp',  t: '可复现性：随机种子、数据切分留痕、模型溯源信息' }
      ]
    },
    {
      id: 'model', icon: '◈', title: '模型与训练',
      items: [
        { p: 'core', t: 'Transformer 架构与 Whisper：编码器-解码器、log-Mel 频谱输入' },
        { p: 'core', t: '语音识别基础：采样率、帧移、特征维度、语言建模' },
        { p: 'core', t: '迁移学习与领域适配：为什么要微调而不是从头训' },
        { p: 'core', t: 'LoRA / PEFT：低秩适配的原理、可训练参数占比（本项目 0.81%）' },
        { p: 'core', t: '序列到序列的评估指标：CER / WER / SER / RTF' },
        { p: 'imp',  t: '显存优化：混合精度、梯度检查点、梯度累积、小 batch 适配' },
        { p: 'imp',  t: '学习率调度：warmup 与线性衰减' },
        { p: 'imp',  t: '中文 ASR 的特殊性：为什么 WER 区分度差、应以 CER 为主' }
      ]
    },
    {
      id: 'serving', icon: '⇄', title: '服务工程',
      items: [
        { p: 'core', t: '异步任务模式：submit → poll → collect，与同步 HTTP 的取舍' },
        { p: 'core', t: '长耗时请求的承载：为什么必须把「等待算力」从连接里剥离' },
        { p: 'core', t: '队列等待与推理耗时<b>分开计量</b>：混在一起会误导扩容决策' },
        { p: 'core', t: '多版本并存与权重路由：灰度能力的实现基础' },
        { p: 'core', t: 'training-serving skew：成因与消除手段（共享同一份实现）' },
        { p: 'imp',  t: '任务状态机与 TTL：pending / running / succeeded / failed' },
        { p: 'imp',  t: '工作池并发模型：线程池、进程池、Celery worker 的适用场景' },
        { p: 'imp',  t: '优雅降级：每个外部依赖都可选，且降级必须显式记录' }
      ]
    },
    {
      id: 'observe', icon: '◎', title: '监控与可观测性',
      items: [
        { p: 'core', t: '三层指标：服务质量 / 模型质量 / 数据质量，缺一不可' },
        { p: 'core', t: 'Prometheus 指标类型：Counter / Gauge / Histogram 的语义' },
        { p: 'core', t: '百分位数的意义与陷阱：为什么平均值会骗人、尾部为什么不稳定' },
        { p: 'imp',  t: '自定义指标上报：把业务量（队列深度、PSI）暴露给监控系统' },
        { p: 'imp',  t: 'Grafana 面板设计：怎么把 P50/P95 与队列深度画在一起' },
        { p: 'imp',  t: '告警设计：分组、阈值可配置化、避免告警疲劳' },
        { p: 'adv',  t: '轮询粒度对端到端测量的量化误差' }
      ]
    },
    {
      id: 'drift', icon: '∿', title: '数据漂移与统计',
      items: [
        { p: 'core', t: '数据漂移 vs 概念漂移：区别与各自的检测手段' },
        { p: 'core', t: 'PSI（Population Stability Index）：等频分箱、计算式、经验阈值' },
        { p: 'core', t: 'KS 双样本检验：原理、p 值含义、样本量敏感性' },
        { p: 'core', t: '双门限设计：为什么单用 PSI 或单用 KS 都会大量误报' },
        { p: 'core', t: '基线污染（baseline poisoning）：为什么基线不能来自线上' },
        { p: 'core', t: '分层抽样：按说话人 / 用户 / 群体分层，避免样本退化成单一来源' },
        { p: 'imp',  t: '误报与漏报的代价权衡：在什么场景下应该偏向哪一侧' },
        { p: 'imp',  t: '对照实验的同源性：拿不同来源做对照测出的是群体差异，不是漂移' },
        { p: 'adv',  t: 'PSI 的硬上界：10 等频箱 + ε=1e-6 时约为 12.4339，饱和后不再携带严重程度信息' },
        { p: 'adv',  t: '代理指标有效性：用秩相关验证「统计量能否代表业务指标」' }
      ]
    },
    {
      id: 'audio', icon: '♪', title: '语音与文本处理',
      items: [
        { p: 'core', t: '音频基础：采样率、位深、声道、重采样与混叠' },
        { p: 'core', t: '音频特征：RMS、过零率、谱质心、谱滚降、SNR、无声段比例' },
        { p: 'core', t: '中文文本归一化：繁简转换、标点处理、中文数字转阿拉伯数字' },
        { p: 'core', t: '两层归一化的口径分离：服务输出口径 vs 指标计算口径' },
        { p: 'adv',  t: '提示词引导解码（initial_prompt）：控制输出形态而非提升准确率' },
        { p: 'adv',  t: '变速不变调：相位声码器（time_stretch）与 WSOLA 的原理差异' },
        { p: 'adv',  t: '扰动算子保真度验证：对称性检验、与无损基线对照' }
      ]
    },
    {
      id: 'eng', icon: '⚙', title: '工程实践与质量保障',
      items: [
        { p: 'core', t: '单元测试与回归测试设计：测试应该守护「假设」而不是「实现」' },
        { p: 'core', t: '静默失败的类型：不报错但让结论失真的 bug，以及如何为它们写测试' },
        { p: 'imp',  t: '配置分层：base + overlay + 环境变量 + 运行时覆盖的四层合并' },
        { p: 'imp',  t: 'CI 设计：只做不需要 GPU、不需要集群的检查，几分钟内给出结论' },
        { p: 'imp',  t: '数据 / 模型的版本控制策略：什么该入库、什么该靠重新生成' },
        { p: 'imp',  t: '日志分级与降级告警：让运维能一眼看出「现在是不是降级状态」' },
        { p: 'adv',  t: '环境变量映射必须显式声明，不做模糊匹配' },
        { p: 'adv',  t: '脚本的独立可运行性：sys.path 引导与直接执行' }
      ]
    }
  ];

  // 学习路径：三个阶段不是按难度切，而是按"你要先能做什么"切
  const STAGES = [
    {
      t: '先跑通', sub: '让它在本机起来', tag: '动手为主',
      d: '先建立「能运行」的直觉：容器怎么装、服务怎么编排、模型怎么被调用、特征怎么被算出来。这个阶段不要求理解全部设计动机，目标是能把链路点起来，并看到一次转写成功。',
      groups: ['cloud', 'serving', 'model']
    },
    {
      t: '再看懂', sub: '理解为什么这样设计', tag: '理解为主',
      d: '在能跑的基础上追问「为什么」：为什么必须异步、为什么模型要与镜像解耦、为什么要监控三层指标、为什么漂移基线不能来自线上。这个阶段决定你能否判断一个设计的好坏，而不只是照着抄。',
      groups: ['mlops', 'observe', 'drift']
    },
    {
      t: '然后改得动', sub: '能安全地改与演进', tag: '实践为主',
      d: '最后是「能改」：加一个新指标、换一个模型版本、调一个门槛，而不引入静默偏差。这依赖工程实践与对指标口径的敏感度 —— 项目里最贵的 bug 都是不报错的那类。',
      groups: ['eng', 'audio']
    }
  ];

  /* ═══════════════════════ 工具 ═══════════════════════ */

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // 内容里允许少量 <b> / <code> 标记，其余按纯文本处理
  const rich = (s) => esc(s)
    .replace(/&lt;(\/?)(b|code)&gt;/g, '<$1$2>')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>');

  const el = (tag, cls, html) => {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  };

  /* ═══════════════════════ 渲染：首屏指标 ═══════════════════════ */

  function renderHero() {
    const box = $('#heroMetrics');
    if (!box) return;
    box.innerHTML = HERO.map((m) => `
      <div class="metric${m.good ? ' good' : m.warn ? ' warn' : ''}">
        <div class="metric-val">${esc(m.val)}${m.unit ? `<span class="unit">${esc(m.unit)}</span>` : ''}</div>
        <div class="metric-key">${esc(m.key)}</div>
      </div>`).join('');
  }

  /* ═══════════════════════ 渲染：痛点 ═══════════════════════ */

  function renderPains() {
    const box = $('#painGrid');
    if (!box) return;
    box.innerHTML = PAINS.map((p, i) => `
      <article class="pain" data-idx="${i}" tabindex="0" role="button" aria-expanded="false">
        <div class="pain-head">
          <span class="pain-icon">!</span>
          <h3 class="pain-title">${esc(p.t)}</h3>
        </div>
        <div class="pain-body">
          <p>${rich(p.d)}</p>
          <div class="pain-conseq"><b>后果：</b>${rich(p.c)}</div>
        </div>
        <span class="pain-toggle">点击展开 ▾</span>
      </article>`).join('');

    box.querySelectorAll('.pain').forEach((node) => {
      const toggle = () => {
        const open = node.classList.toggle('open');
        node.setAttribute('aria-expanded', String(open));
        const t = node.querySelector('.pain-toggle');
        if (t) t.textContent = open ? '点击收起 ▴' : '点击展开 ▾';
      };
      node.addEventListener('click', toggle);
      node.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); toggle(); }
      });
    });
  }

  /* ═══════════════════════ 渲染：架构分层 ═══════════════════════ */

  let archActive = 0;

  function renderArch() {
    const stack = $('#archStack');
    if (!stack) return;
    stack.innerHTML = LAYERS.map((L, i) => `
      <button class="layer${i === archActive ? ' active' : ''}" data-idx="${i}"
              style="--layer-color:${L.color}" type="button">
        <span class="layer-idx">${i + 1}</span>
        <span class="layer-name">${esc(L.n)}</span>
        <span class="layer-tag">${esc(L.tag)}</span>
      </button>`).join('');

    stack.querySelectorAll('.layer').forEach((btn) => {
      btn.addEventListener('click', () => {
        archActive = Number(btn.dataset.idx);
        stack.querySelectorAll('.layer').forEach((b) => b.classList.remove('active'));
        btn.classList.add('active');
        renderArchDetail();
      });
    });
    renderArchDetail();
  }

  function renderArchDetail() {
    const box = $('#archDetail');
    if (!box) return;
    const L = LAYERS[archActive];
    box.innerHTML = `
      <div class="detail-head">
        <span class="detail-dot" style="background:${L.color}"></span>
        <h3>${esc(L.n)}</h3>
      </div>
      <p class="detail-sub">${esc(L.sub)}</p>
      <div class="detail-block">
        <h4>解决什么问题</h4>
        <p>${rich(L.problem)}</p>
      </div>
      <div class="detail-block">
        <h4>关键组件</h4>
        <div class="chip-row">${L.comps.map((c) => `<span class="chip">${esc(c)}</span>`).join('')}</div>
      </div>
      <div class="detail-block">
        <h4>设计要点</h4>
        <ul class="detail-list">${L.points.map((p) => `<li>${rich(p)}</li>`).join('')}</ul>
      </div>`;
  }

  /* ═══════════════════════ 渲染：模块划分与调用关系 ═══════════════════════ */

  const modById = (id) => MODULES.find((m) => m.id === id);

  // 所有边：from 依赖 to（箭头指向被依赖的一方，即"调用方向"）
  function modEdges() {
    const out = [];
    MODULES.forEach((m) => m.dependsOn.forEach((t) => out.push({ from: m.id, to: t })));
    return out;
  }

  function renderModules() {
    const box = $('#moduleGrid');
    if (!box) return;
    box.innerHTML = MODULES.map((m) => `
      <article class="mod-card${m.id === 'common' ? ' is-base' : ''}" data-mod="${m.id}">
        <button class="mod-card-head" type="button" aria-expanded="false">
          <span class="mod-card-name">${esc(m.name)}</span>
          <span class="mod-card-cn">${esc(m.cn)}</span>
          <span class="mod-card-lines">${m.lines} 行</span>
          <span class="kn-caret">▶</span>
        </button>
        <p class="mod-card-role">${rich(m.role)}</p>
        <div class="mod-card-meta">
          <span class="mod-meta"><b>${m.files}</b> 文件</span>
          <span class="mod-meta"><b>${m.fanin}</b> 个模块依赖它</span>
          <span class="mod-meta"><b>${m.dependsOn.length}</b> 个它依赖</span>
        </div>
        <div class="mod-card-rel">
          <span class="rel-label">依赖</span>
          <span class="rel-chips">${m.dependsOn.length
            ? m.dependsOn.map((d) => `<button class="rel-chip" type="button" data-goto="${d}">${esc(d)}</button>`).join('')
            : '<span class="rel-none">无 —— 它是地基</span>'}</span>
        </div>
        <div class="mod-card-rel">
          <span class="rel-label">被依赖</span>
          <span class="rel-chips">${m.dependedBy.length
            ? m.dependedBy.map((d) => `<button class="rel-chip" type="button" data-goto="${d}">${esc(d)}</button>`).join('')
            : '<span class="rel-none">顶层编排，无人依赖</span>'}</span>
        </div>
        <div class="mod-card-body">
          <div class="mod-card-block">
            <h4>职责</h4>
            <ul class="detail-list">${m.resp.map((r) => `<li>${rich(r)}</li>`).join('')}</ul>
          </div>
          <div class="mod-card-block">
            <h4>主要文件</h4>
            <div class="mod-files">${m.keyFiles.map(([f, n]) =>
              `<span class="mod-file"><code>${esc(f)}</code><i>${n}</i></span>`).join('')}</div>
          </div>
          ${m.code ? `<pre class="dec-code">${esc(m.code)}</pre>` : ''}
        </div>
      </article>`).join('');

    box.querySelectorAll('.mod-card-head').forEach((h) => {
      h.addEventListener('click', () => {
        const c = h.closest('.mod-card');
        const open = c.classList.toggle('open');
        h.setAttribute('aria-expanded', String(open));
      });
    });

    // 悬停卡片 → 高亮图上节点与边
    box.querySelectorAll('.mod-card').forEach((c) => {
      c.addEventListener('mouseenter', () => setModHover(c.dataset.mod));
      c.addEventListener('mouseleave', () => setModHover(null));
    });

    // 关系标签 → 跳到图上对应节点
    box.querySelectorAll('.rel-chip').forEach((ch) => {
      ch.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const node = document.querySelector(`#depGraph .mod-node[data-mod="${ch.dataset.goto}"]`);
        if (node) { node.scrollIntoView({ behavior: 'smooth', block: 'center' }); node.focus(); }
      });
    });
  }

  let modHover = null;

  function setModHover(id) {
    const box = $('#depGraph');
    const grid = $('#moduleGrid');
    if (!box) return;
    modHover = id;

    const rel = new Set();
    if (id) {
      rel.add(id);
      const m = modById(id);
      if (m) {
        m.dependsOn.forEach((x) => rel.add(x));
        m.dependedBy.forEach((x) => rel.add(x));
      }
    }

    box.classList.toggle('focus', !!id);
    box.querySelectorAll('.mod-node').forEach((n) => {
      n.classList.toggle('hot', !!id && rel.has(n.dataset.mod));
      n.classList.toggle('cold', !!id && !rel.has(n.dataset.mod));
    });
    box.querySelectorAll('.mod-edge').forEach((p) => {
      p.classList.toggle('hot', !!id && (p.dataset.from === id || p.dataset.to === id));
    });

    if (grid) {
      grid.classList.toggle('focus', !!id);
      grid.querySelectorAll('.mod-card').forEach((c) => {
        c.classList.toggle('hot', !!id && rel.has(c.dataset.mod));
        c.classList.toggle('cold', !!id && !rel.has(c.dataset.mod));
      });
    }
  }

  function renderDepGraph() {
    const box = $('#depGraph');
    if (!box) return;
    box.innerHTML =
      '<svg class="edges" aria-hidden="true"></svg>' +
      MOD_ROWS.map((row) => `
        <div class="mod-row">
          ${row.map((id) => {
            const m = modById(id);
            return `<button class="mod-node${id === 'common' ? ' is-base' : ''}" data-mod="${id}"
                            type="button" title="${esc(m.name)} · ${esc(m.cn)} · ${m.lines} 行">
                      ${esc(m.name)}<span class="mod-node-fan">↑${m.fanin}</span>
                    </button>`;
          }).join('')}
        </div>`).join('');

    box.querySelectorAll('.mod-node').forEach((n) => {
      const id = n.dataset.mod;
      n.addEventListener('mouseenter', () => setModHover(id));
      n.addEventListener('mouseleave', () => setModHover(null));
      n.addEventListener('focus', () => setModHover(id));
      n.addEventListener('blur', () => setModHover(null));
      n.addEventListener('click', () => {
        const card = document.querySelector(`#moduleGrid .mod-card[data-mod="${id}"]`);
        if (!card) return;
        card.classList.add('open');
        const h = card.querySelector('.mod-card-head');
        if (h) h.setAttribute('aria-expanded', 'true');
        card.scrollIntoView({ behavior: 'smooth', block: 'center' });
      });
    });

    drawModEdges();
    if (window.ResizeObserver) {
      new ResizeObserver(() => drawModEdges()).observe(box);
    } else {
      window.addEventListener('resize', drawModEdges);
    }
    window.addEventListener('load', drawModEdges);
  }

  // 用 SVG 手绘贝塞尔连线。坐标在渲染后实测，因此对字体与换行都不敏感。
  function drawModEdges() {
    const box = $('#depGraph');
    const svg = box && box.querySelector('svg.edges');
    if (!box || !svg) return;

    const bb = box.getBoundingClientRect();
    if (bb.width < 20 || bb.height < 20) return;
    svg.setAttribute('viewBox', `0 0 ${bb.width} ${bb.height}`);
    svg.setAttribute('width', bb.width);
    svg.setAttribute('height', bb.height);

    const pos = {};
    box.querySelectorAll('.mod-node').forEach((n) => {
      const r = n.getBoundingClientRect();
      pos[n.dataset.mod] = {
        x: r.left - bb.left + r.width / 2,
        top: r.top - bb.top,
        bottom: r.top - bb.top + r.height,
        cy: r.top - bb.top + r.height / 2
      };
    });

    let html = `<defs>
      <marker id="modAr" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z"/>
      </marker>
      <marker id="modArCyc" viewBox="0 0 10 10" refX="9" refY="5"
              markerWidth="6" markerHeight="6" orient="auto-start-reverse">
        <path d="M0,0 L10,5 L0,10 z"/>
      </marker>
    </defs>`;

    // 跨越多个层级的长边向外绕行，避免压在中间的节点上。
    // 分流规则：目标偏左就向左绕、偏右就向右绕（同级边自然展开，不交叉）；
    // 目标几乎在正下方时按先后交替左右，避免同列的长边叠在一起。
    let centeredLong = 0;
    modEdges().forEach((e) => {
      const a = pos[e.from], b = pos[e.to];
      if (!a || !b) return;

      const down = b.cy > a.cy;
      const y1 = down ? a.bottom : a.top;
      const y2 = down ? b.top : b.bottom;
      const span = Math.abs(y2 - y1);
      const dx = b.x - a.x;

      let bow = 0;
      if (!down) {
        bow = 30;                                  // 反向边让开正向边
      } else if (span > 70) {
        let sign;
        if (Math.abs(dx) > 25) {
          sign = dx > 0 ? 1 : -1;
        } else {
          centeredLong += 1;
          sign = centeredLong % 2 ? 1 : -1;
        }
        bow = sign * Math.min(100, 32 + span * 0.3);
      }

      const my = (y1 + y2) / 2;
      const d = `M${a.x},${y1} C${a.x + bow},${my} ${b.x + bow},${my} ${b.x},${y2}`;
      html += `<path class="mod-edge${down ? '' : ' cycle'}"
                     data-from="${e.from}" data-to="${e.to}" d="${d}" fill="none"
                     marker-end="url(#${down ? 'modAr' : 'modArCyc'})"/>`;
    });

    svg.innerHTML = html;
  }

  /* ═══════════════════════ 渲染：数据流步进器 ═══════════════════════ */

  let flowActive = 0;
  let flowTimer = null;

  function renderFlow() {
    const list = $('#flowSteps');
    if (!list) return;
    list.innerHTML = FLOW.map((s, i) => `
      <li>
        <button class="flow-step${i === flowActive ? ' active' : ''}${i < flowActive ? ' done' : ''}"
                data-idx="${i}" type="button">
          <span class="flow-step-n">${i + 1}</span>
          <span>
            <span class="flow-step-t">${esc(s.t)}</span><br>
            <span class="flow-step-actor">${esc(s.a)}</span>
          </span>
        </button>
      </li>`).join('');

    list.querySelectorAll('.flow-step').forEach((btn) => {
      btn.addEventListener('click', () => {
        stopFlow();
        flowActive = Number(btn.dataset.idx);
        syncFlow();
      });
    });
    renderFlowDetail();
  }

  function syncFlow() {
    const list = $('#flowSteps');
    if (!list) return;
    list.querySelectorAll('.flow-step').forEach((b, i) => {
      b.classList.toggle('active', i === flowActive);
      b.classList.toggle('done', i < flowActive);
    });
    const counter = $('#flowCounter');
    if (counter) counter.textContent = `${flowActive + 1} / ${FLOW.length}`;
    renderFlowDetail();
  }

  function renderFlowDetail() {
    const box = $('#flowDetail');
    if (!box) return;
    const s = FLOW[flowActive];
    box.innerHTML = `
      <div class="detail-head">
        <span class="detail-dot"></span>
        <h3>第 ${flowActive + 1} 步 · ${esc(s.t)}</h3>
      </div>
      <p class="detail-sub">执行者：${esc(s.a)}</p>
      <div class="detail-block">
        <h4>这一步做什么</h4>
        <p>${rich(s.d)}</p>
      </div>
      <div class="detail-block">
        <h4>进度</h4>
        <div class="chip-row">
          ${FLOW.map((_, i) => `<span class="chip${i === flowActive ? ' chip-accent' : ''}">${i + 1}</span>`).join('')}
        </div>
      </div>`;
  }

  function startFlow() {
    stopFlow();
    flowActive = 0;
    syncFlow();
    flowTimer = setInterval(() => {
      if (flowActive >= FLOW.length - 1) { stopFlow(); return; }
      flowActive += 1;
      syncFlow();
    }, 1600);
    const btn = $('#flowPlay');
    if (btn) btn.textContent = '⏸ 暂停';
  }

  function stopFlow() {
    if (flowTimer) { clearInterval(flowTimer); flowTimer = null; }
    const btn = $('#flowPlay');
    if (btn) btn.textContent = '▶ 自动播放';
  }

  /* ═══════════════════════ 渲染：设计决策 ═══════════════════════ */

  let decFilter = 'all';

  function renderDecisionFilter() {
    const bar = $('#decisionFilter');
    if (!bar) return;
    const cats = [['all', '全部', DECISIONS.length]]
      .concat(Object.keys(CATS).map((k) => [
        k, CATS[k].name, DECISIONS.filter((d) => d.cat === k).length
      ]));
    bar.innerHTML = cats.map(([k, name, n]) => `
      <button class="filter-btn${k === decFilter ? ' active' : ''}" data-cat="${k}" type="button">
        ${esc(name)} ${n}
      </button>`).join('');
    bar.querySelectorAll('.filter-btn').forEach((b) => {
      b.addEventListener('click', () => {
        decFilter = b.dataset.cat;
        renderDecisionFilter();
        renderDecisions();
      });
    });
  }

  function renderDecisions() {
    const box = $('#decGrid');
    if (!box) return;
    const list = decFilter === 'all' ? DECISIONS : DECISIONS.filter((d) => d.cat === decFilter);
    box.innerHTML = list.map((d) => {
      const c = CATS[d.cat];
      return `
      <article class="dec" style="--cat-color:${c.color};--cat-soft:${c.soft}">
        <div class="dec-top">
          <span class="dec-idx">§${esc(d.id)}</span>
          <span class="dec-cat">${esc(c.name)}</span>
        </div>
        <h3>${esc(d.t)}</h3>
        <div class="dec-row">
          <span class="dec-label">为什么这样做</span>
          <p>${rich(d.why)}</p>
        </div>
        ${d.code ? `<pre class="dec-code">${esc(d.code)}</pre>` : ''}
        <div class="dec-row dec-cost">
          <span class="dec-label">代价 / 边界</span>
          <p>${rich(d.cost)}</p>
        </div>
      </article>`;
    }).join('');
  }

  /* ═══════════════════════ 渲染：实验 ═══════════════════════ */

  function renderExperiments() {
    const box = $('#expGrid');
    if (!box) return;
    box.innerHTML = EXPERIMENTS.map((e) => {
      let body = '';
      if (e.rows) {
        body = `<table class="exp-table">
          <thead><tr>${e.head.map((h) => `<th${h === e.head[0] ? '' : ' style="text-align:right"'}>${esc(h)}</th>`).join('')}</tr></thead>
          <tbody>${e.rows.map((r) => `<tr>${r.map((c, i) => {
            const cls = i === 0 ? '' : 'num';
            const isDelta = /^[−+]/.test(c);
            return `<td class="${cls}${isDelta ? (c.startsWith('−') ? ' up' : ' down') : ''}">${esc(c)}</td>`;
          }).join('')}</tr>`).join('')}</tbody>
        </table>`;
      }
      if (e.bars) {
        const maxPsi = Math.max(...e.bars.map((b) => b.psi));
        body = `<div class="bars">${e.bars.map((b) => {
          const pct = Math.max(2, (b.psi / maxPsi) * 100);
          const col = b.cls === 'ok' ? 'var(--ok)' : b.cls === 'warn' ? 'var(--warn)' : 'var(--bad)';
          return `<div class="bar-row">
            <span class="bar-name">${esc(b.name)}</span>
            <span class="bar-track"><span class="bar-fill" style="width:${pct.toFixed(1)}%;background:${col}"></span></span>
            <span class="bar-val">${b.psi.toFixed(2)}</span>
          </div>`;
        }).join('')}</div>
        <table class="exp-table" style="margin-top:14px">
          <thead><tr><th>场景</th><th style="text-align:right">PSI</th><th style="text-align:right">CER 倍数</th></tr></thead>
          <tbody>${e.bars.map((b) => `<tr><td>${esc(b.name)}</td>
            <td class="num">${b.psi.toFixed(4)}</td>
            <td class="num">${b.cer.toFixed(2)}×</td></tr>`).join('')}</tbody>
        </table>`;
      }
      return `
      <article class="exp">
        <span class="exp-tag">${esc(e.tag)}</span>
        <h3>${esc(e.t)}</h3>
        <p class="exp-q">${esc(e.q)}</p>
        ${body}
        <div class="exp-concl">${rich(e.concl)}</div>
      </article>`;
    }).join('');
  }

  /* ═══════════════════════ 渲染：知识清单 ═══════════════════════ */

  const KN_KEY = 'speechops.guide.checked';
  let knChecked = loadKn();
  let knPrio = 'all';

  // 每个主题一个色相，让长列表不至于糊成一片
  const GROUP_COLORS = {
    cloud:   ['#1f52c9', '#eaf1ff'],
    mlops:   ['#6b46c1', '#f1ecfd'],
    model:   ['#0d7d8c', '#e2f5f7'],
    serving: ['#12a150', '#e7f7ee'],
    observe: ['#c97a06', '#fdf3e2'],
    drift:   ['#d93a3a', '#fdecec'],
    audio:   ['#1f52c9', '#eaf1ff'],
    eng:     ['#6b46c1', '#f1ecfd']
  };

  function loadKn() {
    try {
      const raw = localStorage.getItem(KN_KEY);
      const arr = raw ? JSON.parse(raw) : [];
      return new Set(Array.isArray(arr) ? arr : []);
    } catch (_) { return new Set(); }
  }

  function saveKn() {
    try { localStorage.setItem(KN_KEY, JSON.stringify(Array.from(knChecked))); }
    catch (_) { /* 隐私模式下 localStorage 可能不可用，忽略即可 */ }
  }

  /* ── 学习路径 ── */

  function renderKnPath() {
    const box = $('#knPath');
    if (!box) return;
    box.innerHTML = STAGES.map((s, i) => {
      const groups = s.groups.map((g) => KNOWLEDGE.find((k) => k.id === g)).filter(Boolean);
      const total = groups.reduce((a, g) => a + g.items.length, 0);
      const core = groups.reduce((a, g) => a + g.items.filter((it) => it.p === 'core').length, 0);
      return `
      <div class="kn-stage">
        <div class="kn-stage-top">
          <span class="kn-stage-n">${i + 1}</span>
          <span class="kn-stage-t">${esc(s.t)}</span>
          <span class="kn-stage-tag">${esc(s.tag)}</span>
        </div>
        <p class="kn-stage-sub">${esc(s.sub)}</p>
        <p class="kn-stage-desc">${esc(s.d)}</p>
        <div class="kn-stage-chips">${groups.map((g) =>
          `<span class="kn-stage-chip">${esc(g.icon)} ${esc(g.title)}</span>`).join('')}</div>
        <div class="kn-stage-meta">
          <span>${groups.length} 个主题</span><span>${total} 个知识点</span>
          <span class="kn-stage-core">核心 ${core}</span>
        </div>
      </div>`;
    }).join('');
  }

  /* ── 优先级筛选 ── */

  function renderKnFilter() {
    const bar = $('#knFilter');
    if (!bar) return;
    const all = KNOWLEDGE.reduce((a, g) => a + g.items.length, 0);
    const opts = [['all', '全部', all]].concat(Object.keys(PRIO).map((k) => [
      k, PRIO[k].name, KNOWLEDGE.reduce((a, g) => a + g.items.filter((it) => it.p === k).length, 0)
    ]));
    bar.innerHTML = opts.map(([k, name, n]) => {
      const st = k === 'all' ? '' : `style="--pc:${PRIO[k].soft};--pcf:${PRIO[k].color};--pcb:${PRIO[k].line}"`;
      return `<button class="filter-btn prio-btn${k === knPrio ? ' active' : ''}"
                      data-prio="${k}" type="button" ${st}>${esc(name)} ${n}</button>`;
    }).join('');
    bar.querySelectorAll('.filter-btn').forEach((b) => {
      b.addEventListener('click', () => {
        knPrio = b.dataset.prio;
        renderKnFilter();
        applyKnFilter();
      });
    });
  }

  function applyKnFilter() {
    $$('#knGroups .kn-group').forEach((g) => {
      const grp = KNOWLEDGE.find((x) => x.id === g.dataset.gid);
      if (!grp) return;
      let shown = 0;
      g.querySelectorAll('.kn-item').forEach((li, i) => {
        const it = grp.items[i];
        if (!it) return;
        const ok = knPrio === 'all' || it.p === knPrio;
        li.classList.toggle('hide', !ok);
        if (ok) shown += 1;
      });
      g.classList.toggle('empty', shown === 0);
      // 筛选时自动展开有内容的组
      if (knPrio !== 'all' && shown > 0) {
        g.classList.add('open');
        const h = g.querySelector('.kn-group-head');
        if (h) h.setAttribute('aria-expanded', 'true');
      }
    });
  }

  /* ── 清单本体 ── */

  function renderKnowledge() {
    const box = $('#knGroups');
    if (!box) return;
    box.innerHTML = KNOWLEDGE.map((g) => {
      const [color, soft] = GROUP_COLORS[g.id] || ['#1f52c9', '#eaf1ff'];
      const total = g.items.length;
      const done = g.items.filter((_, i) => knChecked.has(`${g.id}:${i}`)).length;
      const core = g.items.filter((it) => it.p === 'core').length;
      return `
      <section class="kn-group${g.id === KNOWLEDGE[0].id ? ' open' : ''}"
               data-gid="${esc(g.id)}" style="--cat-color:${color};--cat-soft:${soft}">
        <button class="kn-group-head" type="button"
                aria-expanded="${g.id === KNOWLEDGE[0].id ? 'true' : 'false'}">
          <span class="kn-group-icon">${esc(g.icon)}</span>
          <span class="kn-group-title">${esc(g.title)}</span>
          <span class="kn-group-core">核心 ${core}</span>
          <span class="kn-group-count" data-count>${done}/${total}</span>
          <span class="kn-caret">▶</span>
        </button>
        <div class="kn-group-body">
          <ul class="kn-list">
            ${g.items.map((it, i) => {
              const key = `${g.id}:${i}`;
              const p = PRIO[it.p];
              return `<li class="kn-item" data-prio="${it.p}">
                <label>
                  <input type="checkbox" data-key="${esc(key)}"${knChecked.has(key) ? ' checked' : ''}>
                  <span class="prio" style="--pc:${p.soft};--pcf:${p.color};--pcb:${p.line}">${esc(p.name)}</span>
                  <span class="kn-item-text">${rich(it.t)}</span>
                </label>
              </li>`;
            }).join('')}
          </ul>
        </div>
      </section>`;
    }).join('');

    box.querySelectorAll('.kn-group-head').forEach((head) => {
      head.addEventListener('click', () => {
        const g = head.closest('.kn-group');
        const open = g.classList.toggle('open');
        head.setAttribute('aria-expanded', String(open));
      });
    });

    box.querySelectorAll('input[type="checkbox"]').forEach((cb) => {
      cb.addEventListener('change', () => {
        const key = cb.dataset.key;
        if (cb.checked) knChecked.add(key); else knChecked.delete(key);
        saveKn();
        updateKnCounts();
      });
    });

    applyKnFilter();
    updateKnCounts();
  }

  function updateKnCounts() {
    let total = 0, done = 0;
    KNOWLEDGE.forEach((g) => {
      total += g.items.length;
      done += g.items.filter((_, i) => knChecked.has(`${g.id}:${i}`)).length;
    });

    // 每组的小计数
    $$('#knGroups .kn-group').forEach((g) => {
      const gid = g.dataset.gid;
      const grp = KNOWLEDGE.find((x) => x.id === gid);
      if (!grp) return;
      const d = grp.items.filter((_, i) => knChecked.has(`${gid}:${i}`)).length;
      const c = g.querySelector('[data-count]');
      if (c) c.textContent = `${d}/${grp.items.length}`;
    });

    const bar = $('#knBar');
    if (bar) bar.style.width = total ? `${(done / total) * 100}%` : '0%';
    const txt = $('#knText');
    if (txt) txt.textContent = `${done} / ${total}`;
  }

  /* ═══════════════════════ 导航交互 ═══════════════════════ */

  function initNav() {
    const toggle = $('#navToggle');
    const nav = $('#nav');
    if (toggle && nav) {
      toggle.addEventListener('click', () => {
        const open = nav.classList.toggle('open');
        toggle.setAttribute('aria-expanded', String(open));
      });
      nav.querySelectorAll('a').forEach((a) => {
        a.addEventListener('click', () => {
          nav.classList.remove('open');
          toggle.setAttribute('aria-expanded', 'false');
        });
      });
    }

    // 滚动高亮当前区块
    const links = $$('#nav a');
    const targets = links
      .map((a) => document.querySelector(a.getAttribute('href')))
      .filter(Boolean);
    if (!targets.length) return;

    const onScroll = () => {
      const y = window.scrollY + 120;
      let idx = 0;
      targets.forEach((t, i) => { if (t.offsetTop <= y) idx = i; });
      links.forEach((a, i) => a.classList.toggle('active', i === idx));
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ═══════════════════════ 启动 ═══════════════════════ */

  function init() {
    renderHero();
    renderPains();
    renderArch();
    renderModules();
    renderDepGraph();
    renderFlow();
    renderDecisionFilter();
    renderDecisions();
    renderExperiments();
    renderKnPath();
    renderKnFilter();
    renderKnowledge();
    initNav();

    const play = $('#flowPlay');
    if (play) play.addEventListener('click', () => {
      if (flowTimer) stopFlow(); else startFlow();
    });
    const prev = $('#flowPrev');
    if (prev) prev.addEventListener('click', () => {
      stopFlow();
      flowActive = (flowActive - 1 + FLOW.length) % FLOW.length;
      syncFlow();
    });
    const next = $('#flowNext');
    if (next) next.addEventListener('click', () => {
      stopFlow();
      flowActive = (flowActive + 1) % FLOW.length;
      syncFlow();
    });

    const expand = $('#knExpand');
    if (expand) expand.addEventListener('click', () => {
      $$('#knGroups .kn-group').forEach((g) => {
        g.classList.add('open');
        const h = g.querySelector('.kn-group-head');
        if (h) h.setAttribute('aria-expanded', 'true');
      });
    });
    const collapse = $('#knCollapse');
    if (collapse) collapse.addEventListener('click', () => {
      $$('#knGroups .kn-group').forEach((g) => {
        g.classList.remove('open');
        const h = g.querySelector('.kn-group-head');
        if (h) h.setAttribute('aria-expanded', 'false');
      });
    });
    const reset = $('#knReset');
    if (reset) reset.addEventListener('click', () => {
      knChecked = new Set();
      saveKn();
      $$('#knGroups input[type="checkbox"]').forEach((cb) => { cb.checked = false; });
      updateKnCounts();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
