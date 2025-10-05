import {
  EventLog,
  Interface,
  solidityPackedKeccak256,
  toUtf8String,
  getBytes,
} from "ethers";
import NetworkControl from "./NetworkControl";
import { MESSAGE_SENDER_ABI } from "./abi";
import { Message, Network } from "./db";

const BATCH = 100;

class Monitor {
  public readonly MINIMUM_CONFIRMATION = 3;

  constructor(public readonly networkControl: NetworkControl) {}

  public async processEvent(event: EventLog) {
    const messageId = `${event.transactionHash}-${event.transactionIndex}`;
    const senderInterface = new Interface(MESSAGE_SENDER_ABI);
    const parsedEvent = senderInterface.parseLog({
      data: event.data,
      topics: event.topics,
    });

    console.log(`Event: ${messageId}`);
    console.log(parsedEvent.args.destinationChainId);
    console.log(parsedEvent.args.sender);
    console.log(parsedEvent.args.nonce);
    console.log(parsedEvent.args.recipient);
    console.log(toUtf8String(parsedEvent.args.payload));
    console.log("======");

    const receiverNetwork = await Network.findOne({
      where: {
        chainId: Number(parsedEvent.args.destinationChainId),
      },
    });

    // Unsupported Network
    if (!receiverNetwork) {
      return;
    }

    // Generate message hash matching Solidity's keccak256(abi.encodePacked(...))
    const { senderChainId, wallet, senderNetwork } = this.networkControl;

    const messageHash = solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address", "address", "bytes"],
      [
        senderChainId,
        parsedEvent.args.destinationChainId,
        parsedEvent.args.nonce,
        parsedEvent.args.sender,
        parsedEvent.args.recipient,
        parsedEvent.args.payload,
      ],
    );

    // Sign the message hash
    const signature = await wallet.signMessage(getBytes(messageHash));

    await Message.create({
      messageId: messageId,
      fromNetworkId: senderNetwork.id,
      toNetworkId: receiverNetwork.id,
      sender: parsedEvent.args.sender,
      nonce: parsedEvent.args.nonce,
      recipient: parsedEvent.args.recipient,
      payload: parsedEvent.args.payload,
      globalNonce: parsedEvent.args.globalNonce,
      signature: signature,
      status: 0,
    });

    console.log("Message Created with signature:", signature);
  }

  public async syncEvents() {
    const { senderProvider, senderNetwork, senderContract } =
      this.networkControl;

    const currentBlock = await senderProvider.getBlockNumber();
    const safeBlockNumber = Math.min(
      senderNetwork.lastProcessedBlock + BATCH,
      Math.max(0, currentBlock - this.MINIMUM_CONFIRMATION),
    );

    if (senderNetwork.lastProcessedBlock >= safeBlockNumber) {
      console.log("No new block to process");
    } else {
      const events = await senderContract.queryFilter(
        senderContract.filters.MessageSent(),
        senderNetwork.lastProcessedBlock + 1,
        safeBlockNumber,
      );

      console.log(
        `Found ${events.length} events from ${senderNetwork.lastProcessedBlock + 1} to ${safeBlockNumber} (Current: ${currentBlock})`,
      );
      for (const event of events) {
        await this.processEvent(event);
      }
    }

    senderNetwork.lastProcessedBlock = safeBlockNumber;
    senderNetwork.save();
  }

  public async start() {
    const { senderNetwork } = this.networkControl;

    const poll = async () => {
      try {
        await this.syncEvents();
      } catch (err) {
        console.log("Error calling syncEvents()", err.message);
      }
      setTimeout(poll, senderNetwork.blockTime * 1000);
    };

    await poll();
  }
}

export default Monitor;
