import { db } from '../db';
import { questions } from '../db/schema';

async function checkQuestions() {
  const result = await db.select().from(questions);
  console.log('\n📊 Total questions in database:', result.length);
  console.log('\n' + '='.repeat(80));

  result
    .sort((a, b) => a.questionNumber - b.questionNumber)
    .forEach(q => {
      console.log(`Q${q.questionNumber}: ${q.title}`);
      console.log(`   Type: ${q.questionType} | Points: ${q.points} | Enabled: ${q.isEnabled}`);
      console.log('');
    });

  console.log('='.repeat(80) + '\n');
}

checkQuestions()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Error:', error);
    process.exit(1);
  });
