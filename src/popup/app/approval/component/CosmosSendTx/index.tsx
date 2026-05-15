import { useMemo } from 'react';
import { Button, Flex, Typography, Alert } from 'antd';
import { useApproval } from '@/app/hooks';
import { buildFallbackSendTxApprovalPreview } from '@/cosmos/tx/txPreviewAdapter';
import { decodeTxPreview, getTxSize } from '@/shared/utils/approvalPreviewShared';
import { hasCosmosSendTxApprovalPreview, type CosmosSendTxApprovalPageParams } from '@/popup/types/approvalUi';
import { useTranslation } from '@/popup/hooks/useTranslation';

const { Text } = Typography;

export default function CosmosSendTx({ params }: { params: CosmosSendTxApprovalPageParams }) {
  const { t } = useTranslation();
  const [, resolveApproval, rejectApproval] = useApproval();
  const chainId = params?.data?.chainId || '';
  const mode = params?.data?.mode || 'sync';
  const site = params?.session?.origin || params?.session?.name || '';
  const txSize = getTxSize(params?.data?.txBytes);
  const decoded = useMemo(() => decodeTxPreview(params?.data?.txBytes, params?.data?.mode), [params?.data?.mode, params?.data?.txBytes]);
  const fallbackPreview = useMemo(() => buildFallbackSendTxApprovalPreview({ txSize, mode }), [mode, txSize]);
  const hasPreview = hasCosmosSendTxApprovalPreview(params);
  const txPreview = hasPreview ? params.preview : decoded.preview || fallbackPreview;
  const previewError = (hasPreview ? params.preview.error : undefined) || decoded.error;

  return (
    <Flex className="approval-shell" vertical align="center">
      <Flex className="approval-header" align="center" justify="center">
        {t('page.approval.cosmos.send.tx.title')}
      </Flex>
      <Flex className="approval-body-scroll" vertical gap={12}>
        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.method')}</Text>
        <Text>{params?.method || 'sendTx'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.site')}</Text>
        <Text>{site || '-'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.chain')}</Text>
        <Text>{chainId || '-'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.broadcast.mode')}</Text>
        <Text>{mode}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.tx.bytes.size')}</Text>
        <Text>{txPreview.txSize}</Text>

        {(hasPreview || decoded.preview) && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.messages')}</Text>
            <Text className="approval-break-all">{txPreview.messageTypes.length ? txPreview.messageTypes.join(', ') : '-'}</Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.memo')}</Text>
            <Text className="approval-break-all">{txPreview.memo || '-'}</Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.signers.signatures')}</Text>
            <Text>
              {txPreview.signerCount} / {txPreview.signatureCount}
            </Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.fee')}</Text>
            <Text className="approval-break-all">{txPreview.feeCoins.length ? txPreview.feeCoins.join(', ') : '-'}</Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.send.tx.field.gas.limit')}</Text>
            <Text>{txPreview.gasLimit || '-'}</Text>
          </>
        )}

        {previewError && <Alert type="warning" showIcon message={previewError} />}
        <Alert type="warning" showIcon message={t('page.approval.cosmos.send.tx.warning')} />
      </Flex>
      <Flex className="approval-footer approval-footer-compact" vertical>
        <Flex gap={24}>
          <Button block size="large" shape="round" onClick={() => rejectApproval()}>
            {t('common.reject')}
          </Button>
          <Button block size="large" shape="round" type="primary" onClick={() => resolveApproval()}>
            {t('common.confirm')}
          </Button>
        </Flex>
      </Flex>
    </Flex>
  );
}
