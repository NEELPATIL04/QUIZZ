
import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function main() {
    const q12 = await db.select().from(questions).where(eq(questions.questionNumber, 12)).limit(1);
    if (!q12.length) {
        console.log('Q12 not found');
        return;
    }
    const q = q12[0];
    console.log(`Q12: ${q.title}`);
    console.log(`Type: ${q.questionType}`);
    console.log(`Correct Answer Raw: ${q.correctAnswer}`);

    try {
        const parsed = JSON.parse(q.correctAnswer || '');
        console.log('Parsed Correct Answer:', parsed);
        console.log('Is Array?', Array.isArray(parsed));
    } catch (e) {
        console.log('Correct Answer is NOT valid JSON.');
    }
}

main().then(() => process.exit(0)).catch(console.error);
