import { Router } from 'express';
import {
  getQuizConfig,
  updateQuizConfig,
  initializeTeams,
  getAllTeams,
  deleteTeam,
  getAllQuestions,
  createQuestion,
  toggleQuestionStatus,
  deleteQuestion,
  setCurrentQuestion,
  getCurrentQuestionId,
  toggleShowAnswers,
  getTeamResults,
  removeTeamMember,
  updateTeamScore,
  resetAllTeamScores,
} from '../controllers/quiz.controller';
import {
  getTimerState,
  enableBidRound,
  disableBidRound,
  startMcqTimer,
  revealAnswer,
  submitBid,
} from '../controllers/mcq.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

const router = Router();

// All routes require authentication
router.use(authenticate);

// Team management and config routes - super_admin only
router.get('/config', authorize('super_admin'), getQuizConfig);
router.put('/config', authorize('super_admin'), updateQuizConfig);
router.post('/teams/initialize', authorize('super_admin'), initializeTeams);
router.get('/teams', authorize('super_admin'), getAllTeams);
router.delete('/teams/:teamId', authorize('super_admin'), deleteTeam);
router.patch('/teams/:teamId/score', authorize('super_admin'), updateTeamScore);
router.post('/teams/reset-scores', authorize('super_admin'), resetAllTeamScores);
router.delete('/team-members/:memberId', authorize('super_admin'), removeTeamMember);
router.get('/results', authorize('super_admin'), getTeamResults);

// Question management routes - both admin and super_admin
router.get('/questions', authorize('super_admin', 'admin'), getAllQuestions);
router.post('/questions', authorize('super_admin', 'admin'), createQuestion);
router.patch('/questions/:id/toggle', authorize('super_admin', 'admin'), toggleQuestionStatus);
router.delete('/questions/:id', authorize('super_admin', 'admin'), deleteQuestion);
router.post('/current-question', authorize('super_admin', 'admin'), setCurrentQuestion);
router.get('/current-question-id', authorize('super_admin', 'admin'), getCurrentQuestionId);
router.post('/toggle-show-answers', authorize('super_admin', 'admin'), toggleShowAnswers);

// MCQ Bidding routes - admin only
router.get('/mcq/:questionId/timer', authorize('super_admin', 'admin'), getTimerState);
router.post('/mcq/:questionId/enable-bid-round', authorize('super_admin', 'admin'), enableBidRound);
router.post('/mcq/:questionId/disable-bid-round', authorize('super_admin', 'admin'), disableBidRound);
router.post('/mcq/:questionId/start-timer', authorize('super_admin', 'admin'), startMcqTimer);
router.post('/mcq/:questionId/reveal-answer', authorize('super_admin', 'admin'), revealAnswer);

export default router;
