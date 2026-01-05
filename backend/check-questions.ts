import { db } from './src/db';
import { questions } from './src/db/schema';

(async () => {
  try {
    const allQ = await db.select().from(questions);
    const sorted = allQ.sort((a, b) => a.questionNumber - b.questionNumber);

    console.log('\n📋 Current Questions:');
    sorted.forEach(q => {
      console.log(`  Q${q.questionNumber}: ${q.title} (${q.questionType}) - ${q.isEnabled ? 'ENABLED' : 'disabled'}`);
    });
    console.log(`\nTotal: ${sorted.length} questions\n`);
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
