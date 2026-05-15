import copy from 'copy-to-clipboard';
import { useCallback, useEffect, useState } from 'react';
import { message } from 'antd';
import { useTranslation } from '@/popup/hooks/useTranslation';

export default function useCopyClipboard(timeout = 500): [boolean, (toCopy: string) => void] {
  const { t } = useTranslation();
  const [isCopied, setIsCopied] = useState(false);

  const staticCopy = useCallback(
    (text: string) => {
      const didCopy = copy(text);
      setIsCopied(didCopy);
      message.success(t('common.copy.success'));
    },
    [t],
  );

  useEffect(() => {
    if (isCopied) {
      const hide = setTimeout(() => {
        setIsCopied(false);
      }, timeout);

      return () => {
        clearTimeout(hide);
      };
    }
    return undefined;
  }, [isCopied, setIsCopied, timeout]);

  return [isCopied, staticCopy];
}
