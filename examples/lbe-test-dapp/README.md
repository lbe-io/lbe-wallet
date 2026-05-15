# LBE Wallet Test DApp

A minimal test dapp for the injected wallet API in this extension.

## What it covers

- `window.lbeWallet.enable(chainIds)`
- `window.lbeWallet.disable(chainIds?)`
- `window.lbeWallet.getChainInfos()`
- `window.lbeWallet.getKey(chainId)`
- `window.getOfflineSigner(chainId).getAccounts()`
- `window.lbeWallet.signAmino(chainId, signer, signDoc)`
- `window.lbeWallet.signDirect(chainId, signer, signDoc)`
- `window.lbeWallet.signArbitrary(chainId, signer, data)`
- `window.lbeWallet.suggestChain(chainInfo)`
- `window.lbeWallet.request({ method, params })` for raw methods (for example `sendTx`)
- Event APIs: `on/off` for `accountsChanged`, `chainChanged`, `connect`, `disconnect`, `keystorechange`

## Run

1. Build/load this extension in your browser.
2. Start a static server from project root:

```bash
python3 -m http.server 8787
```

3. Open `http://localhost:8787/examples/lbe-test-dapp/`.
4. Click `Bind Events`.
5. Click `window.lbeWallet.enable(chainIds)` and approve in wallet popup.
6. Test other APIs from the page.

## Notes

- If wallet is not injected, check extension is enabled and allowed on this site.
- For `signDirect`, the sign doc must be valid for your chain and account context.
- The default Raw request payload in this page is a canonical `suggestChain` example for `lbe-1` (aligned with the current built-in chain registry).
- Legacy methods such as `connect`, `getAccount`, `signMessage`, `verifyMessage`, `signBase64Message`, and `transfer` are not part of this aligned baseline.
