import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function seedJsEngineQuestion() {
  try {
    console.log('🔄 Seeding JS Engine Challenge question...');

    // Check if question already exists
    const existing = await db
      .select()
      .from(questions)
      .where(eq(questions.questionNumber, 3));

    if (existing.length > 0) {
      console.log('⚠️  Question 3 already exists. Skipping...');
      return;
    }

    // Create JS Engine Challenge question
    const [question] = await db
      .insert(questions)
      .values({
        questionNumber: 3,
        title: 'JavaScript Engine Execution Flow',
        description: 'Drag code blocks through the JavaScript engine execution flow. Move synchronous code to Call Stack, async operations to Web API, and callbacks to the correct queues (Microtask or Macrotask).',
        questionType: 'js_engine_challenge',
        points: 100,
        isEnabled: true,
        // Store expected solution for validation
        correctAnswer: JSON.stringify({
          expectedPlacements: {
            '1': 'executed', // console.log("Start")
            '2': 'macrotask', // setTimeout 1000ms
            '3': 'microtask', // Promise 1
            '4': 'macrotask', // setTimeout 0ms
            '5': 'microtask', // queueMicrotask
            '6': 'microtask', // Promise 2
            '7': 'executed', // console.log("End")
          },
          expectedOutput: ['Start', 'End', 'Promise 1', 'Microtask 2', 'Promise 2', 'Timeout 2', 'Timeout 1']
        }),
      })
      .returning();

    console.log(`✅ Created Question 3: ${question.title}`);
    console.log('✨ JS Engine Challenge question seeded successfully!');
  } catch (error) {
    console.error('Error seeding JS Engine question:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  seedJsEngineQuestion()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
