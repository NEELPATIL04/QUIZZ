import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
  console.log('Seeding Async/Promise Multi-Select question...');

  const options = [
    { key: "A", text: "\"A\" will be printed" },
    { key: "B", text: "\"B\" will be printed before \"C\"" },
    { key: "C", text: "\"C\" will always be printed even if an error occurs" },
    { key: "D", text: "\"D\" will be printed before \"B\"" },
    { key: "E", text: "If await is removed, \"B\" will NOT be printed" }
  ];

  /*
    Question:
    async function test() {
      try {
        await Promise.reject("ERROR");
        console.log("A");
      } catch (e) {
        console.log("B");
      } finally {
        console.log("C");
      }
    }
    test();
    Promise.resolve().then(() => {
      console.log("D");
    });
  */

  await db.insert(questions).values({
    id: uuidv4(),
    questionNumber: 200,
    questionType: 'multiple_choice',
    title: 'Async/Promise Execution Flow',
    description: `
\`\`\`javascript
async function test() {
  try {
    await Promise.reject("ERROR");
    console.log("A");
  } catch (e) {
    console.log("B");
  } finally {
    console.log("C");
  }
}
 
test();
 
Promise.resolve().then(() => {
  console.log("D");
});
\`\`\`

Select ALL correct statements.
    `.trim(),
    options: JSON.stringify(options),
    correctAnswer: JSON.stringify(["B", "C"]), // Multi-select array
    points: 100,
    isEnabled: true,
  });

  console.log('Async/Promise question seeded successfully at Q12!');
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
