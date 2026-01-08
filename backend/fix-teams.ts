import { db } from './src/db';
import { teams, quizConfig } from './src/db/schema';
import { sql } from 'drizzle-orm';

async function fixTeams() {
  try {
    console.log('Starting team fix...');

    // Get current config
    const [config] = await db.select().from(quizConfig).limit(1);

    if (!config) {
      console.log('No config found. Please set up quiz config first.');
      return;
    }

    console.log(`Config: ${config.numberOfTeams} teams expected`);

    // Get existing teams
    const existingTeams = await db.select().from(teams).orderBy(teams.teamNumber);
    console.log(`Found ${existingTeams.length} existing teams:`);
    existingTeams.forEach(t => {
      console.log(`  - Team ${t.teamNumber}: ${t.teamName} (ID: ${t.id})`);
    });

    // Check for duplicates
    const teamNumbers = existingTeams.map(t => t.teamNumber);
    const duplicates = teamNumbers.filter((num, idx) => teamNumbers.indexOf(num) !== idx);

    if (duplicates.length > 0) {
      console.log(`\n⚠️  Found duplicate team numbers: ${duplicates.join(', ')}`);
      console.log('Removing duplicates...');

      // Keep the first occurrence, delete others
      for (const dupNum of new Set(duplicates)) {
        const dupsForNum = existingTeams.filter(t => t.teamNumber === dupNum);
        // Delete all but the first
        for (let i = 1; i < dupsForNum.length; i++) {
          await db.delete(teams).where(sql`id = ${dupsForNum[i].id}`);
          console.log(`  Deleted duplicate Team ${dupNum} (ID: ${dupsForNum[i].id})`);
        }
      }
    }

    // Check for missing team numbers (1 to numberOfTeams)
    const existingNumbers = new Set(existingTeams.map(t => t.teamNumber));
    const missingNumbers = [];

    for (let i = 1; i <= config.numberOfTeams; i++) {
      if (!existingNumbers.has(i)) {
        missingNumbers.push(i);
      }
    }

    if (missingNumbers.length > 0) {
      console.log(`\n✓ Missing team numbers: ${missingNumbers.join(', ')}`);
      console.log('These will be created when you call the initialize endpoint.');
    } else {
      console.log('\n✓ All team numbers from 1 to ' + config.numberOfTeams + ' exist.');
    }

    // Final check
    const finalTeams = await db.select().from(teams).orderBy(teams.teamNumber);
    console.log(`\n✓ Final team list (${finalTeams.length} teams):`);
    finalTeams.forEach(t => {
      console.log(`  Team ${t.teamNumber}: ${t.teamName} (Score: ${t.score})`);
    });

    console.log('\n✅ Team fix complete!');
    process.exit(0);
  } catch (error) {
    console.error('Error fixing teams:', error);
    process.exit(1);
  }
}

fixTeams();
