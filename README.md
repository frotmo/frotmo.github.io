# frotmo 的学习笔记

可视化学习文档集合，托管于 GitHub Pages。

**在线阅读：** https://frotmo.github.io/

## 这里放什么

不是教程摘抄，而是把一个个真实项目里的**架构、取舍和踩过的坑**讲明白。
每篇都力求做到：能看懂、能验证、能照着复现。

## 目录结构

```
.
├── index.html            # 主页（博客式入口，所有内容由清单驱动）
├── assets/
│   ├── hub.css           # 主页样式
│   ├── hub.js            # 主页交互
│   └── manifest.js       # ★ 站点清单 —— 唯一需要维护的文件
├── notes/                # 每篇笔记一个自包含目录
│   └── speechops-architecture/
│       ├── index.html
│       ├── styles.css
│       └── app.js
├── .nojekyll             # 关闭 Jekyll 处理
└── README.md
```

## 新增一篇笔记

1. 在 `notes/` 下新建 `<slug>/`，入口文件名必须是 `index.html`。
   目录自包含，自己的 CSS / JS / 图片都放里面，用相对路径互相引用。
2. 在 `assets/manifest.js` 的 `notes` 数组里加一条记录。
   最少只需 `slug`、`title`、`category`、`path` 四项。
3. 提交推送，Pages 约 1 分钟后自动重新部署。

### 两个容易踩的坑

- `path` 必须以 `/` 结尾，且**不要以 `/` 开头**。用相对路径才能保证
  以后换域名或加子路径都不用改代码。
- `slug` 必须与 `notes/` 下的目录名完全一致，否则链接会 404。

## 技术约定

- **零外部依赖**：无 CDN、无 Web Font、无构建步骤，可离线打开。
  用系统字体栈，颜色语义全站统一（蓝=主色、绿=正常、琥珀=需关注、红=风险）。
- **内容与代码分离**：主页不写死任何笔记信息，全部从 `assets/manifest.js` 渲染。
- **每篇笔记互不干扰**：各自的样式作用域在自己的目录内，
  改一篇的样式不会影响别的笔记。

## 部署

推送到 `main` 分支即自动部署（GitHub Pages，源为 `main` 分支根目录）。

## 本地预览

因为站点是纯静态的，任何静态服务器都可以：

```bash
python -m http.server 8080
# 然后打开 http://localhost:8080
```

也可以直接双击 `index.html` —— 清单用的是 JS 而非 JSON，
正是为了让 `file://` 协议下也能正常渲染。
