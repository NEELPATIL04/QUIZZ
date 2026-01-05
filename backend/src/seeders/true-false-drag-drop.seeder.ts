import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const trueFalseDragDropQuestion = {
  questionNumber: 5,
  questionType: 'true_false_drag_drop' as const,
  title: 'JavaScript Async Predictions - True or False?',
  description: 'Predict what value will be logged to the console. Drag each code block to either TRUE or FALSE zone based on your prediction. Partial marks awarded for each correct placement!',
  points: 100,
  isEnabled: true,

  // Code blocks with correct answers
  initialTree: JSON.stringify([
    {
      id: 'block-1',
      code: `let flag = false;

Promise.resolve()
  .then(() => {
    flag = true;
  })
  .then(() => {
    console.log(flag);
  });

setTimeout(() => {
  flag = false;
}, 0);`,
      correctAnswer: true
    },
    {
      id: 'block-2',
      code: `let result = false;

async function run() {
  result = true;
  await Promise.resolve();
  result = false;
}

run();

Promise.resolve().then(() => {
  console.log(result);
});`,
      correctAnswer: false
    },
    {
      id: 'block-3',
      code: `let value = false;

async function test() {
  for (let i = 0; i < 1; i++) {
    await Promise.resolve();
    value = true;
  }
}

test();
console.log(value);`,
      correctAnswer: false
    },
    {
      id: 'block-4',
      code: `let state = false;

setTimeout(() => {
  Promise.resolve().then(() => {
    state = true;
  });
}, 0);

Promise.resolve().then(() => {
  console.log(state);
});`,
      correctAnswer: false
    },
    {
      id: 'block-5',
      code: `let done = false;

async function work() {
  await Promise.resolve();
  return true;
}

work().then(v => {
  done = v;
});

Promise.resolve().then(() => {
  console.log(done);
});`,
      correctAnswer: false
    },
    {
      id: 'block-6',
      code: `let ok = false;

async function a() {
  await Promise.resolve();
  ok = true;
}

async function b() {
  await a();
  ok = false;
}

b();

Promise.resolve().then(() => {
  console.log(ok);
});`,
      correctAnswer: false
    }
  ]),

  hints: JSON.stringify([
    'Remember the order: Synchronous code → Microtasks (Promises) → Macrotasks (setTimeout)',
    'Async functions with await create multiple microtasks',
    'Promise.resolve().then() executes before setTimeout, but after current synchronous code',
    'Pay attention to when console.log() is scheduled in the event loop',
    'Multiple .then() chains execute in the order they are scheduled',
    'The value logged depends on WHEN the console.log runs, not when it was scheduled'
  ]),
};

export async function seedTrueFalseDragDropQuestion() {
  console.log('🌱 Seeding True/False Drag Drop challenge question...');

  // Check if question already exists
  const [existing] = await db
    .select()
    .from(questions)
    .where(eq(questions.questionNumber, trueFalseDragDropQuestion.questionNumber));

  if (existing) {
    console.log(`   ⚠️  Question ${trueFalseDragDropQuestion.questionNumber} already exists, updating...`);
    await db
      .update(questions)
      .set(trueFalseDragDropQuestion)
      .where(eq(questions.id, existing.id));
    console.log(`   ✅ Updated Question ${trueFalseDragDropQuestion.questionNumber}: "${trueFalseDragDropQuestion.title}"`);
  } else {
    const [inserted] = await db
      .insert(questions)
      .values(trueFalseDragDropQuestion)
      .returning();
    console.log(`   ✅ Created Question ${trueFalseDragDropQuestion.questionNumber}: "${trueFalseDragDropQuestion.title}"`);
  }

  console.log('✨ True/False Drag Drop question seeding complete!\n');
}

// Run if executed directly
if (require.main === module) {
  seedTrueFalseDragDropQuestion()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error seeding True/False Drag Drop question:', error);
      process.exit(1);
    });
}
