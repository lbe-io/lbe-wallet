import React from 'react';
import { Typography, Flex, Button, Statistic, Avatar } from 'antd';
import { AppIcon } from '@/assets/icon';
import FullScreen from '@/components/FullScreen';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import GasInfo from '@/components/gasInfo';
import type { SendInfoModalProps } from '@/popup/types/popupUi';
import { useSendInfoViewModel } from '@/popup/hooks/useSendInfoViewModel';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const SendInfo: React.FC<SendInfoModalProps> = ({ isOpen, onClose, token, amount, toAddress, onSuccess }) => {
  const { t } = useTranslation();
  const [, setCopied] = useCopyClipboard();
  const { networkFeeLabel, fromAddressIsMine, toAddressIsMine, setSelectedFee, submitting, numericAmount, displayAmount, confirmDisabled, handleConfirm } = useSendInfoViewModel({
    token,
    amount,
    toAddress,
    onSuccess,
  });

  return (
    <FullScreen title={t('page.send.info.title')} isOpen={isOpen} onClose={onClose}>
      <div className="ui-modal-shell">
        <Flex className="send-info-content" vertical align="center">
          <Flex className="send-info-asset-row ui-content-inset-16" justify="space-between" align="center" gap={8}>
            <Flex align="center">
              <Avatar {...(token?.logoURI && { src: token?.logoURI })} size={36} className={`ui-token-avatar-36 send-info-token-avatar ${token?.logoURI ? '' : 'send-info-token-avatar--fallback'}`}>
                {token?.symbol?.charAt(0)}
              </Avatar>
              <Flex className="send-info-amount" vertical>
                <Text className="send-info-amount-value">{displayAmount}</Text>
                <Flex align="center">
                  <Text className="ui-text-13-secondary">{'≈$'}</Text>
                  <Statistic valueStyle={{ fontSize: 13, color: 'var(--color-text-secondary)' }} precision={2} value={numericAmount} />
                </Flex>
              </Flex>
            </Flex>
          </Flex>
          <Flex vertical align="center" className="send-info-address-block" justify="space-between">
            <Flex align="center" gap={6} className="send-info-address-row ui-content-inset-16" justify="space-between">
              <Flex className="send-info-address-column" justify="space-between" vertical>
                <Text className="ui-text-xs-secondary">{t('page.send.info.from')}</Text>
                <Text className="ui-text-xs-primary">{token?.accountAddress}</Text>
                {fromAddressIsMine && <Flex className="send-info-owner-tag">{`${fromAddressIsMine.wallet?.name || ''} - `}</Flex>}
              </Flex>
              <Button type="text" size="small" shape="circle" icon={<AppIcon name="CopeIcon" onClick={() => setCopied(token?.accountAddress)} />} />
            </Flex>
            <Flex align="center" gap={6} className="send-info-address-row ui-content-inset-16" justify="space-between">
              <Flex className="send-info-address-column" justify="space-between" vertical>
                <Text className="ui-text-xs-secondary">{t('page.send.info.to')}</Text>
                <Text className="ui-text-xs-primary">{toAddress}</Text>
                {toAddressIsMine && <Flex className="send-info-owner-tag">{`${toAddressIsMine.wallet?.name || ''} - `}</Flex>}
              </Flex>
              <Button type="text" size="small" shape="circle" icon={<AppIcon name="CopeIcon" onClick={() => setCopied(toAddress)} />} />
            </Flex>
          </Flex>
          <Flex align="center" gap={6} className="send-info-gas-row ui-content-inset-16">
            <GasInfo token={token} onChangeFee={setSelectedFee} />
          </Flex>
          <Flex className="send-info-fee-row ui-content-inset-16">
            <Text className="send-info-fee-label ui-text-xs-secondary">{networkFeeLabel}</Text>
          </Flex>
        </Flex>

        <Button className="send-info-confirm-btn ui-content-inset-16" type="primary" size="large" shape="round" htmlType="button" disabled={confirmDisabled} loading={submitting} onClick={handleConfirm}>
          {t('page.send.info.confirm')}
        </Button>
      </div>
    </FullScreen>
  );
};

export default SendInfo;
