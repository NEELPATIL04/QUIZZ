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

    // Q15: The Stacking Context Trap (Temp ID 203)
    const q15Options = [
        { key: "A", text: "The Blue Card has `opacity: 0.9` which forces it behind." },
        { key: "B", text: "The Red Card has `position: fixed` which always wins over relative." },
        { key: "C", text: "Z-index is ignored because Flexbox is not used." },
        { key: "D", text: "The Blue Card is trapped in the Grey Card's lower Stacking Context." }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 203,
        questionType: 'multiple_choice',
        title: 'The Stacking Context Trap',
        description: `
![Stacking Context](/images/quiz/css_advanced_stacking_context.png)

**Scenario:**
1. **Grey Card** (Parent of Blue) has \`z-index: 1\`.
2. **Red Card** (Sibling of Grey) has \`z-index: 2\`.
3. **Blue Card** (Child of Grey) has \`z-index: 999\`.

Despite having the highest z-index (999), the **Blue Card** still appears **BEHIND** the **Red Card**. Why?
    `.trim(),
        options: JSON.stringify(q15Options),
        correctAnswer: "D",
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
