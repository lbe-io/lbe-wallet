# LBE Chrome Wallet

[English](./README.md) | [简体中文](./README.zh-CN.md)

LBE Chrome Wallet 是一个基于 `WXT + React + TypeScript` 构建的浏览器扩展钱包项目，当前聚焦 Cosmos 生态能力。

## 开源定位

本仓库采用“审计型开源”策略，核心目标是安全透明与可验证，而不是社区功能共建。

主要目标：

1. 让安全研究者和用户可以审查钱包实现，验证不存在恶意处理助记词或私钥的逻辑。
2. 支持从公开源码到发布产物的可复现构建与校验流程。

协作边界：

1. 当前不接收外部功能类 PR。
2. 接收私下安全漏洞报告与可复现的严重正确性问题报告。

请优先阅读：

1. [CONTRIBUTING.md](./CONTRIBUTING.md)
2. [SECURITY.md](./SECURITY.md)
3. [SECURITY_BOUNDARY.md](./SECURITY_BOUNDARY.md)
4. [REPRODUCIBLE_BUILD.md](./REPRODUCIBLE_BUILD.md)
5. [RELEASE_VERIFICATION.md](./RELEASE_VERIFICATION.md)
6. [OPEN_SOURCE_AUDIT_SCOPE.md](./OPEN_SOURCE_AUDIT_SCOPE.md)

## 项目概览

本项目包含：

1. 钱包引导、解锁、资产管理、审批等扩展 UI 流程。
2. 钱包、Keyring、权限、会话、通知等后台服务。
3. 面向 dApp 的 inpage provider 注入能力。

## 核心能力

1. 钱包创建、导入、解锁、锁定流程。
2. 面向 Cosmos 兼容链的账户与地址管理。
3. dApp 连接、账户读取、签名等 Provider 能力。
4. Popup 中的交易相关交互流程。
5. Runtime chain 能力边界与审批隔离。

## 技术栈

### 扩展与前端

- `WXT`
- `React 18`
- `React Router 6`
- `Redux Toolkit`
- `Ant Design 5`
- `TypeScript`

### 钱包与链能力

- `@cosmjs/amino`
- `@cosmjs/proto-signing`
- `@cosmjs/stargate`
- `@scure/bip32`
- `@scure/bip39`
- `Dexie`

### 工程化

- `ESLint`
- `Prettier`
- `Yarn`

## 目录结构

```text
src/
  entrypoints/   # 扩展入口（popup/background/content/inpage）
  popup/         # popup 页面、审批页面、UI hooks
  cosmos/        # 链、provider、wallet、tx、storage
  components/    # 可复用 UI 组件
  shared/        # 共享协议、工具、常量
  locales/       # i18n 资源
  i18n/          # i18n 初始化
```

## 快速开始

### 环境准备

1. Node.js
2. Corepack
3. Yarn

### 安装依赖

```bash
corepack yarn install
```

### 本地开发

```bash
corepack yarn dev
```

Firefox 开发模式：

```bash
corepack yarn dev:firefox
```

### 构建

```bash
corepack yarn build
```

Firefox 构建：

```bash
corepack yarn build:firefox
```

构建产物默认输出到 `.output/` 目录。

### 打包

```bash
corepack yarn zip
```

Firefox 打包：

```bash
corepack yarn zip:firefox
```

### 类型检查

```bash
corepack yarn compile
```

## 审计验证基线

针对开源审计与回归验证，建议至少执行：

```bash
corepack yarn verify:stage2
corepack yarn verify:css:colors
corepack yarn verify:i18n
```

说明：

1. `scripts/` 是验证脚本的单一真源（single source of truth）。
2. `tests/contracts` 已移除，避免双份维护造成漂移。
3. `tests/.tmp-e2e` 是浏览器 e2e 脚本运行时临时目录，不应提交到仓库。

## CI 基线

GitHub Actions CI 当前执行：

1. `corepack yarn compile`
2. `corepack yarn verify:stage2`
3. `corepack yarn verify:css:colors`
4. `corepack yarn verify:i18n`
5. `corepack yarn build`

## 安全说明

漏洞报告与披露流程请见 [SECURITY.md](./SECURITY.md)。

## 许可证

本项目使用 MIT License，详见 [LICENSE](./LICENSE)。
