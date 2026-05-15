import type { AminoSignResponse } from '@cosmjs/amino';
import type { AccountData, DirectSignResponse } from '@cosmjs/proto-signing';
import type { ProviderBroadcastTxResult } from '@/cosmos/tx/txContract';

export type CosmosKeyResult = {
  name: string;
  algo: AccountData['algo'];
  pubKey: Uint8Array;
  address: string;
  bech32Address: string;
  isNanoLedger: boolean;
};

export type CosmosOfflineSignerAccount = Pick<AccountData, 'address' | 'algo' | 'pubkey'>;

export type CosmosOfflineSignerAccountsResult = CosmosOfflineSignerAccount[];

export type CosmosAminoSignResult = AminoSignResponse;

export type CosmosDirectSignResult = DirectSignResponse;

export type CosmosArbitrarySignatureResult = AminoSignResponse['signature'];

export type CosmosTxBroadcastContractResult = ProviderBroadcastTxResult;

export type CosmosTxBroadcastResult = Uint8Array;
