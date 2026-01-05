import { db } from '../db';
import { questions } from '../db/schema';

const htmlCssQuizData = {
  questionNumber: 2,
  questionType: 'html_css_challenge' as const,
  title: 'Bottom Right Card Challenge',
  description: 'Position the card element to the bottom-right corner of the page. You only need to write CSS for the .card selector. The HTML and base styles are already provided.',

  // Provided HTML structure
  providedHtml: '<div class="card">Bottom Right Card</div>',

  // Provided CSS (body, reset, base styles)
  providedCss: `* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
  font-family: Arial, sans-serif;
}

body {
  min-height: 100vh;
  background: #e5e7eb;
  position: relative;
}

.card {
  width: 300px;
  height: 180px;
  background: white;
  border-radius: 12px;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.15);
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: 18px;
  font-weight: bold;
}`,

  targetSelector: '.card',

  // Ideal CSS solution
  idealCss: `  position: absolute;
  bottom: 20px;
  right: 20px;`,

  // Required properties for full points
  requiredProperties: JSON.stringify(['position', 'bottom', 'right']),

  // Scoring criteria
  scoringCriteria: JSON.stringify({
    idealMethod: {
      properties: ['position: absolute', 'bottom', 'right'],
      points: 100,
      description: 'Perfect! Using position: absolute with bottom and right'
    },
    alternativeMethod: {
      properties: ['margin'],
      pointsDeduction: 20,
      description: 'Good attempt using margin, but not the ideal method'
    },
    optionalProperties: ['width', 'height', 'background', 'color', 'font-size', 'font-weight', 'border-radius', 'box-shadow']
  }),

  points: 100,
  isEnabled: false,
};

export async function seedHtmlCssQuestion() {
  try {
    console.log('Seeding HTML/CSS question...');

    const [existingQuestion] = await db
      .select()
      .from(questions)
      .where(sql`question_number = ${htmlCssQuizData.questionNumber}`);

    if (existingQuestion) {
      console.log('Question 2 already exists, skipping...');
      return;
    }

    await db.insert(questions).values(htmlCssQuizData);

    console.log('✅ HTML/CSS question seeded successfully!');
  } catch (error) {
    console.error('Error seeding HTML/CSS question:', error);
    throw error;
  }
}

// Run if executed directly
if (require.main === module) {
  import('../db')
    .then(() => seedHtmlCssQuestion())
    .then(() => {
      console.log('Seeding complete!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Seeding failed:', error);
      process.exit(1);
    });
}

import { sql } from 'drizzle-orm';
