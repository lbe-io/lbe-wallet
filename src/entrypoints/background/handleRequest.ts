import { EVENTS } from '@/shared/constants';
import eventBus from '@/shared/events';
import { Message } from '@/shared/messaging';
import { createRequestCorrelation } from '@/shared/messaging/requestCorrelationService';
import { JSEncrypt } from 'jsencrypt';
import { autoLockService } from './service/autoLock';
import { rpcErrors } from '@/shared/rpc/errors';

import { providerController } from './controller';
import type { ProviderRequestContext } from './controller/provider/types';
import { ensureProviderRequestSchema } from './controller/provider/requestSchema';
import walletController from './controller/wallet';
import { keyringService, notificationService, permissionService, preferenceService, sessionService } from './service';
import { buildProviderSessionKey } from './service/session';
import { storage } from './webapi';
import { browserRuntimeOnConnect, browserRuntimeOnInstalled, browserTabsCreate } from './webapi/browser';
import { browser } from 'wxt/browser';

const { PortMessage } = Message;

let appStoreLoaded = false;
let appStoreReadyPromise: Promise<void> | null = null;

type ControllerRequestMessage = {
  type?: string;
  method?: string;
  params?: unknown[];
};

const isControllerRequestMessage = (value: unknown): value is ControllerRequestMessage => {
  return !!value && typeof value === 'object';
};

const isProviderRpcPayload = (value: unknown): value is { method: string; params?: Record<string, unknown> } => {
  return !!value && typeof value === 'object' && typeof (value as { method?: unknown }).method === 'string';
};

const resolveProviderSessionData = (port: any) => {
  const tabId = typeof port?.sender?.tab?.id === 'number' ? port.sender.tab.id : undefined;
  const frameId = typeof port?.sender?.frameId === 'number' ? port.sender.frameId : 0;
  const origin = typeof port?.sender?.origin === 'string' ? port.sender.origin : '';
  const pageUrl = (typeof port?.sender?.url === 'string' && port.sender.url) || (typeof port?.sender?.tab?.url === 'string' && port.sender.tab.url) || '';

  return {
    tabId,
    frameId,
    origin,
    pageUrl,
  };
};

type RuntimeSenderIdentity = {
  tabId?: number;
  frameId?: number;
  origin?: string;
};

const resolveRuntimeSenderIdentity = (port: any): RuntimeSenderIdentity => {
  const tabId = typeof port?.sender?.tab?.id === 'number' ? port.sender.tab.id : undefined;
  const frameId = typeof port?.sender?.frameId === 'number' ? port.sender.frameId : undefined;
  const origin = typeof port?.sender?.origin === 'string' ? port.sender.origin.trim() : '';

  return {
    tabId,
    frameId,
    origin: origin && origin !== 'null' ? origin : '',
  };
};

const assertProviderSenderIdentity = (session: unknown, runtimeIdentity: RuntimeSenderIdentity) => {
  const sessionRecord = (session && typeof session === 'object' ? session : {}) as {
    tabId?: unknown;
    frameId?: unknown;
    origin?: unknown;
  };

  const sessionTabId = typeof sessionRecord.tabId === 'number' ? sessionRecord.tabId : undefined;
  const sessionFrameId = typeof sessionRecord.frameId === 'number' ? sessionRecord.frameId : undefined;
  const sessionOrigin = typeof sessionRecord.origin === 'string' ? sessionRecord.origin.trim() : '';

  if (sessionTabId !== undefined && runtimeIdentity.tabId !== undefined && sessionTabId !== runtimeIdentity.tabId) {
    throw rpcErrors.provider.unauthorized({ message: 'Unauthorized request context' });
  }

  if (sessionFrameId !== undefined && runtimeIdentity.frameId !== undefined && sessionFrameId !== runtimeIdentity.frameId) {
    throw rpcErrors.provider.unauthorized({ message: 'Unauthorized request context' });
  }

  if (sessionOrigin && runtimeIdentity.origin && sessionOrigin !== runtimeIdentity.origin) {
    throw rpcErrors.provider.unauthorized({ message: 'Unauthorized request context' });
  }
};

async function restoreAppState() {
  const keyringState = await storage.get('keyringState');
  keyringService.loadStore(keyringState);
  keyringService.store.subscribe((value) => storage.set('keyringState', value));

  await preferenceService.init();
  autoLockService.init();
  const restored = await keyringService.restoreUnlockSession();
  if (restored) {
    autoLockService.setLastActiveTime();
    await keyringService.touchUnlockSession();
  }
  await permissionService.init();
  await notificationService.restoreRuntime();
  appStoreLoaded = true;
}

const ensureBackgroundReady = async () => {
  if (!appStoreReadyPromise) {
    appStoreReadyPromise = restoreAppState();
  }
  await appStoreReadyPromise;
};

export const startHandleRequest = () => {
  void ensureBackgroundReady();

  browserRuntimeOnInstalled(async (details) => {
    if (details.reason !== 'install') {
      return;
    }
    const url = browser.runtime.getURL('/onboarding.html' as any);
    await browserTabsCreate({ url });
  });

  browserRuntimeOnConnect((port: any) => {
    if (port.name === 'popup' || port.name === 'notification' || port.name === 'tab') {
      const pm = new PortMessage(port);
      pm.listen(async (data: unknown) => {
        await ensureBackgroundReady();
        if (!isControllerRequestMessage(data)) return;
        if (!data?.type) return;

        switch (data.type) {
          case 'broadcast':
            if (typeof data.method !== 'string' || !data.method) return;
            eventBus.emit(data.method, data.params);
            break;
          case 'controller':
          default: {
            if (!data.method) return;
            const methodName = data.method;

            const method = walletController[methodName];
            if (!method) {
              throw new Error(`Method ${methodName} not found`);
            }

            if (keyringService.memStore.getState().isUnlocked) {
              autoLockService.setLastActiveTime();
              void keyringService.touchUnlockSession().catch(() => undefined);
            }

            return method.apply(walletController, Array.isArray(data.params) ? data.params : []);
          }
        }
      });

      const broadcastCallback = (data: unknown) => {
        const payload = (data && typeof data === 'object' ? (data as Record<string, unknown>) : {}) as Record<string, unknown>;
        pm.request({
          type: 'broadcast',
          method: payload.method,
          params: payload.params,
        });
      };

      if (port.name === 'popup') {
        preferenceService.setPopupOpen(true);
        port.onDisconnect.addListener(() => {
          preferenceService.setPopupOpen(false);
        });
      }

      eventBus.addEventListener(EVENTS.broadcastToUI, broadcastCallback);
      port.onDisconnect.addListener(() => {
        eventBus.removeEventListener(EVENTS.broadcastToUI, broadcastCallback);
      });

      return;
    }

    const pm = new PortMessage(port);
    const sessionData = resolveProviderSessionData(port);
    const sessionKey = buildProviderSessionKey(port?.sender, port?.name);
    const session = sessionService.getOrCreateSession(sessionKey, sessionData);

    pm.listen(async (data: unknown) => {
      await ensureBackgroundReady();
      ensureProviderRequestSchema(data);
      if (!isProviderRpcPayload(data)) return;
      const runtimeIdentity = resolveRuntimeSenderIdentity(port);
      assertProviderSenderIdentity(session, runtimeIdentity);
      const requestCorrelation = createRequestCorrelation({
        sessionKey,
        portName: port?.name || 'provider',
        origin: session.origin,
        method: data.method,
      });
      const req: ProviderRequestContext = { data, session, requestCorrelation };
      req.session.pushMessage = (event: string, payload?: unknown) => {
        pm.send('message', { event, data: payload });
      };
      return providerController(req);
    });

    port.onDisconnect.addListener(() => {
      sessionService.deleteSession(sessionKey);
    });
  });

  storage.get('rsaKeyLoaded').then((rsaKeyLoaded) => {
    if (!rsaKeyLoaded) {
      const encrypt = new JSEncrypt({ default_key_size: 2048 } as any);
      const publicKey = encrypt.getPublicKey();
      const privateKey = encrypt.getPrivateKey();
      keyringService.initRsa(publicKey, privateKey);
      storage.set('rsaKeyLoaded', true);
    }
  });
};
