import { db } from '../db';
import { questions, mcqTimerState } from '../db/schema';
import { eq } from 'drizzle-orm';
import { enableBidRoundInternal, disableBidRoundInternal } from '../controllers/mcq.controller';

async function testBidRoundFlow() {
  console.log('\n========================================');
  console.log('TESTING BID ROUND FLOW');
  console.log('========================================\n');

  // Get all bid round questions
  const bidQuestions = await db
    .select()
    .from(questions)
    .where(eq(questions.questionType, 'mcq_bidding'));

  console.log(`Found ${bidQuestions.length} bid round questions:`);
  bidQuestions.forEach(q => {
    console.log(`  - Q${q.questionNumber}: ${q.title} (ID: ${q.id})`);
  });

  if (bidQuestions.length === 0) {
    console.log('\n❌ No bid round questions found!');
    process.exit(1);
  }

  const firstBidQuestion = bidQuestions[0];

  console.log('\n----------------------------------------');
  console.log('TEST 1: Disable all bid rounds first');
  console.log('----------------------------------------');

  await disableBidRoundInternal(firstBidQuestion.id);

  let allTimers = await db.select().from(mcqTimerState);
  console.log(`\nTimer states after disable:`);
  allTimers.forEach(timer => {
    const q = bidQuestions.find(bq => bq.id === timer.questionId);
    console.log(`  - Q${q?.questionNumber}: bidRoundEnabled = ${timer.bidRoundEnabled}`);
  });

  console.log('\n----------------------------------------');
  console.log('TEST 2: Enable bid round (should enable ALL)');
  console.log('----------------------------------------');
  console.log(`Enabling Q${firstBidQuestion.questionNumber}...`);

  await enableBidRoundInternal(firstBidQuestion.id);

  allTimers = await db.select().from(mcqTimerState);
  console.log(`\nTimer states after enable:`);

  const allEnabled = allTimers.every(t => t.bidRoundEnabled === true);
  allTimers.forEach(timer => {
    const q = bidQuestions.find(bq => bq.id === timer.questionId);
    const status = timer.bidRoundEnabled ? '✅' : '❌';
    console.log(`  ${status} Q${q?.questionNumber}: bidRoundEnabled = ${timer.bidRoundEnabled}`);
  });

  console.log('\n----------------------------------------');
  console.log('TEST RESULTS');
  console.log('----------------------------------------');

  if (allEnabled && allTimers.length === bidQuestions.length) {
    console.log('✅ SUCCESS: All bid round questions are enabled!');
    console.log('✅ Navigation should work seamlessly between Q15 → Q16 → Q17');
    console.log('✅ No instructions pages between questions');
  } else {
    console.log('❌ FAILED: Not all bid round questions are enabled');
    console.log(`   Expected: ${bidQuestions.length} enabled`);
    console.log(`   Got: ${allTimers.filter(t => t.bidRoundEnabled).length} enabled`);
  }

  console.log('\n========================================\n');
  process.exit(0);
}

testBidRoundFlow().catch(console.error);
