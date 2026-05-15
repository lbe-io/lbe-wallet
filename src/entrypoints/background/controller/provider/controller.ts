import { permissionService } from '@/entrypoints/background/service';
import 'reflect-metadata';
import { ProviderRequestContext } from './types';
import { getKey, getOfflineSignerAccounts } from './accountReadHandlers';
import { signAmino, signArbitrary, signDirect, verifyArbitrary } from './signingHandlers';
import { sendTx } from './txHandlers';
import { disable, enable } from './connectionHandlers';
import { getChainInfos, suggestChain } from './chainInfoHandlers';

class ProviderController {
  @Reflect.metadata('SAFE', true)
  disable = disable;

  enable = enable;

  @Reflect.metadata('SAFE', true)
  suggestChain = suggestChain;

  @Reflect.metadata('SAFE', true)
  getChainInfos = getChainInfos;

  getKey = getKey;

  getOfflineSignerAccounts = getOfflineSignerAccounts;

  @Reflect.metadata('APPROVAL', ['CosmosSign', () => {}])
  signAmino = signAmino;

  @Reflect.metadata('APPROVAL', ['CosmosSign', () => {}])
  signDirect = signDirect;

  @Reflect.metadata('APPROVAL', ['CosmosSign', () => {}])
  signArbitrary = signArbitrary;

  @Reflect.metadata('SAFE', true)
  verifyArbitrary = verifyArbitrary;

  @Reflect.metadata('APPROVAL', ['CosmosSendTx', () => {}])
  sendTx = sendTx;
}

type ProviderControllerMethod = (req: ProviderRequestContext & { approvalRes?: unknown }) => unknown | Promise<unknown>;

export default new ProviderController() as ProviderController & Record<string, ProviderControllerMethod>;
