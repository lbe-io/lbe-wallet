import React, { useState } from 'react';
import { Flex, Row, Col, Typography } from 'antd';
import { AppIcon } from '@/assets/icon';
import { useInViewport } from 'ahooks';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import Item from '@/components/Item';
import CustomCrypto from '../customCrypto';
import { useManageCryptoViewModel } from '@/popup/hooks/useManageCryptoViewModel';
import type { ManageCryptoModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const ManageCrypto: React.FC<ManageCryptoModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [inViewport] = useInViewport(() => document.getElementById('children'), {
    threshold: [0.75],
    root: () => document.getElementById('parent'),
  });
  const [openCustomCrypto, setOpenCustomCrypto] = useState(false);
  const { isAllNetworks, showList, showMore, currencyList, selectedCurrencyList, setSearchValue, searchCurrencyList, isSearching, isEmpty, refreshData, updateToken } = useManageCryptoViewModel(!!inViewport);

  return (
    <FullScreen title={t('page.manage.crypto.title')} isOpen={isOpen} onClose={onClose}>
      {openCustomCrypto && (
        <CustomCrypto
          isOpen={openCustomCrypto}
          onClose={(isConfirm?: boolean) => {
            setOpenCustomCrypto(false);
            if (isConfirm) {
              refreshData();
            }
          }}
        />
      )}
      <div className="ui-modal-shell manage-crypto-shell">
        <Flex className="manage-crypto-search-row" align="center">
          <SearchInput placeholder={t('page.manage.crypto.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        <div className="manage-crypto-body">
          <Flex align="center" justify="space-between" className="custom-crypto" onClick={() => setOpenCustomCrypto(true)}>
            <Text className="manage-crypto-custom-title">{t('page.manage.crypto.custom.crypto')}</Text>
            <AppIcon name="RightIcon" />
          </Flex>
          
          <Flex vertical className="manage-crypto-list" id="parent">
            {isSearching ? (
              !isEmpty ? (
                searchCurrencyList.map((crypto) => (
                  <Item
                    key={`${crypto.chainId}_${crypto.address}`}
                    type="manageCrypto"
                    icon={crypto.logoURI}
                    name={crypto.symbol}
                    describe={crypto.name}
                    selected={crypto.selected === '1'}
                    rightBtn={() => updateToken(crypto)}
                  />
                ))
              ) : (
                <Text className="manage-crypto-empty-text">{t('common.empty')}</Text>
              )
            ) : (
              <>
                {selectedCurrencyList.length > 0 && showList ? <Text className="manage-crypto-section-label">{t('page.manage.crypto.added')}</Text> : null}
                {showList
                  ? selectedCurrencyList.map((crypto, index) => (
                      <Item
                        key={crypto.address + index}
                        isMultiToken={!!crypto.groupValue && isAllNetworks}
                        type="manageCrypto"
                        icon={crypto.logoURI}
                        name={crypto.symbol}
                        describe={crypto.name}
                        selected={crypto.selected === '1'}
                        rightBtn={() => updateToken(crypto)}
                      />
                    ))
                  : null}
                {currencyList.length > 0 && showList ? <Text className="manage-crypto-section-label">{t('page.manage.crypto.popular')}</Text> : null}
                {showList
                  ? currencyList.map((crypto, index) => (
                      <Item
                        key={crypto.address + index}
                        isMultiToken={!!crypto.groupValue && isAllNetworks}
                        type="manageCrypto"
                        icon={crypto.logoURI}
                        name={crypto.symbol}
                        describe={crypto.name}
                        selected={crypto.selected === '1'}
                        rightBtn={() => updateToken(crypto)}
                      />
                    ))
                  : null}
                {showMore ? (
                  <Text id="children" className="manage-crypto-empty-text">
                    {t('common.loading')}
                  </Text>
                ) : null}
              </>
            )}
          </Flex>
        </div>
      </div>
    </FullScreen>
  );
};

export default ManageCrypto;
