import { literal, Op } from "sequelize";

import { Message, Peer } from "./db";
import NetworkControl from "./NetworkControl";
import env from "./env";

class Broadcaster {
  public totalRelayers: number;
  public relayerIndex: number;
  public requiredSignatures: number;

  constructor(
    public readonly name: string,
    public readonly networkControl: NetworkControl,
  ) {
    console.log(`Broadcaster: ${this.name}`);
  }

  public async init() {
    const { receiverContract, wallet } = this.networkControl;
    this.totalRelayers = Number(await receiverContract.relayersLength());
    this.relayerIndex = Number(
      await receiverContract.getRelayerIndex(wallet.address),
    );
    this.requiredSignatures = Number(
      await receiverContract.CONSENSUS_THRESHOLD(),
    );

    console.log(
      `Broadcaster initiated: ${this.relayerIndex}/${this.totalRelayers}`,
    );
  }

  public async main() {
    const { senderChainId, senderNetwork, receiverNetwork, receiverContract } =
      this.networkControl;

    const pendingMessages = await Message.findAll({
      where: {
        [Op.and]: [
          { fromNetworkId: senderNetwork.id},
          {toNetworkId: receiverNetwork.id},
          { status: 0 },
          literal(`"nonce" % ${this.totalRelayers} = ${this.relayerIndex}`),
        ],
      },
    });

    const peers = await Peer.findAll({
      where: {
        fromNetworkId: senderNetwork.id,
        toNetworkId: receiverNetwork.id,
        name: {
          [Op.not]: env.NAME,
        },
      },
    });

    if (pendingMessages.length === 0) {
      return;
    }

    for (const message of pendingMessages) {
      console.log(`Processing Message: ${message.senderChainHash}`);
      // Check if the nonce is ready, if not, skip
      const currentNonce: bigint =
        await receiverContract.processedMessageNonces(
          senderChainId,
          message.sender,
        );

      if (message.nonce !== Number(currentNonce)) {
        console.log(
          `Skipping ${message.senderChainHash}, incorrect nonce (Chain: ${currentNonce}, Message: ${message.nonce})`,
        );
        continue;
      }

      const signatures = [message.signature];
      for (const peer of peers) {
        const result = await fetch(
          peer.uri + "/message/" + message.senderChainHash,
        );
        if (result.status !== 200) {
          continue;
        }

        const data = await result.json();

        if (data.signature) {
          signatures.push(data.signature);
        }
      }

      if (signatures.length >= this.requiredSignatures) {
        console.log(
          `Message: ${message.senderChainHash} has reached enough signatures`,
        );
        signatures.splice(this.requiredSignatures);

        const tx = await receiverContract.receiveMessage(
          senderNetwork.chainId,
          message.nonce,
          message.sender,
          message.recipient,
          message.payload,
          signatures.slice(0, this.requiredSignatures),
        );
        message.receiverChainHash = tx.hash;
        message.status = 1;
        await message.save();

        await tx.wait();

        console.log(
          `Message: ${message.senderChainHash} broadcasted, txid: ${tx.hash}`,
        );
        message.status = 2;
        await message.save();
      }
    }
  }

  public async start() {
    const { senderNetwork } = this.networkControl;

    const poll = async () => {
      try {
        await this.main();
      } catch (err) {
        console.log("Error in Broadcast", err.message);
      }
      setTimeout(poll, senderNetwork.blockTime * 1000);
    };

    await poll();
  }
}

export default Broadcaster;
