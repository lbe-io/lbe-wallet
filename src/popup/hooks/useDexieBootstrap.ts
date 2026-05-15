import { useEffect, useRef } from 'react';
import { useWallet } from '@/app/contexts';
import { ensureSelectedNativeTokens, getAllWallets } from '@/cosmos/storage';
import { initializePrimaryCosmosWallet } from '@/popup/utils/cosmos-wallet-init';

export const useDexieBootstrap = (options?: { accountIndex?: number }) => {
  const walletController = useWallet();
  const bootstrappingRef = useRef(false);

  useEffect(() => {
    const bootstrap = async () => {
      if (bootstrappingRef.current) return;
      bootstrappingRef.current = true;
      const wallets = await getAllWallets();
      if (wallets.length) {
        // Backfill missing native tokens (including extraCurrencies like ZDB) for existing wallets.
        await ensureSelectedNativeTokens();
        return;
      }
      try {
        await initializePrimaryCosmosWallet(walletController, options?.accountIndex ?? 0);
      } catch (error) {
        console.error('[useDexieBootstrap] Failed to initialize Dexie', error);
      }
    };

    bootstrap();
  }, [walletController, options?.accountIndex]);
};
