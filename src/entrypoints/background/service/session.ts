import permissionService from './permission';

type SessionId = number | string;
type BroadcastPayload = unknown;
type SessionData = {
  origin?: string;
  icon?: string;
  name?: string;
  pageUrl?: string;
  tabId?: number;
  frameId?: number;
  pushMessage?: (event: string, payload?: BroadcastPayload) => void;
};

type ProviderPortSenderLike = {
  origin?: string;
  url?: string;
  frameId?: number;
  tab?: {
    id?: number;
    url?: string;
  };
};

const normalizeOrigin = (value?: string) => {
  const normalized = (value || '').trim();
  if (normalized && normalized !== 'null') {
    return normalized;
  }
  return '';
};

const deriveOriginFromUrl = (value?: string) => {
  const normalized = (value || '').trim();
  if (!normalized) return '';
  try {
    const url = new URL(normalized);
    if (url.origin && url.origin !== 'null') {
      return url.origin;
    }
    return `${url.protocol}//${url.host}`.replace(/\/\/$/, '');
  } catch {
    return '';
  }
};

export const buildProviderSessionKey = (sender?: ProviderPortSenderLike, fallbackName = 'provider') => {
  const tabId = typeof sender?.tab?.id === 'number' ? sender.tab.id : null;
  const frameId = typeof sender?.frameId === 'number' ? sender.frameId : 0;
  const origin = normalizeOrigin(sender?.origin) || deriveOriginFromUrl(sender?.url) || deriveOriginFromUrl(sender?.tab?.url) || 'unknown';

  if (tabId !== null) {
    return `tab:${tabId}:frame:${frameId}:origin:${origin}`;
  }

  return `runtime:${fallbackName}:frame:${frameId}:origin:${origin}`;
};

export class Session {
  origin = '';
  icon = '';
  name = '';
  pageUrl = '';
  tabId?: number;
  frameId = 0;
  pushMessage?: (event: string, payload?: BroadcastPayload) => void;

  constructor(data?: SessionData | null) {
    if (data) {
      this.setProp(data);
    }
  }

  setProp({ origin, icon, name, pageUrl, tabId, frameId, pushMessage }: SessionData) {
    const nextOrigin = (origin || '').trim();
    const canApplyIdentity = !nextOrigin || !this.origin || this.origin === nextOrigin;

    if (canApplyIdentity) {
      if (nextOrigin) {
        this.origin = nextOrigin;
      }
      if (icon !== undefined) {
        this.icon = icon || '';
      }
      if (name !== undefined) {
        this.name = name || '';
      }
      if (pageUrl !== undefined) {
        this.pageUrl = pageUrl || '';
      }
    }

    if (typeof tabId === 'number') {
      this.tabId = tabId;
    }
    if (typeof frameId === 'number') {
      this.frameId = frameId;
    }
    if (pushMessage) {
      this.pushMessage = pushMessage;
    }
  }
}

const sessionMap = new Map<SessionId, Session>();
const getSession = (id: SessionId) => {
  return sessionMap.get(id);
};

const getOrCreateSession = (id: SessionId, data?: SessionData | null) => {
  if (sessionMap.has(id)) {
    const session = getSession(id)!;
    if (data) {
      session.setProp(data);
    }
    return session;
  }

  return createSession(id, data || null);
};

const createSession = (id: SessionId, data: SessionData | null) => {
  const session = new Session(data);
  sessionMap.set(id, session);

  return session;
};

const deleteSession = (id: SessionId) => {
  sessionMap.delete(id);
};

const deleteSessionsByTabId = (tabId: number) => {
  if (!Number.isInteger(tabId)) {
    return 0;
  }

  const keysToDelete: SessionId[] = [];
  sessionMap.forEach((session, key) => {
    const keyMatchesTab = typeof key === 'string' && key.startsWith(`tab:${tabId}:`);
    if (keyMatchesTab || session.tabId === tabId) {
      keysToDelete.push(key);
    }
  });

  keysToDelete.forEach((key) => {
    deleteSession(key);
  });

  return keysToDelete.length;
};

const broadcastEvent = (ev: string, data?: BroadcastPayload, origin?: string) => {
  let sessions: Array<{ key: SessionId; origin: string; pushMessage?: Session['pushMessage'] }> = [];
  sessionMap.forEach((session, key) => {
    if (permissionService.hasPermission(session.origin)) {
      sessions.push({
        key,
        ...session,
      });
    }
  });

  // same origin
  if (origin) {
    sessions = sessions.filter((session) => session.origin === origin);
  }

  sessions.forEach((session) => {
    try {
      session.pushMessage?.(ev, data);
    } catch {
      if (sessionMap.has(session.key)) {
        deleteSession(session.key);
      }
    }
  });
};

export default {
  getSession,
  getOrCreateSession,
  deleteSession,
  deleteSessionsByTabId,
  broadcastEvent,
};
