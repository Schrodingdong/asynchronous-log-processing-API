import { Job, Worker } from 'bullmq';
import { QUEUE_NAME } from './queue';
import IORedis from 'ioredis';
import { LogError, Prisma, ProcessingJob } from '../generated/prisma/client';
import minioClient from './clients/minioClient';
import { prisma } from './clients/prisma';

const connection = new IORedis({ maxRetriesPerRequest: null });

const WORKER_COUNT = 5;
const workers = [];

export function initializeWorkers() {
    for (let i = 0; i < WORKER_COUNT; i++) {
        const worker = new Worker(QUEUE_NAME, handleJob, { connection });
        workers.push(worker);
    }
}

async function handleJob(job: Job) {
    const j = job.data as ProcessingJob;
    await prisma.processingJob.update({
        where: { id: j.id },
        data: { status: "INITIALIZING" },
    })
    const [bucket, filename] = j.logPath.split('/');
    const logfile = await minioClient.getObject(bucket, filename)

    // Read file
    const chunks: Buffer[] = []
    for await (const chunk of logfile) {
        chunks.push(Buffer.from(chunk));
    }
    const text = Buffer.concat(chunks).toString('utf-8');

    await prisma.processingJob.update({
        where: { id: j.id },
        data: { status: "PROCESSING" },
    })

    const stats: Statistics = { errors: 0, totalLines: 0, warnings: 0 };
    const errors: Omit<LogError, 'id' | 'jobId'>[] = [];
    try {
        const regex = /^(\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d+Z)\s+(\w+)\s+\[([^\]]+)\]\s+([\s\S]*?)(?=^\d{4}-\d{2}-\d{2}T|\s*$)/gm;
        for (const match of text.matchAll(regex)) {
            const timestamp = match[1];
            const status = match[2];
            const msg = match[4].trim();
            stats.totalLines++;
            if (status === "ERROR") {
                stats.errors++;
                errors.push({ message: msg, timestamp: new Date(timestamp) })
            };
            if (status === "WARN") stats.warnings++;
        }
        await prisma.processingJob.update({
            where: {
                id: j.id
            },
            data: {
                statistics: stats as any,
                errors: {
                    createMany: {
                        data: errors
                    }
                },
                status: "COMPLETED"
            }
        })
    } catch (e) {
        await prisma.processingJob.update({
            where: {
                id: j.id
            },
            data: {
                status: "ERROR"
            }
        })
    }
    console.log(`Processing job of id ${j.id} finished`)
}
