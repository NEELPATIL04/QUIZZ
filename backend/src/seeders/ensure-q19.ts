import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function ensure() {
    await db
        .update(questions)
        .set({ questionType: 'mcq_bidding' }) // Ensure it is bidding type so logic works
        .where(eq(questions.questionNumber, 19));

    console.log('Ensured Question 19 is mcq_bidding');
    process.exit(0);
}

ensure().catch(console.error);
