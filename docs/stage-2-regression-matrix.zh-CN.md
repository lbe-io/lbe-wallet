# Stage 2 回归矩阵（中文）

更新时间：2026-05-14  
语言：简体中文

本文件是 `docs/stage-2-regression-matrix.md` 的中文说明版，用于解释浏览器级回归基线。

## 浏览器 E2E 基线
执行命令：
- `corepack yarn verify:browser:e2e`
- `corepack yarn verify:browser:e2e:gate`

环境说明：
- 基线场景使用 Microsoft Edge。
- Provider 基线流程覆盖：
  - `enable`
  - `getKey`
  - `signDirect`
  - `signAmino`
  - `signArbitrary`
  - `sendTx`
- Popup 基线流程覆盖：
  - `wallet home -> CryptoDetail -> send confirm`
- 必须验证跨域授权隔离（cross-origin authorization isolation）。

## 质量目标
- Provider 注入与授权流程稳定可复现。
- 审批流程（批准/拒绝）在 e2e 中可被覆盖。
- 发送流程至少能稳定走到确认页，且无异常卡死。
- 跨 origin 权限边界在回归基线中持续受测。

## 与英文版关系
- 英文权威文件：`docs/stage-2-regression-matrix.md`
- gating 脚本目前直接读取英文文件；中文文件不替代 gating 来源。
