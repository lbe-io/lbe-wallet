import { defineUnlistedScript } from 'wxt/sandbox';

export default defineUnlistedScript(() => {
  // Keep this hook lightweight; behavior is driven by dedicated feature entrypoints.
  console.info('Lbe login script injected');
});
