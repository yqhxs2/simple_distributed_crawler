import amqp from "amqplib";
import config from "../config/index";
import exchangeType from "../types/rabbitmq";
import { merge } from "lodash";
import { MQParamException } from "../exceptions/exception";

abstract class MessageQueue {
    protected static connection: amqp.Connection;
    protected static channel: amqp.Channel;
    protected baseExchangeCfg: amqp.Options.AssertExchange;
    protected baseQueueCfg: amqp.Options.AssertQueue;
    protected basePubCfg: amqp.Options.Publish;
    protected baseSubCfg: amqp.Options.Consume;

    constructor() {
        this.baseExchangeCfg = {
            durable: true
        };

        this.baseQueueCfg = {
            durable: true
        };

        this.basePubCfg = {
            persistent: true
        };
        this.baseSubCfg = {};
    }

    //   init MQ instance
    protected static async baseInit<T extends MessageQueue>(
        this: new (queueName: string) => T,
        queueName: string
    ): Promise<T> {
        if (!MessageQueue.connection) {
            const connection = await amqp.connect(config.rabbitMQAddress);
            const channel = await connection.createChannel();
            MessageQueue.connection = connection;
            MessageQueue.channel = channel;
        }
        return new this(queueName);
    }

    static async close(): Promise<void> {
        await this.connection.close();
        await this.channel.close();
    }

    abstract async put<T>(message: T): Promise<void>;

    abstract async registerGetter(): Promise<void>;
}

class URLMessageQueue extends MessageQueue {
    private exchangeName = "URLExchange";
    private exchangeType: exchangeType = "direct";
    private exchangeCfg: amqp.Options.AssertExchange = {};
    private queueCfg: amqp.Options.AssertQueue = {};
    private pubCfg: amqp.Options.Publish = {};
    private subCfg: amqp.Options.Consume = {
        noAck: false
    };
    private queueName: string;
    private routingKey = "URL";

    constructor(queueName: string) {
        super();
        merge(this.baseExchangeCfg, this.exchangeCfg);
        merge(this.baseQueueCfg, this.queueCfg);
        merge(this.basePubCfg, this.pubCfg);
        merge(this.baseSubCfg, this.subCfg);
        this.queueName = queueName;
    }

    private async initExchange(this: URLMessageQueue): Promise<void> {
        await MessageQueue.channel.assertExchange(
            this.exchangeName,
            this.exchangeType,
            this.exchangeCfg
        );
    }

    // 实例化子类的入口函数
    static async init(queueName: string): Promise<URLMessageQueue> {
        const instance = await URLMessageQueue.baseInit(queueName);
        await instance.initExchange();
        return instance;
    }

    async put<T>(url: T): Promise<void> {
        if (typeof url !== "string") {

            return Promise.reject({
              logLevel: 'ERROR',
              message: `URL为${url},不是string类型`,
              error: new MQParamException('url必须为string类型')
            })
        }
        await MessageQueue.channel.assertQueue(this.queueName, this.queueCfg);
        MessageQueue.channel.publish(
            this.exchangeName,
            this.routingKey,
            Buffer.from(url),
            this.pubCfg
        );
    }

    async registerGetter(): Promise<void> {
        const channel = MessageQueue.channel;
        await channel.assertQueue(this.queueName, this.queueCfg);
        await channel.bindQueue(this.queueName, this.exchangeName, this.routingKey);
        await channel.consume(
            this.queueName,
            msg => {
                if (msg) {
                    global.resourceManager.eventCenter.emit("newUrl", msg.content.toString());
                    channel.ack(msg);
                } else {
                    console.warn("consumer was cancelled");
                }
            },
            this.subCfg
        );
    }
}

export { URLMessageQueue };
