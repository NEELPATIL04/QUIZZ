import { db } from '../db';
import { questions } from '../db/schema';
import { inArray } from 'drizzle-orm';

async function fix() {
    await db
        .update(questions)
        .set({ questionType: 'multiple_choice' })
        .where(inArray(questions.questionNumber, [22, 23]));

    console.log('Reverted Questions 22 and 23 to multiple_choice');
    process.exit(0);
}

fix().catch(console.error);
