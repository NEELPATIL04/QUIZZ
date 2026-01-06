import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq, gte } from 'drizzle-orm';
import { desc } from 'drizzle-orm';

async function reorderForCssImages() {
    console.log('Reordering questions to make space at Q13, Q14, Q15...');

    // Strategy:
    // Shift questions >= 13 by +3
    // Q14 -> Q17
    // Q13 -> Q16

    const questionsToMove = await db.select()
        .from(questions)
        .where(gte(questions.questionNumber, 13))
        .orderBy(desc(questions.questionNumber));

    if (questionsToMove.length === 0) {
        console.log('No questions found to move.');
        process.exit(0);
    }

    console.log(`Found ${questionsToMove.length} questions to move.`);

    for (const q of questionsToMove) {
        console.log(`Moving Q${q.questionNumber} (${q.title}) to ${q.questionNumber + 3}...`);
        await db.update(questions)
            .set({ questionNumber: q.questionNumber + 3 })
            .where(eq(questions.id, q.id));
    }

    console.log('Reorder complete!');
    process.exit(0);
}

reorderForCssImages().catch((err) => {
    console.error('Reorder failed:', err);
    process.exit(1);
});
