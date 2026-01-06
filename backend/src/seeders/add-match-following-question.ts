import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { v4 as uuidv4 } from 'uuid';
import { desc } from 'drizzle-orm';

async function seed() {
    console.log('Seeding Match the Following question...');

    const matchOptions = [
        {
            id: "A",
            term: "Semantic HTML",
            definition: "Improves SEO & accessibility",
            matchId: "1" // This ID links the term to the definition
        },
        {
            id: "B",
            term: "Reflow",
            definition: "Recalculates layout",
            matchId: "2"
        },
        {
            id: "C",
            term: "Repaint",
            definition: "Updates visual appearance",
            matchId: "3"
        },
        {
            id: "D",
            term: "Critical CSS",
            definition: "Speeds up first paint",
            matchId: "4"
        }
    ];

    // Find the next available question number
    const lastQuestion = await db.select().from(questions).orderBy(desc(questions.questionNumber)).limit(1);
    const nextQuestionNumber = (lastQuestion[0]?.questionNumber || 0) + 1;

    console.log(`Using question number: ${nextQuestionNumber}`);

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: nextQuestionNumber,
        questionType: 'match_following',
        title: 'Frontend Concepts Match-Up',
        description: 'Match the frontend concepts in Column A with their correct definitions in Column B.',
        options: JSON.stringify(matchOptions),
        points: 100,
        isEnabled: true,
    });

    console.log('Match the Following question seeded successfully!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
