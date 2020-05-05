import InitManager from "./core/init";

async function main() {
    process.env.NODE_ENV = "dev";
    try {
        await InitManager.init();
    } catch (e) {
        global.resourceManager.eventCenter.emit("log", "ERROR", "init error", e);
    }
}
main();
