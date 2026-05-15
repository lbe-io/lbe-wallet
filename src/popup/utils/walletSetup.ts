import type { WalletController } from '@/app/contexts';
import { clearDatabase } from '@/cosmos/storage';
import { initializePrimaryCosmosWallet } from '@/popup/utils/cosmos-wallet-init';
import type { AppDispatch } from '@/popup/store';
import { updateAccount, updateChain, updateWallet } from '@/popup/store/features/applicationSlice';

export const resetWalletEnvironment = async (walletController: WalletController) => {
  await walletController.clearWalletData();
  walletController.clearConnectedSites();
  await clearDatabase();
};

export const finalizeWalletSetup = async (walletController: WalletController, accountIndex: number = 0, options?: { mnemonicBackupPending?: boolean }) => {
  return initializePrimaryCosmosWallet(walletController, accountIndex, options);
};

export const applyWalletBootstrap = (dispatch: AppDispatch, walletState: Awaited<ReturnType<typeof initializePrimaryCosmosWallet>>) => {
  dispatch(updateWallet({ wallet: walletState.wallet }));
  dispatch(updateAccount({ account: walletState.account }));
  dispatch(updateChain({ chain: walletState.defaultChain }));
  dispatch(updateChain({ chain: { name: 'all' } }));
};
