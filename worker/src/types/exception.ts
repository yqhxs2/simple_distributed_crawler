interface BaseException{
    errMsg: string
    errCode: number
}

interface MQException extends BaseException{}

interface HTTPException extends BaseException{
    httpCode: number,
    httpStatusText: string
}


export {
    MQException,
    HTTPException
}