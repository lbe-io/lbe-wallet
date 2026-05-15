import ReactDOM from 'react-dom/client';
import { ConfigProvider } from 'antd';
import { Provider } from 'react-redux';
import { RouterProvider, createHashRouter } from 'react-router-dom';
import { WalletProvider } from '@/app/contexts';
import Loading from '@/components/Loading';
import store from '@/popup/store';
import { EVENTS } from '@/shared/constants';
import eventBus from '@/shared/events';
import { Message } from '@/shared/messaging';
import { syncLanguagePreference } from '@/i18n';
import { appBaseTheme } from '@/styles/antdThemeTokens';
import '@/i18n';

type AppRouter = ReturnType<typeof createHashRouter>;

type MountWalletAppOptions = {
  rootId: string;
  router: AppRouter;
};

const createWalletController = () => {
  const { PortMessage } = Message;
  const portMessageChannel = new PortMessage();
  portMessageChannel.connect('popup');

  const wallet: Record<string, any> = new Proxy(
    {},
    {
      get(_obj, key) {
        return (...params: any[]) =>
          portMessageChannel.request({
            type: 'controller',
            method: key,
            params,
          });
      },
    },
  );

  portMessageChannel.listen((data: any) => {
    if (data.type === 'broadcast') {
      eventBus.emit(data.method, data.params);
    }
  });

  eventBus.addEventListener(EVENTS.broadcastToBackground, (data) => {
    portMessageChannel.request({
      type: 'broadcast',
      method: data.method,
      params: data.data,
    });
  });

  return wallet;
};

export const mountWalletApp = ({ rootId, router }: MountWalletAppOptions) => {
  const root = document.getElementById(rootId);
  if (!root) throw new Error(`Root element not found: #${rootId}`);

  const wallet = createWalletController();
  void syncLanguagePreference(() => wallet.getLocale());

  ReactDOM.createRoot(root).render(
    <Provider store={store}>
      <ConfigProvider prefixCls="lbe" theme={appBaseTheme}>
        <Loading fullscreen />
        <WalletProvider wallet={wallet as any}>
          <RouterProvider router={router} />
        </WalletProvider>
      </ConfigProvider>
    </Provider>,
  );
};
