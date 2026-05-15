import React, { useState, useEffect } from 'react';
import { Drawer, Flex } from 'antd';
import { getHotChains, Chain } from '@/cosmos/storage';
import allIcon from '@/assets/all.png';
import SearchInput from '@/components/SearchInput';
import Item from '@/components/Item';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

export interface NetworkDrawerProps {
  onClose: () => void;
  open: boolean;
  onClickItem: (chain: Record<string, any>) => void;
  chainInfo: Record<string, any>;
}

const NetworkDrawer: React.FC<NetworkDrawerProps> = ({ onClose, open, onClickItem, chainInfo }) => {
  const { t } = useTranslation();
  const [searchValue, setSearchValue] = useState('');
  const [allNetwork, setAllNetwork] = useState<Chain[]>([]);

  const getNetwork = async () => {
    const chains = await getHotChains();
    setAllNetwork(chains);
  };

  useEffect(() => {
    getNetwork();
  }, []);

  return (
    <Drawer title={t('page.network.title')} placement="bottom" width={360} height={540} rootClassName="network-drawer" onClose={onClose} open={open}>
      <>
        <Flex className="network-drawer-search-row" align="center">
          <SearchInput placeholder={t('page.network.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        <Flex vertical className="network-drawer-list">
          <Item
            type="network"
            name={t('page.network.all.networks')}
            icon={allIcon}
            onClick={() => {
              onClickItem({ name: t('page.network.all.networks'), chainId: '-1', icon: allIcon });
            }}
            selected={chainInfo.chainId === '-1'}
          />
          {allNetwork
            .filter((network: any) => network.name.includes(searchValue))
            .map((chain: any) => (
              <Item
                type="network"
                name={chain.name}
                icon={chain.icon}
                onClick={() => {
                  onClickItem(chain);
                }}
                selected={chainInfo?.chainId === chain.chainId}
              />
            ))}
        </Flex>
      </>
    </Drawer>
  );
};

export default NetworkDrawer;
