import React, { useEffect, useState } from 'react';
import { Avatar, Flex, Spin, Typography } from 'antd';
import { blo } from 'blo';
import type { Account, Address, Wallet } from '@/cosmos/storage';
import { getAddressByChainId, getAddressesByWidId } from '@/cosmos/storage';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { useNetworkContext } from '@/popup/hooks/useNetworkContext';
import FullScreen from '@/components/FullScreen';
import SelectCrypto from '@/popup/app/modal/selectCrypto';
import PrivateKeyList from '@/popup/app/modal/privateKeyList';
import RevealRecovery from '@/popup/app/phrase/revealRecovery';
import Seed from '@/popup/app/modal/seed';
import RenameModal from '@/popup/app/modal/rename';
import Item from '@/components/Item';
import { useWallet } from '@/app/contexts';
import type { AccountDetailsModalProps } from '@/popup/types/popupUi';
import './index.css';

const { Text } = Typography;

const AccountDetails: React.FC<AccountDetailsModalProps> = ({ isOpen, onClose, account, wallet, onAccountRenamed }) => {
  const [openSelectCrypto, setOpenSelectCrypto] = useState(false);
  const [openPrivateKeyList, setOpenPrivateKeyList] = useState(false);
  const [openRevealRecovery, setOpenRevealRecovery] = useState(false);
  const [openSeed, setOpenSeed] = useState(false);
  const [openRename, setOpenRename] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(false);
  const [mnemonicBackupPending, setMnemonicBackupPending] = useState<boolean | null>(null);
  const [displayAccount, setDisplayAccount] = useState<Account | undefined>(account);
  const walletController = useWallet();
  const { selectedAccount, selectedWallet } = useWalletEntitySelector();
  const { activeChainId } = useNetworkContext();

  const fallbackAccount = selectedAccount.id ? (selectedAccount as Account) : undefined;
  const fallbackWallet = selectedWallet.id ? (selectedWallet as Wallet) : undefined;
  const resolvedAccount = displayAccount || account || fallbackAccount;
  const resolvedWallet = wallet || fallbackWallet;

  useEffect(() => {
    setDisplayAccount(account);
  }, [account]);

  useEffect(() => {
    let cancelled = false;

    const loadDetails = async () => {
      if (!isOpen || !resolvedAccount?.wid || resolvedAccount?.index === undefined) {
        setAddresses([]);
        return;
      }

      try {
        setLoading(true);
        const [addressList] = await Promise.all([getAddressesByWidId(resolvedAccount.wid, resolvedAccount.index), getAddressByChainId(resolvedAccount.wid, resolvedAccount.index, activeChainId).catch(() => undefined)]);

        if (cancelled) {
          return;
        }

        setAddresses(addressList);
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    loadDetails();

    return () => {
      cancelled = true;
    };
  }, [activeChainId, isOpen, resolvedAccount?.index, resolvedAccount?.wid, walletController]);

  useEffect(() => {
    let cancelled = false;

    const loadMnemonicBackupPending = async () => {
      if (!isOpen) {
        return;
      }

      try {
        const pending = await walletController.getMnemonicBackupPending(resolvedWallet?.id);
        if (!cancelled) {
          setMnemonicBackupPending(!!pending);
        }
      } catch {
        if (!cancelled) {
          setMnemonicBackupPending(false);
        }
      }
    };

    setMnemonicBackupPending(null);
    loadMnemonicBackupPending();

    return () => {
      cancelled = true;
    };
  }, [isOpen, resolvedAccount?.id, resolvedWallet?.id, walletController]);

  return (
    <FullScreen title={resolvedAccount?.name} isOpen={isOpen} onClose={onClose}>
      {openSelectCrypto && <SelectCrypto type="receive" isOpen={openSelectCrypto} onClose={() => setOpenSelectCrypto(false)} />}
      {openPrivateKeyList && <PrivateKeyList isOpen={openPrivateKeyList} account={resolvedAccount} wallet={resolvedWallet} onClose={() => setOpenPrivateKeyList(false)} />}
      {openRevealRecovery && (
        <RevealRecovery
          isOpen={openRevealRecovery}
          account={resolvedAccount}
          wallet={resolvedWallet}
          onClose={async () => {
            setOpenRevealRecovery(false);
            setMnemonicBackupPending(await walletController.getMnemonicBackupPending(resolvedWallet?.id));
          }}
        />
      )}
      {openSeed && (
        <Seed
          isOpen={openSeed}
          account={resolvedAccount}
          wallet={resolvedWallet}
          onClose={async () => {
            setOpenSeed(false);
            setMnemonicBackupPending(await walletController.getMnemonicBackupPending(resolvedWallet?.id));
          }}
        />
      )}
      <RenameModal
        isOpen={openRename}
        account={resolvedAccount}
        onClose={() => setOpenRename(false)}
        onRenamed={(nextAccount) => {
          setDisplayAccount(nextAccount);
          onAccountRenamed?.(nextAccount);
        }}
      />

      <div className="ui-fill-shell">
        <Flex vertical align="center" justify="center" className="account-details-header" gap={8}>
          <Avatar src={resolvedWallet?.photo || blo(`0x${resolvedWallet?.id || resolvedAccount?.id || 'account'}`)} size={56} />
          <Text className="ui-text-13-secondary">{resolvedWallet?.name || '--'}</Text>
        </Flex>

        {loading ? (
          <Flex justify="center" align="center" className="account-details-loading-wrap">
            <Spin />
          </Flex>
        ) : (
          <Flex vertical className="account-details-item-list">
            <Item type="account" isMultiToken={false} name="Account name" describe={resolvedAccount?.name || '--'} onClick={() => setOpenRename(true)} />
            <Item type="account" isMultiToken={false} name="Networks" describe={`${addresses.length} addresses`} onClick={() => setOpenSelectCrypto(true)} />
            <Item type="account" isMultiToken={false} name="Private Keys" describe="Unlock to reveal" onClick={() => setOpenPrivateKeyList(true)} />
            <Item
              type="account"
              isMultiToken={false}
              name="Secret Recovery Phrase"
              describe={mnemonicBackupPending === null ? '...' : mnemonicBackupPending ? 'Backup' : 'Reveal'}
              onClick={() => {
                if (mnemonicBackupPending === null) {
                  return;
                }
                if (mnemonicBackupPending) {
                  setOpenRevealRecovery(true);
                  return;
                }
                setOpenSeed(true);
              }}
            />
          </Flex>
        )}
      </div>
    </FullScreen>
  );
};

export default AccountDetails;
