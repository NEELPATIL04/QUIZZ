import { Router } from 'express';
import { joinAsPresenter, getCurrentQuestion } from '../controllers/presenter.controller';

const router = Router();

// Public routes (no authentication required)
router.post('/join', joinAsPresenter);
router.get('/current-question', getCurrentQuestion);

export default router;
