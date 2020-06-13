import { RedisOptions } from "ioredis";

interface Config {
    rabbitMQAddress: string,
    mongoAddress: string,
    redisConfig: RedisOptions,
    heartBeatInterval: number,
    updateNodeInterval: number
}

export default Config