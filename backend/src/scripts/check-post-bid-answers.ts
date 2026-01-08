
import { db } from '../db';
import { questions } from '../db/schema';
import { gt, asc } from 'drizzle-orm';

async function main() {
    console.log('🔍 Checking Answers for Questions > 17...');

    const results = await db.select({
        num: questions.questionNumber,
        type: questions.questionType,
        title: questions.title,
        correctAnswer: questions.correctAnswer,
        options: questions.options
    })
        .from(questions)
        .where(gt(questions.questionNumber, 17))
        .orderBy(asc(questions.questionNumber));

    if (results.length === 0) {
        console.log('No questions found > 17');
    } else {
        results.forEach(q => {
            console.log(`Q${q.num} [${q.type}]: ${q.title}`);
            console.log(`   Correct Answer: '${q.correctAnswer}'`);
            // Parse options to see keys
            try {
                const opts = JSON.parse(q.options as string);
                console.log(`   Options:`, opts.map((o: any) => `${o.key}: ${o.text}`).join(', '));
            } catch (e) {
                console.log(`   Options (raw): ${q.options}`);
            }
            console.log('---');
        });
    }
    process.exit(0);
}

main().catch(err => {
    console.error(err);
    process.exit(1);
});
