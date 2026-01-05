import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function fixMcqNumbers() {
  console.log('🔧 Fixing MCQ question numbers...\n');

  // Delete the old Q6 (JavaScript Call Stack)
  const [oldQ6] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionNumber, 6));

  if (oldQ6) {
    console.log(`   🗑️  Deleting old Q6: "${oldQ6.title}"`);
    await db.delete(questions).where(eq(questions.id, oldQ6.id));
  }

  // Now seed the new Q6 and Q7
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

  for (const questionData of mcqQuestionsData) {
    const [existing] = await db
      .select()
      .from(questions)
      .where(eq(questions.questionNumber, questionData.questionNumber));

    if (existing) {
      console.log(`   ⚠️  Question ${questionData.questionNumber} already exists, updating...`);
      await db
        .update(questions)
        .set(questionData)
        .where(eq(questions.id, existing.id));
      console.log(`   ✅ Updated Q${questionData.questionNumber}: "${questionData.title}"`);
    } else {
      await db
        .insert(questions)
        .values(questionData)
        .returning();
      console.log(`   ✅ Created Q${questionData.questionNumber}: "${questionData.title}"`);
    }
  }

  console.log('\n✨ MCQ questions fixed!\n');
}

fixMcqNumbers()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
