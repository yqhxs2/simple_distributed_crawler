import amqp from "amqplib";
import config from "../config/index";
import { exchangeType, messageQueue, HeartBeatMessage, NodeType } from "../types/rabbitmq";
import { merge } from "lodash";
import { MQParamException } from "../exceptions/exception";
import {node} from "../types/node"

abstract class MessageQueue {
    protected static connection: amqp.Connection;
    protected static channel: amqp.Channel;
    public baseExchangeCfg: amqp.Options.AssertExchange;
    public baseQueueCfg: amqp.Options.AssertQueue;
    public basePubCfg: amqp.Options.Publish;
    public baseSubCfg: amqp.Options.Consume;

    constructor() {
        this.baseExchangeCfg = {
            durable: false
        };

        this.baseQueueCfg = {
            durable: false
        };

        this.basePubCfg = {
            persistent: false
        };
        this.baseSubCfg = {};
    }

    //   init MQ instance
    protected static async baseInit<T extends MessageQueue>(
        this: new (queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?:string) => T,
        queueName: string,
        queueCfg: amqp.Options.AssertQueue | undefined,
        routingKey: string | undefined
    ): Promise<T> {
        if (!MessageQueue.connection) {
            const connection = await amqp.connect(config.rabbitMQAddress);
            const channel = await connection.createChannel();
            MessageQueue.connection = connection;
            MessageQueue.channel = channel;
        }
        return new this(queueName, queueCfg, routingKey);
    }

    protected async initExchange<T extends messageQueue>(this: T): Promise<void> {
        await MessageQueue.channel.assertExchange(
            this.exchangeName,
            this.exchangeType,
            this.exchangeCfg
        );
    }

    protected mergeOptions<T extends messageQueue>(this: T) {
        merge(this.baseExchangeCfg, this.exchangeCfg);
        merge(this.baseQueueCfg, this.queueCfg);
        merge(this.basePubCfg, this.pubCfg);
        merge(this.baseSubCfg, this.subCfg);
    }

    protected async initQueue<T extends messageQueue>(this: T){
        const channel = MessageQueue.channel;
        await channel.assertQueue(this.queueName, this.queueCfg);
        await channel.bindQueue(this.queueName, this.exchangeName, this.routingKey !== undefined ? this.routingKey: '');
    }

    static async close(): Promise<void> {
        await this.connection.close();
        await this.channel.close();
    }

    abstract async put<T>(message: T): Promise<void>;

    abstract async registerGetter(): Promise<void>;
}

class URLMessageQueue extends MessageQueue implements messageQueue {
    public exchangeName = "URLExchange";
    public exchangeType: exchangeType = "direct";
    public exchangeCfg: amqp.Options.AssertExchange = {};
    public queueCfg: amqp.Options.AssertQueue = {};
    public pubCfg: amqp.Options.Publish = {};
    public subCfg: amqp.Options.Consume = {
        noAck: false
    };
    public queueName: string;
    public routingKey = "URL";

    constructor(queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?: string) {
        super();
        if(queueCfg){
            this.queueCfg = queueCfg
        }
        if(routingKey){
            this.routingKey = routingKey
        }
        this.mergeOptions();
        this.queueName = queueName;
    }

    // 实例化子类的入口函数
    static async init(queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?: string): Promise<URLMessageQueue> {
        const instance = await URLMessageQueue.baseInit(queueName, queueCfg, routingKey);
        await instance.initExchange();
        return instance;
    }

    async put<T>(url: T): Promise<void> {
        if (typeof url !== "string") {
            return Promise.reject({
                logLevel: "ERROR",
                message: `URL为${url},不是string类型`,
                error: new MQParamException("url必须为string类型")
            });
        }
        await this.initQueue()
        MessageQueue.channel.publish(
            this.exchangeName,
            this.routingKey,
            Buffer.from(url),
            this.pubCfg
        );
    }

    async registerGetter(): Promise<void> {
        const channel = MessageQueue.channel
        await this.initQueue()
        await channel.consume(
            this.queueName,
            urlMsg => {
                if (urlMsg) {
                    global.resourceManager.eventCenter.emit("newUrl", urlMsg.content.toString());
                    channel.ack(urlMsg);
                } else {
                    console.warn("consumer was cancelled");
                }
            },
            this.subCfg
        );
    }
}

class HeartBeatMessageQueue extends MessageQueue implements messageQueue {
    public exchangeName = "HaertBeatExchange";
    public exchangeType: exchangeType = "direct";
    public exchangeCfg: amqp.Options.AssertExchange = {};
    public queueCfg: amqp.Options.AssertQueue = {
        deadLetterExchange: "HaertBeatDLEX",
        messageTtl: 4000
    };
    public pubCfg: amqp.Options.Publish = {};
    public subCfg: amqp.Options.Consume = {
        noAck: false
    };
    public queueName: string;
    public routingKey = "HaertBeat";

    constructor(queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?:string) {
        super();
        if(queueCfg){
            this.queueCfg = queueCfg
        }
        if(routingKey){
            this.routingKey = routingKey
        }
        this.mergeOptions();
        this.queueName = queueName;
    }

    // 实例化子类的入口函数
    static async init(queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?:string): Promise<HeartBeatMessageQueue> {
        const instance = await HeartBeatMessageQueue.baseInit(queueName, queueCfg, routingKey);
        await instance.initExchange();
        return instance;
    }

    async put<T>(heartBeatMessage: T & HeartBeatMessage): Promise<void> {
        await this.initQueue()
        MessageQueue.channel.publish(
            this.exchangeName,
            this.routingKey,
            Buffer.from(JSON.stringify(heartBeatMessage)),
            this.pubCfg
        );
    }

    async registerGetter(): Promise<void> {
        const channel = MessageQueue.channel
        await this.initQueue()
        await channel.consume(
            this.queueName,
            heartBeatMsg => {
                if (heartBeatMsg) {
                    const {nodeType, uuid, ip, timestamp} = JSON.parse(heartBeatMsg.content.toString())
                    const nodeProps:node = {nodeType, uuid, ip, lastActived: timestamp} 
                    global.resourceManager.nodeTable[uuid] = nodeProps
                    channel.ack(heartBeatMsg);
                } else {
                    console.warn("consumer was cancelled");
                }
            },
            this.subCfg
        );

    }
}

class HeartBeatDLMQ extends MessageQueue implements messageQueue {
    public exchangeName = "HaertBeatDLEX";
    public exchangeType: exchangeType = "fanout";
    public exchangeCfg: amqp.Options.AssertExchange = {};
    public queueCfg: amqp.Options.AssertQueue = {};
    public pubCfg: amqp.Options.Publish = {};
    public subCfg: amqp.Options.Consume = {
        noAck: false
    };
    public queueName: string;

    constructor(queueName: string, queueCfg?: amqp.Options.AssertQueue) {
        super();
        if(queueCfg){
            this.queueCfg = queueCfg
        }
        
        this.mergeOptions();
        this.queueName = queueName;
    }

    // 实例化子类的入口函数
    static async init(queueName: string, queueCfg?: amqp.Options.AssertQueue, routingKey?: string): Promise<HeartBeatDLMQ> {
        const instance = await HeartBeatDLMQ.baseInit(queueName, queueCfg, routingKey);
        await instance.initExchange();
        return instance;
    }

    async put<T>(heartBeatMessage: T & HeartBeatMessage): Promise<void> {}

    async registerGetter(): Promise<void> {
        const channel = MessageQueue.channel
        await this.initQueue()
        await channel.consume(
            this.queueName,
            msg => {
                if (msg) {
                    global.resourceManager.eventCenter.emit("newHeartBeat", JSON.parse(msg.content.toString()));
                    channel.ack(msg);
                } else {
                    console.warn("consumer was cancelled");
                }
            },
            this.subCfg
        );
    }
}

export { URLMessageQueue, HeartBeatMessageQueue, HeartBeatDLMQ };
