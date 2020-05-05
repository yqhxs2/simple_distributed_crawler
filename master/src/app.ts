import Koa from "koa";
import InitManager from "./core/init";
import bodyParser from "koa-bodyparser"
import exceptionHandler from "./middleware/exceptionEmitter"

async function main() {
    process.env.NODE_ENV = 'dev'
    try {
        await InitManager.init();
    }catch(e) {
        global.resourceManager.eventCenter.emit('log','ERROR','init error',e )
    }
    const port = process.argv[2] ? parseInt(process.argv[2],10) : 3000
    if (port < 3000 || port > 65535){
        throw new Error('invalid port')
    }
    const app = new Koa();
    app.use(exceptionHandler)
    app.use(bodyParser())
    for (const router of InitManager.routers){
        app.use(router.routes()).use(router.allowedMethods())
    }
    app.listen(port, () => {
        console.log(`server is listening at port ${port}`)
    });
}
main()