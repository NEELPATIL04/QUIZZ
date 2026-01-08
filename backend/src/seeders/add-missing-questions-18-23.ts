import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

const missingQuestions = [
    {
        questionNumber: 18,
        questionType: 'multiple_choice' as const,
        title: 'CSS Specificity Wars',
        description: 'Which selector has the highest specificity?',
        options: JSON.stringify([
            '#nav.active ul li a',
            'html body div#container .content',
            'a[href^="http"]:hover',
            'div.menu > ul > li.item'
        ]),
        correctAnswer: '#nav.active ul li a',
        points: 20,
        isEnabled: true
    },
    {
        questionNumber: 19,
        questionType: 'multiple_choice' as const,
        title: 'Event Loop & Macrotasks',
        description: 'Which of the following creates a "Macro Task" in the JavaScript Event Loop?',
        options: JSON.stringify([
            'Promise.resolve().then()',
            'queueMicrotask()',
            'setTimeout(fn, 0)',
            'process.nextTick()'
        ]),
        correctAnswer: 'setTimeout(fn, 0)',
        points: 20,
        isEnabled: true
    },
    {
        questionNumber: 20,
        questionType: 'multiple_choice' as const,
        title: 'JS Hoisting',
        description: 'What will be logged? \n\n```javascript\nconsole.log(x);\nvar x = 5;\n```',
        options: JSON.stringify([
            'ReferenceError: x is not defined',
            'undefined',
            '5',
            'null'
        ]),
        correctAnswer: 'undefined',
        points: 20,
        isEnabled: true
    },
    {
        questionNumber: 21,
        questionType: 'multiple_choice' as const,
        title: 'Closures & Scope',
        description: 'What does this function return?\n```javascript\nfunction outer() {\n  let count = 0;\n  return () => ++count;\n}\nconst c = outer();\nc();\nc();\nreturn c();\n```',
        options: JSON.stringify([
            '1',
            '2',
            '3',
            'undefined'
        ]),
        correctAnswer: '3',
        points: 20,
        isEnabled: true
    },
    {
        questionNumber: 22,
        questionType: 'multiple_choice' as const,
        title: 'Prototypes',
        description: 'In JavaScript models, what is the default prototype of a plain object created via literal syntax `{}`?',
        options: JSON.stringify([
            'Object.prototype',
            'Function.prototype',
            'null',
            'Array.prototype'
        ]),
        correctAnswer: 'Object.prototype',
        points: 50,
        isEnabled: true
    },
    {
        questionNumber: 23,
        questionType: 'multiple_choice' as const,
        title: 'This Keyword',
        description: 'What is the value of `this` in a strict mode function called normally?\n```javascript\n"use strict";\nfunction f() { return this; }\n```',
        options: JSON.stringify([
            'window / global',
            'undefined',
            'null',
            'The function itself'
        ]),
        correctAnswer: 'undefined',
        points: 50,
        isEnabled: true
    }
];

async function seedMissing() {
    console.log('🌱 Seeding missing questions 18-23...');

    for (const q of missingQuestions) {
        // Check if exists using db.select() instead of db.query
        const [existing] = await db
            .select()
            .from(questions)
            .where(eq(questions.questionNumber, q.questionNumber));

        if (existing) {
            console.log(`⚠️  Q${q.questionNumber} already exists. Updating...`);
            await db.update(questions).set(q).where(eq(questions.id, existing.id));
        } else {
            await db.insert(questions).values(q);
            console.log(`✅ Created Q${q.questionNumber}: ${q.title}`);
        }
    }

    console.log('✨ Missing questions seeded!');
    process.exit(0);
}

seedMissing().catch(err => {
    console.error(err);
    process.exit(1);
});
