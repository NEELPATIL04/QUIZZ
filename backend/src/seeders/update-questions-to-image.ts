import { db } from '../db';
import { questions } from '../db/schema';
import { eq, inArray } from 'drizzle-orm';

async function seed() {
    // Update questions 21, 22, 23 (and 20 if it exists) to be 'image_based'
    // I will check for questions with titles 'JS Equality', 'JS Coercion', 'JS Scope & this'

    const targetTitles = ['JS Equality', 'JS Coercion', 'JS Scope & this'];

    const updated = await db
        .update(questions)
        .set({ questionType: 'image_based' })
        .where(inArray(questions.title, targetTitles))
        .returning();

    console.log(`Updated ${updated.length} questions to type 'image_based'`);
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
