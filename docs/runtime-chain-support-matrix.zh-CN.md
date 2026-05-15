# Runtime Chain Support Matrix（中文）

更新时间：2026-05-14  
语言：简体中文

## 状态基线
- `builtin = supported`
- `custom = partial / selective executable upgrade`
- `suggested = partial / selective executable upgrade`

说明：
- `builtin` 仍然是唯一完整支持的运行时基线。
- `custom` 与 `suggested` 都是“按前置条件逐项升级能力”的模型，不是自动全量支持。

## 能力矩阵核心结论
### builtin
- 地址派生、hydrate、native asset、send/query、approval display 等路径均完整支持。

### custom
- 仅在链配置持久化并满足显式前置条件时，才能对以下能力闭包升级：
  - `addressDerivation`
  - `hydrationContext`
  - `nativeAssetContext`
  - `queryContext`
  - popup native send execution
  - provider `getKey` / `getOfflineSignerAccounts` / `signDirect` / `signAmino` / `signArbitrary` / `sendTx`

### suggested
- 同样属于 selective、persisted-only、precondition-gated。
- 可按条件闭包到：
  - `queryContext`
  - popup `sendFlowContext`
  - popup native send execution
  - provider 读账户与签名/发送相关能力

## Guardrail（必须遵守）
- 禁止 custom/suggested 在能力不足时静默 fallback 到 builtin 逻辑。
- `getChainInfos` 仍为 builtin-only。
- `suggestChain` 保持 builtin canonical validation 路径。
- display-only 改进不等于 send/query fully supported。
- 未满足前置条件时必须显式 unsupported，并带可追踪原因。

## 自动化校验（核心）
以下脚本应保持可运行并持续绿灯：
- `node scripts/verify-runtime-chain-interpretation.mjs`
- `node scripts/verify-custom-suggested-runtime-closure.mjs`
- `node scripts/verify-runtime-chain-capability-contract.mjs`
- `node scripts/verify-custom-runtime-closure-stage3.mjs`
- `node scripts/verify-suggested-runtime-closure-stage3.mjs`
- `node scripts/verify-stage2-runtime-capability-upgrades.mjs`
- `node scripts/verify-stage2-runtime-display-upgrades.mjs`
- `node scripts/verify-stage2-runtime-chain.mjs`
- `node scripts/verify-stage2-stability-contract.mjs`

## 手工验证建议
- builtin 链：资产、交易历史、价格、发送流程完整可用。
- custom/suggested 链：仅在满足 preconditions 时验证 query/send/provider 可执行；否则应明确 unsupported。
- approval/connect/add-token 的显示文案与来源标签不能误标为 builtin。

## 与英文版关系
- 英文权威文件：`docs/runtime-chain-support-matrix.md`
- 本文件是中文解释版，语义与规则应保持一致。
