import React, { useState, useEffect } from 'react';
import { Avatar, Flex, Typography } from 'antd';
import allIcon from '@/assets/all.png';
import FullScreen from '@/components/FullScreen';
import { Spining } from '@/components/Loading';
import NetworkDrawer from '@/components/NetworkDrawer';
import Empty from '@/components/Empty';
import Item from '@/components/Item';
import { AppIcon } from '@/assets/icon';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import dayjs from 'dayjs';
import { getAddressByChainId, getAddressesByWidId } from '@/cosmos/storage';
import { useWallet } from '@/app/contexts';
import { formatAmount, shortenAddress } from '@/shared/common';
import type { PopupRecordChainInfo, PopupRecordHistoryGroup, RecordModalProps } from '@/popup/types/popupUi';
import type { CosmosTxHistoryItem } from '@/entrypoints/background/service/keyring/types';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;
const TX_HISTORY_REQUEST_TIMEOUT_MS = 12000;

const Record: React.FC<RecordModalProps> = ({ isOpen, onClose }) => {
  const { t, language } = useTranslation();
  const { selectedAccount, selectedChain } = useWalletEntitySelector();
  const walletController = useWallet();
  const [openNetwork, setOpenNetwork] = useState(false);
  const [txs, setTxs] = useState<PopupRecordHistoryGroup[]>([]);
  const [loading, setLoading] = useState(true);
  const [chainInfo, setChainInfo] = useState<PopupRecordChainInfo>({ chainId: '', name: '', icon: '' });

  const groupByTime = (data: CosmosTxHistoryItem[]): PopupRecordHistoryGroup[] => {
    return data.reduce<PopupRecordHistoryGroup[]>((acc, item) => {
      const exists = acc.find((group) => dayjs(Number(group.time) * 1000).isSame(dayjs(Number(item.time) * 1000), 'day'));
      const txItem = { ...item, formatTime: dayjs(Number(item.time) * 1000).format('MM/DD/YYYY') };
      if (exists) {
        exists.tx.push(txItem);
      } else {
        acc.push({
          time: item.time,
          formatTime: txItem.formatTime,
          tx: [txItem],
        });
      }
      return acc;
    }, []);
  };

  const withRequestTimeout = async <T,>(promise: Promise<T>, timeoutMs = TX_HISTORY_REQUEST_TIMEOUT_MS): Promise<T> => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    try {
      return await Promise.race([
        promise,
        new Promise<T>((_resolve, reject) => {
          timer = setTimeout(() => reject(new Error('tx history request timeout')), timeoutMs);
        }),
      ]);
    } finally {
      if (timer) {
        clearTimeout(timer);
      }
    }
  };

  const fetchAllData = async (chainId: string) => {
    setLoading(true);
    try {
      if (chainId === '-1') {
        const addresses = await getAddressesByWidId(selectedAccount.wid, selectedAccount.index);
        const historyGroups = await Promise.all(addresses.filter((item) => !!item?.chainId && !!item?.address).map((item) => withRequestTimeout(walletController.getCosmosTxHistory(item.chainId, item.address, 20)).catch(() => [])));
        const merged = historyGroups.flat().sort((a, b) => Number(b.time || 0) - Number(a.time || 0));
        setTxs(groupByTime(merged));
      } else {
        const resolvedAddress = await getAddressByChainId(selectedAccount.wid, selectedAccount.index, chainId);
        const accountAddress = resolvedAddress?.address || '';
        if (!accountAddress) {
          setTxs([]);
          return;
        }
        const history = await withRequestTimeout(walletController.getCosmosTxHistory(chainId, accountAddress, 50)).catch(() => []);
        setTxs(groupByTime(history || []));
      }
    } catch (error) {
      console.error('[Record] failed to load tx history', error);
      setTxs([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const chain: PopupRecordChainInfo =
      selectedChain.name === 'all'
        ? { name: t('page.record.all.networks'), chainId: '-1', icon: allIcon }
        : {
            name: selectedChain.name,
            chainId: selectedChain.chainId || '',
            icon: selectedChain.icon,
          };
    setChainInfo(chain);
    fetchAllData(selectedChain.name === 'all' ? '-1' : selectedChain.chainId || '');
  }, [selectedChain.name, selectedChain.chainId, selectedChain.icon, language]);

  return (
    <FullScreen title={t('page.record.title')} isOpen={isOpen} onClose={onClose}>
      <NetworkDrawer
        chainInfo={chainInfo}
        onClose={() => setOpenNetwork(false)}
        open={openNetwork}
        onClickItem={(chain) => {
          fetchAllData(chain.chainId);
          setChainInfo({
            chainId: chain.chainId,
            name: chain.name,
            icon: chain.icon,
          });
          setOpenNetwork(false);
        }}
      />
      <Flex align="center" justify="space-between" className="record-filter-bar">
        <Flex gap={8}>
          <Flex gap={8} className="record-network-trigger" onClick={() => setOpenNetwork(true)}>
            <Avatar {...(chainInfo?.icon && { src: chainInfo?.icon })} size={16} className={`record-chain-avatar${chainInfo?.icon ? ' record-chain-avatar-with-icon' : ''}`}>
              {chainInfo?.name?.charAt(0)}
            </Avatar>
            <span>{chainInfo?.name}</span>
            <AppIcon name="CareDownIcon" />
          </Flex>
        </Flex>
      </Flex>
      {loading ? (
        <Spining loading={loading} />
      ) : txs.length > 0 ? (
        <Flex vertical className="record-list">
          {txs.map((item) => (
            <React.Fragment key={`${item.time}`}>
              <Text className="record-group-title">{item.formatTime}</Text>
              {item.tx.map((crypto, index: number) => (
                <Item
                  key={`${crypto.hash || crypto.time || index}`}
                  type="record"
                  icon={crypto.ficon}
                  isSend={crypto.type === '3'}
                  recordValue={`${formatAmount(crypto.famt || '0', crypto.fdecimals, 6)} ${crypto.fname}`}
                  fname={crypto.fname}
                  onClick={() => window.open(crypto.link)}
                  name={crypto.type === '3' ? t('common.send') : t('common.receive')}
                  describe={`${crypto.type === '3' ? t('common.to') : t('common.from')} ${crypto.type === '3' ? shortenAddress(crypto.to, 4) : shortenAddress(crypto.from, 4)}`}
                />
              ))}
            </React.Fragment>
          ))}
        </Flex>
      ) : (
        <Empty />
      )}
    </FullScreen>
  );
};

export default Record;
