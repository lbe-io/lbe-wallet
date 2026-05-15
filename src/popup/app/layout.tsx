import { Suspense, useEffect, type CSSProperties } from 'react';
import { Outlet } from 'react-router-dom';
import { POPUP_SIZE } from '../constants';
import OnboardingHeader from '@/components/OnboardingHeader';
import './layout.css';

type GlobalLayoutProps = {
  mode: 'popup' | 'onboarding';
};

const getLayoutStyle = (mode: GlobalLayoutProps['mode']): CSSProperties | undefined => {
  if (mode !== 'popup') return undefined;

  const isCreatedWindow = window.location.search.includes('create=true');
  if (isCreatedWindow) return undefined;

  return {
    width: POPUP_SIZE.width,
    height: POPUP_SIZE.height,
  };
};

function GlobalLayout({ mode }: GlobalLayoutProps) {
  const style = getLayoutStyle(mode);
  const isCreatedWindow = mode === 'popup' && window.location.search.includes('create=true');

  useEffect(() => {
    if (!isCreatedWindow) {
      return;
    }

    const handleBlur = () => {
      window.close();
    };

    // Created popup windows (via browser.windows.create) do not auto-close on outside click.
    // Close on blur to align with browser action popup behavior.
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, [isCreatedWindow]);

  return (
    <div style={style} className={mode === 'onboarding' ? 'onboarding-layout' : undefined}>
      {mode === 'onboarding' && <OnboardingHeader />}
      <Suspense fallback={null}>
        <Outlet />
      </Suspense>
    </div>
  );
}

export default GlobalLayout;
