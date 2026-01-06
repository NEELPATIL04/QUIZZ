import { Response } from 'express';
import { db } from '../db';
import { quizConfig, teams, questions, teamMembers, teamAnswers, mcqBids, mcqTimerState } from '../db/schema';
import { eq, sql } from 'drizzle-orm';
import { AuthRequest } from '../middlewares/auth.middleware';

// Get quiz configuration
export const getQuizConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      // Create default config if doesn't exist
      const [newConfig] = await db.insert(quizConfig).values({
        numberOfTeams: 0,
        teamSize: 0,
        controllersPerTeam: 1,
        numberOfPresenters: 1,
        currentQuestionId: null,
        isActive: false,
      }).returning();

      res.json(newConfig);
      return;
    }

    res.json(config);
  } catch (error) {
    console.error('Get quiz config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update quiz configuration
export const updateQuizConfig = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { numberOfTeams, teamSize, controllersPerTeam, numberOfPresenters } = req.body;

    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      const [newConfig] = await db.insert(quizConfig).values({
        numberOfTeams,
        teamSize,
        controllersPerTeam,
        numberOfPresenters: numberOfPresenters || 1,
        currentQuestionId: null,
        isActive: false,
      }).returning();

      res.json({ message: 'Quiz config created', config: newConfig });
      return;
    }

    const [updated] = await db
      .update(quizConfig)
      .set({
        numberOfTeams,
        teamSize,
        controllersPerTeam,
        numberOfPresenters: numberOfPresenters || config.numberOfPresenters,
        updatedAt: new Date(),
      })
      .where(eq(quizConfig.id, config.id))
      .returning();

    res.json({ message: 'Quiz config updated', config: updated });
  } catch (error) {
    console.error('Update quiz config error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const toggleBidResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { visible, questionId } = req.body;

    const [existingConfig] = await db.select().from(quizConfig).limit(1);

    if (!existingConfig) {
      await db.insert(quizConfig).values({
        isBidResultsVisible: visible,
        activeBidQuestionId: questionId || null,
      });
    } else {
      await db.update(quizConfig)
        .set({
          isBidResultsVisible: visible,
          activeBidQuestionId: questionId || null,
          updatedAt: new Date(),
        })
        .where(eq(quizConfig.id, existingConfig.id));
    }

    res.json({
      message: visible ? 'Bid results revealed' : 'Bid results hidden',
      isBidResultsVisible: visible
    });
  } catch (error) {
    console.error('Toggle bid results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Initialize teams based on config
export const initializeTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.status(400).json({ error: 'Quiz config not found' });
      return;
    }

    // Get existing teams
    const existingTeams = await db.select().from(teams);
    const currentTeamCount = existingTeams.length;
    const targetTeamCount = config.numberOfTeams;

    let createdTeams = [...existingTeams];

    // If we need MORE teams, add them
    if (targetTeamCount > currentTeamCount) {
      const teamsToCreate = [];
      for (let i = currentTeamCount + 1; i <= targetTeamCount; i++) {
        teamsToCreate.push({
          teamNumber: i,
          teamName: `Team ${i}`,
          score: 0, // Starting score
        });
      }

      const newTeams = await db.insert(teams).values(teamsToCreate).returning();
      createdTeams = [...existingTeams, ...newTeams];

      // Create team members for new teams only
      for (const team of newTeams) {
        const membersToCreate = [];

        // Add controllers
        for (let i = 1; i <= config.controllersPerTeam; i++) {
          membersToCreate.push({
            teamId: team.id,
            memberNumber: membersToCreate.length + 1,
            role: 'controller' as const,
          });
        }

        // Add viewers (remaining slots)
        const remainingSlots = config.teamSize - config.controllersPerTeam;
        for (let i = 1; i <= remainingSlots; i++) {
          membersToCreate.push({
            teamId: team.id,
            memberNumber: membersToCreate.length + 1,
            role: 'viewer' as const,
          });
        }

        await db.insert(teamMembers).values(membersToCreate);
      }
    }
    // If we need FEWER teams, delete excess teams
    else if (targetTeamCount < currentTeamCount) {
      // Delete teams with teamNumber > targetTeamCount
      for (let i = targetTeamCount + 1; i <= currentTeamCount; i++) {
        const teamToDelete = existingTeams.find(t => t.teamNumber === i);
        if (teamToDelete) {
          await db.delete(teams).where(eq(teams.id, teamToDelete.id));
        }
      }
      createdTeams = existingTeams.filter(t => t.teamNumber <= targetTeamCount);
    }

    res.json({
      message: targetTeamCount > currentTeamCount
        ? `Added ${targetTeamCount - currentTeamCount} new team(s)`
        : targetTeamCount < currentTeamCount
          ? `Removed ${currentTeamCount - targetTeamCount} team(s)`
          : 'No changes needed',
      teams: createdTeams
    });
  } catch (error) {
    console.error('Initialize teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all teams
export const getAllTeams = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allTeams = await db.select().from(teams);
    res.json(allTeams);
  } catch (error) {
    console.error('Get teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete team
export const deleteTeam = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;

    // Delete the team (cascade will delete members and answers)
    await db.delete(teams).where(eq(teams.id, teamId));

    res.json({ message: 'Team deleted successfully' });
  } catch (error) {
    console.error('Delete team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get all questions
export const getAllQuestions = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allQuestions = await db.select().from(questions);
    res.json(allQuestions);
  } catch (error) {
    console.error('Get questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Create question
export const createQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionNumber, title, description, options, correctAnswer, points, timeLimit } = req.body;

    const [newQuestion] = await db.insert(questions).values({
      questionNumber,
      title,
      description,
      options: JSON.stringify(options),
      correctAnswer,
      points: points || 10,
      isEnabled: false,
      timeLimit: timeLimit || null,
    }).returning();

    res.status(201).json({ message: 'Question created', question: newQuestion });
  } catch (error) {
    console.error('Create question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update question
export const updateQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { questionNumber, title, description, options, correctAnswer, points, timeLimit } = req.body;

    const [updated] = await db
      .update(questions)
      .set({
        questionNumber,
        title,
        description,
        options: options ? JSON.stringify(options) : undefined,
        correctAnswer,
        points,
        timeLimit: timeLimit || null,
      })
      .where(eq(questions.id, id))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    res.json({ message: 'Question updated', question: updated });
  } catch (error) {
    console.error('Update question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle question enable/disable
export const toggleQuestionStatus = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { isEnabled } = req.body;

    const [updated] = await db
      .update(questions)
      .set({ isEnabled })
      .where(eq(questions.id, id))
      .returning();

    res.json({ message: 'Question status updated', question: updated });
  } catch (error) {
    console.error('Toggle question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Delete question
export const deleteQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    await db.delete(questions).where(eq(questions.id, id));

    res.json({ message: 'Question deleted' });
  } catch (error) {
    console.error('Delete question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Set current question for presenter view
export const setCurrentQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { questionId } = req.body;

    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.status(400).json({ error: 'Quiz config not found' });
      return;
    }

    const [updated] = await db
      .update(quizConfig)
      .set({
        currentQuestionId: questionId,
        updatedAt: new Date(),
      })
      .where(eq(quizConfig.id, config.id))
      .returning();

    res.json({ message: 'Current question updated', config: updated });
  } catch (error) {
    console.error('Set current question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current question ID - accessible by both admin and super_admin
export const getCurrentQuestionId = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.json({ currentQuestionId: null });
      return;
    }

    res.json({ currentQuestionId: config.currentQuestionId });
  } catch (error) {
    console.error('Get current question ID error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Toggle show answers for presenter
export const toggleShowAnswers = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { showAnswers } = req.body;

    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.status(400).json({ error: 'Quiz config not found' });
      return;
    }

    const [updated] = await db
      .update(quizConfig)
      .set({
        showAnswers,
        updatedAt: new Date(),
      })
      .where(eq(quizConfig.id, config.id))
      .returning();

    res.json({ message: 'Show answers updated', config: updated });
  } catch (error) {
    console.error('Toggle show answers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Remove team member
export const removeTeamMember = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { memberId } = req.params;

    await db
      .update(teamMembers)
      .set({
        memberName: null,
        isActive: false,
        sessionId: null,
      })
      .where(eq(teamMembers.id, memberId));

    res.json({ message: 'Member removed successfully' });
  } catch (error) {
    console.error('Remove team member error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get team results with rankings (for super admin)
export const getTeamResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    // Get all teams with their scores
    const allTeams = await db.select().from(teams);

    // Get detailed results for each team
    const results = await Promise.all(
      allTeams.map(async (team) => {
        const answers = await db
          .select({
            questionId: teamAnswers.questionId,
            answer: teamAnswers.answer,
            isCorrect: teamAnswers.isCorrect,
            pointsAwarded: teamAnswers.pointsAwarded,
            timeTaken: teamAnswers.timeTaken,
            timeStarted: teamAnswers.timeStarted,
            timeCompleted: teamAnswers.timeCompleted,
            submittedAt: teamAnswers.submittedAt,
          })
          .from(teamAnswers)
          .where(eq(teamAnswers.teamId, team.id));

        // Calculate total time taken across all questions
        const totalTime = answers.reduce((sum, ans) => sum + (ans.timeTaken || 0), 0);

        return {
          teamId: team.id,
          teamNumber: team.teamNumber,
          teamName: team.teamName,
          score: team.score,
          totalTimeTaken: totalTime,
          answers: answers,
        };
      })
    );

    // Sort by score (descending), then by total time (ascending)
    results.sort((a, b) => {
      if (b.score !== a.score) {
        return b.score - a.score;
      }
      return a.totalTimeTaken - b.totalTimeTaken;
    });

    // Add rank
    const rankedResults = results.map((result, index) => ({
      ...result,
      rank: index + 1,
    }));

    res.json(rankedResults);
  } catch (error) {
    console.error('Get team results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update team score (super admin only)
export const updateTeamScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { teamId } = req.params;
    const { score } = req.body;

    if (typeof score !== 'number' || score < 0) {
      res.status(400).json({ error: 'Invalid score value' });
      return;
    }

    const [updated] = await db
      .update(teams)
      .set({ score })
      .where(eq(teams.id, teamId))
      .returning();

    if (!updated) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    res.json({ message: 'Team score updated successfully', team: updated });
  } catch (error) {
    console.error('Update team score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset all team scores to 700 (super admin only)
export const resetAllTeamScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const updated = await db
      .update(teams)
      .set({ score: 0 })
      .returning();

    res.json({
      message: 'All team scores reset to 0 successfully',
      teams: updated,
      count: updated.length
    });
  } catch (error) {
    console.error('Reset all team scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Reset question (delete answers and revert scores)
export const resetQuestion = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check Question Type
    const [question] = await db.select().from(questions).where(eq(questions.id, id));
    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    // --- BID ROUND RESET LOGIC ---
    if (question.questionType === 'mcq_bidding') {
      // Get all bids to revert scores
      const bids = await db.select().from(mcqBids).where(eq(mcqBids.questionId, id));

      for (const bid of bids) {
        const [team] = await db.select().from(teams).where(eq(teams.id, bid.teamId)).limit(1);
        // Verify team exists and points need to be reverted
        if (team && bid.pointsAwarded !== null && bid.pointsAwarded !== 0) {
          // Formula: Current Score - Points Awarded
          // Example Win: 1000 + 500 = 1500. Revert: 1500 - 500 = 1000.
          // Example Loss: 1000 - 200 = 800 (pointsAwarded is -200). Revert: 800 - (-200) = 1000.
          const newScore = team.score - bid.pointsAwarded;

          await db.update(teams).set({ score: newScore }).where(eq(teams.id, team.id));
        }
      }

      // Delete all bids for this question
      await db.delete(mcqBids).where(eq(mcqBids.questionId, id));

      // Reset Timer State completely
      await db.update(mcqTimerState)
        .set({
          isRunning: false,
          timeRemaining: 10,
          startedAt: null,
          biddingClosed: false,
          answerRevealed: false,
          bidRoundEnabled: false // Also disable the round so instructions show again
        })
        .where(eq(mcqTimerState.questionId, id));

      res.json({ message: 'Bid Round reset successfully (scores reverted, bids deleted, timer reset)' });
      return;
    }

    // 1. Get all answers for this question
    const answers = await db.select().from(teamAnswers).where(eq(teamAnswers.questionId, id));

    // 2. Revert scores
    for (const ans of answers) {
      if (ans.pointsAwarded && ans.pointsAwarded > 0) {
        // Find team and subtract score
        const [team] = await db.select().from(teams).where(eq(teams.id, ans.teamId)).limit(1);
        if (team) {
          await db.update(teams)
            .set({ score: team.score - ans.pointsAwarded })
            .where(eq(teams.id, team.id));
        }
      }
    }

    // 3. Delete answers
    await db.delete(teamAnswers).where(eq(teamAnswers.questionId, id));

    res.json({ message: 'Question reset successfully (scores reverted & answers deleted)' });
  } catch (error) {
    console.error('Reset question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Get results for a specific question (admin only)
export const getQuestionResults = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    // Check question type first
    const [question] = await db.select().from(questions).where(eq(questions.id, id));

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    if (question.questionType === 'mcq_bidding') {
      const results = await db
        .select({
          answerId: mcqBids.id,
          teamId: teams.id,
          teamName: teams.teamName,
          teamNumber: teams.teamNumber,
          answer: mcqBids.selectedOption,
          isCorrect: mcqBids.isCorrect,
          pointsAwarded: mcqBids.pointsAwarded,
          // Specific fields for bidding
          bidAmount: mcqBids.bidAmount,
          currentScore: teams.score,
        })
        .from(mcqBids)
        .innerJoin(teams, eq(mcqBids.teamId, teams.id))
        .where(eq(mcqBids.questionId, id))
        .orderBy(teams.teamNumber);

      res.json(results);
      return;
    }

    // Get all answers for this question joined with team details
    const results = await db
      .select({
        answerId: teamAnswers.id,
        teamId: teams.id,
        teamName: teams.teamName,
        teamNumber: teams.teamNumber,
        answer: teamAnswers.answer,
        isCorrect: teamAnswers.isCorrect,
        pointsAwarded: teamAnswers.pointsAwarded,
        timeTaken: teamAnswers.timeTaken,
        submittedAt: teamAnswers.submittedAt,
      })
      .from(teamAnswers)
      .innerJoin(teams, eq(teamAnswers.teamId, teams.id))
      .where(eq(teamAnswers.questionId, id))
      .orderBy(teams.teamNumber);

    res.json(results);
  } catch (error) {
    console.error('Get question results error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Update a specific team answer score (admin only)
export const updateTeamAnswerScore = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { answerId } = req.params;
    const { pointsAwarded } = req.body;

    if (typeof pointsAwarded !== 'number') {
      res.status(400).json({ error: 'Invalid points value' });
      return;
    }

    // 1. Get the current answer to know the old score and team ID
    const [currentAnswer] = await db
      .select()
      .from(teamAnswers)
      .where(eq(teamAnswers.id, answerId))
      .limit(1);

    if (!currentAnswer) {
      res.status(404).json({ error: 'Answer not found' });
      return;
    }

    const oldPoints = currentAnswer.pointsAwarded || 0;
    const pointsDiff = pointsAwarded - oldPoints;

    // 2. Update the team answer
    const [updatedAnswer] = await db
      .update(teamAnswers)
      .set({ pointsAwarded })
      .where(eq(teamAnswers.id, answerId))
      .returning();

    // 3. Update the team's total score
    const [team] = await db
      .select()
      .from(teams)
      .where(eq(teams.id, currentAnswer.teamId))
      .limit(1);

    if (team) {
      await db
        .update(teams)
        .set({ score: team.score + pointsDiff })
        .where(eq(teams.id, team.id));
    }

    res.json({
      message: 'Score updated successfully',
      answer: updatedAnswer,
      scoreDiff: pointsDiff
    });
  } catch (error) {
    console.error('Update team answer score error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
// Toggle scoreboard visibility
export const toggleScoreboard = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const { isVisible } = req.body;

    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.status(400).json({ error: 'Quiz config not found' });
      return;
    }

    const [updated] = await db
      .update(quizConfig)
      .set({
        isScoreboardVisible: isVisible,
        updatedAt: new Date(),
      })
      .where(eq(quizConfig.id, config.id))
      .returning();

    res.json({ message: 'Scoreboard visibility updated', config: updated });
  } catch (error) {
    console.error('Toggle scoreboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Validate and Recalculate Scores
export const validateTeamScores = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allTeams = await db.select().from(teams);
    const discrepancies = [];
    let fixedCount = 0;

    for (const team of allTeams) {
      const answers = await db
        .select({ points: teamAnswers.pointsAwarded })
        .from(teamAnswers)
        .where(eq(teamAnswers.teamId, team.id));

      const calculatedScore = answers.reduce((acc, curr) => acc + (curr.points || 0), 0);

      if (calculatedScore !== team.score) {
        discrepancies.push({
          teamName: team.teamName,
          oldScore: team.score,
          newScore: calculatedScore,
        });

        // Auto-fix the score
        await db
          .update(teams)
          .set({ score: calculatedScore })
          .where(eq(teams.id, team.id));

        fixedCount++;
      }
    }

    res.json({
      message: 'Scores validation completed',
      fixedCount,
      discrepancies,
    });
  } catch (error) {
    console.error('Validate scores error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get Bid Round Analytics
export const getBidRoundAnalytics = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const allTeams = await db.select().from(teams).orderBy(teams.teamNumber);

    const analytics = await Promise.all(
      allTeams.map(async (team) => {
        // Calculate Pre-Bid Score (from teamAnswers - Q1-Q15)
        const standardAnswers = await db
          .select({ points: teamAnswers.pointsAwarded })
          .from(teamAnswers)
          .where(eq(teamAnswers.teamId, team.id));

        const preBidScore = standardAnswers.reduce((sum, a) => sum + (a.points || 0), 0);

        // Calculate Bid Round Stats (from mcqBids)
        const bids = await db
          .select()
          .from(mcqBids)
          .where(eq(mcqBids.teamId, team.id));

        const totalBidAmount = bids.reduce((sum, b) => sum + b.bidAmount, 0);
        const totalWon = bids
          .filter((b) => (b.pointsAwarded || 0) > 0)
          .reduce((sum, b) => sum + (b.pointsAwarded || 0), 0);

        // Loss is stored as negative points in pointsAwarded, so we take abs
        const totalLost = bids
          .filter((b) => (b.pointsAwarded || 0) < 0)
          .reduce((sum, b) => sum + Math.abs(b.pointsAwarded || 0), 0);

        return {
          teamId: team.id,
          teamName: team.teamName,
          teamNumber: team.teamNumber,
          preBidScore,
          totalBidAmount,
          totalWon,
          totalLost,
          netBidChange: totalWon - totalLost,
          currentScore: team.score,
        };
      })
    );

    res.json(analytics);
  } catch (error) {
    console.error('Bid analytics error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
