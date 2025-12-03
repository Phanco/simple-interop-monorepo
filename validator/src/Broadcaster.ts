import { literal, Op } from "sequelize";

import { Message, Peer } from "./db";
import NetworkControl from "./NetworkControl";
import { MessageStatus } from "./messageStatus";

class Broadcaster {
  public readonly chainId: number;
  public totalRelayers: number;
  public relayerIndex: number;
  public requiredSignatures: number;

  constructor(
    public readonly name: string,
    public readonly network,
    public readonly networkControl: NetworkControl,
  ) {
    this.chainId = network.network.id;
  }

  private log(text: string) {
    console.log(`[${this.chainId}] ${text}`);
  }

  public async init() {
    const { contract } = this.network;
    const { wallet } = this.networkControl;

    this.totalRelayers = Number(await contract.relayersLength());
    this.relayerIndex = Number(await contract.getRelayerIndex(wallet.address));
    this.requiredSignatures = Number(await contract.CONSENSUS_THRESHOLD());

    this.log(
      `Broadcaster initiated: ${this.relayerIndex}/${this.totalRelayers}`,
    );
  }

  public async main() {
    const pendingMessages = await Message.findAll({
      where: {
        [Op.and]: [
          { fromNetworkId: this.chainId },
          { status: MessageStatus.PENDING },
          literal(`"nonce" % ${this.totalRelayers} = ${this.relayerIndex}`),
        ],
      },
    });
    if (pendingMessages.length === 0) {
      return;
    }

    const peers = await Peer.getPeers(this.chainId);
    if (peers.length === 0) {
      return;
    }

    for (const message of pendingMessages) {
      this.log(`Processing Message: ${message.senderChainHash}`);
      const receivingNetwork = this.networkControl.supportedNetworks.find(
        (network) => network.chainId === message.toNetworkId,
      );

      // Check if the nonce is ready, if not, skip
      const currentNonce: bigint =
        await receivingNetwork.contract.incomingNonces(
          this.chainId,
          message.sender,
        );

      if (message.nonce > Number(currentNonce)) {
        this.log(
          `Skipping ${message.senderChainHash}, incorrect nonce (Chain: ${currentNonce}, Message: ${message.nonce})`,
        );
        continue;
      } else if (message.nonce < Number(currentNonce)) {
        this.log(
          `Skipping ${message.senderChainHash}, nonce has already been processed. (Chain: ${currentNonce}, Message: ${message.nonce})`,
        );
        message.status = MessageStatus.BOARDCASTED;
        await message.save();
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
        this.log(
          `Message: ${message.senderChainHash} has reached enough signatures`,
        );
        signatures.splice(this.requiredSignatures);

        const receiverNetwork = this.networkControl.supportedNetworks.find(
          (network) => network.chainId === message.toNetworkId,
        );
        const tx = await receiverNetwork.contract.receiveMessage(
          this.chainId,
          message.nonce,
          message.sender,
          message.recipient,
          message.payload,
          signatures.slice(0, this.requiredSignatures),
        );
        message.receiverChainHash = tx.hash;
        message.status = MessageStatus.SIGNED;
        await message.save();

        await tx.wait();

        this.log(
          `Message: ${message.senderChainHash} broadcasted, txid: ${tx.hash}`,
        );
        message.status = MessageStatus.BOARDCASTED;
        await message.save();
      }
    }
  }

  public async broadcastAck() {
    const receivedMessages = await Message.findAll({
      where: {
        [Op.and]: [
          { toNetworkId: this.chainId },
          { status: MessageStatus.RECEIVED },
          literal(`"nonce" % ${this.totalRelayers} = ${this.relayerIndex}`),
        ],
      },
    });
    if (receivedMessages.length === 0) {
      return;
    }

    const peers = await Peer.getPeers(this.chainId);
    if (peers.length === 0) {
      return;
    }

    for (const message of receivedMessages) {
      const signatures = [message.ackSignature];
      for (const peer of peers) {
        const result = await fetch(
          peer.uri + "/message/" + message.senderChainHash,
        );
        if (result.status !== 200) {
          continue;
        }

        const data = await result.json();

        if (data.ackSignature) {
          signatures.push(data.ackSignature);
        }
      }

      if (signatures.length >= this.requiredSignatures) {
        this.log(
          `Message: ${message.senderChainHash} has reached enough signatures for ACK`,
        );
        const tx = await this.network.contract.receiveAck(
          message.messageHash,
          signatures.slice(0, this.requiredSignatures),
        );
        message.status = MessageStatus.ACKED;
        message.ackHash = tx.hash;
        await message.save();
        this.log(`Message Acked: ${message.senderChainHash}, txid: ${tx.hash}`);
      }
    }
  }

  public async start() {
    const poll = async () => {
      try {
        await this.main();
        await this.broadcastAck();
      } catch (err) {
        console.log("Error in Broadcast", err.message);
      }
      setTimeout(poll, this.network.blockTime * 1000);
    };

    await poll();
  }
}

export default Broadcaster;
