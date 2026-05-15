import { useEffect } from 'react';
import { useAppDispatch } from '@/popup/hooks/redux';
import { updateAccount, updateActiveChainId, updateChain, updateWallet } from '@/popup/store/features/applicationSlice';
import { useWallet } from '@/app/contexts';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import { getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { ensureRuntimeChainHydrationContext, hasRuntimeChainCapability } from '@/cosmos/chains/runtimeChainAdapter';
import { getAccountById, getAccountsByWalletId, getAddressByChainId, getAddressesByWidId, getAllChains, getAllWallets, getWalletById } from '@/cosmos/storage';
import { useDexieBootstrap } from '@/popup/hooks/useDexieBootstrap';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { syncSelectedAccount, syncSelectedChain } from '@/popup/utils/selectionSyncService';

export const useFetchWalletData = () => {
  const dispatch = useAppDispatch();
  const walletController = useWallet();
  const { selectedAccount, selectedWallet, selectedChain, activeChainId } = useWalletEntitySelector();
  useDexieBootstrap();

  const selectedWalletId = selectedWallet?.id;
  const selectedAccountId = selectedAccount?.id;
  const selectedChainId = selectedChain?.chainId;
  const selectedChainName = selectedChain?.name;
  const selectedActiveChainId = activeChainId;

  useEffect(() => {
    let unmounted = false;

    const hydrateWalletState = async () => {
      try {
        const allWallets = await getAllWallets();
        if (!allWallets.length) {
          return;
        }

        const wallet = selectedWalletId ? (await getWalletById(selectedWalletId))[0] || allWallets[0] : allWallets[0];
        if (!wallet) {
          return;
        }

        const accounts = await getAccountsByWalletId(wallet.id);
        if (!accounts.length) {
          return;
        }

        const account = selectedAccountId ? (await getAccountById(selectedAccountId))[0] || accounts[0] : accounts[0];
        if (!account) {
          return;
        }

        const allChains = await getAllChains();
        const chain = allChains.find((item) => item.chainId === selectedChainId) || allChains.find((item) => item.chainId === selectedActiveChainId) || allChains.find((item) => item.chainId === DEFAULT_COSMOS_CHAIN_ID) || allChains[0];

        const runtimeChain = chain ? await getRuntimeChainInterpretationByChainId(chain.chainId) : undefined;
        const hydrationChain = runtimeChain && hasRuntimeChainCapability(runtimeChain, 'hydrationContext') ? ensureRuntimeChainHydrationContext(runtimeChain, 'wallet hydration') : undefined;
        const selectedAddress = chain && hydrationChain && hasRuntimeChainCapability(hydrationChain, 'addressDerivation') ? await getAddressByChainId(account.wid, account.index, chain.chainId) : undefined;
        const fallbackAddress = selectedAddress || (await getAddressesByWidId(account.wid, account.index))[0];

        if (unmounted) {
          return;
        }

        dispatch(updateWallet({ wallet }));
        dispatch(updateAccount({ account }));
        if (chain) {
          dispatch(updateActiveChainId({ chainId: chain.chainId }));
          syncSelectedChain(walletController, chain.chainId);
          if (selectedChainName !== 'all') {
            dispatch(updateChain({ chain }));
          }
        }

        if (fallbackAddress?.address) {
          syncSelectedAccount(walletController, fallbackAddress.address);
        }
      } catch (error) {
        console.error('[useFetchWalletData] Failed to hydrate wallet state', error);
      }
    };

    hydrateWalletState();

    return () => {
      unmounted = true;
    };
  }, [dispatch, selectedAccountId, selectedActiveChainId, selectedChainId, selectedChainName, selectedWalletId, walletController]);
};
