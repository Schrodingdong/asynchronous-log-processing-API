import express, { type Express, type Request, type Response } from 'express';
import { initializeWorkers } from './workers';
import { getJobs, uploadLog } from './service/logService';
import { login, register } from './service/authService';
import { initializeObjectStorage } from './clients/minioClient';
import { jwtValidation } from './middleware/authMiddleware';
import { uploadMiddleware } from './middleware/fileUploadMiddleware';
import { idempotencyMiddleware } from './middleware/idempotencyMiddleware';

// --- Initial setup ---
// Express
const app: Express = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));
// Workers
initializeWorkers();
initializeObjectStorage();

// API paths
app.post('/auth/login', login)
app.post('/auth/register', register)
app.post('/logs',
  jwtValidation,
  idempotencyMiddleware,
  uploadMiddleware.single('logfile'),
  uploadLog);
app.get('/jobs',
  jwtValidation,
  getJobs);

app.listen(3000, () => {
  console.log("Express server listening at port 3000...");
});
