import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function fixQuestion7() {
    console.log('🔧 Fixing Question 7 (JavaScript Array Map & Length Mutation)...');

    try {
        // Find question 7
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.questionNumber, 7));

        if (!question) {
            console.log('❌ Question 7 not found!');
            process.exit(1);
        }

        console.log(`Found: ${question.title}`);
        console.log(`Current options type: ${typeof question.options}`);
        console.log(`Current options value: ${question.options}`);

        // Correct options for Question 7
        const correctOptions = [
            { key: 'A', text: '[2, 4] [1, 2]' },
            { key: 'B', text: '[2, 4, 6] [1, 2, 3]' },
            { key: 'C', text: '[2, 4, empty] [1, 2]' },
            { key: 'D', text: '[2, 4, 6] [1, 2]' }
        ];

        // Update the question
        await db
            .update(questions)
            .set({
                options: JSON.stringify(correctOptions),
                correctAnswer: 'C',
                description: `\`\`\`javascript
let arr = [1, 2, 3];

let res = arr.map((x, i, a) => {
  a.length = 2;
  return x * 2;
});

console.log(res, arr);
\`\`\``
            })
            .where(eq(questions.id, question.id));

        console.log('✅ Question 7 fixed!');
        console.log(`New options: ${JSON.stringify(correctOptions)}`);

        // Verify
        const [updated] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, question.id));

        console.log('\n✓ Verification:');
        console.log(`  Title: ${updated.title}`);
        console.log(`  Options: ${updated.options}`);
        console.log(`  Correct Answer: ${updated.correctAnswer}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixQuestion7();
