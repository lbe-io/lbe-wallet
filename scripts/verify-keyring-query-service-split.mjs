import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

const read = async (relativePath) => fs.readFile(new URL(relativePath, import.meta.url), 'utf8');

const assetQueryService = await read('../src/entrypoints/background/service/keyring/assetQueryService.ts');
const stakingQueryService = await read('../src/entrypoints/background/service/keyring/stakingQueryService.ts');
const txHistoryQueryService = await read('../src/entrypoints/background/service/keyring/txHistoryQueryService.ts');
const priceQueryService = await read('../src/entrypoints/background/service/keyring/priceQueryService.ts');
const keyringIndex = await read('../src/entrypoints/background/service/keyring/index.ts');
const walletController = await read('../src/entrypoints/background/controller/wallet.ts');

assert.match(assetQueryService, /export const getCosmosTokenBalancesWithDeps/);
assert.match(assetQueryService, /export const getCosmosNativeBalanceWithDeps/);
assert.match(assetQueryService, /export const getCosmosAssetSnapshotWithDeps/);
assert.match(assetQueryService, /ensureRuntimeExecutableQueryContext/);
assert.match(stakingQueryService, /export const getCosmosStakingSummaryWithDeps/);
assert.match(stakingQueryService, /ensureRuntimeExecutableQueryContext/);
assert.match(txHistoryQueryService, /export const getCosmosTxHistoryWithDeps/);
assert.match(txHistoryQueryService, /ensureRuntimeExecutableQueryContext/);
assert.match(priceQueryService, /export const getCosmosNativePriceUsdWithDeps/);
assert.match(priceQueryService, /ensureRuntimeExecutableQueryContext/);

assert.match(keyringIndex, /from '\.\/assetQueryService'/);
assert.match(keyringIndex, /from '\.\/stakingQueryService'/);
assert.match(keyringIndex, /from '\.\/txHistoryQueryService'/);
assert.match(keyringIndex, /from '\.\/priceQueryService'/);
assert.match(keyringIndex, /ensureRuntimeExecutableQueryContext/);
assert.match(keyringIndex, /ensureRuntimeChainRpcContext/);
assert.match(keyringIndex, /getRuntimeChainInterpretationByChainId\(chainId\)/);
assert.match(keyringIndex, /private getRpcEndpointOrThrow = async/);
assert.match(keyringIndex, /private getStargateClientForChain = async/);

assert.match(keyringIndex, /return getCosmosTokenBalancesWithDeps\(/);
assert.match(keyringIndex, /return getCosmosNativeBalanceWithDeps\(/);
assert.match(keyringIndex, /return getCosmosStakingSummaryWithDeps\(/);
assert.match(keyringIndex, /return getCosmosAssetSnapshotWithDeps\(/);
assert.match(keyringIndex, /return getCosmosTxHistoryWithDeps\(/);
assert.match(keyringIndex, /return getCosmosNativePriceUsdWithDeps\(/);

assert.match(walletController, /return keyringService\.getCosmosNativeBalance\(chainId, targetAddress\)/);
assert.match(walletController, /return keyringService\.getCosmosStakingSummary\(chainId, targetAddress\)/);
assert.match(walletController, /return keyringService\.getCosmosAssetSnapshot\(chainId, targetAddress\)/);
assert.match(walletController, /return keyringService\.getCosmosTxHistory\(chainId, targetAddress, limit\)/);
assert.match(walletController, /return keyringService\.getCosmosNativePriceUsd\(chainId\)/);

console.log('keyring query service split verification passed');
