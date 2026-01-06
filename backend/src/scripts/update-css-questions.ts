import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';

async function updateCssQuestions() {
    console.log('Updating CSS Questions 13, 14, 15 with harder content...');

    // Q13: Card Fan (Transform Origin)
    const q13Options = [
        { key: "A", text: "transform: rotate(30deg);" },
        { key: "B", text: "transform-origin: bottom center;" },
        { key: "C", text: "position: relative; top: 50%;" },
        { key: "D", text: "perspective: 1000px;" }
    ];

    await db.update(questions)
        .set({
            title: 'Fan Animation Logic',
            description: `
![Card Fan](/images/quiz/css_fan_cards_clean.png)

The cards in this image are rotated, but they form a cohesive "fan" shape because they are rotating around a specific pivot point. 

Which CSS property establishes this **bottom-center** pivot point?
      `.trim(),
            options: JSON.stringify(q13Options),
            correctAnswer: "B",
        })
        .where(eq(questions.questionNumber, 13));

    // Q14: Sidebar Layout (Flex Grow)
    const q14Options = [
        { key: "A", text: "width: 100%;" },
        { key: "B", text: "flex: 1;" },
        { key: "C", text: "display: grid;" },
        { key: "D", text: "position: absolute; right: 0;" }
    ];

    await db.update(questions)
        .set({
            title: 'Responsive Main Content',
            description: `
![Sidebar Layout](/images/quiz/css_flex_sidebar_layout.png)

In this 2-column Flexbox layout, the Dark Sidebar has a fixed width.

Which property should be applied to the **White Main Content** area to ensure it automatically expands to fill **all remaining horizontal space**?
      `.trim(),
            options: JSON.stringify(q14Options),
            correctAnswer: "B",
        })
        .where(eq(questions.questionNumber, 14));

    // Q15: Split Nav (Margin Auto)
    const q15Options = [
        { key: "A", text: "justify-content: space-between;" },
        { key: "B", text: "margin-left: auto;" },
        { key: "C", text: "float: right;" },
        { key: "D", text: "align-self: flex-end;" }
    ];

    await db.update(questions)
        .set({
            title: 'Split Navigation Alignment',
            description: `
![Split Navbar](/images/quiz/css_flex_aligned_right.png)

You have a Flexbox row with 4 items. You want the first 3 items to stay on the LEFT, but you want the **4th item (the circle)** to be pushed all the way to the **RIGHT**.

Instead of adding an empty spacer div, what is the cleanest CSS "trick" to apply **specifically to the 4th item** to achieve this?
      `.trim(),
            options: JSON.stringify(q15Options),
            // Note: 'justify-content: space-between' applies to container and spaces ALL items. 
            // 'margin-left: auto' on the child pushes it to the end in flexbox.
            correctAnswer: "B",
        })
        .where(eq(questions.questionNumber, 15));

    console.log('Updated Q13, Q14, Q15 successfully!');
    process.exit(0);
}

updateCssQuestions().catch((err) => {
    console.error('Update failed:', err);
    process.exit(1);
});
