import { useMemo, useState } from 'react';
import { message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { getAddressByChainId } from '@/cosmos/storage';
import { useWallet } from '@/app/contexts';
import type { SvgIconName } from '@/assets/icon/AppIcon';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import type { WalletRefreshAction, WalletSelectedAccountLike, WalletSelectedCrypto } from '@/popup/types/walletUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import eventBus from '@/shared/events';
import { EVENTS } from '@/shared/constants';

type Params = {
  selectedAccount?: WalletSelectedAccountLike;
  activeChainId: string;
  isAllNetworks: boolean;
  reloadDisplayData: WalletRefreshAction;
};

type WalletToolItem = {
  title: string;
  icon: SvgIconName;
  action: () => void;
};

export const useWalletPageController = ({ selectedAccount, activeChainId, isAllNetworks, reloadDisplayData }: Params) => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const walletController = useWallet();
  const [, setCopied] = useCopyClipboard();

  const [menuOpen, setMenuOpen] = useState(false);
  const [openWalletEdit, setOpenWalletEdit] = useState(false);
  const [openSettings, setOpenSettings] = useState(false);
  const [openManageCrypto, setOpenManageCrypto] = useState(false);
  const [openRecord, setOpenRecord] = useState(false);
  const [openAddress, setOpenAddress] = useState(false);
  const [openCryptoDetail, setOpenCryptoDetail] = useState(false);
  const [openSelectCrypto, setOpenSelectCrypto] = useState(false);
  const [openSendSelectCrypto, setOpenSendSelectCrypto] = useState(false);
  const [openNetwork, setOpenNetwork] = useState(false);
  const [selectedCrypto, setSelectedCrypto] = useState<WalletSelectedCrypto>(null);

  const onSelectCrypto = (crypto?: NonNullable<WalletSelectedCrypto>, selectCryptoType?: string) => {
    if (crypto) {
      setSelectedCrypto(crypto);
    }
    setOpenSelectCrypto(false);
    if (selectCryptoType === 'cryptoDetail' && crypto) {
      setOpenCryptoDetail(true);
    }
  };

  const copyAddress = async () => {
    if (isAllNetworks) {
      setOpenAddress(true);
      return;
    }
    if (!selectedAccount?.wid || selectedAccount?.index === undefined) {
      setCopied('');
      return;
    }
    try {
      const res = await getAddressByChainId(selectedAccount.wid, String(selectedAccount.index), activeChainId);
      setCopied(res?.address || '');
    } catch {
      setCopied('');
    }
  };

  const handleLockWallet = async () => {
    setMenuOpen(false);
    try {
      await walletController.lockWallet();
      eventBus.emit(EVENTS.LOCK_WALLET);
      navigate('/password');
    } catch (error: any) {
      message.error(error?.message || t('page.wallet.lock.fail'));
    }
  };

  const toolList = useMemo<WalletToolItem[]>(
    () => [
      { title: t('page.wallet.action.send'), icon: 'TransferIcon', action: () => setOpenSendSelectCrypto(true) },
      { title: t('page.wallet.action.receive'), icon: 'ReceiveIcon', action: () => setOpenSelectCrypto(true) },
      { title: t('page.wallet.action.history'), icon: 'RecordIcon', action: () => setOpenRecord(true) },
      { title: t('page.wallet.action.more'), icon: 'MoresIcon', action: () => {} },
    ],
    [t],
  );

  const closeManageCrypto = async () => {
    await reloadDisplayData();
    setOpenManageCrypto(false);
  };

  return {
    menuOpen,
    openWalletEdit,
    openSettings,
    openManageCrypto,
    openRecord,
    openAddress,
    openCryptoDetail,
    openSelectCrypto,
    openSendSelectCrypto,
    openNetwork,
    selectedCrypto,
    toolList,
    setMenuOpen,
    setOpenWalletEdit,
    setOpenSettings,
    setOpenManageCrypto,
    setOpenRecord,
    setOpenAddress,
    setOpenCryptoDetail,
    setOpenSelectCrypto,
    setOpenSendSelectCrypto,
    setOpenNetwork,
    onSelectCrypto,
    copyAddress,
    handleLockWallet,
    closeManageCrypto,
  };
};

export default useWalletPageController;
