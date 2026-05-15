import { keyringService, readAuthorityState } from '@/entrypoints/background/service';
import { ProviderRequestContext } from './types';

const tabCheckin = ({ data: { params }, session }: ProviderRequestContext) => {
  const origin = typeof params?.origin === 'string' ? params.origin : '';
  const name = typeof params?.name === 'string' ? params.name : '';
  const icon = typeof params?.icon === 'string' ? params.icon : '';
  session.setProp({ origin, name, icon });
};

const getProviderState = async (req: ProviderRequestContext) => {
  const {
    session: { origin },
  } = req;
  const authority = readAuthorityState(origin);
  const isUnlocked = keyringService.memStore.getState().isUnlocked;
  const accounts: string[] = [];
  const chainId = authority.global.currentChainId;
  const networkVersion = chainId || '';
  const accountAddress = authority.origin?.accountAddress || authority.global.currentAccountAddress;
  if (accountAddress && authority.origin?.hasPermission) {
    accounts.push(accountAddress);
  }
  return {
    chainId,
    networkVersion,
    isUnlocked,
    accounts,
  };
};

const keepAlive = () => 'ACK_KEEP_ALIVE_MESSAGE';

const internalMethod: Record<string, (req: ProviderRequestContext) => unknown | Promise<unknown>> = {
  tabCheckin,
  getProviderState,
  keepAlive,
};

export default internalMethod;
