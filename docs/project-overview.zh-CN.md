# LBE Chrome Wallet 项目总览

更新时间：2026-05-14  
语言：简体中文

## 1. 范围
`lbe-chrome-wallet` 是一个基于 `WXT + React + TypeScript` 的浏览器扩展钱包项目，当前重点聚焦 Cosmos 生态能力。

主要能力包括：
- 钱包创建、导入、解锁、自动锁定
- popup、onboarding、approval 等关键页面流程
- 向网页注入 Provider（`window.lbeWallet`）
- Cosmos 账户读取、签名、交易广播
- 基于 Dexie/IndexedDB 的本地数据持久化

## 2. 命名基线
建议统一采用以下命名口径：

| 名称 | 位置 | 含义 |
|---|---|---|
| `lbe-extension` | `package.json` | 包名 |
| `LBE Wallet` | `wxt.config.ts` manifest | 扩展展示名 |
| `window.lbeWallet` | `src/cosmos/provider/inpage/index.ts` | 对外公开 Provider API |

说明：
- 当前公开注入对象以 `window.lbeWallet` 为准。
- 兼容性标记（例如 `isLumexs`）可能仍存在，但不应作为对外命名基线。

## 3. 核心目录职责
| 目录 | 职责 |
|---|---|
| `src/entrypoints/popup` | 弹窗入口 |
| `src/entrypoints/onboarding` | 引导入口 |
| `src/entrypoints/background` | service worker 与控制器 |
| `src/entrypoints/content` | content bridge |
| `src/entrypoints/inpage.ts` | 页面上下文 Provider 注入 |
| `src/popup` | 页面与交互逻辑 |
| `src/components` | 通用组件 |
| `src/cosmos` | 领域逻辑（provider、storage、wallet、tx） |
| `src/shared` | 共享类型、协议、工具 |
| `scripts` | 合约/回归验证脚本 |
| `tests` | e2e 与手工回归资源 |
| `docs` | 架构/审计/回归文档 |
| `examples` | dApp 示例页面 |

## 4. 关键运行链路
### 4.1 dApp 调用链路
1. 网页调用 `window.lbeWallet.*`
2. inpage provider 发起请求
3. content script 桥接到 background
4. background provider controller 执行权限与能力校验
5. 返回响应

### 4.2 UI 调用链路
1. popup/onboarding 页面发起操作
2. 经共享消息协议到 background controller
3. background service 执行业务（keyring/preference/permission/session）
4. UI 接收结果更新状态

## 5. Provider API 基线
权威来源：`src/cosmos/provider/inpage/index.ts`。

关键方法：
- `window.lbeWallet.request({ method, params })`
- `window.lbeWallet.enable(chainIds)`
- `window.lbeWallet.disable(chainIds?)`
- `window.lbeWallet.getChainInfos()`
- `window.lbeWallet.getKey(chainId)`
- `window.lbeWallet.signAmino(chainId, signer, signDoc)`
- `window.lbeWallet.signDirect(chainId, signer, signDoc)`
- `window.lbeWallet.signArbitrary(chainId, signer, data)`
- `window.lbeWallet.suggestChain(chainInfo)`

注入 signer helper：
- `window.getOfflineSigner(chainId)`
- `window.getOfflineSignerOnlyAmino(chainId)`
- `window.getOfflineSignerAuto(chainId)`

初始化事件：
- `lbeWallet#initialized`

## 6. 数据层
- `chrome.storage.local`：扩展级持久状态
- `Dexie (IndexedDB)`：钱包实体数据（钱包/账户/地址/链/资产等）
- UI 状态（Redux/页面状态）：展示态与会话态

说明：
- 内部数据库名可能仍为 `LumexsDatabase`。这是内部存储命名，不影响公开 API 命名基线。

## 7. 验证基线
建议命令：

```bash
corepack yarn compile
corepack yarn verify:stage2
corepack yarn verify:css:colors
corepack yarn verify:i18n
corepack yarn build
```

核心验证资产：
- `scripts/*` 合约与运行时检查
- `tests/e2e/verify-browser-e2e-regression-baseline.mjs`
- `tests/manual/provider-regression.html`
- `examples/lbe-test-dapp/`

## 8. 开源审查建议
对于“审计导向开源”建议：
- 文档与实现命名一致（统一 `window.lbeWallet`）
- 持续覆盖连接/签名/发送/跨域隔离/审批流程回归
- 持续更新审计边界与可复现构建文档
- 尽量避免将功能硬门禁和文档文案强耦合
