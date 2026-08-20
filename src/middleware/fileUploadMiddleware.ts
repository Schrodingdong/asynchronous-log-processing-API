import multer from 'multer';

const storage = multer.diskStorage({
  destination: './tmp-logs/',
  filename: (req, file, cb) => {
    cb(null, Date.now() + '-' + file.originalname);
  }
});
export const uploadMiddleware = multer({ storage: storage });
