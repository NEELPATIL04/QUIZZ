
import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { like, eq } from 'drizzle-orm';

async function checkQuestion() {
    console.log('Searching for "JavaScript Array Map" question...');

    // Search by title similarity
    const results = await db.select().from(questions).where(like(questions.title, '%JavaScript Array Map%'));

    if (results.length === 0) {
        console.log('No question found with that title.');

        // Also check Q7 explicitly just in case
        const q7 = await db.select().from(questions).where(eq(questions.questionNumber, 7));
        if (q7.length > 0) {
            console.log('Found Question #7:', q7[0].title);
            console.log('Options:', q7[0].options);
        }
    } else {
        results.forEach(q => {
            console.log(`\nFound ID: ${q.id}`);
            console.log(`Number: ${q.questionNumber}`);
            console.log(`Title: ${q.title}`);
            console.log(`Options (Raw):`, q.options);
            console.log(`Correct Answer:`, q.correctAnswer);
            console.log('-------------------');
        });
    }
    process.exit(0);
}

checkQuestion().catch(console.error);
