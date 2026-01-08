import { db } from '../db';
import { mcqTimerState, quizConfig } from '../db/schema';
import { eq } from 'drizzle-orm';

async function disableAllBidRounds() {
  console.log('\n=== Disabling All Bid Rounds ===\n');

  // Disable all bid round timer states
  const result = await db
    .update(mcqTimerState)
    .set({
      bidRoundEnabled: false,
      updatedAt: new Date(),
    })
    .returning();

  console.log(`Disabled ${result.length} bid round timer states\n`);

  // Disable global bid mode
  const [config] = await db.select().from(quizConfig).limit(1);
  if (config) {
    await db
      .update(quizConfig)
      .set({
        isBidQuestionActive: false,
        updatedAt: new Date(),
      })
      .where(eq(quizConfig.id, config.id));
    console.log('Global bid mode disabled\n');
  }

  console.log('All bid rounds disabled successfully!\n');
  process.exit(0);
}

disableAllBidRounds().catch(console.error);
