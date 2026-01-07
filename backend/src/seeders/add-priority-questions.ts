
import { db } from '../db';
import { questions } from '../db/schema';
import { eq, desc } from 'drizzle-orm';

async function seed() {
    console.log('Fetching existing questions...');

    // 1. Fetch all questions ordered by number descending
    const existingQuestions = await db
        .select({
            id: questions.id,
            number: questions.questionNumber
        })
        .from(questions)
        .orderBy(desc(questions.questionNumber));

    console.log(`Found ${existingQuestions.length} questions. Shifting by 3...`);

    // 2. Update one by one in descending order to avoid collisions
    for (const q of existingQuestions) {
        await db
            .update(questions)
            .set({ questionNumber: q.number + 3 })
            .where(eq(questions.id, q.id));
        console.log(`Moved Q${q.number} -> Q${q.number + 3}`);
    }

    // 3. Insert Question 1
    console.log('Inserting Question 1...');
    await db.insert(questions).values({
        questionNumber: 1,
        questionType: 'multiple_choice',
        title: 'Object Destructuring & "this" Context',
        description: `What is the output of the following code?

\`\`\`javascript
const obj = {
  x: 10,
  print() {
    console.log(this.x);
  }
};

const { print } = obj;
print();
\`\`\`
`,
        options: JSON.stringify(['10', 'undefined', 'ReferenceError', 'TypeError']),
        correctAnswer: 'undefined',
        points: 10,
        isEnabled: true
    });

    // 4. Insert Question 2
    console.log('Inserting Question 2...');
    await db.insert(questions).values({
        questionNumber: 2,
        questionType: 'multiple_choice',
        title: 'Function Binding Chain',
        description: `What will be logged to the console?

\`\`\`javascript
function f() {
  return this.x;
}

const a = { x: 10 };
const b = { x: 20 };

const g = f.bind(a).bind(b);
console.log(g());
\`\`\`
`,
        options: JSON.stringify(['10', '20', '10 20', 'undefined', 'type error']),
        correctAnswer: '10',
        points: 10,
        isEnabled: true
    });

    // 5. Insert Question 3
    console.log('Inserting Question 3...');
    await db.insert(questions).values({
        questionNumber: 3,
        questionType: 'multiple_choice',
        title: 'Arrow Function Context',
        description: `What is the output?

\`\`\`javascript
var name = "GLOBAL";

const obj = {
  name: "OBJ",
  getName: () => {
     return this.name;
   }
 };
 
 const fn = obj.getName;
 console.log(fn());
\`\`\`
`,
        options: JSON.stringify(['undefined', 'OBJ', 'Global', 'type error']),
        correctAnswer: 'undefined',
        points: 10,
        isEnabled: true
    });

    console.log('Done!');
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
