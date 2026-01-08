import { db } from '../db';
import { questions } from '../db/schema';
import { asc } from 'drizzle-orm';

async function auditQuestions() {
    try {
        const allQuestions = await db.select().from(questions).orderBy(asc(questions.questionNumber));

        console.log(`Total Questions: ${allQuestions.length}`);
        console.log('------------------------------------------------');
        console.log('Num | Type | Title | Enabled | UpdatedAt');
        console.log('------------------------------------------------');

        let bidCount = 0;

        allQuestions.forEach(q => {
            if (q.questionType === 'mcq_bidding') bidCount++;
            console.log(`${q.questionNumber.toString().padEnd(3)} | ${q.questionType.padEnd(15)} | ${q.title.substring(0, 30).padEnd(30)} | ${q.isEnabled} | ${q.updatedAt.toISOString()}`);
        });

        console.log('------------------------------------------------');
        console.log(`Total Bid Round Questions: ${bidCount}`);

    } catch (err) {
        console.error('Audit Error:', err);
    }
    process.exit(0);
}

auditQuestions();
