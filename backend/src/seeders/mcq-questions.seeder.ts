import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const mcqQuestionsData = [
  {
    questionNumber: 6,
    questionType: 'mcq_bidding' as const,
    title: 'JavaScript Engine Execution Sequence',
    description: 'When JavaScript code is executed by the JS engine, which sequence correctly represents how the engine processes the code?',
    options: JSON.stringify([
      { key: 'A', text: 'Parse → Execute line by line → Allocate memory when needed' },
      { key: 'B', text: 'Create execution context → Execute code → Parse code' },
      { key: 'C', text: 'Parse code → Create execution context (memory + code phase) → Execute code' },
      { key: 'D', text: 'Execute code → Optimize → Parse code' }
    ]),
    correctAnswer: 'C',
    points: 100,
    isEnabled: false,
  },
  {
    questionNumber: 7,
    questionType: 'mcq_bidding' as const,
    title: 'JavaScript Call Stack',
    description: 'Which statement about the JavaScript Call Stack is TRUE?',
    options: JSON.stringify([
      { key: 'A', text: 'The call stack stores variables and objects permanently' },
      { key: 'B', text: 'The call stack executes multiple functions at the same time' },
      { key: 'C', text: 'Each function call creates a new execution context that is pushed onto the call stack' },
      { key: 'D', text: 'The call stack handles asynchronous operations like setTimeout' }
    ]),
    correctAnswer: 'C',
    points: 100,
    isEnabled: false,
  }
];

export async function seedMcqQuestions() {
  console.log('🌱 Seeding MCQ bidding questions...');

  for (const questionData of mcqQuestionsData) {
    // Check if question already exists
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionNumber, questionData.questionNumber));

    if (existing) {
      console.log(`   ⚠️  Question ${questionData.questionNumber} already exists, skipping...`);
      continue;
    }

    // Insert question
    const [inserted] = await db
      .insert(questions)
      .values(questionData)
      .returning();

    console.log(`   ✅ Created MCQ Question ${questionData.questionNumber}: "${questionData.title}"`);
  }

  console.log('✨ MCQ questions seeding complete!\n');
}

// Run if executed directly
if (require.main === module) {
  seedMcqQuestions()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding MCQ questions:', error);
      process.exit(1);
    });
}
