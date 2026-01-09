import { db } from '../db';
import { questions } from '../db/schema/quiz';
import { eq } from 'drizzle-orm';
import 'dotenv/config';

async function addCssPlaygroundQuestion() {
  try {
    console.log('Adding CSS Playground question...');

    // Check if question 27 already exists
    const [existing] = await db.select().from(questions).where(eq(questions.questionNumber, 27));

    if (existing) {
      console.log('Question 27 already exists. Updating...');
      await db.update(questions)
        .set({
          questionType: 'css_playground',
          title: 'CSS Centering Challenge',
          description: 'Center the blue box both vertically and horizontally in the container using CSS flexbox properties.',
          providedHtml: `<div class="container">
  <div class="box">
    Center Me!
  </div>
</div>`,
          providedCss: `body {
  margin: 0;
  padding: 0;
  height: 100vh;
}

.container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Your CSS will be applied here */
}

.box {
  width: 200px;
  height: 200px;
  background: #4299e1;
  color: white;
  font-size: 24px;
  font-weight: bold;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}`,
          targetSelector: '.container',
          idealCss: `display: flex;
  justify-content: center;
  align-items: center;`,
          requiredProperties: JSON.stringify([
            'display: flex',
            'justify-content: center',
            'align-items: center'
          ]),
          correctAnswer: 'flex-center',
          points: 100,
          timeLimit: 300,
          isEnabled: true,
        })
        .where(eq(questions.questionNumber, 27));

      console.log('✅ Question 27 updated successfully!');
    } else {
      await db.insert(questions).values({
        questionNumber: 27,
        questionType: 'css_playground',
        title: 'CSS Centering Challenge',
        description: 'Center the blue box both vertically and horizontally in the container using CSS flexbox properties.',
        providedHtml: `<div class="container">
  <div class="box">
    Center Me!
  </div>
</div>`,
        providedCss: `body {
  margin: 0;
  padding: 0;
  height: 100vh;
}

.container {
  width: 100%;
  height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  /* Your CSS will be applied here */
}

.box {
  width: 200px;
  height: 200px;
  background: #4299e1;
  color: white;
  font-size: 24px;
  font-weight: bold;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0,0,0,0.3);
  display: flex;
  align-items: center;
  justify-content: center;
}`,
        targetSelector: '.container',
        idealCss: `display: flex;
  justify-content: center;
  align-items: center;`,
        requiredProperties: JSON.stringify([
          'display: flex',
          'justify-content: center',
          'align-items: center'
        ]),
        correctAnswer: 'flex-center',
        points: 100,
        timeLimit: 300,
        isEnabled: true,
      });

      console.log('✅ CSS Playground question added successfully as Question 27!');
    }

    console.log('\n📝 Question Details:');
    console.log('   Type: CSS Playground');
    console.log('   Challenge: Center a div using flexbox');
    console.log('   Required Properties:');
    console.log('     - display: flex');
    console.log('     - justify-content: center');
    console.log('     - align-items: center');
    console.log('\n🎯 To test: Navigate to Question 27 in the quiz!');

    process.exit(0);
  } catch (error) {
    console.error('Error adding CSS Playground question:', error);
    process.exit(1);
  }
}

addCssPlaygroundQuestion();
