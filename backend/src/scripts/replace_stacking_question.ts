
import { db } from '../db';
import { questions } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
    console.log('🔄 Replacing "The Stacking Context Trap" with "Flexbox Centering Master"...');

    // Find the question
    const found = await db.select().from(questions).where(ilike(questions.title, '%Stacking Context%'));

    if (found.length === 0) {
        console.error('❌ Question "The Stacking Context Trap" not found!');
        process.exit(1);
    }

    const targetQ = found[0];
    console.log(`✅ Found Q${targetQ.questionNumber} (ID: ${targetQ.id})`);

    const newOptions = [
        { key: "A", text: "display: flex; justify-content: center; align-items: center;" },
        { key: "B", text: "display: flex; align-content: center; justify-self: center;" },
        { key: "C", text: "display: block; margin: auto; text-align: center;" },
        { key: "D", text: "display: grid; grid-template-columns: center;" }
    ];

    await db.update(questions)
        .set({
            title: 'Flexbox Centering Master',
            description: `![Centering](/images/quiz/flexbox_centered.png)\n\nWhich CSS properties are required on the **PARENT** container to perfectly center the blue child element both horizontally and vertically?`,
            options: JSON.stringify(newOptions),
            correctAnswer: "A",
            // Keep points and type same
            // questionType: 'mcq_bidding' // it was already this
        })
        .where(eq(questions.id, targetQ.id));

    console.log('✅ Question updated successfully.');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
