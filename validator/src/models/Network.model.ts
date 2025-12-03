import { Table, Column, Model, Unique } from "sequelize-typescript";

@Table
class Network extends Model {
  // id is the chainId (non-sequential, must be explicitly provided)
  declare id: number;

  @Unique
  @Column
  declare name: string;

  @Unique
  @Column
  declare rpc: string;

  @Column
  declare blockTime: number;

  @Column
  declare lastProcessedBlock: number;

  @Column
  declare senderContractAddress: string;

  @Column
  declare receiverContractAddress: string;

  @Column
  declare messengerAddress: string;
}

export default Network;
