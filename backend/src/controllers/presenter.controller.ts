import { Request, Response } from 'express';
import { db } from '../db';
import { presenters, quizConfig, questions, mcqBids, mcqTimerState, teams } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Join as presenter (public - no auth)
export const joinAsPresenter = async (req: Request, res: Response): Promise<void> => {
  try {
    const { presenterName } = req.body;

    if (!presenterName) {
      res.status(400).json({ error: 'Presenter name is required' });
      return;
    }

    // Get or create presenter
    const allPresenters = await db.select().from(presenters);
    let presenter;

    // Find an inactive presenter slot or create a new one
    const inactivePresenter = allPresenters.find(p => !p.isActive);

    if (inactivePresenter) {
      // Reactivate existing slot
      const [updated] = await db
        .update(presenters)
        .set({
          presenterName,
          isActive: true,
          sessionId: req.headers['x-session-id'] as string || null,
          lastActiveAt: new Date(),
        })
        .where(eq(presenters.id, inactivePresenter.id))
        .returning();

      presenter = updated;
    } else {
      // Create new presenter
      const [newPresenter] = await db
        .insert(presenters)
        .values({
          presenterNumber: allPresenters.length + 1,
          presenterName,
          isActive: true,
          sessionId: req.headers['x-session-id'] as string || null,
          lastActiveAt: new Date(),
        })
        .returning();

      presenter = newPresenter;
    }

    res.json({ message: 'Joined as presenter successfully', presenter });
  } catch (error) {
    console.error('Join as presenter error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current question for presenter view
export const getCurrentQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config || !config.currentQuestionId) {
      res.json({ question: null, timerState: null, bids: [] });
      return;
    }

    const [question] = await db.select().from(questions).where(eq(questions.id, config.currentQuestionId));

    if (!question) {
      res.json({ question: null, timerState: null, bids: [] });
      return;
    }

    // If it's an MCQ bidding question, get timer state and bids
    let timerState = null;
    let bids = [];

    if (question.questionType === 'mcq_bidding') {
      const [timer] = await db
        .select()
        .from(mcqTimerState)
        .where(eq(mcqTimerState.questionId, question.id));

      timerState = timer || null;

      // Get all bids for this question
      bids = await db
        .select({
          id: mcqBids.id,
          teamId: mcqBids.teamId,
          selectedOption: mcqBids.selectedOption,
          bidAmount: mcqBids.bidAmount,
          teamNumber: teams.teamNumber,
          teamName: teams.teamName,
        })
        .from(mcqBids)
        .leftJoin(teams, eq(mcqBids.teamId, teams.id))
        .where(eq(mcqBids.questionId, question.id));
    }

    res.json({ question, timerState, bids });
  } catch (error) {
    console.error('Get current question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
