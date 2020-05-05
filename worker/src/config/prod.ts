import Config from '../types/config'

const config:Config = {
    nginxAddress: "127.0.0.1:80",
    rabbitMQAddress: "amqp://127.0.0.1:5672",
    mongoAddress: "mongodb://localhost/crawler",
    redisConfig: {
        port:  6379,
        host: "127.0.0.1",
        lazyConnect: true
    }
}

export default config