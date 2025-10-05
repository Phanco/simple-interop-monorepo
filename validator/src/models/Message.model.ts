import {
  Table,
  Column,
  AllowNull,
  Model,
  Unique,
  ForeignKey,
  BelongsTo,
  DataType,
} from "sequelize-typescript";
import Network from "./Network.model";

@Table
class Message extends Model {
  @Unique
  @AllowNull(false)
  @Column
  declare messageId: string;

  @ForeignKey(() => Network)
  @Column
  declare fromNetworkId: number;

  @BelongsTo(() => Network)
  declare fromNetwork: Network;

  @ForeignKey(() => Network)
  @Column
  declare toNetworkId: number;

  @BelongsTo(() => Network)
  declare toNetwork: Network;

  @AllowNull(false)
  @Column
  declare sender: string;

  @AllowNull(false)
  @Column
  declare nonce: number;

  @AllowNull(false)
  @Column
  declare recipient: string;

  @AllowNull(false)
  @Column
  declare payload: string;

  @AllowNull(false)
  @Column
  declare globalNonce: number;

  @AllowNull(false)
  @Column
  declare signature: string;

  @AllowNull(false)
  @Column
  // pending, signed, boardcasted, completed, cancelled
  declare status: number;
}

export default Message;
