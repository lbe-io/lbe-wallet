import { mountWalletApp } from '@/entrypoints/shared/mountWalletApp';
import { onboardingRouter } from './router';
import '../popup/style.css';

mountWalletApp({
  rootId: 'onboardingroot',
  router: onboardingRouter,
});
