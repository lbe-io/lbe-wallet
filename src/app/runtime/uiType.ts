const UI_TYPE = {
  Tab: 'index',
  Pop: 'popup',
  Notification: 'notification',
};

type UiTypeCheck = {
  isTab: boolean;
  isNotification: boolean;
  isPop: boolean;
};

export const getUiType = (): UiTypeCheck => {
  const { pathname } = window.location;
  return Object.entries(UI_TYPE).reduce((acc, [key, value]) => {
    (acc as Record<string, boolean>)[`is${key}`] = pathname === `/${value}.html`;
    return acc;
  }, {} as UiTypeCheck);
};

export const getUITypeName = (): string => {
  const uiType = getUiType();
  if (uiType.isPop) return 'popup';
  if (uiType.isNotification) return 'notification';
  if (uiType.isTab) return 'tab';
  return '';
};
