import { db } from '../db';
import { questions, mcqTimerState } from '../db/schema';
import { eq } from 'drizzle-orm';

async function checkBidTimerStates() {
  console.log('\n=== Checking Bid Round Questions and Timer States ===\n');

  // Get all bid round questions
  const bidQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionType, 'mcq_bidding'));

  console.log(`Found ${bidQuestions.length} bid round questions:\n`);

  for (const q of bidQuestions) {
    console.log(`Question ID: ${q.id}`);
    console.log(`Question Number: ${q.questionNumber}`);
    console.log(`Title: ${q.title}`);

    // Get timer state for this question
    const [timer] = await db
      .select()
      .from(mcqTimerState)
      .where(eq(mcqTimerState.questionId, q.id));

    if (timer) {
      console.log(`Timer State:`);
      console.log(`  - bidRoundEnabled: ${timer.bidRoundEnabled}`);
      console.log(`  - isRunning: ${timer.isRunning}`);
      console.log(`  - timeRemaining: ${timer.timeRemaining}`);
      console.log(`  - biddingClosed: ${timer.biddingClosed}`);
      console.log(`  - answerRevealed: ${timer.answerRevealed}`);
    } else {
      console.log(`Timer State: NOT CREATED YET`);
    }
    console.log('---\n');
  }

  // Check all timer states in database
  console.log('\n=== All Timer States in Database ===\n');
  const allTimers = await db.select().from(mcqTimerState);
  console.log(`Total timer states: ${allTimers.length}\n`);

  for (const timer of allTimers) {
    console.log(`Timer for Question ID: ${timer.questionId}`);
    console.log(`  - bidRoundEnabled: ${timer.bidRoundEnabled}`);
    console.log(`  - isRunning: ${timer.isRunning}`);
    console.log(`  - timeRemaining: ${timer.timeRemaining}`);
    console.log('---\n');
  }

  process.exit(0);
}

checkBidTimerStates().catch(console.error);
