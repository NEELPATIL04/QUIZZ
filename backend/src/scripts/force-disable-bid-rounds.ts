import { db } from '../db';
import { sql } from 'drizzle-orm';

async function forceDisableBidRounds() {
  console.log('\n=== Force Disabling All Bid Rounds ===\n');

  // Use raw SQL to ensure it works
  await db.execute(sql`
    UPDATE mcq_timer_state
    SET
      bid_round_enabled = false,
      is_running = false,
      time_remaining = 10,
      started_at = NULL,
      bidding_closed = false,
      answer_revealed = false,
      updated_at = NOW()
  `);

  console.log('✅ All timer states set to bidRoundEnabled = false\n');

  await db.execute(sql`
    UPDATE quiz_config
    SET
      is_bid_question_active = false,
      updated_at = NOW()
  `);

  console.log('✅ Global bid mode disabled\n');
  console.log('All bid rounds forcefully disabled!\n');

  // Verify
  const result = await db.execute(sql`
    SELECT * FROM mcq_timer_state
  `);

  console.log('Verification:');
  result.rows.forEach((row: any) => {
    console.log(`  Question ID: ${row.question_id}`);
    console.log(`  bidRoundEnabled: ${row.bid_round_enabled}`);
    console.log('  ---');
  });

  process.exit(0);
}

forceDisableBidRounds().catch(console.error);
