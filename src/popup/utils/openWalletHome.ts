import type { NavigateFunction } from 'react-router-dom';
import { browser } from 'wxt/browser';

const isOnboardingContext = () => {
  return window.location.pathname.endsWith('/onboarding.html');
};

export const openWalletHome = async (navigate: NavigateFunction) => {
  if (!isOnboardingContext()) {
    navigate('/home/wallet');
    return;
  }

  try {
    if (browser.action?.openPopup) {
      await browser.action.openPopup();
      window.close();
      return;
    }
  } catch {
    // Fallback below if browser blocks programmatic popup opening.
  }

  window.location.href = browser.runtime.getURL('/popup.html#/home/wallet');
};
