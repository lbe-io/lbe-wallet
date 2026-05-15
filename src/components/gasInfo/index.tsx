import React, { useEffect, useMemo, useState } from 'react';
import { Typography, Flex, Divider, Avatar } from 'antd';
import type { JSX } from 'react';
import { AppIcon } from '@/assets/icon';
import { getChainByChainId, ChainToken } from '@/cosmos/storage';
import { getCosmosChainConfig } from '@/cosmos/chains/chain-registry';
import NetworkFee from '@/popup/app/modal/networkFee';
import { useGasInfoUiState } from '@/popup/hooks/useGasInfoUiState';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const DEFAULT_GAS_PRICE_STEP = {
  low: 0.01,
  average: 0.025,
  high: 0.03,
};

export type GasOption = {
  speed: string;
  time: string;
  gasPrice: number;
  gasLimit: number;
  gwei: string;
  usd: string;
  icon: JSX.Element;
};

const DEFAULT_GAS_LIMIT = 150000;

const GasInfo: React.FC<{ token: Record<string, any> | ChainToken | null; onChangeFee: (selectFee: GasOption) => void }> = ({ onChangeFee, token }) => {
  const { t } = useTranslation();
  const [chain, setChain] = useState<Record<string, any>>({});

  useEffect(() => {
    const fetchChain = async () => {
      if (!token?.chainId) {
        setChain({});
        return;
      }
      const chainInfo = await getChainByChainId(token.chainId);
      setChain(chainInfo[0] || {});
    };
    fetchChain();
  }, [token?.chainId]);

  const chainConfig = useMemo(() => getCosmosChainConfig(token?.chainId || ''), [token?.chainId]);

  const networkFees: GasOption[] = useMemo(() => {
    const denom = chainConfig?.coinDenom || chain?.symbol || token?.symbol || '';
    const steps = chainConfig?.gasPriceStep || DEFAULT_GAS_PRICE_STEP;
    const toDisplay = (value: number, speed: string, time: string, icon: JSX.Element): GasOption => ({
      speed,
      time,
      gasPrice: value,
      gasLimit: DEFAULT_GAS_LIMIT,
      gwei: `${value} ${denom}`,
      usd: `${t('common.base.fee')}: ${value} ${denom}`,
      icon,
    });
    return [
      toDisplay(steps.low, t('common.slow'), '60s', <AppIcon name="SlowIcon" />),
      toDisplay(steps.average, t('common.average'), '30s', <AppIcon name="AverageIcon" />),
      toDisplay(steps.high, t('common.fast'), '15s', <AppIcon name="FastIcon" />),
    ];
  }, [chainConfig, chain?.symbol, token?.symbol, t]);
  const { openNetworkFee, setOpenNetworkFee, fadeInClass, selectedFee, setSelectedFee } = useGasInfoUiState({
    networkFees,
    onChangeFee,
  });

  const activeFee = selectedFee || networkFees[0];

  return (
    <>
      {openNetworkFee && (
        <NetworkFee
          networkFees={networkFees}
          selectFee={activeFee || networkFees[0]}
          fadeInClass={fadeInClass}
          changeNetworkFee={(networkFee) => setSelectedFee(networkFee)}
          isOpen={openNetworkFee}
          onClose={() => setOpenNetworkFee(false)}
        />
      )}
      <Flex align="center" className="gas-info" gap={6} onClick={() => setOpenNetworkFee(true)}>
        <Flex className="gas-info-content" justify="space-between" vertical>
          <Flex align="center" gap={2}>
            <Avatar {...(chain?.icon && { src: chain?.icon })} size={16} className={`gas-info-avatar ${chain?.icon ? '' : 'gas-info-avatar-fallback'}`}>
              {token?.symbol?.charAt(0)}
            </Avatar>
            <Text className="gas-info-title">{`${chain?.name || t('common.network')} ${t('common.network.fee')}`}</Text>
          </Flex>
          <Flex align="center" className={fadeInClass}>
            <Text className="gas-info-value">{activeFee?.speed || '--'}</Text>
            <Divider type="vertical" className="gas-info-divider" />
            <Text className="gas-info-value">{activeFee?.gwei || '--'}</Text>
          </Flex>
          <Text className="gas-info-subtitle">{activeFee?.usd || '--'}</Text>
        </Flex>
        <AppIcon name="RightIcon" className="gas-info-arrow" />
      </Flex>
    </>
  );
};

export default GasInfo;
