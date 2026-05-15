import React, { useState, useEffect, useCallback } from 'react';
import { Flex, Button, Typography } from 'antd';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import Item from '@/components/Item';
import CustomCrypto from '../customCrypto';
import Empty from '@/components/Empty';
import { useWallet } from '@/app/contexts';
import { getCurrentTab } from '@/app/runtime';
import { getAllChainRpcs, Chain, ChainRpc } from '@/cosmos/storage';
import allIcon from '@/assets/all.png';
import { useAppDispatch } from '@/popup/hooks/redux';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { updateActiveChainId, updateChain } from '@/popup/store/features/applicationSlice';
import NetworkEdit from '@/popup/app/modal/networkEdit';
import { listBuiltinChainRecords, listCustomChainRecords } from '@/cosmos/chains/chainRepository';
import { DEFAULT_COSMOS_CHAIN_ID } from '@/cosmos/chains/chain-registry';
import type { NetworkEditInfo, NetworkModalProps, PopupSiteInfo } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const Network: React.FC<NetworkModalProps> = ({ isOpen, onClose, showTab, defaultNetworks }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const wallet = useWallet();
  const { selectedChain, activeChainId, isAllNetworks } = useWalletEntitySelector();
  const [openCustomCrypto, setOpenCustomCrypto] = useState(false);
  const [openEditNetwork, setOpenEditNetwork] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [allNetwork, setAllNetwork] = useState<Chain[]>([]);
  const [rpcNetwork, setRpcNetwork] = useState<ChainRpc[]>([]);
  const [customNetwork, setCustomNetwork] = useState<Chain[]>([]);
  const [networkInfo, setNetworkInfo] = useState<NetworkEditInfo>({});
  const [isAdd, setIsAdd] = useState(false);
  const [tab, setTab] = useState('1');
  const [site, setSite] = useState<PopupSiteInfo | null>(null);

  const getCurrentSite = useCallback(async () => {
    const tab = await getCurrentTab();
    if (!tab.id || !tab.url) return;
    const current = (await wallet.getCurrentSite(tab.id)) as PopupSiteInfo | null | undefined;
    setSite(current || null);
  }, [wallet]);

  const tabs = [
    { title: t('page.network.tab.popular'), value: '1' },
    { title: t('page.network.tab.custom'), value: '3' },
  ];

  const fetchAllData = async () => {
    const chains = listBuiltinChainRecords();
    const customChains = await listCustomChainRecords();
    const rpcChains = await getAllChainRpcs();
    setAllNetwork(defaultNetworks || chains);
    setCustomNetwork(customChains);
    setRpcNetwork(rpcChains);
  };

  useEffect(() => {
    getCurrentSite();
    fetchAllData();
  }, [getCurrentSite]);

  const handleSearchChange = (value: string) => {
    setSearchValue(value);
  };

  const normalizedSearchValue = searchValue.toLowerCase();
  const runtimeChainId = activeChainId || DEFAULT_COSMOS_CHAIN_ID;

  return (
    <FullScreen title={t('page.network.title')} isOpen={isOpen} onClose={() => onClose()}>
      {openEditNetwork && (
        <NetworkEdit
          networkInfo={networkInfo}
          isAdd={isAdd}
          isOpen={openEditNetwork}
          onClose={() => {
            setOpenEditNetwork(false);
            setNetworkInfo({});
          }}
        />
      )}
      <CustomCrypto
        isOpen={openCustomCrypto}
        onClose={(added?: boolean) => {
          if (added) {
            fetchAllData();
          }
          setOpenCustomCrypto(false);
        }}
      />
      <div className="ui-modal-shell network">
        <Flex className="ui-modal-search-row" align="center">
          <SearchInput placeholder={t('page.network.search.placeholder')} onSearchChange={handleSearchChange} />
        </Flex>
        <div className="ui-modal-scroll-list network-body">
          {showTab ? (
            <Flex className="network-tab-row" align="center" gap={24}>
              {tabs.map((item) => (
                <Text key={item.value} className={`tab ${item.value === tab ? 'check' : ''}`} onClick={() => setTab(item.value)}>
                  {item.title}
                </Text>
              ))}
            </Flex>
          ) : null}

          <Flex vertical className={`ui-modal-scroll-list ${showTab ? 'network-list-with-tab' : 'network-list-no-tab'} ${tab === '1' ? '' : 'network-list-hidden'}`}>
            {showTab ? (
              <Item
                type="network"
                name={t('page.network.all.networks')}
                icon={allIcon}
                onClick={async () => {
                  await wallet.changeSelectedChain(runtimeChainId);
                  dispatch(updateActiveChainId({ chainId: runtimeChainId }));
                  dispatch(updateChain({ chain: { name: 'all' } }));
                  onClose();
                }}
                selected={isAllNetworks}
              />
            ) : null}
            {allNetwork
              .filter((network: any) => (network.name || '').toLowerCase().includes(normalizedSearchValue))
              .map((chain: any) => (
                <Item
                  key={chain.chainId}
                  type="network"
                  name={chain.name}
                  icon={chain.icon}
                  onClick={async () => {
                    if (showTab) {
                      await wallet.changeSelectedChain(chain?.chainId);
                      dispatch(updateActiveChainId({ chainId: chain?.chainId }));
                      dispatch(updateChain({ chain: chain }));
                      onClose();
                    } else {
                      onClose(chain);
                    }
                  }}
                  selected={!isAllNetworks && selectedChain?.chainId === chain.chainId}
                />
              ))}
          </Flex>

          <Flex vertical className={`ui-modal-scroll-list network-list ${showTab ? 'network-list-with-tab' : 'network-list-no-tab'} ${tab === '2' ? '' : 'network-list-hidden'}`}>
            {rpcNetwork
              .filter((network: any) => (network.name || '').toLowerCase().includes(normalizedSearchValue))
              .map((chain: any) => (
                <Item
                  key={`${chain.chainId}_${chain.url}`}
                  type="rpcNetwork"
                  name={chain.name}
                  icon={chain.icon}
                  rightBtn={() => {
                    setNetworkInfo(() => chain);
                    setIsAdd(() => false);
                    setOpenEditNetwork(() => true);
                  }}
                />
              ))}
          </Flex>

          <Flex vertical className={`ui-modal-scroll-list network-list ${showTab ? 'network-list-with-tab' : 'network-list-no-tab'} ${tab === '3' ? '' : 'network-list-hidden'}`}>
            {customNetwork.length > 0 ? (
              customNetwork
                .filter((network: any) => (network.name || '').toLowerCase().includes(normalizedSearchValue))
                .map((chain: any) => (
                  <Item
                    key={chain.chainId}
                    type="network"
                    name={chain.name}
                    icon={chain.icon}
                    onClick={async () => {
                      if (showTab) {
                        await wallet.changeSelectedChain(chain?.chainId);
                        dispatch(updateActiveChainId({ chainId: chain?.chainId }));
                        dispatch(updateChain({ chain: chain }));
                        onClose();
                      } else {
                        onClose(chain);
                      }
                    }}
                    selected={!isAllNetworks && selectedChain?.chainId === chain.chainId}
                  />
                ))
            ) : (
              <Empty />
            )}
            
            <Button
              className="ui-cta-pill network-add-btn"
              type="primary"
              size="large"
              shape="round"
              onClick={() => {
                setIsAdd(true);
                setOpenEditNetwork(() => true);
              }}
            >
              {t('page.network.add.custom')}
            </Button>
          </Flex>
        </div>
      </div>
    </FullScreen>
  );
};

export default Network;
