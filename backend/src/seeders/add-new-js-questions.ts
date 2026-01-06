
import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const newQuestions = [
    {
        questionNumber: 106,
        questionType: 'multiple_choice' as const,
        title: 'JavaScript Array Map & Length Mutation',
        description: `\`\`\`javascript
let arr = [1, 2, 3];

let res = arr.map((x, i, a) => {
  a.length = 2;
  return x * 2;
});

console.log(res, arr);
\`\`\``,
        options: JSON.stringify([
            { key: 'A', text: '[2, 4] [1, 2]' },
            { key: 'B', text: '[2, 4, 6] [1, 2, 3]' },
            { key: 'C', text: '[2, 4, empty] [1, 2]' },
            { key: 'D', text: '[2, 4, 6] [1, 2]' }
        ]),
        correctAnswer: 'C',
        points: 100,
        isEnabled: true,
    },
    {
        questionNumber: 107,
        questionType: 'multiple_choice' as const,
        title: 'JavaScript Infinite Loop & Push',
        description: `\`\`\`javascript
let arr = [1, 2, 3];

for (let x of arr) {
  arr.push(x * 10);
}

console.log(arr);
\`\`\``,
        options: JSON.stringify([
            { key: 'A', text: '[1, 2, 3, 10, 20, 30]' },
            { key: 'B', text: '[1, 2, 3]' },
            { key: 'C', text: 'Infinite loop / program never finishes' },
            { key: 'D', text: '[1, 2, 3, 10]' }
        ]),
        correctAnswer: 'C',
        points: 100,
        isEnabled: true,
    }
];

export async function seedNewJsQuestions() {
    console.log('🌱 Seeding New JS Questions (Q6 & Q7)...');

    // Insert/Update Q6 & Q7
    for (const q of newQuestions) {
        const [existing] = await db.select().from(questions).where(eq(questions.questionNumber, q.questionNumber));

        if (existing) {
            console.log(`   ⚠️  Question ${q.questionNumber} already exists, updating description & fields...`);
            await db.update(questions).set(q).where(eq(questions.id, existing.id));
        } else {
            await db.insert(questions).values(q);
            console.log(`   ✅ Created Question ${q.questionNumber}: "${q.title}"`);
        }
    }

    console.log('✨ New JS Questions seeding complete!\n');
}

if (require.main === module) {
    seedNewJsQuestions()
        .then(() => {
            console.log('Done!');
            process.exit(0);
        })
        .catch((error) => {
            console.error('Error:', error);
            process.exit(1);
        });
}
