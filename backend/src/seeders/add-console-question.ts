import { db } from '../db';
import { questions } from '../db/schema';
import { desc } from 'drizzle-orm';

async function seed() {
    const [lastQuestion] = await db
        .select()
        .from(questions)
        .orderBy(desc(questions.questionNumber))
        .limit(1);

    const nextNumber = (lastQuestion?.questionNumber || 0) + 1;

    await db.insert(questions).values({
        questionNumber: nextNumber,
        questionType: 'multiple_choice',
        title: 'JS Scope & this',
        description: '```javascript\nconst obj = {\n  name: "OBJ",\n  outer: function () {\n    console.log("outer:", this.name);\n    const middle = () => {\n      console.log("middle:", this.name);\n      function inner() {\n        console.log("inner:", this.name);\n      }\n      inner();\n    };\n    middle();\n  }\n};\nobj.outer();\n```\nWhat will be the output?',
        options: JSON.stringify([
            "outer: OBJ\nmiddle: OBJ\ninner: OBJ",
            "outer: OBJ\nmiddle: OBJ\ninner: undefined",
            "outer: OBJ\nmiddle: undefined\ninner: undefined",
            "outer: OBJ\nmiddle: undefined\ninner: OBJ"
        ]),
        correctAnswer: "outer: OBJ\nmiddle: OBJ\ninner: undefined",
        points: 10,
        isEnabled: true,
    });

    console.log(`Added JS Scope question as #${nextNumber}`);
    process.exit(0);
}

seed().catch((err) => {
    console.error(err);
    process.exit(1);
});
