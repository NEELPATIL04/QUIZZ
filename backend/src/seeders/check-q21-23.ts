import { db } from '../db';
import { questions } from '../db/schema';
import { inArray } from 'drizzle-orm';

async function check() {
    const qs = await db
        .select()
        .from(questions)
        .where(inArray(questions.questionNumber, [21, 22, 23]));

    console.log('Questions 21-23:', JSON.stringify(qs, null, 2));
    process.exit(0);
}

check().catch(console.error);
