import { db } from './src/db';
import { questions } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function checkQuestion7() {
  try {
    console.log('Checking question 7...\n');

    const [question] = await db.select().from(questions).where(eq(questions.questionNumber, 7));

    if (!question) {
      console.log('❌ Question 7 not found!');
      process.exit(1);
    }

    console.log('Question 7 Details:');
    console.log('===================');
    console.log(`Title: ${question.title}`);
    console.log(`Type: ${question.questionType}`);
    console.log(`Description:\n${question.description}\n`);

    if (question.options) {
      console.log(`Options (raw): ${question.options}`);
      try {
        const opts = JSON.parse(question.options);
        console.log('\nParsed Options:');
        opts.forEach((opt: any, idx: number) => {
          console.log(`  ${opt.key || idx}: "${opt.text}"`);
        });
      } catch (e) {
        console.log('Options are not JSON');
      }
    }

    console.log(`\nCorrect Answer (raw): "${question.correctAnswer}"`);
    console.log(`Correct Answer Type: ${typeof question.correctAnswer}`);
    console.log(`Correct Answer Length: ${question.correctAnswer?.length}`);

    // Try to parse it
    try {
      const parsed = JSON.parse(question.correctAnswer || '');
      console.log('\n✓ Parsed Correct Answer:');
      console.log(JSON.stringify(parsed, null, 2));
      console.log(`Is Array: ${Array.isArray(parsed)}`);
    } catch (e) {
      console.log('\n✓ Correct Answer is plain text (not JSON)');
    }

    console.log('\n===================');
    console.log('Testing Validation:');
    console.log('===================');

    // Test the user's answer
    const userAnswer = '[ 2, 4, <1 empty item> ] [ 1, 2 ]';
    console.log(`\nUser Answer: "${userAnswer}"`);
    console.log(`Stored Correct: "${question.correctAnswer}"`);

    // Test case-insensitive comparison
    const cleanUser = userAnswer.trim().toLowerCase();
    const cleanCorrect = (question.correctAnswer || '').trim().toLowerCase();

    console.log(`\nNormalized User: "${cleanUser}"`);
    console.log(`Normalized Correct: "${cleanCorrect}"`);
    console.log(`Match: ${cleanUser === cleanCorrect ? '✅' : '❌'}`);

    // Character-by-character comparison
    if (cleanUser !== cleanCorrect) {
      console.log('\n🔍 Character-by-character comparison:');
      console.log(`User length: ${cleanUser.length}`);
      console.log(`Correct length: ${cleanCorrect.length}`);

      const maxLen = Math.max(cleanUser.length, cleanCorrect.length);
      for (let i = 0; i < maxLen; i++) {
        const uChar = cleanUser[i] || '∅';
        const cChar = cleanCorrect[i] || '∅';
        if (uChar !== cChar) {
          console.log(`  Position ${i}: "${uChar}" vs "${cChar}" ❌`);
        }
      }
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkQuestion7();
