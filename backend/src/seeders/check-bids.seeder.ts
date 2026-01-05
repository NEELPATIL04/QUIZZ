import { db } from '../db';
import { teams, mcqBids } from '../db/schema';

(async () => {
  try {
    console.log('🔍 Checking teams and bids...\n');

    // Get all teams
    const allTeams = await db.select().from(teams).orderBy(teams.teamNumber);

    console.log('Teams:');
    allTeams.forEach(t => {
      console.log(`  Team ${t.teamNumber}: ${t.teamName} - Score: ${t.score} points`);
    });

    // Get all bids
    const allBids = await db.select().from(mcqBids);

    console.log('\nBids:');
    if (allBids.length === 0) {
      console.log('  No bids found');
    } else {
      allBids.forEach(b => {
        console.log(`  Team ID ${b.teamId} - Question ${b.questionId} - Option: ${b.selectedOption} - Bid: ${b.bidAmount} points`);
      });
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
