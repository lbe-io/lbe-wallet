import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import type { RootState } from '@/popup/store';
export interface ApplicationState {
  lang: string;
  isLoading: boolean;
  rsaKeyLoaded: boolean;
  selectedWallet: { [key: string]: any };
  selectedAccount: { [key: string]: any };
  selectedChain: { [key: string]: any };
  activeChainId: string;
  networkMode: 'all' | 'single';
}

const initialState: ApplicationState = {
  lang: 'en',
  isLoading: false,
  rsaKeyLoaded: false,
  selectedWallet: {},
  selectedAccount: {},
  selectedChain: { name: 'all' },
  activeChainId: DEFAULT_COSMOS_CHAIN_ID,
  networkMode: 'all',
};

export const applicationSlice = createSlice({
  name: 'application',
  initialState,
  reducers: {
    updateLanguage: (state, { payload }) => {
      state.lang = payload;
    },
    showLoad: (state) => {
      state.isLoading = true;
    },
    hideLoad: (state) => {
      state.isLoading = false;
    },
    updateRsaKeyLoaded: (state, { payload }) => {
      state.rsaKeyLoaded = payload;
    },
    updateWallet: (state, action) => {
      const { wallet } = action.payload;
      state.selectedWallet = Object.keys(wallet).length === 0 ? {} : wallet;
    },
    updateAccount: (state, action) => {
      const { account } = action.payload;
      state.selectedAccount = Object.keys(account).length === 0 ? {} : account;
    },
    updateChain: (state, action) => {
      const { chain } = action.payload;
      if (!chain || Object.keys(chain).length === 0 || chain.name === 'all') {
        state.selectedChain = { name: 'all' };
        state.networkMode = 'all';
        if (!state.activeChainId) {
          state.activeChainId = DEFAULT_COSMOS_CHAIN_ID;
        }
        return;
      }

      state.selectedChain = chain;
      state.networkMode = 'single';
      if (chain.chainId) {
        state.activeChainId = chain.chainId;
      }
    },
    updateActiveChainId: (state, action) => {
      const { chainId } = action.payload;
      if (!chainId) {
        return;
      }
      state.activeChainId = chainId;
      if (state.networkMode === 'single') {
        state.selectedChain = { ...state.selectedChain, chainId };
      }
    },
  },
});

export const { updateLanguage, showLoad, hideLoad, updateRsaKeyLoaded, updateWallet, updateAccount, updateChain, updateActiveChainId } = applicationSlice.actions;

export const applicationState = (state: RootState) => state.application;

export default applicationSlice.reducer;
