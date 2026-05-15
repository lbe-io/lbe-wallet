import { mountWalletApp } from '@/entrypoints/shared/mountWalletApp';
import { popupRouter } from './router';
import './style.css';

mountWalletApp({
  rootId: 'root',
  router: popupRouter,
});
