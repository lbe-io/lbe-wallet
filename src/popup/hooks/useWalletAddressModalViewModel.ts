import { useEffect, useMemo, useState } from 'react';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import type { Address, Chain } from '@/cosmos/storage';
import { useWalletModalContext } from '@/popup/hooks/useWalletModalContext';
import type { ReceiveQrcodeViewModelResult, WalletAddressListViewModelResult } from '@/popup/types/popupUi';
import { loadWalletModalAddresses, resolveWalletModalAddress } from '@/popup/utils/walletModalDataFacade';

type UseWalletAddressListOptions = {
  isOpen?: boolean;
};

export const useWalletAddressListViewModel = (options: UseWalletAddressListOptions = {}): WalletAddressListViewModelResult => {
  const { isOpen } = options;
  const { selectedAccount, activeChainId } = useWalletModalContext();
  const [searchValue, setSearchValue] = useState('');
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [openQrcode, setOpenQrcode] = useState(false);
  const [openNetwork, setOpenNetwork] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [selectedNetwork, setSelectedNetwork] = useState<Chain | null>(null);

  useEffect(() => {
    if (isOpen === false) return;
    loadWalletModalAddresses(selectedAccount).then((list) => {
      setAddresses(list);
    });
  }, [isOpen, selectedAccount]);

  const onSelectAddress = (address: Address) => {
    setSelectedAddress(address);
    setOpenQrcode(true);
  };

  const onSelectNetwork = (chain: Chain | undefined) => {
    if (chain) {
      setSelectedNetwork(chain);
      setOpenQrcode(true);
    } else {
      setOpenNetwork(false);
    }
  };

  return {
    selectedAccount,
    activeChainId,
    searchValue,
    setSearchValue,
    addresses,
    openQrcode,
    setOpenQrcode,
    openNetwork,
    setOpenNetwork,
    selectedAddress,
    selectedNetwork,
    onSelectAddress,
    onSelectNetwork,
  };
};

type UseReceiveQrcodeOptions = {
  isOpen: boolean;
  crypto?: Address | null;
  network?: Chain | null;
};

export const useReceiveQrcodeViewModel = ({ isOpen, crypto, network }: UseReceiveQrcodeOptions): ReceiveQrcodeViewModelResult => {
  const { selectedAccount, activeChainId } = useWalletModalContext();
  const [address, setAddress] = useState('');

  const resolvedChainId = useMemo(() => {
    return network?.chainId || crypto?.chainId || activeChainId || DEFAULT_COSMOS_CHAIN_ID;
  }, [network?.chainId, crypto?.chainId, activeChainId]);

  useEffect(() => {
    if (!isOpen) return;
    const loadAddress = async () => {
      const resolvedAddress = await resolveWalletModalAddress(selectedAccount, resolvedChainId);
      setAddress(resolvedAddress);
    };

    loadAddress();
  }, [isOpen, resolvedChainId, selectedAccount?.index, selectedAccount?.wid]);

  return {
    address,
    resolvedChainId,
  };
};

export default useWalletAddressListViewModel;
