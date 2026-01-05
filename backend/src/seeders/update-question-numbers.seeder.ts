import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

export async function updateQuestionNumbers() {
  try {
    console.log('🔄 Updating question numbers...');

    // Get all questions
    const allQuestions = await db.select().from(questions).orderBy(questions.questionNumber);

    console.log('Found questions:', allQuestions.map(q => `Q${q.questionNumber}: ${q.title} (${q.questionType})`));

    // Update MCQ questions from 3,4 to 5,6 FIRST (to free up slot 4)
    const mcqQuestions = allQuestions.filter(q => q.questionType === 'mcq_bidding').sort((a, b) => a.questionNumber - b.questionNumber);

    if (mcqQuestions.length >= 2 && mcqQuestions[1].questionNumber === 4) {
      await db
        .update(questions)
        .set({ questionNumber: 6 })
        .where(eq(questions.id, mcqQuestions[1].id));
      console.log(`✅ Updated "${mcqQuestions[1].title}" to Question 6`);
    }

    if (mcqQuestions.length >= 1 && mcqQuestions[0].questionNumber === 3) {
      await db
        .update(questions)
        .set({ questionNumber: 5 })
        .where(eq(questions.id, mcqQuestions[0].id));
      console.log(`✅ Updated "${mcqQuestions[0].title}" to Question 5`);
    }

    // NOW update HTML/CSS question from 2 to 4 (slot is now free)
    const htmlCssQuestion = allQuestions.find(q => q.questionType === 'html_css_challenge');
    if (htmlCssQuestion && htmlCssQuestion.questionNumber === 2) {
      await db
        .update(questions)
        .set({ questionNumber: 4 })
        .where(eq(questions.id, htmlCssQuestion.id));
      console.log('✅ Updated HTML/CSS question to Question 4');
    }

    console.log('✨ Question numbers updated successfully!');
    console.log('\nFinal order:');
    console.log('Q1: Git Challenge');
    console.log('Q2: (Empty - add Question 2 if needed)');
    console.log('Q3: (Empty - add Question 3 if needed)');
    console.log('Q4: HTML/CSS Challenge');
    console.log('Q5: MCQ Bidding - JS Engine');
    console.log('Q6: MCQ Bidding - Call Stack');
  } catch (error) {
    console.error('Error updating question numbers:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  updateQuestionNumbers()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Failed:', error);
      process.exit(1);
    });
}
