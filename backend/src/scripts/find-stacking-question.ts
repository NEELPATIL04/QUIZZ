
import { db } from '../db';
import { questions } from '../db/schema';
import { eq, ilike } from 'drizzle-orm';

async function main() {
    const found = await db.select().from(questions).where(ilike(questions.title, '%Stacking Context%'));
    if (found.length === 0) {
        console.log('Question not found by title.');
    } else {
        found.forEach(q => {
            console.log(`Found: [${q.questionNumber}] "${q.title}" (ID: ${q.id})`);
            console.log(`Type: ${q.questionType}`);
        });
    }
}
main().then(() => process.exit(0)).catch(console.error);
