import { MongoConnectionManager, RedisConnectionManager } from "./db";
import { URLMessageQueue , HeartBeatDLMQ, HeartBeatMessageQueue} from "./messageQueue";
import {HeartBeatMessage, NodeType} from "../types/rabbitmq"
import EventEmitter from "events";
import tasksChain from "./tasksCahin";
import logHandler from "../exceptions/logHandler"
import logLevel from "../types/log"
import { v4 as uuidv4 } from 'uuid';
import address from "address"

class InitManager {
    static mongo: MongoConnectionManager;
    static urlMQ: URLMessageQueue;
    static workerHBMQ: HeartBeatMessageQueue;
    static heartBeatDLMQ: HeartBeatDLMQ
    static redis: RedisConnectionManager;
    static eventCenter: EventEmitter.EventEmitter;
    static uuid: string
    static ip: string


    private constructor() {}

    static async init() {
        global.resourceManager = InitManager;
        this.ip = address.ip()
        this.uuid = uuidv4()
        this.initEventCenter();
        await Promise.all([this.initDB(), this.initMQ(), this.initRedis()]);
        this.urlMQ.registerGetter()
        this.heartBeatDLMQ.registerGetter()
        
    }

    static async initDB() {
        this.mongo = await MongoConnectionManager.init();
    }

    static async initRedis() {
        this.redis = await RedisConnectionManager.init();
    }

    static async initMQ() {
        this.urlMQ = await URLMessageQueue.init("URL");
        this.workerHBMQ = await HeartBeatMessageQueue.init("workerHBMQ", {}, "workerHBMQ")
        this.heartBeatDLMQ = await HeartBeatDLMQ.init("HBDLMQ"+this.uuid)
    }

    static initEventCenter() {
        class EventCenter extends EventEmitter.EventEmitter {}
        const eventCenter = new EventCenter();
        this.eventCenter = eventCenter;
        this.eventCenter.on("newUrl", function(url) {
            tasksChain(url);
        });
        this.eventCenter.on("newHeartBeat", _ => {
            const heartBeat = new HeartBeatMessage(NodeType.worker, new Date().getTime(), this.uuid,this.ip)
            this.workerHBMQ.put(heartBeat)
        })
        this.eventCenter.on('log',function(level: logLevel, message: string, err ?:Error){
            logHandler(level, message, err)
        } )
        process.on('uncaughtException', function(err) {
            console.error("uncaughtException!")
            logHandler('ERROR', err.message,err)
        })
        // process.on('unhandledRejection', function(reason){
        //     console.error('unhandledRejection!')
        //     logHandler('ERROR',  reason!.toString())
        // })
    }
}

export default InitManager;
