import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const spreadOperatorQuestion = {
  questionNumber: 24,
  questionType: 'multiple_choice' as const,
  title: 'JavaScript Spread Operator & Shallow Copy',
  description: `Consider the following code:

\`\`\`javascript
const obj = { user: { name: "A" } };
const copy = { ...obj };
copy.user.name = "B";
\`\`\`

Which statements are TRUE?`,
  options: JSON.stringify([
    { key: 'A', text: 'obj.user.name becomes "B"' },
    { key: 'B', text: 'copy is a deep copy' },
    { key: 'C', text: 'Spread performs shallow copy' },
    { key: 'D', text: 'obj remains unchanged' }
  ]),
  correctAnswer: JSON.stringify(['A', 'C']), // Multiple correct answers
  points: 100,
  isEnabled: false,
};

export async function seedSpreadOperatorQuestion() {
  console.log('🌱 Seeding Spread Operator MCQ question...');

  // Check if question already exists
  const [existing] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionNumber, spreadOperatorQuestion.questionNumber));

  if (existing) {
    console.log(`   ⚠️  Question ${spreadOperatorQuestion.questionNumber} already exists, updating...`);

    // Update existing question
    await db
      .update(questions)
      .set({
        ...spreadOperatorQuestion,
        updatedAt: new Date()
      })
      .where(eq(questions.questionNumber, spreadOperatorQuestion.questionNumber));

    console.log(`   ✅ Updated Question ${spreadOperatorQuestion.questionNumber}: "${spreadOperatorQuestion.title}"`);
  } else {
    // Insert new question
    await db
      .insert(questions)
      .values(spreadOperatorQuestion);

    console.log(`   ✅ Created Question ${spreadOperatorQuestion.questionNumber}: "${spreadOperatorQuestion.title}"`);
  }

  console.log('✨ Spread Operator question seeding complete!\n');
}

// Run if executed directly
if (require.main === module) {
  seedSpreadOperatorQuestion()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding Spread Operator question:', error);
      process.exit(1);
    });
}
