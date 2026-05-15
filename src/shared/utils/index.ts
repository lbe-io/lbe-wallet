import browser from '@/entrypoints/background/webapi/browser';

declare global {
  const langLocales: Record<string, Record<'message', string>>;
}

const t = (name: any) => browser.i18n.getMessage(name);

const format = (str: any, ...args: any) => {
  return args.reduce((m: any, n: any) => m.replace('_s_', n), str);
};

export { t, format };
