import { useMemo } from 'react';
import { Flex, Typography, Collapse } from 'antd';
import type { CollapseProps } from 'antd';
import FullScreen from '@/components/FullScreen';
import Item from '@/components/Item';
import { useTranslation } from '@/popup/hooks/useTranslation';
import '../../../modal/selectAddress/index.css';
import './index.css';

const { Text } = Typography;

export type ApprovalAddressCandidate = {
  id: string;
  accountId: string;
  walletId: string;
  accountIndex: number | string | undefined;
  accountName: string;
  walletName: string;
  address: string;
  addressTitle?: string;
};

type ApprovalSelectAddressProps = {
  isOpen: boolean;
  onClose: () => void;
  candidates: ApprovalAddressCandidate[];
  selectedCandidateId: string;
  onConfirm: (candidateId: string) => void;
};

const ApprovalSelectAddress = ({ isOpen, onClose, candidates, selectedCandidateId, onConfirm }: ApprovalSelectAddressProps) => {
  const { t } = useTranslation();

  const groupedCandidates = useMemo(() => {
    const groups = new Map<string, { key: string; title: string; candidates: ApprovalAddressCandidate[] }>();
    candidates.forEach((candidate) => {
      const groupKey = candidate.walletId || candidate.walletName || 'default';
      if (!groups.has(groupKey)) {
        groups.set(groupKey, {
          key: groupKey,
          title: candidate.walletName || t('page.connect.no.account'),
          candidates: [],
        });
      }
      groups.get(groupKey)!.candidates.push(candidate);
    });
    return Array.from(groups.values());
  }, [candidates, t]);

  const items: CollapseProps['items'] = useMemo(
    () =>
      groupedCandidates.map((group) => ({
        key: group.key,
        label: <Text className="approval-select-address-group-title">{group.title}</Text>,
        children: (
          <Flex vertical className="approval-select-address-item-list">
            {group.candidates.map((candidate) => {
              const isSelected = selectedCandidateId === candidate.id;
              return (
                <Item
                  key={candidate.id}
                  type="selectAddress"
                  selected={isSelected}
                  name={candidate.address}
                  onClick={() => {
                    onConfirm(candidate.id);
                    onClose();
                  }}
                />
              );
            })}
          </Flex>
        ),
      })),
    [groupedCandidates, onClose, onConfirm, selectedCandidateId],
  );

  return (
    <FullScreen title={t('page.connect.select.accounts.title')} isOpen={isOpen} onClose={onClose}>
      <div className="ui-modal-shell approval-select-address-shell">
        <Flex className="approval-select-address-collapse-scroll" vertical>
          <Collapse className="approval-select-address-collapse" bordered={false} activeKey={groupedCandidates.map((group) => group.key)} expandIconPosition="end" items={items} />
        </Flex>
      </div>
    </FullScreen>
  );
};

export default ApprovalSelectAddress;
