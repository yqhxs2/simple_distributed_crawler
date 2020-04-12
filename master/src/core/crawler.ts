import axios from "axios";
import { CrawlerException } from "../exceptions/exception";
import cheerio from "cheerio";

async function getHtml(url: string): Promise<string>{
    const res = await axios.get(url);
    if (res.status === 200) {
        const html: string = res.data;
        return html;
    } else {
        return Promise.reject({
            logLevel: "ERROR",
            message: "爬虫错误",
            error: new CrawlerException(undefined, undefined, res.status, res.statusText)
        });
    }
}

// function getBigFile(url: string) {}

function collectUrl(html: string): string[] {
    
    const $ = cheerio.load(html);
    const urls: string[] = [];
    $("a").each((_, el) => {
        urls.push(el.attribs.href);
    });
    return urls;

}

export {
    getHtml,
    collectUrl
    // getBigFile
};
