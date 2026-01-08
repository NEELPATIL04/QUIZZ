import { Request, Response } from 'express';
import { db } from '../db';
import { teams, teamMembers, questions, teamAnswers, quizConfig } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// Get all teams (public - no auth)
export const getPublicTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const allTeams = await db.select({
      id: teams.id,
      teamNumber: teams.teamNumber,
      teamName: teams.teamName,
      score: teams.score,
    }).from(teams);

    res.json(allTeams);
  } catch (error) {
    console.error('Get public teams error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get public scoreboard
export const getPublicScoreboard = async (req: Request, res: Response): Promise<void> => {
  try {
    const scoreboard = await db
      .select({
        teamNumber: teams.teamNumber,
        teamName: teams.teamName,
        score: teams.score,
      })
      .from(teams);

    // Sort by score descending
    scoreboard.sort((a, b) => (b.score || 0) - (a.score || 0));

    res.json(scoreboard);
  } catch (error) {
    console.error('Get scoreboard error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get team members by team number (public - no auth)
export const getTeamMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamNumber } = req.params;

    const [team] = await db.select().from(teams).where(eq(teams.teamNumber, parseInt(teamNumber)));

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const members = await db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id));

    res.json(members);
  } catch (error) {
    console.error('Get team members error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Join team with name (public - no auth)
export const joinTeam = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamNumber, memberName } = req.body;

    if (!teamNumber || !memberName) {
      res.status(400).json({ error: 'Team number and member name are required' });
      return;
    }

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.teamNumber, parseInt(teamNumber)));

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Get quiz config to check team size
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      res.status(400).json({ error: 'Quiz not configured' });
      return;
    }

    // Get current members
    const currentMembers = await db.select().from(teamMembers).where(eq(teamMembers.teamId, team.id));

    // Check if team is full
    if (currentMembers.filter(m => m.isActive).length >= config.teamSize) {
      res.status(400).json({ error: 'Team is full' });
      return;
    }

    // Find an available slot or create new one
    let availableSlot = currentMembers.find(m => !m.isActive);

    if (availableSlot) {
      // Update existing slot
      const [updated] = await db
        .update(teamMembers)
        .set({
          memberName,
          isActive: true,
          sessionId: req.headers['x-session-id'] as string || null,
          lastActiveAt: new Date(),
        })
        .where(eq(teamMembers.id, availableSlot.id))
        .returning();

      res.json({ message: 'Joined team successfully', member: updated });
    } else {
      // Create new member
      const [newMember] = await db
        .insert(teamMembers)
        .values({
          teamId: team.id,
          memberNumber: currentMembers.length + 1,
          memberName,
          role: currentMembers.length === 0 ? 'controller' : 'viewer',
          isActive: true,
          sessionId: req.headers['x-session-id'] as string || null,
          lastActiveAt: new Date(),
        })
        .returning();

      res.json({ message: 'Joined team successfully', member: newMember });
    }
  } catch (error) {
    console.error('Join team error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get enabled questions (public - no auth)
export const getEnabledQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const enabledQuestions = await db.select().from(questions).where(eq(questions.isEnabled, true));

    res.json(enabledQuestions);
  } catch (error) {
    console.error('Get enabled questions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Submit answer (public - no auth, but validates team)
export const submitAnswer = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamNumber, questionId, answer, timeTaken, timeStarted } = req.body;

    console.log(`[submitAnswer] Team ${teamNumber} submitting answer for question ${questionId}`);
    console.log(`[submitAnswer] Answer received:`, answer);

    if (!teamNumber || !questionId || !answer) {
      res.status(400).json({ error: 'Team number, question ID, and answer are required' });
      return;
    }

    // Get team
    const [team] = await db.select().from(teams).where(eq(teams.teamNumber, parseInt(teamNumber)));

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Get question
    const [question] = await db.select().from(questions).where(eq(questions.id, questionId));

    if (!question) {
      res.status(404).json({ error: 'Question not found' });
      return;
    }

    console.log(`[submitAnswer] Question type: ${question.questionType}`);
    console.log(`[submitAnswer] Question title: ${question.title}`);
    console.log(`[submitAnswer] Correct answer stored: "${question.correctAnswer}"`);

    if (!question.isEnabled) {
      res.status(403).json({ error: 'This question is not currently available' });
      return;
    }

    // Check if already answered
    const [existingAnswer] = await db
      .select()
      .from(teamAnswers)
      .where(and(
        eq(teamAnswers.teamId, team.id),
        eq(teamAnswers.questionId, questionId)
      ));

    // Allow re-submission for specific types (e.g. js_engine_challenge)
    if (existingAnswer && question.questionType !== 'js_engine_challenge') {
      res.status(400).json({ error: 'This question has already been answered' });
      return;
    }

    // Check if answer is correct
    let isCorrect = false;
    let pointsAwarded = 0;
    let additionalData: any = {};

    if (question.questionType === 'git_challenge') {
      // For git challenge, answer is JSON array of commands
      const submittedCommands = typeof answer === 'string' ? JSON.parse(answer) : answer;
      const correctCommands = JSON.parse(question.correctAnswer || '[]');

      // Check if all commands match in order
      isCorrect = submittedCommands.length === correctCommands.length &&
        submittedCommands.every((cmd: string, idx: number) =>
          cmd.toLowerCase().trim() === correctCommands[idx].toLowerCase().trim()
        );

      pointsAwarded = isCorrect ? question.points : 0;
    } else if (question.questionType === 'html_css_challenge') {
      // For HTML/CSS challenge, validate CSS
      const { validateCss } = await import('../utils/cssValidator');

      const requiredProperties = question.requiredProperties ? JSON.parse(question.requiredProperties) : [];
      const scoringCriteria = question.scoringCriteria ? JSON.parse(question.scoringCriteria) : {};

      const validationResult = validateCss(
        answer,
        question.idealCss || '',
        requiredProperties,
        scoringCriteria,
        question.points
      );

      isCorrect = validationResult.isCorrect;
      pointsAwarded = validationResult.pointsAwarded;
    } else if (question.questionType === 'broken_html_challenge') {
      // For HTML Tree Builder, validate tree structure with partial scoring
      const { validateHtmlTree } = await import('../utils/treeValidator');

      const userTree = typeof answer === 'string' ? JSON.parse(answer) : answer;
      const correctTree = question.correctTree ? JSON.parse(question.correctTree) : {};

      const validationResult = validateHtmlTree(
        userTree,
        correctTree,
        question.points
      );

      isCorrect = validationResult.isCorrect;
      pointsAwarded = validationResult.pointsAwarded;

      console.log(`Tree validation: ${validationResult.score}% match, awarded ${pointsAwarded}/${question.points} points`);
    } else if (question.questionType === 'true_false_drag_drop') {
      // For True/False Drag Drop, validate with partial scoring
      const userAnswer = typeof answer === 'string' ? JSON.parse(answer) : answer;
      const codeBlocks = question.initialTree ? JSON.parse(question.initialTree) : [];

      // Count correct placements
      let correctCount = 0;
      const totalCount = codeBlocks.length;

      // Check true blocks
      if (userAnswer.trueBlocks && Array.isArray(userAnswer.trueBlocks)) {
        userAnswer.trueBlocks.forEach((blockId: string) => {
          const block = codeBlocks.find((b: any) => b.id === blockId);
          if (block && block.correctAnswer === true) {
            correctCount++;
          }
        });
      }

      // Check false blocks
      if (userAnswer.falseBlocks && Array.isArray(userAnswer.falseBlocks)) {
        userAnswer.falseBlocks.forEach((blockId: string) => {
          const block = codeBlocks.find((b: any) => b.id === blockId);
          if (block && block.correctAnswer === false) {
            correctCount++;
          }
        });
      }

      // Calculate partial score
      const scorePercentage = totalCount > 0 ? (correctCount / totalCount) : 0;
      pointsAwarded = Math.round(question.points * scorePercentage);
      isCorrect = correctCount === totalCount;

      console.log(`True/False validation: ${correctCount}/${totalCount} correct, awarded ${pointsAwarded}/${question.points} points`);
    } else if (question.questionType === 'multiple_choice') {
      // Check if correct answer is a JSON array (multi-select)
      let correctOptions: string[] = [];
      try {
        const parsed = JSON.parse(question.correctAnswer || '[]');
        if (Array.isArray(parsed)) {
          correctOptions = parsed.map(o => o.trim().toUpperCase());
        } else {
          correctOptions = [question.correctAnswer?.trim().toUpperCase() || ''];
        }
      } catch (e) {
        // Fallback for simple string answer
        correctOptions = [question.correctAnswer?.trim().toUpperCase() || ''];
      }

      // Check submitted answer
      let submittedOptions: string[] = [];
      try {
        const parsed = JSON.parse(answer);
        if (Array.isArray(parsed)) {
          submittedOptions = parsed.map((o: string) => o.trim().toUpperCase());
        } else {
          submittedOptions = [answer.trim().toUpperCase()];
        }
      } catch (e) {
        submittedOptions = [answer.trim().toUpperCase()];
      }

      if (correctOptions.length > 1) {
        // Multi-select logic
        // 1. Check if any WRONG option is selected -> 0 points
        const hasWrongSelection = submittedOptions.some(opt => !correctOptions.includes(opt));

        if (hasWrongSelection) {
          isCorrect = false;
          pointsAwarded = 0;
        } else {
          // 2. Calculate correct selections
          const correctSelections = submittedOptions.filter(opt => correctOptions.includes(opt)).length;
          const totalCorrectNeeded = correctOptions.length;

          if (correctSelections === totalCorrectNeeded) {
            isCorrect = true;
            pointsAwarded = question.points;
          } else if (correctSelections > 0) {
            isCorrect = false; // Partially correct
            pointsAwarded = Math.floor((correctSelections / totalCorrectNeeded) * question.points);
          } else {
            isCorrect = false;
            pointsAwarded = 0;
          }
        }
      } else {
        // Single select logic (legacy compatible)
        const submitted = submittedOptions[0] || '';
        const correct = correctOptions[0] || '';
        isCorrect = submitted === correct;
        pointsAwarded = isCorrect ? question.points : 0;
      }
    } else if (question.questionType === 'js_engine_challenge') {
      // For JS Engine challenge, score is calculated on frontend (0-100)
      const parsed = typeof answer === 'string' ? JSON.parse(answer) : answer;
      const scorePercentage = (parsed.score || 0) / 100;

      pointsAwarded = Math.round(question.points * scorePercentage);
      isCorrect = pointsAwarded === question.points;
        } else if (question.questionType === 'match_following') {
      try {
        let submittedPairs = typeof answer === 'string' ? JSON.parse(answer) : answer;
        if (!submittedPairs || typeof submittedPairs !== 'object') {
           console.error('Invalid match answer:', answer);
           submittedPairs = {};
        }

        const options = JSON.parse(question.options as string || '[]');
        console.log('Match Logic:', { submittedPairs, optionsLen: options.length });

        let correctCount = 0;
        const totalCount = options.length;

        options.forEach((termOpt: any) => {
          const droppedId = submittedPairs[termOpt.id];
          if (droppedId) {
            const droppedItem = options.find((o: any) => o.id === droppedId);
            if (droppedItem && droppedItem.matchId === termOpt.matchId) {
              correctCount++;
            }
          }
        });

        const scorePercentage = totalCount > 0 ? (correctCount / totalCount) : 0;
        pointsAwarded = Math.round(question.points * scorePercentage);
        isCorrect = correctCount === totalCount;
        
        additionalData = { correctCount, totalCount };
      } catch (error: any) {
        console.error('Match Error:', error);
        isCorrect = false;
        pointsAwarded = 0;
        additionalData = { correctCount: 0, totalCount: 0, error: error.message };
      }
    } else {
      // Robust Grading (Text + Array Support)
      isCorrect = false;
      const cleanAnswer = answer ? String(answer).trim() : '';
      const cleanCorrect = question.correctAnswer ? String(question.correctAnswer).trim() : '';

      console.log(`[submitAnswer] Validating answer for question type: ${question.questionType}`);
      console.log(`[submitAnswer] User answer: "${cleanAnswer}"`);
      console.log(`[submitAnswer] Correct answer: "${cleanCorrect}"`);

      try {
        if (cleanAnswer.startsWith('[') && cleanCorrect.startsWith('[')) {
            const parsedAnswer = JSON.parse(cleanAnswer);
            const parsedCorrect = JSON.parse(cleanCorrect);

            if (Array.isArray(parsedAnswer) && Array.isArray(parsedCorrect)) {
                 const sortedAnswer = [...parsedAnswer].sort().map(s => String(s).trim().toLowerCase());
                 const sortedCorrect = [...parsedCorrect].sort().map(s => String(s).trim().toLowerCase());
                 isCorrect = JSON.stringify(sortedAnswer) === JSON.stringify(sortedCorrect);
                 console.log(`[submitAnswer] Array comparison: ${isCorrect}`);
            } else {
                 isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
                 console.log(`[submitAnswer] String comparison (non-array JSON): ${isCorrect}`);
            }
        } else {
            isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
            console.log(`[submitAnswer] String comparison: ${isCorrect}`);
        }
      } catch (e) {
        isCorrect = cleanAnswer.toLowerCase() === cleanCorrect.toLowerCase();
        console.log(`[submitAnswer] String comparison (fallback): ${isCorrect}`);
      }

      pointsAwarded = isCorrect ? question.points : 0;
      console.log(`[submitAnswer] Points awarded: ${pointsAwarded}/${question.points}`);
    }

    // For true_false_drag_drop, we need to also send correctCount and totalCount

    if (question.questionType === 'true_false_drag_drop') {
      const userAnswer = typeof answer === 'string' ? JSON.parse(answer) : answer;
      const codeBlocks = question.initialTree ? JSON.parse(question.initialTree) : [];

      let correctCount = 0;
      const totalCount = codeBlocks.length;

      if (userAnswer.trueBlocks && Array.isArray(userAnswer.trueBlocks)) {
        userAnswer.trueBlocks.forEach((blockId: string) => {
          const block = codeBlocks.find((b: any) => b.id === blockId);
          if (block && block.correctAnswer === true) {
            correctCount++;
          }
        });
      }

      if (userAnswer.falseBlocks && Array.isArray(userAnswer.falseBlocks)) {
        userAnswer.falseBlocks.forEach((blockId: string) => {
          const block = codeBlocks.find((b: any) => b.id === blockId);
          if (block && block.correctAnswer === false) {
            correctCount++;
          }
        });
      }

      additionalData = { correctCount, totalCount };
    }

    // Save answer with timing information
    const now = new Date();
    let submittedAnswer;

    if (existingAnswer) {
      if (pointsAwarded > (existingAnswer.pointsAwarded || 0)) {
        const scoreDiff = pointsAwarded - (existingAnswer.pointsAwarded || 0);

        [submittedAnswer] = await db
          .update(teamAnswers)
          .set({
            answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
            isCorrect,
            pointsAwarded,
            timeCompleted: now,
            timeTaken: timeTaken || null,
          })
          .where(eq(teamAnswers.id, existingAnswer.id))
          .returning();

        // Update team score with difference
        await db
          .update(teams)
          .set({ score: team.score + scoreDiff })
          .where(eq(teams.id, team.id));
      } else {
        // Keep existing answer if new score is not higher
        submittedAnswer = existingAnswer;
      }
    } else {
      // Insert new answer
      [submittedAnswer] = await db.insert(teamAnswers).values({
        teamId: team.id,
        questionId,
        answer: typeof answer === 'string' ? answer : JSON.stringify(answer),
        isCorrect,
        pointsAwarded,
        timeStarted: timeStarted ? new Date(timeStarted) : null,
        timeCompleted: now,
        timeTaken: timeTaken || null,
      }).returning();

      // Update team score
      await db
        .update(teams)
        .set({ score: team.score + pointsAwarded })
        .where(eq(teams.id, team.id));
    }

    res.json({
      message: 'Answer submitted successfully',
      isCorrect,
      pointsAwarded,
      answer: submittedAnswer,
      ...additionalData,
    });
  } catch (error) {
    console.error('Submit answer error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get team answers
export const getTeamAnswers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { teamNumber } = req.params;

    const [team] = await db.select().from(teams).where(eq(teams.teamNumber, parseInt(teamNumber)));

    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    const answers = await db.select().from(teamAnswers).where(eq(teamAnswers.teamId, team.id));

    res.json(answers);
  } catch (error) {
    console.error('Get team answers error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

// Get current question for presenter view (public - no auth)
export const getCurrentQuestion = async (req: Request, res: Response): Promise<void> => {
  try {
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config || !config.currentQuestionId) {
      res.json(null);
      return;
    }

    const [question] = await db.select().from(questions).where(eq(questions.id, config.currentQuestionId));

    if (!question) {
      res.json(null);
      return;
    }

    // CRITICAL FIX: If it's a bidding question, ONLY return it if global bid mode is active.
    // This prevents polling clients from auto-redirecting when the admin has "Disabled" the round
    // (even if the pointer ID is still set in the database).
    if (question.questionType === 'mcq_bidding' && !config.isBidQuestionActive) {
      res.json(null);
      return;
    }

    res.json(question);
  } catch (error) {
    console.error('Get current question error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
