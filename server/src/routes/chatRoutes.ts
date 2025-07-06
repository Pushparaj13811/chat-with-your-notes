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

const router = Router();

// Routes
router.post('/ask', askQuestion);
router.get('/history/:chatSessionId', getHistory);
router.get('/sessions', getAllSessions);
router.delete('/sessions/:chatSessionId', deleteSession);

// Memory management routes
router.post('/sessions/:chatSessionId/summarize', summarizeSession);
router.delete('/sessions/:chatSessionId/memory', clearMemory);
router.get('/sessions/:chatSessionId/memory-stats', getSessionMemoryStats);

export default router; 