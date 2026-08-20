import express, { type Express, type Request, type Response } from 'express';
import multer from 'multer';

// Initialize upload middleware
const storage = multer.diskStorage({
  destination: './tmp-logs/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
const upload = multer({ storage: storage });

const app: Express = express();
app.use(express.json())
app.use(express.urlencoded({ extended: true }));

app.get('/', (req: Request, res: Response) => {
  res.send('Hello World!');
});

app.post('/logs', upload.single('logfile'), uploadLog);
function uploadLog(req: Request, res: Response) {
  if (!req.file) {
    return res.send('No file uploaded.');
  }
  res.send(`File uploaded: ${req.file.filename}`);
}


app.listen(3000, () => { console.log("Express server listening at port 3000...") });