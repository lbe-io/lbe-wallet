import React from 'react';
import { Flex, Button, Avatar, Typography, Divider } from 'antd';
import FullScreen from '@/components/FullScreen';
import { AppIcon } from '@/assets/icon';
import { Chain, Address } from '@/cosmos/storage';
import { QRCodeSVG } from 'qrcode.react';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import { useReceiveQrcodeViewModel } from '@/popup/hooks/useWalletAddressModalViewModel';
import type { ReceiveQrcodeModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const ReceiveQrcode: React.FC<ReceiveQrcodeModalProps> = ({ isOpen, onClose, crypto, network }) => {
  const { t } = useTranslation();
  const [, setCopied] = useCopyClipboard();
  const { address, resolvedChainId } = useReceiveQrcodeViewModel({ isOpen, crypto, network });

  return (
    <FullScreen title="" styleHeader={{ backgroundColor: 'var(--color-bg-panel)' }} leftBtn={<Button type="text" size="small" shape="circle" icon={<AppIcon name="LeftIcon" />} onClick={() => onClose()} />} isOpen={isOpen} onClose={() => onClose()}>
      <div className="receive-qrcode-body">
        <Flex vertical justify="space-between" className="receive-qrcode-body-layout">
          <Flex vertical align="center" justify="space-between" className="receive-qrcode-panel">
            <Flex vertical justify="space-between" className="receive-qrcode-header">
              <Flex align="flex-end" justify="space-between" gap={20}>
                <Flex align="center">
                  <Avatar size={36} className="receive-qrcode-chain-avatar">
                    {resolvedChainId?.[0]?.toUpperCase()}
                  </Avatar>
                  <Flex className="receive-qrcode-chain-meta" vertical>
                    <Flex align="center" gap={8}>
                      <Text className="receive-qrcode-chain-title">{resolvedChainId}</Text>
                    </Flex>
                    <Text className="receive-qrcode-address">{address}</Text>
                  </Flex>
                </Flex>
                <Button type="text" shape="circle" onClick={() => address && setCopied(address)} icon={<AppIcon name="CopeIcon" />} />
              </Flex>
              <Divider className="receive-qrcode-divider" dashed />
              <Text className="receive-qrcode-warning">{t('page.receive.warning', { chain: resolvedChainId || t('page.receive.selected.chain') })}</Text>
            </Flex>
            <Flex className="receive-qrcode-canvas-wrap" align="center" justify="center">
              <QRCodeSVG value={address || ' '} bgColor="#F9F9F9" height="100%" width="100%" />
            </Flex>
          </Flex>

          <Button size="large" shape="round" color="default" variant="filled">
            {t('page.receive.view.on.explorer')}
          </Button>
        </Flex>
      </div>
    </FullScreen>
  );
};

export default ReceiveQrcode;
