import {
  Table,
  Column,
  Model,
  Unique,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import Network from "./Network.model";

@Table
class Peer extends Model {
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

  @Unique
  @Column
  declare name: string;

  @Column
  declare uri: string;

  @Column
  declare enabled: number;
}

export default Peer;
