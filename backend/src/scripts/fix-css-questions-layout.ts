import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { inArray } from 'drizzle-orm';

async function fixCssQuestionsLayout() {
    console.log('Fixing CSS Questions Layout (Text ABOVE Image)...');

    const cssQuestions = await db.select().from(questions).where(inArray(questions.questionNumber, [13, 14, 15]));

    for (const q of cssQuestions) {
        if (!q.description) continue;

        // Split existing description
        // Assuming format was: ![Image](...) \n\n Text
        // We want: Text \n\n ![Image](...)

        const parts = q.description.split('\n\n');
        let imagePart = '';
        let textParts = [];

        for (const part of parts) {
            if (part.trim().startsWith('![')) {
                imagePart = part;
            } else {
                textParts.push(part);
            }
        }

        const newDescription = `${textParts.join('\n\n')}\n\n${imagePart}`;

        await db.update(questions)
            .set({ description: newDescription.trim() })
            .where(inArray(questions.id, [q.id]));

        console.log(`Updated Q${q.questionNumber} layout.`);
    }

    console.log('Layout fix complete!');
    process.exit(0);
}

fixCssQuestionsLayout().catch((err) => {
    console.error('Fix failed:', err);
    process.exit(1);
});
