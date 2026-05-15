type ReadyCallback = () => void;

const domReadyCall = (callback: ReadyCallback) => {
  if (document.readyState === 'loading') {
    const onReady = () => {
      document.removeEventListener('DOMContentLoaded', onReady);
      callback();
    };
    document.addEventListener('DOMContentLoaded', onReady);
    return;
  }
  callback();
};

const $ = document.querySelector.bind(document) as <T extends Element = Element>(selectors: string) => T | null;

export { domReadyCall, $ };
