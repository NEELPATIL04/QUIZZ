import { Router } from 'express';
import {
  getPublicTeams,
  getTeamMembers,
  getEnabledQuestions,
  submitAnswer,
  getTeamAnswers,
  getCurrentQuestion,
  joinTeam,
  getPublicScoreboard,
} from '../controllers/team.controller';
import { getQuizConfig, getPublicBidAnalytics } from '../controllers/quiz.controller';
import { submitBid, getTimerState, getMcqResults } from '../controllers/mcq.controller';

const router = Router();

// Public routes - no authentication required
router.get('/teams', getPublicTeams);
router.get('/teams/:teamNumber/members', getTeamMembers);
router.post('/teams/join', joinTeam);
router.get('/questions/enabled', getEnabledQuestions);
router.get('/questions/current', getCurrentQuestion);
router.get('/config', getQuizConfig as any); // Public access to quiz config for presenter
router.post('/answers', submitAnswer);
router.get('/teams/:teamNumber/answers', getTeamAnswers);
router.get('/scoreboard', getPublicScoreboard);

// MCQ Bidding routes - public
router.post('/mcq/bid', submitBid);
router.get('/mcq/:questionId/timer', getTimerState as any);
router.get('/mcq/:questionId/results', getMcqResults);
router.get('/analytics/bid-round', getPublicBidAnalytics);

export default router;
