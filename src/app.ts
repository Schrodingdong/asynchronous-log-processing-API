import express, { type Express, type Request, type Response } from 'express';
import multer from 'multer';
import minioClient from './minioClient';
import fs from 'node:fs'
import { prisma } from './prisma';

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

const LOG_BUCKET = 'logs';

app.post('/logs', upload.single('logfile'), uploadLog);
async function uploadLog(req: Request, res: Response) {
  const logfile = req.file;
  if (!logfile) return res.send('No file uploaded.');


  // Save in minio
  try {
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
  await prisma.processingJob.create({
    data: {
      status: "PENDING",
      statistics: {}
    }
  })

  // Send in a queue for processing


  res.send(`File uploaded: ${logfile.filename}`);
}

app.get('/jobs', getJobs);
async function getJobs(req: Request, res: Response) {
  res.send(await prisma.processingJob.findMany())
}


app.listen(3000, () => {
  console.log("Express server listening at port 3000...");
});