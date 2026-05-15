import { useEffect, useState } from 'react';
import { useApproval } from '@/app/hooks';
import { Flex, Button, Typography, Avatar, message } from 'antd';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { getAccountById, getAccountsByWalletId, getAddressByChainId, getAddressesByWidId, getAddressesByWidIdType, getAllWallets, getWalletById } from '@/cosmos/storage';
import { AppIcon } from '@/assets/icon';
import { getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { ensureRuntimeChainApprovalDisplayContext, hasRuntimeChainCapability } from '@/cosmos/chains/runtimeChainAdapter';
import type { SuggestedRuntimeChainDisplayPropShape } from '@/cosmos/chains/suggestedChainDisplayTypes';
import {
  buildRequestedRuntimeChainDisplayContext,
  buildSuggestedRuntimeChainDisplayPropShape,
  buildSuggestedRuntimeChainDisplayPropShapeFromPreview,
  resolveRuntimeChainAddressDisplayContext,
} from '@/cosmos/chains/runtimeChainDisplayAdapter';
import { buildRuntimeChainApprovalAddressDisplayContext } from '@/cosmos/chains/runtimeChainAddressDisplayAdapter';
import type { ConnectApprovalPageParams } from '@/popup/types/approvalUi';

const { Text } = Typography;

const resolveRequestedChainId = (params?: ConnectApprovalPageParams) => {
  const requested = (params?.requestedChainId || '').trim();
  if (requested) {
    return requested;
  }

  const chainId = (params?.data?.chainId || '').trim();
  if (chainId) {
    return chainId;
  }

  const chainIds = params?.data?.chainIds;
  if (typeof chainIds === 'string') {
    return chainIds.trim();
  }
  if (Array.isArray(chainIds)) {
    const first = chainIds.find((item) => typeof item === 'string' && item.trim());
    return (first || '').trim();
  }

  return '';
};

export default function Connect({ params }: { params: ConnectApprovalPageParams }) {
  const { t } = useTranslation();
  const session = params.preview?.session || params.session;
  const { selectedAccount, selectedWallet, selectedChain, activeChainId } = useWalletEntitySelector();
  const [, resolveApproval, rejectApproval] = useApproval();

  const [address, setAddress] = useState('');
  const [accountId, setAccountId] = useState('');
  const [walletId, setWalletId] = useState('');
  const [accountIndex, setAccountIndex] = useState<number | string | undefined>(undefined);
  const [chainDisplayName, setChainDisplayName] = useState('');
  const [chainDisplayTitle, setChainDisplayTitle] = useState('');
  const [addressLabel, setAddressLabel] = useState(t('page.connect.address.label'));
  const [addressTitle, setAddressTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const requestedChainId = params.preview?.requestedChainId || resolveRequestedChainId(params);
  const preferredChain = requestedChainId || activeChainId || selectedChain?.chainId || selectedChain?.type || '';

  const getAddress = async () => {
    try {
      setLoading(true);
      setError('');
      const runtimeChain = preferredChain ? await getRuntimeChainInterpretationByChainId(preferredChain) : undefined;
      const displayChain = runtimeChain
        ? buildRequestedRuntimeChainDisplayContext(ensureRuntimeChainApprovalDisplayContext(runtimeChain, 'connect approval display'))
        : buildRequestedRuntimeChainDisplayContext({
            chainId: preferredChain,
            chainName: params.preview?.requestedChainName || preferredChain,
          });
      const suggestedAddressDisplay =
        runtimeChain?.source === 'suggested'
          ? buildRuntimeChainApprovalAddressDisplayContext({
              source: 'suggested',
              chainName: displayChain.chainName,
              addressContext: runtimeChain.addressContext,
              addressDerivationSupported: !!runtimeChain.addressContext,
            })
          : null;
      const suggestedDisplayProps: SuggestedRuntimeChainDisplayPropShape | null =
        runtimeChain?.source === 'suggested'
          ? buildSuggestedRuntimeChainDisplayPropShape({
              chainName: displayChain.chainName,
              nativeAssetDisplay: displayChain.nativeAssetDisplay,
              addressDisplay: suggestedAddressDisplay,
              defaultChainTitle: params.preview?.requestedNativeAssetExplanation || params.preview?.requestedChainTitle || displayChain.chainTitle,
              defaultAddressTitle: params.preview?.requestedAddressExplanation || params.preview?.requestedAddressTitle || '',
              surface: 'connect',
            })
          : buildSuggestedRuntimeChainDisplayPropShapeFromPreview(params.preview);
      setChainDisplayName(displayChain.chainLabel);
      setChainDisplayTitle(suggestedDisplayProps?.chainTitle || displayChain.nativeAssetDisplay?.previewExplanation || params.preview?.requestedNativeAssetExplanation || params.preview?.requestedChainTitle || displayChain.chainTitle);

      let accountWid = selectedAccount?.wid;
      let nextAccountIndex = selectedAccount?.index;
      let resolvedAccountId = selectedAccount?.id || '';
      let resolvedWalletId = accountWid || '';
      if (!accountWid || nextAccountIndex === undefined) {
        const wallets = await getAllWallets();
        const wallet = selectedWallet?.id ? (await getWalletById(selectedWallet.id))[0] || wallets[0] : wallets[0];
        if (!wallet) {
          setError(t('page.connect.wallet.not.found'));
          setAddress('');
          return;
        }
        const accounts = await getAccountsByWalletId(wallet.id);
        const account = selectedAccount?.id ? (await getAccountById(selectedAccount.id))[0] || accounts[0] : accounts[0];
        if (!account) {
          setError(t('page.connect.account.not.found'));
          setAddress('');
          return;
        }
        accountWid = account.wid;
        nextAccountIndex = account.index;
        resolvedAccountId = account.id;
        resolvedWalletId = wallet.id;
      }

      let directAddress = '';
      let typedFallbackAddress = '';
      if (preferredChain && hasRuntimeChainCapability(runtimeChain, 'addressDerivation')) {
        const direct = await getAddressByChainId(accountWid, nextAccountIndex, preferredChain);
        if (direct?.address) {
          directAddress = direct.address;
        } else {
          const typedAddresses = await getAddressesByWidIdType(accountWid, nextAccountIndex, preferredChain);
          typedFallbackAddress = typedAddresses[0]?.address || '';
        }
      } else if (preferredChain) {
        const typedAddresses = await getAddressesByWidIdType(accountWid, nextAccountIndex, preferredChain);
        typedFallbackAddress = typedAddresses[0]?.address || '';
      }

      const walletFallbackAddress = (await getAddressesByWidId(accountWid, nextAccountIndex))[0]?.address || '';
      const addressDisplay = resolveRuntimeChainAddressDisplayContext({
        interpretation: runtimeChain || null,
        derivedAddress: directAddress,
        typedFallbackAddress,
        walletFallbackAddress,
      });
      const candidate = addressDisplay.address;
      setAddressLabel(suggestedDisplayProps?.addressLabel || addressDisplay.label || params.preview?.requestedAddressLabel || t('page.connect.address.label'));
      setAddressTitle(suggestedDisplayProps?.addressTitle || addressDisplay.title || params.preview?.requestedAddressExplanation || params.preview?.requestedAddressTitle || '');

      if (!candidate) {
        setError(t('page.connect.address.not.found'));
        setAccountId('');
        setWalletId('');
        setAccountIndex(undefined);
        setAddress('');
        return;
      }

      setAccountId(resolvedAccountId);
      setWalletId(resolvedWalletId);
      setAccountIndex(nextAccountIndex);
      setAddress(candidate);
    } catch (err: any) {
      setError(err?.message || t('page.connect.error.loading'));
      setAccountId('');
      setWalletId('');
      setAccountIndex(undefined);
      setAddress('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getAddress();
  }, [activeChainId, requestedChainId, selectedAccount, selectedChain]);

  const handleConfirm = () => {
    if (!address) {
      message.error(t('page.send.info.account.not.available'));
      return;
    }
    resolveApproval({
      accountId,
      walletId,
      accountIndex,
      accountAddress: address,
    });
  };

  const isConfirmDisabled = loading || !address || !!error;
  const connectCardStateClass = address ? 'approval-connect-card-ready' : 'approval-connect-card-disabled';

  return (
    <Flex className="approval-shell" vertical align="stretch">
      <Flex className="approval-header" align="center" justify="center">
        {t('page.connect.title')}
      </Flex>
      <Flex className="approval-source-card" vertical justify="center">
        <Text className="ui-text-xs-tertiary">{t('page.connect.request.from')}</Text>
        <Flex className="approval-row-full" gap={12} align="center">
          <Avatar {...(session?.icon && { src: session?.icon })} size={32} className={`approval-avatar-sm ${session?.icon ? '' : 'approval-avatar-fallback'}`}>
            {session?.name?.[0]}
          </Avatar>
          <Flex vertical>
            <Text className="approval-session-name ui-label-sm-emphasis-medium">{session?.name}</Text>
            <Text className="approval-session-origin ui-text-xs-tertiary">{session?.origin}</Text>
          </Flex>
        </Flex>
      </Flex>

      <Flex className={`approval-connect-card ${connectCardStateClass}`} vertical justify="flex-start">
        <Flex className="approval-row-full" justify="space-between" align="center">
          <Flex vertical className="approval-info-col">
            <Text className="ui-text-xs-tertiary">{t('page.connect.network')}</Text>
            <Text className="approval-value approval-value-with-gap ui-label-sm-emphasis-medium" title={chainDisplayTitle}>
              {chainDisplayName || '--'}
            </Text>
            <Text className="ui-text-xs-tertiary">{addressLabel}</Text>
            {loading ? (
              <Text className="ui-text-sm-tertiary">{t('page.connect.loading.address')}</Text>
            ) : error ? (
              <Text className="ui-text-sm-danger">{error}</Text>
            ) : (
              <Text className="approval-value ui-label-sm-emphasis-medium" title={addressTitle || address}>
                {address}
              </Text>
            )}
            <Flex className="approval-wallet-tag">{selectedWallet?.name && selectedAccount?.name ? `${selectedWallet.name} - ${selectedAccount.name}` : t('page.connect.no.account')}</Flex>
          </Flex>
          {address && <AppIcon name="RightIcon" className="approval-right-icon" />}
        </Flex>
      </Flex>

      <Flex className="approval-footer" vertical>
        <Flex className="approval-warning-row" gap={10}>
          <AppIcon name="TooltipIcon" />
          <Text className="ui-text-xs-tertiary">{t('page.connect.allow')}</Text>
        </Flex>
        <Flex gap={24}>
          <Button block size="large" shape="round" onClick={() => rejectApproval()}>
            {t('page.connect.reject')}
          </Button>
          <Button block size="large" shape="round" type="primary" onClick={handleConfirm} disabled={isConfirmDisabled} loading={loading}>
            {t('page.connect.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
