import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

async function check() {
    const q19 = await db.select().from(questions).where(eq(questions.questionNumber, 19));
    console.log('Q19:', q19);
    process.exit(0);
}

check().catch(console.error);
