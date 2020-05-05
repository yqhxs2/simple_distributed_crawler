import { MongoConnectionManager, RedisConnectionManager } from "./db";
import { URLMessageQueue } from "./messageQueue";
import EventEmitter from "events";
import tasksChain from "./tasksCahin";
import logHandler from "../exceptions/logHandler"
import logLevel from "../types/log"

class InitManager {
    static mongo: MongoConnectionManager;
    static urlMQ: URLMessageQueue;
    static redis: RedisConnectionManager;
    static eventCenter: EventEmitter.EventEmitter;

    private constructor() {}

    static async init() {
        global.resourceManager = InitManager;
        this.initEventCenter();
        await Promise.all([this.initDB(), this.initMQ(), this.initRedis()]);
        this.urlMQ.registerGetter()
        
    }

    static async initDB() {
        this.mongo = await MongoConnectionManager.init();
    }

    static async initRedis() {
        this.redis = await RedisConnectionManager.init();
    }

    static async initMQ() {
        this.urlMQ = await URLMessageQueue.init("URL");
    }

    static initEventCenter() {
        class EventCenter extends EventEmitter.EventEmitter {}
        const eventCenter = new EventCenter();
        this.eventCenter = eventCenter;
        this.eventCenter.on("newUrl", function(url) {
            tasksChain(url);
        });
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
