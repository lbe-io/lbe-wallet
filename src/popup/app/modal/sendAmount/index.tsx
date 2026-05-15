import React from 'react';
import { Typography, Flex, Drawer, Button, Input, Avatar } from 'antd';
import FullScreen from '@/components/FullScreen';
import SearchInput from '@/components/SearchInput';
import SendInfo from '@/popup/app/modal/sendInfo';
import type { SendAmountModalProps } from '@/popup/types/popupUi';
import { useSendAmountViewModel } from '@/popup/hooks/useSendAmountViewModel';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const SendAmount: React.FC<SendAmountModalProps> = ({ isOpen, onClose, token, toAddress, onSuccess }) => {
  const { t } = useTranslation();
  const {
    inputRef,
    searchValue: _searchValue,
    setSearchValue,
    amount,
    fontSize,
    textWidth,
    openDrawer,
    setOpenDrawer,
    openSendInfo,
    openNextStep,
    closeNextStep,
    formattedTokenAmount,
    handleChange,
    handleMax,
    sendInfoStep,
    handleSendInfoSuccess,
  } = useSendAmountViewModel({
    token,
    toAddress,
    onClose,
    onSuccess,
  });

  return (
    <FullScreen title={t('page.send.amount.title')} isOpen={isOpen} onClose={onClose}>
      {openSendInfo && <SendInfo {...sendInfoStep} isOpen={openSendInfo} onClose={closeNextStep} onSuccess={handleSendInfoSuccess} />}
      <div className="send-amount ui-modal-shell send-amount-shell">
        <Drawer title={t('page.send.amount.drawer.title')} placement="bottom" width={360} height={540} rootClassName="send-amount-drawer" onClose={() => setOpenDrawer(false)} open={openDrawer}>
          <SearchInput placeholder={t('page.send.amount.search.placeholder')} onSearchChange={setSearchValue} />
        </Drawer>
        <div className="send-amount-main">
          <Flex className="send-amount-scroll" vertical align="center" justify="space-between">
            <Flex vertical align="center">
              <Input className="send-amount-input" style={{ fontSize }} contentEditable={true} styles={{ input: { width: textWidth } }} value={amount} ref={inputRef} variant="borderless" suffix={token?.symbol} onChange={handleChange} />
            </Flex>

            <Flex className="send-amount-balance-card ui-content-inset-16" justify="space-between" align="center" gap={8}>
              <Flex align="center">
                <Avatar {...(token?.logoURI && { src: token?.logoURI })} size={36} className={`ui-token-avatar-36 send-amount-token-avatar ${token?.logoURI ? '' : 'send-amount-token-avatar--fallback'}`}>
                  {token?.symbol?.charAt(0)}
                </Avatar>
                <Flex className="send-amount-balance-text" vertical>
                  <Text className="ui-text-xs-secondary">{t('page.send.amount.balance.label')}</Text>
                  <Text className="ui-title-lg-primary-medium">{`${formattedTokenAmount} ${token?.symbol || ''}`}</Text>
                </Flex>
              </Flex>

              <Button type="link" onClick={handleMax}>
                {t('page.send.amount.max')}
              </Button>
            </Flex>
          </Flex>

          <Button className="send-amount-submit-btn ui-content-inset-16" type="primary" size="large" shape="round" onClick={openNextStep} disabled={!amount || parseFloat(amount) <= 0}>
            {t('page.send.amount.submit')}
          </Button>
        </div>
      </div>
    </FullScreen>
  );
};

export default SendAmount;
