
import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const newAsyncQuestions = [
    {
        questionNumber: 8,
        questionType: 'multiple_choice' as const,
        title: 'Async/Await Execution Order - Part 1',
        description: `\`\`\`javascript
let result = 0;

async function first() {
  result += 1;
  await Promise.resolve();
  result += 10;
}

async function second() {
  result += 2;
  await first();
  result += 20;
}

second();

Promise.resolve().then(() => {
  console.log(result);
});
\`\`\``,
        options: JSON.stringify([
            { key: 'A', text: '33' },
            { key: 'B', text: '13' },
            { key: 'C', text: '3' },
            { key: 'D', text: '23' }
        ]),
        correctAnswer: 'B',
        points: 100,
        isEnabled: true,
    },
    {
        questionNumber: 9,
        questionType: 'multiple_choice' as const,
        title: 'Async/Await Execution Order - Part 2',
        description: `\`\`\`javascript
let flag = false;

async function a() {
  await Promise.resolve();
  flag = true;
  return false;
}

async function b() {
  const res = await a();
  flag = res;
}

b();

Promise.resolve().then(() => {
  console.log(flag);
});
\`\`\``,
        options: JSON.stringify([
            { key: 'A', text: 'true' },
            { key: 'B', text: 'false' },
            { key: 'C', text: 'undefined' },
            { key: 'D', text: 'ReferenceError' }
        ]),
        correctAnswer: 'A',
        points: 100,
        isEnabled: true,
    }
];

export async function seedMoreJsQuestions() {
    console.log('🌱 Seeding More JS Questions (Q8 & Q9)...');

    // Insert/Update Q8 & Q9
    for (const q of newAsyncQuestions) {
        const [existing] = await db.select().from(questions).where(eq(questions.questionNumber, q.questionNumber));

        if (existing) {
            console.log(`   ⚠️  Question ${q.questionNumber} already exists, updating description & fields...`);
            await db.update(questions).set(q).where(eq(questions.id, existing.id));
        } else {
            await db.insert(questions).values(q);
            console.log(`   ✅ Created Question ${q.questionNumber}: "${q.title}"`);
        }
    }

    console.log('✨ More JS Questions seeding complete!\n');
}

if (require.main === module) {
    seedMoreJsQuestions()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}
