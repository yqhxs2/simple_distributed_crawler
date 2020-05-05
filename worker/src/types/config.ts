import { RedisOptions } from "ioredis";

interface Config {
    nginxAddress: string
    rabbitMQAddress: string,
    mongoAddress: string,
    redisConfig: RedisOptions
}

export default Config