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
import { requireDeviceOrUser, requireResourceOwnership } from '../middleware/auth';

const router = Router();

// Routes with device or user authentication
router.post('/ask', requireDeviceOrUser, askQuestion);
router.get('/history/:chatSessionId', requireDeviceOrUser, requireResourceOwnership('chatSession'), getHistory);
router.get('/sessions', requireDeviceOrUser, getAllSessions);
router.delete('/sessions/:chatSessionId', requireDeviceOrUser, requireResourceOwnership('chatSession'), deleteSession);

// Memory management routes
router.post('/sessions/:chatSessionId/summarize', requireDeviceOrUser, requireResourceOwnership('chatSession'), summarizeSession);
router.delete('/sessions/:chatSessionId/memory', requireDeviceOrUser, requireResourceOwnership('chatSession'), clearMemory);
router.get('/sessions/:chatSessionId/memory-stats', requireDeviceOrUser, requireResourceOwnership('chatSession'), getSessionMemoryStats);

export default router; 