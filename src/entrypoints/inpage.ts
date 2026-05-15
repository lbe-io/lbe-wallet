import { lbeProvider } from '@/cosmos/provider';
import { defineUnlistedScript } from 'wxt/sandbox';

export default defineUnlistedScript(() => {
  try {
    lbeProvider().catch((error) => {
      console.error('[LBE] lbeProvider initialization error:', error);
    });
  } catch (error) {
    console.error('[LBE] inpage.ts script error:', error);
  }
});
