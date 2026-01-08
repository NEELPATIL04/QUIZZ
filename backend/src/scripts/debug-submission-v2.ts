import { db } from '../db';
import { submissions, questions } from '../db/schema/quiz';
import { desc, eq } from 'drizzle-orm';

async function debugSubmission() {
    console.log('=== Debugging Latest Submission ===\n');

    try {
        // Get the most recent submission
        const [latest] = await db
            .select()
            .from(submissions)
            .orderBy(desc(submissions.submittedAt))
            .limit(1);

        if (!latest) {
            console.log('No submissions found');
            process.exit(0);
        }

        console.log('Submission ID:', latest.id);
        console.log('Team ID:', latest.teamId);
        console.log('Question ID:', latest.questionId);
        console.log('Submitted Answer:', latest.answer);
        console.log('Answer Type:', typeof latest.answer);
        console.log('Is Correct:', latest.isCorrect);

        // Get the question details
        const [question] = await db
            .select()
            .from(questions)
            .where(eq(questions.id, latest.questionId));

        if (!question) {
            console.log('Question not found!');
            process.exit(0);
        }

        console.log('\n=== Question Details ===');
        console.log('Question Number:', question.questionNumber);
        console.log('Title:', question.title);
        console.log('Correct Answer:', question.correctAnswer);
        console.log('Options Raw:', question.options);

        // Parse options
        try {
            const parsed = JSON.parse(question.options as string);
            console.log('Options Parsed:', parsed);
        } catch (e) {
            console.log('Options Parse Error:', e);
        }

        console.log('\n=== Comparison ===');
        console.log(`Expected: "${question.correctAnswer}"`);
        console.log(`Received: "${latest.answer}"`);
        console.log(`Match? ${latest.answer === question.correctAnswer}`);

    } catch (error) {
        console.error('Debug script error:', error);
    }
    process.exit(0);
}

debugSubmission();
