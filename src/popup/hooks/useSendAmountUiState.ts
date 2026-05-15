import { useEffect, useMemo, useRef, useState } from 'react';
import type { RefObject } from 'react';
import type { ChainToken } from '@/cosmos/storage';
import type { SendAmountUiStateResult } from '@/popup/types/popupUi';
import { resolveSendAmountInputState, resolveSendTokenDecimals } from '@/popup/utils/sendFlowFacade';

const calculateTextWidth = (text: string, fontSizeValue: string, fontWeight: string, fontFamily: string = 'Arial'): number => {
  const div = document.createElement('div');
  div.style.position = 'absolute';
  div.style.visibility = 'hidden';
  div.style.fontSize = fontSizeValue;
  div.style.fontWeight = fontWeight;
  div.style.fontFamily = fontFamily;
  div.textContent = text;

  document.body.appendChild(div);
  const width = div.offsetWidth;
  document.body.removeChild(div);

  return width + 25;
};

export const useSendAmountUiState = ({ token, isNextStepOpen }: { token: ChainToken | null; isNextStepOpen: boolean }): SendAmountUiStateResult => {
  const [searchValue, setSearchValue] = useState('');
  const [amount, setAmount] = useState('0');
  const inputRef = useRef<any>(null) as RefObject<any>;
  const [fontSize, setFontSize] = useState(56);
  const [textWidth, setTextWidth] = useState(56);
  const [openDrawer, setOpenDrawer] = useState(false);
  const tokenDecimals = useMemo(() => resolveSendTokenDecimals(token), [token]);

  useEffect(() => {
    if (!inputRef.current) return;
    inputRef.current.focus();
  }, []);

  useEffect(() => {
    const handleClick = () => {
      if (isNextStepOpen) return;
      const inputElement = inputRef.current?.input;
      if (inputElement && document.activeElement !== inputElement) {
        inputElement.focus();
      }
    };

    window.addEventListener('click', handleClick);

    return () => {
      window.removeEventListener('click', handleClick);
    };
  }, [inputRef, isNextStepOpen]);

  useEffect(() => {
    const textWidthValue: number = calculateTextWidth(amount || '0', `${fontSize}px`, '700');
    setTextWidth(textWidthValue);
  }, [fontSize, amount]);

  const handleChange = (e: { target: { value: unknown } }) => {
    const nextState = resolveSendAmountInputState({
      rawValue: String(e.target.value ?? ''),
      tokenDecimals,
    });
    if (nextState) {
      setAmount(nextState.amount);
      setFontSize(nextState.fontSize);
    }
  };

  const handleMax = () => {
    const nextState = resolveSendAmountInputState({
      rawValue: String(token?.amount ?? '0'),
      tokenDecimals,
    });
    if (nextState) {
      setAmount(nextState.amount);
      setFontSize(nextState.fontSize);
    }
  };

  return {
    inputRef,
    searchValue,
    setSearchValue,
    amount,
    fontSize,
    textWidth,
    openDrawer,
    setOpenDrawer,
    handleChange,
    handleMax,
  };
};
