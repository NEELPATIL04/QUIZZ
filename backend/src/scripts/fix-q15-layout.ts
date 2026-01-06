import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq, inArray } from 'drizzle-orm';

async function fixQ15AndLayout() {
    console.log('Fixing Q15 Stacking Context & Layouts...');

    // 1. Update Q15 with new Code Snippet Image and correct Text-First format
    const q15Description = `
**Scenario:**
Review the code snippet below.
We have a \`.sibling\` (z-index: 2) and a \`.child\` (z-index: 999) inside a \`.parent\` (z-index: 1).

![Stacking Context Code](/images/quiz/css_code_stacking_context.png)

Which element will appear visually **on top** where they overlap?
  `.trim();

    const q15Options = [
        { key: "A", text: ".child (Because z-index: 999 is the highest)" },
        { key: "B", text: ".sibling (Because .parent creates a lower stacking context for .child)" },
        { key: "C", text: ".parent (Because it wraps the child)" },
        { key: "D", text: "It matches the DOM order, so .child is on top." }
    ];

    await db.update(questions)
        .set({
            description: q15Description,
            options: JSON.stringify(q15Options),
            correctAnswer: "B"
        })
        .where(eq(questions.questionNumber, 15));

    console.log('Updated Q15.');

    // 2. Fix Layout for Q13, Q14 (Ensure Text is before Image)
    const otherQuestions = await db.select().from(questions).where(inArray(questions.questionNumber, [13, 14]));

    for (const q of otherQuestions) {
        if (!q.description) continue;

        // Check if image is first
        if (q.description.trim().startsWith('![')) {
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

            const newDesc = `${textParts.join('\n\n')}\n\n${imagePart}`.trim();

            await db.update(questions)
                .set({ description: newDesc })
                .where(eq(questions.id, q.id));

            console.log(`Fixed layout for Q${q.questionNumber}`);
        }
    }

    console.log('All CSS questions fixed!');
    process.exit(0);
}

fixQ15AndLayout().catch(console.error);
