import { Sequelize } from "sequelize-typescript";
import Message from "./models/Message.model";
import Network from "./models/Network.model";
import Peer from "./models/Peer.model";
import env from "./env";

class DB {
  private static instance: DB;
  private readonly sequelize: Sequelize;
  private readonly models;

  private constructor() {
    this.models = [Message, Network, Peer];
    this.sequelize = new Sequelize({
      database: env.DB_DATABASE,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,

      dialect: "postgres",
      host: env.DB_HOST,
      port: env.DB_PORT,
      models: [__dirname + "/models/*.model.ts"],
      logging: env.DB_LOGGING,
    });
    this.sequelize.addModels(this.models);
  }

  public static getInstance(): DB {
    if (!DB.instance) {
      DB.instance = new DB();
    }
    return DB.instance;
  }

  public async sync() {
    for (const model of this.models) {
      await model.sync({
        alter: false,
      });
    }
  }
}

export default DB.getInstance();
export { Message, Network, Peer };
