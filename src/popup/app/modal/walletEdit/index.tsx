import React, { useState, useEffect } from 'react';
import { Typography, Flex, Collapse, Button, Modal } from 'antd';
import type { CollapseProps } from 'antd';
import { blo } from 'blo';
import { useNavigate } from 'react-router-dom';
import { db, getAddressByChainId, getAllWallets, getAccountsByWalletId, getAddressesByWidId } from '@/cosmos/storage';
import { useAppDispatch } from '@/popup/hooks/redux';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { updateWallet, updateAccount } from '@/popup/store/features/applicationSlice';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import AccountDetails from '@/popup/app/modal/accountDetails';
import Item from '@/components/Item';
import { AppIcon } from '@/assets/icon';
import { useWallet } from '@/app/contexts';
import type { Account, Wallet } from '@/cosmos/storage';
import type { WalletEditAccountWithBalance, WalletEditModalProps, WalletEditWalletGroup } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const WalletEdit: React.FC<WalletEditModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const wallet = useWallet();
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const [searchValue, setSearchValue] = useState('');
  const [collapses, setCollapses] = useState<WalletEditWalletGroup[]>([]);
  const [activeKeys, setActiveKeys] = useState<string[]>([]);
  const [items, setItems] = useState<CollapseProps['items']>([]);
  const [openAddWallet, setOpenAddWallet] = useState(false);
  const [detailAccount, setDetailAccount] = useState<Account | null>(null);
  const [detailWallet, setDetailWallet] = useState<Wallet | null>(null);
  const { selectedAccount, selectedChain, activeChainId } = useWalletEntitySelector();
  const [openAccountDetails, setOpenAccountDetails] = useState(false);

  const fetchAllData = async () => {
    const wallets = await getAllWallets();
    const all = await Promise.all(
      wallets.map(async (item) => {
        const accounts = await getAccountsByWalletId(item.id);
        const accountsWithBalance = await Promise.all(
          accounts.map(async (account) => {
            const assets = await db.accountAssets.filter((asset) => asset.wid === account.wid && asset.aIndex === account.index).toArray();
            const balance = assets.reduce((total, asset) => total + parseFloat(asset.balance || '0') * parseFloat(asset.price || '0'), 0);
            return { ...account, balance };
          }),
        );

        return {
          key: item.id,
          name: item.name,
          balance: accountsWithBalance.reduce((total, account) => total + account.balance, 0),
          accounts: accountsWithBalance,
          wallet: item,
        };
      }),
    );
    setCollapses(all);
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (collapses.length > 0) {
      setActiveKeys(collapses.map((w) => w.key));
    }
  }, [collapses]);

  useEffect(() => {
    const nextItems: CollapseProps['items'] = collapses
      .reduce<WalletEditWalletGroup[]>((acc, currentWallet) => {
        if (currentWallet.name.includes(searchValue)) {
          acc.push(currentWallet);
        } else {
          const matchedAccounts = currentWallet.accounts.filter((account: WalletEditAccountWithBalance) => account.name.includes(searchValue));
          if (matchedAccounts.length > 0) {
            acc.push({ ...currentWallet, accounts: matchedAccounts });
          }
        }
        return acc;
      }, [])
      .map((collapse: WalletEditWalletGroup) => ({
        key: collapse.key,
        label: (
          <Flex align="center" justify="space-between" className="wallet-edit-collapse-label">
            <Text className="ui-title-lg-primary-medium">{collapse.name}</Text>
            <Text className="ui-text-xs-secondary">${Number(collapse.balance || 0).toFixed(2)}</Text>
          </Flex>
        ),
        children: (
          <Flex vertical>
            {collapse.accounts.map((item: WalletEditAccountWithBalance) => (
              <Item
                key={item.id}
                type="wallet"
                icon={blo(`0x${item.id}`)}
                onClick={async () => {
                  const preferredChainId = activeChainId || selectedChain.chainId || selectedChain.type || '';
                  const direct = preferredChainId ? await getAddressByChainId(item.wid, item.index, preferredChainId) : undefined;
                  const fallback = direct || (await getAddressesByWidId(item.wid, item.index))[0];
                  wallet.changeSelectedAccount(fallback?.address || '');
                  dispatch(updateWallet({ wallet: collapse.wallet }));
                  dispatch(updateAccount({ account: item }));
                  onClose();
                }}
                rightBtn={() => {
                  setDetailAccount(item);
                  setDetailWallet(collapse.wallet);
                  setOpenAccountDetails(true);
                }}
                name={item.name}
                describe={`$ ${Number(item.balance || 0).toFixed(2)}`}
                selected={selectedAccount.id === item.id}
              />
            ))}
          </Flex>
        ),
      }));

    setItems(nextItems);
  }, [activeChainId, collapses, dispatch, onClose, searchValue, selectedAccount.id, selectedChain.chainId, selectedChain.type, wallet]);

  return (
    <FullScreen title={t('page.wallet.edit.title')} isOpen={isOpen} onClose={onClose}>
      {openAccountDetails && (
        <AccountDetails
          isOpen={openAccountDetails}
          account={detailAccount || undefined}
          wallet={detailWallet || undefined}
          onAccountRenamed={(nextAccount) => {
            setDetailAccount(nextAccount);
            setCollapses((prev) =>
              prev.map((walletItem) => ({
                ...walletItem,
                accounts: walletItem.accounts.map((accountItem: WalletEditAccountWithBalance) => (accountItem.id === nextAccount.id ? { ...accountItem, ...nextAccount } : accountItem)),
              })),
            );
          }}
          onClose={() => {
            setOpenAccountDetails(false);
            setDetailAccount(null);
            setDetailWallet(null);
          }}
        />
      )}
      <div className="ui-modal-shell wallet-edit-shell">
        <Flex className="wallet-edit-search-row" align="flex-start">
          <SearchInput placeholder={t('page.wallet.edit.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        <Flex className="wallet-edit-collapse-scroll" vertical>
          <Collapse
            className="wallet-edit-collapse"
            expandIcon={({ isActive }) => (
              <span className={`wallet-edit-expand-icon ${isActive ? 'wallet-edit-expand-icon-active' : ''}`}>
                <AppIcon name="DownOutlinedIcon" />
              </span>
            )}
            bordered={false}
            activeKey={activeKeys}
            onChange={(keys) => setActiveKeys(Array.isArray(keys) ? keys : [keys])}
            expandIconPosition={'end'}
            items={items}
          />
        </Flex>
        <Flex className="wallet-edit-action-row">
          <Button block size="large" shape="round" type="primary" onClick={() => setOpenAddWallet(true)}>
            {t('page.wallet.edit.add.wallet')}
          </Button>
        </Flex>
      </div>

      <Modal width={360} title={t('page.wallet.edit.add.wallet.title')} open={openAddWallet} footer={null} onCancel={() => setOpenAddWallet(false)}>
        <Flex vertical gap={5} className="wallet-edit-modal-actions">
          <Button block type="text" size="large" onClick={() => navigate('/import-with-srp')}>
            <Flex align="center" style={{ width: '100%' }} gap={10}>
              <AppIcon name="PlusIcon" />
              <Text className="wallet-edit-modal-text">{t('page.wallet.edit.import.wallet')}</Text>
            </Flex>
          </Button>
          <Button block type="text" size="large" onClick={() => navigate('/add-wallet-page')}>
            <Flex align="center" style={{ width: '100%' }} gap={10}>
              <AppIcon name="PlusIcon" />
              <Text className="wallet-edit-modal-text">{t('page.wallet.edit.import.account')}</Text>
            </Flex>
          </Button>
        </Flex>
      </Modal>
    </FullScreen>
  );
};

export default WalletEdit;
