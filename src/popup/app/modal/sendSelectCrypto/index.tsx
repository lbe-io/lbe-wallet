import React from 'react';
import { Flex } from 'antd';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import SelectAddress from '@/popup/app/modal/selectAddress';
import Item from '@/components/Item';
import Network from '@/popup/app/modal/network';
import { useSendSelectCryptoViewModel } from '@/popup/hooks/useSendSelectCryptoViewModel';
import type { SendSelectCryptoModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';

const SendSelectCrypto: React.FC<SendSelectCryptoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const { filteredList, setSearchValue, openSelectAddress, setOpenSelectAddress, selectedCrypto, openNetwork, defaultNetworks, onSelectCurrency, onSelectNetwork } = useSendSelectCryptoViewModel(isOpen);

  return (
    <FullScreen title={t('page.send.select.crypto.title')} isOpen={isOpen} onClose={() => onClose()}>
      {openNetwork && <Network showTab={false} defaultNetworks={defaultNetworks} isOpen={openNetwork} onClose={(chain) => onSelectNetwork(chain)} />}
      {openSelectAddress && <SelectAddress token={selectedCrypto} isOpen={openSelectAddress} onClose={() => setOpenSelectAddress(false)} />}
      <div className="ui-modal-shell">
        <Flex className="ui-modal-search-row" align="center">
          <SearchInput placeholder={t('page.send.amount.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        
        <Flex vertical className="ui-modal-scroll-list" id="parent">
          {filteredList.map((crypto) => (
            <Item
              key={`${crypto.chainId}_${crypto.address}`}
              type="crypto"
              icon={crypto.logoURI}
              isMultiToken={(crypto.currencyGroups?.length || 0) > 0}
              name={crypto.symbol}
              describe={crypto.address}
              onClick={() => onSelectCurrency(crypto)}
              amount={crypto.amount}
              balance={crypto.balance}
            />
          ))}
        </Flex>
      </div>
    </FullScreen>
  );
};

export default SendSelectCrypto;
