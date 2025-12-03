import {
  EventLog,
  Interface,
  solidityPackedKeccak256,
  toUtf8String,
  getBytes,
} from "ethers";
import NetworkControl, { SupportedNetwork } from "./NetworkControl";
import { MESSAGE_SENDER_ABI, MESSENGER_ABI } from "./abi";
import { Message, Network } from "./db";
import { MessageStatus } from "./messageStatus";

const BATCH = 100;

class Monitor {
  public readonly MINIMUM_CONFIRMATION = 3;
  public readonly chainId: number;

  constructor(
    public network: SupportedNetwork,
    public readonly networkControl: NetworkControl,
  ) {
    this.chainId = network.network.id;
  }

  private log(...text: string[]) {
    console.log(`[${this.chainId}]`, ...text);
  }

  public async processSentEvent(event: EventLog) {
    const messageId = `${event.transactionHash}-${event.index}`;
    const messengerInterface = new Interface(MESSENGER_ABI);
    const parsedEvent = messengerInterface.parseLog({
      data: event.data,
      topics: event.topics,
    });

    console.log(`Event: ${messageId}`);
    console.log(
      " -> Destination ChainID:",
      parsedEvent.args.destinationChainId,
    );
    console.log(
      " -> Sender, Nonce:",
      parsedEvent.args.sender,
      parsedEvent.args.nonce,
    );
    console.log(" -> Recipient:", parsedEvent.args.recipient);
    console.log(" -> Payload:", toUtf8String(parsedEvent.args.payload));
    console.log("======");

    const receiverNetwork = await Network.findOne({
      where: {
        id: Number(parsedEvent.args.destinationChainId),
      },
    });

    // Unsupported Network
    if (!receiverNetwork) {
      return;
    }

    // Generate message hash matching Solidity's keccak256(abi.encodePacked(...))
    const { wallet } = this.networkControl;
    const { chainId, network } = this.network;

    const messageHash = solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address", "address", "bytes"],
      [
        chainId,
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
      messageId,
      messageHash,
      fromNetworkId: network.id,
      toNetworkId: receiverNetwork.id,
      sender: parsedEvent.args.sender,
      nonce: parsedEvent.args.nonce,
      recipient: parsedEvent.args.recipient,
      payload: parsedEvent.args.payload,
      globalNonce: parsedEvent.args.globalNonce,
      signature,
      status: MessageStatus.PENDING,
      senderChainHash: event.transactionHash,
    });

    this.log("Message Created with signature:", signature);
  }

  public async processReceivedEvent(event: EventLog) {
    const messengerInterface = new Interface(MESSENGER_ABI);
    const parsedEvent = messengerInterface.parseLog({
      data: event.data,
      topics: event.topics,
    });

    const { wallet } = this.networkControl;
    const messageHash = solidityPackedKeccak256(
      ["uint256", "uint256", "uint256", "address", "address", "bytes"],
      [
        parsedEvent.args.sourceChainId,
        this.network.chainId,
        parsedEvent.args.nonce,
        parsedEvent.args.sender,
        parsedEvent.args.recipient,
        parsedEvent.args.payload,
      ],
    );
    const messageHashHash = solidityPackedKeccak256(["bytes32"], [messageHash]);

    // Sign the message hash
    const signature = await wallet.signMessage(getBytes(messageHashHash));

    const message = await Message.findOne({
      where: { messageHash },
    });

    if (!message) {
      this.log(`Message not found: ${messageHash}`);
      return;
    }

    message.ackSignature = signature;
    message.status = MessageStatus.RECEIVED;
    await message.save();
    this.log(`Message Received: ${messageHash}`);
  }

  public async processAckEvent(event: EventLog) {
    const messengerInterface = new Interface(MESSENGER_ABI);
    const parsedEvent = messengerInterface.parseLog({
      data: event.data,
      topics: event.topics,
    });

    const { messageHash } = parsedEvent.args;
    const message = await Message.findOne({
      where: { messageHash },
    });

    if (!message) {
      this.log(`Message not found: ${messageHash}`);
      return;
    }

    message.status = MessageStatus.COMPLETED;
    await message.save();
    this.log(`Message Acked: ${messageHash}, make message as COMPLETED`);
  }

  public async syncEvents() {
    const { network, provider, contract } = this.network;
    const currentBlock = await provider.getBlockNumber();
    const safeBlockNumber = Math.min(
      network.lastProcessedBlock + BATCH,
      Math.max(0, currentBlock - this.MINIMUM_CONFIRMATION),
    );

    if (network.lastProcessedBlock >= safeBlockNumber) {
      this.log("No new block to process");
    } else {
      // Process Sent Events
      const sentEvents = await contract.queryFilter(
        contract.filters.MessageSent(),
        network.lastProcessedBlock + 1,
        safeBlockNumber,
      );
      for (const event of sentEvents) {
        await this.processSentEvent(event);
      }

      // Process Received Events
      const receiveEvents = await contract.queryFilter(
        contract.filters.MessageReceived(),
        network.lastProcessedBlock + 1,
        safeBlockNumber,
      );
      for (const event of receiveEvents) {
        await this.processReceivedEvent(event);
      }

      // Process Ack Events
      const ackEvents = await contract.queryFilter(
        contract.filters.AckReceived(),
        network.lastProcessedBlock + 1,
        safeBlockNumber,
      );
      for (const event of ackEvents) {
        await this.processAckEvent(event);
      }

      this.log(
        `Found ${sentEvents.length} MessageSent(), ${receiveEvents.length} MessageReceived() from ${network.lastProcessedBlock + 1} to ${safeBlockNumber} (Current: ${currentBlock})`,
      );
    }

    network.lastProcessedBlock = safeBlockNumber;
    network.save();
  }

  public async start() {
    const poll = async () => {
      try {
        await this.syncEvents();
      } catch (err) {
        this.log("Error calling syncEvents()", err.message);
      }
      setTimeout(poll, this.network.network.blockTime * 1000);
    };

    await poll();
  }
}

export default Monitor;
