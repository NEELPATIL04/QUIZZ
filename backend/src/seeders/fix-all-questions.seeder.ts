import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function fixAllQuestions() {
  try {
    console.log('🔄 Fixing all questions and ensuring correct order...\n');

    // Get all existing questions
    const allQuestions = await db.select().from(questions).orderBy(questions.questionNumber);

    console.log('Current Questions in Database:');
    allQuestions.forEach(q => {
      console.log(`  Q${q.questionNumber}: ${q.title} (Type: ${q.questionType})`);
    });
    console.log(`\nTotal: ${allQuestions.length} questions\n`);

    // Find existing questions by type
    const gitChallenge = allQuestions.find(q => q.questionType === 'git_challenge');
    const htmlCssChallenge = allQuestions.find(q => q.questionType === 'html_css_challenge');
    const jsEngineChallenge = allQuestions.find(q => q.questionType === 'js_engine_challenge');
    const brokenHtmlChallenge = allQuestions.find(q => q.questionType === 'broken_html_challenge');
    const mcqQuestions = allQuestions.filter(q => q.questionType === 'mcq_bidding');

    console.log('📊 Summary:');
    console.log(`  - Git Challenges: ${gitChallenge ? '✅' : '❌'}`);
    console.log(`  - HTML/CSS Challenges: ${htmlCssChallenge ? '✅' : '❌'}`);
    console.log(`  - JS Engine Challenges: ${jsEngineChallenge ? '✅' : '❌'}`);
    console.log(`  - Broken HTML Challenges: ${brokenHtmlChallenge ? '✅' : '❌'}`);
    console.log(`  - MCQ Bidding Questions: ${mcqQuestions.length}\n`);

    console.log('🔧 Updating question numbers to proper order...\n');

    // Q1: Git Challenge
    if (gitChallenge && gitChallenge.questionNumber !== 1) {
      await db.update(questions).set({ questionNumber: 1 }).where(eq(questions.id, gitChallenge.id));
      console.log(`✅ Updated "${gitChallenge.title}" to Question 1`);
    }

    // Q2: HTML/CSS Challenge
    if (htmlCssChallenge && htmlCssChallenge.questionNumber !== 2) {
      await db.update(questions).set({ questionNumber: 2 }).where(eq(questions.id, htmlCssChallenge.id));
      console.log(`✅ Updated "${htmlCssChallenge.title}" to Question 2`);
    }

    // Q3: JS Engine Challenge
    if (jsEngineChallenge && jsEngineChallenge.questionNumber !== 3) {
      await db.update(questions).set({ questionNumber: 3 }).where(eq(questions.id, jsEngineChallenge.id));
      console.log(`✅ Updated "${jsEngineChallenge.title}" to Question 3`);
    }

    // Q4: Broken HTML Challenge
    if (brokenHtmlChallenge && brokenHtmlChallenge.questionNumber !== 4) {
      await db.update(questions).set({ questionNumber: 4 }).where(eq(questions.id, brokenHtmlChallenge.id));
      console.log(`✅ Updated "${brokenHtmlChallenge.title}" to Question 4`);
    }

    // Q5-Q6: MCQ Bidding Questions
    if (mcqQuestions.length >= 2) {
      const sortedMcq = mcqQuestions.sort((a, b) => {
        // Sort by current question number to maintain order
        return a.questionNumber - b.questionNumber;
      });

      if (sortedMcq[0].questionNumber !== 5) {
        await db.update(questions).set({ questionNumber: 5 }).where(eq(questions.id, sortedMcq[0].id));
        console.log(`✅ Updated "${sortedMcq[0].title}" to Question 5`);
      }

      if (sortedMcq[1].questionNumber !== 6) {
        await db.update(questions).set({ questionNumber: 6 }).where(eq(questions.id, sortedMcq[1].id));
        console.log(`✅ Updated "${sortedMcq[1].title}" to Question 6`);
      }
    }

    // Check for missing questions and provide instructions
    console.log('\n📝 Missing Questions Check:');
    if (!jsEngineChallenge) {
      console.log('  ❌ JS Engine Challenge is missing! Run: npm run seed:js-engine');
    }
    if (!brokenHtmlChallenge) {
      console.log('  ❌ Broken HTML Challenge is missing! Run: npm run seed:broken-html');
    }
    if (mcqQuestions.length < 2) {
      console.log('  ❌ Need 2 MCQ Bidding questions! Run: npm run seed:mcq');
    }

    console.log('\n✨ Questions fixed successfully!');
    console.log('\nExpected final order:');
    console.log('Q1: Git Challenge');
    console.log('Q2: HTML/CSS Challenge');
    console.log('Q3: JS Engine Challenge');
    console.log('Q4: Broken HTML Challenge');
    console.log('Q5: MCQ Bidding - Question 1');
    console.log('Q6: MCQ Bidding - Question 2');
  } catch (error) {
    console.error('Error fixing questions:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  fixAllQuestions()
    .then(() => {
      console.log('\nDone!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
