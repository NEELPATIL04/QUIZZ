import { db } from '../db';
import { teams } from '../db/schema';

(async () => {
  try {


    // Update all teams to have 700 points
    const updated = await db
      .update(teams)
      .set({ score: 700 })
      .returning();

    console.log('✅ Updated teams:');
    updated.forEach(t => {
      console.log(`  Team ${t.teamNumber}: ${t.teamName} - Score: ${t.score} points`);
    });

    console.log('\n✨ All team scores reset to 700 points!');
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
