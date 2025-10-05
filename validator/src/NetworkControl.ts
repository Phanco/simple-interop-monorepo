import { Wallet, Contract, JsonRpcProvider } from "ethers";

import env from "./env";
import { Network } from "./db";
import { MESSAGE_RECEIVER_API, MESSAGE_SENDER_ABI } from "./abi";

class NetworkControl {
  public readonly senderChainId = env.SENDER_CHAIN_ID;
  public senderNetwork;
  public senderProvider;
  public senderContract;

  public readonly receiverChainId = env.RECEIVER_CHAIN_ID;
  public receiverNetwork;
  public receiverProvider;
  public receiverContract;

  public readonly wallet = new Wallet(env.PRIVATE_KEY);

  public async init() {
    // Setup Sender
    this.senderNetwork = await Network.findOne({
      where: {
        chainId: this.senderChainId,
      },
    });
    this.senderProvider = new JsonRpcProvider(this.senderNetwork.rpc);
    this.senderContract = new Contract(
      this.senderNetwork.senderContractAddress,
      MESSAGE_SENDER_ABI,
      this.senderProvider,
    );

    // Setup Receiver
    this.receiverNetwork = await Network.findOne({
      where: {
        chainId: this.receiverChainId,
      },
    });
    this.receiverProvider = new JsonRpcProvider(this.receiverNetwork.rpc);
    this.receiverContract = new Contract(
      this.receiverNetwork.receiverContractAddress,
      MESSAGE_RECEIVER_API,
      this.wallet.connect(this.receiverProvider),
    );
  }
}

export default NetworkControl;
