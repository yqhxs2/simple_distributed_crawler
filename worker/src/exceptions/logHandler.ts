import logLevel from "../types/log";

export default function logHandler(level: logLevel, message: string, err?: Error) {
    if (process.env.NODE_ENV === "dev") {
        switch (level) {
            case "ERROR":
                console.error(message);
                break;
            case "WARN":
                console.warn(message);
                break;
            case "INFO":
                console.info(message);
                break;
            case "DEBUG":
                console.debug(message);
        }
    } else {
        // 写入日志文件
    }
}
