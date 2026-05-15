import { Flex, Button, Avatar, ConfigProvider, Statistic, Dropdown, Divider } from 'antd';
import { FormOutlined } from '@ant-design/icons';
import { useRef } from 'react';
import { useScroll } from 'ahooks';
import { blo } from 'blo';
import { AppIcon } from '@/assets/icon';
import WalletEdit from '@/popup/app/modal/walletEdit';
import ManageCrypto from '@/popup/app/modal/manageCrypto';
import Record from '@/popup/app/modal/Record';
import AddressCope from '@/popup/app/modal/address';
import CryptoDetail from '@/popup/app/modal/cryptoDetail';
import Settings from '@/popup/app/modal/settings';
import Network from '@/popup/app/modal/network';
import SelectCrypto from '@/popup/app/modal/selectCrypto';
import SendSelectCrypto from '@/popup/app/modal/sendSelectCrypto';
import Item from '@/components/Item';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { useWalletAssetViewModel } from '@/popup/hooks/useWalletAssetViewModel';
import { useWalletPageController } from '@/popup/hooks/useWalletPageController';
import { themePrimarySurface } from '@/styles/antdThemeTokens';
import './index.css';

function WalletPage() {
  const { t } = useTranslation();
  const ref = useRef(null);
  useScroll(ref);
  const { selectedAccount, selectedWallet, selectedChain, activeChainId, isAllNetworks, balance, currencyGroupList, reloadDisplayData } = useWalletAssetViewModel();
  const {
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
  } = useWalletPageController({
    selectedAccount,
    activeChainId,
    isAllNetworks,
    reloadDisplayData,
  });

  return (
    <Flex className="wallet-page-shell" vertical>
      {openWalletEdit && <WalletEdit isOpen={openWalletEdit} onClose={() => setOpenWalletEdit(false)} />}
      {openSettings && <Settings isOpen={openSettings} onClose={() => setOpenSettings(false)} />}
      {openManageCrypto && (
        <ManageCrypto
          isOpen={openManageCrypto}
          onClose={() => {
            void closeManageCrypto();
          }}
        />
      )}
      {openRecord && <Record isOpen={openRecord} onClose={() => setOpenRecord(false)} />}
      {openAddress && <AddressCope isOpen={openAddress} onClose={() => setOpenAddress(false)} />}
      {openCryptoDetail && <CryptoDetail selectedCrypto={selectedCrypto} isOpen={openCryptoDetail} onClose={() => setOpenCryptoDetail(false)} />}
      {openSelectCrypto && <SelectCrypto type="receive" isOpen={openSelectCrypto} onClose={(crypto) => onSelectCrypto(crypto)} />}
      {openNetwork && <Network showTab={true} isOpen={openNetwork} onClose={() => setOpenNetwork(false)} />}
      {openSendSelectCrypto && <SendSelectCrypto isOpen={openSendSelectCrypto} onClose={() => setOpenSendSelectCrypto(false)} />}
      <Flex className="wallet-page-header" justify="space-between" align="center">
        <Flex align="center" gap={8} className="wallet-page-header-left">
          <Avatar src={selectedWallet.photo || blo(`0x${selectedWallet.id}`)} size={38} />
          <Flex vertical className="wallet-page-wallet-trigger" onClick={() => setOpenWalletEdit(true)}>
            <span className="wallet-page-wallet-name">{selectedWallet.name || '--'}</span>
            <Flex align="center" gap={4}>
              <span className="wallet-page-account-name">{selectedAccount.name || '--'}</span>
              <AppIcon name="DownIcon" />
            </Flex>
          </Flex>
        </Flex>
        <Flex align="center" gap={16} className="wallet-page-header-right">
          <Button type="text" size="small" shape="circle" onClick={() => void copyAddress()} icon={<AppIcon name="CopeIcon" />} />

          <Dropdown
            trigger={['click']}
            open={menuOpen}
            onOpenChange={(open) => setMenuOpen(open)}
            placement="bottom"
            popupRender={() => (
              <Flex vertical align="center" className="wallet-page-settings-menu">
                <Button
                  block
                  type="text"
                  size="small"
                  className="wallet-page-settings-item"
                  onClick={() => {
                    setMenuOpen(false);
                    setOpenSettings(true);
                  }}
                >
                  {t('page.wallet.settings')}
                </Button>
                <Divider className="wallet-page-settings-divider" />
                <Button block type="text" size="small" onClick={handleLockWallet} className="wallet-page-settings-item">
                  {t('page.wallet.lock.wallet')}
                </Button>
              </Flex>
            )}
          >
            <Button type="text" size="small" shape="circle" icon={<AppIcon name="SettingIcon" />} />
          </Dropdown>

          <Flex align="center" onClick={() => setOpenNetwork(true)} justify="space-between" className="wallet-page-network-switch">
            {isAllNetworks ? (
              <AppIcon name="MoreIcon" />
            ) : (
              <Avatar {...(selectedChain.icon && { src: selectedChain.icon })} size={24} className={`wallet-page-network-avatar ${selectedChain.icon ? '' : 'wallet-page-network-avatar-fallback'}`}>
                {selectedChain?.name?.charAt(0)}
              </Avatar>
            )}
            <AppIcon name="BigDownIcon" />
          </Flex>
        </Flex>
      </Flex>
      <Flex vertical className="wallet-page-balance-block" gap={8}>
        <Flex align="center" gap={12}>
          <Flex align="center">
            <span className="wallet-page-balance-prefix">$</span>
            <Statistic precision={2} value={balance} valueStyle={{ fontSize: '32px', color: '#010101', fontWeight: 700 }} />
          </Flex>
        </Flex>
        <Flex align="center" className="wallet-page-balance-trend" gap={4}>
          <span className="wallet-page-balance-trend-up ui-text-13-secondary">{'↗$ 3.58(0.6%)'}</span>
          <span className="wallet-page-balance-trend-label ui-text-13-primary">24h</span>
          <AppIcon name="DownIcon" />
        </Flex>
      </Flex>
      <ConfigProvider theme={themePrimarySurface}>
        <Flex className="wallet-page-tool-row" justify="space-between">
          {toolList.map((item) => (
            <Flex key={item.title} align="center" gap={8} className="wallet-page-tool-item" vertical>
              <Button type="primary" className="wallet-page-tool-btn" shape="circle" icon={<AppIcon name={item.icon} />} onClick={item.action} />
              <span className="wallet-page-tool-title">{item.title}</span>
            </Flex>
          ))}
        </Flex>
      </ConfigProvider>
      <Flex className="wallet-page-token-header" align="center" justify="space-between">
        <span className="wallet-page-token-title ui-title-lg-primary-medium">{t('page.wallet.tokens')}</span>
        <Button type="text" size="small" shape="circle" icon={<FormOutlined />} onClick={() => setOpenManageCrypto(true)} />
      </Flex>
      <Flex vertical className="wallet-page-token-list">
        {currencyGroupList.map((item: any) => (
          <Item
            type="token"
            key={item.chainId + item.address}
            icon={item.logoURI}
            name={item.symbol}
            amount={item.amount}
            balance={item.balance}
            describe={item.price}
            onClick={() => {
              onSelectCrypto(item, 'cryptoDetail');
            }}
          />
        ))}
        <div className="wallet-page-token-list-spacer"></div>
      </Flex>
    </Flex>
  );
}

export default WalletPage;
