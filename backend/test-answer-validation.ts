import { db } from './src/db';
import { questions } from './src/db/schema';
import { eq } from 'drizzle-orm';

async function testAnswerValidation() {
  try {
    console.log('Testing answer validation for question 24...\n');

    // Get question 24
    const [question] = await db.select().from(questions).where(eq(questions.questionNumber, 24));

    if (!question) {
      console.log('❌ Question 24 not found!');
      process.exit(1);
    }

    console.log('Question Details:');
    console.log('================');
    console.log(`Title: ${question.title}`);
    console.log(`Type: ${question.questionType}`);
    console.log(`Options: ${question.options}`);
    console.log(`Correct Answer: "${question.correctAnswer}"`);
    console.log('');

    // Parse options
    const options = JSON.parse(question.options || '[]');
    console.log('Parsed Options:');
    options.forEach((opt: any) => {
      console.log(`  ${opt.key}: "${opt.text}"`);
    });
    console.log('');

    // Simulate what frontend NOW sends (after fix)
    console.log('Testing Answer Validation:');
    console.log('==========================');

    // User clicks option B (which has text "1")
    const selectedKey = 'B';
    const selectedOption = options.find((opt: any) => opt.key === selectedKey);
    const answerPayload = selectedOption?.text || selectedKey;

    console.log(`User clicks: Option ${selectedKey}`);
    console.log(`Option text: "${selectedOption?.text}"`);
    console.log(`Answer sent to backend: "${answerPayload}"`);
    console.log('');

    // Backend validation (multiple_choice type)
    console.log('Backend Validation Logic:');
    console.log('-------------------------');

    if (question.questionType === 'multiple_choice') {
      let correctOptions: string[] = [];
      try {
        const parsed = JSON.parse(question.correctAnswer || '[]');
        if (Array.isArray(parsed)) {
          correctOptions = parsed.map(o => o.trim().toUpperCase());
          console.log(`Correct answer is array: [${correctOptions.join(', ')}]`);
        } else {
          correctOptions = [question.correctAnswer?.trim().toUpperCase() || ''];
          console.log(`Correct answer is single value: "${correctOptions[0]}"`);
        }
      } catch (e) {
        correctOptions = [question.correctAnswer?.trim().toUpperCase() || ''];
        console.log(`Correct answer is plain string: "${correctOptions[0]}"`);
      }

      let submittedOptions: string[] = [];
      try {
        const parsed = JSON.parse(answerPayload);
        if (Array.isArray(parsed)) {
          submittedOptions = parsed.map((o: string) => o.trim().toUpperCase());
        } else {
          submittedOptions = [answerPayload.trim().toUpperCase()];
        }
      } catch (e) {
        submittedOptions = [answerPayload.trim().toUpperCase()];
      }

      console.log(`Submitted answer (normalized): [${submittedOptions.join(', ')}]`);
      console.log(`Correct answer (normalized): [${correctOptions.join(', ')}]`);

      // Single select logic
      const submitted = submittedOptions[0] || '';
      const correct = correctOptions[0] || '';
      const isCorrect = submitted === correct;

      console.log('');
      console.log(`Comparison: "${submitted}" === "${correct}"`);
      console.log(`Result: ${isCorrect ? '✅ CORRECT' : '❌ INCORRECT'}`);

      if (isCorrect) {
        console.log(`Points: ${question.points}/${question.points}`);
      } else {
        console.log(`Points: 0/${question.points}`);
      }
    }

    console.log('');
    console.log('================================');
    console.log('Testing OTHER scenarios:');
    console.log('================================');

    // Test all options
    for (const opt of options) {
      const testAnswer = opt.text;
      const submitted = testAnswer.trim().toUpperCase();
      const correct = (question.correctAnswer || '').trim().toUpperCase();
      const matches = submitted === correct;
      console.log(`Option ${opt.key} ("${opt.text}") -> ${matches ? '✅' : '❌'}`);
    }

    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

testAnswerValidation();
