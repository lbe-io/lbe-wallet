import { defineBackground } from 'wxt/sandbox';
import { startHandleRequest } from './handleRequest';

export default defineBackground(() => {
  startHandleRequest();
});
