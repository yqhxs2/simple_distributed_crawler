import Koa from "koa";
import InitManager from "./core/init";
import bodyParser from "koa-bodyparser"
import exceptionHandler from "./middleware/exceptionEmitter"

async function main() {
    process.env.NODE_ENV = 'dev'
    try {
        await InitManager.init();
    }catch(e) {
        global.resourceManager.eventCenter.emit('log','ERROR','初始化过程出错',e )
    }
    const app = new Koa();
    app.use(exceptionHandler)
    app.use(bodyParser())
    for (const router of InitManager.routers){
        app.use(router.routes()).use(router.allowedMethods())
    }
    app.listen(3000);
}
main()