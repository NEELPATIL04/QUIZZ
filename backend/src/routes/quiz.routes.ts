import { Router } from 'express';
import {
  getQuizConfig,
  updateQuizConfig,
  initializeTeams,
  getAllTeams,
  deleteTeam,
  getAllQuestions,
  createQuestion,
  updateQuestion,
  toggleQuestionStatus,
  deleteQuestion,
  setCurrentQuestion,
  getCurrentQuestionId,
  toggleShowAnswers,
  getTeamResults,
  removeTeamMember,
  updateTeamScore,
  resetAllTeamScores,
  resetQuestion,
  getQuestionResults,
  updateTeamAnswerScore,
  toggleScoreboard,
  validateTeamScores,
  getBidRoundAnalytics,
  toggleBidResults,
  reorderQuestions,
  convertQuestionToBid,
  convertQuestionToNormal,
  toggleQuestionFlag,
} from '../controllers/quiz.controller';
import {
  getTimerState,
  enableBidRound,
  disableBidRound,
  disableBidMode,
  startMcqTimer,
  revealAnswer,
  submitBid,
} from '../controllers/mcq.controller';
import { authenticate, authorize } from '../middlewares/auth.middleware';

import multer from 'multer';
import path from 'path';
import fs from 'fs';

// Configure Multer for image uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = 'public/images';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ storage: storage });

const router = Router();

// All routes require authentication
router.use(authenticate);

router.post('/upload', authorize('super_admin', 'admin'), upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }
  // Return the accessible URL
  const fileUrl = `/images/${req.file.filename}`;
  res.json({ url: fileUrl });
});

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
router.post('/scoreboard/toggle', authorize('super_admin', 'admin'), toggleScoreboard);
router.post('/scores/validate', authorize('super_admin', 'admin'), validateTeamScores);
router.post('/scoreboard/toggle-bid-results', authorize('super_admin', 'admin'), toggleBidResults);
router.get('/analytics/bid-round', authorize('super_admin', 'admin'), getBidRoundAnalytics);

// Question management routes - both admin and super_admin
router.get('/questions', authorize('super_admin', 'admin'), getAllQuestions);
router.post('/questions', authorize('super_admin', 'admin'), createQuestion);
router.put('/questions/:id', authorize('super_admin', 'admin'), updateQuestion);
router.patch('/questions/:id/toggle', authorize('super_admin', 'admin'), toggleQuestionStatus);
router.post('/questions/:questionId/flag', authorize('super_admin', 'admin'), toggleQuestionFlag); // Added route
router.delete('/questions/:id', authorize('super_admin', 'admin'), deleteQuestion);
router.post('/current-question', authorize('super_admin', 'admin'), setCurrentQuestion);
router.get('/current-question-id', authorize('super_admin', 'admin'), getCurrentQuestionId);
router.post('/toggle-show-answers', authorize('super_admin', 'admin'), toggleShowAnswers);
router.post('/questions/:id/reset', authorize('super_admin', 'admin'), resetQuestion);
router.get('/questions/:id/results', authorize('super_admin', 'admin'), getQuestionResults);
router.patch('/team-answers/:answerId/score', authorize('super_admin', 'admin'), updateTeamAnswerScore);
router.post('/questions/reorder', authorize('super_admin', 'admin'), reorderQuestions);
router.post('/questions/:id/convert-to-bid', authorize('super_admin', 'admin'), convertQuestionToBid);
router.post('/questions/:id/convert-to-normal', authorize('super_admin', 'admin'), convertQuestionToNormal);

// MCQ Bidding routes - admin only
router.get('/mcq/:questionId/timer', authorize('super_admin', 'admin'), getTimerState);
router.post('/mcq/:questionId/enable-bid-round', authorize('super_admin', 'admin'), enableBidRound);
router.post('/mcq/disable-global-mode', authorize('super_admin', 'admin'), disableBidMode);
router.post('/mcq/:questionId/disable-bid-round', authorize('super_admin', 'admin'), disableBidRound); // Keep old one for specific question reset if needed
router.post('/mcq/:questionId/start-timer', authorize('super_admin', 'admin'), startMcqTimer);
router.post('/mcq/:questionId/reveal-answer', authorize('super_admin', 'admin'), revealAnswer);

export default router;
