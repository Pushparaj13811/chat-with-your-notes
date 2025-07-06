import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { uploadFile, getFiles, removeFile, generateFileQuestions } from '../controllers/fileController';
import { 
  uploadChunk, 
  getChunkProgress, 
  cancelChunkedUpload, 
  initializeChunkedUpload,
  chunkUpload 
} from '../controllers/chunkedUploadController';
import { requireDeviceId, requireDeviceOwnership } from '../middleware/deviceAuth';

const router = Router();

// Ensure uploads directory exists
const uploadsDir = process.env.UPLOAD_DIR || './uploads';

async function ensureUploadsDir() {
  try {
    await fs.access(uploadsDir);
  } catch {
    await fs.mkdir(uploadsDir, { recursive: true });
  }
}

ensureUploadsDir();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    await ensureUploadsDir();
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    cb(null, file.fieldname + '-' + uniqueSuffix + ext);
  }
});

const fileFilter = (req: any, file: any, cb: any) => {
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
  storage,
  fileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE || '10485760') // 10MB default
  }
});

// Routes with device authentication
router.post('/upload', requireDeviceId, upload.single('file') as any, uploadFile);

// Chunked upload routes
router.post('/upload-chunk', requireDeviceId, chunkUpload.single('chunk') as any, uploadChunk);
router.get('/upload-progress/:chunkDirName', requireDeviceId, getChunkProgress);
router.delete('/upload-cancel/:chunkDirName', requireDeviceId, cancelChunkedUpload);
router.post('/upload-initialize', requireDeviceId, initializeChunkedUpload);

router.get('/files', requireDeviceId, getFiles);
router.delete('/files/:fileId', requireDeviceId, requireDeviceOwnership('file'), removeFile);
router.get('/files/:fileId/questions', requireDeviceId, requireDeviceOwnership('file'), generateFileQuestions);

export default router; 