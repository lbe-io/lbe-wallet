import React, { useEffect, useState } from 'react';
import { Button, Flex, Input, Modal, Typography, message } from 'antd';
import type { Account } from '@/cosmos/storage';
import { updateAccountName } from '@/cosmos/storage';
import { useWallet } from '@/app/contexts';
import { useAppDispatch } from '@/popup/hooks/redux';
import { useWalletEntitySelector } from '@/popup/hooks/useWalletEntitySelector';
import { updateAccount as updateSelectedAccount } from '@/popup/store/features/applicationSlice';
import type { RenameAccountModalProps } from '@/popup/types/popupUi';
import { useTranslation } from '@/popup/hooks/useTranslation';
import './index.css';

const { Text } = Typography;

const RenameModal: React.FC<RenameAccountModalProps> = ({ isOpen, account, maxLength = 30, onClose, onRenamed }) => {
  const { t } = useTranslation();
  const dispatch = useAppDispatch();
  const walletController = useWallet();
  const { selectedAccount } = useWalletEntitySelector();
  const [name, setName] = useState(account?.name || '');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(account?.name || '');
    }
  }, [account?.name, isOpen]);

  const trimmedName = name.trim();
  const currentName = account?.name?.trim() || '';
  const disabled = !account?.id || !trimmedName || trimmedName === currentName || loading;

  const handleConfirm = async () => {
    if (!account?.id || disabled) {
      return;
    }

    try {
      setLoading(true);
      const nextAccount = { ...account, name: trimmedName };
      await walletController.setAccountAliasName(account.id, trimmedName);
      await updateAccountName(account.id, trimmedName);
      if (selectedAccount?.id === account.id) {
        dispatch(updateSelectedAccount({ account: nextAccount }));
      }
      onRenamed?.(nextAccount);
      onClose();
    } catch (error: any) {
      message.error(error?.message || t('page.rename.fail'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal open={isOpen} title={t('page.rename.title')} onCancel={onClose} footer={null} width={360}>
      <Flex vertical gap={20} className="rename-modal-content">
        <Flex vertical gap={8}>
          <Text className="rename-modal-label ui-label-sm-primary-medium">{t('page.rename.label')}</Text>
          <Input
            className="rename-modal-input"
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder={t('page.rename.placeholder')}
            maxLength={maxLength}
            autoFocus
            onPressEnter={() => void handleConfirm()}
          />
        </Flex>

        <Button block type="primary" size="large" className="rename-modal-confirm-btn" loading={loading} disabled={disabled} onClick={() => void handleConfirm()}>
          {t('common.confirm')}
        </Button>
      </Flex>
    </Modal>
  );
};

export default RenameModal;
