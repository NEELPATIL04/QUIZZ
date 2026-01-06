import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function reorderQuestions() {
    console.log('Reordering questions...');

    // Hardcoded for the specific state we identified:
    // Move Q13 (Match Following) -> Q11 (Before Bid Round)
    // Shift Q11, Q12 -> +1

    // Use select() which is safer/standard Drizzle syntax
    const q13Result = await db.select().from(questions).where(eq(questions.questionNumber, 13)).limit(1);
    const q12Result = await db.select().from(questions).where(eq(questions.questionNumber, 12)).limit(1);
    const q11Result = await db.select().from(questions).where(eq(questions.questionNumber, 11)).limit(1);

    const q13 = q13Result[0];
    const q12 = q12Result[0];
    const q11 = q11Result[0];

    if (!q13 || !q12 || !q11) {
        console.error('Could not find one of the target questions (11, 12, 13). Questions might already be reordered.');
        // Check if maybe 13 is already match following? No, logic depends on original state.
        process.exit(1);
    }

    console.log(`Found questions: Q11=${q11.id}, Q12=${q12.id}, Q13=${q13.id}`);

    // Transaction-like updates

    // Step 1: Move Q13 to a temporary safe spot (999)
    console.log(`Moving Q13 (${q13.title}) to 999...`);
    await db.update(questions).set({ questionNumber: 999 }).where(eq(questions.id, q13.id));

    // Step 2: Move Q12 to 13
    console.log(`Moving Q12 (${q12.title}) to 13...`);
    await db.update(questions).set({ questionNumber: 13 }).where(eq(questions.id, q12.id));

    // Step 3: Move Q11 to 12
    console.log(`Moving Q11 (${q11.title}) to 12...`);
    await db.update(questions).set({ questionNumber: 12 }).where(eq(questions.id, q11.id));

    // Step 4: Move Q999 (Original 13) to 11
    console.log(`Moving Q999 (${q13.title}) to 11...`);
    await db.update(questions).set({ questionNumber: 11 }).where(eq(questions.id, q13.id));

    console.log('Reorder complete!');
    process.exit(0);
}

reorderQuestions().catch((err) => {
    console.error('Reorder failed:', err);
    process.exit(1);
});
