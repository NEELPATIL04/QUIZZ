import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function checkQ7() {
    const [q] = await db.select().from(questions).where(eq(questions.questionNumber, 7));

    console.log('=== Question 7 Data ===');
    console.log('Title:', q.title);
    console.log('correctAnswer:', q.correctAnswer);
    console.log('correctAnswer type:', typeof q.correctAnswer);
    console.log('options:', q.options);
    console.log('options type:', typeof q.options);

    // Parse options
    try {
        const opts = JSON.parse(q.options);
        console.log('\nParsed options:');
        opts.forEach((opt: any) => {
            console.log(`  ${opt.key}: ${opt.text}`);
        });
    } catch (e) {
        console.log('Error parsing options:', e);
    }

    process.exit(0);
}

checkQ7();
