import { db } from '../db';
import { submissions } from '../db/schema/quiz';
import { desc } from 'drizzle-orm';

async function debugLatestSubmission() {
    console.log('=== Debugging Latest Submission ===\n');

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
    console.log('Points Awarded:', latest.pointsAwarded);
    console.log('Submitted At:', latest.submittedAt);

    // Get the question details
    const { questions } = await import('../db/schema/quiz');
    const { eq } = await import('drizzle-orm');

    const [question] = await db
        .select()
        .from(questions)
        .where(eq(questions.id, latest.questionId));

    console.log('\n=== Question Details ===');
    console.log('Question Number:', question.questionNumber);
    console.log('Title:', question.title);
    console.log('Type:', question.questionType);
    console.log('Correct Answer:', question.correctAnswer);
    console.log('Correct Answer Type:', typeof question.correctAnswer);
    console.log('Options:', question.options);

    // Parse options
    try {
        const opts = JSON.parse(question.options);
        console.log('\n=== Parsed Options ===');
        opts.forEach((opt: any) => {
            console.log(`  ${opt.key}: ${opt.text}`);
        });
    } catch (e) {
        console.log('Error parsing options:', e);
    }

    console.log('\n=== Analysis ===');
    console.log('Submitted:', latest.answer);
    console.log('Expected:', question.correctAnswer);
    console.log('Match:', latest.answer === question.correctAnswer);

    process.exit(0);
}

debugLatestSubmission();
