import Redis from "ioredis";
import crypto from "crypto";

class BloomFilter {
    redis: Redis.Redis;
    size: number;
    bitmap: string;
    // size为bitmap的大小，单位为mb，默认为2
    constructor(redis: Redis.Redis, bitmap: string, size: number = 2) {
        this.redis = redis;
        this.size = size;
        this.bitmap = bitmap;
    }

    static initHashFuncs() {
        const md5 = crypto.createHash("md5");
        const sha256 = crypto.createHash("sha256");
        const sha1 = crypto.createHash("sha1");

        function _createHashFunc(hash: crypto.Hash) {
            return function(val: string): string {
                hash.update(val);
                return hash.digest("hex");
            };
        }
        return [_createHashFunc(md5), _createHashFunc(sha256), _createHashFunc(sha1)];
    }

    static stringToIntHash(str: string, upperbound: number) {
        let result = 0;
        for (let i = 0; i < str.length; i++) {
            result = result + str.charCodeAt(i);
        }

        if (!upperbound) upperbound = 500;

        return result % upperbound;
    }

    getOffsets(item: string): number[] {
        const offsets: number[] = [];
        const hashFuncs = BloomFilter.initHashFuncs();
        for (const hash of hashFuncs) {
            const hashVal = hash(item);
            const offset = BloomFilter.stringToIntHash(hashVal, this.size * Math.pow(2, 20));
            offsets.push(offset);
        }
        return offsets;
    }

    add(item: string) {
        const offsets: number[] = this.getOffsets(item);
        let pipeline = this.redis.pipeline();
        for (let count = 0; count < offsets.length; count++) {
            pipeline = pipeline.setbit(this.bitmap, offsets[count], 1);
        }
        return pipeline.exec();
    }

    async exist(item: string): Promise<boolean> {
        const offsets: number[] = this.getOffsets(item);
        let pipeline = this.redis.pipeline();
        for (let count = 0; count < offsets.length; count++) {
            pipeline = pipeline.getbit(this.bitmap, offsets[count]);
        }
        const res = await pipeline.exec();
        for (let count = 0; count < offsets.length; count++) {
            if (res[count][1] === 0) return false;
        }
        return true;
    }
}

export default BloomFilter;
