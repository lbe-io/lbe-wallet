# Keyring 密码 / 私钥 / 助记词加密安全详解

更新日期：2026-04-03

适用范围：本文基于当前仓库源码实现，重点说明密码、主密钥、助记词、私钥、解锁态与相关敏感数据的存储、加密、解密和清理流程。

---

## 1. 文档目标

本文回答以下问题：

- 用户密码在系统里扮演什么角色
- 助记词和私钥是否直接用密码加密
- 主密钥如何生成、包装和使用
- 导入助记词、导入私钥、主助记词三种场景分别如何落库
- 钱包解锁、校验密码、改密码、导出私钥时分别发生了什么
- 后台 worker 重启后，哪些状态会恢复，哪些不会恢复
- 当前实现里有哪些值得重点复核的安全注意点

---

## 2. 关键源码位置

核心实现主要分布在以下文件：

- `src/entrypoints/background/service/keyring/index.ts`
- `src/entrypoints/background/service/keyring/secureVaultCrypto.ts`
- `src/entrypoints/background/service/keyring/keystoreAccess.ts`
- `src/entrypoints/background/service/keyring/keystoreWriteAccess.ts`
- `src/entrypoints/background/service/keyring/keystoreSessionState.ts`
- `src/entrypoints/background/service/keyring/unlockGuard.ts`
- `src/entrypoints/background/service/keyring/signerMaterialResolver.ts`
- `src/cosmos/storage/accountIdentity.ts`
- `src/entrypoints/background/handleRequest.ts`

---

## 3. 安全对象总览

当前实现里的敏感对象可分为以下几类：

| 对象 | 作用 | 持久化位置 | 是否加密 |
|---|---|---|---|
| 用户密码 | 包装/解包主密钥 | 不持久化 | 不落库 |
| 主密钥 `masterKey` | 对助记词、私钥、RSA、deviceId 做对称加密 | `keyringState.masterKey` 中保存的是“被密码包装后的主密钥” | 是 |
| 主助记词 `mnemonic` | 钱包主根秘密 | `keyringState.mnemonic` | 是 |
| 导入助记词覆盖项 `accountMnemonics[slotKey]` | 某账户使用独立助记词 | `keyringState.accountMnemonics` | 是 |
| 导入私钥覆盖项 `accountPrivateKeys[slotKey]` | 某账户直接使用 32 字节私钥 | `keyringState.accountPrivateKeys` | 是 |
| 待写入助记词 `pendingMnemonic` | onboarding/导入流程中的临时明文 | `memStore.pendingMnemonic` | 否，但仅在运行时内存 |
| 解锁态主助记词 `unlockSessionMnemonic` | 仅当前后台运行时中的主助记词缓存 | 仅内存 | 否，但不持久化 |
| RSA 公私钥 | 业务辅助密钥 | `keyringState.rsaPublicKey` / `rsaPrivateKey` | 是 |
| `deviceId` | 设备唯一标识 | `keyringState.deviceId` | 是 |
| 解锁失败退避状态 | 防暴力破解 | `browser.storage.session.unlockGuardState` | 不属于高敏感秘密 |

一个非常关键的结论是：

- 当前主线实现里，密码不直接加密助记词/私钥
- 密码只用于“包装主密钥”
- 真正加密助记词/私钥的是 32 字节随机生成的主密钥

---

## 4. 存储分层

### 4.1 `store`：持久化 Keyring 状态

`KeyringService.store` 会在后台初始化时从 `chrome.storage.local` 的 `keyringState` 恢复，并在更新后回写。

这一层持久化保存的是：

- `booted`
- `masterKey`
- `vault`
- `mnemonic`
- `accountMnemonics`
- `accountPrivateKeys`
- `rsaPublicKey`
- `rsaPrivateKey`
- `deviceId`
- `signMessage`

注意：

- 这里的 `masterKey` 不是明文主密钥
- 它是“用密码经 scrypt 派生出的密钥再次包装后的 JSON 字符串”

### 4.2 `memStore`：只存在于运行时内存

`memStore` 保存：

- `isUnlocked`
- `pendingMnemonic`
- `rsaPublicKey`
- `rsaPrivateKey`
- `deviceId`

特点：

- 只在当前后台运行时存在
- 不回写到 `chrome.storage.local`
- 适合暂存 onboarding 过程中的未最终提交秘密

### 4.3 `browser.storage.session`

这一层只用于短周期 session 相关信息。

当前安全策略是：

- 不再持久化“钱包已解锁”状态
- 不再持久化“解锁后助记词”
- 只保留 `unlockGuardState` 这类防爆破信息
- 旧的 `unlockSessionState` 会在恢复时主动清除

这意味着：

- 浏览器扩展后台 worker 一旦重启，解锁态不会被自动恢复
- 这是当前实现明确的安全加固策略

---

## 5. 密码学构件

实现文件：`secureVaultCrypto.ts`

### 5.1 密码规范

密码先做 `NFKC` 规范化，然后校验：

- 最少 8 个字符
- 必须同时包含字母和数字

### 5.2 主密钥包装所用 KDF

使用 `scrypt` 派生 32 字节密钥，默认参数：

- `N = 65536`
- `r = 8`
- `p = 1`
- `dkLen = 32`

允许范围：

- `N`：`16384 ~ 262144`，且必须是 2 的幂
- `r`：`8 ~ 16`
- `p`：`1 ~ 4`

### 5.3 对称加密算法

使用 `AES-GCM`，关键参数：

- IV 长度：12 字节
- 主密钥长度：32 字节
- salt 长度：16 字节

随机数来源：

- `globalThis.crypto.getRandomValues`

### 5.4 上下文分离

实现没有把所有 AES-GCM 加密都混为同一用途，而是通过 `additionalData` 绑定上下文：

- `lbe-master-key-wrap`
- `lbe-master-key-secret`

这意味着：

- 即使底层算法相同，不同用途的密文也被逻辑分域
- 主密钥包装密文和普通秘密字段密文不能被互相误用

---

## 6. 密文数据格式

### 6.1 被密码包装后的主密钥

结构类型：`SecureVaultPayloadV3`

```json
{
  "v": 3,
  "alg": "A256GCM",
  "kdf": "SCRYPT-SHA256",
  "n": 65536,
  "r": 8,
  "p": 1,
  "ctx": "lbe-master-key-wrap",
  "salt": "<base64>",
  "iv": "<base64>",
  "ct": "<base64>"
}
```

字段含义：

- `v`：包装格式版本
- `alg`：对称算法
- `kdf`：KDF 类型
- `n/r/p`：scrypt 参数
- `ctx`：上下文
- `salt`：scrypt salt
- `iv`：AES-GCM IV
- `ct`：AES-GCM 输出密文，包含认证标签

### 6.2 普通秘密字段

结构类型：`SecretPayloadV1`

```json
{
  "v": 1,
  "alg": "A256GCM",
  "ctx": "lbe-master-key-secret",
  "iv": "<base64>",
  "ct": "<base64>"
}
```

用于加密：

- 主助记词
- 导入助记词
- 导入私钥
- RSA 公私钥
- `deviceId`

---

## 7. 核心安全模型

### 7.1 模型本质

系统采用的是“两层密钥模型”：

1. 用户密码
2. 主密钥
3. 业务秘密数据

关系如下：

```text
用户密码
  -> scrypt
  -> 派生包装密钥
  -> 解包/包装 masterKey

masterKey
  -> AES-GCM
  -> 加密助记词 / 私钥 / RSA / deviceId
```

因此：

- 改密码时，不需要重加密所有秘密数据
- 只需要把同一个 `masterKey` 用新密码重新包装一次

### 7.2 优点

- 秘密字段统一使用随机主密钥加密
- 密码只参与主密钥包装，避免每次操作都直接基于密码处理大量秘密
- 改密码成本低
- 便于未来做主密钥轮换和字段扩展

### 7.3 当前实现的现实边界

- 钱包一旦解锁，主密钥会存在于后台 JS 运行时内存中
- 解密出来的助记词/私钥在使用瞬间也会进入 JS 内存
- 这是浏览器扩展 + JS 钱包的常见现实边界，不是这套模型独有的问题

---

## 8. 首次创建钱包的加密流程

入口：`KeyringService.boot(password)`

前置条件通常是：

- onboarding 或导入流程先通过 `setPendingMnemonic()` 把助记词放入 `memStore.pendingMnemonic`
- 这时助记词尚未持久化，只存在后台运行时内存中

### 8.1 流程时序

```text
用户输入密码
  -> validatePasswordStrength
  -> generateMasterKey()
  -> wrapMasterKey(password, masterKey)
  -> store.masterKey = wrappedMasterKey
  -> runtime 持有明文 masterKey
  -> encryptRsa()
  -> encryptDeviceId()
  -> 若 memStore.pendingMnemonic 存在
       -> encryptWithMasterKey(masterKey, pendingMnemonic)
       -> store.mnemonic = encryptedMnemonic
       -> unlockSessionMnemonic = pendingMnemonic
       -> 清空 memStore.pendingMnemonic
  -> 若 vault 为空则写入 "cosmos-vault"
  -> memStore.isUnlocked = true
```

### 8.2 安全含义

- 用户密码本身不会写入任何持久化存储
- 创建钱包时会先生成随机主密钥
- 主助记词最终只会以 `store.mnemonic` 的加密态落盘
- `pendingMnemonic` 在完成持久化后会从 `memStore` 清除

---

## 9. 钱包解锁流程

入口：`KeyringService.submitPassword(password)`

### 9.1 流程时序

```text
用户输入密码
  -> ensureUnlockAllowed()
  -> validatePasswordStrength(password)
  -> unwrapMasterKey(password, store.masterKey)
  -> 成功:
       -> runtime 设置 masterKey
       -> 清除失败计数
       -> memStore.isUnlocked = true
  -> 失败:
       -> 增加 failedUnlockCount
       -> 计算 nextUnlockAllowedAt
       -> 写入 browser.storage.session.unlockGuardState
       -> 抛错
```

### 9.2 关键点

- 解锁并不会把助记词直接加载到持久化 session
- 当前实现中 `touchUnlockSession()` 是 no-op
- 这意味着“已解锁态”不会跨 worker 重启延续

---

## 10. 密码校验流程

入口：`KeyringService.verifyPassword(password)`

它的流程和解锁类似，但不会改变钱包解锁状态：

```text
用户输入密码
  -> unwrapMasterKey(password, store.masterKey)
  -> 若成功，仅说明密码正确
  -> 临时 masterKey.fill(0)
```

适用场景：

- 导出私钥前再次确认密码
- 风险操作前再次验证身份

---

## 11. 修改密码流程

入口：`KeyringService.changePassword(oldPassword, newPassword)`

### 11.1 当前实现流程

```text
旧密码
  -> unwrapMasterKey(oldPassword, store.masterKey)
  -> 得到当前 masterKey

新密码
  -> wrapMasterKey(newPassword, currentMasterKey)
  -> store.masterKey = newlyWrappedMasterKey
  -> runtime 继续持有同一个 currentMasterKey
```

### 11.2 非常重要的结论

改密码不会：

- 重新生成新的主密钥
- 重新加密 `mnemonic`
- 重新加密 `accountMnemonics`
- 重新加密 `accountPrivateKeys`

它只会：

- 用新密码重新包装同一个主密钥

### 11.3 安全意义

这不是漏洞，而是当前模型的设计结果：

- 密码负责保护主密钥
- 主密钥负责保护业务秘密

但也意味着：

- 改密码是“更换主密钥外壳”
- 不是“做一轮全量秘密重加密”

如果未来要做更强的密钥轮换，需要额外实现：

- 生成新主密钥
- 解密旧数据
- 使用新主密钥重新加密所有秘密

---

## 12. 主助记词读取流程

入口：

- `getMnemonic()`
- `getMnemonicOrThrow()`

### 12.1 读取优先级

当前实现按以下优先级获取主助记词：

1. `unlockSessionMnemonic`
2. `memStore.pendingMnemonic`
3. `store.mnemonic` 解密后得到

### 12.2 含义解释

#### `unlockSessionMnemonic`

这是当前后台运行时中的临时明文缓存。

特点：

- 不持久化
- worker 重启后会消失

#### `pendingMnemonic`

这是 onboarding 过程中尚未提交的临时助记词。

特点：

- 仅存在运行时内存
- 还没有进入正式 keystore

#### `store.mnemonic`

这是最终持久化的主助记词密文。

读取时要求：

- 当前已经解锁
- runtime 中存在明文主密钥

---

## 13. 导入助记词与导入私钥的加密流程

### 13.1 账户 slotKey

系统用 `accountIndex` 的字符串形式作为 `slotKey`：

- `0`
- `1`
- `2`
- ...

例如：

- `accountIndex = 3`
- `slotKey = "3"`

### 13.2 导入助记词覆盖项

入口：`setAccountMnemonic(accountIndex, mnemonic)`

流程：

```text
导入助记词
  -> 标准化字符串
  -> 禁止 accountIndex = 0 覆盖
  -> encryptWithMasterKey(masterKey, mnemonic)
  -> store.accountMnemonics[slotKey] = encryptedMnemonic
  -> accountMnemonicCache[index] = plaintextMnemonic
```

约束：

- 主账户 `index = 0` 不允许覆盖主助记词
- 这保证了“主助记词”和“导入助记词账户”在语义上是分开的

### 13.3 导入私钥覆盖项

入口：`setAccountPrivateKey(accountIndex, privateKey)`

流程：

```text
导入私钥
  -> 去掉 0x 前缀
  -> 小写化
  -> 校验必须是 64 位 hex
  -> encryptWithMasterKey(masterKey, normalizedPrivateKeyHex)
  -> store.accountPrivateKeys[slotKey] = encryptedPrivateKey
  -> accountPrivateKeyCache[index] = Uint8Array(32-byte key)
```

注意：

- 当前写入阶段做的是格式校验，要求必须是 32 字节 hex
- 后续读取仍会再次校验

---

## 14. 签名材料解析规则

实现文件：`signerMaterialResolver.ts`

系统在签名、获取地址、导出私钥时，都会先解析“当前账户的签名材料”。

优先级如下：

```text
若存在 accountPrivateKeys[slotKey]
  -> 账户类型 = imported_private_key
  -> 直接使用该私钥

否则若 accountIndex > 0 且存在 accountMnemonics[slotKey]
  -> 账户类型 = imported_mnemonic
  -> 使用该助记词
  -> derivationIndex = 0

否则
  -> 账户类型 = primary_mnemonic_derived
  -> 使用主助记词
  -> derivationIndex = accountIndex
```

### 14.1 三类账户的实际含义

| 账户类型 | 秘密来源 | 派生规则 |
|---|---|---|
| `primary_mnemonic_derived` | 主助记词 | `m/44'/{coinType}'/0'/0/{accountIndex}` |
| `imported_mnemonic` | 该账户自己的助记词 | `m/44'/{coinType}'/0'/0/0` |
| `imported_private_key` | 该账户自己的私钥 | 不走 HD 派生 |

这点非常重要：

- “导入助记词账户”不是用主助记词的 `accountIndex` 去派生
- 它是“用新的助记词从 0 号地址开始派生”

---

## 15. 链上私钥派生与导出流程

入口：`exportAccountPrivateKeys(password, accountIndex?)`

### 15.1 导出前校验

```text
再次输入密码
  -> unwrapMasterKey(password, store.masterKey)
  -> 得到临时 masterKey
  -> 用临时 masterKey 解析 signer material
```

这一步不会依赖当前钱包是否已经解锁，因为它直接使用“临时解包出的 masterKey”。

### 15.2 对不同材料的处理

#### 场景 A：账户来源是导入私钥

流程：

- 直接使用该 32 字节私钥
- 对每条内置链只变更地址编码前缀和地址投影
- 导出的 `privateKey` 本身是同一份 hex

#### 场景 B：账户来源是主助记词或导入助记词

流程：

```text
mnemonic
  -> mnemonicToSeedSync()
  -> HDKey.fromMasterSeed(seed)
  -> derive("m/44'/{coinType}'/0'/0/{derivationIndex}")
  -> child.privateKey
  -> DirectSecp256k1Wallet.fromKey(privateKeyBytes, bech32Prefix)
  -> 生成链地址
```

### 15.3 导出结果

返回内容按内置 Cosmos 链逐条输出：

- `chainId`
- `chainName`
- `address`
- `privateKey`

### 15.4 清理

临时解包得到的 `masterKey` 会在 `finally` 中执行：

- `masterKey.fill(0)`

---

## 16. 锁定与运行时秘密清理

### 16.1 锁定钱包

入口：`setLocked()`

执行逻辑：

- 清除 runtime 主密钥
- 清除解锁失败状态计数
- 清除 `unlockSessionMnemonic`
- 清空 RSA、公私钥、deviceId 的运行时字段
- 清空助记词/私钥缓存
- `memStore.isUnlocked = false`
- 清除 legacy unlock session

不会做的事情：

- 不会删除持久化的 `mnemonic`
- 不会删除持久化的 `accountMnemonics`
- 不会删除持久化的 `accountPrivateKeys`

也就是说：

- “锁定”只是清掉运行时秘密
- 并不删除钱包数据

### 16.2 清空钱包数据

入口：`clearWalletData()`

按当前代码，它会：

- 清除 runtime 秘密
- 清除 `memStore` 中的运行时字段
- 重置持久化的：
  - `booted`
  - `masterKey`
  - `vault`
  - `mnemonic`
  - `rsaPublicKey`
  - `rsaPrivateKey`
  - `deviceId`
  - `signMessage`
  - `accountMnemonics`

---

## 17. 解锁会话与 worker 重启行为

### 17.1 当前策略

当前实现采取的是：

- 不持久化解锁态
- 不持久化解锁后的主助记词
- 不持久化明文主密钥

具体表现为：

- `restoreUnlockSession()` 总是返回 `false`
- `touchUnlockSession()` 为空实现
- 恢复时还会主动清理旧的 `unlockSessionState`

### 17.2 恢复后保留什么

后台重启后，仍可恢复的是：

- `unlockGuardState`
- 持久化的加密 keystore 数据
- 偏好与权限等非明文秘密状态

后台重启后，不会恢复的是：

- 已解锁状态
- 明文主密钥
- 明文助记词

这部分是安全加固设计，而不是功能缺失。

---

## 18. RSA 与 deviceId 的保护方式

虽然本文重点是密码/助记词/私钥，但当前实现里还有两类敏感字段走同样的主密钥保护模型：

- RSA 公私钥
- `deviceId`

生成与保护链路如下：

1. 后台首次初始化时，如果 `rsaKeyLoaded` 不存在，则生成 2048 位 RSA 公私钥
2. `keyringService.initRsa()` 把它们先放到运行时字段中
3. 在 `boot()` 阶段调用 `encryptRsa()` / `encryptDeviceId()`
4. 最终以主密钥加密后存入 `keyringState`

这说明系统里不只有助记词和私钥受主密钥保护，部分身份类字段也复用了同一套机制。

---

## 19. 零化与内存清理策略

当前实现已经做了一些“尽力而为”的内存清理：

- `setMasterKey(next)` 在替换旧主密钥前，会对旧值执行 `fill(0)`
- `verifyPassword()` 的临时主密钥会 `fill(0)`
- `exportAccountPrivateKeys()` 的临时主密钥会 `fill(0)`
- `clearRuntimeSecrets()` 会清掉 runtime 字段和缓存

需要理解的现实边界是：

- JavaScript 运行时不是专门的内存安全环境
- `fill(0)` 是“尽力减少残留”的工程措施
- 不能把它理解成等同于原生语言中的严格安全擦除保证

---

## 20. 当前实现注意点与建议复核项

以下内容不是抽象建议，而是基于当前代码阅读后，值得在后续安全审查中重点确认的事项。

### 20.1 `clearWalletData()` 对 `accountPrivateKeys` 的清理需要复核

`buildClearedWalletState()` 当前显式清空了：

- `mnemonic`
- `accountMnemonics`
- `masterKey`
- `vault`
- `rsaPublicKey`
- `rsaPrivateKey`
- `deviceId`

但没有显式包含：

- `accountPrivateKeys`

而 `ObservableStore.updateState()` 使用的是浅合并语义，因此按当前代码路径理解：

- 如果此前 `store` 中已有 `accountPrivateKeys`
- `clearWalletData()` 执行后，这个字段理论上可能继续保留

建议把这一点作为高优先级安全复核项处理。

### 20.2 改密码不是主密钥轮换

当前 `changePassword()` 只重新包装主密钥，不轮换主密钥本身。

这意味着：

- 若安全策略要求“改密码后所有秘密完成一次新主密钥重加密”
- 则当前实现还不满足这个更强要求

### 20.3 运行时内存里仍会短暂存在明文秘密

包括但不限于：

- `pendingMnemonic`
- `unlockSessionMnemonic`
- 解密出来的主助记词
- 导入助记词
- 导入私钥字节

这属于 JS 钱包实现的常见边界，需要通过：

- 尽量缩短明文停留时间
- 尽量减少持久化
- 在高风险操作后及时锁定

来降低暴露面。

---

## 21. 一句话总结

当前 Keyring 的核心安全模型可以概括为：

- 密码只负责包装主密钥
- 主密钥负责加密助记词、私钥和其他敏感字段
- 解锁态不跨 worker 持久化
- 账户签名材料按“私钥覆盖 > 助记词覆盖 > 主助记词派生”解析
- 锁定会清理运行时秘密，但“清空钱包数据”路径里对 `accountPrivateKeys` 的持久化清理值得优先复核

如果后续要继续补安全文档，建议下一篇可以单独写：

- Provider 授权与审批安全模型
- Runtime Chain 能力闸门与链来源隔离模型
- 导出私钥与签名请求的风险控制策略
