import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { asc, eq } from 'drizzle-orm';

async function renumberQuestions() {
    console.log('🔄 Renumbering all questions sequentially...\n');

    try {
        // Get all questions ordered by current questionNumber
        const allQuestions = await db
            .select()
            .from(questions)
            .orderBy(asc(questions.questionNumber));

        console.log(`Found ${allQuestions.length} questions\n`);
        console.log('Current numbering:');
        allQuestions.forEach(q => {
            console.log(`  Q${q.questionNumber}: ${q.title} (${q.questionType})`);
        });

        console.log('\n📝 Renumbering to sequential order...\n');

        // Renumber sequentially starting from 1
        for (let i = 0; i < allQuestions.length; i++) {
            const question = allQuestions[i];
            const newNumber = i + 1;

            if (question.questionNumber !== newNumber) {
                await db
                    .update(questions)
                    .set({ questionNumber: newNumber })
                    .where(eq(questions.id, question.id));

                console.log(`  ✅ Q${question.questionNumber} → Q${newNumber}: ${question.title}`);
            } else {
                console.log(`  ⏭️  Q${newNumber}: ${question.title} (already correct)`);
            }
        }

        console.log('\n✨ Renumbering complete!\n');

        // Show final result
        const finalQuestions = await db
            .select()
            .from(questions)
            .orderBy(asc(questions.questionNumber));

        console.log('Final numbering:');
        finalQuestions.forEach(q => {
            console.log(`  Q${q.questionNumber}: ${q.title} (${q.questionType})`);
        });

        process.exit(0);
    } catch (error) {
        console.error('❌ Error renumbering questions:', error);
        process.exit(1);
    }
}

renumberQuestions();
