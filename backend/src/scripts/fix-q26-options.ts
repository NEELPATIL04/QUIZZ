import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function fixQuestion26() {
    console.log('🔧 Fixing Question 26 (JavaScript Array Map & Length Mutation)...');

    try {
        // Find question by title
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.questionNumber, 26));

        if (!question) {
            console.log('❌ Question 26 not found!');
            process.exit(1);
        }

        console.log(`Found: ${question.title}`);
        console.log(`Current options: ${question.options}`);

        // Correct options
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
                correctAnswer: 'C'
            })
            .where(eq(questions.id, question.id));

        console.log('✅ Question 26 fixed!');
        console.log(`New options: ${JSON.stringify(correctOptions)}`);

        // Verify
        const [updated] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, question.id));

        console.log('\n✓ Verification:');
        console.log(`  Options: ${updated.options}`);
        console.log(`  Correct Answer: ${updated.correctAnswer}`);

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error);
        process.exit(1);
    }
}

fixQuestion26();
