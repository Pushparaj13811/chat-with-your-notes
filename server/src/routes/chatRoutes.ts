import { Router } from 'express';
import { 
  askQuestion, 
  getHistory, 
  getAllSessions, 
  deleteSession,
  summarizeSession,
  clearMemory,
  getSessionMemoryStats
} from '../controllers/chatController';
import { requireDeviceId, requireDeviceOwnership } from '../middleware/deviceAuth';

const router = Router();

// Routes with device authentication
router.post('/ask', requireDeviceId, askQuestion);
router.get('/history/:chatSessionId', requireDeviceId, requireDeviceOwnership('session'), getHistory);
router.get('/sessions', requireDeviceId, getAllSessions);
router.delete('/sessions/:chatSessionId', requireDeviceId, requireDeviceOwnership('session'), deleteSession);

// Memory management routes
router.post('/sessions/:chatSessionId/summarize', requireDeviceId, requireDeviceOwnership('session'), summarizeSession);
router.delete('/sessions/:chatSessionId/memory', requireDeviceId, requireDeviceOwnership('session'), clearMemory);
router.get('/sessions/:chatSessionId/memory-stats', requireDeviceId, requireDeviceOwnership('session'), getSessionMemoryStats);

export default router; 