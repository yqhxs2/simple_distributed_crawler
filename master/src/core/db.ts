import mongoose from "mongoose";
import Redis from "ioredis";
import config from "../config/index";
import { merge } from "lodash";

class MongoConnectionManager {
    connection: mongoose.Connection;

    static baseConnectionOpt: mongoose.ConnectionOptions = {
        useNewUrlParser: true,
        useUnifiedTopology: true
    };

    Models: Map<string, mongoose.Model<mongoose.Document>>;

    private constructor(conn: mongoose.Connection) {
        this.connection = conn;
        this.Models = new Map();

        this.addModel(
            "Html",
            new mongoose.Schema({
                url: String,
                text: String
            })
        );
    }

    static async init(
        uri: string = config.mongoAddress,
        connectionOpt: mongoose.ConnectionOptions = {}
    ) {
        const connOpt = merge(this.baseConnectionOpt, connectionOpt);
        const conn = await mongoose.createConnection(uri, connOpt);
        return new this(conn);
    }

    addModel(name: string, schema: mongoose.Schema) {
        const Model = this.connection.model(name, schema);
        this.Models.set(name, Model);
    }
}

class RedisConnectionManager {
    connection: Redis.Redis;

    private constructor(conn: Redis.Redis) {
        this.connection = conn;
    }

    static async init() {
        const redis = new Redis(config.redisConfig);
        await redis.connect();
        return new this(redis);
    }
}

export { MongoConnectionManager, RedisConnectionManager };
