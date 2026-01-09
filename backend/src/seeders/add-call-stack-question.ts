import { db } from '../db';
import { questions } from '../db/schema/quiz';
import 'dotenv/config';

async function addCallStackQuestion() {
    try {
        console.log('Adding Call Stack Drag question...');

        const javascriptCode = `function first() {
  console.log('A');
  second();
  console.log('B');
}

function second() {
  console.log('C');
}

first();
console.log('D');`;

        const correctOrder = ['A', 'C', 'B', 'D'];
        const shuffledOptions = ['D', 'A', 'C', 'B']; // Will be shuffled in component

        await db.insert(questions).values({
            questionNumber: 28,
            questionType: 'call_stack_drag',
            title: 'JavaScript Call Stack Execution Order',
            description: 'Drag the console outputs into the correct execution order based on how the JavaScript call stack works.',
            providedHtml: javascriptCode,
            options: JSON.stringify(shuffledOptions),
            correctAnswer: JSON.stringify(correctOrder),
            points: 100,
            timeLimit: 300,
            isEnabled: true,
        });

        console.log('✅ Call Stack Drag question added successfully as Question 28!');
        console.log('\n📝 Question Details:');
        console.log('   Type: Call Stack Drag');
        console.log('   Challenge: Arrange console outputs in execution order');
        console.log('   Correct Order:', correctOrder.join(' → '));
        console.log('\n🎯 To test: Navigate to Question 28 in the quiz!');

        process.exit(0);
    } catch (error) {
        console.error('Error adding question:', error);
        process.exit(1);
    }
}

addCallStackQuestion();
