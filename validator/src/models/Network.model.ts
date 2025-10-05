import { Table, Column, Model, Unique } from "sequelize-typescript";

@Table
class Network extends Model {
  @Unique
  @Column
  declare name: string;

  @Unique
  @Column
  declare rpc: string;

  @Unique
  @Column
  declare chainId: number;

  @Column
  declare blockTime: number;

  @Column
  declare lastProcessedBlock: number;

  @Column
  declare senderContractAddress: string;

  @Column
  declare receiverContractAddress: string;
}

export default Network;
