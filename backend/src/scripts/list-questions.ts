import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { asc } from 'drizzle-orm';

async function listQuestions() {
    const allQuestions = await db.select().from(questions).orderBy(asc(questions.questionNumber));

    console.log('Current Question Order:');
    console.log('----------------------------------------------------');
    console.log('Q# | Type                 | Title');
    console.log('---|----------------------|-------------------------');
    allQuestions.forEach(q => {
        console.log(`${q.questionNumber.toString().padEnd(2)} | ${q.questionType.padEnd(20)} | ${q.title.substring(0, 40)}`);
    });
    console.log('----------------------------------------------------');
    process.exit(0);
}

listQuestions().catch(console.error);
