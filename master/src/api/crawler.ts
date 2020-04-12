import Router from 'koa-router'
import {HTTPParamException} from '../exceptions/exception'

const router = new Router({
    prefix: "/crawler"
})

router.post("", async ctx => {
    const url = ctx.request.body.url
    if (!url || typeof url !== 'string') {
        throw new HTTPParamException()
    }
    await global.resourceManager.urlMQ.put(url)
   
})

export default router