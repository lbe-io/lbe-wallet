import React, { useState } from 'react';
import { Flex } from 'antd';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import Network from '@/popup/app/modal/network';
import ReceiveQrcode from '@/popup/app/modal/receiveQrcode';
import Item from '@/components/Item';
import { useWalletAddressListViewModel } from '@/popup/hooks/useWalletAddressModalViewModel';
import type { SelectCryptoModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const SelectCrypto: React.FC<SelectCryptoModalProps> = ({ isOpen, onClose, type }) => {
  const { t } = useTranslation();
  const [, setCopied] = useCopyClipboard();
  const { setSearchValue, addresses: selectedCurrencyList, openQrcode, setOpenQrcode, openNetwork, selectedAddress, selectedNetwork, onSelectAddress, onSelectNetwork } = useWalletAddressListViewModel({ isOpen });

  return (
    <FullScreen title={t('page.receive.select.crypto.title')} isOpen={isOpen} onClose={() => onClose()}>
      {openNetwork && type === 'receive' && <Network showTab={false} isOpen={openNetwork} onClose={(chain) => onSelectNetwork(chain)} />}
      {openQrcode && type === 'receive' && <ReceiveQrcode crypto={selectedAddress} network={selectedNetwork} isOpen={openQrcode} onClose={() => setOpenQrcode(false)} />}
      <div className="ui-modal-shell select-crypto-modal-shell">
        <Flex className="ui-modal-search-row select-crypto-modal-search-row" align="center">
          <SearchInput placeholder={t('page.network.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        <div className="ui-modal-scroll-list select-crypto-modal-scroll-shell">
          <Flex vertical className="ui-modal-scroll-list select-crypto-modal-list" id="parent">
            {selectedCurrencyList.map((item) => (
              <Item
                key={`${item.chainId}_${item.address}`}
                type="address"
                isMultiToken={false}
                name={item.chainId}
                describe={item.address}
                rightBtn={(e) => {
                  e.stopPropagation();
                  setCopied(item.address);
                }}
                onClick={() => onSelectAddress(item)}
              />
            ))}
          </Flex>
        </div>
      </div>
    </FullScreen>
  );
};

export default SelectCrypto;
