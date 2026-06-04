# 李白行迹地图复刻项目

纯 HTML + CSS + 原生 JavaScript + Google Maps JavaScript API，无 npm、无构建、无框架。

## 运行方式

- 直接双击 `index.html` 可打开页面。
- 推荐本地服务方式运行，JSON 会按真实文件加载：

```powershell
cd C:\Users\73423\Desktop\Projectbs\ch
python -m http.server 8765
```

然后访问：

```text
http://127.0.0.1:8765/index.html
```

## 逆向与实现步骤记录

## 数据方案

- 页面现在优先读取 `docs` 下的四阶段 TEI/CSV：
  - `docs/stage1-youth_tei.xml`
  - `docs/stage2-travels_tei.xml`
  - `docs/stage3-changan_tei.xml`
  - `docs/stage4-exile-late_tei.xml`
  - `docs/libai_4period_theme_density.csv`
  - `docs/libai_4period_summary(1).csv`
- `js/tei-data-loader.js` 会解析 TEI 中每首诗的 `title/date/placeName/geo/keywords/lg/l`，生成地图点、阶段数据和诗歌卡片。
- 右侧 `Stage 1` 到 `Stage 4` 按钮会切换当前阶段地图点；底部统计图读取两个总 CSV，不随阶段目录变化。
- 每个 Stage 切换后，地图左上详情窗会显示本阶段主要作品；每首作品包含诗名、年份、体裁和诗文内容。
- 左上详情窗支持关闭，关闭后可通过地图左上角“打开详情”标签重新打开。
- 底部统计同时提供两种表现：主题密度柱状图和四阶段主题词云。
- `data/cnkgraph-like-libai.json` 使用目标站相近字段：`Traces`、`Markers`、`Lines`、`Activities`、`Poems`、`Detail`。
- `js/cnkgraph-adapter.js` 会把同构字段自动转换为页面内部使用的 `locations`、`timeline`、`poems`、`biography`。
- 当前文件内容为本地自建摘要和样本，不复制目标站完整原始内容。
- 如果后续你有授权数据，可以按同一字段替换 `data/cnkgraph-like-libai.json`，页面会优先加载它。

### STEP1：分析网站整体结构

- 目标页采用顶部导航、左侧抽屉、地图主栏、右侧详情栏、底部版权的三栏布局。
- 地图是页面核心，右侧详情与上方统计/面包屑作为状态反馈。
- 本项目还原为 Header、Hero、地图主栏、右侧详情、时间线、生平章节与 Footer。

### STEP2：分析 DOM 与组件结构

- 原页核心组件包括：导航、Offcanvas 菜单、地图容器、背景地图选择器、右侧详情、统计表、上传区。
- 本项目组件包括：Header、Drawer、Tab、Modal、InfoWindow、Timeline、PlaceCard、PoemCard、ChapterCard。

### STEP3：分析 CSS 与视觉系统

- 原页使用浅底、Bootstrap 间距、白色卡片、轻边框、信息块和地图控件浮层。
- 本项目用 CSS 变量统一字体、颜色、阴影、圆角、间距和暗色主题。

### STEP4：分析交互逻辑

- 原页通过地点、作者、路线、详情之间互相触发地图重绘和弹窗。
- 本项目实现 marker、时间线、诗词卡片、抽屉列表、章节卡片之间的统一状态联动。

### STEP5：分析 API 与数据结构

- 原页结构主要围绕 `Traces / Markers / Lines / Detail / RequestUri`。
- 本项目禁止调用原 API，替换为本地 `locations / timeline / poems / biography` 四组 JSON。

### STEP6：设计本地 JSON 数据结构

- `data/locations.json`：地点、路线、GeoJSON 区域。
- `data/timeline.json`：李白生平事件。
- `data/poems.json`：诗词样本与创作地点。
- `data/biography.json`：人物简介、关系、章节。

### STEP7：重建 HTML 页面结构

- `index.html` 按工程化模块引用 CSS/JS。
- 内置 `fallback-data`，保证双击 `index.html` 时即使浏览器拦截本地 `fetch` 也能运行。

### STEP8：重建 CSS 系统

- `css/main.css`：变量、基础样式。
- `css/layout.css`：页面网格与响应式。
- `css/component.css`：卡片、按钮、抽屉、弹窗。
- `css/map.css`：地图、marker、InfoWindow、图例。
- `css/timeline.css`：时间线。
- `css/animation.css`：骨架屏、marker 呼吸、过渡动效。

### STEP9：重建 JavaScript 交互

- `js/app.js`：状态编排。
- `js/ui.js`：DOM 渲染与 UI 控件。
- `js/timeline.js`：时间线渲染、筛选、点击。
- `js/route.js`：路线数据计算。
- `js/animation.js`：`requestAnimationFrame` 动画。
- `js/data-loader.js`：JSON 加载和索引。

### STEP10：接入 Google Maps API

- `js/map.js` 初始化 Google Maps。
- 实现自定义地图样式、HTML marker、聚合、InfoWindow、Polyline、Data Layer GeoJSON。

### STEP11：替换为李白主题数据

- 全部内容替换为李白生平、诗词、路线、关系、时间线和地点分布。

### STEP12：实现地图联动与动画

- 点击 marker 同步时间线、详情卡、诗词卡。
- 点击时间线自动平移、缩放、高亮 marker、播放路线动画。
- 路线绘制动画使用 `requestAnimationFrame`。

### STEP13：实现滚动联动与时间线系统

- 时间线和章节卡进入视口后触发地点选择。
- 搜索会同步过滤时间线与地图 marker。

### STEP14：统一调试与视觉修复

- 已完成 JSON UTF-8 校验、JS 语法检查、资源引用检查和本地 HTTP 读取检查。

## 风险点

- Google Maps API Key 必须允许当前访问来源；如果浏览器控制台报 Referer 或 Billing 错误，需要在 Google Cloud Console 调整。
- 中国大陆网络访问 Google Maps 可能不稳定。
- 双击运行时使用内联兜底数据；推荐 HTTP 服务运行以验证 `/data/*.json` 文件加载链路。
