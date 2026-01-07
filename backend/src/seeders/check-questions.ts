
import { db } from '../db';
import { questions } from '../db/schema';
import { asc } from 'drizzle-orm';

async function checkQuestions() {
  const allQuestions = await db.select({
    number: questions.questionNumber,
    title: questions.title,
    type: questions.questionType
  }).from(questions).orderBy(asc(questions.questionNumber));

  console.log('Existing Questions:', allQuestions);
  process.exit(0);
}

checkQuestions();
