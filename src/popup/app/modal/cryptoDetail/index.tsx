import React from 'react';
import { Flex, Button, Typography, Avatar, ConfigProvider, Tabs, Statistic } from 'antd';
import dayjs from 'dayjs';
import FullScreen from '@/components/FullScreen';
import useCopyClipboard from '@/popup/hooks/useCopyClipboard';
import { Chain } from '@/cosmos/storage';
import { AppIcon } from '@/assets/icon';
import { formatAmount, formatTokenAmount } from '@/shared/common';
import SelectAddress from '@/popup/app/modal/selectAddress';
import ReceiveQrcode from '@/popup/app/modal/receiveQrcode';
import Empty from '@/components/Empty';
import { formatCryptoDetailChangePercent, formatCryptoDetailUsdPrice, useCryptoDetailViewModel } from '@/popup/hooks/useCryptoDetailViewModel';
import type { CryptoDetailModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { themePrimarySurface } from '@/styles/antdThemeTokens';
import './index.css';

const { Text } = Typography;

const CryptoDetail: React.FC<CryptoDetailModalProps> = ({ isOpen, onClose, selectedCrypto }) => {
  const { t } = useTranslation();
  const [, setCopied] = useCopyClipboard();
  const {
    currentToken,
    tokenTx,
    tabs,
    tab,
    setTab,
    openSelectAddress,
    setOpenSelectAddress,
    openReceiveQrcode,
    setOpenReceiveQrcode,
    currentAddress,
    currentPriceUsd,
    liveAmount,
    liveBalanceUsd,
    priceChangePercent24h,
    openSend,
    openReceive,
  } = useCryptoDetailViewModel(isOpen, selectedCrypto);

  const priceTrendClass = priceChangePercent24h === null ? 'crypto-detail-price-change-neutral' : priceChangePercent24h >= 0 ? 'crypto-detail-price-change-positive' : 'crypto-detail-price-change-negative';

  return (
    <FullScreen
      title={
        <Flex align="center">
          <Avatar {...(selectedCrypto?.logoURI && { src: selectedCrypto.logoURI })} size={24} className={`crypto-detail-title-avatar ${selectedCrypto?.logoURI ? '' : 'crypto-detail-title-avatar-fallback'}`}>
            {selectedCrypto?.symbol?.charAt(0)}
          </Avatar>
          <Text className="crypto-detail-title-symbol">{selectedCrypto?.symbol || ''}</Text>
        </Flex>
      }
      isOpen={isOpen}
      onClose={onClose}
    >
      {openSelectAddress && currentToken && <SelectAddress token={currentToken} isOpen={openSelectAddress} onClose={() => setOpenSelectAddress(false)} />}
      {openReceiveQrcode && currentToken && <ReceiveQrcode network={(currentToken?.chainInfo || null) as Chain | null} isOpen={openReceiveQrcode} onClose={() => setOpenReceiveQrcode(false)} />}

      <Flex vertical className="crypto-detail">
        {selectedCrypto?.groupValue ? <Tabs activeKey={String(tab)} onTabClick={(key) => setTab(Number(key))} className="crypto-detail-tabs" tabBarGutter={0} indicator={{ size: 0 }} items={tabs} /> : null}

        <Flex vertical className={`crypto-detail-content ${selectedCrypto?.groupValue ? 'crypto-detail-content-with-tabs' : 'crypto-detail-content-no-tabs'}`}>
          <ConfigProvider theme={themePrimarySurface}>
            <Flex vertical className="crypto-detail-balance-panel" gap={8} justify="center" align="center">
              <Flex align="center" gap={12}>
                <Statistic valueStyle={{ fontSize: 32, color: '#010101', fontWeight: 700 }} value={liveAmount} formatter={(val) => formatTokenAmount(typeof val === 'number' ? val : Number(val))} />
              </Flex>
              <Flex align="center" className="crypto-detail-usd-row" gap={4}>
                <Flex align="center" gap={5}>
                  <span className="crypto-detail-usd-prefix ui-text-13-secondary">{'≈$'}</span>
                  <Statistic valueStyle={{ fontSize: 13, color: 'var(--color-text-secondary)' }} className="crypto-detail-usd-amount" precision={2} value={liveBalanceUsd} />
                </Flex>
              </Flex>
            </Flex>

            <Flex justify="space-between" wrap="wrap">
              <Flex vertical align="center" gap={8}>
                <Button type="primary" className="crypto-detail-action-btn" shape="circle" icon={<AppIcon name="TransferIcon" />} disabled={!currentToken} onClick={openSend} />
                <div>{t('common.send')}</div>
              </Flex>
              <Flex vertical align="center" gap={8}>
                <Button type="primary" className="crypto-detail-action-btn" shape="circle" icon={<AppIcon name="ReceiveIcon" />} disabled={!currentToken} onClick={openReceive} />
                <div>{t('common.receive')}</div>
              </Flex>
              <Flex vertical align="center" gap={8}>
                <Button type="primary" className="crypto-detail-action-btn" shape="circle" icon={<AppIcon name="TradeIcon" />} />
                <div>{t('page.wallet.asset.swap')}</div>
              </Flex>
              <Flex vertical align="center" gap={8}>
                <Button type="primary" className="crypto-detail-action-btn" shape="circle" icon={<AppIcon name="TradeaIcon" />} />
                <div>{t('page.wallet.asset.bridge')}</div>
              </Flex>
            </Flex>

            <Flex vertical justify="space-between" className="crypto-detail-address-card">
              <Text className="crypto-detail-address-label">
                {t('page.wallet.asset.my.address', {
                  chain: currentToken?.chainName || '',
                })}
              </Text>
              <Flex align="center" gap={10}>
                <Text className="crypto-detail-address-value ui-text-13-primary">{currentAddress || currentToken?.accountAddress || ''}</Text>
                <Button icon={<AppIcon name="CopeSedIcon" />} size="small" type="text" shape="circle" onClick={() => setCopied(currentAddress || currentToken?.accountAddress)} />
              </Flex>
            </Flex>

            <Flex vertical className="crypto-detail-history-block" justify="space-between">
              <Text className="crypto-detail-history-title">{t('common.transaction.history')}</Text>
              {tokenTx.length > 0 ? (
                tokenTx.map((item, index) => (
                  <React.Fragment key={`${item.time || index}_${item.hash || ''}`}>
                    <Text className="crypto-detail-history-date ui-text-13-secondary">{dayjs(Number(item.time) < 1e12 ? Number(item.time) * 1000 : Number(item.time)).format('YYYY-MM-DD')}</Text>
                    <Flex justify="space-between" align="center" gap={8}>
                      <Flex gap={16} align="center">
                        <Flex align="center" justify="center" className="crypto-detail-history-icon-wrap">
                          {item.type === '3' ? <AppIcon name="TransferIcon" /> : <AppIcon name="ReceiveIcon" />}
                        </Flex>
                        <Flex vertical>
                          <Text className="crypto-detail-history-type">{item.type === '3' ? t('page.wallet.asset.tx.sent') : t('page.wallet.asset.tx.received')}</Text>
                          <Text className="crypto-detail-history-counterparty ui-text-13-secondary">{item.type === '3' ? t('page.wallet.asset.tx.to', { address: item.to }) : t('page.wallet.asset.tx.from', { address: item.from })}</Text>
                        </Flex>
                      </Flex>
                      <Text className="crypto-detail-history-amount">{formatAmount(item.famt, item.fdecimals, 2)}</Text>
                    </Flex>
                  </React.Fragment>
                ))
              ) : (
                <Empty />
              )}
            </Flex>
          </ConfigProvider>
        </Flex>

        <div className="crypto-detail-footer-spacer" />
        <Flex justify="space-between" align="center" className="crypto-detail-footer ui-content-inset-16">
          <Text className="crypto-detail-footer-label">{t('page.wallet.asset.current.price')}</Text>
          <Flex align="center" gap={8}>
            <Text className="crypto-detail-footer-price">${formatCryptoDetailUsdPrice(currentPriceUsd)}</Text>
            <Text className={`crypto-detail-footer-change ${priceTrendClass}`}>{formatCryptoDetailChangePercent(priceChangePercent24h)}</Text>
          </Flex>
        </Flex>
      </Flex>
    </FullScreen>
  );
};

export default CryptoDetail;
