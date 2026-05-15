import { ProviderRpcError, rpcErrors } from '@/shared/rpc/errors';
import Events from 'events';
import { browser } from 'wxt/browser';
import { winMgr } from '@/entrypoints/background/webapi';
import { IS_CHROME, IS_LINUX } from '@/shared/constants';
import { storage } from '@/entrypoints/background/webapi';
import type { RequestCorrelation } from '@/shared/messaging/requestCorrelationService';
import { createEmptyApprovalRuntimeState, toApprovalRecoveryInput, toRecoveredApprovalRuntimeState } from './approvalRecoveryService';
import type { ApprovalPayload, ApprovalRecoveryInput, ApprovalRequest, ApprovalRequestSnapshot, ApprovalRuntimeState } from './types';

const APPROVAL_RUNTIME_STORAGE_KEY = 'approvalRuntimeState';

type PersistedApprovalRuntime = {
  snapshot: ApprovalRequestSnapshot | null;
  runtime: ApprovalRuntimeState;
};

class NotificationService extends Events {
  approval: ApprovalRequest | null = null;
  approvalSnapshot: ApprovalRequestSnapshot | null = null;
  runtimeState: ApprovalRuntimeState = createEmptyApprovalRuntimeState();
  notifiWindowId = 0;
  isLocked = false;
  runtimeHydrated = false;

  constructor() {
    super();

    winMgr.event.on('windowRemoved', (winId: number) => {
      if (winId === this.notifiWindowId) {
        this.notifiWindowId = 0;
        this.rejectApproval();
      }
    });

    winMgr.event.on('windowFocusChange', (winId: number) => {
      if (this.notifiWindowId && winId !== this.notifiWindowId) {
        if (IS_CHROME && winId === browser.windows.WINDOW_ID_NONE && IS_LINUX) {
          return;
        }
      }
    });
  }

  private buildPersistedRuntime = (): PersistedApprovalRuntime => ({
    snapshot: this.approvalSnapshot,
    runtime: {
      ...this.runtimeState,
      notificationWindowId: this.notifiWindowId,
      isLocked: this.isLocked,
    },
  });

  private persistRuntime = async () => {
    await storage.set(APPROVAL_RUNTIME_STORAGE_KEY, this.buildPersistedRuntime());
  };

  restoreRuntime = async () => {
    if (this.runtimeHydrated) {
      return;
    }
    const stored = (await storage.get<PersistedApprovalRuntime | undefined>(APPROVAL_RUNTIME_STORAGE_KEY)) || undefined;
    if (stored?.snapshot) {
      this.approvalSnapshot = stored.snapshot;
      this.runtimeState = toRecoveredApprovalRuntimeState(stored.snapshot, stored.runtime);
      this.notifiWindowId = stored.runtime?.notificationWindowId || 0;
      this.isLocked = !!stored.runtime?.isLocked;
    } else {
      this.runtimeState = createEmptyApprovalRuntimeState();
      this.approvalSnapshot = null;
    }
    this.runtimeHydrated = true;
  };

  getApproval = (): ApprovalPayload | null => this.approval?.payload || this.approvalSnapshot?.payload || null;

  getApprovalRecovery = (): ApprovalRecoveryInput | null =>
    toApprovalRecoveryInput(this.approvalSnapshot, {
      ...this.runtimeState,
      notificationWindowId: this.notifiWindowId,
      isLocked: this.isLocked,
    });

  resolveApproval = (data?: unknown, forceReject = false) => {
    const hasLiveApproval = !!this.approval;
    if (forceReject) {
      this.approval?.reject(new ProviderRpcError(4001, 'User Cancel'));
    } else if (hasLiveApproval) {
      this.approval?.resolve(data);
    }
    this.approval = null;
    this.approvalSnapshot = null;
    this.runtimeState = {
      ...createEmptyApprovalRuntimeState(),
      status: forceReject ? 'rejected' : 'resolved',
      source: hasLiveApproval ? 'live' : 'restored',
    };
    void this.persistRuntime();
    this.emit('resolve', data);
  };

  rejectApproval = async (err?: string, stay = false, isInternal = false) => {
    if (!this.approval && !this.approvalSnapshot) return;
    if (this.approval && isInternal) {
      this.approval?.reject(rpcErrors.rpc.internal(err));
    } else if (this.approval) {
      this.approval?.reject(rpcErrors.provider.userRejectedRequest(err));
    }

    this.runtimeState = {
      ...createEmptyApprovalRuntimeState(),
      status: 'rejected',
      source: this.approval ? 'live' : 'restored',
    };
    await this.clear(stay);
    this.emit('reject', err);
  };

  requestApproval = async (data: ApprovalPayload, winProps?: Record<string, unknown>, correlation?: RequestCorrelation | null): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const requestedAt = Date.now();
      this.approval = {
        payload: data,
        requestedAt,
        correlation: correlation || null,
        resolve,
        reject: reject as (err: ProviderRpcError) => void,
      };
      this.approvalSnapshot = {
        payload: data,
        requestedAt,
        correlation: correlation || null,
      };
      this.runtimeState = {
        notificationWindowId: this.notifiWindowId,
        isLocked: this.isLocked,
        status: 'pending',
        requestedAt,
        recoverable: true,
        source: 'live',
      };
      void this.persistRuntime();

      this.openNotification(winProps);
    });
  };

  clear = async (stay = false) => {
    this.approval = null;
    this.approvalSnapshot = null;
    this.runtimeState = createEmptyApprovalRuntimeState();
    if (this.notifiWindowId && !stay) {
      await winMgr.remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
    await this.persistRuntime();
  };

  unLock = () => {
    this.isLocked = false;
    this.runtimeState = {
      ...this.runtimeState,
      isLocked: false,
    };
    void this.persistRuntime();
  };

  lock = () => {
    this.isLocked = true;
    this.runtimeState = {
      ...this.runtimeState,
      isLocked: true,
    };
    void this.persistRuntime();
  };

  openNotification = (winProps?: Parameters<typeof winMgr.openNotification>[0]) => {
    if (this.notifiWindowId) {
      winMgr.remove(this.notifiWindowId);
      this.notifiWindowId = 0;
    }
    winMgr.openNotification(winProps).then((winId) => {
      this.notifiWindowId = winId || 0;
      this.runtimeState = {
        ...this.runtimeState,
        notificationWindowId: this.notifiWindowId,
      };
      void this.persistRuntime();
    });
  };
}

export default new NotificationService();
