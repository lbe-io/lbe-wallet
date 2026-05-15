import React, { useState } from 'react';
import { Flex, Row, Col, Typography } from 'antd';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import Item from '@/components/Item';
import CustomCrypto from '../customCrypto';
import { useWalletAddressListViewModel } from '@/popup/hooks/useWalletAddressModalViewModel';
import type { AddressCopyModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const AddressCopy: React.FC<AddressCopyModalProps> = ({ isOpen, onClose }) => {
  const { t } = useTranslation();
  const [, setCopied] = useCopyClipboard();
  const [openCustomCrypto, setOpenCustomCrypto] = useState(false);
  const { setSearchValue, addresses } = useWalletAddressListViewModel({ isOpen });

  return (
    <FullScreen title={t('page.address.title')} isOpen={isOpen} onClose={onClose}>
      <CustomCrypto isOpen={openCustomCrypto} onClose={() => setOpenCustomCrypto(false)} />
      <div className="address-copy-body ui-modal-shell">
        <Flex className="address-copy-search" align="center">
          <SearchInput placeholder={t('page.address.search.placeholder')} onSearchChange={setSearchValue} />
        </Flex>
        <div className="address-copy-content">
          <Row align="top" className="address-copy-heading-row">
            <Col>
              <Text className="address-copy-heading">{t('page.address.popular.networks')}</Text>
            </Col>
          </Row>
          <Flex vertical className="address-copy-list">
            {addresses.map((item) => (
              <Item key={`${item.chainId}_${item.address}`} type="address" isMultiToken={false} name={item.chainType} describe={item.address} rightBtn={() => setCopied(item.address)} />
            ))}
          </Flex>
        </div>
      </div>
    </FullScreen>
  );
};

export default AddressCopy;
