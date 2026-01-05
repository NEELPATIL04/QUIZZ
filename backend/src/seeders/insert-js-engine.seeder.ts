import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

(async () => {
  try {
    console.log('🔄 Inserting JS Engine Challenge as Question 3...');

    // First, check what's currently at position 3
    const [currentQ3] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionNumber, 3));

    if (currentQ3) {
      console.log(`Current Q3: ${currentQ3.title} (${currentQ3.questionType})`);

      // If it's MCQ, we need to move MCQs to Q5 and Q6 first
      if (currentQ3.questionType === 'mcq_bidding') {
        console.log('Moving MCQ questions to make room...');

        const allQuestions = await db.select().from(questions).orderBy(questions.questionNumber);
        const mcqQuestions = allQuestions.filter(q => q.questionType === 'mcq_bidding');

        // Delete current Q3
        await db.delete(questions).where(eq(questions.id, currentQ3.id));
        console.log('✅ Deleted old Q3');
      }
    }

    // Create JS Engine Challenge as Question 3
    const [question] = await db
      .insert(questions)
      .values({
        questionNumber: 3,
        title: 'JavaScript Engine Execution Flow',
        description: 'Drag code blocks through the JavaScript engine execution flow. Move synchronous code to Call Stack, async operations to Web API, and callbacks to the correct queues (Microtask or Macrotask).',
        questionType: 'js_engine_challenge',
        points: 100,
        isEnabled: true,
        correctAnswer: JSON.stringify({
          expectedPlacements: {
            '1': 'executed',
            '2': 'macrotask',
            '3': 'microtask',
            '4': 'macrotask',
            '5': 'microtask',
            '6': 'microtask',
            '7': 'executed',
          },
          expectedOutput: ['Start', 'End', 'Promise 1', 'Microtask 2', 'Promise 2', 'Timeout 2', 'Timeout 1']
        }),
      })
      .returning();

    console.log(`✅ Created Question 3: ${question.title}`);

    // Show final order
    const finalQuestions = await db.select().from(questions).orderBy(questions.questionNumber);
    console.log('\n📋 Current question order:');
    finalQuestions.forEach(q => {
      console.log(`  Q${q.questionNumber}: ${q.title} (${q.questionType})`);
    });

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
})();
