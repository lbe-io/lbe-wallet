import preference from './preference';
import { browser } from 'wxt/browser';
import { ALARMS_AUTO_LOCK } from '@/shared/constants/alarms';

class AutoLockService {
  timer: ReturnType<typeof setTimeout> | null = null;
  private hasBoundAlarmListener = false;

  onAutoLock?: () => void;

  constructor({ onAutoLock }: { onAutoLock?: () => void } = {}) {
    this.onAutoLock = onAutoLock;
  }

  init() {
    if (!this.hasBoundAlarmListener) {
      browser.alarms.onAlarm.addListener(this.onAlarm);
      this.hasBoundAlarmListener = true;
    }
  }

  resetTimer() {
    const autoLockTime = preference.getPreference('autoLockTime');
    this.init();
    browser.alarms.clear(ALARMS_AUTO_LOCK);
    if (!autoLockTime) {
      return;
    }
    browser.alarms.create(ALARMS_AUTO_LOCK, {
      delayInMinutes: autoLockTime,
    });
  }

  clearTimer() {
    browser.alarms.clear(ALARMS_AUTO_LOCK);
  }

  private onAlarm = (alarm: any) => {
    if (alarm.name === ALARMS_AUTO_LOCK) {
      this.onAutoLock?.();
      browser.alarms.clear(ALARMS_AUTO_LOCK);
    }
  };

  setLastActiveTime() {
    this.resetTimer();
  }

  setAutoLockTime(autoLockTime: number) {
    preference.setAutoLockTime(autoLockTime);
    this.resetTimer();
  }
}

export const autoLockService = new AutoLockService();
