import amqp from "amqplib";
import {NodeType} from "./node"


enum MessageSignal {
    kill
}

type exchangeType = "direct" | "fanout" | "topic";

interface messageQueue {
    baseExchangeCfg: amqp.Options.AssertExchange;
    baseQueueCfg: amqp.Options.AssertQueue;
    basePubCfg: amqp.Options.Publish;
    baseSubCfg: amqp.Options.Consume;
    exchangeName: string;
    exchangeType: exchangeType;
    exchangeCfg: amqp.Options.AssertExchange;
    queueCfg: amqp.Options.AssertQueue;
    pubCfg: amqp.Options.Publish;
    subCfg: amqp.Options.Consume;
    queueName: string;
    routingKey?: string;
}

class HeartBeatMessage {
    nodeType: NodeType;
    timestamp: number;
    uuid: string
    ip : string
    signal ?: MessageSignal

    constructor(nodeType = NodeType.worker, timestamp:number, uuid: string, ip:string){
        this.nodeType = nodeType;
        this.timestamp = timestamp;
        this.uuid = uuid
        this.ip = ip
    }
}

export { exchangeType, messageQueue, HeartBeatMessage, NodeType };
