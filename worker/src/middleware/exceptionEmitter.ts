import { MQException, HTTPException } from "../exceptions/exception";
import {Context} from 'koa'

export default async function expHandler(ctx: Context, next: () => Promise<any>) {
    try {
        await next();
    } catch (e) {
        const isMQExp = e instanceof MQException;
        const isHTTPExp = e instanceof HTTPException;
        if (isMQExp) {
            ctx.status = 500;
            ctx.body = {
                msg: (e as MQException).errMsg
            };
            global.resourceManager.eventCenter.emit('error', e)
        } else if (isHTTPExp) {
            ctx.status = (e as HTTPException).httpCode;
            ctx.body = {
                msg: (e as HTTPException).errMsg,
                statusText: (e as HTTPException).httpStatusText
            };
            global.resourceManager.eventCenter.emit('error', e)
        } else {
            ctx.status = 500;
            ctx.body = {
                msg: "服务器异常"
            };
            global.resourceManager.eventCenter.emit('error', e)
        }
    }
}
