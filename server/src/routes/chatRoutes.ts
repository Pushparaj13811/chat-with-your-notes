import { Router } from 'express';
import { askQuestion, getHistory, getAllSessions, deleteSession } from '../controllers/chatController';

const router = Router();

// Routes
router.post('/ask', askQuestion);
router.get('/history/:chatSessionId', getHistory);
router.get('/sessions', getAllSessions);
router.delete('/sessions/:chatSessionId', deleteSession);

export default router; 