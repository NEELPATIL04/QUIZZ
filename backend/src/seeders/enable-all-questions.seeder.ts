import { db } from '../db';
import { questions } from '../db/schema';

export async function enableAllQuestions() {
  try {
    console.log('🔓 Enabling all questions...\n');

    // Get all questions
    const allQuestions = await db.select().from(questions).orderBy(questions.questionNumber);

    console.log('Current Status:');
    allQuestions.forEach(q => {
      console.log(`  Q${q.questionNumber}: ${q.title} - ${q.isEnabled ? '✅ Enabled' : '❌ Disabled'}`);
    });

    // Enable all questions
    const result = await db
      .update(questions)
      .set({ isEnabled: true })
      .returning();

    console.log(`\n✅ Enabled ${result.length} questions!`);
    console.log('\nAll questions are now enabled and visible to teams.\n');

  } catch (error) {
    console.error('Error enabling questions:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  enableAllQuestions()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
