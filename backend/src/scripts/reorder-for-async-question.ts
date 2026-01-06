import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq, gte } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

async function reorderForAsyncQuestion() {
    console.log('Reordering questions to make space at Q12...');

    // Strategy:
    // 1. Find all questions > 11 (so 12, 13, etc)
    // 2. Sort them descending so we can move them up without collision
    // 3. Increment their questionNumber by 1

    const questionsToMove = await db.select()
        .from(questions)
        .where(gte(questions.questionNumber, 12))
        .orderBy(desc(questions.questionNumber));

    if (questionsToMove.length === 0) {
        console.log('No questions found to move.');
        process.exit(0);
    }

    console.log(`Found ${questionsToMove.length} questions to move.`);

    // Update one by one to avoid conflicts (though desc order helps)
    // Or better, move them all to a temporary range first if needed, but desc order update should work if unique constraint allows?
    // Actually, standard unique constraint might fail if update isn't atomic per row or smart.
    // Safer to move to temp space? 
    // Let's try direct update in descending order. DB should verify constraint at end of statement or row by row?
    // Postgres unique constraint checks after each row update in a statement? No, usually deferred or per statement.
    // But we are doing loop of await db.update which is separate transactions/statements.

    // So: 
    // Q13 -> Q14 (Space 14 is free)
    // Q12 -> Q13 (Space 13 is free now)

    for (const q of questionsToMove) {
        console.log(`Moving Q${q.questionNumber} (${q.title}) to ${q.questionNumber + 1}...`);
        await db.update(questions)
            .set({ questionNumber: q.questionNumber + 1 })
            .where(eq(questions.id, q.id));
    }

    console.log('Reorder complete!');
    process.exit(0);
}

reorderForAsyncQuestion().catch((err) => {
    console.error('Reorder failed:', err);
    process.exit(1);
});
