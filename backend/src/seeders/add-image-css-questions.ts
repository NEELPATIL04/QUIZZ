import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    console.log('Seeding 3 Image-Based CSS questions...');

    // Q13: Transform Cards
    const q13Options = [
        { key: "A", text: "transform: rotate(15deg); position: absolute;" },
        { key: "B", text: "display: flex; flex-direction: column;" },
        { key: "C", text: "float: left; clear: both;" },
        { key: "D", text: "grid-template-columns: repeat(3, 1fr);" }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 115,
        questionType: 'multiple_choice',
        title: 'CSS Transform & Positioning',
        description: `
![CSS Transform Demo](/images/quiz/css_transform_cards.png)

Which CSS properties are primarily responsible for the rotated, stacked card effect shown above?
    `.trim(),
        options: JSON.stringify(q13Options),
        correctAnswer: "A",
        points: 100,
        isEnabled: true,
    });

    // Q14: Flex Center
    const q14Options = [
        { key: "A", text: "text-align: center; vertical-align: middle;" },
        { key: "B", text: "display: flex; justify-content: center; align-items: center;" },
        { key: "C", text: "float: center; position: relative;" },
        { key: "D", text: "margin: 0 auto; display: block;" }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 116,
        questionType: 'multiple_choice',
        title: 'Perfect Centering',
        description: `
![CSS Flex Center](/images/quiz/css_flex_center.png)

Which code snippet creates the layout where the blue box is perfectly centered inside the grey container?

\`\`\`css
.container {
  /* What goes here? */
}
\`\`\`
    `.trim(),
        options: JSON.stringify(q14Options),
        correctAnswer: "B",
        points: 100,
        isEnabled: true,
    });

    // Q15: Navbar Space Between
    const q15Options = [
        { key: "A", text: "justify-content: flex-start; gap: 50px;" },
        { key: "B", text: "justify-content: space-between;" },
        { key: "C", text: "align-content: stretch;" },
        { key: "D", text: "flex-direction: column-reverse;" }
    ];

    await db.insert(questions).values({
        id: uuidv4(),
        questionNumber: 117,
        questionType: 'multiple_choice',
        title: 'Navbar Layout',
        description: `
![CSS Navbar](/images/quiz/css_flex_navbar.png)

Review the navigation bar design above. Which Flexbox property aligns the Logo to the far left and the Links to the far right with empty space in between?

\`\`\`css
.navbar {
  display: flex;
  /* ??? */
  align-items: center;
}
\`\`\`
    `.trim(),
        options: JSON.stringify(q15Options),
        correctAnswer: "B",
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
