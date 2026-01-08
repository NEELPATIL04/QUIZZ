import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('Seeding 3 Image-Based CSS questions...');

    // Q13: Advanced Grid Areas (Temp ID 201)
    const q13Options = [
        {
            key: "A", text: `grid-template-areas: 
  "header header"
  "sidebar main"
  "footer footer";` },
        {
            key: "B", text: `grid-template-areas: 
  "header sidebar"
  "main main"
  "footer footer";` },
        {
            key: "C", text: `display: grid;
  grid-columns: 1fr 2fr;
  grid-rows: auto 1fr auto;` },
        {
            key: "D", text: `grid-template-areas: 
  "header"
  "sidebar main"
  "footer";` }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 201,
        questionType: 'multiple_choice',
        title: 'CSS Grid Template Areas',
        description: `
![Grid Layout](/images/quiz/css_advanced_grid_areas.png)

Study the layout above which consists of 3 rows and 2 columns.
The **Header** and **Footer** span both columns.

Which CSS \`grid-template-areas\` definition exactly matches this visual structure?
    `.trim(),
        options: JSON.stringify(q13Options),
        correctAnswer: "A",
        points: 100,
        isEnabled: true,
    });

    // Q14: Advanced Pseudo-Class Selection (Temp ID 202)
    const q14Options = [
        { key: "A", text: ":nth-child(3n)" },
        { key: "B", text: ":nth-child(2n + 1)" },
        { key: "C", text: ":nth-child(3n + 1)" },
        { key: "D", text: ":nth-of-type(odd)" }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 202,
        questionType: 'multiple_choice',
        title: 'Advanced Pseudo-Class Selection',
        description: `
![Nth Child Pattern](/images/quiz/css_advanced_nth_child.png)

In a list of 10 items, the items at indices **1, 4, 7, 10** are selected (filled black circles).

Which pseudo-class selector formula produces this exact sequence?
    `.trim(),
        options: JSON.stringify(q14Options),
        correctAnswer: "C",
        points: 100,
        isEnabled: true,
    });

    // Q15: Flexbox Centering Master (Temp ID 203)
    const q15Options = [
        { key: "A", text: "display: flex; justify-content: center; align-items: center;" },
        { key: "B", text: "display: flex; align-content: center; justify-self: center;" },
        { key: "C", text: "display: block; margin: auto; text-align: center;" },
        { key: "D", text: "display: grid; grid-template-columns: center;" }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 203,
        questionType: 'mcq_bidding',
        title: 'Flexbox Centering Master',
        description: `
![Centering](/images/quiz/flexbox_centered.png)

Which CSS properties are required on the **PARENT** container to perfectly center the blue child element both horizontally and vertically?
    `.trim(),
        options: JSON.stringify(q15Options),
        correctAnswer: "A",
        points: 100,
        isEnabled: true,
    });

    console.log('Seeded Q13, Q14, Q15 successfully!');
    process.exit(0);
}

seed().catch((err) => {
    console.error('Seeding failed:', err);
    process.exit(1);
});
