import { useEffect } from 'react';
import { useApproval } from '@/app/hooks';
import { useWallet } from '@/app/contexts';
import { getUiType } from '@/app/runtime';
import { useNavigate, useLocation } from 'react-router-dom';
import { useIdleTimer } from 'react-idle-timer';
import { EVENTS } from '@/shared/constants';
import eventBus from '@/shared/events';
import { useMount } from 'react-use';
import { useMemoizedFn } from 'ahooks';
import { browser } from 'wxt/browser';
const isInNotification = window.location.search.includes('create=true');
const useAutoLock = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const wallet = useWallet();

  useMount(() => {
    wallet.setLastActiveTime();
  });

  useIdleTimer({
    onAction() {
      wallet.setLastActiveTime();
    },
    throttle: 1000,
  });

  const listener = useMemoizedFn(() => {
    if (location.pathname !== '/password') {
      navigate('/password');
    }
  });

  useEffect(() => {
    eventBus.addEventListener(EVENTS.LOCK_WALLET, listener);
    return () => {
      eventBus.removeEventListener(EVENTS.LOCK_WALLET, listener);
    };
  }, [listener]);
};

export default function Boost() {
  useAutoLock();
  const navigate = useNavigate();
  const wallet = useWallet();

  const [getApproval, , rejectApproval] = useApproval();
  const loadView = async () => {
    const UIType = getUiType();
    const isBooted = await wallet.isBooted();
    const hasVault = await wallet.hasVault();
    const isUnlocked = await wallet.isUnlocked();
    let approval = await getApproval();
    if (isInNotification && !approval) {
      window.close();
      return;
    }

    if (!isBooted || !hasVault) {
      const onboardingUrl = browser.runtime.getURL('/onboarding.html' as any);
      await browser.tabs.create({ url: onboardingUrl });
      window.close();
      return;
    }

    if (!isUnlocked) {
      navigate('/password');
      return;
    }

    if (!isInNotification) {
      await rejectApproval();
      approval = null;
    }

    if (approval) {
      navigate('/approval');
    } else {
      navigate('/home/wallet');
      return;
    }
  };

  const init = async () => {
    loadView();
  };

  useEffect(() => {
    init();
  }, []);

  return <div></div>;
}
