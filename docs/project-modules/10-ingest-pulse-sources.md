# packages/ingest 模块文档：Pulse 来源抓取与解析

## 功能定位

`packages/ingest` 是 Pulse 的来源接入层。它定义 source adapter interface、HTTP fetch helper、robots/conditional fetch、HTML/RSS selector 工具和一组政府来源 adapters。server 的 scheduled job 使用它抓取 IRS、州税务机构、FEMA 等来源，生成 snapshot 和 signal，再进入 AI extraction 和 firm alert fan-out。

该模块不负责最终业务应用，不写 tenant obligation。它只把外部来源转换成可追踪的来源快照和候选信号。

## 关键路径

| 路径                                    | 职责                                                        |
| --------------------------------------- | ----------------------------------------------------------- |
| `packages/ingest/src/types.ts`          | SourceAdapter、IngestCtx、snapshot/signal 类型              |
| `packages/ingest/src/adapters/index.ts` | live Pulse adapters 注册                                    |
| `packages/ingest/src/http.ts`           | headers、rate limit、robots、conditional fetch、archive raw |
| `packages/ingest/src/selectors.ts`      | HTML stripping、link extraction、selector helper            |
| `packages/ingest/src/fetcher.ts`        | fetcher registry，cloudflare/browserless/govdelivery        |

## 主要功能

### Source adapter

每个 adapter 描述：

- source id。
- tier: T1/T2/T3。
- jurisdiction。
- cron interval。
- fetcher 类型。
- 是否可创建 Pulse。
- `fetch(ctx)`。
- `parse(snapshot, ctx)`。

### 来源覆盖

当前 adapters 覆盖：

- IRS disaster/newsroom/guidance。
- TX Comptroller RSS。
- CA FTB newsroom/tax news/CDTFA。
- NY DTF press。
- FL DOR tips。
- WA DOR news/whats new。
- MA DOR press。
- FEMA declarations，T2 且默认不直接创建 Pulse。
- fixture adapter。

### Fetch helper

`http.ts` 处理：

- 默认 user agent。
- rate limit 常量。
- robots.txt check cache。
- ETag/Last-Modified conditional request。
- retry。
- raw archive 到 R2。
- stable external id。
- content hash。
- text excerpt。

### Selector helper

`selectors.ts` 提供轻量 HTML/RSS 解析工具：

- extract links。
- strip HTML。
- pick selector。

## 创新点

- **来源事实与 firm alert 解耦**：ingest 只产出 source-level snapshot/signal，事务所处理状态在 server/db 的 Pulse 模型里。
- **tier 化来源策略**：T1/T2/T3 可表达来源可信度、抓取频率和是否可直接创建 Pulse。
- **conditional fetch 降低成本与噪音**：ETag/Last-Modified 和 hash 减少重复解析。
- **raw archive 优先**：原始来源内容可归档到 R2，为后续审计和 AI extraction 复盘提供依据。

## 技术实现

### Ingest 流程

```mermaid
sequenceDiagram
  autonumber
  participant Cron as scheduled job
  participant Adapter as SourceAdapter
  participant HTTP as http helper
  participant R2 as raw archive
  participant DB as pulse source tables
  participant Queue as pulse.extract queue

  Cron->>Adapter: run fetch
  Adapter->>HTTP: conditional fetch
  HTTP->>R2: archive raw if configured
  HTTP-->>Adapter: snapshot
  Adapter->>Adapter: parse signal candidates
  Adapter-->>Cron: snapshots + signals
  Cron->>DB: persist source state/snapshot/signal
  Cron->>Queue: enqueue extraction if needed
```

### Adapter 结构

```mermaid
flowchart TB
  Adapter["SourceAdapter"]
  Metadata["id/tier/jurisdiction/cron"]
  Fetcher["fetch(ctx)"]
  Parser["parse(snapshot, ctx)"]
  Snapshot["SourceSnapshot"]
  Signal["SourceSignal"]

  Adapter --> Metadata
  Adapter --> Fetcher
  Fetcher --> Snapshot
  Adapter --> Parser
  Parser --> Signal
```

### Fetcher 选择

```mermaid
flowchart LR
  Adapter["adapter.fetcher"]
  Cloudflare["cloudflare fetch"]
  Browserless["browserless"]
  GovDelivery["govdelivery"]
  Registry["fetcher registry"]

  Adapter --> Registry
  Registry --> Cloudflare
  Registry --> Browserless
  Registry --> GovDelivery
```

## 架构图

```mermaid
flowchart TB
  subgraph Ingest["packages/ingest"]
    Types["types"]
    Adapters["adapters"]
    HTTP["http"]
    Selectors["selectors"]
    Fetcher["fetcher registry"]
  end

  subgraph Server["apps/server jobs"]
    Cron["runPulseIngest"]
    Extract["pulse.extract queue"]
    Alerts["firm Alerts review"]
  end

  Sources["Government sources"]
  R2[("R2 raw archive")]
  D1[("Pulse tables")]
  AI["packages/ai"]

  Cron --> Adapters
  Adapters --> HTTP
  HTTP --> Sources
  HTTP --> R2
  Adapters --> Selectors
  Cron --> D1
  Cron --> Extract
  Extract --> AI
  Extract --> Alerts
```

## 数据流与审计关系

1. Adapter 获取政府来源页面。
2. 保存 source snapshot 和 source state。
3. parse 生成 source signal。
4. queue 调用 AI 抽取 structured Pulse candidate。
5. 抽取成功后 fan-out 到 firm alert。
6. firm owner/manager review 后 apply/dismiss/snooze。
7. firm 用户 apply/revert 时写 audit/evidence。

`packages/ingest` 只覆盖第 1 到第 3 步，后续步骤由 server/jobs/procedures 负责。

## 当前限制

- HTML/RSS 解析工具偏轻量，对复杂政府页面可能需要 source-specific parser。
- Browserless/GovDelivery fetcher 需要部署环境配置支持。
- 来源页面结构变化可能导致解析退化，需要 fixture tests 和监控。
- FEMA 等 T2 来源默认不能直接创建 Pulse，需要人工或下游逻辑确认。

## 后续演进关注点

- 为每个 live adapter 增加 fixture snapshot 和 parse 测试。
- 记录 robots/cache 命中和 conditional fetch 指标。
- 将 source health 暴露给 ops UI，并建立 stale/quarantined 来源处理流程。
- 对同一公告跨来源重复出现的情况建立 dedupe 策略。
