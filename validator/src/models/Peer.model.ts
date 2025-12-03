import {
  Table,
  Column,
  Model,
  Unique,
  ForeignKey,
  BelongsTo,
} from "sequelize-typescript";
import { Op } from "sequelize";
import env from "../env";
import Network from "./Network.model";

@Table
class Peer extends Model {
  // Peers work in both directions
  // fromNetworkId is always smaller than toNetworkId
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

  @Column
  declare name: string;

  @Column
  declare uri: string;

  @Column
  declare enabled: boolean;

  static getPeers(networkId1: number, networkId2?: number) {
    if (!networkId2)
      return Peer.findAll({
        where: {
          [Op.or]: [{ fromNetworkId: networkId1 }, { toNetworkId: networkId1 }],
          name: {
            [Op.not]: env.NAME,
          },
        },
      });

    if (networkId1 < networkId2)
      return Peer.findAll({
        where: {
          fromNetworkId: networkId1,
          toNetworkId: networkId2,
          name: {
            [Op.not]: env.NAME,
          },
        },
      });

    return Peer.findAll({
      where: {
        fromNetworkId: networkId2,
        toNetworkId: networkId1,
        name: {
          [Op.not]: env.NAME,
        },
      },
    });
  }
}

export default Peer;
