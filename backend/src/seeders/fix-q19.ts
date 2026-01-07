import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function fix() {
    await db
        .update(questions)
        .set({ questionType: 'image_based' })
        .where(eq(questions.questionNumber, 19));

    console.log('Fixed Question 19 type to image_based');
    process.exit(0);
}

fix().catch(console.error);
