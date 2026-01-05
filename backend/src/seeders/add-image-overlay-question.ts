
import { db } from '../db';
import { questions } from '../db/schema';
import { eq } from 'drizzle-orm';

// SVG Data URIs for the images
const redCardSvg = `data:image/svg+xml;base64,${Buffer.from(`<svg width="100" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="150" fill="#ff4444" rx="10" /><text x="50" y="75" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">1</text></svg>`).toString('base64')}`;
const greenCardSvg = `data:image/svg+xml;base64,${Buffer.from(`<svg width="100" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="150" fill="#44ff44" rx="10" /><text x="50" y="75" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">2</text></svg>`).toString('base64')}`;
const blueCardSvg = `data:image/svg+xml;base64,${Buffer.from(`<svg width="100" height="150" xmlns="http://www.w3.org/2000/svg"><rect width="100" height="150" fill="#4444ff" rx="10" /><text x="50" y="75" font-family="Arial" font-size="40" fill="white" text-anchor="middle" dy=".3em">3</text></svg>`).toString('base64')}`;

const imageOverlayQuestion = {
  questionNumber: 6,
  questionType: 'html_css_challenge' as const,
  title: 'CSS Card Stacking Challenge',
  description: `Position the three cards so they overlap each other diagonally, like a hand of playing cards.
  
You must write CSS for the following classes:
- \`.card-container\`: Set the positioning context.
- \`.card-1\` (Red Card): Position at bottom-left.
- \`.card-2\` (Green Card): Position at middle-center.
- \`.card-3\` (Blue Card): Position at top-right.

**Use \`position: absolute\` for the cards.**`,
  providedHtml: `
<div class="card-container">
  <img src="${redCardSvg}" class="card card-1" alt="Red Card">
  <img src="${greenCardSvg}" class="card card-2" alt="Green Card">
  <img src="${blueCardSvg}" class="card card-3" alt="Blue Card">
</div>
  `,
  providedCss: `
.card-container {
  width: 300px;
  height: 300px;
  background-color: #333;
  border-radius: 10px;
  /* Missing property: position */
  margin: 20px auto;
  box-shadow: 0 10px 30px rgba(0,0,0,0.5);
}

.card {
  width: 100px;
  height: 150px;
  border: 2px solid white;
  border-radius: 10px;
  box-shadow: 0 4px 6px rgba(0,0,0,0.3);
}
  `,
  targetSelector: '', // Allow global CSS editing
  idealCss: `
.card-container {
  position: relative;
}

.card-1 {
  position: absolute;
  top: 40px;
  left: 40px;
  z-index: 1;
}

.card-2 {
  position: absolute;
  top: 70px;
  left: 80px;
  z-index: 2;
}

.card-3 {
  position: absolute;
  top: 100px;
  left: 120px;
  z-index: 3;
}
  `,
  requiredProperties: JSON.stringify(['position', 'top', 'left', 'z-index']),
  scoringCriteria: JSON.stringify({
    idealMethod: { properties: ['position', 'top', 'left', 'z-index'], points: 100 },
    alternativeMethod: { properties: ['margin'], pointsDeduction: 50 },
    optionalProperties: ['transform']
  }),
  points: 100,
  isEnabled: true,
};

export async function seedImageOverlay() {
  console.log('🌱 Seeding Image Overlay Challenge (Q6)...');

  // 1. Shift existing questions Q6 and above down by 1
  // We need to do this carefully to avoid unique constraint violations.
  // Best way: get all Q >= 6, sort descending, update one by one.

  const existingQuestions = await db.select().from(questions);
  const qToShift = existingQuestions.filter(q => q.questionNumber >= 6).sort((a, b) => b.questionNumber - a.questionNumber);

  // NOTE: If we already ran this once, Q6 is overlay.
  // We should check if Q6 is ALREADY overlay. If so, just update it.
  const checkQ6 = existingQuestions.find(q => q.questionNumber === 6);
  if (checkQ6 && checkQ6.title === imageOverlayQuestion.title) {
    console.log('Image Overlay is already at Q6. Updating fields...');
    await db.update(questions).set(imageOverlayQuestion).where(eq(questions.id, checkQ6.id));
    console.log('✅ Updated Q6');
    return;
  }

  // If not overlay, then we assume we need to shift (or maybe it was shifted but Q6 is missing?)
  // If we ran the previous seeder, Q6 IS overlay. So the block above handles updates.
  // If this is fresh run, we shift.

  for (const q of qToShift) {
    console.log(`Moving Q${q.questionNumber} ("${q.title}") to Q${q.questionNumber + 1}...`);
    await db.update(questions)
      .set({ questionNumber: q.questionNumber + 1 })
      .where(eq(questions.id, q.id));
  }

  // 2. Insert new Q6
  await db.insert(questions).values(imageOverlayQuestion);
  console.log('✅ Created Image Overlay Question at Q6');

  console.log('✨ Image Overlay seeding complete!\n');
}

if (require.main === module) {
  seedImageOverlay()
    .then(() => {
      console.log('Done!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error:', error);
      process.exit(1);
    });
}
