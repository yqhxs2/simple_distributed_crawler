import { MQException as MQExp, HTTPException as HTTPExp } from "../types/exception";

class MQException extends Error implements MQExp {
    constructor(public errMsg = "RabbitMQ 错误", public errCode = 20000) {
        super();
    }
}

class MQParamException extends MQException {
    constructor(errMsg = "RabbitMQ 参数错误", errCode = 20001) {
        super(errMsg, errCode);
    }
}

class HTTPException extends Error implements HTTPExp {
    constructor(
        public errMsg = "服务器错误",
        public errCode = 10000,
        public httpCode = 500,
        public httpStatusText = "服务器错误"
    ) {
        super();
    }
}

class HTTPParamException extends HTTPException {
    constructor(
        errMsg = "请求参数错误",
        errCode = 10001,
        httpCode = 400,
        httpStatusText = "Bad Request"
    ) {
        super(errMsg, errCode, httpCode, httpStatusText);
    }
}

class CrawlerException extends HTTPException {
    constructor(errMsg = "爬虫错误", errCode = 10002, httpCode: number, httpStatusText: string) {
        super(errMsg, errCode, httpCode, httpStatusText);
    }
}

export { MQException, MQParamException, HTTPException, CrawlerException, HTTPParamException };
