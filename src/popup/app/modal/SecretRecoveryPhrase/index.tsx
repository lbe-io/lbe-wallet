import React from 'react';
import { Button, Flex, Modal, Typography } from 'antd';
import { useTranslation } from '@/popup/hooks/useTranslation';
import type { SecretRecoveryPhraseDialogProps } from '@/popup/types/popupUi';
import './index.css';

const { Text, Title } = Typography;

export default function SecretRecoveryPhrase({ open, onClose }: SecretRecoveryPhraseDialogProps) {
  const { t } = useTranslation();

  const items = [t('page.secret.recovery.phrase.list.item1'), t('page.secret.recovery.phrase.list.item2'), t('page.secret.recovery.phrase.list.item3')];

  return (
    <Modal width={420} open={open} centered footer={null} onCancel={onClose}>
      <Flex vertical gap={20} className="secret-recovery-modal-content">
        <Title level={2} className="secret-recovery-modal-title">
          {t('page.secret.recovery.phrase.title')}
        </Title>

        <Text>{t('page.secret.recovery.phrase.description')}</Text>

        <Flex vertical gap={8}>
          <Text>{t('page.secret.recovery.phrase.list.title')}</Text>

          <ul className="secret-recovery-modal-list">
            {items.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </Flex>

        <Button block size="large" shape="round" type="primary" className="secret-recovery-modal-confirm-btn" onClick={onClose}>
          {t('page.secret.recovery.phrase.confirm')}
        </Button>
      </Flex>
    </Modal>
  );
}
