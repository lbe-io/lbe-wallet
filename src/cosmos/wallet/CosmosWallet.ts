import { DirectSecp256k1HdWallet } from '@cosmjs/proto-signing';
import { stringToPath } from '@cosmjs/crypto';
import { CosmosChain } from './chains';

export class CosmosWallet {
  private mnemonic: string;

  constructor(mnemonic: string) {
    this.mnemonic = mnemonic;
  }

  private buildHdPath(index = 0, coinType = 118) {
    return stringToPath(`m/44'/${coinType}'/0'/0/${index}`);
  }

  async getWallet(chain: CosmosChain, accountIndex = 0) {
    return await DirectSecp256k1HdWallet.fromMnemonic(this.mnemonic, {
      prefix: chain.bech32Prefix,
      hdPaths: [this.buildHdPath(accountIndex, chain.coinType)],
    });
  }

  async getAddress(chain: CosmosChain, accountIndex = 0) {
    const wallet = await this.getWallet(chain, accountIndex);
    const [account] = await wallet.getAccounts();
    return account.address;
  }

  /**
   * ⭐ 生成所有链地址
   */
  async getAllAddresses(chains: CosmosChain[]) {
    const result: Record<string, string> = {};

    for (const chain of chains) {
      result[chain.chainName] = await this.getAddress(chain);
    }

    return result;
  }
}
