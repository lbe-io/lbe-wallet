import { useMemo } from 'react';
import { Alert, Button, Flex, Typography } from 'antd';
import { useApproval } from '@/app/hooks';
import { decodeArbitraryData, decodeSignPreview } from '@/shared/utils/approvalPreviewShared';
import { hasCosmosSignApprovalPreview, type CosmosSignApprovalPageParams } from '@/popup/types/approvalUi';
import { useTranslation } from '@/popup/hooks/useTranslation';

const { Text } = Typography;

export default function CosmosSign({ params }: { params: CosmosSignApprovalPageParams }) {
  const { t } = useTranslation();
  const [, resolveApproval, rejectApproval] = useApproval();
  const chainId = params?.data?.chainId || '';
  const signer = params?.data?.signer || '';
  const signDoc = params?.data?.signDoc || {};
  const arbitraryData = params?.data?.data;
  const site = params?.session?.origin || params?.session?.name || '';
  const method = params?.method || 'sign';

  const prettySignDoc = useMemo(() => JSON.stringify(signDoc, null, 2), [signDoc]);
  const decoded = useMemo(() => decodeSignPreview(method, signDoc), [method, signDoc]);
  const preview = hasCosmosSignApprovalPreview(params) ? params.preview : decoded.preview;
  const arbitrary = useMemo(() => decodeArbitraryData(arbitraryData), [arbitraryData]);
  const isArbitraryMethod = method.toLowerCase().includes('signarbitrary');
  const arbitraryPreview = preview.arbitraryData || arbitrary;
  const previewError = (hasCosmosSignApprovalPreview(params) ? params.preview.error : undefined) || decoded.error;

  return (
    <Flex className="approval-shell" vertical align="center">
      <Flex className="approval-header" align="center" justify="center">
        {t('page.approval.cosmos.sign.title')}
      </Flex>
      <Flex className="approval-body-scroll" vertical gap={12}>
        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.method')}</Text>
        <Text>{method}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.mode')}</Text>
        <Text>{preview.mode}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.site')}</Text>
        <Text>{site || '-'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.chain')}</Text>
        <Text>{chainId || '-'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.signer')}</Text>
        <Text className="approval-break-all">{signer || '-'}</Text>

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.signdoc.chain.id')}</Text>
        <Text>{preview.chainId || '-'}</Text>

        {isArbitraryMethod && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.arbitrary.length')}</Text>
            <Text>{arbitraryPreview.length}</Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.arbitrary.text')}</Text>
            <Text className="approval-break-all">{arbitraryPreview.text || '-'}</Text>

            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.arbitrary.hex')}</Text>
            <Text className="approval-break-all">{arbitraryPreview.hex || '-'}</Text>
          </>
        )}

        {preview.accountNumber !== undefined && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.account.number')}</Text>
            <Text>{preview.accountNumber || '-'}</Text>
          </>
        )}

        {preview.sequence !== undefined && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.sequence')}</Text>
            <Text>{preview.sequence || '-'}</Text>
          </>
        )}

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.messages')}</Text>
        <Text className="approval-break-all">{preview.messageTypes.length ? preview.messageTypes.join(', ') : '-'}</Text>

        {preview.memo !== undefined && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.memo')}</Text>
            <Text className="approval-break-all">{preview.memo || '-'}</Text>
          </>
        )}

        {preview.signerCount !== undefined && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.signer.count')}</Text>
            <Text>{preview.signerCount}</Text>
          </>
        )}

        <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.fee')}</Text>
        <Text className="approval-break-all">{preview.feeCoins.length ? preview.feeCoins.join(', ') : '-'}</Text>

        {preview.gasLimit !== undefined && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.gas.limit')}</Text>
            <Text>{preview.gasLimit || '-'}</Text>
          </>
        )}

        {previewError && <Alert type="warning" showIcon message={previewError} />}

        {!isArbitraryMethod && (
          <>
            <Text className="ui-text-xs-tertiary">{t('page.approval.cosmos.sign.field.signdoc')}</Text>
            <pre className="approval-json-preview">{prettySignDoc}</pre>
          </>
        )}

        <Alert type="warning" showIcon message={t('page.approval.cosmos.sign.warning')} />
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
