import { db } from '../db';
import { questions } from '../db/schema';

async function listQuestionsDebug() {
  console.log('\n=== All Questions (For Navigation Testing) ===\n');

  const allQuestions = await db.select().from(questions);
  const sorted = allQuestions.sort((a, b) => a.questionNumber - b.questionNumber);

  sorted.forEach(q => {
    const isBidRound = q.questionType === 'mcq_bidding';
    const marker = isBidRound ? '🎰' : '  ';
    console.log(`${marker} Q${q.questionNumber}: ${q.title}`);
    console.log(`   Type: ${q.questionType}`);
    console.log('');
  });

  const bidRoundQuestions = sorted.filter(q => q.questionType === 'mcq_bidding');
  console.log(`\nBid Round Questions: ${bidRoundQuestions.map(q => `Q${q.questionNumber}`).join(', ')}`);

  if (bidRoundQuestions.length > 0) {
    const firstBid = bidRoundQuestions[0];
    const lastBid = bidRoundQuestions[bidRoundQuestions.length - 1];

    const questionBefore = sorted.find(q => q.questionNumber === firstBid.questionNumber - 1);
    const questionAfter = sorted.find(q => q.questionNumber === lastBid.questionNumber + 1);

    console.log('\nNavigation Flow:');
    if (questionBefore) {
      console.log(`Q${questionBefore.questionNumber} (${questionBefore.title})`);
    }
    console.log('  ↓ Enter Bid Round');
    bidRoundQuestions.forEach(q => {
      console.log(`  🎰 Q${q.questionNumber} (${q.title})`);
    });
    console.log('  ↓ Exit Bid Round');
    if (questionAfter) {
      console.log(`Q${questionAfter.questionNumber} (${questionAfter.title})`);
    }
  }

  console.log('\n');
  process.exit(0);
}

listQuestionsDebug().catch(console.error);
