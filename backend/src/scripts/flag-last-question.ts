
import { db } from '../db';
import { questions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

async function main() {
    console.log('🔄 Identifying Last Question to Flag...');

    // Find the question with the highest number
    const [lastQuestion] = await db.select()
        .from(questions)
        .orderBy(desc(questions.questionNumber))
        .limit(1);

    if (!lastQuestion) {
        console.error('❌ No questions found!');
        process.exit(1);
    }

    console.log(`Found Last Question: Q${lastQuestion.questionNumber} - "${lastQuestion.title}"`);

    // Unflag all others first (to be safe/clean)
    await db.update(questions).set({ isFlagged: false });

    // Flag the last one
    await db.update(questions)
        .set({ isFlagged: true })
        .where(eq(questions.id, lastQuestion.id));

    console.log(`✅ Flagged Q${lastQuestion.questionNumber} as End of Quiz Trigger.`);
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
