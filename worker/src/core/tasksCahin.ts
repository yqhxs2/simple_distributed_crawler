import BloomFilter from "../lib/bloom-filter";
import { getHtml, collectUrl } from "./crawler";
import { HtmlModel } from "../models/html";

let bloom: BloomFilter | null = null;

async function tasksChain(url: string) {
    try {
        if (!bloom) {
            bloom = new BloomFilter(global.resourceManager.redis.connection, "url");
        }
        const ifExisted = await bloom.exist(url);
        if (!ifExisted) {
            await Promise.all([
                getHtml(url) 
                    .then((html: string) => {
                        const urls = collectUrl(html);
                        return Promise.resolve({ urls, html });
                    })
                    .then(({ urls, html }) => {
                        const promises: Promise<any>[] = urls.map(url => {
                            return global.resourceManager.urlMQ.put(url);
                        });
                        promises.push(HtmlModel.insert(global.resourceManager.mongo, url, html));
                        return Promise.all(promises);
                    }),
                bloom.add(url)
            ]);
        }
    } catch (reason) {
        if (reason.logLevel) {
            global.resourceManager.eventCenter.emit("log", reason.message, reason.error);
        } else {
            global.resourceManager.eventCenter.emit(
                "log",
                "ERROR",
                `TASKSCHAIN:${reason.message}`,
                reason
            );
        }
    }
}

export default tasksChain;
