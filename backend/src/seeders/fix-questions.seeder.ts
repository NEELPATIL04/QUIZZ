import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function fixQuestions() {
  try {
    console.log('🔄 Checking current questions...\n');

    // Get all questions
    const allQuestions = await db.select().from(questions).orderBy(questions.questionNumber);

    console.log('Current Questions:');
    allQuestions.forEach(q => {
      console.log(`  Q${q.questionNumber}: ${q.title} (Type: ${q.questionType})`);
    });
    console.log(`\nTotal: ${allQuestions.length} questions\n`);

    // We should only have 4 questions total:
    // Q1: Git Challenge
    // Q2: HTML/CSS Challenge
    // Q3: MCQ Bidding 1
    // Q4: MCQ Bidding 2

    const gitChallenge = allQuestions.find(q => q.questionType === 'git_challenge');
    const htmlCssChallenge = allQuestions.find(q => q.questionType === 'html_css_challenge');
    const mcqQuestions = allQuestions.filter(q => q.questionType === 'mcq_bidding');

    console.log('📊 Summary:');
    console.log(`  - Git Challenges: ${gitChallenge ? 1 : 0}`);
    console.log(`  - HTML/CSS Challenges: ${htmlCssChallenge ? 1 : 0}`);
    console.log(`  - MCQ Bidding Questions: ${mcqQuestions.length}\n`);

    // Update question numbers
    console.log('🔧 Updating question numbers...\n');

    // Update Git Challenge to Q1
    if (gitChallenge && gitChallenge.questionNumber !== 1) {
      await db.update(questions).set({ questionNumber: 1 }).where(eq(questions.id, gitChallenge.id));
      console.log(`✅ Updated "${gitChallenge.title}" to Question 1`);
    }

    // Update HTML/CSS Challenge to Q2
    if (htmlCssChallenge && htmlCssChallenge.questionNumber !== 2) {
      await db.update(questions).set({ questionNumber: 2 }).where(eq(questions.id, htmlCssChallenge.id));
      console.log(`✅ Updated "${htmlCssChallenge.title}" to Question 2`);
    }

    // Update MCQ questions to Q3 and Q4
    if (mcqQuestions.length >= 2) {
      const sortedMcq = mcqQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

      if (sortedMcq[0].questionNumber !== 3) {
        await db.update(questions).set({ questionNumber: 3 }).where(eq(questions.id, sortedMcq[0].id));
        console.log(`✅ Updated "${sortedMcq[0].title}" to Question 3`);
      }

      if (sortedMcq[1].questionNumber !== 4) {
        await db.update(questions).set({ questionNumber: 4 }).where(eq(questions.id, sortedMcq[1].id));
        console.log(`✅ Updated "${sortedMcq[1].title}" to Question 4`);
      }
    }

    console.log('\n✨ Questions fixed successfully!');
    console.log('\nFinal order:');
    console.log('Q1: Git Challenge');
    console.log('Q2: HTML/CSS Challenge');
    console.log('Q3: MCQ Bidding - First Question');
    console.log('Q4: MCQ Bidding - Second Question');
  } catch (error) {
    console.error('Error fixing questions:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  fixQuestions()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
