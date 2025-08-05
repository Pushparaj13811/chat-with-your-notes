import { Router } from 'express';
import multer from 'multer';
import { uploadFile, getFiles, removeFile, generateFileQuestions } from '../controllers/fileController';
import { 
  uploadChunk, 
  getChunkProgress, 
  cancelChunkedUpload, 
  initializeChunkedUpload,
  chunkUpload 
} from '../controllers/chunkedUploadController';
import { requireDeviceOrUser, requireResourceOwnership } from '../middleware/auth';

const router = Router();

// Configure multer for file uploads with memory storage (for Cloudinary)
const fileFilter = (_req: any, file: any, cb: any) => {
  const allowedTypes = [
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ];
  
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only PDF, TXT, and DOCX files are allowed.'), false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(), // Use memory storage for Cloudinary
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '104857600') // 100MB default
  }
});

// Routes with device or user authentication
router.post('/upload', requireDeviceOrUser, upload.single('file') as any, uploadFile);

// Chunked upload routes
router.post('/upload-chunk', requireDeviceOrUser, chunkUpload.single('chunk') as any, uploadChunk);
router.get('/upload-progress/:chunkDirName', requireDeviceOrUser, getChunkProgress);
router.delete('/upload-cancel/:chunkDirName', requireDeviceOrUser, cancelChunkedUpload);
router.post('/upload-initialize', requireDeviceOrUser, initializeChunkedUpload);

router.get('/files', requireDeviceOrUser, getFiles);
router.delete('/files/:fileId', requireDeviceOrUser, requireResourceOwnership('file'), removeFile);
router.get('/files/:fileId/questions', requireDeviceOrUser, requireResourceOwnership('file'), generateFileQuestions);

export default router; 