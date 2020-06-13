import Config from '../types/config'

const config:Config = {
    rabbitMQAddress: "amqp://127.0.0.1:5672",
    mongoAddress: "mongodb://localhost/crawler",
    redisConfig: {
        port:  6379,
        host: "127.0.0.1",
        lazyConnect: true
    },
    heartBeatInterval: 4000,
    updateNodeInterval: 16000
}

export default config