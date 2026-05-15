import { lazy } from 'react';
import { Navigate, createHashRouter, type RouteObject } from 'react-router-dom';
import GlobalLayout from '@/popup/app/layout';

export type WalletEntryMode = 'popup' | 'onboarding';

const PATHS = {
  ROOT: '/',
  ONBOARDING: '/onboarding',
  WELCOME: '/welcome',
  LOGIN: '/login',
  APPROVAL: '/approval',
  PASSWORD: '/password',
  CREATE_PASSWORD: '/create-password',
  IMPORT_RECOVERY: '/import-with-recovery-phrase',
  IMPORT_SRP: '/import-with-srp',
  IMPORT_WITH_ACCOUNT: '/add-wallet-page',
  REVIEW_RECOVERY: '/review-recovery-phrase',
  CONFIRM_RECOVERY: '/confirm-recovery-phrase',
  ONBOARDING_COMPLETE: '/onboarding-complete',
  HOME_WALLET: '/home/wallet',
} as const;

const BoostPage = lazy(() => import('@/popup/app/boost'));
const OnboardingPage = lazy(() => import('@/popup/app/onboarding'));
const WelcomePage = lazy(() => import('@/popup/app/welcome'));
const LoginPage = lazy(() => import('@/popup/app/login'));
const ApprovalPage = lazy(() => import('@/popup/app/approval'));
const PasswordPage = lazy(() => import('@/popup/app/password'));
const CreatePasswordPage = lazy(() => import('@/popup/app/createPassword'));
const ImportWithAccountPage = lazy(() => import('@/popup/app/phrase/importWithAccount'));
const ImportWithRecoveryPhrasePage = lazy(() => import('@/popup/app/phrase/importWithRecovery'));
const ImportWithSrpPage = lazy(() => import('@/popup/app/phrase/importWithSrp'));
const ReviewRecoveryPhrasePage = lazy(() => import('@/popup/app/phrase/reviewRecovery'));
const ConfirmRecoveryPhrasePage = lazy(() => import('@/popup/app/phrase/confirmRecovery'));
const OnboardingCompletePage = lazy(() => import('@/popup/app/onboardingComplete'));
const WalletPage = lazy(() => import('@/popup/app/wallet'));

const getCommonRoutes = (): RouteObject[] => [
  { path: PATHS.WELCOME, element: <WelcomePage /> },
  { path: PATHS.CREATE_PASSWORD, element: <CreatePasswordPage /> },
  { path: PATHS.IMPORT_RECOVERY, element: <ImportWithRecoveryPhrasePage /> },
  { path: PATHS.IMPORT_SRP, element: <ImportWithSrpPage /> },
  { path: PATHS.IMPORT_WITH_ACCOUNT, element: <ImportWithAccountPage /> },
  { path: PATHS.REVIEW_RECOVERY, element: <ReviewRecoveryPhrasePage /> },
  { path: PATHS.CONFIRM_RECOVERY, element: <ConfirmRecoveryPhrasePage /> },
  { path: PATHS.ONBOARDING_COMPLETE, element: <OnboardingCompletePage /> },
  { path: PATHS.HOME_WALLET, element: <WalletPage /> },
];

const getPopupOnlyRoutes = (): RouteObject[] => [
  { path: PATHS.WELCOME, element: <WelcomePage /> },
  { path: PATHS.ONBOARDING, element: <OnboardingPage /> },
  { path: PATHS.LOGIN, element: <LoginPage /> },
  { path: PATHS.APPROVAL, element: <ApprovalPage /> },
  { path: PATHS.PASSWORD, element: <PasswordPage /> },
];

export const createWalletRouter = (mode: WalletEntryMode) => {
  const children: RouteObject[] = [
    { path: PATHS.ROOT, element: mode === 'popup' ? <BoostPage /> : <OnboardingPage /> },
    ...getCommonRoutes(),
    ...(mode === 'popup' ? getPopupOnlyRoutes() : []),
    { path: '*', element: <Navigate to={PATHS.ROOT} replace /> },
  ];

  return createHashRouter([
    {
      path: PATHS.ROOT,
      element: <GlobalLayout mode={mode} />,
      children,
    },
  ]);
};
