import { createClient } from "redis";

const redisClient = createClient();
await redisClient.connect();

export async function isIdemKeyInCache(key: string): Promise<boolean> {
    return (await redisClient.exists(key)) === 1;
}

export async function putIdemKeyForJobId(key: string, jobId: number) {
    await redisClient.set(key, jobId);
}

export async function getJobIdOfIdemKey(key: string): Promise<number | null> {
    if (!isIdemKeyInCache(key)) return null;
    const value = await redisClient.get(key);
    return Number(value!);
}
