import { Wallet, Contract, JsonRpcProvider } from "ethers";

import env from "./env";
import { Network } from "./db";
import { MESSENGER_ABI } from "./abi";

export interface SupportedNetwork {
  chainId: number;
  network: any;
  provider: any;
  contract: any;
}

class NetworkControl {
  public readonly supportedChainIds = env.SUPPORTED_CHAIN_IDS;
  public supportedNetworks: SupportedNetwork[] = [];

  public readonly wallet = new Wallet(env.PRIVATE_KEY);

  public async init() {
    // Setup Networks
    for (const chainId of this.supportedChainIds) {
      const network = await Network.findOne({
        where: {
          id: chainId,
        },
      });
      const provider = new JsonRpcProvider(network.rpc);
      const contract = new Contract(
        network.messengerAddress,
        MESSENGER_ABI,
        this.wallet.connect(provider),
      );
      this.supportedNetworks.push({
        chainId,
        network,
        provider,
        contract,
      });
    }
  }
}

export default NetworkControl;
