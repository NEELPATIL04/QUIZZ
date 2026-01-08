
import { db } from '../db';
import { questions } from '../db/schema';
import { eq, and } from 'drizzle-orm';

async function main() {
    console.log('🔄 Updating Q6 (CSS Stacking) requirements...');

    // Find Q6
    const [q6] = await db.select().from(questions).where(eq(questions.questionNumber, 6));

    if (!q6) {
        console.error('❌ Question 6 not found!');
        process.exit(1);
    }

    console.log('Current requiredProperties:', q6.requiredProperties);

    // New requirements: remove 'z-index'
    const newReqs = ['position', 'top', 'left']; // removed 'z-index'

    // also update scoring criteria
    const newScoring = {
        idealMethod: { properties: ['position', 'top', 'left'], points: 100 },
        alternativeMethod: { properties: ['margin'], pointsDeduction: 50 },
        optionalProperties: ['transform', 'z-index'] // Moved z-index to optional
    };

    await db.update(questions)
        .set({
            requiredProperties: JSON.stringify(newReqs),
            scoringCriteria: JSON.stringify(newScoring)
        })
        .where(eq(questions.id, q6.id));

    console.log('✅ Updated Q6 requirements (removed z-index)');
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
