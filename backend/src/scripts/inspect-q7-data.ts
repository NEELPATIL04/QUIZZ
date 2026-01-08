
import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq, asc } from 'drizzle-orm';

async function main() {
    console.log('--- Inspecting Question 7 ---');

    // 1. Try to find by questionNumber = 7
    const qByNum = await db.select().from(questions).where(eq(questions.questionNumber, 7));
    if (qByNum.length > 0) {
        console.log('\n[Found by questionNumber=7]');
        console.log('ID:', qByNum[0].id);
        console.log('Title:', qByNum[0].title);
        console.log('Type:', qByNum[0].questionType);
        console.log('Raw Options Type:', typeof qByNum[0].options);
        console.log('Raw Options Value:', JSON.stringify(qByNum[0].options, null, 2));
        console.log('Correct Answer:', qByNum[0].correctAnswer);
    } else {
        console.log('\n[questionNumber=7 NOT FOUND]');

        // Fallback: Try 7th item by order
        const allQuestions = await db.select().from(questions).orderBy(asc(questions.order));
        if (allQuestions.length >= 7) {
            const q7 = allQuestions[6];
            console.log('\n[Found by Index 6 (7th item)]');
            console.log('ID:', q7.id);
            console.log('Title:', q7.title);
            console.log('Raw Options Value:', JSON.stringify(q7.options, null, 2));
        }
    }

    process.exit(0);
}

main().catch(console.error);
