import { MongoConnectionManager, RedisConnectionManager } from "../core/db";
import { URLMessageQueue, HeartBeatDLMQ, HeartBeatMessageQueue } from "../core/messageQueue";
import EventEmitter from "events";
import {nodeTable} from "./node"

declare global {
    namespace NodeJS {
        interface Global {
            resourceManager: {
                mongo: MongoConnectionManager;
                urlMQ: URLMessageQueue;
                masterHBMQ: HeartBeatMessageQueue;
                workerHBMQ: HeartBeatMessageQueue;
                heartBeatDLMQ: HeartBeatDLMQ;
                redis: RedisConnectionManager;
                eventCenter: EventEmitter.EventEmitter;
                uuid: string;
                ip: string;
                nodeTable: nodeTable
            };
        }
    }
}

export default global;
