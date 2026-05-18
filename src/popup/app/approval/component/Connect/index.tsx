import { useEffect, useState } from 'react';
import { useApproval } from '@/app/hooks';
import { Flex, Button, Typography, Avatar, message } from 'antd';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { useTranslation } from '@/popup/hooks/useTranslation';
import { getWalletAccountByAddress } from '@/cosmos/storage';
import { AppIcon } from '@/assets/icon';
import { getRuntimeChainInterpretationByChainId } from '@/cosmos/chains/chainRepository';
import { ensureRuntimeChainApprovalDisplayContext } from '@/cosmos/chains/runtimeChainAdapter';
import type { SuggestedRuntimeChainDisplayPropShape } from '@/cosmos/chains/suggestedChainDisplayTypes';
import { buildRequestedRuntimeChainDisplayContext, buildSuggestedRuntimeChainDisplayPropShape, buildSuggestedRuntimeChainDisplayPropShapeFromPreview } from '@/cosmos/chains/runtimeChainDisplayAdapter';
import { buildRuntimeChainApprovalAddressDisplayContext } from '@/cosmos/chains/runtimeChainAddressDisplayAdapter';
import type { ConnectApprovalPageParams } from '@/popup/types/approvalUi';
import ApprovalSelectAddress, { type ApprovalAddressCandidate } from '@/popup/app/approval/component/ApprovalSelectAddress';
import { loadSelectAddressGroups } from '@/popup/utils/sendFlowFacade';

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

  const [addressCandidates, setAddressCandidates] = useState<ApprovalAddressCandidate[]>([]);
  const [selectedCandidateId, setSelectedCandidateId] = useState('');
  const [addressPickerOpen, setAddressPickerOpen] = useState(false);
  const [chainDisplayName, setChainDisplayName] = useState('');
  const [chainDisplayTitle, setChainDisplayTitle] = useState('');
  const [addressLabel, setAddressLabel] = useState(t('page.connect.address.label'));
  const [addressTitle, setAddressTitle] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const requestedChainId = params.preview?.requestedChainId || resolveRequestedChainId(params);
  const preferredChain = requestedChainId || activeChainId || selectedChain?.chainId || selectedChain?.type || '';
  const activeCandidate = addressCandidates.find((item) => item.id === selectedCandidateId) || addressCandidates[0];

  useEffect(() => {
    setAddressTitle(activeCandidate?.addressTitle || '');
  }, [activeCandidate]);

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
      setAddressLabel(suggestedDisplayProps?.addressLabel || params.preview?.requestedAddressLabel || t('page.connect.address.label'));

      const collapses = await loadSelectAddressGroups({
        token: {
          chainId: preferredChain,
        } as any,
        selectedAccount,
        excludeSelectedAccount: false,
      });

      const allAddresses = collapses.flatMap((group) =>
        (group.accounts || []).map((address) => ({
          walletId: group.key,
          walletName: group.name || '',
          address,
        })),
      );

      const rawCandidates = await Promise.all(
        allAddresses.map(async ({ walletId, walletName, address }) => {
          const match = await getWalletAccountByAddress(address);
          const account = match?.account;
          const wallet = match?.wallet;
          if (!account?.id || !account?.wid) {
            return null;
          }
          const normalizedIndex = String(account.index ?? '');
          if (!normalizedIndex) {
            return null;
          }
          return {
            id: account.id,
            accountId: account.id,
            walletId: account.wid,
            accountIndex: normalizedIndex,
            accountName: account.name || '',
            walletName: wallet?.name || walletName || selectedWallet?.name || '',
            address,
            addressTitle: suggestedDisplayProps?.addressTitle || params.preview?.requestedAddressExplanation || params.preview?.requestedAddressTitle || '',
          } as ApprovalAddressCandidate;
        }),
      );

      const dedupedByAccountId = new Map<string, ApprovalAddressCandidate>();
      for (const candidate of rawCandidates) {
        if (!candidate) {
          continue;
        }
        if (!dedupedByAccountId.has(candidate.accountId)) {
          dedupedByAccountId.set(candidate.accountId, candidate);
        }
      }

      let nextCandidates = Array.from(dedupedByAccountId.values());
      if (selectedAccount?.id) {
        nextCandidates = [...nextCandidates.filter((item) => item.accountId === selectedAccount.id), ...nextCandidates.filter((item) => item.accountId !== selectedAccount.id)];
      }

      if (!nextCandidates.length) {
        setError(t('page.connect.address.not.found'));
        setAddressCandidates([]);
        setSelectedCandidateId('');
        return;
      }

      setAddressCandidates(nextCandidates);
      setSelectedCandidateId((previousId) => {
        if (previousId && nextCandidates.some((item) => item.id === previousId)) {
          return previousId;
        }
        return nextCandidates[0].id;
      });
    } catch (err: any) {
      setError(err?.message || t('page.connect.error.loading'));
      setAddressCandidates([]);
      setSelectedCandidateId('');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void getAddress();
  }, [activeChainId, requestedChainId, selectedAccount, selectedChain, selectedWallet]);

  const handleConfirm = () => {
    if (!activeCandidate?.address) {
      message.error(t('page.send.info.account.not.available'));
      return;
    }

    resolveApproval({
      accountId: activeCandidate.accountId,
      walletId: activeCandidate.walletId,
      accountIndex: activeCandidate.accountIndex,
      accountAddress: activeCandidate.address,
    });
  };

  const isConfirmDisabled = loading || !activeCandidate?.address || !!error;
  const connectCardStateClass = activeCandidate?.address ? 'approval-connect-card-ready' : 'approval-connect-card-disabled';

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
        <Text className="ui-text-xs-tertiary">{t('page.connect.network')}</Text>
        <Text className="approval-value approval-value-with-gap ui-label-sm-emphasis-medium" title={chainDisplayTitle}>
          {chainDisplayName || '--'}
        </Text>

        <Flex className="approval-row-full" align="center" gap={16}>
          <Flex vertical className="approval-info-col">
            <Text className="ui-text-xs-tertiary">{addressLabel}</Text>
            {loading ? (
              <Text className="ui-text-sm-tertiary">{t('page.connect.loading.address')}</Text>
            ) : error ? (
              <Text className="ui-text-sm-danger">{error}</Text>
            ) : (
              <Text className="approval-value ui-label-sm-emphasis-medium" title={addressTitle || activeCandidate?.address}>
                {activeCandidate?.address}
              </Text>
            )}

            <Flex className="approval-wallet-tag">{activeCandidate?.walletName && activeCandidate?.accountName ? `${activeCandidate.walletName} - ${activeCandidate.accountName}` : t('page.connect.no.account')}</Flex>
          </Flex>

          {addressCandidates.length > 1 ? <Button icon={<AppIcon name="RightIcon" />} size="small" type="text" shape="circle" onClick={() => setAddressPickerOpen(true)} /> : null}
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

      <ApprovalSelectAddress isOpen={addressPickerOpen} onClose={() => setAddressPickerOpen(false)} candidates={addressCandidates} selectedCandidateId={selectedCandidateId} onConfirm={(candidateId) => setSelectedCandidateId(candidateId)} />
    </Flex>
  );
}
