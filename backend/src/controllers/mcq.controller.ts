import { Request, Response } from 'express';
import { db } from '../db';
import { questions, mcqTimerState, mcqBids, teams, quizConfig } from '../db/schema';
import { eq, and } from 'drizzle-orm';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get timer state for an MCQ question
export const getTimerState = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    let [timer] = await db
      .select()
      .from(mcqTimerState)
      .where(eq(mcqTimerState.questionId, questionId));

    // Check Global Bid Mode
    const [config] = await db.select().from(quizConfig).limit(1);

    // Auto-enable if global mode is active and timer not enabled yet
    if (config?.isBidQuestionActive) {
      // Verify it's a bid question first
      const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

      if (question && question.questionType === 'mcq_bidding') {
        if (!timer) {
          try {
            // Create and enable
            const [newTimer] = await db
              .insert(mcqTimerState)
              .values({
                questionId,
                bidRoundEnabled: true,
                isRunning: false,
                timeRemaining: 10,
                biddingClosed: false,
                answerRevealed: false,
              })
              .returning();
            timer = newTimer;
          } catch (e: any) {
            // Race condition: Timer might have been created by another request concurrently
            if (e.code === '23505') { // Unique constraint violation code for Postgres
              const [existingTimer] = await db
                .select()
                .from(mcqTimerState)
                .where(eq(mcqTimerState.questionId, questionId));

              // Ensure it is enabled if we found it
              if (existingTimer && !existingTimer.bidRoundEnabled) {
                const [updated] = await db
                  .update(mcqTimerState)
                  .set({ bidRoundEnabled: true })
                  .where(eq(mcqTimerState.questionId, questionId))
                  .returning();
                timer = updated;
              } else {
                timer = existingTimer;
              }
            } else {
              throw e; // Rethrow other errors
            }
          }
        } else if (!timer.bidRoundEnabled) {
          // Update to enable
          const [updated] = await db
            .update(mcqTimerState)
            .set({ bidRoundEnabled: true })
            .where(eq(mcqTimerState.questionId, questionId))
            .returning();
          timer = updated;
        }
      }
    }

    res.json({ timerState: timer || null });
  } catch (error) {
    console.error('Get timer state error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Enable bid round (admin only)
export const enableBidRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    // Check if question exists and is MCQ type
    const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

    if (!question || question.questionType !== 'mcq_bidding') {
      res.status(400).json({ error: 'Invalid MCQ question' });
      return;
    }

    // Check if timer already exists
    const [existing] = await db
      .select()
      .from(mcqTimerState)
      .where(eq(mcqTimerState.questionId, questionId));

    // Enable Global Bid Mode
    const [config] = await db.select().from(quizConfig).limit(1);
    if (config) {
      await db
        .update(quizConfig)
        .set({
          isBidQuestionActive: true,
          updatedAt: new Date(),
        })
        .where(eq(quizConfig.id, config.id));
    }

    if (existing) {
      // Update existing timer
      const [updated] = await db
        .update(mcqTimerState)
        .set({
          bidRoundEnabled: true,
          updatedAt: new Date(),
        })
        .where(eq(mcqTimerState.questionId, questionId))
        .returning();

      res.json({ message: 'Bid round enabled (Global Mode Active)', timerState: updated });
    } else {
      // Create new timer
      const [newTimer] = await db
        .insert(mcqTimerState)
        .values({
          questionId,
          bidRoundEnabled: true,
          isRunning: false,
          timeRemaining: 10,
          biddingClosed: false,
          answerRevealed: false,
        })
        .returning();

      res.json({ message: 'Bid round enabled', timerState: newTimer });
    }
  } catch (error) {
    console.error('Enable bid round error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Disable bid round (admin only) - resets to instruction screen
export const disableBidRound = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    // Check if timer exists
    const [existing] = await db
      .select()
      .from(mcqTimerState)
      .where(eq(mcqTimerState.questionId, questionId));

    if (existing) {
      // Reset timer state back to disabled
      const [updated] = await db
        .update(mcqTimerState)
        .set({
          bidRoundEnabled: false,
          isRunning: false,
          timeRemaining: 10,
          startedAt: null,
          biddingClosed: false,
          answerRevealed: false,
          updatedAt: new Date(),
        })
        .where(eq(mcqTimerState.questionId, questionId))
        .returning();

      res.json({ message: 'Bid round disabled', timerState: updated });
    } else {
      res.status(404).json({ error: 'Timer state not found' });
    }
  } catch (error) {
    console.error('Disable bid round error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Start MCQ timer (admin only)
export const startMcqTimer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    // Check if question exists and is MCQ type
    const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

    if (!question || question.questionType !== 'mcq_bidding') {
      res.status(400).json({ error: 'Invalid MCQ question' });
      return;
    }

    // Check if timer already exists
    const [existing] = await db
      .select()
      .from(mcqTimerState)
      .where(eq(mcqTimerState.questionId, questionId));

    if (existing && existing.biddingClosed) {
      res.status(400).json({ error: 'Bidding already closed for this question' });
      return;
    }

    const timerDuration = question.timeLimit || 10;

    if (existing) {
      // Update existing timer
      const [updated] = await db
        .update(mcqTimerState)
        .set({
          isRunning: true,
          timeRemaining: timerDuration,
          startedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(mcqTimerState.questionId, questionId))
        .returning();

      // Start countdown in background
      startCountdown(questionId);

      res.json({ message: 'Timer started', timerState: updated });
    } else {
      // Create new timer
      const [newTimer] = await db
        .insert(mcqTimerState)
        .values({
          questionId,
          isRunning: true,
          timeRemaining: timerDuration,
          startedAt: new Date(),
          biddingClosed: false,
          answerRevealed: false,
        })
        .returning();

      // Start countdown in background
      startCountdown(questionId);

      res.json({ message: 'Timer started', timerState: newTimer });
    }
  } catch (error) {
    console.error('Start MCQ timer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Background countdown function
async function startCountdown(questionId: string) {
  const countdown = setInterval(async () => {
    try {
      const [timer] = await db
        .select()
        .from(mcqTimerState)
        .where(eq(mcqTimerState.questionId, questionId));

      if (!timer || !timer.isRunning) {
        clearInterval(countdown);
        return;
      }

      const newTime = timer.timeRemaining - 1;

      if (newTime <= 0) {
        // Timer finished - close bidding
        await db
          .update(mcqTimerState)
          .set({
            isRunning: false,
            timeRemaining: 0,
            biddingClosed: true,
            updatedAt: new Date(),
          })
          .where(eq(mcqTimerState.questionId, questionId));

        clearInterval(countdown);
      } else {
        // Decrement timer
        await db
          .update(mcqTimerState)
          .set({
            timeRemaining: newTime,
            updatedAt: new Date(),
          })
          .where(eq(mcqTimerState.questionId, questionId));
      }
    } catch (error) {
      console.error('Countdown error:', error);
      clearInterval(countdown);
    }
  }, 1000);
}

// Reveal answer and distribute points (admin only)
export const revealAnswer = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    // Get question
    const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

    if (!question || question.questionType !== 'mcq_bidding') {
      res.status(400).json({ error: 'Invalid MCQ question' });
      return;
    }

    // Get timer state
    const [timer] = await db.select().from(mcqTimerState).where(eq(mcqTimerState.questionId, questionId));

    if (!timer || !timer.biddingClosed) {
      res.status(400).json({ error: 'Bidding must be closed first' });
      return;
    }

    if (timer.answerRevealed) {
      res.status(400).json({ error: 'Answer already revealed' });
      return;
    }

    // Get all bids for this question
    const bids = await db
      .select({
        id: mcqBids.id,
        teamId: mcqBids.teamId,
        selectedOption: mcqBids.selectedOption,
        bidAmount: mcqBids.bidAmount,
      })
      .from(mcqBids)
      .where(eq(mcqBids.questionId, questionId));

    const correctAnswer = question.correctAnswer;

    // Separate correct and incorrect bids
    const correctBids = bids.filter(b => b.selectedOption === correctAnswer);
    const incorrectBids = bids.filter(b => b.selectedOption !== correctAnswer);

    // Calculate total lost points from incorrect bids
    const totalLostPoints = incorrectBids.reduce((sum, bid) => sum + bid.bidAmount, 0);

    // Calculate total bid amounts from correct bidders (for proportional distribution)
    const totalCorrectBidAmount = correctBids.reduce((sum, bid) => sum + bid.bidAmount, 0);

    // Process incorrect bids - lose their bid amount
    for (const bid of incorrectBids) {
      await db
        .update(mcqBids)
        .set({
          isCorrect: false,
          pointsAwarded: -bid.bidAmount, // Negative = loss
        })
        .where(eq(mcqBids.id, bid.id));

      // Deduct points from team
      const [team] = await db.select().from(teams).where(eq(teams.id, bid.teamId));
      if (team) {
        await db
          .update(teams)
          .set({ score: team.score - bid.bidAmount })
          .where(eq(teams.id, bid.teamId));
      }
    }

    // Process correct bids - distribute lost points proportionally
    // NOTE: If all teams bid correctly (totalLostPoints = 0), no points change
    if (correctBids.length > 0 && totalCorrectBidAmount > 0) {
      for (const bid of correctBids) {
        // Calculate this bidder's share of the pot
        const shareRatio = bid.bidAmount / totalCorrectBidAmount;
        const pointsWon = Math.floor(totalLostPoints * shareRatio);

        await db
          .update(mcqBids)
          .set({
            isCorrect: true,
            pointsAwarded: pointsWon, // Will be 0 if no one bid incorrectly
          })
          .where(eq(mcqBids.id, bid.id));

        // Add points to team (only if there are points to add)
        if (pointsWon > 0) {
          const [team] = await db.select().from(teams).where(eq(teams.id, bid.teamId));
          if (team) {
            await db
              .update(teams)
              .set({ score: team.score + pointsWon })
              .where(eq(teams.id, bid.teamId));
          }
        }
      }
    }

    // Mark answer as revealed
    await db
      .update(mcqTimerState)
      .set({
        answerRevealed: true,
        updatedAt: new Date(),
      })
      .where(eq(mcqTimerState.questionId, questionId));

    // Get detailed results for each team
    const teamResults = await Promise.all(
      bids.map(async (bid) => {
        const [team] = await db.select().from(teams).where(eq(teams.id, bid.teamId));
        const [bidDetails] = await db.select().from(mcqBids).where(eq(mcqBids.id, bid.id));

        return {
          teamId: team.id,
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          selectedOption: bid.selectedOption,
          bidAmount: bid.bidAmount,
          isCorrect: bidDetails.isCorrect,
          pointsChange: bidDetails.pointsAwarded || 0,
          scoreBefore: bidDetails.isCorrect
            ? team.score - (bidDetails.pointsAwarded || 0)
            : team.score + bid.bidAmount,
          scoreAfter: team.score,
        };
      })
    );

    res.json({
      message: 'Answer revealed and points distributed',
      correctAnswer,
      correctBids: correctBids.length,
      incorrectBids: incorrectBids.length,
      totalLostPoints,
      totalDistributed: totalLostPoints,
      teamResults: teamResults.sort((a, b) => a.teamNumber - b.teamNumber),
    });
  } catch (error) {
    console.error('Reveal answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit bid (team member)
export const submitBid = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamNumber, questionId, selectedOption, bidAmount } = req.body;

    if (!teamNumber || !questionId || !selectedOption || !bidAmount) {
      res.status(400).json({ error: 'All fields are required' });
      return;
    }

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.teamNumber, parseInt(teamNumber)));

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Check if team has enough points (ensure bidAmount is a number)
    const bidAmountNum = parseInt(bidAmount);
    console.log(`Team ${team.teamNumber} - Score: ${team.score}, Bid Amount: ${bidAmountNum}, Type: ${typeof bidAmountNum}`);

    if (team.score < bidAmountNum) {
      console.log(`INSUFFICIENT POINTS: ${team.score} < ${bidAmountNum}`);
      res.status(400).json({ error: `Insufficient points. You have ${team.score} points but trying to bid ${bidAmountNum}` });
      return;
    }

    // Get timer state
    const [timer] = await db.select().from(mcqTimerState).where(eq(mcqTimerState.questionId, questionId));

    if (!timer) {
      res.status(400).json({ error: 'Timer not started yet' });
      return;
    }

    if (timer.biddingClosed) {
      res.status(400).json({ error: 'Bidding is closed' });
      return;
    }

    // Check if team already bid
    const [existing] = await db
      .select()
      .from(mcqBids)
      .where(and(
        eq(mcqBids.teamId, team.id),
        eq(mcqBids.questionId, questionId)
      ));

    if (existing) {
      res.status(400).json({ error: 'Team has already placed a bid' });
      return;
    }

    // Create bid
    const [newBid] = await db
      .insert(mcqBids)
      .values({
        teamId: team.id,
        questionId,
        selectedOption,
        bidAmount: bidAmountNum,
      })
      .returning();

    res.json({ message: 'Bid submitted successfully', bid: newBid });
  } catch (error) {
    console.error('Submit bid error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get MCQ results (public - for teams to view after reveal)
export const getMcqResults = async (req: Request, res: Response): Promise<void> => {
  try {
    const { questionId } = req.params;

    // Get question
    const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

    if (!question || question.questionType !== 'mcq_bidding') {
      res.status(400).json({ error: 'Invalid MCQ question' });
      return;
    }

    // Get timer state
    const [timer] = await db.select().from(mcqTimerState).where(eq(mcqTimerState.questionId, questionId));

    // Check visibility: either answer is revealed OR admin has explicitly shown the table
    const [config] = await db.select().from(quizConfig).limit(1);
    const isGloballyVisible = config && config.isBidResultsVisible && config.activeBidQuestionId === questionId;
    const isAnswerRevealed = timer && timer.answerRevealed;

    if (!isAnswerRevealed && !isGloballyVisible) {
      res.status(400).json({ error: 'Answer not revealed yet' });
      return;
    }

    // Get all bids with details
    const bids = await db
      .select({
        id: mcqBids.id,
        teamId: mcqBids.teamId,
        selectedOption: mcqBids.selectedOption,
        bidAmount: mcqBids.bidAmount,
        isCorrect: mcqBids.isCorrect,
        pointsAwarded: mcqBids.pointsAwarded,
      })
      .from(mcqBids)
      .where(eq(mcqBids.questionId, questionId));

    // Get team details for each bid
    const teamResults = await Promise.all(
      bids.map(async (bid) => {
        const [team] = await db.select().from(teams).where(eq(teams.id, bid.teamId));

        return {
          teamId: team.id,
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          selectedOption: bid.selectedOption,
          bidAmount: bid.bidAmount,
          isCorrect: bid.isCorrect,
          pointsAwarded: bid.pointsAwarded || 0, // Matched to frontend expectation
          pointsChange: bid.pointsAwarded || 0,
          scoreBefore: bid.isCorrect
            ? team.score - (bid.pointsAwarded || 0)
            : team.score + bid.bidAmount,
          currentScore: team.score, // Matched to frontend expectation
          scoreAfter: team.score,
        };
      })
    );

    const totalLostPoints = bids
      .filter(b => !b.isCorrect)
      .reduce((sum, b) => sum + b.bidAmount, 0);

    res.json({
      correctAnswer: question.correctAnswer,
      teamResults: teamResults.sort((a, b) => a.teamNumber - b.teamNumber),
      totalLostPoints,
    });
  } catch (error) {
    console.error('Get MCQ results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Disable Global Bid Mode (End Segment)
export const disableBidMode = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (config) {
      await db
        .update(quizConfig)
        .set({
          isBidQuestionActive: false,
          updatedAt: new Date(),
        })
        .where(eq(quizConfig.id, config.id));
    }

    res.json({ message: 'Global Bid Mode disabled' });
  } catch (error) {
    console.error('Disable global bid mode error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};


