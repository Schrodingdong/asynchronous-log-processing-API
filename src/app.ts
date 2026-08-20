import express, { type Express, type Request, type Response } from 'express';
import multer from 'multer';
import minioClient from './clients/minioClient';
import fs from 'node:fs'
import { prisma } from './clients/prisma';
import { addJob } from './queue';
import { initializeWorkers } from './workers';
import { getJobIdOfIdemKey, isIdemKeyInCache, putIdemKeyForJobId } from './clients/redis';

// Express setup
const app: Express = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

// Upload middleware setup
const storage = multer.diskStorage({
  destination: './tmp-logs/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

// Initialize workers
initializeWorkers();



const LOG_BUCKET = 'logs';

app.post('/logs', upload.single('logfile'), uploadLog);
async function uploadLog(req: Request, res: Response) {
  const idemKey = req.headers["x-idempotency-key"] as string;
  if (!idemKey) {
    return res.status(400).json({ error: "Missing X-Idempotency-Key header." });
  }
  if (await isIdemKeyInCache(idemKey)) {
    const jobId = await getJobIdOfIdemKey(idemKey);
    if (!jobId) return res.status(500).json({
      error: `Job id of the associated idempotency key is ${jobId}`
    });
    const job = await prisma.processingJob.findFirst({
      where: {
        id: jobId
      }
    })
    res.send({ job });
    return;
  }
  await putIdemKeyForJobId(idemKey, -1);

  const logfile = req.file;
  if (!logfile) return res.send('No file uploaded.');

  try {
    // Save in minio
    if (! await minioClient.bucketExists(LOG_BUCKET)) {
      await minioClient.makeBucket(LOG_BUCKET);
    }
    await minioClient.fPutObject(LOG_BUCKET, logfile.filename, logfile.path);

    // Clear in local tmp
    fs.unlink(logfile.path, (err) => {
      if (err) {
        console.error(`Error deleting file: ${err.message}`);
        return;
      }
      console.log('Tmp file deleted successfully');
    });
  } catch (e) {
    console.error(e)
    res.send("Error: " + e);
  }

  // State of processing == Pending
  const job = await prisma.processingJob.create({
    data: {
      status: "PENDING",
      statistics: {},
      logPath: `${LOG_BUCKET}/${logfile.filename}`
    }
  })
  await addJob(job)
  await putIdemKeyForJobId(idemKey, job.id);

  res.send({ job });
}

app.get('/jobs', getJobs);
async function getJobs(req: Request, res: Response) {
  res.send(await prisma.processingJob.findMany())
}


app.listen(3000, () => {
  console.log("Express server listening at port 3000...");
});