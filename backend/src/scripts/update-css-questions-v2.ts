import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function updateCssQuestionsV2() {
  console.log('Updating CSS Questions 13, 14, 15 to ADVANCED level...');

  // Q13: Advanced Grid Areas
  const q13Options = [
    { key: "A", text: `grid-template-areas: 
  "header header"
  "sidebar main"
  "footer footer";` },
    { key: "B", text: `grid-template-areas: 
  "header sidebar"
  "main main"
  "footer footer";` },
    { key: "C", text: `display: grid;
  grid-columns: 1fr 2fr;
  grid-rows: auto 1fr auto;` },
    { key: "D", text: `grid-template-areas: 
  "header"
  "sidebar main"
  "footer";` }
  ];

  await db.update(questions)
    .set({
      title: 'CSS Grid Template Areas',
      description: `
![Grid Layout](/images/quiz/css_advanced_grid_areas.png)

Study the layout above which consists of 3 rows and 2 columns.
The **Header** and **Footer** span both columns.

Which CSS ` + "`grid-template-areas`" + ` definition exactly matches this visual structure?
      `.trim(),
      options: JSON.stringify(q13Options),
      correctAnswer: "A",
    })
    .where(eq(questions.questionNumber, 13));

  // Q14: Nth-Child Math
  const q14Options = [
    { key: "A", text: ":nth-child(3n)" },
    { key: "B", text: ":nth-child(2n + 1)" },
    { key: "C", text: ":nth-child(3n + 1)" },
    { key: "D", text: ":nth-of-type(odd)" }
  ];

  await db.update(questions)
    .set({
      title: 'Advanced Pseudo-Class Selection',
      description: `
![Nth Child Pattern](/images/quiz/css_advanced_nth_child.png)

In a list of 10 items, the items at indices **1, 4, 7, 10** are selected (filled black circles).

Which pseudo-class selector formula produces this exact sequence?
      `.trim(),
      options: JSON.stringify(q14Options),
      correctAnswer: "C",
    })
    .where(eq(questions.questionNumber, 14));

  // Q15: Stacking Context (Z-Index Trap)
  const q15Options = [
    { key: "A", text: "The Blue Card has `opacity: 0.9` which forces it behind." },
    { key: "B", text: "The Red Card has `position: fixed` which always wins over relative." },
    { key: "C", text: "Z-index is ignored because Flexbox is not used." },
    { key: "D", text: "The Blue Card is trapped in the Grey Card's lower Stacking Context." }
  ];

  await db.update(questions)
    .set({
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
    })
    .where(eq(questions.questionNumber, 15));

  console.log('Updated Q13, Q14, Q15 to Advanced versions!');
  process.exit(0);
}

updateCssQuestionsV2().catch((err) => {
  console.error('Update failed:', err);
  process.exit(1);
});
